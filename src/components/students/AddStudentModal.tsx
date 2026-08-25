import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, ChevronRight, Armchair, Sparkles, Clock } from 'lucide-react';
import { useAppStore, useLibraryStore } from '../../store';
import { ALL_SEAT_IDS, computeSeatAvailability, formatShift, formatDisplayDate, todayStr, getShiftTiming } from '../../lib/utils';
import type { Shift, SeatType } from '../../types';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  registrationNo: z.string().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  alternatePhone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  verificationType: z.string().optional(),
  verificationId: z.string().optional(),
  admissionDate: z.string().min(1, 'Admission date is required'),
  seatType: z.enum(['reserved', 'unreserved']),
  membershipType: z.enum(['afternoon', 'evening', 'fullday', 'unreserved']),
  planHours: z.string().optional(),
  monthlyFee: z.number().min(0, 'Fee must be positive'),
  seatId: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.seatType === 'reserved' && !data.seatId) {
    return false;
  }
  return true;
}, {
  message: 'Please select a seat for reserved membership',
  path: ['seatId'],
});

type FormData = z.infer<typeof schema>;

interface AddStudentModalProps {
  prefillSeat?: string;
  prefillShift?: Shift;
  onClose: () => void;
}

export default function AddStudentModal({ prefillSeat, prefillShift, onClose }: AddStudentModalProps) {
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [formData, setFormData] = useState<FormData | null>(null);

  const settings = useLibraryStore((s) => s.settings);
  const students = useAppStore((s) => s.students);
  const assignments = useAppStore((s) => s.assignments);
  const addStudent = useAppStore((s) => s.addStudent);
  const assignSeat = useAppStore((s) => s.assignSeat);
  const disabledSeats = useAppStore((s) => s.disabledSeats);

  const defaultFee = (shift: Shift, seatType: SeatType) => {
    if (seatType === 'unreserved') return settings.defaultUnreservedFee || 400;
    if (shift === 'afternoon') return settings.defaultAfternoonFee;
    if (shift === 'evening') return settings.defaultEveningFee;
    return settings.defaultFullDayFee;
  };

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      admissionDate: todayStr(),
      seatType: 'reserved',
      membershipType: prefillShift || 'afternoon',
      planHours: '2 Hours / Flexible',
      monthlyFee: defaultFee(prefillShift || 'afternoon', 'reserved'),
      seatId: prefillSeat || '',
    },
  });

  const watchedShift = watch('membershipType');
  const watchedSeatType = watch('seatType');
  const watchedDate = watch('admissionDate') || todayStr();
  const watchedSeat = watch('seatId');

  // Compute available seats for date & shift
  const availableSeats = useMemo(() => {
    if (watchedSeatType === 'unreserved') return [];
    const availMap = computeSeatAvailability(watchedDate, assignments, students);
    const shift = watchedShift === 'unreserved' ? 'afternoon' : watchedShift;
    return ALL_SEAT_IDS.filter((id) => {
      if (disabledSeats.includes(id)) return false;
      const avail = availMap[id];
      if (!avail) return true;
      return avail[shift];
    });
  }, [watchedDate, watchedShift, watchedSeatType, assignments, students, disabledSeats]);

  const onFormSubmit = (data: FormData) => {
    setFormData(data);
    setStep('confirm');
  };

  const onConfirm = () => {
    if (!formData) return;

    const isReserved = formData.seatType === 'reserved';
    const effectiveShift = isReserved ? (formData.membershipType as Shift) : 'unreserved';

    const newStudent = addStudent({
      name: formData.name.trim(),
      registrationNo: formData.registrationNo?.trim() || undefined,
      seatType: formData.seatType,
      planHours: !isReserved ? (formData.planHours || 'Flexible') : undefined,
      phone: formData.phone.trim(),
      alternatePhone: formData.alternatePhone?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      address: formData.address?.trim() || undefined,
      admissionDate: formData.admissionDate,
      membershipType: effectiveShift,
      monthlyFee: Number(formData.monthlyFee),
      currentSeatId: isReserved ? formData.seatId : undefined,
      status: 'active',
      notes: formData.notes?.trim() || undefined,
      verificationType: formData.verificationType || undefined,
      verificationId: formData.verificationId || undefined,
    });

    if (isReserved && formData.seatId) {
      assignSeat(newStudent.id, formData.seatId, effectiveShift, formData.admissionDate);
      toast.success(`${formData.name} admitted successfully! Seat ${formData.seatId} assigned.`);
    } else {
      toast.success(`${formData.name} admitted successfully as Unreserved Student!`);
    }

    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="modal-backdrop" onClick={onClose} />

      <motion.div
        initial={{ y: 40, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 40, scale: 0.98 }}
        className="modal-content sm:max-w-xl max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {step === 'form' ? 'New Student Admission' : 'Review & Confirm Admission'}
            </h2>
            <p className="text-xs text-slate-400">
              {step === 'form' ? 'Fill student & membership details' : 'Verify all details before saving'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.form
                key="form"
                id="admission-form"
                onSubmit={handleSubmit(onFormSubmit)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Personal Information */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Personal Details</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="label">Full Name *</label>
                        <input {...register('name')} className="input" placeholder="e.g. Priya Sharma" />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                      </div>
                      <div>
                        <label className="label">Reg. Number (Optional)</label>
                        <input
                          {...register('registrationNo')}
                          className="input font-mono font-semibold"
                          placeholder="e.g. SAN-101"
                        />
                      </div>
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

                    <div>
                      <label className="label">Address (Optional)</label>
                      <textarea {...register('address')} className="input h-16 resize-none py-2" placeholder="Enter residential address" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Verification Doc (Optional)</label>
                        <select {...register('verificationType')} className="input">
                          <option value="">Select Document</option>
                          <option value="Aadhaar">Aadhaar Card</option>
                          <option value="Voter ID">Voter ID</option>
                          <option value="PAN Card">PAN Card</option>
                          <option value="Driving License">Driving License</option>
                          <option value="Other">Other ID</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Document ID No. (Optional)</label>
                        <input {...register('verificationId')} className="input" placeholder="e.g. 1234-5678-9012" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divider" />

                {/* Membership & Seat Plan */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Seat Category & Plan</p>
                  
                  {/* Seat Type Selector (Reserved vs Unreserved) */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        watchedSeatType === 'reserved'
                          ? 'bg-brand-50 border-brand-600 text-brand-900 shadow-sm'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value="reserved"
                        {...register('seatType')}
                        onChange={(e) => {
                          setValue('seatType', 'reserved');
                          if (watchedShift === 'unreserved') setValue('membershipType', 'afternoon');
                          setValue('monthlyFee', defaultFee('afternoon', 'reserved'));
                        }}
                        className="sr-only"
                      />
                      <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Armchair size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Reserved Seat</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Fixed seat number & fixed batch timing</p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        watchedSeatType === 'unreserved'
                          ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value="unreserved"
                        {...register('seatType')}
                        onChange={(e) => {
                          setValue('seatType', 'unreserved');
                          setValue('membershipType', 'unreserved');
                          setValue('seatId', '');
                          setValue('monthlyFee', defaultFee('unreserved', 'unreserved'));
                        }}
                        className="sr-only"
                      />
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Unreserved / Floating</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Flexible hours (2hr/4hr/floating, no fixed seat)</p>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Admission Date *</label>
                        <input {...register('admissionDate')} type="date" className="input" />
                      </div>
                      <div>
                        <label className="label">Monthly Fee (?) *</label>
                        <input
                          {...register('monthlyFee', { valueAsNumber: true })}
                          type="number"
                          className="input"
                          min={0}
                        />
                        {errors.monthlyFee && <p className="text-xs text-red-500 mt-1">{errors.monthlyFee.message}</p>}
                      </div>
                    </div>

                    {/* If Reserved Seat -> Show Shift selection & Seat Grid */}
                    {watchedSeatType === 'reserved' ? (
                      <>
                        <div>
                          <label className="label">Membership Batch Timing *</label>
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
                                  onChange={() => {
                                    setValue('membershipType', s);
                                    setValue('monthlyFee', defaultFee(s, 'reserved'));
                                  }}
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
                          {errors.seatId && <p className="text-xs text-red-500 mt-1">{errors.seatId.message}</p>}
                        </div>
                      </>
                    ) : (
                      /* If Unreserved Seat -> Show Plan/Duration options */
                      <div className="space-y-3">
                        <div>
                          <label className="label">Flexible Plan / Duration</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {['2 Hours Plan', '4 Hours Plan', '6 Hours Plan', 'Flexible Daily'].map((plan) => (
                              <label
                                key={plan}
                                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 cursor-pointer text-center text-xs font-bold transition-all ${
                                  watch('planHours') === plan
                                    ? 'bg-amber-50 border-amber-500 text-amber-800'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  value={plan}
                                  {...register('planHours')}
                                  className="sr-only"
                                />
                                <Clock size={14} className="mb-1 text-amber-600" />
                                {plan}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
                          <Sparkles size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Unreserved Student Information</p>
                            <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                              No fixed seat number is reserved. The student can sit in any vacant seat on arrival according to availability.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="label">Notes (Optional)</label>
                      <textarea {...register('notes')} className="input resize-none" rows={2} placeholder="e.g. UPSC preparation / flexible afternoon student" />
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
                      <p className="text-xs text-slate-500">
                        {formData?.registrationNo ? `Reg No: ${formData.registrationNo} · ` : ''}{formData?.phone}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { label: 'Category', value: formData?.seatType === 'reserved' ? 'Reserved Seat' : 'Unreserved / Floating' },
                      ...(formData?.registrationNo ? [{ label: 'Registration No.', value: formData.registrationNo }] : []),
                      ...(formData?.seatType === 'reserved' ? [
                        { label: 'Seat', value: formData.seatId },
                        { label: 'Membership', value: formatShift(formData.membershipType as Shift) },
                        { label: 'Timing', value: getShiftTiming(formData.membershipType as Shift, settings) },
                      ] : [
                        { label: 'Plan', value: formData?.planHours || 'Flexible Unreserved' },
                        { label: 'Seat Status', value: 'Any available floating seat' },
                      ]),
                      { label: 'Monthly Fee', value: `?${formData?.monthlyFee?.toLocaleString('en-IN')}` },
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
                    {formData?.seatType === 'reserved' ? (
                      <>Seat <strong>{formData?.seatId}</strong> will be reserved for {formatShift(formData?.membershipType as Shift)}</>
                    ) : (
                      <>Student registered under <strong>Unreserved Plan</strong> (Flexible Seat)</>
                    )}
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
            <div className="flex gap-2">
              <button onClick={() => setStep('form')} className="btn-secondary flex-1 justify-center py-3">
                Back
              </button>
              <button onClick={onConfirm} className="btn-primary flex-1 justify-center py-3">
                <CheckCircle2 size={16} />
                Confirm Admission
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
