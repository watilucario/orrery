
/* ---------- Entraînement : manipulation de chiffres et pièges chiffrés (sans calculatrice) ---------- */
/* Catégories, générateurs et pièges listés : calcul.js de la matière (CALCULS), chargés par activate() */
var DR_CATS=[],DR_GEN=[],DR_TRAPS=[];
function rp(a){return a[Math.floor(Math.random()*a.length)];}
function r2(x){return Math.round(x*100)/100;}
function E(x){return nb(fmtNum(r2(x)));}
function dq(c,q,a,u,sol,tip,o){
  var r={c:c,q:q,a:r2(a),u:u,sol:sol,tip:tip||"",tol:0,traps:[],b:false,neg:(a<0)},p;
  if(o){for(p in o){if(o.hasOwnProperty(p)){r[p]=o[p];}}}
  return r;
}
function tr(r,v,m){
  v=r2(v);
  if(Math.abs(v-r.a)>(r.tol||0)+0.009){r.traps.push({v:v,m:m});}
  return r;
}

/* moteur */
var DR=null,drCat="all",drLen=10,drT=null;
function drPick(cat,len){
  var gens=DR_GEN.filter(function(g){return cat==="all"||g.c===cat;}),out=[],last=-1,n,k;
  for(n=0;n<len;n++){
    do{k=Math.floor(Math.random()*gens.length);}while(gens.length>1&&k===last);
    last=k;var q=gens[k].f();q.g=DR_GEN.indexOf(gens[k]);out.push(q);  /* g : le générateur, pour les compteurs (v16, 03h) */
  }
  return out;
}
function openDrillStart(){
  if(drCat!=="all"&&!DR_CATS.some(function(c){return c.k===drCat;}))drCat="all";
  var cb=$("dr-cats"),lb=$("dr-lens"),opts=[["all",t("calc.tout")]].concat(DR_CATS.map(function(c){return [c.k,c.n];}));
  clear(cb);clear(lb);
  opts.forEach(function(o){
    var b=el("button","chip"+(drCat===o[0]?" sel":""),o[1]);b.type="button";
    b.addEventListener("click",function(){drCat=o[0];openDrillStart();});
    cb.appendChild(b);
  });
  [10,20,30].forEach(function(n){
    var b=el("button","chip"+(drLen===n?" sel":""),tn("calc.nb_q",n));b.type="button";
    b.addEventListener("click",function(){drLen=n;openDrillStart();});
    lb.appendChild(b);
  });
  var ul=$("dr-traps");clear(ul);DR_TRAPS.forEach(function(t){ul.appendChild(el("li","",t));});
  show("drillstart");
}
function startDrill(){
  DR={list:drPick(drCat,drLen),i:0,right:0,res:[],t0:0,cat:drCat,len:drLen,locked:false};
  show("drill");renderDrill();
}
function drStopT(){if(drT){clearInterval(drT);drT=null;}}
function drShowT(){var s=Math.floor((Date.now()-DR.t0)/1000);$("dr-time").textContent=mmss(s);$("dr-time").className="score"+(s>30?" over":"");}
function renderDrill(){
  var it=DR.list[DR.i],inp=$("dr-in");
  DR.locked=false;DR.conf=null;drConfRendre();
  $("dr-score").textContent=DR.right+" / "+DR.i;$("dr-score").hidden=!DR.i;
  $("dr-bar").style.width=Math.round(DR.i/DR.list.length*100)+"%";
  var cn=DR_CATS.filter(function(c){return c.k===it.c;})[0].n;
  $("dr-meta").textContent=t("calc.meta",{i:DR.i+1,n:DR.list.length,cat:cn});
  $("dr-q").textContent=nb(it.q);
  annexeReset("b-drbareme","drbareme",it.b);
  $("dr-unit").textContent=it.u;
  inp.value="";inp.disabled=false;
  if(it.neg){inp.removeAttribute("inputmode");inp.placeholder=t("calc.ph_neg");}
  else{inp.setAttribute("inputmode","decimal");inp.placeholder=t("calc.ph_nombre");}
  $("b-drok").hidden=false;$("dr-fb").hidden=true;$("b-drnext").hidden=true;$("dr-nextbar").hidden=true;
  DR.t0=Date.now();drStopT();drShowT();drT=setInterval(drShowT,1000);
  try{window.scrollTo(0,0);}catch(e){}
  try{inp.focus();}catch(e){}
}
function submitDrill(){
  if(!DR||DR.locked)return;
  var it=DR.list[DR.i],raw=trim($("dr-in").value),v=parseNum(raw),n;
  if(raw===""||isNaN(v)){$("dr-in").focus();return;}
  DR.locked=true;drStopT();
  var secs=Math.round((Date.now()-DR.t0)/1000),ok=numOk(it,v),trap=null;
  if(!ok){for(n=0;n<it.traps.length;n++){if(Math.abs(v-it.traps[n].v)<=(it.tol||0)+0.009){trap=it.traps[n].m;break;}}}
  if(ok)DR.right++;
  cptNoter("dr:"+it.c+"."+it.g,ok,DR.conf||null,false);drConfRendre();  /* v16 : la confiance, puis les compteurs (03h) */
  DR.res.push({c:it.c,q:it.q,ua:raw,ok:ok,t:secs,a:it.a,u:it.u,sol:it.sol,trap:trap});
  $("dr-in").disabled=true;$("b-drok").hidden=true;
  $("dr-score").textContent=DR.right+" / "+(DR.i+1);$("dr-score").hidden=false;
  $("dr-bar").style.width=Math.round((DR.i+1)/DR.list.length*100)+"%";
  var fb=$("dr-fb");fb.className="fb "+(ok?"ok":"ko");
  $("dr-fbh").textContent=ok?t(secs>30?"calc.juste_lent":"calc.juste",{s:secs}):t("calc.faux",{a:nb(fmtNum(it.a))+(it.u?" "+it.u:"")});
  var tp=$("dr-trap");tp.hidden=!trap;tp.textContent=trap?t("calc.piege",{m:trap}):"";
  $("dr-fbe").textContent=nb(it.sol);
  $("dr-fbt").textContent=it.tip?t("calc.astuce",{m:it.tip}):"";
  fb.hidden=false;
  var last=(DR.i===DR.list.length-1);
  $("b-drnext-t").textContent=t(last?"calc.voir_resultat":"calc.suivante");
  $("b-drnext").hidden=false;$("dr-nextbar").hidden=false;
  try{fb.scrollIntoView({block:"nearest"});}catch(e){}
  try{$("b-drnext").focus({preventScroll:true});}catch(e){}  /* Entrée passe à la suite ; sur téléphone, le clavier se ferme */
}
function nextDrill(){
  if(DR.i>=DR.list.length-1){finishDrill();return;}
  DR.i++;renderDrill();
}
function finishDrill(){
  drStopT();
  var res=DR.res,tot=res.length,right=DR.right,avg=0,n;
  for(n=0;n<tot;n++){avg+=res[n].t;}
  avg=tot?Math.round(avg/tot):0;
  $("drr-meta").textContent=t("calc.bilan_meta",{cat:DR.cat==="all"?t("calc.tout_melange"):DR_CATS.filter(function(c){return c.k===DR.cat;})[0].n});
  $("drr-score").textContent=right+" / "+tot;
  var traps=res.filter(function(r){return !!r.trap;}).length;
  $("drr-line").textContent=t("calc.temps_moyen",{s:avg})+(traps?" "+tn("calc.pieges",traps):"");
  var cb=$("drr-cats");clear(cb);
  DR_CATS.forEach(function(c){
    var t=0,ok=0,m;
    for(m=0;m<res.length;m++){if(res[m].c===c.k){t++;if(res[m].ok)ok++;}}
    if(!t)return;
    var row=el("div","row"),rl=el("div","rl");
    rl.appendChild(el("span","",c.n));rl.appendChild(el("b","",ok+" / "+t));
    var bar=el("div","bar"),fill=el("i");fill.style.width=Math.round(ok/t*100)+"%";bar.appendChild(fill);bar.style.marginBottom="0";
    row.appendChild(rl);row.appendChild(bar);cb.appendChild(row);
  });
  var tw=$("drr-traps"),seen={},list=[];
  clear(tw);
  res.forEach(function(r){if(r.trap&&!seen[r.trap]){seen[r.trap]=1;list.push(r.trap);}});
  $("drr-traps-wrap").hidden=(list.length===0);
  list.forEach(function(m){tw.appendChild(el("div","miss",m));});
  var mw=$("drr-missed"),missed=res.filter(function(r){return !r.ok;});
  clear(mw);$("drr-missed-wrap").hidden=(missed.length===0);
  missed.forEach(function(r){
    var d=el("div","miss");
    d.appendChild(el("div","mq",nb(r.q)));
    var p=el("p","");p.appendChild(el("span","lab",t("calc.ta_reponse")+" "));p.appendChild(document.createTextNode(nb(r.ua)));d.appendChild(p);
    var g=el("p","");g.appendChild(el("span","mb",t("calc.attendu")+" "));g.appendChild(document.createTextNode(nb(fmtNum(r.a))+(r.u?" "+r.u:"")));d.appendChild(g);
    d.appendChild(el("p","",nb(r.sol)));
    if(r.trap){d.appendChild(el("p","src",t("calc.piege",{m:r.trap})));}
    mw.appendChild(d);
  });
  var act=$("drr-actions");clear(act);
  act.appendChild(bigBtn(t("calc.relancer"),t("calc.relancer_s"),true,function(){startDrill();}));
  if(missed.length&&DR.cat==="all"){
    var cats={};missed.forEach(function(r){cats[r.c]=(cats[r.c]||0)+1;});
    var worst=null,k;for(k in cats){if(cats.hasOwnProperty(k)&&(!worst||cats[k]>cats[worst]))worst=k;}
    if(worst){act.appendChild(bigBtn(t("calc.insister"),t("calc.insister_s",{cat:DR_CATS.filter(function(c){return c.k===worst;})[0].n}),false,function(){drCat=worst;drLen=10;startDrill();}));}
  }
  act.appendChild(bigBtn(t("calc.autre_theme"),"",false,openDrillStart));
  act.appendChild(bigBtn(t("calc.retour_accueil"),"",false,function(){renderHome();show("home");}));
  show("drillres");
}
function renderDrillHome(){
  var box=$("drill-home");clear(box);
  if(!blocOn("calcul"))return;
  box.appendChild(carteMode("calcul",t("calc.carte_s",{themes:tn("calc.nb_themes",DR_CATS.length)}),openDrillStart));
}
$("b-drgo").addEventListener("click",startDrill);
$("dr-form").addEventListener("submit",function(ev){ev.preventDefault();submitDrill();});
$("b-drnext").addEventListener("click",nextDrill);
