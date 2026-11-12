/* The existing pricing functions remain the defaults for every override. */
(() => {
  const storageKey = 'wotu-price-overrides-v1';
  const local = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  let overrides = {};
  let loaded = local;
  window.wotuPricesReady = () => loaded;
  let status = local ? 'Bản xem thử lưu giá trên trình duyệt này.' : 'Đang tải bảng giá đã lưu…';
  if (local) {
    try { overrides = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch {}
  }
  const entries = new Map();
  let sections;
  const labels = {mdf:'MDF + kính',nhom:'MDF + nhôm kính',ply:'Plywood + kính',ply_nhom:'Plywood + nhôm kính',nhua:'Nhựa + kính',nhua_nhom:'Nhựa + nhôm kính'};
  const materials = () => MAT.map(m=>[m.id,m.short]);
  const value = (key, fallback) => Object.hasOwn(overrides,key) ? overrides[key] : fallback;
  function add(group,key,label,unit,fallback) {
    entries.set(key,{group,key,label,unit,fallback});
  }
  function rates(group,id,title,unit,base,options,keyFor = (...args)=>args.join('.')) {
    const getKey = (...args) => id+'.'+keyFor(...args);
    sections.push(()=>{
      for (const [args,label] of options()) add(group,getKey(...args),title+' · '+label,unit,()=>base(...args));
    });
    return (...args) => value(getKey(...args),base(...args));
  }
  const options = rows => rows.map(([id,name])=>[[id],name]);
  const mats = () => options(materials());
  const limited = () => options(materials().filter(([id])=>['mdf_mel','ply_mel','nhua_film'].includes(id)));
  const bedMaterials = () => materials().filter(([id])=>['mdf_mel','ply_mel'].includes(id));
  const sizeWithMaterial = sizes => sizes.flatMap(size=>bedMaterials().map(([id,label])=>[[size,id],size[0]+','+size[1]+' m · '+label]));
  const fixed = (group,key,label,unit,amount) => {
    add(group,key,label,unit,()=>amount);
    return () => value(key,amount);
  };
  sections = [];

  const basePkg = pkgP;
  const packages = [['tiet-kiem','Tiết kiệm',79000],['co-ban','Cơ bản',119000],['hoan-thien','Hoàn thiện',179000]];
  for (const [id,name,amount] of packages) fixed('Thiết kế','design.'+id,'Gói '+name,'đ/m²',amount);
  pkgP = () => value('design.'+S.dPkg,basePkg());

  boxP = rates('Bếp','kitchen.lower','Tủ bếp dưới','đ/m dài',boxP,mats);
  topP = rates('Bếp','kitchen.upper','Tủ bếp trên','đ/m dài',topP,mats);
  lanhP = rates('Bếp','kitchen.fridge','Khung tủ lạnh','đ/bộ',lanhP,mats);
  kichP = rates('Bếp','kitchen.ceiling','Tủ kịch trần','đ/m dài',kichP,()=>materials().flatMap(([id,label])=>[
    [['full',id],'Thùng và cánh · '+label],[['khung',id],'Khung bao · '+label],
  ]));
  daP = rates('Bếp','kitchen.stone','Mặt đá','đ/m dài',daP,()=>options([['kimsa','Kim sa'],['su','Đá sứ'],['lamar','Lamar']]));
  opP = rates('Bếp','kitchen.splash','Ốp bếp','đ/m dài',opP,()=>options([['k8','Kính 8 li'],['k6','Kính 6 li'],['kimsa','Đá kim sa']]));
  const led = fixed('Bếp','kitchen.led','Đèn LED','đ/m dài',180000);
  const sensor = fixed('Bếp','kitchen.sensor','Cảm biến LED','đ/bộ',250000);
  const sinkBox = fixed('Bếp','kitchen.sinkbox','Thùng nhựa dưới chậu','đ/bộ',900000);
  const sinks = {600:1800000,700:2300000,800:2600000};
  for (const [size,amount] of Object.entries(sinks)) fixed('Bếp','kitchen.sink.'+size,'Combo chậu và vòi · '+size+' mm','đ/bộ',amount);
  window.wotuKitchenRate = function (key,size) {
    if (key==='led') return led();
    if (key==='sensor') return sensor();
    if (key==='sinkbox') return sinkBox();
    return value('kitchen.sink.'+size,sinks[size]||2600000);
  };
  const baseIsland = (...args) => boxP(...args);
  window.wotuIslandRate = rates('Bếp','kitchen.island','Đảo bếp · giá gốc trước hệ số','đ/m dài',baseIsland,mats);

  keP = rates('Phòng khách','living.tv','Kệ TV','đ/m dài',keP,limited);
  giayP = rates('Phòng khách','living.shoe','Tủ giày','đ/m²',giayP,()=>limited().flatMap(([[id],label])=>[
    [[id,0],label],[[id,1],label+' · Cánh Acrylic'],
  ]));
  const baseWall = () => 0;
  vachP = rates('Phòng khách','living.wall','Ốp vách trang trí','đ/m²',baseWall,limited);
  window.wotuAltarRate = rates('Phòng thờ','altar.wall','Ốp vách phòng thờ','đ/m²',baseWall,limited);

  ruouP = rates('Phòng ăn','dining.wine','Tủ rượu','đ/m²',ruouP,()=>options(Object.entries(labels)));
  banP = rates('Phòng ăn','dining.table','Bàn ăn','đ/cái',typeof banP === 'function' ? banP : (()=>0),()=>sizeWithMaterial(['14','16','18']));
  window.wotuDisplayRate = rates('Phòng ăn','dining.display','Tủ trang trí','đ/m²',(...args)=>keP(...args),limited);

  tuP = rates('Phòng ngủ','bedroom.wardrobe','Tủ áo','đ/m²',tuP,mats);
  const baseWardrobe = tuGia;
  tuGia = rates('Phòng ngủ','bedroom.glass','Tủ áo cánh kính','đ/m²',
    mat=>baseWardrobe(mat,1),mats);
  const glassRate = tuGia;
  tuGia = (mat,nk) => nk ? glassRate(mat) : tuP(mat);
  bedP = rates('Phòng ngủ','bedroom.bed','Giường','đ/cái',bedP,()=>sizeWithMaterial(['14','16','18','20']));
  nemP = rates('Phòng ngủ','bedroom.pad','Mút ốp đầu giường','đ/cái',nemP,()=>options([
    ['14','1,4 m'],['16','1,6 m'],['18','1,8 m'],['20','2 m'],
  ]));
  tabP = fixed('Phòng ngủ','bedroom.nightstand','Tab đầu giường','đ/cái',typeof tabP === 'function' ? tabP() : 0);
  hocP = fixed('Phòng ngủ','bedroom.drawer','Hộc kéo giường','đ/hộc',typeof hocP === 'function' ? hocP() : 0);
  tdP = rates('Phòng ngủ','bedroom.vanity','Bàn trang điểm','đ/m dài',typeof tdP === 'function' ? tdP : (()=>0),limited);
  window.wotuGarisRate = (code,base) => value('garis.'+code,base);
  window.registerWotuGarisRate = (code,name,base) => add('Phụ kiện GARIS','garis.'+code,code+' · '+name,'đ/bộ',()=>base);

  window.wotuPriceLocal = local;
  window.wotuPriceConfig = () => overrides;
  window.saveWotuPriceConfig = async function(patch,token) {
    if (!loaded) throw Error('Chưa tải được bảng giá dùng chung. Hãy tải lại trang.');
    if (local) {
      const updated={...overrides,...patch};
      localStorage.setItem(storageKey,JSON.stringify(updated));
      overrides=updated;
      return;
    }
    const response=await fetch('/api/prices',{method:'PATCH',headers:{
      'Content-Type':'application/json','Authorization':'Bearer '+token,
    },body:JSON.stringify(patch)});
    const result=await response.json();
    if (!response.ok) throw Error(result.error||'Không lưu được đơn giá.');
    overrides=result.prices;
  };
  function mountPriceAdmin() {
    const panel = document.querySelector('.admin-panel');
    if (!S.admin || !panel || panel.querySelector('.price-admin')) return;
    sections.forEach(register=>register());
    const box = document.createElement('section');
    box.className = 'price-admin';
    box.innerHTML = '<h2>Bảng đơn giá</h2><p class="muted">Nhập số tiền bằng đồng. Giá GARIS nhập theo giá niêm yết trước chiết khấu 35%.</p>'+
      '<p class="price-status" role="status"></p><form><label>Tìm vật tư, hạng mục hoặc mã GARIS<input type="search" class="price-search"></label>'+
      '<div class="price-list"></div>'+
      (local?'':'<label>Mã lưu bảng giá<input type="password" class="price-token" autocomplete="off" required></label>')+
      '<button class="btn" type="submit">Lưu đơn giá đã chỉnh</button></form>';
    const statusNode = box.querySelector('.price-status');
    statusNode.textContent = status;
    const list = box.querySelector('.price-list');
    const groups = new Map();
    const changes = {};
    for (const entry of entries.values()) {
      if (!groups.has(entry.group)) {
        const group = document.createElement('details');
        group.innerHTML = '<summary></summary>';
        group.querySelector('summary').textContent = entry.group;
        list.append(group);
        groups.set(entry.group,group);
      }
      const row = document.createElement('label');
      row.className = 'price-row';
      const title = document.createElement('span');
      title.textContent = entry.label+' ('+entry.unit+')';
      const input = document.createElement('input');
      input.type = 'number'; input.min = '0'; input.max = '1000000000000'; input.step = '1';
      input.value = value(entry.key,entry.fallback());
      input.required = true;
      input.addEventListener('input',()=>{
        if (input.value!==input.defaultValue) changes[entry.key]=input.value;
        else delete changes[entry.key];
      });
      input.defaultValue = input.value;
      row.append(title,input);
      groups.get(entry.group).append(row);
    }
    const normalize = text=>text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
    box.querySelector('.price-search').addEventListener('input',event=>{
      const query = normalize(event.target.value.trim());
      for (const [name,group] of groups) {
        for (const row of group.querySelectorAll('.price-row')) row.hidden = !normalize(name+' '+row.textContent).includes(query);
        group.hidden = !group.querySelector('.price-row:not([hidden])');
        if (query && !group.hidden) group.open = true;
      }
    });
    const form = box.querySelector('form');
    const save = form.querySelector('button');
    save.disabled = !loaded;
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const patch = Object.fromEntries(Object.entries(changes).map(([key,raw])=>[key,raw===''?NaN:Number(raw)]));
      if (!Object.keys(patch).length) { statusNode.textContent='Chưa có giá nào thay đổi.'; return; }
      if (Object.values(patch).some(amount=>!Number.isSafeInteger(amount)||amount<0||amount>1e12)) {
        statusNode.textContent='Đơn giá phải là số nguyên không âm.'; return;
      }
      save.disabled=true;
      try {
        await saveWotuPriceConfig(patch,form.querySelector('.price-token')?.value);
        status='Đã lưu '+Object.keys(patch).length+' đơn giá.';
        box.remove();
        mountPriceAdmin();
      } catch(error) { statusNode.textContent=error.message; }
      finally { save.disabled=false; }
    });
    panel.querySelector('.admin-settings')?.before(box);
  }

  const previousDraw=draw;
  draw=function(){previousDraw();mountPriceAdmin();};
  if (!local) fetch('/api/prices',{cache:'no-store'}).then(async response=>{
    if (!response.ok) throw Error();
    overrides=(await response.json()).prices || {};
    loaded=true;
    status='Bảng giá dùng chung cho báo giá trên web.';
    if (S.page==='interior') draw();
    refreshQuote();
    if (S.admin) { document.querySelector('.price-admin')?.remove();mountPriceAdmin(); }
  }).catch(()=>{
    status='Chưa tải được bảng giá dùng chung. Hãy tải lại trang.';
    const message=document.querySelector('.price-status');
    if (message) message.textContent=status;
  });
})();
