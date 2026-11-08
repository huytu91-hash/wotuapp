/* Axonometric illustrations for the quotation workspace. */
(() => {
  const rooms = {
    bep: ['Tủ bếp', 'Tủ dưới, tủ trên, mặt đá và phụ kiện'],
    master: ['Phòng ngủ master', 'Giường, tủ áo và bàn trang điểm'],
    n2: ['Phòng ngủ 2', 'Giường và tủ áo'],
    n3: ['Phòng ngủ 3', 'Giường và tủ áo'],
    khach: ['Phòng khách', 'Kệ TV, tủ giày và vách trang trí'],
    an: ['Phòng ăn', 'Bàn ăn và tủ rượu'],
    tho: ['Phòng thờ', 'Vách ốp và không gian thờ'],
    stone: ['Mặt đá & kính', 'Bề mặt đá và kính ốp bếp'],
    fittings: ['Phụ kiện bếp', 'Khay kéo và giá đựng'],
    other: ['Hạng mục khác', 'Vách ngăn, lam gỗ và chiếu sáng'],
    design: ['Thiết kế nội thất', 'Mặt bằng và phối cảnh không gian'],
  };
  const packages = {
    'tiet-kiem': ['Tiết kiệm', 'Mặt bằng 2D và phối cảnh 3D'],
    'co-ban': ['Cơ bản', 'Bản vẽ kích thước, vật liệu và điện nước'],
    'hoan-thien': ['Hoàn thiện', 'Kết cấu, mặt đứng 3D và hồ sơ bàn giao'],
  };
  const sceneImages = {
    bep: 'kitchen', master: 'wardrobe', n2: 'bed', n3: 'bed', khach: 'living',
    an: 'dining', tho: 'altar', stone: 'stone', fittings: 'fittings', other: 'panel',
    design: 'design', 'tiet-kiem': 'design', 'co-ban': 'design', 'hoan-thien': 'design',
  };
  const quoteImages = [
    [/^(Tủ bếp|Tủ kịch trần|Khung tủ lạnh|Đèn LED bếp)/, 'kitchen'],
    [/^Đảo bếp/, 'island'],
    [/^(Mặt đá|Ốp đứng bếp)/, 'stone'],
    [/^(Thùng nhựa bồn rửa|Combo bồn rửa)/, 'sink'],

    [/^Kệ tivi/, 'living'],
    [/^Tủ giày/, 'shoe'],
    [/^(Tủ rượu|Tủ trang trí)/, 'display'],
    [/^Bàn ăn/, 'dining'],
    [/^Ốp vách phòng thờ/, 'altar'],
    [/^Ốp vách/, 'panel'],
    [/^Tủ quần áo/, 'wardrobe'],
    [/^Giường ngủ/, 'bed'],
    [/^Ốp nệm đầu giường/, 'bed-head'],
    [/^Hộc kéo giường/, 'bed-drawer'],
    [/^Tab đầu giường/, 'bedside'],
    [/^Bàn trang điểm/, 'vanity'],
  ];
  let activeRoom = '';

  function scene(asset, thumbnail = false) {
    const file = asset + (thumbnail ? '-quote.jpg' : '.webp');
    const size = thumbnail ? 256 : 1024;
    return '<img class="studio-product" src="'+file+'" width="'+size+'" height="'+size+'" alt="">';
  }

  function preview(key, data) {
    return '<figure class="studio-preview noprint">'+scene(sceneImages[key])+
      '<figcaption><div><strong>'+data[0]+'</strong><span>'+data[1]+
      '</span></div><small>Phối cảnh minh họa</small></figcaption></figure>';
  }
  function heading() {
    const tag = document.createElement('div');
    tag.className = 'studio-kicker noprint';
    tag.textContent = 'WOTU STUDIO  /  DỰ TOÁN NỘI THẤT';
    g('app').querySelector('h1')?.before(tag);
  }

  function decorate() {
    if (S.page === 'welcome') {
      heading();
      const hero = document.createElement('section');
      hero.className = 'studio-hero studio-entry';
      const intro = document.createElement('div');
      intro.className = 'studio-intro';
      const formCard = g('fn').closest('.card');
      const title = g('app').querySelector('h1');
      title.textContent = 'Hình dung nội thất. Biết trước chi phí.';
      const lead = g('app').querySelector('.lead');
      lead.textContent = 'Thử phối vật liệu, chọn từng hạng mục và nhận báo giá theo kích thước công trình của bạn.';
      const form = document.createElement('form');
      form.append(...formCard.children);
      formCard.append(form);
      formCard.insertAdjacentHTML('afterbegin','<h2>Thông tin công trình</h2>');
      form.querySelector('button').removeAttribute('onclick');
      form.querySelector('button').type='submit';
      form.querySelector('button').textContent='Bắt đầu dự toán';
      form.addEventListener('submit',event=>{event.preventDefault();start();});
      g('fn').placeholder='Họ và tên của bạn';
      g('ph').placeholder='Ví dụ 09xx xxx xxx';
      g('ph').autocomplete='tel';
      g('ad').placeholder='Địa chỉ lắp đặt dự kiến';
      g('ad').autocomplete='street-address';
      g('er').setAttribute('role','alert');
      formCard.before(hero);
      intro.append(g('app').querySelector('.studio-kicker'),title,lead,formCard);
      hero.append(intro);
      hero.insertAdjacentHTML('beforeend','<figure class="entry-cover"><img src="studio-cover.webp" alt="Phối cảnh minh họa không gian bếp WOTU" fetchpriority="high">'+
        '<figcaption><span>WOTU DESIGN & BUILD</span><b>Nội thất thiết kế theo không gian</b></figcaption></figure>');
      hero.insertAdjacentHTML('afterend','<ol class="entry-steps"><li><span>01</span><b>Chọn khu vực</b><small>Bếp, phòng ngủ và các khu vực khác</small></li>'+
        '<li><span>02</span><b>Thử vật liệu</b><small>Xem phối cảnh và chọn phụ kiện</small></li>'+
        '<li><span>03</span><b>Xem báo giá</b><small>Thành tiền từng món và lịch thanh toán</small></li></ol>');
      const admin=g('app').querySelector('.admin-fab');
      if (admin) {
        admin.classList.add('entry-admin');
        hero.nextElementSibling.after(admin);
      }
    }
    if (S.page === 'home') {
      heading();
      const tiles = document.querySelectorAll('.tiles .card');
      tiles[0].insertAdjacentHTML('afterbegin',scene('design'));
      tiles[0].querySelector('.muted').textContent='Chọn gói, nhập diện tích và xem phí thiết kế.';
      tiles[1].insertAdjacentHTML('afterbegin',scene('living'));
      tiles[1].querySelector('.muted').textContent='Chọn phòng, phối vật liệu và dự toán từng hạng mục.';
      const catalog = document.querySelector('.catalog');
      const keys = ['bep','stone','fittings','khach','an','master','other'];
      [...catalog.children].forEach((item,i) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = item.querySelector('b').textContent;
        button.title = item.querySelector('span').textContent;
        const key = keys[i] || 'other';
        button.addEventListener('click',() => {
          for (const entry of catalog.querySelectorAll('button')) entry.setAttribute('aria-pressed',String(entry === button));
          const stage = catalog.nextElementSibling;
          stage.innerHTML = preview(key, rooms[key]);
          stage.querySelector('strong').textContent = button.textContent;
          stage.querySelector('figcaption span').textContent = button.title;
        });
        item.replaceWith(button);
      });
      catalog.insertAdjacentHTML('afterend','<div class="catalog-stage"></div>');
      catalog.querySelector('button')?.click();
    }
    if (S.page === 'design') {
      heading();
      const buttons = [...document.querySelectorAll('.pkg')];
      buttons.forEach(old => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = old.className;
        button.innerHTML = old.innerHTML;
        button.setAttribute('aria-pressed',String(old.classList.contains('on')));
        button.setAttribute('onclick',old.getAttribute('onclick'));
        old.replaceWith(button);
      });
      g('dArea').closest('.card').insertAdjacentHTML('beforeend',preview(S.dPkg,packages[S.dPkg]));
    }
    if (S.page === 'interior') {
      heading();
      const chips = document.querySelector('.chips');
      const key = S.rooms[activeRoom] ? activeRoom : Object.keys(S.rooms).find(room => S.rooms[room]);
      if (key) {
        chips.insertAdjacentHTML('afterend',preview(key,rooms[key]));
        if (key==='bep') chips.nextElementSibling.classList.add('kitchen-overview');
      } else {
        chips.insertAdjacentHTML('afterend','<div class="room-empty noprint">'+scene('design')+
          '<div><strong>Bạn muốn báo giá khu vực nào?</strong><span>Chọn một hoặc nhiều khu vực ở trên để xem phối cảnh và nhập kích thước.</span></div></div>');
      }
      const titles = {'Bếp':'bep','Phòng khách':'khach','Phòng ăn':'an','Phòng ngủ master':'master','Phòng ngủ 2':'n2','Phòng ngủ 3':'n3','Phòng thờ':'tho'};
      for (const title of document.querySelectorAll('.lay h2')) {
        const room = titles[title.textContent];
        if (room==='bep') mountWotuMaterialStudio(title.closest('.card'));
        else if (room) title.insertAdjacentHTML('afterend',preview(room,rooms[room]));
        if (['bep','master','n2','n3'].includes(room)) mountGaris(title.closest('.card'),room);
        if (room) mountWotuExtras(title.closest('.card'),room);
      }
      mountWotuExtraAreas(chips.closest('.lay').firstElementChild);
      mountWotuMaterialDetails();
    }
  }

  g('app').addEventListener('change', event => {
    const room = event.target.dataset.room;
    if (room) activeRoom = room;
  }, true);
  const quoteGroups = [
    { room: 'bep', title: 'Phòng bếp', match: /^(Tủ bếp|Đảo bếp|Tủ kịch trần|Khung tủ lạnh|Mặt đá|Ốp đứng bếp|Đèn LED bếp|Thùng nhựa bồn rửa|Combo bồn rửa)/ },
    { room: 'khach', title: 'Phòng khách', match: /^(Kệ tivi|Tủ giày|Ốp vách trang trí phòng khách)/ },
    { room: 'an', title: 'Phòng ăn', match: /^(Tủ rượu|Tủ trang trí|Bàn ăn)/ },
    { room: 'master', title: 'Phòng ngủ master', match: / master$/ },
    { room: 'n2', title: 'Phòng ngủ 2', match: / 2$/ },
    { room: 'n3', title: 'Phòng ngủ 3', match: / 3$/ },
    { room: 'tho', title: 'Phòng thờ', match: /^Ốp vách phòng thờ/ },
    { title: 'Hạng mục khác', match: /./ },
  ];
  const accessoryParents = [
    [/^(Mặt đá|Thùng nhựa bồn rửa|Combo bồn rửa)/, /^Tủ bếp dưới/],
    [/^(Ốp đứng bếp|Đèn LED bếp)/, /^Tủ bếp trên/],
    [/^(Ốp nệm đầu giường|Hộc kéo giường)/, /^Giường ngủ/],
  ];

  function arrangeQuote(template) {
    const rows = [...template.content.querySelectorAll('.line')];
    if (!rows.length) return;
    const amounts = lines();
    const groups = new Map();
    for (const [index,row] of rows.entries()) {
      const title = row.querySelector('.li > b').textContent;
      const meta = amounts[index][3];
      let group = quoteGroups.find(group => meta ? group.room===meta.room : group.match.test(title));
      if (!group && meta) group=[...groups.keys()].find(group=>group.room===meta.room) ||
        {room:meta.room,title:extraRoomLabel(meta.room)};
      const product = meta?.product;
      const parent = product ? {upper:/^Tủ bếp trên/,lower:/^Tủ bếp dưới/,wardrobe:/^Tủ quần áo/}[product.group] :
        !meta ? accessoryParents.find(([match]) => match.test(title))?.[1] : null;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push({row,title,parent,meta,amount:amounts[index][2]});
      const amount = row.querySelector('.gia');
      const itemTotal = document.createElement('div');
      itemTotal.className = 'quote-line-total';
      if (meta?.pending) {
        itemTotal.classList.add('pending-price');
        amount.textContent='Chờ báo giá';
      } else itemTotal.innerHTML = '<span>Thành tiền</span>';
      itemTotal.append(amount);
      row.querySelector('.li').append(itemTotal);
      const cabinetMaterial = title==='Tủ bếp dưới' ? S.bepDuoi : title==='Tủ bếp trên' ? S.bepTren : null;
      const materialAsset = ['ply_mel','mdf_acr','nhua_film','nhua_acr','nhua_lam'].includes(cabinetMaterial)
        ? 'material-'+cabinetMaterial : null;
      const illustration = meta?.asset || materialAsset || quoteImages.find(([pattern]) => pattern.test(title))?.[1];
      if (product?.photo) row.insertAdjacentHTML('beforeend','<figure class="quote-product"><img src="garis-'+
        product.photo+'.jpg" alt=""><figcaption>Ảnh GARIS</figcaption></figure>');
      if (illustration) row.insertAdjacentHTML('beforeend', '<figure class="quote-product">'+scene(illustration,true)+
        '<figcaption>Ảnh minh họa</figcaption></figure>');
    }
    const summary = template.content.querySelector('.tot');
    for (const group of [...quoteGroups,...[...groups.keys()].filter(group=>!quoteGroups.includes(group))]) {
      const entries = groups.get(group);
      if (!entries) continue;
      const section = document.createElement('section');
      section.className = 'quote-group';
      section.innerHTML = '<header><h3></h3><span>Chưa VAT <b>'+
        vnd(entries.reduce((sum, entry) => sum + entry.amount, 0))+'</b></span></header>';
      section.querySelector('h3').textContent=group.title;
      const parents=new Map();
      for (const entry of entries) {
        const link=entry.meta?.parentId;
        const parent=entries.find(other=>other!==entry && (link ?
          link===(other.meta?.extraId?'extra:'+other.meta.extraId:'base:'+other.title) :
          entry.parent?.test(other.title)));
        if (parent) parents.set(entry,parent);
      }
      let number=0;
      const visited=new Set();
      function append(entry,item,depth) {
        if(visited.has(entry))return;
        visited.add(entry);
        entry.row.classList.toggle('quote-subitem',depth>0);
        entry.row.querySelector('.no').textContent=depth?'↳':String(++number).padStart(2,'0');
        item.append(entry.row);
        for(const child of entries)if(parents.get(child)===entry)append(child,item,depth+1);
      }
      function appendRoot(entry) {
        if(visited.has(entry))return;
        const item=document.createElement('div');
        item.className='quote-item';
        append(entry,item,0);
        section.append(item);
      }
      for(const entry of entries)if(!parents.has(entry))appendRoot(entry);
      entries.forEach(appendRoot);
      summary.before(section);
    }
    if (amounts.some(item=>item[3]?.product)) summary.insertAdjacentHTML('beforebegin','<p class="quote-offer">'+garisOffer+'</p>');
    if (amounts.some(item=>item[3]?.pending)) summary.insertAdjacentHTML('beforebegin',
      '<p class="quote-pending">Tổng tạm tính chưa gồm các món đang chờ báo giá. WOTU cần bổ sung giá trước khi đặt hàng.</p>');
  }

  const renderInteriorQuote = quoteInterior;
  quoteInterior = function () {
    const template = document.createElement('template');
    template.innerHTML = renderInteriorQuote();
    arrangeQuote(template);
    decorateQuoteActions(template.content);
    return template.innerHTML;
  };
  const renderDesignQuote = quoteDesign;
  quoteDesign = function () {
    const template = document.createElement('template');
    template.innerHTML = renderDesignQuote();
    const total = template.content.querySelector('.tot');
    total?.insertAdjacentHTML('beforebegin', '<figure class="quote-product">'+scene('design',true)+
      '<figcaption>Ảnh minh họa</figcaption></figure>');
    decorateQuoteActions(template.content);
    return template.innerHTML;
  };
  function mountWorkspaceNavigation() {
    const app=g('app');
    const layout=app.querySelector('.lay');
    if (!layout || !['interior','design'].includes(S.page)) return;
    const first=app.querySelector('.chips')?.closest('.card') || g('dArea')?.closest('.card');
    const configure=layout.querySelector('.kitchen-card, .card:has(.extra-config)') ||
      layout.querySelector('.extra-areas') || first;
    const steps=S.page==='interior'?[['Khu vực',first],['Cấu hình',configure],['Báo giá',g('quote')]]:
      [['Gói thiết kế',first],['Báo giá',g('quote')]];
    const navigation=document.createElement('nav');
    navigation.className='workspace-nav noprint';
    navigation.setAttribute('aria-label','Đi nhanh trong báo giá');
    for (const [index,[text,target]] of steps.entries()) {
      const button=document.createElement('button');
      button.type='button';
      button.innerHTML='<span aria-hidden="true">'+String(index+1).padStart(2,'0')+'</span><b>'+text+'</b>';
      button.addEventListener('click',()=>jumpTo(target));
      navigation.append(button);
    }
    layout.before(navigation);
  }

  function jumpTo(target) {
    if(!target)return;
    if (!target.hasAttribute('tabindex')) target.tabIndex=-1;
    target.focus({preventScroll:true});
    target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
  function syncQuoteDock() {
    const dock = g('quote-dock');
    if (!dock) return;
    const total = g('quote')?.querySelector('.tot .row:last-child b:last-child')?.textContent;
    const amount = dock.querySelector('strong');
    const label = dock.querySelector('span');
    label.textContent = total ? 'Tổng dự kiến · đã gồm VAT' : 'Báo giá trực tiếp';
    if (amount.textContent !== (total || 'Chưa có dự toán')) amount.textContent = total || 'Chưa có dự toán';
  }

  function mountQuoteDock() {
    const quote = g('quote');
    if (!quote || !['interior','design'].includes(S.page)) return;
    quote.setAttribute('tabindex','-1');
    quote.setAttribute('role','region');
    quote.setAttribute('aria-label','Phiếu báo giá');
    const dock = document.createElement('aside');
    dock.id = 'quote-dock';
    dock.className = 'quote-dock noprint';
    dock.innerHTML = '<div><span></span><strong aria-live="polite"></strong></div>'+
      '<button type="button" class="btn">Xem báo giá</button>';
    dock.querySelector('button').addEventListener('click',()=>jumpTo(quote));
    g('app').append(dock);
    syncQuoteDock();
  }

  const refreshQuoteApp = refreshQuote;
  refreshQuote = function () {
    refreshQuoteApp();
    syncQuoteDock();
  };
  const drawApp = draw;
  draw = function () {
    const focused = document.activeElement;
    const room = focused?.dataset.room;
    const pkg = focused?.classList.contains('pkg');
    drawApp();
    decorate();
    mountQuoteDock();
    mountWorkspaceNavigation();
    if (room) document.querySelector('[data-room="'+room+'"]')?.focus({preventScroll:true});
    if (pkg) document.querySelector('.pkg.on')?.focus({preventScroll:true});
  };
  draw();
})();




