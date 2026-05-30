package com.example.backend.repository;

import com.example.backend.request.LogRequestDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Repository
public class LogRepository {
    @PersistenceContext
    private EntityManager entityManager;

    public void log(String action, String detail, String level) {
        entityManager.createNativeQuery(
                        "INSERT INTO dbo.Log_Kayitlari (IslemTuru, EskiDeger, YeniDeger, DegistirenKullanici) VALUES (:action, NULL, :detail, :user)")
                .setParameter("action", action)
                .setParameter("detail", detail)
                .setParameter("user", level == null ? "Sistem" : level)
                .executeUpdate();
    }

    @SuppressWarnings("unchecked")
    public List<LogRequestDTO> listLogs() {
        List<Object[]> rows = entityManager.createNativeQuery(
                        "SELECT TOP 100 LogID, IslemTarihi, IslemTuru, ISNULL(YeniDeger, ''), ISNULL(DegistirenKullanici, 'Bilgi') " +
                                "FROM dbo.Log_Kayitlari ORDER BY IslemTarihi DESC, LogID DESC")
                .getResultList();
        List<LogRequestDTO> logs = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
        for (Object[] row : rows) {
            String time = row[1] instanceof Timestamp timestamp ? timestamp.toLocalDateTime().format(formatter) : row[1].toString();
            logs.add(new LogRequestDTO(((Number) row[0]).intValue(), time, row[2].toString(), row[3].toString(), row[4].toString()));
        }
        return logs;
    }
}
