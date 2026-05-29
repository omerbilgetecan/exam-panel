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
const initialClassroomForm = { classroomName: '', capacity: 60, classroomType: 'Sınıf', floor: 0 };
const emptyDashboard = { examCount: 0, assignedCount: 0, roomUsage: 0, pendingCount: 0, courseCount: 0, personnelCount: 0 }
const initialExamForm = { courseId: '', date: '2026-06-05', sessionId: '', classroom: '', studentCount: 30 }
const initialCourseForm = { code: '', name: '', departmentId: '', semester: 1, studentCount: 30 }
const initialPersonForm = { name: '', department: '', title: 'Arş. Gör.', availability: 'Uygun' }
const initialDepartmentForm = { name: '' }
const initialSessionForm = { name: '', startTime: '', endTime: '' }

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
  const [departments, setDepartments] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [demoMode, setDemoMode] = useState(api.isDemoMode())
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const [errorText, setErrorText] = useState('')

  const [classroomForm, setClassroomForm] = useState(initialClassroomForm);
  const [examForm, setExamForm] = useState(initialExamForm)
  const [courseForm, setCourseForm] = useState(initialCourseForm)
  const [personForm, setPersonForm] = useState(initialPersonForm)
  const [departmentForm, setDepartmentForm] = useState(initialDepartmentForm)
  const [sessionForm, setSessionForm] = useState(initialSessionForm)
  const [assignment, setAssignment] = useState({ examId: '', supervisorId: '' })

  const pendingExams = useMemo(
    () => exams.filter((exam) => exam.supervisor === 'Atama Bekliyor'),
    [exams],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [nextDashboard, nextCourses, nextExams, nextCapacities, nextSupervisors, nextLogs, nextDepartments, nextSessions] =
        await Promise.all([
          api.getDashboard(),
          api.getCourses(),
          api.getExams(),
          api.getCapacities(),
          api.getSupervisors(),
          api.getLogs(),
          api.getDepartments(),
          api.getSessions ? api.getSessions() : Promise.resolve([]),
        ])
      setDashboard(nextDashboard ?? emptyDashboard)
      setCourses(nextCourses)
      setExams(nextExams)
      setCapacities(nextCapacities)
      setSupervisors(nextSupervisors)
      setLogs(nextLogs)
      setDepartments(nextDepartments)
      setSessions(nextSessions ?? [])
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

  function openExamModal() {
    setErrorText('')
    setExamForm({
      ...initialExamForm,
      courseId: courses[0]?.id ? String(courses[0].id) : '',
      classroom: capacities[0]?.classroom ?? '',
      studentCount: courses[0]?.studentCount ?? 30,
      sessionId: '',
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

    setBusy(true)
    try {
      await api.createExam(examForm)
      setModal(null)
      setToast('Yeni sınav programa eklendi.')
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

  const showCapacityWarning = useMemo(() => {
    if (!examForm.classroom) return false
    const room = capacities.find(r => r.classroom === examForm.classroom)
    return room ? room.capacity < Number(examForm.studentCount) : false
  }, [capacities, examForm.classroom, examForm.studentCount])

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
            <button type="button" className="secondary-button" onClick={() => setModal('department')}>
              + Bölüm
            </button>
            <button type="button" className="secondary-button" onClick={() => { setErrorText(''); setModal('session'); }}>
              + Oturum
            </button>
            <button type="button" className="secondary-button" onClick={() => setModal('classroom')}>
              + Salon
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
                placeholder="Örn: A-101, Z-04, 102"
              />
            </label>
            <label>
              Bulunduğu Kat
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
               <option value="">Bölüm Seçin</option>
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
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num}. Yarıyıl
                  </option>
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
            <label>Bölüm<select required value={personForm.department} onChange={(event) => setPersonForm({ ...personForm, department: event.target.value })}><option value="">Bölüm Seçin</option>{departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></label>
            <label>Durum<select value={personForm.availability} onChange={(event) => setPersonForm({ ...personForm, availability: event.target.value })}><option>Campüste</option><option>Yoğun</option><option>İzinli</option></select></label>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Vazgeç</button><button type="submit" className="primary-button" disabled={busy}>Kaydet</button></div>
          </form>
        </Modal>
      )}

      {modal === 'exam' && (
        <Modal title="Yeni Sınav Oluştur" onClose={() => setModal(null)}>
          {errorText && <div className="error-box" style={{backgroundColor:'#fde8e8', color:'#e74c3c', padding:'10px', borderRadius:'4px', marginBottom:'12px', borderLeft:'4px solid #e74c3c', fontSize:'14px', fontWeight:'500'}}>{errorText}</div>}
          <form className="form-grid" onSubmit={submitExam}>
            <label>
              Ders
              <select required value={examForm.courseId} onChange={(event) => {
                const selected = courses.find((course) => String(course.id) === event.target.value)
                setExamForm({ ...examForm, courseId: event.target.value, studentCount: selected?.studentCount ?? examForm.studentCount, sessionId: '' })
              }}>
                <option value="">Ders seçin</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.code} - {course.name}</option>)}
              </select>
            </label>
            <label>Tarih<input type="date" required value={examForm.date} onChange={(event) => setExamForm({ ...examForm, date: event.target.value, sessionId: '' })} /></label>

            <div className="form-group" style={{display:'flex', flexDirection:'column', gap:'6px'}}>
              <label style={{fontWeight:'600', color:'#34495e', fontSize:'14px'}}>Sınav Oturumu</label>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:'10px'}}>
                {sessions.length === 0 ? (
                  <p style={{color:'#7f8c8d', fontSize:'13px'}}>Sisteme tanımlı aktif oturum bulunamadı.</p>
                ) : (
                  sessions.map((session) => {
                    const isConflict = exams.some(exam =>
                      exam.date === examForm.date &&
                      String(exam.sessionId) === String(session.id) &&
                      selectedCourseDetails &&
                      exam.semester === selectedCourseDetails.semester &&
                      exam.departmentId === selectedCourseDetails.departmentId
                    );

                    const isSelected = String(examForm.sessionId) === String(session.id);

                    return (
                      <div
                        key={session.id}
                        onClick={() => {
                          if (!isConflict) {
                            setExamForm({ ...examForm, sessionId: String(session.id) })
                          }
                        }}
                        style={{
                          border: isSelected ? '2px solid #3498db' : isConflict ? '2px solid #e74c3c' : '2px solid #bdc3c7',
                          backgroundColor: isSelected ? '#ebf5fb' : isConflict ? '#fde8e8' : '#f8f9fa',
                          color: isConflict ? '#c0392b' : '#2c3e50',
                          padding: '10px',
                          borderRadius: '6px',
                          textAlign: 'center',
                          cursor: isConflict ? 'not-allowed' : 'pointer',
                          opacity: isConflict ? 0.65 : 1,
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
                          backgroundColor: isConflict ? '#e74c3c' : '#2ecc71',
                          color:'white',
                          fontWeight:'600',
                          marginTop:'4px',
                          display:'inline-block'
                        }}>
                          {isConflict ? 'Çakışma Var' : 'Müsait'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              <small style={{color:'#7f8c8d', fontSize:'11px', marginTop:'2px'}}>Aynı dönem zorunlu ders sınavları aynı saate atanamaz.</small>
            </div>

            <label>Salon<select required value={examForm.classroom} onChange={(event) => setExamForm({ ...examForm, classroom: event.target.value })}><option value="">Salon Seçin</option>{capacities.map((room) => <option key={room.id} value={room.classroom}>{room.classroom} (Kap: {room.capacity})</option>)}</select></label>
            {showCapacityWarning && (
              <div style={{color:'#d35400', backgroundColor:'#fff5e6', borderLeft:'3px solid #e67e22', padding:'6px 10px', fontSize:'12px', marginTop:'-6px'}}>
                ⚠️ Seçilen salonun kapasitesi ders kontenjanını karşılamıyor!
              </div>
            )}
            <label>Öğrenci Sayısı<input type="number" min="1" required value={examForm.studentCount} onChange={(event) => setExamForm({ ...examForm, studentCount: Number(event.target.value) })} /></label>
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
  return (
    <article className="panel page-panel">
      <div className="panel-heading"><div><h2>Ders Kayıtları</h2><p>Sınav oluştururken seçilecek ders havuzu.</p></div><button className="primary-button" type="button" onClick={onAdd}>+ Ders Ekle</button></div>
      {!courses.length ? <EmptyState text="Henüz ders kaydı bulunmuyor." /> : (
        <div className="table-wrapper"><table><thead><tr><th>Kod</th><th>Ders</th><th>Bölüm</th><th>Dönem</th><th>Öğrenci</th></tr></thead><tbody>{courses.map((course) => <tr key={course.id}><td><strong>{course.code}</strong></td><td>{course.name}</td><td>{course.department}</td><td>{course.semester}. Yarıyıl</td><td>{course.studentCount}</td></tr>)}</tbody></table></div>
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
    <div className="table-wrapper"><table><thead><tr><th>Ders</th><th>Tarih</th><th>Salon</th>{!compact && <th>Öğrenci</th>}<th>Gözetmen</th><th>Durum</th></tr></thead><tbody>{exams.map((exam) => <tr key={exam.id}><td><strong>{exam.courseCode}</strong><small>{exam.courseName}</small></td><td>{exam.date}</td><td>{exam.classroom}</td>{!compact && <td>{exam.studentCount}</td>}<td>{exam.supervisor}</td><td><StatusBadge value={exam.status} /></td></tr>)}</tbody></table></div>
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