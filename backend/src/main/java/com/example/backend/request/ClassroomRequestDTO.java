package com.example.backend.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomRequestDTO {
    private String classroomName; // DerslikAdi
    private int capacity;         // Kapasite
    private String classroomType; // DerslikTipi
    private int floor;            // Kat
    private boolean active;       // Aktif
}