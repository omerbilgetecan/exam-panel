SET NOCOUNT ON;
GO

IF OBJECT_ID('dbo.Log_Kayitlari', 'U') IS NULL
CREATE TABLE dbo.Log_Kayitlari
(
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    IslemTarihi DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    IslemTuru NVARCHAR(100) NOT NULL,
    EskiDeger NVARCHAR(MAX) NULL,
    YeniDeger NVARCHAR(MAX) NULL,
    DegistirenKullanici NVARCHAR(100) NULL
);
GO

IF OBJECT_ID('dbo.Bolumler', 'U') IS NULL
CREATE TABLE dbo.Bolumler
(
    BolumID INT IDENTITY(1,1) PRIMARY KEY,
    BolumAdi NVARCHAR(150) NOT NULL UNIQUE
);
GO

IF OBJECT_ID('dbo.Dersler', 'U') IS NULL
CREATE TABLE dbo.Dersler
(
    DersID INT IDENTITY(1,1) PRIMARY KEY,
    DersKodu NVARCHAR(30) NOT NULL,
    DersAdi NVARCHAR(255) NOT NULL,
    DersTuru NVARCHAR(50) NULL,
    OgrenciSayisi INT NOT NULL,
    Yariyil INT NOT NULL,
    BolumID INT NOT NULL,
    CONSTRAINT FK_Dersler_Bolumler FOREIGN KEY (BolumID) REFERENCES dbo.Bolumler(BolumID)
);
GO

IF OBJECT_ID('dbo.Oturumlar', 'U') IS NULL
CREATE TABLE dbo.Oturumlar
(
    OturumID INT IDENTITY(1,1) PRIMARY KEY,
    OturumAdi NVARCHAR(100) NOT NULL UNIQUE,
    BaslangicSaat TIME NOT NULL,
    BitisSaat TIME NOT NULL
);
GO

IF OBJECT_ID('dbo.Derslikler', 'U') IS NULL
CREATE TABLE dbo.Derslikler
(
    DerslikID INT IDENTITY(1,1) PRIMARY KEY,
    DerslikAdi NVARCHAR(50) NOT NULL UNIQUE,
    Kapasite INT NOT NULL,
    DerslikTipi NVARCHAR(50) NULL,
    Kat INT NULL,
    Aktif BIT NOT NULL DEFAULT 1
);
GO

IF OBJECT_ID('dbo.Personel', 'U') IS NULL
CREATE TABLE dbo.Personel
(
    PersonelID INT IDENTITY(1,1) PRIMARY KEY,
    Unvan NVARCHAR(80) NULL,
    Ad NVARCHAR(100) NOT NULL,
    Soyad NVARCHAR(150) NULL,
    BolumID INT NOT NULL,
    Aktif BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_Personel_Bolumler FOREIGN KEY (BolumID) REFERENCES dbo.Bolumler(BolumID)
);
GO

IF OBJECT_ID('dbo.Sinavlar', 'U') IS NULL
CREATE TABLE dbo.Sinavlar
(
    SinavID INT IDENTITY(1,1) PRIMARY KEY,
    DersID INT NOT NULL,
    Tarih DATE NOT NULL,
    OturumID INT NOT NULL,
    DerslikID INT NOT NULL,
    OgrenciSayisi INT NULL,
    CONSTRAINT FK_Sinavlar_Dersler FOREIGN KEY (DersID) REFERENCES dbo.Dersler(DersID),
    CONSTRAINT FK_Sinavlar_Oturumlar FOREIGN KEY (OturumID) REFERENCES dbo.Oturumlar(OturumID),
    CONSTRAINT FK_Sinavlar_Derslikler FOREIGN KEY (DerslikID) REFERENCES dbo.Derslikler(DerslikID),
    CONSTRAINT UQ_Sinavlar_Derslik_Tarih_Oturum UNIQUE (DerslikID, Tarih, OturumID)
);
GO

IF OBJECT_ID('dbo.Personel_Durum', 'U') IS NULL
CREATE TABLE dbo.Personel_Durum
(
    PersonelDurumID INT IDENTITY(1,1) PRIMARY KEY,
    PersonelID INT NOT NULL,
    Tarih DATE NOT NULL,
    OturumID INT NOT NULL,
    MazeretTuru NVARCHAR(100) NULL,
    Uygun BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_PersonelDurum_Personel FOREIGN KEY (PersonelID) REFERENCES dbo.Personel(PersonelID),
    CONSTRAINT FK_PersonelDurum_Oturumlar FOREIGN KEY (OturumID) REFERENCES dbo.Oturumlar(OturumID)
);
GO

IF OBJECT_ID('dbo.Gozetmen_Atamalari', 'U') IS NULL
CREATE TABLE dbo.Gozetmen_Atamalari
(
    AtamaID INT IDENTITY(1,1) PRIMARY KEY,
    SinavID INT NOT NULL,
    PersonelID INT NOT NULL,
    AtamaTarihi DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_GozetmenAtamalari_Sinavlar FOREIGN KEY (SinavID) REFERENCES dbo.Sinavlar(SinavID),
    CONSTRAINT FK_GozetmenAtamalari_Personel FOREIGN KEY (PersonelID) REFERENCES dbo.Personel(PersonelID),
    CONSTRAINT UQ_GozetmenAtamalari_SinavID UNIQUE (SinavID)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Sinavlar_Tarih_Oturum' AND object_id = OBJECT_ID('dbo.Sinavlar'))
    CREATE INDEX IX_Sinavlar_Tarih_Oturum ON dbo.Sinavlar(Tarih, OturumID);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Dersler_Bolum_Yariyil' AND object_id = OBJECT_ID('dbo.Dersler'))
    CREATE INDEX IX_Dersler_Bolum_Yariyil ON dbo.Dersler(BolumID, Yariyil);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Gozetmen_Personel' AND object_id = OBJECT_ID('dbo.Gozetmen_Atamalari'))
    CREATE INDEX IX_Gozetmen_Personel ON dbo.Gozetmen_Atamalari(PersonelID);
GO
