'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { FileText, Loader2, ScanLine, Plus } from 'lucide-react';
import Link from 'next/link';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const CATS = ['All', 'Food', 'Transport', 'Utilities', 'Supplies', 'Rent', 'Salary', 'Marketing', 'Other'];

const catStyle = {
  Food:      { bg: '#f0fdf4', color: '#16a34a', border: 'rgba(22,163,74,0.2)' },
  Transport: { bg: '#eff6ff', color: '#2563eb', border: 'rgba(37,99,235,0.2)' },
  Utilities: { bg: '#fefce8', color: '#ca8a04', border: 'rgba(202,138,4,0.2)' },
  Supplies:  { bg: '#fdf4ff', color: '#9333ea', border: 'rgba(147,51,234,0.2)' },
  Rent:      { bg: '#fef2f2', color: '#dc2626', border: 'rgba(220,38,38,0.2)' },
  Salary:    { bg: '#ecfeff', color: '#0891b2', border: 'rgba(8,145,178,0.2)' },
  Marketing: { bg: '#fff7ed', color: '#ea580c', border: 'rgba(234,88,12,0.2)' },
  Other:     { bg: '#f8fafc', color: '#64748b', border: 'rgba(100,116,139,0.2)' },
};

export default function ExpensesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status]);
  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/expenses?userId=${session.user.id}`)
        .then(r => r.json()).then(d => { setExpenses(d); setLoading(false); });
    }
  }, [session]);

  const filtered = filter === 'All' ? expenses : expenses.filter(e => e.category === filter);
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  if (loading) return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} className="spin" style={{ color: 'var(--accent)' }} />
      </main>
    </div>
  );

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Expenses</h1>
              <p className="page-subtitle">
                {filtered.length} {filter !== 'All' ? filter.toLowerCase() : ''} expense{filtered.length !== 1 ? 's' : ''} &nbsp;·&nbsp; Total: <strong style={{ color: 'var(--danger)' }}>{fmt(total)}</strong>
              </p>
            </div>
            <Link href="/receipts" className="btn-primary" style={{ textDecoration: 'none' }}>
              <Plus size={14} /> Add Expense
            </Link>
          </div>

          {/* Category filter chips */}
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{
                padding: '0.35rem 0.875rem', borderRadius: 99, fontSize: '0.78rem',
                fontWeight: filter === c ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s',
                background: filter === c ? 'var(--accent)' : 'var(--bg-card)',
                color: filter === c ? 'white' : 'var(--text-muted)',
                border: filter === c ? '1px solid var(--accent)' : '1px solid var(--border)',
                boxShadow: filter === c ? '0 2px 8px rgba(37,99,235,0.25)' : 'var(--shadow-sm)',
              }}>
                {c}
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {filtered.length > 0 ? (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: '1.25rem' }}>Vendor</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Source</th>
                      <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(e => {
                      const cs = catStyle[e.category] || catStyle.Other;
                      return (
                        <tr key={e._id}>
                          <td style={{ paddingLeft: '1.25rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{e.vendor}</div>
                            {e.description && <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '0.1rem' }}>{e.description}</div>}
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                              padding: '0.2rem 0.6rem', borderRadius: 99,
                              fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                              background: cs.bg, color: cs.color, border: `1px solid ${cs.border}`,
                            }}>
                              {e.category}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem', whiteSpace: 'nowrap' }}>{fmtDate(e.date)}</td>
                          <td>
                            {e.scannedByAI
                              ? <span className="badge badge-info"><ScanLine size={9} /> AI Scanned</span>
                              : <span className="badge badge-neutral">Manual</span>}
                          </td>
                          <td style={{ textAlign: 'right', paddingRight: '1.25rem', fontWeight: 700, color: 'var(--danger)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                            −{fmt(e.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <FileText size={36} style={{ opacity: 0.15, marginBottom: '0.875rem' }} />
                <p style={{ fontWeight: 700, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>No expenses found</p>
                <p style={{ fontSize: '0.825rem', marginBottom: '1.25rem' }}>
                  {filter !== 'All' ? `No ${filter} expenses yet.` : 'Scan a receipt or add expenses manually.'}
                </p>
                <Link href="/receipts" className="btn-primary" style={{ textDecoration: 'none' }}>
                  <ScanLine size={14} /> Scan a Receipt
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
