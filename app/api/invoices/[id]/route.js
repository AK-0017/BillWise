import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Invoice from '@/models/Invoice';

export async function GET(request, { params: paramsPromise }) {
  try {
    const { id } = await paramsPromise;
    if (!id || id === 'undefined' || id.length !== 24) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    await dbConnect();
    const invoice = await Invoice.findById(id);
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (err) {
    console.error('API /api/invoices/[id] GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params: paramsPromise }) {
  try {
    const { id } = await paramsPromise;
    if (!id || id === 'undefined' || id.length !== 24) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }
    await dbConnect();
    const body = await request.json();
    const invoice = await Invoice.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(invoice);
  } catch (err) {
    console.error('API /api/invoices/[id] PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
