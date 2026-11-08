const { neon } = require('@neondatabase/serverless');
const { timingSafeEqual } = require('node:crypto');

function json(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(body);
}

module.exports = async (req,res) => {
  if (!['GET','PATCH'].includes(req.method)) return json(res,405,{error:'Phương thức không được hỗ trợ.'});
  if (req.method==='PATCH') {
    const expected=Buffer.from(process.env.WOTU_PRICE_ADMIN_TOKEN||'');
    const supplied=Buffer.from(String(req.headers.authorization||'').replace(/^Bearer /,''));
    if (!expected.length) return json(res,503,{error:'Chưa cấu hình mã lưu bảng giá trên Vercel.'});
    if (expected.length!==supplied.length || !timingSafeEqual(expected,supplied))
      return json(res,401,{error:'Mã lưu bảng giá không đúng.'});
  }
  try {
    const sql=neon(process.env.DATABASE_URL);
    if (req.method==='GET') {
      const rows=await sql`SELECT prices FROM public.wotu_prices WHERE singleton = true`;
      return json(res,200,{prices:rows[0]?.prices||{}});
    }
    const patch=typeof req.body==='string' ? JSON.parse(req.body) : req.body;
    if (!patch || typeof patch!=='object' || Array.isArray(patch)) return json(res,400,{error:'Bảng giá không hợp lệ.'});
    const fields=Object.entries(patch);
    const validPrice=amount=>Number.isSafeInteger(amount)&&amount>=0&&amount<=1e12;
    const scopes=new Set(['bep','khach','an','bed','tho','bath','laundry','gym','other','any']);
    const units=new Set(['m dài','m²','bộ','cái','góc','chuyến']);
    function validEntry(key,item) {
      if (/^catalog\.[a-z0-9-]{1,90}$/.test(key)) return item && typeof item==='object' &&
        typeof item.name==='string'&&item.name.trim()&&item.name.length<=100&&
        scopes.has(item.scope)&&units.has(item.unit)&&(item.price===null||validPrice(item.price));
      return /^(design|kitchen|living|altar|dining|bedroom|garis)\.[a-z0-9._-]{1,90}$/i.test(key)&&validPrice(item);
    }
    if (!fields.length || fields.length>500 || fields.some(([key,item])=>!validEntry(key,item)))
      return json(res,400,{error:'Mã hạng mục hoặc đơn giá không hợp lệ.'});
    await sql`CREATE TABLE IF NOT EXISTS public.wotu_prices (
      singleton boolean PRIMARY KEY CHECK (singleton),
      prices jsonb NOT NULL DEFAULT '{}'::jsonb
    )`;
    const rows=await sql`INSERT INTO public.wotu_prices (singleton, prices) VALUES (true, ${JSON.stringify(patch)}::jsonb)
      ON CONFLICT (singleton) DO UPDATE SET prices = wotu_prices.prices || EXCLUDED.prices RETURNING prices`;
    return json(res,200,{prices:rows[0].prices});
  } catch(error) {
    if (req.method==='GET' && error.code==='42P01') return json(res,200,{prices:{}});
    if (error instanceof SyntaxError) return json(res,400,{error:'Bảng giá không hợp lệ.'});
    console.error('wotu_prices:',error.code || error.name);
    return json(res,500,{error:'Không thể truy cập bảng giá dùng chung.'});
  }
};
