import crypto from 'crypto';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res
      .status(405)
      .json({ ok: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const merchant_id = process.env.PAYTR_MERCHANT_ID;
    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    if (!merchant_id || !merchant_key || !merchant_salt) {
      return res.status(500).json({
        ok: false,
        error:
          'PayTR env bilgileri eksik. PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT kontrol edin.'
      });
    }

    const {
      email,
      payment_amount, // KURUŞ (örn 19990)
      user_name,
      user_address,
      user_phone,
      basket_items // [["Ürün", "19990", 1], ...] veya object array
    } = req.body || {};

    if (!email || !payment_amount || !user_name || !user_address || !user_phone) {
      return res.status(400).json({
        ok: false,
        error:
          'Eksik alan var (email, payment_amount, user_name, user_address, user_phone).'
      });
    }

    // Benzersiz sipariş ID (sadece alfanumerik)
    const merchant_oid =
      'OID' +
      Date.now() +
      Math.random().toString(36).substr(2, 9).toUpperCase();

    // Kullanıcı IP'si (Vercel ortamı için)
    const userIpHeader =
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      '';
    const user_ip = userIpHeader.toString().split(',')[0].trim() || '127.0.0.1';

    const test_mode = process.env.PAYTR_TEST_MODE === 'true' ? '1' : '0';
    const currency = 'TL';
    const no_installment = '0';
    const max_installment = '0';

    // Sepet içeriğini normalize et (payment-backend/server.js ile aynı mantık)
    const normalizedBasket =
      Array.isArray(basket_items) && basket_items.length
        ? basket_items.map((it) => {
            // Eğer zaten ["ad","fiyat",adet] formatındaysa dokunma
            if (Array.isArray(it)) return it;

            // Object geliyorsa dönüştür
            const name = String(it.name || it.title || 'Urun');
            const price = String(it.price || it.amount || payment_amount);
            const qty = Number(it.qty || it.quantity || 1);
            return [name, price, qty];
          })
        : [['Siparis', String(payment_amount), 1]];

    const user_basket = Buffer.from(
      JSON.stringify(normalizedBasket)
    ).toString('base64');

    const site_url = process.env.SITE_URL || '';
    const merchant_ok_url = `${site_url}/payment-success.html`;
    const merchant_fail_url = `${site_url}/payment-failure.html`;

    // PayTR hash (standart akış - orijinal mantık)
    const hashStr =
      merchant_id +
      user_ip +
      merchant_oid +
      email +
      String(payment_amount) +
      user_basket +
      no_installment +
      max_installment +
      currency +
      test_mode +
      merchant_salt;

    const paytr_token = crypto
      .createHmac('sha256', merchant_key)
      .update(hashStr)
      .digest('base64');

    const postData = {
      merchant_id,
      user_ip,
      merchant_oid,
      email,
      payment_amount: String(payment_amount),
      paytr_token,
      user_basket,
      debug_on: '1',
      no_installment,
      max_installment,
      user_name,
      user_address,
      user_phone,
      merchant_ok_url,
      merchant_fail_url,
      timeout_limit: '30',
      currency,
      test_mode,
      lang: 'tr'
    };

    const r = await axios.post(
      'https://www.paytr.com/odeme/api/get-token',
      new URLSearchParams(postData).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    if (r.data?.status !== 'success') {
      return res.status(400).json({
        ok: false,
        error: r.data?.reason || 'PayTR token alınamadı',
        raw: r.data
      });
    }

    return res.status(200).json({
      ok: true,
      token: r.data.token,
      merchant_oid
    });
  } catch (e) {
    console.error('PayTR token handler error:', e);
    return res.status(500).json({
      ok: false,
      error: e?.message || 'Server error'
    });
  }
}

