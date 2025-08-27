/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useReducer, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import { useAuth } from './useAuth';

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut?: string | null;
  breakStart?: string | null;
  breakEnd?: string | null;
  status: 'present' | 'absent' | 'late' | 'half-day' | string;
  totalHours?: number;
  shift?: 'Day' | 'Evening' | 'Night' | 'WFH' | string;
}

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: 'sick' | 'vacation' | 'personal' | 'other' | 'wfh' | 'festival' | 'emergency';
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
}

interface Holiday {
  id: string;
  date: string;
  name: string;
  type: 'national' | 'company';
}

interface AttendanceState {
  records: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  holidays: Holiday[];
  currentStatus: 'checked-out' | 'checked-in' | 'on-break';
  loading: boolean;
}

type AttendanceAction =
  | { type: 'CHECK_IN' }
  | { type: 'CHECK_OUT' }
  | { type: 'START_BREAK' }
  | { type: 'END_BREAK' }
  | { type: 'ADD_LEAVE_REQUEST'; payload: LeaveRequest }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_RECORDS'; payload: AttendanceRecord[] }
  | { type: 'SET_LEAVES'; payload: LeaveRequest[] }
  | { type: 'SET_HOLIDAYS'; payload: Holiday[] };

export const AttendanceContext = createContext<{
  state: AttendanceState;
  checkIn: () => void;
  checkOut: () => void;
  startBreak: () => void;
  endBreak: () => void;
  requestLeave: (leave: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => void;
} | null>(null);

const attendanceReducer = (state: AttendanceState, action: AttendanceAction): AttendanceState => {
  switch (action.type) {
    case 'CHECK_IN':
      return { ...state, currentStatus: 'checked-in' };
    case 'CHECK_OUT':
      return { ...state, currentStatus: 'checked-out' };
    case 'START_BREAK':
      return { ...state, currentStatus: 'on-break' };
    case 'END_BREAK':
      return { ...state, currentStatus: 'checked-in' };
    case 'ADD_LEAVE_REQUEST':
      return { ...state, leaveRequests: [...state.leaveRequests, action.payload] };
    case 'SET_RECORDS':
      return { ...state, records: action.payload };
    case 'SET_LEAVES':
      return { ...state, leaveRequests: action.payload };
    case 'SET_HOLIDAYS':
      return { ...state, holidays: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();

  const [state, dispatch] = useReducer(attendanceReducer, {
    records: [],
    leaveRequests: [],
    holidays: [],
    currentStatus: 'checked-out',
    loading: false,
  });

  useEffect(() => {
    // wait for auth to initialize and ensure user is present before fetching
    if (!auth.state.initialized) return;
    if (!auth.state.user) return;

    const fetchAll = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const [attendanceRes, leavesRes, holidaysRes] = await Promise.all([
          axios.get('/api/attendance', { withCredentials: true, timeout: 5000 }),
          axios.get('/api/attendance/leaves', { withCredentials: true, timeout: 5000 }),
          axios.get('/api/attendance/holidays', { withCredentials: true, timeout: 5000 }),
        ]);

        // Normalize attendance records: compute totalHours and derive shift from checkIn
        const normalizeRecord = (r: any): AttendanceRecord => {
          const record: AttendanceRecord = {
            id: String(r.id),
            date: r.date,
            checkIn: r.checkIn || r.check_in || null,
            checkOut: r.checkOut || r.check_out || null,
            breakStart: r.breakStart || r.break_start || null,
            breakEnd: r.breakEnd || r.break_end || null,
            status: r.status || 'present',
            totalHours: undefined,
            shift: undefined,
          };

          if (record.checkIn && record.checkOut) {
            try {
              const [h1, m1] = (record.checkIn as string).split(':');
              const [h2, m2] = (record.checkOut as string).split(':');
              const d1 = new Date(); d1.setHours(parseInt(h1, 10), parseInt(m1 || '0', 10), 0, 0);
              const d2 = new Date(); d2.setHours(parseInt(h2, 10), parseInt(m2 || '0', 10), 0, 0);
              let diffMs = d2.getTime() - d1.getTime();
              if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // across midnight
              const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
              record.totalHours = hours;
            } catch (e) {
              record.totalHours = undefined;
              console.error('Error computing totalHours', e);
            }
          }

          // Derive shift from checkIn hour
          if (record.checkIn) {
            try {
              const [hh] = (record.checkIn as string).split(':');
              const hour = parseInt(hh, 10);
              if (hour >= 6 && hour < 14) record.shift = 'Day';
              else if (hour >= 14 && hour < 22) record.shift = 'Evening';
              else record.shift = 'Night';
            } catch (e) {
              record.shift = undefined;
              console.error('Error deriving shift', e);
            }
          }

          return record;
        };

        const attendanceRecords: AttendanceRecord[] = (attendanceRes.data as any[]).map((r) => normalizeRecord(r));

        // normalize holidays dates to YYYY-MM-DD
        const rawHolidays: any[] = holidaysRes.data || [];
        const normalizedHolidays = rawHolidays.map(h => ({
          ...h,
          date: format(typeof h.date === 'string' ? parseISO(h.date) : new Date(h.date), 'yyyy-MM-dd'),
        }));

        dispatch({ type: 'SET_RECORDS', payload: attendanceRecords });
        dispatch({ type: 'SET_LEAVES', payload: leavesRes.data });
        dispatch({ type: 'SET_HOLIDAYS', payload: normalizedHolidays });

        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    fetchAll();
  }, [auth.state.initialized, auth.state.user]);

  // helper to refresh attendance records from server
  const fetchRecords = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await axios.get('/api/attendance', { withCredentials: true, timeout: 5000 });
      const records = (res.data as any[]).map((r: any) => {
        const rec: AttendanceRecord = {
          id: String(r.id),
          date: r.date,
          checkIn: r.checkIn || r.check_in || null,
          checkOut: r.checkOut || r.check_out || null,
          breakStart: r.breakStart || r.break_start || null,
          breakEnd: r.breakEnd || r.break_end || null,
          status: r.status || 'present',
          totalHours: undefined,
        };
        if (rec.checkIn && rec.checkOut) {
          try {
            const [h1, m1] = (rec.checkIn as string).split(':');
            const [h2, m2] = (rec.checkOut as string).split(':');
            const d1 = new Date(); d1.setHours(parseInt(h1, 10), parseInt(m1 || '0', 10), 0, 0);
            const d2 = new Date(); d2.setHours(parseInt(h2, 10), parseInt(m2 || '0', 10), 0, 0);
            let diffMs = d2.getTime() - d1.getTime();
            if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
            rec.totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
          } catch (e) {
            console.error('Error computing totalHours in fetchRecords map', e);
            rec.totalHours = undefined;
          }
        }
        return rec;
      });
      dispatch({ type: 'SET_RECORDS', payload: records });
    } catch (err) {
      console.error('Error fetching attendance records:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const checkIn = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await axios.post('/api/attendance/check-in', {}, { withCredentials: true, timeout: 5000 });
      dispatch({ type: 'CHECK_IN' });
      await fetchRecords();
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const checkOut = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await axios.post('/api/attendance/check-out', {}, { withCredentials: true, timeout: 5000 });
      dispatch({ type: 'CHECK_OUT' });
      await fetchRecords();
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const startBreak = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await axios.post('/api/attendance/break', { type: 'start' }, { withCredentials: true, timeout: 5000 });
      dispatch({ type: 'START_BREAK' });
      await fetchRecords();
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const endBreak = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await axios.post('/api/attendance/break', { type: 'end' }, { withCredentials: true, timeout: 5000 });
      dispatch({ type: 'END_BREAK' });
      await fetchRecords();
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const requestLeave = async (leaveData: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await axios.post('/api/attendance/leaves', leaveData, { withCredentials: true, timeout: 5000 });
      dispatch({ type: 'ADD_LEAVE_REQUEST', payload: res.data });
    } catch (err) {
      console.error('Error requesting leave:', err);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <AttendanceContext.Provider value={{ state, checkIn, checkOut, startBreak, endBreak, requestLeave }}>
      {children}
    </AttendanceContext.Provider>
  );
};


