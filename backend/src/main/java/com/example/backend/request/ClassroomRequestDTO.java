package com.example.backend.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ClassroomRequestDTO {
    private Integer id;
    private String classroomName; // DerslikAdi
    private int capacity;         // Kapasite
    private String classroomType; // DerslikTipi
    private int floor;            // Kat
    private boolean active;       // Aktif

    public ClassroomRequestDTO(String classroomName, int capacity, String classroomType, int floor, boolean active) {
        this(null, classroomName, capacity, classroomType, floor, active);
    }

    public ClassroomRequestDTO(Integer id, String classroomName, int capacity, String classroomType, int floor, boolean active) {
        this.id = id;
        this.classroomName = classroomName;
        this.capacity = capacity;
        this.classroomType = classroomType;
        this.floor = floor;
        this.active = active;
    }
}
