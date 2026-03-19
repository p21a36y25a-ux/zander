import type { PayrollBreakdown, PunchEventPayload } from '@liana/shared'
import { UserRole } from '@liana/shared'
import axios from 'axios'
import { io, type Socket } from 'socket.io-client'
import { create } from 'zustand'
import { api } from '../lib/api'

type UserSession = {
  id: string
  email: string
  role: UserRole
}

type Employee = {
  id: string
  employeeNumber?: string
  firstName: string
  lastName: string
  birthDate?: string
  country?: string
  personalId?: string
  address?: string
  municipality?: string
  tel?: string
  maritalStatus?: string
  education?: string
  position?: string
  emergencyContact?: string
  familyConnection?: string
  branchName?: string
  annualLeaveEntitlement?: number
  annualLeaveRemaining?: number
  leaveBalanceYear?: number
  hireDate?: string
  hourlyRateEur?: string
  userId?: string
  user?: {
    id: string
    email: string
    role: UserRole
    isActive: boolean
  }
}

type SystemUser = {
  id: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

type Punch = {
  id: string
  employeeId: string
  type: 'check_in' | 'break_start' | 'break_end' | 'check_out'
  punchedAt: string
  photoUrl?: string | null
  source?: string
}

type AttendanceRow = {
  id: string
  employeeId: string
  date: string
  workedMinutes: number
  status: string
  checkInAt?: string
  checkOutAt?: string
}

type LeaveRequest = {
  id: string
  employeeId: string
  startDate: string
  endDate: string
  totalDays?: number
  status: string
  signedDocumentAvailable?: boolean
  reason?: string
  managerComment?: string | null
  hrComment?: string | null
  employee?: {
    firstName?: string
    lastName?: string
    employeeNumber?: string
  }
  leaveType?: {
    name?: string
  }
}

type PayrollRecord = {
  id: string
  employeeId: string
  grossAmount: string
  totalHours: string
  currency: string
  calculatedAt: string
  employee?: {
    firstName?: string
    lastName?: string
    employeeNumber?: string
  }
}

type HrStore = {
  token: string | null
  user: UserSession | null
  employees: Employee[]
  punches: Punch[]
  attendance: AttendanceRow[]
  leaveRequests: LeaveRequest[]
  systemUsers: SystemUser[]
  payrollRecords: PayrollRecord[]
  payrollPreview: PayrollBreakdown | null
  loading: boolean
  error: string | null
  socket: Socket | null
  login: (payload: { email: string; password: string }) => Promise<void>
  logout: () => void
  loadEmployees: () => Promise<void>
  loadPunches: () => Promise<void>
  loadAttendance: () => Promise<void>
  loadLeaves: () => Promise<void>
  loadSystemUsers: () => Promise<void>
  createPunch: (payload: {
    employeeId: string
    type: 'check_in' | 'break_start' | 'break_end' | 'check_out'
    photoBase64?: string
  }) => Promise<void>
  createLeave: (payload: {
    employeeId: string
    leaveTypeId: string
    startDate: string
    endDate: string
    reason: string
  }) => Promise<void>
  reviewLeave: (payload: {
    requestId: string
    status: 'approved' | 'rejected'
    reviewer: 'manager' | 'hr'
    comment?: string
  }) => Promise<void>
  createEmployee: (payload: {
    employeeNumber: string
    firstName: string
    lastName: string
    email: string
    password: string
    hourlyRateEur: number
    hireDate: string
    role: UserRole
  }) => Promise<void>
  updateEmployee: (id: string, payload: {
    employeeNumber?: string
    firstName?: string
    lastName?: string
    email?: string
    birthDate?: string
    country?: string
    personalId?: string
    address?: string
    municipality?: string
    tel?: string
    maritalStatus?: string
    education?: string
    position?: string
    emergencyContact?: string
    familyConnection?: string
    role?: UserRole
    hourlyRateEur?: number
    hireDate?: string
    branchName?: string
    annualLeaveEntitlement?: number
    annualLeaveRemaining?: number
  }) => Promise<void>
  removeEmployee: (id: string) => Promise<void>
  calculatePreview: (payload: { totalHours: number; hourlyRateEur: number }) => Promise<void>
  loadPayrollRecords: () => Promise<void>
  exportAttendanceCsv: (employeeId?: string) => Promise<void>
  initRealtime: () => () => void
}

export const useHrStore = create<HrStore>((set, get) => ({
  token: localStorage.getItem('liana_token'),
  user: localStorage.getItem('liana_user')
    ? (JSON.parse(localStorage.getItem('liana_user') ?? '{}') as UserSession)
    : null,
  employees: [],
  punches: [],
  attendance: [],
  leaveRequests: [],
  systemUsers: [],
  payrollRecords: [],
  payrollPreview: null,
  loading: false,
  error: null,
  socket: null,

  async login(payload) {
    set({ loading: true, error: null })
    try {
      const response = await api.post('/auth/login', payload)
      const { accessToken, user } = response.data
      localStorage.setItem('liana_token', accessToken)
      localStorage.setItem('liana_user', JSON.stringify(user))
      set({ token: accessToken, user, loading: false })
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? String(err.response?.data?.message ?? err.message)
        : 'Nuk u arrit kycja. Kontrolloni nese API eshte i qasshem.'
      set({ loading: false, error: message })
    }
  },

  logout() {
    const socket = get().socket
    if (socket) {
      socket.disconnect()
    }
    localStorage.removeItem('liana_token')
    localStorage.removeItem('liana_user')
    set({
      token: null,
      user: null,
      employees: [],
      punches: [],
      attendance: [],
      leaveRequests: [],
      systemUsers: [],
      payrollRecords: [],
      payrollPreview: null,
      socket: null,
      error: null,
    })
  },

  async loadEmployees() {
    try {
      const response = await api.get('/employees')
      set({ employees: response.data })
    } catch {
      set({ error: 'Deshtoi ngarkimi i punonjesve' })
    }
  },

  async loadPunches() {
    try {
      const response = await api.get('/punches')
      set({ punches: response.data })
    } catch {
      set({ error: 'Deshtoi ngarkimi i hyrje/daljeve' })
    }
  },

  async loadAttendance() {
    try {
      const response = await api.get('/attendance')
      set({ attendance: response.data })
    } catch {
      set({ error: 'Deshtoi ngarkimi i prezences' })
    }
  },

  async loadLeaves() {
    try {
      const response = await api.get('/leaves/requests')
      set({ leaveRequests: response.data })
    } catch {
      set({ error: 'Deshtoi ngarkimi i kerkesave per pushim' })
    }
  },

  async loadSystemUsers() {
    try {
      const response = await api.get('/users')
      set({ systemUsers: response.data })
    } catch {
      set({ error: 'Deshtoi ngarkimi i perdoruesve te sistemit' })
    }
  },

  async createPunch(payload) {
    try {
      await api.post('/punches', payload)
      await Promise.all([get().loadPunches(), get().loadAttendance()])
    } catch {
      const pending = JSON.parse(localStorage.getItem('offline_punch_queue') ?? '[]') as unknown[]
      pending.push({ ...payload, queuedAt: new Date().toISOString() })
      localStorage.setItem('offline_punch_queue', JSON.stringify(pending))
      set({ error: 'Pa internet ose API jo e qasshme. Hyrje/dalja u ruajt per sinkronizim.' })
    }
  },

  async createLeave(payload) {
    try {
      await api.post('/leaves/requests', payload)
      await get().loadLeaves()
    } catch {
      set({ error: 'Deshtoi krijimi i kerkeses per pushim' })
    }
  },

  async reviewLeave(payload) {
    try {
      const path = payload.reviewer === 'manager' ? 'manager-review' : 'hr-review'
      await api.patch(`/leaves/requests/${payload.requestId}/${path}`, {
        status: payload.status,
        comment: payload.comment,
      })
      await get().loadLeaves()
    } catch {
      set({ error: 'Deshtoi shqyrtimi i kerkeses per pushim' })
    }
  },

  async createEmployee(payload) {
    try {
      await api.post('/employees', payload)
      await Promise.all([get().loadEmployees(), get().loadSystemUsers()])
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? String(err.response?.data?.message ?? err.message)
        : 'Deshtoi regjistrimi i perdoruesit'
      set({ error: message })
    }
  },

  async updateEmployee(id, payload) {
    try {
      await api.patch(`/employees/${id}`, payload)
      await Promise.all([get().loadEmployees(), get().loadSystemUsers()])
    } catch {
      set({ error: 'Deshtoi perditesimi i punonjesit' })
    }
  },

  async removeEmployee(id) {
    try {
      await api.delete(`/employees/${id}`)
      await Promise.all([get().loadEmployees(), get().loadSystemUsers()])
    } catch {
      set({ error: 'Deshtoi fshirja e punonjesit' })
    }
  },

  async calculatePreview(payload) {
    try {
      const response = await api.post('/payroll/calculate-preview', payload)
      set({ payrollPreview: response.data })
    } catch {
      set({ error: 'Deshtoi llogaritja e parashikimit te pages' })
    }
  },

  async loadPayrollRecords() {
    try {
      const response = await api.get('/payroll/records')
      set({ payrollRecords: response.data })
    } catch {
      set({ error: 'Deshtoi ngarkimi i regjistrave te pagave' })
    }
  },

  async exportAttendanceCsv(employeeId?: string) {
    try {
      const response = await api.get('/attendance/export/csv', {
        params: employeeId ? { employeeId } : undefined,
        responseType: 'blob',
      })

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'raporti-i-prezences.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      set({ error: 'Deshtoi eksportimi i prezences ne CSV' })
    }
  },

  initRealtime() {
    const existing = get().socket
    if (existing) {
      return () => existing.disconnect()
    }

    const defaultSocketUrl = typeof window === 'undefined' ? undefined : window.location.origin
    const socket = io(import.meta.env.VITE_SOCKET_URL ?? defaultSocketUrl, {
      path: '/socket.io',
    })
    socket.on('punch.created', (payload: PunchEventPayload) => {
      const row: Punch = {
        id: `${payload.employeeId}-${payload.punchedAt}`,
        employeeId: payload.employeeId,
        type: payload.type,
        punchedAt: payload.punchedAt,
      }

      set((state) => ({
        punches: [row, ...state.punches].slice(0, 200),
      }))
      void get().loadAttendance()
    })

    const flushQueuedPunches = async () => {
      const pending = JSON.parse(localStorage.getItem('offline_punch_queue') ?? '[]') as Array<{
        employeeId: string
        type: 'check_in' | 'check_out'
        photoBase64?: string
      }>

      if (pending.length === 0) {
        return
      }

      for (const entry of pending) {
        await api.post('/punches', entry)
      }
      localStorage.removeItem('offline_punch_queue')
      await Promise.all([get().loadPunches(), get().loadAttendance()])
    }

    window.addEventListener('online', () => {
      void flushQueuedPunches()
    })

    set({ socket })
    return () => socket.disconnect()
  },
}))
