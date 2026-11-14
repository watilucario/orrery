/* ---------- Visite guidée (v18.2) ----------
   Demande de l'auteur (10 nov., après un essai) : le guide était trop long à lire, il ne parlait ni du carnet d'erreurs, ni de la
   carte, ni de l'agenda, et on y créait un univers sans pouvoir créer ses matières. Il faut un guide court, sur les vrais écrans,
   qui oblige un peu à agir mais reste fluide.
   Un voile qui éclaire l'élément visé (le halo glisse d'une cible à l'autre), une carte qui dit une chose en une phrase, et,
   quand c'est utile, un geste à faire (dire si on était sûr, taper le nom de son univers). Rien n'est enregistré, sauf si on
   ajoute soi-même le cours d'exemple. Lancée à la première visite (fin de 13) et depuis Profil › Revoir le guide.
   Moins de mouvement : le halo et la carte apparaissent sans glisser. */
var KVISITE="qfcc2.visite";
var VIS={i:0,steps:[],retour:"hub",actif:false,val:{},ferme:false};

function visDejaVue(){return !!load(KVISITE,0);}
function visCible(sel){var e=null;try{e=document.querySelector(sel);}catch(x){}return e&&e.offsetParent!==null&&!e.hidden?e:null;}
function visMoinsMouvement(){try{return window.matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){return false;}}

/* Les étapes. cible : sélecteur de l'élément éclairé (sans cible : tout est voilé) ; ecran : prépare l'écran avant de viser ;
   demo : contenu interactif de la carte ; requis : un geste à faire avant « Suivant » (VIS.val.<clé>). */
function visEtapes(){
  var l=[];
  /* Ordre voulu par l'auteur (10 nov.) : d'abord l'idée d'Orrery (un univers, ses cours), puis la méthode (séance, sûr ou pas,
     erreurs, examens). Chaque étape tient en une phrase et, si possible, en un geste. */
  l.push({t:tx("zvis.s1_t"),p:tx("zvis.s1_p"),
    ecran:function(){renderHub();show("hub");},cible:"#b-hub-soleil",repli:"#b-hub-univers",demo:visDemoUnivers,requis:"univers"});
  l.push({t:tx("zvis.s2_t"),p:tx("zvis.s2_p"),
    demo:visDemoImport});
  l.push({t:tx("zvis.s3_t"),p:tx("zvis.s3_p"),
    ecran:function(){renderHub();show("hub");},cible:"#hub-cta .orr-cta-b",demo:visDemoConfiance,requis:"conf"});
  l.push({t:tx("zvis.s4_t"),p:tx("zvis.s4_p"),
    ecran:function(){renderBach();show("bach");},cible:"#bach-carnet",repli:"#tab-rev",demo:visDemoCarnet});
  l.push({t:tx("zvis.s5_t"),p:tx("zvis.s5_p"),
    ecran:function(){renderHub();show("hub");},cible:"#b-agenda"});
  l.push({t:tx("zvis.s6_t"),p:tx("zvis.s6_p"),
    ecran:function(){renderHub();show("hub");},cible:"#hub-cta .orr-cta-b",fin:true});
  return l;
}

function visConstruire(){
  if($("visite"))return;
  var r=el("div","vis");r.id="visite";r.hidden=true;
  var bloc=el("div","vis-bloc"),halo=el("div","vis-halo"),c=el("div","vis-carte");
  c.setAttribute("role","dialog");c.setAttribute("aria-modal","true");c.setAttribute("aria-labelledby","vis-t");
  var pts=el("div","vis-pts");pts.id="vis-pts";pts.setAttribute("aria-hidden","true");
  var skip=el("button","link vis-skip",tx("zvis.passer"));skip.type="button";skip.id="b-vis-skip";
  var haut=el("div","vis-haut");haut.appendChild(pts);haut.appendChild(skip);
  var t=el("h2","vis-t");t.id="vis-t";var p=el("p","vis-p");p.id="vis-p";
  var demo=el("div","vis-demo");demo.id="vis-demo";
  var nav=el("div","vis-nav"),pr=el("button","link",tx("zvis.precedent")),nx=el("button","sbtn",tx("zvis.suivant"));
  pr.type=nx.type="button";pr.id="b-vis-prev";nx.id="b-vis-next";
  nav.appendChild(pr);nav.appendChild(nx);
  c.appendChild(haut);c.appendChild(t);c.appendChild(p);c.appendChild(demo);c.appendChild(nav);
  r.appendChild(bloc);r.appendChild(halo);r.appendChild(c);document.body.appendChild(r);
  skip.addEventListener("click",function(){visFermer(false);});
  pr.addEventListener("click",function(){if(VIS.i>0)visAller(VIS.i-1);});
  nx.addEventListener("click",visSuivant);
  document.addEventListener("keydown",function(e){
    if(!VIS.actif)return;
    if(e.key==="Escape"){e.preventDefault();visFermer(false);}
  });
  window.addEventListener("resize",function(){if(VIS.actif)visPlacer(false);});
}

/* Lance la visite. retour : écran où revenir à la fin (« hub » ou « prof ») */
function visLancer(retour){
  visConstruire();
  VIS.steps=visEtapes();VIS.retour=retour||"hub";VIS.actif=true;VIS.val={};VIS.ferme=false;
  var r=$("visite");r.hidden=false;r.className="vis";
  VIS.i=-1;visAller(0);
}
function visSuivant(){
  var s=VIS.steps[VIS.i];
  if(!s)return;
  if(s.requis&&!VIS.val[s.requis])return;
  if(s.fin){visFermer(true);return;}
  visAller(VIS.i+1);
}
function visAller(i){
  var s=VIS.steps[i];if(!s)return;
  var avant=VIS.i;VIS.i=i;
  if(s.ecran){try{s.ecran();}catch(e){}}
  visRendre(s,avant);
  /* laisser l'écran se mettre en page avant de mesurer la cible */
  window.setTimeout(function(){if(VIS.actif&&VIS.i===i)visPlacer(true);},60);
  /* l'écran arrive en glissant (620 ms) : on repose le halo quand il est en place, sinon il vise l'ancienne position */
  window.setTimeout(function(){if(VIS.actif&&VIS.i===i)visPlacer(true);},700);
}
function visRendre(s,avant){
  var n=VIS.steps.length,pts=$("vis-pts"),k;
  clear(pts);for(k=0;k<n;k++)pts.appendChild(el("i",k<=VIS.i?"on":""));
  $("vis-t").textContent=s.t;$("vis-p").textContent=nb(s.p);
  var d=$("vis-demo");clear(d);d.hidden=!s.demo;
  if(s.demo)s.demo(d);
  $("b-vis-prev").style.visibility=VIS.i?"visible":"hidden";
  $("b-vis-skip").hidden=!!s.fin;
  var nx=$("b-vis-next");
  nx.textContent=s.fin?tx("zvis.parti"):tx("zvis.suivant");
  visBouton();
  var c=document.querySelector("#visite .vis-carte");
  c.classList.remove("vis-in");void c.offsetWidth;c.classList.add("vis-in");
}
/* « Suivant » reste grisé tant que le geste demandé n'est pas fait */
function visBouton(){
  var s=VIS.steps[VIS.i],nx=$("b-vis-next");if(!s||!nx)return;
  var bloque=!!(s.requis&&!VIS.val[s.requis]);
  nx.disabled=bloque;nx.setAttribute("aria-disabled",bloque?"true":"false");
}
/* Place le halo sur la cible, et la carte du côté où elle ne la cache pas */
function visPlacer(anime){
  var s=VIS.steps[VIS.i],halo=document.querySelector("#visite .vis-halo"),c=document.querySelector("#visite .vis-carte");
  if(!s||!halo||!c)return;
  var e=s.cible?visCible(s.cible):null;
  if(!e&&s.repli)e=visCible(s.repli);
  var W=window.innerWidth,H=window.innerHeight,x,y,w,h,bas=true;
  if(e){
    try{e.scrollIntoView({block:"nearest",inline:"nearest"});}catch(x0){}
    try{var hh=document.querySelector(".hero");if(hh)hh.scrollLeft=0;document.documentElement.scrollLeft=0;}catch(x1){}
    var q=e.getBoundingClientRect(),m=6;
    x=q.left-m;y=q.top-m;w=q.width+2*m;h=q.height+2*m;
    /* une cible qui déborde de l'écran (la galaxie de l'en-tête) : le halo reste dans l'écran */
    if(x<4){w-=4-x;x=4;}if(y<4){h-=4-y;y=4;}if(x+w>W-4)w=W-4-x;if(y+h>H-4)h=H-4-y;
    bas=(q.top+q.height/2)<H*0.55;  /* cible en haut : la carte descend */
    halo.classList.remove("vis-sans");
    try{var br=parseFloat(window.getComputedStyle(e).borderTopLeftRadius)||0;halo.style.borderRadius=(br>0?br+m:16)+"px";}catch(x2){}
  }else{x=W/2;y=H*0.4;w=0;h=0;halo.classList.add("vis-sans");}
  if(!anime||visMoinsMouvement())halo.classList.add("vis-net");else halo.classList.remove("vis-net");
  halo.style.left=Math.round(x)+"px";halo.style.top=Math.round(y)+"px";halo.style.width=Math.round(w)+"px";halo.style.height=Math.round(h)+"px";
  c.classList.toggle("vis-haut-carte",!bas);
}

/* Fin : la carte se range vers l'onglet « Aujourd'hui », comme une fenêtre qui rejoint le Dock (sauf moins de mouvement) */
function visFermer(fini){
  if(!VIS.actif||VIS.ferme)return;
  VIS.ferme=true;
  save(KVISITE,1);
  var r=$("visite"),c=r.querySelector(".vis-carte"),halo=r.querySelector(".vis-halo");
  function fin(){
    VIS.actif=false;r.hidden=true;r.className="vis";c.removeAttribute("style");
    if(VIS.retour==="prof"){try{openProf();}catch(e){}}
    else{try{renderHub();show("hub");}catch(e){}
      if(fini){var b=visCible("#hub-cta .orr-cta-b");if(b){try{b.click();}catch(e){}}}}
  }
  if(visMoinsMouvement()){fin();return;}
  var t=visCible("#tab-hub")||visCible("#tab-prof"),q=c.getBoundingClientRect(),dx=0,dy=0;
  if(t){var u=t.getBoundingClientRect();dx=(u.left+u.width/2)-(q.left+q.width/2);dy=(u.top+u.height/2)-(q.top+q.height/2);}
  r.classList.add("vis-sort");
  c.style.transformOrigin="50% 50%";
  c.style.transform="translate("+Math.round(dx)+"px,"+Math.round(dy)+"px) scale(.06)";
  c.style.opacity="0";halo.style.opacity="0";
  window.setTimeout(fin,560);
}

/* ----- Étape « Dis si tu étais sûr » : on touche, on voit quand la question reviendrait ----- */
function visDemoConfiance(box){
  var q=el("p","vis-q",tx("zvis.q_demo")),
      rep=el("div","vis-rep"),res=el("div","vis-res");
  [[tx("zvis.c_hasard"),tx("zvis.c_hasard_r"),18],[tx("zvis.c_hesite"),tx("zvis.c_hesite_r"),46],[tx("zvis.c_sur"),tx("zvis.c_sur_r"),92]].forEach(function(x,i){
    var b=el("button","cbtn",x[0]);b.type="button";b.id="vis-conf-"+i;
    b.addEventListener("click",function(){
      VIS.val.conf=1;
      [].slice.call(rep.childNodes).forEach(function(n){n.className="cbtn";});b.className="cbtn sel";
      clear(res);
      var barre=el("div","vis-barre"),rem=el("i");barre.appendChild(rem);
      res.appendChild(el("p","vis-res-t",x[1]));res.appendChild(barre);
      rem.style.width="0%";void rem.offsetWidth;rem.style.width=x[2]+"%";
      visBouton();
    });
    rep.appendChild(b);
  });
  box.appendChild(q);box.appendChild(rep);box.appendChild(res);
}

/* ----- Étape « Rien ne se perd » : une erreur part au carnet, puis revient en séance ----- */
function visDemoCarnet(box){
  var f=el("div","vis-boucle");
  f.setAttribute("aria-hidden","true");
  f.appendChild(el("span","vis-b-n vis-b-1",tx("zvis.b_seance")));
  f.appendChild(el("span","vis-b-n vis-b-2",tx("zvis.b_carnet")));
  f.appendChild(el("span","vis-b-n vis-b-3",tx("zvis.b_seance")));
  var pt=el("i","vis-b-pt");pt.textContent="✗";f.appendChild(pt);
  box.appendChild(f);
}

/* ----- Étape « Crée ton univers » : le nom et les matières sont à toi ----- */
function visDemoUnivers(box){
  var V=VIS.val;if(!V.mats)V.mats=[];if(typeof V.nom!=="string")V.nom="";
  var l1=el("label","plab",tx("zvis.u_nom")),inp=el("input","field");
  l1.setAttribute("for","vis-nom");inp.id="vis-nom";inp.type="text";inp.maxLength=40;inp.placeholder=tx("zvis.u_nom_ph");
  inp.setAttribute("autocomplete","off");inp.value=V.nom;
  var ex=el("div","chips vis-ex"),
      l2=el("label","plab vis-l2",tx("zvis.u_matieres")),ligne=el("div","vis-ligne"),im=el("input","field"),ab=el("button","sbtn",tx("zvis.ajouter")),
      pil=el("div","chips vis-mats"),vue=el("div","vis-univers");
  l2.setAttribute("for","vis-mat");im.id="vis-mat";im.type="text";im.maxLength=40;im.placeholder=tx("zvis.u_mat_ph");im.setAttribute("autocomplete","off");
  ab.type="button";ab.id="b-vis-mat";
  ligne.appendChild(im);ligne.appendChild(ab);
  function dessiner(){
    var nom=trim(V.nom),u={id:"apercu:"+(nom||"?"),galaxie:galaxieDe(nom||"?")};
    clear(vue);var ce=document.createElement("canvas"),dp=Math.min(2,window.devicePixelRatio||1);ce.width=ce.height=Math.round(110*dp);ce.style.width=ce.style.height="110px";ce.setAttribute("aria-hidden","true");astVignetteEtoile(ce,{vi:(Math.floor(astGraine(nom||"?")*10)%AST_ETOILES.length)});if(!nom)ce.style.opacity=".35";vue.appendChild(ce);
    var tt=el("div","vis-ut");
    tt.appendChild(el("p","onb-uphrase",nom?nom:tx("zvis.u_galaxie")));
    tt.appendChild(el("p","src",V.mats.length?tnx("zvis.u_orbite",V.mats.length):tx("zvis.u_ajoute")));
    vue.appendChild(tt);
    clear(ex);
    if(!nom){[tx("zvis.ex1"),tx("zvis.ex2"),tx("zvis.ex3")].forEach(function(n){var b=el("button","chip",n);b.type="button";b.addEventListener("click",function(){V.nom=n;inp.value=n;dessiner();});ex.appendChild(b);});}
    clear(pil);
    V.mats.forEach(function(m,i){
      var b=el("button","chip sel",m+"  ✕");b.type="button";b.setAttribute("aria-label",tx("zvis.retirer",{m:m}));
      b.addEventListener("click",function(){V.mats.splice(i,1);dessiner();});pil.appendChild(b);
    });
    V.univers=!!nom;visBouton();
  }
  function ajouter(){var v=trim(im.value);if(!v||V.mats.length>=8)return;if(V.mats.indexOf(v)<0)V.mats.push(v);im.value="";dessiner();im.focus();}
  inp.addEventListener("input",function(){V.nom=inp.value;dessiner();});
  ab.addEventListener("click",ajouter);
  im.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();ajouter();}});
  box.appendChild(l1);box.appendChild(inp);box.appendChild(ex);box.appendChild(l2);box.appendChild(ligne);box.appendChild(pil);box.appendChild(vue);
  dessiner();
}

/* ----- Étape « Ajoute tes cours » : trois temps, puis le vrai lecteur de packs sur un cours d'exemple ----- */
function visDemoImport(box){
  var fl=el("div","vis-flux");
  [["1",tx("zvis.f1"),tx("zvis.f1_s")],["2",tx("zvis.f2"),tx("zvis.f2_s")],["3","Orrery",tx("zvis.f3_s")]].forEach(function(x,i){
    var b=el("div","vis-etape");b.appendChild(el("span","vis-n",x[0]));b.appendChild(el("strong",null,x[1]));b.appendChild(el("span","src",x[2]));
    fl.appendChild(b);if(i<2)fl.appendChild(el("span","vis-fl","→"));
  });
  var zone=el("div","vis-imp"),pack=String(typeof PACK_EXEMPLE==="string"?PACK_EXEMPLE:"");
  function essayer(){
    clear(zone);
    var res=packLire(pack);
    if(!res.r){zone.appendChild(el("p","pk-avert",res.err[0]||tx("zvis.illisible")));return;}
    var c=el("div","pcard vis-res-pack");c.appendChild(el("p","plab",res.r.titre));c.appendChild(el("p","src",packCompte(res.r)));
    zone.appendChild(c);
    if(PACKS[res.r.id]&&PACKS[res.r.id].r){zone.appendChild(el("p","src",tx("zvis.deja")));return;}
    var b=el("button","sbtn",tx("zvis.ajouter_mat"));b.type="button";b.id="b-vis-ajout";
    b.addEventListener("click",function(){
      var r=packEnregistrer(pack,UNIV);clear(zone);
      zone.appendChild(el("p","src",r.err?r.err[0]:tx("zvis.ajoute")));
    });
    zone.appendChild(b);
    zone.appendChild(el("p","src",tx("zvis.pour_les_tiens")));
  }
  var go=el("button","sbtn",tx("zvis.essayer"));go.type="button";go.id="b-vis-essai";
  go.addEventListener("click",essayer);
  box.appendChild(fl);box.appendChild(go);box.appendChild(zone);
}
