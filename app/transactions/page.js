'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ArrowUpRight, ArrowDownRight, Loader2, Search } from 'lucide-react';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/transactions?userId=${session.user.id}`)
        .then(r => r.json())
        .then(d => { setTransactions(Array.isArray(d) ? d : []); setLoading(false); });
    }
  }, [session]);

  const filtered = transactions
    .filter(t => filter === 'all' || t.type === filter)
    .filter(t => t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));

  const totalIn  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  if (loading) return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--accent)' }} />
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
            <h1 className="page-title">Transactions</h1>
            <p className="page-subtitle">Complete income & expense ledger</p>
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Income', value: fmt(totalIn), color: 'var(--success)', icon: ArrowUpRight },
            { label: 'Total Expenses', value: fmt(totalOut), color: 'var(--danger)', icon: ArrowDownRight },
            { label: 'Net Balance', value: fmt(totalIn - totalOut), color: totalIn - totalOut >= 0 ? 'var(--success)' : 'var(--danger)', icon: totalIn - totalOut >= 0 ? ArrowUpRight : ArrowDownRight },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <Icon size={16} color={color} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" placeholder="Search transactions..." style={{ paddingLeft: '2.25rem' }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {['all', 'income', 'expense'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '0.5rem 1rem', borderRadius: 9999, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                background: filter === f ? 'var(--accent)' : 'var(--bg-card)',
                color: filter === f ? 'white' : 'var(--text-muted)',
                border: filter === f ? '1px solid var(--accent)' : '1px solid var(--border)'
              }}>{f}</button>
          ))}
        </div>

        <div className="card">
          {filtered.length > 0 ? (
            <div className="table-wrapper">
              <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx._id}>
                    <td>
                      {tx.type === 'income'
                        ? <span className="badge badge-success"><ArrowUpRight size={10} />Income</span>
                        : <span className="badge badge-danger"><ArrowDownRight size={10} />Expense</span>}
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{tx.description}</td>
                    <td><span className="badge badge-info">{tx.category}</span></td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.reference || '—'}</td>
                    <td>{fmtDate(tx.date)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.4 }}>💸</div>
              <p style={{ fontWeight: 600 }}>No transactions found</p>
              <p style={{ fontSize: '0.875rem' }}>Transactions are created automatically when you add expenses or receive payments.</p>
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
