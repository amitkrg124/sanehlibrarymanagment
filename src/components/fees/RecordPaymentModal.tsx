import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, IndianRupee } from 'lucide-react';
import { useAppStore } from '../../store';
import { formatDisplayDate, todayStr } from '../../lib/utils';
import type { PaymentMethod } from '../../types';
import toast from 'react-hot-toast';

interface RecordPaymentModalProps {
  feeId: string;
  studentName: string;
  onClose: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; emoji: string }[] = [
  { value: 'cash', label: 'Cash', emoji: '💵' },
  { value: 'upi', label: 'UPI', emoji: '📱' },
  { value: 'bank_transfer', label: 'Bank Transfer', emoji: '🏦' },
  { value: 'other', label: 'Other', emoji: '💳' },
];

export default function RecordPaymentModal({ feeId, studentName, onClose }: RecordPaymentModalProps) {
  const feeRecords = useAppStore((s) => s.feeRecords);
  const markFeePaid = useAppStore((s) => s.markFeePaid);

  const fee = feeRecords.find((f) => f.id === feeId);
  const [paidDate, setPaidDate] = useState(todayStr());
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState(fee?.amount ?? 0);

  if (!fee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    markFeePaid(feeId, paidDate, method, notes);
    toast.success(`Payment of ₹${amount.toLocaleString('en-IN')} recorded for ${studentName}`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 10, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900">Record Payment</h2>
            <p className="text-xs text-slate-400 mt-0.5">{studentName}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Fee period */}
          <div className="bg-slate-50 rounded-xl p-3 text-sm">
            <p className="text-xs text-slate-400 mb-1">Fee Period</p>
            <p className="font-semibold text-slate-800">
              {formatDisplayDate(fee.periodStart)} – {formatDisplayDate(fee.periodEnd)}
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="label">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="input pl-8"
                required
                min={1}
              />
            </div>
          </div>

          {/* Payment date */}
          <div>
            <label className="label">Payment Date</label>
            <input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} className="input" required />
          </div>

          {/* Payment method */}
          <div>
            <label className="label">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    method === m.value
                      ? 'bg-brand-50 border-brand-400 text-brand-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span>{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              placeholder="e.g. Partial payment"
            />
          </div>

          <button type="submit" className="btn-primary w-full justify-center py-3">
            <CheckCircle2 size={16} />
            Record Payment
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
