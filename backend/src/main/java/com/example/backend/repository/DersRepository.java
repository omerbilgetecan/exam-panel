package com.example.backend.repository;

import com.example.backend.entity.Ders;
import com.example.backend.request.BolumRequestDTO;
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
                        "EXEC dbo.sp_DersEkle " +
                                "@DersKodu = :dersKodu, " +
                                "@DersAdi = :dersAdi, " +
                                "@OgrenciSayisi = :ogrenciSayisi, " +
                                "@Yariyil = :yariyil, " +
                                "@BolumID = :bolumID")

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
        List<Object[]> rows = entityManager.createNativeQuery("EXEC dbo.sp_DersleriListele")
                .getResultList();

        List<DersRequestDTO> dtoList = new ArrayList<>();

        for (Object[] row : rows) {
            Integer id = (row[0] != null) ? ((Number) row[0]).intValue() : null;
            String dersKodu = (row[1] != null) ? row[1].toString() : null;
            String dersAdi = (row[2] != null) ? row[2].toString() : null;
            int ogrenciSayisi = (row[3] != null) ? ((Number) row[3]).intValue() : 0;
            int yariyil = (row[4] != null) ? ((Number) row[4]).intValue() : 0;


            int bolumId = (row[5] != null) ? (int)row[5] : null;
            String bolumAdi = (row[6] != null) ? (String)row[6] : null;

            dtoList.add(new DersRequestDTO(id, dersKodu, bolumId, dersAdi, ogrenciSayisi, yariyil, bolumAdi));
        }

        return dtoList;
    }

    public Integer spDersSayisi(){
        return spDersleriGetir().size();
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> spSinaviOlmayanDersleriListele() {
        // Sınavlar (dbo.Sinavlar) tablosunda henüz kaydı geçmeyen dersleri filtreleyerek getiriyoruz
        return entityManager.createNativeQuery(
                        "SELECT d.DersID, d.DersKodu, d.DersAdi, d.OgrenciSayisi, d.Yariyil, d.BolumID " +
                                "FROM dbo.Dersler d " +
                                "WHERE NOT EXISTS (" +
                                "    SELECT 1 FROM dbo.Sinavlar s WHERE s.DersID = d.DersID" +
                                ")")
                .getResultList();
    }



}
