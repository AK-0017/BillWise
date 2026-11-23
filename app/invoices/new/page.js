'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Plus, Trash2, Loader2, ArrowLeft, Send } from 'lucide-react';

export default function NewInvoicePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    dueDate: '', notes: '',
    items: [{ description: '', quantity: 1, price: '' }],
    tax: 0,
  });
  const [saving, setSaving] = useState(false);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: 1, price: '' }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => setForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], [field]: val };
    return { ...f, items };
  });

  const subtotal = form.items.reduce((s, it) => s + (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 0), 0);
  const taxAmt = (subtotal * (parseFloat(form.tax) || 0)) / 100;
  const total = subtotal + taxAmt;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName || !form.dueDate || form.items.some(it => !it.description || !it.price)) {
      return alert('Please fill all required fields');
    }
    setSaving(true);
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.user.id,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        items: form.items.map(it => ({ ...it, quantity: parseInt(it.quantity), price: parseFloat(it.price) })),
        subtotal, tax: parseFloat(form.tax) || 0, total,
        dueDate: form.dueDate, notes: form.notes, status: 'pending',
      }),
    });
    const inv = await res.json();
    setSaving(false);
    if (res.ok && inv._id) {
      router.push(`/invoices/${inv._id}`);
    } else {
      alert(inv.error || 'Failed to create invoice. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-container">
          <div className="page-header">
            <div>
              <button className="btn-secondary" style={{ marginBottom: '0.5rem' }} onClick={() => router.push('/invoices')}>
                <ArrowLeft size={14} /> Back to Invoices
              </button>
              <h1 className="page-title">New Invoice</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Customer Details */}
              <div className="card">
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--accent)' }}>Customer Details</h2>
                <div className="form-group">
                  <label className="label">Customer Name *</label>
                  <input className="input" placeholder="Rahul Sharma" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="label">Email Address</label>
                  <input className="input" type="email" placeholder="rahul@email.com" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="label">Phone Number</label>
                  <input className="input" placeholder="+91 9876543210" value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="label">Due Date *</label>
                  <input className="input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="label">Notes / Payment Terms</label>
                  <textarea className="input" rows={3} placeholder="Payment terms, bank details, etc." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
              </div>

              {/* Items & Totals */}
              <div>
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent)' }}>Line Items</h2>
                    <button type="button" className="btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }} onClick={addItem}>
                      <Plus size={14} /> Add Item
                    </button>
                  </div>

                  {form.items.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px 36px', gap: '0.5rem', alignItems: 'end', marginBottom: '0.75rem' }}>
                      <div>
                        {i === 0 && <label className="label">Description</label>}
                        <input className="input" placeholder="Service / Product" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                      </div>
                      <div>
                        {i === 0 && <label className="label">Qty</label>}
                        <input className="input" type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                      </div>
                      <div>
                        {i === 0 && <label className="label">Price (₹)</label>}
                        <input className="input" type="number" placeholder="0" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} />
                      </div>
                      <div style={{ paddingBottom: '2px' }}>
                        {form.items.length > 1 && (
                          <button type="button" className="btn-danger" style={{ padding: '0.5rem', minWidth: 'auto' }} onClick={() => removeItem(i)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                    <span style={{ fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      <span>Tax (%)</span>
                      <input className="input" type="number" value={form.tax} min="0" max="100" style={{ width: 70 }} onChange={e => setForm({ ...form, tax: e.target.value })} />
                    </div>
                    <span style={{ fontWeight: 600 }}>₹{taxAmt.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>Total</span>
                    <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent)' }}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }} disabled={saving}>
                  {saving ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
                  {saving ? 'Creating Invoice...' : 'Create Invoice'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
