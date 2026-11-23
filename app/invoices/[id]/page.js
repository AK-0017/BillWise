'use client';
import { use } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Loader2, ExternalLink, Building2, User, Phone, Mail, Calendar } from 'lucide-react';
import Link from 'next/link';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

const statusBadge = {
  paid:    <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.375rem 0.875rem' }}>✓ Paid</span>,
  pending: <span className="badge badge-warning" style={{ fontSize: '0.8rem', padding: '0.375rem 0.875rem' }}>⏳ Pending</span>,
  overdue: <span className="badge badge-danger"  style={{ fontSize: '0.8rem', padding: '0.375rem 0.875rem' }}>⚠ Overdue</span>,
};

export default function InvoiceDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id && params.id !== 'undefined') {
      fetch(`/api/invoices/${params.id}`)
        .then(r => r.json())
        .then(d => { setInvoice(d); setLoading(false); });
    }
  }, [params?.id]);

  if (loading) return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--accent)' }} />
      </main>
    </div>
  );

  if (!invoice || invoice.error) return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content"><p>Invoice not found.</p></main>
    </div>
  );

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-container">
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => router.push('/invoices')}><ArrowLeft size={14} /></button>
              <div>
                <h1 className="page-title">{invoice.invoiceNumber}</h1>
                <p className="page-subtitle">Created {fmtDate(invoice.createdAt)}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {statusBadge[invoice.status]}
              {invoice.status !== 'paid' && (
                <Link href={`/pay/${invoice._id}`} className="btn-primary" style={{ textDecoration: 'none' }}>
                  <ExternalLink size={16} /> Send Payment Link
                </Link>
              )}
            </div>
          </div>

          <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '1.5rem' }}>
            {/* Invoice Details */}
            <div>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Building2 size={16} color="var(--accent)" />
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>BillWise</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AI Finance Manager for SMEs</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>{invoice.invoiceNumber}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Due: {fmtDate(invoice.dueDate)}</div>
                  </div>
                </div>

                {/* Customer */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.625rem' }}>Bill To</p>
                  <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.375rem' }}>{invoice.customerName}</p>
                  {invoice.customerEmail && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Mail size={12} />{invoice.customerEmail}</p>}
                  {invoice.customerPhone && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}><Phone size={12} />{invoice.customerPhone}</p>}
                </div>

                {/* Items table in wrapper */}
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Unit Price</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((it, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{it.description}</td>
                          <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                          <td style={{ textAlign: 'right' }}>{fmt(it.price)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(it.quantity * it.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '3rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <span>Subtotal</span><span style={{ color: 'var(--text-primary)' }}>{fmt(invoice.subtotal)}</span>
                  </div>
                  {invoice.tax > 0 && (
                    <div style={{ display: 'flex', gap: '3rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      <span>Tax ({invoice.tax}%)</span><span style={{ color: 'var(--text-primary)' }}>{fmt(invoice.total - invoice.subtotal)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '3rem', fontWeight: 800, fontSize: '1.125rem' }}>
                    <span>Total</span><span style={{ color: 'var(--accent)' }}>{fmt(invoice.total)}</span>
                  </div>
                </div>

                {invoice.notes && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Notes:</strong> {invoice.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Panel */}
            <div>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.875rem' }}>Invoice Status</h3>
                <div style={{ marginBottom: '1rem' }}>{statusBadge[invoice.status]}</div>
                {invoice.paidAt && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paid on {fmtDate(invoice.paidAt)}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  {invoice.status !== 'paid' && (
                    <Link href={`/pay/${invoice._id}`} className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                      Pay Now →
                    </Link>
                  )}
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.875rem' }}>Summary</h3>
                {[
                  { label: 'Invoice No', value: invoice.invoiceNumber },
                  { label: 'Customer', value: invoice.customerName },
                  { label: 'Due Date', value: fmtDate(invoice.dueDate) },
                  { label: 'Amount Due', value: fmt(invoice.total), highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--accent)' : 'var(--text-primary)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
