/**
 * Captures the screenshots used in README.md.
 *
 * Usage (with the dev server running and MongoDB connected):
 *   npm i -D playwright tsx
 *   npx playwright install chromium
 *   npm run dev            # in one terminal
 *   npm run screenshots    # in another
 *
 * It creates a demo account with sample invoices and expenses (only the
 * first time), then saves PNGs into docs/screenshots/.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT = path.join(process.cwd(), 'docs', 'screenshots');
const DEMO = {
  name: 'Aarav Mehta',
  email: 'demo@billwise.app',
  password: 'Demo@12345',
  businessName: 'Mehta Stationers',
};

const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const api = context.request;

  const shot = async (route: string, name: string, settleMs = 800) => {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(settleMs); // let charts/animations finish
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log(`saved ${name}.png`);
  };

  // 1. Public pages
  await shot('/login', 'login');
  await shot('/register', 'register');

  // 2. Demo account (ignored if it already exists) and sign in through the UI
  await api.post(`${BASE}/api/register`, { data: DEMO });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', DEMO.email);
  await page.fill('input[type="password"]', DEMO.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 30_000 });

  const session = await (await api.get(`${BASE}/api/auth/session`)).json();
  const userId: string = session?.user?.id;
  if (!userId) throw new Error('Could not sign in as the demo user');

  // 3. Seed sample data once
  const existing = await (await api.get(`${BASE}/api/invoices`)).json();
  if (Array.isArray(existing) && existing.length === 0) {
    const mk = (customerName: string, items: { description: string; quantity: number; price: number }[], due: number, status = 'pending') => {
      const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
      const tax = Math.round(subtotal * 0.18);
      return {
        userId, customerName, items, subtotal, tax, total: subtotal + tax, status,
        customerEmail: `${customerName.split(' ')[0].toLowerCase()}@example.com`,
        customerPhone: '9876543210', dueDate: daysFromNow(due), notes: 'Thank you for your business!',
      };
    };
    const invoices = [
      mk('Rohan Shah', [{ description: 'A4 paper reams', quantity: 20, price: 280 }, { description: 'Ball pens (box)', quantity: 10, price: 120 }], 7),
      mk('Priya Nair', [{ description: 'Office chairs', quantity: 4, price: 3200 }], 14),
      mk('Kabir Traders', [{ description: 'Printer cartridges', quantity: 6, price: 950 }], -5, 'overdue'),
      mk('Sneha Patil', [{ description: 'Notebooks', quantity: 50, price: 45 }, { description: 'Markers', quantity: 24, price: 30 }], 3),
    ];
    const created: { _id: string }[] = [];
    for (const inv of invoices) {
      created.push(await (await api.post(`${BASE}/api/invoices`, { data: inv })).json());
    }
    // Mark two as paid through the public payment endpoint (also creates income transactions)
    for (const inv of [created[0], created[3]]) await api.post(`${BASE}/api/pay/${inv._id}`);

    const expenses = [
      ['Reliance Mart', 2450, 'Supplies', -2], ['Mumbai Electricity', 3180, 'Utilities', -6],
      ['Shop Rent', 18000, 'Rent', -10], ['Ola Cabs', 640, 'Transport', -4],
      ['Google Ads', 4200, 'Marketing', -8], ['Canteen', 960, 'Food', -1],
    ] as const;
    for (const [vendor, amount, category, d] of expenses) {
      await api.post(`${BASE}/api/expenses`, {
        data: { userId, vendor, amount, category, date: daysFromNow(d), description: `${vendor} payment` },
      });
    }
  }

  // 4. Signed-in pages
  await shot('/dashboard', 'dashboard', 1500);
  await shot('/invoices', 'invoices');
  await shot('/invoices/new', 'invoice-new');
  await shot('/expenses', 'expenses');
  await shot('/receipts', 'receipt-scanner');
  await shot('/transactions', 'transactions');

  const list = await (await api.get(`${BASE}/api/invoices`)).json();
  const first = list?.[0];
  if (first?._id) {
    await shot(`/invoices/${first._id}`, 'invoice-detail');
    await shot(`/pay/${first._id}`, 'payment-page');
  }

  await browser.close();
  console.log(`\nDone. Screenshots are in ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
