const { neon } = require('@neondatabase/serverless')

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    const fullName = String(body.fullName || '').trim()
    const phone = String(body.phone || '').trim()
    const address = String(body.address || '').trim()
    const interest = String(body.interest || '').trim().slice(0, 4000)

    if (!fullName || !phone || !address) return json(res, 400, { error: 'Thiếu thông tin bắt buộc' })
    if (!/^((0|\+84)(3|5|7|8|9)\d{8})$/.test(phone)) return json(res, 400, { error: 'Số điện thoại không hợp lệ' })

    const sql = neon(process.env.DATABASE_URL)
    const rows = await sql`
      INSERT INTO public.quote_leads (full_name, phone, address, interest)
      VALUES (${fullName}, ${phone}, ${address}, ${interest || null})
      RETURNING id
    `
    return json(res, 201, { ok: true, id: rows[0].id })
  } catch (error) {
    console.error('[v0] lead save failed:', error.message)
    return json(res, 500, { error: 'Không thể lưu thông tin lúc này' })
  }
}
