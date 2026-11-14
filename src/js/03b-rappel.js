/* ---------- Rappel libre (v7.1) : une question déjà sue revient sans les choix ----------
   Demande de l'auteur (17 oct.) : retrouver une réponse ancre mieux que la reconnaître parmi quatre. Avec une correction,
   un test où l'on produit la réponse profite plus à la mémoire qu'un QCM (Kang, McDermott et Roediger, 2007).
   Dans une série de révision espacée (séance du jour, révision d'avance), une question dont la dernière réponse était
   juste avec « sûr » (note 3) revient sans les choix, si elle s'y prête (rappelEligible). Déroulé : réponse tapée (ou
   « Je ne sais plus »), confiance comme pour un QCM, réponse attendue, puis l'élève juge si sa réponse disait la même
   chose. La note reste celle d'un QCM (srsGrade : faux 1, juste + au hasard 1, j'hésite 2, sûr 3). Une question ratée
   ainsi retombe à la note 1 : elle revient avec ses choix. Réglage : qfcc2.rappel (« non » : toujours avec les choix),
   Profil › Réglages de l'app. Contenu : « Rappel : oui | non » force ou interdit (univers/README.md). */
var KRAPPEL="qfcc2.rappel";
/* Énoncés qui ne se comprennent qu'avec leurs choix, et options « aucune / toutes » */
var RAPPEL_ENONCE=/(laquelle|lesquelles|lequel|lesquels|quelle affirmation|quelles affirmations|quelle proposition|quelles propositions|parmi|ci-dessous|ci-dessus|vrai ou faux|est fausse|est exacte|sont exactes|sont fausses|inexact|incorrect|quel énoncé|which one|which ones|which of|which step|is wrong|are wrong|which statement|which statements|which proposition|which propositions|which is (?:true|false|correct|incorrect|wrong)|among|of the following|below|above|true or false|true\/false|is false|is true|is incorrect|is correct|are correct|are false|are true|are incorrect|inaccurate|incorrect)/i;
var RAPPEL_OPTION=/^(aucune|aucun|toutes|tous|les deux|none|all of the above|all of these|all of the|both|neither|every one)\b/i;
function rappelActif(){return load(KRAPPEL,"oui")!=="non";}
function rappelEligible(it){
  if(it.t)return it.t==="trous";  /* v13.4 : associer et ordonner ont leur propre écran (03g) */
  if(it.rl===true)return true;
  if(it.rl===false||it.fixed)return false;
  if(RAPPEL_ENONCE.test(it.q))return false;
  return !it.o.some(function(o){return RAPPEL_OPTION.test(o);});
}
function rappelPour(it){
  if(it.t==="trous")return true;  /* v13.4 : un texte à trous se complète toujours de mémoire */
  var x=S&&(S.srs||S.exige)&&SRS&&SRS.items?SRS.items[it.id]:null;  /* v16 : aussi dans les séries du carnet d'erreurs */
  return !!(x&&x.g===3&&rappelActif()&&rappelEligible(it));
}
/* Appelé par renderQ (03) : vrai si la question se pose sans les choix */
function rappelRendre(it){
  var on=rappelPour(it),inp=$("rl-in");
  S.rl=on?{phase:"saisie",txt:"",conf:null}:null;
  $("rl").hidden=!on;
  $("q-kbd").textContent=on?t("rappel.clavier_rl"):t("rappel.clavier_qcm");
  if(!on)return false;
  $("rl-t").textContent=it.t==="trous"?t("rappel.trous"):t("rappel.sans_choix");
  inp.value="";inp.disabled=false;
  $("rl-act").hidden=false;$("rl-rev").hidden=true;$("rl-juge").hidden=false;
  return true;
}
function rappelValider(){
  if(!S||!S.rl||S.rl.phase!=="saisie"||S.locked)return;
  var t=trim($("rl-in").value),c=$("conf");
  if(!t){rappelNsp();return;}
  S.rl.txt=t;S.rl.phase="conf";
  try{$("rl-in").blur();}catch(e){}  /* le focus quitte le champ tout de suite : la touche H, J, S (ou 1-3) choisit la confiance */
  $("rl-in").disabled=true;$("rl-act").hidden=true;
  $("rl").insertBefore(c,$("rl-rev"));c.hidden=false;
  try{c.scrollIntoView({block:"nearest"});}catch(e){}
}
function rappelNsp(){
  if(!S||!S.rl||S.rl.phase!=="saisie"||S.locked)return;
  S.rl.txt="";S.rl.phase="fini";
  $("rl-in").disabled=true;$("rl-act").hidden=true;
  rappelMontrer(false);
  choose(-1,null);
}
function rappelConf(conf){
  if(!S||!S.rl||S.rl.phase!=="conf")return;
  S.rl.conf=conf;S.rl.phase="juge";parkConf();
  rappelMontrer(true);
}
function rappelMontrer(juger){
  var it=S.list[S.i];
  $("rl-att").textContent=nb(it.o[it.c]);
  $("rl-ind").textContent=juger?rappelIndice(it.o[it.c],S.rl.txt):"";
  $("rl-juge").hidden=!juger;$("rl-rev").hidden=false;
  try{$("rl-rev").scrollIntoView({block:"nearest"});}catch(e){}
}
/* Les nombres d'un texte (« 63 000 € », « 12,8 % ») : une aide pour juger, jamais un verdict à la place de l'élève */
function rappelNombres(s){
  var m=String(s).replace(/(\d)[ \u00a0\u202f](?=\d{3}(?!\d))/g,"$1").match(/[−-]?\d+(?:[,.]\d+)?/g)||[];
  return m.map(function(x){return parseFloat(x.replace("−","-").replace(",","."));});
}
function rappelIndice(att,txt){
  var a=rappelNombres(att),t=rappelNombres(txt);
  if(!a.length)return "";
  return a.every(function(x){return t.some(function(y){return Math.abs(x-y)<1e-9;});})?tx("rappel.nombres_ok")
    :tx("rappel.nombres_ko");
}
function rappelJuger(ok){
  if(!S||!S.rl||S.rl.phase!=="juge")return;
  S.rl.phase="fini";$("rl-juge").hidden=true;
  choose(ok?S.list[S.i].c:-1,S.rl.conf);
}
/* Boutons de confiance : sous l'option choisie (QCM) ou sous la réponse tapée (rappel libre) */
function confChoisi(c){if(!S)return;if(S.rl){rappelConf(c);return;}if(S.sel!==null)choose(S.sel,c);}
$("b-rl-ok").addEventListener("click",rappelValider);
$("b-rl-nsp").addEventListener("click",rappelNsp);
$("b-rl-juste").addEventListener("click",function(){rappelJuger(true);});
$("b-rl-faux").addEventListener("click",function(){rappelJuger(false);});
$("rl-in").addEventListener("keydown",function(ev){if(ev.key==="Enter"){ev.preventDefault();rappelValider();}});

/* ---------- Choix cachés (v16) : réfléchir d'abord, voir les choix ensuite ----------
   Demande de l'auteur (1er nov.) : se tester comme à l'examen, la réponse en tête avant de la reconnaître parmi quatre.
   La question s'affiche seule avec « Voir les choix » (Entrée ou Espace), collé en bas de l'écran comme « Question
   suivante ». La réponse se donne ensuite comme d'habitude : la note FSRS ne change pas. Réglage global : qfcc2.choix
   (« cache » ou « voir »), suivi par PROF.reglages.choix (Profil › Réglages de l'app, 12e) .
   Les questions en rappel libre, à associer ou à ordonner n'ont pas de choix à cacher.
   v17.3 (demande de l'auteur, 8 nov.) : l'interrupteur du quiz (#b-choix) montre l'état de la question en cours : ◉ = ses choix sont
   cachés, ○ = ils sont visibles. « Voir les choix » ne coupe pas le mode (S.cache : la question suivante repart cachée) mais éteint
   l'interrupteur : un seul clic le rallume et recache la question (avant : deux clics). Une fois la question répondue, il montre le
   mode pour les suivantes. Un clic sur l'interrupteur est gardé comme réglage (qfcc2.choix) : celui qui travaille choix cachés les
   retrouve cachés d'une série à l'autre, aux QCM comme aux cas guidés (ils passent par le même renderQ). */
var KCHOIX="qfcc2.choix";
function choixActif(){var r=reglages();return (r.choix||load(KCHOIX,"voir"))==="cache";}
function choixEnregistrer(v){save(KCHOIX,v);reglEnregistrer({choix:v});}
/* Appelé par renderQ (03) une fois les options posées */
function choixRendre(it,rl){
  var on=!!(S.cache&&!rl&&S.btns.length);
  S.vu=!on;
  $("opts").hidden=on;$("choix-bar").hidden=!on;
  if(on)$("q-kbd").textContent=t("rappel.clavier_cache");
  choixInter();
}
function choixVoir(){
  if(!S||S.vu||S.locked)return;
  S.vu=true;$("opts").hidden=false;$("choix-bar").hidden=true;
  $("q-kbd").textContent=t("rappel.clavier_qcm");
  try{$("opts").scrollIntoView({block:"nearest"});}catch(e){}
  choixInter();
}
/* Interrupteur du quiz : ◉ = choix cachés pour la question en cours (ou, si on y a répondu ou si elle n'a pas de choix à cacher, pour les suivantes) */
function choixModifiable(){return !!(S&&!S.locked&&S.sel===null&&S.btns&&S.btns.length&&!S.rl);}
function choixInter(){
  var b=$("b-choix"),on=!!S&&(choixModifiable()?!S.vu:!!S.cache);
  b.setAttribute("aria-pressed",on?"true":"false");b.textContent=(on?"◉":"○")+" "+t("rappel.reflechir");
}
function choixBascule(){
  if(!S)return;
  var mod=choixModifiable(),cacher=mod?S.vu:!S.cache;   /* choix visibles → on les cache ; cachés → on les montre */
  S.cache=cacher;choixEnregistrer(cacher?"cache":"voir");
  if(mod){if(cacher){choixRendre(S.list[S.i],false);}else{choixVoir();}}
  choixInter();
}
$("b-voir-choix").addEventListener("click",choixVoir);
$("b-choix").addEventListener("click",choixBascule);
