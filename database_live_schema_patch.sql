/* Live schema patch for direct Sinavlar.DerslikID model. */
SET NOCOUNT ON;
GO

IF OBJECT_ID('dbo.Gozetmen_Atamalari', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Gozetmen_Atamalari
    (
        AtamaID INT IDENTITY(1,1) PRIMARY KEY,
        SinavID INT NOT NULL,
        PersonelID INT NOT NULL,
        AtamaTarihi DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF COL_LENGTH('dbo.Gozetmen_Atamalari', 'SinavID') IS NULL
    ALTER TABLE dbo.Gozetmen_Atamalari ADD SinavID INT NULL;
GO

IF COL_LENGTH('dbo.Gozetmen_Atamalari', 'SinavSalonID') IS NOT NULL
    EXEC(N'ALTER TABLE dbo.Gozetmen_Atamalari ALTER COLUMN SinavSalonID INT NULL');
GO

CREATE OR ALTER FUNCTION dbo.fn_DerslikDoluOturumlari
(
    @DerslikID INT,
    @Tarih DATE
)
RETURNS TABLE
AS
RETURN
(
    SELECT
        s.OturumID,
        o.OturumAdi,
        o.BaslangicSaat,
        o.BitisSaat,
        s.SinavID,
        s.DersID
    FROM dbo.Sinavlar s
    INNER JOIN dbo.Oturumlar o ON s.OturumID = o.OturumID
    WHERE s.DerslikID = @DerslikID
      AND s.Tarih = @Tarih
);
GO

CREATE OR ALTER PROCEDURE dbo.sp_DerslikDoluOturumlariGetir
    @DerslikID INT,
    @Tarih DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.fn_DerslikDoluOturumlari(@DerslikID, @Tarih)
    ORDER BY OturumID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_SinavEkle
    @DersID INT,
    @Tarih DATE,
    @OturumID INT,
    @DerslikID INT,
    @OgrenciSayisi INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Sinavlar (DersID, Tarih, OturumID, DerslikID, OgrenciSayisi)
    OUTPUT INSERTED.SinavID
    VALUES (@DersID, @Tarih, @OturumID, @DerslikID, @OgrenciSayisi);
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_DashboardIstatistikleri
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        (SELECT COUNT(*) FROM dbo.Dersler) AS courseCount,
        (SELECT COUNT(*) FROM dbo.Personel WHERE Aktif = 1) AS personnelCount,
        (SELECT COUNT(*) FROM dbo.Sinavlar) AS examCount,
        (SELECT COUNT(*) FROM dbo.Sinavlar s WHERE EXISTS (SELECT 1 FROM dbo.Gozetmen_Atamalari ga WHERE ga.SinavID = s.SinavID)) AS assignedCount,
        (SELECT COUNT(*) FROM dbo.Sinavlar s WHERE NOT EXISTS (SELECT 1 FROM dbo.Gozetmen_Atamalari ga WHERE ga.SinavID = s.SinavID)) AS pendingCount,
        (SELECT CASE WHEN SUM(Kapasite) > 0 THEN CAST((SELECT ISNULL(SUM(ISNULL(s.OgrenciSayisi, d.OgrenciSayisi)), 0) FROM dbo.Sinavlar s INNER JOIN dbo.Dersler d ON s.DersID = d.DersID) * 100.0 / SUM(Kapasite) AS INT) ELSE 0 END FROM dbo.Derslikler) AS roomUsage;
END;
GO

CREATE OR ALTER VIEW dbo.vw_SinavDetaylari AS
SELECT
    s.SinavID,
    d.DersKodu,
    d.DersAdi,
    b.BolumAdi,
    d.Yariyil,
    s.Tarih,
    o.OturumAdi,
    o.BaslangicSaat,
    o.BitisSaat,
    dl.DerslikAdi,
    dl.Kapasite,
    ISNULL(s.OgrenciSayisi, d.OgrenciSayisi) AS OgrenciSayisi,
    CONCAT(p.Unvan, ' ', p.Ad, ' ', p.Soyad) AS Gozetmen
FROM dbo.Sinavlar s
INNER JOIN dbo.Dersler d ON s.DersID = d.DersID
INNER JOIN dbo.Bolumler b ON d.BolumID = b.BolumID
INNER JOIN dbo.Oturumlar o ON s.OturumID = o.OturumID
INNER JOIN dbo.Derslikler dl ON s.DerslikID = dl.DerslikID
LEFT JOIN dbo.Gozetmen_Atamalari ga ON s.SinavID = ga.SinavID
LEFT JOIN dbo.Personel p ON ga.PersonelID = p.PersonelID;
GO

CREATE OR ALTER TRIGGER dbo.trg_Gozetmen_Atama_Log
ON dbo.Gozetmen_Atamalari
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Log_Kayitlari (IslemTuru, EskiDeger, YeniDeger, DegistirenKullanici)
    SELECT N'Gozetmen atandi', NULL, CONCAT(N'PersonelID: ', i.PersonelID, N', SinavID: ', i.SinavID), N'Admin'
    FROM inserted i;
END;
GO
