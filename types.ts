
export interface User {
  email: string;
  name?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  arrivalTime: string;
  departureTime: string;
  breakDuration?: number; // in minutes
  normHours?: number;
  totalWorked?: string; // Formatted HH:MM
  balance?: string; // e.g. "+0h 15m"
  isPositiveBalance?: boolean; // true if overtime, false if deficit
}

export enum AppView {
  INTRO = 'INTRO',
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD'
}

export type DashboardTab = 'HOME' | 'CALENDAR' | 'TEAM' | 'PROFILE';

export interface ShiftTimes {
  R: { start: string; end: string };
  P: { start: string; end: string };
  N: { start: string; end: string };
}

export interface ShiftConfig {
  startDate: string; // The reference date for the cycle
  cycle: string[]; // Array of shift codes e.g., ['R', 'R', 'N', 'V', 'V']
  shiftLength: number; // Hours per shift
  isActive: boolean;
  shiftTimes?: ShiftTimes;
}

export interface GroupMember {
  id: string;
  name: string;
  role: 'Admin' | 'Member';
  status: 'online' | 'offline' | 'break';
  initials: string;
  // Stats for aggregation
  workedHours: number;
  normHours: number; // Sum of norms from records (for efficiency calc)
  calendarFund?: number; // Total monthly fund from calendar (for display info)
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string; // Unique code for joining
  adminId: string; // ID of the creator
  members: GroupMember[];
  totalWorked: number;
  totalNorm: number;
  efficiency: number;
  totalCalendarFund?: number;
}
