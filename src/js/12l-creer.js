/* ---------- Maitrise (v13) : créer ses univers, ses systèmes et leurs planètes ----------
   Demande de l'auteur (26 oct.) : une version vierge, sans aucune donnée, dont la première configuration est une
   initiation liée à l'idée d'univers. Écran creer, plusieurs étapes (CR.etape) :
   - bienvenue : « Veux-tu qu'on te présente l'app ? » (oui : presentation, trois écrans ; non : univers) ; ou importer
     ses données d'une autre version (12m) ;
   - univers : son nom, puis sa naissance (crNaissance : la caméra du passage d'un univers à l'autre, 12g) ;
   - systemes : un système solaire par matière, ses planètes = les parties du cours, en orbite autour de lui.
   Univers et systèmes vont dans le profil (PROF.mondes, 02) : ils suivent le compte. Un système sans cours est une
   matière en préparation ; sa page dit comment le remplir (crRemplir : la demande à copier pour une IA, puis Profil ›
   Importer un cours). Hors du premier lancement : « Ajouter un système » (Réviser) et « Créer un univers » (panneau des
   univers). Seulement dans la version vierge (APP.vierge, build.py). */
var CR={etape:"bienvenue",i:0,premier:false,depuis:null,univers:null,sysNom:"",pl:[]},CR_T=2600;

/* Ouvre l'écran. o : {premier (premier lancement : ni onglets ni retour), depuis (« bach », « hub »), univers} */
function crOuvrir(etape,o){
  o=o||{};
  CR.etape=etape;CR.i=0;CR.premier=!!o.premier;CR.depuis=o.depuis||null;CR.univers=o.univers||null;CR.sysNom="";CR.pl=[];  /* barres : NAV.creer (12f) */
  crRendre();show("creer");
}
function crQuitter(){if(CR.depuis==="bach"){renderBach();show("bach");}else{renderHub();show("hub");}}
/* Premier lancement de Maitrise (fin du 13) : un univers sans système reprend à ses systèmes */
function crDemarrer(){
  if(UNIVERS.length)crOuvrir("systemes",{premier:true,univers:UNIVERS[UNIVERS.length-1].id});
  else crOuvrir("bienvenue",{premier:true});
}
function crRendre(){
  var s=$("creer");clear(s);
  ({bienvenue:crBienvenue,presentation:crPresentation,univers:crUnivers,systemes:crSystemes,importer:crImporter}[CR.etape]||crBienvenue)(s);
  try{window.scrollTo(0,0);}catch(e){}
}
function crAller(etape){CR.etape=etape;CR.i=0;crRendre();}
function crTete(s,txt,n,i,passer){
  var t=el("div","top cr-tete");t.appendChild(el("p","eyebrow",txt));
  if(passer){var b=el("button","link",passer[0]);b.type="button";b.id="b-cr-passer";b.addEventListener("click",passer[1]);t.appendChild(b);}
  s.appendChild(t);
  if(n>1){var d=el("div","onb-dots");d.setAttribute("aria-hidden","true");for(var k=0;k<n;k++)d.appendChild(el("i",k<=i?"on":""));s.appendChild(d);}
}
function crBouton(txt,id,cls,fn){var b=el("button",cls||"sbtn",txt);b.type="button";if(id)b.id=id;b.addEventListener("click",fn);return b;}

/* ---------- Un système solaire : le même dessin que la carte (12n), en aperçu ----------
   Le soleil à la couleur de l'univers (ou de la matière), les planètes en orbite. Décoratif : la liste des planètes est
   écrite à côté. crOrbites met à jour le dessin quand on ajoute ou retire une planète. */
function crCouleur(u){return u&&u.galaxie?cosCouleur(u):null;}
function crSysteme(pl,u,cls,col){
  var cv=el("canvas","sys"+(cls?" "+cls:""));
  cv.setAttribute("aria-hidden","true");
  cv.__col=col==null?0:col;
  cv.__sunCol=null;  /* le soleil prend une couleur de matière (palette), comme sur la carte */
  carApercuDe(cv,pl,cv.__col,cv.__sunCol);
  return cv;
}
function crOrbites(cv,pl){cv.__sys=carSysObj(pl,cv.__col||0,cv.__sunCol||null);}

/* ---------- Bienvenue ---------- */
function crBienvenue(s){
  crTete(s,APP.nom,0,0,null);
  var v=el("div","cr-vue");v.appendChild(crSysteme([{nom:"a"},{nom:"b"},{nom:"c"}],null,"sys-deco"));s.appendChild(v);
  s.appendChild(el("h1",null,tx("cr.bienvenue")));
  s.appendChild(el("p","lead",tx("cr.lead")));
  s.appendChild(el("p","cr-q",tx("cr.presente_q")));
  var ch=el("div","cr-choix");
  ch.appendChild(crBouton(tx("cr.oui_presente"),"b-cr-decouvrir","sbtn",function(){crAller("presentation");}));
  ch.appendChild(crBouton(tx("cr.non_direct"),"b-cr-direct","sbtn sbtn-2",function(){crAller("univers");}));
  s.appendChild(ch);
  var p=el("div","cr-pied");
  p.appendChild(crBouton(tx("cr.importer"),"b-cr-importer","link",function(){crAller("importer");}));
  s.appendChild(p);
}

/* ---------- Présentation : trois écrans, à passer ---------- */
var CR_PRES=[
  {t:tx("cr.pres1_t"),
   p:[tx("cr.pres1_p1"),
      tx("cr.pres1_p2")],
   vue:function(v){
     v.appendChild(crSysteme([{nom:tx("cr.pl_a")},{nom:tx("cr.pl_b")},{nom:tx("cr.pl_c")},{nom:tx("cr.pl_d")}],null));
     v.appendChild(el("p","cr-leg",tx("cr.pres1_leg")));
   }},
  {t:tx("cr.pres2_t"),
   p:[tx("cr.pres2_p1"),
      tx("cr.pres2_p2")],
   demo:function(box){if(ONB_STEPS[0]&&ONB_STEPS[0].demo)ONB_STEPS[0].demo(box);}},
  {t:tx("cr.pres3_t"),
   p:[tx("cr.pres3_p1"),
      tx("cr.pres3_p2")]}
];
function crPresentation(s){
  var n=CR_PRES.length,st=CR_PRES[CR.i],last=CR.i===n-1;
  crTete(s,tx("cr.pres_eyebrow",{i:CR.i+1,n:n}),n,CR.i,[tx("cr.passer"),function(){crAller("univers");}]);
  if(st.vue){var v=el("div","cr-vue");st.vue(v);s.appendChild(v);}
  s.appendChild(el("h1","h-mid",st.t));
  st.p.forEach(function(x){s.appendChild(el("p","lead",nb(x)));});
  if(st.demo)st.demo(s);
  var nv=el("div","onb-nav");
  nv.appendChild(crBouton(tx("cr.prec"),"b-cr-prec","link",function(){if(CR.i)CR.i--;else{crAller("bienvenue");return;}crRendre();}));
  nv.appendChild(crBouton(last?tx("cr.creer_mon"):tx("cr.suivant"),"b-cr-suiv","sbtn",function(){if(last)crAller("univers");else{CR.i++;crRendre();}}));
  s.appendChild(nv);
}

/* ---------- Un univers : son nom, puis sa naissance ---------- */
/* Sa galaxie se tire de son nom : la même à chaque fois, différente d'un univers à l'autre */
function galaxieDe(nom){
  var r=cosGraine("galaxie:"+nom);
  return {teinte:Math.round(r()*360),bras:2+Math.floor(r()*3),enroulement:+(2+r()*2).toFixed(2),inclinaison:+(-.6+r()*1.2).toFixed(2),aplatissement:+(.45+r()*.2).toFixed(2)};
}
function crIdLibre(base,pris){var i=base,n=2;while(pris(i)){i=base+"-"+n;n++;}return i;}
function crUnivers(s){
  crTete(s,CR.premier?tx("cr.premier_eyebrow"):tx("cr.nouvel_eyebrow"),0,0,null);
  var v=el("div","cr-vue cr-galaxie");s.appendChild(v);
  s.appendChild(el("h1","h-mid",CR.premier?tx("cr.h_premier"):tx("cr.h_nouveau")));
  s.appendChild(el("p","lead",tx("cr.univ_lead")));
  var f=el("form","pcard cr-form"),row=el("div","prow"),lab=el("label","plab",tx("cr.son_nom")),inp=el("input","field"),bt=el("div","ag-btns");
  f.setAttribute("autocomplete","off");f.id="cr-univ-f";
  lab.setAttribute("for","cr-univ-nom");inp.id="cr-univ-nom";inp.type="text";inp.maxLength=40;inp.placeholder=tx("cr.univ_ph");
  var ok=el("button","sbtn",tx("cr.creer_univ"));ok.type="submit";ok.id="b-cr-univ";ok.disabled=true;
  function apercu(){
    var nom=trim(inp.value);ok.disabled=!nom;clear(v);
    var gv=astGalaxieNom(nom||"?",112);if(!nom)gv.classList.add("cr-vide");v.appendChild(gv);  /* v26 : la galaxie de la carte */
  }
  inp.addEventListener("input",apercu);apercu();
  f.addEventListener("submit",function(e){e.preventDefault();if(trim(inp.value))crCreerUnivers(inp.value);});
  row.appendChild(lab);row.appendChild(inp);bt.appendChild(ok);row.appendChild(bt);f.appendChild(row);s.appendChild(f);
  if(CR.premier){var nv=el("div","onb-nav");nv.appendChild(crBouton(tx("cr.retour"),"b-cr-prec","link",function(){crAller("bienvenue");}));s.appendChild(nv);}
  else s.appendChild(el("p","src",tx("cr.sys_apres")));
}
function crCreerUnivers(nom){
  if(COS.vol)return;
  nom=mondeTexte(nom,40);if(!nom)return;
  var id=crIdLibre(packSlug(nom)||"univers",function(x){return !!UNIV_BY[x];});
  var u={id:id,nom:nom,description:"",libelle:tx("cr.libelle_defaut"),vide:"",galaxie:galaxieDe(nom),cree:Date.now()};
  MONDES.univers.push(u);mondesEnregistrer();
  var U=mondeUnivers(u);UNIVERS.push(U);UNIV_BY[id]=U;
  CR.univers=id;
  crNaissance(U,function(){CR.etape="systemes";crRendre();});
}
/* La naissance d'un univers, avec la caméra du passage d'un univers à l'autre (12g) : la page recule, la galaxie
   naît de son cœur en tournant (un éclat, puis ses bras), se penche, son nom s'écrit dessous, puis la caméra plonge
   dedans et la suite (ses systèmes) arrive du cœur. Moins de mouvement : un fondu. */
function crNaissance(u,suite){
  var sc=$("scene"),fait=false;
  function bascule(){if(fait)return;fait=true;suite();sc.scrollTop=0;$("cos-annonce").textContent=tx("cr.univ_cree",{nom:u.nom});}
  if(!sc.animate||COS.vol){bascule();return;}
  COS.vol=true;
  if(cosMoinsDeMouvement()){
    var f=sc.animate([{opacity:1},{opacity:0,offset:.5},{opacity:1}],{duration:420,easing:"ease-in-out"});
    setTimeout(bascule,210);f.onfinish=function(){COS.vol=false;};
    return;
  }
  var g=cosPreparer(),G=g.G,cos=$("cosmos"),piste=$("cos-piste"),loin=$("cos-loin"),pres=$("cos-pres"),gx=u.galaxie,col=cosCouleur(u);
  clear(piste);
  var w=el("div","cos-gal"),pl=el("div","cos-plan"),di=el("div","cos-disque"),c=cosGalaxie(u,G),fl=cosFloue(u,G),nom=el("div","cos-nom"),ec=el("div","cos-eclat"),E=Math.round(G*.9);
  w.style.left=w.style.top=(-G/2)+"px";w.style.width=w.style.height=G+"px";
  di.style.left=di.style.top=(-G/2)+"px";di.style.width=di.style.height=G+"px";
  fl.className="cos-flou";c.className="cos-net";di.appendChild(fl);di.appendChild(c);pl.appendChild(di);w.appendChild(pl);
  ec.style.left=ec.style.top=Math.round((G-E)/2)+"px";ec.style.width=ec.style.height=E+"px";
  ec.style.background="radial-gradient(circle,"+col(.6)+" 0%,"+col(.22)+" 30%,"+col(0)+" 68%)";w.appendChild(ec);
  var a=G/2,b=G/2*gx.aplatissement,hy=Math.sqrt(a*a*Math.pow(Math.sin(gx.inclinaison),2)+b*b*Math.pow(Math.cos(gx.inclinaison),2));
  nom.style.top=Math.round(G/2+hy*.95+12)+"px";
  nom.appendChild(el("span","cos-nom-t",u.nom));nom.appendChild(el("span","cos-nom-s",tx("cr.nouvel_eyebrow")));
  w.appendChild(nom);piste.appendChild(w);
  var bs=window.getComputedStyle(document.body),y=window.pageYOffset||0;
  sc.style.paddingTop=bs.paddingTop;sc.style.paddingBottom=bs.paddingBottom;
  sc.classList.add("cam");sc.scrollTop=y;
  cos.hidden=false;document.body.classList.add("en-vol");
  var L=Math.log(COS_Z),L0=Math.log(1.5),NAIT=cosBezier(.16,1,.3,1),kS=[],kP=[],kL=[],kN=[],kD=[],kX=[],k,t,z,s,r,n,ech,op,flou;
  for(k=0;k<=COS_N;k++){
    t=k/COS_N;
    /* caméra : léger recul pendant la naissance, puis plongée */
    z=L0*(1-COS_RECUL(cosSeg(t,0,.36)))+L*COS_PLONGE(cosSeg(t,.62,1));s=Math.exp(z);
    r=9*Math.sin(2*Math.PI*COS_DOUX(t));
    kP.push({offset:t,transform:"perspective(1000px) rotateZ("+r.toFixed(2)+"deg) scale("+s.toFixed(4)+")"});
    kL.push({offset:t,transform:"rotate("+r.toFixed(2)+"deg) scale("+Math.pow(s,.12).toFixed(4)+")"});
    kN.push({offset:t,transform:"rotate("+(r*1.15).toFixed(2)+"deg) scale("+Math.pow(s,.42).toFixed(4)+")"});
    /* la galaxie : née d'un point, en tournant vite puis de moins en moins */
    n=NAIT(cosSeg(t,.06,.5));
    kD.push({offset:t,opacity:+cosSeg(t,.04,.16).toFixed(3),transform:"rotate("+(-420*(1-n)-70*t).toFixed(2)+"deg) scale("+(.03+.97*n).toFixed(4)+")"});
    /* la page : l'ancienne recule et s'efface ; la nouvelle arrive du cœur pendant la plongée */
    if(t<.5){ech=1-.82*COS_RECUL(cosSeg(t,0,.3));op=1-cosSeg(t,.06,.24);}
    else{ech=s/COS_Z;op=cosSeg(t,.74,.93);}
    kS.push({offset:t,transform:"rotate("+r.toFixed(2)+"deg) scale("+ech.toFixed(4)+")",opacity:+op.toFixed(3),
      borderRadius:(t<.5?28*cosSeg(t,0,.12):28*(1-cosSeg(t,.85,1))).toFixed(1)+"px"});
    flou=Math.max(0,Math.min(1,(z-Math.log(1.8))/(Math.log(COS_Z*.6)-Math.log(1.8))));
    kX.push({offset:t,opacity:+(1-flou).toFixed(3)});
  }
  var o={duration:CR_T,fill:"both"},inc="rotate("+gx.inclinaison+"rad) ",face=inc+"scaleY(1)",plat=inc+"scaleY("+gx.aplatissement+")";
  var anims=[sc.animate(kS,o),piste.animate(kP,o),loin.animate(kL,o),pres.animate(kN,o),di.animate(kD,o),c.animate(kX,o),
    pl.animate([{offset:0,transform:face},{offset:.3,transform:face},{offset:.5,transform:plat},{offset:.64,transform:plat},{offset:1,transform:face}],{duration:CR_T,fill:"both",easing:"linear"}),
    ec.animate([{offset:0,opacity:0,transform:"scale(.2)"},{offset:.05,opacity:0,transform:"scale(.2)"},{offset:.13,opacity:1,transform:"scale(.9)"},{offset:.36,opacity:0,transform:"scale(2.2)"},{offset:1,opacity:0,transform:"scale(2.2)"}],o),
    nom.animate([{offset:0,opacity:0},{offset:.34,opacity:0},{offset:.44,opacity:1},{offset:.6,opacity:1},{offset:.68,opacity:0},{offset:1,opacity:0}],o)];
  (function guette(){
    if(fait)return;
    var x=anims[0].currentTime;
    if(x!==null&&x>=CR_T*.5){bascule();var b2=window.getComputedStyle(document.body);sc.style.paddingTop=b2.paddingTop;sc.style.paddingBottom=b2.paddingBottom;return;}
    window.requestAnimationFrame(guette);
  })();
  anims[0].onfinish=function(){
    bascule();
    sc.classList.remove("cam");sc.style.paddingTop="";sc.style.paddingBottom="";
    anims.forEach(function(x){try{x.cancel();}catch(e){}});
    cos.hidden=true;clear(piste);document.body.classList.remove("en-vol");
    try{window.scrollTo(0,0);}catch(e){}
    COS.vol=false;
    try{$("cr-sys-nom").focus({preventScroll:true});}catch(e){}
  };
}

/* ---------- Les systèmes d'un univers ---------- */
function crSystemes(s){
  var U=UNIV_BY[CR.univers]||univ(),mine=univMats(U.id),orb,liste,nomIn,plIn,ajout,fin,note;
  CR.univers=U.id;
  crTete(s,mine.length?tnx("cr.sys_n",mine.length,{nom:U.nom}):tx("cr.sys_0",{nom:U.nom}),0,0,null);
  var v=el("div","cr-vue");orb=crSysteme(CR.pl,U,"sys-edit");orb.id="cr-orrery";v.appendChild(orb);
  var leg=el("p","cr-leg");v.appendChild(leg);s.appendChild(v);
  s.appendChild(el("h1","h-mid",mine.length?tx("cr.h_ajoute"):tx("cr.h_cree")));
  s.appendChild(el("p","lead",tx("cr.sys_lead")));
  var f=el("div","pcard cr-form"),r1=el("div","prow"),r2=el("div","prow");
  var l1=el("label","plab",tx("cr.nom_matiere"));nomIn=el("input","field");nomIn.id="cr-sys-nom";nomIn.type="text";nomIn.maxLength=60;nomIn.placeholder=tx("cr.sys_ph");nomIn.value=CR.sysNom;l1.setAttribute("for","cr-sys-nom");
  r1.appendChild(l1);r1.appendChild(nomIn);
  var l2=el("label","plab",tx("cr.parties")),ligne=el("div","cr-ligne");
  plIn=el("input","field");plIn.id="cr-pl-nom";plIn.type="text";plIn.maxLength=60;plIn.placeholder=tx("cr.pl_ph");l2.setAttribute("for","cr-pl-nom");
  var plOk=crBouton(tx("cr.ajouter"),"b-cr-pl","sbtn sbtn-2",ajouterPlanete);
  ligne.appendChild(plIn);ligne.appendChild(plOk);
  liste=el("ul","cr-pls");liste.id="cr-pl-liste";
  r2.appendChild(l2);r2.appendChild(ligne);r2.appendChild(liste);
  note=el("p","src cr-note");note.id="cr-note";note.setAttribute("role","status");r2.appendChild(note);
  ajout=crBouton(tx("cr.ajouter_sys"),"b-cr-sys","sbtn",function(){if(crAjouterSysteme()){crRendre();try{$("cr-sys-nom").focus({preventScroll:true});}catch(e){}}});
  var bt=el("div","ag-btns");bt.appendChild(ajout);r2.appendChild(bt);
  f.appendChild(r1);f.appendChild(r2);s.appendChild(f);
  /* Les systèmes déjà créés dans cet univers */
  if(mine.length){
    s.appendChild(el("h2",null,tx("cr.dans",{nom:U.nom})));
    var g=el("div","group cr-sys-liste");g.id="cr-sys-liste";
    mine.forEach(function(k){
      var M=MATS[k],it=el("div","cr-sys"),mini=crSysteme(M.THEMES.map(function(t){return {nom:t.n,id:t.k};}),U,"sys-mini",matCouleur(k)%8);
      it.appendChild(mini);
      var tx=el("div","cr-sys-tx");tx.appendChild(el("p","cr-sys-t",M.titre));
      tx.appendChild(el("p","src",M.THEMES.length?tnx("cr.planetes",M.THEMES.length)+" · "+M.THEMES.map(function(t){return t.n;}).join(", "):tx("cr.aucune_pl_pour_l_instant")));
      it.appendChild(tx);g.appendChild(it);
    });
    s.appendChild(g);
  }
  var nv=el("div","onb-nav cr-fin");
  fin=crBouton(CR.premier?tx("cr.c_est_parti"):tx("cr.terminer"),"b-cr-fin","sbtn",crFinir);
  nv.appendChild(el("span"));nv.appendChild(fin);s.appendChild(nv);
  function maj(){
    var nom=trim(nomIn.value);CR.sysNom=nomIn.value;
    ajout.disabled=!nom;fin.disabled=!nom&&!mine.length;
    leg.textContent=tx("cr.leg",{nom:nom||tx("cr.ta_matiere"),pl:CR.pl.length?tnx("cr.planetes",CR.pl.length):tx("cr.aucune_pl")});
    clear(liste);
    CR.pl.forEach(function(p,i){
      var li=el("li","cr-pl"),dot=el("i"),x=el("button","cr-pl-x","×");
      dot.style.background="var(--t"+(i%8)+")";
      x.type="button";x.setAttribute("aria-label",tx("cr.retirer",{nom:p.nom}));
      x.addEventListener("click",function(){CR.pl.splice(i,1);crOrbites(orb,CR.pl);maj();try{plIn.focus();}catch(e){}});
      li.appendChild(dot);li.appendChild(el("span",null,p.nom));li.appendChild(x);liste.appendChild(li);
    });
  }
  function ajouterPlanete(){
    var nom=mondeTexte(plIn.value,60);
    if(!nom)return;
    if(CR.pl.length>=12){note.textContent=tx("cr.max12");return;}
    if(CR.pl.some(function(p){return p.nom.toLowerCase()===nom.toLowerCase();})){note.textContent=tx("cr.deja",{nom:nom});return;}
    note.textContent="";CR.pl.push({nom:nom});plIn.value="";crOrbites(orb,CR.pl);maj();
    try{plIn.focus();}catch(e){}
  }
  nomIn.addEventListener("input",maj);
  nomIn.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();try{plIn.focus();}catch(x){}}});
  plIn.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();ajouterPlanete();}});
  maj();
}
/* Le système en cours devient une matière (en préparation) de l'univers */
function crAjouterSysteme(){
  var nom=mondeTexte(CR.sysNom,60);if(!nom)return false;
  function pris(x){return !!MATS[x]||!!MONDES_BY[x]||RECETTES.some(function(r){return r.id===x||r.stockage==="qfcc2.pk."+x+".";});}
  var id=crIdLibre(packSlug(nom)||"systeme",pris),vus={},pl=[];
  CR.pl.forEach(function(p,i){var pid=crIdLibre(packSlug(p.nom)||"partie-"+(i+1),function(x){return !!vus[x];});vus[pid]=1;pl.push({id:pid,nom:p.nom});});
  var sy={id:id,univers:CR.univers,nom:nom,stockage:"qfcc2.pk."+id+".",planetes:pl,cree:Date.now()};
  MONDES.systemes.push(sy);MONDES_BY[id]=sy;mondesEnregistrer();
  var r=systemeRecette(sy);RECETTES.push(r);MATS[id]=matiereDe(r);MATS_ORDER.push(id);
  CR.sysNom="";CR.pl=[];
  return true;
}
function crFinir(){
  if(trim(CR.sysNom))crAjouterSysteme();
  if(!univMats(CR.univers).length){var n=$("cr-note");if(n)n.textContent=tx("cr.au_moins");return;}
  if(!PROF)profilSave("");
  univFixer(CR.univers);univPoser(CR.univers);
  if(CR.depuis==="bach"){renderBach();show("bach");}else{BACK="hub";renderHub();show("hub");}
}

/* ---------- Importer ses données (premier lancement) : le même outil que Profil › Sauvegarder (12m) ---------- */
function crImporter(s){
  crTete(s,tx("cr.donnees"),0,0,null);
  s.appendChild(el("h1","h-mid",tx("cr.imp_h")));
  s.appendChild(el("p","lead",tx("cr.imp_lead")));
  var box=el("div","pcard");s.appendChild(box);
  dxWidget(box,"crdx");
  var nv=el("div","onb-nav");nv.appendChild(crBouton(tx("cr.retour"),"b-cr-prec","link",function(){crAller("bienvenue");}));s.appendChild(nv);
}

/* ---------- Univers et systèmes dans le profil ---------- */
function mondesEnregistrer(){
  MONDES.maj=Date.now();
  if(!PROF)profilSave("");
  PROF.mondes=JSON.parse(JSON.stringify(MONDES));
  save(KPROF,PROF);profilPush();
}
/* Profil arrivé du compte (13) : les univers et systèmes créés sur un autre appareil rejoignent ceux d'ici */
function mondesSuivreCompte(){
  if(!PROF||!PROF.mondes)return;
  var m=mondesUnion(MONDES,PROF.mondes),ch=false;
  m.univers.forEach(function(u){if(!UNIV_BY[u.id]){var U=mondeUnivers(u);UNIVERS.push(U);UNIV_BY[u.id]=U;ch=true;}});
  m.systemes.forEach(function(sy){
    MONDES_BY[sy.id]=sy;
    if(!MATS[sy.id]&&UNIV_BY[sy.univers]){var r=systemeRecette(sy);RECETTES.push(r);MATS[sy.id]=matiereDe(r);MATS_ORDER.push(sy.id);ch=true;}
  });
  MONDES=m;
  if(!ch)return;
  if(ECRAN==="creer"&&CR.premier&&(CR.etape==="bienvenue"||CR.etape==="presentation")&&MATS_ORDER.length){univDemarrer();renderHub();show("hub");}
  else if(ECRAN==="hub"&&MAT)renderHub();
  else if(ECRAN==="bach"&&MAT)renderBach();
}

/* ---------- La page d'un système sans cours : comment le remplir ---------- */
function crEntete(sy){
  var l=["# Pack · "+sy.nom,"","Titre : "+sy.nom,"Identifiant : "+sy.id,"Univers : "+sy.univers];  /* l'en-tête de docs/modele-de-pack.md */
  sy.planetes.forEach(function(p){l.push("Thème : "+p.id+" · "+p.nom);});
  return l.join("\n");
}
/* choix : « doc » (langue des documents : consigne et phrase dans la langue de l'app, plus une ligne qui demande d'écrire le cours
   dans la langue des documents fournis), « fr » ou « en » (consigne et phrase dans cette langue) ; 00 : modelePack */
function crDemande(sy,choix){
  var U=UNIV_BY[sy.univers],doc=!choix||choix==="doc",l=doc?LANG:choix;
  return modelePack(l)+"\n\n---\n\n"+(doc?tl(l,"cr.ligne_langue_docs")+"\n\n":"")+tl(l,"cr.demande",{nom:sy.nom,u:U?" ("+U.nom+")":""})+"\n\n"+crEntete(sy)+"\n";
}
function crRemplir(box){
  if(!MAT||MAT.ready||!MONDES_BY[MAT.k])return;
  var sy=MONDES_BY[MAT.k],U=UNIV_BY[sy.univers]||univ();
  var v=el("div","cr-vue");v.appendChild(crSysteme(sy.planetes,U));box.appendChild(v);
  if(sy.planetes.length){
    var ul=el("ul","cr-pls cr-pls-lu");
    sy.planetes.forEach(function(p,i){var li=el("li","cr-pl"),d=el("i");d.style.background="var(--t"+(i%8)+")";li.appendChild(d);li.appendChild(el("span",null,p.nom));ul.appendChild(li);});
    box.appendChild(ul);
  }
  box.appendChild(el("h2",null,tx("cr.remplir_h")));
  var ol=el("ol","pk-etapes");
  [tx("cr.etape1"),tx("cr.etape2"),tx("cr.etape3")].forEach(function(x){ol.appendChild(el("li",null,x));});
  box.appendChild(ol);
  var bt=el("div","ag-btns"),note=el("p","src pk-note"),zone=el("div");note.setAttribute("role","status");
  /* Langue du cours : la langue des documents (par défaut), ou la consigne française / anglaise */
  var lc=el("div","prow cr-langue"),ch=el("div","chips regl-modes"),opts=[["doc",tx("cr.lc_doc")]];
  ["fr","en"].forEach(function(x){if(MODELE_PACKS[x])opts.push([x,tl(x,"langue.nom")]);});
  if(!CR.langueCours)CR.langueCours="doc";
  lc.appendChild(el("p","plab",tx("cr.lc_titre")));
  opts.forEach(function(o){
    var b=el("button","chip"+(CR.langueCours===o[0]?" sel":""),o[1]);b.type="button";b.id="cr-lc-"+o[0];
    b.setAttribute("aria-pressed",CR.langueCours===o[0]?"true":"false");
    if(o[0]!=="doc")b.setAttribute("lang",o[0]);
    b.addEventListener("click",function(){
      CR.langueCours=o[0];
      [].forEach.call(ch.querySelectorAll(".chip"),function(c){var on=c===b;c.classList.toggle("sel",on);c.setAttribute("aria-pressed",on?"true":"false");});
    });
    ch.appendChild(b);
  });
  lc.appendChild(ch);box.appendChild(lc);
  bt.appendChild(crBouton(tx("cr.copier"),"b-cr-copier","sbtn",function(){
    var ch2=CR.langueCours||"doc";
    copierTexte(crDemande(sy,ch2),note,zone,tl(ch2==="doc"?LANG:ch2,"cr.demande_copiee"));
  }));
  bt.appendChild(crBouton(tx("cr.importer_cours"),"b-cr-importer-cours","link",function(){openPacks();}));
  box.appendChild(bt);box.appendChild(note);box.appendChild(zone);
  box.appendChild(el("p","src cr-langue-note",tx("cr.langue_note")));
}
