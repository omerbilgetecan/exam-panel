const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

const wait = (duration = 220) =>
  new Promise((resolve) => window.setTimeout(resolve, duration))

const clone = (value) => JSON.parse(JSON.stringify(value))

const initialData = {
  courses: [
    { id: 1, code: 'BLM301', name: 'Veri Tabanı Yönetimi', department: 'Bilgisayar Müh.', semester: 'Bahar', studentCount: 42 },
    { id: 2, code: 'BLM205', name: 'Web Programlama', department: 'Bilgisayar Müh.', semester: 'Bahar', studentCount: 34 },
    { id: 3, code: 'MAT102', name: 'Lineer Cebir', department: 'Matematik', semester: 'Bahar', studentCount: 58 },
    { id: 4, code: 'YAZ402', name: 'Yazılım Proje Yönetimi', department: 'Yazılım Müh.', semester: 'Bahar', studentCount: 26 },
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
  supervisors: [
    { id: 1, title: 'Dr.', name: 'Dr. Selin Kaya', department: 'Bilgisayar Müh.', examCount: 1, availability: 'Uygun' },
    { id: 2, title: 'Doç. Dr.', name: 'Doç. Cem Akın', department: 'Matematik', examCount: 1, availability: 'Uygun' },
    { id: 3, title: 'Arş. Gör.', name: 'Arş. Gör. Ece Yılmaz', department: 'Yazılım Müh.', examCount: 1, availability: 'Uygun' },
    { id: 4, title: 'Arş. Gör.', name: 'Arş. Gör. Ömer Koç', department: 'Bilgisayar Müh.', examCount: 0, availability: 'Uygun' },
  ],
  logs: [
    { id: 1, time: '27.05.2026 09:12', action: 'Sistem açıldı', detail: 'SQL Server bağlantısı hazır', level: 'Başarılı' },
    { id: 2, time: '27.05.2026 10:24', action: 'Ders ve sınav listelendi', detail: '4 ders, 4 sınav kaydı getirildi', level: 'Bilgi' },
    { id: 3, time: '27.05.2026 10:40', action: 'Gözetmen kontrolü', detail: '1 sınav atama bekliyor', level: 'Uyarı' },
  ],
}

let demoData = clone(initialData)

const readDemoMode = () => window.localStorage.getItem('exam-demo-mode') !== 'false'

const logEvent = (action, detail, level = 'Başarılı') => {
  const now = new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date())

  demoData.logs.unshift({ id: Date.now(), time: now, action, detail, level })
}

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API isteği başarısız: ${response.status}`)
  }

  if (response.status === 204) return null
  return response.json()
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

  async getDashboard() {
    if (!readDemoMode()) return request('/dashboard')
    await wait()
    const assigned = demoData.exams.filter((exam) => exam.supervisor !== 'Atama Bekliyor').length
    const usedSeats = demoData.capacities.reduce((sum, room) => sum + room.assigned, 0)
    const totalSeats = demoData.capacities.reduce((sum, room) => sum + room.capacity, 0)
    return {
      courseCount: demoData.courses.length,
      personnelCount: demoData.supervisors.length,
      examCount: demoData.exams.length,
      assignedCount: assigned,
      roomUsage: totalSeats ? Math.round((usedSeats / totalSeats) * 100) : 0,
      pendingCount: demoData.exams.length - assigned,
    }
  },

  async getCourses() {
    if (!readDemoMode()) return request('/courses')
    await wait()
    return clone(demoData.courses)
  },

  async getExams() {
    if (!readDemoMode()) return request('/exams')
    await wait()
    return clone(demoData.exams)
  },

  async getCapacities() {
    if (!readDemoMode()) return request('/capacities')
    await wait()
    return clone(demoData.capacities)
  },

  async getSupervisors() {
    if (!readDemoMode()) return request('/supervisors')
    await wait()
    return clone(demoData.supervisors)
  },

  async getLogs() {
    if (!readDemoMode()) return request('/logs')
    await wait(120)
    return clone(demoData.logs)
  },

  async createCourse(course) {
    if (!readDemoMode()) return request('/courses', { method: 'POST', body: JSON.stringify(course) })
    await wait()
    const newCourse = { ...course, id: Date.now(), studentCount: Number(course.studentCount) }
    demoData.courses.unshift(newCourse)
    logEvent('Ders eklendi', `${newCourse.code} - ${newCourse.name}`)
    return clone(newCourse)
  },

  async createSupervisor(person) {
    if (!readDemoMode()) return request('/supervisors', { method: 'POST', body: JSON.stringify(person) })
    await wait()
    const name = person.name.startsWith(person.title) ? person.name : `${person.title} ${person.name}`
    const newPerson = { ...person, id: Date.now(), name, examCount: 0 }
    demoData.supervisors.unshift(newPerson)
    logEvent('Personel eklendi', `${newPerson.name} - ${newPerson.department}`)
    return clone(newPerson)
  },

  async createExam(exam) {
    if (!readDemoMode()) return request('/exams', { method: 'POST', body: JSON.stringify(exam) })
    await wait()
    const course = demoData.courses.find((entry) => entry.id === Number(exam.courseId))
    if (!course) throw new Error('Önce geçerli bir ders seçmelisin.')
    const newExam = {
      ...exam,
      id: Date.now(),
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      studentCount: Number(exam.studentCount),
      supervisor: 'Atama Bekliyor',
      status: 'Atama Bekliyor',
    }
    demoData.exams.unshift(newExam)
    const room = demoData.capacities.find((capacity) => capacity.classroom === exam.classroom)
    if (room) room.assigned = Number(exam.studentCount)
    logEvent('Sınav oluşturuldu', `${course.code} - ${exam.classroom}`)
    return clone(newExam)
  },

  async assignSupervisor({ examId, supervisorId }) {
    if (!readDemoMode()) {
      return request('/assignments', {
        method: 'POST',
        body: JSON.stringify({ examId, supervisorId }),
      })
    }

    await wait()
    const exam = demoData.exams.find((entry) => entry.id === Number(examId))
    const supervisor = demoData.supervisors.find((entry) => entry.id === Number(supervisorId))
    if (!exam || !supervisor) throw new Error('Sınav veya gözetmen bulunamadı.')
    exam.supervisor = supervisor.name
    exam.status = 'Planlandı'
    supervisor.examCount += 1
    logEvent('Gözetmen atandı', `${supervisor.name} -> ${exam.courseCode}`)
    return clone(exam)
  },

  async runBackup() {
    if (!readDemoMode()) return request('/backup', { method: 'POST' })
    await wait(520)
    logEvent('Yedekleme tamamlandı', 'SQL Server backup procedure çalıştırıldı')
    return { message: 'Veritabanı yedeği başarıyla oluşturuldu.' }
  },
}
