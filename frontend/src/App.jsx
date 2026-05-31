import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { api } from './services/api'

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'courses', label: 'Dersler', icon: '▤' },
  { id: 'personnel', label: 'Personel', icon: '◉' },
  { id: 'exams', label: 'Sınav Programı', icon: '◫' },
  { id: 'capacity', label: 'Kapasite', icon: '▥' },
  { id: 'smart-capacity', label: 'Akıllı Salon', icon: '▧' },
  { id: 'supervisors', label: 'Gözetmen Atama', icon: '◎' },
  { id: 'reports', label: 'Raporlar', icon: '≣' },
  { id: 'logs', label: 'Log Kayıtları', icon: '≡' },
]
const initialClassroomForm = { classroomName: '', capacity: 60, classroomType: 'Sınıf', floor: 0 };
pages.push({ id: 'requirements', label: 'Proje Kontrol', icon: 'OK' })

const initialExamForm = { departmentId: '', semester: '', courseId: '', date: '', sessionId: '', classroom: '', classroom2: '', classroom3: '', studentCount: 30 }
const initialCapacityPlanForm = { courseId: '', date: '', sessionId: '', studentCount: 150 }
const emptyDashboard = { examCount: 0, assignedCount: 0, roomUsage: 0, pendingCount: 0, courseCount: 0, personnelCount: 0 }
const initialCourseForm = { code: '', name: '', departmentId: '', semester: 1, studentCount: 30 }
const initialPersonForm = { name: '', department: '', title: 'Arş. Gör.', availability: 'Uygun' }
const initialDepartmentForm = { name: '' }
const initialSessionForm = { name: '', startTime: '', endTime: '' }
const initialLeaveForm = { supervisorId: '', date: '', endDate: '', sessionId: 'ALL', reason: 'İzinli' }

const projectRequirements = [
  { group: 'Yönetici Ayarları', item: 'Oturum, salon, bölüm, ders ve personel tanımları', status: 'Hazır' },
  { group: 'Yonetici Ayarlari', item: 'Personel izin ve mazeret durumlarinin ekranda izlenmesi', status: 'Hazir' },
  { group: 'Akilli Salon', item: 'Kontenjana gore coklu salon ve toplam kapasite kontrolu', status: 'Hazir' },
  { group: 'Akilli Salon', item: 'Salon cakismasini ve doluluk oranini takip etme', status: 'Hazir' },
  { group: 'Akilli Salon', item: 'Ayni kat oncelikli adim adim salon onerisi', status: 'Hazir' },
  { group: 'Atama', item: 'Bölüm havuzu ve ortak fakülte havuzundan gözetmen atama', status: 'Hazır' },
  { group: 'Atama', item: 'Mazeretli veya izinli personeli atama disinda tutma', status: 'Hazir' },
  { group: 'Atama', item: 'Gozetmen icin gunluk max 4 ve ardisik max 3 oturum kurali', status: 'Hazir' },
  { group: 'İş Kuralları', item: 'Aynı bölüm ve yarıyılda aynı oturum çakışmasını engelleme', status: 'Hazır' },
  { group: 'İş Kuralları', item: 'Aynı yarıyıl için günlük iki sınav limiti uyarısı', status: 'Hazır' },
  { group: 'Veritabani', item: '3NF tablo yapisi, anahtarlar, kisitlar ve indeksler', status: 'SQL Hazir' },
  { group: 'Programlanabilirlik', item: 'En az 3 SP, 3 UDF, 3 view ve 2 trigger', status: 'SQL Hazir' },
  { group: 'Ek Isterler', item: 'Transaction rollback, log tablosu ve backup procedure', status: 'Hazir' },
  { group: 'Ek Isterler', item: 'App_Admin ve App_Viewer rol bazli guvenlik senaryosu', status: 'SQL Hazir' },
]

function StatusBadge({ value }) {
  const variant =
    value === 'Planlandı' || value === 'Başarılı' || value === 'Uygun'
      ? 'success'
      : value === 'Planlandı' || value === 'Başarılı'
        ? 'success'
      : value === 'Uyarı' || value === 'Atama Bekliyor'
        ? 'warning'
        : 'info'

  return <span className={`badge badge-${variant}`}>{value}</span>
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  )
}

const getExamRoomNames = (exam) => String(exam.classroomName || exam.classroom || '')
  .split(',')
  .map((room) => room.trim())
  .filter(Boolean)

const formatFloor = (floor) => Number(floor) === 0 ? 'Zemin Kat' : `${floor}. Kat`

function buildCapacityPlan({ capacities, exams, date, sessionId, studentCount }) {
  const requestedSeats = Number(studentCount || 0)
  const busyRooms = new Set(
    exams
      .filter((exam) => date && sessionId && exam.date === date && String(exam.sessionId) === String(sessionId))
      .flatMap(getExamRoomNames),
  )
  const availableRooms = capacities
    .filter((room) => !busyRooms.has(room.classroom))
    .map((room) => ({
      ...room,
      capacity: Number(room.capacity || 0),
      floor: Number(room.floor ?? 0),
    }))
    .filter((room) => room.capacity > 0)
    .sort((a, b) => b.capacity - a.capacity || a.classroom.localeCompare(b.classroom, 'tr'))

  const selected = []
  let remaining = requestedSeats

  while (remaining > 0 && availableRooms.length) {
    const targetFloor = selected[0]?.floor
    const sameFloor = availableRooms.filter((room) => targetFloor === undefined || room.floor === targetFloor)
    const pool = sameFloor.length ? sameFloor : availableRooms
    const next = selected.length === 0
      ? pool[0]
      : [...pool].sort((a, b) => {
          const aWaste = a.capacity >= remaining ? a.capacity - remaining : Number.MAX_SAFE_INTEGER - a.capacity
          const bWaste = b.capacity >= remaining ? b.capacity - remaining : Number.MAX_SAFE_INTEGER - b.capacity
          return aWaste - bWaste || b.capacity - a.capacity || a.classroom.localeCompare(b.classroom, 'tr')
        })[0]

    selected.push(next)
    remaining -= next.capacity
    availableRooms.splice(availableRooms.findIndex((room) => room.id === next.id), 1)
  }

  const totalCapacity = selected.reduce((sum, room) => sum + room.capacity, 0)
  const steps = selected.map((room, index) => {
    const remainingAfter = Math.max(0, requestedSeats - selected.slice(0, index + 1).reduce((sum, item) => sum + item.capacity, 0))
    return {
      id: room.id,
      room: room.classroom,
      capacity: room.capacity,
      floor: room.floor,
      title: index === 0 ? 'En büyük boş salonu bul' : 'Kalan için en uygun salonu bul',
      remainingAfter,
    }
  })

  return {
    steps,
    selected,
    totalCapacity,
    remaining: Math.max(0, requestedSeats - totalCapacity),
    supervisorCount: selected.length,
    isEnough: totalCapacity >= requestedSeats,
    sameFloor: selected.length <= 1 || selected.every((room) => room.floor === selected[0].floor),
  }
}

const getSupervisorNames = (exam) => {
  if (Array.isArray(exam.supervisors)) return exam.supervisors
  return String(exam.supervisor || '')
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name && name !== 'Atama Bekliyor')
}

const wouldBreakSupervisorChain = (sessionIds, newSessionId) => {
  const ordered = [...new Set([...sessionIds.map(Number), Number(newSessionId)])].sort((a, b) => a - b)
  let chain = 1
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index] === ordered[index - 1] + 1) {
      chain += 1
      if (chain > 3) return true
    } else {
      chain = 1
    }
  }
  return false
}

const getDateRange = (startDate, endDate) => {
  if (!startDate) return []
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate || startDate}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return []
  const dates = []
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    dates.push(cursor.toISOString().slice(0, 10))
  }
  return dates
}

const getAssignmentPreview = ({ supervisors, exams, exam, preferredSupervisorId }) => {
  if (!exam) return { neededCount: 0, candidates: [], departmentCount: 0, usesCommonPool: false }
  const neededCount = Math.max(1, Number(exam.requiredSupervisorCount || getExamRoomNames(exam).length || 1))
  const isCommonPool = (person) => Number(person.departmentId) === 6 || String(person.department).includes('Ortak')
  const isEligible = (person) => {
    const assignedToday = exams.filter((item) => getSupervisorNames(item).includes(person.name) && item.date === exam.date)
    if (assignedToday.some((item) => String(item.sessionId) === String(exam.sessionId))) return false
    if (new Set(assignedToday.map((item) => Number(item.sessionId))).size >= 4) return false
    if (wouldBreakSupervisorChain(assignedToday.map((item) => item.sessionId), exam.sessionId)) return false
    if (['İzinli', 'Danışmanlık Saati', 'Görevli'].includes(person.availability)) return false
    return true
  }
  const decorate = (person) => ({
    ...person,
    source: Number(person.departmentId) === Number(exam.departmentId) ? 'Bölüm Havuzu' : 'Mühendislik Fakültesi Ortak Havuzu',
  })
  const preferred = supervisors.find((person) => Number(person.id) === Number(preferredSupervisorId))
  const departmentCandidates = supervisors
    .filter((person) => Number(person.departmentId) === Number(exam.departmentId))
    .filter(isEligible)
    .sort((a, b) => Number(a.examCount || 0) - Number(b.examCount || 0))
    .map(decorate)
  const commonCandidates = supervisors
    .filter((person) => isCommonPool(person) && Number(person.departmentId) !== Number(exam.departmentId))
    .filter(isEligible)
    .sort((a, b) => Number(a.examCount || 0) - Number(b.examCount || 0))
    .map(decorate)
  const preferredCandidate = preferred && isEligible(preferred) ? decorate(preferred) : null
  const basePool = departmentCandidates.length >= neededCount ? departmentCandidates : [...departmentCandidates, ...commonCandidates]
  const candidates = [preferredCandidate, ...basePool]
    .filter(Boolean)
    .filter((person, index, list) => list.findIndex((item) => item.id === person.id) === index)

  return {
    neededCount,
    candidates,
    departmentCount: departmentCandidates.length,
    usesCommonPool: departmentCandidates.length < neededCount,
  }
}

function App() {
  const [page, setPage] = useState('dashboard')
  const [dashboard, setDashboard] = useState(emptyDashboard)
  const [courses, setCourses] = useState([])
  const [examModalCourses, setExamModalCourses] = useState([])

  const [exams, setExams] = useState([])
  const [capacities, setCapacities] = useState([])
  const [supervisors, setSupervisors] = useState([])
  const [logs, setLogs] = useState([])
  const [reports, setReports] = useState([])
  const [departments, setDepartments] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [demoMode, setDemoMode] = useState(api.isDemoMode())
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const [errorText, setErrorText] = useState('')
  const [examDepartmentFilter, setExamDepartmentFilter] = useState('')
  const [examSemesterFilter, setExamSemesterFilter] = useState('')
  const [capacityPlanForm, setCapacityPlanForm] = useState(initialCapacityPlanForm)

  const [classroomForm, setClassroomForm] = useState(initialClassroomForm);
  const [examForm, setExamForm] = useState(initialExamForm)
  const [courseForm, setCourseForm] = useState(initialCourseForm)
  const [personForm, setPersonForm] = useState(initialPersonForm)
  const [departmentForm, setDepartmentForm] = useState(initialDepartmentForm)
  const [sessionForm, setSessionForm] = useState(initialSessionForm)
  const [leaveForm, setLeaveForm] = useState(initialLeaveForm)
  const [assignment, setAssignment] = useState({ examId: '', supervisorId: '' })

  const pendingExams = useMemo(
    () => exams.filter((exam) => exam.supervisor === 'Atama Bekliyor'),
    [exams],
  )

  const selectedAssignmentExam = useMemo(() => {
    return pendingExams.find((exam) => String(exam.id) === String(assignment.examId))
  }, [assignment.examId, pendingExams])

  const assignmentPreview = useMemo(() => getAssignmentPreview({
    supervisors,
    exams,
    exam: selectedAssignmentExam,
    preferredSupervisorId: assignment.supervisorId,
  }), [assignment.supervisorId, exams, selectedAssignmentExam, supervisors])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [nextDashboard, nextCourses, nextExams, nextCapacities, nextSupervisors, nextLogs, nextDepartments, nextSessions, nextReports] =
        await Promise.all([
          api.getDashboard(),
          api.getCourses(),
          api.getExams(),
          api.getCapacities(),
          api.getSupervisors(),
          api.getLogs(),
          api.getDepartments(),
          api.getSessions ? api.getSessions() : Promise.resolve([]),
          api.getExamProgramReport ? api.getExamProgramReport() : Promise.resolve([]),
        ])
      setDashboard(nextDashboard ?? emptyDashboard)
      setCourses(nextCourses)
      setExams(nextExams)
      setCapacities(nextCapacities)
      setSupervisors(nextSupervisors)
      setLogs(nextLogs)
      setDepartments(nextDepartments)
      setSessions(nextSessions ?? [])
      setReports(nextReports ?? [])
    } catch {
      setToast('API bağlantısı kurulamadı. Backend ve SQL Server bağlantısını kontrol et.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadData()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [demoMode, loadData])

  useEffect(() => {
    if (!toast) return undefined
    const timeoutId = window.setTimeout(() => setToast(''), 3300)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  useEffect(() => {
    if (!courses.length || capacityPlanForm.courseId) return
    const scenarioCourse = courses.find((course) => course.code === 'YZM 2126') ?? courses[0]
    setCapacityPlanForm((current) => ({
      ...current,
      courseId: String(scenarioCourse.id),
      studentCount: Number(scenarioCourse.studentCount || current.studentCount),
    }))
  }, [capacityPlanForm.courseId, courses])

  async function submitClassroom(event) {
    event.preventDefault();
    setErrorText('');
    setBusy(true);
    try {
      await api.createClassroom(classroomForm);
      setModal(null);
      setClassroomForm(initialClassroomForm);
      setToast('Yeni sınıf/salon başarıyla sisteme eklendi.');
      await loadData();
      setPage('capacity');
    } catch (error) {
      setErrorText(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function openExamModal() {
    setErrorText('')
    const examCourseIds = new Set(exams.map((exam) => Number(exam.courseId)))
    const safeCourses = courses.filter((course) => !examCourseIds.has(Number(course.id)))

    setExamModalCourses(safeCourses)
    setExamForm({
      ...initialExamForm,
      departmentId: safeCourses[0]?.departmentId ? String(safeCourses[0].departmentId) : '',
      semester: safeCourses[0]?.semester ? String(safeCourses[0].semester) : '',
      courseId: safeCourses[0]?.id ? String(safeCourses[0].id) : '',
      studentCount: safeCourses[0]?.studentCount ?? 30,
    })
    setModal('exam')
  }




  async function submitCourse(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await api.createCourse(courseForm)
      setModal(null)
      setCourseForm(initialCourseForm)
      setToast('Ders kaydı sisteme eklendi.')
      await loadData()
      setPage('courses')
    } catch (error) {
      setToast(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitPerson(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await api.createSupervisor(personForm)
      setModal(null)
      setPersonForm(initialPersonForm)
      setToast('Personel kaydı sisteme eklendi.')
      await loadData()
      setPage('personnel')
    } catch (error) {
      setToast(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitLeave(event) {
    event.preventDefault()
    const leaveDates = getDateRange(leaveForm.date, leaveForm.endDate)
    if (!leaveDates.length) {
      setToast('Geçerli bir izin tarih aralığı seçmelisin.')
      return
    }
    setBusy(true)
    try {
      for (const date of leaveDates) {
        await api.createSupervisorLeave({ ...leaveForm, date })
      }
      setModal(null)
      setLeaveForm(initialLeaveForm)
      setToast(leaveDates.length > 1 ? 'Personel izin/mazeret tarih aralığı kaydedildi.' : 'Personel izin/mazeret bilgisi kaydedildi.')
      await loadData()
      setPage('personnel')
    } catch (error) {
      setToast(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitDepartment(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await api.createDepartment(departmentForm)
      setModal(null)
      setDepartmentForm(initialDepartmentForm)
      setToast('Bölüm kaydı sisteme eklendi.')
      await loadData()
    } catch (error) {
      setToast(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitSession(event) {
    event.preventDefault()
    setErrorText('')

    if (sessionForm.startTime >= sessionForm.endTime) {
      setErrorText('Hata: Başlangıç saati bitiş saatinden büyük veya eşit olamaz!')
      return
    }

    setBusy(true)
    try {
      if (api.createSession) {
        await api.createSession(sessionForm)
      }
      setModal(null)
      setSessionForm(initialSessionForm)
      setToast('Yeni oturum seansı sisteme eklendi.')
      await loadData()
    } catch (error) {
      setErrorText(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitExam(event) {
    event.preventDefault()
    setErrorText('')

    if (!examForm.sessionId) {
      setErrorText('Lütfen uygun oturumlardan birini seçiniz.')
      return
    }
    if (!examForm.classroom) {
      setErrorText('Lütfen en az bir salon seçiniz.')
      return
    }
    const selectedRooms = [examForm.classroom, examForm.classroom2, examForm.classroom3].filter(Boolean)
    const busyRoom = selectedRooms.find((roomName) => isRoomBusyForExamSlot(roomName))
    if (busyRoom) {
      setErrorText(`${busyRoom} seçilen tarih ve oturumda dolu. Lütfen farklı salon seçiniz.`)
      return
    }

    setBusy(true)
    try {
      await api.createExam(examForm)
      setModal(null)
      setToast('Yeni sınav programa eklendi. Salon kombinasyonu backend tarafından kontrol edildi.')
      await loadData()
      setPage('exams')
    } catch (error) {
      setErrorText(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitAssignment(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await api.assignSupervisor(assignment)
      setModal(null)
      setAssignment({ examId: '', supervisorId: '' })
      setToast('Gözetmen ataması kaydedildi.')
      await loadData()
      setPage('supervisors')
    } catch (error) {
      setToast(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function runBackup() {
    setBusy(true)
    try {
      const result = await api.runBackup()
      setToast(result.message ?? 'Yedekleme tamamlandı.')
      await loadData()
    } catch {
      setToast('Backup procedure çağrısı başarısız oldu.')
    } finally {
      setBusy(false)
    }
  }

  const selectedCourseDetails = useMemo(() => {
    return courses.find(c => String(c.id) === examForm.courseId)
  }, [courses, examForm.courseId])

  const selectableExamCourses = useMemo(() => {
    return examModalCourses.filter((course) => {
      const departmentMatches = !examForm.departmentId || String(course.departmentId) === String(examForm.departmentId)
      const semesterMatches = !examForm.semester || String(course.semester) === String(examForm.semester)
      return departmentMatches && semesterMatches
    })
  }, [examForm.departmentId, examForm.semester, examModalCourses])

  const filteredExamSchedule = useMemo(() => {
    return exams.filter((exam) => {
      const departmentMatches = !examDepartmentFilter || String(exam.departmentId) === String(examDepartmentFilter)
      const semesterMatches = !examSemesterFilter || String(exam.semester) === String(examSemesterFilter)
      return departmentMatches && semesterMatches
    })
  }, [examDepartmentFilter, examSemesterFilter, exams])

  const selectedCapacityCourse = useMemo(() => {
    return courses.find((course) => String(course.id) === String(capacityPlanForm.courseId))
  }, [capacityPlanForm.courseId, courses])

  const capacityPlan = useMemo(() => buildCapacityPlan({
    capacities,
    exams,
    date: capacityPlanForm.date,
    sessionId: capacityPlanForm.sessionId,
    studentCount: capacityPlanForm.studentCount,
  }), [capacities, capacityPlanForm.date, capacityPlanForm.sessionId, capacityPlanForm.studentCount, exams])

  const examSmartPlan = useMemo(() => buildCapacityPlan({
    capacities,
    exams,
    date: examForm.date,
    sessionId: examForm.sessionId,
    studentCount: examForm.studentCount,
  }), [capacities, examForm.date, examForm.sessionId, examForm.studentCount, exams])

const showCapacityWarning = useMemo(() => {
  if (!examForm.classroom) return false;

  // 1. Salonun kapasitesini bul
  const room1 = capacities.find(r => r.classroom === examForm.classroom);
  let totalCapacity = room1 ? room1.capacity : 0;

  // Eğer 2. salon da seçildiyse onun da kapasitesini toplama ekle
  if (examForm.classroom2) {
    const room2 = capacities.find(r => r.classroom === examForm.classroom2);
    totalCapacity += room2 ? room2.capacity : 0;
  }

  if (examForm.classroom3) {
    const room3 = capacities.find(r => r.classroom === examForm.classroom3);
    totalCapacity += room3 ? room3.capacity : 0;
  }

  return totalCapacity < Number(examForm.studentCount);
}, [capacities, examForm.classroom, examForm.classroom2, examForm.classroom3, examForm.studentCount]);

const selectedExamRoomCapacity = useMemo(() => {
  return [examForm.classroom, examForm.classroom2, examForm.classroom3]
    .filter(Boolean)
    .reduce((sum, classroom) => {
      const room = capacities.find(r => r.classroom === classroom);
      return sum + Number(room?.capacity || 0);
    }, 0)
}, [capacities, examForm.classroom, examForm.classroom2, examForm.classroom3])

const isRoomBusyForExamSlot = useCallback((roomName) => {
  if (!roomName || !examForm.date || !examForm.sessionId) return false
  return exams.some((exam) =>
    exam.date === examForm.date &&
    String(exam.sessionId) === String(examForm.sessionId) &&
    getExamRoomNames(exam).includes(roomName)
  )
}, [examForm.date, examForm.sessionId, exams])

  const title = pages.find((entry) => entry.id === page)?.label

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SP</div>
          <div>
            <strong>SınavPanel</strong>
            <small>Yönetim Sistemi</small>
          </div>
        </div>
        <nav className="nav-links" aria-label="Sayfalar">
          {pages.map((entry) => (
            <button className={page === entry.id ? 'active' : ''} type="button" key={entry.id} onClick={() => setPage(entry.id)}>
              <span>{entry.icon}</span>
              {entry.label}
            </button>
          ))}
        </nav>
        <div className="system-card">
          <span className="dot" />
          <div>
            <strong>{demoMode ? 'Demo Veri Aktif' : 'REST API Modu'}</strong>
            <small>{demoMode ? 'Sunuma hazır' : api.baseUrl}</small>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Sınav Yönetim Paneli</p>
            <h1>{title}</h1>
          </div>
          <div className="toolbar">
            <div className="toolbar-group">
              <span className="mode-pill">{demoMode ? 'Demo veri modu' : 'Veritabanı modu'}</span>
              <button type="button" className="secondary-button" disabled={busy} onClick={runBackup}>Yedek Al</button>
            </div>
            <div className="toolbar-group" aria-label="Tanımlar">
              <button type="button" className="secondary-button" onClick={() => setModal('department')}>+ Bölüm</button>
              <button type="button" className="secondary-button" onClick={() => { setErrorText(''); setModal('session'); }}>+ Oturum</button>
              <button type="button" className="secondary-button" onClick={() => setModal('classroom')}>+ Salon</button>
              <button type="button" className="secondary-button" onClick={() => setModal('course')}>+ Ders</button>
            </div>
            <div className="toolbar-group" aria-label="Personel">
              <button type="button" className="secondary-button" onClick={() => setModal('person')}>+ Personel</button>
              <button type="button" className="secondary-button" disabled={!supervisors.length || !sessions.length} onClick={() => setModal('leave')}>+ İzin/Mazeret</button>
            </div>
            <div className="toolbar-group" aria-label="Sınav">
              <button type="button" className="primary-button" disabled={!courses.length} onClick={openExamModal}>+ Sınav</button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="loading-panel">Veriler yükleniyor...</div>
        ) : (
          <>
            {page === 'dashboard' && <Dashboard dashboard={dashboard} exams={exams} />}
            {page === 'courses' && <CourseList courses={courses} onAdd={() => setModal('course')} />}
            {page === 'personnel' && <PersonnelList supervisors={supervisors} onAdd={() => setModal('person')} onLeave={() => setModal('leave')} />}
            {page === 'exams' && <ExamSchedule exams={filteredExamSchedule} departments={departments} selectedDepartment={examDepartmentFilter} selectedSemester={examSemesterFilter} onDepartmentChange={setExamDepartmentFilter} onSemesterChange={setExamSemesterFilter} onAdd={openExamModal} disabled={!courses.length} />}
            {page === 'capacity' && <CapacityList capacities={capacities} />}
            {page === 'smart-capacity' && (
              <CapacityPlanner
                courses={courses}
                sessions={sessions}
                form={capacityPlanForm}
                selectedCourse={selectedCapacityCourse}
                plan={capacityPlan}
                onChange={setCapacityPlanForm}
              />
            )}
            {page === 'supervisors' && (
              <SupervisorList supervisors={supervisors} exams={exams} pendingExams={pendingExams} onAssign={() => setModal('assignment')} />
            )}
            {page === 'reports' && <ReportList reports={reports} />}
            {page === 'requirements' && <RequirementList requirements={projectRequirements} />}
            {page === 'logs' && <LogList logs={logs} onBackup={runBackup} busy={busy} />}
          </>
        )}
      </main>

      {modal === 'department' && (
        <Modal title="Bölüm Kaydı Ekle" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={submitDepartment}>
            <label>Bölüm Adı<input required value={departmentForm.name} onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })} placeholder="Örn: Bilgisayar Müh." /></label>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Vazgeç</button><button type="submit" className="primary-button" disabled={busy}>Kaydet</button></div>
          </form>
        </Modal>
      )}

      {modal === 'classroom' && (
        <Modal title="Yeni Sınav Salonu Tanımla" onClose={() => setModal(null)}>
          {errorText && (
            <div className="error-box" style={{
              backgroundColor: '#fde8e8',
              color: '#e74c3c',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px',
              borderLeft: '4px solid #e74c3c',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {errorText}
            </div>
          )}

          <form className="form-grid" onSubmit={submitClassroom}>
            <label>
              Salon / Derslik İsmi
              <input
                required
                value={classroomForm.classroomName}
                onChange={(event) => setClassroomForm({ ...classroomForm, classroomName: event.target.value.toUpperCase() })}
                placeholder="Örn: 205, 309, 410"
              />
            </label>
            <label>
              Kat
              <input
                type="number"
                required
                value={classroomForm.floor}
                onChange={(event) => setClassroomForm({ ...classroomForm, floor: Number(event.target.value) })}
              />
            </label>
            <label>
              Kapasite
              <input
                type="number"
                min="1"
                required
                value={classroomForm.capacity}
                onChange={(event) => setClassroomForm({ ...classroomForm, capacity: Number(event.target.value) })}
              />
            </label>
            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(null)}>Vazgeç</button>
              <button type="submit" className="primary-button" disabled={busy}>Kaydet</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'session' && (
        <Modal title="Sınav Oturumu Tanımla" onClose={() => setModal(null)}>
          {errorText && <div className="error-box" style={{backgroundColor:'#fde8e8', color:'#e74c3c', padding:'10px', borderRadius:'4px', marginBottom:'12px', borderLeft:'4px solid #e74c3c', fontSize:'14px', fontWeight:'500'}}>{errorText}</div>}
          <form className="form-grid" onSubmit={submitSession}>
            <label>Oturum Adı/Tanımı<input required value={sessionForm.name} onChange={(event) => setSessionForm({ ...sessionForm, name: event.target.value })} placeholder="Örn: Oturum 1 veya Sabah Seansı" /></label>
            <label>Başlangıç Saati<input type="time" required value={sessionForm.startTime} onChange={(event) => setSessionForm({ ...sessionForm, startTime: event.target.value })} /></label>
            <label>Bitiş Saati<input type="time" required value={sessionForm.endTime} onChange={(event) => setSessionForm({ ...sessionForm, endTime: event.target.value })} /></label>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Vazgeç</button><button type="submit" className="primary-button" disabled={busy}>Kaydet</button></div>
          </form>
        </Modal>
      )}

      {modal === 'course' && (
        <Modal title="Ders Kaydı Ekle" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={submitCourse}>
            <label>Ders Kodu<input required value={courseForm.code} onChange={(event) => setCourseForm({ ...courseForm, code: event.target.value.toUpperCase() })} placeholder="BLM401" /></label>
            <label>Ders Adı<input required value={courseForm.name} onChange={(event) => setCourseForm({ ...courseForm, name: event.target.value })} placeholder="Yapay Zeka" /></label>
           <label>
              Bölüm
             <select
               required
               value={courseForm.departmentId || ""}
               onChange={(event) => setCourseForm({ ...courseForm, departmentId: Number(event.target.value) })}
             >
                <option value="">Bölüm seçin</option>
               {departments.map(d => (
                 <option key={d.id} value={d.id}>
                   {d.name}
                 </option>
               ))}
             </select>
           </label>
            <label>
              Dönem (Yarıyıl)
              <select
                required
                value={courseForm.semester || ""}
                onChange={(event) => setCourseForm({ ...courseForm, semester: Number(event.target.value) })}
              >
                <option value="">Dönem Seçin</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                  <option key={semester} value={semester}>{semester}. Yarıyıl</option>
                ))}
              </select>
            </label>
            <label>Öğrenci Sayısı<input type="number" min="1" required value={courseForm.studentCount} onChange={(event) => setCourseForm({ ...courseForm, studentCount: Number(event.target.value) })} /></label>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Vazgeç</button><button type="submit" className="primary-button" disabled={busy}>Kaydet</button></div>
          </form>
        </Modal>
      )}

      {modal === 'person' && (
        <Modal title="Personel Kaydı Ekle" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={submitPerson}>
            <label>Ad Soyad<input required value={personForm.name} onChange={(event) => setPersonForm({ ...personForm, name: event.target.value })} placeholder="Dr. Ayşe Demir" /></label>
            <label>Unvan<select value={personForm.title} onChange={(event) => setPersonForm({ ...personForm, title: event.target.value })}><option>Prof. Dr.</option><option>Doç. Dr.</option><option>Dr.</option><option>Arş. Gör.</option><option>Öğr. Gör.</option></select></label>
            <label>Bölüm<select required value={personForm.department} onChange={(event) => setPersonForm({ ...personForm, department: event.target.value })}><option value="">Bölüm seçin</option>{departments.map((department) => <option key={department.id} value={department.name}>{department.name}</option>)}<option value="Mühendislik Fakültesi Ortak Havuzu">Mühendislik Fakültesi Ortak Havuzu</option></select></label>
            <label>Durum<select value={personForm.availability} onChange={(event) => setPersonForm({ ...personForm, availability: event.target.value })}><option>Campüste</option><option>Yoğun</option><option>İzinli</option></select></label>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Vazgeç</button><button type="submit" className="primary-button" disabled={busy}>Kaydet</button></div>
          </form>
        </Modal>
      )}

      {modal === 'leave' && (
        <Modal title="Personel İzin / Mazeret Ekle" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={submitLeave}>
            <label>Personel<select required value={leaveForm.supervisorId} onChange={(event) => setLeaveForm({ ...leaveForm, supervisorId: event.target.value })}><option value="">Personel seçin</option>{supervisors.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
            <label>Başlangıç Tarihi<input type="date" required value={leaveForm.date} onChange={(event) => setLeaveForm({ ...leaveForm, date: event.target.value, endDate: leaveForm.endDate || event.target.value })} /></label>
            <label>Bitiş Tarihi<input type="date" required min={leaveForm.date || undefined} value={leaveForm.endDate || leaveForm.date} onChange={(event) => setLeaveForm({ ...leaveForm, endDate: event.target.value })} /></label>
            <label>İzin Kapsamı<select required value={leaveForm.sessionId} onChange={(event) => setLeaveForm({ ...leaveForm, sessionId: event.target.value })}><option value="ALL">Tüm gün</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.name} ({session.startTime} - {session.endTime})</option>)}</select></label>
            <label>Mazeret<select value={leaveForm.reason} onChange={(event) => setLeaveForm({ ...leaveForm, reason: event.target.value })}><option>İzinli</option><option>Danışmanlık Saati</option><option>Görevli</option></select></label>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Vazgeç</button><button type="submit" className="primary-button" disabled={busy}>Kaydet</button></div>
          </form>
        </Modal>
      )}

      {modal === 'exam' && (
        <Modal title="Yeni Sınav Oluştur" onClose={() => setModal(null)}>
          {errorText && <div className="error-box" style={{backgroundColor:'#fde8e8', color:'#e74c3c', padding:'10px', borderRadius:'4px', marginBottom:'12px', borderLeft:'4px solid #e74c3c', fontSize:'14px', fontWeight:'500'}}>{errorText}</div>}
          <form className="form-grid" onSubmit={submitExam}>
            <label>
              Bölüm
              <select required value={examForm.departmentId} onChange={(event) => {
                const nextDepartmentId = event.target.value
                const firstCourse = examModalCourses.find((course) => String(course.departmentId) === nextDepartmentId)
                setExamForm({
                  ...examForm,
                  departmentId: nextDepartmentId,
                  semester: firstCourse?.semester ? String(firstCourse.semester) : '',
                  courseId: firstCourse?.id ? String(firstCourse.id) : '',
                  studentCount: firstCourse?.studentCount ?? 30,
                  date: '',
                  classroom: '',
                  classroom2: '',
                  classroom3: '',
                  sessionId: '',
                })
              }}>
                <option value="">Bölüm seçin</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              </select>
            </label>

            <label>
              Yarıyıl
              <select required value={examForm.semester} onChange={(event) => {
                const nextSemester = event.target.value
                const firstCourse = examModalCourses.find((course) =>
                  String(course.departmentId) === String(examForm.departmentId) &&
                  String(course.semester) === nextSemester
                )
                setExamForm({
                  ...examForm,
                  semester: nextSemester,
                  courseId: firstCourse?.id ? String(firstCourse.id) : '',
                  studentCount: firstCourse?.studentCount ?? 30,
                  date: '',
                  classroom: '',
                  classroom2: '',
                  classroom3: '',
                  sessionId: '',
                })
              }}>
                <option value="">Yarıyıl seçin</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => <option key={semester} value={semester}>{semester}. Yarıyıl</option>)}
              </select>
            </label>

            {/* 1. ADIM: DERS SEÇİMİ */}
            <label>
              Ders
              <select required value={examForm.courseId} onChange={(event) => {
                // ğŸ¯ Taramayı genel listeyle değil modal listesiyle yapıyoruz:
                const selected = examModalCourses.find((course) => String(course.id) === event.target.value)
                setExamForm({ ...examForm, courseId: event.target.value, studentCount: selected?.studentCount ?? examForm.studentCount, date: '', classroom: '', classroom2: '', classroom3: '', sessionId: '' })
              }}>
                <option value="">Ders seçin</option>

                {/* ğŸ”¥ İŞTE KRİTİK DEĞİŞİKLİK: Artık genel havuz değil, sadece sınavı olmayan dersler listeleniyor */}
                {selectableExamCourses.map((course) => <option key={course.id} value={course.id}>{course.code} - {course.name}</option>)}
              </select>
            </label>

            {/* 2. ADIM: TARİH SEÇİMİ */}
            <label>
              Tarih
              <input
                type="date"
                required
                disabled={!examForm.courseId} // Ders seçilmeden tarih seçilemez
                value={examForm.date}
                onChange={(event) => setExamForm({ ...examForm, date: event.target.value, classroom: '', classroom2: '', classroom3: '', sessionId: '' })}
              />
            </label>

            <div className="smart-plan-inline">
              <div>
                <span>Akıllı Salon Önerisi</span>
                <strong>
                  {examSmartPlan.isEnough && examSmartPlan.selected.length
                    ? examSmartPlan.selected.map((room) => room.classroom).join(' + ')
                    : 'Uygun kombinasyon bekleniyor'}
                </strong>
                <small>
                  {examSmartPlan.isEnough
                    ? `${examSmartPlan.totalCapacity} toplam kapasite · ${examSmartPlan.supervisorCount} gözetmen`
                    : `${examSmartPlan.remaining} kişilik kapasite açığı var`}
                </small>
              </div>
              <button
                type="button"
                className="secondary-button"
                disabled={!examForm.date || !examForm.sessionId || !examSmartPlan.isEnough}
                onClick={() => {
                  const [firstRoom, secondRoom, thirdRoom] = examSmartPlan.selected
                  setExamForm({
                    ...examForm,
                    classroom: firstRoom?.classroom || '',
                    classroom2: secondRoom?.classroom || '',
                    classroom3: thirdRoom?.classroom || '',
                  })
                }}
              >
                Öneriyi Uygula
              </button>
              {examSmartPlan.steps.length > 0 && (
                <div className="smart-plan-steps">
                  {examSmartPlan.steps.map((step, index) => (
                    <small key={`${step.room}-${index}`}>Adım {index + 1}: {step.room} ({step.capacity}) · Kalan: {step.remainingAfter}</small>
                  ))}
                </div>
              )}
            </div>

            {/* 3. ADIM: 1. SALON SEÇİMİ */}
            <label style={{ opacity: !examForm.date || !examForm.sessionId ? 0.6 : 1 }}>
              1. Salon
              <select
                required
                disabled={!examForm.date || !examForm.sessionId}
                value={examForm.classroom}
                onChange={(event) => setExamForm({ ...examForm, classroom: event.target.value, classroom2: '', classroom3: '' })}
              >
                <option value="">Salon Seçin</option>
                {capacities.map((room) => {
                  const busy = isRoomBusyForExamSlot(room.classroom)
                  return <option key={room.id} value={room.classroom} disabled={busy}>{room.classroom} (Kap: {room.capacity}){busy ? ' - Dolu' : ''}</option>
                })}
              </select>
            </label>


            {/* ğŸ”¥ YENİ DİNAMİK ALAN: Eğer 1. salonun kapasitesi yetmiyorsa veya zaten 2. salon seçilmişse ekrana gelir */}
            {((examForm.classroom && capacities.find(r => r.classroom === examForm.classroom)?.capacity < Number(examForm.studentCount)) || examForm.classroom2) && (
              <label style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
                <span style={{ color: '#e67e22', fontWeight: '600' }}>2. Salon (Ek Kontenjan Gerekli)</span>
                <select
                  value={examForm.classroom2 || ''}
                  onChange={(event) => setExamForm({ ...examForm, classroom2: event.target.value, classroom3: '' })}
                >
                  <option value="">Ek 2. Salon Seçin (Opsiyonel)</option>
                  {capacities
                    // 1. seçilen salonun listede tekrar çıkmasını engelliyoruz çakışma olmasın diye
                    .filter(room => room.classroom !== examForm.classroom)
                    .map((room) => {
                      const busy = isRoomBusyForExamSlot(room.classroom)
                      return <option key={room.id} value={room.classroom} disabled={busy}>{room.classroom} (Kap: {room.capacity}){busy ? ' - Dolu' : ''}</option>
                    })
                  }
                </select>
              </label>
            )}

            {(examForm.classroom3 || (examForm.classroom2 && selectedExamRoomCapacity < Number(examForm.studentCount))) && (
              <label style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
                <span style={{ color: '#e67e22', fontWeight: '600' }}>3. Salon (Ek Kontenjan Gerekli)</span>
                <select
                  value={examForm.classroom3 || ''}
                  onChange={(event) => setExamForm({ ...examForm, classroom3: event.target.value })}
                >
                  <option value="">Ek 3. Salon Seçin (Opsiyonel)</option>
                  {capacities
                    .filter(room => room.classroom !== examForm.classroom && room.classroom !== examForm.classroom2)
                    .map((room) => {
                      const busy = isRoomBusyForExamSlot(room.classroom)
                      return <option key={room.id} value={room.classroom} disabled={busy}>{room.classroom} (Kap: {room.capacity}){busy ? ' - Dolu' : ''}</option>
                    })
                  }
                </select>
              </label>
            )}

            {showCapacityWarning && (
              <div style={{color:'#d35400', backgroundColor:'#fff5e6', borderLeft:'3px solid #e67e22', padding:'6px 10px', fontSize:'12px', marginTop:'-6px'}}>
                Uyarı: Seçilen salonların toplam kapasitesi ders kontenjanını hâlâ karşılamıyor!
              </div>
            )}

            {/* 4. ADIM: OTURUM SEÇİMİ */}
            <div className="form-group" style={{display:'flex', flexDirection:'column', gap:'6px', opacity: !examForm.date ? 0.6 : 1}}>
              <label style={{fontWeight:'600', color:'#34495e', fontSize:'14px'}}>Sınav Oturumu</label>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:'10px'}}>
                {sessions.length === 0 ? (
                  <p style={{color:'#7f8c8d', fontSize:'13px'}}>Sisteme tanımlı aktif oturum bulunamadı.</p>
                ) : (
                  sessions.map((session) => {
                    const selectedRooms = [examForm.classroom, examForm.classroom2, examForm.classroom3].filter(Boolean)
                    const isSelectedRoomBusy = selectedRooms.length > 0 && exams.some(exam =>
                      exam.date === examForm.date &&
                      String(exam.sessionId) === String(session.id) &&
                      getExamRoomNames(exam).some((roomName) => selectedRooms.includes(roomName))
                    );
                    const isConflict = exams.some(exam =>
                      exam.date === examForm.date &&
                      String(exam.sessionId) === String(session.id) &&
                      selectedCourseDetails &&
                      String(exam.semester) === String(selectedCourseDetails.semester) &&
                      String(exam.departmentId) === String(selectedCourseDetails.departmentId)
                    );

                    const isSelected = String(examForm.sessionId) === String(session.id);
                    const isBlocked = isSelectedRoomBusy || isConflict;
                    const isLocked = !examForm.date;

                    return (
                      <div
                        key={session.id}
                        onClick={() => {
                          if (!isBlocked && !isLocked) {
                            setExamForm({ ...examForm, sessionId: String(session.id) })
                          }
                        }}
                        style={{
                          border: isSelected ? '2px solid #3498db' : isBlocked ? '2px solid #e74c3c' : '2px solid #bdc3c7',
                          backgroundColor: isSelected ? '#ebf5fb' : isBlocked ? '#fde8e8' : '#f8f9fa',
                          color: isBlocked ? '#c0392b' : '#2c3e50',
                          padding: '10px',
                          borderRadius: '6px',
                          textAlign: 'center',
                          cursor: isLocked ? 'not-allowed' : isBlocked ? 'not-allowed' : 'pointer',
                          opacity: isLocked ? 0.5 : isBlocked ? 0.65 : 1,
                          fontWeight: isSelected ? 'bold' : 'normal',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{fontSize:'13px', display:'block', marginBottom:'2px'}}>{session.name}</span>
                        <span style={{fontSize:'14px', fontWeight:'bold', display:'block'}}>{session.startTime} - {session.endTime}</span>
                        <span style={{
                          fontSize:'10px',
                          padding:'1px 5px',
                          borderRadius:'10px',
                          backgroundColor: isBlocked ? '#e74c3c' : '#2ecc71',
                          color:'white',
                          fontWeight:'600',
                          marginTop:'4px',
                          display:'inline-block'
                        }}>
                          {isSelectedRoomBusy ? 'Salon Dolu' : isConflict ? 'Çakışma Var' : 'Müsait'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              <small style={{color:'#7f8c8d', fontSize:'11px', marginTop:'2px'}}>
                {!examForm.date ? "Lütfen önce tarih seçiniz." : "Seçili salon doluysa veya dönem çakışması varsa oturum seçilemez."}
              </small>
            </div>

            <label>Öğrenci Sayısı<input type="number" min="1" required value={examForm.studentCount} onChange={(event) => setExamForm({ ...examForm, studentCount: Number(event.target.value) })} /></label>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Vazgeç</button><button type="submit" className="primary-button" disabled={busy || !examForm.sessionId || !examForm.classroom}>Kaydet</button></div>
          </form>
        </Modal>
      )}

      {modal === 'assignment' && (
        <Modal title="Gözetmen Ata" onClose={() => setModal(null)}>
          <form className="single-form" onSubmit={submitAssignment}>
            <label>Sınav<select required value={assignment.examId} onChange={(event) => setAssignment({ ...assignment, examId: event.target.value })}><option value="">Sınav seçin</option>{pendingExams.map((exam) => <option key={exam.id} value={exam.id}>{exam.courseCode} - {exam.date} - {exam.classroomName || exam.classroom}</option>)}</select></label>
            <label>Gözetmen<select required value={assignment.supervisorId} onChange={(event) => setAssignment({ ...assignment, supervisorId: event.target.value })}><option value="">Personel seçin</option>{supervisors.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
            {selectedAssignmentExam && (
              <div className="assignment-preview">
                <div className="assignment-preview-head">
                  <strong>Modül 3 Atama Havuzu</strong>
                  <span>{assignmentPreview.neededCount} gözetmen gerekli</span>
                </div>
                <p>
                  {assignmentPreview.usesCommonPool
                    ? 'Bölüm havuzu yeterli olmadığı için Mühendislik Fakültesi Ortak Havuzu otomatik listeye dahil edildi.'
                    : 'Bölüm havuzunda yeterli müsait gözetmen var; ortak havuz yedek olarak bekletiliyor.'}
                </p>
                <div className="candidate-list">
                  {assignmentPreview.candidates.slice(0, Math.max(assignmentPreview.neededCount + 2, 4)).map((person) => (
                    <div className="candidate-row" key={person.id}>
                      <span>{person.name}</span>
                      <small>{person.source} · {person.examCount} görev</small>
                    </div>
                  ))}
                </div>
                <small>Uygunluk kontrolü: aynı oturum çakışması, izin/danışmanlık ve 3 ardışık oturum sınırı.</small>
              </div>
            )}
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Vazgeç</button><button type="submit" className="primary-button" disabled={busy}>Atamayı Kaydet</button></div>
          </form>
        </Modal>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

function Dashboard({ dashboard = emptyDashboard, exams }) {
  const cards = [
    { label: 'Toplam Ders', value: dashboard.courseCount, note: 'Sisteme kayıtlı' },
    { label: 'Toplam Personel', value: dashboard.personnelCount, note: 'Gözetmen havuzu' },
    { label: 'Toplam Sınav', value: dashboard.examCount, note: 'Bu dönem planlanan' },
    { label: 'Atanan Sınav', value: dashboard.assignedCount, note: 'Gözetmeni belli olanlar' },
    { label: 'Salon Kullanımı', value: `${dashboard.roomUsage}%`, note: 'Sınıf doluluk oranı' },
    { label: 'Atama Bekleyen', value: dashboard.pendingCount, note: 'Gözetmen atanacaklar', warning: dashboard.pendingCount > 0 },
  ]

  return (
    <>
      <section className="stat-grid">
        {cards.map((card) => (
          <article className={`stat-card ${card.warning ? 'attention' : ''}`} key={card.label}>
            <p>{card.label}</p><strong>{card.value}</strong><small>{card.note}</small>
          </article>
        ))}
      </section>
      <section className="content-grid">
        <article className="panel">
          <div className="panel-heading"><div><h2>Yaklaşan Sınavlar</h2><p>Ders kaydından oluşturulan programlar</p></div></div>
          <ExamTable exams={exams.slice(0, 3)} compact />
        </article>
        <article className="panel timeline">
          <div className="panel-heading"><div><h2>Sistem Akışı</h2><p>Gerçek kullanım sırası</p></div></div>
          <div className="check-item done"><span />Ders kayıtları oluşturulur</div>
          <div className="check-item done"><span />Personel havuzu hazırlanır</div>
          <div className="check-item done"><span />Sınav, kayıtlı dersten seçilerek açılır</div>
          <div className="check-item"><span />Gözetmen ataması yapılır</div>
        </article>
      </section>
    </>
  )
}

function CourseList({ courses, onAdd }) {
  // Hangi bölümlerin akordeon menüsünün açık olduğunu tutan state
  const [openSections, setOpenSections] = useState({});

  // 1. Gelen tüm ders havuzunu JavaScript reduce ile bölüm isimlerine göre grupluyoruz
  const groupedCourses = useMemo(() => {
    return courses.reduce((acc, course) => {
      // Eğer dersin bir bölüm tanımı yoksa 'Genel / Diğer Bölümler' başlığı altında topla
      const key = course.department || 'Genel / Diğer Bölümler';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(course);
      return acc;
    }, {});
  }, [courses]);

  // İlk veri yüklendiğinde tüm kategorilerin varsayılan olarak açık gelmesini sağlıyoruz
  useEffect(() => {
    if (Object.keys(groupedCourses).length > 0) {
      const initialOpenState = {};
      Object.keys(groupedCourses).forEach((key) => {
        initialOpenState[key] = true;
      });
      setOpenSections(initialOpenState);
    }
  }, [groupedCourses]);

  // Kategoriyi açıp kapatma fonksiyonu
  const toggleSection = (sectionName) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  return (
    <article className="panel page-panel">
      <div className="panel-heading">
        <div>
          <h2>Bölümlere Göre Ders Kayıtları</h2>
          <p>Sistemdeki ders havuzunun bölümlere göre kırılımı ve kontenjanları.</p>
        </div>
        <button className="primary-button" type="button" onClick={onAdd}>
          + Ders Ekle
        </button>
      </div>

      {!courses.length ? (
        <EmptyState text="Henüz ders kaydı bulunmuyor." />
      ) : (
        <div className="category-accordion-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
          {Object.entries(groupedCourses).map(([departmentName, departmentCourses]) => {
            const isOpen = openSections[departmentName];

            return (
              <div
                key={departmentName}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                {/* Akordeon Kategori Başlığı */}
                <div
                  onClick={() => toggleSection(departmentName)}
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: '14px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none',
                    borderBottom: isOpen ? '1px solid #e2e8f0' : 'none',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{isOpen ? '▾' : '▸'}</span>
                    {departmentName}
                    <span style={{ fontWeight: 'normal', fontSize: '12px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                      {departmentCourses.length} Ders
                    </span>
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    {isOpen ? '▲ Gizle' : '▼ Göster'}
                  </span>
                </div>

                {/* Bölüme Ait Tablo Alanı */}
                {isOpen && (
                  <div className="table-wrapper" style={{ padding: '0px', margin: '0' }}>
                    <table style={{ margin: '0', width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ paddingLeft: '20px' }}>Kod</th>
                          <th>Ders Adı</th>
                          <th>Yarıyıl</th>
                          <th style={{ paddingRight: '20px', textAlign: 'right' }}>Öğrenci Sayısı</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(
                          departmentCourses.reduce((acc, course) => {
                            const semester = course.semester || 'Belirsiz';
                            if (!acc[semester]) acc[semester] = [];
                            acc[semester].push(course);
                            return acc;
                          }, {})
                        )
                          .sort(([firstSemester], [secondSemester]) => Number(firstSemester) - Number(secondSemester))
                          .flatMap(([semester, semesterCourses]) => [
                            <tr className="semester-group-row" key={`${departmentName}-${semester}`}>
                              <td colSpan="4">{semester}. Yarıyıl - {semesterCourses.length} ders</td>
                            </tr>,
                            ...semesterCourses.map((course) => (
                              <tr key={course.id}>
                                <td style={{ paddingLeft: '20px' }}>
                                  <strong style={{ color: '#2563eb' }}>{course.code}</strong>
                                </td>
                                <td>{course.name}</td>
                                <td>{course.semester}. Yarıyıl</td>
                                <td style={{ paddingRight: '20px', textAlign: 'right', fontWeight: '500' }}>
                                  {course.studentCount}
                                </td>
                              </tr>
                            )),
                          ])}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function PersonnelList({ supervisors, onAdd }) {
  return (
    <article className="panel page-panel">
      <div className="panel-heading"><div><h2>Personel Kayıtları</h2><p>Gözetmen atamasında kullanılacak personel havuzu.</p></div><button className="primary-button" type="button" onClick={onAdd}>+ Personel Ekle</button></div>
      <PersonnelCards supervisors={supervisors} />
    </article>
  )
}

function PersonnelCards({ supervisors }) {
  if (!supervisors.length) return <EmptyState text="Henüz personel kaydı bulunmuyor." />
  return (
    <div className="supervisor-grid">
      {supervisors.map((person) => (
        <div className="person-card" key={person.id}>
          <div className="avatar">{person.name.split(' ').slice(-1)[0]?.[0] ?? 'P'}</div>
          <div className="person-info"><strong>{person.name}</strong><small>{person.title} · {person.department}</small></div>
          <div className="person-load"><strong>{person.examCount}</strong><small>Sınav</small></div>
          <StatusBadge value={person.availability} />
        </div>
      ))}
    </div>
  )
}

function ExamTable({ exams, compact = false }) {
  if (!exams.length) return <EmptyState text="Henüz sınav kaydı bulunmuyor." />
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Ders</th>
            <th>Tarih</th>
            {!compact && <th>Yarıyıl</th>}
            <th>Salon</th>
            {!compact && <th>Öğrenci</th>}
            <th>Gözetmen</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {exams.map((exam) => (
            <tr key={exam.id}>
              <td><strong>{exam.courseCode}</strong><small>{exam.courseName}</small></td>
              <td>{exam.date}</td>
              {!compact && <td>{exam.semester ? String(exam.semester) + '. Yarıyıl' : '-'}</td>}
              <td>{exam.classroomName || exam.classroom}</td>
              {!compact && <td>{exam.studentCount}</td>}
              <td>{exam.supervisor}</td>
              <td><StatusBadge value={exam.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ExamSchedule({ exams, departments, selectedDepartment, selectedSemester, onDepartmentChange, onSemesterChange, onAdd, disabled }) {
  return (
    <article className="panel page-panel">
      <div className="panel-heading"><div><h2>Sınav Programı</h2><p>Bölüm ve yarıyıl seçerek programı filtreleyebilirsin.</p></div><button className="primary-button" type="button" disabled={disabled} onClick={onAdd}>+ Yeni Sınav</button></div>
      <div className="filter-bar">
        <label>Bölüm<select value={selectedDepartment} onChange={(event) => onDepartmentChange(event.target.value)}><option value="">Tüm bölümler</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
        <label>Yarıyıl<select value={selectedSemester} onChange={(event) => onSemesterChange(event.target.value)}><option value="">Tüm yarıyıllar</option>{[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => <option key={semester} value={semester}>{semester}. Yarıyıl</option>)}</select></label>
        <div className="filter-summary"><strong>{exams.length}</strong><span>sınav listeleniyor</span></div>
      </div>
      <ExamTable exams={exams} />
    </article>
  )
}

function CapacityList({ capacities }) {
  return (
    <section className="capacity-grid">
      {capacities.map((room) => {
        const ratio = Math.round((room.assigned / room.capacity) * 100)
        return <article className="room-card" key={room.id}><div className="room-title"><div><h2>{room.classroom}</h2><p>{room.building}</p></div><strong>%{ratio}</strong></div><div className="progress"><span style={{ width: `${ratio}%` }} /></div><div className="room-meta"><span>{room.assigned} öğrenci</span><span>{room.capacity} kapasite</span></div></article>
      })}
    </section>
  )
}

function CapacityPlanner({ courses, sessions, form, selectedCourse, plan, onChange }) {
  const selectedRoomNames = plan.selected.map((room) => room.classroom).join(' ve ')
  const firstFloor = plan.selected[0]?.floor

  return (
    <article className="panel page-panel">
      <div className="panel-heading">
        <div>
          <h2>Modül 2: Akıllı Salon Hesaplama</h2>
          <p>Ders kontenjanına göre en verimli sınav-salon kombinasyonunu hesaplar ve aynı katı önceliklendirir.</p>
        </div>
      </div>

      <div className="planner-layout">
        <section className="planner-form">
          <label>
            Ders
            <select value={form.courseId} onChange={(event) => {
              const course = courses.find((item) => String(item.id) === event.target.value)
              onChange({
                ...form,
                courseId: event.target.value,
                studentCount: Number(course?.studentCount || form.studentCount),
              })
            }}>
              <option value="">Ders seçin</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.code} - {course.name}</option>)}
            </select>
          </label>
          <label>
            Kontenjan
            <input type="number" min="1" value={form.studentCount} onChange={(event) => onChange({ ...form, studentCount: Number(event.target.value) })} />
          </label>
          <label>
            Tarih
            <input type="date" value={form.date} onChange={(event) => onChange({ ...form, date: event.target.value })} />
          </label>
          <label>
            Oturum
            <select value={form.sessionId} onChange={(event) => onChange({ ...form, sessionId: event.target.value })}>
              <option value="">Tüm boş salonlar</option>
              {sessions.map((session) => <option key={session.id} value={session.id}>{session.name} ({session.startTime} - {session.endTime})</option>)}
            </select>
          </label>
        </section>

        <section className="planner-result">
          <div className="planner-summary">
            <span>{selectedCourse?.code || 'Ders'}</span>
            <strong>{Number(form.studentCount || 0)} kişi</strong>
            <small>{plan.totalCapacity} toplam kapasite · {plan.supervisorCount} gözetmen</small>
          </div>

          {plan.steps.length ? (
            <>
              <div className="planner-steps">
                {plan.steps.map((step, index) => (
                  <div className="planner-step" key={`${step.room}-${index}`}>
                    <span>Adım {index + 1}</span>
                    <strong>{step.title} → {step.room} (Kapasite {step.capacity})</strong>
                    <small>Kalan: {step.remainingAfter}</small>
                  </div>
                ))}
              </div>
              <div className={`planner-final ${plan.isEnough ? 'success' : 'warning'}`}>
                {plan.isEnough
                  ? `Sonuç: Bu sınav için ${selectedRoomNames} ayrılabilir. Gerekli Gözetmen Sayısı: ${plan.supervisorCount}. ${plan.sameFloor ? `Salonlar ${formatFloor(firstFloor)} içinde tutuldu.` : 'Aynı katta yeterli kapasite olmadığı için en yakın kombinasyon seçildi.'}`
                  : `Uyarı: Müsait salonlar ${Number(form.studentCount || 0)} kişilik kontenjan için yetersiz. Kalan: ${plan.remaining}.`}
              </div>
            </>
          ) : (
            <EmptyState text="Hesaplama için kapasite bilgisi bulunamadı." />
          )}
        </section>
      </div>
    </article>
  )
}

function SupervisorList({ supervisors, exams, pendingExams, onAssign }) {
  const assignedExams = exams.filter((exam) => exam.supervisor !== 'Atama Bekliyor')
  return (
    <article className="panel page-panel">
      <div className="panel-heading"><div><h2>Gözetmen Atama</h2><p>{pendingExams.length} sınav için atama bekleniyor.</p></div><button type="button" className="primary-button" disabled={!pendingExams.length || !supervisors.length} onClick={onAssign}>Gözetmen Ata</button></div>
      <div className="assignment-rule-grid">
        <div className="assignment-rule-card">
          <small>Havuz Sistemi</small>
          <strong>Bölüm + Ortak Havuz</strong>
          <span>Önce dersin bölümündeki müsait gözetmenler seçilir; sayı yetmezse Mühendislik Fakültesi Ortak Havuzu otomatik eklenir.</span>
        </div>
        <div className="assignment-rule-card">
          <small>Oturum Kontrolü</small>
          <strong>Günde max 4, ardışık max 3</strong>
          <span>1-2-3 görevli olan kişi 4. oturuma yazılmaz; zincir kırıldığı için 5. oturuma tekrar uygun olabilir.</span>
        </div>
        <div className="assignment-rule-card">
          <small>Adil Dağıtım</small>
          <strong>Görev yükü sıralaması</strong>
          <span>Adaylar mevcut görev sayılarına göre sıralanır; düşük yükteki gözetmenler önce önerilir.</span>
        </div>
      </div>
      <PersonnelCards supervisors={supervisors} />
      <div className="assignment-section"><h3>Gözetmenli Sınav Programı</h3><ExamTable exams={assignedExams} compact /></div>
    </article>
  )
}

function ReportList({ reports }) {
  if (!reports.length) return <EmptyState text="Henüz raporlanacak sınav kaydı bulunmuyor." />
  return (
    <article className="panel page-panel">
      <div className="panel-heading"><div><h2>Sınav Programı Raporu</h2><p>Ders, oturum, salon, kapasite ve gözetmen çıktısı.</p></div></div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ders</th>
              <th>Bölüm</th>
              <th>Yarıyıl</th>
              <th>Tarih</th>
              <th>Oturum</th>
              <th>Salon</th>
              <th>Kapasite</th>
              <th>Gözetmen</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report, index) => (
              <tr key={`${report.courseCode}-${report.date}-${report.classroom}-${index}`}>
                <td><strong>{report.courseCode}</strong><br />{report.courseName}</td>
                <td>{report.department}</td>
                <td>{report.semester}</td>
                <td>{report.date}</td>
                <td>{report.session}</td>
                <td>{report.classroom}</td>
                <td>{report.studentCount} / {report.capacity}</td>
                <td>{report.supervisor}</td>
                <td><StatusBadge value={report.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}

function RequirementList({ requirements }) {
  return (
    <article className="panel page-panel">
      <div className="panel-heading"><div><h2>Kural ve Teknik Kontrol</h2><p>Sınav planlama, salon, gözetmen ve veritabanı kuralları uygulama tarafında takip edilir.</p></div></div>
      <div className="requirement-grid">
        {requirements.map((requirement) => (
          <div className="requirement-card" key={requirement.group + requirement.item}>
            <small>{requirement.group}</small>
            <strong>{requirement.item}</strong>
            <StatusBadge value={requirement.status} />
          </div>
        ))}
      </div>
    </article>
  )
}

function LogList({ logs, onBackup, busy }) {
  return (
    <article className="panel page-panel">
      <div className="panel-heading"><div><h2>Log Kayıtları</h2><p>Sistem işlemleri ve yedekleme geçmişi.</p></div><button type="button" className="secondary-button" disabled={busy} onClick={onBackup}>Backup Procedure Çalıştır</button></div>
      <div className="log-list">{logs.map((log) => <div className="log-row" key={log.id}><time>{log.time}</time><strong>{log.action}</strong><span>{log.detail}</span><StatusBadge value={log.level} /></div>)}</div>
    </article>
  )
}

export default App

