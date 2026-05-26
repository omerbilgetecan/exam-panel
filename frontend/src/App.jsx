import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { api } from './services/api'

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'exams', label: 'Sınav Programı', icon: '◫' },
  { id: 'capacity', label: 'Kapasite', icon: '▥' },
  { id: 'supervisors', label: 'Gözetmenler', icon: '◎' },
  { id: 'logs', label: 'Log Kayıtları', icon: '≡' },
]

const initialExamForm = {
  courseCode: '',
  courseName: '',
  date: '2026-06-05',
  time: '09:30',
  classroom: 'A-201',
  studentCount: 30,
}

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
  const [dashboard, setDashboard] = useState(null)
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
  const [assignment, setAssignment] = useState({ examId: '', supervisorId: '' })

  const pendingExams = useMemo(
    () => exams.filter((exam) => exam.supervisor === 'Atama Bekliyor'),
    [exams],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [nextDashboard, nextExams, nextCapacities, nextSupervisors, nextLogs] =
        await Promise.all([
          api.getDashboard(),
          api.getExams(),
          api.getCapacities(),
          api.getSupervisors(),
          api.getLogs(),
        ])
      setDashboard(nextDashboard)
      setExams(nextExams)
      setCapacities(nextCapacities)
      setSupervisors(nextSupervisors)
      setLogs(nextLogs)
    } catch {
      setToast('API bağlantısı kurulamadı. Demo modu ile devam edebilirsin.')
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

  async function submitExam(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await api.createExam(examForm)
      setModal(null)
      setExamForm(initialExamForm)
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
            <button
              className={page === entry.id ? 'active' : ''}
              type="button"
              key={entry.id}
              onClick={() => setPage(entry.id)}
            >
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
            <button type="button" className="primary-button" onClick={() => setModal('exam')}>
              + Sınav Ekle
            </button>
          </div>
        </header>

        {loading ? (
          <div className="loading-panel">Veriler yükleniyor...</div>
        ) : (
          <>
            {page === 'dashboard' && <Dashboard dashboard={dashboard} exams={exams} />}
            {page === 'exams' && <ExamSchedule exams={exams} onAdd={() => setModal('exam')} />}
            {page === 'capacity' && <CapacityList capacities={capacities} />}
            {page === 'supervisors' && (
              <SupervisorList
                supervisors={supervisors}
                exams={exams}
                pendingExams={pendingExams}
                onAssign={() => setModal('assignment')}
              />
            )}
            {page === 'logs' && <LogList logs={logs} onBackup={runBackup} busy={busy} />}
          </>
        )}
      </main>

      {modal === 'exam' && (
        <Modal title="Yeni Sınav Ekle" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={submitExam}>
            <label>
              Ders Kodu
              <input required value={examForm.courseCode} onChange={(event) => setExamForm({ ...examForm, courseCode: event.target.value })} placeholder="BLM401" />
            </label>
            <label>
              Ders Adı
              <input required value={examForm.courseName} onChange={(event) => setExamForm({ ...examForm, courseName: event.target.value })} placeholder="Yapay Zeka" />
            </label>
            <label>
              Tarih
              <input type="date" required value={examForm.date} onChange={(event) => setExamForm({ ...examForm, date: event.target.value })} />
            </label>
            <label>
              Saat
              <input type="time" required value={examForm.time} onChange={(event) => setExamForm({ ...examForm, time: event.target.value })} />
            </label>
            <label>
              Salon
              <select value={examForm.classroom} onChange={(event) => setExamForm({ ...examForm, classroom: event.target.value })}>
                {capacities.map((room) => <option key={room.id}>{room.classroom}</option>)}
              </select>
            </label>
            <label>
              Öğrenci Sayısı
              <input type="number" min="1" required value={examForm.studentCount} onChange={(event) => setExamForm({ ...examForm, studentCount: event.target.value })} />
            </label>
            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(null)}>Vazgeç</button>
              <button type="submit" className="primary-button" disabled={busy}>Kaydet</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'assignment' && (
        <Modal title="Gözetmen Ata" onClose={() => setModal(null)}>
          <form className="single-form" onSubmit={submitAssignment}>
            <label>
              Atama Bekleyen Sınav
              <select required value={assignment.examId} onChange={(event) => setAssignment({ ...assignment, examId: event.target.value })}>
                <option value="">Sınav seçin</option>
                {pendingExams.map((exam) => <option key={exam.id} value={exam.id}>{exam.courseCode} - {exam.courseName}</option>)}
              </select>
            </label>
            <label>
              Gözetmen
              <select required value={assignment.supervisorId} onChange={(event) => setAssignment({ ...assignment, supervisorId: event.target.value })}>
                <option value="">Gözetmen seçin</option>
                {supervisors.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
              </select>
            </label>
            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(null)}>Vazgeç</button>
              <button type="submit" className="primary-button" disabled={busy}>Atamayı Kaydet</button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

function Dashboard({ dashboard, exams }) {
  const cards = [
    { label: 'Toplam Sınav', value: dashboard.examCount, note: 'Bu dönem planlanan' },
    { label: 'Gözetmen Atandı', value: dashboard.assignedCount, note: 'Hazır sınav' },
    { label: 'Salon Doluluk', value: `%${dashboard.roomUsage}`, note: 'Ortalama kullanım' },
    { label: 'Bekleyen Atama', value: dashboard.pendingCount, note: 'İşlem gerekli', warning: true },
  ]

  return (
    <>
      <section className="stat-grid">
        {cards.map((card) => (
          <article className={`stat-card ${card.warning ? 'attention' : ''}`} key={card.label}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <small>{card.note}</small>
          </article>
        ))}
      </section>
      <section className="content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Yaklaşan Sınavlar</h2>
              <p>En yakın program kayıtları</p>
            </div>
          </div>
          <ExamTable exams={exams.slice(0, 3)} compact />
        </article>
        <article className="panel timeline">
          <div className="panel-heading">
            <div>
              <h2>Sunum Durumu</h2>
              <p>Backend entegrasyon adımları</p>
            </div>
          </div>
          <div className="check-item done"><span />REST ekran tasarımı hazır</div>
          <div className="check-item done"><span />Listeleme ve form akışı hazır</div>
          <div className="check-item"><span />Spring Boot endpoint bağlantısı</div>
          <div className="endpoint">
            <small>API Base URL</small>
            <code>http://localhost:8080/api</code>
          </div>
        </article>
      </section>
    </>
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
            <th>Tarih / Saat</th>
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
              <td>{exam.date}<small>{exam.time}</small></td>
              <td>{exam.classroom}</td>
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

function ExamSchedule({ exams, onAdd }) {
  return (
    <article className="panel page-panel">
      <div className="panel-heading">
        <div><h2>Sınav Programı</h2><p>Ders, salon ve gözetmen bilgilerini görüntüle.</p></div>
        <button className="primary-button" type="button" onClick={onAdd}>+ Yeni Sınav</button>
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
        return (
          <article className="room-card" key={room.id}>
            <div className="room-title"><div><h2>{room.classroom}</h2><p>{room.building}</p></div><strong>%{ratio}</strong></div>
            <div className="progress"><span style={{ width: `${ratio}%` }} /></div>
            <div className="room-meta"><span>{room.assigned} öğrenci</span><span>{room.capacity} kapasite</span></div>
          </article>
        )
      })}
    </section>
  )
}

function SupervisorList({ supervisors, exams, pendingExams, onAssign }) {
  const assignedExams = exams.filter((exam) => exam.supervisor !== 'Atama Bekliyor')

  return (
    <article className="panel page-panel">
      <div className="panel-heading">
        <div><h2>Gözetmenli Program</h2><p>{pendingExams.length} sınav için atama bekleniyor.</p></div>
        <button type="button" className="primary-button" disabled={!pendingExams.length} onClick={onAssign}>Gözetmen Ata</button>
      </div>
      <div className="supervisor-grid">
        {supervisors.map((person) => (
          <div className="person-card" key={person.id}>
            <div className="avatar">{person.name.split(' ').slice(-1)[0][0]}</div>
            <div className="person-info"><strong>{person.name}</strong><small>{person.department}</small></div>
            <div className="person-load"><strong>{person.examCount}</strong><small>Sınav</small></div>
            <StatusBadge value={person.availability} />
          </div>
        ))}
      </div>
      <div className="assignment-section">
        <h3>Gözetmenli Sınav Programı</h3>
        <ExamTable exams={assignedExams} compact />
      </div>
    </article>
  )
}

function LogList({ logs, onBackup, busy }) {
  return (
    <article className="panel page-panel">
      <div className="panel-heading">
        <div><h2>Log Kayıtları</h2><p>Sistem işlemleri ve yedekleme geçmişi.</p></div>
        <button type="button" className="secondary-button" disabled={busy} onClick={onBackup}>Backup Procedure Çalıştır</button>
      </div>
      <div className="log-list">
        {logs.map((log) => (
          <div className="log-row" key={log.id}>
            <time>{log.time}</time>
            <strong>{log.action}</strong>
            <span>{log.detail}</span>
            <StatusBadge value={log.level} />
          </div>
        ))}
      </div>
    </article>
  )
}

export default App
