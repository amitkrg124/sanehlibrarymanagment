import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, User, Phone, Calendar, Clock, IndianRupee, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAppStore, useLibraryStore } from '../../store';
import { formatShift, getShiftTiming, todayStr, formatDisplayDate } from '../../lib/utils';
import type { Shift } from '../../types';
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
  notes: z.string().optional(),
  verificationType: z.string().optional(),
  verificationId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EditStudentModalProps {
  studentId: string;
  onClose: () => void;
}

export default function EditStudentModal({ studentId, onClose }: EditStudentModalProps) {
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const settings = useLibraryStore((s) => s.settings);
  const student = useAppStore((s) => s.students.find(std => std.id === studentId));
  const updateStudent = useAppStore((s) => s.updateStudent);

  const defaultFee = (shift: Shift) =>
    shift === 'afternoon' ? settings.defaultAfternoonFee
    : shift === 'evening' ? settings.defaultEveningFee
    : settings.defaultFullDayFee;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: student?.name || '',
      phone: student?.phone || '',
      alternatePhone: student?.alternatePhone || '',
      email: student?.email || '',
      address: student?.address || '',
      admissionDate: student?.admissionDate || todayStr(),
      membershipType: student?.membershipType || 'afternoon',
      monthlyFee: student?.monthlyFee || 0,
      notes: student?.notes || '',
      verificationType: student?.verificationType || '',
      verificationId: student?.verificationId || '',
    },
  });

  const watchedShift = watch('membershipType');
  const [formData, setFormData] = useState<FormData | null>(null);

  // Update fee if membership type changes and it matches old default
  React.useEffect(() => {
    if (student && watchedShift !== student.membershipType) {
      setValue('monthlyFee', defaultFee(watchedShift as Shift));
    } else if (student) {
      setValue('monthlyFee', student.monthlyFee);
    }
  }, [watchedShift, student]);

  const onFormSubmit = (data: FormData) => {
    setFormData(data);
    setStep('confirm');
  };

  const onConfirm = () => {
    if (!formData || !student) return;
    updateStudent(student.id, {
      name: formData.name,
      phone: formData.phone,
      alternatePhone: formData.alternatePhone || undefined,
      email: formData.email || undefined,
      address: formData.address || undefined,
      admissionDate: formData.admissionDate,
      membershipType: formData.membershipType,
      monthlyFee: formData.monthlyFee,
      notes: formData.notes || undefined,
      verificationType: formData.verificationType || undefined,
      verificationId: formData.verificationId || undefined,
    });
    toast.success(`${formData.name}'s profile updated successfully!`);
    onClose();
  };

  if (!student) return null;

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
          <div>
            <h2 className="font-bold text-slate-900">
              {step === 'form' ? 'Edit Profile' : 'Confirm Changes'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {step === 'form' ? 'Update student details' : 'Review before saving'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'form' ? (
            <form
              onSubmit={handleSubmit(onFormSubmit)}
              className="space-y-4"
              id="edit-student-form"
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

              {/* Membership */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Membership</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Admission Date *</label>
                      <input {...register('admissionDate')} type="date" className="input" />
                      {errors.admissionDate && <p className="text-xs text-red-500 mt-1">{errors.admissionDate.message}</p>}
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
                    <p className="text-xs text-slate-500">{formData?.phone}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: 'Membership', value: formatShift(formData?.membershipType as Shift) },
                    { label: 'Timing', value: getShiftTiming(formData?.membershipType as Shift, settings) },
                    { label: 'Monthly Fee', value: `₹${formData?.monthlyFee?.toLocaleString('en-IN')}` },
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
        <div className="px-6 pb-5 pt-3 border-t border-slate-100 flex gap-2">
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
