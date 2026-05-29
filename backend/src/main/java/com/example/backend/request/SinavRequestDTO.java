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
    private LocalDate date;
    private Integer sessionId;
    private String classroom;
    private Integer courseId;
    private int studentCount;
}
