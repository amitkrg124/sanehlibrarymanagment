import { createClient } from '@supabase/supabase-js';
import type { Student, SeatAssignment, FeeRecord, AttendanceRecord, Enquiry, LibrarySettings } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && !supabaseUrl.startsWith('YOUR_');
};

// --- Mapper Utilities (CamelCase <-> SnakeCase) ------------------------------

export function mapStudentToDb(s: Student) {
  const result: any = {
    id: s.id,
    name: s.name,
    phone: s.phone,
    alternate_phone: s.alternatePhone || null,
    email: s.email || null,
    address: s.address || null,
    admission_date: s.admissionDate,
    membership_type: s.membershipType,
    monthly_fee: s.monthlyFee,
    current_seat_id: s.currentSeatId || null,
    status: s.status,
    notes: s.notes || null,
  };
  if (s.verificationType) result.verification_type = s.verificationType;
  if (s.verificationId) result.verification_id = s.verificationId;
  if (s.registrationNo) result.registration_no = s.registrationNo;
  if (s.seatType) result.seat_type = s.seatType;
  if (s.planHours) result.plan_hours = s.planHours;
  return result;
}

export function mapStudentFromDb(s: any): Student {
  // Extract registrationNo from column or notes fallback if available
  let regNo = s.registration_no || undefined;
  let seatType = s.seat_type || (s.current_seat_id ? 'reserved' : (s.membership_type === 'unreserved' ? 'unreserved' : 'reserved'));
  let planHours = s.plan_hours || undefined;

  if (!regNo && s.notes && s.notes.includes('[RegNo:')) {
    const match = s.notes.match(/\[RegNo:\s*([^\]]+)\]/);
    if (match) regNo = match[1].trim();
  }
  if (!s.seat_type && s.notes && s.notes.includes('[SeatType: Unreserved')) {
    seatType = 'unreserved';
  }

  return {
    id: s.id,
    registrationNo: regNo,
    seatType: seatType as 'reserved' | 'unreserved',
    planHours: planHours,
    name: s.name,
    phone: s.phone,
    alternatePhone: s.alternate_phone || undefined,
    email: s.email || undefined,
    address: s.address || undefined,
    admissionDate: s.admission_date,
    membershipType: s.membership_type,
    monthlyFee: Number(s.monthly_fee),
    currentSeatId: s.current_seat_id || undefined,
    status: s.status,
    notes: s.notes || undefined,
    verificationType: s.verification_type || undefined,
    verificationId: s.verification_id || undefined,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

export function mapAssignmentToDb(a: SeatAssignment) {
  return {
    id: a.id,
    student_id: a.studentId,
    seat_id: a.seatId,
    shift: a.shift,
    start_date: a.startDate,
    end_date: a.endDate || null,
    status: a.status,
  };
}

export function mapAssignmentFromDb(a: any): SeatAssignment {
  return {
    id: a.id,
    studentId: a.student_id,
    seatId: a.seat_id,
    shift: a.shift,
    startDate: a.start_date,
    endDate: a.end_date || undefined,
    status: a.status,
    createdAt: a.created_at || new Date().toISOString(),
  };
}

export function mapFeeRecordToDb(f: FeeRecord) {
  return {
    id: f.id,
    student_id: f.studentId,
    amount: f.amount,
    period_start: f.periodStart,
    period_end: f.periodEnd,
    due_date: f.dueDate,
    paid_date: f.paidDate || null,
    status: f.status,
    payment_method: f.paymentMethod || null,
    notes: f.notes || null,
  };
}

export function mapFeeRecordFromDb(f: any): FeeRecord {
  return {
    id: f.id,
    studentId: f.student_id,
    amount: Number(f.amount),
    periodStart: f.period_start,
    periodEnd: f.period_end,
    dueDate: f.due_date,
    paidDate: f.paid_date || undefined,
    status: f.status,
    paymentMethod: f.payment_method || undefined,
    notes: f.notes || undefined,
    createdAt: f.created_at,
  };
}

export function mapAttendanceToDb(a: AttendanceRecord) {
  const result: any = {
    id: a.id,
    student_id: a.studentId,
    date: a.date,
    shift: a.shift,
    status: a.status,
  };
  if (a.checkInTime) result.check_in_time = a.checkInTime;
  if (a.checkOutTime) result.check_out_time = a.checkOutTime;
  return result;
}

export function mapAttendanceFromDb(a: any): AttendanceRecord {
  return {
    id: a.id,
    studentId: a.student_id,
    date: a.date,
    shift: a.shift,
    status: a.status,
    checkInTime: a.check_in_time || undefined,
    checkOutTime: a.check_out_time || undefined,
  };
}

export function mapEnquiryToDb(e: Enquiry) {
  return {
    id: e.id,
    name: e.name,
    phone: e.phone,
    requirement: e.requirement,
    preferred_date: e.preferredDate,
    status: e.status,
    notes: e.notes || null,
  };
}

export function mapEnquiryFromDb(e: any): Enquiry {
  return {
    id: e.id,
    name: e.name,
    phone: e.phone,
    requirement: e.requirement,
    preferredDate: e.preferred_date,
    status: e.status,
    notes: e.notes || undefined,
    createdAt: e.created_at,
  };
}

export function mapSettingsToDb(s: LibrarySettings) {
  return {
    id: 'settings',
    library_name: s.libraryName,
    contact_number: s.contactNumber || null,
    address: s.address || null,
    afternoon_start: s.afternoonStart,
    afternoon_end: s.afternoonEnd,
    evening_start: s.eveningStart,
    evening_end: s.eveningEnd,
    default_afternoon_fee: s.defaultAfternoonFee,
    default_evening_fee: s.defaultEveningFee,
    default_full_day_fee: s.defaultFullDayFee,
    reminder_days_before: s.reminderDaysBefore,
    admin_password: s.adminPassword,
  };
}

export function mapSettingsFromDb(s: any): LibrarySettings {
  return {
    libraryName: s.library_name,
    contactNumber: s.contact_number || undefined,
    address: s.address || undefined,
    afternoonStart: s.afternoon_start,
    afternoonEnd: s.afternoon_end,
    eveningStart: s.evening_start,
    eveningEnd: s.evening_end,
    defaultAfternoonFee: Number(s.default_afternoon_fee),
    defaultEveningFee: Number(s.default_evening_fee),
    defaultFullDayFee: Number(s.default_full_day_fee),
    reminderDaysBefore: Number(s.reminder_days_before),
    adminPassword: s.admin_password,
  };
}
