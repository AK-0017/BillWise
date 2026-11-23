import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongoose';
import Expense from '@/models/Expense';
import Transaction from '@/models/Transaction';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const expenses = await Expense.find({ userId }).sort({ date: -1 });
    return NextResponse.json(expenses);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const body = await request.json();
    const expense = await Expense.create(body);
    // Also create a transaction record
    await Transaction.create({
      userId: body.userId,
      type: 'expense',
      amount: body.amount,
      description: body.vendor,
      category: body.category,
      reference: expense._id.toString(),
      date: body.date,
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
