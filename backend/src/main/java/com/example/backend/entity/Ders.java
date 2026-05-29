package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "`Dersler`", schema = "dbo")
public class Ders {
    @Column(name = "`DersID`")
    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private int dersID;

    @Column(name = "`DersKodu`")
    private String dersKodu;

    @Column(name = "`DersAdi`")
    private String dersAdi;

    @Column(name = "`OgrenciSayisi`")
    private int ogrenciSayisi;

    @Column(name = "`Yariyil`")
    private int yariyil;

    @Column(name = "`BolumID`")
    private int bolumID;

}
