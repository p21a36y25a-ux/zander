export const UserRole = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  HR_ADMIN: 'hr_admin',
  SYSTEM_ADMIN: 'system_admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AttendanceStatus = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  ON_LEAVE: 'on_leave',
} as const;

export type AttendanceStatus =
  (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const LeaveRequestStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type LeaveRequestStatus =
  (typeof LeaveRequestStatus)[keyof typeof LeaveRequestStatus];

export const LeaveTypeCode = {
  VACATION: 'vacation',
  SICK: 'sick',
  PERSONAL: 'personal',
} as const;

export type LeaveTypeCode = (typeof LeaveTypeCode)[keyof typeof LeaveTypeCode];

export const PayrollKosovoDefaults = {
  currency: 'EUR',
  baseMonthlyHours: 160,
  baseMonthlyDays: 20,
  baseMultiplier: 1,
  overtimeThreshold: 160,
  overtimeUpperThreshold: 200,
  overtimeMultiplier: 1.3,
  premiumMultiplier: 1.5,
} as const

export type PayrollBreakdown = {
  regularHours: number
  overtimeHours: number
  premiumHours: number
  regularAmount: number
  overtimeAmount: number
  premiumAmount: number
  grossAmount: number
  currency: 'EUR'
}

export type PunchEventPayload = {
  employeeId: string
  type: 'check_in' | 'break_start' | 'break_end' | 'check_out'
  punchedAt: string
  photoUrl?: string | null
}
