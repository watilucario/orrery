/* ---------- Profil et réglages (v6) : toi en lecture, « Modifier » ; en dessous, les réglages de toute l'app ----------
   Le Profil ne garde que ce qui te concerne (prénom, univers) et ce qui vaut pour toute l'app (apparence, données,
   guide). Avant la v6, il portait aussi les examens et l'agenda, et un écran Réglages à part : les examens sont dans
   Agenda › Examens (12), la liaison et les couleurs de l'agenda dans Agenda › ⚙ (12c, ci-dessous).
   Apparence : automatique (suit l'appareil), clair ou sombre. <html data-mode="clair|sombre"> force les jetons de couleur
   (styles.css) ; sans attribut, le thème suit l'appareil. Choix gardé dans le profil (PROF.reglages = {theme, maj}, suit le
   compte) et dans ce navigateur (qfcc2.reglages), appliqué dès le chargement.
   Agenda : couleur par cours ou une couleur par agenda (PROF.agenda.modes), redistribuer les couleurs. */
var KREGL="qfcc2.reglages",REGL_THEMES=[["auto",t("rgl.auto")],["clair",t("rgl.clair")],["sombre",t("rgl.sombre")]];
function themeAppliquer(t){
  var r=document.documentElement;
  r.setAttribute("data-mode","sombre");  /* v22 : l'app est toujours sombre (demande de l'auteur) ; seule la fiche de cours est une feuille claire */
}
function reglages(){var l=load(KREGL,null),p=PROF&&PROF.reglages;if(p&&(!l||(p.maj||0)>(l.maj||0)))return p;return l||{theme:"auto",maj:0};}
function reglEnregistrer(chg){
  var o={},a=reglages(),k;
  for(k in a){if(a.hasOwnProperty(k))o[k]=a[k];}
  for(k in chg){if(chg.hasOwnProperty(k))o[k]=chg[k];}
  o.maj=Date.now();save(KREGL,o);
  if(PROF){PROF.reglages=o;profilSave();}
  themeAppliquer(o.theme);iphTheme();
}
/* Profil arrivé du compte : son réglage gagne s'il est plus récent */
function reglProfil(){var r=reglages();save(KREGL,r);if(r.choix)save(KCHOIX,r.choix);themeAppliquer(r.theme);iphTheme();if(!$("prof").hidden)renderProf();univSuivreCompte();}
themeAppliquer((load(KREGL,null)||{}).theme);

var PROF_EDIT=false;
function openProf(){PROF_EDIT=false;if(!PROF)profilSave("");$("prof-ok").hidden=true;renderProf();show("prof");}
function renderProf(){
  var p=(PROF&&PROF.prenom)||"";
  $("prof-av").textContent=p?p.charAt(0).toUpperCase():"?";
  $("prof-nom").textContent=p||t("rgl.sans_prenom");
  $("prof-prog").textContent=UNIVERS.length>1?t("rgl.tes_univers",{liste:univListe(UNIVERS.map(function(u){return u.nom;}))}):univ().nom;
  $("prof-carte").hidden=PROF_EDIT;$("prof-name-f").hidden=!PROF_EDIT;
  sigProfMaj();  /* v16 : Mes signalements (12o) */
  ntProfMaj();  /* v17 : Notes et surlignages (12u) */
  if(PROF_EDIT)$("prof-prenom").value=p;
  renderRegl();profAutonomieMaj();
}
$("b-prof-modif").addEventListener("click",function(){PROF_EDIT=true;$("prof-ok").hidden=true;renderProf();try{$("prof-prenom").focus();}catch(e){}});
$("b-prof-annuler").addEventListener("click",function(){PROF_EDIT=false;renderProf();});
$("prof-name-f").addEventListener("submit",function(ev){
  ev.preventDefault();profilSave($("prof-prenom").value);PROF_EDIT=false;renderProf();
  $("prof-ok").hidden=false;setTimeout(function(){$("prof-ok").hidden=true;},2500);
});
/* i18n : la langue de l'app et de son contenu (00). Choisir recharge la page. */
function renderReglLangue(){
  var box=$("regl-langue");if(!box)return;clear(box);
  I18N_LANGS.forEach(function(l){
    var b=el("button","chip"+(l===LANG?" sel":""),tl(l,"langue.nom"));b.type="button";b.id="regl-langue-"+l;b.setAttribute("lang",l);
    b.setAttribute("aria-pressed",l===LANG?"true":"false");
    b.addEventListener("click",function(){if(l!==LANG)langueChoisir(l);});
    box.appendChild(b);
  });
}
function renderRegl(){
  var r=reglages(),th=$("regl-theme");clear(th);
  renderReglLangue();
  REGL_THEMES.forEach(function(x){
    var b=el("button","chip"+(r.theme===x[0]||(!r.theme&&x[0]==="auto")?" sel":""),x[1]);b.type="button";b.id="regl-"+x[0];
    b.setAttribute("aria-pressed",b.className.indexOf("sel")>=0?"true":"false");
    b.addEventListener("click",function(){reglEnregistrer({theme:x[0]});renderRegl();});
    th.appendChild(b);
  });
  var rp=$("regl-rappel"),rv=load(KRAPPEL,"oui")==="non"?"non":"oui";clear(rp);
  [["oui",t("rgl.sans_choix")],["non",t("rgl.avec_choix")]].forEach(function(x){  /* rappel libre (v7.1, 03b) */
    var b=el("button","chip"+(rv===x[0]?" sel":""),x[1]);b.type="button";b.id="regl-rappel-"+x[0];
    b.setAttribute("aria-pressed",rv===x[0]?"true":"false");
    b.addEventListener("click",function(){save(KRAPPEL,x[0]);renderRegl();});
    rp.appendChild(b);
  });
  var ch=$("regl-choix"),cv=choixActif()?"cache":"voir";clear(ch);
  [["voir",t("rgl.visibles")],["cache",t("rgl.caches")]].forEach(function(x){  /* choix cachés (v16, 03b) */
    var b=el("button","chip"+(cv===x[0]?" sel":""),x[1]);b.type="button";b.id="regl-choix-"+x[0];
    b.setAttribute("aria-pressed",cv===x[0]?"true":"false");
    b.addEventListener("click",function(){choixEnregistrer(x[0]);renderRegl();});
    ch.appendChild(b);
  });
  var d=$("regl-donnees");clear(d);
  d.appendChild(el("p","plab",t("rgl.tes_donnees")));
  if(IPH.ok){  /* app iPhone (12k) : pas de compte Claude, pas d'aide de Claude */
    d.appendChild(el("p","src",nb(t("rgl.iph_1"))));
    d.appendChild(el("p","src",nb(t("rgl.iph_2"))));
  }else{
  d.appendChild(el("p","src",t(PROF_COMPTE?"rgl.compte":"rgl.navigateur")));
  d.appendChild(el("p","src",nb(t("rgl.forfait"))));
  }
  iphReglRendre();  /* rappels de l'app iPhone (12k) */
}
/* Agenda › ⚙ : une couleur par cours ou une par agenda */
function renderReglAgenda(){
  var box=$("ag-couleurs");if(!box)return;clear(box);
  if(!AG.mcp||!agLie()){box.appendChild(el("p","src",t("rgl.ag_apres")));return;}
  box.appendChild(el("p","src",t("rgl.ag_aide")));
  var l=el("div","regl-cals");
  PROF.agenda.cals.forEach(function(c,i){
    var row=el("div","regl-cal"),mode=semMode(c.id),nom=el("div","regl-nom");
    nom.appendChild(el("span",null,c.nom));
    if(mode==="agenda"){var t=semTeinte({cal:c.id,titre:""});if(t>=0)nom.insertBefore(el("i","sem-pastille "+semClasse(t)),nom.firstChild);}  /* couleur donnée à la première lecture de l'agenda */
    row.appendChild(nom);
    var ch=el("div","chips regl-modes");
    [["cours",tx("rgl.par_cours")],["agenda",tx("rgl.une_couleur")]].forEach(function(m){
      var b=el("button","chip"+(mode===m[0]?" sel":""),m[1]);b.type="button";b.id="regl-mode-"+i+"-"+m[0];
      b.setAttribute("aria-pressed",mode===m[0]?"true":"false");
      b.addEventListener("click",function(){
        var modes={},k,src=PROF.agenda.modes||{};for(k in src){if(src.hasOwnProperty(k))modes[k]=src[k];}
        modes[c.id]=m[0];PROF.agenda=semAgendaCopie({modes:modes});profilSave();
        semCouleursCache();renderReglAgenda();if(!$("ag-semaine").hidden)semRendre();
      });
      ch.appendChild(b);
    });
    row.appendChild(ch);l.appendChild(row);
  });
  box.appendChild(l);
  var bt=el("div","ag-btns"),re=el("button","link",t("rgl.redistribuer"));re.type="button";re.id="b-regl-couleurs";
  re.addEventListener("click",function(){PROF.agenda=semAgendaCopie({couleurs:{}});profilSave();semCouleursCache();renderReglAgenda();if(!$("ag-semaine").hidden)semRendre();});
  bt.appendChild(re);box.appendChild(bt);
}
/* Couleurs à (re)donner tout de suite pour les semaines déjà lues, la semaine affichée d'abord */
function semCouleursCache(){
  var l=[],k;
  if(SEM.lundi!==null&&SEM.cache[SEM.lundi])l.push(SEM.lundi);
  for(k in SEM.cache){if(SEM.cache.hasOwnProperty(k)&&+k!==SEM.lundi)l.push(+k);}
  l.forEach(function(w){var c=SEM.cache[w];if(c&&c.evs)try{semCouleurs(c.evs);}catch(x){}});
}
