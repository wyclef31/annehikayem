# Ödeme Sistemi Kurulum ve Onay Gereksinimleri

Bu dokümantasyon, iyzico ve PayTR ödeme sistemlerinin kurulumu ve onay süreci için gerekli tüm bilgileri içermektedir.

## 📋 İçindekiler

1. [Genel Gereksinimler](#genel-gereksinimler)
2. [iyzico Kurulumu](#iyzico-kurulumu)
3. [PayTR Kurulumu](#paytr-kurulumu)
4. [Backend Yapılandırması](#backend-yapılandırması)
5. [Güvenlik Gereksinimleri](#güvenlik-gereksinimleri)
6. [Onay Süreci](#onay-süreci)
7. [Test ve Doğrulama](#test-ve-doğrulama)

## 🔧 Genel Gereksinimler

### Teknik Gereksinimler

- ✅ **HTTPS/SSL Sertifikası**: Tüm ödeme sayfaları HTTPS üzerinden servis edilmelidir
- ✅ **Güvenli Sunucu**: Backend sunucusu güvenli ve erişilebilir olmalıdır
- ✅ **Webhook URL'leri**: Her iki ödeme sağlayıcısı için webhook endpoint'leri hazır olmalıdır
- ✅ **Callback URL'leri**: Ödeme sonrası yönlendirme URL'leri tanımlanmalıdır

### Yasal Gereksinimler

- ✅ **Şirket Bilgileri**: Vergi dairesi, vergi numarası, adres bilgileri sitede görünür olmalıdır
- ✅ **Gizlilik Politikası**: KVKK uyumlu gizlilik politikası
- ✅ **Kullanım Koşulları**: Detaylı kullanım koşulları sayfası
- ✅ **İade/İptal Politikası**: Mesafeli satış yönetmeliğine uygun iade politikası

## 💳 iyzico Kurulumu

### 1. iyzico Hesap Oluşturma

1. [iyzico](https://www.iyzico.com) sitesine gidin
2. "Satış için Başvur" butonuna tıklayın
3. Gerekli belgeleri hazırlayın:
   - Şirket belgeleri (Vergi levhası, imza sirküleri)
   - Banka hesap bilgileri
   - İletişim bilgileri

### 2. API Bilgilerini Alma

1. iyzico panelinize giriş yapın
2. **Ayarlar > API Bilgileri** bölümüne gidin
3. Aşağıdaki bilgileri kopyalayın:
   - API Key
   - Secret Key

### 3. Backend Yapılandırması

`.env` dosyasına iyzico bilgilerinizi ekleyin:

```env
IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret_key
IYZICO_MODE=production
```

**Test Modu için:**
```env
IYZICO_MODE=sandbox
```

### 4. iyzico Onay Gereksinimleri

iyzico ekibinin kontrol edeceği özellikler:

- ✅ Ödeme sayfasında iyzico logosu ve güvenlik bilgileri
- ✅ Callback URL'inin çalışır durumda olması
- ✅ Webhook endpoint'inin hazır olması
- ✅ Hata yönetimi ve kullanıcı bilgilendirmesi
- ✅ İade/iptal işlemlerinin yapılabilmesi

### 5. iyzico Webhook URL

Webhook URL'inizi iyzico paneline ekleyin:
```
https://your-domain.com/api/payment/webhook-iyzico
```

## 💰 PayTR Kurulumu

### 1. PayTR Hesap Oluşturma

1. [PayTR](https://www.paytr.com) sitesine gidin
2. "Satış için Başvur" butonuna tıklayın
3. Gerekli belgeleri hazırlayın:
   - Şirket belgeleri
   - Banka hesap bilgileri
   - İletişim bilgileri

### 2. API Bilgilerini Alma

1. PayTR panelinize giriş yapın
2. **Ayarlar > API Bilgileri** bölümüne gidin
3. Aşağıdaki bilgileri kopyalayın:
   - Merchant ID
   - Merchant Key
   - Merchant Salt

### 3. Backend Yapılandırması

`.env` dosyasına PayTR bilgilerinizi ekleyin:

```env
PAYTR_MERCHANT_ID=your_paytr_merchant_id
PAYTR_MERCHANT_KEY=your_paytr_merchant_key
PAYTR_MERCHANT_SALT=your_paytr_merchant_salt
PAYTR_TEST_MODE=false
```

**Test Modu için:**
```env
PAYTR_TEST_MODE=true
```

### 4. PayTR Onay Gereksinimleri

PayTR ekibinin kontrol edeceği özellikler:

- ✅ Ödeme sayfasında PayTR entegrasyonu
- ✅ Callback URL'inin çalışır durumda olması
- ✅ Webhook endpoint'inin hazır olması
- ✅ Hash doğrulama mekanizması
- ✅ Hata yönetimi

### 5. PayTR Webhook URL

Webhook URL'inizi PayTR paneline ekleyin:
```
https://your-domain.com/api/payment/webhook-paytr
```

## 🖥️ Backend Yapılandırması

### 1. Environment Variables

`.env` dosyasını oluşturun ve gerekli değişkenleri ekleyin:

```env
# Sunucu Ayarları
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

# İyzico
IYZICO_API_KEY=your_key
IYZICO_SECRET_KEY=your_secret
IYZICO_MODE=production

# PayTR
PAYTR_MERCHANT_ID=your_id
PAYTR_MERCHANT_KEY=your_key
PAYTR_MERCHANT_SALT=your_salt
PAYTR_TEST_MODE=false

# Callback URL
CALLBACK_URL=https://your-domain.com/api/payment/callback
```

### 2. Backend URL'ini Güncelleme

`payment.html` dosyasındaki `BACKEND_API_URL` değişkenini güncelleyin:

```javascript
const BACKEND_API_URL = 'https://your-backend-url.com';
```

### 3. Bağımlılıkları Yükleme

```bash
npm install
```

### 4. Sunucuyu Başlatma

```bash
npm start
```

## 🔒 Güvenlik Gereksinimleri

### 1. SSL Sertifikası

- ✅ Tüm ödeme sayfaları HTTPS üzerinden servis edilmelidir
- ✅ Firebase Hosting otomatik SSL sağlar
- ✅ Custom domain için SSL sertifikası otomatik olarak sağlanır

### 2. Input Validation

- ✅ Tüm kullanıcı girdileri doğrulanmalıdır
- ✅ SQL injection ve XSS saldırılarına karşı korunmalıdır
- ✅ Kart bilgileri asla saklanmamalıdır

### 3. Hash Doğrulama

- ✅ PayTR callback'lerinde hash doğrulaması yapılmalıdır
- ✅ İyzico webhook'larında imza doğrulaması yapılmalıdır

### 4. Loglama

- ✅ Tüm ödeme işlemleri loglanmalıdır
- ✅ Hata durumları kaydedilmelidir
- ✅ Webhook'lar loglanmalıdır

## ✅ Onay Süreci

### iyzico Onay Adımları

1. **Başvuru**: iyzico sitesinden satış için başvuru yapın
2. **Belgeler**: Gerekli belgeleri yükleyin
3. **Teknik Kontrol**: iyzico ekibi sitenizi kontrol eder:
   - Ödeme sayfası çalışıyor mu?
   - Callback URL çalışıyor mu?
   - Webhook endpoint hazır mı?
   - Güvenlik önlemleri alınmış mı?
4. **Onay**: Tüm kontroller geçtikten sonra hesabınız aktif edilir

### PayTR Onay Adımları

1. **Başvuru**: PayTR sitesinden satış için başvuru yapın
2. **Belgeler**: Gerekli belgeleri yükleyin
3. **Teknik Kontrol**: PayTR ekibi sitenizi kontrol eder:
   - Ödeme sayfası çalışıyor mu?
   - Callback URL çalışıyor mu?
   - Hash doğrulama yapılıyor mu?
   - Webhook endpoint hazır mı?
4. **Onay**: Tüm kontroller geçtikten sonra hesabınız aktif edilir

## 🧪 Test ve Doğrulama

### 1. Health Check

Backend sunucunuzun çalıştığını kontrol edin:

```bash
curl https://your-backend-url.com/api/health
```

Beklenen yanıt:
```json
{
  "status": "ok",
  "timestamp": "2024-12-24T...",
  "iyzicoConfigured": true,
  "paytrConfigured": true,
  "https": true,
  "environment": "production"
}
```

### 2. Test Ödemesi

**iyzico Test Modu:**
1. `.env` dosyasında `IYZICO_MODE=sandbox` olarak ayarlayın
2. Test kartı ile ödeme yapın:
   - Kart No: 5528 7909 1063 7979
   - Son Kullanma: 12/25
   - CVV: 123

**PayTR Test Modu:**
1. `.env` dosyasında `PAYTR_TEST_MODE=true` olarak ayarlayın
2. PayTR test kartları ile ödeme yapın

### 3. Callback Test

Ödeme sonrası callback URL'lerinin çalıştığını test edin:
- `/api/payment/callback` (iyzico)
- `/api/payment/callback-paytr` (PayTR)

### 4. Webhook Test

Webhook endpoint'lerini test edin:
- `/api/payment/webhook-iyzico`
- `/api/payment/webhook-paytr`

## 📝 Önemli Notlar

1. **Production'a Geçmeden Önce:**
   - Tüm test ödemelerini yapın
   - Callback ve webhook URL'lerini doğrulayın
   - Hata senaryolarını test edin
   - Loglama sistemini kontrol edin

2. **Güvenlik:**
   - `.env` dosyasını asla commit etmeyin
   - API anahtarlarını güvenli tutun
   - Düzenli olarak güvenlik güncellemeleri yapın

3. **Destek:**
   - iyzico: destek@iyzico.com
   - PayTR: destek@paytr.com

## 🔗 Faydalı Linkler

- [iyzico Dokümantasyon](https://dev.iyzipay.com)
- [PayTR Dokümantasyon](https://www.paytr.com/odeme-entegrasyonu)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [KVKK Bilgilendirme](https://www.kvkk.gov.tr)

## 📞 İletişim

Sorularınız için:
- E-posta: annem.hikayem@gmail.com
- Instagram: @annemhikayem

