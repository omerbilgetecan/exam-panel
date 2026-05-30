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
                        "SELECT " +
                                "(SELECT COUNT(*) FROM dbo.Dersler), " +
                                "(SELECT COUNT(*) FROM dbo.Personel WHERE Aktif = 1), " +
                                "(SELECT COUNT(*) FROM dbo.Sinavlar), " +
                                "(SELECT COUNT(*) FROM dbo.Sinavlar s WHERE EXISTS (SELECT 1 FROM dbo.Gozetmen_Atamalari ga WHERE ga.SinavID = s.SinavID)), " +
                                "(SELECT COUNT(*) FROM dbo.Sinavlar s WHERE NOT EXISTS (SELECT 1 FROM dbo.Gozetmen_Atamalari ga WHERE ga.SinavID = s.SinavID)), " +
                                "(SELECT CASE WHEN SUM(Kapasite) > 0 THEN CAST((SELECT ISNULL(SUM(ISNULL(s.OgrenciSayisi, d.OgrenciSayisi)), 0) FROM dbo.Sinavlar s INNER JOIN dbo.Dersler d ON s.DersID = d.DersID) * 100.0 / SUM(Kapasite) AS int) ELSE 0 END FROM dbo.Derslikler)")
                .getSingleResult();

        DashboardRequestDTO dto = new DashboardRequestDTO();
        dto.setCourseCount((row[0] != null) ? ((Number) row[0]).intValue() : 0);
        dto.setPersonnelCount((row[1] != null) ? ((Number) row[1]).intValue() : 0);
        dto.setExamCount((row[2] != null) ? ((Number) row[2]).intValue() : 0);
        dto.setAssignedCount((row[3] != null) ? ((Number) row[3]).intValue() : 0);
        dto.setPendingCount((row[4] != null) ? ((Number) row[4]).intValue() : 0);
        dto.setRoomUsage((row[5] != null) ? ((Number) row[5]).intValue() : 0);
        return dto;
    }
}
