import { seedData } from '../data/seedData'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

const wait = (duration = 220) =>
  new Promise((resolve) => window.setTimeout(resolve, duration))

const clone = (value) => JSON.parse(JSON.stringify(value))

const readDemoMode = () => window.localStorage.getItem('exam-demo-mode') === 'true'
const asNumber = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}
const pick = (...values) => values.find((value) => value !== undefined && value !== null && value !== '')
const buildSupervisorName = (person) => {
  const explicitName = pick(person.name, person.fullName, person.personelAdi)
  if (explicitName) return String(explicitName).trim()

  const title = pick(person.title, person.unvan, '')
  const firstName = pick(person.firstName, person.ad, '')
  const lastName = pick(person.lastName, person.soyad, '')
  return [title, firstName, lastName].filter(Boolean).join(' ').trim()
}

const normalizeDepartment = (department) => ({
  id: asNumber(pick(department.id, department.departmentId, department.bolumId, department.bolumID)),
  name: pick(department.name, department.department, department.bolumAdi, department.bolumAd, 'Tanımsız Bölüm'),
})

const normalizeCourse = (course) => ({
  id: asNumber(pick(course.id, course.courseId, course.dersId, course.dersID)),
  code: pick(course.code, course.courseCode, course.dersKodu, ''),
  name: pick(course.name, course.courseName, course.dersAdi, 'Tanımsız Ders'),
  studentCount: asNumber(pick(course.studentCount, course.ogrenciSayisi, course.capacity), 0),
  semester: asNumber(pick(course.semester, course.yariyil), 0),
  departmentId: asNumber(pick(course.departmentId, course.bolumId, course.bolumID), 0),
  department: pick(course.department, course.departmentName, course.bolumAdi, 'Tanımsız Bölüm'),
})

const normalizeSupervisor = (person) => ({
  id: asNumber(pick(person.id, person.supervisorId, person.personelId, person.personelID)),
  title: pick(person.title, person.unvan, ''),
  name: buildSupervisorName(person) || 'Tanımsız Personel',
  firstName: pick(person.firstName, person.ad, ''),
  lastName: pick(person.lastName, person.soyad, ''),
  departmentId: asNumber(pick(person.departmentId, person.bolumId, person.bolumID), 0),
  department: pick(person.department, person.departmentName, person.bolumAdi, 'Tanımsız Bölüm'),
  examCount: asNumber(pick(person.examCount, person.sinavSayisi), 0),
  availability: pick(person.availability, person.durum, 'Uygun'),
})

const initialData = {
  departments: seedData.departments,
  courses: seedData.courses,
  sessions: [ // Demo modunda arayüzün boş kalmaması için varsayılan seanslar
    { id: 1, name: 'Oturum 1', startTime: '09:30', endTime: '11:00' },
    { id: 2, name: 'Oturum 2', startTime: '11:30', endTime: '13:00' },
    { id: 3, name: 'Oturum 3', startTime: '14:00', endTime: '15:30' }
  ],
  exams: [
    { id: 1, courseId: 1, courseCode: 'BLM301', courseName: 'Veri Tabanı Yönetimi', date: '2026-06-02', time: '09:30', classroom: 'A-201', studentCount: 42, supervisor: 'Dr. Selin Kaya', status: 'Planlandı' },
    { id: 2, courseId: 2, courseCode: 'BLM205', courseName: 'Web Programlama', date: '2026-06-02', time: '13:30', classroom: 'LAB-3', studentCount: 34, supervisor: 'Atama Bekliyor', status: 'Atama Bekliyor' },
    { id: 3, courseId: 3, courseCode: 'MAT102', courseName: 'Lineer Cebir', date: '2026-06-03', time: '10:00', classroom: 'B-104', studentCount: 58, supervisor: 'Doç. Cem Akın', status: 'Planlandı' },
    { id: 4, courseId: 4, courseCode: 'YAZ402', courseName: 'Yazılım Proje Yönetimi', date: '2026-06-04', time: '14:00', classroom: 'C-301', studentCount: 26, supervisor: 'Arş. Gör. Ece Yılmaz', status: 'Planlandı' },
  ],
  capacities: [
    { id: 1, classroom: 'A-201', capacity: 48, assigned: 42, building: 'A Blok' },
    { id: 2, classroom: 'LAB-3', capacity: 36, assigned: 34, building: 'Teknoloji Binası' },
    { id: 3, classroom: 'B-104', capacity: 60, assigned: 58, building: 'B Blok' },
    { id: 4, classroom: 'C-301', capacity: 45, assigned: 26, building: 'C Blok' },
    { id: 5, classroom: 'Konferans-1', capacity: 110, assigned: 0, building: 'Rektörlük' },
  ],
  supervisors: seedData.supervisors,
  logs: [
    { id: 1, time: '27.05.2026 09:12', action: 'Sistem açıldı', detail: 'SQL Server bağlantısı hazır', level: 'Başarılı' },
    { id: 2, time: '27.05.2026 10:24', action: 'Ders ve sınav listelendi', detail: '4 ders, 4 sınav kaydı getirildi', level: 'Bilgi' },
    { id: 3, time: '27.05.2026 10:40', action: 'Gözetmen kontrolü', detail: '1 sınav atama bekliyor', level: 'Uyarı' },
  ],
}

let demoData = clone(initialData)

const logEvent = (action, detail, level = 'Başarılı') => {
  const now = new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date())

  demoData.logs.unshift({ id: Date.now(), time: now, action, detail, level })
}

const getExamCourse = (exam) => demoData.courses.find((course) => course.id === Number(exam.courseId))

const getExamSessionId = (exam) => Number(exam.sessionId || demoData.sessions.find((session) => session.startTime === exam.time)?.id || 0)

const getExamRooms = (exam) => String(exam.classroomName || exam.classroom || '')
  .split(',')
  .map((room) => room.trim())
  .filter(Boolean)

const chooseBestRooms = ({ date, sessionId, preferredRoom, studentCount }) => {
  const busyRooms = new Set(
    demoData.exams
      .filter((exam) => exam.date === date && getExamSessionId(exam) === Number(sessionId))
      .flatMap(getExamRooms),
  )
  const available = demoData.capacities.filter((room) => !busyRooms.has(room.classroom))
  const selected = []

  if (preferredRoom) {
    const room = available.find((entry) => entry.classroom === preferredRoom)
    if (!room) throw new Error(`SeÃ§ilen salon bu tarih ve oturumda dolu: ${preferredRoom}`)
    selected.push(room)
  }

  let remaining = Number(studentCount) - selected.reduce((sum, room) => sum + Number(room.capacity), 0)
  while (remaining > 0) {
    const selectedIds = new Set(selected.map((room) => room.id))
    const pool = available.filter((room) => !selectedIds.has(room.id))
    if (!pool.length) break
    pool.sort((a, b) => {
      const aWaste = a.capacity >= remaining ? a.capacity - remaining : Number.MAX_SAFE_INTEGER - a.capacity
      const bWaste = b.capacity >= remaining ? b.capacity - remaining : Number.MAX_SAFE_INTEGER - b.capacity
      return aWaste - bWaste || b.capacity - a.capacity
    })
    selected.push(pool[0])
    remaining -= Number(pool[0].capacity)
  }

  if (selected.reduce((sum, room) => sum + Number(room.capacity), 0) < Number(studentCount)) {
    throw new Error('MÃ¼sait salonlarÄ±n toplam kapasitesi bu ders iÃ§in yetersiz.')
  }
  return selected
}

const wouldBreakConsecutiveRule = (sessionIds, newSessionId) => {
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

const isSupervisorAvailable = (supervisor, date, sessionId) => {
  const assignedToday = demoData.exams.filter((exam) => exam.supervisor === supervisor.name && exam.date === date)
  if (assignedToday.some((exam) => getExamSessionId(exam) === Number(sessionId))) return false
  if (assignedToday.length >= 4) return false
  if (wouldBreakConsecutiveRule(assignedToday.map(getExamSessionId), sessionId)) return false
  return supervisor.availability !== 'Ä°zinli' && supervisor.availability !== 'İzinli'
}

async function request(path, options) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `API Hatası (${response.status}): ${path} yüklenemedi.`;
      throw new Error(errorMessage);
    }

    if (response.status === 204) return null
    return response.json()
  } catch (error) {
    console.error(`Sunucu bağlantı hatası: ${path} adresine erişilemedi.`, error)
    throw error;
  }
}

export const api = {
  get baseUrl() {
    return API_BASE_URL
  },

  isDemoMode() {
    return readDemoMode()
  },

  setDemoMode(enabled) {
    window.localStorage.setItem('exam-demo-mode', String(enabled))
  },

  async getDepartments() {
    if (!readDemoMode()) {
      const data = await request('/departments', {}, [])
      return data.map(normalizeDepartment)
    }
    await wait()
    return clone(demoData.departments || [])
  },

  async createDepartment(department) {
    if (!readDemoMode()) {
      return request('/departments', {
        method: 'POST',
        body: JSON.stringify(department),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    await wait()
    const newDepartment = { ...department, id: Date.now() }
    if (!demoData.departments) demoData.departments = []
    demoData.departments.unshift(newDepartment)
    logEvent('Bölüm eklendi', newDepartment.name)
    return clone(newDepartment)
  },

  async getDashboard() {
    const emptyDashboard = {
      courseCount: 0,
      personnelCount: 0,
      examCount: 0,
      assignedCount: 0,
      roomUsage: 0,
      pendingCount: 0
    }

    if (!readDemoMode()) return request('/dashboard', {}, emptyDashboard)
    await wait()
    const assigned = demoData.exams.filter((exam) => exam.supervisor !== 'Atama Bekliyor').length
    const usedSeats = demoData.capacities.reduce((sum, room) => sum + room.assigned, 0)
    const totalSeats = demoData.capacities.reduce((sum, room) => sum + room.capacity, 0)
    const roomUsageRatio = totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0

    return {
      courseCount: demoData.courses.length,
      personnelCount: demoData.supervisors.length,
      examCount: demoData.exams.length,
      assignedCount: assigned,
      roomUsage: roomUsageRatio,
      pendingCount: demoData.exams.length - assigned
    }
  },

  async getCourses() {
    if (!readDemoMode()) {
      const data = await request('/courses', {}, []);
      return data.map(normalizeCourse);
    }
    await wait();
    return clone(demoData.courses);
  },

  async getCoursesWithoutExam() {
    const allCourses = await api.getCourses();
    const allExams = await api.getExams();
    const examCourseIds = new Set(allExams.map((exam) => exam.courseId));
    return allCourses.filter((course) => !examCourseIds.has(course.id));
  },

  async getExams() {
    if (!readDemoMode()) return request('/exams', {}, [])
    await wait()
    return clone(demoData.exams)
  },

  async getCapacities() {
    if (!readDemoMode()) {
      const data = await request('/capacities', {}, []);
      // 🎯 DÜZELTME: Backend'den (ClassroomRequestDTO) gelen listeyi arayüze mapliyoruz
      return data.map((room, idx) => ({
        id: room.id || idx + 1,
        classroom: room.classroomName || "Tanımsız Salon", // backend: classroomName -> frontend: classroom
        capacity: room.capacity || 60,
        assigned: 0,
        building: room.floor === 0 ? "Zemin Kat" : room.floor + ". Kat"
      }));
    }
    await wait()
    return clone(demoData.capacities)
  },

  async getSupervisors() {
    if (!readDemoMode()) {
      const data = await request('/supervisors', {}, [])
      return data.map(normalizeSupervisor)
    }
    await wait()
    return clone(demoData.supervisors)
  },

  async getLogs() {
    if (!readDemoMode()) return request('/logs', {}, [])
    await wait(120)
    return clone(demoData.logs)
  },

  async getExamProgramReport() {
    if (!readDemoMode()) return request('/reports/exam-program', {}, [])
    await wait(120)
    return demoData.exams.map((exam) => ({
      courseCode: exam.courseCode,
      courseName: exam.courseName,
      department: demoData.courses.find((course) => course.id === exam.courseId)?.department ?? '',
      semester: demoData.courses.find((course) => course.id === exam.courseId)?.semester ?? '',
      date: exam.date,
      session: exam.time,
      classroom: exam.classroom,
      studentCount: exam.studentCount,
      capacity: demoData.capacities.find((room) => room.classroom === exam.classroom)?.capacity ?? 0,
      supervisor: exam.supervisor,
      status: exam.status,
    }))
  },

  async getSessions() {
    if (!readDemoMode()) return request('/sessions', {}, [])
    await wait()
    return clone(demoData.sessions || [])
  },

  async createSession(session) {
    if (session.startTime >= session.endTime) {
      throw new Error('Başlangıç saati, bitiş saatinden sonra veya eşit olamaz!');
    }

    if (!readDemoMode()) {
      const existing = await api.getSessions();
      const isDuplicate = existing.some(s => s.startTime === session.startTime && s.endTime === session.endTime);
      if (isDuplicate) {
        throw new Error('Bu zaman aralığına ait bir oturum zaten mevcut!');
      }

      const backendPayload = {
        name: session.name,
        startTime: session.startTime,
        endTime: session.endTime
      };

      return request('/sessions', {
        method: 'POST',
        body: JSON.stringify(backendPayload),
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await wait();
    const isDuplicateDemo = (demoData.sessions || []).some(s => s.startTime === session.startTime && s.endTime === session.endTime);
    if (isDuplicateDemo) {
      throw new Error('Bu zaman aralığına ait bir oturum zaten mevcut!');
    }

    const newSession = { ...session, id: Date.now() };
    if (!demoData.sessions) demoData.sessions = [];
    demoData.sessions.push(newSession);
    logEvent('Oturum tanımlandı', `${newSession.name} (${newSession.startTime} - ${newSession.endTime})`);
    return clone(newSession);
  },

  async createClassroom(classroom) {
    if (!readDemoMode()) {
      const backendPayload = {
        classroomName: classroom.classroomName,
        capacity: Number(classroom.capacity),
        classroomType: classroom.classroomType,
        floor: Number(classroom.floor),
        active: true
      };

      return request('/capacities', {
        method: 'POST',
        body: JSON.stringify(backendPayload),
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await wait();
    const newRoom = {
      id: Date.now(),
      classroom: classroom.classroomName,
      capacity: Number(classroom.capacity),
      assigned: 0,
      building: classroom.floor + ". Kat"
    };
    if (!demoData.capacities) demoData.capacities = [];
    demoData.capacities.push(newRoom);
    logEvent('Salon eklendi', `${newRoom.classroom} (Kap: ${newRoom.capacity})`);
    return clone(newRoom);
  },

  async createCourse(course) {
    if (!readDemoMode()) {
      const backendPayload = {
        code: course.code,
        name: course.name,
        studentCount: Number(course.studentCount),
        semester: Number(course.semester),
        departmentId: Number(course.departmentId)
      };

      return request('/courses', {
        method: 'POST',
        body: JSON.stringify(backendPayload),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    await wait();
    const newCourse = { ...course, id: Date.now(), studentCount: Number(course.studentCount) };
    demoData.courses.unshift(newCourse);
    logEvent('Ders eklendi', `${newCourse.code} - ${newCourse.name}`);
    return clone(newCourse);
  },

  async createSupervisor(person) {
    if (!readDemoMode()) {
      const departmentId = Number(person.departmentId)
      return request('/supervisors', {
        method: 'POST',
        body: JSON.stringify({
          ...person,
          departmentId: Number.isFinite(departmentId) && departmentId > 0 ? departmentId : null,
        }),
      }, {})
    }
    await wait()
    const name = person.name.startsWith(person.title) ? person.name : `${person.title} ${person.name}`
    const newPerson = { ...person, id: Date.now(), name, examCount: 0 }
    demoData.supervisors.unshift(newPerson)
    logEvent('Personel eklendi', `${newPerson.name} - ${newPerson.department}`)
    return clone(newPerson)
  },

  async createExam(exam) {
    if (!readDemoMode()) return request('/exams', { method: 'POST', body: JSON.stringify(exam) }, {})
    await wait()
    const course = demoData.courses.find((entry) => entry.id === Number(exam.courseId))
    if (!course) throw new Error('Once gecerli bir ders secmelisin.')
    const sessionId = Number(exam.sessionId)
    const sameSemesterExams = demoData.exams.filter((entry) => {
      const entryCourse = getExamCourse(entry)
      return entry.date === exam.date &&
        entryCourse?.departmentId === course.departmentId &&
        Number(entryCourse?.semester) === Number(course.semester)
    })
    if (sameSemesterExams.some((entry) => getExamSessionId(entry) === sessionId)) {
      throw new Error('Ayni bolum ve yariyildaki dersler ayni oturuma atanamaz.')
    }
    if (sameSemesterExams.length >= 2) {
      throw new Error('Bir yariyila ait ayni gunde en fazla 2 sinav olabilir.')
    }
    if (sameSemesterExams.some((entry) => Math.abs(getExamSessionId(entry) - sessionId) < 2)) {
      throw new Error('Ayni yariyilin ayni gundeki sinavlari arasinda en az bir oturum bosluk olmali.')
    }
    const rooms = chooseBestRooms({
      date: exam.date,
      sessionId,
      preferredRoom: exam.classroom,
      studentCount: course.studentCount,
    })
    const newExam = {
      ...exam,
      id: Date.now(),
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      departmentId: course.departmentId,
      department: course.department,
      semester: course.semester,
      sessionId,
      classroom: rooms.map((room) => room.classroom).join(', '),
      classroomName: rooms.map((room) => room.classroom).join(', '),
      studentCount: Number(course.studentCount),
      supervisor: 'Atama Bekliyor',
      status: 'Atama Bekliyor',
    }
    demoData.exams.unshift(newExam)
    rooms.forEach((selectedRoom) => {
      const room = demoData.capacities.find((capacity) => capacity.classroom === selectedRoom.classroom)
      if (room) room.assigned = Math.min(Number(room.capacity), Number(course.studentCount))
    })
    logEvent('Sinav olusturuldu', `${course.code} - ${newExam.classroom}`)
    return clone(newExam)
  },

  async assignSupervisor({ examId, supervisorId }) {
    if (!readDemoMode()) {
      return request('/assignments', {
        method: 'POST',
        body: JSON.stringify({ examId: Number(examId), supervisorId: Number(supervisorId) }),
      }, {})
    }

    await wait()
    const exam = demoData.exams.find((entry) => entry.id === Number(examId))
    if (!exam) throw new Error('Sinav bulunamadi.')
    const preferredSupervisor = demoData.supervisors.find((entry) => entry.id === Number(supervisorId))
    const selectedSupervisor = [preferredSupervisor, ...demoData.supervisors]
      .filter(Boolean)
      .filter((person, index, list) => list.findIndex((entry) => entry.id === person.id) === index)
      .filter((person) => person.departmentId === exam.departmentId || String(person.department).includes('Ortak'))
      .sort((a, b) => Number(a.examCount || 0) - Number(b.examCount || 0))
      .find((person) => isSupervisorAvailable(person, exam.date, exam.sessionId))
    if (!selectedSupervisor) throw new Error('Uygun gozetmen bulunamadi. Bolum ve ortak havuz yetersiz.')
    exam.supervisor = selectedSupervisor.name
    exam.status = 'Planlandi'
    selectedSupervisor.examCount = Number(selectedSupervisor.examCount || 0) + 1
    logEvent('Gozetmen atandi', `${selectedSupervisor.name} -> ${exam.courseCode}`)
    return clone(exam)
  },

  async runBackup() {
    if (!readDemoMode()) return request('/backup', { method: 'POST' }, { message: 'Yedekleme başarısız.' })
    await wait(520)
    logEvent('Yedekleme tamamlandı', 'SQL Server backup procedure çalıştırıldı')
    return { message: 'Veritabanı yedeği başarıyla oluşturuldu.' }
  },
}
