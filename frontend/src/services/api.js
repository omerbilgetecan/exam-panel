import { seedData } from '../data/seedData'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
const API_TIMEOUT_MS = 2500

const wait = (duration = 220) =>
  new Promise((resolve) => window.setTimeout(resolve, duration))

const clone = (value) => JSON.parse(JSON.stringify(value))
const withSeedFallback = (items, fallbackItems) =>
  Array.isArray(items) && items.length ? items : clone(fallbackItems || [])

const readDemoMode = () => import.meta.env.VITE_DEMO_MODE === 'true'
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
    { id: 1, name: 'Sabah-1', startTime: '09:00', endTime: '10:00' },
    { id: 2, name: 'Sabah-2', startTime: '10:30', endTime: '11:30' },
    { id: 3, name: 'Öğle', startTime: '12:00', endTime: '13:00' },
    { id: 4, name: 'Öğleden Sonra-1', startTime: '13:45', endTime: '14:45' },
    { id: 5, name: 'Öğleden Sonra-2', startTime: '15:15', endTime: '16:30' }
  ],
  exams: [],
  capacities: [
    { id: 1, classroom: '205', capacity: 36, assigned: 0, building: '2. Kat', floor: 2, type: 'Küçük Sınıf' },
    { id: 2, classroom: '206', capacity: 36, assigned: 0, building: '2. Kat', floor: 2, type: 'Küçük Sınıf' },
    { id: 3, classroom: '207', capacity: 36, assigned: 0, building: '2. Kat', floor: 2, type: 'Küçük Sınıf' },
    { id: 4, classroom: '208', capacity: 36, assigned: 0, building: '2. Kat', floor: 2, type: 'Küçük Sınıf' },
    { id: 5, classroom: '209', capacity: 60, assigned: 0, building: '2. Kat', floor: 2, type: 'Büyük Sınıf' },
    { id: 6, classroom: '210', capacity: 60, assigned: 0, building: '2. Kat', floor: 2, type: 'Büyük Sınıf' },
    { id: 7, classroom: '305', capacity: 36, assigned: 0, building: '3. Kat', floor: 3, type: 'Küçük Sınıf' },
    { id: 8, classroom: '306', capacity: 36, assigned: 0, building: '3. Kat', floor: 3, type: 'Küçük Sınıf' },
    { id: 9, classroom: '307', capacity: 36, assigned: 0, building: '3. Kat', floor: 3, type: 'Küçük Sınıf' },
    { id: 10, classroom: '308', capacity: 36, assigned: 0, building: '3. Kat', floor: 3, type: 'Küçük Sınıf' },
    { id: 11, classroom: '309', capacity: 40, assigned: 0, building: '3. Kat', floor: 3, type: 'Orta Sınıf' },
    { id: 12, classroom: '310', capacity: 60, assigned: 0, building: '3. Kat', floor: 3, type: 'Büyük Sınıf' },
    { id: 13, classroom: '311', capacity: 50, assigned: 0, building: '3. Kat', floor: 3, type: 'Orta Sınıf' },
    { id: 14, classroom: '409', capacity: 60, assigned: 0, building: '4. Kat', floor: 4, type: 'Büyük Sınıf' },
    { id: 15, classroom: '410', capacity: 60, assigned: 0, building: '4. Kat', floor: 4, type: 'Büyük Sınıf' },
  ],
  supervisors: seedData.supervisors,
  leaves: [],
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

const chooseBestRooms = ({ date, sessionId, preferredRoom, preferredRooms = [], studentCount }) => {
  const busyRooms = new Set(
    demoData.exams
      .filter((exam) => exam.date === date && getExamSessionId(exam) === Number(sessionId))
      .flatMap(getExamRooms),
  )
  const available = demoData.capacities.filter((room) => !busyRooms.has(room.classroom))
  const selected = []

  const requestedRooms = [...new Set([preferredRoom, ...preferredRooms].filter(Boolean))]
  for (const roomName of requestedRooms) {
    const room = available.find((entry) => entry.classroom === roomName)
    if (!room) throw new Error(`Seçilen salon bu tarih ve oturumda dolu: ${roomName}`)
    selected.push(room)
    available.splice(available.findIndex((entry) => entry.id === room.id), 1)
  }

  let remaining = Number(studentCount) - selected.reduce((sum, room) => sum + Number(room.capacity), 0)
  while (remaining > 0) {
    const selectedIds = new Set(selected.map((room) => room.id))
    const targetFloor = selected[0]?.floor
    const sameFloorPool = available.filter((room) => !selectedIds.has(room.id) && targetFloor !== undefined && room.floor === targetFloor)
    const pool = sameFloorPool.length ? sameFloorPool : available.filter((room) => !selectedIds.has(room.id))
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
    throw new Error('Müsait salonların toplam kapasitesi bu ders için yetersiz.')
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
  const assignedToday = demoData.exams.filter((exam) => {
    const names = Array.isArray(exam.supervisors) ? exam.supervisors : [exam.supervisor]
    return names.includes(supervisor.name) && exam.date === date
  })
  const hasLeave = (demoData.leaves || []).some((leave) =>
    Number(leave.supervisorId) === Number(supervisor.id) &&
    leave.date === date &&
    Number(leave.sessionId) === Number(sessionId)
  )
  if (assignedToday.some((exam) => getExamSessionId(exam) === Number(sessionId))) return false
  if (new Set(assignedToday.map(getExamSessionId)).size >= 4) return false
  if (wouldBreakConsecutiveRule(assignedToday.map(getExamSessionId), sessionId)) return false
  if (hasLeave || ['İzinli', 'Danışmanlık Saati', 'Görevli'].includes(supervisor.availability)) return false
  return true
}

async function request(path, options) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
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
    if (error.name === 'AbortError') {
      throw new Error('Backend cevap vermedi. SQL Server bağlantısı veya 8080 backend servisi kapalı olabilir.')
    }
    if (error instanceof TypeError) {
      throw new Error('Backend çalışmıyor. Sınavı veritabanına kaydetmek için 8080 API servisini başlatmalısın.')
    }
    throw error;
  } finally {
    window.clearTimeout(timeout)
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
      const data = await request('/departments', {}, []).catch(() => [])
      return withSeedFallback(data.map(normalizeDepartment), demoData.departments)
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

    if (!readDemoMode()) {
      const dashboard = await request('/dashboard', {}, emptyDashboard).catch(() => emptyDashboard)
      if (dashboard.courseCount || dashboard.personnelCount || dashboard.examCount) return dashboard
      return {
        ...dashboard,
        courseCount: demoData.courses.length,
        personnelCount: demoData.supervisors.length,
      }
    }
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
      const data = await request('/courses', {}, []).catch(() => []);
      return withSeedFallback(data.map(normalizeCourse), demoData.courses);
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
    if (!readDemoMode()) return request('/exams', {}, []).catch(() => [])
    await wait()
    return clone(demoData.exams)
  },

  async getCapacities() {
    if (!readDemoMode()) {
      const data = await request('/capacities', {}, []).catch(() => []);
      // 🎯 DÜZELTME: Backend'den (ClassroomRequestDTO) gelen listeyi arayüze mapliyoruz
      const rooms = data.map((room, idx) => ({
        id: room.id || idx + 1,
        classroom: room.classroomName || "Tanımsız Salon", // backend: classroomName -> frontend: classroom
        capacity: room.capacity || 60,
        assigned: 0,
        building: room.floor === 0 ? "Zemin Kat" : room.floor + ". Kat",
        floor: Number(room.floor ?? 0),
        type: room.classroomType || 'Sınıf',
      }));
      return withSeedFallback(rooms, demoData.capacities)
    }
    await wait()
    return clone(demoData.capacities)
  },

  async getSupervisors() {
    if (!readDemoMode()) {
      const data = await request('/supervisors', {}, []).catch(() => [])
      return withSeedFallback(data.map(normalizeSupervisor), demoData.supervisors)
    }
    await wait()
    return clone(demoData.supervisors)
  },

  async getLogs() {
    if (!readDemoMode()) return request('/logs', {}, []).catch(() => clone(demoData.logs))
    await wait(120)
    return clone(demoData.logs)
  },

  async getExamProgramReport() {
    if (!readDemoMode()) return request('/reports/exam-program', {}, []).catch(() => [])
    await wait(120)
    return demoData.exams.map((exam) => {
      const roomNames = getExamRooms(exam)
      const capacity = roomNames.reduce((sum, roomName) => {
        const room = demoData.capacities.find((entry) => entry.classroom === roomName)
        return sum + Number(room?.capacity || 0)
      }, 0)
      return {
        courseCode: exam.courseCode,
        courseName: exam.courseName,
        department: demoData.courses.find((course) => course.id === exam.courseId)?.department ?? '',
        semester: demoData.courses.find((course) => course.id === exam.courseId)?.semester ?? '',
        date: exam.date,
        session: exam.sessionName || exam.time || `Oturum ${exam.sessionId}`,
        classroom: exam.classroom,
        studentCount: exam.studentCount,
        capacity,
        supervisor: exam.supervisor,
        status: exam.status,
      }
    })
  },

  async getSessions() {
    if (!readDemoMode()) {
      const data = await request('/sessions', {}, []).catch(() => [])
      return withSeedFallback(data, demoData.sessions)
    }
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
      building: classroom.floor + ". Kat",
      floor: Number(classroom.floor),
      type: classroom.classroomType
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

  async createSupervisorLeave({ supervisorId, date, sessionId, reason }) {
    if (!readDemoMode()) {
      return request(`/supervisors/${Number(supervisorId)}/leave`, {
        method: 'POST',
        body: JSON.stringify({ date, sessionId: String(sessionId), reason }),
      }, {})
    }

    await wait()
    const supervisor = demoData.supervisors.find((person) => person.id === Number(supervisorId))
    if (!supervisor) throw new Error('Personel bulunamadı.')
    const sessionIds = sessionId === 'ALL'
      ? (demoData.sessions || []).map((session) => Number(session.id))
      : [Number(sessionId)]
    const leaves = sessionIds.map((nextSessionId, index) => ({
      id: Date.now() + index,
      supervisorId: Number(supervisorId),
      date,
      sessionId: nextSessionId,
      reason: reason || 'İzinli',
    }))
    demoData.leaves.unshift(...leaves)
    supervisor.availability = reason || 'İzinli'
    logEvent('Personel mazereti eklendi', `${supervisor.name} - ${date} / ${sessionId === 'ALL' ? 'Tüm gün' : `Oturum ${sessionId}`} (${reason || 'İzinli'})`)
    return clone(leaves[0])
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
      preferredRooms: [exam.classroom2, exam.classroom3],
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
      requiredSupervisorCount: rooms.length,
      supervisors: [],
      supervisorIds: [],
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
    const neededCount = Math.max(1, Number(exam.requiredSupervisorCount || getExamRooms(exam).length || 1))
    const selectedSupervisors = []
    const candidatePool = [preferredSupervisor, ...demoData.supervisors]
      .filter(Boolean)
      .filter((person, index, list) => list.findIndex((entry) => entry.id === person.id) === index)
      .filter((person) => person.departmentId === exam.departmentId || String(person.department).includes('Ortak'))
      .sort((a, b) => Number(a.examCount || 0) - Number(b.examCount || 0))
    for (const person of candidatePool) {
      if (selectedSupervisors.length >= neededCount) break
      if (selectedSupervisors.some((selected) => selected.id === person.id)) continue
      if (isSupervisorAvailable(person, exam.date, exam.sessionId)) selectedSupervisors.push(person)
    }
    if (selectedSupervisors.length < neededCount) throw new Error('Uygun gözetmen bulunamadı. Bölüm ve ortak havuz yetersiz.')
    exam.supervisors = selectedSupervisors.map((person) => person.name)
    exam.supervisorIds = selectedSupervisors.map((person) => person.id)
    exam.supervisor = exam.supervisors.join(', ')
    exam.status = 'Planlandı'
    selectedSupervisors.forEach((person) => {
      person.examCount = Number(person.examCount || 0) + 1
    })
    logEvent('Gözetmen atandı', `${exam.supervisor} -> ${exam.courseCode}`)
    return clone(exam)
  },

  async runBackup() {
    if (!readDemoMode()) return request('/backup', { method: 'POST' }, { message: 'Yedekleme başarısız.' })
    await wait(520)
    logEvent('Yedekleme tamamlandı', 'SQL Server backup procedure çalıştırıldı')
    return { message: 'Veritabanı yedeği başarıyla oluşturuldu.' }
  },
}
