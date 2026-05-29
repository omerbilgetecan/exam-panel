package com.example.backend.repository;

import com.example.backend.request.BolumRequestDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class BolumRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public Integer spBolumEkle(String bolumAdi) {
        Object result = entityManager.createNativeQuery(
                        "INSERT INTO dbo.Bolumler (BolumAdi) OUTPUT INSERTED.BolumID VALUES (:bolumAdi)")
                .setParameter("bolumAdi", bolumAdi)
                .getSingleResult();

        return (result != null) ? ((Number) result).intValue() : null;
    }

    @SuppressWarnings("unchecked")
    public List<BolumRequestDTO> spBolumleriGetir() {
        List<Object[]> rows = entityManager.createNativeQuery(
                        "SELECT BolumID, BolumAdi FROM dbo.Bolumler ORDER BY BolumAdi")
                .getResultList();

        List<BolumRequestDTO> dtoList = new ArrayList<>();

        for (Object[] row : rows) {
            Integer id = (row[0] != null) ? ((Number) row[0]).intValue() : null;
            String bolumAdi = (row[1] != null) ? row[1].toString() : null;

            dtoList.add(new BolumRequestDTO(id, bolumAdi));
        }

        return dtoList;
    }
}
