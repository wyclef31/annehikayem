# Annem Hikayem – PayTR Backend (Vercel Serverless)

Bu proje, statik frontend + Vercel Serverless Functions yapısı ile PayTR ödeme entegrasyonunu sağlar.

## Mimari

- **Frontend**:  
  - Statik HTML/CSS/JS (`index.html`, `payment.html` vb.)  
  - Vercel üzerinde static site olarak host edilir.
- **Backend**:  
  - `api/` klasörü altındaki serverless fonksiyonlar  
  - Vercel Serverless Functions (Node.js) olarak çalışır.

### API Endpointleri

- `GET /api/health`  
  Basit health-check endpointi.  
  Yanıt:  
  ```json
  { "ok": true }
  ```

- `POST /api/paytr-token`  
  PayTR `get-token` API'sine istek atar, token üretir ve frontend'e döner.  
  Gönderilen body (JSON):
  ```json
  {
    "email": "kullanici@example.com",
    "payment_amount": "19990",   // kuruş cinsinden (string)
    "user_name": "Ad Soyad",
    "user_address": "Adres",
    "user_phone": "5xxxxxxxxx",
    "basket_items": [ ... ]
  }
  ```
  Yanıt:
  ```json
  { "ok": true, "token": "PAYTR_TOKEN", "merchant_oid": "OID..." }
  ```

- `POST /api/paytr-callback`  
  PayTR'nin bildirim (callback) gönderdiği endpoint.  
  Hash doğrulaması yapar, loglar ve her zaman `"OK"` döner.

## Vercel Environment Variables

Vercel'de (Project Settings → Environment Variables) şu değişkenleri tanımlayın:

- `PAYTR_MERCHANT_ID`
- `PAYTR_MERCHANT_KEY`
- `PAYTR_MERCHANT_SALT`
- `PAYTR_TEST_MODE` (`true` veya `false`)
- `SITE_URL` (örn: `https://annemhikayem.com.tr`)

> **Önemli:** Bu değerler **sadece serverless fonksiyonlarda** kullanılır, frontend'e hiçbir şekilde gönderilmez.

## Frontend Entegrasyonu

`payment.html` dosyasında ödeme butonu şu endpoint'e istek atar:

```javascript
const response = await fetch('/api/paytr-token', { method: 'POST', ... });
```

Bu sayede:
- Railway gibi ayrı bir backend URL'ine ihtiyaç kalmaz
- Frontend ve backend aynı domain altında (`/api/*`) çalışır
- CORS problemi yaşamazsınız

## Geliştirme

Lokal geliştirme için Vercel CLI kullanılabilir:

```bash
npm i -g vercel
vercel dev
```

Bu komut, hem statik dosyaları hem de `api/*` fonksiyonlarını lokal ortamda çalıştırır.

## Notlar

- Eski Railway Express backend'inde kullanılan PayTR mantığı (hash hesaplama, user_basket formatı vb.) `api/paytr-token.js` ve `api/paytr-callback.js` dosyalarına taşınmıştır.
- Railway'e özel `app.listen` gibi kodlar serverless yapıda **kullanılmaz**.

