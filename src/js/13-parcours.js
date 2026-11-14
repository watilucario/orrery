/* ---------- Parcours : profil, accueil de première visite, écran « Aujourd'hui », conseils de première séance ---------- */
var KONB="qfcc2.onb",KTIPS="qfcc2.tips",KPROF="qfcc2.profil",TIPS=load(KTIPS,{}),ONB={i:0,back:"hub",ins:[],val:{},mode:"guide",steps:[]};
if(!TIPS||typeof TIPS!=="object")TIPS={};

/* Profil : créé une seule fois, avec l'accueil de première visite. Gardé sur le compte (document privé
   data/users/<id>/profil, capacité db) et en copie dans ce navigateur. Un navigateur qui oublie sa mémoire locale
   (téléphone, navigation privée) retrouve le profil sur le compte : l'accueil ne revient pas.
   {v, prenom, cree, maj, guide:1, conseils:{q,fb}, examens:[…] (voir 12-examens.js)} */
var PROF=load(KPROF,null),PROF_COMPTE=false;
if(!PROF||typeof PROF!=="object"||!PROF.guide)PROF=null;
if(!PROF&&load(KONB,0))PROF={v:1,prenom:"",cree:0,maj:0,guide:1,conseils:{q:TIPS.q?1:0,fb:TIPS.fb?1:0,nav:TIPS.nav?1:0}};  /* v1 : accueil déjà vu ici */
if(PROF&&PROF.conseils)["q","fb","nav"].forEach(function(k){if(PROF.conseils[k])TIPS[k]=1;});  /* conseils vus : le profil fait foi, même si la mémoire locale les a perdus */
function profilDoc(){return DB.doc("data/users/"+UID+"/profil");}
function profilPush(){if(!DB||!UID||!PROF)return;profilDoc().set(clone(PROF)).then(null,function(){});}
function profilSave(prenom){
  var p=PROF||{v:1,prenom:"",cree:Date.now(),guide:1,conseils:{}};
  if(typeof prenom==="string")p.prenom=trim(prenom).slice(0,40);
  p.guide=1;p.conseils={q:TIPS.q?1:0,fb:TIPS.fb?1:0,nav:TIPS.nav?1:0};p.maj=Date.now();
  PROF=p;examMigrer();save(KPROF,PROF);save(KONB,1);profilPush();
}
/* Profil du compte et profil local : le prénom et les examens les plus récents gagnent, un conseil vu quelque part est vu partout */
function profilFusion(r){
  var l=PROF,m={v:1,guide:1,cree:r.cree||(l&&l.cree)||0,prenom:typeof r.prenom==="string"?r.prenom:"",maj:r.maj||0,conseils:{}};
  if(r.examens instanceof Array)m.examens=r.examens;
  if(l&&(l.maj||0)>m.maj){m.prenom=l.prenom||"";m.maj=l.maj;if(l.examens instanceof Array)m.examens=l.examens;}
  if(!(m.examens instanceof Array)&&l&&l.examens instanceof Array)m.examens=l.examens;
  var ra=(r.agenda&&typeof r.agenda==="object")?r.agenda:null,la=(l&&l.agenda&&typeof l.agenda==="object")?l.agenda:null;
  if(ra||la)m.agenda=(la&&(!ra||(la.maj||0)>(ra.maj||0)))?la:ra;  /* agendas reliés : le choix le plus récent */
  var rr=(r.reglages&&typeof r.reglages==="object")?r.reglages:null,lr=(l&&l.reglages&&typeof l.reglages==="object")?l.reglages:null;
  if(rr||lr)m.reglages=(lr&&(!rr||(lr.maj||0)>(rr.maj||0)))?lr:rr;  /* réglages (apparence) : le plus récent */
  var rc=(r.couleurs&&typeof r.couleurs==="object")?r.couleurs:null,lc=(l&&l.couleurs&&typeof l.couleurs==="object")?l.couleurs:null;
  if((r.mondes&&typeof r.mondes==="object")||(l&&l.mondes&&typeof l.mondes==="object"))m.mondes=mondesUnion(l&&l.mondes,r.mondes);  /* v13 : univers et systèmes créés (02) */
  if(rc||lc){m.couleurs={};[rc,lc].forEach(function(src){if(!src)return;Object.keys(src).forEach(function(k){var v=src[k];if(v&&typeof v.t==="number"&&(!m.couleurs[k]||(v.at||0)>(m.couleurs[k].at||0)))m.couleurs[k]={t:v.t,at:v.at||0};});});}  /* couleurs des matières : fusion par matière */
  var al=alFusion(l&&l.lire,r.lire);if(al)m.lire=al;  /* v16 : cases de « À lire avant », par examen (12o) */
  ["q","fb","nav"].forEach(function(k){m.conseils[k]=((r.conseils&&r.conseils[k])||(l&&l.conseils&&l.conseils[k])||TIPS[k])?1:0;if(m.conseils[k])TIPS[k]=1;});
  return m;
}
/* Appelé par initSync (07) quand on sait si le compte est joignable */
function profilCompte(ok){
  if(!ok){if(!PROF)onbAuto();return;}
  PROF_COMPTE=true;
  profilDoc().get().then(function(snap){
    var r=snap.exists?clone(snap.data()):null;  /* data() est gelé par la plateforme (db.d.ts) : copier avant de s'en servir comme profil */
    if(r&&r.guide){
      var m=profilFusion(r);
      PROF=m;examMigrer();save(KPROF,PROF);save(KONB,1);save(KTIPS,TIPS);
      if(JSON.stringify(PROF)!==JSON.stringify(r))profilPush();
    }else if(PROF){examMigrer();save(KPROF,PROF);profilPush();}
    else{onbAuto();return;}
    mondesSuivreCompte();  /* v13 : univers et systèmes créés sur un autre appareil (12l) */
    if(!MAT)return;  /* Maitrise avant sa première configuration */
    examSync();agProfil();reglProfil();
    if(!$("hub").hidden)renderHub();
    else if(!$("home").hidden)renderHome();
  },function(){if(!$("hub").hidden)renderHub();});
}
/* Pas de profil, ni ici ni sur le compte : c'est une première visite, l'accueil crée le profil */
function onbAuto(){if(!PROF&&!$("hub").hidden)openOnb("hub","creation");}
function saveTips(){save(KTIPS,TIPS);if(PROF){PROF.conseils={q:TIPS.q?1:0,fb:TIPS.fb?1:0,nav:TIPS.nav?1:0};save(KPROF,PROF);profilPush();}}

/* Accueil (v6) : création du profil en 3 écrans, une seule fois (toi, la séance du jour, tes examens) ; guide en 2 écrans,
   rouvrable depuis Profil › Aide ; ou profil seul. Plus d'écran sur la navigation : les onglets suffisent. */
var ONB_PROFIL={t:tx("zpar.onb_t"),
   p:[IPH.ok?tx("zpar.onb_p_iph")  /* app iPhone (12k) */
     :tx("zpar.onb_p")],
   demo:onbProfil};
/* Les étapes de la présentation (séance du jour, carnet, carte, agenda, univers, import) sont dans la visite guidée : 12v. */
var ONB_STEPS=[];
function openOnb(back,mode){
  ONB.i=0;ONB.back=back||"hub";ONB.val={};ONB.mode=mode||"guide";
  ONB.steps=[ONB_PROFIL];
  renderOnb();show("onb");
}
function renderOnb(){
  var st=ONB.steps[ONB.i],n=ONB.steps.length,last=(ONB.i===n-1),dots=$("onb-dots"),body=$("onb-body"),k;
  $("onb-step").textContent=(ONB.mode==="profil"?tx("zpar.profil"):tx("zpar.bienvenue"));
  clear(dots);if(n>1)for(k=0;k<n;k++)dots.appendChild(el("i",k<=ONB.i?"on":""));
  $("onb-title").textContent=ONB.mode==="profil"?tx("zpar.ton_profil"):st.t;
  clear(body);ONB.ins=[];
  st.p.forEach(function(x){body.appendChild(el("p","lead",nb(x)));});
  if(st.demo)st.demo(body);
  $("b-onb-prev").style.visibility=ONB.i?"visible":"hidden";
  $("b-onb-next").textContent=ONB.mode==="profil"?tx("zpar.enregistrer"):tx("zpar.onb_commencer");
  $("b-onb-skip").hidden=(last&&ONB.mode!=="creation");
  $("b-onb-skip").textContent=tx("zpar.passer");
}
function onbProfil(box){
  var row=el("div","onb-ex"),lab=el("label","plab",tx("zpar.ton_prenom")),inp=el("input","field");
  lab.setAttribute("for","onb-prenom");inp.type="text";inp.id="onb-prenom";inp.maxLength=40;
  inp.setAttribute("autocomplete","given-name");inp.placeholder=tx("zpar.facultatif");
  inp.value=ONB.val.hasOwnProperty("prenom")?ONB.val.prenom:((PROF&&PROF.prenom)||"");
  inp.addEventListener("input",function(){ONB.val.prenom=inp.value;});
  row.appendChild(lab);row.appendChild(inp);box.appendChild(row);
  box.appendChild(el("p","src",PROF_COMPTE?tx("zpar.enr_compte"):IPH.ok?tx("zpar.enr_iphone"):tx("zpar.enr_navigateur")));
}
function onbExams(box){
  univMats().forEach(function(k){
    var M=MATS[k];if(!M.ready)return;
    var nx=prochainExam(k),old=nx?nx.date:"",id="onb-ex-"+k;
    var row=el("div","onb-ex"),lab=el("label","plab",M.titre),inp=el("input","field");
    lab.setAttribute("for",id);inp.type="date";inp.id=id;
    inp.value=ONB.val.hasOwnProperty(k)?ONB.val[k]:old;
    inp.addEventListener("input",function(){ONB.val[k]=inp.value;});
    row.appendChild(lab);row.appendChild(inp);box.appendChild(row);
    ONB.ins.push({k:k,inp:inp,old:old});
  });
}
/* Une date par matière : elle met à jour son prochain examen, ou en crée un (« Examen », à renommer dans le profil) */
function onbSaveExams(){
  var ch=false;
  ONB.ins.forEach(function(x){
    var v=x.inp.value||"";
    if(v===x.old||(v&&dayFromISO(v)===null))return;
    var nx=prochainExam(x.k);
    if(nx){if(v){nx.date=v;}else{PROF.examens=examens().filter(function(y){return y.id!==nx.id;});}}
    else if(v){PROF.examens=examens().concat([{id:"x"+Date.now().toString(36)+x.k,type:"autre",nom:tx("zpar.examen"),programme:MATS[x.k].programme,matiere:x.k,date:v,objectif:null}]);}
    ch=true;
  });
  return ch;
}
function closeOnb(withExams){
  if(ONB.mode!=="guide"||!PROF)profilSave(ONB.val.prenom);
  if(withExams&&onbSaveExams()){profilSave();examSync();}
  save(KONB,1);
  if(ONB.back==="home"){renderHome();show("home");}else if(ONB.back==="prof"){openProf();}else{renderHub();show("hub");}
  if(ONB.mode==="creation"&&!visDejaVue()&&!APP.vierge){visLancer("hub");}  /* 12v : la visite guidée, une fois */
}

/* Écran « Aujourd'hui » (v6.1) : un tableau de bord. La séance du jour mise en avant est celle de la matière dont
   l'examen est le plus proche ; les autres séances et ce qui est en cours (série, exercice, simulation) suivent en une
   ligne chacun. Puis « Pour bien démarrer » (compte neuf), les échéances (12), les cours (12c) et tes matières. */
/* v26 : matière choisie sur l'accueil (retenue ; sinon celle qui a une séance, sinon la première prête) */
var KHUB="qfcc2.hubsel";
function hubChoisie(items){
  var v=null,k;try{v=window.localStorage.getItem(KHUB);}catch(e){}
  if(ORR.sel&&items.some(function(x){return x.k===ORR.sel;}))return ORR.sel;
  if(v&&items.some(function(x){return x.k===v;})){ORR.sel=v;return v;}
  k=items.length?items[0].k:null;ORR.sel=k;return k;
}
/* Rangée de puces : une par matière prête, pastille qui glisse, nombre de questions du jour ; mise à jour sur place pour que la pastille glisse */
function hubPuces(items,sel){
  var box=$("hub-mats-sel");if(!box)return;
  var cles=items.map(function(x){return x.k;}).join("|");
  if(box.getAttribute("data-cles")!==cles){
    clear(box);box.setAttribute("data-cles",cles);
    items.forEach(function(x){
      var b=el("button","orr-chip");b.type="button";b.setAttribute("data-k",x.k);b.appendChild(el("span","orr-chip-n",MATS[x.k].titre));
      b.addEventListener("click",function(){
        if(ORR.sel===x.k)return;ORR.sel=x.k;try{window.localStorage.setItem(KHUB,x.k);}catch(e){}
        ORR.rejouer=false;renderHub();
      });
      box.appendChild(b);
    });
  }
  [].forEach.call(box.querySelectorAll(".orr-chip"),function(b){
    var k=b.getAttribute("data-k"),x=null,bd=b.querySelector(".orr-chip-b");items.forEach(function(y){if(y.k===k)x=y;});
    var on=k===sel;b.classList.toggle("sel",on);b.setAttribute("aria-pressed",on?"true":"false");
    if(on&&box.scrollWidth>box.clientWidth){box.scrollLeft=Math.max(0,b.offsetLeft-(box.clientWidth-b.offsetWidth)/2);}  /* la puce choisie reste en vue */
    if(x&&x.n){if(!bd){bd=el("span","orr-chip-b");bd.setAttribute("aria-hidden","true");b.appendChild(bd);}bd.textContent=String(x.n);b.setAttribute("aria-label",tnx("zpar.puce_n",x.n,{mat:MATS[k].titre}));}
    else{if(bd)b.removeChild(bd);b.setAttribute("aria-label",tx("zpar.puce_faite",{mat:MATS[k].titre}));}
  });
  box.hidden=items.length<2;
}
function renderHub(){
  var td=today(),cur=MAT.k,U=univ(),pr=univPrets(),box=$("hub-today"),cta=$("hub-cta"),suite=$("hub-suite"),items=[],rep=[],sk=0,mem=0,vues=0,tot=0;
  $("hub-titre").textContent=PROF&&PROF.prenom?tx("zpar.bonjour",{nom:PROF.prenom}):tx("zpar.aujourdhui");
  clear(box);clear(cta);clear(suite);renderHubUnivers();ORR.ast=[];
  univMats().forEach(function(k){
    if(!MATS[k].ready||!MATS[k].blocs.seance_du_jour)return;
    if(MAT.k!==k)activate(k);
    items.push(hubSeance(k));
    hubReprises(k).forEach(function(r){rep.push(r);});
    sk=Math.max(sk,streak());
  });
  if(MAT.k!==cur)activate(cur);
  pr.forEach(function(k){
    var D=evDonnees(k),ids=D.M.Q.filter(function(q){return !q.cas;});
    mem+=evRappel(D,td);tot+=ids.length;vues+=ids.filter(function(q){return !!D.items[q.id];}).length;
  });
  $("hub-date").textContent=fmtDay(td);
  hubStats(pr.length?[
    [sk?String(sk):"0",tnx("zpar.stat_serie",sk)],
    [pct(pr.length?mem/pr.length:0),tx("zpar.stat_retenu")],
    [vues+" / "+tot,tx("zpar.stat_vues")]
  ]:[]);
  /* v26 : le planétaire d'UNE matière. Hiérarchie : l'univers est une galaxie, la matière une étoile, le chapitre une planète.
     Le soleil est donc la matière choisie dans la rangée de puces (elle mène à sa page), ses planètes sont ses chapitres (elles mènent
     au chapitre, avec leur avancement) ; le bouton d'action en bas lance la séance du jour de CETTE matière. */
  items.sort(function(a,b){if(!!a.n!==!!b.n)return a.n?-1:1;return (a.ex===null?1e9:a.ex)-(b.ex===null?1e9:b.ex);});
  var premier=items.length&&items[0].n?items[0]:null,mins=0,reste=0;
  items.forEach(function(x){mins+=x.mins;reste+=x.n;});
  var vi=Math.max(0,UNIVERS.indexOf(U));AST.sem=vi;
  var sel=hubChoisie(items),xs=null;items.forEach(function(x){if(x.k===sel)xs=x;});
  if(!pr.length){$("hub-sous").textContent=nb(U.vide||tx("zpar.sous_vide"));}
  else if(xs&&xs.n){$("hub-sous").textContent=nb(tnx("zpar.sous_attend",xs.n,{mat:MATS[xs.k].titre,min:xs.mins}));}
  else if(premier){$("hub-sous").textContent=nb(tnx("zpar.sous_ailleurs",reste,{mat:MATS[sel].titre}));}
  else{$("hub-sous").textContent=nb(tx("zpar.sous_tout"));}
  hubPuces(items,sel);
  box.hidden=!sel;
  if(sel){
    var ci=0;try{ci=matCouleur(sel)%8;}catch(e){ci=0;}ORR.etoile=ci;
    var sol=el("button","orr-soleil mag");sol.type="button";sol.id="b-hub-soleil";sol.setAttribute("data-curseur",tx("zpar.ouvrir"));
    sol.setAttribute("aria-label",tx("zpar.ouvrir_mat",{mat:MATS[sel].titre}));
    sol.appendChild(el("span","orr-sol-n",MATS[sel].titre));
    sol.addEventListener("click",function(){activate(sel);BACK="hub";NAV_PRE.home="hub";renderHome();show("home");});
    box.appendChild(sol);
    var cur0=MAT.k;if(MAT.k!==sel)activate(sel);
    var chs=THEMES.slice(),tot0=0;
    chs.forEach(function(t,i){
      var tq=pool().filter(function(x){return x.th===t.k;}),cb=tq.length?cptBilan(tq):null,part=cb?cb.part:0,g0=astGraine(sel+t.k);
      ORR.ast.push({k:t.k,arch:i*5+(Math.floor(g0)%5),graine:g0,roulis:((g0*7.3)%1-.5)*.9,hov:0});
      var p=el("button","orr-pl mag"+(cb&&part>=.8?" faite":""));p.type="button";p.setAttribute("data-curseur",tx("zpar.chapitre"));
      p.appendChild(el("span","orr-sphere-w"));p.appendChild(el("span","t",t.n));
      p.appendChild(el("span","s",tq.length?tx("zpar.ch_maitrise",{p:pct(part)}):tx("zpar.ch_sans_qcm")));
      if(tq.length){var pc=el("span","orr-pl-p",pct(part));pc.setAttribute("aria-hidden","true");p.appendChild(pc);}
      p.setAttribute("aria-label",tq.length?tx("zpar.ch_aria_p",{t:t.n,p:pct(part)}):tx("zpar.ch_aria",{t:t.n}));
      p.addEventListener("click",function(){activate(sel);BACK="hub";NAV_PRE.home="hub";openChap(t.k);});
      box.appendChild(p);
    });
    if(MAT.k!==cur0)activate(cur0);
  }
  if(xs&&xs.n){
    var c=xs.btn(true);c.className="orr-cta-b mag";c.setAttribute("data-curseur",tx("zpar.commencer"));
    c.insertBefore(el("span",null,tx("zpar.commencer")),c.firstChild);c.firstChild.className="cta-k";
    var fl=el("span","cta-fl");fl.setAttribute("aria-hidden","true");fl.textContent="→";c.appendChild(fl);
    cta.appendChild(c);cta.appendChild(planLien(xs.k));
  }else if(pr.length){
    var c2=bigBtn(tx("zpar.seance_faite_t"),(premier?tx("zpar.seance_faite_autre"):tx("zpar.seance_faite_avance")),true,function(){renderBach();show("bach");});
    c2.className="orr-cta-b calme mag";var f2=el("span","cta-fl");f2.setAttribute("aria-hidden","true");f2.textContent="→";c2.appendChild(f2);cta.appendChild(c2);
  }
  if(rep.length){
    suite.appendChild(el("h2",null,tx("zpar.en_cours")));
    var g=el("div","group");rep.forEach(function(b){g.appendChild(b);});suite.appendChild(g);
  }
  $("hub-mats-t").hidden=true;clear($("hub-mats"));$("hub-mats").hidden=true;
  renderHubDepart();renderHubExams();renderHubAgenda();
  var oe=$("orr");if(oe&&ORR.univ!==UNIV){ORR.univ=UNIV;oe.classList.remove("orr-arrive");void oe.offsetWidth;if(!orrMoins())oe.classList.add("orr-arrive");}
  orrReveler();orrLancer();
}
function hubStats(l){
  var box=$("hub-stats");if(!box)return;clear(box);box.hidden=!l.length;
  l.forEach(function(x){var c=el("div","stat");c.appendChild(el("span","stat-v",nb(x[0])));c.appendChild(el("span","stat-l",x[1]));box.appendChild(c);});
}
/* ---------- Le planétaire de l'accueil (v22) ----------
   Soleil et planètes sont de vrais boutons, posés à chaque image sur des orbites inclinées (le canvas ne trace que les orbites) ;
   le ciel réaliste est le canvas fixe #ciel (12w). Une planète rapetisse et passe derrière le soleil quand elle est au fond.
   Pointeur : parallaxe du ciel, boutons magnétiques (ils suivent un peu la souris), curseur qui annonce l'action.
   Moins de mouvement : une seule image fixe, ni rotation, ni parallaxe, ni curseur animé, ni révélation. */
var ORR={sel:null,raf:0,t0:0,w:0,h:0,px:0,py:0,cx:-100,cy:-100,pret:false,cle:"",ast:[],univ:null,etoile:0,gl:undefined,rejouer:false};
function orrMoins(){try{return window.matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){return false;}}
function orrFin(){try{return window.matchMedia("(hover: hover) and (pointer: fine)").matches;}catch(e){return false;}}
/* Révélation par masque : chaque mot sort d'un conteneur qui coupe, l'un après l'autre */
function orrReveler(){
  var cles=$("hub-titre").textContent+"|"+$("hub-sous").textContent;
  if(ORR.cle===cles&&!ORR.rejouer)return;
  ORR.cle=cles;ORR.rejouer=false;
  if(orrMoins())return;
  [$("hub-titre"),$("hub-sous")].forEach(function(n,k){
    var mots=n.textContent.split(" "),i;clear(n);n.classList.remove("rev-on");n.classList.add("rev");
    mots.forEach(function(m,i){
      var w=el("span","rev-m"),s=el("span","rev-s",m);s.style.transitionDelay=(k*260+i*70)+"ms";w.appendChild(s);n.appendChild(w);
      if(i<mots.length-1)n.appendChild(document.createTextNode(" "));
    });
    n.setAttribute("aria-label",mots.join(" "));
    window.requestAnimationFrame(function(){window.requestAnimationFrame(function(){n.classList.add("rev-on");});});
  });
}
function orrCurseur(){
  var c=$("orr-cur");if(c)return c;
  c=el("div","orr-cur");c.id="orr-cur";c.setAttribute("aria-hidden","true");c.appendChild(el("span","orr-cur-t",""));document.body.appendChild(c);return c;
}
function orrGL(){
  var cv=$("orr-gl");if(!cv)return null;
  if(ORR.gl===undefined){ORR.gl=aglCreer(cv);}
  return ORR.gl;
}
function orrLancer(){
  if(ORR.raf){try{window.cancelAnimationFrame(ORR.raf);}catch(e){}ORR.raf=0;}
  var sc=$("orr"),cv=$("orr-cv"),zone=$("hub-today"),fixe=orrMoins(),fin=orrFin();if(!sc||!cv||!zone)return;
  var pls=[].slice.call(zone.querySelectorAll(".orr-pl")),sol=zone.querySelector(".orr-soleil"),mags=[].slice.call(sc.querySelectorAll(".mag")),x2d=null,cur=fin&&!fixe?orrCurseur():null,G=orrGL();
  try{x2d=cv.getContext("2d");}catch(e){x2d=null;}
  if(!ORR.pret){
    ORR.pret=true;
    document.addEventListener("pointermove",function(e){
      if($("hub").hidden)return;
      ORR.cx=e.clientX;ORR.cy=e.clientY;ORR.px=e.clientX/Math.max(1,window.innerWidth)-.5;ORR.py=e.clientY/Math.max(1,window.innerHeight)-.5;
    });
  }
  var ox=0,oy=0,curx=-100,cury=-100,cible=null,etiq="",debut=0,sx=0,sy=0,sh=0,mem=ORR.ast,qual=1,lent=0,dernier=0;
  function sousCurseur(){
    var n=document.elementFromPoint?document.elementFromPoint(ORR.cx,ORR.cy):null;
    while(n&&n!==document.body){if(n.getAttribute&&n.getAttribute("data-curseur"))return n;n=n.parentNode;}
    return null;
  }
  function facile(u){return 1-Math.pow(1-u,3);}
  function pas(ts){
    if($("hub").hidden){ORR.raf=0;if(cur)cur.classList.remove("on");return;}
    if(!ORR.t0)ORR.t0=ts;if(!debut)debut=ts;
    var t=fixe?0:(ts-ORR.t0)/1000,W=sc.clientWidth,H=sc.clientHeight,dpr=Math.min(2,window.devicePixelRatio||1)*qual;
    if(W<2||H<2){ORR.raf=window.requestAnimationFrame(pas);return;}
    if(typeof window.__astres_t==="number")t=window.__astres_t;
    if(dernier){var dt=ts-dernier;lent=lent*.95+dt*.05;if(lent>22&&qual>.55&&!fixe){qual=Math.max(.55,qual*.85);lent=16;}}dernier=ts;
    ox+=(ORR.px-ox)*.05;oy+=(ORR.py-oy)*.05;
    cielDessiner(fixe?0:ox,fixe?0:oy,t,AST.sem);
    var q=zone.getBoundingClientRect(),q0=sc.getBoundingClientRect(),zx=q.left-q0.left,zy=q.top-q0.top,zw=q.width,zh=q.height,cx=zx+zw/2,cy=zy+zh/2,
        Rs=sol?sol.offsetWidth/2:60,n=pls.length,etroit=zw<560,Rp=n&&pls[0].firstChild?pls[0].firstChild.offsetWidth/2:26,
        par=n<=3?1:n<=6?2:3,norb=Math.max(1,Math.ceil(n/par)),r0=Rs+(etroit?46:84)+Rp,rmax=Math.max(r0,zw/2-Rp-(etroit?14:40)),
        gap=norb>1?Math.min(etroit?44:96,(rmax-r0)/(norb-1)):0,rfin=r0+(norb-1)*gap,
        k=Math.max(.2,Math.min(etroit?.62:.4,(zh/2-Rp-34)/Math.max(1,rfin))),ct=Math.sqrt(1-k*k),arr=(fixe||typeof window.__astres_t==="number")?1:facile(Math.min(1,(ts-debut)/1500)),i,o,pp;
    if(sol){sol.style.left=(cx-zx)+"px";sol.style.top=(cy-zy)+"px";}
    var E=astEtoile(ORR.etoile||0);
    /* positions et lumière de chaque planète */
    var P=[];
    for(i=0;i<n;i++){
      o=Math.floor(i/par);pp=i%par;
      var a=.9+o*2.1+pp*6.2832/par+t*(.2/(1+o*.3)),s=Math.sin(a),co=Math.cos(a),r=(r0+o*gap)*arr,mem_i=mem[i]||{arch:i,graine:i,roulis:0,hov:0};
      var ech=.78+.3*(s+1)/2,x=cx+r*co,y=cy+r*k*s;
      var hv=cible===pls[i]?1:0;mem_i.hov+=(hv-mem_i.hov)*.14;
      P.push({x:x,y:y,s:s,co:co,ech:ech*(1+.14*mem_i.hov),m:mem_i,L:[-co,s*k,-s*ct],rot:mem_i.graine+t*.3*(1+i*.15)});
    }
    /* orbites, tracées en 2D */
    if(x2d){
      if(W!==ORR.w||H!==ORR.h){ORR.w=W;ORR.h=H;cv.width=Math.round(W*Math.min(2,window.devicePixelRatio||1));cv.height=Math.round(H*Math.min(2,window.devicePixelRatio||1));}
      var d2=Math.min(2,window.devicePixelRatio||1),co2=window.getComputedStyle(sc).getPropertyValue("--orr-orbite")||"255,255,255";
      x2d.setTransform(d2,0,0,d2,0,0);x2d.clearRect(0,0,W,H);x2d.lineWidth=1;
      for(o=0;o<norb;o++){
        var rr=(r0+o*gap)*arr,gr=x2d.createLinearGradient(cx-rr,0,cx+rr,0);
        gr.addColorStop(0,"rgba("+co2+",.03)");gr.addColorStop(.5,"rgba("+co2+",.2)");gr.addColorStop(1,"rgba("+co2+",.03)");
        x2d.strokeStyle=gr;x2d.beginPath();x2d.ellipse(cx,cy,rr,rr*k,0,0,6.2832);x2d.stroke();
      }
    }
    /* magnétisme : décalage lissé de chaque astre et de son bouton */
    var mxs=[],mys=[],j,m,rect,mx,my,d,R=130;
    for(j=0;j<mags.length;j++){
      m=mags[j];rect=m.getBoundingClientRect();mx=rect.left+rect.width/2;my=rect.top+rect.height/2;d=Math.sqrt(Math.pow(ORR.cx-mx,2)+Math.pow(ORR.cy-my,2));
      var f=(fin&&!fixe&&d<R)?(1-d/R):0,tx=(ORR.cx-mx)*.22*f,ty=(ORR.cy-my)*.22*f,w=m.querySelector(".orr-sphere-w")||m,pa=parseFloat(w.getAttribute("data-mx")||"0"),pb=parseFloat(w.getAttribute("data-my")||"0");
      pa+=(tx-pa)*.14;pb+=(ty-pb)*.14;w.setAttribute("data-mx",pa);w.setAttribute("data-my",pb);
      if(m===sol){sx=pa;sy=pb;}else{var ii=pls.indexOf(m);if(ii>=0){mxs[ii]=pa;mys[ii]=pb;}}
    }
    /* boutons : posés sur les astres ; le libellé disparaît quand l'astre passe derrière le soleil */
    for(i=0;i<n;i++){
      var P1=P[i],bw=pls[i].offsetWidth,bx=P1.x+(mxs[i]||0),by=P1.y+(mys[i]||0);
      pls[i].style.transformOrigin="50% "+Rp+"px";
      pls[i].style.transform="translate("+(bx-zx-bw/2).toFixed(1)+"px,"+(by-zy-Rp).toFixed(1)+"px) scale("+P1.ech.toFixed(3)+")";
      pls[i].style.zIndex=P1.s<0?"1":"3";
      var cache=P1.s<0&&Math.sqrt(Math.pow(bx-cx,2)+Math.pow(by-cy,2))<Rs*1.45;pls[i].style.opacity=cache?"0":"1";
    }
    /* dessin : planètes du fond, couronne, disque, planètes de devant */
    if(G&&!G.perdu){
      aglTaille(G,W,H,dpr);aglDebut(G);
      var ord=[],ex=sx*0,ey=sy*0;
      for(i=0;i<n;i++)ord.push(i);ord.sort(function(a,b){return P[a].s-P[b].s;});
      function dessinePl(i){var P1=P[i];aglPlanete(G,{x:P1.x+(mxs[i]||0),y:P1.y+(mys[i]||0),r:Rp*P1.ech,arch:P1.m.arch,graine:P1.m.graine,rot:P1.rot,roulis:P1.m.roulis,k:k,L:P1.L,lum:E.lum,t:t,alpha:1});}
      for(j=0;j<n;j++){if(P[ord[j]].s<0)dessinePl(ord[j]);}
      var Rc=Rs*(.35+.65*arr),fade=Math.min(2.8,Math.min(cx+sx,W-cx-sx,cy+sy,H-cy-sy)/Math.max(1,Rc));
      aglCouronne(G,{x:cx+sx,y:cy+sy,r:Rc,etoile:ORR.etoile||0,t:t,graine:ORR.etoile||0,fondu:Math.max(1.4,fade),alpha:Math.min(1,arr*1.2)});
      aglEtoile(G,{x:cx+sx,y:cy+sy,r:Rc,etoile:ORR.etoile||0,t:t,graine:(ORR.etoile||0)*3.1,alpha:Math.min(1,arr*2)});
      for(j=0;j<n;j++){if(P[ord[j]].s>=0)dessinePl(ord[j]);}
    }
    if(fin&&!fixe&&cur){
      var c=sousCurseur();curx+=(ORR.cx-curx)*.2;cury+=(ORR.cy-cury)*.2;
      if(c!==cible){cible=c;etiq=c?c.getAttribute("data-curseur"):"";cur.firstChild.textContent=etiq;}
      cur.style.transform="translate("+Math.round(curx)+"px,"+Math.round(cury)+"px)";
      cur.classList.toggle("on",ORR.cx>0);cur.classList.toggle("sur",!!c);
    }
    if(fixe){ORR.raf=0;return;}
    ORR.raf=window.requestAnimationFrame(pas);
  }
  ORR.t0=0;ORR.raf=window.requestAnimationFrame(pas);
}
/* Une ligne par matière prête : sa mémoire du cours, ses questions vues */
function matResume(k){
  var D=evDonnees(k),td=today(),ids=D.M.Q.filter(function(q){return !q.cas;}),vues=ids.filter(function(q){return !!D.items[q.id];}).length;
  return tx("zpar.resume",{p:pct(evRappel(D,td)),v:vues,n:ids.length});
}
/* Séance du jour d'une matière (activée) : {n questions, mins, ex jour d'examen, btn(primaire)} */
function hubSeance(k){
  var M=MATS[k],ex=examDay(),td=today(),nx=prochainExam(k),stt=null;
  if(ex!==null&&ex>=td)stt=ex===td?tx("zpar.stt_auj",{nom:nx?nx.nom:tx("zpar.examen")}):ex===td+1?tx("zpar.stt_dem",{nom:nx?nx.nom:tx("zpar.examen")}):tnx("zpar.stt_dans",ex-td,{nom:nx?nx.nom:tx("zpar.examen")});
  var exj=(ex!==null&&ex>=td)?ex:null;
  if(SESS&&SESS.srs&&SESS.ans.length<SESS.ids.length){
    var left=SESS.ids.length-SESS.ans.length,s0=tx("zpar.reprendre_seance",{n:SESS.ans.length+1,m:SESS.ids.length});
    return {k:k,n:left,ex:exj,mins:Math.max(1,Math.round(left*secPerQ()/60)),btn:function(pri){return bigBtn(M.titre,s0,pri,function(){activate(k);BACK="hub";resumeSess();},false,stt);}};
  }
  var p=srsPlan(),nd=p.due.length,nn=p.fresh.length,n=Math.min(DAILY_MAX,nd+nn),mins=Math.max(1,Math.round(n*secPerQ()/60));
  if(n){
    var rv=Math.min(nd,n),nv=n-rv,P=examPerim(),bits=[P?tx("zpar.seance_prog",{nom:P.x.nom}):tx("zpar.seance_jour")];
    if(rv)bits.push(tx("zpar.n_revoir",{n:rv}));if(nv)bits.push(tnx("zpar.n_nouvelle",nv));bits.push(tx("zpar.environ",{n:mins}));
    return {k:k,n:n,ex:exj,mins:mins,btn:function(pri){return bigBtn(M.titre,bits.join(" · "),pri,function(){
      activate(k);BACK="hub";if(!startDaily()){NAV_PRE.home="hub";renderHome();show("home");}
    },false,stt);}};
  }
  var nxd=srsNextDue();
  return {k:k,n:0,ex:exj,mins:0,btn:function(){return bigBtn(M.titre,tx("zpar.seance_faite")+(nxd?tx("zpar.prochaine_rev",{quand:inDays(nxd.day)}):""),false,function(){
    activate(k);BACK="home";NAV_PRE.home="hub";renderHome();show("home");
  },false,stt);}};
}
/* Ce qui est en cours dans une matière (activée) : un exercice commencé, une simulation qui tourne */
function hubReprises(k){
  var M=MATS[k],out=[];
  if(M.blocs.exercices&&LASTEX&&EXBY[LASTEX]&&EX[LASTEX]&&!EX[LASTEX].done&&exAnswered(EXBY[LASTEX],EX[LASTEX])>0){
    var e=EXBY[LASTEX],id=LASTEX;
    out.push(bigBtn(tx("zpar.reprendre_ex",{t:e.t}),tnx("zpar.reprendre_ex_s",exAnswered(e,EX[id]),{mat:M.titre,tot:e.subs.length}),false,function(){activate(k);BACK="home";NAV_PRE.home="hub";openEx(id);}));
  }
  if(M.blocs.simulation&&SIM&&!SIM.sub){
    out.push(bigBtn(tx("zpar.reprendre_sim"),tx("zpar.reprendre_sim_s",{mat:M.titre,t:mmss(simLeft())}),false,function(){activate(k);NAV_PRE.home="hub";resumeSim();}));
  }
  return out;
}
/* Compte neuf : les premiers pas, tant qu'ils ne sont pas faits (examen ajouté, agenda relié ou délié exprès) */
function renderHubDepart(){
  var box=$("hub-depart");clear(box);
  if(!PROF||!univPrets().length)return;
  var l=[];
  if(!examsAVenir().some(function(x){return univDe(x.matiere)===UNIV;}))
    l.push(["b-hub-exam",tx("zpar.dep_exam"),tx("zpar.dep_exam_s"),function(){examAjouter("hub",{type:"cc"});}]);
  if(AG.mcp&&!PROF.agenda&&univAgenda())
    l.push(["b-hub-agenda",tx("zpar.dep_agenda"),tx("zpar.dep_agenda_s"),function(){agRelier("hub");}]);
  iphDepart(l);  /* app iPhone : les rappels (12k) */
  if(!l.length)return;
  box.appendChild(el("h2",null,tx("zpar.ensuite")));
  var g=el("div","group");
  l.forEach(function(x){var b=bigBtn(x[1],x[2],false,x[3]);b.id=x[0];g.appendChild(b);});
  box.appendChild(g);
}
function goBack(){if(BACK==="plan"&&PL.k&&MATS[PL.k]){openPlan(PL.k);}else if(BACK==="carnet"){renderCarnet();show("carnet");}else if(BACK==="lire"&&alExam()){openLire(AL.id);}else if(BACK==="chap"&&chapTh()){openChap(chapTh());}else if(BACK==="hub"){renderHub();show("hub");}else if(BACK==="qcm"){openQcm();}else if(BACK==="caslist"){openCasList();}else{renderHome();show("home");}}

/* Conseils de première séance : affichés une fois, jusqu'à « Compris » ou la question suivante */
function tipsQ(){$("tip-q").hidden=!(S&&S.srs&&!TIPS.q);}
function tipsFb(){
  if(!$("tip-q").hidden){TIPS.q=1;saveTips();}
  $("tip-q").hidden=true;
  if(TIPS.fb){$("tip-fb").hidden=true;return;}
  $("tip-fb-t").textContent=nb(tx("zpar.tip_fb")+(aiOn()?" "+tx("zpar.tip_fb_ia"):""));
  $("tip-fb").hidden=false;
}
function tipsNext(){if(!$("tip-fb").hidden){TIPS.fb=1;saveTips();}$("tip-fb").hidden=true;}

/* Bilan d'une séance du jour : le thème le plus raté du premier coup, avec une série pour le reprendre */
function weakTheme(){
  var first={},by={},best=null;
  S.ans.forEach(function(a){
    if(first.hasOwnProperty(a.id))return;
    first[a.id]=a.ok;
    var x=by[a.th]||(by[a.th]={n:0,ko:0});x.n++;if(!a.ok)x.ko++;
  });
  THEMES.forEach(function(t){
    var x=by[t.k];if(!x||!x.ko)return;
    if(!best||x.ko>best.ko||(x.ko===best.ko&&x.ko/x.n>best.ko/best.n))best={t:t,ko:x.ko,n:x.n};
  });
  return best;
}
function renderWeak(){
  var box=$("r-weak");clear(box);box.hidden=true;
  if(!S||!S.srs||!MAT.ready)return;
  var w=weakTheme();if(!w)return;
  var list=pool().filter(function(x){return x.th===w.t.k;});
  box.appendChild(el("h2",null,tx("zpar.point_faible")));
  box.appendChild(bigBtn(tx("zpar.reprendre",{t:w.t.n}),tnx("zpar.weak_s",w.ko,{tot:w.n,q:list.length}),false,function(){start(shuffle(list),w.t.n);}));
  box.hidden=false;
}

$("b-onb-next").addEventListener("click",function(){if(ONB.i<ONB.steps.length-1){ONB.i++;renderOnb();try{window.scrollTo(0,0);}catch(e){}}else{closeOnb(true);}});
$("b-onb-prev").addEventListener("click",function(){if(ONB.i>0){ONB.i--;renderOnb();}});
$("b-onb-skip").addEventListener("click",function(){closeOnb(false);});
$("b-guide").addEventListener("click",function(){visLancer("prof");});
$("b-tip-q").addEventListener("click",function(){TIPS.q=1;saveTips();$("tip-q").hidden=true;});
$("b-tip-fb").addEventListener("click",function(){TIPS.fb=1;saveTips();$("tip-fb").hidden=true;});

/* Démarrage : la dernière matière ouverte, puis « Aujourd'hui ». L'accueil (création du profil) ne s'ouvre que
   s'il n'y a de profil ni ici ni sur le compte : avec un compte, on attend sa réponse (profilCompte) avant de décider. */
/* i18n (00) : avant tout, au premier lancement, l'écran de langue ; « Continuer » enregistre et recharge, le démarrage reprend alors ici */
NAV.langue={titre:"",sans:function(){return true;}};SCREENS.push("langue");
i18nDates();  /* MOIS et JOURS dans la langue (07) */
if(!LANG_CHOISIE)langueDemarrer();
else if(APP.vierge&&!MATS_ORDER.length)crDemarrer();  /* v13 : Maitrise, première configuration (12l) */
else{
  univDemarrer();  /* univers et matière (08b) */
  if(PROF&&examMigrer())save(KPROF,PROF);
  examSync();
  if(PROF||(window.claude&&window.claude.use)){renderHub();show("hub");}
  else if(APP.vierge){profilSave("");renderHub();show("hub");}  /* Maitrise : son accueil est la création de l'univers */
  else{openOnb("hub","creation");}
}
agInit();
iphDemarrer();  /* app iPhone : widgets, rappels, copie de secours (12k) */
