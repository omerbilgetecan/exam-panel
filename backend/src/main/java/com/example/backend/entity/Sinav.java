package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "`Sinavlar`", schema = "dbo")
public class Sinav {

    @Column(name = "`DersID`")
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "`Tarih`")
    private LocalDate date;

    @Column(name = "`OturumID`")
    private Integer oturumID;


}
