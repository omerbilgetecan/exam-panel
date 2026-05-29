package com.example.backend.controller;

import com.example.backend.request.BolumRequestDTO;
import com.example.backend.request.DashboardRequestDTO;
import com.example.backend.request.DersRequestDTO;
import com.example.backend.service.ExamActivityServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class ExamActivityController {
    private final ExamActivityServiceImpl examActivityService;
    public ExamActivityController(ExamActivityServiceImpl examActivityService) {
        this.examActivityService = examActivityService;
    }



    @PostMapping("/departments")
    public ResponseEntity<Integer> createBolum(@RequestBody BolumRequestDTO req) {

        Integer id = examActivityService.addNewBolum(req.getName());

        return new ResponseEntity<>(id, HttpStatus.CREATED);
    }

    @GetMapping("/departments")
    public ResponseEntity<List<BolumRequestDTO>> getAllDepartments() {
        List<BolumRequestDTO> departments = examActivityService.getAllDepartments();
        // HTTP 200 Durum koduyla listeyi JSON formatında frontend'e fırlatır
        return ResponseEntity.ok(departments);
    }

    @PostMapping("/courses")
    public ResponseEntity<Integer> createDers(@RequestBody DersRequestDTO req) {

        Integer id = examActivityService.addNewDers(req);

        return new ResponseEntity<>(id, HttpStatus.CREATED);
    }

    @GetMapping("/courses")
    public ResponseEntity<List<DersRequestDTO>> getAllCourses() {
        List<DersRequestDTO> courses = examActivityService.getAllCourses();
        // HTTP 200 Durum koduyla listeyi JSON formatında frontend'e fırlatır
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardRequestDTO> getDashboardStats() {
        // Zaten halihazırda enjekte edilmiş olan ortak servisini çağırıyorsun
        DashboardRequestDTO stats = examActivityService.getDashboard();
        return ResponseEntity.ok(stats);
    }

}
