package com.example.backend.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ClassroomRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public Integer spSalonEkle(String derslikAdi, int kapasite, String derslikTipi, int kat) {
        Object result = entityManager.createNativeQuery(
                        "INSERT INTO dbo.Derslikler (DerslikAdi, Kapasite, DerslikTipi, Kat, Aktif) " +
                                "OUTPUT INSERTED.DerslikID " + // Yeni üretilen ID'yi doğrudan dışarı fırlatır
                                "VALUES (:derslikAdi, :kapasite, :derslikTipi, :kat, 1);")
                .setParameter("derslikAdi", derslikAdi)
                .setParameter("kapasite", kapasite)
                .setParameter("derslikTipi", derslikTipi)
                .setParameter("kat", kat)
                .getSingleResult(); // OUTPUT sayesinde ID buraya tereyağından kıl çeker gibi düşer

        return (result != null) ? ((Number) result).intValue() : null;
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> spSalonlariListele() {
        // Veritabanındaki Derslikler tablosundan aktif olan salonları çekiyoruz
        return entityManager.createNativeQuery(
                        "SELECT DerslikID, DerslikAdi, Kapasite, DerslikTipi, Kat, Aktif FROM dbo.Derslikler WHERE Aktif = 1 ORDER BY Kat, Kapasite DESC, DerslikAdi")
                .getResultList();
    }
}
