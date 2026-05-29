package com.example.backend.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SinavRequestDTO {
    private Integer id;
    private java.time.LocalDate date;
    private Integer sessionId;
    private String classroom;
    private Integer courseId;
    private int studentCount;

    // 🎯 DersID üzerinden çekilen yeni alanlar
    private String courseCode;
    private String courseName;
    private String classroomName;
    private Integer departmentId;
    private String department;
    private Integer semester;
    private String time;
    private String sessionName;
    private String supervisor;
    private String status;
}
