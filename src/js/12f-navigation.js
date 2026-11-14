/* ---------- Navigation (v6) : cinq onglets en bas, barre du haut seulement quand elle sert ----------
   Onglets (#tabbar), toujours les mêmes : Aujourd'hui · Réviser · Agenda · Progrès · Profil. C'est le seul moyen de
   changer de rubrique : depuis la v6, plus de menu ☰ ni de ⌂ (un seul chemin par fonction).
   Barre du haut (#appbar), trois formes :
   - écran d'onglet ouvert par son onglet (hub, bach, agenda, evol, prof) : pas de barre, le titre est dans la page ;
   - écran dans une rubrique (matière, listes, résultats) : « ‹ » qui dit où il ramène ;
   - entraînement (quiz, exercice, simulation, série de calcul : focus) : ✕ pour quitter en gardant tout, et le titre ;
     pas d'onglets.
   Le titre n'est écrit dans la barre que si l'écran n'a pas de grand titre (h1) à lui.
   NAV : pour chaque écran, son titre, son onglet et retour() → [libellé, action] ou null (écran racine) ; sans() vrai :
   ni barre ni onglets (v13 : la première configuration de Maitrise, 12l).
   Quitter un écran en cours (✕) passe par navQuitter() : chrono arrêté, brouillon enregistré. Une série, un exercice ou
   une simulation en cours restent à reprendre depuis la matière ou « Aujourd'hui ».
   #menu ne sert plus qu'au choix de l'univers (pastille de « Aujourd'hui », 12g). */
var ECRAN="hub",NAV_PRE={home:"bach",evol:"tab",agenda:"tab",prof:"tab",lire:"hub",plan:"hub"};
function navMat(){return MAT?MAT.titre:t("nv.matiere");}
function navHome(){renderHome();show("home");}
function navHub(){renderHub();show("hub");}
function navRetourMat(){return [navMat(),navHome];}
function navRetourChap(){var th=chapTh();return [themeName(th),function(){openChap(th);}];}
var NAV={
  hub:{titre:t("nv.hub"),onglet:"tab-hub"},
  bach:{titre:t("nv.reviser"),onglet:"tab-rev"},
  home:{titre:navMat,onglet:"tab-rev",retour:function(){
    return NAV_PRE.home==="recherche"?rchLien():NAV_PRE.home==="hub"?[t("nv.hub"),navHub]:NAV_PRE.home==="agenda"?[t("nv.agenda"),function(){openAgenda("tab");}]:[t("nv.reviser"),function(){renderBach();show("bach");}];}},
  /* v13.3 : la page d'un chapitre (08c, openChap) ; ses activités y ramènent (BACK, EXS.ret, CQ.ret, NAV_PRE.fiche) */
  chap:{titre:function(){return chapTh()?themeName(chapTh()):t("nv.chapitre");},onglet:"tab-rev",retour:function(){return rchVia("chap")?rchLien():navRetourMat();}},
  cours:{titre:t("nv.cours"),onglet:"tab-rev",retour:navRetourMat},
  docs:{titre:t("nv.modeles"),onglet:"tab-rev",retour:function(){return rchVia("docs")?rchLien():navRetourMat();}},
  conslist:{titre:t("nv.construire"),onglet:"tab-rev",retour:navRetourMat},
  cons:{titre:function(){return CQ?CQ.c.t:t("nv.construire");},focus:true,retour:function(){return CQ&&CQ.ret==="chap"&&chapTh()?navRetourChap():[t("nv.construire"),openConsList];}},
  fiche:{titre:function(){return FI===SYN_K?t("nv.synthese"):FI?themeName(FI):t("nv.fiche");},onglet:"tab-rev",retour:function(){return NAV_PRE.fiche==="notes"?[t("nv.notes"),openNotes]:NAV_PRE.fiche==="recherche"?rchLien():NAV_PRE.fiche==="plan"?[t("nv.plan"),function(){openPlan(PL.k);}]:NAV_PRE.fiche==="lire"?[t("nv.lire"),function(){openLire(AL.id);}]:NAV_PRE.fiche==="cours"?[t("nv.cours"),openCours]:NAV_PRE.fiche==="chap"&&chapTh()?navRetourChap():navRetourMat();}},
  qcm:{titre:t("nv.qcm"),onglet:"tab-rev",retour:navRetourMat},
  caslist:{titre:t("nv.cas"),onglet:"tab-rev",retour:function(){return rchVia("caslist")?rchLien():navRetourMat();}},
  quiz:{titre:function(){return S?S.label:t("nv.quiz");},focus:true,retour:function(){return [navBackLab(),goBack];}},
  result:{titre:t("nv.bilan"),onglet:"tab-rev",retour:function(){return [navBackLab(),goBack];}},
  exlist:{titre:t("nv.exercices_rediges"),onglet:"tab-rev",retour:function(){return rchVia("exlist")?rchLien():navRetourMat();}},
  ex:{titre:function(){return EXS?EXS.e.t:t("nv.exercice");},focus:true,retour:function(){var s=EXS&&EXS.e.id.indexOf("sim-")===0;return [s?t("nv.resultat"):EXS&&EXS.ret==="chap"&&chapTh()?themeName(chapTh()):t("nv.exercices"),leaveEx];}},
  simstart:{titre:t("nv.simulation"),onglet:"tab-rev",retour:navRetourMat},
  sim:{titre:t("nv.simulation"),focus:true,retour:function(){return [navMat(),function(){navQuitter("sim");navHome();}];}},
  simres:{titre:t("nv.resultat"),onglet:"tab-rev",retour:navRetourMat},
  drillstart:{titre:t("nv.calcul"),onglet:"tab-rev",retour:navRetourMat},
  drill:{titre:t("nv.calcul"),focus:true,retour:function(){return [t("nv.calcul"),function(){drStopT();openDrillStart();}];}},
  drillres:{titre:t("nv.bilan"),onglet:"tab-rev",retour:function(){return [t("nv.calcul"),openDrillStart];}},
  evol:{titre:t("nv.progres"),onglet:"tab-evol",retour:function(){return NAV_PRE.evol==="home"?navRetourMat():NAV_PRE.evol==="hub"?[t("nv.hub"),navHub]:null;}},
  agenda:{titre:t("nv.agenda"),onglet:"b-agenda",retour:function(){return NAV_PRE.agenda==="hub"?[t("nv.hub"),navHub]:NAV_PRE.agenda==="home"?navRetourMat():null;}},
  prof:{titre:t("nv.profil"),onglet:"tab-prof"},
  packs:{titre:t("nv.importer"),onglet:"tab-prof",retour:function(){return [t("nv.profil"),openProf];}},
  sauve:{titre:t("nv.sauvegarde"),onglet:"tab-prof",retour:function(){return [t("nv.profil"),openProf];}},
  creer:{titre:t("nv.creer"),focus:true,sans:function(){return CR.premier;},retour:function(){return [CR.depuis==="bach"?t("nv.reviser"):t("nv.hub"),crQuitter];}},
  /* v16 : « À lire avant » un examen (12o) ; ce qui en part (fiche, série) y revient */
  plan:{titre:t("nv.plan"),onglet:"tab-hub",retour:function(){return NAV_PRE.plan==="home"?navRetourMat():[t("nv.hub"),navHub];}},
  lire:{titre:t("nv.lire"),onglet:"tab-hub",retour:function(){return NAV_PRE.lire==="agenda"?[t("nv.agenda"),function(){openAgenda("tab","ex");}]:NAV_PRE.lire==="home"?navRetourMat():[t("nv.hub"),navHub];}},
  carte:{titre:t("nv.carte"),onglet:"tab-hub",retour:function(){return [t("nv.hub"),navHub];}},
  /* v17.1 : Recherche partout (12s), ouverte par le champ de Réviser ou la touche / ; y ramènent les écrans ouverts d'un résultat */
  recherche:{titre:t("nv.recherche"),onglet:"tab-rev",retour:function(){return [t("nv.reviser"),ouvrirReviser];}}
};
/* Libellé du retour après une série : là où elle a été lancée (BACK) */
function navBackLab(){return BACK==="plan"?t("nv.plan"):BACK==="carnet"?t("nv.carnet"):BACK==="lire"?t("nv.lire"):BACK==="chap"&&chapTh()?themeName(chapTh()):BACK==="hub"?t("nv.hub"):BACK==="qcm"?t("nv.qcm"):BACK==="caslist"?t("nv.cas"):navMat();}

/* Appelé par show() (03) à chaque changement d'écran */
function navMaj(id){
  var n=NAV[id]||null,bar=$("appbar"),tb=$("tabbar");
  if(n&&n.sans&&n.sans())n=null;
  ECRAN=id;menuFermer();rchRacine(id);
  if(!bar||!tb)return;
  if(!n){bar.hidden=true;document.body.classList.remove("barre");tb.hidden=true;document.body.classList.remove("onglets");return;}
  var r=n.retour?n.retour():null,f=!!n.focus,h1=$(id).querySelector("h1"),avec=!!(r||f);
  bar.hidden=!avec;document.body.classList.toggle("barre",avec);
  $("nav-titre").textContent=!h1?(typeof n.titre==="function"?n.titre():n.titre):"";
  var rb=$("nav-retour");rb.hidden=!r;rb.classList.toggle("quitter",f);
  if(r){$("nav-retour-lab").textContent=f?"":r[0];rb.setAttribute("aria-label",t(f?"nv.quitter_retour":"nv.retour",{lab:r[0]}));}
  /* Onglets : pas pendant un entraînement en cours */
  tb.hidden=f;document.body.classList.toggle("onglets",!f);
  [].forEach.call(tb.querySelectorAll(".ong"),function(b){
    var a=b.id===n.onglet;b.classList.toggle("sel",a);
    if(a){b.setAttribute("aria-current","page");}else{b.removeAttribute("aria-current");}
  });
  var ix=ORD_ONG.indexOf(n.onglet);if(ix>=0){DIR_ONG=ix>LAST_ONG?1:ix<LAST_ONG?-1:0;LAST_ONG=ix;}
  ongPastille();
}
/* Quitter l'écran en cours sans rien perdre */
function navQuitter(id){
  if(id==="ex"&&EXS){
    if(EXS.aiCtl){try{EXS.aiCtl.abort();}catch(e){}}
    if(EXS.qa&&EXS.qa.ctl){try{EXS.qa.ctl.abort();}catch(e){}}
    stopTimer();if(!EXS.st.done)EXS.st.bro=$("ex-bro").value;saveEx();
  }
  if(id==="sim"&&SIM&&!SIM.sub){stopSimTimer();SIM.bro=$("sc-bro").value;saveSim();simQuitArm=false;}
  if(id==="drill")drStopT();
}
function navAller(fn){navQuitter(ECRAN);fn();}
$("nav-retour").addEventListener("click",function(){var n=NAV[ECRAN],r=n&&n.retour?n.retour():null;if(r)r[1]();});

/* ---------- Onglets ---------- */
function ouvrirReviser(){renderBach();show("bach");}
$("tab-hub").addEventListener("click",navHub);
$("tab-rev").addEventListener("click",ouvrirReviser);
$("tab-evol").addEventListener("click",function(){openEvol("tab");});
$("tab-prof").addEventListener("click",function(){openProf("tab");});

/* ---------- Choix de l'univers : un panneau, ouvert par la pastille de « Aujourd'hui » (12g) ---------- */
function menuOuvrir(){
  var m=$("menu");
  univPanneau();
  m.hidden=false;$("menu-voile").hidden=false;$("b-hub-univers").setAttribute("aria-expanded","true");
  try{$("menu-fermer").focus();}catch(e){}
}
function menuFermer(){
  var m=$("menu");if(!m||m.hidden)return;
  m.hidden=true;$("menu-voile").hidden=true;$("b-hub-univers").setAttribute("aria-expanded","false");
}
$("menu-fermer").addEventListener("click",function(){menuFermer();try{$("b-hub-univers").focus();}catch(e){}});
$("menu-voile").addEventListener("click",menuFermer);
document.addEventListener("keydown",function(e){
  var m=$("menu");if(m.hidden)return;
  if(e.key==="Escape"){menuFermer();try{$("b-hub-univers").focus();}catch(x){}return;}
  /* Tab reste dans le panneau tant qu'il est ouvert */
  if(e.key==="Tab"){
    var f=[].filter.call(m.querySelectorAll("button"),function(b){return !b.hidden&&b.offsetParent!==null;});
    if(!f.length)return;
    var i=f.indexOf(document.activeElement);
    if(e.shiftKey&&(i<=0)){e.preventDefault();f[f.length-1].focus();}
    else if(!e.shiftKey&&(i===-1||i===f.length-1)){e.preventDefault();f[0].focus();}
  }
});

/* v22 (demande de l'auteur, qui aime que l'indicateur « bascule » d'un onglet à l'autre) : une seule pastille qui glisse sous l'onglet courant */
function ongPastille(){
  var tb=$("tabbar");if(!tb||tb.hidden)return;
  var p=tb.querySelector(".ong-pastille"),sel=tb.querySelector(".ong.sel");
  if(!p){p=el("span","ong-pastille");p.setAttribute("aria-hidden","true");tb.insertBefore(p,tb.firstChild);p.className="ong-pastille neuve";}
  if(!sel){p.style.opacity="0";return;}
  var go=function(){
    p.style.width=sel.offsetWidth+"px";p.style.height=sel.offsetHeight+"px";p.style.transform="translate("+sel.offsetLeft+"px,"+sel.offsetTop+"px)";p.style.opacity="1";
    if(p.classList.contains("neuve"))window.requestAnimationFrame(function(){window.requestAnimationFrame(function(){p.classList.remove("neuve");});});
  };
  if(sel.offsetWidth)go();else window.requestAnimationFrame(go);
}
window.addEventListener("resize",function(){var p=document.querySelector(".ong-pastille");if(p){p.classList.add("neuve");ongPastille();}});

var ORD_ONG=["tab-hub","tab-rev","b-agenda","tab-evol","tab-prof"],LAST_ONG=0,DIR_ONG=0;
/* v22 : le même glissement partout (demande de l'auteur : « je veux ça partout »). Tout groupe de choix (segments, onglets, puces
   de réglages) reçoit une pastille qui rejoint le choix courant ; un MutationObserver la replace dès qu'un choix change. */
var GLISSE_SEL=".seg,.tabs,.regl-modes,.cn-seg,.docs-seg,.orr-chips",GL={pend:false};
function glissePos(c){
  if(!c.offsetWidth)return;
  var sel=null,k,ch=c.children,p=null;
  for(k=0;k<ch.length;k++){
    if(ch[k].classList.contains("glisse-p")){p=ch[k];continue;}
    if(ch[k].classList.contains("sel")||ch[k].getAttribute("aria-pressed")==="true")sel=ch[k];
  }
  if(!p){p=el("span","glisse-p neuve");p.setAttribute("aria-hidden","true");c.insertBefore(p,c.firstChild);}
  if(!sel){p.style.opacity="0";return;}
  var nw=sel.offsetWidth+"px",nh=sel.offsetHeight+"px",tr="translate("+sel.offsetLeft+"px,"+sel.offsetTop+"px)";
  p.style.opacity="1";p.style.width=nw;p.style.height=nh;p.style.transform=tr;
  if(p.classList.contains("neuve"))window.requestAnimationFrame(function(){window.requestAnimationFrame(function(){p.classList.remove("neuve");});});
}
function glisseTout(){[].forEach.call(document.querySelectorAll(GLISSE_SEL),glissePos);}
try{
  new MutationObserver(function(){
    if(GL.pend)return;GL.pend=true;
    window.requestAnimationFrame(function(){GL.pend=false;glisseTout();});
  }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","aria-pressed","hidden"]});
}catch(e){}
window.addEventListener("resize",function(){[].forEach.call(document.querySelectorAll(".glisse-p"),function(p){p.classList.add("neuve");});glisseTout();});
