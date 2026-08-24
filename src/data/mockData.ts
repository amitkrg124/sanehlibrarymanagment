import { addMonths, format, parseISO, differenceInDays } from 'date-fns';
import type {
  Student,
  SeatAssignment,
  FeeRecord,
  AttendanceRecord,
  Enquiry,
  LibrarySettings,
} from '../types';
import { generateId, todayStr, computeFeeStatus } from '../lib/utils';

// ─── Library Settings ────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: LibrarySettings = {
  libraryName: 'Saneh Library',
  contactNumber: '9876543210',
  address: '123, Library Road, City',
  afternoonStart: '07:00',
  afternoonEnd: '14:00',
  eveningStart: '14:00',
  eveningEnd: '21:00',
  defaultAfternoonFee: 600,
  defaultEveningFee: 600,
  defaultFullDayFee: 1000,
  reminderDaysBefore: 5,
  adminPassword: 'saneh123',
};

// ─── Students ─────────────────────────────────────────────────────────────────

export const MOCK_STUDENTS: Student[] = [
  {
    id: 'stu-001',
    name: 'Rahul Kumar',
    phone: '9876501001',
    alternatePhone: '9876501002',
    email: 'rahul@email.com',
    address: '45, MG Road, Pune',
    admissionDate: '2026-07-12',
    membershipType: 'evening',
    monthlyFee: 600,
    currentSeatId: 'A3',
    status: 'active',
    notes: 'Preparing for UPSC',
    verificationType: 'Aadhaar',
    verificationId: '1234-5678-9012',
    createdAt: '2026-07-12T10:00:00Z',
    updatedAt: '2026-07-12T10:00:00Z',
  },
  {
    id: 'stu-002',
    name: 'Priya Sharma',
    phone: '9876502001',
    email: 'priya@email.com',
    address: '12, Shivaji Nagar, Pune',
    admissionDate: '2026-07-15',
    membershipType: 'afternoon',
    monthlyFee: 600,
    currentSeatId: 'A1',
    status: 'active',
    notes: 'CA student',
    verificationType: 'Voter ID',
    verificationId: 'VOT987654321',
    createdAt: '2026-07-15T11:00:00Z',
    updatedAt: '2026-07-15T11:00:00Z',
  },
  {
    id: 'stu-003',
    name: 'Amit Deshmukh',
    phone: '9876503001',
    admissionDate: '2026-07-18',
    membershipType: 'fullday',
    monthlyFee: 1000,
    currentSeatId: 'B1',
    status: 'active',
    verificationType: 'PAN Card',
    verificationId: 'AMIPD1234F',
    createdAt: '2026-07-18T09:00:00Z',
    updatedAt: '2026-07-18T09:00:00Z',
  },
  {
    id: 'stu-004',
    name: 'Neha Patil',
    phone: '9876504001',
    email: 'neha@email.com',
    admissionDate: '2026-07-20',
    membershipType: 'afternoon',
    monthlyFee: 600,
    currentSeatId: 'B3',
    status: 'active',
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-07-20T10:00:00Z',
  },
  {
    id: 'stu-005',
    name: 'Vijay Singh',
    phone: '9876505001',
    admissionDate: '2026-07-22',
    membershipType: 'evening',
    monthlyFee: 600,
    currentSeatId: 'C2',
    status: 'active',
    createdAt: '2026-07-22T10:00:00Z',
    updatedAt: '2026-07-22T10:00:00Z',
  },
  {
    id: 'stu-006',
    name: 'Ankita Joshi',
    phone: '9876506001',
    admissionDate: '2026-08-01',
    membershipType: 'fullday',
    monthlyFee: 1000,
    currentSeatId: 'C4',
    status: 'active',
    createdAt: '2026-08-01T09:30:00Z',
    updatedAt: '2026-08-01T09:30:00Z',
  },
  {
    id: 'stu-007',
    name: 'Saurabh Rao',
    phone: '9876507001',
    admissionDate: '2026-08-05',
    membershipType: 'afternoon',
    monthlyFee: 600,
    currentSeatId: 'D1',
    status: 'active',
    createdAt: '2026-08-05T11:00:00Z',
    updatedAt: '2026-08-05T11:00:00Z',
  },
  {
    id: 'stu-008',
    name: 'Pooja Mehta',
    phone: '9876508001',
    email: 'pooja@email.com',
    admissionDate: '2026-08-08',
    membershipType: 'evening',
    monthlyFee: 600,
    currentSeatId: 'D3',
    status: 'active',
    createdAt: '2026-08-08T10:00:00Z',
    updatedAt: '2026-08-08T10:00:00Z',
  },
  {
    id: 'stu-009',
    name: 'Karan Verma',
    phone: '9876509001',
    admissionDate: '2026-08-10',
    membershipType: 'afternoon',
    monthlyFee: 600,
    currentSeatId: 'E2',
    status: 'active',
    createdAt: '2026-08-10T09:00:00Z',
    updatedAt: '2026-08-10T09:00:00Z',
  },
  {
    id: 'stu-010',
    name: 'Ritu Gupta',
    phone: '9876510001',
    admissionDate: '2026-08-12',
    membershipType: 'evening',
    monthlyFee: 600,
    currentSeatId: 'E4',
    status: 'active',
    createdAt: '2026-08-12T10:30:00Z',
    updatedAt: '2026-08-12T10:30:00Z',
  },
  {
    id: 'stu-011',
    name: 'Manoj Pandey',
    phone: '9876511001',
    admissionDate: '2026-08-15',
    membershipType: 'fullday',
    monthlyFee: 1000,
    currentSeatId: 'F1',
    status: 'active',
    createdAt: '2026-08-15T09:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z',
  },
  {
    id: 'stu-012',
    name: 'Sneha Kulkarni',
    phone: '9876512001',
    admissionDate: '2026-08-18',
    membershipType: 'afternoon',
    monthlyFee: 600,
    currentSeatId: 'F3',
    status: 'active',
    createdAt: '2026-08-18T10:00:00Z',
    updatedAt: '2026-08-18T10:00:00Z',
  },
  {
    id: 'stu-013',
    name: 'Deepak Nair',
    phone: '9876513001',
    admissionDate: '2026-06-10',
    membershipType: 'evening',
    monthlyFee: 600,
    currentSeatId: 'A2',
    status: 'active',
    createdAt: '2026-06-10T10:00:00Z',
    updatedAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'stu-014',
    name: 'Kavita Bhat',
    phone: '9876514001',
    admissionDate: '2026-06-20',
    membershipType: 'afternoon',
    monthlyFee: 600,
    currentSeatId: 'B2',
    status: 'active',
    createdAt: '2026-06-20T09:00:00Z',
    updatedAt: '2026-06-20T09:00:00Z',
  },
  {
    id: 'stu-015',
    name: 'Rohit Tiwari',
    phone: '9876515001',
    admissionDate: '2026-05-14',
    membershipType: 'evening',
    monthlyFee: 600,
    currentSeatId: undefined,
    status: 'inactive',
    notes: 'Left after exams',
    createdAt: '2026-05-14T09:00:00Z',
    updatedAt: '2026-08-01T09:00:00Z',
  },
];

// ─── Seat Assignments ─────────────────────────────────────────────────────────

export const MOCK_ASSIGNMENTS: SeatAssignment[] = [
  { id: 'asgn-001', studentId: 'stu-001', seatId: 'A3', shift: 'evening', startDate: '2026-07-12', status: 'active', createdAt: '2026-07-12T10:00:00Z' },
  { id: 'asgn-002', studentId: 'stu-002', seatId: 'A1', shift: 'afternoon', startDate: '2026-07-15', status: 'active', createdAt: '2026-07-15T11:00:00Z' },
  { id: 'asgn-003', studentId: 'stu-003', seatId: 'B1', shift: 'fullday', startDate: '2026-07-18', status: 'active', createdAt: '2026-07-18T09:00:00Z' },
  { id: 'asgn-004', studentId: 'stu-004', seatId: 'B3', shift: 'afternoon', startDate: '2026-07-20', status: 'active', createdAt: '2026-07-20T10:00:00Z' },
  { id: 'asgn-005', studentId: 'stu-005', seatId: 'C2', shift: 'evening', startDate: '2026-07-22', status: 'active', createdAt: '2026-07-22T10:00:00Z' },
  { id: 'asgn-006', studentId: 'stu-006', seatId: 'C4', shift: 'fullday', startDate: '2026-08-01', status: 'active', createdAt: '2026-08-01T09:30:00Z' },
  { id: 'asgn-007', studentId: 'stu-007', seatId: 'D1', shift: 'afternoon', startDate: '2026-08-05', status: 'active', createdAt: '2026-08-05T11:00:00Z' },
  { id: 'asgn-008', studentId: 'stu-008', seatId: 'D3', shift: 'evening', startDate: '2026-08-08', status: 'active', createdAt: '2026-08-08T10:00:00Z' },
  { id: 'asgn-009', studentId: 'stu-009', seatId: 'E2', shift: 'afternoon', startDate: '2026-08-10', status: 'active', createdAt: '2026-08-10T09:00:00Z' },
  { id: 'asgn-010', studentId: 'stu-010', seatId: 'E4', shift: 'evening', startDate: '2026-08-12', status: 'active', createdAt: '2026-08-12T10:30:00Z' },
  { id: 'asgn-011', studentId: 'stu-011', seatId: 'F1', shift: 'fullday', startDate: '2026-08-15', status: 'active', createdAt: '2026-08-15T09:00:00Z' },
  { id: 'asgn-012', studentId: 'stu-012', seatId: 'F3', shift: 'afternoon', startDate: '2026-08-18', status: 'active', createdAt: '2026-08-18T10:00:00Z' },
  { id: 'asgn-013', studentId: 'stu-013', seatId: 'A2', shift: 'evening', startDate: '2026-06-10', status: 'active', createdAt: '2026-06-10T10:00:00Z' },
  { id: 'asgn-014', studentId: 'stu-014', seatId: 'B2', shift: 'afternoon', startDate: '2026-06-20', status: 'active', createdAt: '2026-06-20T09:00:00Z' },
  // Historical (transferred)
  { id: 'asgn-h01', studentId: 'stu-001', seatId: 'A5', shift: 'evening', startDate: '2026-07-01', endDate: '2026-07-11', status: 'transferred', createdAt: '2026-07-01T10:00:00Z' },
  { id: 'asgn-h02', studentId: 'stu-015', seatId: 'D4', shift: 'evening', startDate: '2026-05-14', endDate: '2026-08-01', status: 'ended', createdAt: '2026-05-14T09:00:00Z' },
];

// ─── Fee Records ─────────────────────────────────────────────────────────────

const today = todayStr();

export const MOCK_FEE_RECORDS: FeeRecord[] = [
  // Rahul Kumar (stu-001) - admission 12 Jul - cycle: 12th of each month
  { id: 'fee-001', studentId: 'stu-001', periodStart: '2026-07-12', periodEnd: '2026-08-11', amount: 600, dueDate: '2026-07-12', paidDate: '2026-07-13', status: 'paid', paymentMethod: 'cash', createdAt: '2026-07-12T10:00:00Z' },
  { id: 'fee-002', studentId: 'stu-001', periodStart: '2026-08-12', periodEnd: '2026-09-11', amount: 600, dueDate: '2026-08-12', status: 'overdue', createdAt: '2026-08-12T10:00:00Z' },
  // Priya Sharma (stu-002) - admission 15 Jul
  { id: 'fee-003', studentId: 'stu-002', periodStart: '2026-07-15', periodEnd: '2026-08-14', amount: 600, dueDate: '2026-07-15', paidDate: '2026-07-16', status: 'paid', paymentMethod: 'upi', createdAt: '2026-07-15T11:00:00Z' },
  { id: 'fee-004', studentId: 'stu-002', periodStart: '2026-08-15', periodEnd: '2026-09-14', amount: 600, dueDate: '2026-08-15', paidDate: '2026-08-16', status: 'paid', paymentMethod: 'upi', createdAt: '2026-08-15T11:00:00Z' },
  // Amit Deshmukh (stu-003) - admission 18 Jul
  { id: 'fee-005', studentId: 'stu-003', periodStart: '2026-07-18', periodEnd: '2026-08-17', amount: 1000, dueDate: '2026-07-18', paidDate: '2026-07-19', status: 'paid', paymentMethod: 'cash', createdAt: '2026-07-18T09:00:00Z' },
  { id: 'fee-006', studentId: 'stu-003', periodStart: '2026-08-18', periodEnd: '2026-09-17', amount: 1000, dueDate: '2026-08-18', status: 'overdue', createdAt: '2026-08-18T09:00:00Z' },
  // Neha Patil (stu-004) - admission 20 Jul
  { id: 'fee-007', studentId: 'stu-004', periodStart: '2026-07-20', periodEnd: '2026-08-19', amount: 600, dueDate: '2026-07-20', paidDate: '2026-07-21', status: 'paid', paymentMethod: 'upi', createdAt: '2026-07-20T10:00:00Z' },
  { id: 'fee-008', studentId: 'stu-004', periodStart: '2026-08-20', periodEnd: '2026-09-19', amount: 600, dueDate: '2026-08-20', status: 'upcoming', createdAt: '2026-08-20T10:00:00Z' },
  // Vijay Singh (stu-005) - admission 22 Jul
  { id: 'fee-009', studentId: 'stu-005', periodStart: '2026-07-22', periodEnd: '2026-08-21', amount: 600, dueDate: '2026-07-22', paidDate: '2026-07-23', status: 'paid', paymentMethod: 'cash', createdAt: '2026-07-22T10:00:00Z' },
  { id: 'fee-010', studentId: 'stu-005', periodStart: '2026-08-22', periodEnd: '2026-09-21', amount: 600, dueDate: '2026-08-22', status: 'overdue', createdAt: '2026-08-22T10:00:00Z' },
  // Ankita Joshi (stu-006) - admission 1 Aug
  { id: 'fee-011', studentId: 'stu-006', periodStart: '2026-08-01', periodEnd: '2026-08-31', amount: 1000, dueDate: '2026-08-01', paidDate: '2026-08-02', status: 'paid', paymentMethod: 'upi', createdAt: '2026-08-01T09:30:00Z' },
  // Saurabh Rao (stu-007) - admission 5 Aug  
  { id: 'fee-012', studentId: 'stu-007', periodStart: '2026-08-05', periodEnd: '2026-09-04', amount: 600, dueDate: '2026-08-05', paidDate: '2026-08-06', status: 'paid', paymentMethod: 'cash', createdAt: '2026-08-05T11:00:00Z' },
  // Pooja Mehta (stu-008) - admission 8 Aug
  { id: 'fee-013', studentId: 'stu-008', periodStart: '2026-08-08', periodEnd: '2026-09-07', amount: 600, dueDate: '2026-08-08', paidDate: '2026-08-08', status: 'paid', paymentMethod: 'upi', createdAt: '2026-08-08T10:00:00Z' },
  // Karan Verma (stu-009) - admission 10 Aug
  { id: 'fee-014', studentId: 'stu-009', periodStart: '2026-08-10', periodEnd: '2026-09-09', amount: 600, dueDate: '2026-08-10', paidDate: '2026-08-11', status: 'paid', paymentMethod: 'upi', createdAt: '2026-08-10T09:00:00Z' },
  // Ritu Gupta (stu-010) - admission 12 Aug
  { id: 'fee-015', studentId: 'stu-010', periodStart: '2026-08-12', periodEnd: '2026-09-11', amount: 600, dueDate: '2026-08-12', paidDate: '2026-08-13', status: 'paid', paymentMethod: 'cash', createdAt: '2026-08-12T10:30:00Z' },
  // Manoj Pandey (stu-011) - admission 15 Aug
  { id: 'fee-016', studentId: 'stu-011', periodStart: '2026-08-15', periodEnd: '2026-09-14', amount: 1000, dueDate: '2026-08-15', paidDate: '2026-08-16', status: 'paid', paymentMethod: 'cash', createdAt: '2026-08-15T09:00:00Z' },
  // Sneha Kulkarni (stu-012) - admission 18 Aug - upcoming
  { id: 'fee-017', studentId: 'stu-012', periodStart: '2026-08-18', periodEnd: '2026-09-17', amount: 600, dueDate: '2026-08-18', paidDate: '2026-08-18', status: 'paid', paymentMethod: 'upi', createdAt: '2026-08-18T10:00:00Z' },
  // Deepak Nair (stu-013) - admission 10 Jun
  { id: 'fee-018', studentId: 'stu-013', periodStart: '2026-07-10', periodEnd: '2026-08-09', amount: 600, dueDate: '2026-07-10', paidDate: '2026-07-11', status: 'paid', paymentMethod: 'cash', createdAt: '2026-07-10T10:00:00Z' },
  { id: 'fee-019', studentId: 'stu-013', periodStart: '2026-08-10', periodEnd: '2026-09-09', amount: 600, dueDate: '2026-08-10', paidDate: '2026-08-12', status: 'paid', paymentMethod: 'upi', createdAt: '2026-08-10T10:00:00Z' },
  // Kavita Bhat (stu-014) - admission 20 Jun
  { id: 'fee-020', studentId: 'stu-014', periodStart: '2026-07-20', periodEnd: '2026-08-19', amount: 600, dueDate: '2026-07-20', paidDate: '2026-07-21', status: 'paid', paymentMethod: 'cash', createdAt: '2026-07-20T09:00:00Z' },
  { id: 'fee-021', studentId: 'stu-014', periodStart: '2026-08-20', periodEnd: '2026-09-19', amount: 600, dueDate: '2026-08-20', status: 'upcoming', createdAt: '2026-08-20T09:00:00Z' },
];

// ─── Attendance Records ───────────────────────────────────────────────────────

function makeAttendance(
  studentId: string,
  shift: 'afternoon' | 'evening' | 'fullday',
  dates: string[],
  absentDates: string[] = []
): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  dates.forEach(date => {
    const status = absentDates.includes(date) ? 'absent' : 'present';
    records.push({
      id: generateId(),
      studentId,
      date,
      shift,
      status,
      checkInTime: status === 'present' ? '09:30 AM' : undefined,
    });
  });
  return records;
}

// Generate dates for August 2026
const augDates = Array.from({ length: 24 }, (_, i) => {
  const d = i + 1;
  return `2026-08-${d.toString().padStart(2, '0')}`;
});

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  ...makeAttendance('stu-001', 'evening', augDates, ['2026-08-05', '2026-08-12', '2026-08-19']),
  ...makeAttendance('stu-002', 'afternoon', augDates, ['2026-08-08', '2026-08-15']),
  ...makeAttendance('stu-003', 'fullday', augDates, ['2026-08-10']),
  ...makeAttendance('stu-004', 'afternoon', augDates, ['2026-08-03', '2026-08-17', '2026-08-22']),
  ...makeAttendance('stu-005', 'evening', augDates, ['2026-08-07', '2026-08-14']),
  ...makeAttendance('stu-006', 'fullday', augDates, ['2026-08-20']),
  ...makeAttendance('stu-007', 'afternoon', augDates.slice(4), ['2026-08-18']),
  ...makeAttendance('stu-008', 'evening', augDates.slice(7), ['2026-08-21']),
  ...makeAttendance('stu-009', 'afternoon', augDates.slice(9), []),
  ...makeAttendance('stu-010', 'evening', augDates.slice(11), ['2026-08-23']),
  ...makeAttendance('stu-011', 'fullday', augDates.slice(14), []),
  ...makeAttendance('stu-012', 'afternoon', augDates.slice(17), []),
  ...makeAttendance('stu-013', 'evening', augDates, ['2026-08-09', '2026-08-16', '2026-08-23']),
  ...makeAttendance('stu-014', 'afternoon', augDates, ['2026-08-11', '2026-08-18']),
];

// ─── Enquiries ────────────────────────────────────────────────────────────────

export const MOCK_ENQUIRIES: Enquiry[] = [
  {
    id: 'enq-001',
    name: 'Suresh Jadhav',
    phone: '9876520001',
    requirement: 'afternoon',
    preferredDate: '2026-08-25',
    notes: 'Wants morning hours, preparing for MPSC',
    status: 'new',
    createdAt: '2026-08-24T08:30:00Z',
  },
  {
    id: 'enq-002',
    name: 'Anita Wagh',
    phone: '9876521001',
    requirement: 'fullday',
    preferredDate: '2026-08-24',
    notes: 'Bank exam preparation',
    status: 'followup',
    createdAt: '2026-08-23T14:00:00Z',
  },
  {
    id: 'enq-003',
    name: 'Prakash More',
    phone: '9876522001',
    requirement: 'evening',
    preferredDate: '2026-09-01',
    status: 'new',
    createdAt: '2026-08-23T10:00:00Z',
  },
  {
    id: 'enq-004',
    name: 'Megha Shinde',
    phone: '9876523001',
    requirement: 'afternoon',
    preferredDate: '2026-08-26',
    notes: 'NEET aspirant',
    status: 'converted',
    createdAt: '2026-08-20T09:00:00Z',
  },
];
