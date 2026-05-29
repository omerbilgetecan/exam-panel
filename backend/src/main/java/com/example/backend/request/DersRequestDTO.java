package com.example.backend.request;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DersRequestDTO {
    private Integer id;
    private String code;
    private int departmentId;
    private String name;
    private int studentCount;
    private int semester;
    private String department;
}
