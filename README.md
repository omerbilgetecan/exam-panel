\# Exam Scheduler Database System



\## Proje Amacı

Bu proje, üniversite sınav planlama sürecini yönetmek amacıyla geliştirilmiş bir SQL Server veritabanı sistemidir.



Sistem:

\- Bölüm

\- Ders

\- Gözetmen

\- Derslik

\- Oturum

\- Sınav planlama



işlemlerini yönetmektedir.



\---



\## Kullanılan Teknolojiler

\- Microsoft SQL Server

\- T-SQL

\- Stored Procedures

\- Functions

\- Views

\- Triggers

\- Transaction Management

\- Backup Procedure



\---



\## Özellikler

\- Sınav planlama sistemi

\- Gözetmen atama sistemi

\- Derslik kapasite kontrolü

\- Log kayıt sistemi

\- Transaction / Rollback desteği

\- Otomatik veritabanı yedeği alma

\- Görünümler (Views)

\- Kullanıcı tanımlı fonksiyonlar (Functions)



\---



\## Veritabanı Yapısı



Başlıca tablolar:

\- Bolumler

\- Dersler

\- Personel

\- Sinavlar

\- Sinav\_Salonlari

\- Oturumlar

\- Log\_Kayitlari



\---



\## BONUS



Sistem, `sp\_VeritabaniYedekAl` procedure’ü ile otomatik `.bak` yedeği oluşturabilmektedir.



\---



\## Kurulum



1\. SQL Server üzerinde yeni bir veritabanı oluşturun.

2\. `full\_database\_script.sql` dosyasını çalıştırın.

3\. Sistem hazırdır.

