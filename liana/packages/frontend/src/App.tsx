import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { UserRole } from '@liana/shared'
import { api } from './lib/api'
import { useHrStore } from './store/useHrStore'

const userSeed = {
  email: 'admin@liana.local',
  password: 'Admin123!',
}

type PublicEmployee = {
  id: string
  firstName: string
  lastName: string
}

type PublicToast = {
  kind: 'success' | 'error' | 'info'
  message: string
}

type AdminMenuGroup = {
  title: string
  items: string[]
}

type RegisterForm = {
  employeeNumber: string
  firstName: string
  lastName: string
  birthDate: string
  country: string
  personalId: string
  address: string
  municipality: string
  tel: string
  email: string
  maritalStatus: string
  education: string
  emergencyContact: string
  familyConnection: string
  emergencyPhone: string
  password: string
  hourlyRateEur: number
  hireDate: string
  role: UserRole
}

const adminSubcategoryFieldMap: Record<string, string[]> = {
  'Register Contracts': ['Contract Type', 'Contract Number', 'Start Date', 'End Date', 'Probation Period', 'Working Hours/Week'],
  'Employee files': ['Employee', 'File Type', 'Document Number', 'Issue Date', 'Expiry Date', 'Storage Reference'],
  'Employee status': ['Employee', 'Status', 'Effective Date', 'Reason', 'Approved By'],
  'Salary Determination': [
    'Employee',
    'Base Salary (EUR)',
    'Job Coefficient',
    'Contract Type',
    'Tax Category (Kosovo)',
    'Pension Contribution (%)',
    'Overtime Coefficient',
    'Valid From',
  ],
  'Salary period': ['Month', 'Year', 'Payroll Cutoff Date', 'Payment Date', 'Working Days', 'Public Holidays'],
  'Registration of additional days/hours': ['Employee', 'Date', 'Additional Hours', 'Weekend Hours', 'Overtime Reason', 'Approved By'],
  'Additional Income Registration': ['Employee', 'Income Type', 'Gross Amount (EUR)', 'Taxable', 'Pension Applicable', 'Payment Date'],
  'Salary Calculation': ['Payroll Period', 'Regular Hours', 'Overtime Hours', 'Gross Salary (EUR)', 'Tax Withholding (EUR)', 'Net Salary (EUR)'],
  'Payroll List': ['Payroll Period', 'Department', 'Bank Transfer Batch ID', 'Total Gross (EUR)', 'Total Net (EUR)', 'Prepared By'],
  'E - Declaration (EDI)': ['Declaration Type', 'Fiscal Number', 'Tax Period', 'Submission Date', 'Protocol Number', 'Status'],
  'Request for vacation': ['Employee', 'Vacation Type', 'Start Date', 'End Date', 'Total Days', 'Approval Level'],
  'Recording hours for vacation': ['Employee', 'Date', 'Vacation Hours', 'Compensatory Hours', 'Approved By'],
  'Holiday status': ['Employee', 'Annual Entitlement (Days)', 'Used Days', 'Remaining Days', 'Carry Over (Days)', 'Expiry Date'],
  'Holiday calendar': ['Year', 'Holiday Name', 'Date', 'Paid/Unpaid', 'Branch Scope', 'Legal Reference'],
  'Click-in/out recording': ['Employee', 'Date', 'Check-in Time', 'Check-out Time', 'Source Device', 'Geo Location'],
  'Open entries/exits': ['Employee', 'Open Punch Date', 'Last Event Time', 'Exception Reason', 'Supervisor Note'],
  'List of clicks-in/out': ['Period From', 'Period To', 'Employee', 'Department', 'Missing Punches', 'Total Punches'],
  'Employees present': ['Date', 'Shift', 'Department', 'Present Count', 'Absent Count', 'Late Count'],
  'Types of contracts': ['Code', 'Contract Type Name', 'Default Duration', 'Requires Probation', 'Active'],
  'Type of employer': ['Code', 'Employer Type', 'Tax Handling Rule', 'Pension Rule', 'Active'],
  'Types of vacations': ['Code', 'Vacation Type Name', 'Paid/Unpaid', 'Annual Limit (Days)', 'Carry Over Allowed'],
  'Types of probationary periods': ['Code', 'Duration (Months)', 'Role Scope', 'Evaluation Required', 'Active'],
  'Type of calculation of elements': ['Code', 'Element Name', 'Calculation Formula', 'Taxable', 'Pension Applicable'],
  'Calculation coefficient': ['Code', 'Coefficient Name', 'Value', 'Effective Date', 'Expiry Date'],
  'Salary elements': ['Code', 'Element Name', 'Element Type', 'Default Amount/Rate', 'Taxable', 'Active'],
  'Company details': ['Legal Company Name', 'Fiscal Number', 'Business Registration Number', 'Address', 'Phone', 'Official Email'],
  'Company branches': ['Branch Code', 'Branch Name', 'Municipality', 'Address', 'Manager', 'Active'],
  'Departments/units': ['Department Code', 'Department Name', 'Branch', 'Cost Center', 'Manager', 'Active'],
  'Job positions': ['Position Code', 'Position Title', 'Department', 'Grade', 'Base Salary Band', 'Active'],
  'Municipal registration': ['Municipality', 'Registration Number', 'Registration Date', 'Status', 'Reference'],
  'State registration': ['Authority', 'Registration Number', 'Issue Date', 'Expiry Date', 'Status'],
  'Bank registration': ['Bank Name', 'IBAN', 'SWIFT', 'Account Holder', 'Activation Date', 'Status'],
  'Marital status': ['Employee', 'Marital Status', 'Effective Date', 'Dependent Count', 'Document Reference'],
  Password: ['Current Password', 'New Password', 'Confirm New Password', 'Last Change Date'],
}

function App() {
  const [clock, setClock] = useState(dayjs())
  const [employeeId, setEmployeeId] = useState('')
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined)
  const [publicEmployees, setPublicEmployees] = useState<PublicEmployee[]>([])
  const [publicToast, setPublicToast] = useState<PublicToast | null>(null)
  const [publicLoading, setPublicLoading] = useState(false)
  const [selectedPublicEmployeeId, setSelectedPublicEmployeeId] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [activeAdminMenuItem, setActiveAdminMenuItem] = useState('Register Employees')
  const [hoverAdminGroup, setHoverAdminGroup] = useState<string | null>(null)
  const [pinnedAdminGroup, setPinnedAdminGroup] = useState<string | null>(null)
  const [subcategoryDrafts, setSubcategoryDrafts] = useState<Record<string, Record<string, string>>>({})
  const [subcategoryMessage, setSubcategoryMessage] = useState('')
  const [municipalities, setMunicipalities] = useState<string[]>([])
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const [menu, setMenu] = useState<'frontpage' | 'register' | 'users' | 'attendance' | 'leaves' | 'payroll'>('frontpage')

  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    employeeNumber: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    country: '',
    personalId: '',
    address: '',
    municipality: '',
    tel: '',
    email: '',
    maritalStatus: '',
    education: '',
    emergencyContact: '',
    familyConnection: '',
    emergencyPhone: '',
    password: 'Admin123!',
    hourlyRateEur: 7,
    hireDate: dayjs().format('YYYY-MM-DD'),
    role: UserRole.EMPLOYEE,
  })
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
    systemUsers,
    payrollRecords,
    payrollPreview,
    loading,
    error,
    login,
    logout,
    loadEmployees,
    loadAttendance,
    loadPunches,
    createPunch,
    loadLeaves,
    loadSystemUsers,
    createEmployee,
    updateEmployee,
    removeEmployee,
    createLeave,
    reviewLeave,
    calculatePreview,
    loadPayrollRecords,
    exportAttendanceCsv,
    initRealtime,
  } = useHrStore()

  const role = user?.role ?? UserRole.EMPLOYEE
  const isSuperAdmin = role === UserRole.SYSTEM_ADMIN
  const isHr = role === UserRole.HR_ADMIN
  const canAdminUsers = isSuperAdmin || isHr
  const canManageOps = canAdminUsers || role === UserRole.MANAGER

  const roleLabel = {
    [UserRole.SYSTEM_ADMIN]: 'SuperAdmin',
    [UserRole.HR_ADMIN]: 'HR',
    [UserRole.MANAGER]: 'Manager',
    [UserRole.EMPLOYEE]: 'User',
  }[role]

  useEffect(() => {
    const interval = setInterval(() => setClock(dayjs()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (token) {
      return
    }
    const loadPublicEmployees = async () => {
      try {
        const response = await api.get('/public/employees')
        setPublicEmployees(response.data)
      } catch {
        setPublicToast({ kind: 'error', message: 'Unable to load employee list on homepage.' })
      }
    }

    void loadPublicEmployees()
  }, [token])

  useEffect(() => {
    if (!token) {
      return
    }
    const currentRole = user?.role
    const asAdminOrManager = currentRole === UserRole.SYSTEM_ADMIN || currentRole === UserRole.HR_ADMIN || currentRole === UserRole.MANAGER
    const asAdmin = currentRole === UserRole.SYSTEM_ADMIN || currentRole === UserRole.HR_ADMIN

    if (asAdminOrManager) {
      void loadEmployees()
      void loadAttendance()
      void loadPunches()
      void loadLeaves()
    }

    if (asAdmin) {
      void loadSystemUsers()
      void loadPayrollRecords()
    }

    const disconnect = initRealtime()
    return () => disconnect()
  }, [token, user?.role, initRealtime, loadAttendance, loadEmployees, loadLeaves, loadPayrollRecords, loadPunches, loadSystemUsers])

  useEffect(() => {
    if (!token || !canAdminUsers) {
      return
    }

    const loadMunicipalities = async () => {
      try {
        const response = await api.get('/admin-config/municipalities')
        const cityList = (response.data as Array<{ name: string }>).map((entry) => entry.name)
        setMunicipalities(cityList)
      } catch {
        // Keep UI usable even if municipality endpoint is temporarily unavailable.
      }
    }

    void loadMunicipalities()
  }, [token, canAdminUsers])

  useEffect(() => {
    if (!publicToast) {
      return
    }
    const timeout = window.setTimeout(() => setPublicToast(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [publicToast])

  const selectedEmployee = useMemo(
    () => employees.find((entry) => entry.id === employeeId),
    [employees, employeeId],
  )

  const absenceCount = useMemo(
    () => attendance.filter((entry) => entry.status === 'absent').length,
    [attendance],
  )

  const menuItems = [
    { key: 'frontpage', label: 'Frontpage', show: true },
    { key: 'register', label: 'Register user', show: canAdminUsers },
    { key: 'users', label: 'See all users', show: canAdminUsers },
    { key: 'attendance', label: 'Attendance', show: canManageOps },
    { key: 'leaves', label: 'Leaves', show: canManageOps },
    { key: 'payroll', label: 'Payroll / Export', show: canAdminUsers },
  ] as const

  const adminMenuGroups: AdminMenuGroup[] = [
    {
      title: 'Employee',
      items: ['Register Employees', 'Click-in', 'Register Contracts', 'Employee files', 'Employee status'],
    },
    {
      title: 'Salary / Compensation',
      items: [
        'Salary Determination',
        'Salary period',
        'Registration of additional days/hours',
        'Additional Income Registration',
        'Salary Calculation',
        'Payroll List',
        'E - Declaration (EDI)',
      ],
    },
    {
      title: 'Vacation',
      items: ['Request for vacation', 'Recording hours for vacation', 'Holiday status', 'Holiday calendar'],
    },
    {
      title: 'Click-in / Click-out',
      items: ['Click-in/out recording', 'Open entries/exits', 'List of clicks-in/out', 'Employees present'],
    },
    {
      title: 'HR Definitions',
      items: [
        'Employee status',
        'Types of contracts',
        'Type of employer',
        'Types of vacations',
        'Types of probationary periods',
        'Type of calculation of elements',
        'Calculation coefficient',
        'Salary elements',
      ],
    },
    {
      title: 'Company',
      items: ['Company details', 'Company branches', 'Departments/units', 'Job positions'],
    },
    {
      title: 'Administration',
      items: ['Municipal registration', 'State registration', 'Bank registration', 'Marital status'],
    },
    {
      title: 'Password',
      items: ['Password'],
    },
  ]

  const adminMenuToView: Record<string, typeof menu> = {
    'Register Employees': 'register',
    'Click-in': 'frontpage',
    'Register Contracts': 'users',
    'Employee files': 'users',
    'Employee status': 'users',
    'Salary Determination': 'payroll',
    'Salary period': 'payroll',
    'Registration of additional days/hours': 'payroll',
    'Additional Income Registration': 'payroll',
    'Salary Calculation': 'payroll',
    'Payroll List': 'payroll',
    'E - Declaration (EDI)': 'payroll',
    'Request for vacation': 'leaves',
    'Recording hours for vacation': 'leaves',
    'Holiday status': 'leaves',
    'Holiday calendar': 'leaves',
    'Click-in/out recording': 'frontpage',
    'Open entries/exits': 'attendance',
    'List of clicks-in/out': 'attendance',
    'Employees present': 'attendance',
    'Types of contracts': 'users',
    'Type of employer': 'users',
    'Types of vacations': 'users',
    'Types of probationary periods': 'users',
    'Type of calculation of elements': 'users',
    'Calculation coefficient': 'users',
    'Salary elements': 'users',
    'Company details': 'users',
    'Company branches': 'users',
    'Departments/units': 'users',
    'Job positions': 'users',
    'Municipal registration': 'users',
    'State registration': 'users',
    'Bank registration': 'users',
    'Marital status': 'users',
    Password: 'users',
  }

  const onAdminMenuClick = (item: string) => {
    setActiveAdminMenuItem(item)
    const target = adminMenuToView[item]
    if (target) {
      setMenu(target)
    }
    setPinnedAdminGroup(null)
  }

  const activeAdminGroup = adminMenuGroups.find((group) => group.items.includes(activeAdminMenuItem))?.title ?? ''
  const visibleAdminGroup = pinnedAdminGroup ?? hoverAdminGroup
  const activeSubcategoryFields = adminSubcategoryFieldMap[activeAdminMenuItem] ?? []

  const updateSubcategoryField = (subcategory: string, field: string, value: string) => {
    setSubcategoryDrafts((prev) => ({
      ...prev,
      [subcategory]: {
        ...(prev[subcategory] ?? {}),
        [field]: value,
      },
    }))
  }

  const saveSubcategoryDraft = async () => {
    const data = subcategoryDrafts[activeAdminMenuItem] ?? {}

    try {
      await api.post('/admin-config/subcategory-entries', {
        subcategory: activeAdminMenuItem,
        data,
      })

      if (activeAdminMenuItem === 'Municipal registration') {
        const city = data['Municipality']?.trim()
        if (city) {
          await api.post('/admin-config/municipalities', { name: city })
          const response = await api.get('/admin-config/municipalities')
          const cityList = (response.data as Array<{ name: string }>).map((entry) => entry.name)
          setMunicipalities(cityList)
          setRegisterForm((prev) => ({ ...prev, municipality: city }))
        }
      }

      setSubcategoryMessage(`Draft saved for ${activeAdminMenuItem}.`)
    } catch {
      setSubcategoryMessage(`Failed to save ${activeAdminMenuItem}. Please try again.`)
    }

    window.setTimeout(() => setSubcategoryMessage(''), 2500)
  }

  const leaveReviewer = isSuperAdmin ? 'hr' : role === UserRole.HR_ADMIN ? 'hr' : 'manager'

  const exportPayrollCsv = () => {
    const header = ['Employee', 'Employee Number', 'Hours', 'Gross Amount', 'Currency', 'Calculated At']
    const rows = payrollRecords.map((entry) => [
      `${entry.employee?.firstName ?? ''} ${entry.employee?.lastName ?? ''}`.trim(),
      entry.employee?.employeeNumber ?? '',
      entry.totalHours,
      entry.grossAmount,
      entry.currency,
      dayjs(entry.calculatedAt).format('YYYY-MM-DD HH:mm:ss'),
    ])
    const csv = [header, ...rows].map((row) => row.map((item) => `"${String(item).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-records-${dayjs().format('YYYYMMDD-HHmm')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const triggerPublicCheckIn = (employeeIdValue: string) => {
    if (publicLoading) {
      return
    }
    setSelectedPublicEmployeeId(employeeIdValue)
    cameraInputRef.current?.click()
  }

  const handlePublicPhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedPublicEmployeeId) {
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const raw = String(reader.result ?? '')
      const base64 = raw.includes(',') ? raw.split(',')[1] : raw
      try {
        setPublicLoading(true)
        setPublicToast({ kind: 'info', message: 'Uploading photo for check-in...' })
        await api.post('/public/check-in', {
          employeeId: selectedPublicEmployeeId,
          photoBase64: base64,
        })
        const selected = publicEmployees.find((entry) => entry.id === selectedPublicEmployeeId)
        setPublicToast({
          kind: 'success',
          message: `Check-in successful for ${selected?.firstName ?? ''} ${selected?.lastName ?? ''}`.trim(),
        })
      } catch {
        setPublicToast({ kind: 'error', message: 'Check-in failed. Please try again.' })
      } finally {
        setPublicLoading(false)
        setSelectedPublicEmployeeId('')
        event.target.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#ffe8cc_0%,#f6f6ef_35%,#f3f4f6_100%)] px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-5xl rounded-3xl border border-amber-200/70 bg-white/70 p-8 shadow-2xl shadow-amber-200/40 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900">Liana HR Cloud</h1>
            <button
              onClick={() => setShowLoginModal(true)}
              className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-black"
              disabled={loading}
            >
              LOGIN
            </button>
          </div>

          <div className="mt-4 max-h-[420px] overflow-auto rounded-2xl border border-slate-200 bg-white/80 p-4">
            <div className="grid gap-2 md:grid-cols-2">
              {publicEmployees.map((entry) => (
                <button
                  key={entry.id}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-left font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => triggerPublicCheckIn(entry.id)}
                  disabled={publicLoading}
                >
                  {entry.firstName} {entry.lastName}
                </button>
              ))}
            </div>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handlePublicPhotoSelected}
          />

          {publicLoading && <p className="mt-3 text-sm text-slate-700">Uploading check-in photo...</p>}
          {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

          {publicToast && (
            <div
              className={`fixed bottom-4 right-4 z-50 rounded-xl px-4 py-3 text-sm text-white shadow-xl ${
                publicToast.kind === 'success'
                  ? 'bg-emerald-700'
                  : publicToast.kind === 'error'
                    ? 'bg-rose-700'
                    : 'bg-slate-700'
              }`}
            >
              {publicToast.message}
            </div>
          )}

          {showLoginModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-serif text-2xl">Login</h2>
                  <button className="rounded-md border border-slate-300 px-2 py-1 text-sm" onClick={() => setShowLoginModal(false)}>
                    Close
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="Email"
                    value={loginForm.email}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                  />
                  <input
                    type="password"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                  />
                </div>

                <button
                  className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2 text-white"
                  disabled={loading}
                  onClick={() => {
                    void login(loginForm)
                    setShowLoginModal(false)
                  }}
                >
                  {loading ? 'Signing in...' : 'Login'}
                </button>

                <button
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2"
                  onClick={() => {
                    setLoginForm(userSeed)
                  }}
                >
                  Fill Demo SuperAdmin
                </button>
              </div>
            </div>
          )}
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
              Logged in: {user?.email} ({roleLabel})
            </div>
            <button
              className="rounded-xl bg-rose-700 px-4 py-2 text-sm text-white"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </header>

        {canAdminUsers ? (
          <section className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Dashboard Menu</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {adminMenuGroups.map((group) => {
                const isOpen = visibleAdminGroup === group.title
                return (
                  <div
                    key={group.title}
                    className="relative"
                    onMouseEnter={() => setHoverAdminGroup(group.title)}
                    onMouseLeave={() => setHoverAdminGroup(null)}
                  >
                    <button
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                        isOpen
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100'
                      }`}
                      onClick={() => setPinnedAdminGroup((prev) => (prev === group.title ? null : group.title))}
                    >
                      {group.title}
                    </button>

                    {isOpen && (
                      <div className="absolute left-0 top-full z-40 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
                        <div className="space-y-1">
                          {group.items.map((item) => (
                            <button
                              key={item}
                              className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                                activeAdminMenuItem === item
                                  ? 'border-slate-900 bg-slate-900 text-white'
                                  : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100'
                              }`}
                              onClick={() => onAdminMenuClick(item)}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-3 text-xs text-slate-500">
              Hover a category or click to pin it open.
            </div>
          </section>
        ) : (
          <section className="grid gap-3 md:grid-cols-6">
            {menuItems.filter((item) => item.show).map((item) => (
              <button
                key={item.key}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${menu === item.key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100'}`}
                onClick={() => setMenu(item.key)}
              >
                {item.label}
              </button>
            ))}
          </section>
        )}

        {canAdminUsers && (
          <section className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Module</p>
            <h2 className="mt-1 font-serif text-2xl text-slate-900">{activeAdminMenuItem}</h2>
            <p className="mt-1 text-sm text-slate-600">Category: {activeAdminGroup}</p>
          </section>
        )}

        {canAdminUsers && activeAdminMenuItem !== 'Register Employees' && activeSubcategoryFields.length > 0 && (
          <section className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-2xl">{activeAdminMenuItem} Form</h2>
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white" onClick={saveSubcategoryDraft}>
                Save Draft
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Structured reference fields aligned to Kosovo payroll and HR administration workflow.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {activeSubcategoryFields.map((fieldName) => (
                <label key={fieldName} className="text-sm">
                  <span className="mb-1 block text-slate-600">{fieldName}</span>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={subcategoryDrafts[activeAdminMenuItem]?.[fieldName] ?? ''}
                    onChange={(event) => updateSubcategoryField(activeAdminMenuItem, fieldName, event.target.value)}
                  />
                </label>
              ))}
            </div>

            <label className="mt-3 block text-sm">
              <span className="mb-1 block text-slate-600">Notes / Legal Reference</span>
              <textarea
                className="min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2"
                value={subcategoryDrafts[activeAdminMenuItem]?.['Notes / Legal Reference'] ?? ''}
                onChange={(event) => updateSubcategoryField(activeAdminMenuItem, 'Notes / Legal Reference', event.target.value)}
              />
            </label>

            {subcategoryMessage && <p className="mt-3 text-sm text-emerald-700">{subcategoryMessage}</p>}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Employees" value={String(employees.length)} tone="blue" />
          <MetricCard title="Punches Today" value={String(punches.length)} tone="amber" />
          <MetricCard title="Attendance Rows" value={String(attendance.length)} tone="emerald" />
          <MetricCard title="Absent/Alerts" value={String(absenceCount)} tone="rose" />
        </section>

        {menu === 'frontpage' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Frontpage: Click-in / Click-out</h2>
            <p className="text-sm text-slate-600">Choose any user and punch directly from this board.</p>

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

            <div className="mt-4 max-h-72 space-y-2 overflow-auto">
              {employees.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{entry.firstName} {entry.lastName}</div>
                      <div className="text-xs text-slate-500">{entry.user?.email} • {entry.user?.role ?? UserRole.EMPLOYEE}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white" onClick={() => void createPunch({ employeeId: entry.id, type: 'check_in', photoBase64 })}>In</button>
                      <button className="rounded-lg bg-orange-600 px-3 py-1.5 text-white" onClick={() => void createPunch({ employeeId: entry.id, type: 'check_out', photoBase64 })}>Out</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
        )}

        {menu === 'register' && canAdminUsers && (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg lg:col-span-2">
            <h2 className="font-serif text-2xl">Register User</h2>
            <p className="text-sm text-slate-600">SuperAdmin / HR can register employees and assign access role.</p>

            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Name</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.firstName} onChange={(event) => setRegisterForm((prev) => ({ ...prev, firstName: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Surname</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.lastName} onChange={(event) => setRegisterForm((prev) => ({ ...prev, lastName: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Birthdate</span>
                <input type="date" className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.birthDate} onChange={(event) => setRegisterForm((prev) => ({ ...prev, birthDate: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Country</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.country} onChange={(event) => setRegisterForm((prev) => ({ ...prev, country: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Personal ID</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.personalId} onChange={(event) => setRegisterForm((prev) => ({ ...prev, personalId: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Work ID</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.employeeNumber} onChange={(event) => setRegisterForm((prev) => ({ ...prev, employeeNumber: event.target.value }))} />
              </label>
              <label className="text-sm md:col-span-2 lg:col-span-3">
                <span className="mb-1 block text-slate-600">Address</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.address} onChange={(event) => setRegisterForm((prev) => ({ ...prev, address: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Municipality</span>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={registerForm.municipality}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, municipality: event.target.value }))}
                >
                  <option value="">Select municipality</option>
                  {municipalities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Tel</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.tel} onChange={(event) => setRegisterForm((prev) => ({ ...prev, tel: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Official Email</span>
                <input type="email" className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.email} onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Employment Date</span>
                <input type="date" className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.hireDate} onChange={(event) => setRegisterForm((prev) => ({ ...prev, hireDate: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Marital Status</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.maritalStatus} onChange={(event) => setRegisterForm((prev) => ({ ...prev, maritalStatus: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Education</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.education} onChange={(event) => setRegisterForm((prev) => ({ ...prev, education: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Emergency Contact</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.emergencyContact} onChange={(event) => setRegisterForm((prev) => ({ ...prev, emergencyContact: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Family Connection</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.familyConnection} onChange={(event) => setRegisterForm((prev) => ({ ...prev, familyConnection: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Emergency Phone</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.emergencyPhone} onChange={(event) => setRegisterForm((prev) => ({ ...prev, emergencyPhone: event.target.value }))} />
              </label>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Temporary Password" type="password" value={registerForm.password} onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))} />
              <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Hourly rate" type="number" min={0} step="0.1" value={registerForm.hourlyRateEur} onChange={(event) => setRegisterForm((prev) => ({ ...prev, hourlyRateEur: Number(event.target.value) }))} />
              <select className="rounded-xl border border-slate-300 px-3 py-2" value={registerForm.role} onChange={(event) => setRegisterForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}>
                <option value={UserRole.EMPLOYEE}>User</option>
                <option value={UserRole.HR_ADMIN}>HR</option>
                <option value={UserRole.MANAGER}>Manager</option>
              </select>
            </div>

            <button
              className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-white"
              onClick={() => void createEmployee(registerForm)}
            >
              Register User
            </button>
          </article>
        </section>
        )}

        {menu === 'users' && canAdminUsers && (
        <section className="grid gap-4">
          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">All Users / Hierarchy</h2>
            <div className="mt-3 overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Hourly Rate</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-200">
                      <td className="px-3 py-2">{entry.firstName} {entry.lastName}</td>
                      <td className="px-3 py-2">{entry.user?.email}</td>
                      <td className="px-3 py-2">
                        <select
                          className="rounded-lg border border-slate-300 px-2 py-1"
                          value={entry.user?.role ?? UserRole.EMPLOYEE}
                          onChange={(event) => {
                            void updateEmployee(entry.id, { role: event.target.value as UserRole })
                          }}
                        >
                          <option value={UserRole.EMPLOYEE}>User</option>
                          <option value={UserRole.HR_ADMIN}>HR</option>
                          <option value={UserRole.MANAGER}>Manager</option>
                          {isSuperAdmin && <option value={UserRole.SYSTEM_ADMIN}>SuperAdmin</option>}
                        </select>
                      </td>
                      <td className="px-3 py-2">{entry.hourlyRateEur ?? '-'}</td>
                      <td className="px-3 py-2">
                        {isSuperAdmin && (
                          <button className="rounded-lg bg-rose-600 px-3 py-1.5 text-white" onClick={() => void removeEmployee(entry.id)}>
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
              System users loaded: {systemUsers.length}
            </div>
          </article>
        </section>
        )}

        {menu === 'attendance' && canManageOps && (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Attendance Snapshot</h2>
            <button className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-white" onClick={() => void exportAttendanceCsv()}>
              Export Attendance CSV
            </button>
            <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
              {attendance.slice(0, 14).map((entry) => (
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

          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Live Punch Feed</h2>
            <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
              {punches.slice(0, 16).map((entry) => (
                <li key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="font-medium">{entry.employeeId}</div>
                  <div className="text-slate-600">{entry.type} at {dayjs(entry.punchedAt).format('HH:mm:ss')}</div>
                </li>
              ))}
            </ul>
          </article>
        </section>
        )}

        {menu === 'leaves' && canManageOps && (
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
            <h2 className="font-serif text-2xl">Recent Leave Requests</h2>
            <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
              {leaveRequests.slice(0, 16).map((entry) => (
                <li key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{entry.employeeId}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5">{entry.status}</span>
                  </div>
                  <div className="mt-1 text-slate-600">{entry.startDate} → {entry.endDate}</div>
                  {(role === UserRole.MANAGER || role === UserRole.HR_ADMIN || isSuperAdmin) && entry.status === 'pending' && (
                    <div className="mt-2 flex gap-2">
                      <button
                        className="rounded-lg bg-emerald-700 px-3 py-1 text-white"
                        onClick={() => void reviewLeave({ requestId: entry.id, status: 'approved', reviewer: leaveReviewer })}
                      >
                        Approve
                      </button>
                      <button
                        className="rounded-lg bg-rose-700 px-3 py-1 text-white"
                        onClick={() => void reviewLeave({ requestId: entry.id, status: 'rejected', reviewer: leaveReviewer })}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </article>
        </section>
        )}

        {menu === 'payroll' && canAdminUsers && (
        <section className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
          <h2 className="font-serif text-2xl">Payroll Export Center</h2>
          <p className="text-sm text-slate-600">SuperAdmin / HR can export payroll records at any time.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-white" onClick={() => void loadPayrollRecords()}>
              Refresh Payroll Records
            </button>
            <button className="rounded-xl bg-emerald-700 px-4 py-2 text-white" onClick={exportPayrollCsv}>
              Export Payroll CSV
            </button>
          </div>

          <div className="mt-3 overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600">
                  <th className="px-3 py-2">Employee</th>
                  <th className="px-3 py-2">Hours</th>
                  <th className="px-3 py-2">Gross</th>
                  <th className="px-3 py-2">Currency</th>
                  <th className="px-3 py-2">Calculated</th>
                </tr>
              </thead>
              <tbody>
                {payrollRecords.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-200">
                    <td className="px-3 py-2">{entry.employee?.firstName} {entry.employee?.lastName}</td>
                    <td className="px-3 py-2">{entry.totalHours}</td>
                    <td className="px-3 py-2">{entry.grossAmount}</td>
                    <td className="px-3 py-2">{entry.currency}</td>
                    <td className="px-3 py-2">{dayjs(entry.calculatedAt).format('YYYY-MM-DD HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {error && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
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
