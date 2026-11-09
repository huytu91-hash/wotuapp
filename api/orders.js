const { neon } = require('@neondatabase/serverless');
const { timingSafeEqual } = require('node:crypto');

const voucherCode = /^[A-Z0-9][A-Z0-9-]{2,29}$/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(res,status,body) {
  res.setHeader('Cache-Control','no-store');
  return res.status(status).json(body);
}

module.exports = async (req,res) => {
  if (req.method==='GET' || req.method==='PATCH') {
    const id=req.query?.id;
    const customerLookup=req.method==='GET' && id!==undefined;
    if (id!==undefined && (typeof id!=='string'||!uuid.test(id))) return json(res,400,{error:'Mã đơn hàng không hợp lệ.'});
    if (!customerLookup) {
      const expected=Buffer.from(process.env.WOTU_PRICE_ADMIN_TOKEN||'');
      const actual=Buffer.from(String(req.headers.authorization||'').replace(/^Bearer /,''));
      if (!expected.length || actual.length!==expected.length || !timingSafeEqual(expected,actual))
        return json(res,401,{error:'Mã lưu Admin không đúng.'});
    }
    try {
      const sql=neon(process.env.DATABASE_URL);
      if (req.method==='PATCH') {
        if (!id) return json(res,400,{error:'Thiếu mã đơn hàng.'});
        const rows=await sql`UPDATE public.wotu_orders SET details=jsonb_set(details,'{confirmedAt}',to_jsonb(now()),true)
          WHERE id=${id}::uuid AND NOT (details ? 'confirmedAt') RETURNING details`;
        if (rows.length) {
          const details=rows[0].details||{};
          const customer=details.customer||{};
          let emailSent=false;
          try {
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
            const event=await sql`INSERT INTO public.wotu_customer_events
              (event_key,event_type,full_name,phone,address,metadata)
              VALUES (${'order-'+id},'order',${String(customer.fullName||'Khách hàng')},${String(customer.phone||'')},
                ${String(customer.address||'')},${JSON.stringify({reference:details.receipt?.reference||'',total:details.receipt?.total||0})}::jsonb)
              ON CONFLICT (event_key) DO NOTHING RETURNING id`;
            if(event.length && process.env.RESEND_API_KEY) {
              const esc=value=>String(value??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
              const mail=await fetch('https://api.resend.com/emails',{
                method:'POST',
                headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},
                body:JSON.stringify({
                  from:'WOTU <onboarding@resend.dev>',
                  to:['huytu91@gmail.com'],
                  subject:'WOTU - Khách hàng vừa xác nhận đơn hàng',
                  html:'<h2>Khách hàng vừa xác nhận đơn hàng</h2>'+
                    '<p><b>Khách hàng:</b> '+esc(customer.fullName)+'</p>'+
                    '<p><b>Số điện thoại:</b> '+esc(customer.phone)+'</p>'+
                    '<p><b>Địa chỉ:</b> '+esc(customer.address)+'</p>'+
                    '<p><b>Mã đơn:</b> '+esc(details.receipt?.reference||id)+'</p>'+
                    '<p><b>Loại:</b> '+esc(details.receipt?.kind||'')+'</p>'+
                    '<p><b>Tổng tiền:</b> '+esc(details.receipt?.total||0)+'đ</p>'
                })
              });
              if(mail.ok) {
                emailSent=true;
                await sql`UPDATE public.wotu_customer_events SET email_sent=true WHERE id=${event[0].id}`;
              } else {
                console.error('WOTU order email failed:',mail.status,(await mail.text().catch(()=>'' )).slice(0,400));
              }
            }
          } catch(mailError) {
            console.error('WOTU order notification failed:',mailError.message);
          }
          return json(res,200,{confirmedAt:details.confirmedAt,emailSent});
        }
      }
      if (id) {
        const rows=await sql`SELECT details FROM public.wotu_orders WHERE id=${id}::uuid`;
        if (!rows.length) return json(res,404,{error:'Không tìm thấy đơn hàng.'});
        const {receipt,items,confirmedAt}=rows[0].details;
        return json(res,200,{receipt,items,confirmedAt:confirmedAt||null});
      }
      const rows=await sql`SELECT id,details FROM public.wotu_orders ORDER BY created_at DESC LIMIT 100`;
      return json(res,200,{orders:rows});
    } catch(error) {
      if (error.code==='42P01') return id ? json(res,404,{error:'Không tìm thấy đơn hàng.'}) : json(res,200,{orders:[]});
      console.error('wotu_orders:',error.code||error.name);
      return json(res,500,{error:'Chưa tải được trạng thái đơn hàng.'});
    }
  }
  if (req.method!=='POST') return json(res,405,{error:'Phương thức không được hỗ trợ.'});
  try {
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    const { id, customer, quote, kind, subtotal, voucher, items }=body||{};
    if (!uuid.test(id)||typeof quote!=='string'||quote.length>300||!['Thiết kế','Nội thất'].includes(kind)||
        !Number.isSafeInteger(subtotal)||subtotal<=0||subtotal>1e12||
        (voucher!==null && (typeof voucher!=='string'||!voucherCode.test(voucher)))||
        !customer||typeof customer.fullName!=='string'||!customer.fullName.trim()||customer.fullName.length>200||
        !/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(customer.phone)||
        typeof customer.address!=='string'||!customer.address.trim()||customer.address.length>500||
        !Array.isArray(items)||!items.length||items.length>150||
        items.some(item=>!Array.isArray(item)||item.length!==3||typeof item[0]!=='string'||typeof item[1]!=='string'||
          item[0].length>300||item[1].length>1800||!Number.isFinite(item[2])||item[2]<0)||
        Math.round(items.reduce((sum,item)=>sum+item[2],0))!==subtotal)
      return json(res,400,{error:'Thông tin đặt hàng không hợp lệ.'});
    const sql=neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS public.wotu_orders (
      id uuid PRIMARY KEY,
      voucher_code text UNIQUE,
      details jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    const prior=await sql`SELECT details FROM public.wotu_orders WHERE id = ${id}::uuid`;
    if (prior.length) return json(res,200,{receipt:prior[0].details.receipt});
    let discount=0;
    if (voucher) {
      const rows=await sql`SELECT amount FROM public.wotu_vouchers WHERE code = ${voucher}`;
      if (!rows.length) return json(res,404,{error:'Không tìm thấy mã voucher.'});
      const amount=rows[0].amount;
      discount=Math.min(subtotal,amount<=10?Math.round(subtotal*amount/100):amount);
    }
    const net=subtotal-discount;
    const receipt={reference:'DH-'+id.toUpperCase().replace(/-/g,'').slice(0,16),quote,kind,subtotal,discount,voucher,
      tax:Math.round(net*.08),total:net+Math.round(net*.08)};
    const rows=await sql`INSERT INTO public.wotu_orders (id,voucher_code,details)
      VALUES (${id}::uuid,${voucher},${JSON.stringify({customer,items,receipt})}::jsonb)
      ON CONFLICT DO NOTHING RETURNING details`;
    if (rows.length) return json(res,201,{receipt:rows[0].details.receipt});
    const retry=await sql`SELECT details FROM public.wotu_orders WHERE id = ${id}::uuid`;
    if (retry.length) return json(res,200,{receipt:retry[0].details.receipt});
    return json(res,409,{error:'Mã voucher đã được dùng cho đơn hàng khác.'});
  } catch(error) {
    if (error instanceof SyntaxError) return json(res,400,{error:'Thông tin đặt hàng không hợp lệ.'});
    if (error.code==='42P01') return json(res,404,{error:'Không tìm thấy mã voucher.'});
    console.error('wotu_orders:',error.code||error.name);
    return json(res,500,{error:'Chưa thể ghi nhận đơn hàng. Bạn có thể thử lại.'});
  }
};
