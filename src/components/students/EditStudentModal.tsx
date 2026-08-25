import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { X, ChevronRight, Armchair, Sparkles } from 'lucide-react';
import { useAppStore, useLibraryStore } from '../../store';
import { formatShift, formatDisplayDate, getShiftTiming } from '../../lib/utils';
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
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EditStudentModalProps {
  studentId: string;
  onClose: () => void;
}

export default function EditStudentModal({ studentId, onClose }: EditStudentModalProps) {
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [formData, setFormData] = useState<FormData | null>(null);

  const student = useAppStore((s) => s.students.find((st) => st.id === studentId));
  const updateStudent = useAppStore((s) => s.updateStudent);
  const settings = useLibraryStore((s) => s.settings);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: student?.name || '',
      registrationNo: student?.registrationNo || '',
      phone: student?.phone || '',
      alternatePhone: student?.alternatePhone || '',
      email: student?.email || '',
      address: student?.address || '',
      verificationType: student?.verificationType || '',
      verificationId: student?.verificationId || '',
      admissionDate: student?.admissionDate || '',
      seatType: student?.seatType || (student?.currentSeatId ? 'reserved' : (student?.membershipType === 'unreserved' ? 'unreserved' : 'reserved')),
      membershipType: student?.membershipType || 'afternoon',
      planHours: student?.planHours || '2 Hours Plan',
      monthlyFee: student?.monthlyFee || 0,
      notes: student?.notes || '',
    },
  });

  const watchedShift = watch('membershipType');
  const watchedSeatType = watch('seatType');

  if (!student) return null;

  const onFormSubmit = (data: FormData) => {
    setFormData(data);
    setStep('confirm');
  };

  const onConfirm = () => {
    if (!formData) return;

    const isReserved = formData.seatType === 'reserved';
    const effectiveShift = isReserved ? (formData.membershipType as Shift) : 'unreserved';

    updateStudent(student.id, {
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
      notes: formData.notes?.trim() || undefined,
      verificationType: formData.verificationType || undefined,
      verificationId: formData.verificationId || undefined,
    });

    toast.success('Student details updated successfully!');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ y: 30, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 30, scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-xl max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col z-10 my-auto overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {step === 'form' ? 'Edit Student Details' : 'Confirm Updates'}
            </h2>
            <p className="text-xs text-slate-400">
              {step === 'form' ? 'Update personal, registration and membership information' : 'Review changes before saving'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {step === 'form' ? (
            <form id="edit-student-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
              {/* Personal Info */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Personal Details</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="label">Full Name *</label>
                      <input {...register('name')} className="input" placeholder="Full name" />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="label">Reg. Number</label>
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

              {/* Membership & Category */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Seat Category & Membership</p>
                
                {/* Category selector */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      watchedSeatType === 'reserved'
                        ? 'bg-brand-50 border-brand-600 text-brand-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value="reserved"
                      {...register('seatType')}
                      onChange={() => {
                        setValue('seatType', 'reserved');
                        if (watchedShift === 'unreserved') setValue('membershipType', 'afternoon');
                      }}
                      className="sr-only"
                    />
                    <Armchair size={16} className="mt-0.5 text-brand-700" />
                    <div>
                      <p className="text-xs font-bold">Reserved Seat</p>
                      <p className="text-[10px] text-slate-500">Fixed seat ({student.currentSeatId || 'Assigned'})</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      watchedSeatType === 'unreserved'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value="unreserved"
                      {...register('seatType')}
                      onChange={() => {
                        setValue('seatType', 'unreserved');
                        setValue('membershipType', 'unreserved');
                      }}
                      className="sr-only"
                    />
                    <Sparkles size={16} className="mt-0.5 text-amber-600" />
                    <div>
                      <p className="text-xs font-bold">Unreserved / Floating</p>
                      <p className="text-[10px] text-slate-500">Flexible 2hr/4hr/floating</p>
                    </div>
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Admission Date *</label>
                      <input {...register('admissionDate')} type="date" className="input" />
                      {errors.admissionDate && <p className="text-xs text-red-500 mt-1">{errors.admissionDate.message}</p>}
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

                  {watchedSeatType === 'reserved' ? (
                    <div>
                      <label className="label">Batch Timing *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['afternoon', 'evening', 'fullday'] as Shift[]).map((s) => (
                          <label
                            key={s}
                            className={`flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              watchedShift === s
                                ? s === 'afternoon' ? 'bg-orange-50 border-orange-400 text-orange-700'
                                  : s === 'evening' ? 'bg-blue-50 border-blue-400 text-blue-700'
                                  : 'bg-purple-50 border-purple-400 text-purple-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
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
                  ) : (
                    <div>
                      <label className="label">Unreserved Plan Hours</label>
                      <input
                        {...register('planHours')}
                        className="input"
                        placeholder="e.g. 2 Hours, 4 Hours, Flexible"
                      />
                    </div>
                  )}

                  <div>
                    <label className="label">Notes (Optional)</label>
                    <textarea {...register('notes')} className="input resize-none" rows={2} placeholder="e.g. UPSC preparation" />
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
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
                      { label: 'Seat', value: student.currentSeatId || 'Reserved' },
                      { label: 'Membership', value: formatShift(formData?.membershipType as Shift) },
                      { label: 'Timing', value: getShiftTiming(formData?.membershipType as Shift, settings) },
                    ] : [
                      { label: 'Plan', value: formData?.planHours || 'Flexible Unreserved' },
                    ]),
                    { label: 'Monthly Fee', value: `?${formData?.monthlyFee?.toLocaleString('en-IN')}` },
                    { label: 'Admission Date', value: formData?.admissionDate ? formatDisplayDate(formData.admissionDate) : '' },
                    ...(formData?.address ? [{ label: 'Address', value: formData.address }] : []),
                    ...(formData?.verificationType ? [{ label: 'Document', value: `${formData.verificationType} (${formData.verificationId})` }] : []),
                  ].map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-4">
                      <span className="text-sm text-slate-500 flex-shrink-0">{row.label}</span>
                      <span className="text-sm font-bold text-slate-900 text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-slate-100 bg-white sticky bottom-0 z-10 flex gap-2">
          {step === 'form' ? (
            <button
              type="submit"
              form="edit-student-form"
              className="btn-primary w-full justify-center"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <>
              <button onClick={() => setStep('form')} className="btn-secondary flex-1 justify-center">
                Back
              </button>
              <button onClick={onConfirm} className="btn-primary flex-1 justify-center">
                Save Changes
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
