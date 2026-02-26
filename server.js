require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PayTR yapılandırması
const paytrConfig = {
    merchantId: process.env.PAYTR_MERCHANT_ID,
    merchantKey: process.env.PAYTR_MERCHANT_KEY,
    merchantSalt: process.env.PAYTR_MERCHANT_SALT,
    siteUrl: process.env.SITE_URL || 'https://annemhikayem-38c31.web.app'
};

// PayTR hash oluşturma fonksiyonu
function createPaytrHash(data) {
    const hashString = Object.keys(data)
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join('&');
    return crypto.createHmac('sha256', paytrConfig.merchantSalt)
        .update(hashString)
        .digest('base64');
}

/**
 * POST /paytr/get-token
 * PayTR get-token API'sine istek atıp token döndürür
 * 
 * Body:
 * - email: Müşteri e-posta adresi
 * - payment_amount: Ödeme tutarı (kuruş cinsinden)
 * - user_name: Müşteri adı
 * - user_address: Müşteri adresi
 * - user_phone: Müşteri telefonu
 * - basket_items: Sepet öğeleri array'i
 */
app.post('/paytr/get-token', async (req, res) => {
    try {
        const { email, payment_amount, user_name, user_address, user_phone, basket_items } = req.body;

        // Validasyon
        if (!email || !payment_amount || !user_name || !user_address || !user_phone || !basket_items) {
            return res.status(400).json({
                ok: false,
                error: 'Eksik parametreler: email, payment_amount, user_name, user_address, user_phone, basket_items gereklidir'
            });
        }

        if (!Array.isArray(basket_items) || basket_items.length === 0) {
            return res.status(400).json({
                ok: false,
                error: 'basket_items bir array olmalı ve en az bir öğe içermelidir'
            });
        }

        // PayTR için gerekli bilgileri kontrol et
        if (!paytrConfig.merchantId || !paytrConfig.merchantKey || !paytrConfig.merchantSalt) {
            return res.status(500).json({
                ok: false,
                error: 'PayTR yapılandırması eksik. PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY ve PAYTR_MERCHANT_SALT environment variable\'ları ayarlanmalıdır.'
            });
        }

        // Benzersiz sipariş ID oluştur (sadece alfanumerik)
        const merchantOid = 'OID' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();

        // Sepet öğelerini formatla (PayTR formatına uygun)
        const basketItemsFormatted = basket_items.map((item, index) => {
            // Price değerini parse et (kuruş cinsinden olmalı)
            let priceValue = 0;
            if (typeof item.price === 'string') {
                // String ise parse et - zaten kuruş cinsinden olmalı
                // Ondalık nokta varsa kaldır (örn: "65000.00" -> 65000)
                priceValue = Math.round(parseFloat(item.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0);
            } else if (typeof item.price === 'number') {
                priceValue = Math.round(item.price);
            }
            
            // PayTR: price kuruş cinsinden integer string olmalı (ondalık nokta olmadan)
            return {
                name: (item.name || `Ürün ${index + 1}`).substring(0, 127),
                price: priceValue.toString() // Kuruş cinsinden integer string (örn: "65000")
            };
        });

        // User IP (request'ten al veya varsayılan)
        const userIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';

        // PayTR ödeme isteği verileri
        const paytrData = {
            merchant_id: paytrConfig.merchantId,
            user_ip: userIp.split(',')[0].trim(), // İlk IP'yi al (proxy durumunda)
            merchant_oid: merchantOid,
            email: email,
            payment_amount: Math.round(parseFloat(payment_amount)).toString(), // Kuruş cinsinden, string olmalı
            paytr_token: '',
            user_basket: Buffer.from(JSON.stringify(basketItemsFormatted)).toString('base64'),
            debug_on: process.env.PAYTR_TEST_MODE === 'true' ? '1' : '0',
            no_installment: '0',
            max_installment: '0',
            user_name: user_name,
            user_address: user_address.substring(0, 200), // PayTR limiti
            user_phone: user_phone.replace(/\s/g, ''), // Boşlukları temizle
            merchant_ok_url: `${paytrConfig.siteUrl}/payment-success.html`,
            merchant_fail_url: `${paytrConfig.siteUrl}/payment-failure.html`,
            timeout_limit: '30',
            currency: 'TL',
            lang: 'tr'
        };

        // Hash oluştur
        paytrData.paytr_token = createPaytrHash(paytrData);

        // PayTR API'ye istek gönder
        try {
            const response = await axios.post('https://www.paytr.com/odeme/api/get-token', 
                new URLSearchParams(paytrData),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            const result = response.data;

            if (result.status === 'success') {
                // Başarılı - token döndür
                res.json({
                    ok: true,
                    token: result.token,
                    merchant_oid: merchantOid
                });
            } else {
                // PayTR hatası
                console.error('PayTR get-token hatası:', result.reason);
                res.status(400).json({
                    ok: false,
                    error: result.reason || 'PayTR token oluşturulamadı'
                });
            }
        } catch (axiosError) {
            console.error('PayTR API istek hatası:', axiosError.message);
            if (axiosError.response && axiosError.response.data) {
                res.status(400).json({
                    ok: false,
                    error: axiosError.response.data.reason || axiosError.response.data.error || 'PayTR API hatası'
                });
            } else {
                res.status(500).json({
                    ok: false,
                    error: 'PayTR sunucusuna bağlanılamadı: ' + axiosError.message
                });
            }
        }

    } catch (error) {
        console.error('PayTR get-token sunucu hatası:', error);
        res.status(500).json({
            ok: false,
            error: 'Sunucu hatası: ' + error.message
        });
    }
});

/**
 * POST /paytr/callback
 * PayTR bildirimlerini alır ve işler
 */
app.post('/paytr/callback', async (req, res) => {
    try {
        // PayTR callback'leri application/x-www-form-urlencoded formatında gelir
        const {
            merchant_oid,
            status,
            total_amount,
            hash,
            failed_reason_code,
            test_mode
        } = req.body;

        // Loglama
        console.log('PayTR Callback alındı:', {
            merchant_oid,
            status,
            total_amount,
            hash: hash ? hash.substring(0, 20) + '...' : 'yok',
            failed_reason_code,
            test_mode,
            timestamp: new Date().toISOString()
        });

        // Hash doğrulama (opsiyonel ama önerilir)
        if (hash && paytrConfig.merchantKey) {
            const hashString = `${paytrConfig.merchantId}${merchant_oid}${paytrConfig.merchantSalt}${status}${total_amount}`;
            const calculatedHash = crypto.createHmac('sha256', paytrConfig.merchantKey)
                .update(hashString)
                .digest('base64');

            if (calculatedHash !== hash) {
                console.error('PayTR callback hash doğrulama hatası:', {
                    merchant_oid,
                    received: hash.substring(0, 20) + '...',
                    calculated: calculatedHash.substring(0, 20) + '...'
                });
                // Hash hatalı olsa bile PayTR'e OK dönmeliyiz (duplicate callback'i önlemek için)
            } else {
                console.log('PayTR callback hash doğrulandı:', merchant_oid);
            }
        }

        // Burada sipariş durumunu güncelleyebilirsiniz
        // Örnek: Firebase Firestore'a kaydet, veritabanına yaz, email gönder vb.
        
        // PayTR'e her zaman "OK" dönmeliyiz (duplicate callback'i önlemek için)
        res.send('OK');

    } catch (error) {
        console.error('PayTR callback hatası:', error);
        // Hata olsa bile PayTR'e OK dönmeliyiz
        res.send('OK');
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        paytrConfigured: !!(paytrConfig.merchantId && paytrConfig.merchantKey && paytrConfig.merchantSalt)
    });
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
    console.log(`📝 PayTR: ${paytrConfig.merchantId ? '✓ Yapılandırıldı' : '✗ Yapılandırılmadı'}`);
});
