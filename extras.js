(() => {
  const roomNames={bep:'Phòng bếp',khach:'Phòng khách',an:'Phòng ăn',master:'Phòng ngủ master',
    n2:'Phòng ngủ 2',n3:'Phòng ngủ 3',tho:'Phòng thờ',n4:'Phòng ngủ 4',bath:'Phòng tắm',
    laundry:'Khu giặt',gym:'Phòng Gym',other:'Phát sinh'};
  const scopes={bep:'Bếp',khach:'Phòng khách',an:'Phòng ăn',bed:'Phòng ngủ',tho:'Phòng thờ',
    bath:'Phòng tắm',laundry:'Khu giặt',gym:'Phòng Gym',other:'Phát sinh',any:'Mọi khu vực'};
  const units=['m dài','m²','bộ','cái','góc','chuyến'];
  const defaults=[
    ['island-kimsa','Mặt đá bàn đảo · Kim sa','bep','m dài'],
    ['island-lamar','Mặt đá bàn đảo · Lamar','bep','m dài'],
    ['island-su','Mặt đá bàn đảo · Đá sứ','bep','m dài'],
    ['glass-upper','Phụ thu cánh kính tủ trên','bep','m²'],['rice','Thùng gạo','bep','bộ'],
    ['blum','Tay nâng Blum','bep','bộ'],['island-table','Bàn ăn kết hợp đảo bếp','bep','bộ'],
    ['stairs','Tủ gầm cầu thang','khach','m²'],['bamboo-wall','Vách than tre sau TV','khach','m²'],
    ['sofa-wall','Ốp vách sau sofa','khach','m²'],
    ['study','Bàn học','bed','m dài'],['desk','Bàn làm việc','bed','m dài'],
    ['bookcase','Tủ sách','bed','m²'],['mirror','Gương bàn trang điểm','bed','cái'],
    ['stool','Đôn bàn trang điểm','bed','cái'],['head-wall','Ốp vách đầu giường','bed','m²'],
    ['wardrobe-custom','Tủ quần áo bổ sung','bed','m²'],['bed-custom','Giường bổ sung','bed','cái'],
    ['wall','Ốp vách trơn','any','m²'],['slats','Ốp lam sóng','any','m²'],['trim','Nẹp nhôm hoặc inox','any','m dài'],
    ['led','Hệ LED','any','m dài'],['sensor','Cảm biến LED','any','bộ'],
    ['glass','Phụ thu cánh kính','any','m²'],['curve','Phụ thu bo cong','any','góc'],
    ['floor','Sàn gỗ','any','m²'],['skirting','Len chân tường','any','m dài'],
    ['vanity','Combo tủ lavabo','bath','bộ'],['washer','Tủ máy giặt','laundry','m²'],
    ['washer-shelf','Kệ trên máy giặt','laundry','m dài'],
    ['gym-closed','Tủ vật dụng có cánh','gym','m²'],['gym-open','Tủ vật dụng không cánh','gym','m²'],
    ['altar','Bàn thờ','tho','bộ'],['altar-wall','Vách CNC phòng thờ','tho','m²'],['altar-ceiling','Trần CNC phòng thờ','tho','m²'],
    ['shipping','Vận chuyển xa','other','chuyến'],['gift','Quà tặng','any','cái',0],
  ].map(([id,name,scope,unit,price=null])=>({id,name,scope,unit,price}));
  const bedroom=new Set(['master','n2','n3','n4']);
  const extras=new Map();
  const addedRooms=new Map();
  const opened=new Set();
  let serial=0;
  const baseLines=lines;
  const esc=text=>String(text).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
  function catalog() {
    const catalog=new Map(defaults.map(item=>[item.id,item]));
    for (const [key,item] of Object.entries(wotuPriceConfig())) {
      if (key.startsWith('catalog.') && item && typeof item==='object') {
        const id=key.slice(8);
        catalog.set(id,{...item,id});
      }
    }
    return catalog;
  }
  const roomLabel=room=>addedRooms.get(room)?.label||roomNames[room]||'Khu vực khác';
  const isActive=room=>addedRooms.has(room)||S.rooms[room];
  const allowed=(item,room)=>{
    const kind=addedRooms.get(room)?.kind||room;
    return item.scope==='any'||item.scope===kind||(item.scope==='bed'&&bedroom.has(kind));
  };
  window.extraRoomLabel=roomLabel;
  window.isWotuExtraAreaActive=room=>addedRooms.has(room);
  lines=function(){
    const items=baseLines();
    const definitions=catalog();
    for (const [room,rows] of extras) {
      if (!isActive(room)) continue;
      for (const row of rows) {
        const item=definitions.get(row.item);
        if (!item||!(row.qty>0)||!Number.isFinite(row.qty)) continue;
        const description=[row.qty.toLocaleString('vi-VN')+' '+item.unit,row.dimensions.trim(),row.note.trim()].filter(Boolean).join(' · ');
        items.push([esc(item.name),esc(description),item.price===null?0:Math.round(row.qty*item.price),
          {room,extraId:row.id,parentId:row.parent,pending:item.price===null,asset:row.item.startsWith('island-')?'stone':null}]);
      }
    }
    return items;
  };

  function baseRoom(title) {
    if (/ master$/.test(title)) return 'master';
    if (/ 2$/.test(title)) return 'n2';
    if (/ 3$/.test(title)) return 'n3';
    if (/^(Tủ bếp|Đảo bếp|Tủ kịch trần|Khung tủ lạnh|Mặt đá|Ốp đứng bếp|Đèn LED bếp|Thùng nhựa bồn rửa|Combo bồn rửa)/.test(title)) return 'bep';
    if (/^(Kệ tivi|Tủ giày|Ốp vách trang trí phòng khách)/.test(title)) return 'khach';
    if (/^(Tủ rượu|Tủ trang trí|Bàn ăn)/.test(title)) return 'an';
    if (/^Ốp vách phòng thờ/.test(title)) return 'tho';
    return '';
  }

  function choice(select,label,value) {
    const option=document.createElement('option');
    option.textContent=label;option.value=value;
    select.append(option);
  }
  function updateParents(container,room,rows,definitions) {
    const base=baseLines().filter(item=>!item[3]&&baseRoom(item[0])===room);
    for (const select of container.querySelectorAll('[data-extra="parent"]')) {
      const row=rows.find(row=>row.id===select.closest('[data-extra-row]').dataset.extraRow);
      select.replaceChildren();
      choice(select,'Món chính độc lập','');
      for (const item of base) choice(select,item[0],'base:'+item[0]);
      if (!rows.some(candidate=>candidate.parent==='extra:'+row.id)) {
        for (const candidate of rows) {
          if(candidate!==row&&!candidate.parent&&candidate.qty>0)
            choice(select,definitions.get(candidate.item)?.name||'Hạng mục','extra:'+candidate.id);
        }
      }
      if (row.parent && ![...select.options].some(option=>option.value===row.parent)) {
        choice(select,'Món chính đã chọn',row.parent);
      }
      select.value=row.parent;
    }
  }

  window.mountWotuExtras=function(anchor,room) {
    const root=document.createElement('details');
    root.className='kitchen-option extra-config noprint';
    const rows=extras.get(room)||[];
    extras.set(room,rows);
    root.open=opened.has(room);
    root.innerHTML='<summary><span><b>Hạng mục bổ sung</b><small>Thêm món chính hoặc phụ thu theo công trình</small></span><span class="kitchen-chevron" aria-hidden="true"></span></summary>'+
      '<div class="extra-panel"><div class="extra-rows"></div><button class="btn btn2" type="button" data-extra-add>Thêm hạng mục</button></div>';
    const container=root.querySelector('.extra-rows');
    const definitions=catalog();
    const available=[...definitions.values()].filter(item=>allowed(item,room));
    function render() {
      container.replaceChildren();
      for (const row of rows) {
        const item=definitions.get(row.item);
        const fieldset=document.createElement('fieldset');
        fieldset.dataset.extraRow=row.id;
        fieldset.innerHTML='<legend></legend><label>Tên hạng mục<select data-extra="item"></select></label>'+
          '<div class="grid"><label><span class="extra-unit"></span><input type="number" min="0" step="any" data-extra="qty"></label>'+
          '<label>Kích thước<input data-extra="dimensions" maxlength="100" placeholder="D × R × C (mm)"></label></div>'+
          '<label>Gắn dưới món chính<select data-extra="parent"></select></label>'+
          '<label>Quy cách / Ghi chú<input data-extra="note" maxlength="240" placeholder="Ví dụ MDF Melamine, bo cong"></label>'+
          '<div class="extra-foot"><small></small><button type="button" data-extra-remove>Xóa món</button></div>';
        fieldset.querySelector('legend').textContent='Món '+(rows.indexOf(row)+1);
        const picker=fieldset.querySelector('[data-extra="item"]');
        available.forEach(option=>choice(picker,option.name,option.id));
        picker.value=row.item;
        fieldset.querySelector('.extra-unit').textContent='Khối lượng ('+item.unit+')';
        for (const key of ['qty','dimensions','note']) fieldset.querySelector('[data-extra="'+key+'"]').value=row[key];
        fieldset.querySelector('small').textContent=item.price===null?'Chờ WOTU báo giá':'Đã có giá tính tự động';
        container.append(fieldset);
      }
      updateParents(container,room,rows,definitions);
    }
    root.addEventListener('toggle',()=>root.open?opened.add(room):opened.delete(room));
    root.addEventListener('input',event=>{
      const field=event.target.dataset.extra;
      if(!field)return;
      event.stopPropagation();
      const row=rows.find(row=>row.id===event.target.closest('[data-extra-row]').dataset.extraRow);
      row[field]=field==='qty'?Number(event.target.value):event.target.value;
      if(field==='item'){
        render();
        container.querySelector('[data-extra-row="'+row.id+'"] [data-extra="item"]')?.focus({preventScroll:true});
      }
      refreshQuote();
    });
    function add(item,qty,parent=''){
      if(!item)return;
      rows.push({id:String(++serial),item:item.id,qty,dimensions:'',note:'',parent});
      root.open=true;render();refreshQuote();container.lastElementChild.querySelector('select').focus();
    }
    anchor.querySelector('[data-add-island-stone]')?.addEventListener('click',()=>{
      const button=anchor.querySelector('[data-add-island-stone]');
      const status=button.nextElementSibling;
      if(!(S.bepDaoW>0)){status.textContent='Nhập chiều dài bàn đảo trước.';return;}
      status.textContent='';
      add(definitions.get('island-'+S.da)||definitions.get('island-kimsa'),S.bepDaoW,'base:Đảo bếp');
    });
    root.addEventListener('click',event=>{
      if(event.target.closest('[data-extra-add]')){
        const first=(room==="bep"&&S.bepDaoW<=0?available.find(item=>!item.id.startsWith("island-")):available[0]);
        const parent=room==='bep'&&first?.id.startsWith('island-')&&S.bepDaoW>0?'base:Đảo bếp':'';
        add(first,parent?S.bepDaoW:1,parent);
      } else if(event.target.closest('[data-extra-remove]')){
        const id=event.target.closest('[data-extra-row]').dataset.extraRow;
        rows.splice(rows.findIndex(row=>row.id===id),1);
        rows.forEach(row=>{if(row.parent==='extra:'+id)row.parent='';});
        render();refreshQuote();root.querySelector('[data-extra-add]').focus();
      }
    });
    anchor.append(root);
    render();
  };
  window.mountWotuExtraAreas=function(anchor){
    const card=document.createElement('section');
    card.className='card extra-areas noprint';
    card.innerHTML='<h2>Khu vực khác</h2><div class="grid"><label>Khu vực<select></select></label>'+
      '<label>Tên phòng (tùy chọn)<input maxlength="50" placeholder="Ví dụ Phòng ngủ khách"></label></div>'+
      '<button type="button" class="btn btn2">Thêm khu vực</button><div class="extra-area-list"></div>';
    const picker=card.querySelector('select');
    for(const room of ['n4','bath','laundry','gym','other']) choice(picker,roomNames[room],room);
    const list=card.querySelector('.extra-area-list');
    function render(){
      list.replaceChildren();
      for(const [room,{label,kind}] of addedRooms){
        const section=document.createElement('section');
        section.innerHTML='<div class="extra-area-head"><h3></h3><button type="button">Xóa khu vực</button></div>';
        section.querySelector('h3').textContent=label;
        section.querySelector('button').addEventListener('click',()=>{
          addedRooms.delete(room);extras.delete(room);opened.delete(room);render();refreshQuote();
        });
        mountWotuExtras(section,room);
        if (kind==="n4") mountGaris(section,room);
        list.append(section);
      }
    }
    card.querySelector('button').addEventListener('click',()=>{
      const kind=picker.value;
      const room='area-'+(++serial);
      addedRooms.set(room,{kind,label:card.querySelector('input').value.trim()||roomNames[kind]});
      opened.add(room);
      card.querySelector('input').value='';
      render();refreshQuote();
    });
    anchor.append(card);
    render();
  };

  function mountAdmin(){
    const panel=document.querySelector('.admin-panel');
    if(!S.admin||!panel||panel.querySelector('.extra-admin'))return;
    const section=document.createElement('section');
    section.className='price-admin extra-admin';
    section.innerHTML='<h2>Danh mục hạng mục bổ sung</h2><p class="muted">Tạo món có đơn vị và khu vực áp dụng. Để trống đơn giá nếu cần báo riêng.</p>'+
      '<form><label>Chọn món để chỉnh<select name="item"></select></label><label>Tên món<input name="title" required maxlength="100"></label>'+
      '<div class="grid"><label>Khu vực<select name="scope"></select></label><label>Đơn vị<select name="unit"></select></label></div>'+
      '<label>Đơn giá (đồng)<input name="price" type="number" min="0" max="1000000000000" step="1"></label>'+
      (wotuPriceLocal?'':'<label>Mã lưu Admin<input name="token" type="password" autocomplete="off" required></label>')+
      '<button type="submit" class="btn">Lưu hạng mục</button><p role="status" class="price-status"></p></form>';
    const form=section.querySelector('form');
    const [item,title,scope,unit,price,token]=["item","title","scope","unit","price","token"].map(name=>form.elements.namedItem(name));
    for(const [id,label] of Object.entries(scopes)) choice(scope,label,id);
    for(const label of units) choice(unit,label,label);
    function refresh(id=''){
      item.replaceChildren();choice(item,'Tạo hạng mục mới','');
      for(const row of catalog().values()) choice(item,row.name,row.id);
      item.value=id;
      const row=catalog().get(id);
      title.value=row?.name||'';scope.value=row?.scope||'any';unit.value=row?.unit||'cái';price.value=row?.price??'';
    }
    item.addEventListener('change',()=>refresh(item.value));
    refresh();
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const status=form.querySelector('[role=status]');
      const button=form.querySelector('button');
      const id=item.value||'wotu-'+crypto.randomUUID();
      const amount=price.value===''?null:Number(price.value);
      if(!title.value.trim()||(amount!==null&&(!Number.isSafeInteger(amount)||amount<0||amount>1e12))) {
        status.textContent='Nhập tên món và đơn giá hợp lệ.';return;
      }
      button.disabled=true;
      try {
        await saveWotuPriceConfig({['catalog.'+id]:{name:title.value.trim(),scope:scope.value,unit:unit.value,price:amount}},token?.value);
        refresh(id);status.textContent='Đã lưu hạng mục.';
      }catch(error){status.textContent=error.message;}
      finally{button.disabled=false;}
    });
    panel.querySelector('.admin-settings').before(section);
  }
  const previousDraw=draw;
  draw=function(){previousDraw();mountAdmin();};
  const previousReset=resetC;
  resetC=function(){extras.clear();addedRooms.clear();opened.clear();previousReset();};
})();
