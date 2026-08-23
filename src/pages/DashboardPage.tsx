import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import {
  Users, Armchair, TrendingUp, IndianRupee, ClipboardList, Plus,
  Search, Calendar, Zap, ChevronRight, AlertCircle, CheckCircle2,
  Clock, UserPlus, DollarSign, HelpCircle, MapPin
} from 'lucide-react';
import { useAppStore, useLibraryStore } from '../store';
import {
  computeSeatAvailability,
  countAvailableSeats,
  ALL_SEAT_IDS,
  SECTION_LAYOUT,
  todayStr,
  formatShift,
  formatDisplayDate
} from '../lib/utils';
import type { Shift, SeatAvailability } from '../types';
import { useNavigate } from 'react-router-dom';
import AddStudentModal from '../components/students/AddStudentModal';
import SeatDetailsDrawer from '../components/seats/SeatDetailsDrawer';
import RecordPaymentModal from '../components/fees/RecordPaymentModal';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [addStudentSeat, setAddStudentSeat] = useState<{ seatId: string; shift: Shift } | null>(null);
  const [payingFee, setPayingFee] = useState<{ feeId: string; studentName: string } | null>(null);
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<'all' | 'afternoon' | 'evening' | 'fullday'>('all');
  const [searchHighlight, setSearchHighlight] = useState('');

  const students = useAppStore((s) => s.students);
  const assignments = useAppStore((s) => s.assignments);
  const feeRecords = useAppStore((s) => s.feeRecords);
  const attendance = useAppStore((s) => s.attendance);
  const enquiries = useAppStore((s) => s.enquiries);
  const disabledSeats = useAppStore((s) => s.disabledSeats);

  const today = todayStr();
  const todayDisplay = format(new Date(), 'EEE, d MMM. yyyy');

  // Compute seat availability
  const availabilityMap = useMemo(
    () => computeSeatAvailability(today, assignments, students),
    [today, assignments, students]
  );

  const selectedAvailability = selectedSeat ? availabilityMap[selectedSeat] : null;

  // Vacancy stats
  const availableAfternoon = countAvailableSeats(availabilityMap, 'afternoon');
  const availableEvening = countAvailableSeats(availabilityMap, 'evening');
  const availableFullday = countAvailableSeats(availabilityMap, 'fullday');
  const totalOccupied = ALL_SEAT_IDS.filter((id) => {
    const a = availabilityMap[id];
    return a && (!a.afternoon || !a.evening || !!a.fulldayStudent);
  }).length;

  // Fee Stats
  const activeStudents = students.filter((s) => s.status === 'active');
  const totalBilled = activeStudents.reduce((sum, s) => sum + s.monthlyFee, 0);
  const collectedThisMonth = feeRecords
    .filter((f) => f.status === 'paid' && f.paidDate && f.paidDate.startsWith(today.slice(0, 7)))
    .reduce((sum, f) => sum + f.amount, 0);

  const overdueFees = feeRecords.filter((f) => f.status === 'overdue');
  const totalOverdueAmount = overdueFees.reduce((sum, f) => sum + f.amount, 0);

  // Overdue alerts (limit 5)
  const overdueAlerts = useMemo(() => {
    return overdueFees
      .slice(0, 5)
      .map((f) => {
        const student = students.find((s) => s.id === f.studentId);
        return { fee: f, student };
      })
      .filter((x) => x.student);
  }, [overdueFees, students]);

  // Roll call stats
  const markedTodayCount = attendance.filter((a) => a.date === today).length;
  const activeCount = activeStudents.length;

  // Enquiries stats
  const activeEnquiries = enquiries.filter((e) => e.status === 'new' || e.status === 'followup');

  // helper function to class seat cell
  function getSeatStatusText(seatId: string): string {
    if (disabledSeats.includes(seatId)) return 'Disabled';
    const avail = availabilityMap[seatId];
    if (!avail) return 'All Free';

    if (avail.fulldayStudent) return 'Full Day';
    if (!avail.afternoon && !avail.evening) return 'Aft + Eve';
    if (!avail.afternoon) return 'Aft Occupied';
    if (!avail.evening) return 'Eve Occupied';

    return 'All Free';
  }

  function getSeatClass(seatId: string): string {
    if (disabledSeats.includes(seatId)) return 'border-slate-200 bg-slate-100 text-slate-400';
    const avail = availabilityMap[seatId];
    if (!avail) return 'border-green-200 bg-green-50 text-green-700 hover:border-green-400';

    if (avail.fulldayStudent) return 'border-pink-200 bg-pink-50 text-pink-700 hover:border-pink-400';
    if (!avail.afternoon && !avail.evening) return 'border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-400';
    if (!avail.afternoon || !avail.evening) return 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400';

    return 'border-green-200 bg-green-50 text-green-700 hover:border-green-400';
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-12">
      
      {/* ── Dark Brown Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#2d1b10] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl"
      >
        {/* Background decorative ring */}
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-[#8c3d19]/20 rounded-full blur-3xl -z-10" />
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#e49d68]/20 text-[#f5dcd0] border border-[#e49d68]/30 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Saneh Desk Live
              </span>
              <span className="text-xs text-slate-300 font-semibold">{todayDisplay}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-amber-50 leading-tight">
              Instant Seat Allocation & Library Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              When a prospective student asks for a seat, instantly check vacancies for{' '}
              <strong className="text-white">Afternoon (7 AM–2 PM)</strong>,{' '}
              <strong className="text-white">Evening (2 PM–9 PM)</strong>, or{' '}
              <strong className="text-white">Full Day</strong> and register in seconds.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                const el = document.getElementById('floor-map-anchor');
                el?.scrollIntoView({ behavior: 'smooth' });
                toast.success('Scroll down to check map');
              }}
              className="bg-[#8c3d19] hover:bg-[#a64a20] text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg"
            >
              <Search size={14} />
              Find Available Seat
            </button>
            <button
              onClick={() => setShowAddStudent(true)}
              className="bg-white/10 hover:bg-white/15 text-slate-100 border border-white/20 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <UserPlus size={14} />
              New Admission
            </button>
            <button
              onClick={() => navigate('/fees')}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-md"
            >
              <IndianRupee size={14} />
              Record Fee
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Stats Metric Cards Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* TOTAL SEATS */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
            <Armchair size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Seats</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">30 <span className="text-xs font-normal text-slate-500">Desks</span></p>
            <p className="text-[10px] text-slate-400 mt-0.5">Sections A to F</p>
          </div>
        </div>

        {/* AFTERNOON VACANT */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Afternoon Vacant</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {availableAfternoon} <span className="text-xs font-normal text-slate-400">/ 30 free</span>
            </p>
            <p className="text-[10px] text-orange-600 font-semibold mt-0.5">7:00 AM – 2:00 PM</p>
          </div>
        </div>

        {/* EVENING VACANT */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Evening Vacant</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {availableEvening} <span className="text-xs font-normal text-slate-400">/ 30 free</span>
            </p>
            <p className="text-[10px] text-blue-600 font-semibold mt-0.5">2:00 PM – 9:00 PM</p>
          </div>
        </div>

        {/* FULL DAY VACANT */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center flex-shrink-0">
            <Zap size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Full Day Vacant</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {availableFullday} <span className="text-xs font-normal text-slate-400">/ 30 free</span>
            </p>
            <p className="text-[10px] text-pink-600 font-semibold mt-0.5">Both Shifts (7AM–9PM)</p>
          </div>
        </div>

        {/* FEE COLLECTION */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-start gap-3 col-span-2 md:col-span-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <IndianRupee size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Fee Collection</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              ₹{collectedThisMonth.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-red-500 font-bold mt-0.5">
              {overdueFees.length} Overdue (₹{totalOverdueAmount})
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Dashboard Double-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="floor-map-anchor">
        
        {/* LEFT COLUMN: Interactive Floor Plan (Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Interactive Floor Plan (30 Desks)</h2>
              <p className="text-xs text-slate-500 font-medium">
                Click any desk to view student details, shift timing, transfer seat, or mark fees
              </p>
            </div>
            
            {/* Shift filters */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {(['all', 'afternoon', 'evening', 'fullday'] as const).map((filterVal) => (
                <button
                  key={filterVal}
                  onClick={() => setSelectedShiftFilter(filterVal)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedShiftFilter === filterVal
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {filterVal === 'all' ? 'All Status'
                    : filterVal === 'afternoon' ? 'Afternoon'
                    : filterVal === 'evening' ? 'Evening'
                    : 'Full Day'}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Layout Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
            
            {/* Floor Map Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="text-[#8c3d19]" size={16} />
                <div>
                  <p className="text-xs font-black text-slate-800">Saneh Library Floor Layout</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Physical layout blueprint</p>
                </div>
                <span className="bg-slate-200 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-1">
                  30 Seats
                </span>
              </div>

              {/* Date & Search picker */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">Checking Date:</span>
                <input
                  type="date"
                  value={today}
                  disabled
                  className="bg-white border border-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 text-slate-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick slots list & Highlights */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Legend with counts */}
              <div className="flex flex-wrap gap-3 font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Available ({30 - totalOccupied})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                  Afternoon ({30 - availableAfternoon})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Evening ({30 - availableEvening})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  Full Day ({30 - availableFullday})
                </span>
              </div>

              {/* Search highlight */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Highlight seat..."
                  value={searchHighlight}
                  onChange={(e) => setSearchHighlight(e.target.value.toUpperCase())}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-slate-300 w-36"
                />
              </div>
            </div>

            {/* Amenities indicators */}
            <div className="flex justify-between text-[10px] text-slate-400 font-bold border-b border-dashed border-slate-100 pb-2">
              <span>❄️ Silent Split AC Unit #1 (East Wall)</span>
              <span>📶 300 Mbps Fiber Wi-Fi - QUIET STUDY HALL</span>
              <span>❄️ Silent Split AC Unit #2 (West Wall)</span>
            </div>

            {/* Section Grid Layout */}
            <div className="space-y-5 pt-2">
              {SECTION_LAYOUT.map((section) => {
                const desks = [...section.leftSeats, null, ...section.rightSeats];

                return (
                  <div key={section.id} className="space-y-2 border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 tracking-wide uppercase">
                        🔴 SECTION {section.id} — {section.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold italic">
                        {section.feature}
                      </span>
                    </div>

                    <div className="grid grid-cols-6 gap-3 items-center">
                      {desks.map((seatId, idx) => {
                        if (!seatId) {
                          // Aisle divider
                          return (
                            <div
                              key={`aisle-${idx}`}
                              className="col-span-1 text-center py-4 text-[10px] font-black text-slate-300 uppercase tracking-wider select-none"
                            >
                              {section.aisleLabel || 'AISLE'}
                            </div>
                          );
                        }

                        const avail = availabilityMap[seatId];
                        const seatClass = getSeatClass(seatId);
                        const statusText = getSeatStatusText(seatId);
                        const isDisabled = disabledSeats.includes(seatId);
                        const isSearchHighlighted = searchHighlight && seatId.includes(searchHighlight);

                        // Extract occupants for display
                        const aftName = avail?.afternoonStudent?.name || 'Free';
                        const eveName = avail?.eveningStudent?.name || 'Free';
                        const fulldayName = avail?.fulldayStudent?.name || '';

                        return (
                          <div
                            key={seatId}
                            onClick={() => {
                              if (!isDisabled) {
                                setSelectedSeat(seatId);
                              } else {
                                toast.error(`Seat ${seatId} is currently disabled for maintenance`);
                              }
                            }}
                            className={`col-span-1 rounded-2xl border-2 p-3 text-left cursor-pointer transition-all hover:scale-[1.03] select-none min-h-[82px] flex flex-col justify-between ${seatClass} ${
                              isSearchHighlighted ? 'ring-4 ring-offset-2 ring-[#8c3d19]' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 border-b border-black/5 pb-1">
                              <span className="text-xs font-black">{seatId}</span>
                              <span className="text-[7.5px] font-extrabold uppercase tracking-wider opacity-90 truncate">
                                {statusText}
                              </span>
                            </div>

                            {/* Occupant Display */}
                            <div className="text-[9.5px] font-semibold tracking-tight leading-normal space-y-0.5 mt-1.5 flex-1 flex flex-col justify-center">
                              {avail?.fulldayStudent ? (
                                <p className="truncate font-bold flex items-center gap-1 text-[#8c3d19]">
                                  👤 {fulldayName}
                                </p>
                              ) : (avail?.afternoonStudent || avail?.eveningStudent) ? (
                                <div className="space-y-0.5 text-slate-700">
                                  <p className="truncate">
                                    <span className="text-slate-400 font-bold">Aft:</span>{' '}
                                    <span className={aftName !== 'Free' ? 'font-bold text-slate-800' : 'text-slate-400 italic'}>
                                      {aftName}
                                    </span>
                                  </p>
                                  <p className="truncate">
                                    <span className="text-slate-400 font-bold">Eve:</span>{' '}
                                    <span className={eveName !== 'Free' ? 'font-bold text-slate-800' : 'text-slate-400 italic'}>
                                      {eveName}
                                    </span>
                                  </p>
                                </div>
                              ) : (
                                <p className="text-slate-400 text-center py-1 font-medium italic">Vacant</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Layout Footer */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs font-bold text-slate-500">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                🚪 MAIN ENTRANCE & GATE
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Biometric Entry Area</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                🚰 RO COLD WATER & LOCKERS
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Tea/Coffee Corner</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                💼 RECEPTION & ADMIN DESK
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Saneh Library Management</p>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Widgets */}
        <div className="space-y-4">
          
          {/* Widget 1: Fee Overdue Alerts */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <AlertCircle size={16} className="text-red-500" />
                Fee Overdue Alerts ({overdueFees.length})
              </h3>
              {totalOverdueAmount > 0 && (
                <span className="text-xs font-bold text-red-500">₹{totalOverdueAmount} Total</span>
              )}
            </div>

            {overdueAlerts.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-4 text-center text-xs font-medium text-slate-400">
                🎉 No overdue payments! All up to date.
              </div>
            ) : (
              <div className="space-y-2.5">
                {overdueAlerts.map(({ fee, student }) => (
                  <div
                    key={fee.id}
                    className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-2xl"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{student?.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        Seat {student?.currentSeatId} · ₹{fee.amount}
                      </p>
                    </div>
                    <button
                      onClick={() => setPayingFee({ feeId: fee.id, studentName: student?.name || '' })}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                    >
                      Pay
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 2: Today's Roll Call Status */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Today's Roll Call Status
              </h3>
              <button
                onClick={() => navigate('/attendance')}
                className="text-xs font-bold text-[#8c3d19] hover:underline"
              >
                Take Attendance →
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400">Today's Recorded Present</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  {markedTodayCount} <span className="text-xs font-normal text-slate-500">/ {activeCount} Students</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-medium italic">
              💡 Pro tip: Marking a student absent does not free up their seat. Full Day and Shift bookings remain permanently reserved.
            </p>
          </div>

          {/* Widget 3: Prospect Walk-ins & Calls */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Prospect Walk-ins & Calls
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Quickly register walk-in enquiries, follow-up callbacks, or convert hot leads.
            </p>
            <button
              onClick={() => navigate('/enquiries')}
              className="w-full bg-[#8c3d19] hover:bg-[#723113] text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all active:scale-95 text-center block"
            >
              Open Enquiries ({activeEnquiries.length} Active)
            </button>
          </div>

        </div>

      </div>

      {/* ── Modal Dialogs ── */}
      <AnimatePresence>
        {showAddStudent && (
          <AddStudentModal onClose={() => setShowAddStudent(false)} />
        )}
        {selectedSeat && selectedAvailability && (
          <SeatDetailsDrawer
            seatId={selectedSeat}
            availability={selectedAvailability}
            selectedShift={selectedShiftFilter === 'all' ? 'afternoon' : selectedShiftFilter}
            date={today}
            onClose={() => setSelectedSeat(null)}
            onAssign={() => {
              setAddStudentSeat({ seatId: selectedSeat, shift: selectedShiftFilter === 'all' ? 'afternoon' : selectedShiftFilter });
              setSelectedSeat(null);
            }}
          />
        )}
        {addStudentSeat && (
          <AddStudentModal
            prefillSeat={addStudentSeat.seatId}
            prefillShift={addStudentSeat.shift}
            onClose={() => setAddStudentSeat(null)}
          />
        )}
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
