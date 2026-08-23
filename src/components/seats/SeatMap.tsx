import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useAppStore, useLibraryStore } from '../../store';
import { computeSeatAvailability, SEAT_LAYOUT, formatShift } from '../../lib/utils';
import type { Shift, SeatAvailability } from '../../types';
import SeatDetailsDrawer from './SeatDetailsDrawer';
import AddStudentModal from '../students/AddStudentModal';

const SHIFT_TABS: { key: Shift; label: string; color: string }[] = [
  { key: 'afternoon', label: 'Afternoon', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { key: 'evening', label: 'Evening', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'fullday', label: 'Full Day', color: 'bg-purple-50 text-purple-700 border-purple-200' },
];

interface SeatMapProps {
  date: string;
  showFilter?: boolean;
  initialShift?: Shift;
  highlightAvailable?: boolean;
}

export default function SeatMap({ date, showFilter = true, initialShift = 'afternoon', highlightAvailable = false }: SeatMapProps) {
  const [selectedShift, setSelectedShift] = useState<Shift>(initialShift);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [addStudentSeat, setAddStudentSeat] = useState<{ seatId: string; shift: Shift } | null>(null);

  const students = useAppStore((s) => s.students);
  const assignments = useAppStore((s) => s.assignments);
  const disabledSeats = useAppStore((s) => s.disabledSeats);

  const availabilityMap = useMemo(
    () => computeSeatAvailability(date, assignments, students),
    [date, assignments, students]
  );

  const selectedAvailability = selectedSeat ? availabilityMap[selectedSeat] : null;

  function getSeatClass(seatId: string): string {
    if (disabledSeats.includes(seatId)) return 'seat-disabled';
    const avail = availabilityMap[seatId];
    if (!avail) return 'seat-available';

    const isShiftAvailable = avail[selectedShift];
    if (isShiftAvailable) return 'seat-available';

    // Determine occupancy type
    if (!avail.afternoon && !avail.evening) return 'seat-fullday'; // full day or both
    if (!avail.afternoon && avail.evening) return 'seat-afternoon';
    if (avail.afternoon && !avail.evening) return 'seat-evening';
    return 'seat-partial';
  }

  function getSeatLabel(seatId: string): string {
    const avail = availabilityMap[seatId];
    if (!avail) return '';

    if (selectedShift === 'afternoon') {
      const student = avail.fulldayStudent || avail.afternoonStudent;
      if (student) return student.name.split(' ')[0];
    }
    if (selectedShift === 'evening') {
      const student = avail.fulldayStudent || avail.eveningStudent;
      if (student) return student.name.split(' ')[0];
    }
    if (selectedShift === 'fullday') {
      const student = avail.fulldayStudent;
      if (student) return student.name.split(' ')[0];
    }
    return '';
  }

  return (
    <div>
      {/* Shift Toggle */}
      {showFilter && (
        <div className="flex gap-2 mb-5">
          {SHIFT_TABS.map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => setSelectedShift(tab.key)}
              whileTap={{ scale: 0.97 }}
              className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                selectedShift === tab.key
                  ? tab.color + ' shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-5 text-xs">
        {[
          { cls: 'w-3 h-3 rounded-sm bg-green-200 border border-green-300', label: 'Available' },
          { cls: 'w-3 h-3 rounded-sm bg-orange-200 border border-orange-300', label: 'Afternoon' },
          { cls: 'w-3 h-3 rounded-sm bg-blue-200 border border-blue-300', label: 'Evening' },
          { cls: 'w-3 h-3 rounded-sm bg-red-200 border border-red-300', label: 'Full Day' },
          { cls: 'w-3 h-3 rounded-sm bg-purple-200 border border-purple-300', label: 'Both Shifts' },
          { cls: 'w-3 h-3 rounded-sm bg-slate-200 border border-slate-300', label: 'Disabled' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-slate-600">
            <span className={item.cls} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Floor Map */}
      <div className="card p-5 overflow-x-auto">
        {/* Library indicators */}
        <div className="flex items-center justify-between mb-4 text-xs text-slate-400 font-medium">
          <span>← Window Side</span>
          <span>Entrance →</span>
        </div>

        {/* Rows */}
        <div className="space-y-3 min-w-[400px]">
          {SEAT_LAYOUT.map((row) => (
            <div key={row.row} className="flex items-center gap-2">
              {row.seats.map((seatId, col) => {
                if (!seatId) {
                  // Aisle / gap
                  return <div key={`gap-${col}`} className="w-16 h-16 flex-shrink-0" />;
                }

                const seatClass = getSeatClass(seatId);
                const label = getSeatLabel(seatId);
                const isSelected = selectedSeat === seatId;
                const isDisabled = disabledSeats.includes(seatId);

                return (
                  <motion.button
                    key={seatId}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={!isDisabled ? { scale: 1.08 } : undefined}
                    whileTap={!isDisabled ? { scale: 0.95 } : undefined}
                    transition={{ duration: 0.15 }}
                    onClick={() => !isDisabled && setSelectedSeat(isSelected ? null : seatId)}
                    className={`${seatClass} flex-shrink-0 ${isSelected ? 'seat-selected' : ''}`}
                    title={seatId}
                  >
                    <span className="text-[11px] font-bold">{seatId}</span>
                    {label && (
                      <span className="text-[9px] font-medium opacity-80 truncate w-full text-center px-0.5">
                        {label}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Reception area indicator */}
        <div className="flex justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-dashed border-slate-200">
            📚 Bookshelves
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-dashed border-slate-200">
            🪑 Reception
          </div>
        </div>
      </div>

      {/* Availability summary */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {SHIFT_TABS.map((tab) => {
          const count = Object.values(availabilityMap).filter((a) => a[tab.key]).length;
          return (
            <div
              key={tab.key}
              onClick={() => setSelectedShift(tab.key)}
              className={`py-2 px-3 rounded-xl cursor-pointer border ${
                selectedShift === tab.key ? tab.color : 'bg-slate-50 border-slate-100 text-slate-500'
              } transition-all duration-200`}
            >
              <p className="text-lg font-bold">{count}</p>
              <p className="text-xs">{tab.label}</p>
            </div>
          );
        })}
      </div>

      {/* Seat Details Drawer */}
      <AnimatePresence>
        {selectedSeat && selectedAvailability && (
          <SeatDetailsDrawer
            seatId={selectedSeat}
            availability={selectedAvailability}
            selectedShift={selectedShift}
            date={date}
            onClose={() => setSelectedSeat(null)}
            onAssign={() => {
              setAddStudentSeat({ seatId: selectedSeat, shift: selectedShift });
              setSelectedSeat(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AnimatePresence>
        {addStudentSeat && (
          <AddStudentModal
            prefillSeat={addStudentSeat.seatId}
            prefillShift={addStudentSeat.shift}
            onClose={() => setAddStudentSeat(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
