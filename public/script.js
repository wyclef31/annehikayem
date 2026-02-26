// Admin panel access check
function checkAdminAccess() {
    if (window.location.hash === '#admin') {
        window.location.href = 'admin.html';
    }
}

// Check on page load
checkAdminAccess();

// Check on hash change
window.addEventListener('hashchange', checkAdminAccess);

// Smooth scroll for navigation links (skip #admin)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#admin') {
            // Let the hash change event handle it
            return;
        }
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll effect to navbar
let lastScroll = 0;
const header = document.querySelector('header');

if (header) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        } else {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
        
        lastScroll = currentScroll;
    });
}

// Scroll Animation Observer
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

// Fade in from bottom animation
const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('animate-in');
            }, index * 100);
            fadeInObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Slide in from left animation
const slideLeftObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            slideLeftObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Slide in from right animation
const slideRightObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            slideRightObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Section titles - fade in from bottom
    document.querySelectorAll('.section-title').forEach(title => {
        title.classList.add('fade-in-up');
        fadeInObserver.observe(title);
    });

    // Intro section content
    const introContent = document.querySelector('.intro-content');
    if (introContent) {
        introContent.classList.add('fade-in-up');
        fadeInObserver.observe(introContent);
    }

    // Topic cards - fade in from bottom with stagger
    document.querySelectorAll('.topic-card').forEach((card, index) => {
        card.classList.add('fade-in-up');
        fadeInObserver.observe(card);
    });

    // Abonelik widget toggle
    const abonelikToggle = document.getElementById('abonelikToggle');
    const abonelikPanel = document.getElementById('abonelikPanel');
    const abonelikClose = document.getElementById('abonelikClose');

    if (abonelikToggle && abonelikPanel) {
        abonelikToggle.addEventListener('click', function() {
            abonelikPanel.classList.toggle('active');
        });
    }

    if (abonelikClose && abonelikPanel) {
        abonelikClose.addEventListener('click', function() {
            abonelikPanel.classList.remove('active');
        });
    }

    // Close panel when clicking outside
    if (abonelikPanel) {
        document.addEventListener('click', function(e) {
            if (abonelikPanel.classList.contains('active') && 
                !abonelikPanel.contains(e.target) && 
                !abonelikToggle.contains(e.target)) {
                abonelikPanel.classList.remove('active');
            }
        });
    }

    // Contact section
    const contactInfo = document.querySelector('.contact-info');
    if (contactInfo) {
        contactInfo.classList.add('fade-in-up');
        fadeInObserver.observe(contactInfo);
    }

    const contactMethods = document.querySelectorAll('.contact-method');
    contactMethods.forEach((method, index) => {
        method.classList.add('fade-in-up');
        fadeInObserver.observe(method);
    });

    // Sections - fade in
    document.querySelectorAll('section').forEach(section => {
        if (!section.classList.contains('hero')) {
            section.classList.add('fade-in-section');
            fadeInObserver.observe(section);
        }
    });

    // Load products - wait a bit for Firebase to be ready
    setTimeout(() => {
        loadProducts();
    }, 500);

    // Abonelik form submission
    const abonelikForm = document.querySelector('.abonelik-form');
    if (abonelikForm) {
        abonelikForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Abonelik formu submit edildi');
            
            const name = this.querySelector('input[type="text"]').value.trim();
            const email = this.querySelector('input[type="email"]').value.trim();
            
            console.log('Form verileri:', { name, email });
            
            if (!name || !email) {
                alert('Lütfen ad ve e-posta alanlarını doldurun!');
                return;
            }

            // Firebase kontrolü
            if (typeof firebase === 'undefined') {
                alert('Firebase yüklenmemiş. Lütfen sayfayı yenileyin.');
                return;
            }

            if (typeof db === 'undefined' || !db) {
                alert('Firebase bağlantısı kurulamadı. Lütfen sayfayı yenileyin.');
                return;
            }
            
            const submitButton = this.querySelector('button[type="submit"]');
            if (!submitButton) {
                console.error('Submit butonu bulunamadı!');
                return;
            }
            
            const originalButtonText = submitButton.textContent;
            
            // Butonu devre dışı bırak ve yükleniyor mesajı göster
            submitButton.disabled = true;
            submitButton.textContent = 'Kaydediliyor...';
            
            try {
                console.log('Firestore\'a kaydediliyor...');
                
                // Timeout ekle (30 saniye)
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error('İşlem çok uzun sürdü. Lütfen tekrar deneyin.'));
                    }, 30000);
                });
                
                // Firebase Firestore'a kaydet
                const abonelikData = {
                    name: name,
                    email: email.toLowerCase(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    date: new Date().toLocaleString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                };
                
                console.log('Abonelik verisi:', abonelikData);
                
                // Aynı email kontrolü (timeout ile)
                console.log('E-posta kontrolü yapılıyor...');
                const emailQueryPromise = db.collection('abonelikler')
                    .where('email', '==', email.toLowerCase())
                    .get();
                
                const emailQuery = await Promise.race([emailQueryPromise, timeoutPromise]);
                console.log('E-posta sorgusu sonucu:', emailQuery.size, 'kayıt bulundu');
                
                if (!emailQuery.empty) {
                    alert('Bu e-posta adresi zaten kayıtlı!');
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                    return;
                }
                
                // Firestore'a ekle (timeout ile)
                console.log('Firestore\'a ekleniyor...');
                const addPromise = db.collection('abonelikler').add(abonelikData);
                const docRef = await Promise.race([addPromise, timeoutPromise]);
                console.log('✅ Abonelik başarıyla eklendi! ID:', docRef.id);
                
                // Başarı mesajı
                submitButton.textContent = '✅ Kaydedildi!';
                submitButton.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                
                // 2 saniye sonra formu kapat
                setTimeout(() => {
                    alert('Teşekkürler! Abonelik\'e başarıyla kaydoldunuz.\nAdmin panelinde görüntülenebilir.');
                    this.reset();
                    if (abonelikPanel) {
                        abonelikPanel.classList.remove('active');
                    }
                    // Butonu eski haline döndür
                    submitButton.style.background = '';
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }, 2000);
                
            } catch (error) {
                console.error('❌ Abonelik kayıt hatası:', error);
                console.error('Hata detayları:', error.code, error.message);
                
                let errorMessage = 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
                
                if (error.code === 'permission-denied') {
                    errorMessage = 'Yetkilendirme hatası. Firestore kurallarını kontrol edin.';
                } else if (error.code === 'unavailable') {
                    errorMessage = 'Firebase servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
                } else if (error.message) {
                    errorMessage = 'Hata: ' + error.message;
                }
                
                alert(errorMessage);
            } finally {
                // Butonu tekrar aktif et
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    } else {
        console.warn('Abonelik formu bulunamadı!');
    }
});

// Load products from Firebase
async function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    
    if (!productsGrid) {
        console.error('productsGrid elementi bulunamadı');
        return;
    }

    // Check if Firebase is initialized
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK yüklenmemiş');
        productsGrid.innerHTML = `
            <div class="products-empty">
                <div class="products-empty-icon">❌</div>
                <p>Firebase SDK yüklenmemiş</p>
            </div>
        `;
        return;
    }

    if (typeof db === 'undefined' || !db) {
        console.error('Firebase db tanımlı değil, tekrar deneniyor...');
        // Try to wait and retry
        setTimeout(() => {
            if (typeof db !== 'undefined' && db) {
                loadProducts();
            } else {
                productsGrid.innerHTML = `
                    <div class="products-empty">
                        <div class="products-empty-icon">❌</div>
                        <p>Firebase bağlantısı kurulamadı. Lütfen sayfayı yenileyin.</p>
                    </div>
                `;
            }
        }, 1000);
        return;
    }

    // Show loading state
    productsGrid.innerHTML = `
        <div class="products-loading">
            <div class="loading-spinner"></div>
            <p>Ürünler yükleniyor...</p>
        </div>
    `;

    try {
        // Get all products from Firestore (get all, filter later)
        console.log('Firestore\'dan ürünler çekiliyor...');
        const snapshot = await db.collection('urunler').get();
        
        console.log('Toplam doküman sayısı:', snapshot.size);

        const products = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            console.log('Ürün verisi:', doc.id, data);
            
            // Add all products (aktif olmayanları da ekle)
            const aktifDurumu = data.aktif !== false; // aktif field yoksa veya true ise aktif kabul et
            products.push({
                ...data,
                id: doc.id,
                sira: data.sira || 999, // Default sira for sorting
                aktif: aktifDurumu
            });
        });

        // Sort by sira
        products.sort((a, b) => (a.sira || 999) - (b.sira || 999));

        console.log('İşlenen ürün sayısı:', products.length);
        if (products.length > 0) {
            console.log('Ürünler:', products);
            console.log('Ürün detayları:', products.map(p => ({ id: p.id, baslik: p.baslik, aktif: p.aktif })));
        } else {
            console.warn('Hiç ürün bulunamadı. Firestore\'da urunler koleksiyonunu kontrol edin.');
        }

        // Clear grid
        productsGrid.innerHTML = '';

        if (products.length === 0) {
            productsGrid.innerHTML = `
                <div class="products-empty">
                    <div class="products-empty-icon">📦</div>
                    <p>Henüz ürün bulunmuyor</p>
                    <p style="font-size: 0.9rem; color: #999; margin-top: 15px;">
                        Ürün eklemek için admin paneline giriş yapın ve "Test Ürünü Ekle" butonunu kullanın.
                    </p>
                </div>
            `;
            return;
        }

        // Display products
        products.forEach((product, index) => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card fade-in-up';
            
            // Kapak fotoğrafı - ürün adındaki dosya adı
            const kapakFoto = product.kapak || product.resim || '';
            // Galeri fotoğrafları - array olarak
            const galeriFoto = product.galeri || [];
            
            // Tüm fotoğrafları birleştir (kapak + galeri)
            const tumFotograflar = [];
            if (kapakFoto) tumFotograflar.push(kapakFoto);
            if (Array.isArray(galeriFoto)) {
                galeriFoto.forEach(foto => {
                    if (foto && !tumFotograflar.includes(foto)) {
                        tumFotograflar.push(foto);
                    }
                });
            }
            
            productCard.innerHTML = `
                <div class="product-image" ${tumFotograflar.length > 0 ? `data-photos='${JSON.stringify(tumFotograflar)}'` : ''} ${tumFotograflar.length > 0 ? 'style="cursor: pointer;"' : ''} onclick="window.location.href='product-detail.html?id=${product.id}'">
                    ${kapakFoto ? `<img src="${kapakFoto}" alt="${escapeHtml(product.baslik || 'Ürün')}">` : '📦'}
                </div>
                <div class="product-content" onclick="window.location.href='product-detail.html?id=${product.id}'" style="cursor: pointer;">
                    <h3 class="product-title">${escapeHtml(product.baslik || 'Ürün')}</h3>
                    <div class="product-footer">
                        <div class="product-price-container">
                            ${product.fiyat ? `<span class="product-price">${escapeHtml(product.fiyat)} ₺</span>` : ''}
                            ${product.fiyat ? `<span class="product-kdv-text">KDV dahildir</span>` : ''}
                        </div>
                        ${product.aktif === false ? `<a href="admin.html#admin" class="product-button" style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);" onclick="event.stopPropagation();">Düzenle</a>` : `<button class="product-button" onclick="event.stopPropagation(); addToCart('${product.id}', '${escapeHtml(product.baslik || 'Ürün')}', '${escapeHtml(product.fiyat || '0')}', '${escapeHtml(product.kapak || '')}')">Sepete Ekle</button>`}
                    </div>
                </div>
            `;
            productsGrid.appendChild(productCard);
            
            // Ürün kartına tıklanınca detay sayfasına git (fotoğraf galerisi yerine)
            // Fotoğraf galerisi artık detay sayfasında olacak
            
            // Animate in
            setTimeout(() => {
                fadeInObserver.observe(productCard);
            }, index * 100);
        });
    } catch (error) {
        console.error('Ürün yükleme hatası:', error);
        console.error('Hata detayları:', error.message, error.code);
        productsGrid.innerHTML = `
            <div class="products-empty">
                <div class="products-empty-icon">❌</div>
                <p>Ürünler yüklenirken bir hata oluştu</p>
                <p style="font-size: 0.9rem; color: #999; margin-top: 10px;">${error.message || 'Bilinmeyen hata'}</p>
            </div>
        `;
    }
}

// HTML escape function
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

// Sepet Fonksiyonları
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    renderCart();
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function addToCart(productId, productName, productPrice, productImage) {
    // Escape HTML'den gelen değerleri temizle
    const name = productName.replace(/&#039;/g, "'").replace(/&quot;/g, '"');
    const price = productPrice.replace(/&#039;/g, "'").replace(/&quot;/g, '"');
    const image = productImage.replace(/&#039;/g, "'").replace(/&quot;/g, '"');
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }
    
    saveCart();
    
    // Başarı mesajı
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '✓ Eklendi!';
    button.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
    }, 1500);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
}

function renderCart() {
    const cartContent = document.getElementById('cartContent');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartContent) return;
    
    if (cart.length === 0) {
        cartContent.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <p>Sepetiniz boş</p>
            </div>
        `;
        if (cartFooter) cartFooter.style.display = 'none';
        return;
    }
    
    let total = 0;
    let html = '';
    
    cart.forEach(item => {
        const priceNum = parseFloat(item.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        const itemTotal = priceNum * item.quantity;
        total += itemTotal;
        
        html += `
            <div class="cart-item">
                ${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.name)}" class="cart-item-image">` : '<div class="cart-item-image" style="background: var(--very-light-purple); display: flex; align-items: center; justify-content: center; color: var(--medium-purple);">📦</div>'}
                <div class="cart-item-info">
                    <div class="cart-item-title">${escapeHtml(item.name)}</div>
                    <div class="cart-item-price">${escapeHtml(item.price)} ₺ x ${item.quantity}</div>
                    <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">Kaldır</button>
                </div>
            </div>
        `;
    });
    
    cartContent.innerHTML = html;
    
    if (cartFooter) {
        cartFooter.style.display = 'block';
        if (cartTotal) {
            cartTotal.textContent = total.toFixed(2) + ' ₺';
        }
    }
}

function toggleCart() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.classList.toggle('active');
        if (cartModal.classList.contains('active')) {
            renderCart();
        }
    }
}

/**
 * Sepette fiziksel ürün var mı kontrol et
 * Ürün adına göre kontrol ediyoruz: "takvim" içeren ürünler fiziksel
 * Production'da bu bilgi ürün veritabanından gelecek
 */
function hasPhysicalProducts() {
    return cart.some(item => {
        const productName = item.name.toLowerCase();
        // Takvim içeren ürünler fiziksel kabul ediliyor
        return productName.includes('takvim');
    });
}

function checkout() {
    if (cart.length === 0) {
        alert('Sepetiniz boş!');
        return;
    }
    
    // Sepet modal'ını kapat
    toggleCart();
    
    // Kargo bilgileri modal'ını aç
    openShippingModal();
}

function openShippingModal() {
    const shippingModal = document.getElementById('shippingModal');
    if (shippingModal) {
        shippingModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Fiziksel ürün kontrolü - fiziksel ürün yoksa kargo alanlarını opsiyonel yap
        const requiresShipping = hasPhysicalProducts();
        updateShippingFormFields(requiresShipping);
        
        // Daha önce kaydedilmiş bilgiler varsa yükle
        loadSavedShippingInfo();
    }
}

/**
 * Fiziksel ürün durumuna göre kargo form alanlarını güncelle
 */
function updateShippingFormFields(requiresShipping) {
    // Modal başlığını güncelle
    const modalTitle = document.getElementById('shippingModalTitle');
    if (modalTitle) {
        modalTitle.textContent = requiresShipping ? 'Kargo Bilgileri' : 'İletişim Bilgileri';
    }
    
    const shippingFields = ['city', 'district', 'address'];
    
    shippingFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        const label = field ? field.previousElementSibling : null;
        
        if (field && label) {
            if (requiresShipping) {
                field.required = true;
                // Label'daki * işaretini kontrol et
                if (!label.textContent.includes('*')) {
                    label.innerHTML = label.textContent.trim() + ' <span style="color: red;">*</span>';
                }
            } else {
                field.required = false;
                // Label'dan * işaretini kaldır
                label.innerHTML = label.textContent.replace(/\*/g, '').trim();
            }
        }
    });
}

function closeShippingModal() {
    const shippingModal = document.getElementById('shippingModal');
    if (shippingModal) {
        shippingModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function loadSavedShippingInfo() {
    const savedInfo = localStorage.getItem('shippingInfo');
    if (savedInfo) {
        try {
            const info = JSON.parse(savedInfo);
            document.getElementById('firstName').value = info.firstName || '';
            document.getElementById('lastName').value = info.lastName || '';
            document.getElementById('phone').value = info.phone || '';
            document.getElementById('email').value = info.email || '';
            document.getElementById('city').value = info.city || '';
            document.getElementById('district').value = info.district || '';
            document.getElementById('address').value = info.address || '';
            document.getElementById('postalCode').value = info.postalCode || '';
        } catch (e) {
            console.error('Kaydedilmiş kargo bilgileri yüklenirken hata:', e);
        }
    }
}

function saveShippingInfo(formData) {
    const shippingInfo = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        city: formData.get('city'),
        district: formData.get('district'),
        address: formData.get('address'),
        postalCode: formData.get('postalCode')
    };
    localStorage.setItem('shippingInfo', JSON.stringify(shippingInfo));
    return shippingInfo;
}

// Sayfa yüklendiğinde sepet badge'ini güncelle
document.addEventListener('DOMContentLoaded', function() {
    updateCartBadge();
    
    // Telefon numarası formatlama
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.length <= 3) {
                    value = value;
                } else if (value.length <= 6) {
                    value = value.slice(0, 3) + ' ' + value.slice(3);
                } else if (value.length <= 8) {
                    value = value.slice(0, 3) + ' ' + value.slice(3, 6) + ' ' + value.slice(6);
                } else {
                    value = value.slice(0, 3) + ' ' + value.slice(3, 6) + ' ' + value.slice(6, 8) + ' ' + value.slice(8, 10);
                }
                e.target.value = value;
            }
        });
    }
    
    // Kargo bilgileri formu submit işlemi
    const shippingForm = document.getElementById('shippingForm');
    if (shippingForm) {
        shippingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            // Mesafeli Satış ve KVKK checkbox kontrolleri
            const mesafeliSatis = document.getElementById('mesafeliSatis');
            const kvkk = document.getElementById('kvkk');
            
            if (!mesafeliSatis || !mesafeliSatis.checked) {
                alert('Lütfen Mesafeli Satış Sözleşmesi\'ni onaylayın!');
                mesafeliSatis.focus();
                return;
            }
            
            if (!kvkk || !kvkk.checked) {
                alert('Lütfen KVKK Aydınlatma Metni\'ni onaylayın!');
                kvkk.focus();
                return;
            }
            
            // Fiziksel ürün kontrolü - fiziksel ürün varsa kargo alanları zorunlu
            const requiresShipping = hasPhysicalProducts();
            const requiredFields = ['firstName', 'lastName', 'phone'];
            
            // Fiziksel ürün varsa kargo alanlarını da zorunlu yap
            if (requiresShipping) {
                requiredFields.push('city', 'district', 'address');
            }
            
            // Form validasyonu
            let isValid = true;
            let missingFields = [];
            
            requiredFields.forEach(field => {
                const fieldElement = document.getElementById(field);
                const value = formData.get(field);
                
                if (!value || value.trim() === '' || (fieldElement && fieldElement.required && !value.trim())) {
                    isValid = false;
                    missingFields.push(field);
                }
            });
            
            if (!isValid) {
                alert('Lütfen tüm zorunlu alanları doldurun!' + (requiresShipping ? '\n(Kargo bilgileri fiziksel ürünler için zorunludur.)' : ''));
                return;
            }
            
            // Telefon numarası validasyonu
            const phone = formData.get('phone').replace(/\s/g, '');
            if (phone.length < 10 || !/^[0-9]+$/.test(phone)) {
                alert('Lütfen geçerli bir telefon numarası girin!');
                return;
            }
            
            // Bilgileri kaydet
            const shippingInfo = saveShippingInfo(formData);
            
            // Modal'ı kapat
            closeShippingModal();
            
            // Ödeme işlemine geç
            proceedToPayment(shippingInfo, requiresShipping);
        });
    }
});

/**
 * Ödeme sayfasına yönlendir
 * @param {Object} shippingInfo - Kargo bilgileri
 * @param {Boolean} requiresShipping - Fiziksel ürün var mı?
 */
function proceedToPayment(shippingInfo, requiresShipping) {
    // Kargo bilgileri ve sepet bilgilerini birleştir
    const orderData = {
        shipping: shippingInfo,
        cart: cart,
        total: calculateTotal(),
        requiresShipping: requiresShipping || false,
        timestamp: new Date().toISOString()
    };
    
    // Sipariş bilgilerini localStorage'a kaydet (geçici olarak)
    localStorage.setItem('currentOrder', JSON.stringify(orderData));
    
    // İyzico entegrasyonu için hazırlık
    console.log('Sipariş bilgileri:', orderData);
    
    // Ödeme sayfasına yönlendir - orderData'yı URL parametresi olarak gönder
    const orderDataEncoded = encodeURIComponent(JSON.stringify(orderData));
    window.location.href = `payment.html?orderData=${orderDataEncoded}`;
}

function calculateTotal() {
    let total = 0;
    cart.forEach(item => {
        const priceNum = parseFloat(item.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        total += priceNum * item.quantity;
    });
    return total;
}

// Mobil menü toggle
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('active');
    }
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.remove('active');
    }
}

// Mobil menü toggle butonunu göster/gizle
function updateMobileMenuVisibility() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (window.innerWidth <= 768) {
        if (mobileMenuToggle) mobileMenuToggle.style.display = 'block';
    } else {
        if (mobileMenuToggle) mobileMenuToggle.style.display = 'none';
        closeMobileMenu();
    }
}

// Sayfa yüklendiğinde ve resize'da kontrol et
window.addEventListener('resize', updateMobileMenuVisibility);
document.addEventListener('DOMContentLoaded', updateMobileMenuVisibility);

// Global scope'a ekle
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.checkout = checkout;
window.closeShippingModal = closeShippingModal;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;

// Photo Gallery Functions
let currentPhotoGallery = [];
let currentPhotoIndex = 0;

function openPhotoGallery(photos) {
    if (!photos || photos.length === 0) return;
    
    currentPhotoGallery = photos;
    currentPhotoIndex = 0;
    
    const lightbox = document.getElementById('photoLightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCurrent = document.getElementById('lightboxCurrent');
    const lightboxTotal = document.getElementById('lightboxTotal');
    
    if (lightbox && lightboxImage) {
        lightboxImage.src = photos[0];
        lightboxCurrent.textContent = '1';
        lightboxTotal.textContent = photos.length;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closePhotoGallery() {
    const lightbox = document.getElementById('photoLightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function showPhoto(index) {
    if (currentPhotoGallery.length === 0) return;
    
    if (index < 0) index = currentPhotoGallery.length - 1;
    if (index >= currentPhotoGallery.length) index = 0;
    
    currentPhotoIndex = index;
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCurrent = document.getElementById('lightboxCurrent');
    
    if (lightboxImage) {
        lightboxImage.src = currentPhotoGallery[index];
        lightboxCurrent.textContent = (index + 1).toString();
    }
}

function nextPhoto() {
    showPhoto(currentPhotoIndex + 1);
}

function prevPhoto() {
    showPhoto(currentPhotoIndex - 1);
}

// Initialize photo gallery event listeners
document.addEventListener('DOMContentLoaded', function() {
    const lightbox = document.getElementById('photoLightbox');
    const lightboxOverlay = document.getElementById('lightboxOverlay');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightboxPrev = document.getElementById('lightboxPrev');
    
    if (lightboxOverlay) {
        lightboxOverlay.addEventListener('click', closePhotoGallery);
    }
    
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closePhotoGallery);
    }
    
    if (lightboxNext) {
        lightboxNext.addEventListener('click', function(e) {
            e.stopPropagation();
            nextPhoto();
        });
    }
    
    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', function(e) {
            e.stopPropagation();
            prevPhoto();
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (!lightbox || !lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') {
            closePhotoGallery();
        } else if (e.key === 'ArrowRight') {
            nextPhoto();
        } else if (e.key === 'ArrowLeft') {
            prevPhoto();
        }
    });
});
