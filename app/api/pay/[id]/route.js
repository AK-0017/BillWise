import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Invoice from '@/models/Invoice';
import Transaction from '@/models/Transaction';

export async function POST(request, { params: paramsPromise }) {
  try {
    const { id } = await paramsPromise;
    if (!id || id === 'undefined' || id.length !== 24) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }
    await dbConnect();
    const invoice = await Invoice.findById(id);
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (invoice.status === 'paid') return NextResponse.json({ error: 'Already paid' }, { status: 400 });

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    await invoice.save();

    await Transaction.create({
      userId: invoice.userId,
      type: 'income',
      amount: invoice.total,
      description: `Payment from ${invoice.customerName}`,
      category: 'Invoice Payment',
      reference: invoice.invoiceNumber,
      date: new Date(),
    });

    return NextResponse.json({ success: true, message: 'Payment confirmed', invoice });
  } catch (err) {
    console.error('API /api/pay/[id] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
