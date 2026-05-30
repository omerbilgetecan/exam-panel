package com.example.backend.repository;

import com.example.backend.request.ReportRequestDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class ReportRepository {
    @PersistenceContext
    private EntityManager entityManager;

    @SuppressWarnings("unchecked")
    public List<ReportRequestDTO> examProgram() {
        List<Object[]> rows = entityManager.createNativeQuery(
                        "SELECT d.DersKodu, d.DersAdi, b.BolumAdi, d.Yariyil, CONVERT(varchar(10), s.Tarih, 23), o.OturumAdi, " +
                                "dl.DerslikAdi, d.OgrenciSayisi, dl.Kapasite, " +
                                "ISNULL(CONCAT(p.Unvan, ' ', p.Ad, ' ', p.Soyad), N'Atama Bekliyor') " +
                                "FROM dbo.Sinavlar s " +
                                "INNER JOIN dbo.Dersler d ON s.DersID = d.DersID " +
                                "INNER JOIN dbo.Bolumler b ON d.BolumID = b.BolumID " +
                                "INNER JOIN dbo.Oturumlar o ON s.OturumID = o.OturumID " +
                                "INNER JOIN dbo.Derslikler dl ON s.DerslikID = dl.DerslikID " +
                                "LEFT JOIN dbo.Gozetmen_Atamalari ga ON s.SinavID = ga.SinavID " +
                                "LEFT JOIN dbo.Personel p ON ga.PersonelID = p.PersonelID " +
                                "ORDER BY s.Tarih, o.BaslangicSaat, d.DersKodu, dl.DerslikAdi")
                .getResultList();

        List<ReportRequestDTO> reports = new ArrayList<>();
        for (Object[] row : rows) {
            String supervisor = row[9] != null ? row[9].toString() : "Atama Bekliyor";
            reports.add(new ReportRequestDTO(
                    row[0].toString(),
                    row[1].toString(),
                    row[2].toString(),
                    ((Number) row[3]).intValue(),
                    row[4].toString(),
                    row[5].toString(),
                    row[6].toString(),
                    ((Number) row[7]).intValue(),
                    ((Number) row[8]).intValue(),
                    supervisor,
                    supervisor.equals("Atama Bekliyor") ? "Atama Bekliyor" : "Planlandı"
            ));
        }
        return reports;
    }
}
