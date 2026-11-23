import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Invoice from '@/models/Invoice';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let query = {};
    if (userId && userId !== 'undefined') {
      query.userId = userId;
    } else {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        query.userId = session.user.id;
      }
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (err) {
    console.error('API /api/invoices GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    if (!body.userId) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) body.userId = session.user.id;
    }

    // Auto-generate guaranteed unique invoice number across all invoices
    let invoiceNumber = '';
    let isUnique = false;
    let attempts = 0;
    const totalCount = await Invoice.countDocuments({});

    while (!isUnique && attempts < 10) {
      attempts++;
      const num = totalCount + attempts;
      invoiceNumber = `INV-${String(num).padStart(4, '0')}`;
      const existing = await Invoice.findOne({ invoiceNumber });
      if (!existing) isUnique = true;
    }

    if (!isUnique) {
      invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    }

    body.invoiceNumber = invoiceNumber;
    const invoice = await Invoice.create(body);
    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error('API /api/invoices POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
