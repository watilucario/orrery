/* ---------- Langues (i18n) : l'interface et le contenu, au choix de la personne ----------
   Premier fragment : il tourne après le contenu généré (build.py) et avant tout le reste (01 lit RECETTES, 08b lit UNIVERS).
   Ce que build.py a émis : I18N = {fr:{clé:texte}, en:{…}} (src/i18n/<langue>/*.json, mêmes clés dans toutes les langues,
   mêmes {variables}), I18N_LANGS (le français d'abord), CONTENU_LANG = {en:{recettes, univers, revues, calculs, modele,
   exemple}} (les variantes « X.en.md » de univers/, voir build.py « Langues »). Convention complète : src/i18n/README.md.

   Langue : qfcc2.langue (« fr », « en »…), choisie à l'écran de langue du premier lancement (langueDemarrer, appelé par
   13) puis dans Profil › Réglages (renderReglLangue, 12e). Changer de langue recharge la page : tout se redessine dans la
   nouvelle langue. La progression est indexée par identifiant, jamais par texte : elle ne bouge pas.

   Pour le code :
   - t("zone.sujet", {nom:valeur}) : le texte, avec {nom} remplacé. Clé absente : rend la clé et le dit une fois en console.
     tx() est le même appel pour une fonction qui a une variable locale nommée « t » (elle masquerait la fonction).
   - tn("zone.sujet", n, {…}) : pluriel. Clés « zone.sujet.one » et « zone.sujet.other » (la catégorie vient d'Intl.PluralRules
     de la langue ; {n} est toujours donné). Le code doit passer par tn, plus par plural(n,mot) (03), qui reste français.
   - i18nApplique(racine) : traduit les éléments data-i18n (texte), data-i18n-aria, data-i18n-ph, data-i18n-title.
   - fmtLang() : la locale Intl (« fr-FR », « en-GB »), fmtDate(t, options), fmtNombre(v, options).
   - i18nDates() : MOIS et JOURS (définis en 07, fmtDay…) dans la langue ; appelé au démarrage (13).
   - i18nTitre(mot) et i18nEnc(type) : un mot-clé de syntaxe du contenu (« L'essentiel », « À retenir », « Teste-toi » ; encadrés
     definition, formule…) devient son libellé à l'écran. Les fichiers de contenu gardent ces mots-clés en français. */
var KLANGUE="qfcc2.langue";
function langueValide(l){return typeof l==="string"&&I18N.hasOwnProperty(l);}
/* La langue gardée : la clé locale, sinon le réglage du profil ou des réglages (autre appareil, clé effacée) */
function langueStockee(){
  var v=null,p;
  try{v=localStorage.getItem(KLANGUE);if(v!==null){try{v=JSON.parse(v);}catch(e){}}}catch(e){v=null;}
  if(langueValide(v))return v;
  try{p=JSON.parse(localStorage.getItem("qfcc2.profil")||"null");if(p&&p.reglages&&langueValide(p.reglages.langue))return p.reglages.langue;}catch(e){}
  try{p=JSON.parse(localStorage.getItem("qfcc2.reglages")||"null");if(p&&langueValide(p.langue))return p.langue;}catch(e){}
  return null;
}
var LANG_CHOISIE=langueStockee(),LANG=LANG_CHOISIE||"fr";
try{document.documentElement.setAttribute("lang",LANG);}catch(e){}
/* La langue du navigateur parmi celles de l'app (sinon l'anglais) : présélectionnée à l'écran de langue */
function langueNavigateur(){
  var L=[],i,c;
  try{L=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language||""];}catch(e){}
  for(i=0;i<L.length;i++){c=String(L[i]||"").slice(0,2).toLowerCase();if(langueValide(c))return c;}
  return langueValide("en")?"en":"fr";
}

/* ---------- Textes ---------- */
var I18N_AVERTI={},I18N_PL={};
function tl(l,cle,vars){
  var T=I18N[l]||I18N.fr,s=T[cle];
  if(s===undefined&&I18N.fr)s=I18N.fr[cle];  /* repli sur le français avant la clé brute */
  if(s===undefined){
    if(!I18N_AVERTI[cle]){I18N_AVERTI[cle]=1;try{console.warn("i18n : clé absente « "+cle+" » ("+l+")");}catch(e){}}
    return cle;
  }
  if(!vars)return s;
  return s.replace(/\{(\w+)\}/g,function(m,k){return vars.hasOwnProperty(k)&&vars[k]!==null&&vars[k]!==undefined?String(vars[k]):m;});
}
function t(cle,vars){return tl(LANG,cle,vars);}
function tx(cle,vars){return tl(LANG,cle,vars);}
function plurielCat(n){
  try{if(!I18N_PL[LANG])I18N_PL[LANG]=new Intl.PluralRules(fmtLang());return I18N_PL[LANG].select(n);}catch(e){return n===1?"one":"other";}
}
function tn(cle,n,vars){
  var v={n:n},k,c=plurielCat(n);
  if(vars){for(k in vars){if(vars.hasOwnProperty(k))v[k]=vars[k];}}
  if(I18N[LANG][cle+"."+c]===undefined)c="other";
  return tl(LANG,cle+"."+c,v);
}
function tnx(cle,n,vars){return tn(cle,n,vars);}

/* ---------- Dates et nombres ---------- */
function fmtLang(){return tl(LANG,"langue.locale");}
function fmtDate(ms,opt){try{return new Date(ms).toLocaleDateString(fmtLang(),opt||{day:"numeric",month:"short"});}catch(e){return new Date(ms).toLocaleDateString();}}
function fmtNombre(v,opt){try{return Number(v).toLocaleString(fmtLang(),opt);}catch(e){return String(v);}}
/* MOIS et JOURS (07, var) : en français, les tableaux d'origine ; ailleurs, ceux d'Intl (courts, calés sur le jour UTC comme fmtDay) */
function i18nDates(){
  if(LANG==="fr")return;
  try{
    var f=new Intl.DateTimeFormat(fmtLang(),{month:"short",timeZone:"UTC"}),g=new Intl.DateTimeFormat(fmtLang(),{weekday:"short",timeZone:"UTC"}),m=[],j=[],i;
    for(i=0;i<12;i++)m.push(f.format(new Date(Date.UTC(2024,i,15))));
    for(i=0;i<7;i++)j.push(g.format(new Date(Date.UTC(2024,0,7+i))));  /* le 7 janvier 2024 est un dimanche : JOURS[0] */
    MOIS=m;JOURS=j;
  }catch(e){}
}

/* ---------- Mots-clés de syntaxe du contenu, montrés à l'écran ---------- */
var I18N_TITRES={"L'essentiel":"cours.titre_essentiel","L’essentiel":"cours.titre_essentiel","À retenir":"cours.titre_a_retenir","A retenir":"cours.titre_a_retenir","Teste-toi":"cours.teste_toi"};
function i18nTitre(mot){return I18N_TITRES.hasOwnProperty(mot)?t(I18N_TITRES[mot]):mot;}
function i18nEnc(type){var k="cours.enc_"+type;return I18N[LANG][k]!==undefined?t(k):type;}

/* ---------- Le HTML : data-i18n (texte), data-i18n-aria, data-i18n-ph, data-i18n-title ---------- */
function i18nApplique(racine){
  var r=racine||document,n,i,e,sel=[["[data-i18n]","data-i18n",null],["[data-i18n-aria]","data-i18n-aria","aria-label"],["[data-i18n-ph]","data-i18n-ph","placeholder"],["[data-i18n-title]","data-i18n-title","title"]];
  for(n=0;n<sel.length;n++){
    var L=r.querySelectorAll(sel[n][0]);
    for(i=0;i<L.length;i++){
      e=L[i];
      if(sel[n][2])e.setAttribute(sel[n][2],t(e.getAttribute(sel[n][1])));else e.textContent=t(e.getAttribute(sel[n][1]));
    }
  }
  L=r.querySelectorAll('[lang="fr"]');
  for(i=0;i<L.length;i++)L[i].setAttribute("lang",LANG);
}

/* ---------- Choisir la langue : enregistre, puis recharge (tout se redessine dans la nouvelle langue) ---------- */
function langueChoisir(l){
  if(!langueValide(l))return;
  try{localStorage.setItem(KLANGUE,JSON.stringify(l));}catch(e){}
  try{if(PROF&&typeof reglEnregistrer==="function")reglEnregistrer({langue:l});}catch(e){}  /* le profil la garde aussi (suit le compte) */
  try{document.documentElement.setAttribute("lang",l);}catch(e){}
  try{window.location.reload();}catch(e){}
}

/* ---------- La consigne de pack dans chaque langue (demande de l'auteur, 13 nov.) ----------
   « Importer un cours » propose la consigne en français ET en anglais, quelle que soit la langue de l'app : le cours que l'IA
   écrit sera dans la langue de la consigne choisie, et il le restera (un cours importé n'est pas traduit). */
var MODELE_PACKS=(function(){
  var o={fr:MODELE_PACK},l;
  if(typeof CONTENU_LANG==="object"&&CONTENU_LANG){for(l in CONTENU_LANG){if(CONTENU_LANG.hasOwnProperty(l)&&CONTENU_LANG[l]&&CONTENU_LANG[l].modele)o[l]=CONTENU_LANG[l].modele;}}
  return o;
})();
/* Langues dont la consigne existe, celle de l'app d'abord */
function modeleLangues(){var L=[LANG],l;for(l in MODELE_PACKS){if(MODELE_PACKS.hasOwnProperty(l)&&L.indexOf(l)<0)L.push(l);}return L.filter(function(x){return !!MODELE_PACKS[x];});}
function modelePack(l){return MODELE_PACKS[l]||MODELE_PACK;}

/* ---------- Le contenu dans la langue : les variantes de univers/ remplacent les originaux français ---------- */
(function(){
  var CL=(typeof CONTENU_LANG==="object"&&CONTENU_LANG&&CONTENU_LANG[LANG])||null,i,j,k;
  if(LANG==="fr"||!CL)return;
  for(i=0;i<(CL.recettes||[]).length;i++){
    for(j=0;j<RECETTES.length;j++){if(RECETTES[j].id===CL.recettes[i].id){RECETTES[j]=CL.recettes[i];break;}}
  }
  for(i=0;i<(CL.univers||[]).length;i++){
    for(j=0;j<UNIVERS.length;j++){
      if(UNIVERS[j].id===CL.univers[i].id){for(k in CL.univers[i]){if(CL.univers[i].hasOwnProperty(k)&&k!=="id")UNIVERS[j][k]=CL.univers[i][k];}break;}
    }
  }
  for(k in CL.revues){if(CL.revues.hasOwnProperty(k))REVUES[k]=CL.revues[k];}
  for(k in CL.calculs){if(CL.calculs.hasOwnProperty(k))CALCULS[k]=CL.calculs[k];}
  if(CL.modele)MODELE_PACK=CL.modele;
  if(CL.exemple)PACK_EXEMPLE=CL.exemple;
})();

/* ---------- L'écran de langue du premier lancement (avant le profil et la visite) ----------
   Fond étoilé de l'app, deux pastilles « Français · English », la langue du navigateur présélectionnée. Les textes de
   l'écran changent avec la pastille touchée. « Continuer » enregistre et recharge : le reste du démarrage (13) a lieu ensuite. */
var LG={sel:null};
function langueEcran(){
  var l=LG.sel,box=$("lg-choix"),i;
  if(!box.children.length){
    I18N_LANGS.forEach(function(x){
      var b=el("button","chip",tl(x,"langue.nom"));b.type="button";b.id="lg-"+x;b.setAttribute("lang",x);
      b.addEventListener("click",function(){LG.sel=x;langueEcran();});
      box.appendChild(b);
    });
  }
  for(i=0;i<box.children.length;i++){
    var c=box.children[i],on=c.id==="lg-"+l;
    if(c.tagName!=="BUTTON")continue;
    c.classList.toggle("sel",on);c.setAttribute("aria-pressed",on?"true":"false");
  }
  $("lg-eyebrow").textContent=tl(l,"langue.eyebrow");
  $("lg-titre").textContent=tl(l,"langue.titre");
  $("lg-sous").textContent=tl(l,"langue.sous");
  $("b-lg-ok").textContent=tl(l,"langue.continuer");
  box.setAttribute("aria-label",tl(l,"langue.aria"));
}
$("b-lg-ok").addEventListener("click",function(){langueChoisir(LG.sel||"fr");});
function langueDemarrer(){LG.sel=langueNavigateur();langueEcran();show("langue");}

i18nApplique(document);
