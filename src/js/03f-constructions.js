/* ---------- Constructions (v8) : un tableau construit ligne par ligne, en touchant les cases de la liasse ----------
   Demande de l'auteur (18 oct.) : « on te demande quoi mettre ligne par ligne et à chaque ligne tu as un modèle de liasse
   fiscale qui apparaît vierge, avec bilan, compte de résultat et annexes, et tu sélectionnes la ou les cases
   nécessaires » ; la méthode vaut pour tout ce qui se construit (écritures comptables, calculs…). Contenu :
   univers/<programme>/<matière>/constructions.md (build.py : lire_constructions ; dans un pack : « # Constructions »,
   packConstructions, 02). Une construction = {id, t, th, docs (documents.md), u (unité), src, ctx (énoncé), mt (montants
   par code), ap (données hors liasse : {k, p, v}), sg (libellés des deux signes, sinon + et −), l : lignes {id, t,
   c : [{k, s : 1 ou −1}] (« @id » : une ligne déjà construite), adm (justes aussi, vides ici), r (résultat), e, ind}}.
   La liasse est vierge (codes et postes, sans « ce que l'analyse en fait ») ; « Avec les chiffres » y met les montants
   de l'énoncé. Vérifier : cases justes, en trop, au mauvais signe, et combien il en manque (pas lesquelles) ; indices
   (celui de la ligne, puis où chercher), correction. Gardé par ligne dans <préfixe>cons = {id : {at, l : {ligne : v}}},
   v = 1 juste du premier coup, 2 juste après une erreur ou un indice, 3 correction vue ; suivi sur le compte (07b, cons:<id>). */
var CONS=[],CONSBY={},KCONS="",CONSR={},CQ=null;
function consValide(o){
  if(!o||typeof o!=="object"||typeof o.at!=="number"||!o.l||typeof o.l!=="object"||o.l instanceof Array)return false;
  for(var k in o.l){if(o.l.hasOwnProperty(k)&&[1,2,3].indexOf(o.l[k])<0)return false;}
  return true;
}
function consCharger(M){
  CONS=M.CONS||[];CONSBY={};CQ=null;
  CONS.forEach(function(c){CONSBY[c.id]=c;});
  KCONS=M.pre+"cons";
  CONSR=load(KCONS,{});if(!CONSR||typeof CONSR!=="object"||CONSR instanceof Array)CONSR={};
  for(var k in CONSR){if(CONSR.hasOwnProperty(k)&&(!CONSBY[k]||!consValide(CONSR[k])))delete CONSR[k];}
}
/* Lignes faites d'une construction, et faites du premier coup */
function consEtat(c){
  var r=CONSR[c.id],l=r?r.l:{},f=0,p=0;
  c.l.forEach(function(L){if(l[L.id]){f++;if(l[L.id]===1)p++;}});
  return {f:f,p:p,n:c.l.length};
}
function consSignes(c){return !!c.sg||c.l.some(function(L){return L.c.some(function(x){return x.s<0;});});}
function consLab(c,s){return s>0?(c.sg?c.sg[0]:"+"):(c.sg?c.sg[1]:"−");}
function consFmt(v,c){return nb(figFmt(v)+(c.u?" "+c.u:""));}
/* Une case : son libellé, son code affiché (liasse) et son montant */
function consCase(c,k){
  if(k.charAt(0)==="@"){var L=c.l.filter(function(x){return x.id===k.slice(1);})[0];return {p:L?L.t:k,code:"",v:L&&L.r!=null?L.r:null};}
  var a=c.ap.filter(function(x){return x.k===k;})[0];
  if(a)return {p:a.p,code:"",v:a.v!=null?a.v:null};
  var e=DOC_PAR[k],col=e&&e.x.k2===k?1:0;
  return {p:e?e.x.p+(e.x.k2&&e.d.col?" ("+e.d.col[col].toLowerCase()+")":""):k,code:docCode(k)?k:"",v:c.mt.hasOwnProperty(k)?c.mt[k]:null};
}
function consCourt(s){return s.length>6?s.slice(0,5)+".":s;}

/* ---------- Liste ---------- */
function openConsList(){renderConsList();show("conslist");}
function renderConsList(){
  var box=$("cons-list");clear(box);
  $("cons-titre").textContent=nb(carteDe("construction").titre);
  CONS.forEach(function(c){
    var e=consEtat(c),st=consStatut(c);
    var b=bigBtn(c.t,themeName(c.th)+" · "+tn("cons.nb_ligne",e.n)+(c.docs.length?" · "+c.docs.map(function(d){return (DOCS.filter(function(x){return x.id===d;})[0]||{t:d}).t;}).join(", "):""),false,function(){openCons(c.id);},false,st);
    b.setAttribute("data-cons",c.id);
    box.appendChild(b);
  });
}

/* ---------- Une construction ---------- */
function consStatut(c){var e=consEtat(c);return e.f===e.n?t("cons.fait",{p:e.p,n:e.n}):e.f?tn("cons.en_cours",e.f,{t:e.n}):null;}
function openCons(id,neuf,ret){  /* ret (v13.3) : "chap" depuis la page d'un chapitre ; gardé pour « Refaire » */
  var c=CONSBY[id];if(!c)return;
  if(neuf){delete CONSR[id];save(KCONS,CONSR);}
  var r=CONSR[id],i=0;
  while(i<c.l.length&&r&&r.l[c.l[i].id])i++;
  CQ={c:c,i:i,sel:[],essais:0,ind:0,vu:false,ok:false,fb:null,tab:CQ&&CQ.c===c?CQ.tab:null,q:"",rempli:CQ&&CQ.c===c?CQ.rempli:false,ret:neuf&&CQ&&CQ.c===c?CQ.ret:(ret||null)};
  renderCons();show("cons");
}
function consLigne(){return CQ&&CQ.i<CQ.c.l.length?CQ.c.l[CQ.i]:null;}
function consNoter(v){
  var c=CQ.c,L=consLigne(),r=CONSR[c.id]||{at:0,l:{}};
  r.l[L.id]=v;r.at=Date.now();CONSR[c.id]=r;save(KCONS,CONSR);
}
/* Onglets de la palette : les documents de la construction, les données hors liasse, puis les lignes déjà faites */
function consOnglets(){
  var c=CQ.c,o=[];
  c.docs.forEach(function(d){var D=DOCS.filter(function(x){return x.id===d;})[0];if(D)o.push({id:"d:"+d,t:D.t,doc:D});});
  if(c.ap.length)o.push({id:"ap",t:t("cons.hors_liasse")});
  if(CQ.i>0)o.push({id:"lg",t:t("cons.tes_lignes")});
  return o;
}
function consSel(k){for(var n=0;n<CQ.sel.length;n++){if(CQ.sel[n].k===k)return CQ.sel[n];}return null;}
function consToucher(k){
  if(CQ.ok||CQ.vu)return;
  var x=consSel(k);
  if(x)CQ.sel.splice(CQ.sel.indexOf(x),1);else CQ.sel.push({k:k,s:1});
  CQ.fb=null;renderConsSel();renderConsPal();renderConsBar();renderConsFb();
}
/* Verdict sur la sélection : par case (ok, signe, trop) et nombre de cases manquantes */
function consJuger(){
  var L=consLigne(),sg=consSignes(CQ.c),ex={},par={},m=0,ko=0;
  L.c.forEach(function(x){ex[x.k]=x.s;});
  CQ.sel.forEach(function(x){
    if(ex.hasOwnProperty(x.k))par[x.k]=!sg||ex[x.k]===x.s?"ok":"signe";
    else par[x.k]=(L.adm||[]).indexOf(x.k)>=0?"adm":"trop";
    if(par[x.k]==="signe"||par[x.k]==="trop")ko++;
  });
  L.c.forEach(function(x){if(!consSel(x.k))m++;});
  return {par:par,manque:m,ok:!ko&&!m};
}
function consVerifier(){
  if(CQ.ok||CQ.vu)return;
  var j=consJuger();CQ.essais++;CQ.fb=j;
  if(j.ok){CQ.ok=true;consNoter(CQ.essais===1&&!CQ.ind?1:2);}
  renderCons();
  var f=$("cq-fb");if(f&&f.scrollIntoView)try{f.scrollIntoView({block:"nearest"});}catch(e){}
}
function consIndice(){
  var L=consLigne();
  CQ.ind=Math.min(CQ.ind+1,L.ind?2:1);
  renderConsFb();renderConsBar();
}
function consCorrection(){
  var L=consLigne();
  CQ.vu=true;CQ.sel=L.c.map(function(x){return {k:x.k,s:x.s};});CQ.fb=consJuger();
  consNoter(3);renderCons();
}
function consSuite(){
  CQ.i++;CQ.sel=[];CQ.essais=0;CQ.ind=0;CQ.vu=false;CQ.ok=false;CQ.fb=null;CQ.q="";
  renderCons();try{window.scrollTo(0,0);}catch(e){}
}
/* Les cases d'une ligne, une par rangée : signe, poste (code), montant ; puis le total */
function consFormule(c,L){
  var t=el("table","cq-f"),tb=el("tbody");
  L.c.forEach(function(x,n){
    var k=consCase(c,x.k),tr=el("tr");
    tr.appendChild(el("td","cq-f-s",n||x.s<0||c.sg?consLab(c,x.s):""));
    tr.appendChild(el("td","cq-f-p",nb(k.p+(k.code?" ("+k.code+")":""))));
    tr.appendChild(el("td","cq-f-v",k.v!=null?nb(figFmt(k.v)):""));
    tb.appendChild(tr);
  });
  if(!L.c.length){var tr0=el("tr");tr0.appendChild(el("td","cq-f-s",""));tr0.appendChild(el("td","cq-f-p",tx("cons.aucune_case")));tr0.appendChild(el("td","cq-f-v",""));tb.appendChild(tr0);}
  if(L.r!=null){var tr2=el("tr","cq-f-tot");tr2.appendChild(el("td","cq-f-s","="));tr2.appendChild(el("td","cq-f-p",nb(L.t)));tr2.appendChild(el("td","cq-f-v",consFmt(L.r,c)));tb.appendChild(tr2);}
  t.appendChild(tb);
  return t;
}

function renderCons(){
  var c=CQ.c,L=consLigne(),n=c.l.length,fin=!L;
  $("cq-eyebrow").textContent=nb(fin?t("cons.eyebrow_fin"):t("cons.eyebrow",{i:CQ.i+1,n:n}));
  $("cq-titre").textContent=nb(c.t);
  $("cq-bar").style.width=Math.round((fin?n:CQ.i)/n*100)+"%";
  var ctx=$("cq-ctx-d");ctx.hidden=!c.ctx;
  if(c.ctx){ctxRendre($("cq-ctx"),c.ctx);ctx.open=CQ.i===0&&!fin;}
  renderConsFait();
  $("cq-ligne").hidden=fin;$("cq-pal").hidden=fin;$("cq-bar-b").hidden=fin;$("cq-fin").hidden=!fin;
  if(fin){renderConsFin();return;}
  $("cq-l-t").textContent=nb(L.t);
  $("cq-l-s").textContent=nb((CQ.ok||CQ.vu)?"":t("cons.consigne",{signe:consSignes(c)?t("cons.consigne_signe",{a:consLab(c,1),b:consLab(c,-1)}):"",unite:c.u?t("cons.consigne_unite",{u:c.u}):""}));
  renderConsSel();renderConsFb();renderConsPal();renderConsBar();
}
/* Lignes déjà construites */
function renderConsFait(){
  var c=CQ.c,box=$("cq-fait"),r=CONSR[c.id],d=$("cq-fait-d");clear(box);
  d.hidden=CQ.i===0;
  if(CQ.i===0)return;
  var t=el("table","cq-t"),tb=el("tbody");
  c.l.slice(0,CQ.i).forEach(function(L){
    var tr=el("tr"),v=r&&r.l[L.id];
    tr.appendChild(el("td","cq-t-p",nb(L.t)));
    tr.appendChild(el("td","cq-t-v",L.r!=null?consFmt(L.r,c):"✓"));
    tr.appendChild(el("td","cq-t-m"+(v===1?" ok":""),v===1?tx("cons.m_premier"):v===2?tx("cons.m_essai"):v===3?tx("cons.m_corrige"):""));
    tb.appendChild(tr);
  });
  t.appendChild(tb);box.appendChild(t);
  $("cq-fait-t").textContent=nb(tx("cons.ton_tableau",{n:tn("cons.nb_ligne",CQ.i)}));
}
/* Cases choisies */
function renderConsSel(){
  var c=CQ.c,box=$("cq-sel"),sg=consSignes(c),j=CQ.fb;clear(box);
  if(!CQ.sel.length){box.appendChild(el("p","cq-vide",CQ.ok?t("cons.aucune_juste"):t("cons.aucune_choisie")));return;}
  CQ.sel.forEach(function(x){
    var k=consCase(c,x.k),st=j?j.par[x.k]:"",row=el("div","cq-s"+(st?" "+st:""));
    row.setAttribute("data-k",x.k);
    if(sg){
      var b=el("button","cq-sg",consLab(c,x.s));b.type="button";
      b.setAttribute("aria-label",t("cons.signe_aria",{s:consLab(c,x.s)}));
      b.disabled=CQ.ok||CQ.vu;
      b.addEventListener("click",function(){x.s=-x.s;CQ.fb=null;renderConsSel();renderConsFb();renderConsBar();});
      row.appendChild(b);
    }
    var tx=el("span","cq-s-p",nb(k.p));if(k.code)tx.appendChild(el("span","doc-k",k.code));row.appendChild(tx);
    if(k.v!=null&&(CQ.rempli||!DOC_PAR[x.k]||CQ.ok||CQ.vu))row.appendChild(el("span","cq-s-v",nb(figFmt(k.v))));
    if(st)row.appendChild(el("span","cq-s-st",st==="ok"?t("cons.st_ok"):st==="adm"?t("cons.st_adm"):st==="signe"?t("cons.st_signe"):t("cons.st_trop")));
    if(!CQ.ok&&!CQ.vu){var rm=el("button","cq-rm","✕");rm.type="button";rm.setAttribute("aria-label",t("cons.retirer",{p:k.p}));rm.addEventListener("click",function(){consToucher(x.k);});row.appendChild(rm);}
    box.appendChild(row);
  });
}
function renderConsFb(){
  var c=CQ.c,L=consLigne(),box=$("cq-fb"),j=CQ.fb;clear(box);
  var ind=null;
  if(CQ.ind&&!CQ.ok&&!CQ.vu){
    ind=el("div","cq-ind");
    if(L.ind)ind.appendChild(el("p",null,nb(t("cons.indice",{i:L.ind}))));
    if(CQ.ind>=(L.ind?2:1)){
      var ou={},ord=[];
      L.c.forEach(function(x){
        if(consSel(x.k))return;
        var t=x.k.charAt(0)==="@"?tx("cons.tes_lignes"):DOC_PAR[x.k]?DOC_PAR[x.k].d.t:tx("cons.hors_liasse");
        if(!ou[t]){ou[t]=0;ord.push(t);}ou[t]++;
      });
      ind.appendChild(el("p",null,ord.length?nb(t("cons.ou_chercher",{liste:ord.map(function(x){return x+" ("+ou[x]+")";}).join(", ")})):t("cons.rien_manque")));
    }
  }
  box.hidden=!j&&!ind;
  box.className="fb"+(j?(CQ.ok?" ok":CQ.vu?"":" ko"):"");
  if(j){
    if(CQ.ok||CQ.vu){
      box.appendChild(el("p","fbh",CQ.vu?t("cons.correction"):CQ.essais===1&&!CQ.ind?t("cons.juste_premier"):t("cons.juste")));
      box.appendChild(consFormule(c,L));
      box.appendChild(el("p",null,nb(L.e)));
    }else{
      var n={ok:0,adm:0,signe:0,trop:0},k;
      for(k in j.par){if(j.par.hasOwnProperty(k))n[j.par[k]]++;}
      var ph=[];
      if(n.ok+n.adm)ph.push(tn("cons.cases_justes",n.ok+n.adm));
      if(n.trop)ph.push(t("cons.en_trop",{n:n.trop}));
      if(n.signe)ph.push(tn("cons.signes_revoir",n.signe));
      if(j.manque)ph.push(t("cons.il_manque",{n:j.manque}));
      box.appendChild(el("p","fbh",t("cons.pas_encore")));
      box.appendChild(el("p",null,nb(ph.join(", ")+".")));
    }
  }
  if(ind)box.appendChild(ind);
}
/* Barre du bas : vérifier, indice, correction ; puis ligne suivante */
function renderConsBar(){
  var b=$("b-cq-ok"),fini=CQ.ok||CQ.vu,L=consLigne();
  b.querySelector(".t").textContent=fini?(CQ.i+1<CQ.c.l.length?t("cons.ligne_suiv"):t("cons.voir_tableau")):CQ.sel.length?t("cons.verifier_n",{n:tn("cons.nb_case",CQ.sel.length)}):t("cons.verifier_aucune");
  b.className="btn primary";
  $("b-cq-ind").hidden=fini||!(CQ.essais||L&&L.ind)||CQ.ind>=(L&&L.ind?2:1);
  $("b-cq-cor").hidden=fini||!(CQ.essais||CQ.ind);
}
/* Palette : la liasse vierge (ou avec les chiffres), les données hors liasse, les lignes déjà faites */
function renderConsPal(){
  var c=CQ.c,ong=consOnglets(),seg=$("cq-seg"),box=$("cq-doc"),q=trim(CQ.q),nq=docNorm(q),j=CQ.fb;
  if(!ong.some(function(o){return o.id===CQ.tab;}))CQ.tab=ong.length?ong[0].id:null;
  clear(seg);clear(box);
  seg.hidden=!!q||ong.length<2;
  ong.forEach(function(o){
    var b=el("button","chip"+(o.id===CQ.tab?" sel":""),nb(o.t));b.type="button";b.setAttribute("aria-pressed",o.id===CQ.tab?"true":"false");b.setAttribute("data-onglet",o.id);
    b.addEventListener("click",function(){CQ.tab=o.id;renderConsPal();box.scrollTop=0;});
    seg.appendChild(b);
  });
  var rm=$("cq-rempli");rm.hidden=!Object.keys(c.mt).length;
  $("b-cq-vierge").setAttribute("aria-pressed",CQ.rempli?"false":"true");$("b-cq-vierge").classList.toggle("sel",!CQ.rempli);
  $("b-cq-chiffres").setAttribute("aria-pressed",CQ.rempli?"true":"false");$("b-cq-chiffres").classList.toggle("sel",!!CQ.rempli);
  function cellule(k,col,v){
    var s=consSel(k),st=j&&s?j.par[k]:"",b=el("button","cq-c"+(s?" sel":"")+(st?" "+st:""));b.type="button";
    b.setAttribute("data-k",k);b.setAttribute("aria-pressed",s?"true":"false");
    if(col)b.appendChild(el("span","cq-c-col",consCourt(col)));
    if(docCode(k))b.appendChild(el("span","cq-c-k",k));
    if(v!=null)b.appendChild(el("span","cq-c-v",nb(figFmt(v))));
    if(!col&&!docCode(k)&&v==null)b.appendChild(el("span","cq-c-k",s?"✓":"+"));
    if(s&&consSignes(c))b.appendChild(el("span","cq-c-sg",consLab(c,s.s)));
    b.disabled=CQ.ok||CQ.vu;
    b.addEventListener("click",function(){consToucher(k);});
    return b;
  }
  function rangee(p,cells,vu){
    var r=el("div","cq-r"+(vu?" sel":""));
    r.appendChild(el("span","cq-p",nb(p)));
    var cs=el("span","cq-cs");cells.forEach(function(x){cs.appendChild(x);});r.appendChild(cs);
    return r;
  }
  function rangeeDoc(D,x){
    var cells=[cellule(x.k,x.k2&&D.col?D.col[0]:null,CQ.rempli&&c.mt.hasOwnProperty(x.k)?c.mt[x.k]:null)];
    if(x.k2)cells.push(cellule(x.k2,D.col?D.col[1]:null,CQ.rempli&&c.mt.hasOwnProperty(x.k2)?c.mt[x.k2]:null));
    return rangee(x.p,cells,consSel(x.k)||(x.k2&&consSel(x.k2)));
  }
  function trouve(t){return !q||docNorm(t).indexOf(nq)>=0;}
  var tr=0;
  ong.forEach(function(o){
    if(!q&&o.id!==CQ.tab)return;
    var wrap=el("div","doc");
    if(o.doc){
      if(!q&&o.doc.col)wrap.appendChild(el("p","cq-cols",nb(t("cons.colonnes",{c:o.doc.col.join(" · ")}))));
      o.doc.g.forEach(function(g){
        var xs=g.l.filter(function(x){return trouve(x.p+" "+x.k+" "+(x.k2||"")+" "+g.t);});
        if(!xs.length)return;
        var gr=el("div","doc-gr");if(g.t)gr.appendChild(el("p","doc-g",nb(g.t)));
        xs.forEach(function(x){gr.appendChild(rangeeDoc(o.doc,x));tr++;});
        wrap.appendChild(gr);
      });
    }else{
      var gr=el("div","doc-gr"),items=o.id==="ap"?c.ap.map(function(a){return {k:a.k,p:a.p,v:a.v};}):c.l.slice(0,CQ.i).map(function(L){return {k:"@"+L.id,p:L.t,v:L.r};});
      gr.appendChild(el("p","doc-g",o.id==="ap"?t("cons.donnees_enonce"):t("cons.lignes_faites")));
      items.filter(function(x){return trouve(x.p);}).forEach(function(x){gr.appendChild(rangee(x.p,[cellule(x.k,null,x.v!=null?x.v:null)],consSel(x.k)));tr++;});
      if(gr.childNodes.length>1)wrap.appendChild(gr);
    }
    if(!wrap.childNodes.length)return;
    if(q)box.appendChild(el("p","cq-qt",nb(o.t)));
    box.appendChild(wrap);
  });
  $("cq-nb").textContent=q?(tr?t("cons.pour",{n:tn("cons.nb_ligne",tr),q:q}):t("cons.rien_pour",{q:q})):"";
}
/* Fin : le tableau entier, ce qui est réussi du premier coup */
function renderConsFin(){
  var c=CQ.c,e=consEtat(c),box=$("cq-fin-c");clear(box);
  box.appendChild(el("p","cq-fin-s",nb(e.p===e.n?t("cons.fin_tout"):tn("cons.fin_n",e.p,{t:e.n}))));
  c.l.forEach(function(L){
    var d=el("details","cq-fin-l"),s=el("summary");
    s.appendChild(el("span","cq-t-p",nb(L.t)));
    s.appendChild(el("span","cq-t-v",L.r!=null?consFmt(L.r,c):""));
    d.appendChild(s);d.appendChild(consFormule(c,L));
    box.appendChild(d);
  });
  $("b-cq-fiche").hidden=!coursDe(c.th);
}
$("b-cq-ok").addEventListener("click",function(){if(CQ.ok||CQ.vu)consSuite();else consVerifier();});
$("b-cq-ind").addEventListener("click",consIndice);
$("b-cq-cor").addEventListener("click",consCorrection);
$("b-cq-vierge").addEventListener("click",function(){CQ.rempli=false;renderConsPal();renderConsSel();});
$("b-cq-chiffres").addEventListener("click",function(){CQ.rempli=true;renderConsPal();renderConsSel();});
$("cq-q").addEventListener("input",function(){CQ.q=this.value;renderConsPal();});
$("b-cq-refaire").addEventListener("click",function(){openCons(CQ.c.id,true);});
$("b-cq-liste").addEventListener("click",openConsList);
$("b-cq-fiche").addEventListener("click",function(){openFiche(CQ.c.th,CQ.ret==="chap"?"chap":"home");});
document.addEventListener("keydown",function(e){
  if(ECRAN!=="cons"||!CQ||!consLigne()||e.key!=="Enter")return;
  var t=e.target&&e.target.tagName;if(t==="INPUT"||t==="TEXTAREA"||t==="BUTTON")return;
  e.preventDefault();$("b-cq-ok").click();
});
