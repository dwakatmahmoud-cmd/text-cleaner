// يتحقق من مفتاح الترخيص لدى Lemon Squeezy ويُرجع { valid: true/false } فقط.
// المتغير LS_PRODUCT_ID يُضبط من إعدادات Netlify، ويمنع قبول مفاتيح منتجات أخرى.

const reply = (code, obj) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(obj)
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { valid: false });

  let key = '';
  try { key = String(JSON.parse(event.body || '{}').key || '').trim(); } catch {}
  if (!key || key.length > 100) return reply(400, { valid: false });

  try {
    const r = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ license_key: key })
    });
    const d = await r.json();

    const status = d?.license_key?.status;
    const mine = String(d?.meta?.product_id) === String(process.env.LS_PRODUCT_ID);
    const live = status === 'active' || status === 'inactive';

    return reply(200, { valid: d.valid === true && live && mine });
  } catch {
    return reply(502, { valid: false });
  }
};
