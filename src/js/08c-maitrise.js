/* ---------- Grille de maîtrise (v5.1) : quatre marches par thème ----------
   Comprendre (sens, formules, pourquoi), savoir faire (bons chiffres, calculs justes, rien d'oublié), expliquer
   (constat, signification, causes) et recommander (solutions adaptées, avec leurs limites). Chaque question porte sa
   marche (« Niveau : » dans univers/, sinon celle par défaut du modèle selon son type). Une marche se valide par des
   preuves mesurées : mémoire des QCM (répétition espacée), cas guidé réussi en entier, exercices notés.
   Regards (« Regard : ») : comprendre au-delà du calcul ; la recette les nomme (blocs.maitrise.regards).
   Résultats des cas guidés : <préfixe>casr = {clé du cas: {at, ok, of, full, j}}, suivis sur le compte (07b).
   v16 « Exigence » (03h) : une marche QCM est validée quand une part de ses questions (80 %) est maîtrisée, d'après leurs
   compteurs ; un cas guidé doit être réussi en entier deux jours différents (j) ; un exercice compte si ses questions
   ont aussi été réussies deux jours différents. Une réponse juste « au hasard » ne compte jamais. */
var CASR={},KCASR,MAI_SEL=null;
function maiB(){return MAT&&MAT.blocs.maitrise;}
function maiNiv(id){var L=maiB().niveaux,n;for(n=0;n<L.length;n++){if(L[n].id===id)return L[n];}return null;}
function maiNom(id){var v=maiNiv(id);return v?v.nom:id;}
function maiCourt(v){return v.court||v.nom;}
function maiRegard(id){var L=(maiB()&&maiB().regards)||[],n;for(n=0;n<L.length;n++){if(L[n].id===id)return L[n];}return null;}
function maiDe(it){var d=maiB().defaut;return it.n||(it.cas?d.cas:d.qcm);}
function maiSub(s){var d=maiB().defaut;return s.n||(s.k==="num"?d.num:d.txt);}
function casrValide(o){return !!o&&typeof o==="object"&&typeof o.at==="number"&&typeof o.ok==="number"&&typeof o.of==="number";}
/* Fin d'une série (03, finish) : un cas guidé fait en entier garde son résultat du premier coup */
function casNoter(list,ans){
  if(!list.length||!list[0].cas)return;
  var k=list[0].cas,steps=CASQ[k],vu={},ok=0,n;
  if(!steps||list.some(function(x){return x.cas!==k;}))return;
  for(n=0;n<ans.length;n++){if(!vu.hasOwnProperty(ans[n].id)){vu[ans[n].id]=ans[n].ok;if(ans[n].ok&&ans[n].conf!=="guess")ok++;}}  /* v16 : « au hasard » ne compte pas */
  if(steps.some(function(x){return !vu.hasOwnProperty(x.id);}))return;
  var prev=CASR[k],j=casrJours(prev),td=today();
  if(ok===steps.length&&j.indexOf(td)<0)j.push(td);
  CASR[k]={at:Date.now(),ok:ok,of:steps.length,full:!!(ok===steps.length||(prev&&prev.full)),j:j};
  save(KCASR,CASR);
}
/* Score d'un exercice corrigé sur les questions d'une marche : 1 par réponse juste, 0,5 « À moitié » */
/* v16 : r2 = part de ces questions réussies au moins E.ex_jours jours différents, la dernière fois juste (compteurs, 03h) */
function maiExScore(e,idx){
  var st=EX[e.id],pts=0,non=0,E=exigence(),D=cptMat(MAT.k),dj=0;
  if(!st||!st.done)return null;
  idx.forEach(function(i){var t=cptTotal(cptEntree(exCptId(e,i),D.C,null,null));if(t.j>=E.ex_jours&&t.l===1)dj++;});
  idx.forEach(function(i){var s=e.subs[i],g;
    if(s.k==="num"){if(numOk(s,parseNum(st.a[i]))&&!(st.v&&st.v[i]===3))pts++;}  /* correction affichée en mode guidé (11) : pas une preuve */
    else{g=st.g[i];if(g===2)pts++;else if(g===1)pts+=0.5;else if(g===undefined)non++;}
  });
  return {r:pts/idx.length,non:non,r2:dj/idx.length};
}
/* Une case de la grille : ce qu'il y a à faire et où on en est. st : -1 rien à faire, 0 à faire, 1 en cours, 2 validée. */
function maiCase(th,lv){
  var B=maiB(),v=maiNiv(lv),parts=[],bits=[],E=exigence();
  var qs=Q.filter(function(x){return !x.cas&&x.th===th&&maiDe(x)===lv;});
  var cs=CAS.filter(function(c){return c.th===th&&c.steps.some(function(x){return maiDe(x)===lv;});});
  var ex=[];
  EXO.forEach(function(e){if(e.th!==th)return;var idx=[];e.subs.forEach(function(s,i){if(maiSub(s)===lv)idx.push(i);});if(idx.length)ex.push({e:e,idx:idx});});
  if(qs.length){
    var cb=cptBilan(qs),vues=qs.filter(function(x){return !!SRS.items[x.id];}).length;
    parts.push({k:"qcm",ok:cb.part>=E.part-1e-9,go:vues>0||cb.vues>0,list:cb.non.length?cb.non:qs,bil:cb,f:Math.min(1,cb.part/Math.max(.01,E.part))});
    bits.push(tn("mai.bit_qcm",cb.nm,{tot:cb.n,p:pct(cb.part),need:pct(E.part),suite:cb.tot?tn("mai.reussite",cb.tot,{r:pct(cb.reussite)}):t("mai.pas_reponse")}));
  }
  if(cs.length){
    var fait=function(c){return casrJours(CASR[c.k]).length>=E.cas;},faits=cs.filter(fait);
    parts.push({k:"cas",ok:faits.length===cs.length,go:cs.some(function(c){return !!CASR[c.k];}),list:cs.filter(function(c){return !fait(c);}),f:faits.length/cs.length});
    bits.push(tn("mai.bit_cas",cs.length,{f:faits.length,e:E.cas,suite:cs.length===1&&CASR[cs[0].k]?tn("mai.pour_linstant",casrJours(CASR[cs[0].k]).length):""}));
  }
  if(ex.length){
    var seuil=v.seuil==null?1:v.seuil,besoin=Math.min(v.preuves||1,ex.length),bons=0,non=0,commence=false,reste=[];
    ex.forEach(function(x){
      var sc=maiExScore(x.e,x.idx),st=EX[x.e.id];
      if(st&&(st.done||exAnswered(x.e,st)>0))commence=true;
      if(sc){non+=sc.non;if(sc.r>=seuil-1e-9&&sc.r2>=seuil-1e-9)bons++;else reste.push(x.e);}else reste.push(x.e);
    });
    parts.push({k:"ex",ok:bons>=besoin,go:commence,list:reste,f:Math.min(1,bons/Math.max(1,besoin))});
    bits.push(tn("mai.bit_ex",besoin,{b:bons,p:pct(seuil),j:E.ex_jours,suite:non?tn("mai.a_noter",non):""}));
  }
  if(!parts.length)return {st:-1,parts:parts,bits:bits};
  var ok=parts.every(function(p){return p.ok;}),go=parts.some(function(p){return p.go||p.ok;});
  var f=parts.reduce(function(a,x){return a+x.f;},0)/parts.length;
  return {st:ok?2:go?1:0,parts:parts,bits:bits,f:ok?1:f};
}
var MAI_ETAT=[t("mai.etat0"),t("mai.etat1"),t("mai.etat2")];
/* Pastille dessinée en CSS (vide, moitié, pleine) : un symbole de police manquait sur certains appareils */
function maiPast(st){var s=el("span","sym p"+st);s.setAttribute("aria-hidden","true");return s;}
/* Travailler une case : d'abord ce qui n'est pas validé, dans l'ordre QCM, cas, exercices */
function maiTravail(th,lv,c,ret){  /* ret (v13.3) : "chap" depuis la page du chapitre, pour y revenir */
  var p=c.parts.filter(function(x){return !x.ok;})[0]||c.parts[0];
  return function(){
    BACK=ret||"home";
    if(p.k==="qcm"){
      var L=p.list.slice().sort(function(a,b){var sa=SRS.items[a.id]?1:0,sb=SRS.items[b.id]?1:0;return sa-sb||srsRnow(a.id)-srsRnow(b.id);}).slice(0,15);
      start(L,themeName(th)+" · "+maiNom(lv),{exige:true});  /* v16 : confiance et rappel libre (03h) */
    }else if(p.k==="cas"){var k=(p.list[0]||CAS.filter(function(x){return x.th===th;})[0]).k;start(CASQ[k].slice(),themeName(th)+" · "+maiNom(lv));}
    else{var e=p.list[0]||EXO.filter(function(x){return x.th===th&&x.subs.some(function(s){return maiSub(s)===lv;});})[0];openEx(e.id,ret==="chap"?"chap":null);}
  };
}
/* Prochaine marche : la plus basse qui n'est pas validée, une case en cours d'abord, puis l'ordre des thèmes.
   P (v10, examPerim) : d'abord dans les thèmes au programme du prochain examen ; tout validé là, dans les autres. */
function maiProchaine(P){
  var L=maiB().niveaux,n,best=null;
  function chercher(ths){
    for(n=0;n<L.length&&!best;n++){
      ths.forEach(function(t){var c=maiCase(t.k,L[n].id);if(c.st===0||c.st===1){if(!best||(c.st===1&&best.c.st===0))best={th:t.k,lv:L[n].id,c:c};}});
    }
  }
  var T=perimTri(P,THEMES,function(t){return t.k;});
  chercher(T.de);if(!best&&T.hors.length)chercher(T.hors);
  return best;
}
/* Thèmes (v6.2) : une ligne par thème, avec ses marches (seulement celles qui existent pour lui : pas de case grise)
   et sa mémoire ; toucher un thème ouvre ses marches, chacune avec ses preuves et de quoi la travailler. */
function maiPuce(v,st){var s=el("span","mpuce p"+st,maiCourt(v).charAt(0));s.setAttribute("aria-hidden","true");return s;}
function renderMaitrise(){
  var box=$("maitrise");if(!box)return;clear(box);
  if(!MAT.ready)return;
  var B=maiB(),L=B.niveaux,tot=0,val=0,p=pool(),P=examPerim(),T=perimTri(P,THEMES,function(t){return t.k;});
  if(P){var pm=el("p","src mai-perim",nb(tn("mai.perim",P.n,{nom:P.x.nom})));pm.id="mai-perim";box.appendChild(pm);}
  var g=el("div","mgrid group");g.id="mgrid";box.appendChild(g);
  T.de.concat(T.hors).forEach(function(t,i){
    if(P&&i===T.de.length){g.appendChild(el("div","mrow mhors",nb(tx("mai.hors",{nom:P.x.nom}))));}
    var cases=L.map(function(v){return {v:v,c:maiCase(t.k,v.id)};}).filter(function(x){return x.c.st>=0;});
    cases.forEach(function(x){tot++;if(x.c.st===2)val++;});
    var row=el("div","mrow");
    var hb=el("button","mth-b");hb.type="button";hb.setAttribute("data-th",t.k);
    hb.appendChild(el("span","mth",t.n));
    var pu=el("span","mpuces");cases.forEach(function(x){pu.appendChild(maiPuce(x.v,x.c.st));});hb.appendChild(pu);
    var tq=pool().filter(function(x){return x.th===t.k;}),cb=cptBilan(tq);  /* v16 : la part maîtrisée, plus la mémoire */
    var mp=el("span","mpct",tq.length?pct(cb.part):"");mp.title=tx("mai.q_maitrisees");hb.appendChild(mp);
    hb.setAttribute("aria-label",tx("mai.aria_ligne",{nom:t.n,q:tq.length?tnx("mai.aria_q",cb.nm,{tot:cb.n,p:pct(cb.part),r:pct(cb.reussite)}):tx("mai.pas_qcm"),cases:cases.map(function(x){return x.v.nom+" "+MAI_ETAT[x.c.st];}).join(", ")}));
    hb.addEventListener("click",function(){openChap(t.k);});  /* v13.3 : la page du chapitre */
    row.appendChild(hb);
    g.appendChild(row);
  });
  var lg=el("p","statline mleg");lg.id="mai-bilan";
  lg.appendChild(document.createTextNode(L.map(function(v){return maiCourt(v).charAt(0)+" "+v.nom.toLowerCase();}).join(" · ")+" · "));
  [2,1,0].forEach(function(s){lg.appendChild(maiPast(s));lg.appendChild(document.createTextNode(" "+MAI_ETAT[s]+" · "));});
  lg.appendChild(document.createTextNode(t("mai.legende",{v:val,tot:tot})));
  box.appendChild(lg);
  /* Au-delà du calcul : les questions qui regardent le contexte, la valeur réelle, l'économie */
  var R=B.regards||[];
  if(!R.length)return;
  var rb=el("details","mregards");rb.id="mai-regards";
  rb.appendChild(el("summary",null,t("mai.au_dela",{n:R.length})));
  var rg=el("div","group");
  R.forEach(function(g2){
    var qs=Q.filter(function(x){return !x.cas&&x.r===g2.id;}),nx2=0;
    EXO.forEach(function(e){e.subs.forEach(function(s){if(s.r===g2.id||(e.r===g2.id&&!s.r))nx2++;});});
    var ok=qs.filter(function(x){var it=SRS.items[x.id];return it&&it.g>1;}).length;
    var stt=qs.length?t("mai.reg_stt",{ok:ok,n:qs.length,suite:nx2?t("mai.reg_ex_suite",{n:nx2}):""}):(nx2?t("mai.reg_ex_seul",{n:nx2}):t("mai.rien"));
    rg.appendChild(bigBtn(g2.nom,g2.quoi,false,function(){BACK="home";start(shuffle(qs),g2.nom);},!qs.length,stt));
  });
  rb.appendChild(rg);box.appendChild(rb);
}

/* ---------- Page d'un chapitre (v13.3) ----------
   Demande de l'auteur : le chapitre au centre. Un chapitre = un thème. Sa page : sa fiche, puis tout ce qui s'y entraîne
   (QCM du chapitre, cas, exercices, constructions), puis ses marches de maîtrise, puis le chapitre suivant. Les
   activités lancées d'ici y ramènent (BACK = "chap", EXS.ret, CQ.ret, NAV_PRE.fiche). MAI_SEL = {k, th} : le chapitre
   ouvert et sa matière ; chapTh() ne le rend que dans cette matière (activate passe par d'autres matières pour l'iPhone,
   les examens, « Aujourd'hui », puis revient). Rien n'est gardé en mémoire. */
function chapTh(){return MAI_SEL&&MAT&&MAI_SEL.k===MAT.k&&THEMES.some(function(t){return t.k===MAI_SEL.th;})?MAI_SEL.th:null;}
/* L'ordre du plan : les thèmes du prochain examen d'abord (perimTri), comme renderMaitrise */
function chapOrdre(){var T=perimTri(examPerim(),THEMES,function(t){return t.k;});return T.de.concat(T.hors);}
function openChap(th){
  if(!THEMES.some(function(t){return t.k===th;})){navHome();return;}
  MAI_SEL={k:MAT.k,th:th};renderChap();show("chap");
}
function maiCellule(th,v,c){
  var b=el("button","mcell s"+c.st);b.type="button";b.setAttribute("data-th",th);b.setAttribute("data-lv",v.id);
  b.appendChild(maiPast(c.st));
  var tx=el("span","mtx");
  tx.appendChild(el("span","mn",v.nom+" · "+MAI_ETAT[c.st]));
  c.bits.forEach(function(bt){tx.appendChild(el("span","mbit",nb(bt)));});
  tx.appendChild(el("span","mcrit",nb(t("mai.validee_quand",{c:v.critere}))));
  b.appendChild(tx);
  b.addEventListener("click",maiTravail(th,v.id,c,"chap"));
  return b;
}
function renderChap(){
  var th=MAI_SEL.th,O=chapOrdre(),k=O.map(function(t){return t.k;}).indexOf(th),nom=themeName(th),P=examPerim(),rien=true;
  var qs=pool().filter(function(x){return x.th===th;}),vus=qs.filter(function(x){return !!SRS.items[x.id];}).length;
  $("ch-eyebrow").textContent=nb(t("mai.chap_eyebrow",{k:k+1,n:O.length})+(P&&P.th[th]?t("mai.chap_au",{nom:P.x.nom}):""));
  $("ch-titre").textContent=nb(nom);
  var cbc=cptBilan(qs);
  var rr=$("ch-radar");if(rr){clear(rr);var RV=maiRadarVals(th);rr.appendChild(maiRadar(RV,180));}
  $("ch-etat").textContent=nb(qs.length?(vus||cbc.vues?t("mai.chap_etat",{nm:cbc.nm,n:qs.length,r:pct(cbc.reussite),p:pct(themeRecall(th)),vus:vus}):t("mai.chap_neuf",{q:tn("cours.nb_question",qs.length)})):"");
  var co=$("ch-cours");clear(co);
  if(coursDe(th)){
    var lu=COURS_LU[th],bc=bigBtn(t("mai.lire_cours"),t("cours.min_lecture",{n:coursMin(COURS[th])})+(typeof lu==="number"?t("mai.lu_le",{d:fmtDay(dayOf(lu))}):t("mai.a_lire")),typeof lu!=="number",function(){openFiche(th,"chap");});
    bc.id="b-mai-cours";co.appendChild(bc);rien=false;
  }
  var act=$("ch-act");clear(act);
  var g=el("div","group");
  if(qs.length){var bq=bigBtn(t("mai.qcm_chap"),t("mai.qcm_sous",{q:tn("cours.nb_question",qs.length)}),false,function(){BACK="chap";start(shuffle(qs),nom);});bq.id="b-ch-qcm";g.appendChild(bq);}
  CAS.filter(function(c){return c.th===th;}).forEach(function(c){
    var r=CASR[c.k],b=bigBtn(c.n,t("mai.cas_sous",{q:tn("mai.nb_etape",c.steps.length)}),false,function(){BACK="chap";start(CASQ[c.k].slice(),c.n);},false,r?(r.full?t("mai.reussi_entier"):t("mai.fait")):null);
    b.setAttribute("data-cas",c.k);g.appendChild(b);
  });
  EXO.filter(function(e){return e.th===th&&!e.tl;}).forEach(function(e){
    var b=bigBtn(e.t,t("mai.ex_sous",{q:tn("cours.nb_question",e.subs.length),min:e.min}),false,function(){openEx(e.id,"chap");},false,exStatus(e));
    b.setAttribute("data-ex",e.id);g.appendChild(b);
  });
  CONS.filter(function(c){return c.th===th;}).forEach(function(c){
    var b=bigBtn(c.t,t("mai.cons_sous",{q:tn("cons.nb_ligne",c.l.length)}),false,function(){openCons(c.id,false,"chap");},false,consStatut(c));
    b.setAttribute("data-cons",c.id);g.appendChild(b);
  });
  if(g.childNodes.length){act.appendChild(el("h2",null,t("mai.entrainer")));act.appendChild(g);rien=false;}
  carnetChap($("ch-carnet"),th);  /* v16 : les erreurs du chapitre (12o) */
  var mk=$("ch-marches");clear(mk);
  if(blocOn("maitrise")){
    var cases=maiB().niveaux.map(function(v){return {v:v,c:maiCase(th,v.id)};}).filter(function(x){return x.c.st>=0;});
    if(cases.length){
      mk.appendChild(el("h2",null,t("mai.tes_marches")));
      var d=el("div","mdet ch-marches");cases.forEach(function(x){d.appendChild(maiCellule(th,x.v,x.c));});mk.appendChild(d);rien=false;
    }
  }
  if(rien)co.appendChild(el("p","src",t("mai.rien_chap")));
  var su=$("ch-suite");clear(su);
  var nx=O[k+1];
  if(nx){var bs=bigBtn(t("mai.suivant",{nom:nx.n}),"",false,function(){openChap(nx.k);});bs.id="b-ch-suite";su.appendChild(bs);}
}

/* ---------- Radar de maîtrise (v26) : les quatre marches sur quatre axes ----------
   Demande de l'auteur (11 nov.) : voir d'un coup si l'on comprend, sait faire, sait expliquer, sait recommander, et où sont les trous.
   th = un chapitre, sinon toute la matière (moyenne des chapitres qui ont cette marche). Rend {vals:[0..1 ou null], moy}. */
function maiRadarVals(th){
  var L=maiB().niveaux,T=th?[{k:th}]:THEMES,vals=[],tot=0,n=0;
  L.forEach(function(v){
    var s=0,c=0;T.forEach(function(t){var x=maiCase(t.k,v.id);if(x.st>=0){s+=x.f;c++;}});
    vals.push(c?s/c:null);if(c){tot+=s/c;n++;}
  });
  return {vals:vals,moy:n?tot/n:0,niv:L};
}
function maiRadar(R,px){
  var NS="http://www.w3.org/2000/svg",S=px||200,c=S/2,r=S*.31,svg=document.createElementNS(NS,"svg"),i;
  function e(n,a){var x=document.createElementNS(NS,n),k;for(k in a)x.setAttribute(k,a[k]);return x;}
  svg.setAttribute("viewBox","0 0 "+S+" "+S);svg.setAttribute("class","radar");svg.setAttribute("role","img");
  svg.setAttribute("aria-label",t("mai.radar_aria",{liste:R.niv.map(function(v,j){return v.nom+" "+(R.vals[j]===null?t("mai.sans_objet"):pct(R.vals[j]));}).join(", ")}));
  var ang=[-Math.PI/2,0,Math.PI/2,Math.PI];
  [.5,1].forEach(function(k){svg.appendChild(e("polygon",{"class":"rd-g",points:ang.map(function(a){return (c+Math.cos(a)*r*k).toFixed(1)+","+(c+Math.sin(a)*r*k).toFixed(1);}).join(" ")}));});
  ang.forEach(function(a){svg.appendChild(e("line",{"class":"rd-g",x1:c,y1:c,x2:(c+Math.cos(a)*r).toFixed(1),y2:(c+Math.sin(a)*r).toFixed(1)}));});
  var pts=ang.map(function(a,j){var v=R.vals[j]===null?0:Math.max(.04,R.vals[j]);return (c+Math.cos(a)*r*v).toFixed(1)+","+(c+Math.sin(a)*r*v).toFixed(1);});
  svg.appendChild(e("polygon",{"class":"rd-p",points:pts.join(" ")}));
  ang.forEach(function(a,j){
    var v=R.vals[j]===null?0:Math.max(.04,R.vals[j]);svg.appendChild(e("circle",{"class":"rd-d",cx:(c+Math.cos(a)*r*v).toFixed(1),cy:(c+Math.sin(a)*r*v).toFixed(1),r:3}));
    var lx=c+Math.cos(a)*(r+12),ly=c+Math.sin(a)*(r+12)+(a===-Math.PI/2?-4:a===Math.PI/2?10:3),t=e("text",{"class":"rd-t",x:lx.toFixed(1),y:ly.toFixed(1),"text-anchor":a===0?"start":a===Math.PI?"end":"middle"});
    t.textContent=maiCourt(R.niv[j]);svg.appendChild(t);
  });
  return svg;
}
