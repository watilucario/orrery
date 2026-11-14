/* ---------- Surlignages et notes (v17, point 7 de la matrice de l'auteur) ----------
   Demande de l'auteur : dans le « + » d'une sélection, surligner et attacher une note à un passage ; tout retrouver dans un
   écran « Notes » ; y écrire des notes perso liées à une matière (ajout non sourcé). Mise au propre par une IA : seulement
   « Copier tout pour ton IA » (aucun appel à Claude, rien sur le forfait).
   Où : fiches de cours et fiche de synthèse (écran fiche, zones #fi-intro, #fi-ess, #fi-corps, #fi-ret), jamais dans les
   QCM ni les exercices. Le « + » (12i) appelle ntMenuMaj ; renderFiche (03c) appelle ntFicheAppliquer.
   Ancrage : le passage est cité (q : texte exact, av / ap : 32 caractères avant et après, pos : place dans la fiche de 0 à
   1, sec : titre de la partie) sur le texte de la fiche sans les figures dessinées ni les numéros de partie. À la
   réouverture, la meilleure occurrence de q est surlignée (contexte le plus long, puis la plus proche de pos). Introuvable
   (la fiche a changé) : rien n'est perdu, l'élément reste dans la liste, marqué « Passage modifié », avec son texte.
   Surlignage : un <mark> par nœud de texte (une sélection qui chevauche plusieurs éléments se découpe), jamais
   surroundContents. Trois couleurs, chacune avec son trait (plein, tirets, double) : lisible en niveaux de gris.
   Stockage : <préfixe>notes = {id: élément}, une clé par matière, comme <préfixe>cons. Élément :
   {id, cree, maj, th (thème, SYN_K pour la synthèse, null pour une note perso), nomTh, coul (0 sans surlignage, 1 à 3),
   texte (la note, "" sans note), q, av, ap, pos, sec} ; note perso : {id, cree, maj, th:null, libre:1, texte}.
   Suivi sur le compte (07b, élément note:<id>) : la plus récente gagne, suppressions comprises (d:null). La matière
   ouverte passe par save() ; une autre matière (modifiée depuis l'écran Notes) écrit sa clé et l'heure dans
   <préfixe>suivi, puis fusionne ses notes avec son document du compte (ntSyncMat). Rien n'est jamais retiré parce que
   la fiche ou le thème n'existe plus. Voyage avec la sauvegarde et « Tout exporter » (clé sous le préfixe). */
var KNOTES="",NTR={},NT={ancre:null,ed:null,cible:null,menu:null,toastT:null,annuler:null,filtre:"",pulled:0,textes:{}};
var NT_COULS=["",tx("znote.jaune"),tx("znote.vert"),tx("znote.bleu")],NT_ZONES=["fi-intro","fi-ess","fi-corps","fi-ret"],NT_CTX=32,NT_MAX_Q=2000,NT_MAX_T=5000;
SCREENS.push("notes");
NAV.notes={titre:tx("znote.titre"),onglet:"tab-prof",retour:function(){return [tx("znote.profil"),openProf];}};
function ntId(){
  var a="";
  try{var u=new Uint32Array(2);window.crypto.getRandomValues(u);a=u[0].toString(36)+u[1].toString(36);}catch(e){a=Date.now().toString(36)+Math.floor(Math.random()*1e9).toString(36);}
  return "n"+a;
}
function ntValide(d){
  if(!d||typeof d!=="object"||d instanceof Array||typeof d.id!=="string"||typeof d.cree!=="number"||typeof d.texte!=="string"||d.texte.length>NT_MAX_T)return false;
  if(d.libre)return !!trim(d.texte);
  if(typeof d.th!=="string"||typeof d.q!=="string"||!d.q||d.q.length>NT_MAX_Q||[0,1,2,3].indexOf(d.coul)<0)return false;
  return d.coul>0||!!trim(d.texte);
}
function ntEnEdition(id){return !!(NT.ed&&NT.ed.id===id);}
/* Chargée par activate (08) : tout ce qui est un objet est gardé, même invalide (jamais effacé en silence) */
function ntCharger(M){
  KNOTES=M.pre+"notes";
  NTR=load(KNOTES,{});if(!NTR||typeof NTR!=="object"||NTR instanceof Array)NTR={};
}
function ntLire(k){
  if(MAT&&MAT.k===k)return NTR;
  var o=MATS[k]?load(MATS[k].pre+"notes",{}):{};
  return o&&typeof o==="object"&&!(o instanceof Array)?o:{};
}
function ntListe(k){var o=ntLire(k),l=[],id;for(id in o){if(o.hasOwnProperty(id)&&ntValide(o[id]))l.push(o[id]);}return l;}
/* Écrit un élément (null : supprimé). Matière ouverte : save() et le suivi (07b) datent l'élément ; une autre : à la main. */
function ntEcrire(k,id,it){
  if(it)it.maj=Date.now();
  if(MAT&&MAT.k===k){
    if(it)NTR[id]=it;else delete NTR[id];
    save(KNOTES,NTR);return;
  }
  var M=MATS[k];if(!M)return;
  var o=clone(ntLire(k)),s=load(M.pre+"suivi",null),st=s&&s.st&&typeof s.st==="object"?s.st:{};
  if(it)o[id]=it;else delete o[id];
  st["note:"+id]={at:Date.now(),h:it?suiviHash(JSON.stringify(it)):""};
  save(M.pre+"notes",o);save(M.pre+"suivi",{v:1,st:st});
  ntSyncMat(k);
}
/* Une matière qui n'est pas ouverte : ses notes seulement, fusionnées avec son document du compte (la plus récente gagne).
   Ce qui est plus récent ici repart dans le document lu, le reste du document est laissé tel quel. */
function ntSyncMat(k){
  if(!DB||!UID||!MATS[k]||(MAT&&MAT.k===k))return;
  DB.doc("data/users/"+UID+"/suivi_"+k).get().then(function(snap){
    if(MAT&&MAT.k===k)return;  /* ouverte entre-temps : suiviPull s'en charge */
    var r=snap.exists?clone(snap.data()):null,e=r&&r.e&&typeof r.e==="object"?r.e:{},M=MATS[k],
        o=clone(ntLire(k)),s=load(M.pre+"suivi",null),st=s&&s.st&&typeof s.st==="object"?s.st:{},key,x,ch=false,pousser=false,corps;
    for(key in e){if(e.hasOwnProperty(key)&&key.indexOf("note:")===0){
      x=e[key];if(!x||typeof x.at!=="number"||(st[key]&&x.at<=st[key].at))continue;
      if(x.d&&(!ntValide(x.d)||x.d.id!==key.slice(5)))continue;
      if(ntEnEdition(key.slice(5)))continue;  /* ouverte dans la feuille : on n'y touche pas (comme suiviApplique) */
      if(x.d)o[key.slice(5)]=x.d;else delete o[key.slice(5)];
      st[key]={at:x.at,h:x.d?suiviHash(JSON.stringify(x.d)):""};ch=true;
    }}
    for(key in st){if(st.hasOwnProperty(key)&&key.indexOf("note:")===0&&(!e[key]||st[key].at>e[key].at))pousser=true;}
    if(ch){save(M.pre+"notes",o);save(M.pre+"suivi",{v:1,st:st});ntApresSync();}
    if(pousser){
      corps={v:1,e:clone(e)};
      for(key in st){if(st.hasOwnProperty(key)&&key.indexOf("note:")===0&&(!e[key]||st[key].at>e[key].at))corps.e[key]={at:st[key].at,d:o[key.slice(5)]||null};}
      suiviEnvoi(k,corps);
    }
  },function(){});
}
function ntSyncTout(){
  if(!DB||!UID||Date.now()-NT.pulled<30000)return;
  NT.pulled=Date.now();
  MATS_ORDER.forEach(function(k){if(MAT&&MAT.k===k){if(MAT.ready)suiviPull();}else if(MATS[k].blocs.cours)ntSyncMat(k);});
}
/* Après une fusion qui a changé des notes : fiche et écran Notes redessinés */
function ntApresSync(){
  if(!$("fiche").hidden&&FI)ntFicheAppliquer();
  if(!$("notes").hidden)renderNotes();
}

/* ---------- Le texte d'une fiche et ses nœuds ---------- */
function ntRacines(){return NT_ZONES.map(function(id){return $(id);});}
var NT_EXCLU="svg,.fig-c,.cours-n,button,input,textarea,select";
function ntCarte(racines){
  var t="",n=[];
  racines.forEach(function(r){
    if(!r)return;
    var w=document.createTreeWalker(r,NodeFilter.SHOW_TEXT,null,false),x;
    while((x=w.nextNode())){
      if(!x.nodeValue||(x.parentElement&&x.parentElement.closest(NT_EXCLU)))continue;
      n.push({n:x,a:t.length,b:t.length+x.nodeValue.length});t+=x.nodeValue;
    }
  });
  return {t:t,n:n};
}
function ntDans(noeud){
  var r=ntRacines(),i;
  for(i=0;i<r.length;i++){if(r[i]&&(r[i]===noeud||r[i].contains(noeud)))return true;}
  return false;
}
/* Début et fin d'une sélection dans le texte de la fiche */
function ntBornes(range,carte){
  var s=-1,e=-1;
  carte.n.forEach(function(x){
    var ok=false;try{ok=range.intersectsNode(x.n);}catch(er){}
    if(!ok)return;
    var a=x.n===range.startContainer?x.a+range.startOffset:x.a,b=x.n===range.endContainer?x.a+range.endOffset:x.b;
    if(b<=a)return;
    if(s<0||a<s)s=a;
    if(b>e)e=b;
  });
  if(s<0)return null;
  while(s<e&&/\s/.test(carte.t.charAt(s)))s++;
  while(e>s&&/\s/.test(carte.t.charAt(e-1)))e--;
  return e-s>=2?{s:s,e:e}:null;
}
function ntSection(noeud){
  var hs=[],sec="";
  ntRacines().forEach(function(r){if(r)hs=hs.concat([].slice.call(r.querySelectorAll("h2")));});
  hs.forEach(function(h){if(h.compareDocumentPosition(noeud)&Node.DOCUMENT_POSITION_FOLLOWING){var c=h.cloneNode(true),n=c.querySelector(".cours-n");if(n)c.removeChild(n);sec=trim(c.textContent);}});
  return sec.slice(0,120);
}
function ntAncre(range){
  if(!range||!ntDans(range.startContainer)||!ntDans(range.endContainer))return null;
  var c=ntCarte(ntRacines()),b=ntBornes(range,c),i,noeud=null;
  if(!b||b.e-b.s>NT_MAX_Q)return null;
  for(i=0;i<c.n.length;i++){if(c.n[i].b>b.s){noeud=c.n[i].n;break;}}
  return {q:c.t.slice(b.s,b.e),qv:trim(String(range.toString()).replace(/\s+/g," ")).slice(0,NT_MAX_Q),av:c.t.slice(Math.max(0,b.s-NT_CTX),b.s),ap:c.t.slice(b.e,b.e+NT_CTX),pos:c.t.length?Math.round(b.s/c.t.length*1e4)/1e4:0,sec:noeud?ntSection(noeud):""};
}
/* La meilleure occurrence du passage : contexte le plus long avant + après, puis la plus proche de sa place */
function ntTrouver(t,a){
  var i=t.indexOf(a.q),best=-1,bs=-1,bd=0,k,sc,d;
  while(i>=0){
    sc=0;
    for(k=1;k<=a.av.length&&t.charAt(i-k)===a.av.charAt(a.av.length-k);k++)sc++;
    for(k=0;k<a.ap.length&&t.charAt(i+a.q.length+k)===a.ap.charAt(k);k++)sc++;
    d=Math.abs(i/(t.length||1)-(a.pos||0));
    if(sc>bs||(sc===bs&&d<bd)){best=i;bs=sc;bd=d;}
    i=t.indexOf(a.q,i+1);
  }
  return best;
}
/* Un <mark> par nœud de texte touché : marche quand le passage traverse gras, listes, tableaux ou parties */
function ntEnvelopper(carte,s,e,it){
  var bouts=[];
  carte.n.forEach(function(x){
    var a=Math.max(s,x.a),b=Math.min(e,x.b);
    if(b>a)bouts.push({n:x.n,a:a-x.a,b:b-x.a});
  });
  var marks=bouts.map(function(p){
    var n=p.n;
    if(p.a>0)n=n.splitText(p.a);
    if(p.b-p.a<n.nodeValue.length)n.splitText(p.b-p.a);
    var m=document.createElement("mark");
    m.className="nt-m nt-c"+it.coul+(trim(it.texte)?" nt-a":"");
    m.setAttribute("data-nt",it.id);
    n.parentNode.insertBefore(m,n);m.appendChild(n);
    return m;
  });
  if(!marks.length)return;
  var f=marks[0];f.tabIndex=0;f.setAttribute("role","button");
  f.setAttribute("aria-label",trim(it.texte)?tx("znote.aria_marque_note",{lib:ntLibelle(it),note:ntCourt(it.texte,80)}):tx("znote.aria_marque",{lib:ntLibelle(it)}));
  marks[marks.length-1].className+=" nt-fin";
}
function ntDeballer(){
  ntRacines().forEach(function(r){
    if(!r)return;
    [].slice.call(r.querySelectorAll("mark.nt-m")).forEach(function(m){
      var p=m.parentNode;while(m.firstChild)p.insertBefore(m.firstChild,m);p.removeChild(m);
    });
    r.normalize();
  });
}
/* Appelé par renderFiche (03c) et après chaque changement : tout est retiré puis remis, les plus anciens d'abord */
function ntFicheAppliquer(){
  var msg=$("nt-fi-msg");if(msg)msg.hidden=true;
  if(!FI||!MAT)return;
  try{  /* un surlignage ne doit jamais empêcher la fiche de s'afficher */
    ntDeballer();
    ntListe(MAT.k).filter(function(it){return !it.libre&&it.th===FI;}).sort(function(a,b){return a.cree-b.cree;}).forEach(function(it){
      var c=ntCarte(ntRacines()),i=ntTrouver(c.t,it);
      if(i>=0)ntEnvelopper(c,i,i+it.q.length,it);
    });
  }catch(e){}
}
/* Ouvert depuis l'écran Notes : on descend jusqu'au passage, ou on dit qu'il n'est plus là */
/* Les <mark> d'une note (comparés un à un : l'identifiant d'une donnée importée pourrait contenir un guillemet) */
function ntMarques(id){
  var r=[],l=document.querySelectorAll("#fiche mark.nt-m"),i;
  for(i=0;i<l.length;i++){if(l[i].getAttribute("data-nt")===id)r.push(l[i]);}
  return r;
}
function ntViser(id){
  var ms=ntMarques(id),m=ms[0],msg=$("nt-fi-msg");
  if(m){
    try{m.scrollIntoView({block:"center"});}catch(e){}
    try{m.focus({preventScroll:true});}catch(e){}
    [].forEach.call(ms,function(x){x.classList.add("nt-vise");});
    setTimeout(function(){[].forEach.call(ms,function(x){x.classList.remove("nt-vise");});},1800);
    return;
  }
  if(!msg){msg=el("p","nt-fi-msg");msg.id="nt-fi-msg";msg.setAttribute("role","status");$("fi-duree").parentNode.insertBefore(msg,$("fi-duree").nextSibling);}
  msg.textContent=tx("znote.passage_perdu");
  msg.hidden=false;
}

/* ---------- Le « + » de la sélection (12i) ---------- */
function ntMenuMaj(r){
  var ok=selEcran()==="fiche"&&!!FI&&!!MAT&&!!(r&&r.range),a=ok?ntAncre(r.range):null;
  if(a&&r.txt&&r.txt.length<SEL_MAX)a.qv=r.txt;  /* la sélection lue par le navigateur : espaces entre les blocs */
  NT.ancre=a?{a:a,th:FI,k:MAT.k}:null;
  $("sel-nt").hidden=!a;
  return !!a;
}
function ntSelFin(){
  selMenuFermer();$("sel-btn").hidden=true;$("sel-plus").hidden=true;
  try{window.getSelection().removeAllRanges();}catch(e){}
}
/* Le même passage déjà gardé (même texte, même place) : on le modifie au lieu d'en créer un autre */
function ntMeme(k,th,a){
  return ntListe(k).filter(function(it){return !it.libre&&it.th===th&&it.q===a.q&&it.av===a.av&&it.ap===a.ap&&Math.abs((it.pos||0)-(a.pos||0))<0.002;})[0]||null;
}
function ntNouveau(A,coul,texte){
  var a=A.a,now=Date.now();
  return {id:ntId(),cree:now,maj:now,th:A.th,nomTh:A.th===SYN_K?tx("znote.synthese"):themeName(A.th),coul:coul,texte:texte,q:a.q,qv:a.qv!==a.q?a.qv:undefined,av:a.av,ap:a.ap,pos:a.pos,sec:a.sec};
}
/* Le passage à lire : avec ses espaces entre blocs (qv, gardé quand il diffère de q), sinon le texte exact */
function ntVu(it){return typeof it.qv==="string"&&it.qv?it.qv:it.q;}
function ntSurligner(c){
  var A=NT.ancre;ntSelFin();
  if(!A||MAT.k!==A.k||FI!==A.th)return;
  var it=ntMeme(A.k,A.th,A.a),avant=it?clone(it):null;
  if(it){it=clone(it);it.coul=c;}else it=ntNouveau(A,c,"");
  ntEcrire(A.k,it.id,it);ntFicheAppliquer();
  ntToast(tx("znote.toast_surligne",{c:NT_COULS[c].toLowerCase()}),function(){ntEcrire(A.k,it.id,avant);ntFicheAppliquer();});
}
[1,2,3].forEach(function(c){
  $("b-sel-c"+c).addEventListener("pointerdown",function(e){e.preventDefault();});
  $("b-sel-c"+c).addEventListener("click",function(){ntSurligner(c);});
});
$("b-sel-note").addEventListener("click",function(){
  var A=NT.ancre;ntSelFin();if(!A)return;
  var it=ntMeme(A.k,A.th,A.a);
  if(it)ntEditer(A.k,it);else ntFeuilleOuvrir({mode:"sel",A:A,k:A.k,id:null,extrait:A.a.qv||A.a.q,texte:""});
});

/* ---------- Toucher un passage surligné : son menu ---------- */
function ntMenuConstruire(){
  if($("nt-menu"))return;
  var m=el("div","sel-menu nt-menu");m.id="nt-menu";m.setAttribute("role","menu");m.setAttribute("aria-label",tx("znote.ce_passage"));m.hidden=true;
  document.body.appendChild(m);
  document.addEventListener("pointerdown",function(e){if(!m.hidden&&!e.target.closest("#nt-menu")&&!e.target.closest("mark.nt-m"))ntMenuFermer();});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!m.hidden){var r=NT.menu&&NT.menu.retour;ntMenuFermer();try{if(r)r.focus();}catch(x){}}});
}
function ntMenuFermer(){var m=$("nt-menu");if(m&&!m.hidden){m.hidden=true;}if(NT.menu)NT.menu=null;}
function ntMenuOuvrir(id,mark){
  var it=ntLire(MAT.k)[id];if(!it||!ntValide(it))return;
  ntMenuConstruire();
  var m=$("nt-menu"),k=MAT.k;clear(m);NT.menu={id:id,retour:mark};
  if(trim(it.texte))m.appendChild(el("p","nt-menu-note",nb(ntCourt(it.texte,240))));
  m.appendChild(el("p","sel-nt-l",tx("znote.surligner")));
  var g=el("div","nt-couls");
  [1,2,3].forEach(function(c){
    var b=el("button","sel-mi nt-coul");b.type="button";b.setAttribute("role","menuitemradio");b.setAttribute("aria-checked",it.coul===c?"true":"false");b.id="b-ntm-c"+c;
    b.appendChild(el("span","nt-pastille nt-c"+c));b.firstChild.setAttribute("aria-hidden","true");b.appendChild(document.createTextNode(NT_COULS[c]));
    b.addEventListener("click",function(){ntMenuFermer();var n=clone(it);n.coul=c;ntEcrire(k,id,n);ntFicheAppliquer();});
    g.appendChild(b);
  });
  m.appendChild(g);
  function item(lib,idb,fn){var b=el("button","sel-mi",lib);b.type="button";b.setAttribute("role","menuitem");b.id=idb;b.addEventListener("click",function(){ntMenuFermer();fn();});m.appendChild(b);return b;}
  if(it.coul)item(tx("znote.retirer_surlignage"),"b-ntm-retirer",function(){ntRetirer(k,it,"coul");});
  item(trim(it.texte)?tx("znote.modifier_note"):tx("znote.ajouter_note"),"b-ntm-note",function(){ntEditer(k,it);});
  if(trim(it.texte))item(tx("znote.supprimer_note"),"b-ntm-suppr",function(){ntRetirer(k,it,"texte");});
  m.hidden=false;
  var r=mark.getBoundingClientRect(),w=m.offsetWidth||220,h=m.offsetHeight||160,top=r.bottom+8,left=Math.max(8,Math.min(r.left,window.innerWidth-w-8));
  if(top+h>window.innerHeight-12)top=Math.max(8,r.top-h-8);
  m.style.top=Math.round(top)+"px";m.style.left=Math.round(left)+"px";
  try{m.querySelector("button").focus();}catch(e){}
}
/* Retirer le surlignage ou la note ; sans l'un ni l'autre, l'élément est supprimé. Toujours annulable. */
function ntRetirer(k,it,quoi){
  var avant=clone(it),n=clone(it);
  if(quoi==="coul")n.coul=0;else n.texte="";
  if(!n.coul&&!trim(n.texte))n=null;
  ntEcrire(k,it.id,n);ntFicheAppliquer();if(!$("notes").hidden)renderNotes();
  ntToast(quoi==="coul"?tx("znote.toast_retire"):tx("znote.toast_supprimee"),function(){ntEcrire(k,avant.id,avant);ntFicheAppliquer();if(!$("notes").hidden)renderNotes();});
}
$("fiche").addEventListener("click",function(e){
  var m=e.target.closest?e.target.closest("mark.nt-m"):null,s;
  if(!m)return;
  try{s=window.getSelection();if(s&&!s.isCollapsed)return;}catch(x){}
  ntMenuOuvrir(m.getAttribute("data-nt"),m);
});
$("fiche").addEventListener("keydown",function(e){
  var m=e.target.closest?e.target.closest("mark.nt-m"):null;
  if(m&&(e.key==="Enter"||e.key===" ")){e.preventDefault();ntMenuOuvrir(m.getAttribute("data-nt"),m);}
});

/* ---------- La feuille d'une note : sur un passage, ou note perso liée à une matière ---------- */
function ntFeuilleConstruire(){
  if($("nt-feuille"))return;
  var v=el("div","sig-voile");v.id="nt-voile";v.hidden=true;v.addEventListener("click",ntFeuilleFermer);
  var f=el("div","sig-feuille");f.id="nt-feuille";f.hidden=true;f.setAttribute("role","dialog");f.setAttribute("aria-modal","true");f.setAttribute("aria-labelledby","nt-f-titre");
  var h=el("div","sig-tete"),t=el("p","sig-titre");t.id="nt-f-titre";h.appendChild(t);
  var x=el("button","link sig-x",tx("znote.fermer"));x.type="button";x.addEventListener("click",ntFeuilleFermer);h.appendChild(x);f.appendChild(h);
  var form=el("form","sig-form");form.id="nt-form";form.setAttribute("autocomplete","off");
  var ex=el("p","sig-extrait");ex.id="nt-f-extrait";form.appendChild(ex);
  var ml=el("label","plab",tx("znote.matiere"));ml.id="nt-f-mat-l";ml.setAttribute("for","nt-f-mat");form.appendChild(ml);
  var ms=el("select","field");ms.id="nt-f-mat";form.appendChild(ms);ms.addEventListener("change",ntFormInfo);
  var lc=el("label","plab",tx("znote.ta_note"));lc.setAttribute("for","nt-f-txt");form.appendChild(lc);
  var ta=el("textarea","field");ta.id="nt-f-txt";ta.rows=5;ta.maxLength=NT_MAX_T;form.appendChild(ta);
  var p=el("p","src");p.id="nt-f-perso";form.appendChild(p);
  var er=el("p","v-ko sig-err");er.id="nt-f-err";er.hidden=true;er.setAttribute("role","alert");form.appendChild(er);
  var bs=el("div","ag-btns"),ok=el("button","sbtn",tx("znote.enregistrer"));ok.type="submit";ok.id="b-nt-f-ok";bs.appendChild(ok);
  var an=el("button","link",tx("znote.annuler"));an.type="button";an.addEventListener("click",ntFeuilleFermer);bs.appendChild(an);
  form.appendChild(bs);
  form.addEventListener("submit",function(e){e.preventDefault();ntFeuilleEnregistrer();});
  f.appendChild(form);
  document.body.appendChild(v);document.body.appendChild(f);
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!$("nt-feuille").hidden)ntFeuilleFermer();});
}
/* ed : {mode: "sel" | "edit" | "libre", k, id, A (ancre d'une sélection), extrait, texte} */
function ntFeuilleOuvrir(ed){
  ntFeuilleConstruire();
  NT.ed=ed;NT.ed.retour=document.activeElement;
  var libre=ed.mode==="libre"||ed.libre;
  $("nt-f-titre").textContent=ed.mode==="libre"?tx("znote.nouvelle_note"):ed.mode==="edit"?tx("znote.modifier_note"):tx("znote.note_passage");
  $("nt-f-extrait").textContent=ed.extrait?"« "+nb(ntCourt(ed.extrait,400))+" »":"";$("nt-f-extrait").hidden=!ed.extrait;
  var ms=$("nt-f-mat");clear(ms);
  $("nt-f-mat-l").hidden=ed.mode!=="libre";ms.hidden=ed.mode!=="libre";
  if(ed.mode==="libre"){
    ntMatieres(true).forEach(function(k){var o=el("option",null,MATS[k].titre);o.value=k;ms.appendChild(o);});
    ms.value=ed.k&&MATS[ed.k]?ed.k:(MAT?MAT.k:MATS_ORDER[0]);
  }
  $("nt-f-txt").value=ed.texte||"";
  $("nt-f-txt").placeholder=libre?tx("znote.ph_libre"):tx("znote.ph_passage");
  ntFormInfo();
  $("nt-f-err").hidden=true;
  $("nt-voile").hidden=false;$("nt-feuille").hidden=false;
  try{$("nt-f-txt").focus();}catch(e){}
}
function ntFeuilleFermer(){
  if(!$("nt-feuille")||$("nt-feuille").hidden)return;
  var r=NT.ed&&NT.ed.retour;
  $("nt-feuille").hidden=true;$("nt-voile").hidden=true;NT.ed=null;
  try{if(r&&r.focus&&document.body.contains(r))r.focus();}catch(e){}
}
function ntEditer(k,it){ntFeuilleOuvrir({mode:"edit",k:k,id:it.id,libre:!!it.libre,extrait:it.libre?"":ntVu(it),texte:it.texte});}
function ntFeuilleEnregistrer(){
  var ed=NT.ed,txt=trim($("nt-f-txt").value),it,avant=null,k;
  if(!ed)return;
  if(ed.mode==="libre"){
    if(!txt){$("nt-f-err").textContent=tx("znote.ecris");$("nt-f-err").hidden=false;return;}
    k=$("nt-f-mat").value;if(!MATS[k])return;
    var now=Date.now();it={id:ntId(),cree:now,maj:now,th:null,libre:1,texte:txt};
    if(NT.filtre&&NT.filtre!==k)NT.filtre=k;
    ntFeuilleFermerApres(function(){ntEcrire(k,it.id,it);});
    ntToast(tx("znote.toast_ajoutee_a",{mat:MATS[k].titre}),null);return;
  }
  k=ed.k;
  if(ed.mode==="sel"){
    if(!txt){$("nt-f-err").textContent=tx("znote.ecris");$("nt-f-err").hidden=false;return;}
    it=ntMeme(k,ed.A.th,ed.A.a);
    if(it){avant=clone(it);it=clone(it);it.texte=txt;}else it=ntNouveau(ed.A,0,txt);
  }else{
    var cur=ntLire(k)[ed.id];if(!cur){ntFeuilleFermer();return;}
    avant=clone(cur);it=clone(cur);it.texte=txt;
    if(it.libre&&!txt){$("nt-f-err").textContent=tx("znote.ecris_ou_suppr");$("nt-f-err").hidden=false;return;}
    if(!it.coul&&!txt&&!it.libre)it=null;
  }
  var id=it?it.id:ed.id;
  ntFeuilleFermerApres(function(){ntEcrire(k,id,it);});
  ntToast(!it?tx("znote.toast_supprimee"):avant?tx("znote.toast_modifiee"):tx("znote.toast_ajoutee"),avant||!it?function(){ntEcrire(k,id,avant);ntApresChangement();}:null);
}
/* Écrit (la note n'est plus « en édition » : une fusion peut de nouveau la toucher), ferme, redessine */
function ntFeuilleFermerApres(ecrire){
  var r=NT.ed&&NT.ed.retour;NT.ed=null;ecrire();
  $("nt-feuille").hidden=true;$("nt-voile").hidden=true;
  ntApresChangement();
  try{if(r&&r.focus&&document.body.contains(r))r.focus();}catch(e){}
}
function ntApresChangement(){if(!$("fiche").hidden&&FI)ntFicheAppliquer();if(!$("notes").hidden)renderNotes();}

/* ---------- Petit message en bas, avec « Annuler » ---------- */
function ntToast(txt,annuler){
  var t=$("nt-toast");
  if(!t){
    t=el("div","nt-toast");t.id="nt-toast";t.setAttribute("role","status");t.hidden=true;
    t.appendChild(el("span","nt-toast-t"));
    var b=el("button","link nt-toast-b",tx("znote.annuler"));b.type="button";b.id="b-nt-annuler";
    b.addEventListener("click",function(){var f=NT.annuler;ntToastFin();if(f)f();});
    t.appendChild(b);document.body.appendChild(t);
  }
  t.firstChild.textContent=txt;NT.annuler=annuler||null;t.lastChild.hidden=!annuler;t.hidden=false;
  if(NT.toastT)clearTimeout(NT.toastT);
  NT.toastT=setTimeout(ntToastFin,annuler?7000:3500);
}
function ntToastFin(){var t=$("nt-toast");if(t)t.hidden=true;NT.annuler=null;if(NT.toastT){clearTimeout(NT.toastT);NT.toastT=null;}}

/* ---------- L'écran Notes (Profil › Notes et surlignages) ---------- */
function ntCourt(s,n){s=trim(String(s==null?"":s)).replace(/\s+/g," ");return s.length>n?s.slice(0,n-1)+"…":s;}
function ntLibelle(it){return it.libre?tx("znote.lib_perso"):it.coul?tx(trim(it.texte)?"znote.lib_surligne_note":"znote.lib_surligne",{c:NT_COULS[it.coul].toLowerCase()}):tx("znote.lib_passage");}
function ntDate(t){var d=new Date(t||0);return d.getDate()+" "+MOIS[d.getMonth()]+" "+d.getFullYear();}
/* Toutes les matières (pour une note perso), ou celles qui ont déjà des notes (liste, filtre) */
/* Texte sous le formulaire de note. Une matière sans cours n'est pas relue sur le compte (suiviPull) : sa note reste ici. */
function ntFormInfo(){
  var libre=!$("nt-f-mat").hidden,k=$("nt-f-mat").value,t=libre?tx("znote.info_libre"):tx("znote.info_passage");
  if(libre&&MATS[k]&&!MATS[k].ready)t+=" "+tx("znote.info_sans_cours");
  $("nt-f-perso").textContent=nb(t);
}
function ntMatieres(pourNote){
  return MATS_ORDER.filter(function(k){return pourNote?true:ntListe(k).length>0;});
}
function ntCompte(){return MATS_ORDER.reduce(function(n,k){return n+ntListe(k).length;},0);}
function ntProfMaj(){
  var n=ntCompte();
  $("b-prof-notes-s").textContent=n?tnx("znote.prof_n",n):tx("znote.prof_vide");
}
function openNotes(){NT.textes={};renderNotes();show("notes");ntSyncTout();}
$("b-prof-notes").addEventListener("click",openNotes);
function ntNomTheme(k,th,it){
  if(th===SYN_K)return tx("znote.synthese");
  var T=(MATS[k].THEMES||[]).filter(function(x){return x.k===th;})[0];
  return T?T.n:(it&&it.nomTh)||th;
}
/* Le texte d'une fiche, rendu hors de l'écran comme renderFiche le fait : pour dire si un passage y est encore */
function ntFicheDe(k,th){var M=MATS[k];if(!M||!M.blocs.cours)return null;return th===SYN_K?M.SYN||null:(M.COURS||{})[th]||null;}
function ntTexteFiche(k,th){
  var cle=k+"|"+th;
  if(NT.textes.hasOwnProperty(cle))return NT.textes[cle];
  var c=ntFicheDe(k,th),t=null;
  if(!c){NT.textes[cle]="";return "";}
  try{
    var neuf=!!c.intro,cl=ficheCle(c),parts=neuf?c.sections.slice(0,-1):c.sections.slice(1),r=[],intro=el("p"),ess=el("div"),corps=el("div"),ret=el("div");
    if(neuf)intro.textContent=nb(c.intro);
    var bc=neuf?ret:ess;bc.appendChild(el("h2",null,nb(cl.t)));coursMd(cl.md,bc);
    parts.forEach(function(s,i){var h=el("h2");h.appendChild(el("span","cours-n",String(i+1)));h.appendChild(document.createTextNode(nb(ficheTitre(s.t))));corps.appendChild(h);coursMd(s.md,corps);});
    r=[intro,ess,corps,ret];t=ntCarte(r).t;
  }catch(e){t=null;}
  NT.textes[cle]=t;return t;
}
/* Vrai : le passage n'est plus dans la fiche (ou la fiche n'existe plus). Faux si on ne sait pas. */
function ntModifie(k,it){
  if(it.libre)return false;
  var t=ntTexteFiche(k,it.th);
  if(t===null)return false;
  return ntTrouver(t,it)<0;
}
function renderNotes(){
  var box=$("nt-liste"),ms=ntMatieres(false),sel=$("nt-mat"),tous=0;clear(box);clear(sel);
  if(NT.filtre&&ms.indexOf(NT.filtre)<0)NT.filtre="";
  ms.forEach(function(k){tous+=ntListe(k).length;});
  var o=el("option",null,tx("znote.toutes_matieres",{n:tous}));o.value="";sel.appendChild(o);
  ms.forEach(function(k){var x=el("option",null,MATS[k].titre+" ("+ntListe(k).length+")");x.value=k;sel.appendChild(x);});
  sel.value=NT.filtre;$("nt-mat-l").hidden=ms.length<2;
  $("b-nt-copier").hidden=!tous;
  if(!tous){
    box.appendChild(el("p","lead nt-vide",nb(tx("znote.vide"))));
    return;
  }
  ms.filter(function(k){return !NT.filtre||k===NT.filtre;}).forEach(function(k){
    var h=el("h2","nt-mat-t",MATS[k].titre);box.appendChild(h);
    ntGroupes(k).forEach(function(g){
      box.appendChild(el("h3","h-sous nt-th-t",nb(g.n)));
      var grp=el("div","nt-grp");
      g.l.forEach(function(it){grp.appendChild(ntCarteItem(k,it));});
      box.appendChild(grp);
    });
  });
}
/* Par thème dans l'ordre du cours (synthèse d'abord, notes perso à la fin), chaque groupe du plus récent au plus ancien */
function ntGroupes(k){
  var L=ntListe(k),par={},ordre=[SYN_K].concat((MATS[k].THEMES||[]).map(function(t){return t.k;})),gs=[];
  L.forEach(function(it){var g=it.libre?"":it.th;(par[g]=par[g]||[]).push(it);});
  Object.keys(par).forEach(function(g){if(g&&ordre.indexOf(g)<0)ordre.push(g);});
  ordre.concat([""]).forEach(function(g){
    if(!par[g])return;
    par[g].sort(function(a,b){return b.cree-a.cree;});
    gs.push({k:g,n:g?ntNomTheme(k,g,par[g][0]):tx("znote.notes_perso"),l:par[g]});
  });
  return gs;
}
function ntCarteItem(k,it){
  var c=el("div","nt-it"),tete=el("p","nt-it-h"),mod=ntModifie(k,it);
  c.setAttribute("data-nt",it.id);
  if(it.libre)tete.appendChild(el("span","nt-tag nt-tag-perso",tx("znote.tag_perso")));
  else if(it.coul){var s=el("span","nt-tag");s.appendChild(el("span","nt-pastille nt-c"+it.coul));s.firstChild.setAttribute("aria-hidden","true");s.appendChild(document.createTextNode(tx("znote.tag_surligne",{c:NT_COULS[it.coul]})));tete.appendChild(s);}
  else tete.appendChild(el("span","nt-tag",tx("znote.lib_passage")));
  if(mod)tete.appendChild(el("span","nt-tag nt-tag-mod",tx("znote.tag_modifie")));
  tete.appendChild(el("span","nt-it-d",ntDate(it.cree)));
  c.appendChild(tete);
  if(!it.libre){
    var q=el("blockquote","nt-it-q"),qm=el("span","nt-m nt-c"+it.coul);qm.textContent=nb(ntCourt(ntVu(it),600));q.appendChild(qm);c.appendChild(q);
    if(it.sec)c.appendChild(el("p","src nt-it-sec",nb(tx("znote.partie",{p:it.sec}))));
    if(mod)c.appendChild(el("p","src nt-it-modt",tx("znote.fiche_changee")));
  }
  if(trim(it.texte))c.appendChild(el("p","nt-it-t",it.texte));
  var a=el("div","nt-it-a"),b;
  if(!it.libre&&ntFicheDe(k,it.th)){b=el("button","link",tx("znote.ouvrir_fiche"));b.type="button";b.className+=" nt-ouvrir";b.addEventListener("click",function(){ntOuvrir(k,it);});a.appendChild(b);}
  b=el("button","link nt-modif",it.libre||trim(it.texte)?tx("znote.modifier"):tx("znote.ajouter_note"));b.type="button";b.addEventListener("click",function(){ntEditer(k,it);});a.appendChild(b);
  b=el("button","link nt-suppr",tx("znote.supprimer"));b.type="button";b.addEventListener("click",function(){ntSupprimer(k,it);});a.appendChild(b);
  c.appendChild(a);
  return c;
}
function ntSupprimer(k,it){
  var avant=clone(it);
  ntEcrire(k,it.id,null);renderNotes();ntProfMaj();
  ntToast(it.libre?tx("znote.toast_supprimee"):it.coul?tx("znote.toast_surl_supprime"):tx("znote.toast_supprimee"),function(){ntEcrire(k,avant.id,avant);ntApresChangement();});
}
function ntOuvrir(k,it){
  if(!MAT||MAT.k!==k)activate(k);
  openFiche(it.th,"notes");
  ntViser(it.id);
}
$("nt-mat").addEventListener("change",function(){NT.filtre=this.value;renderNotes();});
$("b-nt-nouv").addEventListener("click",function(){ntFeuilleOuvrir({mode:"libre",k:NT.filtre||(MAT?MAT.k:null),id:null,extrait:"",texte:""});});
/* Tout en texte brut, pour une autre IA : aucun appel à Claude */
function ntTexteIA(){
  var ms=ntMatieres(false).filter(function(k){return !NT.filtre||k===NT.filtre;}),L=[];
  L.push(tx("znote.ia_titre")+(NT.filtre?" ("+MATS[NT.filtre].titre+")":""));
  L.push(tx("znote.ia_consigne"));
  ms.forEach(function(k){
    L.push("");L.push("# "+MATS[k].titre);
    ntGroupes(k).forEach(function(g){
      L.push("");L.push("## "+g.n);
      g.l.forEach(function(it){
        if(it.libre){L.push("- ["+tx("znote.ia_perso")+"] "+it.texte.replace(/\n+/g," / "));return;}
        L.push("- ["+(it.coul?tx("znote.ia_surligne"):tx("znote.ia_passage"))+(ntModifie(k,it)?", "+tx("znote.ia_modifie"):"")+"] « "+ntVu(it)+" »"+(it.sec?" ("+tx("znote.ia_partie")+" "+it.sec+")":""));
        if(trim(it.texte))L.push("  "+tx("znote.ia_ma_note")+" "+it.texte.replace(/\n+/g," / "));
      });
    });
  });
  return L.join("\n");
}
$("b-nt-copier").addEventListener("click",function(){
  copierTexte(ntTexteIA(),$("nt-copie-note"),$("nt-copie-zone"),tx("znote.copie_ok"));
});
