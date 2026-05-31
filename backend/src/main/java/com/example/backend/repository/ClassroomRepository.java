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
    return entityManager.createNativeQuery(
        "WITH SalonDagilim AS ( " +
        "   SELECT s.SinavID, s.DersID, s.Tarih, s.OturumID, s.DerslikID, s.OgrenciSayisi, dl.Kapasite, " +
        "          ISNULL(SUM(dl.Kapasite) OVER ( " +
        "              PARTITION BY s.DersID, s.Tarih, s.OturumID " +
        "              ORDER BY s.SinavID " +
        "              ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING " +
        "          ), 0) AS OncekiKapasite " +
        "   FROM dbo.Sinavlar s " +
        "   INNER JOIN dbo.Derslikler dl ON s.DerslikID = dl.DerslikID " +
        "), SalonKullanim AS ( " +
        "   SELECT DerslikID, " +
        "          SUM( " +
        "              CASE " +
        "                  WHEN OgrenciSayisi - OncekiKapasite <= 0 THEN 0 " +
        "                  WHEN OgrenciSayisi - OncekiKapasite >= Kapasite THEN Kapasite " +
        "                  ELSE OgrenciSayisi - OncekiKapasite " +
        "              END " +
        "          ) AS Assigned " +
        "   FROM SalonDagilim " +
        "   GROUP BY DerslikID " +
        ") " +
        "SELECT d.DerslikID, d.DerslikAdi, d.Kapasite, d.DerslikTipi, d.Kat, d.Aktif, " +
        "       ISNULL(k.Assigned, 0) AS Assigned " +
        "FROM dbo.Derslikler d " +
        "LEFT JOIN SalonKullanim k ON d.DerslikID = k.DerslikID " +
        "WHERE d.Aktif = 1 " +
        "ORDER BY d.Kat, d.Kapasite DESC, d.DerslikAdi"
    ).getResultList();
}
               
}

