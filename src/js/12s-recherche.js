/* ---------- Recherche partout (v17.1) ----------
   Demande de l'auteur (matrice du 6 nov., point 4) : retrouver vite n'importe quel passage de ses cours. Un écran
   (recherche), un point d'entrée (le champ en tête de Réviser) et un raccourci ordinateur (la touche /).
   L'index est construit à la demande depuis MATS (donc depuis RECETTES : packs importés de Maitrise compris), matière
   par matière, la première fois qu'on en a besoin, et gardé tant que la matière n'est pas remplacée (import ou retrait
   d'un pack). Il contient : sections des fiches (titre + texte), fiches de synthèse, énoncés des questions de QCM, des
   cas guidés et des exercices (jamais les réponses, les corrections ni les explications), lignes des documents types,
   noms de thèmes et de matières. Texte normalisé une fois (minuscules, sans accents, œ = oe, tirets et apostrophes =
   espace) ; plusieurs mots = tous présents ; 2 caractères au moins. Résultats groupés par type, 8 par groupe puis « Voir
   plus » ; le mot cherché est mis en évidence dans un extrait (nœuds texte et <mark> : rien n'est lu comme du HTML).
   Rien n'est écrit dans le stockage par la recherche elle-même ; la dernière requête reste en mémoire (RCH), pas
   dans le navigateur. Un résultat ouvre l'écran voulu ; « ‹ Recherche » y ramène avec la requête, les « Voir plus » et la
   position (RCH.via dit quel écran a été ouvert d'ici : chap, docs, caslist, exlist ; les fiches passent par
   NAV_PRE.fiche = "recherche", la page d'une matière par NAV_PRE.home = "recherche"). */
var RCH={q:"",tous:false,voir:{},y:0,foc:null,tm:null,chauf:null,via:null,ix:{},res:null};
var RCH_PAGE=8,RCH_PLUS=20,RCH_DELAI=150;
var RCH_GROUPES=[
  {g:"mat",n:tx("zrech.g_mat")},{g:"the",n:tx("zrech.g_the")},{g:"fic",n:tx("zrech.g_fic")},{g:"syn",n:tx("zrech.g_syn")},
  {g:"doc",n:tx("zrech.g_doc")},{g:"qcm",n:tx("zrech.g_qcm")},{g:"cas",n:tx("zrech.g_cas")},{g:"exo",n:tx("zrech.g_exo")}
];
/* Écrans de départ : en arrivant sur l'un d'eux, RCH.via est oublié (12f, navMaj) */
var RCH_RACINES=["hub","bach","home","evol","agenda","prof","plan","lire","carte","cours","qcm","carnet","conslist","simstart","drillstart","packs","sauve","creer","onb","recherche"];
function rchRacine(id){if(RCH&&RCH_RACINES.indexOf(id)>=0)RCH.via=null;}
function rchVia(e){return !!RCH&&RCH.via===e;}
function rchLien(){return [tx("recherche.recherche"),rchRetour];}

/* ----- Normalisation ----- */
var RCH_SEP=/[\u00a0\u202f\u2009\u2007\s'\u2019\u2018`\u00b4\-\u2010\u2011\u2012\u2013\u2014\u2212_]/g,RCH_NC={};
function rchNorm(s){
  s=String(s==null?"":s).toLowerCase();
  if(s.normalize)s=s.normalize("NFD");
  return s.replace(/[\u0300-\u036f]/g,"").replace(/\u0153/g,"oe").replace(/\u00e6/g,"ae").replace(RCH_SEP," ");
}
/* Un caractère, normalisé (0, 1 ou 2 caractères) : sert à retrouver où est le mot dans le texte d'origine */
function rchNormC(c){var r=RCH_NC[c];if(r===undefined){r=rchNorm(c);RCH_NC[c]=r;}return r;}
function rchPos(s){
  var n=[],p=[],i,j,r;
  for(i=0;i<s.length;i++){r=rchNormC(s.charAt(i));for(j=0;j<r.length;j++){n.push(r.charAt(j));p.push(i);}}
  return {n:n.join(""),p:p};
}
/* Les mots cherchés : séparés par des espaces, sans doublon ; un mot d'une lettre ne compte que s'il est seul */
function rchTermes(q){
  var l=rchNorm(q).split(" "),out=[],i;
  for(i=0;i<l.length;i++){if(l[i]&&out.indexOf(l[i])<0)out.push(l[i]);}
  if(out.some(function(t){return t.length>1;}))out=out.filter(function(t){return t.length>1;});
  return out;
}
/* Position du mot t dans le texte normalisé n à partir de d, ou -1. Un mot de deux lettres (DU, EH, CA) ne compte qu'en
   début de mot : sinon « du » est dans « produit », « module », « durée »… */
function rchTrouve(n,t,d){
  var i=n.indexOf(t,d);
  if(t.length>2)return i;
  while(i>0&&n.charAt(i-1)!==" ")i=n.indexOf(t,i+1);
  return i;
}
function rchLongueur(q){return rchNorm(q).replace(/ /g,"").length;}

/* ----- Texte des fiches et des énoncés : sans la mise en forme ----- */
function rchPlat(md){
  var ls=String(md==null?"":md).split("\n"),out=[],pile=[],i,l,m,x;
  for(i=0;i<ls.length;i++){
    l=ls[i];x=trim(l);
    if(x===":::"){pile.pop();continue;}
    m=FIG_DEBUT.exec(l);
    if(m){
      if(ENCADRES.indexOf(m[1])>=0&&pile.indexOf("fig")<0){pile.push("enc");if(trim(m[2]))out.push(trim(m[2]));}
      else pile.push("fig");
      continue;
    }
    if(pile.indexOf("fig")>=0||!x)continue;
    if(x.charAt(0)==="|"){if(PACK_TABLE_SEP.test(x))continue;x=x.replace(/\|/g," ");}
    x=x.replace(/^(>\s*|#{1,4}\s+|[-*]\s+|\d+\.\s+)/,"").replace(/\*\*/g,"");
    if(trim(x))out.push(trim(x).replace(/\s+/g," "));
  }
  return out.join(" ");
}
function rchNet(s){return String(s==null?"":s).replace(/\*\*/g,"").replace(/\s+/g," ");}

/* ----- Index d'une matière ----- */
function rchTemps(){try{return window.performance.now();}catch(e){return Date.now();}}
function rchIndex(k){
  var M=MATS[k],c=RCH.ix[k];
  if(c&&c.m===M)return c.ch;
  var t0=rchTemps(),ch=[],B=M.blocs;
  function add(g,t,txt,th,x){ch.push({g:g,k:k,th:th||"",t:t||"",c:txt||"",n:rchNorm((t?t+" ":"")+(txt||"")),x:x||null,id:k+":"+ch.length});}
  function fiche(f,g,th){
    var neuf=!!f.intro,nn=f.sections.length;
    if(f.intro)add(g,tx("zrech.introduction"),rchNet(f.intro),th,{anc:""});
    f.sections.forEach(function(s,i){
      add(g,ficheTitre(s.t),rchPlat(s.md),th,{anc:neuf?(i<nn-1?"fi-p"+(i+1):"fi-ret"):(i===0?"fi-ess":"fi-p"+i)});
    });
  }
  add("mat",M.titre,"","",null);
  M.THEMES.forEach(function(t){add("the",t.n,"",t.k,null);});
  if(B.cours){
    if(M.SYN)fiche(M.SYN,"syn",SYN_K);
    M.THEMES.forEach(function(t){if(M.COURS[t.k])fiche(M.COURS[t.k],"fic",t.k);});
  }
  if(B.documents){
    M.DOCS.forEach(function(d){d.g.forEach(function(g){g.l.forEach(function(x){
      add("doc",x.p,[g.t,docCode(x.k)?x.k+(x.k2&&docCode(x.k2)?" "+x.k2:""):"",x.u].filter(function(v){return !!v;}).join(" · "),"",{doc:d.id,dt:d.t,k:x.k});
    });});});
  }
  if(B.qcm){
    M.Q.forEach(function(it){if(!it.cas)add("qcm","",rchNet(it.q)+(it.ctx?" "+rchPlat(it.ctx):""),it.th,null);});
  }
  if(B.cas){
    M.CAS.forEach(function(cs){add("cas",cs.n,rchPlat(cs.ctx)+" "+cs.steps.map(function(s){return rchNet(s.q);}).join(" "),cs.th,{nom:cs.n,nb:cs.steps.length});});
  }
  if(B.exercices){
    M.EXO.forEach(function(e){add("exo",e.t,rchPlat(e.ctx)+" "+e.subs.map(function(s){return rchNet(s.q);}).join(" "),e.th,{id:e.id,tl:e.tl||"",nb:e.subs.length});});
  }
  RCH.ix[k]={m:M,ch:ch};
  var t1=rchTemps();
  try{window.performance.measure("rch-index",{start:t0,end:t1,detail:{k:k,n:ch.length}});}catch(e){}
  return ch;
}
function rchPossible(){return MATS_ORDER.some(function(k){return MATS[k].ready;});}
/* Les matières où l'on cherche : celles prêtes de l'univers ouvert, ou de tous les univers */
function rchPortee(){
  return (RCH.tous?MATS_ORDER:univMats()).filter(function(k){return MATS[k]&&MATS[k].ready;});
}
function rchPlusieursUnivers(){return UNIVERS.length>1;}
/* Pendant que l'écran est ouvert au repos : l'index se prépare, une matière à la fois, sans bloquer la saisie */
function rchChauffer(){
  RCH.chauf=null;
  var l=rchPortee().filter(function(k){var c=RCH.ix[k];return !c||c.m!==MATS[k];});
  if(!l.length||$("recherche").hidden)return;
  rchIndex(l[0]);
  RCH.chauf=setTimeout(rchChauffer,0);
}

/* ----- Recherche ----- */
function rchScore(ch,T,phrase){
  var s=0,nt=ch.t?rchNorm(ch.t):"",i,t;
  for(i=0;i<T.length;i++){
    t=T[i];
    if(nt&&rchTrouve(nt,t,0)>=0)s+=nt.indexOf(t)===0||nt.indexOf(" "+t)>=0?6:4;
    else if(ch.n.indexOf(" "+t)>=0||ch.n.indexOf(t)===0)s+=1;
  }
  if(T.length>1&&ch.n.indexOf(phrase)>=0)s+=3;
  return s;
}
function rchChercher(q){
  var T=rchTermes(q),phrase=T.join(" "),ms=rchPortee(),par={},out=[],a,b,i,j,ch,ok,n=0;
  RCH_GROUPES.forEach(function(g){par[g.g]=[];});
  for(a=0;a<ms.length;a++){
    ch=rchIndex(ms[a]);
    for(i=0;i<ch.length;i++){
      ok=true;
      for(j=0;j<T.length;j++){if(rchTrouve(ch[i].n,T[j],0)<0){ok=false;break;}}
      if(ok){par[ch[i].g].push({c:ch[i],i:n++,s:0});}
    }
  }
  RCH_GROUPES.forEach(function(g){
    var l=par[g.g];if(!l.length)return;
    if(T.length)l.forEach(function(r){r.s=rchScore(r.c,T,phrase);});
    l.sort(function(x,y){return (y.s-x.s)||(x.i-y.i);});
    out.push({g:g.g,n:g.n,l:l.map(function(r){return r.c;})});
  });
  return {q:q,T:T,groupes:out,total:n};
}

/* ----- Affichage : extrait et mot mis en évidence ----- */
function rchMarques(txt,T){
  var m=rchPos(txt),r=[],i,k,t;
  for(k=0;k<T.length;k++){
    t=T[k];i=rchTrouve(m.n,t,0);
    while(i>=0){r.push([m.p[i],m.p[i+t.length-1]+1]);i=rchTrouve(m.n,t,i+t.length);}
  }
  r.sort(function(x,y){return x[0]-y[0]||y[1]-x[1];});
  var f=[];
  r.forEach(function(x){var l=f[f.length-1];if(l&&x[0]<=l[1]){if(x[1]>l[1])l[1]=x[1];}else f.push([x[0],x[1]]);});
  return f;
}
/* Le texte entre a et b, les marques à l'intérieur en <mark> */
function rchFragment(txt,marques,a,b){
  var fr=document.createDocumentFragment(),p=a;
  function texte(x,y){if(y>x)fr.appendChild(document.createTextNode(nb(txt.slice(x,y))));}
  marques.forEach(function(m){
    var d=Math.max(m[0],a),e=Math.min(m[1],b);
    if(e<=d)return;
    texte(p,d);fr.appendChild(el("mark",null,nb(txt.slice(d,e))));p=e;
  });
  texte(p,b);
  return fr;
}
function rchTitreNoeud(txt,T){return rchFragment(txt,rchMarques(txt,T),0,txt.length);}
function rchExtrait(txt,T){
  var mq=rchMarques(txt,T),a=0,b=txt.length,L=170,deb,fr;
  if(b>L){
    deb=mq.length?mq[0][0]:0;
    a=Math.max(0,deb-48);
    if(a>0){var sp=txt.indexOf(" ",a);if(sp>=0&&sp<deb)a=sp+1;}
    b=Math.min(txt.length,a+L);
    if(b<txt.length){var sq=txt.lastIndexOf(" ",b);if(sq>Math.max(a,deb))b=sq;}
  }
  fr=document.createDocumentFragment();
  if(a>0)fr.appendChild(document.createTextNode("… "));
  fr.appendChild(rchFragment(txt,mq,a,b));
  if(b<txt.length)fr.appendChild(document.createTextNode(" …"));
  return fr;
}
/* Ligne grise sous un résultat : d'où il vient */
function rchMeta(ch){
  var M=MATS[ch.k],p=[],th=ch.th&&ch.th!==SYN_K?cnTheme(ch.k,ch.th):"";
  if(ch.g==="mat")p.push(tx("zrech.m_mat"));
  else if(ch.g==="the")p.push(tx("zrech.m_the"),M.titre);
  else if(ch.g==="syn")p.push(M.titre,tx("zrech.m_syn"));
  else if(ch.g==="doc")p.push(M.titre,ch.x.dt);
  else if(ch.g==="cas")p.push(M.titre,th,tnx("zrech.etapes",ch.x.nb));
  else if(ch.g==="exo")p.push(M.titre,ch.x.tl||th,tnx("zrech.questions",ch.x.nb));
  else p.push(M.titre,th);
  if(RCH.tous&&rchPlusieursUnivers()&&UNIV_BY[M.programme])p.push(UNIV_BY[M.programme].nom);
  return p.filter(function(x){return !!x;}).join(" · ");
}
function rchLigne(ch,T){
  var b=el("button","btn rch-r"),mq;
  b.type="button";b.setAttribute("data-rid",ch.id);
  if(ch.t){
    var t=el("span","t");t.appendChild(rchTitreNoeud(ch.t,T));b.appendChild(t);
    if(ch.c){var s=el("span","s");s.appendChild(rchExtrait(ch.c,T));b.appendChild(s);}
  }else{
    var t2=el("span","t rch-q");t2.appendChild(rchExtrait(ch.c,T));b.appendChild(t2);
  }
  b.appendChild(el("span","rch-m",nb(rchMeta(ch))));
  b.addEventListener("click",function(){rchAller(ch);});
  return b;
}
function rchGroupe(g,res){
  var box=el("div","rch-g"),h=el("h2",null,nb(g.n+" · "+g.l.length)),liste=el("div","group"),vu=Math.min(RCH.voir[g.g]||RCH_PAGE,g.l.length),i;
  h.id="rch-h-"+g.g;box.setAttribute("role","group");box.setAttribute("aria-labelledby",h.id);box.setAttribute("data-g",g.g);
  box.appendChild(h);box.appendChild(liste);
  for(i=0;i<vu;i++)liste.appendChild(rchLigne(g.l[i],res.T));
  RCH.voir[g.g]=vu;
  rchPlusBouton(box,g,res);
  return box;
}
function rchPlusBouton(box,g,res){
  var old=box.querySelector(".rch-plus"),vu=RCH.voir[g.g],reste=g.l.length-vu;
  if(old)box.removeChild(old);
  if(reste<=0)return;
  var b=el("button","link rch-plus",tnx("zrech.plus",reste));
  b.type="button";b.setAttribute("aria-label",tnx("zrech.plus_aria",reste,{g:g.n}));
  b.addEventListener("click",function(){
    var liste=box.querySelector(".group"),a=RCH.voir[g.g],i,prem=null;
    for(i=a;i<Math.min(g.l.length,a+RCH_PLUS);i++){var r=rchLigne(g.l[i],res.T);liste.appendChild(r);if(!prem)prem=r;}
    RCH.voir[g.g]=Math.min(g.l.length,a+RCH_PLUS);
    rchPlusBouton(box,g,res);
    if(prem){try{prem.focus();}catch(e){}}
  });
  box.appendChild(b);
}
function rchEtat(txt){$("rch-etat").textContent=txt;}
function rchPorteeTexte(){return RCH.tous?tx("zrech.portee_tous"):tx("zrech.portee_un",{nom:univ().nom});}
function rchRendre(res){
  var box=$("rch-res");clear(box);RCH.res=res;
  if(!res.total){
    var d=el("div","rch-rien");
    d.appendChild(el("p",null,nb(tx("zrech.rien",{q:trim(res.q),portee:rchPorteeTexte()}))));
    d.appendChild(el("p","src",nb(tx("zrech.rien_aide")+(rchPlusieursUnivers()&&!RCH.tous?" "+tx("zrech.rien_tous"):""))));
    box.appendChild(d);
    rchEtat(tx("zrech.aucun"));
    return;
  }
  res.groupes.forEach(function(g){box.appendChild(rchGroupe(g,res));});
  rchEtat(tnx("zrech.etat",res.total,{q:trim(res.q),portee:rchPorteeTexte()}));
}
/* Lance la recherche sur le champ. garder : on revient d'un résultat, les « Voir plus » restent */
function rchLancer(garder){
  RCH.tm=null;
  var q=$("rch-q").value;
  if(!garder||q!==RCH.q)RCH.voir={};
  RCH.q=q;
  $("b-rch-effacer").hidden=!q;
  if(!trim(q)){clear($("rch-res"));RCH.res=null;rchEtat("");$("rch-aide").hidden=false;return;}
  $("rch-aide").hidden=true;
  if(rchLongueur(q)<2){clear($("rch-res"));RCH.res=null;rchEtat(tx("zrech.min2"));return;}
  rchRendre(rchChercher(q));
}
function rchPlanifier(){
  $("b-rch-effacer").hidden=!$("rch-q").value;
  if(RCH.tm)clearTimeout(RCH.tm);
  if(!trim($("rch-q").value)){rchLancer(false);return;}  /* champ vidé : tout de suite */
  RCH.tm=setTimeout(function(){rchLancer(false);},RCH_DELAI);
}
function rchScopeMaj(){
  var p=$("rch-portee");
  p.hidden=!rchPlusieursUnivers();
  $("rch-tous").checked=RCH.tous;
  $("rch-univ").textContent=nb(tx("zrech.sinon",{nom:univ().nom}));
}

/* ----- Ouvrir l'écran, et y revenir ----- */
function rchOuvrir(retour){
  if(retour!==true)RCH.y=0;
  rchScopeMaj();
  $("rch-q").value=RCH.q;
  show("recherche");
  rchLancer(retour===true);
  var f=null;
  if(retour===true){
    if(RCH.foc)f=$("rch-res").querySelector('[data-rid="'+RCH.foc+'"]');
    if(f){try{f.focus({preventScroll:true});}catch(e){}}
    try{window.scrollTo(0,RCH.y);}catch(e2){}
  }else{
    var q=$("rch-q");try{q.focus();q.select();}catch(e3){}
  }
  if(RCH.chauf)clearTimeout(RCH.chauf);
  RCH.chauf=setTimeout(rchChauffer,60);
}
function rchRetour(){rchOuvrir(true);}

/* ----- Ouvrir un résultat ----- */
function rchMarquer(box,texte){
  var l=box.querySelectorAll(".btn"),i,t;
  for(i=0;i<l.length;i++){
    t=l[i].querySelector(".t");
    if(t&&t.textContent.replace(/^★ /,"").replace(/[\u00a0\u202f]/g," ")===texte.replace(/[\u00a0\u202f]/g," ")){
      l[i].classList.add("rch-vise");try{l[i].scrollIntoView({block:"center"});}catch(e){}return;
    }
  }
}
function rchAller(ch){
  RCH.y=window.pageYOffset||0;RCH.foc=ch.id;
  if(!MAT||MAT.k!==ch.k)activate(ch.k);
  univSuivreMat();  /* l'univers de la matière ouverte devient l'univers ouvert (08b), comme depuis l'agenda */
  BACK="home";
  var g=ch.g,x;
  if(g==="mat"){NAV_PRE.home="recherche";renderHome();show("home");}
  else if(g==="the"||g==="qcm"){RCH.via="chap";openChap(ch.th);}
  else if(g==="fic"||g==="syn"){
    openFiche(ch.th,"recherche");
    x=ch.x&&ch.x.anc?$(ch.x.anc):null;
    if(x){try{x.scrollIntoView({block:"start"});}catch(e){x.scrollIntoView();}}
  }
  else if(g==="doc"){
    DOCV.id=ch.x.doc;DOCV.q="";$("docs-q").value="";renderDocs();RCH.via="docs";show("docs");
    x=document.querySelector('#docs-corps [data-k="'+String(ch.x.k).replace(/["\\]/g,"")+'"]');
    if(x){x.classList.add("rch-vise");try{x.scrollIntoView({block:"center"});}catch(e){}}
  }
  else if(g==="cas"){RCH.via="caslist";openCasList();rchMarquer($("cas"),ch.x.nom);}
  else if(g==="exo"){RCH.via="exlist";openExList(false);rchMarquer($("exitems"),ch.t);}
}

/* ----- Champ, case, clavier ----- */
$("rch-q").addEventListener("input",rchPlanifier);
$("rch-form").addEventListener("submit",function(e){
  e.preventDefault();
  if(RCH.tm){clearTimeout(RCH.tm);}
  rchLancer(false);
  var p=$("rch-res").querySelector(".rch-r");
  if(p){try{p.focus();}catch(x){}}else{try{$("rch-q").blur();}catch(y){}}
});
$("b-rch-effacer").addEventListener("click",function(){$("rch-q").value="";rchPlanifier();try{$("rch-q").focus();}catch(e){}});
$("rch-tous").addEventListener("change",function(){RCH.tous=this.checked;rchLancer(false);rchScopeMaj();if(RCH.chauf)clearTimeout(RCH.chauf);RCH.chauf=setTimeout(rchChauffer,60);});
$("b-bach-cherche").addEventListener("click",function(){rchOuvrir(false);});
/* Flèches : du champ aux résultats, d'un résultat au suivant ; Entrée ouvre (c'est un bouton) */
function rchFocalisables(){return [].slice.call($("rch-res").querySelectorAll(".rch-r,.rch-plus"));}
$("recherche").addEventListener("keydown",function(e){
  if(e.altKey||e.ctrlKey||e.metaKey||e.isComposing)return;
  var q=$("rch-q"),l,i;
  if(e.target===q){
    if(e.key==="ArrowDown"){l=rchFocalisables();if(l.length){e.preventDefault();l[0].focus();}}
    else if(e.key==="Escape"&&q.value){e.preventDefault();q.value="";rchPlanifier();}
    return;
  }
  if(e.key!=="ArrowDown"&&e.key!=="ArrowUp")return;
  l=rchFocalisables();i=l.indexOf(document.activeElement);
  if(i<0)return;
  e.preventDefault();
  if(e.key==="ArrowDown"){if(i<l.length-1)l[i+1].focus();}
  else if(i>0)l[i-1].focus();
  else q.focus();
});
/* Raccourci ordinateur : « / » (sur un clavier français, Maj + : ), hors champ et hors entraînement. Aucun conflit :
   Alt + C est la calculatrice (12q), les touches du quiz sont A à D, H J S (ou 1 à 3), O, N et Entrée (11). */
document.addEventListener("keydown",function(e){
  if(e.key!=="/"||e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.defaultPrevented||e.repeat)return;
  var t=e.target,tg=t&&t.tagName;
  if(tg==="INPUT"||tg==="TEXTAREA"||tg==="SELECT"||(t&&t.isContentEditable))return;
  if(ECRAN==="recherche"){e.preventDefault();try{$("rch-q").focus();$("rch-q").select();}catch(x){}return;}
  var n=NAV[ECRAN];
  if(!n||n.focus||(n.sans&&n.sans())||!rchPossible())return;
  if(!$("menu").hidden||SEL.ouvert||($("sig")&&!$("sig").hidden)||($("nt-feuille")&&!$("nt-feuille").hidden)||($("nt-menu")&&!$("nt-menu").hidden))return;
  e.preventDefault();rchOuvrir(false);
});
