# 🎓 Sınav Paneli / Sınav Planlama Sistemi

Üniversite sınav planlama süreçlerini, gözetmen atamalarını ve derslik kapasitelerini yönetmek amacıyla tasarlanmış kapsamlı bir Full-Stack uygulamasıdır. Sistem modern bir React önyüzü (frontend), güçlü bir Spring Boot arkayüzü (backend) ve sağlam bir SQL Server veritabanı altyapısına sahiptir.

<img width="1895" height="851" alt="Screenshot_6" src="https://github.com/user-attachments/assets/ec27f732-516b-4ae6-b375-11c60dd45cfa" />


## 🚀 Mimari Genel Bakış

Bu proje üç ana katmana ayrılmıştır:

- **Frontend (Önyüz):** React 19 ve Vite ile geliştirilmiştir. Sınav planlama sürecini yönetmek için duyarlı (responsive) ve etkileşimli bir kullanıcı arayüzü sunar.
- **Backend (Arkayüz):** Spring Boot 3 ve Java 17 ile geliştirilmiştir. RESTful API'ler sunar, iş mantığını yönetir ve Spring Data JPA kullanarak veritabanı ile etkileşime geçer.
- **Veritabanı:** Microsoft SQL Server. Veri bütünlüğünü sağlamak ve karmaşık planlama mantığını yönetmek için Stored Procedures, Triggers, Views ve Transaction Management gibi gelişmiş özelliklerden faydalanır.

---

## 🛠️ Kullanılan Teknolojiler

### Frontend
- **React 19**
- **Vite**
- **Vanilla CSS**

### Backend
- **Java 17**
- **Spring Boot 3.3.5**
- **Spring Data JPA** (Hibernate)
- **REST API**
- **Lombok**

### Veritabanı
- **Microsoft SQL Server**
- **T-SQL** (Stored Procedures, Functions, Views, Triggers)
- **Transaction Management**

---

## 🌟 Temel Özellikler

- **Sınav Planlama:** Farklı bölüm ve dersler için sınav oturumları planlama ve yönetme.
- **Gözetmen Atama:** Sınav salonlarına gözetmen (personel) atama.
- **Derslik Yönetimi:** Sınavlar sırasında kapasite aşımını önlemek için derslik kapasitelerini takip etme.
- **Log Sistemi:** Kritik işlemlerin ve hataların veritabanı seviyesinde kaydedilmesi.
- **Otomatik Yedekleme:** Veritabanı durumunu kolayca yedeklemek için yerleşik SQL prosedürleri.

---

## 📂 Proje Yapısı

```text
exam-panel/
│
├── backend/                 # Spring Boot uygulaması
│   ├── src/main/java/...    # Uygulama kaynak kodları (Controllers, Services, Repositories, Entities)
│   ├── src/main/resources/  # Konfigürasyon (application.properties)
│   └── pom.xml              # Maven bağımlılıkları
│
├── frontend/                # React uygulaması
│   ├── src/                 # React bileşenleri, servisler ve statik dosyalar
│   ├── package.json         # NPM bağımlılıkları
│   └── vite.config.js       # Vite konfigürasyonu
│
└── *.sql                    # Veritabanı oluşturma, şema ve başlangıç verisi (seed) betikleri
```

---

## ⚙️ Kurulum ve Çalıştırma

### 1. Veritabanı Kurulumu
1. Microsoft SQL Server'ın kurulu ve çalışır durumda olduğundan emin olun.
2. SQL Server Management Studio (SSMS) veya tercih ettiğiniz bir SQL istemcisini açın.
3. Veritabanı şemasını, tabloları, prosedürleri oluşturmak ve başlangıç verilerini yüklemek için kök dizinde bulunan SQL betiklerini (örneğin `full-database.sql` veya `database_seed_evaluation_data.sql`) çalıştırın.

### 2. Backend Kurulumu
1. `backend` dizinine gidin:
   ```bash
   cd backend
   ```
2. Gerekirse `src/main/resources/application.properties` dosyasındaki SQL Server bağlantı bilgilerinizi (kullanıcı adı, şifre) güncelleyin.
3. Spring Boot uygulamasını Maven kullanarak başlatın:
   ```bash
   ./mvnw spring-boot:run
   ```
   *(Windows üzerinde `mvnw.cmd spring-boot:run` kullanabilirsiniz)*
   *Backend varsayılan olarak 8080 portunda çalışacaktır.*

### 3. Frontend Kurulumu
1. `frontend` dizinine gidin:
   ```bash
   cd frontend
   ```
2. Gerekli bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Vite geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```
   *Frontend varsayılan olarak `http://localhost:5173` adresinde çalışacaktır.*

---

## 💡 Ek Bilgiler
Veritabanı sistemi, SQL Server veritabanının `.bak` formatında yedeklerini otomatik olarak oluşturabilen özel bir `sp_VeritabaniYedekAl` saklı yordamı (stored procedure) içermektedir.
