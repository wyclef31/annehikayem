# Backend Deploy Notları

## ⚠️ ÖNEMLİ: Backend Yeniden Deploy Gerekiyor

CORS ayarları güncellendi. Backend'in yeniden deploy edilmesi gerekiyor.

## Yapılan Değişiklikler

`server.js` dosyasında CORS ayarları güncellendi:
- Firebase Hosting URL'leri eklendi
- Custom domain (annemhikayem.com.tr) eklendi
- Tüm gerekli origin'lere izin verildi

## Railway'de Deploy

### Otomatik Deploy (GitHub bağlıysa)
1. Değişiklikleri GitHub'a push edin
2. Railway otomatik olarak deploy edecek

### Manuel Deploy
1. Railway dashboard'a gidin
2. Projenizi seçin
3. "Deploy" butonuna tıklayın veya "Redeploy" yapın

## Kontrol

Deploy sonrası backend'in çalıştığını kontrol edin:

```bash
curl https://annemhikayem-backend-production.up.railway.app/api/health
```

Beklenen yanıt:
```json
{
  "status": "ok",
  "timestamp": "...",
  "iyzicoConfigured": true,
  "paytrConfigured": true,
  "https": true,
  "environment": "production"
}
```

## CORS Ayarları

Backend şu URL'lerden gelen isteklere izin veriyor:
- http://localhost:5500 (local development)
- https://annemhikayem-38c31.web.app (Firebase Hosting)
- https://annemhikayem-38c31.firebaseapp.com (Firebase Hosting alternatif)
- https://annemhikayem.com.tr (Custom domain)
- https://www.annemhikayem.com.tr (Custom domain www)
- FRONTEND_URL environment variable'ındaki URL

## Sorun Giderme

Eğer hala CORS hatası alıyorsanız:

1. Backend'in deploy edildiğinden emin olun
2. Railway logs'u kontrol edin
3. Environment variable'ları kontrol edin:
   - FRONTEND_URL doğru ayarlanmış mı?
   - NODE_ENV=production mı?

4. Browser console'da hata mesajını kontrol edin
5. Network tab'da request'i kontrol edin
