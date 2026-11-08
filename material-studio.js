(() => {
  const finishes={
    mdf_mel:['Sồi sáng và kem','kitchen.webp'],
    ply_mel:['Vân sồi tự nhiên','material-ply_mel.webp'],
    mdf_acr:['Trắng kem bóng','material-mdf_acr.webp'],
    nhua_film:['Xanh sage mờ','material-nhua_film.webp'],
    nhua_acr:['Xám graphite bóng','material-nhua_acr.webp'],
    nhua_lam:['Vân óc chó','material-nhua_lam.webp'],
  };
  const targets={bepDuoi:'Tủ dưới',bepTren:'Tủ trên'};
  let active='bepDuoi';

  window.mountWotuMaterialStudio=function(card) {
    const section=document.createElement('section');
    section.className='material-studio noprint';
    section.innerHTML='<div class="material-intro"><div><span>WOTU MATERIAL STUDIO</span>'+
      '<h3>Thử phối vật liệu</h3></div><div class="material-targets" role="group" aria-label="Chọn hệ tủ"></div></div>'+
      '<figure class="material-frame"><img src="assets/kitchen.webp" width="960" height="960" alt="Phối cảnh tủ bếp">'+
      '<figcaption><span>Phối cảnh minh họa</span><strong></strong></figcaption></figure>'+
      '<div class="material-picks" role="group" aria-label="Chọn bộ vật liệu"></div>'+
      '<div class="material-spec" aria-live="polite"></div>'+
      '<p class="material-note">Màu và vân trên ảnh là mẫu minh họa. WOTU sẽ chốt theo mẫu vật liệu thực tế.</p>';
    const stage=section.querySelector('.material-frame');
    const image=stage.querySelector('img');
    const label=stage.querySelector('strong');
    const targetList=section.querySelector('.material-targets');
    const list=section.querySelector('.material-picks');
    const spec=section.querySelector('.material-spec');
    let requested='';
    for(const [id,name] of Object.entries(targets)){
      const button=document.createElement('button');
      button.type='button';button.dataset.materialTarget=id;button.textContent=name;
      targetList.append(button);
    }
    for(const material of MAT){
      const button=document.createElement('button');
      button.type='button';button.dataset.materialId=material.id;
      if(Object.hasOwn(finishes,material.id)){
        const thumb=document.createElement('img');
        thumb.src='assets/material-'+material.id+'-thumb.webp';
        thumb.width=192;thumb.height=192;thumb.alt='';
        button.append(thumb);
      }
      const name=document.createElement('span');
      name.textContent=material.short;
      button.append(name);
      list.append(button);
    }

    function sync(){
      const select=g(active);
      const id=select.value;
      const [finish,asset]=Object.hasOwn(finishes,id)?finishes[id]:['Phối cảnh chung','kitchen.webp'];
      const source='assets/'+asset;
      const currentSpec=card.querySelector('[data-material-for="'+active+'"]');
      label.textContent=targets[active]+' · '+finish;
      if(requested!==source){
        requested=source;
        const next=new Image();
        next.src=source;
        next.decode().then(()=>{
          if(requested!==source||!section.isConnected)return;
          image.src=source;
          image.alt='Phối cảnh minh họa '+finish.toLowerCase();
          if(!matchMedia('(prefers-reduced-motion: reduce)').matches)
            image.animate([{opacity:.65},{opacity:1}],{duration:260,easing:'ease-out'});
        }).catch(()=>{ if(requested===source){image.src='assets/kitchen.webp';label.textContent=targets[active]+' · Phối cảnh chung';} });
      }
      for(const button of targetList.children)button.setAttribute('aria-pressed',String(button.dataset.materialTarget===active));
      for(const button of list.children)button.setAttribute('aria-pressed',String(button.dataset.materialId===id));
      spec.replaceChildren();
      if(currentSpec)spec.append(currentSpec.cloneNode(true));
      spec.firstElementChild?.removeAttribute('data-material-for');
    }

    section.addEventListener('click',event=>{
      const target=event.target.closest('[data-material-target]');
      const material=event.target.closest('[data-material-id]');
      if(target){active=target.dataset.materialTarget;sync();}
      if(material){
        const select=g(active);
        select.value=material.dataset.materialId;
        select.dispatchEvent(new Event('input',{bubbles:true}));
        sync();
      }
    });
    card.addEventListener('input',event=>{
      if(!Object.hasOwn(targets,event.target.id))return;
      active=event.target.id;
      queueMicrotask(sync);
    });
    card.querySelector('h2').after(section);
    sync();
  };
})();
