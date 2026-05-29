package com.example.backend.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OturumRequestDTO {
    private Integer id;
    private String name;       // frontend'deki -> name
    private String startTime;  // frontend'deki -> startTime ("09:30" veya "09:30:00")
    private String endTime;    // frontend'deki -> endTime ("11:00" veya "11:00:00")
}