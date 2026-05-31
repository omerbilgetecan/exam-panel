package com.example.backend.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Repository
public class AssignmentRepository {
    @PersistenceContext
    private EntityManager entityManager;

    public record ExamSlot(Integer examId, LocalDate date, Integer sessionId, Integer departmentId) {
    }

    public record Candidate(Integer personelId, Integer departmentId, String name, Integer dutyCount, Integer sortGroup) {
    }

    public ExamSlot findExamSlot(Integer examId) {
        Object[] row = (Object[]) entityManager.createNativeQuery(
                        "SELECT s.SinavID, s.Tarih, s.OturumID, d.BolumID FROM dbo.Sinavlar s INNER JOIN dbo.Dersler d ON s.DersID = d.DersID WHERE s.SinavID = :examId")
                .setParameter("examId", examId)
                .getSingleResult();
        LocalDate examDate;

if (row[1] instanceof java.sql.Date sqlDate) {
    examDate = sqlDate.toLocalDate();
} else {
    examDate = (LocalDate) row[1];
}

return new ExamSlot(
        ((Number) row[0]).intValue(),
        examDate,
        ((Number) row[2]).intValue(),
        ((Number) row[3]).intValue()
);
    }

    @SuppressWarnings("unchecked")
    public List<Integer> unassignedExamSalonIds(Integer examId) {
        List<Number> rows = entityManager.createNativeQuery(
                        "SELECT target.SinavID FROM dbo.Sinavlar base " +
                                "INNER JOIN dbo.Sinavlar target ON target.DersID = base.DersID AND target.Tarih = base.Tarih AND target.OturumID = base.OturumID " +
                                "WHERE base.SinavID = :examId " +
                                "AND NOT EXISTS (SELECT 1 FROM dbo.Gozetmen_Atamalari ga WHERE ga.SinavID = target.SinavID)")
                .setParameter("examId", examId)
                .getResultList();
        return rows.stream().map(Number::intValue).toList();
    }

    @SuppressWarnings("unchecked")
    public List<Candidate> candidates(Integer departmentId, Integer preferredSupervisorId) {
        List<Object[]> rows = entityManager.createNativeQuery(
                        "SELECT p.PersonelID, p.BolumID, CONCAT(p.Unvan, ' ', p.Ad, ' ', p.Soyad), " +
                                "(SELECT COUNT(*) FROM dbo.Gozetmen_Atamalari ga WHERE ga.PersonelID = p.PersonelID) AS DutyCount, " +
                                "CASE WHEN p.PersonelID = :preferred THEN 0 WHEN p.BolumID = :departmentId THEN 1 WHEN b.BolumAdi LIKE N'%Ortak%' THEN 2 ELSE 3 END AS SortGroup " +
                                "FROM dbo.Personel p INNER JOIN dbo.Bolumler b ON p.BolumID = b.BolumID " +
                                "WHERE p.Aktif = 1 AND (p.PersonelID = :preferred OR p.BolumID = :departmentId OR b.BolumAdi LIKE N'%Ortak%') " +
                                "ORDER BY SortGroup, DutyCount, p.Ad, p.Soyad")
                .setParameter("preferred", preferredSupervisorId == null ? -1 : preferredSupervisorId)
                .setParameter("departmentId", departmentId)
                .getResultList();

        List<Candidate> candidates = new ArrayList<>();
        for (Object[] row : rows) {
            candidates.add(new Candidate(((Number) row[0]).intValue(), ((Number) row[1]).intValue(), row[2].toString(), ((Number) row[3]).intValue(), ((Number) row[4]).intValue()));
        }
        candidates.sort(Comparator.comparingInt(Candidate::sortGroup).thenComparingInt(Candidate::dutyCount));
        return candidates;
    }

    public boolean isAvailable(Integer personelId, LocalDate date, Integer sessionId) {
        Number sameSlot = (Number) entityManager.createNativeQuery(
                        "SELECT COUNT(*) FROM dbo.Gozetmen_Atamalari ga " +
                                "INNER JOIN dbo.Sinavlar s ON ga.SinavID = s.SinavID " +
                                "WHERE ga.PersonelID = :personelId AND s.Tarih = :date AND s.OturumID = :sessionId")
                .setParameter("personelId", personelId)
                .setParameter("date", date)
                .setParameter("sessionId", sessionId)
                .getSingleResult();
        if (sameSlot.intValue() > 0) return false;

        Number leave = (Number) entityManager.createNativeQuery(
                        "SELECT COUNT(*) FROM dbo.Personel_Durum WHERE PersonelID = :personelId AND Tarih = :date AND OturumID = :sessionId AND Uygun = 0")
                .setParameter("personelId", personelId)
                .setParameter("date", date)
                .setParameter("sessionId", sessionId)
                .getSingleResult();
        if (leave.intValue() > 0) return false;

        Number dayCount = (Number) entityManager.createNativeQuery(
                        "SELECT COUNT(DISTINCT s.OturumID) FROM dbo.Gozetmen_Atamalari ga " +
                                "INNER JOIN dbo.Sinavlar s ON ga.SinavID = s.SinavID " +
                                "WHERE ga.PersonelID = :personelId AND s.Tarih = :date")
                .setParameter("personelId", personelId)
                .setParameter("date", date)
                .getSingleResult();
        if (dayCount.intValue() >= 4) return false;

        return !wouldBreakConsecutiveRule(personelId, date, sessionId);
    }

    @SuppressWarnings("unchecked")
    private boolean wouldBreakConsecutiveRule(Integer personelId, LocalDate date, Integer newSessionId) {
        List<Number> rows = entityManager.createNativeQuery(
                        "SELECT DISTINCT s.OturumID FROM dbo.Gozetmen_Atamalari ga " +
                                "INNER JOIN dbo.Sinavlar s ON ga.SinavID = s.SinavID " +
                                "WHERE ga.PersonelID = :personelId AND s.Tarih = :date")
                .setParameter("personelId", personelId)
                .setParameter("date", date)
                .getResultList();
        List<Integer> sessions = new ArrayList<>(rows.stream().map(Number::intValue).toList());
        sessions.add(newSessionId);
        sessions.sort(Integer::compareTo);

        int chain = 1;
        for (int i = 1; i < sessions.size(); i++) {
            if (sessions.get(i).equals(sessions.get(i - 1) + 1)) {
                chain++;
                if (chain > 3) return true;
            } else if (!sessions.get(i).equals(sessions.get(i - 1))) {
                chain = 1;
            }
        }
        return false;
    }

    public void assign(Integer sinavId, Integer personelId) {
        entityManager.createNativeQuery(
                        "INSERT INTO dbo.Gozetmen_Atamalari (SinavID, PersonelID) VALUES (:sinavId, :personelId)")
                .setParameter("sinavId", sinavId)
                .setParameter("personelId", personelId)
                .executeUpdate();
    }
}
