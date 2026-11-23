'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
  ScanLine, CheckCircle2, Loader2, Save, X, Sparkles,
  RefreshCw, Eye, EyeOff, AlertCircle, Building2, Calendar, IndianRupee, Tag, AlignLeft, Upload
} from 'lucide-react';

const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Supplies', 'Rent', 'Salary', 'Marketing', 'Other'];

async function preprocessImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.max(1, 1800 / Math.max(img.width, img.height));
      canvas.width  = img.width  * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        const contrasted = Math.min(255, Math.max(0, ((gray - 128) * 1.6) + 128));
        data[i] = data[i+1] = data[i+2] = contrasted;
      }
      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        resolve(blob);
      }, 'image/png');
    };
    img.src = url;
  });
}

function parseOCRText(rawText) {
  const text = rawText;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const lower = text.toLowerCase();

  const amountPatterns = [
    /(?:grand\s*total|total\s*amount|net\s*(?:payable|amount|total)|amount\s*(?:due|paid|payable))[^\n]*?(?:rs\.?|\$|₹|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:total|tot\.|tot)[^\n]*?(?:rs\.?|\$|₹|inr)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:\btotal\b)[^\n]{0,25}?([\d,]+\.\d{2})\s*$/im,
    /(?:rs\.?|\$|₹|inr)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:subtotal|sub\s*total)[^\n]*?([\d,]+(?:\.\d{1,2})?)/i,
  ];

  let amount = '';
  let amountConfidence = 'low';
  for (let i = 0; i < amountPatterns.length; i++) {
    const m = text.match(amountPatterns[i]);
    if (m) {
      const candidate = parseFloat(m[1].replace(/,/g, ''));
      if (candidate > 0) {
        amount = candidate;
        amountConfidence = i === 0 ? 'high' : i <= 2 ? 'medium' : 'low';
        break;
      }
    }
  }

  if (!amount) {
    const decimalNumbers = [...text.matchAll(/([\d,]+\.\d{2})/g)]
      .map(m => parseFloat(m[1].replace(/,/g, '')))
      .filter(n => n > 0 && n < 10_000_000);
    if (decimalNumbers.length) {
      amount = Math.max(...decimalNumbers);
      amountConfidence = 'low';
    }
  }

  const datePatterns = [
    { re: /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/, fn: (m) => {
        const [, a, b, y] = m;
        if (parseInt(a) > 12) return `${y}-${b.padStart(2,'0')}-${a.padStart(2,'0')}`;
        return `${y}-${a.padStart(2,'0')}-${b.padStart(2,'0')}`;
      }},
    { re: /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/, fn: (m) => `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}` },
    { re: /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{4})/i,
      fn: (m) => {
        const mo = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
        return `${m[3]}-${mo[m[2].toLowerCase().slice(0,3)]}-${m[1].padStart(2,'0')}`;
      }},
    { re: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})[,\s]+(\d{4})/i,
      fn: (m) => {
        const mo = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
        return `${m[3]}-${mo[m[1].toLowerCase().slice(0,3)]}-${m[2].padStart(2,'0')}`;
      }},
    { re: /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})/, fn: (m) => `20${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}` },
  ];

  let date = new Date().toISOString().split('T')[0];
  let dateConfidence = 'low';
  for (const { re, fn } of datePatterns) {
    const m = text.match(re);
    if (m) {
      try {
        const parsed = fn(m);
        const d = new Date(parsed);
        if (!isNaN(d) && d.getFullYear() >= 2000 && d.getFullYear() <= 2099) {
          date = parsed; dateConfidence = 'high'; break;
        }
      } catch {}
    }
  }

  const noiseWords = /^(date|time|bill\s*to|ship\s*to|sold\s*to|receipt|invoice|tax|gst|amount|total|phone|mobile|address|thank|welcome|visit|please|subtotal|igst|cgst|sgst|gstin|pan|serial|no\.|sl\.|s\.no|qty|description|unit\s*price|terms|condition|payment|due|sales\s*tax|customer|from|to\s*:)/i;
  const digitHeavy = (l) => (l.match(/\d/g) || []).length / l.length > 0.4;
  const symbolHeavy = (l) => (l.match(/[*=_|#\\$€£@]/g) || []).length > 2;

  let vendor = '';
  let vendorConfidence = 'low';

  const topLines = lines.slice(0, 8);
  const allCapsLine = topLines.find(l =>
    l.length > 3 && l === l.toUpperCase() && /[A-Z]{3,}/.test(l)
    && !digitHeavy(l) && !symbolHeavy(l) && !noiseWords.test(l)
  );
  if (allCapsLine) { vendor = allCapsLine; vendorConfidence = 'high'; }

  if (!vendor) {
    const titleCase = topLines.find(l =>
      l.length > 3 && /^[A-Z][a-zA-Z\s&'.,-]{3,}$/.test(l)
      && !digitHeavy(l) && !symbolHeavy(l) && !noiseWords.test(l)
    );
    if (titleCase) { vendor = titleCase; vendorConfidence = 'medium'; }
  }

  if (!vendor) {
    const fallback = lines.find(l =>
      l.length > 2 && !digitHeavy(l) && !symbolHeavy(l) && !noiseWords.test(l)
    );
    vendor = fallback || 'Unknown Vendor';
    vendorConfidence = 'low';
  }

  let category = 'Other';
  const catRules = [
    ['Food',      /food|restaurant|hotel|cafe|dhaba|eat|meal|swiggy|zomato|blinkit|canteen|bakery|juice|pizza|burger|biryani|tiffin/],
    ['Transport', /uber|ola|cab|taxi|petrol|fuel|diesel|travel|railway|irctc|bus|metro|auto|toll|parking|flight|indigo|airtel/],
    ['Utilities', /electricity|water|gas|bill|utility|internet|broadband|recharge|wifi|airtel|jio|vodafone|bsnl|tata power/],
    ['Supplies',  /office|supply|stationery|pen|paper|printer|amazon|flipkart|myntra|grocery|mart|supermarket|dmart|reliance/],
    ['Rent',      /rent|lease|pg|hostel|lodge|accommodation/],
    ['Salary',    /salary|payroll|wage|stipend|hr|payslip/],
    ['Marketing', /ad|marketing|campaign|google ads|meta|facebook|instagram|promotion|banner|brochure/],
  ];
  for (const [cat, re] of catRules) {
    if (re.test(lower)) { category = cat; break; }
  }

  return {
    vendor: vendor.slice(0, 80),
    amount,
    date,
    category,
    confidence: { vendor: vendorConfidence, amount: amountConfidence, date: dateConfidence },
  };
}

function ConfBadge({ level }) {
  const cfg = {
    high:   { color: 'var(--success)', bg: 'var(--success-bg)', label: 'High Confidence' },
    medium: { color: 'var(--warning)', bg: 'var(--warning-bg)', label: 'Medium Confidence' },
    low:    { color: 'var(--danger)',  bg: 'var(--danger-bg)',  label: 'Verify Manually' },
  };
  const c = cfg[level] || cfg.low;
  return (
    <span style={{
      fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.5rem',
      borderRadius: 99, background: c.bg, color: c.color, marginLeft: '0.4rem',
      textTransform: 'uppercase', letterSpacing: '0.04em'
    }}>
      {c.label}
    </span>
  );
}

export default function ReceiptsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileRef = useRef();

  const [image, setImage]       = useState(null);
  const [imageURL, setImageURL] = useState('');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanned, setScanned]   = useState(false);
  const [rawText, setRawText]   = useState('');
  const [showRaw, setShowRaw]   = useState(false);
  const [confidence, setConfidence] = useState({});
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const [form, setForm] = useState({
    vendor: '', amount: '', date: new Date().toISOString().split('T')[0],
    category: 'Other', description: '',
  });

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status]);

  const reset = () => {
    setImage(null); setImageURL(''); setScanned(false); setRawText('');
    setShowRaw(false); setProgress(0); setConfidence({});
    setForm({ vendor: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'Other', description: '' });
  };

  const handleFile = (file) => {
    if (!file) return;
    reset();
    setImage(file);
    setImageURL(URL.createObjectURL(file));
    setSaved(false);
  };

  const runOCR = async () => {
    if (!image) return;
    setScanning(true);
    setProgress(5);
    try {
      setProgress(15);
      const enhanced = await preprocessImage(image);
      setProgress(30);

      const Tesseract = (await import('tesseract.js')).default;
      setProgress(35);

      const { data } = await Tesseract.recognize(enhanced, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(35 + Math.floor(m.progress * 55));
          }
        },
        tessedit_char_whitelist: '',
        tessedit_pageseg_mode: '6',
      });

      setProgress(92);
      const raw = data.text;
      setRawText(raw);

      const parsed = parseOCRText(raw);
      setProgress(100);
      setForm(f => ({ ...f, vendor: parsed.vendor, amount: parsed.amount, date: parsed.date, category: parsed.category }));
      setConfidence(parsed.confidence);
      setScanned(true);
    } catch (err) {
      console.error(err);
      alert('OCR failed. Try a clearer image or fill manually.');
    }
    setScanning(false);
  };

  const handleSave = async () => {
    if (!form.vendor || !form.amount || !form.date) return alert('Please fill vendor, amount, and date.');
    setSaving(true);
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.user.id,
        vendor: form.vendor,
        amount: parseFloat(form.amount),
        date: form.date,
        category: form.category,
        description: form.description,
        scannedByAI: scanned,
      }),
    });
    setSaving(false);
    setSaved(true);
    reset();
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-container">

          {/* ── Header ── */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Receipt Scanner</h1>
              <p className="page-subtitle">Upload a receipt photo — AI extracts vendor, amount, date & category</p>
            </div>
            {scanned && (
              <button className="btn-secondary" onClick={reset}>
                <RefreshCw size={14} /> Scan Another
              </button>
            )}
          </div>

          {/* ── 2 Column Layout ── */}
          <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 5fr) minmax(380px, 7fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>

            {/* ── Left Column: Upload Dropzone Card ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Single Dropzone Card (NO nested borders!) */}
              <div
                style={{
                  background: imageURL ? 'var(--bg-card)' : 'var(--bg-card)',
                  border: `2px dashed ${imageURL ? 'var(--accent)' : '#cbd5e1'}`,
                  borderRadius: 16,
                  padding: '2rem 1.5rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  minHeight: 320,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justify: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onClick={() => fileRef.current.click()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}
              >
                {imageURL ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img
                      src={imageURL}
                      alt="Receipt Preview"
                      style={{
                        maxHeight: 220,
                        maxWidth: '100%',
                        borderRadius: 10,
                        objectFit: 'contain',
                        marginBottom: '1rem',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow)',
                      }}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <RefreshCw size={13} /> Click or drop to replace image
                    </span>
                  </div>
                ) : (
                  <>
                    <div style={{
                      width: 60, height: 60, borderRadius: 16,
                      background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem',
                      boxShadow: '0 4px 12px rgba(37,99,235,0.12)',
                    }}>
                      <Upload size={28} color="var(--accent)" />
                    </div>
                    <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      Drop receipt photo here
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                      PNG, JPG, JPEG · Click to browse
                    </p>
                    <div style={{
                      padding: '0.4rem 0.875rem', borderRadius: 99,
                      background: 'var(--bg-primary)', border: '1px solid var(--border)',
                      fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 500,
                    }}>
                      💡 High contrast photos produce best AI OCR results
                    </div>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

              {/* Action Button & Progress Bar */}
              {image && !scanned && (
                <div>
                  <button
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.95rem' }}
                    onClick={runOCR} disabled={scanning}
                  >
                    {scanning ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
                    {scanning ? 'Processing OCR Scan...' : 'Scan Receipt with AI'}
                  </button>
                  {scanning && (
                    <div style={{ marginTop: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        <span>{progress < 20 ? 'Preprocessing image...' : progress < 90 ? 'Extracting text...' : 'Parsing details...'}</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{progress}%</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Success Banner */}
              {scanned && (
                <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 12, padding: '0.875rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 700, fontSize: '0.85rem' }}>
                    <CheckCircle2 size={16} /> Details Extracted Successfully
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-body)', marginTop: '0.2rem' }}>
                    Verify the form details on the right before saving to your ledger.
                  </p>
                </div>
              )}

              {/* Raw OCR Viewer */}
              {rawText && (
                <div className="card" style={{ padding: '0.875rem 1rem' }}>
                  <button
                    className="btn-ghost"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', padding: '0.35rem' }}
                    onClick={() => setShowRaw(v => !v)}
                  >
                    {showRaw ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showRaw ? 'Hide Raw OCR Text' : 'View Raw OCR Text'}
                  </button>
                  {showRaw && (
                    <pre style={{
                      marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-body)',
                      background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem',
                      maxHeight: 160, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      lineHeight: 1.6, fontFamily: 'monospace',
                    }}>
                      {rawText}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* ── Right Column: Form Card ── */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.875rem', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ScanLine size={18} color="var(--accent)" />
                    <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Expense Details</h2>
                  </div>
                  {scanned && <span className="badge badge-info">AI Extracted</span>}
                </div>

                {/* Vendor Field */}
                <div className="form-group">
                  <label className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Vendor / Shop Name</span>
                    {confidence.vendor && <ConfBadge level={confidence.vendor} />}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                    <input
                      className="input"
                      placeholder="e.g. D-Mart, Raj Restaurant, Shell Petrol"
                      value={form.vendor}
                      onChange={e => setForm({ ...form, vendor: e.target.value })}
                      style={{ paddingLeft: '2.25rem' }}
                    />
                  </div>
                </div>

                {/* Amount & Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Amount (₹)</span>
                      {confidence.amount && <ConfBadge level={confidence.amount} />}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <IndianRupee size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                      <input
                        className="input" type="number" step="0.01" placeholder="0.00"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        style={{ paddingLeft: '2.1rem', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Date</span>
                      {confidence.date && <ConfBadge level={confidence.date} />}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                      <input
                        className="input" type="date"
                        value={form.date}
                        onChange={e => setForm({ ...form, date: e.target.value })}
                        style={{ paddingLeft: '2.1rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className="form-group">
                  <label className="label">Category</label>
                  <div style={{ position: 'relative' }}>
                    <Tag size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', zIndex: 1 }} />
                    <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ paddingLeft: '2.25rem' }}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label className="label">Notes / Description (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <AlignLeft size={14} style={{ position: 'absolute', left: 12, top: '12px', color: 'var(--text-faint)' }} />
                    <textarea
                      className="input"
                      placeholder="Add line items, purpose, or additional notes..."
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      style={{ paddingLeft: '2.25rem', paddingTop: '0.55rem', minHeight: 70 }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div>
                {scanned && Object.values(confidence).includes('low') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 10, padding: '0.625rem 0.875rem', marginBottom: '1rem', fontSize: '0.78rem', color: 'var(--warning)' }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    Some fields have low confidence — please verify before saving.
                  </div>
                )}

                {saved && (
                  <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 10, padding: '0.625rem 0.875rem', color: 'var(--success)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={16} /> Expense saved to your ledger!
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }} onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Expense'}
                  </button>
                  <button className="btn-secondary" onClick={reset}>
                    <X size={16} /> Clear
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* ── Bottom Tips ── */}
          <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            {[
              { title: '📸 Good Lighting', desc: 'Avoid reflections, glare, and harsh shadows over printed text.' },
              { title: '📄 Flat Surface', desc: 'Lay paper flat before taking the photo for accurate line reading.' },
              { title: '🔍 Double Check', desc: 'AI auto-fills fields. Verify vendor name and amount before saving.' },
            ].map(({ title, desc }) => (
              <div key={title} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '0.875rem 1.125rem',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}
