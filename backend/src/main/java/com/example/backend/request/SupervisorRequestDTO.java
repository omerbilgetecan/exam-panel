package com.example.backend.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupervisorRequestDTO {
    private Integer id;
    private String title;
    private String name;
    private String firstName;
    private String lastName;
    private Integer departmentId;
    private String department;
    private Integer examCount;
    private String availability;
}
