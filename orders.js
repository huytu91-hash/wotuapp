(() => {
  const local=location.protocol==='file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const storageKey='wotu-orders-v1';
  const stored=()=>JSON.parse(localStorage.getItem(storageKey)||'{}');
  let lastAttempt;
  let dialog;

  window.wotuVoucherUsed = code => Object.values(stored()).some(order=>order.receipt.voucher===code);

  function draft() {
    if (!S.c || !['design','interior','done'].includes(S.page)) return null;
    const kind=S.page==='done'?S.last.loai:S.page==='design'?'Thiết kế':'Nội thất';
    const interior=kind==='Nội thất'?lines():[];
    if(interior.some(row=>row[3]?.pending))return null;
    const items=kind==='Thiết kế'?
      [['Gói '+pkgN(),S.dArea+' m²',S.dArea*pkgP()]]:
      interior.map(row=>{
        if(!row[3]?.extraId)return row.slice(0,3);
        const text=document.createElement('textarea');
        text.innerHTML=row[0];
        const title=text.value;
        text.innerHTML=row[1];
        return [title,text.value,row[2]];
      });
    const amount=mon(items.reduce((sum,row)=>sum+row[2],0));
    if (!items.length || (amount.original??amount.s)<=0 || (kind==='Thiết kế' && S.dArea<30)) return null;
    return {
      customer:{fullName:S.c.fullName,phone:S.c.phone,address:S.c.address},
      quote:S.page==='done'?S.last.code:quoteCode(S.c.fullName,new Date()),
      kind,items,subtotal:amount.original??amount.s,voucher:amount.voucher?.code||null,
      discount:amount.discount||0,tax:amount.v,total:amount.t,
    };
  }
  function reference(id) { return 'DH-'+id.toUpperCase().replace(/-/g,'').slice(0,16); }

  async function submit(order) {
    if (local) {
      const save=()=>{
        const orders=stored();
        if (orders[order.id]) return orders[order.id].receipt;
        if (order.voucher && Object.values(orders).some(item=>item.receipt.voucher===order.voucher))
          throw Error('Mã voucher đã được sử dụng.');
        const {quote,kind,subtotal,discount,voucher,tax,total}=order;
        const receipt={reference:reference(order.id),quote,kind,subtotal,discount,voucher,tax,total};
        orders[order.id]={order,receipt};
        localStorage.setItem(storageKey,JSON.stringify(orders));
        return receipt;
      };
      return navigator.locks ? navigator.locks.request('wotu-orders',save) : save();
    }
    const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(order)});
    const result=await response.json();
    if (!response.ok) throw Error(result.error||'Chưa thể đặt hàng.');
    return result.receipt;
  }

  async function ordersApi(method,id,token) {
    const response=await fetch('/api/orders'+(id?'?id='+encodeURIComponent(id):''),{
      method,cache:'no-store',headers:token?{Authorization:'Bearer '+token}:{},
    });
    const result=await response.json();
    if (!response.ok) throw Error(result.error||'Chưa tải được đơn hàng.');
    return result;
  }

  function lookup(id) {
    if (!local) return ordersApi('GET',id);
    const record=stored()[id];
    if (!record) throw Error('Không tìm thấy đơn hàng trên trình duyệt này.');
    return Promise.resolve({receipt:record.receipt,items:record.order.items,confirmedAt:record.confirmedAt||null});
  }

  let poll;
  function ensureDialog() {
    if (dialog) return;
    dialog=document.createElement('dialog');
    dialog.className='checkout-dialog noprint';
    dialog.setAttribute('aria-labelledby','checkout-heading');
    dialog.innerHTML='<div class="checkout-head"><h2 id="checkout-heading"></h2><form method="dialog"><button aria-label="Đóng" type="submit">×</button></form></div><div class="checkout-body"></div>';
    dialog.addEventListener('close',()=>clearInterval(poll));
    document.body.append(dialog);
  }

  function showReceipt(id,receipt,items,confirmedAt=null) {
    ensureDialog();
    clearInterval(poll);
    dialog.querySelector('h2').textContent='Bill đơn hàng và thanh toán';
    const body=dialog.querySelector('.checkout-body');
    body.innerHTML='<p class="checkout-confirmed" role="status"></p><p>Mã đơn hàng <b class="checkout-reference"></b></p>'+
      '<details class="checkout-bill" open><summary>Chi tiết đơn hàng</summary><ul></ul><div class="checkout-breakdown"></div></details>'+
      '<div class="checkout-total"><span>Tổng đơn hàng đã gồm VAT</span><strong></strong></div>'+
      '<div class="checkout-bank"></div><p class="checkout-instructions"></p>'+
      '<button type="button" class="btn btn2 checkout-refresh">Kiểm tra xác nhận</button>'+
      '<a class="btn btn2 checkout-contact">Liên hệ WOTU</a>';
    body.querySelector('.checkout-total strong').textContent=vnd(receipt.total);
    body.querySelector('.checkout-reference').textContent=receipt.reference;
    const bill=body.querySelector('.checkout-bill ul');
    for(const [title,description,amount] of items) {
      const item=document.createElement('li');
      const name=document.createElement('strong');
      const price=document.createElement('b');
      name.textContent=title;
      price.textContent=vnd(amount);
      item.append(name,price);
      bill.append(item);
    }
    const breakdown=body.querySelector('.checkout-breakdown');
    for(const [label,amount] of [['Tạm tính',receipt.subtotal],['Giảm qua voucher',-receipt.discount],['VAT',receipt.tax]]) {
      if(label==='Giảm qua voucher'&&!receipt.discount) continue;
      const row=document.createElement('p');
      row.textContent=label+' · '+vnd(amount);
      breakdown.append(row);
    }
    const deposit=Math.round(receipt.total*(receipt.total<30000000?.5:.4));
    const bank=body.querySelector('.checkout-bank');
    if (deposit>0 && !confirmedAt) {
      bank.innerHTML='<h3>Chuyển khoản đợt đầu</h3><strong class="checkout-deposit"></strong><img class="checkout-qr" alt="Mã VietQR chuyển khoản Techcombank">'+
        '<dl><dt>Ngân hàng</dt><dd></dd><dt>Số tài khoản</dt><dd></dd><dt>Chủ tài khoản</dt><dd></dd><dt>Nội dung chuyển khoản</dt><dd></dd></dl>'+
        '<a class="btn btn2 checkout-download" download="WOTU-VietQR.gif">Lưu mã QR</a>';
      bank.querySelector('.checkout-deposit').textContent=vnd(deposit);
      const values=[wotuBank.name,wotuBank.account,wotuBank.holder,receipt.reference];
      bank.querySelectorAll('dd').forEach((node,index)=>{node.textContent=values[index]});
      const qr=wotuPaymentQr(deposit,receipt.reference);
      bank.querySelector('img').src=qr;
      bank.querySelector('.checkout-download').href=qr;
    }
    body.querySelector('.checkout-confirmed').textContent=confirmedAt?'WOTU đã xác nhận thanh toán.':'Chờ xác nhận';
    body.querySelector('.checkout-confirmed').classList.toggle('is-confirmed',Boolean(confirmedAt));
    body.querySelector('.checkout-instructions').textContent=confirmedAt?'Cảm ơn bạn. WOTU sẽ liên hệ để triển khai đơn hàng.':
      (deposit?'Sau khi chuyển khoản, WOTU sẽ đối soát trong 1–24 giờ làm việc.':'Đơn hàng không cần chuyển khoản đợt đầu. WOTU sẽ xác nhận trong 1–24 giờ làm việc.');
    if (local && !confirmedAt) body.querySelector('.checkout-confirmed').append(' · Bill xem thử');
    body.querySelector('.checkout-contact').href='tel:'+PHONE;
    const check=body.querySelector('.checkout-refresh');
    if (confirmedAt) check.remove();
    else {
      const refresh=async (showError=false)=>{
        try {
          const status=await lookup(id);
          if (status.confirmedAt && dialog.open && body.contains(check))
            showReceipt(id,status.receipt,status.items,status.confirmedAt);
          else if (showError && body.contains(check)) body.querySelector('.checkout-confirmed').textContent='Chờ xác nhận · chưa có cập nhật';
        } catch(error) {
          if (showError && body.contains(check)) body.querySelector('.checkout-confirmed').textContent=error.message;
        }
      };
      check.addEventListener('click',()=>refresh(true));
      poll=setInterval(()=>refresh(),20000);
    }
    if (!dialog.open) dialog.showModal();
  }

  function showCheckout() {
    if (!wotuPricesReady()) {
      ensureDialog();
      dialog.querySelector('h2').textContent='Chưa tải được bảng giá';
      dialog.querySelector('.checkout-body').textContent='Hãy tải lại trang để lấy bảng giá mới nhất trước khi đặt hàng.';
      if (!dialog.open) dialog.showModal();
      return;
    }
    const order=draft();
    if (!order) return;
    const key=JSON.stringify(order);
    if (!lastAttempt || lastAttempt.key!==key) lastAttempt={key,id:crypto.randomUUID(),receipt:null};
    const attempt=lastAttempt;
    ensureDialog();
    if (attempt.receipt) { lookup(attempt.id).then(status=>showReceipt(attempt.id,status.receipt,status.items,status.confirmedAt)).catch(()=>showReceipt(attempt.id,attempt.receipt,order.items)); return; }
    else {
      dialog.querySelector('h2').textContent='Xác nhận đặt hàng';
      const body=dialog.querySelector('.checkout-body');
      body.innerHTML='<p>Kiểm tra tổng thanh toán trước khi gửi đơn cho WOTU.</p>'+
        '<div class="checkout-total"><span>Đã gồm VAT và ưu đãi</span><strong></strong></div>'+
        '<button type="button" class="btn checkout-submit">Xác nhận đặt hàng</button><p class="checkout-status" role="status"></p>';
      body.querySelector('strong').textContent=vnd(order.total);
      const button=body.querySelector('button');
      const status=body.querySelector('.checkout-status');
      button.addEventListener('click',async()=>{
        button.disabled=true;
        status.textContent='Đang ghi nhận đơn hàng…';
        try {
          attempt.receipt=await submit({...order,id:attempt.id});
          history.replaceState(null,'','#don='+attempt.id);
          showReceipt(attempt.id,attempt.receipt,order.items);
        } catch(error) { status.textContent=error.message; }
        finally { button.disabled=false; }
      });
    }
    if (!dialog.open) dialog.showModal();
  }

  window.decorateQuoteActions = function (fragment) {
    const print=fragment.querySelector('button[onclick^="pdf("]');
    if (!print) return;
    const actions=document.createElement('div');
    actions.className='quote-actions noprint';
    print.before(actions);
    actions.append(print);
    print.classList.add('btn2');
    if (!fragment.querySelector('.quote-pending')) actions.insertAdjacentHTML('beforeend','<button type="button" class="btn" data-place-order>Đặt hàng</button>');
  };
  g('app').addEventListener('click',event=>{
    if (event.target.closest('[data-place-order]')) showCheckout();
  });
  function mountOrdersAdmin() {
    const panel=document.querySelector('.admin-panel');
    if (!S.admin || !panel) return;
    const section=document.createElement('section');
    section.className='voucher-admin';
    section.innerHTML='<h2>Đơn hàng và thanh toán</h2>'+
      (local?'':'<label>Mã lưu Admin<input type="password" autocomplete="off"></label>')+
      '<button class="btn btn2" type="button">Tải đơn hàng</button><p role="status"></p><div class="order-admin-list"></div>';
    const status=section.querySelector('[role=status]');
    const list=section.querySelector('.order-admin-list');
    const token=()=>section.querySelector('input')?.value;
    const load=async()=>{
      try {
        const rows=local?Object.entries(stored()).reverse().map(([id,data])=>({id,details:{
          receipt:data.receipt,customer:data.order.customer,confirmedAt:data.confirmedAt,
        }})):(await ordersApi('GET',null,token())).orders;
        list.replaceChildren();
        status.textContent=rows.length?rows.length+' đơn hàng':'Chưa có đơn hàng.';
        for(const {id,details} of rows) {
          const row=document.createElement('div');
          const info=document.createElement('p');
          const total=details.receipt.total;
          const deposit=Math.round(total*(total<30000000?.5:.4));
          info.textContent=details.receipt.reference+' · '+details.customer.fullName+' · '+details.customer.phone+
            ' · Đợt đầu '+vnd(deposit)+' · '+(details.confirmedAt?'Đã xác nhận':'Chờ xác nhận');
          row.append(info);
          if(!details.confirmedAt) {
            const button=document.createElement('button');
            button.type='button';button.className='btn';button.textContent='Xác nhận đã đối soát';
            button.addEventListener('click',async()=>{
              if(!confirm('Xác nhận đã đối soát đơn '+details.receipt.reference+'?'))return;
              button.disabled=true;
              try {
                if(local) {
                  const orders=stored();
                  orders[id].confirmedAt=new Date().toISOString();
                  localStorage.setItem(storageKey,JSON.stringify(orders));
                } else await ordersApi('PATCH',id,token());
                await load();
              } catch(error) { status.textContent=error.message;button.disabled=false; }
            });
            row.append(button);
          }
          list.append(row);
        }
      } catch(error) { status.textContent=error.message; }
    };
    section.querySelector('button').addEventListener('click',load);
    panel.querySelector('.admin-settings').before(section);
    if(local) load();
  }
  const baseDraw=draw;
  draw=function(){baseDraw();mountOrdersAdmin();};
  const saved=location.hash.match(/^#don=([0-9a-f-]{36})$/i)?.[1];
  if(saved) lookup(saved).then(status=>showReceipt(saved,status.receipt,status.items,status.confirmedAt)).catch(()=>{});
  const reset=resetC;
  resetC=function(){lastAttempt=null;if(location.hash.startsWith("#don="))history.replaceState(null,"",location.href.split("#")[0]);reset();};
})();
