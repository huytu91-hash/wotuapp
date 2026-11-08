/* GARIS 2026. Dimensions refer to the catalogue's standard cabinet width. */
(() => {
  const groups = { upper:'Bếp trên', lower:'Bếp dưới', pantry:'Tủ đồ khô', wardrobe:'Tủ quần áo' };
  const types = {
    dish:'Giá chén bát inox', pots:'Hộc kéo xoong nồi', spice:'Khay gia vị và dao thớt',
    fixed:'Giá bát cố định', lift:'Giá bát nâng hạ', pantry:'Bộ rổ tủ đồ khô',
    rail:'Suốt treo nâng hạ', drawer:'Ngăn kéo để đồ', pants:'Giá treo quần âu',
  };
  const sizes = [600,700,800,900];
  const products = [
    ['upper','fixed','Giá bát đĩa cố định 2 tầng','GB04','C',sizes,11,'gb04c'],
    ['upper','fixed','Giá bát đĩa cố định 2 tầng','MB04','E',sizes,11,'mb04e'],
    ['upper','lift','Giá bát đĩa nâng hạ cơ, inox 304','GL06','C',sizes,10,'gl06c'],
    ['upper','lift','Giá bát đĩa nâng hạ cơ, rổ nan oval','ML06','V',[700,800,900],9],
    ['lower','dish','Giá bát đĩa inox 304, cánh kéo','GD02','C',sizes,15,'gd02c'],
    ['lower','dish','Giá bát đĩa inox 304, cánh mở','GD04','C',sizes,15,'gd04c'],
    ['lower','dish','Giá bát đĩa inox 304, rổ dạng hộp','GD01','',sizes,17],
    ['lower','pots','Giá xoong nồi inox 304, cánh kéo','GP02','C',sizes,15,'gp02c'],
    ['lower','pots','Giá xoong nồi inox 304, cánh mở','GP04','C',sizes,15,'gp04c'],
    ['lower','pots','Giá xoong nồi inox 304, nan oval','MP02','V',sizes,13],
    ['lower','spice','Giá dao thớt, gia vị, chai lọ','GM02','C',[300,350,400],20],
    ['lower','spice','Giá gia vị và chai lọ, rổ nan oval','MK02','V',[250,300,350,400],18],
    ['pantry','pantry','Tủ đồ khô 6 tầng, inox nan dẹt','GS6','E',[450,600],26,'gs6e'],
    ['pantry','pantry','Tủ đồ khô 6 tầng, inox nan oval','MS6','V',[450],26,'ms6v'],
    ['pantry','pantry','Tủ đồ khô 6 tầng, rổ nhôm, cánh mở','MS6','GA',[450,600],28],
    ['wardrobe','rail','Suốt nâng hạ cơ, màu xám xanh','GW34E','',['800–1100'],66,'gw34e'],
    ['wardrobe','rail','Suốt nâng hạ cơ, màu trắng','GW14','',['800–1100'],66,'gw14'],
    ['wardrobe','drawer','Ngăn kéo để đồ gập, khung nhôm bọc da','GW02','E',sizes,69,'gw02e',100],
    ['wardrobe','pants','Giá treo quần âu, khung nhôm bọc da','GW04','E',sizes,69,'gw04e',100],
  ].flatMap(([group,type,name,code,suffix,widths,page,photo,divisor=10]) =>
    widths.map((width,variant) => ({group,type,name,page,photo,width,variant,series:code+suffix,code:typeof width==='number'?code+'.'+width/divisor+suffix:code})));
  const listedPrices = {
    GB04C:[2690,2890,3190,3390], MB04E:[3029,3259,3529,3759],
    GL06C:[10890,11290,11490,11790], ML06V:[12790,13190,13590],
    GD02C:[3630,3860,4200,4430], GD04C:[3750,4050,4350,4550], GD01:[3530,3750,3990,4220],
    GP02C:[3520,3750,3970,4160], GP04C:[3650,3880,4110,4280], MP02V:[5690,6090,6290,6690],
    GM02C:[4330,4560,4790], MK02V:[4490,4690,4890,5090],
    GS6E:[13590,15300], MS6V:[15980], MS6GA:[13590,14990],
    GW34E:[2990], GW14:[3690], GW02E:[5100,5300,5500,5900], GW04E:[3100,3300,3550,3750],
  };
  const productIndex = new Map(products.map(product => [product.code,product]));
  const states = new Map();
  function stateFor(room) {
    if (!states.has(room)) states.set(room,{
      filters:{group:'',type:'',width:'',query:''}, chosen:new Set(), open:false, suggestions:null,
    });
    return states.get(room);
  }
  const listed = product => listedPrices[product.series][product.variant]*1000;
  for (const product of products) registerWotuGarisRate(product.code,product.name,listed(product));
  const price = product => Math.round(wotuGarisRate(product.code,listed(product))*.65);
  const offer = 'Chiết khấu 35% phụ kiện GARIS, đã bao gồm chi phí lắp đặt.';
  const baseLines = lines;
  lines = function () {
    const items = baseLines();
    for (const [room,state] of states) {
      if (!S.rooms[room] && !window.isWotuExtraAreaActive?.(room)) continue;
      for (const code of state.chosen) {
        const product = productIndex.get(code);
        items.push([product.name+' GARIS '+code,'Khổ tủ '+product.width+' mm · '+groups[product.group],
          price(product),{room,product}]);
      }
    }
    return items;
  };
  const resetCustomer = resetC;
  resetC = function () {
    states.clear();
    resetCustomer();
  };
  window.garisOffer = offer;
  const normalize = value => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
  const selected = value => value ? ' selected' : '';
  function widthMatches(width, wanted) {
    if (typeof width==='number') return width===wanted;
    const [min,max]=width.split('–').map(Number);
    return wanted>=min && wanted<=max;
  }
  function options(entries,value,empty) {
    return '<option value="">'+empty+'</option>'+entries.map(([id,name])=>
      '<option value="'+id+'"'+selected(String(id)===value)+'>'+name+'</option>').join('');
  }
  function render(root,state,room) {
    const {filters,chosen,suggestions}=state;
    const inGroup = products.filter(p => (room==='bep' ? p.group!=='wardrobe' : p.group==='wardrobe') && (!filters.group || p.group===filters.group));
    const matchingTypes = [...new Set(inGroup.map(p=>p.type))];
    if (!matchingTypes.includes(filters.type)) filters.type='';
    const inType = inGroup.filter(p=>!filters.type || p.type===filters.type);
    const widths = [...new Set(inType.map(p=>p.width))].sort((a,b)=>parseInt(a)-parseInt(b));
    if (!widths.map(String).includes(filters.width)) filters.width='';
    const tokens = normalize(filters.query).trim().split(/\s+/).filter(Boolean);
    const results = inType.filter(p=>(!filters.width || String(p.width)===filters.width) &&
      tokens.every(token=>normalize([p.code,p.name,groups[p.group],types[p.type]].join(' ')).includes(token)));
    root.querySelector('[data-garis-filter="type"]').innerHTML=options(matchingTypes.map(id=>[id,types[id]]),filters.type,'Mọi loại');
    root.querySelector('[data-garis-filter="width"]').innerHTML=options(widths.map(w=>[w,w+' mm']),filters.width,'Mọi khổ tủ');
    root.querySelector('.garis-status').textContent = results.length+' mã phù hợp';
    root.querySelector('.garis-results').innerHTML = results.map(p=>'<article class="garis-product">'+
      (p.photo?'<img loading="lazy" src="garis-'+p.photo+'.jpg" alt="">':'<span class="garis-fallback" aria-hidden="true">GARIS</span>')+
      '<div><b>'+p.name+'</b><small>'+p.code+' · Khổ tủ '+p.width+' mm · Trang PDF '+p.page+'</small>'+
      '<button type="button" data-garis-code="'+p.code+'" aria-pressed="'+chosen.has(p.code)+'">'+
      (chosen.has(p.code)?'Bỏ chọn':'Thêm vào báo giá')+'</button></div></article>').join('') ||
      '<p class="muted">Chưa thấy mẫu phù hợp. Thử đổi loại hoặc khổ tủ.</p>';
    const picked = products.filter(p=>chosen.has(p.code));
    root.querySelector('.garis-selection').innerHTML=picked.length?
      '<strong>Đã thêm vào báo giá</strong><ul>'+picked.map(p=>'<li>'+p.code+' · '+p.name+
        ' <button type="button" data-garis-code="'+p.code+'" aria-label="Bỏ chọn '+p.code+'">Bỏ</button></li>').join('')+'</ul>':'';
    root.querySelector('.garis-suggestion').innerHTML=suggestions ?
      (suggestions.length ? '<strong>Gợi ý từ mô tả</strong><ul>'+suggestions.map(p=>'<li>'+p.code+' · '+p.name+' · '+p.width+
        ' mm <button type="button" data-garis-code="'+p.code+'" aria-pressed="'+chosen.has(p.code)+'">'+
        (chosen.has(p.code)?'Bỏ chọn':'Chọn')+'</button></li>').join('')+'</ul>' :
        '<p>Chưa tìm được mã và khổ tủ phù hợp trong các mẫu đã nhập.</p>') : '';
  }

  window.mountGaris = function (anchor,room) {
    const state=stateFor(room);
    const {filters,chosen}=state;
    const root=document.createElement('details');
    root.className='garis-catalog kitchen-option noprint';
    root.open=state.open;
    const location = room==='bep' ? '<label>Vị trí lắp<select data-garis-filter="group">'+
      options(Object.entries(groups).filter(([id])=>id!=='wardrobe'),filters.group,'Tất cả vị trí')+'</select></label>' : '';
    root.innerHTML='<summary><span><b>Thêm phụ kiện GARIS</b><small>'+offer+'</small></span><span class="kitchen-chevron" aria-hidden="true"></span></summary>'+
      '<div class="garis-panel"><div class="garis-filters">'+location+
      '<label>Loại phụ kiện<select data-garis-filter="type"></select></label>'+
      '<label>Khổ tủ<select data-garis-filter="width"></select></label><label>Tìm tên hoặc mã<input data-garis-filter="query" type="search" placeholder="Ví dụ GD02.80C"></label></div>'+
      '<div class="garis-suggestion"></div><div class="garis-selection"></div><p class="garis-status" aria-live="polite"></p><div class="garis-results"></div></div>';
    root.querySelector('[data-garis-filter="query"]').value=filters.query;
    root.addEventListener('toggle',()=>{state.open=root.open});
    root.addEventListener('input',event=>{
      const key=event.target.dataset.garisFilter;
      if (!key) return;
      filters[key]=event.target.value;
      if (key==='group') { filters.type=''; filters.width=''; }
      if (key==='type') filters.width='';
      render(root,state,room);
    });
    root.addEventListener('click',event=>{
      const code=event.target.closest('[data-garis-code]')?.dataset.garisCode;
      if (!code) return;
      if (chosen.has(code)) chosen.delete(code); else chosen.add(code);
      refreshQuote();
      render(root,state,room);
      root.querySelector('[data-garis-code="'+code+'"]')?.focus({preventScroll:true});
    });
    anchor.append(root);
    render(root,state,room);
  };

  window.suggestGaris = function (input) {
    const text=normalize(input);
    const explicit=products.filter(p=>text.split(/[^a-z0-9.]+/).some(word=>word.replace(/\.$/,'')===normalize(p.code)));
    const typePatterns = [
      ['pots',/xoong|noi inox/],['spice',/gia vi|dao thot/],['dish',/chen bat|bat dia/],
      ['rail',/suot|treo quan ao/],['pants',/quan au/],['drawer',/do gap|ngan keo.*quan ao/],
    ];
    let group = /tu kho|do kho/.test(text)?'pantry':/tu quan ao/.test(text)?'wardrobe':
      /bep tren|tu tren/.test(text)?'upper':/bep duoi|tu duoi/.test(text)?'lower':'';
    let type = typePatterns.find(([,pattern])=>pattern.test(text))?.[0] || '';
    if (/nang ha/.test(text) && (group==='upper' || type==='dish')) { group='upper'; type='lift'; }
    if (/co dinh/.test(text) && (group==='upper' || type==='dish')) { group='upper'; type='fixed'; }
    if (!group && type==='dish') group='lower';
    const sizeText=text.match(/\b(\d{2,4})\s*(mm|cm)\b/) || text.match(/(?:kho tu|tu duoi|tu tren|tu kho)\s+(\d{3,4})\b/);
    const width=sizeText ? +sizeText[1]*(sizeText[2]==='cm'?10:1) : 0;
    if (!explicit.length && !group && !type) { for (const state of states.values()) state.suggestions=null; return ''; }
    let matches=explicit.length?explicit:products.filter(p=>(!group || p.group===group)&&(!type || p.type===type)&&(!width || widthMatches(p.width,width)));
    if (!explicit.length && /canh keo/.test(text)) matches=matches.filter(p=>normalize(p.name).includes('canh keo'));
    if (!explicit.length && /canh mo/.test(text)) matches=matches.filter(p=>normalize(p.name).includes('canh mo'));
    const wardrobe = (explicit[0]?.group || group)==='wardrobe' || ['rail','drawer','pants'].includes(type);
    const room=wardrobe ? (/ngu 3/.test(text)?'n3':/ngu 2/.test(text)?'n2':
      ['master','n2','n3'].find(id=>S.rooms[id])||'master') : 'bep';
    const state=stateFor(room);
    const {filters,chosen}=state;
    S.rooms[room]=1;
    matches=matches.filter(p=>wardrobe ? p.group==='wardrobe' : p.group!=='wardrobe');
    state.suggestions=matches.slice(0,4);
    if (matches.length===1 && (explicit.length || width)) chosen.add(matches[0].code);
    state.open=true;
    filters.group=room==='bep' ? explicit[0]?.group || group : '';
    filters.type=explicit[0]?.type || type;
    filters.width=matches.length===1 ? String(matches[0].width) : width ? String(width) : '';
    filters.query='';
    return matches.length ? ' Đã gợi ý phụ kiện trong catalog GARIS.' : ' Chưa có mẫu GARIS khớp yêu cầu.';
  };
})();
