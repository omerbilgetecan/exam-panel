# SınavPanel Frontend

Sınav yönetim sistemi için React + Vite tabanlı web arayüzü. Uygulama başlangıçta demo veri modunda açılır; böylece backend tamamlanmadan ekranlar sunumda gösterilebilir.

## Çalıştırma

PowerShell script kısıtlaması varsa `npm` yerine `npm.cmd` kullan:

```powershell
npm.cmd install
npm.cmd run dev
```

## Ekranlar

- Dashboard: sınav, atama ve salon kullanım özeti
- Sınav Programı: sınav listeleme ve yeni sınav ekleme
- Kapasite: salon doluluk durumları
- Gözetmenler: personel listesi, gözetmenli program ve atama
- Log Kayıtları: işlem kayıtları ve backup procedure çağrısı

## Backend Sözleşmesi

Frontend varsayılan olarak `http://localhost:8080/api` adresine bağlanır. Farklı bir adres için proje kökünde `.env` oluştur:

```env
VITE_API_URL=http://localhost:8080/api
```

Ömer'in Spring Boot REST backend'i için beklenen ilk endpoint'ler:

| İşlem | Method | Endpoint |
| --- | --- | --- |
| Dashboard özeti | `GET` | `/api/dashboard` |
| Sınav programı listeleme | `GET` | `/api/exams` |
| Sınav ekleme | `POST` | `/api/exams` |
| Kapasite durumu listeleme | `GET` | `/api/capacities` |
| Gözetmen listesi ve görev yükü | `GET` | `/api/supervisors` |
| Gözetmen atama | `POST` | `/api/assignments` |
| Log kayıtları | `GET` | `/api/logs` |
| Backup procedure çağırma | `POST` | `/api/backup` |

Uygulamanın sağ üstündeki `API Moduna Geç` düğmesi gerçek endpoint isteklerini açar. Backend henüz çalışmıyorsa demo moda dönerek sunum akışına devam edilebilir.
