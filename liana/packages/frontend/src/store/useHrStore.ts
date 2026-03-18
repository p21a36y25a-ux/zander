import type { PayrollBreakdown, PunchEventPayload } from '@liana/shared'
import { io, type Socket } from 'socket.io-client'
import { create } from 'zustand'
import { api } from '../lib/api'

type UserSession = {
  id: string
  email: string
  role: string
}

type Employee = {
  id: string
  firstName: string
  lastName: string
}

type Punch = {
  id: string
  employeeId: string
  type: 'check_in' | 'check_out'
  punchedAt: string
}

type AttendanceRow = {
  id: string
  employeeId: string
  date: string
  workedMinutes: number
  status: string
}

type LeaveRequest = {
  id: string
  employeeId: string
  startDate: string
  endDate: string
  status: string
}

type HrStore = {
  token: string | null
  user: UserSession | null
  employees: Employee[]
  punches: Punch[]
  attendance: AttendanceRow[]
  leaveRequests: LeaveRequest[]
  payrollPreview: PayrollBreakdown | null
  loading: boolean
  error: string | null
  socket: Socket | null
  login: (payload: { email: string; password: string }) => Promise<void>
  loadEmployees: () => Promise<void>
  loadPunches: () => Promise<void>
  loadAttendance: () => Promise<void>
  loadLeaves: () => Promise<void>
  createPunch: (payload: {
    employeeId: string
    type: 'check_in' | 'check_out'
    photoBase64?: string
  }) => Promise<void>
  createLeave: (payload: {
    employeeId: string
    leaveTypeId: string
    startDate: string
    endDate: string
    reason: string
  }) => Promise<void>
  calculatePreview: (payload: { totalHours: number; hourlyRateEur: number }) => Promise<void>
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
    } catch {
      set({ loading: false, error: 'Unable to login. Check API availability.' })
    }
  },

  async loadEmployees() {
    try {
      const response = await api.get('/employees')
      set({ employees: response.data })
    } catch {
      set({ error: 'Failed to load employees' })
    }
  },

  async loadPunches() {
    try {
      const response = await api.get('/punches')
      set({ punches: response.data })
    } catch {
      set({ error: 'Failed to load punches' })
    }
  },

  async loadAttendance() {
    try {
      const response = await api.get('/attendance')
      set({ attendance: response.data })
    } catch {
      set({ error: 'Failed to load attendance' })
    }
  },

  async loadLeaves() {
    try {
      const response = await api.get('/leaves/requests')
      set({ leaveRequests: response.data })
    } catch {
      set({ error: 'Failed to load leave requests' })
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
      set({ error: 'Offline or API unavailable. Punch queued for sync.' })
    }
  },

  async createLeave(payload) {
    try {
      await api.post('/leaves/requests', payload)
      await get().loadLeaves()
    } catch {
      set({ error: 'Failed to create leave request' })
    }
  },

  async calculatePreview(payload) {
    try {
      const response = await api.post('/payroll/calculate-preview', payload)
      set({ payrollPreview: response.data })
    } catch {
      set({ error: 'Failed to calculate payroll preview' })
    }
  },

  initRealtime() {
    const existing = get().socket
    if (existing) {
      return () => existing.disconnect()
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000')
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
