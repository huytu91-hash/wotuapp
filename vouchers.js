(() => {
  const offers = new Map([[5,'Giảm 5%'],[10,'Giảm 10%'],[500000,'Giảm 500.000đ'],
    [1000000,'Giảm 1.000.000đ'],[2000000,'Giảm 2.000.000đ'],[3000000,'Giảm 3.000.000đ']]);
  const local = location.protocol==='file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const storageKey = 'wotu-vouchers-v1';
  const validCode = /^[A-Z0-9][A-Z0-9-]{2,29}$/;
  const active = new Map();
  const current = () => S.page==='done' ? (S.last.loai==='Thiết kế'?'design':'interior') : S.page;
  const clean = raw => raw.trim().toUpperCase();
  function stored() { return JSON.parse(localStorage.getItem(storageKey)||'{}'); }
  async function api(method,code,token,amount) {
    const response=await fetch('/api/vouchers'+(code&&method==='GET'?'?code='+encodeURIComponent(code):''),{
      method,cache:'no-store',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
      ...(method==='POST'?{body:JSON.stringify({code,amount})}:{}),
    });
    const result=await response.json();
    if (!response.ok) throw Error(result.error||'Không truy cập được voucher.');
    return result;
  }

  const baseMon = mon;
  mon = function (subtotal) {
    const base = baseMon(subtotal);
    const voucher = active.get(current());
    if (!voucher) return base;
    const discount = Math.min(base.s,voucher.amount<=10?Math.round(base.s*voucher.amount/100):voucher.amount);
    return {...baseMon(base.s-discount),original:base.s,discount,voucher};
  };
  window.voucherFields = function (m) {
    if (S.page==='done') return '';
    return '<form class="voucher-form noprint"><label>Ưu đãi / Chiết khấu<input id="voucher-code" name="code" placeholder="Nhập mã voucher" maxlength="30" autocomplete="off" value="'+
      (m.voucher?.code||'')+'"></label><div><button type="submit" class="btn btn2">Áp dụng</button>'+
      (m.voucher?'<button type="button" class="btn btn2" data-voucher-remove>Bỏ mã</button>':'')+
      '</div><p class="voucher-message" role="status">'+(m.voucher?'Đã áp dụng '+offers.get(m.voucher.amount)+'.':'')+'</p></form>';
  };
  g('app').addEventListener('submit',async event=>{
    const form=event.target;
    if (!form.matches('.voucher-form')) return;
    event.preventDefault();
    const code=clean(form.elements.code.value);
    const message=form.querySelector('.voucher-message');
    if (!validCode.test(code)) { message.textContent='Nhập mã voucher hợp lệ.'; return; }
    const mode=current();
    const button=form.querySelector('button[type=submit]');
    button.disabled=true;
    try {
      if (local && wotuVoucherUsed(code)) throw Error('Mã voucher đã được sử dụng.');
      const amount=local?stored()[code]:(await api('GET',code)).amount;
      if (!offers.has(amount)) throw Error('Không tìm thấy mã voucher.');
      if (current()!==mode || !form.isConnected) return;
      active.set(mode,{code,amount});
      refreshQuote();
      g('voucher-code')?.focus({preventScroll:true});
    } catch(error) { message.textContent=error.message; }
    finally { button.disabled=false; }
  });
  g('app').addEventListener('click',event=>{
    if (!event.target.closest('[data-voucher-remove]')) return;
    active.delete(current());
    refreshQuote();
    g('voucher-code')?.focus({preventScroll:true});
  });

  function adminList(list,items) {
    list.replaceChildren();
    for (const [code,amount] of Object.entries(items)) {
      const row=document.createElement('li');
      row.textContent=code+' · '+offers.get(amount);
      list.append(row);
    }
  }
  function mountAdmin() {
    const panel=document.querySelector('.admin-panel');
    if (!S.admin || !panel || panel.querySelector('.voucher-admin')) return;
    const section=document.createElement('section');
    section.className='voucher-admin';
    section.innerHTML='<h2>Voucher báo giá</h2><p class="muted">Mỗi mã áp dụng một mức giảm trước VAT.</p>'+
      '<form><div class="grid"><label>Mã voucher<input name="code" placeholder="Ví dụ WOTU5" maxlength="30" required></label>'+
      '<label>Mức ưu đãi<select name="amount">'+[...offers].map(([amount,label])=>'<option value="'+amount+'">'+label+'</option>').join('')+
      '</select></label></div>'+(local?'':'<label>Mã lưu Admin<input name="token" type="password" autocomplete="off" required></label>')+
      '<button class="btn" type="submit">Tạo mã voucher</button>'+
      (local?'':'<button class="btn btn2" type="button" data-voucher-list>Xem mã đã tạo</button>')+
      '</form><p class="voucher-message" role="status"></p><ul class="voucher-list"></ul>';
    const form=section.querySelector('form');
    const message=section.querySelector('.voucher-message');
    const list=section.querySelector('.voucher-list');
    if (local) adminList(list,stored());
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const code=clean(form.elements.code.value);
      const amount=Number(form.elements.amount.value);
      if (!validCode.test(code)||!offers.has(amount)) { message.textContent='Mã cần từ 3 đến 30 ký tự, dùng chữ, số hoặc dấu gạch ngang.';return; }
      const button=form.querySelector('button[type=submit]');
      button.disabled=true;
      try {
        if (local) {
          const items=stored();
          if (Object.hasOwn(items,code)) throw Error('Mã này đã tồn tại.');
          items[code]=amount;
          localStorage.setItem(storageKey,JSON.stringify(items));
          adminList(list,items);
        } else {
          await api('POST',code,form.elements.token.value,amount);
          adminList(list,(await api('GET','',form.elements.token.value)).vouchers);
        }
        message.textContent='Đã tạo mã '+code+'.';
        form.elements.code.value='';
      } catch(error) { message.textContent=error.message; }
      finally { button.disabled=false; }
    });
    form.querySelector('[data-voucher-list]')?.addEventListener('click',async ()=>{
      try {
        const result=await api('GET','',form.elements.token.value);
        adminList(list,result.vouchers);
        message.textContent='Đã tải danh sách voucher.';
      } catch(error) { message.textContent=error.message; }
    });
    panel.querySelector('.admin-settings').before(section);
  }
  const baseDraw=draw;
  draw=function(){baseDraw();mountAdmin();};
  const baseReset=resetC;
  resetC=function(){active.clear();baseReset();};
})();
