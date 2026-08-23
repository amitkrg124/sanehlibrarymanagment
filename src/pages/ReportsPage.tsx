import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { BarChart3, TrendingUp, Users, Armchair, IndianRupee } from 'lucide-react';
import { useAppStore } from '../store';
import { computeSeatAvailability, countAvailableSeats, formatShift, todayStr } from '../lib/utils';
import type { Shift } from '../types';

export default function ReportsPage() {
  const [reportMonth, setReportMonth] = useState(format(new Date(), 'yyyy-MM'));
  const students = useAppStore((s) => s.students);
  const assignments = useAppStore((s) => s.assignments);
  const feeRecords = useAppStore((s) => s.feeRecords);
  const attendance = useAppStore((s) => s.attendance);

  const today = todayStr();
  const availabilityMap = useMemo(
    () => computeSeatAvailability(today, assignments, students),
    [today, assignments, students]
  );

  // Occupancy
  const afternoonOccupied = 30 - countAvailableSeats(availabilityMap, 'afternoon');
  const eveningOccupied = 30 - countAvailableSeats(availabilityMap, 'evening');
  const fulldayOccupied = 30 - countAvailableSeats(availabilityMap, 'fullday');

  // Fee report for the selected month
  const monthStr = reportMonth;
  const monthFees = feeRecords.filter((f) => f.periodStart.startsWith(monthStr) || f.dueDate.startsWith(monthStr));
  const totalBilled = monthFees.reduce((s, f) => s + f.amount, 0);
  const totalCollected = monthFees.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
  const totalPending = monthFees.filter((f) => f.status !== 'paid').reduce((s, f) => s + f.amount, 0);
  const totalOverdue = monthFees.filter((f) => f.status === 'overdue').reduce((s, f) => s + f.amount, 0);

  // Attendance report
  const monthAttendance = attendance.filter((a) => a.date.startsWith(monthStr));
  const presentDays = monthAttendance.filter((a) => a.status === 'present').length;
  const absentDays = monthAttendance.filter((a) => a.status === 'absent').length;
  const totalMarked = presentDays + absentDays;
  const overallRate = totalMarked > 0 ? Math.round((presentDays / totalMarked) * 100) : 0;

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Analytics and summaries</p>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3">
        <label className="label mb-0 flex-shrink-0">Report Month:</label>
        <input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} className="input w-auto text-sm" />
      </div>

      {/* Seat Occupancy */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Armchair size={18} className="text-brand-600" />
          <h2 className="section-heading mb-0">Seat Occupancy (Today)</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Total Seats', total: 30, occupied: afternoonOccupied + eveningOccupied, available: 30, pct: 0, color: 'bg-slate-200' },
            { label: 'Afternoon', total: 30, occupied: afternoonOccupied, available: 30 - afternoonOccupied, pct: Math.round((afternoonOccupied / 30) * 100), color: 'bg-orange-400' },
            { label: 'Evening', total: 30, occupied: eveningOccupied, available: 30 - eveningOccupied, pct: Math.round((eveningOccupied / 30) * 100), color: 'bg-blue-500' },
            { label: 'Full Day', total: 30, occupied: fulldayOccupied, available: 30 - fulldayOccupied, pct: Math.round((fulldayOccupied / 30) * 100), color: 'bg-purple-500' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                <span className="text-xs text-slate-500">{item.occupied} / {item.total} occupied · {item.available} free</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full ${item.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student breakdown */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-brand-600" />
          <h2 className="section-heading mb-0">Student Breakdown</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', count: students.length, color: 'bg-slate-100 text-slate-700' },
            { label: 'Active', count: students.filter((s) => s.status === 'active').length, color: 'bg-green-100 text-green-700' },
            { label: 'Afternoon', count: students.filter((s) => s.status === 'active' && s.membershipType === 'afternoon').length, color: 'bg-orange-100 text-orange-700' },
            { label: 'Evening', count: students.filter((s) => s.status === 'active' && s.membershipType === 'evening').length, color: 'bg-blue-100 text-blue-700' },
            { label: 'Full Day', count: students.filter((s) => s.status === 'active' && s.membershipType === 'fullday').length, color: 'bg-purple-100 text-purple-700' },
            { label: 'Inactive', count: students.filter((s) => s.status === 'inactive').length, color: 'bg-slate-100 text-slate-500' },
          ].map((item) => (
            <div key={item.label} className={`${item.color} rounded-2xl p-4 text-center`}>
              <p className="text-2xl font-black">{item.count}</p>
              <p className="text-xs font-semibold mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fee report */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <IndianRupee size={18} className="text-brand-600" />
          <h2 className="section-heading mb-0">Fee Report – {format(parseISO(`${reportMonth}-01`), 'MMMM yyyy')}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Billed', value: `₹${totalBilled.toLocaleString('en-IN')}`, color: 'bg-slate-100 text-slate-700' },
            { label: 'Collected', value: `₹${totalCollected.toLocaleString('en-IN')}`, color: 'bg-green-100 text-green-700' },
            { label: 'Pending', value: `₹${totalPending.toLocaleString('en-IN')}`, color: 'bg-orange-100 text-orange-700' },
            { label: 'Overdue', value: `₹${totalOverdue.toLocaleString('en-IN')}`, color: 'bg-red-100 text-red-600' },
          ].map((item) => (
            <div key={item.label} className={`${item.color} rounded-2xl p-4 text-center`}>
              <p className="text-xl font-black">{item.value}</p>
              <p className="text-xs font-semibold mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-slate-700">Collection Rate</span>
            <span className="text-sm font-bold text-slate-900">{totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0}%` }}
              transition={{ duration: 0.6 }}
              className="h-full rounded-full bg-green-500"
            />
          </div>
        </div>
      </div>

      {/* Attendance report */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-brand-600" />
          <h2 className="section-heading mb-0">Attendance Report – {format(parseISO(`${reportMonth}-01`), 'MMMM yyyy')}</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Present Days', value: presentDays, color: 'bg-green-100 text-green-700' },
            { label: 'Absent Days', value: absentDays, color: 'bg-red-100 text-red-600' },
            { label: 'Overall Rate', value: `${overallRate}%`, color: 'bg-brand-100 text-brand-700' },
          ].map((item) => (
            <div key={item.label} className={`${item.color} rounded-2xl p-4 text-center`}>
              <p className="text-2xl font-black">{item.value}</p>
              <p className="text-xs font-semibold mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Per-student attendance */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Student-wise Attendance</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {students.filter((s) => s.status === 'active').map((student) => {
              const studentAtt = monthAttendance.filter((a) => a.studentId === student.id);
              const present = studentAtt.filter((a) => a.status === 'present').length;
              const total = studentAtt.length;
              const rate = total > 0 ? Math.round((present / total) * 100) : 0;
              return (
                <div key={student.id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand-700">
                    {student.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{student.name}</p>
                      <span className={`text-xs font-bold ml-2 ${rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
                        {present}/{total} · {rate}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-full rounded-full ${rate >= 80 ? 'bg-green-400' : rate >= 60 ? 'bg-orange-400' : 'bg-red-400'}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
