import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { X, ChevronRight, User, Phone, Calendar, DollarSign, Clock, Armchair, ArrowRightLeft, CheckCircle2, AlertCircle, UserX } from 'lucide-react';
import { useAppStore, useLibraryStore } from '../../store';
import type { SeatAvailability } from '../../types';
import { formatShift, getShiftTiming, formatDisplayDate, todayStr, computeSeatAvailability } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface SeatDetailsDrawerProps {
  seatId: string;
  availability: SeatAvailability;
  selectedShift: 'afternoon' | 'evening' | 'fullday';
  onClose: () => void;
  onAssign?: () => void;
  date: string;
}

export default function SeatDetailsDrawer({
  seatId, availability, selectedShift, onClose, onAssign, date
}: SeatDetailsDrawerProps) {
  const navigate = useNavigate();
  const settings = useLibraryStore((s) => s.settings);
  const students = useAppStore((s) => s.students);
  const feeRecords = useAppStore((s) => s.feeRecords);
  const attendance = useAppStore((s) => s.attendance);
  const assignments = useAppStore((s) => s.assignments);

  // Get student for this shift
  const student = selectedShift === 'afternoon'
    ? (availability.fulldayStudent || availability.afternoonStudent)
    : selectedShift === 'evening'
    ? (availability.fulldayStudent || availability.eveningStudent)
    : availability.fulldayStudent;

  const isAvailable = !student;

  // Fee info
  const latestFee = student
    ? feeRecords
        .filter((f) => f.studentId === student.id && f.status !== 'paid')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
    : null;

  // Attendance today
  const todayAttendance = student
    ? attendance.find((a) => a.studentId === student.id && a.date === date)
    : null;

  // Fee status color
  const feeStatusColor = latestFee?.status === 'overdue'
    ? 'badge-red'
    : latestFee?.status === 'due'
    ? 'badge-orange'
    : latestFee?.status === 'upcoming'
    ? 'badge-blue'
    : latestFee?.status === 'paid'
    ? 'badge-green'
    : 'badge-green';

  const feeStatusLabel = latestFee?.status === 'overdue'
    ? 'Overdue'
    : latestFee?.status === 'due'
    ? 'Due Today'
    : latestFee?.status === 'upcoming'
    ? `Due ${formatDisplayDate(latestFee.dueDate)}`
    : 'Paid';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white shadow-2xl h-full flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className={`px-5 pt-5 pb-4 border-b border-slate-100 ${isAvailable ? 'bg-green-50/50' : ''}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black text-slate-900">{seatId}</span>
                <span className={`badge ${isAvailable ? 'badge-green' : selectedShift === 'afternoon' ? 'badge-orange' : selectedShift === 'evening' ? 'badge-blue' : 'badge-red'}`}>
                  {isAvailable ? 'Available' : formatShift(selectedShift)}
                </span>
              </div>
              <p className="text-sm text-slate-500">{getShiftTiming(selectedShift, settings)}</p>
            </div>
            <button onClick={onClose} className="btn-ghost p-1.5 -mr-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isAvailable ? (
            /* Available state */
            <div className="p-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Seat Available</h3>
              <p className="text-sm text-slate-500 mb-6">
                {seatId} is free for {formatShift(selectedShift)} on {formatDisplayDate(date)}.
              </p>

              {/* Show other shift occupancy if any */}
              <div className="text-left space-y-2 mb-6">
                {!availability.afternoon && availability.afternoonStudent && selectedShift !== 'afternoon' && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl">
                    <div className="status-dot-orange" />
                    <div>
                      <p className="text-xs font-semibold text-orange-700">Afternoon: {availability.afternoonStudent.name}</p>
                    </div>
                  </div>
                )}
                {!availability.evening && availability.eveningStudent && selectedShift !== 'evening' && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
                    <div className="status-dot-blue" />
                    <div>
                      <p className="text-xs font-semibold text-blue-700">Evening: {availability.eveningStudent.name}</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={onAssign}
                className="btn-primary w-full justify-center"
              >
                Assign This Seat
              </button>
            </div>
          ) : (
            /* Occupied state */
            <div className="p-5 space-y-4">
              {/* Student info */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-brand-700">{student!.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{student!.name}</p>
                  <p className="text-xs text-slate-500">{student!.phone}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`badge ${student!.status === 'active' ? 'badge-green' : 'badge-slate'} text-xs`}>
                      {student!.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2.5">
                <InfoRow icon={Armchair} label="Seat" value={`${student!.currentSeatId} · ${formatShift(student!.membershipType)}`} />
                <InfoRow icon={Clock} label="Timing" value={getShiftTiming(student!.membershipType, settings)} />
                <InfoRow icon={Calendar} label="Admission" value={formatDisplayDate(student!.admissionDate)} />
                <InfoRow icon={Phone} label="Phone" value={student!.phone} />
                <InfoRow
                  icon={DollarSign}
                  label="Monthly Fee"
                  value={`₹${student!.monthlyFee.toLocaleString('en-IN')}`}
                />
              </div>

              {/* Fee status */}
              {latestFee && (
                <div className={`p-3.5 rounded-xl border ${
                  latestFee.status === 'overdue'
                    ? 'bg-red-50 border-red-100'
                    : latestFee.status === 'due'
                    ? 'bg-orange-50 border-orange-100'
                    : 'bg-green-50 border-green-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {latestFee.status === 'overdue' || latestFee.status === 'due'
                        ? <AlertCircle size={15} className="text-red-500" />
                        : <CheckCircle2 size={15} className="text-green-500" />
                      }
                      <p className="text-sm font-semibold text-slate-800">Fee Status</p>
                    </div>
                    <span className={`badge ${feeStatusColor}`}>{feeStatusLabel}</span>
                  </div>
                </div>
              )}

              {/* Attendance today */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Today's Attendance</p>
                  <span className={`badge ${
                    todayAttendance?.status === 'present'
                      ? 'badge-green'
                      : todayAttendance?.status === 'absent'
                      ? 'badge-red'
                      : 'badge-slate'
                  }`}>
                    {todayAttendance?.status === 'present'
                      ? 'Present'
                      : todayAttendance?.status === 'absent'
                      ? 'Absent'
                      : 'Not Marked'}
                  </span>
                </div>
              </div>

              {/* Both shifts if partial */}
              {student!.membershipType !== 'fullday' && (availability.afternoonStudent || availability.eveningStudent) && (
                <div className="space-y-2">
                  {availability.afternoonStudent && (
                    <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl">
                      <div className="status-dot-orange" />
                      <p className="text-xs font-semibold text-orange-700">
                        Afternoon: {availability.afternoonStudent.name}
                      </p>
                    </div>
                  )}
                  {availability.eveningStudent && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
                      <div className="status-dot-blue" />
                      <p className="text-xs font-semibold text-blue-700">
                        Evening: {availability.eveningStudent.name}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions (when occupied) */}
        {!isAvailable && student && (
          <div className="p-4 border-t border-slate-100 space-y-2.5">
            <button
              onClick={() => { navigate(`/students/${student.id}`); onClose(); }}
              className="btn-primary w-full justify-center"
            >
              <User size={16} />
              View Student Profile
            </button>
            <button
              onClick={() => { navigate(`/students/${student.id}?action=change-seat`); onClose(); }}
              className="btn-secondary w-full justify-center"
            >
              <ArrowRightLeft size={16} />
              Change Seat
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-slate-500" />
      </div>
      <div className="flex-1 flex items-center justify-between">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
