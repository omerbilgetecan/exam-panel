package com.example.backend.repository;

import com.example.backend.entity.Bolum;
import com.example.backend.request.BolumRequestDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Repository
public class BolumRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public Integer spBolumEkle(String bolumAdi) {
        // Procedure çağrılır ve dönen tekil tmsayı (ID) alınır
        Object result = entityManager.createNativeQuery("EXEC dbo.sp_BolumEkle :BolumAdi")
                .setParameter("BolumAdi", bolumAdi)
                .getSingleResult();

        // Gelen sonucu güvenli bir şekilde Integer'a cast ediyoruz
        return (result != null) ? ((Number) result).intValue() : null;
    }

    @SuppressWarnings("unchecked")
    public List<BolumRequestDTO> spBolumleriGetir() {
        // Procedure çalıştırılır ve ham Object dizisi listesi alınır
        List<Object[]> rows = entityManager.createNativeQuery("EXEC dbo.sp_BolumleriGetir")
                .getResultList();

        List<BolumRequestDTO> dtoList = new ArrayList<>();

        // Gelen ham veriyi tek tek DTO nesnesine dönüştürüyoruz
        for (Object[] row : rows) {
            Integer id = (row[0] != null) ? ((Number) row[0]).intValue() : null;
            String bolumAdi = (row[1] != null) ? row[1].toString() : null;

            dtoList.add(new BolumRequestDTO(id, bolumAdi));
        }

        return dtoList;
    }

}
