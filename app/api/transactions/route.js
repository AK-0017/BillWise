import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongoose';
import Transaction from '@/models/Transaction';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const transactions = await Transaction.find({ userId }).sort({ date: -1 });
    return NextResponse.json(transactions);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
