package com.example.backend.service;

import com.example.backend.repository.*;
import com.example.backend.request.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ExamActivityServiceImpl {
    private final BolumRepository bolumRepository;
    private final DersRepository dersRepository;
    private final DashboardRepository dashboardRepository;
    private final OturumRepository oturumRepository;
    private final ClassroomRepository classroomRepository;
    private final SInavRepository sInavRepository;
    private final SupervisorRepository supervisorRepository;
    private final AssignmentRepository assignmentRepository;
    private final LogRepository logRepository;
    private final ReportRepository reportRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public ExamActivityServiceImpl(BolumRepository bolumRepository,
                                   DersRepository dersRepository,
                                   DashboardRepository dashboardRepository,
                                   OturumRepository oturumRepository,
                                   ClassroomRepository classroomRepository,
                                   SInavRepository sInavRepository,
                                   SupervisorRepository supervisorRepository,
                                   AssignmentRepository assignmentRepository,
                                   LogRepository logRepository,
                                   ReportRepository reportRepository) {
        this.bolumRepository = bolumRepository;
        this.dersRepository = dersRepository;
        this.dashboardRepository = dashboardRepository;
        this.oturumRepository = oturumRepository;
        this.classroomRepository = classroomRepository;
        this.sInavRepository = sInavRepository;
        this.supervisorRepository = supervisorRepository;
        this.assignmentRepository = assignmentRepository;
        this.logRepository = logRepository;
        this.reportRepository = reportRepository;
    }

    @Transactional
    public Integer addNewBolum(String bolumAdi) {
        Integer id = bolumRepository.spBolumEkle(bolumAdi);
        logRepository.log("Bölüm eklendi", bolumAdi, "Başarılı");
        return id;
    }

    @Transactional
    public List<BolumRequestDTO> getAllDepartments() {
        return bolumRepository.spBolumleriGetir();
    }

    @Transactional
    public Integer addNewDers(DersRequestDTO dto) {
        Integer id = dersRepository.spDersEkle(
                dto.getCode(),
                dto.getName(),
                dto.getStudentCount(),
                dto.getSemester(),
                dto.getDepartmentId()
        );
        logRepository.log("Ders eklendi", dto.getCode() + " - " + dto.getName(), "Başarılı");
        return id;
    }

    @Transactional
    public Integer addNewSinav(SinavRequestDTO dto) {
        SInavRepository.CourseInfo course = sInavRepository.findCourse(dto.getCourseId());

        if (sInavRepository.hasSemesterSessionConflict(dto.getDate(), dto.getSessionId(), course.departmentId(), course.semester())) {
            throw new IllegalArgumentException("Aynı bölüm ve yarıyıldaki dersler aynı tarih/oturuma atanamaz.");
        }

        List<Integer> sameDaySessions = sInavRepository.sameSemesterSessionsOnDate(dto.getDate(), course.departmentId(), course.semester());
        if (sameDaySessions.size() >= 2) {
            throw new IllegalArgumentException("Bir yarıyıla ait aynı günde en fazla 2 sınav olabilir.");
        }
        boolean hasGapProblem = sameDaySessions.stream().anyMatch(existing -> Math.abs(existing - dto.getSessionId()) < 2);
        if (hasGapProblem) {
            throw new IllegalArgumentException("Aynı yarıyılın aynı gündeki sınavları arasında en az bir oturum boşluk olmalı.");
        }

        List<SInavRepository.RoomInfo> rooms = sInavRepository.bestRoomCombination(
                dto.getDate(),
                dto.getSessionId(),
                course.studentCount(),
                Arrays.asList(dto.getClassroom(), dto.getClassroom2(), dto.getClassroom3())
        );

        Integer id = sInavRepository.createExamWithRooms(dto.getDate(), dto.getSessionId(), dto.getCourseId(), rooms);
        String roomNames = String.join(", ", rooms.stream().map(SInavRepository.RoomInfo::name).toList());
        logRepository.log("Sınav oluşturuldu", course.code() + " -> " + roomNames, "Başarılı");
        return id;
    }

    @Transactional
    public List<DersRequestDTO> getAllCourses() {
        return dersRepository.spDersleriGetir();
    }

    @Transactional
    public DashboardRequestDTO getDashboard() {
        return dashboardRepository.getDashboardStatsFromProcedure();
    }

    @Transactional
    public Integer addNewSession(OturumRequestDTO dto) {
        if (dto.getStartTime().equals(dto.getEndTime())) {
            throw new IllegalArgumentException("Başlangıç saati ile bitiş saati aynı olamaz.");
        }
        if (dto.getStartTime().compareTo(dto.getEndTime()) > 0) {
            throw new IllegalArgumentException("Başlangıç saati, bitiş saatinden sonra olamaz.");
        }

        List<OturumRequestDTO> existingSessions = oturumRepository.spOturumlarıListele();
        boolean isDuplicate = existingSessions.stream().anyMatch(s ->
                s.getStartTime().equals(dto.getStartTime()) && s.getEndTime().equals(dto.getEndTime())
        );

        if (isDuplicate) {
            throw new IllegalArgumentException("Bu zaman aralığına ait bir oturum zaten sistemde mevcut.");
        }

        Integer id = oturumRepository.spOturumEkle(dto.getName(), dto.getStartTime(), dto.getEndTime());
        logRepository.log("Oturum tanımlandı", dto.getName(), "Başarılı");
        return id;
    }

    @Transactional
    public List<OturumRequestDTO> getAllSessions() {
        return oturumRepository.spOturumlarıListele();
    }

    @Transactional
    public Integer addNewClassroom(ClassroomRequestDTO dto) {
        if (dto.getCapacity() <= 0) {
            throw new IllegalArgumentException("Sınav salonu kapasitesi 0'dan büyük olmalıdır.");
        }

        Integer id = classroomRepository.spSalonEkle(
                dto.getClassroomName(),
                dto.getCapacity(),
                dto.getClassroomType(),
                dto.getFloor()
        );
        logRepository.log("Salon eklendi", dto.getClassroomName() + " (Kap: " + dto.getCapacity() + ")", "Başarılı");
        return id;
    }

    @Transactional
    public List<ClassroomRequestDTO> getAllClassrooms() {
        List<Object[]> rows = classroomRepository.spSalonlariListele();
        List<ClassroomRequestDTO> dtoList = new ArrayList<>();

        for (Object[] row : rows) {
            dtoList.add(new ClassroomRequestDTO(
                    row[0] != null ? ((Number) row[0]).intValue() : null,
                    row[1] != null ? row[1].toString() : null,
                    row[2] != null ? ((Number) row[2]).intValue() : 0,
                    row[3] != null ? row[3].toString() : "Sınıf",
                    row[4] != null ? ((Number) row[4]).intValue() : 0,
                    row[5] == null || (Boolean) row[5]
            ));
        }
        return dtoList;
    }

    @Transactional
    public List<SinavRequestDTO> getAllExams() {
        List<Object[]> rows = sInavRepository.spTumSinavlariGetir();
        List<SinavRequestDTO> dtoList = new ArrayList<>();

        for (Object[] row : rows) {
            SinavRequestDTO dto = new SinavRequestDTO();
            dto.setId(((Number) row[0]).intValue());
            dto.setCourseId(((Number) row[1]).intValue());
            dto.setDate((LocalDate) row[2]);
            dto.setSessionId(((Number) row[3]).intValue());
            dto.setClassroom(row[4] != null ? row[4].toString() : "");
            dto.setStudentCount(((Number) row[5]).intValue());
            dto.setCourseCode(row[6] != null ? row[6].toString() : "");
            dto.setCourseName(row[7] != null ? row[7].toString() : "");
            dto.setClassroomName(row[8] != null ? row[8].toString() : "Tanımsız Salon");
            dto.setDepartmentId(row[9] != null ? ((Number) row[9]).intValue() : null);
            dto.setDepartment(row[10] != null ? row[10].toString() : "");
            dto.setSemester(row[11] != null ? ((Number) row[11]).intValue() : null);
            dto.setTime(row[12] != null ? row[12].toString().substring(0, 5) : "");
            dto.setSessionName(row[13] != null ? row[13].toString() : "");
            dto.setSupervisor(row[14] != null ? row[14].toString() : "Atama Bekliyor");
            dto.setStatus("Atama Bekliyor".equals(dto.getSupervisor()) ? "Atama Bekliyor" : "Planlandı");
            dtoList.add(dto);
        }
        return dtoList;
    }

    @Transactional
    public Integer addNewSupervisor(SupervisorRequestDTO dto) {
        Integer id = supervisorRepository.createSupervisor(dto);
        logRepository.log("Personel eklendi", dto.getName(), "Başarılı");
        return id;
    }

    @Transactional
    public List<SupervisorRequestDTO> getAllSupervisors() {
        return supervisorRepository.listSupervisors();
    }

    @Transactional
    public void addSupervisorLeave(Integer supervisorId, LocalDate date, Integer sessionId, String reason) {
        supervisorRepository.addLeave(supervisorId, date, sessionId, reason);
        logRepository.log("Personel mazereti eklendi", supervisorId + " / " + date + " / " + sessionId, "Başarılı");
    }

    @Transactional
    public void addSupervisorLeaveForDay(Integer supervisorId, LocalDate date, String reason) {
        List<OturumRequestDTO> sessions = getAllSessions();
        for (OturumRequestDTO session : sessions) {
            supervisorRepository.addLeave(supervisorId, date, session.getId(), reason);
        }
        logRepository.log("Personel tam gün mazereti eklendi", supervisorId + " / " + date, "Başarılı");
    }

    @Transactional
    public void assignSupervisor(AssignmentRequestDTO dto) {
        AssignmentRepository.ExamSlot slot = assignmentRepository.findExamSlot(dto.getExamId());
        List<Integer> examIds = assignmentRepository.unassignedExamSalonIds(dto.getExamId());
        if (examIds.isEmpty()) {
            throw new IllegalArgumentException("Bu sınava gözetmen atanmış.");
        }

        List<AssignmentRepository.Candidate> candidates = assignmentRepository.candidates(slot.departmentId(), dto.getSupervisorId());
        Set<Integer> usedInThisExam = new HashSet<>();

        for (Integer examId : examIds) {
            AssignmentRepository.Candidate selected = candidates.stream()
                    .filter(candidate -> !usedInThisExam.contains(candidate.personelId()))
                    .filter(candidate -> assignmentRepository.isAvailable(candidate.personelId(), slot.date(), slot.sessionId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Uygun gözetmen bulunamadı. Bölüm ve ortak havuz yetersiz."));

            assignmentRepository.assign(examId, selected.personelId());
            usedInThisExam.add(selected.personelId());
        }

        logRepository.log("Gözetmen atandı", "SınavID " + dto.getExamId() + " için " + usedInThisExam.size() + " personel", "Başarılı");
    }

    @Transactional
    public List<LogRequestDTO> getAllLogs() {
        return logRepository.listLogs();
    }

    @Transactional
    public List<ReportRequestDTO> getExamProgramReport() {
        return reportRepository.examProgram();
    }

    @Transactional
    public String runBackup() {
        entityManager.createNativeQuery("EXEC dbo.sp_VeritabaniYedekAl").executeUpdate();
        logRepository.log("Yedekleme tamamlandı", "sp_VeritabaniYedekAl çalıştırıldı", "Başarılı");
        return "Veritabanı yedeği başarıyla oluşturuldu.";
    }
}
