const { neon } = require('@neondatabase/serverless');
const { timingSafeEqual } = require('node:crypto');

const allowed = new Set([5,10,500000,1000000,2000000,3000000]);
const validCode = /^[A-Z0-9][A-Z0-9-]{2,29}$/;

function json(res,status,body) {
  res.setHeader('Cache-Control','no-store');
  return res.status(status).json(body);
}

module.exports = async (req,res) => {
  if (!['GET','POST'].includes(req.method)) return json(res,405,{error:'Phương thức không được hỗ trợ.'});
  const lookup = req.method==='GET' && req.query?.code!==undefined;
  if (!lookup) {
    const expected=Buffer.from(process.env.WOTU_PRICE_ADMIN_TOKEN||'');
    const supplied=Buffer.from(String(req.headers.authorization||'').replace(/^Bearer /,''));
    if (!expected.length) return json(res,503,{error:'Chưa cấu hình mã lưu Admin trên Vercel.'});
    if (expected.length!==supplied.length || !timingSafeEqual(expected,supplied))
      return json(res,401,{error:'Mã lưu Admin không đúng.'});
  }
  try {
    const sql=neon(process.env.DATABASE_URL);
    if (lookup) {
      const code=String(req.query.code).trim().toUpperCase();
      if (!validCode.test(code)) return json(res,400,{error:'Mã voucher không hợp lệ.'});
      const rows=await sql`SELECT amount FROM public.wotu_vouchers WHERE code = ${code}`;
      if (!rows.length) return json(res,404,{error:'Không tìm thấy mã voucher.'});
      try {
        const used=await sql`SELECT 1 FROM public.wotu_orders WHERE voucher_code = ${code}`;
        if (used.length) return json(res,409,{error:'Mã voucher đã được sử dụng.'});
      } catch(error) {
        if (error.code!=='42P01') throw error;
      }
      return json(res,200,{amount:rows[0].amount});
    }
    if (req.method==='GET') {
      const rows=await sql`SELECT code, amount FROM public.wotu_vouchers ORDER BY code`;
      return json(res,200,{vouchers:Object.fromEntries(rows.map(row=>[row.code,row.amount]))});
    }
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    const code=String(body?.code||'').trim().toUpperCase();
    if (!validCode.test(code)||!allowed.has(body?.amount)) return json(res,400,{error:'Mã hoặc mức ưu đãi không hợp lệ.'});
    await sql`CREATE TABLE IF NOT EXISTS public.wotu_vouchers (
      code text PRIMARY KEY,
      amount integer NOT NULL CHECK (amount IN (5,10,500000,1000000,2000000,3000000))
    )`;
    const rows=await sql`INSERT INTO public.wotu_vouchers (code,amount) VALUES (${code},${body.amount})
      ON CONFLICT (code) DO NOTHING RETURNING code`;
    return rows.length?json(res,201,{code}):json(res,409,{error:'Mã này đã tồn tại.'});
  } catch(error) {
    if (req.method==='GET' && error.code==='42P01') return lookup?json(res,404,{error:'Không tìm thấy mã voucher.'}):json(res,200,{vouchers:{}});
    if (error instanceof SyntaxError) return json(res,400,{error:'Dữ liệu voucher không hợp lệ.'});
    console.error('wotu_vouchers:',error.code||error.name);
    return json(res,500,{error:'Không thể truy cập voucher dùng chung.'});
  }
};
