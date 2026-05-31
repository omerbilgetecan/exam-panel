package com.example.backend.repository;

import com.example.backend.request.DashboardRequestDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

@Repository
public class DashboardRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public DashboardRequestDTO getDashboardStatsFromProcedure() {
    Object[] row = (Object[]) entityManager.createNativeQuery(
            "WITH SinavGruplari AS ( " +
            "   SELECT DersID, Tarih, OturumID, MIN(SinavID) AS AnaSinavID " +
            "   FROM dbo.Sinavlar " +
            "   GROUP BY DersID, Tarih, OturumID " +
            "), SalonDagilim AS ( " +
            "   SELECT s.SinavID, s.DersID, s.Tarih, s.OturumID, s.DerslikID, s.OgrenciSayisi, dl.Kapasite, " +
            "          ISNULL(SUM(dl.Kapasite) OVER ( " +
            "              PARTITION BY s.DersID, s.Tarih, s.OturumID " +
            "              ORDER BY s.SinavID " +
            "              ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING " +
            "          ), 0) AS OncekiKapasite " +
            "   FROM dbo.Sinavlar s " +
            "   INNER JOIN dbo.Derslikler dl ON s.DerslikID = dl.DerslikID " +
            "), Kullanim AS ( " +
            "   SELECT SUM(CASE " +
            "       WHEN OgrenciSayisi - OncekiKapasite <= 0 THEN 0 " +
            "       WHEN OgrenciSayisi - OncekiKapasite >= Kapasite THEN Kapasite " +
            "       ELSE OgrenciSayisi - OncekiKapasite " +
            "   END) AS UsedSeats " +
            "   FROM SalonDagilim " +
            ") " +
            "SELECT " +
            "   (SELECT COUNT(*) FROM dbo.Dersler), " +
            "   (SELECT COUNT(*) FROM dbo.Personel WHERE Aktif = 1), " +
            "   (SELECT COUNT(*) FROM SinavGruplari), " +
            "   (SELECT COUNT(*) FROM SinavGruplari sg WHERE EXISTS ( " +
            "       SELECT 1 FROM dbo.Gozetmen_Atamalari ga WHERE ga.SinavID = sg.AnaSinavID " +
            "   )), " +
            "   (SELECT COUNT(*) FROM SinavGruplari sg WHERE NOT EXISTS ( " +
            "       SELECT 1 FROM dbo.Gozetmen_Atamalari ga WHERE ga.SinavID = sg.AnaSinavID " +
            "   )), " +
            "   (SELECT CASE WHEN SUM(Kapasite) > 0 " +
            "       THEN CAST((SELECT ISNULL(UsedSeats, 0) FROM Kullanim) * 100.0 / SUM(Kapasite) AS int) " +
            "       ELSE 0 END FROM dbo.Derslikler)"
    ).getSingleResult();

    DashboardRequestDTO dto = new DashboardRequestDTO();
    dto.setCourseCount((row[0] != null) ? ((Number) row[0]).intValue() : 0);
    dto.setPersonnelCount((row[1] != null) ? ((Number) row[1]).intValue() : 0);
    dto.setExamCount((row[2] != null) ? ((Number) row[2]).intValue() : 0);
    dto.setAssignedCount((row[3] != null) ? ((Number) row[3]).intValue() : 0);
    dto.setPendingCount((row[4] != null) ? ((Number) row[4]).intValue() : 0);
    int roomUsage = (row[5] != null) ? ((Number) row[5]).intValue() : 0;
    dto.setRoomUsage(Math.max(0, Math.min(100, roomUsage)));
    return dto;
}
}
