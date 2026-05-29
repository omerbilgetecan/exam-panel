package com.example.backend.repository;

import com.example.backend.request.DashboardRequestDTO; // Kendi paket yoluna göre ayarla
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

@Repository
public class DashboardRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public DashboardRequestDTO getDashboardStatsFromProcedure() {
        // Procedure sadece tek bir satır (Object[]) döndürecek
        Object[] row = (Object[]) entityManager.createNativeQuery("EXEC dbo.sp_DashboardIstatistikleri")
                .getSingleResult();

        DashboardRequestDTO dto = new DashboardRequestDTO();

        if (row != null) {
            dto.setCourseCount((row[0] != null) ? ((Number) row[0]).intValue() : 0);
            dto.setPersonnelCount((row[1] != null) ? ((Number) row[1]).intValue() : 0);
            dto.setExamCount((row[2] != null) ? ((Number) row[2]).intValue() : 0);
        }

        return dto;
    }
}