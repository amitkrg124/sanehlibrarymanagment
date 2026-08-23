import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Student,
  SeatAssignment,
  FeeRecord,
  AttendanceRecord,
  Enquiry,
  LibrarySettings,
} from '../types';
import {
  MOCK_STUDENTS,
  MOCK_ASSIGNMENTS,
  MOCK_FEE_RECORDS,
  MOCK_ATTENDANCE,
  MOCK_ENQUIRIES,
  DEFAULT_SETTINGS,
} from '../data/mockData';
import {
  generateId,
  todayStr,
  computeFeeStatus,
  computeSeatAvailability,
  countAvailableSeats,
  ALL_SEAT_IDS,
} from '../lib/utils';
import { format, addMonths, parseISO } from 'date-fns';
import {
  supabase,
  isSupabaseConfigured,
  mapStudentToDb,
  mapStudentFromDb,
  mapAssignmentToDb,
  mapAssignmentFromDb,
  mapFeeRecordToDb,
  mapFeeRecordFromDb,
  mapAttendanceToDb,
  mapAttendanceFromDb,
  mapEnquiryToDb,
  mapEnquiryFromDb,
  mapSettingsToDb,
  mapSettingsFromDb,
} from '../lib/supabase';
import toast from 'react-hot-toast';

// ─── Auth Store ──────────────────────────────────────────────────────────────

interface AuthState {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      login: (password: string) => {
        const settings = useLibraryStore.getState().settings;
        if (password === settings.adminPassword) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthenticated: false }),
    }),
    { name: 'saneh-auth' }
  )
);

// ─── Library Store (Settings) ─────────────────────────────────────────────────

interface LibraryState {
  settings: LibrarySettings;
  updateSettings: (settings: Partial<LibrarySettings>) => void;
  syncSettingsFromCloud: () => Promise<void>;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (s) => {
        set((state) => ({ settings: { ...state.settings, ...s } }));

        // Cloud sync settings
        if (isSupabaseConfigured()) {
          const settings = get().settings;
          supabase
            .from('library_settings')
            .upsert(mapSettingsToDb(settings))
            .then(({ error }) => {
              if (error) console.error('Error syncing settings to cloud:', error);
            });
        }
      },
      syncSettingsFromCloud: async () => {
        if (!isSupabaseConfigured()) return;
        try {
          const { data, error } = await supabase
            .from('library_settings')
            .select('*')
            .eq('id', 'settings')
            .single();

          if (data && !error) {
            set({ settings: mapSettingsFromDb(data) });
          }
        } catch (e) {
          console.error('Error fetching settings from cloud:', e);
        }
      },
    }),
    { name: 'saneh-settings' }
  )
);

// ─── Main App Store ───────────────────────────────────────────────────────────

interface AppState {
  students: Student[];
  assignments: SeatAssignment[];
  feeRecords: FeeRecord[];
  attendance: AttendanceRecord[];
  enquiries: Enquiry[];
  disabledSeats: string[];
  isCloudSyncing: boolean;

  // ── Sync ──
  initCloudSync: () => Promise<void>;

  // ── Students ──
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deactivateStudent: (id: string) => void;

  // ── Seat Assignments ──
  assignSeat: (studentId: string, seatId: string, shift: SeatAssignment['shift'], startDate: string) => void;
  changeSeat: (studentId: string, newSeatId: string, effectiveDate: string) => void;
  
  // ── Fees ──
  addFeeRecord: (record: Omit<FeeRecord, 'id' | 'createdAt'>) => void;
  markFeePaid: (feeId: string, paidDate: string, method: FeeRecord['paymentMethod'], notes?: string) => void;
  generateNextFee: (studentId: string) => void;

  // ── Attendance ──
  markAttendance: (studentId: string, date: string, shift: AttendanceRecord['shift'], status: AttendanceRecord['status']) => void;
  markAllPresent: (date: string, shift: AttendanceRecord['shift']) => void;

  // ── Enquiries ──
  addEnquiry: (enquiry: Omit<Enquiry, 'id' | 'createdAt'>) => void;
  updateEnquiryStatus: (id: string, status: Enquiry['status']) => void;

  // ── Seats ──
  toggleSeatDisabled: (seatId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      students: MOCK_STUDENTS,
      assignments: MOCK_ASSIGNMENTS,
      feeRecords: MOCK_FEE_RECORDS,
      attendance: MOCK_ATTENDANCE,
      enquiries: MOCK_ENQUIRIES,
      disabledSeats: [],
      isCloudSyncing: false,

      // ── Sync ──
      initCloudSync: async () => {
        if (!isSupabaseConfigured()) return;
        set({ isCloudSyncing: true });

        try {
          // Check if students exist in the cloud
          const { count, error: countErr } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true });

          if (countErr) throw countErr;

          if (count === 0) {
            // ─── CASE A: Cloud is empty, perform automatic local -> cloud migration ───
            const toastId = toast.loading('Syncing Saneh Library data to cloud...');

            // Upload students
            if (get().students.length > 0) {
              await supabase.from('students').insert(get().students.map(mapStudentToDb));
            }
            // Upload assignments
            if (get().assignments.length > 0) {
              await supabase.from('assignments').insert(get().assignments.map(mapAssignmentToDb));
            }
            // Upload fees
            if (get().feeRecords.length > 0) {
              await supabase.from('fee_records').insert(get().feeRecords.map(mapFeeRecordToDb));
            }
            // Upload attendance
            if (get().attendance.length > 0) {
              await supabase.from('attendance').insert(get().attendance.map(mapAttendanceToDb));
            }
            // Upload enquiries
            if (get().enquiries.length > 0) {
              await supabase.from('enquiries').insert(get().enquiries.map(mapEnquiryToDb));
            }
            // Upload disabled seats
            if (get().disabledSeats.length > 0) {
              await supabase.from('disabled_seats').insert(get().disabledSeats.map(id => ({ seat_id: id })));
            }
            // Upload settings
            const settings = useLibraryStore.getState().settings;
            await supabase.from('library_settings').upsert(mapSettingsToDb(settings));

            toast.success('All library records migrated to the cloud successfully! ☁️', { id: toastId });
          } else {
            // ─── CASE B: Cloud has data, pull down from cloud to local storage ───
            const [
              { data: students },
              { data: assignments },
              { data: fees },
              { data: atts },
              { data: enqs },
              { data: disabled },
            ] = await Promise.all([
              supabase.from('students').select('*'),
              supabase.from('assignments').select('*'),
              supabase.from('fee_records').select('*'),
              supabase.from('attendance').select('*'),
              supabase.from('enquiries').select('*'),
              supabase.from('disabled_seats').select('*'),
            ]);

            set({
              students: (students || []).map(mapStudentFromDb),
              assignments: (assignments || []).map(mapAssignmentFromDb),
              feeRecords: (fees || []).map(mapFeeRecordFromDb),
              attendance: (atts || []).map(mapAttendanceFromDb),
              enquiries: (enqs || []).map(mapEnquiryFromDb),
              disabledSeats: (disabled || []).map(d => d.seat_id),
            });

            // Sync settings too
            await useLibraryStore.getState().syncSettingsFromCloud();

            toast.success('Successfully synced Saneh Library with the cloud! ⚡');
          }
        } catch (e) {
          console.error('Failed to initialize cloud sync:', e);
          toast.error('Cloud connection failed. Operating in offline local mode.');
        } finally {
          set({ isCloudSyncing: false });
        }
      },

      // ── Students ──
      addStudent: (data) => {
        const newStudent: Student = {
          ...data,
          id: `stu-${generateId()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Auto-generate first fee record
        const feeRecord: FeeRecord = {
          id: `fee-${generateId()}`,
          studentId: newStudent.id,
          periodStart: newStudent.admissionDate,
          periodEnd: format(addMonths(parseISO(newStudent.admissionDate), 1), 'yyyy-MM-dd'),
          amount: newStudent.monthlyFee,
          dueDate: newStudent.admissionDate,
          status: 'due',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          students: [...state.students, newStudent],
          feeRecords: [...state.feeRecords, feeRecord],
        }));

        // Supabase insertion
        if (isSupabaseConfigured()) {
          supabase.from('students').insert(mapStudentToDb(newStudent)).then(({ error }) => {
            if (error) console.error('Error inserting student:', error);
          });
          supabase.from('fee_records').insert(mapFeeRecordToDb(feeRecord)).then(({ error }) => {
            if (error) console.error('Error inserting fee record:', error);
          });
        }

        return newStudent;
      },

      updateStudent: (id, data) => {
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
          ),
        }));

        if (isSupabaseConfigured()) {
          const updated = get().students.find(s => s.id === id);
          if (updated) {
            supabase.from('students').update(mapStudentToDb(updated)).eq('id', id).then(({ error }) => {
              if (error) console.error('Error updating student:', error);
            });
          }
        }
      },

      deactivateStudent: (id) => {
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id ? { ...s, status: 'inactive', currentSeatId: undefined, updatedAt: new Date().toISOString() } : s
          ),
          assignments: state.assignments.map((a) =>
            a.studentId === id && a.status === 'active'
              ? { ...a, status: 'ended', endDate: todayStr() }
              : a
          ),
        }));

        if (isSupabaseConfigured()) {
          supabase.from('students').update({ status: 'inactive', current_seat_id: null }).eq('id', id).then(({ error }) => {
            if (error) console.error('Error deactivating student:', error);
          });
          supabase.from('assignments')
            .update({ status: 'ended', end_date: todayStr() })
            .eq('student_id', id)
            .eq('status', 'active')
            .then(({ error }) => {
              if (error) console.error('Error ending assignments:', error);
            });
        }
      },

      // ── Seat Assignments ──
      assignSeat: (studentId, seatId, shift, startDate) => {
        const newAssignment: SeatAssignment = {
          id: `asgn-${generateId()}`,
          studentId,
          seatId,
          shift,
          startDate,
          status: 'active',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          assignments: [...state.assignments, newAssignment],
          students: state.students.map((s) =>
            s.id === studentId ? { ...s, currentSeatId: seatId, updatedAt: new Date().toISOString() } : s
          ),
        }));

        if (isSupabaseConfigured()) {
          supabase.from('assignments').insert(mapAssignmentToDb(newAssignment)).then(({ error }) => {
            if (error) console.error('Error inserting assignment:', error);
          });
          supabase.from('students').update({ current_seat_id: seatId }).eq('id', studentId).then(({ error }) => {
            if (error) console.error('Error assigning seat to student:', error);
          });
        }
      },

      changeSeat: (studentId, newSeatId, effectiveDate) => {
        let newAssignment: SeatAssignment;

        set((state) => {
          const student = state.students.find((s) => s.id === studentId);
          if (!student) return state;

          const updatedAssignments = state.assignments.map((a) => {
            if (a.studentId === studentId && a.status === 'active') {
              return { ...a, status: 'transferred' as const, endDate: effectiveDate };
            }
            return a;
          });

          newAssignment = {
            id: `asgn-${generateId()}`,
            studentId,
            seatId: newSeatId,
            shift: student.membershipType,
            startDate: effectiveDate,
            status: 'active',
            createdAt: new Date().toISOString(),
          };

          return {
            assignments: [...updatedAssignments, newAssignment],
            students: state.students.map((s) =>
              s.id === studentId ? { ...s, currentSeatId: newSeatId, updatedAt: new Date().toISOString() } : s
            ),
          };
        });

        if (isSupabaseConfigured()) {
          supabase.from('assignments')
            .update({ status: 'transferred', end_date: effectiveDate })
            .eq('student_id', studentId)
            .eq('status', 'active')
            .then(({ error }) => {
              if (error) {
                console.error('Error transferring assignment:', error);
              } else {
                supabase.from('assignments').insert(mapAssignmentToDb(newAssignment)).then(({ error: err2 }) => {
                  if (err2) console.error('Error inserting new seat assignment:', err2);
                });
              }
            });
          supabase.from('students').update({ current_seat_id: newSeatId }).eq('id', studentId).then(({ error }) => {
            if (error) console.error('Error updating seat in student profile:', error);
          });
        }
      },

      // ── Fees ──
      addFeeRecord: (record) => {
        const newRecord: FeeRecord = {
          ...record,
          id: `fee-${generateId()}`,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ feeRecords: [...state.feeRecords, newRecord] }));

        if (isSupabaseConfigured()) {
          supabase.from('fee_records').insert(mapFeeRecordToDb(newRecord)).then(({ error }) => {
            if (error) console.error('Error adding fee record:', error);
          });
        }
      },

      markFeePaid: (feeId, paidDate, method, notes) => {
        let nextFee: FeeRecord | null = null;

        set((state) => {
          const updatedFees = state.feeRecords.map((f) =>
            f.id === feeId
              ? { ...f, status: 'paid' as const, paidDate, paymentMethod: method, notes: notes ?? f.notes }
              : f
          );

          const fee = state.feeRecords.find((f) => f.id === feeId);
          if (fee) {
            const nextStart = fee.periodEnd;
            const nextEnd = format(addMonths(parseISO(nextStart), 1), 'yyyy-MM-dd');
            const student = state.students.find((s) => s.id === fee.studentId);
            if (student) {
              nextFee = {
                id: `fee-${generateId()}`,
                studentId: fee.studentId,
                periodStart: nextStart,
                periodEnd: nextEnd,
                amount: fee.amount,
                dueDate: nextStart,
                status: 'upcoming' as const,
                createdAt: new Date().toISOString(),
              };
              return {
                feeRecords: [...updatedFees, nextFee],
              };
            }
          }
          return { feeRecords: updatedFees };
        });

        if (isSupabaseConfigured()) {
          const updated = get().feeRecords.find(f => f.id === feeId);
          if (updated) {
            supabase.from('fee_records').update(mapFeeRecordToDb(updated)).eq('id', feeId).then(({ error }) => {
              if (error) console.error('Error updating fee paid status:', error);
            });
          }
          if (nextFee) {
            supabase.from('fee_records').insert(mapFeeRecordToDb(nextFee)).then(({ error }) => {
              if (error) console.error('Error adding next month fee record:', error);
            });
          }
        }
      },

      generateNextFee: (studentId) => {
        const records = get().feeRecords.filter((f) => f.studentId === studentId);
        const latest = records.sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))[0];
        if (!latest) return;

        const student = get().students.find((s) => s.id === studentId);
        if (!student) return;

        const nextStart = latest.periodEnd;
        const nextEnd = format(addMonths(parseISO(nextStart), 1), 'yyyy-MM-dd');
        
        const newFee: FeeRecord = {
          id: `fee-${generateId()}`,
          studentId,
          periodStart: nextStart,
          periodEnd: nextEnd,
          amount: student.monthlyFee,
          dueDate: nextStart,
          status: 'upcoming',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ feeRecords: [...state.feeRecords, newFee] }));

        if (isSupabaseConfigured()) {
          supabase.from('fee_records').insert(mapFeeRecordToDb(newFee)).then(({ error }) => {
            if (error) console.error('Error generating next fee record:', error);
          });
        }
      },

      // ── Attendance ──
      markAttendance: (studentId, date, shift, status) => {
        let isUpsertRecord: AttendanceRecord;

        set((state) => {
          const existing = state.attendance.find(
            (a) => a.studentId === studentId && a.date === date && a.shift === shift
          );

          if (existing) {
            const updated = state.attendance.map((a) =>
              a.studentId === studentId && a.date === date && a.shift === shift
                ? { ...a, status }
                : a
            );
            isUpsertRecord = updated.find(a => a.studentId === studentId && a.date === date && a.shift === shift)!;
            return { attendance: updated };
          }

          isUpsertRecord = { id: generateId(), studentId, date, shift, status };
          return {
            attendance: [...state.attendance, isUpsertRecord],
          };
        });

        if (isSupabaseConfigured()) {
          supabase.from('attendance').upsert(mapAttendanceToDb(isUpsertRecord!)).then(({ error }) => {
            if (error) console.error('Error marking attendance:', error);
          });
        }
      },

      markAllPresent: (date, shift) => {
        const { students, assignments, attendance } = get();
        const today = date;
        const activeStudents = students.filter((s) => {
          if (s.status !== 'active') return false;
          const asgns = assignments.filter(
            (a) => a.studentId === s.id && a.status === 'active' && 
            (a.shift === shift || (shift === 'fullday' && a.shift === 'fullday') ||
            (shift === 'afternoon' && (a.shift === 'afternoon' || a.shift === 'fullday')) ||
            (shift === 'evening' && (a.shift === 'evening' || a.shift === 'fullday')))
          );
          return asgns.length > 0;
        });

        const newRecords: AttendanceRecord[] = [];
        const updatedRecords = [...attendance];

        activeStudents.forEach((s) => {
          const idx = updatedRecords.findIndex(
            (a) => a.studentId === s.id && a.date === today && a.shift === shift
          );
          if (idx >= 0) {
            updatedRecords[idx] = { ...updatedRecords[idx], status: 'present' };
          } else {
            newRecords.push({ id: generateId(), studentId: s.id, date: today, shift: s.membershipType, status: 'present' });
          }
        });

        const finalAttendance = [...updatedRecords, ...newRecords];
        set({ attendance: finalAttendance });

        if (isSupabaseConfigured()) {
          // Upsert all marked/modified attendance records for this date/shift
          const recordsToUpsert = finalAttendance.filter(a => a.date === today && (a.shift === shift || a.status === 'present'));
          supabase.from('attendance').upsert(recordsToUpsert.map(mapAttendanceToDb)).then(({ error }) => {
            if (error) console.error('Error batch upserting attendance:', error);
          });
        }
      },

      // ── Enquiries ──
      addEnquiry: (enquiry) => {
        const newEnquiry: Enquiry = {
          ...enquiry,
          id: `enq-${generateId()}`,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ enquiries: [newEnquiry, ...state.enquiries] }));

        if (isSupabaseConfigured()) {
          supabase.from('enquiries').insert(mapEnquiryToDb(newEnquiry)).then(({ error }) => {
            if (error) console.error('Error inserting enquiry:', error);
          });
        }
      },

      updateEnquiryStatus: (id, status) => {
        set((state) => ({
          enquiries: state.enquiries.map((e) => (e.id === id ? { ...e, status } : e)),
        }));

        if (isSupabaseConfigured()) {
          supabase.from('enquiries').update({ status }).eq('id', id).then(({ error }) => {
            if (error) console.error('Error updating enquiry status:', error);
          });
        }
      },

      // ── Seats ──
      toggleSeatDisabled: (seatId) => {
        let currentlyDisabled = false;

        set((state) => {
          const isDisabled = state.disabledSeats.includes(seatId);
          currentlyDisabled = !isDisabled;
          return {
            disabledSeats: isDisabled
              ? state.disabledSeats.filter((s) => s !== seatId)
              : [...state.disabledSeats, seatId],
          };
        });

        if (isSupabaseConfigured()) {
          if (currentlyDisabled) {
            supabase.from('disabled_seats').insert({ seat_id: seatId }).then(({ error }) => {
              if (error) console.error('Error disabling seat:', error);
            });
          } else {
            supabase.from('disabled_seats').delete().eq('seat_id', seatId).then(({ error }) => {
              if (error) console.error('Error enabling seat:', error);
            });
          }
        }
      },
    }),
    { name: 'saneh-library-data' }
  )
);
