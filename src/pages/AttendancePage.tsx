import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, X, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useAppStore } from '../store';
import { todayStr, formatShift } from '../lib/utils';
import type { Shift, AttendanceStatus } from '../types';
import toast from 'react-hot-toast';

const SHIFT_TABS: { key: Shift; label: string; time: string }[] = [
  { key: 'afternoon', label: 'Afternoon', time: '7:00 AM – 2:00 PM' },
  { key: 'evening', label: 'Evening', time: '2:00 PM – 9:00 PM' },
];

export default function AttendancePage() {
  const [date, setDate] = useState(todayStr());
  const [activeShift, setActiveShift] = useState<Shift>('afternoon');

  const students = useAppStore((s) => s.students);
  const assignments = useAppStore((s) => s.assignments);
  const attendance = useAppStore((s) => s.attendance);
  const markAttendance = useAppStore((s) => s.markAttendance);
  const markAllPresent = useAppStore((s) => s.markAllPresent);

  // Students for this shift
  const shiftStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.status !== 'active') return false;
      return assignments.some((a) => {
        if (a.studentId !== s.id || a.status !== 'active') return false;
        if (activeShift === 'afternoon') return a.shift === 'afternoon' || a.shift === 'fullday';
        if (activeShift === 'evening') return a.shift === 'evening' || a.shift === 'fullday';
        return false;
      });
    });
  }, [students, assignments, activeShift]);

  function getAttendanceStatus(studentId: string): AttendanceStatus {
    const record = attendance.find(
      (a) => a.studentId === studentId && a.date === date &&
        (a.shift === activeShift || a.shift === 'fullday')
    );
    return record?.status ?? 'unmarked';
  }

  function toggle(studentId: string) {
    const current = getAttendanceStatus(studentId);
    const next: AttendanceStatus = current === 'present' ? 'absent'
      : current === 'absent' ? 'unmarked'
      : 'present';
    markAttendance(studentId, date, activeShift, next);
  }

  const presentCount = shiftStudents.filter((s) => getAttendanceStatus(s.id) === 'present').length;
  const absentCount = shiftStudents.filter((s) => getAttendanceStatus(s.id) === 'absent').length;
  const unmarkedCount = shiftStudents.filter((s) => getAttendanceStatus(s.id) === 'unmarked').length;

  const dateDisplay = format(parseISO(date), 'd MMMM yyyy');

  // Date navigation
  function changeDate(delta: number) {
    const d = parseISO(date);
    d.setDate(d.getDate() + delta);
    setDate(format(d, 'yyyy-MM-dd'));
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      <div>
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">Mark daily attendance by shift</p>
      </div>

      {/* Date picker */}
      <div className="card p-4 flex items-center gap-3">
        <button onClick={() => changeDate(-1)} className="btn-ghost p-2">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 text-center">
          <p className="font-bold text-slate-900">{dateDisplay}</p>
          <p className="text-xs text-slate-400">{date === todayStr() ? 'Today' : ''}</p>
        </div>
        <button onClick={() => changeDate(1)} className="btn-ghost p-2" disabled={date >= todayStr()}>
          <ChevronRight size={18} />
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={todayStr()}
          className="input text-xs py-1.5 w-auto hidden sm:block"
        />
      </div>

      {/* Shift toggle */}
      <div className="flex gap-2">
        {SHIFT_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveShift(tab.key)}
            className={`flex-1 py-3 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
              activeShift === tab.key
                ? tab.key === 'afternoon'
                  ? 'bg-orange-50 border-orange-400 text-orange-700'
                  : 'bg-blue-50 border-blue-400 text-blue-700'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            <span className="block">{tab.label}</span>
            <span className="text-xs opacity-70">{tab.time}</span>
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Present', count: presentCount, color: 'bg-green-100 text-green-700' },
          { label: 'Absent', count: absentCount, color: 'bg-red-100 text-red-600' },
          { label: 'Unmarked', count: unmarkedCount, color: 'bg-slate-100 text-slate-600' },
        ].map((item) => (
          <div key={item.label} className={`${item.color} rounded-2xl p-3 text-center`}>
            <p className="text-2xl font-black">{item.count}</p>
            <p className="text-xs font-semibold mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Mark all present */}
      <button
        onClick={() => {
          markAllPresent(date, activeShift);
          toast.success(`All ${formatShift(activeShift)} students marked present`);
        }}
        className="btn-primary w-full justify-center"
      >
        <CheckCircle2 size={16} />
        Mark All Present
      </button>

      {/* Student list */}
      {shiftStudents.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">No students for this shift</p>
          <p className="text-sm text-slate-400 mt-1">Assign students to see them here</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-50">
          {shiftStudents.map((student) => {
            const status = getAttendanceStatus(student.id);
            return (
              <div key={student.id} className="flex items-center gap-3 px-4 py-3.5">
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                  status === 'present' ? 'bg-green-100 text-green-700'
                  : status === 'absent' ? 'bg-red-100 text-red-600'
                  : 'bg-slate-100 text-slate-500'
                }`}>
                  {student.name[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{student.name}</p>
                  <p className="text-xs text-slate-400">Seat {student.currentSeatId}</p>
                </div>

                {/* Status toggle */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => toggle(student.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                    status === 'present'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : status === 'absent'
                      ? 'bg-red-50 border-red-300 text-red-600'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {status === 'present' && <CheckCircle2 size={13} />}
                  {status === 'absent' && <X size={13} />}
                  {status === 'unmarked' && <div className="w-3 h-3 rounded-full border-2 border-slate-300" />}
                  {status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Tap to Mark'}
                </motion.button>
              </div>
            );
          })}
        </div>
      )}

      {/* Important note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-700">
        <strong>Note:</strong> Absent students retain their seat assignments. Absence does not free a seat.
      </div>
    </div>
  );
}
