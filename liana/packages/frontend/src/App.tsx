import dayjs from 'dayjs'
import axios from 'axios'
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
  branchName?: string
  workState?: 'ready_to_start' | 'working' | 'on_break' | 'finished'
}

type PublicToast = {
  kind: 'success' | 'error' | 'info'
  message: string
}

type PunchHistoryEntry = {
  id: string
  employeeId: string
  type: 'check_in' | 'break_start' | 'break_end' | 'check_out'
  punchedAt: string
  source?: string
  photoUrl?: string | null
  photoDataUrl?: string | null
  employee?: {
    id: string
    firstName: string
    lastName: string
    employeeNumber?: string
  } | null
}

type LeaveTypeOption = {
  id: string
  name: string
  code: string
  paid: boolean
}

type InlineMessage = {
  kind: 'success' | 'error' | 'info'
  text: string
}

type EmployeeSelfProfile = {
  id: string
  firstName: string
  lastName: string
  employeeNumber?: string
  annualLeaveEntitlement?: number
  annualLeaveRemaining?: number
  branchName?: string
}

type InAppNotification = {
  id: string
  subject: string
  body: string
  actionPath?: string
  status: string
  createdAt: string
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
  position: string
  emergencyContact: string
  familyConnection: string
  password: string
  hourlyRateEur: number
  hireDate: string
  branchName: string
  annualLeaveEntitlement: number
  role: UserRole
}

type EmployeeEditForm = {
  employeeNumber: string
  firstName: string
  lastName: string
  email: string
  birthDate: string
  country: string
  personalId: string
  address: string
  municipality: string
  tel: string
  maritalStatus: string
  education: string
  position: string
  emergencyContact: string
  familyConnection: string
  hireDate: string
  hourlyRateEur: string
  role: UserRole
  branchName: string
  annualLeaveEntitlement: string
  annualLeaveRemaining: string
}

const DEFAULT_LLOJET_E_SHKOLLIMIT = [
  'Lloji i shkollimit',
  'Shkolla e larte (3 vjeq)',
  'Bachelor (3 vjeq)',
  'Universitar (4 vjeq)',
  'Master',
  'Dr.Shkence',
]

const SHTETET = ['Kosova', 'Shqiperia', 'Maqedonia']

const QYTETET_E_KOSOVES = [
  'Deqan',
  'Dragash',
  'Drenas',
  'Ferizaj',
  'Fushe Kosove',
  'Gjakove',
  'Gjilan',
  'Gracanice',
  'Hani i Elezit',
  'Istog',
  'Junik',
  'Kacanik',
  'Kamenice',
  'Kline',
  'Kllokot',
  'Leposaviq',
  'Lipjan',
  'Malisheve',
  'Mamush',
  'Mitrovice e Jugut',
  'Mitrovice e Veriut',
  'Novoberde',
  'Obiliq',
  'Partesh',
  'Peje',
  'Podujeve',
  'Prishtine',
  'Prizren',
  'Rahovec',
  'Ranillug',
  'Shterpce',
  'Shtime',
  'Skenderaj',
  'Suhareke',
  'Viti',
  'Vushtrri',
  'Zubin Potok',
  'Zvecan',
]

const EDUCATION_TYPES_STORAGE_KEY = 'liana_education_types'
const JOB_POSITIONS_STORAGE_KEY = 'liana_job_positions'
const MARITAL_STATUS_STORAGE_KEY = 'liana_marital_statuses'

const DEFAULT_MARITAL_STATUSES = [
  'i/e pa martuar',
  'i/e martuar',
  'i/e ndarë',
]

const DEFAULT_JOB_POSITIONS = [
  'Menaxher',
  'Asistent menaxher',
  'Depoist',
  'Depo',
  'Keshilltar per Klient',
  'Arkitekt',
  'Ndihmese',
  'Shtepiak',
  'Menaxher i Depos',
  'Kordinator i Shitjes',
  'Menaxher Importi',
  'Vozites',
  'Inxhinier i Hidro',
]

const KOSOVO_FIXED_HOLIDAYS = [
  { month: 1, day: 1, name: 'Viti i Ri' },
  { month: 1, day: 2, name: 'Viti i Ri (dita 2)' },
  { month: 2, day: 17, name: 'Dita e Pavaresise' },
  { month: 4, day: 9, name: 'Dita e Kushtetutes' },
  { month: 5, day: 1, name: 'Dita Nderkombetare e Punes' },
  { month: 12, day: 25, name: 'Krishtlindjet' },
]

const KOSOVO_EID_BY_YEAR: Record<number, { fitr: string; adha: string }> = {
  2025: { fitr: '2025-03-31', adha: '2025-06-06' },
  2026: { fitr: '2026-03-20', adha: '2026-05-27' },
  2027: { fitr: '2027-03-10', adha: '2027-05-17' },
}

const buildKosovoHolidayDates = (year: number) => {
  const fixed = KOSOVO_FIXED_HOLIDAYS.map((entry) => ({
    date: dayjs(`${year}-${String(entry.month).padStart(2, '0')}-${String(entry.day).padStart(2, '0')}`).format('YYYY-MM-DD'),
    name: entry.name,
  }))

  const eid = KOSOVO_EID_BY_YEAR[year]
  if (!eid) {
    return fixed
  }

  return [
    ...fixed,
    { date: eid.fitr, name: 'Bajrami i Vogel' },
    { date: eid.adha, name: 'Bajrami i Madh' },
  ]
}

const LABELS_SQ: Record<string, string> = {
  Employee: 'Punonjesi',
  'Salary / Compensation': 'Paga / Kompensimi',
  Vacation: 'Pushimet',
  'Click-in / Click-out': 'Hyrje / Dalje',
  'HR Definitions': 'Percaktime HR',
  Company: 'Kompania',
  Administration: 'Administrimi',
  Password: 'Fjalekalimi',

  'Register Employees': 'Regjistrimi i punonjesve',
  'Click-in': 'Hyrje',
  'Register Contracts': 'Regjistrimi i kontratave',
  'Employee files': 'Dosjet e punonjesve',
  'Employee status': 'Statusi i punonjesit',
  'Salary Determination': 'Percaktimi i pages',
  'Salary period': 'Periudha e pages',
  'Registration of additional days/hours': 'Regjistrimi i diteve/oreve shtese',
  'Additional Income Registration': 'Regjistrimi i te ardhurave shtese',
  'Salary Calculation': 'Llogaritja e pages',
  'Payroll List': 'Lista e pagesave',
  'E - Declaration (EDI)': 'E - Deklarimi (EDI)',
  'Request for vacation': 'Kerkese per pushim',
  'Recording hours for vacation': 'Regjistrimi i oreve te pushimit',
  'Holiday status': 'Statusi i pushimit',
  'Holiday calendar': 'Kalendari i pushimeve',
  'Click-in/out recording': 'Regjistrimi i hyrje/dalje',
  'Open entries/exits': 'Hyrje/dalje te hapura',
  'List of clicks-in/out': 'Lista e hyrje/daljeve',
  'Employees present': 'Punonjesit prezent',
  'Types of contracts': 'Llojet e kontratave',
  'Type of employer': 'Lloji i punedhenesit',
  'Types of vacations': 'Llojet e pushimeve',
  'Types of probationary periods': 'Llojet e periudhave provuese',
  'Type of calculation of elements': 'Lloji i llogaritjes se elementeve',
  'Calculation coefficient': 'Koeficienti i llogaritjes',
  'Salary elements': 'Elementet e pages',
  'Company details': 'Detajet e kompanise',
  'Company branches': 'Dega e kompanise',
  'Departments/units': 'Departamentet/njesite',
  'Job positions': 'Pozitat e punes',
  'Municipal registration': 'Regjistrimi komunal',
  'State registration': 'Regjistrimi shteteror',
  'Bank registration': 'Regjistrimi bankar',
  'Marital status': 'Gjendja martesore',

  'Contract Type': 'Lloji i kontrates',
  'Contract Number': 'Numri i kontrates',
  'Start Date': 'Data e fillimit',
  'End Date': 'Data e mbarimit',
  'Probation Period': 'Periudha provuese',
  'Working Hours/Week': 'Oret e punes/jave',
  'File Type': 'Lloji i dokumentit',
  'Document Number': 'Numri i dokumentit',
  'Issue Date': 'Data e leshimit',
  'Expiry Date': 'Data e skadimit',
  'Storage Reference': 'Referenca e arkives',
  Status: 'Statusi',
  'Effective Date': 'Data e hyrjes ne fuqi',
  Reason: 'Arsyeja',
  'Approved By': 'Miratuar nga',
  'Base Salary (EUR)': 'Paga baze (EUR)',
  'Job Coefficient': 'Koeficienti i pozites',
  'Tax Category (Kosovo)': 'Kategoria tatimore (Kosove)',
  'Pension Contribution (%)': 'Kontributi pensional (%)',
  'Overtime Coefficient': 'Koeficienti i ores shtese',
  'Valid From': 'Vlen nga',
  Month: 'Muaji',
  Year: 'Viti',
  'Payroll Cutoff Date': 'Data e mbylljes se pages',
  'Payment Date': 'Data e pageses',
  'Working Days': 'Ditet e punes',
  'Public Holidays': 'Pushimet zyrtare',
  Date: 'Data',
  'Additional Hours': 'Oret shtese',
  'Weekend Hours': 'Oret e fundjaves',
  'Overtime Reason': 'Arsyeja e ores shtese',
  'Income Type': 'Lloji i te ardhures',
  'Gross Amount (EUR)': 'Shuma bruto (EUR)',
  Taxable: 'E tatueshme',
  'Pension Applicable': 'Me kontribut pensional',
  'Payroll Period': 'Periudha e pages',
  'Regular Hours': 'Oret e rregullta',
  'Overtime Hours': 'Oret shtese',
  'Gross Salary (EUR)': 'Paga bruto (EUR)',
  'Tax Withholding (EUR)': 'Tatimi i ndalur (EUR)',
  'Net Salary (EUR)': 'Paga neto (EUR)',
  Department: 'Departamenti',
  'Bank Transfer Batch ID': 'ID e batch-it bankar',
  'Total Gross (EUR)': 'Totali bruto (EUR)',
  'Total Net (EUR)': 'Totali neto (EUR)',
  'Prepared By': 'Pergatitur nga',
  'Declaration Type': 'Lloji i deklarimit',
  'Fiscal Number': 'Numri fiskal',
  'Tax Period': 'Periudha tatimore',
  'Submission Date': 'Data e dorezimit',
  'Protocol Number': 'Numri i protokollit',
  'Vacation Type': 'Lloji i pushimit',
  'Total Days': 'Ditet totale',
  'Approval Level': 'Niveli i aprovimit',
  'Vacation Hours': 'Oret e pushimit',
  'Compensatory Hours': 'Oret kompensuese',
  'Annual Entitlement (Days)': 'E drejta vjetore (dite)',
  'Used Days': 'Ditet e shfrytezuara',
  'Remaining Days': 'Ditet e mbetura',
  'Carry Over (Days)': 'Bartja (dite)',
  'Holiday Name': 'Emri i pushimit',
  'Paid/Unpaid': 'I paguar / i papaguar',
  'Branch Scope': 'Shtrirja e deges',
  'Legal Reference': 'Referenca ligjore',
  'Check-in Time': 'Koha e hyrjes',
  'Check-out Time': 'Koha e daljes',
  'Source Device': 'Pajisja burim',
  'Geo Location': 'Gjeolokacioni',
  'Open Punch Date': 'Data e hyrje/daljes se hapur',
  'Last Event Time': 'Koha e ngjarjes se fundit',
  'Exception Reason': 'Arsyeja e perjashtimit',
  'Supervisor Note': 'Shenim i mbikeqyresit',
  'Period From': 'Periudha nga',
  'Period To': 'Periudha deri',
  'Missing Punches': 'Mungesat e hyrje/daljeve',
  'Total Punches': 'Totali i hyrje/daljeve',
  Shift: 'Nderrimi',
  'Present Count': 'Numri prezent',
  'Absent Count': 'Numri mungese',
  'Late Count': 'Numri me vonese',
  Code: 'Kodi',
  'Contract Type Name': 'Emri i llojit te kontrates',
  'Default Duration': 'Kohezgjatja standarde',
  'Requires Probation': 'Kerkon periudhe prove',
  Active: 'Aktiv',
  'Employer Type': 'Lloji i punedhenesit',
  'Tax Handling Rule': 'Rregulli i trajtimit tatimor',
  'Pension Rule': 'Rregulli pensional',
  'Vacation Type Name': 'Emri i llojit te pushimit',
  'Annual Limit (Days)': 'Limiti vjetor (dite)',
  'Carry Over Allowed': 'Lejohet bartja',
  'Duration (Months)': 'Kohezgjatja (muaj)',
  'Role Scope': 'Shtrirja e rolit',
  'Evaluation Required': 'Vleresimi i detyrueshem',
  'Element Name': 'Emri i elementit',
  'Calculation Formula': 'Formula e llogaritjes',
  'Coefficient Name': 'Emri i koeficientit',
  Value: 'Vlera',
  'Element Type': 'Lloji i elementit',
  'Default Amount/Rate': 'Shuma/norma standarde',
  'Legal Company Name': 'Emri ligjor i kompanise',
  'Business Registration Number': 'Numri i regjistrimit te biznesit',
  Address: 'Adresa',
  Phone: 'Telefoni',
  'Official Email': 'Email zyrtar',
  'Branch Code': 'Kodi i deges',
  'Branch Name': 'Emri i deges',
  Municipality: 'Komuna',
  Manager: 'Menaxheri',
  'Department Code': 'Kodi i departamentit',
  'Department Name': 'Emri i departamentit',
  'Cost Center': 'Qendra e kostos',
  'Position Code': 'Kodi i pozites',
  'Position Title': 'Titulli i pozites',
  Grade: 'Grada',
  'Base Salary Band': 'Banda e pages baze',
  'Registration Number': 'Numri i regjistrimit',
  'Registration Date': 'Data e regjistrimit',
  Reference: 'Referenca',
  Authority: 'Autoriteti',
  'Bank Name': 'Emri i bankes',
  IBAN: 'IBAN',
  SWIFT: 'SWIFT',
  'Account Holder': 'Mbajtesi i llogarise',
  'Activation Date': 'Data e aktivizimit',
  'Dependent Count': 'Numri i vartesve',
  'Current Password': 'Fjalekalimi aktual',
  'New Password': 'Fjalekalimi i ri',
  'Confirm New Password': 'Konfirmo fjalekalimin e ri',
  'Last Change Date': 'Data e ndryshimit te fundit',
  'Notes / Legal Reference': 'Shenime / Reference ligjore',
}

const trLabel = (label: string) => LABELS_SQ[label] ?? label

const ROLE_LABEL_SQ: Record<string, string> = {
  [UserRole.EMPLOYEE]: 'Perdorues',
  [UserRole.MANAGER]: 'Menaxher',
  [UserRole.HR_ADMIN]: 'HR',
  [UserRole.SYSTEM_ADMIN]: 'SuperAdmin',
}

const ATTENDANCE_STATUS_SQ: Record<string, string> = {
  present: 'Prezent',
  absent: 'Mungese',
  late: 'Me vonese',
  on_leave: 'Ne pushim',
}

const LEAVE_STATUS_SQ: Record<string, string> = {
  pending: 'Ne pritje',
  approved: 'Aprovuar',
  rejected: 'Refuzuar',
}

const PUNCH_TYPE_SQ: Record<string, string> = {
  check_in: 'Hyrje',
  break_start: 'Fillo pauzen',
  break_end: 'Mbaro pauzen',
  check_out: 'Dalje',
}

const trRole = (role: string) => ROLE_LABEL_SQ[role] ?? role
const trAttendanceStatus = (status: string) => ATTENDANCE_STATUS_SQ[status] ?? status
const trLeaveStatus = (status: string) => LEAVE_STATUS_SQ[status] ?? status
const trPunchType = (type: string) => PUNCH_TYPE_SQ[type] ?? type
const formatDateDisplay = (value: string | Date) => dayjs(value).isValid() ? dayjs(value).format('DD.MM.YYYY') : '-'
const formatDateTimeDisplay = (value: string | Date) => dayjs(value).isValid() ? dayjs(value).format('DD.MM.YYYY HH:mm:ss') : '-'

const adminSubcategoryFieldMap: Record<string, string[]> = {
  'Register Contracts': ['Contract Type', 'Contract Number', 'Start Date', 'End Date', 'Probation Period', 'Working Hours/Week'],
  'Employee files': ['Employee', 'File Type', 'Document Number', 'Issue Date', 'Expiry Date', 'Storage Reference'],
  'Lloji i shkollimit': [],
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
  'Job positions': [],
  'Municipal registration': ['Municipality', 'Registration Number', 'Registration Date', 'Status', 'Reference'],
  'State registration': ['Authority', 'Registration Number', 'Issue Date', 'Expiry Date', 'Status'],
  'Bank registration': ['Bank Name', 'IBAN', 'SWIFT', 'Account Holder', 'Activation Date', 'Status'],
  'Marital status': [],
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
  const [selectedPublicBranch, setSelectedPublicBranch] = useState<string | null>(null)
  const [selectedPublicActionEmployee, setSelectedPublicActionEmployee] = useState<PublicEmployee | null>(null)
  const [pendingPublicAction, setPendingPublicAction] = useState<'check_in' | 'break_start' | 'break_end' | 'check_out' | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [activeAdminMenuItem, setActiveAdminMenuItem] = useState('Dashboard')
  const [pinnedAdminGroup, setPinnedAdminGroup] = useState<string | null>(null)
  const [subcategoryDrafts, setSubcategoryDrafts] = useState<Record<string, Record<string, string>>>({})
  const [subcategoryMessage, setSubcategoryMessage] = useState('')
  const [municipalities, setMunicipalities] = useState<string[]>(QYTETET_E_KOSOVES)
  const [educationTypes, setEducationTypes] = useState<string[]>(DEFAULT_LLOJET_E_SHKOLLIMIT)
  const [newEducationType, setNewEducationType] = useState('')
  const [jobPositions, setJobPositions] = useState<string[]>(DEFAULT_JOB_POSITIONS)
  const [newJobPosition, setNewJobPosition] = useState('')
  const [maritalStatuses, setMaritalStatuses] = useState<string[]>(DEFAULT_MARITAL_STATUSES)
  const [newMaritalStatus, setNewMaritalStatus] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(dayjs().startOf('month'))
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false)
  const [leaveRequestStatusFilter, setLeaveRequestStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedHistoryEmployee, setSelectedHistoryEmployee] = useState<{ id: string; name: string } | null>(null)
  const [selectedHistoryEntries, setSelectedHistoryEntries] = useState<PunchHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'check_in' | 'break_start' | 'break_end' | 'check_out'>('all')
  const [historyFromDate, setHistoryFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [historyToDate, setHistoryToDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'))
  const [historyPhotoTargetId, setHistoryPhotoTargetId] = useState<string | null>(null)
  const [employeeFormSaving, setEmployeeFormSaving] = useState(false)
  const [employeeFormMessage, setEmployeeFormMessage] = useState('')
  const [employeeEditForm, setEmployeeEditForm] = useState<EmployeeEditForm>({
    employeeNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    country: '',
    personalId: '',
    address: '',
    municipality: '',
    tel: '',
    maritalStatus: '',
    education: '',
    position: '',
    emergencyContact: '',
    familyConnection: '',
    hireDate: '',
    hourlyRateEur: '',
    role: UserRole.EMPLOYEE,
    branchName: 'Prishtina',
    annualLeaveEntitlement: '20',
    annualLeaveRemaining: '20',
  })
  const [selfProfile, setSelfProfile] = useState<EmployeeSelfProfile | null>(null)
  const [selfAttendance, setSelfAttendance] = useState<Array<{ id: string; date: string; workedMinutes: number; status: string; checkInAt?: string; checkOutAt?: string }>>([])
  const [selfLeaveRequests, setSelfLeaveRequests] = useState<Array<{ id: string; startDate: string; endDate: string; totalDays: number; status: string; signedDocumentAvailable?: boolean; reason?: string; leaveType?: { name?: string } }>>([])
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<LeaveTypeOption[]>([])
  const [leaveSubmitMessage, setLeaveSubmitMessage] = useState<InlineMessage | null>(null)
  const [leaveSubmitting, setLeaveSubmitting] = useState(false)
  const [leaveAdminMessage, setLeaveAdminMessage] = useState<InlineMessage | null>(null)
  const [signedDocumentUploadingId, setSignedDocumentUploadingId] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const historyPhotoInputRef = useRef<HTMLInputElement | null>(null)
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
    position: '',
    emergencyContact: '',
    familyConnection: '',
    password: 'Admin123!',
    hourlyRateEur: 7,
    hireDate: dayjs().format('YYYY-MM-DD'),
    branchName: 'Prishtina',
    annualLeaveEntitlement: 20,
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
  const canEmployeeSelfService = role === UserRole.EMPLOYEE

  const roleLabel = trRole(role)

  const normalizeOptionList = (values: unknown) => {
    if (!Array.isArray(values)) {
      return [] as string[]
    }

    return values
      .map((entry) => String(entry).trim())
      .filter((entry, index, arr) => entry.length > 0 && arr.indexOf(entry) === index)
  }

  const parseStoredOptionValues = (value?: string) => {
    if (!value) {
      return [] as string[]
    }

    try {
      return normalizeOptionList(JSON.parse(value) as unknown)
    } catch {
      return []
    }
  }

  useEffect(() => {
    const interval = setInterval(() => setClock(dayjs()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (token) {
      return
    }
    if (!selectedPublicBranch) {
      setPublicEmployees([])
      return
    }

    const loadPublicEmployees = async () => {
      try {
        const response = await api.get(`/public/branches/${selectedPublicBranch}/employees`)
        setPublicEmployees(response.data)
      } catch {
        setPublicToast({ kind: 'error', message: 'Nuk u ngarkua lista e punonjesve ne faqen kryesore.' })
      }
    }

    void loadPublicEmployees()
  }, [token, selectedPublicBranch])

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
    if (!token || role !== UserRole.EMPLOYEE) {
      return
    }

    const loadSelfServiceData = async () => {
      try {
        const [profileResponse, attendanceResponse, myLeavesResponse, leaveTypesResponse] = await Promise.all([
          api.get('/employees/me'),
          api.get('/attendance/me'),
          api.get('/leaves/requests/me'),
          api.get('/leaves/types'),
        ])

        setSelfProfile(profileResponse.data)
        setSelfAttendance(attendanceResponse.data)
        setSelfLeaveRequests(myLeavesResponse.data)
        setLeaveTypeOptions(leaveTypesResponse.data)
        setLeaveForm((prev) => ({
          ...prev,
          employeeId: profileResponse.data?.id ?? '',
          leaveTypeId: leaveTypesResponse.data?.[0]?.id ?? prev.leaveTypeId,
        }))
      } catch {
        setSelfProfile(null)
      }
    }

    void loadSelfServiceData()
  }, [token, role])

  useEffect(() => {
    if (!token) {
      setNotifications([])
      return
    }

    const loadNotifications = async () => {
      try {
        const response = await api.get('/notifications/me')
        setNotifications(response.data as InAppNotification[])
      } catch {
        setNotifications([])
      }
    }

    void loadNotifications()

    const interval = window.setInterval(() => {
      void loadNotifications()
    }, 20000)

    return () => window.clearInterval(interval)
  }, [token, role])

  useEffect(() => {
    if (!token || !canAdminUsers) {
      return
    }

    const loadAdminReferenceData = async () => {
      try {
        const [municipalitiesResponse, educationTypesResponse, jobPositionsResponse, maritalStatusesResponse] = await Promise.all([
          api.get('/admin-config/municipalities'),
          api.get('/admin-config/subcategory-entries', {
            params: { subcategory: 'Lloji i shkollimit' },
          }),
          api.get('/admin-config/subcategory-entries', {
            params: { subcategory: 'Job positions' },
          }),
          api.get('/admin-config/subcategory-entries', {
            params: { subcategory: 'Marital status' },
          }),
        ])

        const cityList = (municipalitiesResponse.data as Array<{ name: string }>).map((entry) => entry.name)
        setMunicipalities(Array.from(new Set([...QYTETET_E_KOSOVES, ...cityList])))

        const educationValues = parseStoredOptionValues((educationTypesResponse.data as { data?: { values?: string } } | null)?.data?.values)
        if (educationValues.length > 0) {
          setEducationTypes(educationValues)
          localStorage.setItem(EDUCATION_TYPES_STORAGE_KEY, JSON.stringify(educationValues))
        }

        const jobPositionValues = parseStoredOptionValues((jobPositionsResponse.data as { data?: { values?: string } } | null)?.data?.values)
        if (jobPositionValues.length > 0) {
          setJobPositions(jobPositionValues)
          localStorage.setItem(JOB_POSITIONS_STORAGE_KEY, JSON.stringify(jobPositionValues))
        }

        const maritalStatusValues = parseStoredOptionValues((maritalStatusesResponse.data as { data?: { values?: string } } | null)?.data?.values)
        if (maritalStatusValues.length > 0) {
          setMaritalStatuses(maritalStatusValues)
          localStorage.setItem(MARITAL_STATUS_STORAGE_KEY, JSON.stringify(maritalStatusValues))
        }
      } catch {
        // Keep UI usable even if admin-config endpoints are temporarily unavailable.
      }
    }

    void loadAdminReferenceData()
  }, [token, canAdminUsers])

  useEffect(() => {
    if (!publicToast) {
      return
    }
    const timeout = window.setTimeout(() => setPublicToast(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [publicToast])

  useEffect(() => {
    const raw = localStorage.getItem(EDUCATION_TYPES_STORAGE_KEY)
    if (!raw) {
      return
    }

    try {
      const parsed = JSON.parse(raw) as unknown
      const cleaned = normalizeOptionList(parsed)

      if (cleaned.length > 0) {
        setEducationTypes(cleaned)
      }
    } catch {
      // Ignore corrupted local storage values and keep defaults.
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(EDUCATION_TYPES_STORAGE_KEY, JSON.stringify(educationTypes))
  }, [educationTypes])

  useEffect(() => {
    const raw = localStorage.getItem(JOB_POSITIONS_STORAGE_KEY)
    if (!raw) {
      return
    }

    try {
      const parsed = JSON.parse(raw) as unknown
      const cleaned = normalizeOptionList(parsed)

      if (cleaned.length > 0) {
        setJobPositions(cleaned)
      }
    } catch {
      // Ignore corrupted local storage values and keep defaults.
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(JOB_POSITIONS_STORAGE_KEY, JSON.stringify(jobPositions))
  }, [jobPositions])

  useEffect(() => {
    const raw = localStorage.getItem(MARITAL_STATUS_STORAGE_KEY)
    if (!raw) {
      return
    }

    try {
      const parsed = JSON.parse(raw) as unknown
      const cleaned = normalizeOptionList(parsed)

      if (cleaned.length > 0) {
        setMaritalStatuses(cleaned)
      }
    } catch {
      // Ignore corrupted local storage values and keep defaults.
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(MARITAL_STATUS_STORAGE_KEY, JSON.stringify(maritalStatuses))
  }, [maritalStatuses])

  const addEducationType = async () => {
    const value = newEducationType.trim()
    if (!value) {
      return
    }

    if (educationTypes.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
      setSubcategoryMessage('Ky lloj i shkollimit ekziston.')
      return
    }

    const nextEducationTypes = [...educationTypes, value]

    try {
      await api.post('/admin-config/subcategory-entries', {
        subcategory: 'Lloji i shkollimit',
        data: {
          values: JSON.stringify(nextEducationTypes),
        },
      })

      setEducationTypes(nextEducationTypes)
      localStorage.setItem(EDUCATION_TYPES_STORAGE_KEY, JSON.stringify(nextEducationTypes))
      setNewEducationType('')
      setSubcategoryMessage('Lloji i shkollimit u ruajt me sukses.')
    } catch {
      setSubcategoryMessage('Ruajtja deshtoi. Provo perseri.')
      window.setTimeout(() => setSubcategoryMessage(''), 2500)
      return
    }

    window.setTimeout(() => setSubcategoryMessage(''), 2500)
  }

  const addJobPosition = async () => {
    const value = newJobPosition.trim()
    if (!value) {
      return
    }

    if (jobPositions.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
      setSubcategoryMessage('Kjo pozite ekziston.')
      return
    }

    const nextJobPositions = [...jobPositions, value]

    try {
      await api.post('/admin-config/subcategory-entries', {
        subcategory: 'Job positions',
        data: {
          values: JSON.stringify(nextJobPositions),
        },
      })

      setJobPositions(nextJobPositions)
      localStorage.setItem(JOB_POSITIONS_STORAGE_KEY, JSON.stringify(nextJobPositions))
      setNewJobPosition('')
      setSubcategoryMessage('Pozita u ruajt me sukses.')
    } catch {
      setSubcategoryMessage('Ruajtja deshtoi. Provo perseri.')
      window.setTimeout(() => setSubcategoryMessage(''), 2500)
      return
    }

    window.setTimeout(() => setSubcategoryMessage(''), 2500)
  }

  const addMaritalStatus = async () => {
    const value = newMaritalStatus.trim()
    if (!value) {
      return
    }

    if (maritalStatuses.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
      setSubcategoryMessage('Ky opsion ekziston.')
      return
    }

    const nextMaritalStatuses = [...maritalStatuses, value]

    try {
      await api.post('/admin-config/subcategory-entries', {
        subcategory: 'Marital status',
        data: {
          values: JSON.stringify(nextMaritalStatuses),
        },
      })

      setMaritalStatuses(nextMaritalStatuses)
      localStorage.setItem(MARITAL_STATUS_STORAGE_KEY, JSON.stringify(nextMaritalStatuses))
      setNewMaritalStatus('')
      setSubcategoryMessage('Gjendja martesore u ruajt me sukses.')
    } catch {
      setSubcategoryMessage('Ruajtja deshtoi. Provo perseri.')
      window.setTimeout(() => setSubcategoryMessage(''), 2500)
      return
    }

    window.setTimeout(() => setSubcategoryMessage(''), 2500)
  }

  const openEmployeeHistory = async (employee: { id: string; firstName: string; lastName: string }) => {
    const employeeRecord = employees.find((entry) => entry.id === employee.id)

    setSelectedHistoryEmployee({ id: employee.id, name: `${employee.firstName} ${employee.lastName}`.trim() })
    setHistoryFromDate(dayjs().startOf('month').format('YYYY-MM-DD'))
    setHistoryToDate(dayjs().endOf('month').format('YYYY-MM-DD'))
    setEmployeeFormMessage('')
    setEmployeeEditForm({
      employeeNumber: employeeRecord?.employeeNumber ?? '',
      firstName: employeeRecord?.firstName ?? employee.firstName,
      lastName: employeeRecord?.lastName ?? employee.lastName,
      email: employeeRecord?.user?.email ?? '',
      birthDate: employeeRecord?.birthDate ?? '',
      country: employeeRecord?.country ?? '',
      personalId: employeeRecord?.personalId ?? '',
      address: employeeRecord?.address ?? '',
      municipality: employeeRecord?.municipality ?? '',
      tel: employeeRecord?.tel ?? '',
      maritalStatus: employeeRecord?.maritalStatus ?? '',
      education: employeeRecord?.education ?? '',
      position: employeeRecord?.position ?? '',
      emergencyContact: employeeRecord?.emergencyContact ?? '',
      familyConnection: employeeRecord?.familyConnection ?? '',
      hireDate: (employeeRecord as { hireDate?: string } | undefined)?.hireDate ?? '',
      hourlyRateEur: String(employeeRecord?.hourlyRateEur ?? ''),
      role: employeeRecord?.user?.role ?? UserRole.EMPLOYEE,
      branchName: employeeRecord?.branchName ?? 'Prishtina',
      annualLeaveEntitlement: String(employeeRecord?.annualLeaveEntitlement ?? 20),
      annualLeaveRemaining: String(employeeRecord?.annualLeaveRemaining ?? employeeRecord?.annualLeaveEntitlement ?? 20),
    })
    setSelectedHistoryEntries([])
    setHistoryLoading(true)

    try {
      const response = await api.get('/punches/history', {
        params: { employeeId: employee.id },
      })
      setSelectedHistoryEntries(response.data as PunchHistoryEntry[])
    } catch {
      setSelectedHistoryEntries([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const closeEmployeeHistory = () => {
    setSelectedHistoryEmployee(null)
    setSelectedHistoryEntries([])
    setHistoryLoading(false)
    setHistoryFilter('all')
    setHistoryFromDate(dayjs().startOf('month').format('YYYY-MM-DD'))
    setHistoryToDate(dayjs().endOf('month').format('YYYY-MM-DD'))
    setHistoryPhotoTargetId(null)
    setEmployeeFormSaving(false)
    setEmployeeFormMessage('')
  }

  const saveEmployeeDetails = async () => {
    if (!selectedHistoryEmployee) {
      return
    }

    const hourlyRate = Number(employeeEditForm.hourlyRateEur)
    const annualLeaveEntitlement = Number(employeeEditForm.annualLeaveEntitlement)
    const annualLeaveRemaining = Number(employeeEditForm.annualLeaveRemaining)

    setEmployeeFormSaving(true)
    setEmployeeFormMessage('Duke ruajtur ndryshimet...')

    try {
      await updateEmployee(selectedHistoryEmployee.id, {
        employeeNumber: employeeEditForm.employeeNumber,
        firstName: employeeEditForm.firstName,
        lastName: employeeEditForm.lastName,
        email: employeeEditForm.email,
        birthDate: employeeEditForm.birthDate,
        country: employeeEditForm.country,
        personalId: employeeEditForm.personalId,
        address: employeeEditForm.address,
        municipality: employeeEditForm.municipality,
        tel: employeeEditForm.tel,
        maritalStatus: employeeEditForm.maritalStatus,
        education: employeeEditForm.education,
        position: employeeEditForm.position,
        emergencyContact: employeeEditForm.emergencyContact,
        familyConnection: employeeEditForm.familyConnection,
        hireDate: employeeEditForm.hireDate,
        hourlyRateEur: Number.isFinite(hourlyRate) ? hourlyRate : 0,
        role: employeeEditForm.role,
        branchName: employeeEditForm.branchName,
        annualLeaveEntitlement: Number.isFinite(annualLeaveEntitlement) ? annualLeaveEntitlement : 20,
        annualLeaveRemaining: Number.isFinite(annualLeaveRemaining) ? annualLeaveRemaining : 20,
      })
      setEmployeeFormMessage('Te dhenat u ruajten me sukses.')
    } catch {
      setEmployeeFormMessage('Ruajtja deshtoi. Ju lutem provoni perseri.')
    } finally {
      setEmployeeFormSaving(false)
      window.setTimeout(() => setEmployeeFormMessage(''), 2500)
    }
  }

  const refreshEmployeeSelfServiceData = async () => {
    if (!token || role !== UserRole.EMPLOYEE) {
      return
    }

    const [profileResponse, attendanceResponse, myLeavesResponse, leaveTypesResponse] = await Promise.all([
      api.get('/employees/me'),
      api.get('/attendance/me'),
      api.get('/leaves/requests/me'),
      api.get('/leaves/types'),
    ])

    setSelfProfile(profileResponse.data)
    setSelfAttendance(attendanceResponse.data)
    setSelfLeaveRequests(myLeavesResponse.data)
    setLeaveTypeOptions(leaveTypesResponse.data)
    setLeaveForm((prev) => ({
      ...prev,
      employeeId: profileResponse.data?.id ?? prev.employeeId,
      leaveTypeId: leaveTypesResponse.data?.[0]?.id ?? prev.leaveTypeId,
      reason: prev.reason,
    }))
  }

  const submitEmployeeLeaveRequest = async () => {
    if (!selfProfile?.id) {
      setLeaveSubmitMessage({ kind: 'error', text: 'Profili i punonjesit nuk u gjet.' })
      return
    }

    if (!leaveForm.leaveTypeId) {
      setLeaveSubmitMessage({ kind: 'error', text: 'Zgjidhni llojin e pushimit para dergimit.' })
      return
    }

    try {
      setLeaveSubmitting(true)
      setLeaveSubmitMessage({ kind: 'info', text: 'Duke derguar kerkesen...' })
      await api.post('/leaves/requests', {
        employeeId: selfProfile.id,
        leaveTypeId: leaveForm.leaveTypeId,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason,
      })
      await refreshEmployeeSelfServiceData()
      setLeaveForm((prev) => ({
        ...prev,
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        reason: '',
      }))
      setLeaveSubmitMessage({ kind: 'success', text: 'Kerkesa per pushim u dergua me sukses.' })
    } catch {
      setLeaveSubmitMessage({ kind: 'error', text: 'Kerkesa per pushim deshtoi.' })
    } finally {
      setLeaveSubmitting(false)
      window.setTimeout(() => setLeaveSubmitMessage(null), 3000)
    }
  }

  const selectedEmployee = useMemo(
    () => employees.find((entry) => entry.id === employeeId),
    [employees, employeeId],
  )

  const rangedHistoryEntries = useMemo(() => {
    const fromDate = dayjs(historyFromDate).startOf('day')
    const toDate = dayjs(historyToDate).endOf('day')

    if (!fromDate.isValid() || !toDate.isValid()) {
      return [] as PunchHistoryEntry[]
    }

    return selectedHistoryEntries.filter((entry) => {
      const punchedAt = dayjs(entry.punchedAt)
      return punchedAt.isAfter(fromDate.subtract(1, 'second')) && punchedAt.isBefore(toDate.add(1, 'second'))
    })
  }, [selectedHistoryEntries, historyFromDate, historyToDate])

  const filteredRangeHistoryEntries = useMemo(() => {
    if (historyFilter === 'all') {
      return rangedHistoryEntries
    }

    return rangedHistoryEntries.filter((entry) => entry.type === historyFilter)
  }, [rangedHistoryEntries, historyFilter])

  const calculateSummaryFromEntries = (entries: PunchHistoryEntry[]) => {
    const sortedEntries = [...entries].sort((left, right) => dayjs(left.punchedAt).valueOf() - dayjs(right.punchedAt).valueOf())

    let checkInCount = 0
    let checkOutCount = 0
    let breakStartCount = 0
    let breakEndCount = 0
    let workedMinutes = 0
    let breakMinutes = 0
    let activeWorkStart: dayjs.Dayjs | null = null
    let activeBreakStart: dayjs.Dayjs | null = null

    sortedEntries.forEach((entry) => {
      const punchedAt = dayjs(entry.punchedAt)

      if (entry.type === 'check_in') {
        checkInCount += 1
        activeWorkStart = punchedAt
        activeBreakStart = null
        return
      }

      if (entry.type === 'check_out') {
        checkOutCount += 1
        if (activeWorkStart) {
          workedMinutes += Math.max(0, punchedAt.diff(activeWorkStart, 'minute'))
          activeWorkStart = null
        }
        activeBreakStart = null
        return
      }

      if (entry.type === 'break_start') {
        breakStartCount += 1
        if (activeWorkStart) {
          workedMinutes += Math.max(0, punchedAt.diff(activeWorkStart, 'minute'))
          activeWorkStart = null
        }
        activeBreakStart = punchedAt
        return
      }

      breakEndCount += 1
      if (activeBreakStart) {
        breakMinutes += Math.max(0, punchedAt.diff(activeBreakStart, 'minute'))
      }
      activeBreakStart = null
      activeWorkStart = punchedAt
    })

    return {
      checkInCount,
      checkOutCount,
      breakStartCount,
      breakEndCount,
      workedMinutes,
      breakMinutes,
      totalClicks: entries.length,
    }
  }

  const currentRangeHistorySummary = useMemo(() => calculateSummaryFromEntries(rangedHistoryEntries), [rangedHistoryEntries])

  const dailyHistorySummary = useMemo(() => {
    const grouped = new Map<string, PunchHistoryEntry[]>()
    rangedHistoryEntries.forEach((entry) => {
      const key = dayjs(entry.punchedAt).format('YYYY-MM-DD')
      const bucket = grouped.get(key) ?? []
      bucket.push(entry)
      grouped.set(key, bucket)
    })

    return Array.from(grouped.entries())
      .sort(([left], [right]) => dayjs(right).valueOf() - dayjs(left).valueOf())
      .map(([date, entries]) => ({
        date,
        ...calculateSummaryFromEntries(entries),
      }))
  }, [rangedHistoryEntries])

  const exportSelectedEmployeeHistoryCsv = () => {
    if (!selectedHistoryEmployee) {
      return
    }

    const header = ['Punonjesi', 'Tipi', 'Koha', 'Burimi', 'Ka Foto']
    const rows = filteredRangeHistoryEntries.map((entry) => [
      selectedHistoryEmployee.name,
      trPunchType(entry.type),
      formatDateTimeDisplay(entry.punchedAt),
      entry.source ?? 'web',
      entry.photoDataUrl || entry.photoUrl ? 'Po' : 'Jo',
    ])

    const csv = [header, ...rows]
      .map((row) => row.map((item) => `"${String(item).replaceAll('"', '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `klikimet-${selectedHistoryEmployee.name.replaceAll(' ', '-').toLowerCase()}-${historyFromDate}-${historyToDate}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const exportSelectedEmployeeHistoryPdf = () => {
    if (!selectedHistoryEmployee) {
      return
    }

    const reportWindow = window.open('', '_blank', 'width=900,height=1200')
    if (!reportWindow) {
      setEmployeeFormMessage('Dritarja e PDF u bllokua nga shfletuesi.')
      window.setTimeout(() => setEmployeeFormMessage(''), 2500)
      return
    }

    const rows = filteredRangeHistoryEntries
      .map(
        (entry, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${trPunchType(entry.type)}</td>
            <td>${formatDateTimeDisplay(entry.punchedAt)}</td>
            <td>${entry.source ?? 'web'}</td>
            <td>${entry.photoDataUrl || entry.photoUrl ? 'Po' : 'Jo'}</td>
          </tr>
        `,
      )
      .join('')

    reportWindow.document.write(`
      <html>
        <head>
          <title>Raporti i klikimeve</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin-bottom: 8px; }
            p { margin: 4px 0; }
            .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Raporti i klikimeve</h1>
          <p><strong>Punonjesi:</strong> ${selectedHistoryEmployee.name}</p>
          <p><strong>Intervali:</strong> ${formatDateDisplay(historyFromDate)} deri ${formatDateDisplay(historyToDate)}</p>
          <p><strong>Filtri:</strong> ${historyFilter === 'all' ? 'Te gjitha' : trPunchType(historyFilter)}</p>
          <div class="summary">
            <div class="card"><strong>Hyrje</strong><br/>${currentRangeHistorySummary.checkInCount}</div>
            <div class="card"><strong>Dalje</strong><br/>${currentRangeHistorySummary.checkOutCount}</div>
            <div class="card"><strong>Totali klikimeve</strong><br/>${filteredRangeHistoryEntries.length}</div>
            <div class="card"><strong>Fillo pauzen</strong><br/>${currentRangeHistorySummary.breakStartCount}</div>
            <div class="card"><strong>Mbaro pauzen</strong><br/>${currentRangeHistorySummary.breakEndCount}</div>
            <div class="card"><strong>Ore pune</strong><br/>${Math.floor(currentRangeHistorySummary.workedMinutes / 60)}h ${currentRangeHistorySummary.workedMinutes % 60}m</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Tipi</th>
                <th>Koha</th>
                <th>Burimi</th>
                <th>Ka Foto</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `)
    reportWindow.document.close()
    reportWindow.focus()
    reportWindow.print()
  }

  const refreshSelectedEmployeeHistory = async () => {
    if (!selectedHistoryEmployee) {
      return
    }

    const response = await api.get('/punches/history', {
      params: { employeeId: selectedHistoryEmployee.id },
    })
    setSelectedHistoryEntries(response.data as PunchHistoryEntry[])
  }

  const triggerHistoryPhotoUpload = (entryId: string) => {
    setHistoryPhotoTargetId(entryId)
    historyPhotoInputRef.current?.click()
  }

  const handleHistoryPhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !historyPhotoTargetId) {
      return
    }

    try {
      const base64 = await optimizeImageForUpload(file)
      await api.patch(`/punches/${historyPhotoTargetId}/photo`, { photoBase64: base64 })
      await refreshSelectedEmployeeHistory()
      setEmployeeFormMessage('Foto e klikimit u perditesua me sukses.')
    } catch {
      setEmployeeFormMessage('Perditesimi i fotos deshtoi.')
    } finally {
      event.target.value = ''
      setHistoryPhotoTargetId(null)
      window.setTimeout(() => setEmployeeFormMessage(''), 2500)
    }
  }

  const removeHistoryPhoto = async (entryId: string) => {
    try {
      await api.delete(`/punches/${entryId}/photo`)
      await refreshSelectedEmployeeHistory()
      setEmployeeFormMessage('Foto e klikimit u fshi me sukses.')
    } catch {
      setEmployeeFormMessage('Fshirja e fotos deshtoi.')
    } finally {
      window.setTimeout(() => setEmployeeFormMessage(''), 2500)
    }
  }

  const absenceCount = useMemo(
    () => attendance.filter((entry) => entry.status === 'absent').length,
    [attendance],
  )

  const presentEmployees = useMemo(() => {
    const todayLocal = dayjs().format('YYYY-MM-DD')
    const todayUtc = new Date().toISOString().slice(0, 10)
    const presentIds = new Set(
      attendance
        .filter((entry) => {
          const entryDate = String(entry.date).slice(0, 10)
          const isToday = entryDate === todayLocal || entryDate === todayUtc
          return isToday && (entry.status === 'present' || entry.status === 'late')
        })
        .map((entry) => entry.employeeId),
    )

    return employees
      .filter((entry) => presentIds.has(entry.id))
      .map((entry) => ({
        id: entry.id,
        name: `${entry.firstName} ${entry.lastName}`.trim(),
        firstName: entry.firstName,
        lastName: entry.lastName,
      }))
  }, [attendance, employees])

  const calendarDays = useMemo(() => {
    const monthStart = calendarMonth.startOf('month')
    const gridStart = monthStart.startOf('week')
    return Array.from({ length: 42 }, (_, index) => gridStart.add(index, 'day'))
  }, [calendarMonth])

  const calendarEventsByDate = useMemo(() => {
    const events: Record<string, string[]> = {}

    const pushEvent = (date: string, label: string) => {
      if (!events[date]) {
        events[date] = []
      }
      if (!events[date].includes(label)) {
        events[date].push(label)
      }
    }

    employees.forEach((entry) => {
      const birthDate = (entry as { birthDate?: string }).birthDate
      if (!birthDate) {
        return
      }

      const parsed = dayjs(birthDate)
      if (!parsed.isValid()) {
        return
      }

      const eventDate = dayjs(`${calendarMonth.year()}-${parsed.format('MM-DD')}`).format('YYYY-MM-DD')
      pushEvent(eventDate, `Datelindja: ${entry.firstName} ${entry.lastName}`)
    })

    leaveRequests
      .filter((entry) => entry.status !== 'rejected')
      .forEach((entry) => {
        const start = dayjs(entry.startDate)
        const end = dayjs(entry.endDate)
        if (!start.isValid() || !end.isValid()) {
          return
        }

        const employee = employees.find((employeeEntry) => employeeEntry.id === entry.employeeId)
        const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : entry.employeeId

        let cursor = start.startOf('day')
        const endDay = end.startOf('day')
        while (cursor.isBefore(endDay) || cursor.isSame(endDay, 'day')) {
          pushEvent(cursor.format('YYYY-MM-DD'), `Pushim: ${employeeName}`)
          cursor = cursor.add(1, 'day')
        }
      })

    const holidayYears = [calendarMonth.year() - 1, calendarMonth.year(), calendarMonth.year() + 1]
    holidayYears.forEach((year) => {
      buildKosovoHolidayDates(year).forEach((holiday) => {
        pushEvent(holiday.date, `Feste zyrtare: ${holiday.name}`)
      })
    })

    return events
  }, [employees, leaveRequests, calendarMonth])

  const selectedCalendarEvents = selectedCalendarDate ? calendarEventsByDate[selectedCalendarDate] ?? [] : []

  const menuItems = [
    { key: 'frontpage', label: 'Ballina', show: true },
    { key: 'register', label: 'Regjistro perdorues', show: canAdminUsers },
    { key: 'users', label: 'Te gjithe perdoruesit', show: canAdminUsers },
    { key: 'attendance', label: 'Prezenca', show: canManageOps || canEmployeeSelfService },
    { key: 'leaves', label: 'Pushimet', show: canManageOps || canEmployeeSelfService },
    { key: 'payroll', label: 'Pagat / Eksport', show: canAdminUsers },
  ] as const

  const adminMenuGroups: AdminMenuGroup[] = [
    {
      title: 'Dashboard',
      items: ['Dashboard'],
    },
    {
      title: 'Employee',
      items: ['Register Employees', 'Te gjithe punonjesit', 'Click-in', 'Register Contracts', 'Employee files', 'Employee status'],
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
      items: ['Kerkesat per pushim', 'Request for vacation', 'Recording hours for vacation', 'Holiday status', 'Holiday calendar'],
    },
    {
      title: 'Click-in / Click-out',
      items: ['Click-in/out recording', 'Open entries/exits', 'List of clicks-in/out', 'Employees present'],
    },
    {
      title: 'HR Definitions',
      items: [
        'Lloji i shkollimit',
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
    Dashboard: 'frontpage',
    'Register Employees': 'register',
    'Te gjithe punonjesit': 'users',
    'Click-in': 'frontpage',
    'Register Contracts': 'users',
    'Employee files': 'users',
    'Lloji i shkollimit': 'users',
    'Employee status': 'users',
    'Salary Determination': 'payroll',
    'Salary period': 'payroll',
    'Registration of additional days/hours': 'payroll',
    'Additional Income Registration': 'payroll',
    'Salary Calculation': 'payroll',
    'Payroll List': 'payroll',
    'E - Declaration (EDI)': 'payroll',
    'Request for vacation': 'leaves',
    'Kerkesat per pushim': 'leaves',
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

  const handleNotificationClick = async (entry: InAppNotification) => {
    try {
      await api.patch(`/notifications/${entry.id}/read`)
      setNotifications((prev) => prev.map((item) => (item.id === entry.id ? { ...item, status: 'read' } : item)))
    } catch {
      // no-op: keep navigation working even if mark-as-read fails
    }

    setShowNotificationsPanel(false)

    const actionPath = String(entry.actionPath ?? '')
    if (actionPath.includes('/dashboard/leaves/requests') && canManageOps) {
      setMenu('leaves')
      setActiveAdminMenuItem('Kerkesat per pushim')
      setLeaveRequestStatusFilter('pending')
      return
    }

    if (actionPath.includes('/dashboard/leaves')) {
      setMenu('leaves')
      if (canManageOps) {
        setActiveAdminMenuItem('Request for vacation')
      }
      return
    }

    if (canManageOps) {
      setMenu('leaves')
      setActiveAdminMenuItem('Kerkesat per pushim')
    }
  }

  const activeAdminGroup = adminMenuGroups.find((group) => group.items.includes(activeAdminMenuItem))?.title ?? ''
  const visibleAdminGroup = pinnedAdminGroup
  const activeSubcategoryFields = adminSubcategoryFieldMap[activeAdminMenuItem] ?? []
  const unreadNotifications = notifications.filter((entry) => entry.status !== 'read')
  const visibleAdminLeaveRequests = leaveRequests.filter((entry) =>
    leaveRequestStatusFilter === 'all' ? true : entry.status === leaveRequestStatusFilter,
  )

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
          setMunicipalities(Array.from(new Set([...QYTETET_E_KOSOVES, ...cityList])))
          setRegisterForm((prev) => ({ ...prev, municipality: city }))
        }
      }

      setSubcategoryMessage(`Draft u ruajt per ${trLabel(activeAdminMenuItem)}.`)
    } catch {
      setSubcategoryMessage(`Ruajtja deshtoi per ${trLabel(activeAdminMenuItem)}. Provo perseri.`)
    }

    window.setTimeout(() => setSubcategoryMessage(''), 2500)
  }

  const leaveReviewer = isSuperAdmin ? 'hr' : role === UserRole.HR_ADMIN ? 'hr' : 'manager'

  const exportPayrollCsv = () => {
    const header = ['Punonjesi', 'Numri i punonjesit', 'Ore', 'Shuma bruto', 'Valuta', 'Llogaritur ne']
    const rows = payrollRecords.map((entry) => [
      `${entry.employee?.firstName ?? ''} ${entry.employee?.lastName ?? ''}`.trim(),
      entry.employee?.employeeNumber ?? '',
      entry.totalHours,
      entry.grossAmount,
      entry.currency,
      formatDateTimeDisplay(entry.calculatedAt),
    ])
    const csv = [header, ...rows].map((row) => row.map((item) => `"${String(item).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `regjistrat-e-pagave-${dayjs().format('YYYYMMDD-HHmm')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const triggerPublicAction = (employee: PublicEmployee, action: 'check_in' | 'break_start' | 'break_end' | 'check_out') => {
    if (publicLoading) {
      return
    }

    setSelectedPublicEmployeeId(employee.id)
    setSelectedPublicActionEmployee(employee)
    setPendingPublicAction(action)

    if (action === 'check_in') {
      cameraInputRef.current?.click()
      return
    }

    void submitPublicAction(action)
  }

  const submitPublicAction = async (action: 'check_in' | 'break_start' | 'break_end' | 'check_out', photoBase64Value?: string) => {
    if (!selectedPublicEmployeeId) {
      return
    }

    try {
      setPublicLoading(true)
      setPublicToast({ kind: 'info', message: 'Duke regjistruar veprimin...' })
      await api.post('/public/work-action', {
        employeeId: selectedPublicEmployeeId,
        action,
        photoBase64: photoBase64Value,
      })

      const selected = publicEmployees.find((entry) => entry.id === selectedPublicEmployeeId)
      const actionLabel = trPunchType(action)
      setPublicToast({
        kind: 'success',
        message: `${actionLabel} u regjistrua me sukses per ${selected?.firstName ?? ''} ${selected?.lastName ?? ''}`.trim(),
      })

      if (selectedPublicBranch) {
        const response = await api.get(`/public/branches/${selectedPublicBranch}/employees`)
        setPublicEmployees(response.data)
      }
    } catch (error) {
      const backendMessage = axios.isAxiosError(error)
        ? String(error.response?.data?.message ?? '').trim()
        : ''
      setPublicToast({
        kind: 'error',
        message: backendMessage || 'Veprimi deshtoi. Ju lutem provoni perseri.',
      })
    } finally {
      setPublicLoading(false)
      setSelectedPublicEmployeeId('')
      setSelectedPublicActionEmployee(null)
      setPendingPublicAction(null)
    }
  }

  const optimizeImageForUpload = async (file: File): Promise<string> => {
    const readAsDataUrl =
      (target: Blob) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ''))
        reader.onerror = () => reject(new Error('Leximi i fotos deshtoi.'))
        reader.readAsDataURL(target)
      })

    const toBase64 = (dataUrl: string) => {
      return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
    }

    const originalDataUrl = await readAsDataUrl(file)
    if (file.size <= 900 * 1024) {
      return toBase64(originalDataUrl)
    }

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Ngarkimi i fotos deshtoi.'))
      img.src = originalDataUrl
    })

    const maxSide = 1400
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))

    const context = canvas.getContext('2d')
    if (!context) {
      return toBase64(originalDataUrl)
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.78)
    return toBase64(compressedDataUrl)
  }

  const handlePublicPhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedPublicEmployeeId || pendingPublicAction !== 'check_in') {
      return
    }

    try {
      const base64 = await optimizeImageForUpload(file)
      await submitPublicAction('check_in', base64)
    } catch {
      setPublicToast({ kind: 'error', message: 'Hyrja deshtoi. Ju lutem provoni perseri.' })
    } finally {
      event.target.value = ''
    }
  }

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = String(reader.result ?? '')
        resolve(dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl)
      }
      reader.onerror = () => reject(new Error('Leximi i dokumentit deshtoi.'))
      reader.readAsDataURL(file)
    })

  const downloadSignedLeaveDocument = async (requestId: string) => {
    try {
      const response = await api.get(`/leaves/requests/${requestId}/signed-document`)
      const payload = response.data as { fileName?: string; mimeType?: string; base64Data?: string }
      if (!payload?.base64Data) {
        throw new Error('Dokumenti mungon')
      }

      const contentType = payload.mimeType || 'application/pdf'
      const byteCharacters = atob(payload.base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let index = 0; index < byteCharacters.length; index += 1) {
        byteNumbers[index] = byteCharacters.charCodeAt(index)
      }

      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: contentType })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = payload.fileName || `dokumenti-pushimit-${requestId}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch {
      const message = 'Shkarkimi i dokumentit deshtoi.'
      if (canManageOps) {
        setLeaveAdminMessage({ kind: 'error', text: message })
        window.setTimeout(() => setLeaveAdminMessage(null), 3000)
      } else {
        setLeaveSubmitMessage({ kind: 'error', text: message })
        window.setTimeout(() => setLeaveSubmitMessage(null), 3000)
      }
    }
  }

  const printLeaveRequestPdf = (entry: {
    id: string
    employeeId: string
    status: string
    startDate: string
    endDate: string
    totalDays?: number
    reason?: string
    leaveType?: { name?: string }
    employee?: { firstName?: string; lastName?: string }
  }) => {
    const reportWindow = window.open('', '_blank', 'width=900,height=1200')
    if (!reportWindow) {
      setLeaveAdminMessage({ kind: 'error', text: 'Dritarja e printimit u bllokua nga shfletuesi.' })
      window.setTimeout(() => setLeaveAdminMessage(null), 3000)
      return
    }

    const employeeName = (entry.employee?.firstName || entry.employee?.lastName)
      ? `${entry.employee?.firstName ?? ''} ${entry.employee?.lastName ?? ''}`.trim()
      : entry.employeeId

    reportWindow.document.write(`
      <html>
        <head>
          <title>Kerkese Pushimi</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin: 0 0 16px; }
            .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
            .row { margin-bottom: 10px; }
            .label { font-weight: 700; }
            .signature { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .line { margin-top: 28px; border-top: 1px solid #64748b; padding-top: 8px; font-size: 12px; color: #334155; }
          </style>
        </head>
        <body>
          <h1>Kerkese per pushim</h1>
          <div class="card">
            <div class="row"><span class="label">Punetori:</span> ${employeeName}</div>
            <div class="row"><span class="label">Lloji i pushimit:</span> ${entry.leaveType?.name ?? 'Pushim'}</div>
            <div class="row"><span class="label">Periudha:</span> ${formatDateDisplay(entry.startDate)} - ${formatDateDisplay(entry.endDate)}</div>
            <div class="row"><span class="label">Dite:</span> ${entry.totalDays ?? '-'}</div>
            <div class="row"><span class="label">Statusi:</span> ${trLeaveStatus(entry.status)}</div>
            <div class="row"><span class="label">Arsyeja:</span> ${entry.reason ?? '-'}</div>
            <div class="row"><span class="label">Data e printimit:</span> ${formatDateTimeDisplay(new Date().toISOString())}</div>
          </div>
          <div class="signature">
            <div class="line">Nenshkrimi i punetorit</div>
            <div class="line">Nenshkrimi i administratorit</div>
          </div>
        </body>
      </html>
    `)
    reportWindow.document.close()
    reportWindow.focus()
    reportWindow.print()
  }

  const uploadSignedLeaveDocument = async (requestId: string, file: File) => {
    try {
      setSignedDocumentUploadingId(requestId)
      setLeaveAdminMessage({ kind: 'info', text: 'Duke ngarkuar dokumentin e nenshkruar...' })

      const base64Data = await readFileAsBase64(file)
      await api.post(`/leaves/requests/${requestId}/signed-document`, {
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        base64Data,
      })

      await loadLeaves()
      setLeaveAdminMessage({ kind: 'success', text: 'Dokumenti u ngarkua dhe iu dergua punetorit.' })
    } catch {
      setLeaveAdminMessage({ kind: 'error', text: 'Ngarkimi i dokumentit deshtoi.' })
    } finally {
      setSignedDocumentUploadingId(null)
      window.setTimeout(() => setLeaveAdminMessage(null), 3000)
    }
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
                KYCU
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${selectedPublicBranch === 'Prishtina' ? 'bg-amber-900 text-amber-50' : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-100'}`}
                onClick={() => {
                  setSelectedPublicBranch('Prishtina')
                  setSelectedPublicActionEmployee(null)
                }}
              >
                Prishtina
              </button>
            </div>

            {selectedPublicBranch && (
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {publicEmployees.map((entry) => (
                  <button
                    key={entry.id}
                    className={`rounded-xl border px-4 py-3 text-left font-medium transition ${selectedPublicActionEmployee?.id === entry.id ? 'border-amber-900 bg-amber-50 text-slate-900' : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100'} disabled:cursor-not-allowed disabled:opacity-60`}
                    onClick={() => setSelectedPublicActionEmployee(entry)}
                    disabled={publicLoading}
                  >
                    <div>{entry.firstName} {entry.lastName}</div>
                    <div className="mt-1 text-xs text-slate-500">{entry.workState === 'working' ? 'Duke punuar' : entry.workState === 'on_break' ? 'Ne pauze' : entry.workState === 'finished' ? 'Ka mbaruar punen (mund te rifilloje)' : 'Gati per fillim'}</div>
                  </button>
                ))}
              </div>
            )}

            {selectedPublicActionEmployee && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="text-sm font-semibold text-amber-900">{selectedPublicActionEmployee.firstName} {selectedPublicActionEmployee.lastName}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(selectedPublicActionEmployee.workState === 'ready_to_start' || selectedPublicActionEmployee.workState === 'finished') && (
                    <button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm text-white" onClick={() => triggerPublicAction(selectedPublicActionEmployee, 'check_in')}>
                      Fillo punen
                    </button>
                  )}
                  {selectedPublicActionEmployee.workState === 'working' && (
                    <>
                      <button className="rounded-xl bg-amber-700 px-4 py-2 text-sm text-white" onClick={() => triggerPublicAction(selectedPublicActionEmployee, 'break_start')}>
                        Fillo pauzen
                      </button>
                      <button className="rounded-xl bg-rose-700 px-4 py-2 text-sm text-white" onClick={() => triggerPublicAction(selectedPublicActionEmployee, 'check_out')}>
                        Mbaro punen
                      </button>
                    </>
                  )}
                  {selectedPublicActionEmployee.workState === 'on_break' && (
                    <button className="rounded-xl bg-sky-700 px-4 py-2 text-sm text-white" onClick={() => triggerPublicAction(selectedPublicActionEmployee, 'break_end')}>
                      Mbaro pauzen
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePublicPhotoSelected}
          />

          {publicLoading && <p className="mt-3 text-sm text-slate-700">Duke procesuar veprimin...</p>}
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
                  <h2 className="font-serif text-2xl">Kycu</h2>
                  <button className="rounded-md border border-slate-300 px-2 py-1 text-sm" onClick={() => setShowLoginModal(false)}>
                    Mbyll
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
                    placeholder="Fjalekalimi"
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
                  {loading ? 'Duke u kycur...' : 'Kycu'}
                </button>

                <button
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2"
                  onClick={() => {
                    setLoginForm(userSeed)
                  }}
                >
                  Mbush te dhenat Demo SuperAdmin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fff4e2_0%,#ffe9d2_28%,#f5efe8_60%,#eef4e9_100%)] p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-2xl border border-amber-100/70 bg-white/75 p-6 shadow-xl shadow-amber-100/60 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight">Liana Paneli i Punes</h1>
              <p className="text-sm text-slate-600">{formatDateTimeDisplay(clock.toDate())}</p>
            </div>
            <div className="rounded-xl bg-amber-900 px-4 py-2 text-sm text-amber-50">
              I kycur: {user?.email} ({roleLabel})
            </div>
            <div className="relative">
              <button
                type="button"
                className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-900"
                onClick={() => {
                  setShowNotificationsPanel((prev) => {
                    const next = !prev
                    if (next) {
                      void api
                        .get('/notifications/me')
                        .then((response) => setNotifications(response.data as InAppNotification[]))
                        .catch(() => setNotifications([]))
                    }
                    return next
                  })
                }}
              >
                Njoftimet ({unreadNotifications.length})
              </button>
              {showNotificationsPanel && (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-amber-100 bg-white p-2 shadow-xl">
                  {notifications.length > 0 ? (
                    <ul className="max-h-80 space-y-2 overflow-auto">
                      {notifications.slice(0, 20).map((entry) => (
                        <li key={entry.id}>
                          <button
                            type="button"
                            className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${entry.status === 'read' ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
                            onClick={() => void handleNotificationClick(entry)}
                          >
                            <div className="font-medium">{entry.subject || 'Njoftim'}</div>
                            <div className="mt-1 text-xs">{entry.body}</div>
                            <div className="mt-1 text-[11px] text-slate-500">{formatDateTimeDisplay(entry.createdAt)}</div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
                      Nuk ka njoftime.
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              className="rounded-xl bg-rose-700 px-4 py-2 text-sm text-white shadow-md shadow-rose-200"
              onClick={logout}
            >
              Dil
            </button>
          </div>
        </header>

        {canAdminUsers ? (
          <section className="rounded-2xl border border-amber-100/80 bg-white/85 p-5 shadow-lg shadow-amber-100/70">
            <h2 className="font-serif text-2xl">Menuja e panelit</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {adminMenuGroups.map((group) => {
                const isOpen = visibleAdminGroup === group.title
                return (
                  <div
                    key={group.title}
                    className="relative"
                  >
                    <button
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                        isOpen
                          ? 'border-amber-900 bg-amber-900 text-amber-50'
                          : 'border-amber-200 bg-amber-50/80 text-slate-900 hover:bg-amber-100'
                      }`}
                      onClick={() => setPinnedAdminGroup((prev) => (prev === group.title ? null : group.title))}
                    >
                      {trLabel(group.title)}
                    </button>

                    {isOpen && (
                      <div className="absolute left-0 top-full z-40 mt-2 w-72 rounded-xl border border-amber-100 bg-white p-2 shadow-2xl">
                        <div className="space-y-1">
                          {group.items.map((item) => (
                            <button
                              key={item}
                              className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                                activeAdminMenuItem === item
                                  ? 'border-amber-900 bg-amber-900 text-amber-50'
                                  : 'border-amber-100 bg-amber-50/60 text-slate-900 hover:bg-amber-100'
                              }`}
                              onClick={() => onAdminMenuClick(item)}
                            >
                              {trLabel(item)}
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
              Kliko mbi kategorine per ta hapur dhe zgjedh modulin qe deshiron.
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
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Moduli aktual</p>
            <h2 className="mt-1 font-serif text-2xl text-slate-900">{trLabel(activeAdminMenuItem)}</h2>
            <p className="mt-1 text-sm text-slate-600">Kategoria: {trLabel(activeAdminGroup)}</p>
          </section>
        )}

        {canAdminUsers && menu === 'frontpage' && activeAdminMenuItem === 'Dashboard' && (
          <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <article className="rounded-2xl border border-amber-100 bg-[linear-gradient(135deg,#fff9f2_0%,#fff2e2_100%)] p-5 shadow-lg shadow-amber-100/70">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="font-serif text-2xl text-amber-900">Dashboard i stafit</h2>
              </div>
              <p className="mt-1 text-sm text-slate-700">Punonjesit prezent sot dhe ngjarjet kryesore te muajit.</p>

              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-900">Punonjes prezent sot</h3>
                {presentEmployees.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {presentEmployees.map((employee) => (
                      <li key={employee.id}>
                        <button
                          type="button"
                          className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-left text-sm text-emerald-900 transition hover:bg-emerald-100"
                          onClick={() => void openEmployeeHistory(employee)}
                        >
                          {employee.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-lg border border-dashed border-emerald-300 bg-white px-3 py-2 text-sm text-emerald-700">
                    Nuk ka punonjes te shenuar si prezent per sot.
                  </p>
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-orange-100 bg-white/90 p-5 shadow-lg shadow-orange-100/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif text-2xl text-slate-900">Kalendari i ngjarjeve</h2>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                    onClick={() => setCalendarMonth((prev) => prev.subtract(1, 'month'))}
                  >
                    Muaji para
                  </button>
                  <div className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white">
                    {calendarMonth.format('MMMM YYYY')}
                  </div>
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                    onClick={() => setCalendarMonth((prev) => prev.add(1, 'month'))}
                  >
                    Muaji pas
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                {['Die', 'Hen', 'Mar', 'Mer', 'Enj', 'Pre', 'Sht'].map((dayLabel) => (
                  <div key={dayLabel}>{dayLabel}</div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                  const iso = day.format('YYYY-MM-DD')
                  const events = calendarEventsByDate[iso] ?? []
                  const isCurrentMonth = day.isSame(calendarMonth, 'month')
                  const isToday = day.isSame(dayjs(), 'day')

                  return (
                    <button
                      type="button"
                      key={iso}
                      onClick={() => setSelectedCalendarDate(iso)}
                      className={`min-h-28 rounded-xl border p-2 ${
                        isCurrentMonth
                          ? 'border-slate-200 bg-white'
                          : 'border-slate-100 bg-slate-50 text-slate-400'
                      } ${isToday ? 'ring-2 ring-amber-300' : ''} text-left transition hover:-translate-y-0.5 hover:shadow-md`}
                    >
                      <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                        <span>{day.format('DD')}</span>
                        {events.length > 0 && (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-900">
                            {events.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {events.slice(0, 3).map((eventLabel) => (
                          <div key={eventLabel} className="truncate rounded-md bg-amber-50 px-1.5 py-1 text-[10px] text-amber-900">
                            {eventLabel}
                          </div>
                        ))}
                        {events.length > 3 && (
                          <div className="text-[10px] font-medium text-slate-500">+{events.length - 3} me shume</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-orange-200 bg-orange-50/70 px-4 py-3 text-sm text-slate-700">
                Kliko mbi nje dite ne kalendar per te pare te gjitha ngjarjet e asaj date.
              </div>
            </article>
          </section>
        )}

        {selectedCalendarDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4" onClick={() => setSelectedCalendarDate(null)}>
            <div
              className="w-full max-w-2xl rounded-3xl border border-amber-100 bg-[linear-gradient(180deg,#fffaf4_0%,#fff3e4_100%)] p-6 shadow-2xl shadow-amber-200/60"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Detajet e dates</p>
                  <h3 className="mt-1 font-serif text-3xl text-slate-900">{formatDateDisplay(selectedCalendarDate)}</h3>
                  <p className="mt-1 text-sm text-slate-600">Ketu shfaqen te gjitha ditelindjet, pushimet dhe festat e kesaj date.</p>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-amber-50"
                  onClick={() => setSelectedCalendarDate(null)}
                >
                  Mbyll
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {selectedCalendarEvents.length > 0 ? (
                  selectedCalendarEvents.map((eventLabel) => (
                    <div key={eventLabel} className="rounded-2xl border border-amber-100 bg-white/90 px-4 py-3 shadow-sm">
                      <div className="text-sm font-medium text-slate-800">{eventLabel}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-amber-200 bg-white/80 px-4 py-6 text-center text-sm text-slate-600">
                    Nuk ka ngjarje te regjistruara per kete date.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {canAdminUsers && activeAdminMenuItem === 'Lloji i shkollimit' && (
          <section className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Llojet e Shkollimit</h2>
            <p className="mt-1 text-sm text-slate-600">
              Kategoritë e arsimimit të përdorura gjatë regjistrimit të punonjësve.
            </p>

            <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Shto lloj të ri, p.sh. Shkolla Fillore"
                value={newEducationType}
                onChange={(event) => setNewEducationType(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addEducationType()
                  }
                }}
              />
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white" onClick={addEducationType}>
                Shto
              </button>
            </div>

            <ul className="mt-4 space-y-2">
              {educationTypes.map((lloji) => (
                <li key={lloji} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
                  {lloji}
                </li>
              ))}
            </ul>

            {subcategoryMessage && <p className="mt-3 text-sm text-emerald-700">{subcategoryMessage}</p>}
          </section>
        )}

        {canAdminUsers && activeAdminMenuItem === 'Marital status' && (
          <section className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Gjendja Martesore</h2>
            <p className="mt-1 text-sm text-slate-600">
              Opsionet e gjendjes martesore te perdorura gjate regjistrimit te punonjesve.
            </p>

            <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Shto opsion te ri, p.sh. i/e ve"
                value={newMaritalStatus}
                onChange={(event) => setNewMaritalStatus(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addMaritalStatus()
                  }
                }}
              />
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white" onClick={addMaritalStatus}>
                Shto
              </button>
            </div>

            <ul className="mt-4 space-y-2">
              {maritalStatuses.map((status) => (
                <li key={status} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
                  {status}
                </li>
              ))}
            </ul>

            {subcategoryMessage && <p className="mt-3 text-sm text-emerald-700">{subcategoryMessage}</p>}
          </section>
        )}

        {canAdminUsers && activeAdminMenuItem === 'Job positions' && (
          <section className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Pozitat e punes</h2>
            <p className="mt-1 text-sm text-slate-600">
              Lista e pozitave aktive ne kompani. Mund te shtoni pozita te reja ne cdo kohe.
            </p>

            <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Shto pozite te re, p.sh. Shites"
                value={newJobPosition}
                onChange={(event) => setNewJobPosition(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addJobPosition()
                  }
                }}
              />
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white" onClick={addJobPosition}>
                Shto
              </button>
            </div>

            <ul className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {jobPositions.map((position) => (
                <li key={position} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
                  {position}
                </li>
              ))}
            </ul>

            {subcategoryMessage && <p className="mt-3 text-sm text-emerald-700">{subcategoryMessage}</p>}
          </section>
        )}

        {canAdminUsers && activeAdminMenuItem !== 'Register Employees' && activeAdminMenuItem !== 'Lloji i shkollimit' && activeAdminMenuItem !== 'Job positions' && activeAdminMenuItem !== 'Marital status' && activeSubcategoryFields.length > 0 && (
          <section className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-2xl">{trLabel(activeAdminMenuItem)} - Formular</h2>
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white" onClick={saveSubcategoryDraft}>
                Ruaj draftin
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Fusha reference te strukturuara sipas rrjedhes se punes se administrimit te HR dhe pagave.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {activeSubcategoryFields.map((fieldName) => (
                <label key={fieldName} className="text-sm">
                  <span className="mb-1 block text-slate-600">{trLabel(fieldName)}</span>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={subcategoryDrafts[activeAdminMenuItem]?.[fieldName] ?? ''}
                    onChange={(event) => updateSubcategoryField(activeAdminMenuItem, fieldName, event.target.value)}
                  />
                </label>
              ))}
            </div>

            <label className="mt-3 block text-sm">
              <span className="mb-1 block text-slate-600">{trLabel('Notes / Legal Reference')}</span>
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
          <MetricCard title="Punonjes" value={String(employees.length)} tone="blue" />
          <MetricCard title="Hyrje/Dalje sot" value={String(punches.length)} tone="amber" />
          <MetricCard title="Rreshta te prezences" value={String(attendance.length)} tone="emerald" />
          <MetricCard title="Mungesa/Alarme" value={String(absenceCount)} tone="rose" />
        </section>

        {menu === 'frontpage' && role !== UserRole.EMPLOYEE && (!canAdminUsers || activeAdminMenuItem !== 'Dashboard') && (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Ballina: Hyrje / Dalje</h2>
            <p className="text-sm text-slate-600">Zgjidh nje perdorues dhe regjistro hyrje ose dalje direkt nga ky panel.</p>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <select
                className="rounded-xl border border-slate-300 px-3 py-2"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
              >
                <option value="">Zgjidh punonjesin</option>
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
                Hyrje
              </button>
              <button
                className="rounded-xl bg-orange-600 px-4 py-2 text-white disabled:opacity-40"
                disabled={!employeeId || loading}
                onClick={() => void createPunch({ employeeId, type: 'check_out', photoBase64 })}
              >
                Dalje
              </button>
            </div>

            <div className="mt-2">
              <label className="text-xs text-slate-600">Kamera / foto deshmi (opsionale)</label>
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
                Perzgjedhja aktive: {selectedEmployee.firstName} {selectedEmployee.lastName}
              </div>
            )}

            <div className="mt-4 max-h-72 space-y-2 overflow-auto">
              {employees.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{entry.firstName} {entry.lastName}</div>
                      <div className="text-xs text-slate-500">{entry.user?.email} • {trRole(entry.user?.role ?? UserRole.EMPLOYEE)}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white" onClick={() => void createPunch({ employeeId: entry.id, type: 'check_in', photoBase64 })}>Hyrje</button>
                      <button className="rounded-lg bg-orange-600 px-3 py-1.5 text-white" onClick={() => void createPunch({ employeeId: entry.id, type: 'check_out', photoBase64 })}>Dalje</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Parashikim i pages (€)</h2>
            <p className="text-sm text-slate-600">0-160h @100%, 161-200h @130%, 201+h @150%</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                className="rounded-xl bg-slate-900 px-4 py-2 text-white"
                onClick={() => void calculatePreview({ totalHours: 172, hourlyRateEur: 7.5 })}
              >
                Shembulli A
              </button>
              <button
                className="rounded-xl bg-slate-900 px-4 py-2 text-white"
                onClick={() => void calculatePreview({ totalHours: 214, hourlyRateEur: 8.25 })}
              >
                Shembulli B
              </button>
            </div>

            {payrollPreview && (
              <div className="mt-4 space-y-1 rounded-xl bg-slate-100 p-4 text-sm">
                <p>Oret e rregullta: {payrollPreview.regularHours}</p>
                <p>Oret shtese: {payrollPreview.overtimeHours}</p>
                <p>Oret premium: {payrollPreview.premiumHours}</p>
                <p className="font-semibold">Bruto: €{payrollPreview.grossAmount.toFixed(2)}</p>
              </div>
            )}
          </article>
        </section>
        )}

        {menu === 'frontpage' && role === UserRole.EMPLOYEE && (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Mire se erdhe</h2>
            <p className="mt-2 text-sm text-slate-600">Nga ky panel mund te shohesh oret e tua te punes dhe te dergosh kerkesa per pushim.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-slate-100 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Punonjesi</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{selfProfile?.firstName} {selfProfile?.lastName}</div>
              </div>
              <div className="rounded-xl bg-slate-100 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Dega</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{selfProfile?.branchName ?? 'Prishtina'}</div>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Bilanci i pushimit</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-emerald-50 p-4 text-emerald-900">
                <div className="text-xs uppercase tracking-wide">Dite te mbetura</div>
                <div className="mt-1 text-3xl font-semibold">{selfProfile?.annualLeaveRemaining ?? 0}</div>
              </div>
              <div className="rounded-xl bg-amber-50 p-4 text-amber-900">
                <div className="text-xs uppercase tracking-wide">Totali vjetor</div>
                <div className="mt-1 text-3xl font-semibold">{selfProfile?.annualLeaveEntitlement ?? 0}</div>
              </div>
            </div>
          </article>
        </section>
        )}

        {menu === 'register' && canAdminUsers && (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg lg:col-span-2">
            <h2 className="font-serif text-2xl">Regjistro Punonjes</h2>
            <p className="text-sm text-slate-600">SuperAdmin / HR mund te regjistroje punonjes dhe te caktoje rolin e qasjes.</p>

            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Emri</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.firstName} onChange={(event) => setRegisterForm((prev) => ({ ...prev, firstName: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Mbiemri</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.lastName} onChange={(event) => setRegisterForm((prev) => ({ ...prev, lastName: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Data e lindjes</span>
                <input type="date" className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.birthDate} onChange={(event) => setRegisterForm((prev) => ({ ...prev, birthDate: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Shteti</span>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={registerForm.country}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, country: event.target.value }))}
                >
                  <option value="">Zgjidh shtetin</option>
                  {SHTETET.map((shteti) => (
                    <option key={shteti} value={shteti}>
                      {shteti}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Numri personal</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.personalId} onChange={(event) => setRegisterForm((prev) => ({ ...prev, personalId: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">ID e punes</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.employeeNumber} onChange={(event) => setRegisterForm((prev) => ({ ...prev, employeeNumber: event.target.value }))} />
              </label>
              <label className="text-sm md:col-span-2 lg:col-span-3">
                <span className="mb-1 block text-slate-600">Adresa</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.address} onChange={(event) => setRegisterForm((prev) => ({ ...prev, address: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Komuna</span>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={registerForm.municipality}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, municipality: event.target.value }))}
                >
                  <option value="">Zgjidh komunen</option>
                  {municipalities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Telefoni</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.tel} onChange={(event) => setRegisterForm((prev) => ({ ...prev, tel: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Email zyrtar</span>
                <input type="email" className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.email} onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Data e punesimit</span>
                <input type="date" className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.hireDate} onChange={(event) => setRegisterForm((prev) => ({ ...prev, hireDate: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Gjendja martesore</span>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={registerForm.maritalStatus}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, maritalStatus: event.target.value }))}
                >
                  <option value="">Zgjidh gjendjen martesore</option>
                  {maritalStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Shkollimi</span>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={registerForm.education}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, education: event.target.value }))}
                >
                  <option value="">Zgjidh llojin e shkollimit</option>
                  {educationTypes.map((lloji) => (
                    <option key={lloji} value={lloji}>{lloji}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Kontakt emergjent</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.emergencyContact} onChange={(event) => setRegisterForm((prev) => ({ ...prev, emergencyContact: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Lidhja familjare</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.familyConnection} onChange={(event) => setRegisterForm((prev) => ({ ...prev, familyConnection: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Pozita</span>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={registerForm.position}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, position: event.target.value }))}
                >
                  <option value="">Zgjidh poziten</option>
                  {jobPositions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Dega</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.branchName} onChange={(event) => setRegisterForm((prev) => ({ ...prev, branchName: event.target.value }))} />
              </label>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Fjalekalimi</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" type="password" value={registerForm.password} onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Cmimi per ore (EUR)</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="p.sh. 7.50" type="number" min={0} step="0.01" value={registerForm.hourlyRateEur} onChange={(event) => setRegisterForm((prev) => ({ ...prev, hourlyRateEur: Number(event.target.value) }))} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Roli</span>
                <select className="w-full rounded-xl border border-slate-300 px-3 py-2" value={registerForm.role} onChange={(event) => setRegisterForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}>
                  <option value={UserRole.EMPLOYEE}>Perdorues</option>
                  <option value={UserRole.HR_ADMIN}>HR</option>
                  <option value={UserRole.MANAGER}>Menaxher</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Ditet vjetore te pushimit</span>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" type="number" min={0} value={registerForm.annualLeaveEntitlement} onChange={(event) => setRegisterForm((prev) => ({ ...prev, annualLeaveEntitlement: Number(event.target.value) }))} />
              </label>
            </div>

            <button
              className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-white"
              onClick={() => void createEmployee(registerForm)}
            >
              Regjistro Punonjes
            </button>
          </article>
        </section>
        )}

        {menu === 'users' && canAdminUsers && (
        <section className="grid gap-4">
          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Te gjithe punonjesit</h2>
            <p className="mt-1 text-sm text-slate-600">Kliko emrin e punonjesit per te hapur profilin e plote, editim total dhe klikimet e muajit aktual.</p>
            <div className="mt-3 overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600">
                    <th className="px-3 py-2">Emri</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Roli</th>
                    <th className="px-3 py-2">Dega</th>
                    <th className="px-3 py-2">Pushimi vjetor</th>
                    <th className="px-3 py-2">Dite te mbetura</th>
                    <th className="px-3 py-2">Cmimi per ore</th>
                    <th className="px-3 py-2">Veprime</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-200">
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="font-medium text-slate-900 underline-offset-2 hover:underline"
                          onClick={() => void openEmployeeHistory(entry)}
                        >
                          {entry.firstName} {entry.lastName}
                        </button>
                      </td>
                      <td className="px-3 py-2">{entry.user?.email}</td>
                      <td className="px-3 py-2">
                        <select
                          className="rounded-lg border border-slate-300 px-2 py-1"
                          value={entry.user?.role ?? UserRole.EMPLOYEE}
                          onChange={(event) => {
                            void updateEmployee(entry.id, { role: event.target.value as UserRole })
                          }}
                        >
                          <option value={UserRole.EMPLOYEE}>Perdorues</option>
                          <option value={UserRole.HR_ADMIN}>HR</option>
                          <option value={UserRole.MANAGER}>Menaxher</option>
                          {isSuperAdmin && <option value={UserRole.SYSTEM_ADMIN}>SuperAdmin</option>}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="w-32 rounded-lg border border-slate-300 px-2 py-1"
                          defaultValue={entry.branchName ?? 'Prishtina'}
                          onBlur={(event) => void updateEmployee(entry.id, { branchName: event.target.value })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="w-24 rounded-lg border border-slate-300 px-2 py-1"
                          type="number"
                          min={0}
                          defaultValue={entry.annualLeaveEntitlement ?? 20}
                          onBlur={(event) => void updateEmployee(entry.id, { annualLeaveEntitlement: Number(event.target.value) })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="w-24 rounded-lg border border-slate-300 px-2 py-1"
                          type="number"
                          min={0}
                          defaultValue={entry.annualLeaveRemaining ?? entry.annualLeaveEntitlement ?? 20}
                          onBlur={(event) => void updateEmployee(entry.id, { annualLeaveRemaining: Number(event.target.value) })}
                        />
                      </td>
                      <td className="px-3 py-2">{entry.hourlyRateEur ?? '-'}</td>
                      <td className="px-3 py-2">
                        {isSuperAdmin && (
                          <button className="rounded-lg bg-rose-600 px-3 py-1.5 text-white" onClick={() => void removeEmployee(entry.id)}>
                            Fshij
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
              Perdoruesit e sistemit te ngarkuar: {systemUsers.length}
            </div>
          </article>
        </section>
        )}

        {menu === 'attendance' && (canManageOps || canEmployeeSelfService) && (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Pamja e prezences</h2>
            {canManageOps && (
              <button className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-white" onClick={() => void exportAttendanceCsv()}>
                Eksporto prezencen (CSV)
              </button>
            )}
            <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
              {canManageOps ? attendance.slice(0, 14).map((entry) => (
                <li key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{entry.employeeId}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5">{trAttendanceStatus(entry.status)}</span>
                  </div>
                  <div className="mt-1 text-slate-600">
                    {formatDateDisplay(entry.date)} • {entry.workedMinutes} minuta
                  </div>
                </li>
              )) : selfAttendance.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{selfProfile?.employeeNumber ?? selfProfile?.firstName ?? 'Une'}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5">{trAttendanceStatus(entry.status)}</span>
                  </div>
                  <div className="mt-1 text-slate-600">
                    {formatDateDisplay(entry.date)} • {entry.workedMinutes} minuta
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {entry.checkInAt ? `Hyrje: ${dayjs(entry.checkInAt).format('HH:mm')}` : 'Pa hyrje'}
                    {' • '}
                    {entry.checkOutAt ? `Dalje: ${dayjs(entry.checkOutAt).format('HH:mm')}` : 'Pa dalje'}
                  </div>
                </li>
              ))}
            </ul>
          </article>

          {canManageOps ? (
            <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
              <h2 className="font-serif text-2xl">Rrjedha live e hyrje/daljeve</h2>
              <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
                {punches.slice(0, 16).map((entry) => (
                  <li key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="font-medium">{entry.employeeId}</div>
                    <div className="text-slate-600">{trPunchType(entry.type)} ne {formatDateTimeDisplay(entry.punchedAt)}</div>
                  </li>
                ))}
              </ul>
            </article>
          ) : (
            <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
              <h2 className="font-serif text-2xl">Oret e tua te punes</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Ditet e pushimit vjetor</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">{selfProfile?.annualLeaveRemaining ?? 0}</div>
                </div>
                <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
                  <div className="text-xs uppercase tracking-wide text-slate-500">E drejta totale vjetore</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">{selfProfile?.annualLeaveEntitlement ?? 0}</div>
                </div>
              </div>
            </article>
          )}
        </section>
        )}

        {menu === 'leaves' && (canManageOps || canEmployeeSelfService) && (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">
              {canManageOps && activeAdminMenuItem === 'Kerkesat per pushim' ? 'Kerkesat per pushim' : 'Rrjedha e pushimeve'}
            </h2>

            {canManageOps && activeAdminMenuItem === 'Kerkesat per pushim' && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-3 text-sm text-amber-900">
                Ne kete nenkategori menaxhohen te gjitha kerkesat e pushimit te punetoreve.
              </div>
            )}

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {canManageOps ? (
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="ID e punonjesit"
                  value={leaveForm.employeeId}
                  onChange={(event) => setLeaveForm((prev) => ({ ...prev, employeeId: event.target.value }))}
                />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  Punonjesi: {selfProfile?.firstName} {selfProfile?.lastName}
                </div>
              )}
              {canManageOps ? (
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="ID e llojit te pushimit"
                  value={leaveForm.leaveTypeId}
                  onChange={(event) => setLeaveForm((prev) => ({ ...prev, leaveTypeId: event.target.value }))}
                />
              ) : (
                <select className="rounded-xl border border-slate-300 px-3 py-2" value={leaveForm.leaveTypeId} onChange={(event) => setLeaveForm((prev) => ({ ...prev, leaveTypeId: event.target.value }))}>
                  {leaveTypeOptions.length === 0 && (
                    <option value="">Nuk ka lloje pushimi (kontakto SuperAdmin)</option>
                  )}
                  {leaveTypeOptions.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.name}</option>
                  ))}
                </select>
              )}
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
              placeholder="Arsyeja"
              value={leaveForm.reason}
              onChange={(event) => setLeaveForm((prev) => ({ ...prev, reason: event.target.value }))}
            />
            <button
              className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canManageOps && (!leaveForm.leaveTypeId || leaveSubmitting)}
              onClick={() => canManageOps ? void createLeave(leaveForm) : void submitEmployeeLeaveRequest()}
            >
              {leaveSubmitting ? 'Duke derguar...' : 'Dergo kerkesen per pushim'}
            </button>
            {!canManageOps && leaveSubmitMessage && (
              <p
                className={`mt-2 text-sm ${
                  leaveSubmitMessage.kind === 'success'
                    ? 'text-emerald-700'
                    : leaveSubmitMessage.kind === 'error'
                      ? 'text-rose-700'
                      : 'text-slate-700'
                }`}
              >
                {leaveSubmitMessage.text}
              </p>
            )}
            {canManageOps && leaveAdminMessage && (
              <p
                className={`mt-2 text-sm ${
                  leaveAdminMessage.kind === 'success'
                    ? 'text-emerald-700'
                    : leaveAdminMessage.kind === 'error'
                      ? 'text-rose-700'
                      : 'text-slate-700'
                }`}
              >
                {leaveAdminMessage.text}
              </p>
            )}
          </article>

          <article className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl">Te gjitha kerkesat e pushimit</h2>
            <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
              {canManageOps ? (
                <>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {[
                      { key: 'all', label: 'Te gjitha' },
                      { key: 'pending', label: 'Ne pritje' },
                      { key: 'approved', label: 'Aprovuar' },
                      { key: 'rejected', label: 'Refuzuar' },
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        className={`rounded-full px-3 py-1 text-xs ${leaveRequestStatusFilter === option.key ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
                        onClick={() => setLeaveRequestStatusFilter(option.key as typeof leaveRequestStatusFilter)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {visibleAdminLeaveRequests.slice(0, 30).map((entry) => (
                <li key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {(entry.employee?.firstName || entry.employee?.lastName)
                        ? `${entry.employee?.firstName ?? ''} ${entry.employee?.lastName ?? ''}`.trim()
                        : entry.employeeId}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5">{trLeaveStatus(entry.status)}</span>
                  </div>
                  <div className="mt-1 text-slate-600">{formatDateDisplay(entry.startDate)} → {formatDateDisplay(entry.endDate)}</div>
                  {(role === UserRole.MANAGER || role === UserRole.HR_ADMIN || isSuperAdmin) && entry.status === 'pending' && (
                    <div className="mt-2 flex gap-2">
                      <button
                        className="rounded-lg bg-emerald-700 px-3 py-1 text-white"
                        onClick={() => void reviewLeave({ requestId: entry.id, status: 'approved', reviewer: leaveReviewer })}
                      >
                        Aprovo
                      </button>
                      <button
                        className="rounded-lg bg-rose-700 px-3 py-1 text-white"
                        onClick={() => void reviewLeave({ requestId: entry.id, status: 'rejected', reviewer: leaveReviewer })}
                      >
                        Refuzo
                      </button>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700"
                      onClick={() => printLeaveRequestPdf(entry)}
                    >
                      Shkarko/Printo PDF
                    </button>
                    <label className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-800">
                      {signedDocumentUploadingId === entry.id ? 'Duke ngarkuar...' : 'Ngarko dokumentin e nenshkruar'}
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        disabled={signedDocumentUploadingId === entry.id}
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (file) {
                            void uploadSignedLeaveDocument(entry.id, file)
                          }
                          event.target.value = ''
                        }}
                      />
                    </label>
                    {entry.signedDocumentAvailable && (
                      <button
                        type="button"
                        className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs text-emerald-800"
                        onClick={() => void downloadSignedLeaveDocument(entry.id)}
                      >
                        Shkarko dokumentin e nenshkruar
                      </button>
                    )}
                  </div>
                </li>
                  ))}
                </>
              ) : selfLeaveRequests.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{entry.leaveType?.name ?? 'Pushim'}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5">{trLeaveStatus(entry.status)}</span>
                  </div>
                  <div className="mt-1 text-slate-600">{formatDateDisplay(entry.startDate)} → {formatDateDisplay(entry.endDate)}</div>
                  {entry.signedDocumentAvailable && (
                    <button
                      type="button"
                      className="mt-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs text-emerald-800"
                      onClick={() => void downloadSignedLeaveDocument(entry.id)}
                    >
                      Shkarko dokumentin e nenshkruar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </article>
        </section>
        )}

        {menu === 'payroll' && canAdminUsers && (
        <section className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg">
          <h2 className="font-serif text-2xl">Qendra e eksportit te pagave</h2>
          <p className="text-sm text-slate-600">SuperAdmin / HR mund te eksportoje regjistrat e pagave ne cdo kohe.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-white" onClick={() => void loadPayrollRecords()}>
              Rifresko regjistrat e pagave
            </button>
            <button className="rounded-xl bg-emerald-700 px-4 py-2 text-white" onClick={exportPayrollCsv}>
              Eksporto pagat (CSV)
            </button>
          </div>

          <div className="mt-3 overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600">
                  <th className="px-3 py-2">Punonjesi</th>
                  <th className="px-3 py-2">Ore</th>
                  <th className="px-3 py-2">Bruto</th>
                  <th className="px-3 py-2">Valuta</th>
                  <th className="px-3 py-2">Llogaritur</th>
                </tr>
              </thead>
              <tbody>
                {payrollRecords.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-200">
                    <td className="px-3 py-2">{entry.employee?.firstName} {entry.employee?.lastName}</td>
                    <td className="px-3 py-2">{entry.totalHours}</td>
                    <td className="px-3 py-2">{entry.grossAmount}</td>
                    <td className="px-3 py-2">{entry.currency}</td>
                    <td className="px-3 py-2">{formatDateTimeDisplay(entry.calculatedAt)}</td>
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

        {selectedHistoryEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4" onClick={closeEmployeeHistory}>
            <div
              className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-amber-100 bg-[linear-gradient(180deg,#fff9f3_0%,#fff1e2_100%)] shadow-2xl shadow-amber-200/60"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-amber-100 px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Profili i punonjesit</p>
                  <h3 className="mt-1 font-serif text-3xl text-slate-900">{selectedHistoryEmployee.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">Mund te editosh te gjitha te dhenat dhe te shohesh klikimet e muajit aktual me te gjitha detajet.</p>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-amber-50"
                  onClick={closeEmployeeHistory}
                >
                  Mbyll
                </button>
              </div>

              <div className="max-h-[calc(85vh-96px)] overflow-auto px-6 py-5">
                {historyLoading ? (
                  <div className="rounded-2xl border border-dashed border-amber-200 bg-white/70 px-4 py-8 text-center text-sm text-slate-600">
                    Duke ngarkuar historine e klikimeve...
                  </div>
                ) : (
                  <div className="space-y-5">
                    <section className="rounded-2xl border border-amber-100 bg-white/85 p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-slate-900">Te dhenat e punonjesit</h4>
                        <button
                          type="button"
                          disabled={employeeFormSaving}
                          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
                          onClick={() => void saveEmployeeDetails()}
                        >
                          {employeeFormSaving ? 'Duke ruajtur...' : 'Ruaj ndryshimet'}
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Emri</span>
                          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.firstName} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, firstName: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Mbiemri</span>
                          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.lastName} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, lastName: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Numri i punonjesit</span>
                          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.employeeNumber} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, employeeNumber: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Email</span>
                          <input type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.email} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, email: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Data e lindjes</span>
                          <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.birthDate} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, birthDate: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Data e punesimit</span>
                          <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.hireDate} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, hireDate: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Shteti</span>
                          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.country} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, country: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Numri personal</span>
                          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.personalId} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, personalId: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Komuna</span>
                          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.municipality} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, municipality: event.target.value }))} />
                        </label>
                        <label className="text-sm md:col-span-2 lg:col-span-3">
                          <span className="mb-1 block text-slate-600">Adresa</span>
                          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.address} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, address: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Telefoni</span>
                          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.tel} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, tel: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Gjendja martesore</span>
                          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.maritalStatus} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, maritalStatus: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Shkollimi</span>
                          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.education} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, education: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Pozita</span>
                          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.position} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, position: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Kontakt emergjent</span>
                          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.emergencyContact} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, emergencyContact: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Lidhja familjare</span>
                          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.familyConnection} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, familyConnection: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Cmimi per ore (EUR)</span>
                          <input type="number" min={0} step="0.01" className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.hourlyRateEur} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, hourlyRateEur: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Roli</span>
                          <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.role} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}>
                            <option value={UserRole.EMPLOYEE}>Perdorues</option>
                            <option value={UserRole.HR_ADMIN}>HR</option>
                            <option value={UserRole.MANAGER}>Menaxher</option>
                            {isSuperAdmin && <option value={UserRole.SYSTEM_ADMIN}>SuperAdmin</option>}
                          </select>
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Dega</span>
                          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.branchName} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, branchName: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Pushimi vjetor</span>
                          <input type="number" min={0} className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.annualLeaveEntitlement} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, annualLeaveEntitlement: event.target.value }))} />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Dite te mbetura</span>
                          <input type="number" min={0} className="w-full rounded-lg border border-slate-300 px-3 py-2" value={employeeEditForm.annualLeaveRemaining} onChange={(event) => setEmployeeEditForm((prev) => ({ ...prev, annualLeaveRemaining: event.target.value }))} />
                        </label>
                      </div>
                      {employeeFormMessage && <p className="mt-3 text-sm text-slate-700">{employeeFormMessage}</p>}
                    </section>

                    <section>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <h4 className="font-semibold text-slate-900">Klikimet sipas intervalit</h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                            onClick={exportSelectedEmployeeHistoryCsv}
                          >
                            Eksporto CSV
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
                            onClick={exportSelectedEmployeeHistoryPdf}
                          >
                            Eksporto PDF
                          </button>
                        </div>
                      </div>

                      <div className="mb-4 grid gap-3 md:grid-cols-2">
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Nga data</span>
                          <input
                            type="date"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            value={historyFromDate}
                            onChange={(event) => setHistoryFromDate(event.target.value)}
                          />
                        </label>
                        <label className="text-sm">
                          <span className="mb-1 block text-slate-600">Deri ne date</span>
                          <input
                            type="date"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            value={historyToDate}
                            onChange={(event) => setHistoryToDate(event.target.value)}
                          />
                        </label>
                      </div>
                      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        Formati i dates ne sistem: DD.MM.YYYY (shembull: 27.12.2026)
                      </div>

                      <div className="mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                          <div className="text-xs uppercase tracking-wide text-emerald-700">Hyrje</div>
                          <div className="mt-1 text-2xl font-semibold text-emerald-900">{currentRangeHistorySummary.checkInCount}</div>
                        </div>
                        <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
                          <div className="text-xs uppercase tracking-wide text-orange-700">Dalje</div>
                          <div className="mt-1 text-2xl font-semibold text-orange-900">{currentRangeHistorySummary.checkOutCount}</div>
                        </div>
                        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                          <div className="text-xs uppercase tracking-wide text-amber-700">Fillo pauzen</div>
                          <div className="mt-1 text-2xl font-semibold text-amber-900">{currentRangeHistorySummary.breakStartCount}</div>
                        </div>
                        <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
                          <div className="text-xs uppercase tracking-wide text-sky-700">Mbaro pauzen</div>
                          <div className="mt-1 text-2xl font-semibold text-sky-900">{currentRangeHistorySummary.breakEndCount}</div>
                        </div>
                        <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
                          <div className="text-xs uppercase tracking-wide text-violet-700">Oret e punes</div>
                          <div className="mt-1 text-lg font-semibold text-violet-900">{Math.floor(currentRangeHistorySummary.workedMinutes / 60)}h {currentRangeHistorySummary.workedMinutes % 60}m</div>
                        </div>
                        <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                          <div className="text-xs uppercase tracking-wide text-rose-700">Koha ne pauze</div>
                          <div className="mt-1 text-lg font-semibold text-rose-900">{Math.floor(currentRangeHistorySummary.breakMinutes / 60)}h {currentRangeHistorySummary.breakMinutes % 60}m</div>
                        </div>
                      </div>

                      <div className="mb-4 overflow-auto rounded-xl border border-slate-200 bg-white/80">
                        <table className="min-w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="px-3 py-2">Data</th>
                              <th className="px-3 py-2">Klikime</th>
                              <th className="px-3 py-2">Hyrje</th>
                              <th className="px-3 py-2">Dalje</th>
                              <th className="px-3 py-2">Pauze</th>
                              <th className="px-3 py-2">Ore pune</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dailyHistorySummary.map((day) => (
                              <tr key={day.date} className="border-t border-slate-100">
                                <td className="px-3 py-2 font-medium text-slate-800">{formatDateDisplay(day.date)}</td>
                                <td className="px-3 py-2">{day.totalClicks}</td>
                                <td className="px-3 py-2">{day.checkInCount}</td>
                                <td className="px-3 py-2">{day.checkOutCount}</td>
                                <td className="px-3 py-2">{Math.floor(day.breakMinutes / 60)}h {day.breakMinutes % 60}m</td>
                                <td className="px-3 py-2">{Math.floor(day.workedMinutes / 60)}h {day.workedMinutes % 60}m</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2 text-sm">
                          {[
                            { key: 'all', label: 'Te gjitha' },
                            { key: 'check_in', label: 'Hyrje' },
                            { key: 'break_start', label: 'Fillo pauzen' },
                            { key: 'break_end', label: 'Mbaro pauzen' },
                            { key: 'check_out', label: 'Dalje' },
                          ].map((option) => (
                            <button
                              key={option.key}
                              type="button"
                              className={`rounded-full px-3 py-1 ${historyFilter === option.key ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
                              onClick={() => setHistoryFilter(option.key as typeof historyFilter)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {filteredRangeHistoryEntries.length > 0 ? (
                        <div className="space-y-4">
                          {filteredRangeHistoryEntries.map((entry) => {
                      const imageSrc = entry.photoDataUrl ?? entry.photoUrl ?? null
                      return (
                        <article key={entry.id} className="grid gap-4 rounded-2xl border border-amber-100 bg-white/85 p-4 shadow-sm md:grid-cols-[1.2fr_220px]">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${entry.type === 'check_in' ? 'bg-emerald-100 text-emerald-800' : entry.type === 'check_out' ? 'bg-orange-100 text-orange-800' : entry.type === 'break_start' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>
                                {trPunchType(entry.type)}
                              </span>
                              <span className="text-sm font-medium text-slate-800">{formatDateTimeDisplay(entry.punchedAt)}</span>
                            </div>
                            <div className="mt-2 text-sm text-slate-600">
                              Burimi: {entry.source ?? 'web'}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">ID klikimi: {entry.id}</div>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              <button
                                type="button"
                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-700"
                                onClick={() => triggerHistoryPhotoUpload(entry.id)}
                              >
                                Ndrysho foton
                              </button>
                              <button
                                type="button"
                                className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-rose-700"
                                onClick={() => void removeHistoryPhoto(entry.id)}
                              >
                                Fshij foton
                              </button>
                            </div>
                          </div>

                          <div className="overflow-hidden rounded-2xl border border-amber-100 bg-amber-50">
                            {imageSrc ? (
                              <img src={imageSrc} alt={`Foto per ${selectedHistoryEmployee.name}`} className="h-44 w-full object-cover" />
                            ) : (
                              <div className="flex h-44 items-center justify-center px-4 text-center text-sm text-slate-500">
                                Nuk ka fotografi te ruajtur per kete klikim.
                              </div>
                            )}
                          </div>
                        </article>
                      )
                    })}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-amber-200 bg-white/70 px-4 py-8 text-center text-sm text-slate-600">
                          Nuk u gjet histori klikimesh per intervalin e zgjedhur.
                        </div>
                      )}
                    </section>
                    <input
                      ref={historyPhotoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleHistoryPhotoSelected}
                    />
                  </div>
                )}
              </div>
            </div>
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
