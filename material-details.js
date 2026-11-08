(() => {
  const compact=text=>text.replace(/^Full\s+/i,'').replace(/\s+chống ẩm/gi,'').replace(/\s+phủ\s+/gi,' ')
    .replace(/MELAMINE|ACRYLIC|LAMINATE|MÀU/g,finish=>finish[0]+finish.slice(1).toLowerCase());
  function cabinet(description) {
    if (!description) return [['Quy cách','Chưa chọn tủ']];
    const [body,door]=description.split(/\s*\+\s*Cánh\s+/i);
    const specs=[['Thùng',compact(body.replace(/^Thùng\s+/i,''))]];
    if (door) specs.push(['Cánh',compact(door)]);
    return specs;
  }
  const spec=(label,description)=>[[label,compact(description)]];
  window.mountWotuMaterialDetails=function(){
    const app=g('app');
    const bindings=[];
    function add(id,label,details) {
      const select=g(id);
      if(!select)return;
      const wrapper=document.createElement('div');
      wrapper.className='item-material';
      const field=select.closest('label');
      const list=document.createElement('dl');
      list.className='item-material-spec';
      list.setAttribute('aria-label',label);
      field.before(wrapper);
      wrapper.append(field,list);
      bindings.push(()=>{
        const parts=details(select.value);
        list.replaceChildren(...parts.map(([name,value])=>{
          const line=document.createElement('div');
          const term=document.createElement('dt');
          const data=document.createElement('dd');
          term.textContent=name;data.textContent=value;
          line.append(term,document.createTextNode(' '),data);
          return line;
        }));
      });
    }

    add('kemat','Quy cách kệ TV',value=>cabinet(tvTen(value)));
    add('gmat','Quy cách tủ giày',value=>cabinet(giayTen(value,g('gacr')?.checked)));
    add('antu','Quy cách tủ rượu',value=>cabinet(ruouTen(value)));
    add('anbmat','Quy cách tủ trang trí',value=>cabinet('Thùng '+vachTen(value)+' + Cánh '+vachTen(value)));
    add('anbanmat','Quy cách bàn ăn',value=>spec('Vật liệu',bedTen(value)));
    add('khop','Quy cách vách phòng khách',value=>spec('Tấm ốp',vachTen(value)));
    add('thovach','Quy cách vách phòng thờ',value=>spec('Tấm ốp',vachTen(value)));
    add('lanh','Quy cách khung tủ lạnh',value=>value?cabinet(mn(value)):[['Quy cách','Chưa chọn khung tủ lạnh']]);
    add('kich','Quy cách tủ kịch trần',value=>{
      if(value==='khung')return [['Kết cấu','Khung bao và ốp mặt cánh']];
      return value?cabinet(mn(g('bepTren').value)):[['Quy cách','Chưa chọn tủ kịch trần']];
    });
    add('da','Quy cách mặt đá',value=>[['Bề mặt',value==='khong'?'Không chọn':g('da').selectedOptions[0].textContent]]);
    add('op','Quy cách ốp bếp',value=>[['Tấm ốp',value==='khong'?'Không chọn':g('op').selectedOptions[0].textContent]]);
    for(const room of ['master','n2','n3']){
      add('mat'+room,'Quy cách tủ áo',value=>cabinet(wardrobeTen(value,g('nk'+room)?.checked)));
      add('bmat'+room,'Quy cách giường',value=>[
        ['Khung giường',compact(bedTen(value))],
        ['Đầu giường',g('nem'+room)?.checked?'Có mút ốp':'Cùng vật liệu với khung'],
      ]);
      add('tdmd'+room,'Quy cách bàn trang điểm',value=>spec('Vật liệu',vachTen(value)));
    }
    function moveOption(selectId,optionId){
      const field=g(selectId)?.closest('.item-material');
      const option=g(optionId)?.closest('label');
      if(field&&option)field.querySelector('dl').before(option);
    }
    moveOption('gmat','gacr');
    for(const room of ['master','n2','n3']){
      moveOption('mat'+room,'nk'+room);
      moveOption('bmat'+room,'nem'+room);
    }
    const refresh=()=>bindings.forEach(update=>update());
    app.oninputMaterialDetails=refresh;
    refresh();
  };
})();
