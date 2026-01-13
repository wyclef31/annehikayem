# Firebase Deploy Talimatları

Bu dosya Firebase Hosting'e deploy yapmak için gerekli adımları içerir.

## Ön Gereksinimler

1. **Node.js Kurulumu**
   - [Node.js](https://nodejs.org/) sitesinden Node.js'i indirip kurun (v14 veya üzeri)

2. **Firebase CLI Kurulumu**
   ```bash
   npm install -g firebase-tools
   ```

3. **Firebase'e Giriş Yapma**
   ```bash
   firebase login
   ```
   Bu komut tarayıcınızı açacak ve Firebase hesabınızla giriş yapmanızı isteyecek.

## Deploy Adımları

### 1. Firebase Projesini Bağlama

```bash
firebase init hosting
```

Bu komut çalıştırıldığında:
- Mevcut bir Firebase projesi seçin veya yeni bir proje oluşturun
- Public directory olarak `.` (mevcut dizin) seçin
- Single-page app için "Yes" seçin
- `firebase.json` dosyası zaten oluşturulmuş durumda

**Alternatif olarak manuel bağlama:**
```bash
firebase use --add
```
Bu komut size proje listesini gösterecek ve `.firebaserc` dosyasını güncelleyecektir.

### 2. .firebaserc Dosyasını Güncelleme

`.firebaserc` dosyasındaki `YOUR_PROJECT_ID` değerini Firebase Console'dan aldığınız proje ID'si ile değiştirin:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### 3. Deploy Yapma

```bash
firebase deploy --only hosting
```

Tüm Firebase servislerini deploy etmek için:
```bash
firebase deploy
```

## Deploy Sonrası

Deploy işlemi tamamlandığında Firebase size bir URL verecektir:
```
✔ Deploy complete!

Hosting URL: https://your-project-id.web.app
```

## Güncelleme Yapma

Kodunuzda değişiklik yaptıktan sonra tekrar deploy etmek için:

```bash
firebase deploy --only hosting
```

## Önizleme (Preview)

Deploy etmeden önce önizleme yapmak için:

```bash
firebase hosting:channel:deploy preview
```

## Sorun Giderme

### "Firebase CLI not found" Hatası
```bash
npm install -g firebase-tools
```

### "Permission denied" Hatası
```bash
firebase login --reauth
```

### "Project not found" Hatası
- `.firebaserc` dosyasındaki proje ID'sini kontrol edin
- Firebase Console'da projenin mevcut olduğundan emin olun

### Deploy Başarısız Oluyor
- `firebase.json` dosyasının doğru yapılandırıldığından emin olun
- Public directory'nin doğru olduğunu kontrol edin
- Firebase Console'da Hosting'in etkinleştirildiğinden emin olun

## Firebase Hosting Ayarları

Firebase Console > Hosting bölümünden:
- Custom domain ekleyebilirsiniz
- SSL sertifikası otomatik olarak sağlanır
- CDN ile hızlı içerik dağıtımı
- Otomatik HTTPS

## Hızlı Komutlar

```bash
# Giriş yap
firebase login

# Proje listesi
firebase projects:list

# Mevcut projeyi görüntüle
firebase use

# Deploy
firebase deploy --only hosting

# Logları görüntüle
firebase hosting:channel:list

# Rollback (son deploy'a geri dön)
firebase hosting:rollback
```

## Notlar

- İlk deploy işlemi biraz zaman alabilir
- Firebase Hosting ücretsiz planında 10 GB depolama ve 360 MB/gün bant genişliği sunar
- Custom domain eklemek için Firebase Console > Hosting > Add custom domain kullanın

