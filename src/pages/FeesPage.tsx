import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IndianRupee, CheckCircle2, AlertCircle, Clock, Filter, Copy, Check } from 'lucide-react';
import { useAppStore, useLibraryStore } from '../store';
import { formatDisplayDate, formatShift, generateReminderMessage, todayStr } from '../lib/utils';
import type { FeeRecord } from '../types';
import RecordPaymentModal from '../components/fees/RecordPaymentModal';
import toast from 'react-hot-toast';

type FeeFilter = 'all' | 'overdue' | 'due' | 'upcoming' | 'paid';

const FILTERS: { value: FeeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due', label: 'Due Today' },
  { value: 'upcoming', label: 'Due Soon' },
  { value: 'paid', label: 'Paid' },
];

export default function FeesPage() {
  const [filter, setFilter] = useState<FeeFilter>('all');
  const [payingFee, setPayingFee] = useState<{ feeId: string; studentName: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const settings = useLibraryStore((s) => s.settings);
  const students = useAppStore((s) => s.students);
  const feeRecords = useAppStore((s) => s.feeRecords);
  const today = todayStr();

  // Latest fee per student (non-paid)
  const studentFees = useMemo(() => {
    return students
      .filter((s) => s.status === 'active')
      .map((student) => {
        const fees = feeRecords.filter((f) => f.studentId === student.id);
        const latestDue = fees
          .filter((f) => f.status !== 'paid')
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
        const lastPaid = fees
          .filter((f) => f.status === 'paid')
          .sort((a, b) => (b.paidDate ?? '').localeCompare(a.paidDate ?? ''))[0];
        return { student, fee: latestDue, lastPaid };
      })
      .filter(({ fee }) => {
        if (filter === 'all') return true;
        if (filter === 'overdue') return fee?.status === 'overdue';
        if (filter === 'due') return fee?.status === 'due' && fee.dueDate === today;
        if (filter === 'upcoming') return fee?.status === 'upcoming';
        if (filter === 'paid') return !fee; // all paid
        return true;
      });
  }, [students, feeRecords, filter, today]);

  // Summary stats
  const totalExpected = students.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.monthlyFee, 0);
  const collected = feeRecords
    .filter((f) => {
      if (f.status !== 'paid' || !f.paidDate) return false;
      return f.paidDate.startsWith(today.slice(0, 7)); // This month
    })
    .reduce((sum, f) => sum + f.amount, 0);
  const overdue = feeRecords.filter((f) => f.status === 'overdue').reduce((sum, f) => sum + f.amount, 0);
  const dueCount = feeRecords.filter((f) => f.status === 'due').length;
  const overdueCount = feeRecords.filter((f) => f.status === 'overdue').length;

  function handleCopyReminder(fee: FeeRecord, studentName: string) {
    const msg = generateReminderMessage(studentName, fee.amount, fee.dueDate, settings.libraryName);
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedId(fee.id);
      toast.success('Reminder message copied!');
      setTimeout(() => setCopiedId(null), 3000);
    });
  }

  const feeStatusClass = (status?: string) => {
    if (status === 'overdue') return 'badge-red';
    if (status === 'due') return 'badge-orange';
    if (status === 'upcoming') return 'badge-blue';
    return 'badge-green';
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      <div>
        <h1 className="page-title">Fee Management</h1>
        <p className="page-subtitle">Track and manage monthly fees</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Expected (Monthly)', value: `₹${totalExpected.toLocaleString('en-IN')}`, color: 'bg-slate-100 text-slate-700', icon: IndianRupee },
          { label: 'Collected (This Month)', value: `₹${collected.toLocaleString('en-IN')}`, color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
          { label: 'Overdue', value: `₹${overdue.toLocaleString('en-IN')}`, color: 'bg-red-100 text-red-600', icon: AlertCircle },
          { label: 'Due Today', value: dueCount, color: 'bg-orange-100 text-orange-700', icon: Clock },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-4"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${card.color}`}>
                <Icon size={18} />
              </div>
              <p className="text-xl font-black text-slate-900">{card.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              filter === f.value
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {f.label}
            {f.value === 'overdue' && overdueCount > 0 && (
              <span className="ml-1.5 bg-red-200 text-red-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{overdueCount}</span>
            )}
            {f.value === 'due' && dueCount > 0 && (
              <span className="ml-1.5 bg-orange-200 text-orange-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{dueCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Fee list */}
      {studentFees.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">
            {filter === 'overdue' ? 'No overdue fees!' : filter === 'due' ? 'No fees due today!' : 'No results'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {filter === 'overdue' || filter === 'due' ? 'Great job keeping up with payments.' : 'Try changing the filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {studentFees.map(({ student, fee, lastPaid }, i) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="card px-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0 font-bold text-brand-700">
                  {student.name[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{student.name}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="text-xs text-slate-400">Seat {student.currentSeatId}</span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-400">{formatShift(student.membershipType)}</span>
                    {fee && (
                      <>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-400">Due: {formatDisplayDate(fee.dueDate)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Amount + Status */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-900">₹{(fee?.amount ?? student.monthlyFee).toLocaleString('en-IN')}</p>
                  <span className={`badge text-xs mt-0.5 ${fee ? feeStatusClass(fee.status) : 'badge-green'}`}>
                    {fee ? (fee.status === 'overdue' ? 'Overdue' : fee.status === 'due' ? 'Due Today' : 'Upcoming') : 'Paid'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {fee && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                  <button
                    onClick={() => setPayingFee({ feeId: fee.id, studentName: student.name })}
                    className="btn-primary text-xs py-1.5 px-3 gap-1.5"
                  >
                    <CheckCircle2 size={13} /> Mark as Paid
                  </button>
                  <button
                    onClick={() => handleCopyReminder(fee, student.name)}
                    className="btn-secondary text-xs py-1.5 px-3 gap-1.5"
                  >
                    {copiedId === fee.id ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                    Copy Reminder
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      <AnimatePresence>
        {payingFee && (
          <RecordPaymentModal
            feeId={payingFee.feeId}
            studentName={payingFee.studentName}
            onClose={() => setPayingFee(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
