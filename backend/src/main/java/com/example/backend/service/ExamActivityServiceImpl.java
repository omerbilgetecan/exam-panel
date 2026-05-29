package com.example.backend.service;

import com.example.backend.repository.BolumRepository;

import com.example.backend.repository.DashboardRepository;
import com.example.backend.repository.DersRepository;
import com.example.backend.request.BolumRequestDTO;
import com.example.backend.request.DashboardRequestDTO;
import com.example.backend.request.DersRequestDTO;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ExamActivityServiceImpl {
    private  final BolumRepository bolumRepository;
    private  final DersRepository dersRepository;
    private  final DashboardRepository dashboardRepository;

    public ExamActivityServiceImpl(BolumRepository bolumRepository,  DersRepository dersRepository,
                                    DashboardRepository dashboardRepository) {
        this.bolumRepository = bolumRepository;
        this.dersRepository = dersRepository;
        this.dashboardRepository = dashboardRepository;
    }


    @Transactional
    public Integer addNewBolum(String bolumAdi) {
        return bolumRepository.spBolumEkle(bolumAdi);
    }

    @Transactional()
    public List<BolumRequestDTO> getAllDepartments() {
        return bolumRepository.spBolumleriGetir();
    }


    @Transactional
    public Integer addNewDers(DersRequestDTO dto) {
        // DTO'dan gelen temiz verileri sırasıyla SQL procedure metodumuza gönderiyoruz
        return dersRepository.spDersEkle(
                dto.getCode(),
                dto.getName(),
                dto.getStudentCount(),
                dto.getSemester(),
                dto.getDepartmentId() // Ekleme yaparken SQL bizden ID bekliyor, isim değil!
        );
    }

    @Transactional()
    public List<DersRequestDTO> getAllCourses() {
        return dersRepository.spDersleriGetir();
    }

    @Transactional()
    public DashboardRequestDTO getDashboard() {
        return dashboardRepository.getDashboardStatsFromProcedure();
    }


}
