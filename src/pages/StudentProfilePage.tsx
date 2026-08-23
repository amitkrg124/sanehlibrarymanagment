import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, Armchair, Clock,
  IndianRupee, ClipboardList, History, ArrowRightLeft, UserX,
  CheckCircle2, AlertCircle, Edit2, MessageSquare, Copy, Check
} from 'lucide-react';
import { useAppStore, useLibraryStore } from '../store';
import { formatShift, getShiftTiming, formatDisplayDate, todayStr, generateReminderMessage } from '../lib/utils';
import type { Shift } from '../types';
import { format, parseISO, getDaysInMonth, startOfMonth } from 'date-fns';
import ChangeSeatModal from '../components/students/ChangeSeatModal';
import RecordPaymentModal from '../components/fees/RecordPaymentModal';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Fees', 'Attendance', 'Seat History'] as const;
type Tab = typeof TABS[number];

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(
    searchParams.get('action') === 'change-seat' ? 'Seat History' : 'Overview'
  );
  const [showChangeSeat, setShowChangeSeat] = useState(searchParams.get('action') === 'change-seat');
  const [showPayment, setShowPayment] = useState(false);
  const [copiedReminder, setCopiedReminder] = useState(false);
  const [attendanceMonth, setAttendanceMonth] = useState(format(new Date(), 'yyyy-MM'));

  const settings = useLibraryStore((s) => s.settings);
  const students = useAppStore((s) => s.students);
  const allFeeRecords = useAppStore((s) => s.feeRecords);
  const allAttendance = useAppStore((s) => s.attendance);
  const allAssignments = useAppStore((s) => s.assignments);
  const deactivateStudent = useAppStore((s) => s.deactivateStudent);
  const updateStudent = useAppStore((s) => s.updateStudent);

  const student = React.useMemo(() => students.find((s) => s.id === id), [students, id]);

  const feeRecords = React.useMemo(() =>
    allFeeRecords.filter((f) => f.studentId === id).sort((a, b) => b.periodStart.localeCompare(a.periodStart)),
    [allFeeRecords, id]
  );

  const attendanceRecords = React.useMemo(() =>
    allAttendance.filter((a) => a.studentId === id),
    [allAttendance, id]
  );

  const assignmentHistory = React.useMemo(() =>
    allAssignments.filter((a) => a.studentId === id).sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [allAssignments, id]
  );

  const latestFee = React.useMemo(() => {
    const records = allFeeRecords.filter((f) => f.studentId === id && f.status !== 'paid');
    return records.sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  }, [allFeeRecords, id]);

  if (!student) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Student not found.</p>
        <button onClick={() => navigate('/students')} className="btn-primary mt-4">Back to Students</button>
      </div>
    );
  }

  const presentCount = attendanceRecords.filter((a) => a.status === 'present').length;
  const absentCount = attendanceRecords.filter((a) => a.status === 'absent').length;
  const attendanceRate = attendanceRecords.length > 0
    ? Math.round((presentCount / attendanceRecords.length) * 100)
    : 0;

  // Attendance calendar for selected month
  const monthAttendance = attendanceRecords.filter((a) => a.date.startsWith(attendanceMonth));
  const daysInMonth = getDaysInMonth(parseISO(`${attendanceMonth}-01`));
  const firstDay = startOfMonth(parseISO(`${attendanceMonth}-01`)).getDay();

  function copyReminder() {
    if (!latestFee) return;
    const msg = generateReminderMessage(student!.name, latestFee.amount, latestFee.dueDate, settings.libraryName);
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedReminder(true);
      toast.success('Reminder message copied!');
      setTimeout(() => setCopiedReminder(false), 3000);
    });
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-6 max-w-3xl">
      {/* Back */}
      <button onClick={() => navigate('/students')} className="btn-ghost -ml-2">
        <ArrowLeft size={16} />
        Students
      </button>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-5"
      >
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-black text-brand-700">{student.name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
              <span className={`badge ${student.status === 'active' ? 'badge-green' : 'badge-slate'}`}>
                {student.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {student.currentSeatId && (
                <span className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Armchair size={14} /> Seat {student.currentSeatId}
                </span>
              )}
              <span className={`flex items-center gap-1.5 text-sm font-semibold ${
                student.membershipType === 'afternoon' ? 'text-orange-700'
                : student.membershipType === 'evening' ? 'text-blue-700'
                : 'text-purple-700'
              }`}>
                <Clock size={14} /> {formatShift(student.membershipType)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 flex-wrap">
          <button onClick={() => setShowChangeSeat(true)} className="btn-secondary text-xs gap-1.5">
            <ArrowRightLeft size={14} /> Change Seat
          </button>
          <button onClick={() => setShowPayment(true)} className="btn-secondary text-xs gap-1.5">
            <IndianRupee size={14} /> Record Payment
          </button>
          {latestFee && (
            <button onClick={copyReminder} className="btn-secondary text-xs gap-1.5">
              {copiedReminder ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              Copy Reminder
            </button>
          )}
          {student.status === 'active' ? (
            <button
              onClick={() => {
                if (confirm(`Deactivate ${student.name}? Their seat will be freed.`)) {
                  deactivateStudent(student.id);
                  toast.success(`${student.name} has been deactivated.`);
                }
              }}
              className="btn-secondary text-xs text-red-600 hover:bg-red-50 border-red-200 gap-1.5 ml-auto"
            >
              <UserX size={14} /> Deactivate Profile
            </button>
          ) : (
            <button
              onClick={() => {
                updateStudent(student.id, { status: 'active' });
                toast.success(`${student.name} has been re-activated.`);
              }}
              className="btn-secondary text-xs text-emerald-600 hover:bg-emerald-50 border-emerald-200 gap-1.5 ml-auto"
            >
              <UserX size={14} className="rotate-180" /> Activate Profile
            </button>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-slate-100 p-1 rounded-xl">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* ── Overview ── */}
          {activeTab === 'Overview' && (
            <div className="space-y-4">
              <div className="card p-5">
                <h3 className="section-heading">Contact Information</h3>
                <div className="space-y-3">
                  <InfoRow icon={Phone} label="Mobile" value={student.phone} />
                  {student.alternatePhone && <InfoRow icon={Phone} label="Alternate" value={student.alternatePhone} />}
                  {student.email && <InfoRow icon={Mail} label="Email" value={student.email} />}
                  {student.address && <InfoRow icon={MapPin} label="Address" value={student.address} />}
                </div>
              </div>
              <div className="card p-5">
                <h3 className="section-heading">Membership Details</h3>
                <div className="space-y-3">
                  <InfoRow icon={Calendar} label="Admission Date" value={formatDisplayDate(student.admissionDate)} />
                  <InfoRow icon={Clock} label="Shift" value={`${formatShift(student.membershipType)} · ${getShiftTiming(student.membershipType, settings)}`} />
                  {student.currentSeatId && <InfoRow icon={Armchair} label="Seat" value={student.currentSeatId} />}
                  <InfoRow icon={IndianRupee} label="Monthly Fee" value={`₹${student.monthlyFee.toLocaleString('en-IN')}`} />
                  {student.notes && <InfoRow icon={MessageSquare} label="Notes" value={student.notes} />}
                </div>
              </div>
            </div>
          )}

          {/* ── Fees ── */}
          {activeTab === 'Fees' && (
            <div className="space-y-3">
              {/* Summary */}
              {latestFee && (
                <div className={`card p-4 border-2 ${
                  latestFee.status === 'overdue' ? 'border-red-200 bg-red-50/50'
                  : latestFee.status === 'due' ? 'border-orange-200 bg-orange-50/50'
                  : 'border-blue-200 bg-blue-50/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Current Due</p>
                      <p className="text-2xl font-black text-slate-900 mt-0.5">₹{latestFee.amount.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Due: {formatDisplayDate(latestFee.dueDate)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`badge ${latestFee.status === 'overdue' ? 'badge-red' : latestFee.status === 'due' ? 'badge-orange' : 'badge-blue'}`}>
                        {latestFee.status === 'overdue' ? 'Overdue' : latestFee.status === 'due' ? 'Due Today' : 'Upcoming'}
                      </span>
                      <button onClick={() => setShowPayment(true)} className="btn-primary text-xs py-1.5 px-3 justify-center">
                        Mark Paid
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* History */}
              <div className="card p-5">
                <h3 className="section-heading">Payment History</h3>
                {feeRecords.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No fee records yet</p>
                ) : (
                  <div className="space-y-3">
                    {feeRecords.map((fee) => (
                      <div key={fee.id} className="flex items-start justify-between gap-3 py-3 border-b border-slate-50 last:border-0">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {formatDisplayDate(fee.periodStart)} – {formatDisplayDate(fee.periodEnd)}
                          </p>
                          {fee.paidDate && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              Paid on {formatDisplayDate(fee.paidDate)} · {fee.paymentMethod || 'Cash'}
                            </p>
                          )}
                          {!fee.paidDate && (
                            <p className="text-xs text-slate-400 mt-0.5">Due: {formatDisplayDate(fee.dueDate)}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-slate-900">₹{fee.amount.toLocaleString('en-IN')}</p>
                          <span className={`badge text-xs mt-1 ${
                            fee.status === 'paid' ? 'badge-green'
                            : fee.status === 'overdue' ? 'badge-red'
                            : fee.status === 'due' ? 'badge-orange'
                            : 'badge-blue'
                          }`}>
                            {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Attendance ── */}
          {activeTab === 'Attendance' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card p-4 text-center">
                  <p className="text-2xl font-black text-green-600">{presentCount}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Present</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-2xl font-black text-red-500">{absentCount}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Absent</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-2xl font-black text-brand-600">{attendanceRate}%</p>
                  <p className="text-xs text-slate-500 mt-0.5">Rate</p>
                </div>
              </div>

              {/* Calendar */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-heading mb-0">{format(parseISO(`${attendanceMonth}-01`), 'MMMM yyyy')}</h3>
                  <input
                    type="month"
                    value={attendanceMonth}
                    onChange={(e) => setAttendanceMonth(e.target.value)}
                    className="input text-xs py-1.5 w-auto"
                  />
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${attendanceMonth}-${day.toString().padStart(2, '0')}`;
                    const record = monthAttendance.find((a) => a.date === dateStr);
                    return (
                      <div
                        key={day}
                        className={`aspect-square flex items-center justify-center rounded-lg text-xs font-semibold ${
                          record?.status === 'present'
                            ? 'bg-green-100 text-green-700'
                            : record?.status === 'absent'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                        title={record?.status || 'No record'}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-4 mt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100" /> Present</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100" /> Absent</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100" /> No record</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Seat History ── */}
          {activeTab === 'Seat History' && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-heading mb-0">Seat History</h3>
                <button onClick={() => setShowChangeSeat(true)} className="btn-secondary text-xs gap-1.5">
                  <ArrowRightLeft size={14} /> Change Seat
                </button>
              </div>
              {assignmentHistory.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No seat history yet</p>
              ) : (
                <div className="space-y-3 relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100" />
                  {assignmentHistory.map((asgn) => (
                    <div key={asgn.id} className="flex items-start gap-4 relative">
                      <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 z-10 ${
                        asgn.status === 'active' ? 'bg-green-500' : 'bg-slate-300'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{asgn.seatId}</span>
                          <span className={`badge text-xs ${
                            asgn.shift === 'afternoon' ? 'badge-orange'
                            : asgn.shift === 'evening' ? 'badge-blue'
                            : 'badge-purple'
                          }`}>
                            {formatShift(asgn.shift)}
                          </span>
                          {asgn.status === 'active' && <span className="badge-green text-xs">Current</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          From {formatDisplayDate(asgn.startDate)}
                          {asgn.endDate ? ` → ${formatDisplayDate(asgn.endDate)}` : ' · Ongoing'}
                        </p>
                        {asgn.status === 'transferred' && (
                          <p className="text-xs text-slate-400">Seat transferred</p>
                        )}
                        {asgn.status === 'ended' && (
                          <p className="text-xs text-slate-400">Membership ended</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showChangeSeat && (
          <ChangeSeatModal studentId={student.id} onClose={() => setShowChangeSeat(false)} />
        )}
        {showPayment && latestFee && (
          <RecordPaymentModal feeId={latestFee.id} studentName={student.name} onClose={() => setShowPayment(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={13} className="text-slate-500" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}
