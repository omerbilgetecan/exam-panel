package com.example.backend.repository;

import com.example.backend.request.DersRequestDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class DersRepository {
    @PersistenceContext
    private EntityManager entityManager;

    public Integer spDersEkle(String dersKodu,
                              String dersAdi,
                              int ogrenciSayisi,
                              int yariyil,
                              int bolumID) {

        Object result = entityManager.createNativeQuery(
                        "INSERT INTO dbo.Dersler (DersKodu, DersAdi, DersTuru, OgrenciSayisi, Yariyil, BolumID) " +
                                "OUTPUT INSERTED.DersID VALUES (:dersKodu, :dersAdi, 'Zorunlu', :ogrenciSayisi, :yariyil, :bolumID)")
                .setParameter("dersKodu", dersKodu)
                .setParameter("dersAdi", dersAdi)
                .setParameter("ogrenciSayisi", ogrenciSayisi)
                .setParameter("yariyil", yariyil)
                .setParameter("bolumID", bolumID)
                .getSingleResult();

        return (result != null) ? ((Number) result).intValue() : null;
    }

    @SuppressWarnings("unchecked")
    public List<DersRequestDTO> spDersleriGetir() {
        List<Object[]> rows = entityManager.createNativeQuery(
                        "SELECT d.DersID, d.DersKodu, d.DersAdi, d.OgrenciSayisi, d.Yariyil, d.BolumID, b.BolumAdi " +
                                "FROM dbo.Dersler d INNER JOIN dbo.Bolumler b ON d.BolumID = b.BolumID " +
                                "ORDER BY b.BolumAdi, d.Yariyil, d.DersKodu")
                .getResultList();

        List<DersRequestDTO> dtoList = new ArrayList<>();

        for (Object[] row : rows) {
            Integer id = (row[0] != null) ? ((Number) row[0]).intValue() : null;
            String dersKodu = (row[1] != null) ? row[1].toString() : null;
            String dersAdi = (row[2] != null) ? row[2].toString() : null;
            int ogrenciSayisi = (row[3] != null) ? ((Number) row[3]).intValue() : 0;
            int yariyil = (row[4] != null) ? ((Number) row[4]).intValue() : 0;
            int bolumId = (row[5] != null) ? ((Number) row[5]).intValue() : 0;
            String bolumAdi = (row[6] != null) ? row[6].toString() : null;

            dtoList.add(new DersRequestDTO(id, dersKodu, bolumId, dersAdi, ogrenciSayisi, yariyil, bolumAdi));
        }

        return dtoList;
    }

    public Integer spDersSayisi() {
        return spDersleriGetir().size();
    }
}
