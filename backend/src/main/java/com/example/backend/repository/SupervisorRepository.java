package com.example.backend.repository;

import com.example.backend.request.SupervisorRequestDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Repository
public class SupervisorRepository {
    @PersistenceContext
    private EntityManager entityManager;

    public Integer createSupervisor(SupervisorRequestDTO dto) {
        String fullName = dto.getName() != null ? dto.getName().trim() : "";
        String firstName = dto.getFirstName();
        String lastName = dto.getLastName();
        if ((firstName == null || firstName.isBlank()) && !fullName.isBlank()) {
            String[] parts = fullName.replace(dto.getTitle() == null ? "" : dto.getTitle(), "").trim().split("\\s+");
            firstName = parts.length > 0 ? parts[0] : fullName;
            lastName = parts.length > 1 ? String.join(" ", java.util.Arrays.copyOfRange(parts, 1, parts.length)) : "";
        }
        Integer departmentId = dto.getDepartmentId();
        if (departmentId == null && dto.getDepartment() != null && !dto.getDepartment().isBlank()) {
            departmentId = findDepartmentIdByName(dto.getDepartment());
        }
        if (departmentId == null) {
            throw new IllegalArgumentException("Personel kaydı için geçerli bir bölüm seçilmeli.");
        }

        Object result = entityManager.createNativeQuery(
                        "INSERT INTO dbo.Personel (Unvan, Ad, Soyad, BolumID, Aktif) OUTPUT INSERTED.PersonelID " +
                                "VALUES (:title, :firstName, :lastName, :departmentId, 1)")
                .setParameter("title", dto.getTitle() == null ? "" : dto.getTitle())
                .setParameter("firstName", firstName == null ? "" : firstName)
                .setParameter("lastName", lastName == null ? "" : lastName)
                .setParameter("departmentId", departmentId)
                .getSingleResult();

        return (result != null) ? ((Number) result).intValue() : null;
    }

    private Integer findDepartmentIdByName(String departmentName) {
        @SuppressWarnings("unchecked")
        List<Number> rows = entityManager.createNativeQuery(
                        "SELECT TOP 1 BolumID FROM dbo.Bolumler WHERE BolumAdi = :name OR BolumAdi LIKE :likeName ORDER BY BolumID")
                .setParameter("name", departmentName)
                .setParameter("likeName", "%" + departmentName + "%")
                .getResultList();
        return rows.isEmpty() ? null : rows.get(0).intValue();
    }

    @SuppressWarnings("unchecked")
    public List<SupervisorRequestDTO> listSupervisors() {
        List<Object[]> rows = entityManager.createNativeQuery(
                        "SELECT p.PersonelID, p.Unvan, p.Ad, p.Soyad, p.BolumID, b.BolumAdi, " +
                                "(SELECT COUNT(*) FROM dbo.Gozetmen_Atamalari ga WHERE ga.PersonelID = p.PersonelID), " +
                                "CASE WHEN EXISTS (SELECT 1 FROM dbo.Personel_Durum pd WHERE pd.PersonelID = p.PersonelID AND pd.Uygun = 0 AND pd.Tarih >= CAST(GETDATE() AS date)) THEN N'İzinli' ELSE N'Uygun' END " +
                                "FROM dbo.Personel p INNER JOIN dbo.Bolumler b ON p.BolumID = b.BolumID WHERE p.Aktif = 1 " +
                                "ORDER BY b.BolumAdi, p.Unvan, p.Ad, p.Soyad")
                .getResultList();

        List<SupervisorRequestDTO> supervisors = new ArrayList<>();
        for (Object[] row : rows) {
            String title = row[1] != null ? row[1].toString() : "";
            String firstName = row[2] != null ? row[2].toString() : "";
            String lastName = row[3] != null ? row[3].toString() : "";
            String name = (title + " " + firstName + " " + lastName).trim();
            supervisors.add(new SupervisorRequestDTO(
                    ((Number) row[0]).intValue(),
                    title,
                    name,
                    firstName,
                    lastName,
                    ((Number) row[4]).intValue(),
                    row[5] != null ? row[5].toString() : "",
                    ((Number) row[6]).intValue(),
                    row[7] != null ? row[7].toString() : "Uygun"
            ));
        }
        return supervisors;
    }

    public void addLeave(Integer supervisorId, LocalDate date, Integer sessionId, String reason) {
        entityManager.createNativeQuery(
                        "INSERT INTO dbo.Personel_Durum (PersonelID, Tarih, OturumID, MazeretTuru, Uygun) VALUES (:personelId, :date, :sessionId, :reason, 0)")
                .setParameter("personelId", supervisorId)
                .setParameter("date", date)
                .setParameter("sessionId", sessionId)
                .setParameter("reason", reason == null || reason.isBlank() ? "İzinli" : reason)
                .executeUpdate();
    }
}
