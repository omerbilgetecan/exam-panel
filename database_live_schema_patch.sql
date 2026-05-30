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

CREATE OR ALTER FUNCTION dbo.fn_GozetmenGunlukGorevSayisi
(
    @PersonelID INT,
    @Tarih DATE
)
RETURNS INT
AS
BEGIN
    DECLARE @Sonuc INT;
    SELECT @Sonuc = COUNT(*)
    FROM dbo.Gozetmen_Atamalari ga
    INNER JOIN dbo.Sinavlar s ON ga.SinavID = s.SinavID
    WHERE ga.PersonelID = @PersonelID
      AND s.Tarih = @Tarih;
    RETURN ISNULL(@Sonuc, 0);
END;
GO

CREATE OR ALTER FUNCTION dbo.fn_GozetmenOturumdaMusaitMi
(
    @PersonelID INT,
    @Tarih DATE,
    @OturumID INT
)
RETURNS BIT
AS
BEGIN
    IF EXISTS (
        SELECT 1
        FROM dbo.Gozetmen_Atamalari ga
        INNER JOIN dbo.Sinavlar s ON ga.SinavID = s.SinavID
        WHERE ga.PersonelID = @PersonelID
          AND s.Tarih = @Tarih
          AND s.OturumID = @OturumID
    )
        RETURN 0;

    IF EXISTS (
        SELECT 1
        FROM dbo.Personel_Durum pd
        WHERE pd.PersonelID = @PersonelID
          AND pd.Tarih = @Tarih
          AND pd.OturumID = @OturumID
          AND pd.Uygun = 0
    )
        RETURN 0;

    IF dbo.fn_GozetmenGunlukGorevSayisi(@PersonelID, @Tarih) >= 4
        RETURN 0;

    DECLARE @Oturumlar TABLE (OturumID INT PRIMARY KEY);
    INSERT INTO @Oturumlar (OturumID)
    SELECT DISTINCT s.OturumID
    FROM dbo.Gozetmen_Atamalari ga
    INNER JOIN dbo.Sinavlar s ON ga.SinavID = s.SinavID
    WHERE ga.PersonelID = @PersonelID
      AND s.Tarih = @Tarih;

    IF NOT EXISTS (SELECT 1 FROM @Oturumlar WHERE OturumID = @OturumID)
        INSERT INTO @Oturumlar (OturumID) VALUES (@OturumID);

    IF EXISTS (
        SELECT 1
        FROM @Oturumlar a
        INNER JOIN @Oturumlar b ON b.OturumID = a.OturumID + 1
        INNER JOIN @Oturumlar c ON c.OturumID = a.OturumID + 2
        INNER JOIN @Oturumlar d ON d.OturumID = a.OturumID + 3
    )
        RETURN 0;

    RETURN 1;
END;
GO

CREATE OR ALTER VIEW dbo.vw_GozetmenYukleri AS
SELECT
    p.PersonelID,
    CONCAT(p.Unvan, ' ', p.Ad, ' ', p.Soyad) AS Gozetmen,
    b.BolumAdi,
    COUNT(ga.AtamaID) AS GorevSayisi
FROM dbo.Personel p
INNER JOIN dbo.Bolumler b ON p.BolumID = b.BolumID
LEFT JOIN dbo.Gozetmen_Atamalari ga ON p.PersonelID = ga.PersonelID
WHERE p.Aktif = 1
GROUP BY p.PersonelID, p.Unvan, p.Ad, p.Soyad, b.BolumAdi;
GO

CREATE OR ALTER VIEW dbo.vw_BolumYariyilSinavYogunlugu AS
SELECT
    b.BolumAdi,
    d.Yariyil,
    s.Tarih,
    COUNT(*) AS SinavSayisi
FROM dbo.Sinavlar s
INNER JOIN dbo.Dersler d ON s.DersID = d.DersID
INNER JOIN dbo.Bolumler b ON d.BolumID = b.BolumID
GROUP BY b.BolumAdi, d.Yariyil, s.Tarih;
GO

CREATE OR ALTER PROCEDURE dbo.sp_GozetmenYukRaporu
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM dbo.vw_GozetmenYukleri
    ORDER BY GorevSayisi, BolumAdi, Gozetmen;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_PersonelMazeretEkle
    @PersonelID INT,
    @Tarih DATE,
    @OturumID INT,
    @MazeretTuru NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Personel_Durum (PersonelID, Tarih, OturumID, MazeretTuru, Uygun)
    VALUES (@PersonelID, @Tarih, @OturumID, ISNULL(@MazeretTuru, N'İzinli'), 0);
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_Sinav_Saat_Degisim_Log
ON dbo.Sinavlar
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Log_Kayitlari (IslemTuru, EskiDeger, YeniDeger, DegistirenKullanici)
    SELECT
        N'Sinav saati degisti',
        CONCAT(N'Eski OturumID: ', d.OturumID),
        CONCAT(N'Yeni OturumID: ', i.OturumID),
        SUSER_SNAME()
    FROM inserted i
    INNER JOIN deleted d ON i.SinavID = d.SinavID
    WHERE ISNULL(i.OturumID, -1) <> ISNULL(d.OturumID, -1);
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_VeritabaniYedekAl
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Path NVARCHAR(4000) = N'C:\Yedekler\ExamSchedulerDB_' +
        REPLACE(CONVERT(NVARCHAR(19), GETDATE(), 120), ':', '-') + N'.bak';
    BACKUP DATABASE ExamSchedulerDB TO DISK = @Path WITH INIT, COMPRESSION;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'App_Admin_Role')
    CREATE ROLE App_Admin_Role;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'App_Viewer_Role')
    CREATE ROLE App_Viewer_Role;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'App_Admin')
    CREATE USER App_Admin WITHOUT LOGIN;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'App_Viewer')
    CREATE USER App_Viewer WITHOUT LOGIN;
GO
ALTER ROLE App_Admin_Role ADD MEMBER App_Admin;
ALTER ROLE App_Viewer_Role ADD MEMBER App_Viewer;
GO
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE TO App_Admin_Role;
GO
GRANT SELECT ON dbo.vw_SinavDetaylari TO App_Viewer_Role;
GRANT SELECT ON dbo.vw_GozetmenYukleri TO App_Viewer_Role;
GRANT SELECT ON dbo.vw_BolumYariyilSinavYogunlugu TO App_Viewer_Role;
DENY INSERT, UPDATE, DELETE TO App_Viewer_Role;
GO
