package com.example.backend.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Repository
public class SInavRepository {
    @PersistenceContext
    private EntityManager entityManager;

    public record CourseInfo(Integer id, String code, String name, Integer departmentId, String department,
                             Integer semester, Integer studentCount) {
    }

    public record RoomInfo(Integer id, String name, Integer capacity, Integer floor) {
    }

    public CourseInfo findCourse(Integer courseId) {
        Object[] row = (Object[]) entityManager.createNativeQuery(
                        "SELECT d.DersID, d.DersKodu, d.DersAdi, d.BolumID, b.BolumAdi, d.Yariyil, d.OgrenciSayisi " +
                                "FROM dbo.Dersler d INNER JOIN dbo.Bolumler b ON d.BolumID = b.BolumID WHERE d.DersID = :courseId")
                .setParameter("courseId", courseId)
                .getSingleResult();

        return new CourseInfo(
                ((Number) row[0]).intValue(),
                row[1].toString(),
                row[2].toString(),
                ((Number) row[3]).intValue(),
                row[4].toString(),
                ((Number) row[5]).intValue(),
                ((Number) row[6]).intValue()
        );
    }

    public boolean hasSemesterSessionConflict(LocalDate date, Integer sessionId, Integer departmentId, Integer semester) {
        Number count = (Number) entityManager.createNativeQuery(
                        "SELECT COUNT(*) FROM dbo.Sinavlar s " +
                                "INNER JOIN dbo.Dersler d ON s.DersID = d.DersID " +
                                "WHERE s.Tarih = :date AND s.OturumID = :sessionId AND d.BolumID = :departmentId AND d.Yariyil = :semester")
                .setParameter("date", date)
                .setParameter("sessionId", sessionId)
                .setParameter("departmentId", departmentId)
                .setParameter("semester", semester)
                .getSingleResult();
        return count.intValue() > 0;
    }

    @SuppressWarnings("unchecked")
    public List<Integer> sameSemesterSessionsOnDate(LocalDate date, Integer departmentId, Integer semester) {
        List<Number> rows = entityManager.createNativeQuery(
                        "SELECT s.OturumID FROM dbo.Sinavlar s " +
                                "INNER JOIN dbo.Dersler d ON s.DersID = d.DersID " +
                                "WHERE s.Tarih = :date AND d.BolumID = :departmentId AND d.Yariyil = :semester")
                .setParameter("date", date)
                .setParameter("departmentId", departmentId)
                .setParameter("semester", semester)
                .getResultList();

        return rows.stream().map(Number::intValue).toList();
    }

    public boolean isRoomBusy(String roomName, LocalDate date, Integer sessionId) {
        Number count = (Number) entityManager.createNativeQuery(
                        "SELECT COUNT(*) FROM dbo.Sinavlar s " +
                                "INNER JOIN dbo.Derslikler dl ON s.DerslikID = dl.DerslikID " +
                                "WHERE dl.DerslikAdi = :roomName AND s.Tarih = :date AND s.OturumID = :sessionId")
                .setParameter("roomName", roomName)
                .setParameter("date", date)
                .setParameter("sessionId", sessionId)
                .getSingleResult();
        return count.intValue() > 0;
    }

    public RoomInfo findRoomByName(String roomName) {
        Object[] row = (Object[]) entityManager.createNativeQuery(
                        "SELECT DerslikID, DerslikAdi, Kapasite, ISNULL(Kat, 0) FROM dbo.Derslikler WHERE DerslikAdi = :roomName AND Aktif = 1")
                .setParameter("roomName", roomName)
                .getSingleResult();
        return new RoomInfo(((Number) row[0]).intValue(), row[1].toString(), ((Number) row[2]).intValue(), ((Number) row[3]).intValue());
    }

    @SuppressWarnings("unchecked")
    public List<RoomInfo> availableRooms(LocalDate date, Integer sessionId) {
        List<Object[]> rows = entityManager.createNativeQuery(
                        "SELECT dl.DerslikID, dl.DerslikAdi, dl.Kapasite, ISNULL(dl.Kat, 0) " +
                        "FROM dbo.Derslikler dl WHERE dl.Aktif = 1 AND NOT EXISTS (" +
                                "SELECT 1 FROM dbo.Sinavlar s " +
                                "WHERE s.DerslikID = dl.DerslikID AND s.Tarih = :date AND s.OturumID = :sessionId) " +
                                "ORDER BY ISNULL(dl.Kat, 0), dl.Kapasite DESC, dl.DerslikAdi")
                .setParameter("date", date)
                .setParameter("sessionId", sessionId)
                .getResultList();

        List<RoomInfo> rooms = new ArrayList<>();
        for (Object[] row : rows) {
            rooms.add(new RoomInfo(((Number) row[0]).intValue(), row[1].toString(), ((Number) row[2]).intValue(), ((Number) row[3]).intValue()));
        }
        return rooms;
    }

    public List<RoomInfo> bestRoomCombination(LocalDate date, Integer sessionId, Integer studentCount, String preferredRoom) {
        List<RoomInfo> available = new ArrayList<>(availableRooms(date, sessionId));
        List<RoomInfo> selected = new ArrayList<>();

        if (preferredRoom != null && !preferredRoom.isBlank()) {
            RoomInfo room = findRoomByName(preferredRoom);
            if (!available.stream().anyMatch(item -> item.id().equals(room.id()))) {
                throw new IllegalArgumentException("Seçilen salon bu tarih ve oturumda dolu: " + preferredRoom);
            }
            selected.add(room);
            available.removeIf(item -> item.id().equals(room.id()));
        }

        int remaining = studentCount - selected.stream().mapToInt(RoomInfo::capacity).sum();
        while (remaining > 0 && !available.isEmpty()) {
            Integer targetFloor = selected.isEmpty() ? null : selected.get(0).floor();
            int neededSeats = remaining;
            RoomInfo next = available.stream()
                    .filter(room -> targetFloor == null || room.floor().equals(targetFloor))
                    .min(Comparator.comparingInt((RoomInfo room) -> room.capacity() >= neededSeats ? room.capacity() - neededSeats : Integer.MAX_VALUE - room.capacity()))
                    .orElseGet(() -> available.stream()
                            .min(Comparator.comparingInt(room -> room.capacity() >= neededSeats ? room.capacity() - neededSeats : Integer.MAX_VALUE - room.capacity()))
                            .orElseThrow());
            selected.add(next);
            available.removeIf(item -> item.id().equals(next.id()));
            remaining -= next.capacity();
        }

        if (selected.stream().mapToInt(RoomInfo::capacity).sum() < studentCount) {
            throw new IllegalArgumentException("Müsait salonların toplam kapasitesi bu ders için yetersiz.");
        }

        return selected;
    }

    public Integer createExamWithRooms(LocalDate date, Integer sessionId, Integer courseId, List<RoomInfo> rooms) {
        Integer firstExamId = null;
        CourseInfo course = findCourse(courseId);
        for (RoomInfo room : rooms) {
            Object result = entityManager.createNativeQuery(
                            "INSERT INTO dbo.Sinavlar (DersID, Tarih, OturumID, DerslikID, OgrenciSayisi) " +
                                    "OUTPUT INSERTED.SinavID VALUES (:courseId, :date, :sessionId, :roomId, :studentCount)")
                    .setParameter("courseId", courseId)
                    .setParameter("date", date)
                    .setParameter("sessionId", sessionId)
                    .setParameter("roomId", room.id())
                    .setParameter("studentCount", course.studentCount())
                    .getSingleResult();
            if (firstExamId == null) {
                firstExamId = ((Number) result).intValue();
            }
        }

        return firstExamId;
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> spTumSinavlariGetir() {
        return entityManager.createNativeQuery(
                        "SELECT s.SinavID, d.DersID, s.Tarih, s.OturumID, " +
                                "dl.DerslikAdi AS classroom, ISNULL(s.OgrenciSayisi, d.OgrenciSayisi), d.DersKodu, d.DersAdi, " +
                                "dl.DerslikAdi AS classroomName, b.BolumID, b.BolumAdi, d.Yariyil, o.BaslangicSaat, o.OturumAdi, " +
                                "ISNULL(STRING_AGG(CONCAT(p.Unvan, ' ', p.Ad, ' ', p.Soyad), N', '), N'Atama Bekliyor') AS supervisor " +
                                "FROM dbo.Sinavlar s " +
                                "INNER JOIN dbo.Dersler d ON s.DersID = d.DersID " +
                                "INNER JOIN dbo.Bolumler b ON d.BolumID = b.BolumID " +
                                "INNER JOIN dbo.Oturumlar o ON s.OturumID = o.OturumID " +
                                "INNER JOIN dbo.Derslikler dl ON s.DerslikID = dl.DerslikID " +
                                "LEFT JOIN dbo.Gozetmen_Atamalari ga ON s.SinavID = ga.SinavID " +
                                "LEFT JOIN dbo.Personel p ON ga.PersonelID = p.PersonelID " +
                                "GROUP BY s.SinavID, d.DersID, s.Tarih, s.OturumID, dl.DerslikAdi, s.OgrenciSayisi, " +
                                "d.OgrenciSayisi, d.DersKodu, d.DersAdi, b.BolumID, b.BolumAdi, d.Yariyil, o.BaslangicSaat, o.OturumAdi " +
                                "ORDER BY s.Tarih, o.BaslangicSaat, d.DersKodu")
                .getResultList();
    }
}
