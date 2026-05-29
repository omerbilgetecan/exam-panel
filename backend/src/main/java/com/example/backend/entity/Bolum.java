package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "`Bolumler`", schema = "dbo")
public class Bolum {
    @Column(name = "`BolumID`")
    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private int bolumID;

    @Column(name = "`BolumAdi`")
    private String bolumAdi;
}
