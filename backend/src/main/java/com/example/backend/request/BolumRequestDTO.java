package com.example.backend.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class BolumRequestDTO {
    private String name;
    private Integer id;


    public BolumRequestDTO(Integer id, String name) {
        this.name = name;
        this.id = id;
    }
    public BolumRequestDTO() {}
}
