package com.example.backend.controller;

import com.example.backend.request.*;
import com.example.backend.service.ExamActivityServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"})
public class ExamActivityController {
    private final ExamActivityServiceImpl examActivityService;

    public ExamActivityController(ExamActivityServiceImpl examActivityService) {
        this.examActivityService = examActivityService;
    }

    @PostMapping("/departments")
    public ResponseEntity<Integer> createBolum(@RequestBody BolumRequestDTO req) {
        return new ResponseEntity<>(examActivityService.addNewBolum(req.getName()), HttpStatus.CREATED);
    }

    @GetMapping("/departments")
    public ResponseEntity<List<BolumRequestDTO>> getAllDepartments() {
        return ResponseEntity.ok(examActivityService.getAllDepartments());
    }

    @PostMapping("/courses")
    public ResponseEntity<Integer> createDers(@RequestBody DersRequestDTO req) {
        return new ResponseEntity<>(examActivityService.addNewDers(req), HttpStatus.CREATED);
    }

    @GetMapping("/courses")
    public ResponseEntity<List<DersRequestDTO>> getAllCourses() {
        return ResponseEntity.ok(examActivityService.getAllCourses());
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardRequestDTO> getDashboardStats() {
        return ResponseEntity.ok(examActivityService.getDashboard());
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<OturumRequestDTO>> getAllSessions() {
        return ResponseEntity.ok(examActivityService.getAllSessions());
    }

    @PostMapping("/sessions")
    public ResponseEntity<Integer> createSession(@RequestBody OturumRequestDTO dto) {
        return ResponseEntity.ok(examActivityService.addNewSession(dto));
    }

    @PostMapping("/capacities")
    public ResponseEntity<Integer> createClassroom(@RequestBody ClassroomRequestDTO dto) {
        return ResponseEntity.ok(examActivityService.addNewClassroom(dto));
    }

    @GetMapping("/capacities")
    public ResponseEntity<List<ClassroomRequestDTO>> getAllClassrooms() {
        return ResponseEntity.ok(examActivityService.getAllClassrooms());
    }

    @GetMapping("/supervisors")
    public ResponseEntity<List<SupervisorRequestDTO>> getAllSupervisors() {
        return ResponseEntity.ok(examActivityService.getAllSupervisors());
    }

    @PostMapping("/supervisors")
    public ResponseEntity<Integer> createSupervisor(@RequestBody SupervisorRequestDTO req) {
        return new ResponseEntity<>(examActivityService.addNewSupervisor(req), HttpStatus.CREATED);
    }

    @PostMapping("/supervisors/{id}/leave")
    public ResponseEntity<Void> createSupervisorLeave(@PathVariable Integer id, @RequestBody Map<String, String> req) {
        LocalDate date = LocalDate.parse(req.get("date"));
        String sessionId = req.get("sessionId");
        String reason = req.getOrDefault("reason", "İzinli");
        if ("ALL".equalsIgnoreCase(sessionId)) {
            examActivityService.addSupervisorLeaveForDay(id, date, reason);
        } else {
            examActivityService.addSupervisorLeave(id, date, Integer.valueOf(sessionId), reason);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/exams")
    public ResponseEntity<List<SinavRequestDTO>> getAllExams() {
        return ResponseEntity.ok(examActivityService.getAllExams());
    }

    @PostMapping("/exams")
    public ResponseEntity<Integer> createSinav(@RequestBody SinavRequestDTO req) {
        return new ResponseEntity<>(examActivityService.addNewSinav(req), HttpStatus.CREATED);
    }

    @PostMapping("/assignments")
    public ResponseEntity<Void> assignSupervisor(@RequestBody AssignmentRequestDTO req) {
        examActivityService.assignSupervisor(req);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/logs")
    public ResponseEntity<List<LogRequestDTO>> getAllLogs() {
        return ResponseEntity.ok(examActivityService.getAllLogs());
    }

    @GetMapping("/reports/exam-program")
    public ResponseEntity<List<ReportRequestDTO>> getExamProgramReport() {
        return ResponseEntity.ok(examActivityService.getExamProgramReport());
    }

    @PostMapping("/backup")
    public ResponseEntity<Map<String, String>> runBackup() {
        return ResponseEntity.ok(Map.of("message", examActivityService.runBackup()));
    }
    @GetMapping("/db-check")
public ResponseEntity<Map<String, Object>> dbCheck() {
    return ResponseEntity.ok(examActivityService.dbCheck());
}

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBusinessError(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}
