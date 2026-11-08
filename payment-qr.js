(() => {
  const bank={name:'Techcombank',bin:'970407',account:'8486123789',holder:'Từ Huy Tú'};
  const field=(id,value)=>id+String(value.length).padStart(2,'0')+value;

  function payload(amount,reference) {
    const beneficiary=field('00',bank.bin)+field('01',bank.account);
    const network=field('00','A000000727')+field('01',beneficiary)+field('02','QRIBFTTA');
    const body=field('00','01')+field('01','12')+field('38',network)+field('53','704')+
      field('54',String(amount))+field('58','VN')+field('62',field('08',reference))+'6304';
    let crc=0xffff;
    for (const byte of new TextEncoder().encode(body)) {
      crc^=byte<<8;
      for(let bit=0;bit<8;bit++) crc=((crc&0x8000)?(crc<<1)^0x1021:crc<<1)&0xffff;
    }
    return body+crc.toString(16).toUpperCase().padStart(4,'0');
  }

  window.wotuBank=bank;
  window.wotuPaymentQr=function(amount,reference) {
    const qr=qrcode(0,'M');
    qr.addData(payload(amount,reference));
    qr.make();
    return qr.createDataURL(5,20);
  };
})();
