// --- Enums -----------------------------------------------------------------

export type Shift = 'afternoon' | 'evening' | 'fullday' | 'unreserved';
export type SeatType = 'reserved' | 'unreserved';
export type SeatStatus = 'available' | 'afternoon' | 'evening' | 'fullday' | 'disabled';
export type StudentStatus = 'active' | 'inactive';
export type FeeStatus = 'paid' | 'due' | 'overdue' | 'upcoming';
export type AttendanceStatus = 'present' | 'absent' | 'holiday' | 'unmarked';
export type EnquiryStatus = 'new' | 'followup' | 'converted' | 'not_interested';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'other';

// --- Seat ------------------------------------------------------------------

export interface Seat {
  id: string;           // e.g. "A1"
  section: string;      // e.g. "A"
  number: number;       // e.g. 1
  isDisabled: boolean;
}

// --- Student ---------------------------------------------------------------

export interface Student {
  id: string;
  registrationNo?: string;   // Manual Registration No. e.g. "SAN-101"
  seatType?: SeatType;       // 'reserved' (default) or 'unreserved'
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  admissionDate: string;     // ISO date string
  membershipType: Shift;
  planHours?: string;        // e.g. "2 Hours", "4 Hours", "Flexible" for unreserved
  monthlyFee: number;
  currentSeatId?: string;
  status: StudentStatus;
  notes?: string;
  emergencyContact?: string;
  verificationType?: string;
  verificationId?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Seat Assignment -------------------------------------------------------

export interface SeatAssignment {
  id: string;
  studentId: string;
  seatId: string;
  shift: Shift;
  startDate: string;         // ISO date string
  endDate?: string;          // ISO date string, null means ongoing
  status: 'active' | 'transferred' | 'ended';
  createdAt: string;
}

// --- Fee Record ------------------------------------------------------------

export interface FeeRecord {
  id: string;
  studentId: string;
  periodStart: string;       // ISO date string
  periodEnd: string;         // ISO date string
  amount: number;
  dueDate: string;           // ISO date string
  paidDate?: string;         // ISO date string
  status: FeeStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
}

// --- Attendance ------------------------------------------------------------

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;              // ISO date string (YYYY-MM-DD)
  shift: Shift;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
}

// --- Enquiry ---------------------------------------------------------------

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  requirement: Shift;
  preferredDate: string;
  notes?: string;
  status: EnquiryStatus;
  createdAt: string;
}

// --- Settings --------------------------------------------------------------

export interface LibrarySettings {
  libraryName: string;
  contactNumber: string;
  address: string;
  afternoonStart: string;    // "07:00"
  afternoonEnd: string;      // "14:00"
  eveningStart: string;      // "14:00"
  eveningEnd: string;        // "21:00"
  defaultAfternoonFee: number;
  defaultEveningFee: number;
  defaultFullDayFee: number;
  defaultUnreservedFee?: number;
  reminderDaysBefore: number;
  adminPassword: string;
}

// --- Derived / Computed ----------------------------------------------------

export interface SeatAvailability {
  seatId: string;
  afternoon: boolean;
  evening: boolean;
  fullday: boolean;
  afternoonStudent?: Student;
  eveningStudent?: Student;
  fulldayStudent?: Student;
}

export interface DashboardStats {
  totalSeats: number;
  availableNow: number;
  occupied: number;
  afternoonAvailable: number;
  eveningAvailable: number;
  fulldayAvailable: number;
  feesduToday: number;
  feesOverdue: number;
  todayAfternoonTotal: number;
  todayAfternoonPresent: number;
  todayEveningTotal: number;
  todayEveningPresent: number;
}
