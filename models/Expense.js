import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendor: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  category: {
    type: String,
    enum: ['Food', 'Transport', 'Utilities', 'Supplies', 'Rent', 'Salary', 'Marketing', 'Other'],
    default: 'Other'
  },
  description: { type: String, default: '' },
  receiptImage: { type: String, default: '' },
  scannedByAI: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
