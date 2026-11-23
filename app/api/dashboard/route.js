import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongoose';
import Transaction from '@/models/Transaction';
import Expense from '@/models/Expense';
import Invoice from '@/models/Invoice';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const [transactions, expenses, invoices] = await Promise.all([
      Transaction.find({ userId }).sort({ date: -1 }).limit(10),
      Expense.find({ userId }),
      Invoice.find({ userId }),
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
    const pendingDues = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total, 0);
    const totalTransactions = transactions.length;

    // Monthly cash flow for chart (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      const monthIncome = invoices
        .filter(inv => inv.status === 'paid' && inv.paidAt >= startOfMonth && inv.paidAt <= endOfMonth)
        .reduce((sum, inv) => sum + inv.total, 0);

      const monthExpense = expenses
        .filter(exp => new Date(exp.date) >= startOfMonth && new Date(exp.date) <= endOfMonth)
        .reduce((sum, exp) => sum + exp.amount, 0);

      monthlyData.push({ month: `${month} ${year}`, income: monthIncome, expenses: monthExpense });
    }

    return NextResponse.json({
      totalRevenue,
      totalExpenses,
      pendingDues,
      totalTransactions,
      recentTransactions: transactions,
      monthlyData,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
