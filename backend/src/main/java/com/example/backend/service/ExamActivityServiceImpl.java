package com.example.backend.service;

import com.example.backend.repository.*;

import com.example.backend.request.*;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExamActivityServiceImpl {
    private  final BolumRepository bolumRepository;
    private  final DersRepository dersRepository;
    private  final DashboardRepository dashboardRepository;
    private  final OturumRepository oturumRepository;
    private final ClassroomRepository classroomRepository;
    private final SInavRepository sInavRepository;

    public ExamActivityServiceImpl(BolumRepository bolumRepository,  DersRepository dersRepository,
                                    DashboardRepository dashboardRepository,
                                   OturumRepository oturumRepository,
                                   ClassroomRepository classroomRepository,
                                   SInavRepository sInavRepository) {
        this.bolumRepository = bolumRepository;
        this.dersRepository = dersRepository;
        this.dashboardRepository = dashboardRepository;
        this.oturumRepository = oturumRepository;
        this.classroomRepository = classroomRepository;
        this.sInavRepository = sInavRepository;
    }


    @Transactional
    public Integer addNewBolum(String bolumAdi) {
        return bolumRepository.spBolumEkle(bolumAdi);
    }

    @Transactional()
    public List<BolumRequestDTO> getAllDepartments() {
        return bolumRepository.spBolumleriGetir();
    }


    @Transactional
    public Integer addNewDers(DersRequestDTO dto) {
        // DTO'dan gelen temiz verileri sırasıyla SQL procedure metodumuza gönderiyoruz
        return dersRepository.spDersEkle(
                dto.getCode(),
                dto.getName(),
                dto.getStudentCount(),
                dto.getSemester(),
                dto.getDepartmentId() // Ekleme yaparken SQL bizden ID bekliyor, isim değil!
        );
    }

    @Transactional
    public Integer addNewSinav(SinavRequestDTO dto) {
        // Sıralama: date, sessionId, courseId, classroom, studentCount
        return sInavRepository.spSinavEkle(
                dto.getDate(),
                dto.getSessionId(),
                dto.getCourseId(),
                dto.getClassroom(),
                dto.getStudentCount()
        );
    }

    @Transactional()
    public List<DersRequestDTO> getAllCourses() {
        return dersRepository.spDersleriGetir();
    }

    @Transactional()
    public DashboardRequestDTO getDashboard() {
        return dashboardRepository.getDashboardStatsFromProcedure();
    }

    @Transactional
    public Integer addNewSession(OturumRequestDTO dto) {
        // 1. KONTROL: Başlangıç ve bitiş saati birbirine eşit veya mantıksız mı?
        if (dto.getStartTime().equals(dto.getEndTime())) {
            throw new IllegalArgumentException("Hata: Başlangıç saati ile bitiş saati aynı olamaz!");
        }
        if (dto.getStartTime().compareTo(dto.getEndTime()) > 0) {
            throw new IllegalArgumentException("Hata: Başlangıç saati, bitiş saatinden sonra olamaz!");
        }

        // 2. KONTROL: Veritabanında aynı saatlere sahip başka bir oturum var mı?
        List<OturumRequestDTO> existingSessions = oturumRepository.spOturumlarıListele();
        boolean isDuplicate = existingSessions.stream().anyMatch(s ->
                s.getStartTime().equals(dto.getStartTime()) && s.getEndTime().equals(dto.getEndTime())
        );

        if (isDuplicate) {
            throw new IllegalArgumentException("Hata: Bu zaman aralığına ait bir oturum zaten sistemde mevcut!");
        }

        return oturumRepository.spOturumEkle(
                dto.getName(),
                dto.getStartTime(),
                dto.getEndTime()
        );
    }

    @Transactional()
    public List<OturumRequestDTO> getAllSessions() {
        return oturumRepository.spOturumlarıListele();
    }

    @Transactional
    public Integer addNewClassroom(ClassroomRequestDTO dto) {
        // İş Kuralı: Veritabanındaki CHECK constraint'e takılmamak için kapasite kontrolü
        if (dto.getCapacity() <= 0) {
            throw new IllegalArgumentException("Hata: Sınav salonu kapasitesi 0'dan büyük olmalıdır!");
        }

        return classroomRepository.spSalonEkle(
                dto.getClassroomName(),
                dto.getCapacity(),
                dto.getClassroomType(),
                dto.getFloor()
        );
    }

    @Transactional()
    public List<ClassroomRequestDTO> getAllClassrooms() {
        List<Object[]> rows = classroomRepository.spSalonlariListele();
        List<ClassroomRequestDTO> dtoList = new ArrayList<>();

        for (Object[] row : rows) {
            // Veritabanından gelen kolonların maplenmesi (SELECT DerslikID, DerslikAdi, Kapasite, Kat)
            // Integer id = (row[0] != null) ? ((Number) row[0]).intValue() : null; // Liste ekranında ID gerekirse ayrı taşınır ama DTO'muzda yer almıyor
            String classroomName = (row[1] != null) ? row[1].toString() : null;
            int capacity = (row[2] != null) ? ((Number) row[2]).intValue() : 0;
            int floor = (row[3] != null) ? ((Number) row[3]).intValue() : 0;

            // Kendi yazdığın ClassroomRequestDTO'nun constructor yapısına (%100) sadık kalıyoruz:
            // Sıralama: String classroomName, int capacity, String classroomType, int floor, boolean active
            // classroomType alanına varsayılan "Sınıf" geçiyoruz (Veritabanında tip listelenmediği için), active ise true (1)
            ClassroomRequestDTO dto = new ClassroomRequestDTO(
                    classroomName,
                    capacity,
                    "Sınıf",
                    floor,
                    true
            );

            dtoList.add(dto);
        }
        return dtoList;
    }

    @Transactional()
    public List<SinavRequestDTO> getAllExams() {
        // Repository'nizdeki findAll veya geliştirdiğiniz bir native query/procedure çağrısı
        List<Object[]> rows = sInavRepository.spTumSinavlariGetir();
        List<SinavRequestDTO> dtoList = new ArrayList<>();

        for (Object[] row : rows) {
            SinavRequestDTO dto = new SinavRequestDTO();
            // SQL Server'dan gelen kolon sırasına göre map'leme yapıyoruz:
            dto.setId(((Number) row[0]).intValue());
            dto.setCourseId(((Number) row[1]).intValue());
            dto.setDate((java.time.LocalDate) row[2]); // Tarih dönüşümü
            dto.setSessionId(((Number) row[3]).intValue());      // 🔥 Çakışmayı çözecek olan kritik ID
            dto.setClassroom(row[4].toString());
            dto.setStudentCount(((Number) row[5]).intValue());

            dtoList.add(dto);
        }
        return dtoList;
    }


}
