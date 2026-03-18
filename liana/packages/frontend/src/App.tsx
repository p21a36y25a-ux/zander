import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useHrStore } from './store/useHrStore'

const userSeed = {
  email: 'admin@liana.local',
  password: 'Admin123!',
}

function App() {
  const [clock, setClock] = useState(dayjs())
  const [employeeId, setEmployeeId] = useState('')
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined)
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    reason: '',
  })

  const {
    token,
    user,
    employees,
    attendance,
    punches,
    leaveRequests,
    payrollPreview,
    loading,
    error,
    login,
    loadEmployees,
    loadAttendance,
    loadPunches,
    createPunch,
    loadLeaves,
    createLeave,
    calculatePreview,
    initRealtime,
  } = useHrStore()

  useEffect(() => {
    const interval = setInterval(() => setClock(dayjs()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }
    void loadEmployees()
    void loadAttendance()
    void loadPunches()
    void loadLeaves()

    const disconnect = initRealtime()
    return () => disconnect()
  }, [token, initRealtime, loadAttendance, loadEmployees, loadLeaves, loadPunches])

  const selectedEmployee = useMemo(
    () => employees.find((entry) => entry.id === employeeId),
    [employees, employeeId],
  )

  const absenceCount = useMemo(
    () => attendance.filter((entry) => entry.status === 'absent').length,
    [attendance],
  )

  if (!token) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#ffe8cc_0%,#f6f6ef_35%,#f3f4f6_100%)] px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200/70 bg-white/70 p-8 shadow-2xl shadow-amber-200/40 backdrop-blur">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900">Liana HR Cloud</h1>
          <p className="mt-2 text-slate-700">
            Real-time attendance, leave workflow and Kosovo payroll in EUR for 300-500 employees.
          </p>

          <button
            onClick={() => void login(userSeed)}
            className="mt-8 rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-black"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Login with Seed Admin'}
          </button>
          {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fcf6ef_0%,#eef3fb_55%,#e8f8ef_100%)] p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-2xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight">Liana Workforce Command</h1>
              <p className="text-sm text-slate-600">{clock.format('dddd, DD MMM YYYY HH:mm:ss')}</p>
            </div>
            <div className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">
              Logged in: {user?.email} ({user?.role})
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Employees" value={String(employees.length)} tone="blue" />
          <MetricCard title="Punches Today" value={String(punches.length)} tone="amber" />
          <MetricCard title="Attendance Rows" value={String(attendance.length)} tone="emerald" />
          <MetricCard title="Absent/Alerts" value={String(absenceCount)} tone="rose" />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Time Tracking</h2>
            <p className="text-sm text-slate-600">Camera-ready check-in/out flow with optional photo capture.</p>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <select
                className="rounded-xl border border-slate-300 px-3 py-2"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
              >
                <option value="">Choose employee</option>
                {employees.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.firstName} {entry.lastName}
                  </option>
                ))}
              </select>
              <button
                className="rounded-xl bg-emerald-600 px-4 py-2 text-white disabled:opacity-40"
                disabled={!employeeId || loading}
                onClick={() => void createPunch({ employeeId, type: 'check_in', photoBase64 })}
              >
                Check-in
              </button>
              <button
                className="rounded-xl bg-orange-600 px-4 py-2 text-white disabled:opacity-40"
                disabled={!employeeId || loading}
                onClick={() => void createPunch({ employeeId, type: 'check_out', photoBase64 })}
              >
                Check-out
              </button>
            </div>

            <div className="mt-2">
              <label className="text-xs text-slate-600">Camera / photo proof (optional)</label>
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) {
                    setPhotoBase64(undefined)
                    return
                  }
                  const reader = new FileReader()
                  reader.onload = () => {
                    const raw = String(reader.result ?? '')
                    const base64 = raw.includes(',') ? raw.split(',')[1] : raw
                    setPhotoBase64(base64)
                  }
                  reader.readAsDataURL(file)
                }}
              />
            </div>

            {selectedEmployee && (
              <div className="mt-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
                Active selection: {selectedEmployee.firstName} {selectedEmployee.lastName}
              </div>
            )}

            <ul className="mt-4 max-h-64 space-y-2 overflow-auto">
              {punches.slice(0, 8).map((entry) => (
                <li key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                  <div className="font-medium">{entry.employeeId}</div>
                  <div className="text-slate-600">{entry.type} at {dayjs(entry.punchedAt).format('HH:mm:ss')}</div>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Kosovo Payroll Preview (€)</h2>
            <p className="text-sm text-slate-600">0-160h @100%, 161-200h @130%, 201+h @150%</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                className="rounded-xl bg-slate-900 px-4 py-2 text-white"
                onClick={() => void calculatePreview({ totalHours: 172, hourlyRateEur: 7.5 })}
              >
                Example A
              </button>
              <button
                className="rounded-xl bg-slate-900 px-4 py-2 text-white"
                onClick={() => void calculatePreview({ totalHours: 214, hourlyRateEur: 8.25 })}
              >
                Example B
              </button>
            </div>

            {payrollPreview && (
              <div className="mt-4 space-y-1 rounded-xl bg-slate-100 p-4 text-sm">
                <p>Regular hours: {payrollPreview.regularHours}</p>
                <p>Overtime hours: {payrollPreview.overtimeHours}</p>
                <p>Premium hours: {payrollPreview.premiumHours}</p>
                <p className="font-semibold">Gross: €{payrollPreview.grossAmount.toFixed(2)}</p>
              </div>
            )}
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Leave Workflow</h2>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <input
                className="rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Employee ID"
                value={leaveForm.employeeId}
                onChange={(event) => setLeaveForm((prev) => ({ ...prev, employeeId: event.target.value }))}
              />
              <input
                className="rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Leave Type ID"
                value={leaveForm.leaveTypeId}
                onChange={(event) => setLeaveForm((prev) => ({ ...prev, leaveTypeId: event.target.value }))}
              />
              <input
                type="date"
                className="rounded-xl border border-slate-300 px-3 py-2"
                value={leaveForm.startDate}
                onChange={(event) => setLeaveForm((prev) => ({ ...prev, startDate: event.target.value }))}
              />
              <input
                type="date"
                className="rounded-xl border border-slate-300 px-3 py-2"
                value={leaveForm.endDate}
                onChange={(event) => setLeaveForm((prev) => ({ ...prev, endDate: event.target.value }))}
              />
            </div>
            <textarea
              className="mt-2 min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Reason"
              value={leaveForm.reason}
              onChange={(event) => setLeaveForm((prev) => ({ ...prev, reason: event.target.value }))}
            />
            <button
              className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-white"
              onClick={() => void createLeave(leaveForm)}
            >
              Submit Leave Request
            </button>
          </article>

          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Attendance Snapshot</h2>
            <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
              {attendance.slice(0, 12).map((entry) => (
                <li key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{entry.employeeId}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5">{entry.status}</span>
                  </div>
                  <div className="mt-1 text-slate-600">
                    {entry.date} • {entry.workedMinutes} minutes
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
          <h2 className="font-serif text-2xl">Recent Leave Requests</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {leaveRequests.slice(0, 9).map((entry) => (
              <div key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <div className="font-medium">{entry.employeeId}</div>
                <div className="text-slate-600">{entry.startDate} → {entry.endDate}</div>
                <div className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5">{entry.status}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ title, value, tone }: { title: string; value: string; tone: 'blue' | 'amber' | 'emerald' | 'rose' }) {
  const toneClass = {
    blue: 'from-sky-100 to-sky-50 border-sky-200',
    amber: 'from-amber-100 to-amber-50 border-amber-200',
    emerald: 'from-emerald-100 to-emerald-50 border-emerald-200',
    rose: 'from-rose-100 to-rose-50 border-rose-200',
  }[tone]

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${toneClass}`}>
      <p className="text-sm text-slate-700">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export default App
