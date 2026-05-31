package com.example.backend.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ClassroomRequestDTO {

    private Integer id;
    private String classroomName;
    private int capacity;
    private String classroomType;
    private int floor;
    private boolean active;
    private int assigned;

    public ClassroomRequestDTO(
            Integer id,
            String classroomName,
            int capacity,
            String classroomType,
            int floor,
            boolean active,
            int assigned
    ) {
        this.id = id;
        this.classroomName = classroomName;
        this.capacity = capacity;
        this.classroomType = classroomType;
        this.floor = floor;
        this.active = active;
        this.assigned = assigned;
    }
}