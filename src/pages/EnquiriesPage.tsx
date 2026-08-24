import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Phone, ChevronRight, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { computeSeatAvailability, countAvailableSeats, formatShift, formatDisplayDate, todayStr } from '../lib/utils';
import type { Shift, EnquiryStatus } from '../types';
import AddStudentModal from '../components/students/AddStudentModal';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<EnquiryStatus, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'badge-green' },
  followup: { label: 'Follow-up', cls: 'badge-orange' },
  converted: { label: 'Converted', cls: 'badge-blue' },
  not_interested: { label: 'Not Interested', cls: 'badge-slate' },
};

const NEXT_STATUS: Record<EnquiryStatus, EnquiryStatus> = {
  new: 'followup',
  followup: 'converted',
  converted: 'converted',
  not_interested: 'not_interested',
};

export default function EnquiriesPage() {
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [convertEnquiry, setConvertEnquiry] = useState<{ seatId?: string; shift?: Shift } | null>(null);
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | 'all'>('all');
  const [newForm, setNewForm] = useState({ name: '', phone: '', requirement: 'afternoon' as Shift, preferredDate: todayStr(), notes: '' });

  const enquiries = useAppStore((s) => s.enquiries);
  const addEnquiry = useAppStore((s) => s.addEnquiry);
  const updateEnquiryStatus = useAppStore((s) => s.updateEnquiryStatus);
  const students = useAppStore((s) => s.students);
  const assignments = useAppStore((s) => s.assignments);

  const today = todayStr();
  const availabilityMap = useMemo(
    () => computeSeatAvailability(today, assignments, students),
    [today, assignments, students]
  );

  const afternoonAvail = countAvailableSeats(availabilityMap, 'afternoon');
  const eveningAvail = countAvailableSeats(availabilityMap, 'evening');
  const fulldayAvail = countAvailableSeats(availabilityMap, 'fullday');

  const filtered = enquiries.filter((e) => statusFilter === 'all' || e.status === statusFilter);

  function handleAddEnquiry(e: React.FormEvent) {
    e.preventDefault();
    addEnquiry({ ...newForm, status: 'new' });
    setNewForm({ name: '', phone: '', requirement: 'afternoon', preferredDate: todayStr(), notes: '' });
    setShowForm(false);
    toast.success('Enquiry added!');
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Enquiries</h1>
          <p className="page-subtitle">Track and convert new enquiries</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} />
          <span className="hidden sm:inline">New Enquiry</span>
        </button>
      </div>

      {/* Availability snapshot */}
      <div className="card p-4">
        <h3 className="section-heading text-sm">Current Availability (Today)</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Afternoon', count: afternoonAvail, cls: 'text-orange-700 bg-orange-50' },
            { label: 'Evening', count: eveningAvail, cls: 'text-blue-700 bg-blue-50' },
            { label: 'Full Day', count: fulldayAvail, cls: 'text-purple-700 bg-purple-50' },
          ].map((item) => (
            <div key={item.label} className={`${item.cls} rounded-xl p-3 text-center`}>
              <p className={`text-2xl font-black ${item.cls.split(' ')[0]}`}>{item.count}</p>
              <p className="text-xs font-semibold mt-0.5">{item.label}</p>
              <p className="text-xs opacity-70">seats available</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Enquiry Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-5"
          >
            <h3 className="section-heading">New Enquiry</h3>
            <form onSubmit={handleAddEnquiry} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Name *</label>
                  <input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} className="input" placeholder="Full name" required />
                </div>
                <div>
                  <label className="label">Phone *</label>
                  <input value={newForm.phone} onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })} className="input" placeholder="10-digit" maxLength={10} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Requirement *</label>
                  <select value={newForm.requirement} onChange={(e) => setNewForm({ ...newForm, requirement: e.target.value as Shift })} className="select">
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="fullday">Full Day</option>
                  </select>
                </div>
                <div>
                  <label className="label">Preferred Date</label>
                  <input type="date" value={newForm.preferredDate} onChange={(e) => setNewForm({ ...newForm, preferredDate: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <input value={newForm.notes} onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })} className="input" placeholder="Any notes about the enquiry" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">Save Enquiry</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'all', label: 'All' },
          { value: 'new', label: 'New' },
          { value: 'followup', label: 'Follow-up' },
          { value: 'converted', label: 'Converted' },
          { value: 'not_interested', label: 'Not Interested' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value as EnquiryStatus | 'all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              statusFilter === f.value
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Enquiry list */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">No enquiries found</p>
          <p className="text-sm text-slate-400 mt-1">New enquiries will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((enq, i) => (
            <motion.div
              key={enq.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card px-4 py-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0 font-bold text-brand-700">
                  {enq.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900">{enq.name}</p>
                    <span className={`badge text-xs ${STATUS_CONFIG[enq.status].cls}`}>
                      {STATUS_CONFIG[enq.status].label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Phone size={11} /> {enq.phone}</span>
                    <span>{formatShift(enq.requirement)}</span>
                    <span>Preferred: {formatDisplayDate(enq.preferredDate)}</span>
                  </div>
                  {enq.notes && <p className="text-xs text-slate-500 mt-1.5 italic">"{enq.notes}"</p>}
                </div>
              </div>

              {/* Actions */}
              {enq.status !== 'converted' && enq.status !== 'not_interested' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50 flex-wrap">
                  <button
                    onClick={() => {
                      setConvertEnquiry({ shift: enq.requirement });
                    }}
                    className="btn-primary text-xs py-1.5 px-3 gap-1.5"
                  >
                    <ArrowRight size={13} /> Convert to Student
                  </button>
                  <button
                    onClick={() => {
                      updateEnquiryStatus(enq.id, NEXT_STATUS[enq.status]);
                      toast.success('Enquiry status updated');
                    }}
                    className="btn-secondary text-xs py-1.5 px-3 gap-1.5"
                  >
                    <RefreshCw size={13} /> Move to {STATUS_CONFIG[NEXT_STATUS[enq.status]].label}
                  </button>
                  <button
                    onClick={() => {
                      updateEnquiryStatus(enq.id, 'not_interested');
                      toast.success('Marked as not interested');
                    }}
                    className="btn-ghost text-xs py-1.5 text-red-500 hover:bg-red-50 gap-1.5"
                  >
                    Not Interested
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Convert to student modal */}
      <AnimatePresence>
        {convertEnquiry && (
          <AddStudentModal
            prefillShift={convertEnquiry.shift}
            onClose={() => setConvertEnquiry(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
