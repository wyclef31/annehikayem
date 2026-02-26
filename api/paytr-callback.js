import crypto from 'crypto';

export default function handler(req, res) {
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
      // Env eksik olsa bile PayTR'e OK dönelim ki tekrar tekrar denemesin
      console.error('PayTR callback: env eksik');
      res.send('OK');
      return;
    }

    const {
      merchant_oid,
      status,
      total_amount,
      hash,
      failed_reason_code,
      test_mode
    } = req.body || {};

    // Loglama (mevcut mantığı koru)
    console.log('PayTR callback geldi:', {
      merchant_oid,
      status,
      total_amount,
      failed_reason_code,
      test_mode,
      timestamp: new Date().toISOString()
    });

    // Hash doğrulama (standart akış)
    if (hash) {
      const hashStr =
        merchant_id +
        merchant_oid +
        merchant_salt +
        status +
        total_amount;

      const calculated = crypto
        .createHmac('sha256', merchant_key)
        .update(hashStr)
        .digest('base64');

      if (calculated !== hash) {
        console.error('PayTR callback hash doğrulama hatası:', {
          merchant_oid,
          received: hash.substring(0, 16) + '...',
          calculated: calculated.substring(0, 16) + '...'
        });
        // Buna rağmen PayTR'e OK dönüyoruz (dokümanların önerdiği gibi)
      } else {
        console.log('PayTR callback hash doğrulandı:', merchant_oid);
      }
    }

    // TODO: Burada sipariş durumunu güncelle / veritabanına kaydet

    res.send('OK');
  } catch (e) {
    console.error('PayTR callback handler error:', e);
    // Hata olsa bile PayTR'e OK dönmeliyiz
    res.send('OK');
  }
}

