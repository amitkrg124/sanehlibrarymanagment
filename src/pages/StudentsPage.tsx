import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Phone, Armchair, Calendar, ChevronRight, Users, Sparkles, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { formatShift, formatDisplayDate } from '../lib/utils';
import type { Shift, StudentStatus } from '../types';
import AddStudentModal from '../components/students/AddStudentModal';

const SHIFT_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'unreserved', label: 'Unreserved' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'fullday', label: 'Full Day' },
] as const;

export default function StudentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');
  const [feeFilter, setFeeFilter] = useState<'all' | 'due' | 'overdue' | 'paid'>('all');
  const [showAdd, setShowAdd] = useState(false);

  const students = useAppStore((s) => s.students);
  const feeRecords = useAppStore((s) => s.feeRecords);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesPhone = s.phone.includes(q);
        const matchesSeat = s.currentSeatId?.toLowerCase().includes(q);
        const matchesRegNo = s.registrationNo?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesSeat && !matchesRegNo) return false;
      }
      if (shiftFilter !== 'all') {
        if (shiftFilter === 'reserved' && (s.seatType === 'unreserved' || s.membershipType === 'unreserved')) return false;
        if (shiftFilter === 'unreserved' && s.seatType !== 'unreserved' && s.membershipType !== 'unreserved') return false;
        if (shiftFilter === 'afternoon' && s.membershipType !== 'afternoon') return false;
        if (shiftFilter === 'evening' && s.membershipType !== 'evening') return false;
        if (shiftFilter === 'fullday' && s.membershipType !== 'fullday') return false;
      }
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (feeFilter !== 'all') {
        const latestFee = feeRecords
          .filter((f) => f.studentId === s.id && f.status !== 'paid')
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
        if (feeFilter === 'overdue' && latestFee?.status !== 'overdue') return false;
        if (feeFilter === 'due' && latestFee?.status !== 'due') return false;
        if (feeFilter === 'paid' && latestFee) return false;
      }
      return true;
    });
  }, [students, feeRecords, search, shiftFilter, statusFilter, feeFilter]);

  const getLatestFee = (studentId: string) => {
    return feeRecords
      .filter((f) => f.studentId === studentId && f.status !== 'paid')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  };

  const shiftBadge = (student: typeof students[0]) => {
    if (student.seatType === 'unreserved' || student.membershipType === 'unreserved') {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (student.membershipType === 'afternoon') return 'badge-orange';
    if (student.membershipType === 'evening') return 'badge-blue';
    return 'badge-purple';
  };

  const feeBadge = (status?: string) => {
    if (status === 'overdue') return 'badge-red';
    if (status === 'due') return 'badge-orange';
    if (status === 'upcoming') return 'badge-blue';
    return 'badge-green';
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">
            {students.filter((s) => s.status === 'active').length} active students · {students.filter((s) => s.status === 'active' && (s.seatType === 'unreserved' || s.membershipType === 'unreserved')).length} unreserved
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} />
          <span className="hidden sm:inline">Add Student</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, seat, or Reg No. (e.g. SAN-101)..."
            className="input pl-10"
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {SHIFT_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setShiftFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  shiftFilter === f.value
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[{ value: 'all', label: 'All Status' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value as StudentStatus | 'all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  statusFilter === f.value
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500 font-medium">
        {filtered.length} student{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">No students found</p>
          <p className="text-sm text-slate-400 mt-1">Try changing your filters or search query</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((student, i) => {
              const latestFee = getLatestFee(student.id);
              const isUnreserved = student.seatType === 'unreserved' || student.membershipType === 'unreserved';

              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.02, duration: 0.2 }}
                  onClick={() => navigate(`/students/${student.id}`)}
                  className="card px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:shadow-card-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                    student.status === 'active' ? (isUnreserved ? 'bg-amber-100 text-amber-800' : 'bg-brand-100 text-brand-700') : 'bg-slate-100 text-slate-500'
                  }`}>
                    {student.name[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 truncate">{student.name}</p>
                      {student.registrationNo && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-700">
                          <Hash size={10} className="text-slate-400" />
                          {student.registrationNo}
                        </span>
                      )}
                      {student.status === 'inactive' && (
                        <span className="badge-slate text-xs">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Phone size={11} /> {student.phone}
                      </span>
                      {isUnreserved ? (
                        <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                          <Sparkles size={11} /> {student.planHours || 'Unreserved'}
                        </span>
                      ) : student.currentSeatId ? (
                        <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
                          <Armchair size={11} className="text-slate-400" /> {student.currentSeatId}
                        </span>
                      ) : null}
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={11} /> {formatDisplayDate(student.admissionDate)}
                      </span>
                    </div>
                  </div>

                  {/* Right side badges */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`badge text-xs border ${shiftBadge(student)}`}>
                      {isUnreserved ? 'Unreserved' : formatShift(student.membershipType)}
                    </span>
                    {latestFee && (
                      <span className={`badge text-xs ${feeBadge(latestFee.status)}`}>
                        {latestFee.status === 'overdue' ? 'Overdue'
                          : latestFee.status === 'due' ? 'Due'
                          : `?${latestFee.amount.toLocaleString('en-IN')}`}
                      </span>
                    )}
                  </div>

                  <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAdd && <AddStudentModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
