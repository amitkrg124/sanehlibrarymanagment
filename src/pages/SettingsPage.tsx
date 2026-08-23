import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, Armchair } from 'lucide-react';
import { useLibraryStore, useAppStore, useAuthStore } from '../store';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const settings = useLibraryStore((s) => s.settings);
  const updateSettings = useLibraryStore((s) => s.updateSettings);
  const disabledSeats = useAppStore((s) => s.disabledSeats);
  const toggleSeatDisabled = useAppStore((s) => s.toggleSeatDisabled);
  const logout = useAuthStore((s) => s.logout);

  const [form, setForm] = useState({ ...settings });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateSettings(form);
    toast.success('Settings saved!');
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-6 max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your library</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Library Info */}
        <div className="card p-5">
          <h2 className="section-heading">Library Information</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Library Name</label>
              <input value={form.libraryName} onChange={(e) => setForm({ ...form, libraryName: e.target.value })} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Contact Number</label>
                <input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Address</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" />
              </div>
            </div>
          </div>
        </div>

        {/* Shift Timings */}
        <div className="card p-5">
          <h2 className="section-heading">Shift Timings</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-orange-700 mb-2">Afternoon Shift</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Time</label>
                  <input type="time" value={form.afternoonStart} onChange={(e) => setForm({ ...form, afternoonStart: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input type="time" value={form.afternoonEnd} onChange={(e) => setForm({ ...form, afternoonEnd: e.target.value })} className="input" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-700 mb-2">Evening Shift</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Time</label>
                  <input type="time" value={form.eveningStart} onChange={(e) => setForm({ ...form, eveningStart: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input type="time" value={form.eveningEnd} onChange={(e) => setForm({ ...form, eveningEnd: e.target.value })} className="input" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Default Fees */}
        <div className="card p-5">
          <h2 className="section-heading">Default Monthly Fees (₹)</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Afternoon</label>
              <input type="number" value={form.defaultAfternoonFee} onChange={(e) => setForm({ ...form, defaultAfternoonFee: Number(e.target.value) })} className="input" min={0} />
            </div>
            <div>
              <label className="label">Evening</label>
              <input type="number" value={form.defaultEveningFee} onChange={(e) => setForm({ ...form, defaultEveningFee: Number(e.target.value) })} className="input" min={0} />
            </div>
            <div>
              <label className="label">Full Day</label>
              <input type="number" value={form.defaultFullDayFee} onChange={(e) => setForm({ ...form, defaultFullDayFee: Number(e.target.value) })} className="input" min={0} />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-5">
          <h2 className="section-heading">Fee Reminders</h2>
          <div>
            <label className="label">Remind Before Due Date (Days)</label>
            <input type="number" value={form.reminderDaysBefore} onChange={(e) => setForm({ ...form, reminderDaysBefore: Number(e.target.value) })} className="input w-32" min={1} max={30} />
            <p className="text-xs text-slate-400 mt-1.5">Show reminders this many days before fee due date</p>
          </div>
        </div>

        {/* Security */}
        <div className="card p-5">
          <h2 className="section-heading">Security</h2>
          <div>
            <label className="label">Admin Password</label>
            <input type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} className="input" placeholder="Change password" />
            <p className="text-xs text-slate-400 mt-1.5">This is the password used to sign in</p>
          </div>
        </div>

        <button type="submit" className="btn-primary gap-2">
          <Save size={16} />
          Save Settings
        </button>
      </form>

      {/* Seat Management */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Armchair size={18} className="text-brand-600" />
          <h2 className="section-heading mb-0">Seat Management</h2>
        </div>
        <p className="text-xs text-slate-500 mb-3">Click a seat to temporarily disable/enable it (e.g. for maintenance).</p>
        <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5">
          {['A', 'B', 'C', 'D', 'E', 'F'].flatMap((section) =>
            [1, 2, 3, 4, 5].map((num) => {
              const seatId = `${section}${num}`;
              const isDisabled = disabledSeats.includes(seatId);
              return (
                <button
                  key={seatId}
                  onClick={() => {
                    toggleSeatDisabled(seatId);
                    toast.success(`Seat ${seatId} ${isDisabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`py-1.5 px-1 rounded-lg text-xs font-bold border-2 transition-all ${
                    isDisabled
                      ? 'bg-slate-200 border-slate-300 text-slate-400'
                      : 'bg-white border-green-200 text-green-700 hover:border-green-400'
                  }`}
                >
                  {seatId}
                </button>
              );
            })
          )}
        </div>
        {disabledSeats.length > 0 && (
          <p className="text-xs text-orange-600 mt-3">
            <strong>{disabledSeats.length}</strong> seat(s) currently disabled: {disabledSeats.join(', ')}
          </p>
        )}
      </div>

      {/* Sign out */}
      <div className="card p-5">
        <h2 className="section-heading">Account</h2>
        <button onClick={logout} className="btn-danger">Sign Out</button>
      </div>
    </div>
  );
}
