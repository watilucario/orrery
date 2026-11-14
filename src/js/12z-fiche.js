/* ---------- La fiche de cours : Papier ou Nuit (v23) ----------
   Demande de l'auteur (11 nov.) : le cours peut être clair ou sombre, au choix, toujours. Le choix (qfcc2.fiche) se fait en haut
   de la fiche et dans Profil › Réglages ; le reste de l'app reste sombre. « Papier » (par défaut) est une feuille claire posée
   dans l'espace, « Nuit » la même fiche en verre sombre. */
var KFICHE="qfcc2.fiche";
function ficheMode(){return load(KFICHE,"papier")==="nuit"?"nuit":"papier";}
function ficheAppliquer(){
  var m=ficheMode(),f=$("fiche");if(f)f.classList.toggle("nuit",m==="nuit");
  [].forEach.call(document.querySelectorAll("#fi-mode .seg-b,#regl-fiche .chip"),function(b){
    var on=b.getAttribute("data-m")===m;b.classList.toggle("sel",on);b.setAttribute("aria-pressed",on?"true":"false");
  });
}
function ficheChoisir(m){save(KFICHE,m);ficheAppliquer();}
(function(){
  [].forEach.call(document.querySelectorAll("#fi-mode .seg-b"),function(b){b.addEventListener("click",function(){ficheChoisir(b.getAttribute("data-m"));});});
  var r=$("regl-fiche");
  if(r){[["papier",tx("zfiche.papier")],["nuit",tx("zfiche.nuit")]].forEach(function(x){var b=el("button","chip",x[1]);b.type="button";b.setAttribute("data-m",x[0]);b.addEventListener("click",function(){ficheChoisir(x[0]);});r.appendChild(b);});}
  ficheAppliquer();
})();
