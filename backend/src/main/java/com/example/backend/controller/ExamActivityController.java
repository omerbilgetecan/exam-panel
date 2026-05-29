package com.example.backend.controller;

import com.example.backend.request.*;
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

    @GetMapping("/sessions")
    public ResponseEntity<List<OturumRequestDTO>> getAllSessions() {
        List<OturumRequestDTO> sessions = examActivityService.getAllSessions();
        return ResponseEntity.ok(sessions);
    }

    // Oturum Ekleme Endpoint'i (POST /api/sessions)
    @PostMapping("/sessions")
    public ResponseEntity<Integer> createSession(@RequestBody OturumRequestDTO dto) {
        Integer newSessionId = examActivityService.addNewSession(dto);
        return ResponseEntity.ok(newSessionId);
    }

    @PostMapping("/capacities")
    public ResponseEntity<Integer> createClassroom(@RequestBody ClassroomRequestDTO dto) {
        Integer newRoomId = examActivityService.addNewClassroom(dto);
        return ResponseEntity.ok(newRoomId);
    }

    @GetMapping("/capacities")
    public ResponseEntity<List<ClassroomRequestDTO>> getAllClassrooms() {
        // Burada salonları listelediğin servis metodunu çağırmalısın
        List<ClassroomRequestDTO> classrooms = examActivityService.getAllClassrooms();
        return ResponseEntity.ok(classrooms);
    }

    // 1. Gözetmenleri / Personeli Getiren Endpoint (GET /api/supervisors)
    @GetMapping("/supervisors")
    public ResponseEntity<List<?>> getAllSupervisors() {
        // TODO: Eğer hazırda servis metodun yoksa şimdilik boş liste dönerek 404'ü kesebilirsin
        // List<SupervisorResponseDTO> supervisors = examActivityService.getAllSupervisors();
        // return ResponseEntity.ok(supervisors);
        return ResponseEntity.ok(java.util.Collections.emptyList());
    }

    // 2. Sınav Programını Getiren Endpoint (GET /api/exams)
    @GetMapping("/exams")
    public ResponseEntity<List<SinavRequestDTO>> getAllExams() {
        List<SinavRequestDTO> allExams = examActivityService.getAllExams();
        return ResponseEntity.ok(allExams);
    }

    @PostMapping("/exams")
    public ResponseEntity<Integer> createSinav(@RequestBody SinavRequestDTO req) {
        Integer id = examActivityService.addNewSinav(req);
        return new ResponseEntity<>(id, HttpStatus.CREATED);
    }

    // 3. Log Kayıtlarını Getiren Endpoint (GET /api/logs)
    @GetMapping("/logs")
    public ResponseEntity<List<?>> getAllLogs() {
        // TODO: Log kayıtlarını çeken servis metodunu bağla
        // List<LogResponseDTO> logs = examActivityService.getAllLogs();
        // return ResponseEntity.ok(logs);
        return ResponseEntity.ok(java.util.Collections.emptyList());
    }

}
