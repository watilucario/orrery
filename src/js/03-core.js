/* ---------- Utilitaires ---------- */
function $(id){return document.getElementById(id);}
function nb(s){if(LANG!=="fr")return String(s);return String(s).replace(/(\d) (?=\d{3}(?!\d))/g,"$1 ").replace(/ (?=[€%:;?!»])/g," ").replace(/« /g,"« ");}
function shuffle(a){var b=a.slice(),n,m,t;for(n=b.length-1;n>0;n--){m=Math.floor(Math.random()*(n+1));t=b[n];b[n]=b[m];b[m]=t;}return b;}
function pickN(list,n){return shuffle(list).slice(0,n);}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;}
function clear(n){while(n.firstChild)n.removeChild(n.firstChild);}
function trim(s){return String(s==null?"":s).replace(/^\s+|\s+$/g,"");}
var SCREENS=["onb","creer","carte","prof","packs","sauve","evol","agenda","lire","plan","cours","fiche","docs","conslist","cons","qcm","caslist","hub","bach","home","chap","quiz","result","exlist","ex","simstart","sim","simres","drillstart","drill","drillres","recherche"];
/* Barre du haut et onglets : navMaj (12f) */
function show(id){
  var n;
  for(n=0;n<SCREENS.length;n++){$(SCREENS[n]).hidden=(SCREENS[n]!==id);}
  navMaj(id);
  try{calcEcran(id);}catch(e){}  /* 12q : la calculatrice seulement dans les cours et les calculs */
  selFermer();  /* v10.2 : la bulle de question sur une sélection (12i) se ferme quand on change d'écran */
  try{window.scrollTo(0,0);}catch(e){}
  ecranEntre(id);
}
/* v19 : un écran de rubrique arrive en douceur (fondu et légère montée) ; pas pendant un entraînement, ni sur la carte */
var ENTRE_SANS=["quiz","ex","sim","drill","cons","carte","creer"];
function ecranEntre(id){
  try{if(id==="hub"){ORR.rejouer=true;}else{cielDessiner(0,0,0,AST.sem);}}catch(e){}  /* 12w : le ciel, fixe hors de l'accueil */
  if(id==="fiche"||id==="prof"){try{ficheAppliquer();}catch(e){}}
  var sc=$(id);if(!sc||ENTRE_SANS.indexOf(id)>=0)return;
  try{sc.style.setProperty("--dx",(26*DIR_ONG)+"px");}catch(e){}
  sc.classList.remove("entre");void sc.offsetWidth;sc.classList.add("entre");
}
/* v19 : un écran sans rien à montrer dit à quoi il sert et propose un geste (titre, phrase, bouton facultatif) */
function etatVide(titre,texte,lib,fn,id){
  var c=el("div","vide"),ic=el("span","vide-ic");ic.setAttribute("aria-hidden","true");
  c.appendChild(ic);c.appendChild(el("p","vide-t",nb(titre)));c.appendChild(el("p","vide-s",nb(texte)));
  if(lib){var b=el("button","sbtn",lib);b.type="button";if(id)b.id=id;b.addEventListener("click",fn);c.appendChild(b);}
  return c;
}
function mmss(t){var m=Math.floor(t/60),s=t%60;return (m<10?"0":"")+m+":"+(s<10?"0":"")+s;}

/* ---------- Mémoire du navigateur ; erreurs, marques, exercices, série et simulation suivent aussi le compte (07b) ---------- */
var KMISS,KMARK,KEX,KSESS,KLAST;
function load(k,def){try{var v=localStorage.getItem(k);return v===null?def:JSON.parse(v);}catch(e){return def;}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}suiviChange(k);}
function drop(k){try{localStorage.removeItem(k);}catch(e){}suiviChange(k);}
function asArray(v){return (v instanceof Array)?v:[];}
var MISS=[],MARK=[],EX={},SESS=null,LASTEX=null;  /* chargés par activate() dans part_mats */

function setMiss(id,wrong){
  var p=MISS.indexOf(id);
  if(wrong&&p<0)MISS.push(id);
  if(!wrong&&p>=0)MISS.splice(p,1);
  save(KMISS,MISS);
}
function isMarked(id){return MARK.indexOf(id)>=0;}
function toggleMark(id){
  var p=MARK.indexOf(id);
  if(p>=0){MARK.splice(p,1);}else{MARK.push(id);}
  save(KMARK,MARK);
  return p<0;
}
function markedQ(){return MARK.filter(function(id){return !!BYID[id];}).map(function(id){return BYID[id];});}
function markedEx(){return EXO.filter(function(e){return isMarked("ex:"+e.id);});}
function saveSess(){
  if(!S)return;
  SESS={label:S.label,ids:S.list.map(function(x){return x.id;}),right:S.right,done:S.done,ans:S.ans,srs:!!S.srs};
  if(S.exige)SESS.exige=1;  /* v16 : série du carnet d'erreurs (confiance demandée, 03h) */
  save(KSESS,SESS);
}
function clearSess(){SESS=null;drop(KSESS);}

/* ---------- Accueil ---------- */
function bigBtn(title,sub,primary,fn,disabled,status){
  var b=el("button","btn"+(primary?" primary":""));b.type="button";
  b.appendChild(el("span","t",nb(title)));
  if(sub)b.appendChild(el("span","s",nb(sub)));
  if(status)b.appendChild(el("span","st",nb(status)));
  if(disabled){b.disabled=true;}else{b.addEventListener("click",fn);}
  return b;
}
function plural(n,w){return n+" "+w+(n>1&&!/[sxz]$/.test(w)?"s":"");}  /* « 3 cas », pas « 3 cass » */
function pluralRed(n){return n+" réponse"+(n>1?"s":"")+" rédigée"+(n>1?"s":"");}
/* Accueil d'une matière (v6.2). Chaque zone n'existe que si son bloc est actif dans la recette (buildHome, 08).
   En tête : le prochain examen (jamais un examen passé) et l'état de la matière en une phrase (renderEtat). */
function renderHome(){
  univSuivreMat();  /* la matière ouverte est retenue pour son univers (08b) */
  var nx=MAT.ready?prochainExam(MAT.k):null,td=today();
  if(nx){var j=examJour(nx);$("h-eyebrow").textContent=nb(nx.nom+" · "+fmtDay(j)+" · "+(j===td?tx("core.aujourdhui"):j===td+1?tx("core.demain"):tnx("core.dans_jours",j-td)));}
  $("h-eyebrow").hidden=!nx;$("h-alire").hidden=!nx;  /* v16 : « À lire avant » cet examen (12o) */
  if(nx)$("b-h-alire").onclick=function(){openLire(nx.id,"home");};
  $("h-plan").hidden=!(MAT.ready&&MAT.blocs.seance_du_jour);$("b-h-plan").onclick=function(){NAV_PRE.plan="home";openPlan(MAT.k);};
  $("h-title").textContent=MAT.titre;$("h-src").textContent=MAT.src;$("h-src-d").hidden=!MAT.src||!MAT.ready;
  $("home-body").hidden=!MAT.ready;$("home-empty").hidden=MAT.ready;
  renderEtat();
  clear($("home-remplir"));
  if(!MAT.ready){clear($("home-empty"));$("home-empty").appendChild(el("p",null,MAT.vide));crRemplir($("home-remplir"));return;}  /* v13 : un système de Maitrise à remplir (12l) */
  var rs=$("resume"),kp=$("keep"),p=pool();
  [rs,kp].forEach(function(z){if(z)clear(z);});
  if(rs&&blocOn("qcm")&&SESS&&SESS.ans.length<SESS.ids.length){
    rs.appendChild(bigBtn(tx("core.reprendre",{label:SESS.label}),tx("core.reprendre_sub",{i:SESS.ans.length+1,n:SESS.ids.length,right:SESS.right,done:SESS.done}),true,function(){BACK="home";resumeSess();}));
  }
  if(rs&&blocOn("exercices")&&LASTEX&&EXBY[LASTEX]&&EX[LASTEX]&&!EX[LASTEX].done&&exAnswered(EXBY[LASTEX],EX[LASTEX])>0){
    rs.appendChild(bigBtn(tx("core.reprendre_ex",{titre:EXBY[LASTEX].t}),tx("core.reprendre_ex_sub",{a:exAnswered(EXBY[LASTEX],EX[LASTEX]),n:EXBY[LASTEX].subs.length,chrono:mmss(EX[LASTEX].t)}),!SESS,function(){openEx(LASTEX);}));
  }
  if(blocOn("seance_du_jour"))renderToday();
  renderConseil();
  /* Une tuile par façon de réviser */
  if($("cours-home")){var Lc=coursListe();clear($("cours-home"));$("cours-home").appendChild(carteMode("cours",(synDe()?tx("core.synthese_plus"):"")+tnx("core.n_fiches",Lc.length)+" · "+tx("core.n_min",{n:Lc.reduce(function(n,t){return n+coursMin(COURS[t.k]);},synDe()?coursMin(SYN):0)})+(revueToutes()?" · "+tx("core.certifiees"):""),openCours));}
  if($("docs-home")){clear($("docs-home"));$("docs-home").appendChild(carteMode("documents",tnx("core.n_documents",DOCS.length)+" · "+tnx("core.n_lignes",DOCS.reduce(function(n,d){return n+docLignes(d);},0)),openDocs));}
  if($("cons-home")){clear($("cons-home"));$("cons-home").appendChild(carteMode("construction",tnx("core.n_tableaux",CONS.length)+" · "+tnx("core.n_lignes",CONS.reduce(function(n,c){return n+c.l.length;},0)),openConsList));}
  if($("qcm-home")){clear($("qcm-home"));$("qcm-home").appendChild(carteMode("qcm",tnx("core.n_questions",p.length),openQcm));}
  if($("cas-home")){clear($("cas-home"));$("cas-home").appendChild(carteMode("cas",tnx("core.n_cas",CAS.length),openCasList));}
  if($("ex-home")){clear($("ex-home"));$("ex-home").appendChild(carteMode("exercices",tnx("core.n_exercices",EXO.length)+" · "+exDurees(),function(){openExList(false);}));}
  if(blocOn("simulation"))renderSimHome();
  if(blocOn("calcul"))renderDrillHome();
  if(blocOn("maitrise")){renderMaitrise();homeLegende();}
  homeCoursListe();
  if(!kp)return;
  var mq=markedQ(),me=markedEx();
  carnetHome(kp);  /* v16 : le carnet d'erreurs de la matière (12o) remplace « Mes erreurs » */
  if(blocOn("qcm")){var bm=bigBtn(tx("core.marquees"),mq.length?tnx("core.marquees_n",mq.length):tx("core.marquees_aucune"),false,function(){BACK="home";start(shuffle(markedQ()),tx("core.marquees"));},mq.length===0);bm.id="b-keep-marq";kp.appendChild(bm);}
  if(blocOn("exercices"))kp.appendChild(bigBtn(tx("core.ex_marques"),me.length?tnx("core.ex_marques_n",me.length):tx("core.ex_marques_aucun"),false,function(){openExList(true);},me.length===0));
}
/* Onglet Cours : une ligne par chapitre (ouvre sa fiche), la synthèse en tête */
function homeCoursListe(){
  var box=$("h-cours-liste");if(!box)return;clear(box);
  var L=coursListe();
  if(synDe()){var lus=COURS_LU[SYN_K];box.appendChild(bigBtn(tx("core.synthese_titre"),tx("core.n_min",{n:coursMin(SYN)})+" · "+tx("core.synthese_sub")+(typeof lus==="number"?" · "+tx("core.lue"):""),false,function(){openFiche(SYN_K,"home");}));}
  if(blocOn("maitrise"))return;  /* sinon (matière sans grille) : une ligne par fiche */
  L.forEach(function(t,i){
    var lu=COURS_LU.hasOwnProperty(t.k),sub=tx("core.n_min",{n:coursMin(coursDe(t.k))})+(certifiee(t.k)?" · "+tx("core.certifie"):lu?" · "+tx("core.lu"):" · "+tx("core.pas_lu"));
    box.appendChild(bigBtn((i+1)+". "+t.n,sub,false,function(){openFiche(t.k,"home");}));
  });
}
/* Onglet Maîtrise : à quoi servent les quatre marches (comprendre, savoir faire, expliquer, recommander) */
function homeLegende(){
  var box=$("mai-legende");if(!box)return;clear(box);
  var d=el("details","h-src");d.appendChild(el("summary",null,tx("core.marches_titre")));
  d.appendChild(el("p","src",nb(tx("core.marches_texte"))));
  var ol=el("ol","mai-marches");
  maiB().niveaux.forEach(function(v){var li=el("li");li.appendChild(el("b",null,v.nom));li.appendChild(document.createTextNode(tx("core.sep")+(v.quoi||"")));ol.appendChild(li);});
  d.appendChild(ol);box.appendChild(d);
}
/* État de la matière en une phrase : la part du cours que tu retrouverais aujourd'hui = vu × retenu (v6.2) */
function renderEtat(){
  var box=$("h-etat");clear(box);
  if(!MAT.ready||!blocOn("qcm"))return;
  var all=pool().map(function(it){return it.id;}),vus=srsSeen(),c=el("div","etat etat-mai");
  var P=examPerim(),M=blocOn("maitrise")?maiRadarVals(null):null;
  if(M){
    var rd=el("div","etat-radar");rd.appendChild(maiRadar(M,200));c.appendChild(rd);
  }
  var t=el("div","etat-l"),bloc=el("div","etat-tx");
  if(M){
    bloc.appendChild(el("p","eyebrow",tx("core.maitrise_matiere")));
    var vv=M.vals.map(function(v,j){return {v:v,j:j};}).filter(function(x){return x.v!==null;}),mn=vv.length?vv.sort(function(a,b){return a.v-b.v;})[0]:null;
    var gt=el("p","etat-t");gt.appendChild(el("b",null,pct(M.moy)));
    gt.appendChild(document.createTextNode(M.moy<.005?tx("core.pas_commence_suite"):tx("core.valide_suite")));bloc.appendChild(gt);
    if(mn&&M.moy>=.005)bloc.appendChild(el("p","src",nb(tx("core.point_faible",{nom:M.niv[mn.j].nom.toLowerCase(),pct:pct(mn.v)}))));
    else bloc.appendChild(el("p","src",nb(tx("core.premieres_questions"))));
  }else{
    var ph=el("p","etat-t");
    if(vus.length){ph.appendChild(document.createTextNode(tx("core.retiens_avant")));ph.appendChild(el("b",null,pct(srsRecallAvg(all))));ph.appendChild(document.createTextNode(tx("core.retiens_apres")));}
    else ph.textContent=tx("core.pas_commence");
    bloc.appendChild(ph);
  }
  bloc.appendChild(el("p","src",nb(vus.length?tx("core.vu_sur",{vus:vus.length,all:all.length,pct:pct(srsRecallAvg(vus))}):tnx("core.dans_matiere",all.length))));
  if(P){
    var de=pool().filter(function(it){return P.th[it.th];}).map(function(it){return it.id;}),dv=de.filter(function(id){return !!SRS.items[id];});
    var pe=el("p","src etat-perim",nb(tx("core.perim_etat",{nom:P.x.nom,themes:tnx("core.n_themes",P.n),de:P.de,vu:dv.length,tot:de.length,pct:pct(srsRecallAvg(de))})));
    pe.id="h-perim";bloc.appendChild(pe);
  }
  var lk=el("button","link",tx("core.progres"));lk.type="button";lk.id="b-evol-home";lk.addEventListener("click",function(){openEvol("home");});bloc.appendChild(lk);
  t.appendChild(bloc);c.appendChild(t);
  box.appendChild(c);
}
/* « Ensuite, on te conseille » : une seule carte, choisie par l'app, avec sa raison */
function renderConseil(){
  var box=$("conseil");if(!box)return;clear(box);
  var td=today(),ex=examDay(),c=null,m,fi,P=examPerim(),Lc=coursListe().filter(function(t){return perimDans(P,t.k);});
  /* Programme choisi (v10) : les erreurs et la simulation qui comptent sont celles de ses thèmes */
  var MS=P?MISS.filter(function(id){return BYID[id]&&P.th[BYID[id].th];}):MISS;
  var simTard=blocOn("simulation")&&perimDans(P,(EXBY[SIM_CAS]||{}).th)&&ex!==null&&ex>=td&&ex-td<=7&&!SIMH.some(function(h){return dayOf(h.at)>=td-7;})&&!(SIM&&!SIM.sub);
  /* Cours (v7.2) : tant qu'aucune fiche n'est ouverte, on commence par là */
  if(Lc.length&&!Lc.some(function(t){return COURS_LU.hasOwnProperty(t.k);})){
    c=[tx("core.cons_cours"),tx("core.cons_cours_sub",{fiches:tnx("core.n_fiches",Lc.length)}),openCours];
  }else if(blocOn("qcm")&&MS.length>=3){
    m=Math.max(1,Math.round(MS.length*secPerQ()/60));
    c=[tnx("core.cons_erreurs",MS.length),tx("core.cons_erreurs_sub",{n:m}),function(){BACK="home";start(shuffle(MS.map(function(id){return BYID[id];})),tx("core.mes_erreurs"));}];
  }else if(simTard){
    c=[tx("core.cons_sim"),tx("core.cons_sim_sub",{jours:tnx("core.n_jours",ex-td)}),openSimStart];
  }else if(blocOn("maitrise")&&(m=maiProchaine(P))&&m.lv===maiB().niveaux[0].id&&(fi=coursDe(m.th))&&!COURS_LU.hasOwnProperty(m.th)){
    c=[tx("core.cons_fiche",{theme:themeName(m.th)}),tx("core.cons_fiche_sub",{n:coursMin(fi),marche:maiNom(m.lv)}),function(){openFiche(m.th,"home");}];
  }else if(m){
    var pk=(m.c.parts.filter(function(x){return !x.ok;})[0]||m.c.parts[0]||{}).k,gen={qcm:tx("core.gen_qcm"),cas:tx("core.gen_cas")}[pk]||tx("core.gen_ex");
    c=[tx("core.cons_marche",{theme:themeName(m.th),marche:maiNom(m.lv)}),tx("core.cons_marche_sub",{gen:gen,quoi:maiNiv(m.lv).quoi}),maiTravail(m.th,m.lv,m.c)];
  }else if(blocOn("qcm")&&MS.length){
    c=[MS.length>1?tx("core.refais_n",{n:MS.length}):tx("core.refais_une"),tx("core.refais_sub"),function(){BACK="home";start(shuffle(MS.map(function(id){return BYID[id];})),tx("core.mes_erreurs"));}];
  }
  if(!c)return;
  box.appendChild(el("h2",null,tx("core.ensuite")));
  var b=bigBtn(c[0],c[1],false,c[2]);b.id="b-conseil";box.appendChild(b);
}
function exDurees(){var m=EXO.map(function(e){return e.min||0;}).filter(function(x){return x>0;});if(!m.length)return tx("core.quelques_minutes");var a=Math.min.apply(null,m),b=Math.max.apply(null,m);return a===b?tx("core.n_min",{n:a}):tx("core.min_a_min",{a:a,b:b});}
/* Écran QCM d'une matière : séries et thèmes */
function openQcm(){renderQcm();show("qcm");}
function renderQcm(){
  var main=$("main-btns"),th=$("themes"),p=pool(),pl=quickPlan(),P=examPerim();
  clear(main);clear(th);
  /* Programme du prochain examen (v10) : toutes ses questions d'abord, ses thèmes en tête */
  if(P){
    var de=p.filter(function(x){return P.th[x.th];}),bp=bigBtn(tx("core.prog_tout",{nom:P.x.nom}),tx("core.prog_tout_sub",{questions:tnx("core.n_questions",de.length),themes:tnx("core.n_themes",P.n)}),false,function(){BACK="qcm";start(interleave(shuffle(de)),P.x.nom);});
    bp.id="b-qcm-perim";main.appendChild(bp);
  }
  if(pl.n)main.appendChild(bigBtn(tx("core.serie_rapide"),tnx("core.serie_rapide_sub",pl.t,{q:pl.n})+(P?tx("core.du_exam",{nom:P.x.nom}):""),false,function(){BACK="qcm";startQuick();}));
  main.appendChild(bigBtn(tx("core.toutes"),tnx(P?"core.toutes_sub_matiere":"core.toutes_sub",p.length),false,function(){BACK="qcm";start(shuffle(p),tx("core.toutes"));}));
  var T=perimTri(P,THEMES,function(t){return t.k;});
  function bouton(t){
    var list=p.filter(function(x){return x.th===t.k;});
    th.appendChild(bigBtn(t.n,tnx("core.theme_sub",list.length,{pct:pct(themeRecall(t.k))}),false,function(){BACK="qcm";start(shuffle(list),t.n);},false,P&&P.th[t.k]?tx("core.au_exam",{nom:P.x.nom}):null));
  }
  T.de.forEach(bouton);
  if(T.hors.length){th.appendChild(perimHors(P));T.hors.forEach(bouton);}
}
/* Écran des cas guidés d'une matière */
function openCasList(){renderCasList();show("caslist");}
function renderCasList(){
  var cs=$("cas"),P=examPerim(),T=perimTri(P,CAS,function(c){return c.th;});
  clear(cs);
  function bouton(c){cs.appendChild(bigBtn(c.n,tnx("core.cas_sub",c.steps.length),false,function(){BACK="caslist";start(CASQ[c.k].slice(),c.n);},false,P&&P.th[c.th]?tx("core.au_exam",{nom:P.x.nom}):null));}
  T.de.forEach(bouton);
  if(T.hors.length){cs.appendChild(perimHors(P));T.hors.forEach(bouton);}
}
/* Série rapide : le nombre de questions par thème vient de la recette (bloc qcm, serie_rapide) */
/* Avec un programme d'examen choisi (v10) : seulement ses thèmes */
function quickPlan(){var n=0,t=0,k,P=examPerim();for(k in MAT.plan){if(MAT.plan.hasOwnProperty(k)&&MAT.plan[k]>0&&perimDans(P,k)){n+=MAT.plan[k];t++;}}return {n:n,t:t};}
function startQuick(){
  var p=pool(),plan=MAT.plan,sel=[],k,P=examPerim();
  for(k in plan){if(plan.hasOwnProperty(k)&&perimDans(P,k)){sel=sel.concat(pickN(p.filter(function(x){return x.th===k;}),plan[k]));}}
  start(shuffle(sel),tx("core.serie_rapide"));
}

/* ---------- Quiz ---------- */
var S=null;
function start(list,label,opts){
  if(!list.length)return;
  S={list:list,label:label,i:0,right:0,done:0,ans:[],locked:false,perm:null,ai:null,srs:!!(opts&&opts.srs),reins:{},sel:null,cache:choixActif()};
  if(opts&&opts.exige)S.exige=true;
  saveSess();show("quiz");renderQ();
}
function resumeSess(){
  if(!SESS)return;
  var list=[],n;
  for(n=0;n<SESS.ids.length;n++){if(BYID[SESS.ids[n]])list.push(BYID[SESS.ids[n]]);}
  if(!list.length||SESS.ans.length>=list.length){clearSess();renderHome();return;}
  S={list:list,label:SESS.label,i:SESS.ans.length,right:SESS.right,done:SESS.done,ans:SESS.ans.slice(),locked:false,perm:null,ai:null,srs:!!SESS.srs,reins:{},sel:null,cache:choixActif()};
  if(SESS.exige)S.exige=true;
  show("quiz");renderQ();
}
/* La confiance s'ouvre sous la réponse choisie ; hors de la liste, elle attend dans #conf-home */
function parkConf(){var c=$("conf"),h=$("conf-home");c.hidden=true;if(c.parentNode!==h)h.appendChild(c);}
/* « Question suivante » vit dans une barre collée au bas de l'écran (.nextbar), sous le pouce */
function showNext(on){$("b-next").hidden=!on;$("nextbar").hidden=!on;}
function showAsk(on){$("ask").hidden=!on;$("ai-cost").hidden=!on||!!(S&&S.i>0);copieIaMaj();}  /* le forfait : dit une fois par série ; sans l'aide de Claude, la copie pour une autre IA (12h) */
function updateMark(){
  var it=S.list[S.i],on=isMarked(it.id),b=$("b-mark");
  b.textContent=on?tx("core.marquee"):tx("core.marquer");
  b.setAttribute("aria-pressed",on?"true":"false");
}
function renderQ(){
  var it=S.list[S.i],n,perm=[];
  for(n=0;n<it.o.length;n++)perm.push(n);
  S.perm=it.fixed?perm:shuffle(perm);
  S.locked=false;S.sel=null;
  resetAsk();
  parkConf();
  $("score").textContent=S.right+" / "+S.done;$("score").hidden=!S.done;
  $("pbar").style.width=Math.round(S.i/S.list.length*100)+"%";
  var meta=S.label+" · "+(S.i+1)+" / "+S.list.length+(S.label===themeName(it.th)||S.label.indexOf(themeName(it.th)+" · ")===0?"":" · "+themeName(it.th));
  if(blocOn("maitrise")){if(it.n&&S.label.indexOf(" · "+maiNom(it.n))<0)meta+=" · "+maiNom(it.n);if(it.r&&maiRegard(it.r)&&S.label!==maiRegard(it.r).nom)meta+=" · "+maiRegard(it.r).nom;}
  $("qmeta").textContent=meta;
  updateMark();
  var cx=$("ctx");
  if(it.ctx){ctxRendre(cx,it.ctx);cx.hidden=false;}else{cx.hidden=true;}  /* tableaux et figures : 03c (v7.3) */
  $("qtext").textContent=nb(it.q);
  annexeReset("b-bareme","bareme",it.b);
  repInit("b-rep","rep",repDe(it));  /* lignes des documents types (v7.3, 03e) */
  var box=$("opts");clear(box);S.btns=[];
  var rl=rappelRendre(it);
  if(it.t==="associer"||it.t==="ordonner"){actRendre(it,box);$("q-kbd").textContent=tx("core.clavier_act");}  /* v13.4 (03g) */
  else if(!rl)S.perm.forEach(function(orig,pos){  /* question déjà sue : sans les choix (03b) */
    var b=el("button","opt");b.type="button";S.btns.push(b);
    b.appendChild(el("span","k",String.fromCharCode(65+pos)));
    b.appendChild(el("span","x",nb(it.o[orig])));
    b.setAttribute("data-k",orig);
    b.addEventListener("click",function(){if(confDemandee()){selectOpt(orig);}else{choose(orig);}});  /* confiance : 03h */
    box.appendChild(b);
  });
  choixRendre(it,rl);  /* choix cachés d'abord (v16, 03b) */
  $("fb").hidden=true;showNext(false);
  tipsQ();
}
function selectOpt(orig){
  if(S.locked)return;
  S.sel=orig;
  var c=$("conf"),at=null;
  S.btns.forEach(function(b){var on=parseInt(b.getAttribute("data-k"),10)===orig;b.className="opt"+(on?" sel open":"");if(on)at=b;});
  if(at)at.parentNode.insertBefore(c,at.nextSibling);
  c.hidden=false;
  try{c.scrollIntoView({block:"nearest"});}catch(e){}
}
/* spec (v13.4, 03g) : réponse d'un « associer » ou d'un « ordonner », déjà corrigée à l'écran : {ok, txt} */
function choose(orig,conf,spec){
  if(S.locked)return;
  S.locked=true;parkConf();choixInter();
  var it=S.list[S.i],ok=spec?spec.ok:(orig===it.c),btns=S.btns,n,k,pos,right="";
  for(n=0;n<btns.length;n++){
    var b=btns[n];k=parseInt(b.getAttribute("data-k"),10);
    b.className="opt locked";
    var kb=b.firstChild;
    if(k===it.c){b.className+=" correct";kb.textContent="✓";}
    else if(k===orig){b.className+=" wrong";kb.textContent="✗";}
    else{b.className+=" dim";}
  }
  for(pos=0;pos<S.perm.length;pos++){if(S.perm[pos]===it.c)right=String.fromCharCode(65+pos);}
  S.done++;if(ok)S.right++;
  var rep={id:it.id,th:it.th,ok:ok,pick:orig,conf:conf||null};
  if(spec)rep.txt=spec.txt;
  if(S.rl){rep.rl=1;rep.txt=S.rl.txt;}  /* rappel libre (03b) : la réponse tapée, jugée par l'élève */
  S.ans.push(rep);
  cptNoter(it.id,ok,conf,!!S.rl);  /* v16 (03h) : avant setMiss et srsReview, pour reconstruire l'avant v16 */
  setMiss(it.id,!ok);
  var mem=srsReview(it.id,ok,conf),note=[];
  if(!ok&&conf==="sure")note.push(tx("core.erreur_sure"));
  if(S.srs&&srsGrade(ok,conf)===1){
    var rc=S.reins[it.id]||0;
    if(rc<REPRISE_MAX){S.reins[it.id]=rc+1;S.list.splice(Math.min(S.i+REPRISE_ECART,S.list.length),0,it);note.push(tx("core.revient"));}
  }
  if(mem)note.push(tx("core.prochaine_rev",{quand:inDays(mem.due)}));
  saveSess();
  $("score").textContent=S.right+" / "+S.done;$("score").hidden=!S.done;
  var fb=$("fb");fb.className="fb "+(ok?"ok":"ko");
  $("fbh").textContent=ok?tx("core.juste"):spec?tx("core.rate_marquee"):S.rl?tx("core.rate_relis"):tx("core.rate_bonne",{lettre:right,texte:nb(it.o[it.c])});
  $("fbe").textContent=nb(it.e);
  $("fbs").textContent=tx("core.source",{s:it.s});
  coursFb(it);repFb(it);
  $("fbn").textContent=note.join(" ");$("fbn").hidden=!note.length;
  fb.hidden=false;
  if(pauseDue()){CHAIN.shown=true;$("pause").hidden=false;}
  var last=(S.i===S.list.length-1);
  $("b-next-t").textContent=last?tx("core.voir_resultat"):tx("core.question_suivante");
  showNext(true);
  showAsk(aiOn());
  tipsFb();
  $("pbar").style.width=Math.round((S.i+1)/S.list.length*100)+"%";
  try{fb.scrollIntoView({block:"nearest"});}catch(e){}
}
function nextQ(){
  tipsNext();
  if(S.i>=S.list.length-1){finish();return;}
  S.i++;renderQ();try{window.scrollTo(0,0);}catch(e){}
}

/* ---------- Bilan ---------- */
function finish(){
  if(blocOn("maitrise"))casNoter(S.list,S.ans);
  clearSess();
  var pct=S.done?Math.round(S.right/S.done*100):0,n;
  $("r-mode").textContent=S.label;
  $("r-score").textContent=S.right+" / "+S.list.length;
  var v;
  if(pct>=90)v=tx("core.verdict_90",{pct:pct});
  else if(pct>=75)v=tx("core.verdict_75",{pct:pct,echeance:MAT.echeance});
  else if(pct>=50)v=tx("core.verdict_50",{pct:pct});
  else v=tx("core.verdict_0",{pct:pct});
  $("r-verdict").textContent=v;
  var rn=$("r-next");rn.hidden=true;
  if(S.srs){
    var firstOk={},seenIds=[],m2;
    for(m2=0;m2<S.ans.length;m2++){var a2=S.ans[m2];if(seenIds.indexOf(a2.id)<0){seenIds.push(a2.id);firstOk[a2.id]=a2.ok;}}
    var fo=seenIds.filter(function(id){return firstOk[id];}).length;
    $("r-score").textContent=fo+" / "+seenIds.length;
    $("r-verdict").textContent=tx("core.premier_coup",{fo:fo,n:seenIds.length});
    var pl=srsPlan(),left=pl.due.length+pl.fresh.length;
    var nx=srsNextDue();
    rn.textContent=left?tnx("core.reste",left):tx("core.seance_finie")+(nx?tnx("core.prochaine_rev_n",nx.n,{quand:inDays(nx.day)}):"")+tx("core.ecart");
    rn.hidden=false;
  }
  var tb=$("r-themes");clear(tb);
  THEMES.forEach(function(t){
    var tot=0,ok=0,m;
    for(m=0;m<S.ans.length;m++){if(S.ans[m].th===t.k){tot++;if(S.ans[m].ok)ok++;}}
    if(!tot)return;
    var row=el("div","row"),rl=el("div","rl");
    rl.appendChild(el("span","",t.n));rl.appendChild(el("b","",ok+" / "+tot));
    var bar=el("div","bar"),fill=el("i");fill.style.width=Math.round(ok/tot*100)+"%";bar.appendChild(fill);
    bar.style.marginBottom="0";
    row.appendChild(rl);row.appendChild(bar);tb.appendChild(row);
  });
  var mw=$("r-missed");clear(mw);
  var missed=S.ans.filter(function(a){return !a.ok;});
  $("r-missed-wrap").hidden=(missed.length===0);$("r-missed-wrap").open=false;
  $("r-missed-t").textContent=tnx("core.a_revoir",missed.length);
  missed.forEach(function(a){
    var it=BYID[a.id],d=el("div","miss");
    if(it.ctx&&!it.cas){var cx=el("div","ctx");ctxRendre(cx,it.ctx);d.appendChild(cx);}  /* énoncé propre à la question (v7.3) */
    d.appendChild(el("div","mq",nb(it.q)));
    var good=el("p","");good.appendChild(el("span","mb",tx("core.bonne_reponse")));good.appendChild(document.createTextNode(nb(bonneTexte(it))));
    d.appendChild(good);
    d.appendChild(el("p","",nb(it.e)));
    d.appendChild(el("p","src",tx("core.source",{s:it.s})));
    mw.appendChild(d);
  });
  $("b-redo").hidden=(missed.length===0);
  $("b-home-t").textContent=tx("core.retour",{dest:navBackLab()});
  renderWeak();
  show("result");
}

/* ---------- « Explique-moi » : demande à Claude depuis la page (capacité sample) ---------- */
var SAMPLE=null;
try{
  if(window.claude&&window.claude.use){
    window.claude.use("sample").then(function(f){
      SAMPLE=f||null;
      if(aiOn()&&S&&S.locked&&!$("quiz").hidden){showAsk(true);}
      if(SAMPLE&&EXS&&!$("ex").hidden){renderExFoot();renderExAsk();}
    },function(){SAMPLE=null;});
  }
}catch(e){SAMPLE=null;}

