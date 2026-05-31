package com.example.backend.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentRequestDTO {
    private Integer examId;
    private Integer supervisorId;
    private List<Integer> supervisorIds;
    private Boolean useRecommendations;
}
