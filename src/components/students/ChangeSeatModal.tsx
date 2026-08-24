import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { useAppStore, useLibraryStore } from '../../store';
import { computeSeatAvailability, ALL_SEAT_IDS, formatShift, formatDisplayDate, todayStr } from '../../lib/utils';
import toast from 'react-hot-toast';

interface ChangeSeatModalProps {
  studentId: string;
  onClose: () => void;
}

export default function ChangeSeatModal({ studentId, onClose }: ChangeSeatModalProps) {
  const student = useAppStore((s) => s.students.find((std) => std.id === studentId));
  const students = useAppStore((s) => s.students);
  const assignments = useAppStore((s) => s.assignments);
  const disabledSeats = useAppStore((s) => s.disabledSeats);
  const changeSeat = useAppStore((s) => s.changeSeat);

  const [newSeat, setNewSeat] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(todayStr());
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  const availabilityMap = useMemo(
    () => computeSeatAvailability(effectiveDate, assignments, students),
    [effectiveDate, assignments, students]
  );

  const availableSeats = ALL_SEAT_IDS.filter((id) => {
    if (id === student?.currentSeatId) return false; // exclude current
    if (disabledSeats.includes(id)) return false;
    const avail = availabilityMap[id];
    if (!avail) return true;
    return student ? !!avail[student.membershipType as keyof typeof avail] : false;
  });

  const handleConfirm = () => {
    changeSeat(studentId, newSeat, effectiveDate);
    toast.success(`Seat changed from ${student?.currentSeatId} to ${newSeat} effective ${formatDisplayDate(effectiveDate)}`);
    onClose();
  };

  if (!student) return null;

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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Change Seat</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Current seat */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <p className="text-xs text-slate-400">Current Seat</p>
              <p className="font-bold text-slate-900">{student.currentSeatId ?? 'None'}</p>
            </div>
            <ArrowRightLeft size={18} className="text-slate-400" />
            <div className="text-right">
              <p className="text-xs text-slate-400">New Seat</p>
              <p className={`font-bold ${newSeat ? 'text-brand-700' : 'text-slate-300'}`}>{newSeat || '—'}</p>
            </div>
          </div>

          {/* Effective date */}
          <div>
            <label className="label">Effective From</label>
            <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="input" min={todayStr()} />
          </div>

          {/* Seat picker */}
          {step === 'select' && (
            <div>
              <label className="label">Select New Seat ({availableSeats.length} available for {formatShift(student.membershipType)})</label>
              <div className="grid grid-cols-5 gap-2 p-3 bg-slate-50 rounded-xl max-h-40 overflow-y-auto">
                {ALL_SEAT_IDS.map((id) => {
                  const isAvail = availableSeats.includes(id);
                  const isCurrent = id === student.currentSeatId;
                  const isSelected = newSeat === id;
                  return (
                    <button
                      key={id}
                      disabled={!isAvail}
                      onClick={() => setNewSeat(id)}
                      className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${
                        isSelected ? 'bg-brand-600 border-brand-600 text-white'
                        : isCurrent ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                        : isAvail ? 'bg-white border-green-200 text-green-700 hover:border-green-400'
                        : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      {id}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="bg-brand-50 rounded-xl p-4 border border-brand-100 space-y-2">
              <p className="text-sm font-semibold text-slate-800">Confirm Seat Change?</p>
              <p className="text-xs text-slate-600">
                <strong>{student.name}</strong> will move from <strong>{student.currentSeatId}</strong> to <strong>{newSeat}</strong>
              </p>
              <p className="text-xs text-slate-500">Effective from: {formatDisplayDate(effectiveDate)}</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 pt-2 space-y-2">
          {step === 'select' ? (
            <button
              disabled={!newSeat}
              onClick={() => setStep('confirm')}
              className="btn-primary w-full justify-center disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <>
              <button onClick={handleConfirm} className="btn-primary w-full justify-center">
                <CheckCircle2 size={16} /> Confirm Change
              </button>
              <button onClick={() => setStep('select')} className="btn-secondary w-full justify-center">Back</button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
