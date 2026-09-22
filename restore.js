function vachP(mat){return mat==="ply_mel"?1650000:mat==="nhua_film"?1850000:1450000}
function vachTen(mat){return mat==="ply_mel"?"Plywood phủ MELAMINE":mat==="nhua_film"?"Nhựa đặc phủ MÀU":"MDF CA phủ MELAMINE"}
function banP(sz,mat){var base={14:4800000,16:5500000,18:6200000}[sz]||0;return base?(mat==="ply_mel"?base+500000:base):0}
function tabP(){return 1400000}
function hocP(){return 1200000}
function tdP(mat){return mat==="ply_mel"?2000000:mat==="nhua_film"?2200000:1800000}
(function(){
  if(S.an&&S.an.bmat==null)S.an.bmat="mdf_mel";
  if(S.an&&S.an.trang==null)S.an.trang=0;
  var _lines=lines;
  lines=function(){
    var L=_lines();
    function has(name){return L.some(function(x){return x[0].indexOf(name)===0})}
    if(S.rooms.khach&&S.kh.opm&&!has("Ốp vách trang trí"))L.push(["Ốp vách trang trí phòng khách","Vách "+vachTen(S.kh.op||"mdf_mel")+".",S.kh.opm*vachP(S.kh.op||"mdf_mel")]);
    if(S.rooms.an){
      if(S.an.trang&&!has("Tủ trang trí"))L.push(["Tủ trang trí phòng ăn","Thùng + cánh "+vachTen(S.an.bmat||"mdf_mel")+". Sâu 350 mm.",S.an.trang*keP(S.an.bmat||"mdf_mel")]);
      if(S.an.ban&&banP(S.an.ban,S.an.bmat||"mdf_mel")&&!has("Bàn ăn")){
        var bs=S.an.ban==="14"?"1m4":S.an.ban==="16"?"1m6":"1m8";
        L.push(["Bàn ăn",bedTen(S.an.bmat||"mdf_mel")+". Dài "+bs+".",banP(S.an.ban,S.an.bmat||"mdf_mel")]);
      }
    }
    if(S.rooms.tho&&S.tho.m2&&!has("Ốp vách phòng thờ"))L.push(["Ốp vách phòng thờ","Vách "+vachTen(S.tho.vach||"mdf_mel")+".",S.tho.m2*vachP(S.tho.vach||"mdf_mel")]);
    ["master","n2","n3"].forEach(function(id){
      if(!S.rooms[id])return;
      var n=S.ngu[id],ten=id==="master"?"master":id==="n2"?"2":"3";
      if(n.hoc&&!has("Hộc kéo giường "+ten))L.push(["Hộc kéo giường "+ten,n.hoc+" hộc.",n.hoc*hocP()]);
      if(+n.tab&&!has("Tab đầu giường "+ten))L.push(["Tab đầu giường "+ten,"Sâu 400–500 mm. Số lượng "+n.tab+".",(+n.tab)*tabP()]);
      if(+n.td&&!has("Bàn trang điểm ngủ "+ten))L.push(["Bàn trang điểm ngủ "+ten,vachTen(n.tdmd||"mdf_mel")+". Sâu 400–500 mm.",(+n.td)*tdP(n.tdmd||"mdf_mel")]);
    });
    return L;
  };
  var _grab=grab;
  grab=function(){
    _grab();
    if(g("anban"))S.an.ban=g("anban").value||"";
    if(g("anbmat"))S.an.bmat=g("anbmat").value||"mdf_mel";
    if(g("antrang"))S.an.trang=+g("antrang").value||0;
    if(g("khopm"))S.kh.opm=+g("khopm").value||0;
    if(g("khop"))S.kh.op=g("khop").value||"mdf_mel";
    if(g("thom2"))S.tho.m2=+g("thom2").value||0;
    if(g("thovach"))S.tho.vach=g("thovach").value||"mdf_mel";
    ["master","n2","n3"].forEach(function(id){
      if(g("hoc"+id))S.ngu[id].hoc=+g("hoc"+id).value||0;
      if(g("tab"+id))S.ngu[id].tab=g("tab"+id).value||"";
      if(g("td"+id))S.ngu[id].td=+g("td"+id).value||0;
      if(g("tdmd"+id))S.ngu[id].tdmd=g("tdmd"+id).value||"mdf_mel";
    });
  };
  function box(title,html){return '<div class="card extra-restored"><h2>'+title+'</h2>'+html+'</div>'}
  function inject(){
    if(document.querySelector(".extra-restored"))return;
    var mats=[["mdf_mel","MDF Melamine"],["ply_mel","Plywood Melamine"],["nhua_film","Nhựa phủ màu"]];
    var kh=[].slice.call(document.querySelectorAll(".card h2")).find(function(h){return h.textContent==="Phòng khách"});
    if(kh&&S.rooms.khach&&!g("khopm")){
      kh.parentNode.insertAdjacentHTML("beforeend",'<div class="grid"><label>Ốp vách (m²)<input id="khopm" type="number" step="0.1" value="'+(S.kh.opm||0)+'"></label><label>Vật liệu vách'+opt("khop",S.kh.op||"mdf_mel",mats)+'</label></div>');
    }
    var an=[].slice.call(document.querySelectorAll(".card h2")).find(function(h){return h.textContent==="Phòng ăn"});
    if(an&&S.rooms.an&&!g("anban")){
      an.parentNode.insertAdjacentHTML("beforeend",'<div class="grid"><label>Tủ trang trí (m²)<input id="antrang" type="number" step="0.1" value="'+(S.an.trang||0)+'"></label><label>Bàn ăn'+opt("anban",S.an.ban||"",[["","Không"],["14","1m4"],["16","1m6"],["18","1m8"]])+'</label></div><label>Vật liệu bàn / tủ trang trí'+opt("anbmat",S.an.bmat||"mdf_mel",mats)+'</label>');
    }
    if(S.rooms.tho&&!g("thom2")){
      var chips=document.querySelector(".chips");
      var host=chips&&chips.closest(".lay")?chips.parentNode:document.querySelector(".lay > div");
      if(host)host.insertAdjacentHTML("beforeend",box("Phòng thờ",'<div class="grid"><label>Ốp vách (m²)<input id="thom2" type="number" step="0.1" value="'+(S.tho.m2||0)+'"></label><label>Vật liệu vách'+opt("thovach",S.tho.vach||"mdf_mel",mats)+'</label></div>'));
    }
    ["master","n2","n3"].forEach(function(id){
      if(!S.rooms[id]||g("hoc"+id))return;
      var ten=id==="master"?"master":id==="n2"?"2":"3";
      var h=[].slice.call(document.querySelectorAll(".card h2")).find(function(x){return x.textContent==="Phòng ngủ "+ten});
      if(!h)return;
      var n=S.ngu[id];
      h.parentNode.insertAdjacentHTML("beforeend",'<div class="grid"><label>Hộc kéo giường<input id="hoc'+id+'" type="number" min="0" step="1" value="'+(n.hoc||0)+'"></label><label>Tab đầu giường'+opt("tab"+id,n.tab||"",[["","Không"],["1","1 cái"],["2","2 cái"]])+'</label></div><div class="grid"><label>Bàn trang điểm (m)<input id="td'+id+'" type="number" step="0.1" value="'+(n.td||0)+'"></label><label>Vật liệu bàn trang điểm'+opt("tdmd"+id,n.tdmd||"mdf_mel",mats)+'</label></div>');
    });
  }
  var _draw=draw;
  draw=function(){_draw();inject();if(typeof refreshQuote==="function")refreshQuote();}
})();
