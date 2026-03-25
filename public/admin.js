// Admin e-posta ve şifre (Firebase Authentication için)
const ADMIN_EMAIL = 'utkrnn09@gmail.com'; // Admin e-posta adresi
const ADMIN_PASSWORD = 'annemhikayem'; // Admin şifresi

// Sayfa yüklendiğinde kontrol et
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupLogin();
});

// Firebase Authentication durumunu dinle
auth.onAuthStateChanged((user) => {
    if (user) {
        // Kullanıcı giriş yapmış
        showAdminScreen();
        loadAbonelikler();
        loadAdminUrunler(); // Ürünleri de yükle
        loadSiparisler(); // Siparişleri de yükle
    } else {
        // Kullanıcı giriş yapmamış
        showLoginScreen();
    }
});

// Kimlik doğrulama kontrolü
function checkAuth() {
    const user = auth.currentUser;
    if (user) {
        showAdminScreen();
        loadAbonelikler();
        loadAdminUrunler(); // Ürünleri de yükle
        loadSiparisler(); // Siparişleri de yükle
    } else {
        showLoginScreen();
    }
}

// Admin ekranını göster
function showAdminScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const adminScreen = document.getElementById('adminScreen');
    loginScreen.style.display = 'none';
    adminScreen.style.display = 'block';
}

// Giriş ekranını göster
function showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const adminScreen = document.getElementById('adminScreen');
    loginScreen.style.display = 'flex';
    adminScreen.style.display = 'none';
}

// Giriş formu ayarları
function setupLogin() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = ADMIN_EMAIL; // Admin e-postası
            const password = document.getElementById('adminPassword').value;
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;

            // Butonu devre dışı bırak
            submitButton.disabled = true;
            submitButton.textContent = 'Giriş yapılıyor...';
            loginError.style.display = 'none';

            try {
                // Firebase Authentication ile giriş yap
                await auth.signInWithEmailAndPassword(email, password);
                // onAuthStateChanged listener otomatik olarak admin ekranını gösterecek
                loginForm.reset();
            } catch (error) {
                console.error('Giriş hatası:', error);
                let errorMessage = 'Giriş başarısız!';
                
                if (error.code === 'auth/user-not-found') {
                    errorMessage = 'Kullanıcı bulunamadı! Firebase Console\'dan kullanıcı ekleyin.';
                } else if (error.code === 'auth/wrong-password') {
                    errorMessage = 'Hatalı şifre!';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Geçersiz e-posta!';
                } else if (error.code === 'auth/network-request-failed') {
                    errorMessage = 'Ağ hatası! İnternet bağlantınızı kontrol edin.';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMessage = 'Çok fazla deneme! Lütfen daha sonra tekrar deneyin.';
                } else {
                    errorMessage = 'Hata: ' + error.message;
                }
                
                loginError.textContent = errorMessage;
                loginError.style.display = 'block';
                setTimeout(() => {
                    loginError.style.display = 'none';
                }, 5000);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }
}

// Çıkış yap
function logout() {
    auth.signOut().then(() => {
        showLoginScreen();
    }).catch((error) => {
        console.error('Çıkış hatası:', error);
        // Hata olsa bile çıkış yap
        showLoginScreen();
    });
}

// Abonelikleri yükle
async function loadAbonelikler() {
    const tableBody = document.getElementById('abonelikTableBody');
    
    // Yükleniyor mesajı göster
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="no-data">
                <div class="no-data-icon">⏳</div>
                <p>Yükleniyor...</p>
            </td>
        </tr>
    `;

    try {
        // Firestore'dan abonelikleri çek
        const snapshot = await db.collection('abonelikler')
            .orderBy('createdAt', 'desc')
            .get();

        const abonelikler = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            abonelikler.push({
                id: doc.id,
                name: data.name,
                email: data.email,
                date: data.date || (data.createdAt ? formatDate(data.createdAt.toDate()) : 'Bilinmiyor')
            });
        });

        // İstatistikleri güncelle
        updateStats(abonelikler);

        // Tabloyu temizle
        tableBody.innerHTML = '';

        if (abonelikler.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-data">
                        <div class="no-data-icon">📋</div>
                        <p>Henüz abonelik bulunmuyor</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Abonelikleri tabloya ekle
        abonelikler.forEach((abonelik, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${escapeHtml(abonelik.name)}</td>
                <td>${escapeHtml(abonelik.email)}</td>
                <td>${escapeHtml(abonelik.date)}</td>
                <td>
                    <button class="admin-btn btn-danger" onclick="deleteAbonelik('${abonelik.id}')" style="padding: 6px 12px; font-size: 0.85rem;">Sil</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Abonelik yükleme hatası:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">
                    <div class="no-data-icon">❌</div>
                    <p>Veriler yüklenirken bir hata oluştu</p>
                    <button class="admin-btn btn-primary" onclick="loadAbonelikler()" style="margin-top: 10px;">
                        Tekrar Dene
                    </button>
                </td>
            </tr>
        `;
    }
}

// İstatistikleri güncelle
function updateStats(abonelikler) {
    const totalAbonelik = document.getElementById('totalAbonelik');
    const todayAbonelik = document.getElementById('todayAbonelik');
    const thisWeekAbonelik = document.getElementById('thisWeekAbonelik');

    if (totalAbonelik) {
        totalAbonelik.textContent = abonelikler.length;
    }

    // Bugünkü abonelikler
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = abonelikler.filter(ab => {
        // Tarih string'inden parse etmeye çalış
        const dateStr = ab.date;
        if (!dateStr || dateStr === 'Bilinmiyor') return false;
        
        // Tarih string'ini parse et (format: "15 Ocak 2024, 14:30")
        try {
            const abDate = new Date(dateStr);
            abDate.setHours(0, 0, 0, 0);
            return abDate.getTime() === today.getTime();
        } catch {
            return false;
        }
    }).length;

    if (todayAbonelik) {
        todayAbonelik.textContent = todayCount;
    }

    // Bu haftaki abonelikler
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekCount = abonelikler.filter(ab => {
        const dateStr = ab.date;
        if (!dateStr || dateStr === 'Bilinmiyor') return false;
        
        try {
            const abDate = new Date(dateStr);
            return abDate >= weekAgo;
        } catch {
            return false;
        }
    }).length;

    if (thisWeekAbonelik) {
        thisWeekAbonelik.textContent = weekCount;
    }
}

// Abonelik sil
async function deleteAbonelik(id) {
    if (confirm('Bu aboneliği silmek istediğinizden emin misiniz?')) {
        try {
            await db.collection('abonelikler').doc(id).delete();
            loadAbonelikler();
            alert('Abonelik başarıyla silindi!');
        } catch (error) {
            console.error('Silme hatası:', error);
            alert('Abonelik silinirken bir hata oluştu!');
        }
    }
}

// Verileri yenile
function refreshData() {
    loadAbonelikler();
    loadAdminUrunler(); // Ürünleri de yenile
    loadSiparisler(); // Siparişleri de yenile
    alert('Veriler yenilendi!');
}

// Siparişleri yükle
async function loadSiparisler() {
    const tableBody = document.getElementById('siparislerTableBody');
    
    if (!tableBody) return;
    
    // Yükleniyor mesajı göster
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="no-data">
                <div class="no-data-icon">⏳</div>
                <p>Yükleniyor...</p>
            </td>
        </tr>
    `;

    try {
        // Firestore'dan siparişleri çek
        const snapshot = await db.collection('siparisler')
            .orderBy('createdAt', 'desc')
            .get();

        const siparisler = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            siparisler.push({
                id: doc.id,
                ...data
            });
        });

        // Tabloyu temizle
        tableBody.innerHTML = '';

        if (siparisler.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        <div class="no-data-icon">📦</div>
                        <p>Henüz sipariş bulunmuyor</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Siparişleri tabloya ekle
        siparisler.forEach((siparis, index) => {
            const row = document.createElement('tr');
            
            // Müşteri bilgisi
            const musteriAd = siparis.shipping ? 
                `${siparis.shipping.firstName || ''} ${siparis.shipping.lastName || ''}`.trim() : 
                'Bilinmiyor';
            
            // Ürünler listesi
            let urunlerHtml = '';
            if (siparis.cart && Array.isArray(siparis.cart)) {
                siparis.cart.forEach(item => {
                    urunlerHtml += `<div style="margin-bottom: 5px;">${escapeHtml(item.name)} x ${item.quantity}</div>`;
                });
            } else {
                urunlerHtml = 'Ürün bilgisi yok';
            }
            
            // Tarih
            const tarih = siparis.createdAt ? 
                formatDate(siparis.createdAt.toDate()) : 
                (siparis.timestamp ? new Date(siparis.timestamp).toLocaleString('tr-TR') : 'Bilinmiyor');
            
            // Sipariş No (ID'nin son 8 karakteri)
            const siparisNo = siparis.id && siparis.id.length >= 8 ? siparis.id.substr(-8).toUpperCase() : `#${index + 1}`;
            
            // Durum
            const durum = siparis.status || 'Tamamlandı';
            const durumRenk = durum === 'Tamamlandı' ? '#28a745' : 
                             durum === 'İptal' ? '#dc3545' : 
                             '#ffc107';
            
            row.innerHTML = `
                <td><strong>${siparisNo}</strong></td>
                <td>
                    <div>${escapeHtml(musteriAd)}</div>
                    ${siparis.shipping && siparis.shipping.email ? `<small style="color: #666;">${escapeHtml(siparis.shipping.email)}</small>` : ''}
                    ${siparis.shipping && siparis.shipping.phone ? `<div><small style="color: #666;">${escapeHtml(siparis.shipping.phone)}</small></div>` : ''}
                </td>
                <td style="max-width: 200px;">${urunlerHtml}</td>
                <td><strong>${(siparis.total || 0).toFixed(2)} ₺</strong></td>
                <td><small>${tarih}</small></td>
                <td><span style="background: ${durumRenk}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem;">${durum}</span></td>
                <td>
                    <button class="admin-btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="viewSiparisDetay('${siparis.id}')">Detay</button>
                </td>
            `;
            
            row.setAttribute('data-siparis-search', JSON.stringify({
                siparisNo: siparisNo.toLowerCase(),
                musteri: musteriAd.toLowerCase(),
                urunler: (siparis.cart || []).map(item => item.name.toLowerCase()).join(' ')
            }));
            
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Sipariş yükleme hatası:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <div class="no-data-icon">❌</div>
                    <p>Siparişler yüklenirken bir hata oluştu</p>
                </td>
            </tr>
        `;
    }
}

// Sipariş detayını görüntüle
async function viewSiparisDetay(siparisId) {
    const modal = document.getElementById('siparisDetayModal');
    const content = document.getElementById('siparisDetayContent');
    
    if (!modal || !content) return;
    
    try {
        // Firestore'dan sipariş detayını çek
        const doc = await db.collection('siparisler').doc(siparisId).get();
        
        if (!doc.exists) {
            alert('Sipariş bulunamadı!');
            return;
        }
        
        const siparis = doc.data();
        
        // Detay içeriğini oluştur
        let html = `
            <div style="margin-bottom: 20px;">
                <h3 style="color: var(--deep-purple); margin-bottom: 15px;">Sipariş Bilgileri</h3>
                <div style="background: var(--very-light-purple); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <p><strong>Sipariş No:</strong> ${siparisId.substr(-8).toUpperCase()}</p>
                    <p><strong>Tarih:</strong> ${siparis.createdAt ? formatDate(siparis.createdAt.toDate()) : (siparis.timestamp ? new Date(siparis.timestamp).toLocaleString('tr-TR') : 'Bilinmiyor')}</p>
                    <p><strong>Durum:</strong> ${siparis.status || 'Tamamlandı'}</p>
                    <p><strong>Toplam Tutar:</strong> <strong style="color: var(--deep-purple); font-size: 1.2rem;">${(siparis.total || 0).toFixed(2)} ₺</strong></p>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: var(--deep-purple); margin-bottom: 15px;">Müşteri Bilgileri</h3>
                <div style="background: var(--very-light-purple); padding: 15px; border-radius: 8px;">
        `;
        
        if (siparis.shipping) {
            html += `
                    <p><strong>Ad Soyad:</strong> ${escapeHtml(siparis.shipping.firstName || '')} ${escapeHtml(siparis.shipping.lastName || '')}</p>
                    ${siparis.shipping.email ? `<p><strong>E-posta:</strong> ${escapeHtml(siparis.shipping.email)}</p>` : ''}
                    ${siparis.shipping.phone ? `<p><strong>Telefon:</strong> ${escapeHtml(siparis.shipping.phone)}</p>` : ''}
                    ${siparis.shipping.city ? `<p><strong>İl:</strong> ${escapeHtml(siparis.shipping.city)}</p>` : ''}
                    ${siparis.shipping.district ? `<p><strong>İlçe:</strong> ${escapeHtml(siparis.shipping.district)}</p>` : ''}
                    ${siparis.shipping.address ? `<p><strong>Adres:</strong> ${escapeHtml(siparis.shipping.address)}</p>` : ''}
                    ${siparis.shipping.postalCode ? `<p><strong>Posta Kodu:</strong> ${escapeHtml(siparis.shipping.postalCode)}</p>` : ''}
            `;
        } else {
            html += `<p>Müşteri bilgisi bulunamadı.</p>`;
        }
        
        html += `
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: var(--deep-purple); margin-bottom: 15px;">Satılan Ürünler</h3>
                <div style="background: var(--very-light-purple); padding: 15px; border-radius: 8px;">
        `;
        
        if (siparis.cart && Array.isArray(siparis.cart) && siparis.cart.length > 0) {
            html += '<table style="width: 100%; border-collapse: collapse;">';
            html += '<thead><tr style="border-bottom: 2px solid var(--light-purple);"><th style="text-align: left; padding: 10px;">Ürün</th><th style="text-align: center; padding: 10px;">Adet</th><th style="text-align: right; padding: 10px;">Fiyat</th><th style="text-align: right; padding: 10px;">Toplam</th></tr></thead><tbody>';
            
            siparis.cart.forEach(item => {
                const birimFiyat = parseFloat(item.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
                const toplam = birimFiyat * (item.quantity || 1);
                
                html += `
                    <tr style="border-bottom: 1px solid var(--light-purple);">
                        <td style="padding: 10px;"><strong>${escapeHtml(item.name)}</strong></td>
                        <td style="text-align: center; padding: 10px;">${item.quantity || 1}</td>
                        <td style="text-align: right; padding: 10px;">${birimFiyat.toFixed(2)} ₺</td>
                        <td style="text-align: right; padding: 10px;"><strong>${toplam.toFixed(2)} ₺</strong></td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
        } else {
            html += '<p>Ürün bilgisi bulunamadı.</p>';
        }
        
        html += `
                </div>
            </div>
        `;
        
        // Ödeme bilgileri varsa ekle
        if (siparis.paymentResult) {
            html += `
                <div style="margin-bottom: 20px;">
                    <h3 style="color: var(--deep-purple); margin-bottom: 15px;">Ödeme Bilgileri</h3>
                    <div style="background: var(--very-light-purple); padding: 15px; border-radius: 8px;">
                        ${siparis.paymentResult.conversationId ? `<p><strong>İşlem ID:</strong> ${escapeHtml(siparis.paymentResult.conversationId)}</p>` : ''}
                        ${siparis.paymentResult.paymentId ? `<p><strong>Ödeme ID:</strong> ${escapeHtml(siparis.paymentResult.paymentId)}</p>` : ''}
                        ${siparis.paymentResult.price ? `<p><strong>Ödenen Tutar:</strong> ${parseFloat(siparis.paymentResult.price).toFixed(2)} ₺</p>` : ''}
                    </div>
                </div>
            `;
        }
        
        content.innerHTML = html;
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Sipariş detay yükleme hatası:', error);
        alert('Sipariş detayı yüklenirken bir hata oluştu!');
    }
}

// Sipariş detay modal'ını kapat
function closeSiparisDetayModal() {
    const modal = document.getElementById('siparisDetayModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Sipariş filtreleme
function filterSiparisler() {
    const searchInput = document.getElementById('siparisArama');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const rows = document.querySelectorAll('#siparislerTableBody tr');
    
    rows.forEach(row => {
        const searchData = row.getAttribute('data-siparis-search');
        if (!searchData) return;
        
        try {
            const data = JSON.parse(searchData);
            const searchText = `${data.siparisNo} ${data.musteri} ${data.urunler}`;
            
            if (searchText.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        } catch (e) {
            // Hata durumunda satırı göster
            row.style.display = '';
        }
    });
}

// CSV olarak dışa aktar
async function exportData() {
    try {
        // Firestore'dan tüm abonelikleri çek
        const snapshot = await db.collection('abonelikler')
            .orderBy('createdAt', 'desc')
            .get();

        const abonelikler = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            abonelikler.push({
                name: data.name,
                email: data.email,
                date: data.date || (data.createdAt ? formatDate(data.createdAt.toDate()) : 'Bilinmiyor')
            });
        });
        
        if (abonelikler.length === 0) {
            alert('Dışa aktarılacak veri bulunmuyor!');
            return;
        }

        // CSV başlıkları
        let csv = 'Ad,E-posta,Kayıt Tarihi\n';

        // Verileri CSV formatına dönüştür
        abonelikler.forEach(ab => {
            csv += `"${ab.name}","${ab.email}","${ab.date}"\n`;
        });

        // Dosyayı indir
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `abonelikler_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Dışa aktarma hatası:', error);
        alert('Veriler dışa aktarılırken bir hata oluştu!');
    }
}

// Tüm verileri sil
async function clearAllData() {
    if (confirm('TÜM abonelik verilerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
        if (confirm('Son bir kez onaylıyor musunuz? Tüm veriler kalıcı olarak silinecek!')) {
            try {
                // Firestore'dan tüm abonelikleri çek ve sil
                const snapshot = await db.collection('abonelikler').get();
                const batch = db.batch();
                
                snapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                
                await batch.commit();
                loadAbonelikler();
                alert('Tüm veriler silindi!');
            } catch (error) {
                console.error('Toplu silme hatası:', error);
                alert('Veriler silinirken bir hata oluştu!');
            }
        }
    }
}

// HTML escape fonksiyonu (XSS koruması)
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Tarih formatla
function formatDate(date) {
    if (!date) return 'Bilinmiyor';
    return date.toLocaleString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Fotoğraf yükleme için global değişkenler
let kapakFotoFile = null;
let galeriFotoFiles = [];

// Düzenleme için global değişkenler
let editKapakFotoFile = null;
let editGaleriFotoFiles = [];
let editMevcutKapakURL = '';
let editMevcutGaleriURLs = [];
let editSilinecekGaleriURLs = [];
let editUrunId = null;

// Ürün ekleme formunu göster/gizle
function toggleUrunEkleForm() {
    console.log('toggleUrunEkleForm çağrıldı');
    const container = document.getElementById('urunEkleContainer');
    console.log('Container:', container);
    
    if (!container) {
        console.error('urunEkleContainer bulunamadı!');
        alert('Form yüklenemedi. Sayfayı yenileyin.');
        return;
    }
    
    const isHidden = container.style.display === 'none' || !container.style.display || window.getComputedStyle(container).display === 'none';
    
    if (isHidden) {
        container.style.display = 'block';
        // Formu temizle
        const form = document.getElementById('urunEkleForm');
        if (form) {
            form.reset();
        }
        // Fotoğraf önizlemelerini temizle
        kapakFotoFile = null;
        galeriFotoFiles = [];
        document.getElementById('kapakFotoPreview').style.display = 'none';
        document.getElementById('galeriFotograflarPreview').innerHTML = '';
        // Sayfayı forma kaydır
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        container.style.display = 'none';
    }
}

// Kapak fotoğrafı önizleme
function previewKapakFoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('kapakFotoPreviewImg').src = e.target.result;
            document.getElementById('kapakFotoPreview').style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
        kapakFotoFile = input.files[0];
    }
}

// Kapak fotoğrafını kaldır
function removeKapakFoto() {
    document.getElementById('urunKapakFile').value = '';
    document.getElementById('kapakFotoPreview').style.display = 'none';
    kapakFotoFile = null;
}

// Galeri fotoğrafı ekle
function addGaleriFotoFile(input) {
    if (input.files && input.files.length > 0) {
        Array.from(input.files).forEach(file => {
            const fileId = 'galeri_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            galeriFotoFiles.push({ id: fileId, file: file });
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewContainer = document.getElementById('galeriFotograflarPreview');
                const previewDiv = document.createElement('div');
                previewDiv.className = 'foto-preview';
                previewDiv.id = fileId;
                previewDiv.innerHTML = `
                    <img src="${e.target.result}" alt="Galeri fotoğrafı">
                    <button type="button" class="foto-preview-remove" onclick="removeGaleriFotoFile('${fileId}')">×</button>
                `;
                previewContainer.appendChild(previewDiv);
            };
            reader.readAsDataURL(file);
        });
    }
}

// Galeri fotoğrafını kaldır
function removeGaleriFotoFile(fileId) {
    galeriFotoFiles = galeriFotoFiles.filter(f => f.id !== fileId);
    const previewDiv = document.getElementById(fileId);
    if (previewDiv) {
        previewDiv.remove();
    }
}

// Fotoğrafı Firebase Storage'a yükle
async function uploadFotoToStorage(file, path, progressCallback) {
    return new Promise((resolve, reject) => {
        const storageRef = firebase.storage().ref(path);
        const uploadTask = storageRef.put(file);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (progressCallback) progressCallback(progress);
            },
            (error) => {
                console.error('Upload hatası:', error);
                reject(error);
            },
            () => {
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    resolve(downloadURL);
                });
            }
        );
    });
}

// Ürün ekleme formu submit
document.addEventListener('DOMContentLoaded', function() {
    const urunEkleForm = document.getElementById('urunEkleForm');
    if (urunEkleForm) {
        urunEkleForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Yükleniyor...';
            
            const progressContainer = document.createElement('div');
            progressContainer.style.cssText = 'margin-top: 15px; padding: 15px; background: var(--very-light-purple); border-radius: 8px; text-align: center;';
            this.appendChild(progressContainer);
            
            try {
                // Kapak fotoğrafı yükle
                let kapakURL = '';
                if (kapakFotoFile) {
                    progressContainer.textContent = 'Kapak fotoğrafı yükleniyor...';
                    const kapakPath = `urunler/kapak/${Date.now()}_${kapakFotoFile.name}`;
                    kapakURL = await uploadFotoToStorage(kapakFotoFile, kapakPath, (progress) => {
                        progressContainer.textContent = `Kapak fotoğrafı yükleniyor... ${Math.round(progress)}%`;
                    });
                }
                
                // Galeri fotoğraflarını yükle
                const galeriURLs = [];
                if (galeriFotoFiles.length > 0) {
                    for (let i = 0; i < galeriFotoFiles.length; i++) {
                        const foto = galeriFotoFiles[i];
                        const galeriPath = `urunler/galeri/${Date.now()}_${i}_${foto.file.name}`;
                        const fileSizeMB = (foto.file.size / (1024 * 1024)).toFixed(2);
                        console.log('Galeri fotoğrafı yükleniyor:', galeriPath, 'Boyut:', fileSizeMB, 'MB');
                        
                        const fotoURL = await uploadFotoToStorage(foto.file, galeriPath, (progress) => {
                            progressContainer.textContent = `Galeri fotoğrafları yükleniyor... (${i + 1}/${galeriFotoFiles.length}) - ${Math.round(progress)}%`;
                        });
                        
                        galeriURLs.push(fotoURL);
                        console.log('Galeri fotoğrafı yüklendi:', fotoURL);
                    }
                }

                // Ürün verisini hazırla
                progressContainer.textContent = 'Ürün kaydediliyor...';
                submitButton.textContent = 'Kaydediliyor...';
                const urunData = {
                    baslik: document.getElementById('urunBaslik').value.trim(),
                    aciklama: document.getElementById('urunAciklama').value.trim(),
                    fiyat: document.getElementById('urunFiyat').value.trim(),
                    sira: parseInt(document.getElementById('urunSira').value) || 1,
                    aktif: document.getElementById('urunAktif').checked,
                    link: document.getElementById('urunLink').value.trim() || null,
                    kapak: kapakURL,
                    galeri: galeriURLs,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Firestore'a kaydet
                await db.collection('urunler').add(urunData);
                console.log('✅ Ürün başarıyla eklendi!');
                
                progressContainer.textContent = '✅ Ürün başarıyla kaydedildi!';
                progressContainer.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                progressContainer.style.color = 'white';
                
                // Formu temizle
                this.reset();
                kapakFotoFile = null;
                galeriFotoFiles = [];
                document.getElementById('kapakFotoPreview').style.display = 'none';
                document.getElementById('galeriFotograflarPreview').innerHTML = '';
                
                // 2 saniye sonra formu kapat ve listeyi yenile
                setTimeout(() => {
                    toggleUrunEkleForm();
                    loadAdminUrunler();
                    progressContainer.remove();
                }, 2000);
                
            } catch (error) {
                console.error('❌ Ürün ekleme hatası:', error);
                progressContainer.textContent = '❌ Hata: ' + error.message;
                progressContainer.style.background = '#fee';
                progressContainer.style.color = '#c33';
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        });
    } else {
        console.error('urunEkleForm bulunamadı!');
    }
});

// Ürünleri admin panelinde yükle
async function loadAdminUrunler() {
    const urunlerListesi = document.getElementById('urunlerAdminListesi');
    
    if (!urunlerListesi) {
        console.error('urunlerAdminListesi elementi bulunamadı');
        return;
    }

    urunlerListesi.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--dark-gray);">Yükleniyor...</div>';

    try {
        const snapshot = await db.collection('urunler')
            .orderBy('sira', 'asc')
            .get();

        const urunler = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            urunler.push({
                id: doc.id,
                ...data
            });
        });

        if (urunler.length === 0) {
            urunlerListesi.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--dark-gray);">
                    <div style="font-size: 3rem; margin-bottom: 15px;">📦</div>
                    <p>Henüz ürün bulunmuyor</p>
                    <p style="font-size: 0.9rem; color: #999; margin-top: 15px;">Yeni ürün eklemek için "Ürün Ekle" butonunu kullanın.</p>
                </div>
            `;
            return;
        }

        urunlerListesi.innerHTML = '';
        const urunlerGrid = document.createElement('div');
        urunlerGrid.className = 'urunler-listesi';
        urunlerGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;';

        urunler.forEach(urun => {
            const urunCard = document.createElement('div');
            urunCard.style.cssText = 'background: var(--white); border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(107, 76, 147, 0.1);';
            
            urunCard.innerHTML = `
                <div style="margin-bottom: 15px;">
                    ${urun.kapak ? `<img src="${urun.kapak}" alt="${escapeHtml(urun.baslik)}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">` : '<div style="width: 100%; height: 200px; background: var(--very-light-purple); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--medium-purple); font-size: 3rem;">📦</div>'}
                </div>
                <h3 style="font-family: \'Playfair Display\', serif; color: var(--deep-purple); margin-bottom: 10px; font-size: 1.3rem;">${escapeHtml(urun.baslik || 'Ürün')}</h3>
                <p style="color: var(--dark-gray); margin-bottom: 10px; font-size: 0.9rem; line-height: 1.6;">${escapeHtml(urun.aciklama || '').substring(0, 100)}${(urun.aciklama || '').length > 100 ? '...' : ''}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--very-light-purple);">
                    <span style="font-weight: 600; color: var(--deep-purple); font-size: 1.1rem;">${escapeHtml(urun.fiyat || '0')} ₺</span>
                    <span style="padding: 4px 12px; background: ${urun.aktif === false ? '#dc3545' : '#28a745'}; color: white; border-radius: 12px; font-size: 0.85rem;">${urun.aktif === false ? 'Pasif' : 'Aktif'}</span>
                </div>
                <div class="urun-kart-actions" style="display: flex; gap: 10px; margin-top: 15px;">
                    <button class="admin-btn btn-primary" onclick="editAdminUrun('${urun.id}')" style="flex: 1; padding: 8px 15px; font-size: 0.9rem;">Düzenle</button>
                    <button class="admin-btn btn-danger" onclick="deleteAdminUrun('${urun.id}')" style="padding: 8px 15px; font-size: 0.9rem;">Sil</button>
                </div>
            `;
            
            urunlerGrid.appendChild(urunCard);
        });

        urunlerListesi.appendChild(urunlerGrid);

    } catch (error) {
        console.error('Ürün yükleme hatası:', error);
        urunlerListesi.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--dark-gray);">
                <div style="font-size: 3rem; margin-bottom: 15px;">❌</div>
                <p>Ürünler yüklenirken bir hata oluştu</p>
                <button class="admin-btn btn-primary" onclick="loadAdminUrunler()" style="margin-top: 15px;">Tekrar Dene</button>
            </div>
        `;
    }
}

// HTML escape fonksiyonu (ürünler için)
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Ürün düzenle
async function editAdminUrun(id) {
    try {
        const doc = await db.collection('urunler').doc(id).get();
        if (!doc.exists) {
            alert('Ürün bulunamadı!');
            return;
        }

        const data = doc.data();
        const editModal = document.getElementById('editModal');
        const editBaslik = document.getElementById('editBaslik');
        const editAciklama = document.getElementById('editAciklama');
        const editFiyat = document.getElementById('editFiyat');
        const editSira = document.getElementById('editSira');
        const editAktif = document.getElementById('editAktif');

        if (!editBaslik || !editAciklama || !editFiyat || !editSira || !editAktif || !editModal) {
            console.error('Modal elementleri bulunamadı:', {
                editBaslik: !!editBaslik,
                editAciklama: !!editAciklama,
                editFiyat: !!editFiyat,
                editSira: !!editSira,
                editAktif: !!editAktif,
                editModal: !!editModal
            });
            alert('Düzenleme formu yüklenemedi. Lütfen sayfayı yenileyin.');
            return;
        }

        // Formu doldur
        editBaslik.value = data.baslik || '';
        editAciklama.value = data.aciklama || '';
        editFiyat.value = data.fiyat || '';
        editSira.value = data.sira || 1;
        editAktif.checked = data.aktif !== false;
        if (document.getElementById('editLink')) {
            document.getElementById('editLink').value = data.link || '';
        }
        
        // Ürün ID'sini sakla
        editUrunId = id;
        
        // Fotoğraf değişkenlerini sıfırla
        editKapakFotoFile = null;
        editGaleriFotoFiles = [];
        editMevcutKapakURL = data.kapak || '';
        editMevcutGaleriURLs = Array.isArray(data.galeri) ? [...data.galeri] : [];
        editSilinecekGaleriURLs = [];
        
        // Mevcut kapak fotoğrafını göster
        const editKapakPreview = document.getElementById('editKapakFotoPreview');
        const editKapakPreviewImg = document.getElementById('editKapakFotoPreviewImg');
        if (editKapakPreview && editKapakPreviewImg) {
            if (editMevcutKapakURL) {
                editKapakPreviewImg.src = editMevcutKapakURL;
                editKapakPreview.style.display = 'block';
            } else {
                editKapakPreview.style.display = 'none';
            }
        }
        
        // Mevcut galeri fotoğraflarını göster
        const editGaleriPreview = document.getElementById('editGaleriFotograflarPreview');
        if (editGaleriPreview) {
            editGaleriPreview.innerHTML = '';
            editMevcutGaleriURLs.forEach((url, index) => {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'galeri-preview-item';
                previewDiv.innerHTML = `
                    <img src="${url}" alt="Galeri fotoğrafı ${index + 1}">
                    <button type="button" class="galeri-preview-remove" onclick="removeEditGaleriFoto('${url}')" title="Fotoğrafı kaldır">×</button>
                `;
                editGaleriPreview.appendChild(previewDiv);
            });
        }
        
        // File input'ları temizle
        if (document.getElementById('editKapakFile')) {
            document.getElementById('editKapakFile').value = '';
        }
        if (document.getElementById('editGaleriFotoFile')) {
            document.getElementById('editGaleriFotoFile').value = '';
        }

        // Modal'ı göster
        editModal.style.display = 'flex';

        // Form submit
        const editForm = document.getElementById('editUrunForm');
        if (editForm) {
            editForm.onsubmit = async function(e) {
                e.preventDefault();
                const submitButton = editForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = 'Kaydediliyor...';

                try {
                    const progressContainer = document.createElement('div');
                    progressContainer.style.cssText = 'margin-top: 15px; padding: 15px; background: var(--very-light-purple); border-radius: 8px; text-align: center;';
                    editForm.appendChild(progressContainer);
                    
                    // Yeni kapak fotoğrafı yükle
                    let kapakURL = editMevcutKapakURL;
                    if (editKapakFotoFile) {
                        progressContainer.textContent = 'Kapak fotoğrafı yükleniyor...';
                        const kapakPath = `urunler/kapak/${Date.now()}_${editKapakFotoFile.name}`;
                        kapakURL = await uploadFotoToStorage(editKapakFotoFile, kapakPath, (progress) => {
                            progressContainer.textContent = `Kapak fotoğrafı yükleniyor... ${Math.round(progress)}%`;
                        });
                        
                        // Eski kapak fotoğrafını sil (eğer varsa)
                        if (editMevcutKapakURL) {
                            try {
                                const oldKapakRef = firebase.storage().refFromURL(editMevcutKapakURL);
                                await oldKapakRef.delete();
                            } catch (err) {
                                console.warn('Eski kapak fotoğrafı silinemedi:', err);
                            }
                        }
                    }
                    
                    // Yeni galeri fotoğraflarını yükle
                    const yeniGaleriURLs = [...editMevcutGaleriURLs.filter(url => !editSilinecekGaleriURLs.includes(url))];
                    if (editGaleriFotoFiles.length > 0) {
                        for (let i = 0; i < editGaleriFotoFiles.length; i++) {
                            const foto = editGaleriFotoFiles[i];
                            const galeriPath = `urunler/galeri/${Date.now()}_${i}_${foto.file.name}`;
                            progressContainer.textContent = `Galeri fotoğrafları yükleniyor... (${i + 1}/${editGaleriFotoFiles.length})`;
                            
                            const fotoURL = await uploadFotoToStorage(foto.file, galeriPath, (progress) => {
                                progressContainer.textContent = `Galeri fotoğrafları yükleniyor... (${i + 1}/${editGaleriFotoFiles.length}) - ${Math.round(progress)}%`;
                            });
                            
                            yeniGaleriURLs.push(fotoURL);
                        }
                    }
                    
                    // Silinecek galeri fotoğraflarını Storage'dan sil
                    for (const url of editSilinecekGaleriURLs) {
                        try {
                            const fotoRef = firebase.storage().refFromURL(url);
                            await fotoRef.delete();
                        } catch (err) {
                            console.warn('Galeri fotoğrafı silinemedi:', err);
                        }
                    }
                    
                    // Ürünü güncelle
                    progressContainer.textContent = 'Ürün kaydediliyor...';
                    const updateData = {
                        baslik: editBaslik.value.trim(),
                        aciklama: editAciklama.value.trim(),
                        fiyat: editFiyat.value.trim(),
                        sira: parseInt(editSira.value) || 1,
                        aktif: editAktif.checked,
                        kapak: kapakURL,
                        galeri: yeniGaleriURLs
                    };
                    
                    if (document.getElementById('editLink')) {
                        const linkValue = document.getElementById('editLink').value.trim();
                        updateData.link = linkValue || null;
                    }
                    
                    await db.collection('urunler').doc(id).update(updateData);
                    
                    progressContainer.textContent = '✅ Ürün başarıyla güncellendi!';
                    progressContainer.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                    progressContainer.style.color = 'white';
                    
                    setTimeout(() => {
                        closeEditModal();
                        loadAdminUrunler();
                    }, 1500);
                } catch (error) {
                    console.error('Güncelleme hatası:', error);
                    alert('Ürün güncellenirken bir hata oluştu: ' + error.message);
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }
            };
        }

    } catch (error) {
        console.error('Ürün yükleme hatası:', error);
        alert('Ürün yüklenirken bir hata oluştu!');
    }
}

// Düzenleme modal'ını kapat
function closeEditModal() {
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.style.display = 'none';
    }
    
    // Değişkenleri temizle
    editKapakFotoFile = null;
    editGaleriFotoFiles = [];
    editMevcutKapakURL = '';
    editMevcutGaleriURLs = [];
    editSilinecekGaleriURLs = [];
    editUrunId = null;
}

// Düzenleme için kapak fotoğrafı önizleme
function previewEditKapakFoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('editKapakFotoPreview');
            const previewImg = document.getElementById('editKapakFotoPreviewImg');
            if (preview && previewImg) {
                previewImg.src = e.target.result;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(input.files[0]);
        editKapakFotoFile = input.files[0];
    }
}

// Düzenleme için kapak fotoğrafını kaldır
function removeEditKapakFoto() {
    const input = document.getElementById('editKapakFile');
    const preview = document.getElementById('editKapakFotoPreview');
    if (input) input.value = '';
    if (preview) preview.style.display = 'none';
    editKapakFotoFile = null;
    editMevcutKapakURL = ''; // Mevcut fotoğrafı da kaldır
}

// Düzenleme için galeri fotoğrafı ekle
function addEditGaleriFotoFile(input) {
    if (input.files && input.files.length > 0) {
        Array.from(input.files).forEach(file => {
            const fileId = 'edit_galeri_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            editGaleriFotoFiles.push({ id: fileId, file: file });
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewContainer = document.getElementById('editGaleriFotograflarPreview');
                if (previewContainer) {
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'galeri-preview-item';
                    previewDiv.id = fileId;
                    previewDiv.innerHTML = `
                        <img src="${e.target.result}" alt="Yeni galeri fotoğrafı">
                        <button type="button" class="galeri-preview-remove" onclick="removeEditGaleriFotoFile('${fileId}')" title="Fotoğrafı kaldır">×</button>
                    `;
                    previewContainer.appendChild(previewDiv);
                }
            };
            reader.readAsDataURL(file);
        });
    }
}

// Düzenleme için yeni eklenen galeri fotoğrafını kaldır
function removeEditGaleriFotoFile(fileId) {
    editGaleriFotoFiles = editGaleriFotoFiles.filter(f => f.id !== fileId);
    const previewDiv = document.getElementById(fileId);
    if (previewDiv) {
        previewDiv.remove();
    }
}

// Düzenleme için mevcut galeri fotoğrafını kaldır
function removeEditGaleriFoto(url) {
    if (confirm('Bu fotoğrafı kaldırmak istediğinizden emin misiniz?')) {
        // Önizlemeden kaldır
        const previewContainer = document.getElementById('editGaleriFotograflarPreview');
        if (previewContainer) {
            const items = previewContainer.querySelectorAll('.galeri-preview-item');
            items.forEach(item => {
                const img = item.querySelector('img');
                if (img && img.src === url) {
                    item.remove();
                }
            });
        }
        
        // Silinecekler listesine ekle
        if (!editSilinecekGaleriURLs.includes(url)) {
            editSilinecekGaleriURLs.push(url);
        }
        
        // Mevcut listeden çıkar
        editMevcutGaleriURLs = editMevcutGaleriURLs.filter(u => u !== url);
    }
}

// Ürün sil
async function deleteAdminUrun(id) {
    if (confirm('Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
        try {
            await db.collection('urunler').doc(id).delete();
            loadAdminUrunler();
            alert('Ürün başarıyla silindi!');
        } catch (error) {
            console.error('Silme hatası:', error);
            alert('Ürün silinirken bir hata oluştu!');
        }
    }
}

// Global scope'a sipariş fonksiyonlarını ekle
window.loadSiparisler = loadSiparisler;
window.viewSiparisDetay = viewSiparisDetay;
window.closeSiparisDetayModal = closeSiparisDetayModal;
window.filterSiparisler = filterSiparisler;

// Global scope'a düzenleme fotoğraf fonksiyonlarını ekle
window.previewEditKapakFoto = previewEditKapakFoto;
window.removeEditKapakFoto = removeEditKapakFoto;
window.addEditGaleriFotoFile = addEditGaleriFotoFile;
window.removeEditGaleriFotoFile = removeEditGaleriFotoFile;
window.removeEditGaleriFoto = removeEditGaleriFoto;
