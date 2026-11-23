'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Plus, Loader2, CreditCard, Eye } from 'lucide-react';
import Link from 'next/link';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const statusBadge = {
  paid:    <span className="badge badge-success">✓ Paid</span>,
  pending: <span className="badge badge-warning">⏳ Pending</span>,
  overdue: <span className="badge badge-danger">⚠ Overdue</span>,
};

export default function InvoicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/invoices?userId=${session.user.id}`)
        .then(r => r.json())
        .then(d => { setInvoices(Array.isArray(d) ? d : []); setLoading(false); });
    }
  }, [session]);

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

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
            <h1 className="page-title">Invoices</h1>
            <p className="page-subtitle">{filtered.length} invoices</p>
          </div>
          <Link href="/invoices/new" className="btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={16} /> New Invoice
          </Link>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {['all', 'pending', 'paid', 'overdue'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '0.375rem 1rem', borderRadius: 9999, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                background: filter === f ? 'var(--accent)' : 'var(--bg-card)',
                color: filter === f ? 'white' : 'var(--text-muted)',
                border: filter === f ? '1px solid var(--accent)' : '1px solid var(--border)', textTransform: 'capitalize'
              }}>{f}</button>
          ))}
        </div>

        <div className="card">
          {filtered.length > 0 ? (
            <div className="table-wrapper">
              <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: 700, color: 'var(--accent-light)' }}>{inv.invoiceNumber}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.customerName}</td>
                    <td>{fmtDate(inv.dueDate)}</td>
                    <td>{statusBadge[inv.status]}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(inv.total)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <Link href={`/invoices/${inv._id}`} className="btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', textDecoration: 'none' }}>
                          <Eye size={12} /> View
                        </Link>
                        {inv.status !== 'paid' && (
                          <Link href={`/pay/${inv._id}`} className="btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', textDecoration: 'none' }}>
                            Pay Now
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><CreditCard size={40} /></div>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No invoices yet</p>
              <p style={{ fontSize: '0.875rem' }}>Create your first invoice to get paid faster.</p>
              <Link href="/invoices/new" className="btn-primary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
                <Plus size={16} /> Create Invoice
              </Link>
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
