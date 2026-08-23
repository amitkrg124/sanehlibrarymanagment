import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, User, Phone, Calendar, Armchair, IndianRupee, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAppStore, useLibraryStore } from '../../store';
import { computeSeatAvailability, ALL_SEAT_IDS, formatShift, getShiftTiming, todayStr, formatDisplayDate } from '../../lib/utils';
import type { Shift } from '../../types';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Enter valid phone number').max(10, 'Phone must be 10 digits'),
  alternatePhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  admissionDate: z.string().min(1, 'Select admission date'),
  membershipType: z.enum(['afternoon', 'evening', 'fullday']),
  monthlyFee: z.number().min(1, 'Enter fee amount'),
  seatId: z.string().min(1, 'Select a seat'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AddStudentModalProps {
  onClose: () => void;
  prefillSeat?: string;
  prefillShift?: Shift;
}

export default function AddStudentModal({ onClose, prefillSeat, prefillShift }: AddStudentModalProps) {
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const settings = useLibraryStore((s) => s.settings);
  const students = useAppStore((s) => s.students);
  const assignments = useAppStore((s) => s.assignments);
  const addStudent = useAppStore((s) => s.addStudent);
  const assignSeat = useAppStore((s) => s.assignSeat);
  const disabledSeats = useAppStore((s) => s.disabledSeats);

  const defaultFee = (shift: Shift) =>
    shift === 'afternoon' ? settings.defaultAfternoonFee
    : shift === 'evening' ? settings.defaultEveningFee
    : settings.defaultFullDayFee;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      admissionDate: todayStr(),
      membershipType: prefillShift ?? 'afternoon',
      monthlyFee: defaultFee(prefillShift ?? 'afternoon'),
      seatId: prefillSeat ?? '',
    },
  });

  const watchedShift = watch('membershipType');
  const watchedDate = watch('admissionDate');
  const watchedSeat = watch('seatId');
  const watchedFee = watch('monthlyFee');
  const watchedName = watch('name');

  // Availability for selected date and shift
  const availabilityMap = React.useMemo(
    () => computeSeatAvailability(watchedDate || todayStr(), assignments, students),
    [watchedDate, assignments, students]
  );

  const availableSeats = ALL_SEAT_IDS.filter((id) => {
    if (disabledSeats.includes(id)) return false;
    const avail = availabilityMap[id];
    if (!avail) return true;
    return avail[watchedShift as Shift];
  });

  // Update fee when shift changes
  React.useEffect(() => {
    setValue('monthlyFee', defaultFee(watchedShift as Shift));
    if (watchedSeat && !availableSeats.includes(watchedSeat)) {
      setValue('seatId', '');
    }
  }, [watchedShift]);

  const [formData, setFormData] = useState<FormData | null>(null);

  const onFormSubmit = (data: FormData) => {
    setFormData(data);
    setStep('confirm');
  };

  const onConfirm = () => {
    if (!formData) return;
    const newStudent = addStudent({
      name: formData.name,
      phone: formData.phone,
      alternatePhone: formData.alternatePhone,
      email: formData.email,
      address: formData.address,
      admissionDate: formData.admissionDate,
      membershipType: formData.membershipType,
      monthlyFee: formData.monthlyFee,
      currentSeatId: formData.seatId,
      status: 'active',
      notes: formData.notes,
    });
    assignSeat(newStudent.id, formData.seatId, formData.membershipType, formData.admissionDate);
    toast.success(`${formData.name} admitted successfully! Seat ${formData.seatId} assigned.`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 0.99, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {step === 'confirm' && (
              <button onClick={() => setStep('form')} className="btn-ghost p-1.5 -ml-1.5 mr-1">
                <ChevronLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="font-bold text-slate-900">
                {step === 'form' ? 'New Admission' : 'Confirm Admission'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {step === 'form' ? 'Fill in student details' : 'Review before saving'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit(onFormSubmit)}
                className="space-y-4"
                id="admission-form"
              >
                {/* Personal Details */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Personal Details</p>
                  <div className="space-y-3">
                    <div>
                      <label className="label">Full Name *</label>
                      <input {...register('name')} className="input" placeholder="e.g. Rahul Kumar" />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Mobile Number *</label>
                        <input {...register('phone')} className="input" placeholder="10-digit number" maxLength={10} />
                        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                      </div>
                      <div>
                        <label className="label">Alternate Number</label>
                        <input {...register('alternatePhone')} className="input" placeholder="Optional" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Email (Optional)</label>
                      <input {...register('email')} type="email" className="input" placeholder="email@example.com" />
                    </div>
                  </div>
                </div>

                <div className="divider" />

                {/* Membership */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Membership</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Admission Date *</label>
                        <input {...register('admissionDate')} type="date" className="input" />
                      </div>
                      <div>
                        <label className="label">Monthly Fee (₹) *</label>
                        <input
                          {...register('monthlyFee', { valueAsNumber: true })}
                          type="number"
                          className="input"
                          min={0}
                        />
                        {errors.monthlyFee && <p className="text-xs text-red-500 mt-1">{errors.monthlyFee.message}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="label">Membership Type *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['afternoon', 'evening', 'fullday'] as Shift[]).map((s) => (
                          <label
                            key={s}
                            className={`flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              watchedShift === s
                                ? s === 'afternoon' ? 'bg-orange-50 border-orange-400 text-orange-700'
                                  : s === 'evening' ? 'bg-blue-50 border-blue-400 text-blue-700'
                                  : 'bg-purple-50 border-purple-400 text-purple-700'
                                : 'border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              value={s}
                              {...register('membershipType')}
                              className="sr-only"
                            />
                            <span className="text-xs font-bold capitalize">
                              {s === 'fullday' ? 'Full Day' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </span>
                            <span className="text-[9px] mt-0.5 text-center opacity-70">
                              {s === 'afternoon' ? '7AM–2PM' : s === 'evening' ? '2PM–9PM' : '7AM–9PM'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="label">Select Seat *</label>
                      <p className="text-xs text-slate-400 mb-2">
                        {availableSeats.length} seat{availableSeats.length !== 1 ? 's' : ''} available for {formatShift(watchedShift as Shift)} on {formatDisplayDate(watchedDate)}
                      </p>
                      <div className="grid grid-cols-5 gap-2 p-3 bg-slate-50 rounded-xl max-h-48 overflow-y-auto">
                        {ALL_SEAT_IDS.map((id) => {
                          const isAvail = availableSeats.includes(id);
                          const isSelected = watchedSeat === id;
                          return (
                            <button
                              key={id}
                              type="button"
                              disabled={!isAvail}
                              onClick={() => setValue('seatId', id)}
                              className={`py-2 px-1 rounded-lg text-xs font-bold border-2 transition-all ${
                                isSelected
                                  ? 'bg-brand-600 border-brand-600 text-white'
                                  : isAvail
                                  ? 'bg-white border-green-200 text-green-700 hover:border-green-400'
                                  : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                              }`}
                            >
                              {id}
                            </button>
                          );
                        })}
                      </div>
                      {errors.seatId && <p className="text-xs text-red-500 mt-1">Please select a seat</p>}
                    </div>

                    <div>
                      <label className="label">Notes (Optional)</label>
                      <textarea {...register('notes')} className="input resize-none" rows={2} placeholder="e.g. UPSC preparation" />
                    </div>
                  </div>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Confirmation summary */}
                <div className="bg-brand-50 rounded-2xl p-5 border border-brand-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
                      <span className="text-lg font-black text-white">{formData?.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{formData?.name}</p>
                      <p className="text-xs text-slate-500">{formData?.phone}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { label: 'Seat', value: formData?.seatId },
                      { label: 'Membership', value: formatShift(formData?.membershipType as Shift) },
                      { label: 'Timing', value: getShiftTiming(formData?.membershipType as Shift, settings) },
                      { label: 'Monthly Fee', value: `₹${formData?.monthlyFee?.toLocaleString('en-IN')}` },
                      { label: 'Admission Date', value: formData?.admissionDate ? formatDisplayDate(formData.admissionDate) : '' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">{row.label}</span>
                        <span className="text-sm font-bold text-slate-900">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-3 border border-green-100 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-700">
                    Seat <strong>{formData?.seatId}</strong> is available for {formatShift(formData?.membershipType as Shift)}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-slate-100">
          {step === 'form' ? (
            <button type="submit" form="admission-form" className="btn-primary w-full justify-center py-3">
              Continue to Review
              <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={onConfirm} className="btn-primary w-full justify-center py-3">
              <CheckCircle2 size={16} />
              Confirm Admission
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
