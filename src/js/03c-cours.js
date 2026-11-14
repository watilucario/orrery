/* ---------- Cours (v7.2) : une fiche par thème, à lire avant les questions ----------
   Demande de l'auteur (17 oct.) : « je n'arrive pas à comprendre les questions » ; il veut des fiches de synthèse et du
   cours. Contenu : univers/<programme>/<matière>/cours/<thème>.md (build.py : lire_cours ; dans un pack : section
   « # Cours · <thème> », packCours, 02). Une fiche = {th, min, sections:[{t, md}], src} : « L'essentiel » d'abord (ce
   qu'il faut savoir par cœur), puis le cours en sections, puis ses sources.
   Écrans : cours (la liste des fiches) et fiche (une fiche, puis « S'entraîner sur ce thème » et la fiche suivante).
   Ailleurs : « Lire le cours » dans un thème (08c), « Revoir l'essentiel » sous la correction d'une question (03, choose),
   le conseil de l'accueil (03, renderConseil). Fiches ouvertes : <préfixe>cours = {thème: date}, dans ce navigateur
   (et dans la sauvegarde), pas sur le compte. */
var COURS={},KCOURS,COURS_LU={},FI=null,SYN=null;
function coursDe(th){return blocOn("cours")?COURS[th]||null:null;}
/* v10.3 : la fiche de synthèse de la matière (synthese.md : tout le programme sur une fiche), en tête de l'écran Cours.
   Elle s'ouvre dans l'écran fiche sous la clé SYN_K, sans thème : pas de série ni de relecture, puis la première fiche. */
var SYN_K="_synthese";
function synDe(){return blocOn("cours")?SYN:null;}
function ficheDe(k){return k===SYN_K?synDe():coursDe(k);}
function coursListe(){return THEMES.filter(function(t){return !!coursDe(t.k);});}
function coursMots(c){return c.sections.reduce(function(n,s){return n+s.md.replace(/^:::[\s\S]*?^:::$/mg,"").split(/\s+/).filter(function(x){return !!x;}).length;},0);}  /* sans les figures */
function coursMin(c){return c.min||Math.max(1,Math.round(coursMots(c)/150));}
function coursCharger(){
  COURS_LU=load(KCOURS,{});
  if(!COURS_LU||typeof COURS_LU!=="object"||COURS_LU instanceof Array)COURS_LU={};
  FI=null;
}
/* Markdown simple des fiches, contrôlé par build.py : paragraphes, listes « - » et « 1. », « ### », **gras**,
   encadrés « > », tableaux, figures « ::: » (v7.3, 03d). Tout passe par des nœuds texte : rien du contenu n'est lu
   comme du HTML. v7.3 : dans un tableau, une colonne de nombres est alignée à droite en chiffres tabulaires, et une
   ligne qui commence par « = » ou « Total » est un total (en gras, filet au-dessus) : plus facile de lire un bilan. */
function coursInline(box,txt){
  var p=String(txt).split("**"),i;
  for(i=0;i<p.length;i++){
    if(!p[i])continue;
    if(i%2)box.appendChild(el("strong",null,nb(p[i])));else box.appendChild(document.createTextNode(nb(p[i])));
  }
  return box;
}
function coursCellules(l){return l.replace(/^\||\|$/g,"").split("|").map(trim);}
var COURS_NUM=/^(\*\*)?[=+]?\s*[−-]?\s*\d[\d \u00a0\u202f]*(,\d+)?\s*(%|€|k€|M€|j|jours|ans?|fois)?(\*\*)?$/;
function coursTable(rows){
  var w=el("div","cours-tw"),t=el("table","cours-t"),h=el("thead"),b=el("tbody"),tr=el("tr");
  var corps=rows.slice(1).filter(function(r){return !PACK_TABLE_SEP.test(r);}).map(coursCellules),n=coursCellules(rows[0]).length,num=[],j;
  for(j=0;j<n;j++)num.push(j>0&&corps.some(function(r){return !!r[j];})&&corps.every(function(r){return !r[j]||r[j]==="—"||COURS_NUM.test(r[j]);}));
  coursCellules(rows[0]).forEach(function(c,k){tr.appendChild(coursInline(el("th",num[k]?"num":null),c));});
  h.appendChild(tr);t.appendChild(h);
  corps.forEach(function(r){
    var x=el("tr",/^(\*\*)?(=|Total\b)/.test(r[0]||"")?"tot":null);
    r.forEach(function(c,k){x.appendChild(coursInline(el("td",num[k]?"num":null),c));});b.appendChild(x);
  });
  t.appendChild(b);w.appendChild(t);
  return w;
}
/* Énoncé d'une question, d'un cas ou d'un exercice (v7.3) : son texte ligne à ligne, ses tableaux et ses figures.
   Sans tableau ni figure, exactement le texte d'avant (textContent). */
function ctxRendre(box,txt){
  var ls=String(txt==null?"":txt).split("\n"),i=0,p=[];
  if(!ls.some(function(l){return l.charAt(0)==="|"||FIG_DEBUT.test(l);})){box.textContent=nb(txt);return;}
  clear(box);
  function texte(){var t=p.join("\n").replace(/^\n+|\n+$/g,"");if(t)box.appendChild(el("div","ctx-p",nb(t)));p=[];}
  while(i<ls.length){
    if(FIG_DEBUT.test(ls[i])){texte();var r=figDepuis(ls,i);box.appendChild(r.n);i=r.i;continue;}
    if(ls[i].charAt(0)==="|"){texte();var rows=[];while(i<ls.length&&ls[i].charAt(0)==="|"){rows.push(ls[i]);i++;}box.appendChild(coursTable(rows));continue;}
    p.push(ls[i]);i++;
  }
  texte();
}
/* v13.1 : encadrés typés d'une fiche, chacun sa couleur et son nom (build.py : ENCADRES ; 02 : packVisuels) */
/* Les noms des encadrés viennent de i18nEnc (00-i18n.js, cours.enc_* dans syntaxe.json) */
function encadreDepuis(ls,i){
  var m=FIG_DEBUT.exec(ls[i]),j=i+1,prof=0,corps=[],box=el("div","enc enc-"+m[1]),h=el("p","enc-h");
  while(j<ls.length){
    var x=trim(ls[j]);
    if(x===":::"){if(!prof)break;prof--;}
    else if(FIG_DEBUT.test(ls[j]))prof++;
    corps.push(ls[j]);j++;
  }
  h.appendChild(el("span","enc-l",i18nEnc(m[1])));
  if(trim(m[2]))coursInline(h.appendChild(el("span","enc-t")),trim(m[2]));
  box.appendChild(h);coursMd(corps.join("\n"),box,m[1]==="formule");
  return {n:box,i:j+1};
}
/* Exemple dans une phrase (v17.4, demande de l'auteur du 4 nov. : « les exemples visuellement différenciés de l'explication »). Une définition
   ou un paragraphe qui contient « … Exemple : … » garde sa définition ; l'exemple passe à la ligne, plus clair, sans gras, avec le repère ◆
   des encadrés, et se masque avec eux (« Masquer les exemples »). Le texte reste identique au caractère près (ancrage des notes,
   recherche, copie) : seul le découpage en éléments change. */
var EX_PHRASE=/^(.*?)(\s|^)(Exemples?\s?:)(\s+)(\S.*)$/;
function coursTexte(n,txt){
  var m=EX_PHRASE.exec(txt),s;
  if(!m)return coursInline(n,txt);
  if(m[1])coursInline(n,m[1]);
  if(m[2])n.appendChild(document.createTextNode(m[2]));
  s=el("span","ex-in");s.appendChild(el("span","ex-l",LANG==="fr"?m[3]:t(/^Exemples/.test(m[3])?"cours.ex_plusieurs":"cours.ex_une")));s.appendChild(document.createTextNode(m[4]));
  coursInline(s,m[5]);n.appendChild(s);
  return n;
}
function coursNbExPhrase(md){
  return String(md).split("\n").filter(function(l){return !/^(:::|\||>|#)/.test(l)&&EX_PHRASE.test(l);}).length;
}
/* lignes (v17) : chaque ligne est un paragraphe. Les encadrés « formule » en ont besoin (une formule par ligne) : sinon les
   lignes d'un paragraphe sont recollées par une espace et trois formules n'en font plus qu'une (retour de l'auteur, 6 nov.). */
function coursMd(md,box,lignes){
  var ls=String(md).split("\n"),i=0,l,p=[],m;
  function para(){if(p.length){box.appendChild(coursTexte(el("p"),p.join(" ")));p=[];}}
  while(i<ls.length){
    l=ls[i];
    if(!trim(l)){para();i++;continue;}
    m=FIG_DEBUT.exec(l);
    if(m&&ENCADRES.indexOf(m[1])>=0){para();var ec=encadreDepuis(ls,i);box.appendChild(ec.n);i=ec.i;continue;}
    if(FIG_DEBUT.test(l)){para();var fg=figDepuis(ls,i);box.appendChild(fg.n);i=fg.i;continue;}
    if(l.indexOf("### ")===0){para();box.appendChild(coursInline(el("h3","cours-h3"),l.slice(4)));i++;continue;}
    if(l.charAt(0)==="|"){
      para();var rows=[];
      while(i<ls.length&&ls[i].charAt(0)==="|"){rows.push(ls[i]);i++;}
      box.appendChild(coursTable(rows));continue;
    }
    if(l.charAt(0)===">"){
      para();var enc=el("div","cours-enc");
      while(i<ls.length&&ls[i].charAt(0)===">"){var t=trim(ls[i].slice(1));if(t)enc.appendChild(coursInline(el("p"),t));i++;}
      box.appendChild(enc);continue;
    }
    m=/^(- |\d+\. )/.exec(l);
    if(m){
      para();var num=m[1]!=="- ",list=el(num?"ol":"ul","cours-l"),li=null,mm;
      while(i<ls.length){
        mm=/^(- |\d+\. )(.*)$/.exec(ls[i]);
        if(mm&&(mm[1]!=="- ")===num){li=coursTexte(el("li"),mm[2]);list.appendChild(li);i++;}
        else if(li&&/^\s+\S/.test(ls[i])){li.appendChild(document.createTextNode(" "));coursInline(li,trim(ls[i]));i++;}
        else break;
      }
      box.appendChild(list);continue;
    }
    p.push(trim(l));i++;
    if(lignes)para();
  }
  para();
  return box;
}
/* Certification des fiches (v7.4, revue en v7.6). Demande de l'auteur (18 oct.) : un seul signe, un rond coché, sur les
   fiches retravaillées sur le fond et la forme, jamais d'office sur une fiche qu'on vient d'écrire. Une fiche est
   certifiée si sa relecture (revue.md, depuis build.py : REVUES) met « oui » (ou « sans objet ») aux 12 critères de la
   grille (GRILLE, docs/grille-cours.md) et si son texte est celui qui a été relu (empreinte). Sinon : aucun signe. */
function coursEmpreinte(c){  /* FNV-1a 32 bits des octets UTF-8 : même calcul que empreinte() dans build.py */
  var s=(c.min||"")+"\n"+c.sections.map(function(x){return x.t+"\n"+x.md;}).join("\n")+"\n"+c.src+(c.av?"\n"+c.av:"")+(c.intro?"\nI:"+c.intro:""),u=unescape(encodeURIComponent(s)),h=0x811c9dc5,i;
  for(i=0;i<u.length;i++){h^=u.charCodeAt(i);h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);}
  return ("0000000"+(h>>>0).toString(16)).slice(-8);
}
function revueDe(th){
  var R=MAT&&REVUES[MAT.k],c=coursDe(th),x=R&&R.fiches[th];
  if(!x||!c)return null;
  return {date:R.date,par:R.par,v:x.v,ok:x.h===coursEmpreinte(c)};
}
function certifiee(th){
  var r=revueDe(th);
  return !!(r&&r.ok&&GRILLE.every(function(g){var v=r.v[g.k];return !!v&&(v[0]==="oui"||v[0]==="sans objet");}));
}
function revueDate(d){var p=String(d).split("-");return (+p[2])+" "+MOIS[+p[1]-1]+" "+p[0];}
function revueToutes(){var L=coursListe();return !!L.length&&L.every(function(t){return certifiee(t.k);});}
/* Le signe : un rond coché (SVG), avec son nom pour les lecteurs d'écran */
function certIcone(){
  var ns="http://www.w3.org/2000/svg",sv=document.createElementNS(ns,"svg"),c=document.createElementNS(ns,"circle"),pa=document.createElementNS(ns,"path");
  sv.setAttribute("viewBox","0 0 20 20");sv.setAttribute("class","cert-ic");sv.setAttribute("role","img");sv.setAttribute("aria-label",t("cours.certifie"));
  c.setAttribute("cx","10");c.setAttribute("cy","10");c.setAttribute("r","9");pa.setAttribute("d","M5.8 10.3l2.8 2.8 5.6-6");
  sv.appendChild(c);sv.appendChild(pa);return sv;
}
/* En tête d'une fiche certifiée : le rond, et replié dessous, les critères de la certification */
function renderRevue(th){
  var d=$("fi-revue"),r=revueDe(th),s=$("fi-revue-s"),c=$("fi-revue-c");
  d.hidden=!certifiee(th);d.open=false;clear(s);clear(c);
  if(d.hidden)return;
  s.appendChild(certIcone());s.appendChild(el("span","cert-t",t("cours.certifie")));
  s.appendChild(el("span","rv-quand",nb(t("cours.relu_le",{date:revueDate(r.date)}))));
  c.appendChild(el("p","src",nb(t("cours.certif_expl",{par:r.par,date:revueDate(r.date)}))));
  [["fond",t("cours.fond")],["forme",t("cours.forme")]].forEach(function(f){
    c.appendChild(el("h3","cours-h3",f[1]));
    var ul=el("ul","rv-l");
    GRILLE.filter(function(g){return g.f===f[0];}).forEach(function(g){
      var v=r.v[g.k],li=el("li"),h=el("div","rv-h");
      li.setAttribute("data-k",g.k);
      h.appendChild(certIcone());h.appendChild(el("b",null,nb(g.n)));li.appendChild(h);
      li.appendChild(el("span","rv-q",nb(g.q)));li.appendChild(el("span","rv-c",nb(v[0]==="sans objet"?t("cours.sans_objet")+" "+v[1]:v[1])));
      ul.appendChild(li);
    });
    c.appendChild(ul);
  });
}
/* Écran « Cours » : les fiches de la matière, dans l'ordre des thèmes */
function openCours(){renderCours();show("cours");}
function renderCours(){
  var box=$("cours-liste"),L=coursListe(),manque=THEMES.filter(function(t){return !coursDe(t.k);}),nc=0;
  clear(box);
  if(synDe()){
    var lus=COURS_LU[SYN_K],bs=bigBtn(tx("cours.synthese"),tx("cours.syn_sous",{n:coursMin(SYN)})+(typeof lus==="number"?tx("cours.ouverte",{date:fmtDay(dayOf(lus))}):""),false,function(){openFiche(SYN_K,"cours");});
    bs.id="b-synthese";bs.classList.add("syn");box.appendChild(bs);
  }
  L.forEach(function(t){
    var lu=COURS_LU[t.k];
    var b=bigBtn(t.n,tx("cours.min_lecture",{n:coursMin(COURS[t.k])})+(typeof lu==="number"?tx("cours.ouverte",{date:fmtDay(dayOf(lu))}):""),false,function(){openFiche(t.k,"cours");});
    b.setAttribute("data-th",t.k);box.appendChild(b);
    if(certifiee(t.k)){nc++;b.classList.add("cert");b.querySelector(".t").appendChild(certIcone());}
  });
  $("cours-revue").hidden=!nc;clear($("cours-revue"));
  if(nc){$("cours-revue").appendChild(certIcone());$("cours-revue").appendChild(document.createTextNode(nb(" "+t("cours.legende_certif"))));}
  $("cours-manque").hidden=!manque.length;
  $("cours-manque").textContent=manque.length?nb(t("cours.pas_de_fiche",{liste:manque.map(function(x){return x.n;}).join(", ")})):"";
}
/* Une fiche. pre : d'où elle est ouverte (« cours » : la liste ; « home » : la page de la matière), pour le retour */
function openFiche(th,pre){
  if(!ficheDe(th))return;
  FI=th;NAV_PRE.fiche=pre||"cours";
  if(pre==="chap"&&th!==SYN_K)MAI_SEL={k:MAT.k,th:th};  /* v13.3 : « Fiche suivante » fait suivre le chapitre */
  if(pre!=="recherche"){COURS_LU[th]=Date.now();save(KCOURS,COURS_LU);}  /* v17.1 : consulter un passage depuis la recherche n'écrit rien (12s) */
  renderFiche();show("fiche");
}
function renderFiche(){
  var th=FI,syn=(th===SYN_K),c=ficheDe(th),L=coursListe(),k=L.map(function(t){return t.k;}).indexOf(th),nx=L[k+1]||null;  /* synthèse : k = −1, la suivante est la première fiche */
  $("fi-eyebrow").textContent=nb(t("cours.eyebrow",{titre:MAT.titre}));
  $("fi-titre").textContent=nb(syn?t("cours.synthese"):themeName(th));
  $("fi-duree").textContent=nb(t("cours.min_lecture",{n:coursMin(c)})+" · "+(syn?t("cours.tout_prog"):t("cours.fiche_n",{k:k+1,n:L.length})));
  renderRevue(th);
  /* v16.5 : les exemples d'une fiche se distinguent (fond et repère) et se masquent d'un geste, pour relire la règle seule */
  var nEx=c.sections.reduce(function(n,x){var m=String(x.md).match(/^:::\s*exemple\b/gm);return n+(m?m.length:0)+coursNbExPhrase(x.md);},0);
  $("fi-ex-w").hidden=!nEx;ficheExemples();
  /* v13.1 : introduction, plan cliquable, parties numérotées, puis la section clé. Ancien format : « L'essentiel » en tête ;
     nouveau : « À retenir » à la fin. La question d'avant (v7.4) devient « Teste-toi », repliée en fin de fiche. */
  var neuf=!!c.intro,cle=ficheCle(c),parts=neuf?c.sections.slice(0,-1):c.sections.slice(1);
  $("fi-intro").hidden=!neuf;$("fi-intro").textContent=neuf?nb(c.intro):"";
  var ess=$("fi-ess"),ret=$("fi-ret");clear(ess);clear(ret);
  ess.hidden=neuf;ret.hidden=!neuf;
  (neuf?ret:ess).appendChild(el("h2",null,nb(i18nTitre(cle.t))));coursMd(cle.md,neuf?ret:ess);
  var corps=$("fi-corps");clear(corps);
  parts.forEach(function(s,k){
    var h=el("h2","cours-h2");h.id="fi-p"+(k+1);
    h.appendChild(el("span","cours-n",String(k+1)));h.appendChild(document.createTextNode(nb(ficheTitre(s.t))));
    corps.appendChild(h);coursMd(s.md,corps);
  });
  renderPlan(parts,neuf?i18nTitre(cle.t):null);
  var av=$("fi-avant");av.hidden=!c.av;av.open=false;clear(av);
  if(c.av){
    var sm=el("summary");sm.appendChild(el("span","es-l",i18nTitre("Teste-toi")));sm.appendChild(coursInline(el("span","es-q"),c.av));av.appendChild(sm);
    av.appendChild(el("p","src",nb(t("cours.teste_expl"))));
  }
  $("fi-src").textContent=nb(t("cours.sources",{src:c.src}));
  var a=$("fi-actions"),qs=pool().filter(function(x){return x.th===th;}),b;
  clear(a);
  if(qs.length){
    b=bigBtn(t("cours.entrainer"),t("cours.entrainer_sous",{q:tn("cours.nb_question",qs.length),p:pct(themeRecall(th))}),true,function(){BACK=NAV_PRE.fiche==="chap"?"chap":"home";start(shuffle(qs),themeName(th));});
    b.id="b-fi-qcm";a.appendChild(b);
  }
  if(nx){b=bigBtn(t(syn?"cours.premiere":"cours.suivante",{nom:nx.n}),t("cours.min_lecture",{n:coursMin(COURS[nx.k])}),false,function(){openFiche(nx.k,NAV_PRE.fiche);});b.id="b-fi-suite";a.appendChild(b);}
  ntFicheAppliquer();  /* v17 : surlignages et notes de la fiche (12u) */
}
var KEXEMPLES="qfcc2.exemples";
function exemplesActifs(){return load(KEXEMPLES,"oui")!=="non";}
function ficheExemples(){
  var on=exemplesActifs(),b=$("b-fi-ex"),k;
  b.textContent=on?t("cours.masquer_ex"):t("cours.afficher_ex");b.setAttribute("aria-pressed",on?"true":"false");
  ["fi-ess","fi-corps","fi-ret"].forEach(function(id){k=$(id);if(on)k.classList.remove("sans-ex");else k.classList.add("sans-ex");});
}
$("b-fi-ex").addEventListener("click",function(){save(KEXEMPLES,exemplesActifs()?"non":"oui");ficheExemples();});
/* Titre d'une partie sans la numérotation qu'une IA aurait ajoutée (« I. », « 2) ») : l'app numérote elle-même */
function ficheTitre(t){return String(t).replace(/^(?:[IVX]+|\d+)[.)]\s+/,"");}
/* Le plan d'une fiche : ses parties, et « À retenir » s'il est à la fin. Toucher une ligne y descend. */
function renderPlan(parts,fin){
  var nav=$("fi-plan");clear(nav);
  nav.hidden=parts.length<2;
  if(nav.hidden)return;
  nav.appendChild(el("p","fi-plan-t",t("cours.au_programme")));
  var ol=el("ol","fi-plan-l");
  parts.forEach(function(s,k){ol.appendChild(planLigne(String(k+1),ficheTitre(s.t),"fi-p"+(k+1)));});
  if(fin)ol.appendChild(planLigne("✓",fin,"fi-ret"));
  nav.appendChild(ol);
  planSuivre(nav);
}
/* Plan qui te suit (ordinateur) : la partie en cours de lecture est repérée dans le plan, que le CSS garde à l'écran. */
var PLAN_ECOUTE=false;
function planSuivre(nav){
  if(PLAN_ECOUTE)return;PLAN_ECOUTE=true;
  var att=false;
  function maj(){
    att=false;
    if(nav.hidden||!nav.offsetParent)return;
    var bs=nav.getElementsByClassName("fi-plan-b"),cur=-1,k,x;
    for(k=0;k<bs.length;k++){
      x=$(bs[k].getAttribute("data-cible"));
      if(x&&x.getBoundingClientRect().top<=120)cur=k;
    }
    for(k=0;k<bs.length;k++){if(k===cur)bs[k].setAttribute("aria-current","true");else bs[k].removeAttribute("aria-current");}
  }
  window.addEventListener("scroll",function(){if(!att){att=true;window.requestAnimationFrame(maj);}},{passive:true});
}
function planLigne(n,t,cible){
  var li=el("li"),b=el("button","fi-plan-b");b.type="button";
  b.setAttribute("data-cible",cible);b.appendChild(el("span","fi-plan-n",n));b.appendChild(el("span",null,nb(t)));
  b.addEventListener("click",function(){var x=$(cible);if(x){try{x.scrollIntoView({behavior:cosMoinsDeMouvement()?"auto":"smooth",block:"start"});}catch(e){x.scrollIntoView();}}});
  li.appendChild(b);return li;
}
/* Sous la correction d'une question (03, choose) : l'essentiel de son thème, replié */
function coursFb(it){
  var d=$("fb-cours"),c=it?coursDe(it.th):null;
  d.hidden=!c;d.open=false;
  if(!c)return;
  $("fb-cours-t").textContent=nb(t("cours.revoir",{th:themeName(it.th)}));
  var b=$("fb-cours-c");clear(b);coursMd(ficheCle(c).md,b);
}
