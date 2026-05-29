import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { api } from './services/api'

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'courses', label: 'Dersler', icon: '▤' },
  { id: 'personnel', label: 'Personel', icon: '◉' },
  { id: 'exams', label: 'Sınav Programı', icon: '◫' },
  { id: 'capacity', label: 'Kapasite', icon: '▥' },
  { id: 'supervisors', label: 'Gözetmen Atama', icon: '◎' },
  { id: 'logs', label: 'Log Kayıtları', icon: '≡' },
]

const emptyDashboard = { examCount: 0, assignedCount: 0, roomUsage: 0, pendingCount: 0, courseCount: 0, personnelCount: 0 }
const initialExamForm = { courseId: '', date: '2026-06-05', time: '09:30', classroom: '', studentCount: 30 }
const initialCourseForm = { code: '', name: '', department: '', semester: 'Bahar', studentCount: 30 }
const initialPersonForm = { name: '', department: '', title: 'Arş. Gör.', availability: 'Uygun' }

function StatusBadge({ value }) {
  const variant =
    value === 'Planlandı' || value === 'Başarılı' || value === 'Uygun'
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
        {children}
      </section>
    </div>
  )
}

function App() {
  const [page, setPage] = useState('dashboard')
  const [dashboard, setDashboard] = useState(emptyDashboard)
  const [courses, setCourses] = useState([])
  const [exams, setExams] = useState([])
  const [capacities, setCapacities] = useState([])
  const [supervisors, setSupervisors] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [demoMode, setDemoMode] = useState(api.isDemoMode())
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const [examForm, setExamForm] = useState(initialExamForm)
  const [courseForm, setCourseForm] = useState(initialCourseForm)
  const [personForm, setPersonForm] = useState(initialPersonForm)
  const [assignment, setAssignment] = useState({ examId: '', supervisorId: '' })

  const pendingExams = useMemo(
    () => exams.filter((exam) => exam.supervisor === 'Atama Bekliyor'),
    [exams],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [nextDashboard, nextCourses, nextExams, nextCapacities, nextSupervisors, nextLogs] =
        await Promise.all([
          api.getDashboard(),
          api.getCourses().catch(() => []),
          api.getExams().catch(() => []),
          api.getCapacities().catch(() => []),
          api.getSupervisors().catch(() => []),
          api.getLogs().catch(() => []),
        ])
      setDashboard(nextDashboard ?? emptyDashboard)
      setCourses(nextCourses)
      setExams(nextExams)
      setCapacities(nextCapacities)
      setSupervisors(nextSupervisors)
      setLogs(nextLogs)
    } catch {
      setToast('API bağlantısı kurulamadı. Demo modu ile devam edebilirsin.')
      api.setDemoMode(true)
      setDemoMode(true)
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

  function switchMode() {
    const nextMode = !demoMode
    api.setDemoMode(nextMode)
    setDemoMode(nextMode)
    setToast(nextMode ? 'Demo veri modu aktif.' : 'REST API modu aktif.')
  }

  function openExamModal() {
    setExamForm({
      ...initialExamForm,
      courseId: courses[0]?.id ? String(courses[0].id) : '',
      classroom: capacities[0]?.classroom ?? '',
      studentCount: courses[0]?.studentCount ?? 30,
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

  async function submitExam(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await api.createExam(examForm)
      setModal(null)
      setToast('Yeni sınav programa eklendi.')
      await loadData()
      setPage('exams')
    } catch (error) {
      setToast(error.message)
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
            <button type="button" className="mode-button" onClick={switchMode}>
              {demoMode ? 'API Moduna Geç' : 'Demo Veriye Geç'}
            </button>
            <button type="button" className="secondary-button" disabled={busy} onClick={runBackup}>
              Backup Al
            </button>
            <button type="button" className="secondary-button" onClick={() => setModal('course')}>
              + Ders
            </button>
            <button type="button" className="secondary-button" onClick={() => setModal('person')}>
              + Personel
            </button>
            <button type="button" className="primary-button" disabled={!courses.length} onClick={openExamModal}>
              + Sınav
            </button>
          </div>
        </header>

        {loading ? (
          <div className="loading-panel">Veriler yükleniyor...</div>
        ) : (
          <>
            {page === 'dashboard' && <Dashboard dashboard={dashboard} exams={exams} />}
            {page === 'courses' && <CourseList courses={courses} onAdd={() => setModal('course')} />}
            {page === 'personnel' && <PersonnelList supervisors={supervisors} onAdd={() => setModal('person')} />}
            {page === 'exams' && <ExamSchedule exams={exams} onAdd={openExamModal} disabled={!courses.length} />}
            {page === 'capacity' && <CapacityList capacities={capacities} />}
            {page === 'supervisors' && (
              <SupervisorList supervisors={supervisors} exams={exams} pendingExams={pendingExams} onAssign={() => setModal('assignment')} />
            )}
            {page === 'logs' && <LogList logs={logs} onBackup={runBackup} busy={busy} />}
          </>
        )}
      </main>

      {modal === 'course' && (
        <Modal title="Ders Kaydı Ekle" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={submitCourse}>
            <label>Ders Kodu<input required value={courseForm.code} onChange={(event) => setCourseForm({ ...courseForm, code: event.target.value.toUpperCase() })} placeholder="BLM401" /></label>
            <label>Ders Adı<input required value={courseForm.name} onChange={(event) => setCourseForm({ ...courseForm, name: event.target.value })} placeholder="Yapay Zeka" /></label>
            <label>Bölüm<input required value={courseForm.department} onChange={(event) => setCourseForm({ ...courseForm, department: event.target.value })} placeholder="Bilgisayar Müh." /></label>
            <label>Dönem<select value={courseForm.semester} onChange={(event) => setCourseForm({ ...courseForm, semester: event.target.value })}><option>Güz</option><option>Bahar</option><option>Yaz</option></select></label>
            <label>Öğrenci Sayısı<input type="number" min="1" required value={courseForm.studentCount} onChange={(event) => setCourseForm({ ...courseForm, studentCount: event.target.value })} /></label>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Vazgeç</button><button type="submit" className="primary-button" disabled={busy}>Kaydet</button></div>
          </form>
        </Modal>
      )}

      {modal === 'person' && (
        <Modal title="Personel Kaydı Ekle" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={submitPerson}>
            <label>Ad Soyad<input required value={personForm.name} onChange={(event) => setPersonForm({ ...personForm, name: event.target.value })} placeholder="Dr. Ayşe Demir" /></label>
            <label>Unvan<select value={personForm.title} onChange={(event) => setPersonForm({ ...personForm, title: event.target.value })}><option>Prof. Dr.</option><option>Doç. Dr.</option><option>Dr.</option><option>Arş. Gör.</option><option>Öğr. Gör.</option></select></label>
            <label>Bölüm<input required value={personForm.department} onChange={(event) => setPersonForm({ ...personForm, department: event.target.value })} placeholder="Matematik" /></label>
            <label>Durum<select value={personForm.availability} onChange={(event) => setPersonForm({ ...personForm, availability: event.target.value })}><option>Uygun</option><option>Yoğun</option><option>İzinli</option></select></label>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Vazgeç</button><button type="submit" className="primary-button" disabled={busy}>Kaydet</button></div>
          </form>
        </Modal>
      )}

      {modal === 'exam' && (
        <Modal title="Yeni Sınav Oluştur" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={submitExam}>
            <label>
              Ders
              <select required value={examForm.courseId} onChange={(event) => {
                const selected = courses.find((course) => String(course.id) === event.target.value)
                setExamForm({ ...examForm, courseId: event.target.value, studentCount: selected?.studentCount ?? examForm.studentCount })
              }}>
                <option value="">Ders seçin</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.code} - {course.name}</option>)}
              </select>
            </label>
            <label>Tarih<input type="date" required value={examForm.date} onChange={(event) => setExamForm({ ...examForm, date: event.target.value })} /></label>
            <label>Saat<input type="time" required value={examForm.time} onChange={(event) => setExamForm({ ...examForm, time: event.target.value })} /></label>
            <label>Salon<select required value={examForm.classroom} onChange={(event) => setExamForm({ ...examForm, classroom: event.target.value })}>{capacities.map((room) => <option key={room.id}>{room.classroom}</option>)}</select></label>
            <label>Öğrenci Sayısı<input type="number" min="1" required value={examForm.studentCount} onChange={(event) => setExamForm({ ...examForm, studentCount: event.target.value })} /></label>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Vazgeç</button><button type="submit" className="primary-button" disabled={busy}>Kaydet</button></div>
          </form>
        </Modal>
      )}

      {modal === 'assignment' && (
        <Modal title="Gözetmen Ata" onClose={() => setModal(null)}>
          <form className="single-form" onSubmit={submitAssignment}>
            <label>Atama Bekleyen Sınav<select required value={assignment.examId} onChange={(event) => setAssignment({ ...assignment, examId: event.target.value })}><option value="">Sınav seçin</option>{pendingExams.map((exam) => <option key={exam.id} value={exam.id}>{exam.courseCode} - {exam.courseName}</option>)}</select></label>
            <label>Gözetmen<select required value={assignment.supervisorId} onChange={(event) => setAssignment({ ...assignment, supervisorId: event.target.value })}><option value="">Personel seçin</option>{supervisors.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
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
    { label: 'Bekleyen Atama', value: dashboard.pendingCount, note: 'İşlem gerekli', warning: true },
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
  return (
    <article className="panel page-panel">
      <div className="panel-heading"><div><h2>Ders Kayıtları</h2><p>Sınav oluştururken seçilecek ders havuzu.</p></div><button className="primary-button" type="button" onClick={onAdd}>+ Ders Ekle</button></div>
      {!courses.length ? <EmptyState text="Henüz ders kaydı bulunmuyor." /> : (
        <div className="table-wrapper"><table><thead><tr><th>Kod</th><th>Ders</th><th>Bölüm</th><th>Dönem</th><th>Öğrenci</th></tr></thead><tbody>{courses.map((course) => <tr key={course.id}><td><strong>{course.code}</strong></td><td>{course.name}</td><td>{course.department}</td><td>{course.semester}</td><td>{course.studentCount}</td></tr>)}</tbody></table></div>
      )}
    </article>
  )
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
    <div className="table-wrapper"><table><thead><tr><th>Ders</th><th>Tarih / Saat</th><th>Salon</th>{!compact && <th>Öğrenci</th>}<th>Gözetmen</th><th>Durum</th></tr></thead><tbody>{exams.map((exam) => <tr key={exam.id}><td><strong>{exam.courseCode}</strong><small>{exam.courseName}</small></td><td>{exam.date}<small>{exam.time}</small></td><td>{exam.classroom}</td>{!compact && <td>{exam.studentCount}</td>}<td>{exam.supervisor}</td><td><StatusBadge value={exam.status} /></td></tr>)}</tbody></table></div>
  )
}

function ExamSchedule({ exams, onAdd, disabled }) {
  return (
    <article className="panel page-panel">
      <div className="panel-heading"><div><h2>Sınav Programı</h2><p>Sınavlar artık kayıtlı derslerden oluşturulur.</p></div><button className="primary-button" type="button" disabled={disabled} onClick={onAdd}>+ Yeni Sınav</button></div>
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

function SupervisorList({ supervisors, exams, pendingExams, onAssign }) {
  const assignedExams = exams.filter((exam) => exam.supervisor !== 'Atama Bekliyor')
  return (
    <article className="panel page-panel">
      <div className="panel-heading"><div><h2>Gözetmen Atama</h2><p>{pendingExams.length} sınav için atama bekleniyor.</p></div><button type="button" className="primary-button" disabled={!pendingExams.length || !supervisors.length} onClick={onAssign}>Gözetmen Ata</button></div>
      <PersonnelCards supervisors={supervisors} />
      <div className="assignment-section"><h3>Gözetmenli Sınav Programı</h3><ExamTable exams={assignedExams} compact /></div>
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
