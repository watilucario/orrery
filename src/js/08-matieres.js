/* ---------- Moteur de blocs : modèles, recettes, matières ----------
   Un bloc est une façon de réviser que l'app sait faire (séance du jour, QCM, cas, exercices rédigés, simulation,
   calcul mental, aide de Claude, progression). Un modèle dit quels blocs une matière utilise, avec quels réglages
   par défaut, et comment l'accueil de la matière les dispose. Une recette (univers/…/recette.json) choisit un
   modèle, change des réglages, active ou coupe des blocs (false) et apporte le contenu. Une matière n'ajoute pas de code. */
var MODELES={
  "matiere-de-cours":{
    nom:t("mat.modele_nom"),
    blocs:{
      seance_du_jour:{max:20,nouvelles_par_jour:10,reprise_ecart:4,reprise_max:3},
      cours:{},
      documents:{},
      construction:{},
      qcm:{serie_rapide:{}},
      cas:{},
      exercices:{intro:t("mat.ex_intro")},
      simulation:false,
      calcul:false,
      aide_claude:{niveau:"default",effort:"low"},
      progression:{},
      /* Grille de maîtrise (08c) : les marches dans l'ordre, et la marche de chaque type de question sans « Niveau : ».
         seuil : part des points d'un exercice pour qu'il compte comme preuve ; preuves : exercices validés demandés. */
      maitrise:{
        rappel:0.9,
        /* v16 (03h, EXIG_DEF) : quand une question est maîtrisée, part des questions pour une marche QCM, jours des cas */
        exigence:{bonnes:3,jours:2,sans_choix:1,ratio:3,part:0.8,cas:2,ex_jours:2},
        defaut:{qcm:"comprendre",cas:"faire",num:"faire",txt:"expliquer"},
        niveaux:[
          {id:"comprendre",nom:t("mat.n_comprendre"),quoi:t("mat.q_comprendre"),critere:t("mat.c_comprendre")},
          {id:"faire",nom:t("mat.n_faire"),court:t("mat.n_faire_court"),quoi:t("mat.q_faire"),critere:t("mat.c_faire"),seuil:1,preuves:1},
          {id:"expliquer",nom:t("mat.n_expliquer"),quoi:t("mat.q_expliquer"),critere:t("mat.c_expliquer"),seuil:0.7,preuves:2,aide:t("mat.a_expliquer")},
          {id:"recommander",nom:t("mat.n_recommander"),quoi:t("mat.q_recommander"),critere:t("mat.c_recommander"),seuil:0.7,preuves:1,aide:t("mat.a_recommander")}
        ],
        regards:[]
      }
    },
    intro:t("mat.intro"),
    /* Accueil d'une matière (v6.2) : zones dans l'ordre d'affichage, montrées si l'un de leurs blocs est actif. Reprises,
       séance du jour, une recommandation (« Ensuite »), une tuile par façon de réviser (nom et chiffre ; ce que c'est est
       écrit en tête de son écran), ce qui est à retravailler, puis les thèmes (grille de maîtrise). L'état de la
       matière (mémoire, questions vues) est en tête de page ; le détail est dans Progrès. */
    accueil:[
      /* v26 (demande de l'auteur, 11 nov.) : la page d'une matière est un tableau de bord en trois onglets, sans rien à chercher en bas :
         S'entraîner (séance du jour, reprise, entraînement libre, carnet, examen blanc) et Cours (une ligne par chapitre avec ses quatre marches,
         qui ouvre le chapitre). La maîtrise de la MATIÈRE est le radar en tête de page. p : e / c. */
      {id:"resume",p:"e",bloc:["qcm","exercices"]},
      {id:"today",p:"e",bloc:"seance_du_jour"},
      {id:"conseil",p:"e",bloc:["qcm","maitrise","simulation"]},
      {titre:t("mat.libre"),sous:true,p:"e",cls:"modes tuiles",zones:[{id:"cons-home",bloc:"construction"},{id:"qcm-home",bloc:"qcm"},{id:"cas-home",bloc:"cas"},{id:"ex-home",bloc:"exercices"},{id:"drill-home",bloc:"calcul"}]},
      {titre:t("mat.carnet"),sous:true,p:"e",id:"keep",cls:"group",bloc:["qcm","exercices"]},
      {titre:t("mat.evaluer"),sous:true,p:"e",bloc:"simulation"},
      {cls:"modes tuiles",p:"e",zones:[{id:"sim-home",bloc:"simulation"}]},
      {id:"h-cours-liste",p:"c",cls:"group",bloc:"cours"},
      {id:"maitrise",p:"c",bloc:"maitrise"},
      {cls:"modes tuiles",p:"c",zones:[{id:"cours-home",bloc:"cours"},{id:"docs-home",bloc:"documents"}]},
      {id:"mai-legende",p:"c",bloc:"maitrise"}
    ]
  }
};
var ANNEXE_DEF={bouton:t("mat.annexe_voir"),masquer:t("mat.annexe_masquer")};
/* Tuiles « Réviser à ta façon » (v6.2) : le nom et un chiffre. « quoi » et « pourquoi » restent pour une recette qui les
   change (blocs.<bloc>.carte) ; chaque écran de liste dit lui-même ce qu'il propose. */
var CARTES_DEF={
  cours:{titre:t("carte.cours_titre"),quoi:t("carte.cours_quoi"),pourquoi:t("carte.cours_pourquoi")},
  documents:{titre:t("carte.documents_titre"),quoi:t("carte.documents_quoi"),pourquoi:t("carte.documents_pourquoi")},
  construction:{titre:t("carte.construction_titre"),quoi:t("carte.construction_quoi"),pourquoi:t("carte.construction_pourquoi")},
  qcm:{titre:t("carte.qcm_titre"),quoi:t("carte.qcm_quoi"),pourquoi:t("carte.qcm_pourquoi")},
  cas:{titre:t("carte.cas_titre"),quoi:t("carte.cas_quoi"),pourquoi:t("carte.cas_pourquoi")},
  exercices:{titre:t("carte.exercices_titre"),quoi:t("carte.exercices_quoi"),pourquoi:t("carte.exercices_pourquoi")},
  calcul:{titre:t("carte.calcul_titre"),quoi:t("carte.calcul_quoi"),pourquoi:t("carte.calcul_pourquoi")},
  simulation:{titre:t("carte.simulation_titre"),quoi:t("carte.simulation_quoi"),pourquoi:t("carte.simulation_pourquoi")}
};
function carteDe(b){var d=CARTES_DEF[b],c=(MAT.blocs[b]&&MAT.blocs[b].carte)||{};return {titre:c.titre||d.titre,quoi:c.quoi||d.quoi,pourquoi:c.pourquoi||d.pourquoi};}
function carteMode(b,meta,fn,titre){
  var c=carteDe(b),x=el("button","btn mode tuile");x.type="button";
  x.appendChild(el("span","t",nb(titre||c.titre)));
  if(meta)x.appendChild(el("span","s",nb(meta)));
  x.setAttribute("title",c.quoi);
  x.addEventListener("click",fn);
  return x;
}
/* Réglage d'un bloc : false coupe, un objet complète les réglages du modèle, rien garde le modèle */
function reglage(def,val){
  var o={},k;
  if(val===false||(val===undefined&&!def))return false;
  if(def)for(k in def){if(def.hasOwnProperty(k))o[k]=def[k];}
  if(val)for(k in val){if(val.hasOwnProperty(k))o[k]=val[k];}
  return o;
}
var CALC_CACHE={};
function calculDe(k){if(!CALC_CACHE[k])CALC_CACHE[k]=CALCULS[k]();return CALC_CACHE[k];}
function matiereDe(r){
  var mod=MODELES[r.modele]||MODELES["matiere-de-cours"],B={},k,C=construireContenu(r),cl=(r.contenu&&r.contenu.claude)||{},ac=r.accueil||{};
  for(k in mod.blocs){if(mod.blocs.hasOwnProperty(k))B[k]=reglage(mod.blocs[k],(r.blocs||{})[k]);}
  /* Un bloc sans contenu ne s'affiche pas */
  if(!C.Q.length){B.seance_du_jour=false;B.qcm=false;}
  if(!Object.keys(C.COURS).length&&!C.SYN)B.cours=false;
  if(!C.DOCS.length)B.documents=false;
  if(!C.CONS.length)B.construction=false;
  if(!C.CAS.length)B.cas=false;
  if(!C.EXO.length)B.exercices=false;
  if(B.simulation&&(!C.QX.length||!C.EXBY[B.simulation.cas]))B.simulation=false;
  if(B.calcul&&!CALCULS[r.id])B.calcul=false;
  if(!cl.instr)B.aide_claude=false;
  if(!C.Q.length){B.progression=false;B.maitrise=false;}
  return {k:r.id,titre:r.titre,titre_h1:r.titre_h1,pre:r.stockage,ready:r.statut==="prête",statut:r.statut,modele:mod,programme:r.programme||"bachelor",agenda:asArray(r.agenda).filter(function(s){return typeof s==="string"&&!!s;}),
    eyebrow:ac.surtitre||"",resume:ac.resume||"",src:ac.sources||"",vide:ac.vide||"",intro:ac.intro||mod.intro,
    plan:(B.qcm&&B.qcm.serie_rapide)||{},blocs:B,annexe:r.annexe||null,echeance:(r.bilan&&r.bilan.echeance)||t("mat.avant_examen"),
    instr:cl.instr||"",exq:cl.exq||"",corr:cl.corr||"",rulesList:cl.regles||[],ruleMap:cl.par_theme||{},rules:(cl.regles||[]).join("\n"),
    THEMES:C.THEMES,CAS:C.CAS,Q:C.Q,BYID:C.BYID,CASQ:C.CASQ,QX:C.QX,EXO:C.EXO,EXBY:C.EXBY,COURS:C.COURS,SYN:C.SYN,DOCS:C.DOCS,CONS:C.CONS};
}
var MATS={},MATS_ORDER=[],MAT=null,KMAT="qfcc2.matiere",BACK="home";  /* BACK : écran où revenir après une série (hub ou home) */
RECETTES.forEach(function(r){MATS[r.id]=matiereDe(r);MATS_ORDER.push(r.id);});
function blocOn(b){return !!(MAT&&MAT.blocs[b]);}
function activate(key){
  var M=MATS[key]||MATS[MATS_ORDER[0]],B=M.blocs,sd=B.seance_du_jour||MODELES["matiere-de-cours"].blocs.seance_du_jour;
  suiviFlush();  /* matière quittée : ses derniers changements partent avant de tout remplacer */
  MAT=M;
  THEMES=M.THEMES;CAS=M.CAS;Q=M.Q;BYID=M.BYID;CASQ=M.CASQ;QX=M.QX;EXO=M.EXO;EXBY=M.EXBY;COURS=M.COURS;SYN=M.SYN;
  INSTR=M.instr;RULES=M.rules;EXQ_INSTR=M.exq;CORR_INSTR=M.corr;AI=B.aide_claude||AI;
  DAILY_MAX=sd.max;NEW_BASE=sd.nouvelles_par_jour;REPRISE_ECART=sd.reprise_ecart;REPRISE_MAX=sd.reprise_max;
  ANX=M.annexe?{bouton:M.annexe.bouton||ANNEXE_DEF.bouton,masquer:M.annexe.masquer||ANNEXE_DEF.masquer}:ANNEXE_DEF;
  var cal=B.calcul?calculDe(M.k):null;
  DR_CATS=cal?cal.categories:[];DR_GEN=cal?cal.generateurs:[];DR_TRAPS=cal?cal.pieges:[];
  KMISS=M.pre+"miss";KMARK=M.pre+"mark";KEX=M.pre+"ex";KSESS=M.pre+"sess";KLAST=M.pre+"lastex";KSIM=M.pre+"sim";KSIMH=M.pre+"simh";
  KCASR=M.pre+"casr";KCOURS=M.pre+"cours";coursCharger();docsCharger(M);consCharger(M);ntCharger(M);  /* v17 : surlignages et notes (12u) */
  CASR=load(KCASR,{});if(!CASR||typeof CASR!=="object"||CASR instanceof Array)CASR={};
  for(var ck in CASR){if(CASR.hasOwnProperty(ck)&&(!CASQ[ck]||!casrValide(CASR[ck])))delete CASR[ck];}
  KCPT=M.pre+"cpt";CPT=cptCharger(KCPT);KEXC=M.pre+"exc";EXC=load(KEXC,{});if(!EXC||typeof EXC!=="object"||EXC instanceof Array)EXC={};  /* v16 (03h) */
  MISS=asArray(load(KMISS,[])).filter(function(id){return !!BYID[id];});
  MARK=asArray(load(KMARK,[])).filter(function(id){return id.indexOf("ex:")===0?!!EXBY[id.slice(3)]:!!BYID[id];});
  EX=load(KEX,{});if(!EX||typeof EX!=="object"){EX={};}
  SESS=load(KSESS,null);
  if(SESS&&!(SESS.ids instanceof Array&&SESS.ans instanceof Array)){SESS=null;}
  LASTEX=load(KLAST,null);
  SIMH=asArray(load(KSIMH,[])).filter(simhValide);
  save(KMAT,M.k);
  if(M.ready){srsLoad();}else{SRS=srsEmpty();SRS_SET={};}
  simLoad();suiviLoad();
  buildHome();renderAnnexe();
}

/* Accueil de la matière : les zones du modèle dont un bloc est actif, dans l'ordre */
function zoneOn(z){var b=z.bloc instanceof Array?z.bloc:[z.bloc];return b.some(function(x){return blocOn(x);});}
var HOME_P="e",HOME_ONG=[["e",t("mat.ong_entrainer")],["c",t("mat.ong_cours")]];
function homeOnglet(p){
  HOME_P=p;
  [].forEach.call(document.querySelectorAll("#h-onglets .seg-b"),function(b){var on=b.getAttribute("data-p")===p;b.classList.toggle("sel",on);b.setAttribute("aria-pressed",on?"true":"false");});
  [].forEach.call(document.querySelectorAll("#home-body .h-pan"),function(d){d.hidden=d.getAttribute("data-p")!==p;});
}
function buildHome(){
  var box=$("home-body");clear(box);HOME_P="e";  /* une matière s'ouvre toujours sur S'entraîner */
  var seg=el("div","seg h-onglets");seg.id="h-onglets";seg.setAttribute("role","group");seg.setAttribute("aria-label",t("mat.parties_aria"));
  HOME_ONG.forEach(function(o){var b=el("button","seg-b",o[1]);b.type="button";b.id="b-ho-"+o[0];b.setAttribute("data-p",o[0]);b.addEventListener("click",function(){homeOnglet(o[0]);});seg.appendChild(b);});
  box.appendChild(seg);
  var pans={};
  HOME_ONG.forEach(function(o){var d=el("div","h-pan");d.setAttribute("data-p",o[0]);d.id="hp-"+o[0];pans[o[0]]=d;box.appendChild(d);});
  MAT.modele.accueil.forEach(function(z){
    var subs=z.zones?z.zones.filter(zoneOn):null;
    if(subs?!subs.length:!zoneOn(z))return;
    var pan=pans[z.p||"e"];
    if(z.titre)pan.appendChild(el(z.sous?"h3":"h2",z.sous?"h-sous":null,z.titre));
    if(!z.id&&!z.zones)return;  /* v13.3 : un titre seul */
    var d=el("div",z.cls||null);if(z.id)d.id=z.id;
    if(subs)subs.forEach(function(s){var x=el("div");x.id=s.id;d.appendChild(x);});
    pan.appendChild(d);
  });
  homeOnglet(HOME_P);
}

/* Annexe fournie à l'examen (en droit fiscal : le barème de l'IR), affichée sur demande dans les questions qui la demandent */
var ANX=ANNEXE_DEF,ANX_BOX=["bareme","sqbareme","scbareme","drbareme","exbareme"];
function renderAnnexe(){
  var A=MAT.annexe;
  ANX_BOX.forEach(function(id){
    var box=$(id);clear(box);
    if(!A)return;
    var t=el("table"),tb=el("tbody"),tr=el("tr");
    (A.colonnes||[]).forEach(function(c){tr.appendChild(el("th",null,c));});
    tb.appendChild(tr);
    (A.lignes||[]).forEach(function(l){var r=el("tr");l.forEach(function(c){r.appendChild(el("td",null,c));});tb.appendChild(r);});
    t.appendChild(tb);box.appendChild(t);
    if(A.note){var p=el("p","src",A.note);p.style.margin="8px 0 0";box.appendChild(p);}
  });
}
function annexeReset(btn,box,show){$(box).hidden=true;$(btn).textContent=ANX.bouton;$(btn).hidden=!(show&&MAT.annexe);}
function annexeToggle(btn,box){var b=$(box);b.hidden=!b.hidden;$(btn).textContent=b.hidden?ANX.bouton:ANX.masquer;}
[["b-bareme","bareme"],["b-sqbareme","sqbareme"],["b-scbareme","scbareme"],["b-drbareme","drbareme"],["b-exbareme","exbareme"]].forEach(function(p){
  $(p[0]).addEventListener("click",function(){annexeToggle(p[0],p[1]);});
});
/* Texte avec passages en gras écrits **ainsi** dans la recette */
function richText(node,txt){
  String(txt).split("**").forEach(function(part,i){if(part)node.appendChild(i%2?el("b",null,part):document.createTextNode(part));});
  return node;
}

/* Réviser : les matières de l'univers ouvert (08b), prêtes d'abord ; celles en préparation en liste courte */
/* Réviser : passer d'un univers à l'autre sans quitter l'écran (demande de l'auteur, 10 nov.) */
function bachUnivers(){
  var box=$("bach-univers");if(!box)return;box.hidden=UNIVERS.length<2;
  if(box.hidden){clear(box);return;}
  var bs=box.querySelectorAll(".univ-b");
  if(bs.length!==UNIVERS.length){
    clear(box);
    var pa=el("span","univ-pastille-b");pa.setAttribute("aria-hidden","true");box.appendChild(pa);
    UNIVERS.forEach(function(u){
      var b=el("button","univ-b");b.type="button";b.id="bach-univ-"+u.id;
      try{b.appendChild(astEtoileCanvas(u,32));}catch(e){}
      b.appendChild(el("span","univ-b-t",u.nom));
      b.addEventListener("click",function(){
        if(u.id===UNIV)return;
        univFixer(u.id);univPoser(u.id);renderBach();
        var l=$("bach-list");l.classList.remove("entre");void l.offsetWidth;l.classList.add("entre");
      });
      box.appendChild(b);
    });
    bs=box.querySelectorAll(".univ-b");box.setAttribute("data-neuf","1");
  }
  var sel=null;
  [].forEach.call(bs,function(b,i){var ici=UNIVERS[i].id===UNIV;b.classList.toggle("sel",ici);b.setAttribute("aria-pressed",ici?"true":"false");if(ici)sel=b;});
  var p=box.querySelector(".univ-pastille-b"),go=function(){
    if(!sel||!p)return;
    p.style.width=sel.offsetWidth+"px";p.style.height=sel.offsetHeight+"px";p.style.transform="translate("+sel.offsetLeft+"px,"+sel.offsetTop+"px)";
    if(box.getAttribute("data-neuf")){window.requestAnimationFrame(function(){window.requestAnimationFrame(function(){box.removeAttribute("data-neuf");});});}
  };
  if(sel&&sel.offsetWidth)go();else window.requestAnimationFrame(go);
}
function renderBach(){
  var box=$("bach-list"),U=univ(),ms=univMats(),pr=univPrets(),at=ms.filter(function(k){return !MATS[k].ready;}),lib=univLib();
  clear(box);
  $("bach-titre").textContent=t("mat.reviser");
  bachUnivers();
  $("b-bach-cherche").hidden=!rchPossible();  /* v17.1 : Recherche partout (12s) */
  renderBachCouleurs(ms);  /* v10.6 (12j) */
  carnetBouton($("bach-carnet"),"bach");  /* v16 (12o) */
  function ouvrir(key){return function(){activate(key);BACK="home";NAV_PRE.home="bach";renderHome();show("home");};}
  if(!pr.length)box.appendChild(el("p","lead",U.vide||t("mat.rien_pret")));
  var g1=el("div","bach-prets");
  pr.forEach(function(key,idx){var M=MATS[key],b=bigBtn(M.titre,M.ready?matResume(key):M.resume,false,ouvrir(key));b.className+=" is-ready";matColore(b,key);
    try{var sp=el("span","orr-sphere-w"),cv=document.createElement("canvas"),dp=Math.min(2,window.devicePixelRatio||1),th=0,gr=astGraine(key);try{th=matCouleur(key);}catch(e){th=idx;}cv.width=cv.height=Math.round(56*dp);cv.className="orr-sphere";astVignette(cv,{arch:th,graine:gr,rot:gr,roulis:((gr*7.3)%1-.5)*.9,k:.3});sp.appendChild(cv);b.insertBefore(sp,b.firstChild);}catch(e){}  /* v23 : la même planète qu'à l'accueil (12x) */
    g1.appendChild(b);});
  if(pr.length)box.appendChild(g1);
  if(at.length){
    box.appendChild(el("h2",null,(pr.length?t("mat.en_prepa"):univCap(lib))+(APP.vierge?t("mat.a_remplir"):t("mat.en_attente"))));
    var g=el("div","group bach-attente");
    at.forEach(function(key){var b=bigBtn(MATS[key].titre,null,false,ouvrir(key));b.className+=" is-wait";matColore(b,key);g.appendChild(b);});
    box.appendChild(g);
  }
  /* v13 : Maitrise, un système de plus dans cet univers (12l) */
  if(APP.vierge){var a=el("button","link cr-ajout",t("mat.ajouter_systeme"));a.type="button";a.id="b-bach-sys";a.addEventListener("click",function(){crOuvrir("systemes",{depuis:"bach",univers:UNIV});});box.appendChild(a);}
}
