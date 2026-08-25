import { format, addMonths, differenceInDays, parseISO, isAfter, isBefore } from 'date-fns';
import type { Shift, SeatAssignment, Student, SeatAvailability, FeeRecord } from '../types';

// ─── Seat IDs ───────────────────────────────────────────────────────────────

export const ALL_SEAT_IDS: string[] = [];
['A', 'B', 'C', 'D', 'E', 'F'].forEach(section => {
  [1, 2, 3, 4, 5].forEach(num => {
    ALL_SEAT_IDS.push(`${section}${num}`);
  });
});

// Physical layout for the floor map (legacy simple grid)
export const SEAT_LAYOUT = [
  { row: 1, seats: ['A5', 'A4', 'A3', null, null, null, null, 'A2', 'A1'] },
  { row: 2, seats: ['B5', 'B4', 'B3', null, null, null, null, 'B2', 'B1'] },
  { row: 3, seats: ['C5', 'C4', 'C3', null, null, null, null, 'C2', 'C1'] },
  { row: 4, seats: ['D5', 'D4', 'D3', null, null, null, null, 'D2', 'D1'] },
  { row: 5, seats: ['E5', 'E4', 'E3', null, null, null, null, 'E2', 'E1'] },
  { row: 6, seats: ['F5', 'F4', 'F3', 'F2', 'F1', null, null, null, null] },
];

// Named section layout for the premium floor plan view
export const SECTION_LAYOUT = [
  { id: 'A', name: 'Front Quiet Row', feature: 'Power points on each cubicle', leftSeats: ['A5', 'A4', 'A3'], aisleLabel: 'CENTRAL AISLE ↑', rightSeats: ['A2', 'A1'] },
  { id: 'B', name: 'Middle Bay 1', feature: 'LED Desk Lamp Equipped', leftSeats: ['B5', 'B4', 'B3'], aisleLabel: 'AISLE', rightSeats: ['B2', 'B1'] },
  { id: 'C', name: 'Middle Bay 2', feature: 'Back-to-back Partition', leftSeats: ['C5', 'C4', 'C3'], aisleLabel: 'AISLE', rightSeats: ['C2', 'C1'] },
  { id: 'D', name: 'Deep Focus Bay', feature: 'High Back Cushion Chairs', leftSeats: ['D5', 'D4', 'D3'], aisleLabel: 'AISLE', rightSeats: ['D2', 'D1'] },
  { id: 'E', name: 'Quiet Row', feature: 'Individual Locker Included', leftSeats: ['E5', 'E4', 'E3'], aisleLabel: 'AISLE', rightSeats: ['E2', 'E1'] },
  { id: 'F', name: 'Back Wall Premium Desks', feature: 'Full 5-seat wide horizontal desk', leftSeats: ['F5', 'F4', 'F3', 'F2'], aisleLabel: 'AISLE', rightSeats: ['F1'] },
] as const;

// ─── Seat Availability Logic ────────────────────────────────────────────────

/**
 * For a given date, determine whether each seat is available for each shift.
 * Rules:
 *   - Full Day blocks Afternoon and Evening
 *   - Afternoon and Evening can coexist on the same seat
 *   - An active assignment with endDate = undefined or endDate >= date blocks the seat
 */
export function computeSeatAvailability(
  date: string, // YYYY-MM-DD
  assignments: SeatAssignment[],
  students: Student[],
  seatIds: string[] = ALL_SEAT_IDS
): Record<string, SeatAvailability> {
  const result: Record<string, SeatAvailability> = {};

  const studentMap = new Map(students.map(s => [s.id, s]));

  // Filter only active assignments that cover this date
  const activeOnDate = assignments.filter(a => {
    if (a.status === 'ended') return false;
    const startStr = a.startDate.slice(0, 10);
    const dateStr = date.slice(0, 10);
    if (dateStr < startStr) return false;
    if (a.endDate) {
      const endStr = a.endDate.slice(0, 10);
      if (a.status === 'transferred') {
        if (dateStr >= endStr) return false;
      } else {
        if (dateStr > endStr) return false;
      }
    }
    return true;
  });

  seatIds.forEach(seatId => {
    const seatAssignments = activeOnDate.filter(a => a.seatId === seatId);

    const fulldayAsgn = seatAssignments.find(a => a.shift === 'fullday');
    const afternoonAsgn = seatAssignments.find(a => a.shift === 'afternoon');
    const eveningAsgn = seatAssignments.find(a => a.shift === 'evening');

    let afternoonAvailable = true;
    let eveningAvailable = true;
    let fulldayAvailable = true;

    let afternoonStudent: Student | undefined;
    let eveningStudent: Student | undefined;
    let fulldayStudent: Student | undefined;

    if (fulldayAsgn) {
      afternoonAvailable = false;
      eveningAvailable = false;
      fulldayAvailable = false;
      fulldayStudent = studentMap.get(fulldayAsgn.studentId);
      afternoonStudent = fulldayStudent;
      eveningStudent = fulldayStudent;
    } else {
      if (afternoonAsgn) {
        afternoonAvailable = false;
        fulldayAvailable = false;
        afternoonStudent = studentMap.get(afternoonAsgn.studentId);
      }
      if (eveningAsgn) {
        eveningAvailable = false;
        fulldayAvailable = false;
        eveningStudent = studentMap.get(eveningAsgn.studentId);
      }
    }

    result[seatId] = {
      seatId,
      afternoon: afternoonAvailable,
      evening: eveningAvailable,
      fullday: fulldayAvailable,
      afternoonStudent,
      eveningStudent,
      fulldayStudent,
    };
  });

  return result;
}

/**
 * Get the visual status of a seat for a given shift filter.
 */
export function getSeatStatusForShift(
  availability: SeatAvailability,
  shift: Shift | 'all'
): 'available' | 'afternoon' | 'evening' | 'fullday' | 'partial' {
  const { afternoon, evening, fullday } = availability;

  if (shift === 'fullday') {
    return fullday ? 'available' : availability.fulldayStudent ? 'fullday' : 'partial';
  }
  if (shift === 'afternoon') {
    return afternoon ? 'available' : 'afternoon';
  }
  if (shift === 'evening') {
    return evening ? 'available' : 'evening';
  }

  // 'all' view — show combined
  if (fullday && afternoon && evening) return 'available';
  if (!fullday && !afternoon && !evening) return 'fullday'; // full day occupied
  return 'partial';
}

/**
 * Count available seats for a specific shift on a given date.
 */
export function countAvailableSeats(
  availabilityMap: Record<string, SeatAvailability>,
  shift: Shift
): number {
  return Object.values(availabilityMap).filter(a => a[shift]).length;
}

// ─── Fee Calculator ──────────────────────────────────────────────────────────

/**
 * Generate fee records for a student based on admission date.
 * Each cycle starts on the admission day-of-month.
 */
export function generateFeeRecords(
  studentId: string,
  admissionDate: string,
  monthlyFee: number,
  monthsToGenerate = 3
): Omit<FeeRecord, 'id' | 'createdAt'>[] {
  const admission = parseISO(admissionDate);
  const records = [];

  for (let i = 0; i < monthsToGenerate; i++) {
    const periodStart = addMonths(admission, i);
    const periodEnd = addMonths(admission, i + 1);
    const dueDate = periodStart; // Due on the first day of each cycle

    records.push({
      studentId,
      periodStart: format(periodStart, 'yyyy-MM-dd'),
      periodEnd: format(periodEnd, 'yyyy-MM-dd'),
      amount: monthlyFee,
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      status: 'upcoming' as const,
      paidDate: undefined,
      paymentMethod: undefined,
      notes: undefined,
    });
  }

  return records;
}

/**
 * Compute the fee status based on due date vs today.
 */
export function computeFeeStatus(dueDate: string, paidDate?: string): FeeRecord['status'] {
  if (paidDate) return 'paid';
  const today = new Date();
  const due = parseISO(dueDate);
  const daysUntilDue = differenceInDays(due, today);

  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue === 0) return 'due';
  if (daysUntilDue <= 7) return 'upcoming';
  return 'upcoming';
}

// ─── Reminder Message ────────────────────────────────────────────────────────

export function generateReminderMessage(
  studentName: string,
  amount: number,
  dueDate: string,
  libraryName = 'Saneh Library'
): string {
  const formattedDate = format(parseISO(dueDate), 'd MMMM yyyy');
  return `Hello ${studentName},

This is a friendly reminder that your ${libraryName} monthly fee of ₹${amount.toLocaleString('en-IN')} is due on ${formattedDate}.

Please make the payment at your earliest convenience.

Thank you,
${libraryName}`;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDisplayDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM yyyy');
}

export function formatShift(shift: Shift): string {
  if (shift === 'afternoon') return 'Afternoon';
  if (shift === 'evening') return 'Evening';
  return 'Full Day';
}

export function getShiftTiming(shift: Shift, settings?: { afternoonStart: string; afternoonEnd: string; eveningStart: string; eveningEnd: string }): string {
  const s = settings ?? { afternoonStart: '07:00', afternoonEnd: '14:00', eveningStart: '14:00', eveningEnd: '21:00' };
  if (shift === 'afternoon') return `${formatTime(s.afternoonStart)} – ${formatTime(s.afternoonEnd)}`;
  if (shift === 'evening') return `${formatTime(s.eveningStart)} – ${formatTime(s.eveningEnd)}`;
  return `${formatTime(s.afternoonStart)} – ${formatTime(s.eveningEnd)}`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}
