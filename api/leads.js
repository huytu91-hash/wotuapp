const { neon } = require('@neondatabase/serverless');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

async function sendPrintEmail(data) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'WOTU <onboarding@resend.dev>',
      to: ['huytu91@gmail.com'],
      subject: 'WOTU - Khách hàng vừa in phiếu báo giá',
      html: '<h2>Khách hàng vừa in phiếu báo giá</h2>' +
        '<p><b>Khách hàng:</b> ' + esc(data.fullName) + '</p>' +
        '<p><b>Số điện thoại:</b> ' + esc(data.phone) + '</p>' +
        '<p><b>Địa chỉ:</b> ' + esc(data.address) + '</p>' +
        '<p><b>Mã phiếu:</b> ' + esc(data.code) + '</p>' +
        '<p><b>Loại phiếu:</b> ' + esc(data.kind) + '</p>' +
        '<p><b>Tổng tiền:</b> ' + esc(data.total) + 'đ</p>'
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('[wotu] Resend print email failed:', response.status, detail.slice(0, 500));
    return false;
  }
  return true;
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const adminPhone = String(req.headers['x-admin-phone'] || '');
    const adminPassword = String(req.headers['x-admin-password'] || '');
    if (adminPhone !== '0944437238' || adminPassword !== '04022022') {
      return json(res, 401, { error: 'Thông tin đăng nhập không đúng' });
    }
    try {
      const sql = neon(process.env.DATABASE_URL);
      await sql`CREATE TABLE IF NOT EXISTS public.wotu_customer_events (
        id bigserial PRIMARY KEY,
        event_key text UNIQUE NOT NULL,
        event_type text NOT NULL CHECK (event_type IN ('visit','print','order')),
        full_name text NOT NULL,
        phone text NOT NULL,
        address text NOT NULL,
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        email_sent boolean NOT NULL DEFAULT false
      )`;
      const rows = await sql`
        SELECT l.id, l.full_name, l.phone, l.address, l.interest, l.created_at,
          COALESCE(v.visit_count, 0)::int AS visit_count,
          v.last_visit_at,
          COALESCE(e.events, '[]'::json) AS history
        FROM (
          SELECT DISTINCT ON (phone) id, full_name, phone, address, interest, created_at
          FROM public.quote_leads
          ORDER BY phone, created_at DESC
        ) l
        LEFT JOIN (
          SELECT phone, COUNT(*) FILTER (WHERE event_type='visit') AS visit_count,
            MAX(created_at) FILTER (WHERE event_type='visit') AS last_visit_at
          FROM public.wotu_customer_events GROUP BY phone
        ) v ON v.phone=l.phone
        LEFT JOIN LATERAL (
          SELECT json_agg(json_build_object('type',event_type,'created_at',created_at,'metadata',metadata)
            ORDER BY created_at DESC) AS events
          FROM public.wotu_customer_events WHERE phone=l.phone
        ) e ON true
        ORDER BY COALESCE(v.last_visit_at,l.created_at) DESC
        LIMIT 200
      `;
      return json(res, 200, { leads: rows });
    } catch (error) {
      console.error('[wotu] lead list failed:', error.message);
      return json(res, 500, { error: 'Không thể tải dữ liệu khách hàng' });
    }
  }

  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const fullName = String(body.fullName || '').trim().slice(0, 200);
    const phone = String(body.phone || '').replace(/[\s.\-]/g, '').trim();
    const address = String(body.address || '').trim().slice(0, 500);
    const eventType = String(body.eventType || 'visit');
    const eventKey = String(body.eventKey || '').trim();
    if (!fullName || !phone || !address) return json(res, 400, { error: 'Thiếu thông tin bắt buộc' });
    if (!/^((0|\+84)(3|5|7|8|9)\d{8})$/.test(phone)) return json(res, 400, { error: 'Số điện thoại không hợp lệ' });
    if (!['visit','print'].includes(eventType)) return json(res, 400, { error: 'Loại hoạt động không hợp lệ' });
    if (!/^[a-zA-Z0-9-]{12,80}$/.test(eventKey)) return json(res, 400, { error: 'Mã hoạt động không hợp lệ' });

    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS public.wotu_customer_events (
      id bigserial PRIMARY KEY,
      event_key text UNIQUE NOT NULL,
      event_type text NOT NULL CHECK (event_type IN ('visit','print','order')),
      full_name text NOT NULL,
      phone text NOT NULL,
      address text NOT NULL,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      email_sent boolean NOT NULL DEFAULT false
    )`;

    const prior = await sql`SELECT id FROM public.wotu_customer_events WHERE event_key=${eventKey}`;
    if (prior.length) return json(res, 200, { ok: true, duplicate: true });

    const existing = await sql`SELECT id FROM public.quote_leads WHERE phone=${phone} ORDER BY created_at DESC LIMIT 1`;
    if (existing.length) {
      await sql`UPDATE public.quote_leads SET full_name=${fullName}, address=${address}, interest=${String(body.interest || '').trim().slice(0,4000) || null} WHERE id=${existing[0].id}`;
    } else {
      await sql`INSERT INTO public.quote_leads (full_name, phone, address, interest)
        VALUES (${fullName}, ${phone}, ${address}, ${String(body.interest || '').trim().slice(0,4000) || null})`;
    }

    const metadata = eventType === 'print' ? {
      code: String(body.code || '').slice(0, 160),
      kind: String(body.kind || '').slice(0, 80),
      total: Number.isFinite(Number(body.total)) ? Math.round(Number(body.total)) : null
    } : {};
    const inserted = await sql`
      INSERT INTO public.wotu_customer_events
        (event_key,event_type,full_name,phone,address,metadata)
      VALUES (${eventKey},${eventType},${fullName},${phone},${address},${JSON.stringify(metadata)}::jsonb)
      ON CONFLICT (event_key) DO NOTHING
      RETURNING id
    `;
    if (!inserted.length) return json(res, 200, { ok: true, duplicate: true });

    let emailSent = false;
    if (eventType === 'print') {
      try {
        emailSent = await sendPrintEmail({
          fullName, phone, address, code: metadata.code, kind: metadata.kind, total: metadata.total
        });
        if (emailSent) {
          await sql`UPDATE public.wotu_customer_events SET email_sent=true WHERE id=${inserted[0].id}`;
        }
      } catch (mailError) {
        console.error('[wotu] print notification failed after event save:', mailError.message);
      }
    }
    return json(res, 201, { ok: true, emailSent });
  } catch (error) {
    if (error instanceof SyntaxError) return json(res, 400, { error: 'Dữ liệu không hợp lệ' });
    console.error('[wotu] lead save failed:', error.message);
    return json(res, 500, { error: 'Không thể lưu thông tin lúc này' });
  }
};
