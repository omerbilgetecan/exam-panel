package com.example.backend.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReportRequestDTO {
    private String courseCode;
    private String courseName;
    private String department;
    private Integer semester;
    private String date;
    private String session;
    private String classroom;
    private Integer studentCount;
    private Integer capacity;
    private String supervisor;
    private String status;
}
