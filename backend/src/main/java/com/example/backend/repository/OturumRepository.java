package com.example.backend.repository;

import com.example.backend.request.OturumRequestDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import java.util.ArrayList;
import java.util.List;

@Repository
public class OturumRepository {

    @PersistenceContext
    private EntityManager entityManager;

    // 1. Tüm Oturumları Listeleme Metodu
    @SuppressWarnings("unchecked")
    public List<OturumRequestDTO> spOturumlarıListele() {
        // Veritabanındaki Oturumlar tablosundan doğrudan select atıyoruz
        List<Object[]> rows = entityManager.createNativeQuery(
                        "SELECT OturumID, OturumAdi, CONVERT(VARCHAR(5), BaslangicSaat, 108), CONVERT(VARCHAR(5), BitisSaat, 108) FROM dbo.Oturumlar")
                .getResultList();

        List<OturumRequestDTO> dtoList = new ArrayList<>();

        for (Object[] row : rows) {
            Integer id = (row[0] != null) ? ((Number) row[0]).intValue() : null;
            String name = (row[1] != null) ? row[1].toString() : null;
            String startTime = (row[2] != null) ? row[2].toString() : null; // "09:30" formatında gelir
            String endTime = (row[3] != null) ? row[3].toString() : null;   // "11:00" formatında gelir

            dtoList.add(new OturumRequestDTO(id, name, startTime, endTime));
        }
        return dtoList;
    }

    // 2. Yeni Oturum Ekleme Metodu
    public Integer spOturumEkle(String oturumAdi, String baslangicSaat, String bitisSaat) {
        // Direkt tırnak içinde parametreleri bind ederek insert sorgusunu tetikliyoruz
        Object result = entityManager.createNativeQuery(
                        "INSERT INTO dbo.Oturumlar (OturumAdi, BaslangicSaat, BitisSaat) " +
                                "VALUES (:oturumAdi, :baslangicSaat, :bitisSaat); SELECT SCOPE_IDENTITY();")
                .setParameter("oturumAdi", oturumAdi)
                .setParameter("baslangicSaat", baslangicSaat)
                .setParameter("bitisSaat", bitisSaat)
                .getSingleResult();

        return (result != null) ? ((Number) result).intValue() : null;
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> getOturumStatusByDateAndClassrooms(String date, String classroom1, String classroom2) {
        // Eğer 2. salon seçilmemişse sorgunun patlamaması için geçici bir değer atıyoruz
        String cl2 = (classroom2 == null || classroom2.trim().isEmpty()) ? "---NONE---" : classroom2;

        return entityManager.createNativeQuery(
                        "SELECT o.OturumID, o.OturumAdi, o.BaslangicSaati, o.BitisSaati, " +
                                "CASE WHEN EXISTS (" +
                                "    SELECT 1 FROM dbo.Sinavlar s " +
                                "    WHERE s.Tarih = :date " +
                                "    AND s.OturumID = o.OturumID " +
                                "    AND (s.DerslikID = :classroom1 OR s.DerslikID = :classroom2)" +
                                ") THEN 1 ELSE 0 END as IsConflict " +
                                "FROM dbo.Oturumlar o")
                .setParameter("date", date)
                .setParameter("classroom1", classroom1)
                .setParameter("classroom2", cl2)
                .getResultList();
    }
}