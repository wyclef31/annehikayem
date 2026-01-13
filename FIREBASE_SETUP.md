# Firebase Kurulum Talimatları

Bu proje Firebase Firestore ve Firebase Authentication kullanmaktadır. Aşağıdaki adımları takip ederek Firebase'i yapılandırın.

## 1. Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. "Add project" (Proje Ekle) butonuna tıklayın
3. Proje adını girin ve "Continue" (Devam) butonuna tıklayın
4. Google Analytics'i isteğe bağlı olarak etkinleştirin veya devre dışı bırakın
5. "Create project" (Proje Oluştur) butonuna tıklayın

## 2. Web Uygulaması Ekleme

1. Firebase Console'da projenizi açın
2. Sol menüden "Project Settings" (Proje Ayarları) ikonuna tıklayın
3. Aşağı kaydırın ve "Your apps" (Uygulamalarınız) bölümünde "</>" (Web) ikonuna tıklayın
4. Uygulama adını girin (örn: "Abonelik Sistemi")
5. "Register app" (Uygulamayı Kaydet) butonuna tıklayın
6. Firebase yapılandırma bilgilerinizi kopyalayın

## 3. Firebase Yapılandırmasını Güncelleme

1. Projenizdeki `firebase-config.js` dosyasını açın
2. Firebase Console'dan kopyaladığınız yapılandırma bilgilerini yapıştırın:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## 4. Firestore Database Kurulumu

1. Firebase Console'da sol menüden "Firestore Database" seçeneğine tıklayın
2. "Create database" (Veritabanı Oluştur) butonuna tıklayın
3. "Start in test mode" (Test modunda başlat) seçeneğini seçin (geliştirme için)
4. Veritabanı konumunu seçin (örn: europe-west1)
5. "Enable" (Etkinleştir) butonuna tıklayın

### Firestore Güvenlik Kuralları

Firestore Database > Rules sekmesine gidin ve aşağıdaki kuralları ekleyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Abonelikler koleksiyonu
    match /abonelikler/{abonelikId} {
      // Herkes okuyabilir ve yazabilir (geliştirme için)
      allow read, write: if true;
      
      // ÜRETİM İÇİN DAHA GÜVENLİ KURALLAR:
      // Sadece kimlik doğrulaması yapılmış kullanıcılar okuyabilir
      // allow read: if request.auth != null;
      // Herkes yazabilir (abonelik formu için)
      // allow write: if true;
    }
  }
}
```

## 5. Firebase Authentication Kurulumu

1. Firebase Console'da sol menüden "Authentication" seçeneğine tıklayın
2. "Get started" (Başlayın) butonuna tıklayın
3. "Sign-in method" (Giriş yöntemi) sekmesine gidin
4. "Email/Password" (E-posta/Şifre) seçeneğini etkinleştirin
5. "Save" (Kaydet) butonuna tıklayın

### Admin Kullanıcı Oluşturma

1. Authentication sayfasında "Users" (Kullanıcılar) sekmesine gidin
2. "Add user" (Kullanıcı Ekle) butonuna tıklayın
3. Admin e-posta adresini girin (örn: admin@example.com)
4. Geçici şifre oluşturun
5. "Add user" (Kullanıcı Ekle) butonuna tıklayın

### Admin.js Dosyasını Güncelleme

`admin.js` dosyasındaki admin e-posta adresini güncelleyin:

```javascript
const ADMIN_EMAIL = 'admin@example.com'; // Firebase'de oluşturduğunuz admin e-postası
const ADMIN_PASSWORD = 'admin123'; // İlk şifre (ilk girişten sonra değiştirin)
```

**Not:** İlk girişten sonra Firebase Authentication üzerinden şifreyi değiştirmeniz önerilir.

## 6. Firestore Koleksiyonu Oluşturma

Firestore otomatik olarak `abonelikler` koleksiyonunu oluşturacaktır. İlk abonelik kaydı yapıldığında koleksiyon otomatik olarak oluşturulur.

## 7. Test Etme

1. `index.html` dosyasını tarayıcıda açın
2. Abonelik formunu doldurup gönderin
3. Firebase Console > Firestore Database'de `abonelikler` koleksiyonunu kontrol edin
4. `admin.html` dosyasını açın ve admin bilgileriyle giriş yapın
5. Abonelik listesinin görüntülendiğini kontrol edin

## Güvenlik Notları

⚠️ **ÖNEMLİ:** Bu kurulum geliştirme ortamı içindir. Üretim ortamı için:

1. Firestore güvenlik kurallarını güncelleyin
2. Firebase API anahtarlarını güvenli tutun
3. Admin şifresini güçlü bir şifreyle değiştirin
4. Firebase Hosting kullanarak HTTPS üzerinden yayınlayın
5. CORS ayarlarını yapılandırın

## Sorun Giderme

### "Firebase is not defined" Hatası
- Firebase SDK'larının doğru yüklendiğinden emin olun
- `firebase-config.js` dosyasının script.js'den önce yüklendiğini kontrol edin

### "Permission denied" Hatası
- Firestore güvenlik kurallarını kontrol edin
- Authentication durumunu kontrol edin

### Giriş Yapamıyorum
- Admin e-posta adresinin Firebase Authentication'da kayıtlı olduğundan emin olun
- `admin.js` dosyasındaki `ADMIN_EMAIL` değişkenini kontrol edin

## Destek

Firebase dokümantasyonu: https://firebase.google.com/docs

