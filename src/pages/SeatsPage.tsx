import React, { useState } from 'react';
import { format } from 'date-fns';
import SeatMap from '../components/seats/SeatMap';
import AddStudentModal from '../components/students/AddStudentModal';
import { AnimatePresence } from 'framer-motion';
import { todayStr } from '../lib/utils';

export default function SeatsPage() {
  const [date, setDate] = useState(todayStr());
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Seat Map</h1>
          <p className="page-subtitle">Visual floor layout — click a seat to view or assign</p>
        </div>
        <div>
          <label className="label text-xs mb-1">Check for date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input text-sm py-2 w-auto"
          />
        </div>
      </div>

      <SeatMap date={date} showFilter initialShift="afternoon" />

      <AnimatePresence>
        {showAdd && <AddStudentModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
