'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, Clock, ArrowLeftRight,
  ArrowUpRight, ArrowDownRight, Loader2, Plus, BarChart2
} from 'lucide-react';
import Link from 'next/link';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'white', border: '1px solid #e2e8f0', borderRadius: 10,
        padding: '0.75rem 1rem', fontSize: '0.8rem',
        boxShadow: '0 8px 24px rgba(15,23,42,0.12)'
      }}>
        <p style={{ color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color, fontWeight: 600, marginTop: '0.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
            <span>{p.name}</span>
            <span>₹{Number(p.value).toLocaleString('en-IN')}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status]);
  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/dashboard?userId=${session.user.id}`)
        .then(r => r.json()).then(d => { setData(d); setLoading(false); });
    }
  }, [session]);

  if (status === 'loading' || loading) return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={28} className="spin" style={{ color: 'var(--accent)', marginBottom: '0.75rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading your dashboard...</p>
        </div>
      </main>
    </div>
  );

  const stats = [
    {
      label: 'Total Revenue', value: fmt(data?.totalRevenue),
      sub: 'Paid invoices', icon: TrendingUp,
      color: 'var(--success)', bg: 'var(--success-bg)', cls: 'green',
      trend: '+12%',
    },
    {
      label: 'Total Expenses', value: fmt(data?.totalExpenses),
      sub: 'Recorded expenses', icon: TrendingDown,
      color: 'var(--danger)', bg: 'var(--danger-bg)', cls: 'red',
      trend: null,
    },
    {
      label: 'Pending Dues', value: fmt(data?.pendingDues),
      sub: 'Awaiting payment', icon: Clock,
      color: 'var(--warning)', bg: 'var(--warning-bg)', cls: 'yellow',
      trend: null,
    },
    {
      label: 'Transactions', value: data?.totalTransactions ?? 0,
      sub: 'Total entries', icon: ArrowLeftRight,
      color: 'var(--accent)', bg: 'var(--accent-subtle)', cls: 'blue',
      trend: null,
    },
  ];

  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-container">

        {/* ── Page Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back, {session?.user?.name?.split(' ')[0]} 👋 — here's your business snapshot</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '0.5rem 0.875rem',
              fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 500,
              boxShadow: 'var(--shadow-sm)',
            }}>
              📅 {todayStr}
            </div>
            <Link href="/invoices/new" className="btn-primary" style={{ textDecoration: 'none' }}>
              <Plus size={14} /> New Invoice
            </Link>
          </div>
        </div>

        {/* ── Stat Cards — ALWAYS 4 columns ── */}
        <div className="stats-grid">
          {stats.map(({ label, value, sub, icon: Icon, color, bg, cls }) => (
            <div key={label} className={`stat-card ${cls}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={color} strokeWidth={2} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.625rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '0.35rem' }}>
                  {value}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>{label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts + Recent ── */}
        <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(320px, 4fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>

          {/* Cash Flow Chart */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <BarChart2 size={16} color="var(--accent)" />
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Cash Flow</h2>
                </div>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Income vs Expenses — last 6 months</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success)' }}>
                  <span style={{ width: 10, height: 3, background: 'var(--success)', borderRadius: 99, display: 'inline-block' }} />Income
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--danger)' }}>
                  <span style={{ width: 10, height: 3, background: 'var(--danger)', borderRadius: 99, display: 'inline-block' }} />Expenses
                </span>
              </div>
            </div>
            {data?.monthlyData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2} fill="url(#incomeGrad)" dot={{ r: 3.5, fill: '#16a34a', strokeWidth: 0 }} activeDot={{ r: 5 }} name="Income" />
                  <Area type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={2} fill="url(#expenseGrad)" dot={{ r: 3.5, fill: '#dc2626', strokeWidth: 0 }} activeDot={{ r: 5 }} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={36} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>No chart data yet</p>
                <p style={{ fontSize: '0.8rem' }}>Add expenses or create invoices to see your cash flow.</p>
              </div>
            )}
          </div>

          {/* Quick Actions + Net Balance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Net Balance card */}
            <div style={{
              background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              color: 'white',
              boxShadow: '0 8px 24px rgba(11,31,74,0.25)',
            }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Net Balance</p>
              <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                {fmt((data?.totalRevenue || 0) - (data?.totalExpenses || 0))}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>Revenue minus expenses</p>
              <div style={{ marginTop: '1.25rem', height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[{ label: 'Revenue', v: fmt(data?.totalRevenue), col: '#4ade80' }, { label: 'Expenses', v: fmt(data?.totalExpenses), col: '#f87171' }].map(({ label, v, col }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{label}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: col }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="card">
              <h3 style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: 'Scan a Receipt', href: '/receipts', icon: '📷', desc: 'AI extracts data' },
                  { label: 'Create Invoice', href: '/invoices/new', icon: '🧾', desc: 'Get paid faster' },
                  { label: 'View Transactions', href: '/transactions', icon: '💸', desc: 'Full ledger' },
                ].map(({ label, href, icon, desc }) => (
                  <Link key={href} href={href} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0.75rem', borderRadius: 9,
                    background: 'var(--bg-primary)', border: '1px solid var(--border)',
                    textDecoration: 'none', transition: 'all 0.15s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.background = 'var(--accent-subtle)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-primary)'; }}>
                    <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Transactions ── */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Recent Transactions</h2>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Latest 10 entries across income and expenses</p>
            </div>
            <Link href="/transactions" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              View all →
            </Link>
          </div>

          {data?.recentTransactions?.length > 0 ? (
            <div className="table-wrapper">
              <table className="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map(tx => (
                  <tr key={tx._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: tx.type === 'income' ? 'var(--success-bg)' : 'var(--danger-bg)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          {tx.type === 'income'
                            ? <ArrowUpRight size={13} color="var(--success)" />
                            : <ArrowDownRight size={13} color="var(--danger)" />}
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{tx.description}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-info">{tx.category}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>{fmtDate(tx.date)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.9rem', color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                      {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <ArrowLeftRight size={32} style={{ opacity: 0.15, marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 600, marginBottom: '0.375rem' }}>No transactions yet</p>
              <p style={{ fontSize: '0.825rem' }}>Scan a receipt or create an invoice to get started.</p>
            </div>
          )}
        </div>

        </div>
      </main>
    </div>
  );
}
