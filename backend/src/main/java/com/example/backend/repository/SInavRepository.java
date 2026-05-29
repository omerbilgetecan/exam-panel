package com.example.backend.repository;

import com.example.backend.request.SinavRequestDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public class SInavRepository {
    @PersistenceContext
    private EntityManager entityManager;

    public Integer spSinavEkle(LocalDate date, Integer oturumID, Integer dersID, String derslik, int ogrenciSayisi) {
        Object result = entityManager.createNativeQuery(
                        "EXEC dbo.sp_SinavEkle " +
                                "@Tarih = :date, " +
                                "@OturumID = :oturumID, " +
                                "@DersID = :dersID, " +
                                "@DerslikID = :derslikID, " + // 🎯 Tam olarak SQL'in beklediği parametre ismiyle eşledik!
                                "@OgrenciSayisi = :ogrenciSayisi")
                .setParameter("date", date)
                .setParameter("oturumID", oturumID)
                .setParameter("dersID", dersID)
                .setParameter("derslikID", derslik) // Sorgudaki :derslikID ile eşleşen kısım
                .setParameter("ogrenciSayisi", ogrenciSayisi) // Bir önceki adımdaki eksik parametremiz
                .getSingleResult();

        return (result != null) ? ((Number) result).intValue() : null;
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> spTumSinavlariGetir() {
        return entityManager.createNativeQuery(
                        "SELECT SinavID, DersID, Tarih, OturumID, DerslikID, OgrenciSayisi FROM dbo.Sinavlar")
                .getResultList();
    }

}
