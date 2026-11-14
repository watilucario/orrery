/* ---------- Agenda de la semaine (v2.6, couleurs et lisibilité v2.7) : lundi → vendredi, une semaine par écran ----------
   Écran `agenda`, onglet « Agenda », vue « Semaine » (v6 : la vue « Examens » est dans 12-examens.js, les réglages de
   l'agenda, ⚙, en haut de l'écran). Lit les agendas reliés semaine
   par semaine (agLire, du lundi 0 h au samedi 0 h ; le connecteur garde 5 min en cache) et précharge les semaines
   voisines. Glisser (doigt, souris, pavé tactile), flèches de l'écran ou du clavier : semaine précédente ou suivante.
   Couleurs (palette catégorielle du skill dataviz, `--t0`…`--t7`, clair et sombre) : chaque agenda est « par cours »
   (une couleur par titre de cours) ou « une couleur » (tout l'agenda d'une teinte) : PROF.agenda.modes, réglable dans
   Agenda › ⚙ ; par défaut « par cours » si son nom parle de cours ou d'emploi du temps. Une couleur est attribuée à la
   première rencontre et gardée dans PROF.agenda.couleurs (clé « c:<titre> » ou « a:<agenda> » → teinte 0-15 : 8 teintes
   en lavis plein, puis les mêmes rayées ; au-delà, gris). Blocs toujours pleins ; examens en inversé ; le titre est
   toujours écrit (la couleur n'est jamais le seul repère) : la légende ne nomme que les agendas d'une seule couleur et
   les examens.
   Téléphone : titre seul dans le bloc (l'heure se lit sur la grille, le détail au toucher). Chevauchement : le plus
   long passe dessous, les autres par-dessus sur toute la largeur, et le titre du dessous se place dans sa plus grande
   partie libre. Ordinateur : côte à côte. */
var SEM={lundi:null,cache:{},sel:null,glisse:false,roue:0,roueT:0},SEM_NB=16;
function semLundi(d){return d-((new Date(d*864e5).getUTCDay()+6)%7);}
/* Le week-end, la semaine qui vient est plus utile que celle qui finit */
function semDefaut(){var td=today(),w=new Date(td*864e5).getUTCDay();return semLundi(td)+(w===6||w===0?7:0);}
function semJour(d){var x=new Date(d*864e5);return {j:JOURS[x.getUTCDay()],n:x.getUTCDate(),m:MOIS[x.getUTCMonth()]};}
function semCle(titre){return agNorm(titre).replace(/\s+/g," ").replace(/^\s+|\s+$/g,"");}
function semExam(e){return AG_EXAM.test(agNorm(e.titre));}

/* ---------- Lecture d'une semaine ---------- */
function semCharger(l,frais){
  if(!AG.mcp||!agLie())return;
  var c=SEM.cache[l];
  if(c&&(c.etat==="charge"||(c.etat==="ok"&&!frais)))return;
  SEM.cache[l]={etat:"charge",evs:c?c.evs:[],lu:c?c.lu:0,err:null,essai:c?c.essai:false};
  agLire(l,l+5,frais).then(function(r){
    SEM.cache[l]={etat:"ok",evs:r.evs,lu:r.lu,err:null};
    try{semCouleurs(r.evs);}catch(x){}
    if(!$("agenda").hidden&&!$("ag-semaine").hidden&&SEM.lundi===l){semRendre();semVoisines(l);}
  },function(e){
    var k=(e&&e.code)||"upstream_error",x=SEM.cache[l];
    if(e&&e.retryable&&!x.essai){x.essai=true;x.etat="att";setTimeout(function(){semCharger(l,false);},Math.min(60000,e.retryAfterMs||(1500+Math.random()*1500)));return;}
    SEM.cache[l]={etat:"err",evs:(k==="needs_reauth"||k==="server_not_connected"||k==="not_in_manifest"||k==="blocked_by_policy")?[]:x.evs,lu:x.lu,err:k};
    if(k==="not_granted"||k==="capability_disabled"||k==="capability_removed"){AG.mcp=null;AG.etat="off";}
    if(!$("agenda").hidden&&!$("ag-semaine").hidden&&SEM.lundi===l)semRendre();
  });
}
function semVoisines(l){semCharger(l-7,false);semCharger(l+7,false);}
/* Couleur de chaque cours, attribuée une fois pour toutes et gardée dans le profil (suit le compte) */
/* Mode de couleur d'un agenda : « cours » (une couleur par cours) ou « agenda » (une seule couleur) */
function semMode(cal){
  var m=(PROF&&PROF.agenda&&PROF.agenda.modes)||{},c=null;
  if(m[cal]==="cours"||m[cal]==="agenda")return m[cal];
  ((PROF&&PROF.agenda&&PROF.agenda.cals)||[]).forEach(function(x){if(x.id===cal)c=x;});
  return c&&/cours|courses|edt|emploi du temps|timetable/.test(agNorm(c.nom))?"cours":"agenda";
}
function semCleEv(e){return semMode(e.cal)==="cours"?"c:"+semCle(e.titre):"a:"+e.cal;}
/* Couleur de chaque cours (ou agenda), attribuée une fois pour toutes et gardée dans le profil (suit le compte) */
function semCouleurs(evs){
  if(!PROF||!PROF.agenda)return;
  var m={},pris={},k,ch=false,src=PROF.agenda.couleurs||{};
  for(k in src){if(src.hasOwnProperty(k)){m[k]=src[k];if(src[k]>=0)pris[src[k]]=1;}}
  /* d'abord les matières (12j) : leur couleur est donnée avant les autres cours, pour ne jamais la reprendre */
  evs.forEach(function(e){if(semExam(e))return;var mk=semMode(e.cal)==="cours"?agMatieres(e.titre)[0]:null;if(mk)matCouleur(mk);});
  var mp=matTeintesPrises();for(k in mp){if(mp.hasOwnProperty(k))pris[k]=1;}
  evs.forEach(function(e){
    if(semExam(e))return;
    if(semMode(e.cal)==="cours"&&agMatieres(e.titre)[0])return;  /* un cours qui porte le nom d'une matière a la couleur de la matière */
    var cle=semCleEv(e),s=-1,i;
    if(cle.length<3||m.hasOwnProperty(cle))return;
    for(i=0;i<SEM_NB;i++){if(!pris[i]){s=i;break;}}
    m[cle]=s;if(s>=0)pris[s]=1;ch=true;
  });
  if(ch){PROF.agenda=semAgendaCopie({couleurs:m});profilSave();}
}
/* Le profil peut venir du compte : ne jamais modifier l'objet en place, en faire une copie avec les changements */
function semAgendaCopie(chg){
  var a=PROF.agenda||{},o={},k;
  for(k in a){if(a.hasOwnProperty(k))o[k]=a[k];}
  for(k in chg){if(chg.hasOwnProperty(k))o[k]=chg[k];}
  o.maj=Date.now();return o;
}
function semTeinte(e){var mk=semMode(e.cal)==="cours"?agMatieres(e.titre)[0]:null;if(mk)return matCouleur(mk);var m=(PROF&&PROF.agenda&&PROF.agenda.couleurs)||{},s=m[semCleEv(e)];return typeof s==="number"&&s>=0&&s<SEM_NB?s:-1;}
function semClasse(t){return t<0?"sem-t-1":"sem-t"+(t%8)+(t>=8?" raye":"");}
function semAgenda(e){var l=(PROF&&PROF.agenda&&PROF.agenda.cals)||[],i;for(i=0;i<l.length;i++){if(l[i].id===e.cal)return i;}return 0;}

/* ---------- Ouverture, vues (Semaine, Examens), réglages de l'agenda ---------- */
var AGV={vue:null,auto:true,regl:false};  /* auto : vue choisie par l'app (Semaine si l'agenda est relié), tant que tu n'en as pas choisi une */
function openAgenda(from,vue){
  if(from!=="garder")NAV_PRE.agenda=(from==="hub"||from==="home")?from:"tab";
  if(vue)AGV.vue=vue;else if(!AGV.vue||AGV.auto)AGV.vue=(AG.mcp&&agLie())?"sem":"ex";
  if(from!=="garder"){SEM.lundi=semDefaut();SEM.sel=null;}
  if(!PROF)profilSave("");
  show("agenda");agVue();
}
function agVue(){
  var sem=AGV.vue==="sem";
  $("ag-semaine").hidden=!sem;$("ag-examens").hidden=sem;
  $("ag-vue-sem").setAttribute("aria-pressed",sem?"true":"false");$("ag-vue-ex").setAttribute("aria-pressed",sem?"false":"true");
  $("ag-vue-sem").classList.toggle("sel",sem);$("ag-vue-ex").classList.toggle("sel",!sem);
  agReglRendre();
  if(sem){
    if(SEM.lundi===null)SEM.lundi=semDefaut();
    semRendre();semCharger(SEM.lundi,false);
    if(SEM.cache[SEM.lundi]&&SEM.cache[SEM.lundi].etat==="ok")semVoisines(SEM.lundi);
  }else{renderExams();}
}
/* ⚙ : agendas reliés (12c) et couleurs (12e), le seul endroit où on les règle */
function agReglRendre(){
  var p=$("ag-regl");p.hidden=!AGV.regl;$("b-ag-regl").setAttribute("aria-expanded",AGV.regl?"true":"false");
  if(AGV.regl){renderAgLien();renderReglAgenda();}
}
function agRelier(from){AGV.regl=true;openAgenda(from||"tab");agListeCals();try{$("ag-regl").scrollIntoView({block:"start"});}catch(e){}}
$("b-ag-regl").addEventListener("click",function(){AGV.regl=!AGV.regl;agReglRendre();});
$("ag-vue-sem").addEventListener("click",function(){AGV.auto=false;if(AGV.vue==="sem")return;AGV.vue="sem";agVue();});
$("ag-vue-ex").addEventListener("click",function(){AGV.auto=false;if(AGV.vue==="ex")return;AGV.vue="ex";agVue();});
function semAller(sens){
  if($("agenda").hidden||$("ag-semaine").hidden||!agLie())return;
  var piste=$("sem-piste"),calme=false;
  try{calme=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){}
  SEM.lundi+=7*sens;SEM.sel=null;
  semCharger(SEM.lundi,false);
  if(calme||!piste){if(piste)piste.style.transform="";semRendre();return;}
  /* Glissement : la semaine part du côté du geste, la suivante arrive de l'autre. v11 : courbe forte (styles.css), plus
     de ease-in au départ (il retardait le moment que l'œil regarde) */
  piste.style.transition="transform .14s var(--ease-out)";piste.style.transform="translateX("+(sens>0?-100:100)+"%)";
  setTimeout(function(){
    semRendre();
    var p=$("sem-piste");p.style.transition="none";p.style.transform="translateX("+(sens>0?100:-100)+"%)";
    p.getBoundingClientRect();
    p.style.transition="transform .22s var(--ease-out)";p.style.transform="";
  },140);
}
$("b-agenda").addEventListener("click",function(){openAgenda("tab");});
$("b-sem-prev").addEventListener("click",function(){semAller(-1);});
$("b-sem-next").addEventListener("click",function(){semAller(1);});
$("b-sem-auj").addEventListener("click",function(){SEM.lundi=semDefaut();SEM.sel=null;semRendre();semCharger(SEM.lundi,false);});
document.addEventListener("keydown",function(e){
  if($("agenda").hidden||$("ag-semaine").hidden||e.altKey||e.ctrlKey||e.metaKey)return;
  var t=e.target&&e.target.tagName;if(t==="INPUT"||t==="TEXTAREA"||t==="SELECT")return;
  if(e.key==="ArrowLeft"){e.preventDefault();semAller(-1);}else if(e.key==="ArrowRight"){e.preventDefault();semAller(1);}
});
/* Glisser : doigt ou souris (pointer), pavé tactile (roue horizontale). Le défilement vertical reste au navigateur. */
(function(){
  var z=$("sem-zone"),x0=null,y0=0,t0=0,dx=0,act=false,id=null;
  z.addEventListener("pointerdown",function(e){if(e.button>0)return;x0=e.clientX;y0=e.clientY;t0=e.timeStamp||0;dx=0;act=false;id=e.pointerId;});
  z.addEventListener("pointermove",function(e){
    if(x0===null||e.pointerId!==id)return;
    dx=e.clientX-x0;var dy=e.clientY-y0;
    if(!act&&Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.4){act=true;try{z.setPointerCapture(id);}catch(x){}}
    if(act){var p=$("sem-piste");p.style.transition="none";p.style.transform="translateX("+dx+"px)";}
  });
  /* Changer de semaine : glisser assez loin, ou (v11) d'un geste rapide, même court (vitesse > 0,11 px/ms, seuil du skill
     emil-design-eng) ; un geste repris par le navigateur (pointercancel) ne compte qu'à la distance */
  function fin(e){
    if(x0===null)return;
    var a=act,d=dx,ms=(e&&e.timeStamp||0)-t0;x0=null;act=false;
    if(!a)return;
    SEM.glisse=true;setTimeout(function(){SEM.glisse=false;},50);
    var vite=e&&e.type==="pointerup"&&ms>0&&Math.abs(d)>=24&&Math.abs(d)/ms>0.11;
    if(vite||Math.abs(d)>Math.min(80,z.clientWidth*0.18)){semAller(d<0?1:-1);}
    else{var p=$("sem-piste");p.style.transition="transform .18s var(--ease-out)";p.style.transform="";}
  }
  z.addEventListener("pointerup",fin);z.addEventListener("pointercancel",fin);
  z.addEventListener("wheel",function(e){
    if(Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;
    e.preventDefault();
    var now=e.timeStamp||0;if(SEM.roueT&&now-SEM.roueT<450)return;  /* un geste du pavé = une semaine */
    SEM.roue+=e.deltaX;
    if(Math.abs(SEM.roue)>60){semAller(SEM.roue>0?1:-1);SEM.roue=0;SEM.roueT=now;}
  },{passive:false});
})();

/* ---------- Rendu ---------- */
function semRendre(){
  var l=SEM.lundi,td=today(),c=SEM.cache[l],box=$("sem-etat"),d,i;
  var a=semJour(l),b=semJour(l+4),ec=Math.round((l-semLundi(td))/7);
  $("sem-titre").textContent=nb(t("ags.titre",{a:a.n+(a.m!==b.m?" "+a.m:""),b:b.n+" "+b.m}));
  $("sem-sous").textContent=ec===0?t("ags.cette"):ec===1?t("ags.prochaine"):ec===-1?t("ags.derniere"):ec>1?t("ags.dans",{n:ec}):t("ags.il_y_a",{n:-ec});
  $("b-sem-auj").hidden=(l===semDefaut());
  clear(box);
  var nav=!!(AG.mcp&&agLie());
  $("b-sem-prev").disabled=!nav;$("b-sem-next").disabled=!nav;
  if(!AG.mcp){box.appendChild(el("p","src",t("ags.hors_claude")));semGrille([],l);return;}
  if(!agLie()){
    var p=el("p","src",t("ags.relie")),r=el("button","link",t("agd.relier"));r.type="button";r.id="b-sem-relier";
    r.addEventListener("click",function(){agRelier("garder");});
    p.appendChild(r);box.appendChild(p);semGrille([],l);return;
  }
  if(c&&c.etat==="err")agErreur(box,c.err,function(){semCharger(l,true);});
  else if(!c||c.etat==="charge"||c.etat==="att")box.appendChild(el("p","src sem-lect",t("agd.lecture")));
  semGrille(c?c.evs:[],l);
  $("sem-piste").classList.toggle("lecture",!!(c&&(c.etat==="charge"||c.etat==="att")&&c.evs.length));
  if(c&&c.etat==="ok"){
    var n=c.evs.filter(function(e){return e.jour>=l&&e.jour<l+5;}).length,f=$("sem-pied");
    f.appendChild(document.createTextNode((n?"":t("ags.rien"))+t("ags.lu_a",{h:agHeure(c.lu)})));
    var bt=el("button","link",t("ags.actualiser"));bt.type="button";bt.id="b-sem-maj";bt.addEventListener("click",function(){semCharger(l,true);semRendre();});
    f.appendChild(bt);
  }
}
/* Grille : 5 colonnes (lundi → vendredi), une ligne par heure, blocs placés à la minute près ; côte à côte s'ils se chevauchent */
function semGrille(evs,l){
  var g=$("sem-grille"),leg=$("sem-legende"),det=$("sem-detail"),pied=$("sem-pied"),td=today(),d,j;
  clear(g);clear(leg);clear(pied);
  var sem=evs.filter(function(e){return e.jour>=l&&e.jour<l+5;}),heures=sem.filter(function(e){return e.deb!==null&&e.fin!==null;}),jour=sem.filter(function(e){return e.deb===null;});
  var h0=8,h1=19;
  heures.forEach(function(e){var a=new Date(e.deb),b=new Date(e.fin);h0=Math.min(h0,a.getHours());h1=Math.max(h1,b.getHours()+(b.getMinutes()?1:0));});
  h0=Math.max(0,h0);h1=Math.min(24,Math.max(h1,h0+1));
  var etroit=window.innerWidth<640,PX=etroit?48:52;
  g.style.setProperty("--sem-h",((h1-h0)*PX)+"px");
  /* En-tête des jours */
  var tete=el("div","sem-tete");tete.appendChild(el("div","sem-coin"));
  for(d=l;d<l+5;d++){j=semJour(d);var t=el("div","sem-j"+(d===td?" auj":""));t.appendChild(el("span","sem-jn",j.j));t.appendChild(el("b",null,String(j.n)));tete.appendChild(t);}
  g.appendChild(tete);
  /* Journées entières (examens d'une journée, fermetures…) */
  if(jour.length){
    var lj=el("div","sem-ligne-j");lj.appendChild(el("div","sem-coin sem-hj",tx("ags.jour")));
    for(d=l;d<l+5;d++){var cj=el("div","sem-cj");jour.filter(function(e){return e.jour===d;}).forEach(function(e){cj.appendChild(semBloc(e,true));});lj.appendChild(cj);}
    g.appendChild(lj);
  }
  /* Corps : graduations et colonnes */
  var corps=el("div","sem-corps"),gut=el("div","sem-heures");
  for(j=h0;j<h1;j++){var hx=el("div","sem-h",tx("ags.heure",{h:j}));hx.style.top=((j-h0)*PX)+"px";gut.appendChild(hx);}
  corps.appendChild(gut);
  for(d=l;d<l+5;d++){
    var col=el("div","sem-col"+(d===td?" auj":""));
    for(j=h0+1;j<h1;j++){var ln=el("div","sem-trait");ln.style.top=((j-h0)*PX)+"px";col.appendChild(ln);}
    semPlacer(heures.filter(function(e){return e.jour===d;}),h0,PX,etroit).forEach(function(x){
      var b=semBloc(x.e,false,x.etiq);
      b.style.top=x.top+"px";b.style.height=x.h+"px";
      b.style.left="calc("+(x.voie/x.voies*100)+"% + 2px)";b.style.width="calc("+(100/x.voies)+"% - 4px)";
      b.style.zIndex=String(x.z);
      if(x.dessus)b.className+=" dessus";
      if(x.fond)b.className+=" fond";
      if(x.h<40)b.className+=" court";
      /* Titre : autant de lignes que la place libre en laisse (13 px par ligne) */
      var lib=x.etiq?x.etiq.h:x.h,t=b.querySelector(".sem-et"),lignes=Math.max(1,Math.floor((lib-(etroit?6:24))/13.5));
      if(t){t.style.webkitLineClamp=String(lignes);t.style.lineClamp=String(lignes);if(lib<14)t.style.visibility="hidden";}
      col.appendChild(b);
    });
    if(d===td){
      var now=new Date(),mn=now.getHours()*60+now.getMinutes();
      if(mn>=h0*60&&mn<=h1*60){var nl=el("div","sem-now");nl.style.top=((mn-h0*60)/60*PX)+"px";col.appendChild(nl);}
    }
    corps.appendChild(col);
  }
  g.appendChild(corps);
  /* Légende : chaque cours (ou agenda d'une seule couleur) de la semaine avec sa couleur, l'examen */
  var vus={},items=[],cals=(PROF&&PROF.agenda&&PROF.agenda.cals)||[];
  sem.forEach(function(e){
    if(semExam(e))return;
    var k=semCleEv(e),nom=e.titre;
    if(k.indexOf("a:")===0)cals.forEach(function(c){if(c.id===e.cal)nom=tx("ags.agenda_suffixe",{nom:c.nom});});
    if(!vus[k]&&k.indexOf("a:")===0){vus[k]=1;items.push({t:semTeinte(e),n:nom});}  /* un cours a son titre dans le bloc */
  });
  items.sort(function(a,b){return (a.t<0?99:a.t)-(b.t<0?99:b.t);});
  items.forEach(function(x){var it=el("span","sem-li");it.appendChild(el("i","sem-pastille "+semClasse(x.t)));it.appendChild(document.createTextNode(x.n));leg.appendChild(it);});
  if(sem.some(semExam)){var ix=el("span","sem-li");ix.appendChild(el("i","sem-pastille sem-ex"));ix.appendChild(document.createTextNode(tx("ags.examen")));leg.appendChild(ix);}
  semDetail();
}
/* Placement d'un jour. Groupes de cours qui se chevauchent : sur ordinateur, côte à côte (voies) ; sur téléphone, le plus
   long dessous sur toute la largeur, les autres par-dessus (côte à côte entre eux s'ils se chevauchent aussi), et le titre
   du dessous dans sa plus grande partie libre (etiq : {top, h} relatifs au bloc). */
function semPlacer(evs,h0,PX,etroit){
  var out=[],grp=[],fin=-1;
  function pos(e){var a=new Date(e.deb),m0=a.getHours()*60+a.getMinutes(),du=Math.max(15,(e.fin-e.deb)/60000);return {top:Math.round((m0-h0*60)/60*PX)+1,h:Math.max(20,Math.round(du/60*PX)-2)};}
  function groupe(g){
    if(!etroit||g.length<2){var r=[];semVoies(g,r);r.forEach(function(x){var p=pos(x.e);x.top=p.top;x.h=p.h;x.z=1+x.voie;out.push(x);});return;}
    var f=g[0];g.forEach(function(e){if(e.fin-e.deb>f.fin-f.deb)f=e;});
    var dessus=g.filter(function(e){return e!==f;}),rd=[],pf=pos(f);
    semVoies(dessus,rd);
    /* Parties du bloc du dessous qui restent visibles : on garde la plus haute */
    var occ=dessus.map(function(e){var p=pos(e);return [p.top-pf.top-2,p.top-pf.top+p.h+2];}).sort(function(a,b){return a[0]-b[0];}),lib=[],y=0;
    occ.forEach(function(o){if(o[0]>y)lib.push([y,o[0]]);y=Math.max(y,o[1]);});
    if(y<pf.h)lib.push([y,pf.h]);
    var best=[0,0];lib.forEach(function(l){if(l[1]-l[0]>best[1]-best[0])best=l;});
    out.push({e:f,voie:0,voies:1,top:pf.top,h:pf.h,z:1,fond:true,etiq:{top:best[0],h:best[1]-best[0]}});
    rd.forEach(function(x){var p=pos(x.e);x.top=p.top;x.h=p.h;x.z=2+x.voie;x.dessus=true;out.push(x);});
  }
  evs.slice().sort(function(a,b){return a.deb-b.deb||b.fin-a.fin;}).forEach(function(e){
    if(grp.length&&e.deb>=fin){groupe(grp);grp=[];fin=-1;}
    grp.push(e);fin=Math.max(fin,e.fin);
  });
  if(grp.length)groupe(grp);
  return out;
}
function semVoies(grp,out){
  var fins=[],res=[];
  grp.forEach(function(e){
    var v=0;while(v<fins.length&&fins[v]>e.deb)v++;
    fins[v]=e.fin;res.push({e:e,voie:v});
  });
  res.forEach(function(r){r.voies=fins.length;out.push(r);});
}
function semBloc(e,journee,etiq){
  var ex=semExam(e),b=el("button","sem-ev "+(ex?"sem-ex":semClasse(semTeinte(e)))+(journee?" jour":""));
  b.type="button";
  if(SEM.sel===e.id)b.className+=" sel";
  var h=e.deb!==null?agHeure(e.deb)+(e.fin!==null?"–"+agHeure(e.fin):""):t("agd.journee");
  b.setAttribute("aria-label",e.titre+", "+fmtDay(e.jour)+", "+h+(e.lieu?", "+e.lieu:""));
  if(etiq&&etiq.top>0)b.style.paddingTop=(etiq.top+3)+"px";  /* titre du dessous : dans sa partie libre */
  if(!journee)b.appendChild(el("span","sem-eh",h));
  b.appendChild(el("span","sem-et",e.titre));
  if(e.lieu&&!journee)b.appendChild(el("span","sem-el",e.lieu));
  b.addEventListener("click",function(){if(SEM.glisse)return;SEM.sel=SEM.sel===e.id?null:e.id;semRendre();if(SEM.sel){try{$("sem-detail").scrollIntoView({block:"nearest"});}catch(x){}}});
  return b;
}
/* Détail du bloc touché : jour, heure, salle, agenda, « Réviser », et pour un examen : l'ajouter au profil */
function semDetail(){
  var box=$("sem-detail");clear(box);box.hidden=true;
  var c=SEM.cache[SEM.lundi];if(!SEM.sel||!c)return;
  var e=null;c.evs.forEach(function(x){if(x.id===SEM.sel)e=x;});
  if(!e)return;
  box.hidden=false;
  box.appendChild(el("p","sem-dt",e.titre));
  var h=e.deb!==null?agHeure(e.deb)+(e.fin!==null?"–"+agHeure(e.fin):""):t("ags.toute_journee");
  box.appendChild(el("p","src",nb(fmtDay(e.jour)+" · "+h+(e.lieu?" · "+e.lieu:""))));
  var cals=PROF.agenda.cals,ca=cals[semAgenda(e)];
  if(cals.length>1&&ca)box.appendChild(el("p","src",t("ags.agenda_nom",{nom:ca.nom})));
  var bt=el("div","ag-btns");
  agMatieres(e.titre).filter(function(k){return MATS[k].ready;}).forEach(function(k){
    var r=el("button","link",t("agd.reviser",{mat:MATS[k].titre}));r.type="button";
    r.addEventListener("click",function(){activate(k);BACK="home";NAV_PRE.home="agenda";renderHome();show("home");});
    bt.appendChild(r);
  });
  if(semExam(e)&&e.jour>=today()){
    var x=null;agExamens().forEach(function(p){if(p.e.id===e.id)x=p;});
    if(x&&x.mats.length){
      var a=el("button","sbtn",t("ags.ajouter_exam"));a.type="button";a.id="b-sem-exam";
      a.addEventListener("click",function(){examAjouter("agenda",{type:x.type,nom:x.nom,matiere:x.mats[0],date:isoOfDay(x.e.jour),agenda:x.e.id});});
      bt.appendChild(a);
    }else if(examens().some(function(y){return y.agenda===e.id;})){bt.appendChild(el("span","src",t("ags.dans_exams")));}
  }
  if(bt.childNodes.length)box.appendChild(bt);
}
