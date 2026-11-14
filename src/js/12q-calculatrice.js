/* ===== Calculatrice (v16.4) : Alt+C l'ouvre et la ferme partout, sans quitter l'exercice. ES5, sans eval. =====
   v17.2 : pavé de touches (le clavier numérique d'un téléphone n'a ni + − × ÷ ni parenthèses : on ne pouvait pas saisir un calcul) ;
   sur écran tactile le clavier du système reste fermé (inputmode none). */
/* Lit une expression avec + − × ÷ ( ) % et la virgule décimale. Renvoie un nombre, ou null si elle n'est pas valide. */
var CALC_DEC=(fmtNombre(1.5,{minimumFractionDigits:1}).replace(/[0-9]/g,"").charAt(0))||",";   /* séparateur décimal de la langue : « , » en français, « . » en anglais */
function calcEval(src){
  var s=String(src).replace(/[\s  ]/g,"").replace(/×|\*/g,"*").replace(/÷|:/g,"/").replace(/[−–]/g,"-").replace(/,/g,CALC_DEC==="."?"":".");   /* français : la virgule est décimale ; anglais : c'est le séparateur de milliers (ignoré) */
  if(!s||/[^0-9+\-*\/().%]/.test(s))return null;
  var i=0;
  function num(){
    var m=/^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
    if(!m)return NaN;i+=m[0].length;var v=parseFloat(m[0]);
    while(s.charAt(i)==="%"){v=v/100;i++;}
    return v;
  }
  function atom(){
    var c=s.charAt(i),v;
    if(c==="-"){i++;return -atom();}
    if(c==="+"){i++;return atom();}
    if(c==="("){i++;v=expr();if(s.charAt(i)!==")")return NaN;i++;while(s.charAt(i)==="%"){v=v/100;i++;}return v;}
    return num();
  }
  function term(){
    var v=atom(),c;
    while((c=s.charAt(i))==="*"||c==="/"){i++;var w=atom();v=c==="*"?v*w:v/w;}
    return v;
  }
  function expr(){
    var v=term(),c;
    while((c=s.charAt(i))==="+"||c==="-"){i++;var w=term();v=c==="+"?v+w:v-w;}
    return v;
  }
  var r=expr();
  if(i!==s.length||!isFinite(r))return null;
  return r;
}
function calcFormat(v){
  var t=fmtNombre(Math.round(v*1e6)/1e6,{maximumFractionDigits:6});
  return t;
}
var CALC={hist:[],fin:false};
/* [texte, code, genre (n chiffre, o opération, f fonction, e égal), nom lu par un lecteur d'écran] */
var CALC_TOUCHES=[
  ["C","C","f",tx("zcalc.effacer_tout")],["( )","par","f",tx("zcalc.parenthese")],["%","%","o",tx("zcalc.pour_cent")],["÷","÷","o",tx("zcalc.divise")],
  ["7","7","n"],["8","8","n"],["9","9","n"],["×","×","o",tx("zcalc.fois")],
  ["4","4","n"],["5","5","n"],["6","6","n"],["−","−","o",tx("zcalc.moins")],
  ["1","1","n"],["2","2","n"],["3","3","n"],["+","+","o",tx("zcalc.plus")],
  ["0","0","n"],[CALC_DEC,",","n",tx("zcalc.virgule")],["⌫","back","f",tx("zcalc.effacer_signe")],["=","eq","e",tx("zcalc.egal")]
];
function calcPave(){
  var p=$("calc-pad");if(p.childNodes.length)return;
  CALC_TOUCHES.forEach(function(q){
    var b=el("button","ck ck-"+q[2],q[0]);b.type="button";b.setAttribute("data-k",q[1]);
    if(q[3])b.setAttribute("aria-label",q[3]);
    p.appendChild(b);
  });
}
function calcOuvert(){return !$("calc").hidden;}
function calcTactile(){return !!(window.matchMedia&&window.matchMedia("(pointer:coarse)").matches);}
function calcOuvrir(){
  var p=$("calc"),f=$("calc-in"),tact=calcTactile();
  calcPave();
  f.setAttribute("inputmode",tact?"none":"decimal");   /* tactile : le pavé de l'écran remplace le clavier du système */
  $("calc-raccourci").hidden=tact;
  $("calc-aide").textContent=tact?tx("zcalc.aide_tactile"):tx("zcalc.aide_clavier");
  p.hidden=false;$("b-calc").setAttribute("aria-expanded","true");
  try{f.focus({preventScroll:true});if(tact){f.setSelectionRange(f.value.length,f.value.length);}else{f.select();}}catch(e){}
}
function calcFermer(){
  $("calc").hidden=true;$("b-calc").setAttribute("aria-expanded","false");
}
function calcBascule(){if(calcOuvert())calcFermer();else calcOuvrir();}
/* v18.2 (demande de l'auteur : « plus que dans les cours et dans les calculs ») : le bouton ne s'affiche que là où l'on calcule ou lit */
var CALC_ECRANS=["cours","fiche","quiz","ex","sim","drill","cons"];
function calcEcran(id){
  var b=$("b-calc");if(!b)return;
  var ok=CALC_ECRANS.indexOf(id)>=0,ancre=id==="quiz"?$("b-mark"):id==="ex"?$("b-exmark"):null;
  b.hidden=!ok;if(!ok)calcFermer();
  /* v22 (demande de l'auteur) : dans le quiz et les exercices, la calculatrice est dans la barre de la question, à côté de « Marquer » */
  if(ancre&&ancre.parentNode){ancre.parentNode.appendChild(b);b.classList.add("in-outils");}
  else if(b.parentNode!==document.body){document.body.appendChild(b);b.classList.remove("in-outils");}
  else b.classList.remove("in-outils");
}
function calcCalculer(){
  var f=$("calc-in"),r=$("calc-out"),v=calcEval(f.value);
  if(v===null){r.textContent=f.value.replace(/\s/g,"")?tx("zcalc.a_verifier"):"";r.className="calc-out"+(r.textContent?" err":"");return;}
  var t=calcFormat(v);
  r.textContent="= "+t;r.className="calc-out";
  CALC.dernier={e:f.value,t:t};
}
function calcSansEspaces(t){return String(t).replace(/[\s\u00a0\u202f]/g,"");}
/* « = » ou Entrée : le calcul va dans la liste et son résultat devient le calcul en cours (on peut continuer avec une opération) */
function calcValider(){
  calcCalculer();
  if(!CALC.dernier||$("calc-out").className.indexOf("err")>=0)return;
  CALC.hist.unshift(CALC.dernier);CALC.hist=CALC.hist.slice(0,4);
  var h=$("calc-hist");clear(h);
  CALC.hist.forEach(function(x){
    var b=el("button","calc-h",x.e+" = "+x.t);b.type="button";
    b.addEventListener("click",function(){var f=$("calc-in");f.value=calcSansEspaces(x.t);CALC.fin=true;calcCalculer();try{f.focus({preventScroll:true});}catch(e){}});
    h.appendChild(b);
  });
  var f=$("calc-in");f.value=calcSansEspaces(CALC.dernier.t);CALC.fin=true;calcCalculer();
  try{f.setSelectionRange(f.value.length,f.value.length);}catch(e){}
}
/* Une touche du pavé : insère (ou efface) à l'endroit du curseur */
function calcSaisir(k){
  var f=$("calc-in"),v=f.value,a=f.selectionStart,b=f.selectionEnd,ops="+−×÷",av,ins,pos,avant,ouv;
  if(typeof a!=="number"||typeof b!=="number"){a=b=v.length;}
  if(k===",")k=CALC_DEC;   /* la touche décimale insère le séparateur de la langue */
  if(k==="C"){f.value="";CALC.fin=false;calcCalculer();return;}
  if(k==="eq"){calcValider();return;}
  if(CALC.fin){   /* juste après « = » : une opération continue le résultat, un chiffre ou une parenthèse repart de zéro */
    if(ops.indexOf(k)>=0||k==="%"||k==="back"){a=b=v.length;}else{v="";a=b=0;}
    CALC.fin=false;
  }
  if(k==="back"){
    if(a!==b){v=v.slice(0,a)+v.slice(b);pos=a;}
    else if(a>0){v=v.slice(0,a-1)+v.slice(a);pos=a-1;}
    else{pos=0;}
  }else{
    av=a>0?v.charAt(a-1):"";
    if(k==="par"){
      avant=v.slice(0,a);
      ouv=(avant.match(/\(/g)||[]).length-(avant.match(/\)/g)||[]).length;
      if(ouv>0&&/[0-9%)]/.test(av))ins=")";
      else ins=/[0-9%)]/.test(av)?"×(":"(";
    }else if(ops.indexOf(k)>=0){
      ins=k;
      if(av&&ops.indexOf(av)>=0){a-=1;}                    /* deux opérations de suite : la seconde remplace la première */
      else if((av===""||av==="(")&&k!=="−"){return;}        /* on ne commence pas par + × ÷ (le moins sert aux nombres négatifs) */
    }else if(k==="%"){
      if(!/[0-9)]/.test(av))return;
      ins="%";
    }else if(k!==CALC_DEC&&(av===")"||av==="%")){ins="×"+k;}      /* (2+3)4 se lit (2+3)×4 */
    else{ins=k;}
    v=v.slice(0,a)+ins+v.slice(b);pos=a+ins.length;
  }
  f.value=v;
  try{f.focus({preventScroll:true});f.setSelectionRange(pos,pos);}catch(e){}
  calcCalculer();
}
$("b-calc").addEventListener("click",calcBascule);
$("calc-fermer").addEventListener("click",function(){calcFermer();$("b-calc").focus();});
$("calc-in").addEventListener("input",function(){CALC.fin=false;calcCalculer();});
$("calc-in").addEventListener("keydown",function(e){
  if(e.key==="Enter"){e.preventDefault();e.stopPropagation();calcValider();}
  else if(e.key==="Escape"){e.preventDefault();e.stopPropagation();calcFermer();}
  else e.stopPropagation();   /* les raccourcis du quiz (A à D, H J S, 1 à 3) ne doivent pas se déclencher en tapant un calcul */
});
/* Le pavé : un appui sur une touche ne prend pas le focus au champ (pas de saut de curseur) ; le reste du panneau ne laisse
   passer aucune touche vers les raccourcis du quiz */
$("calc-pad").addEventListener("mousedown",function(e){e.preventDefault();});
$("calc-pad").addEventListener("click",function(e){
  var n=e.target;
  while(n&&n!==this&&!(n.getAttribute&&n.getAttribute("data-k")))n=n.parentNode;
  if(n&&n!==this)calcSaisir(n.getAttribute("data-k"));
});
$("calc").addEventListener("keydown",function(e){
  if(e.key==="Escape"){e.preventDefault();e.stopPropagation();calcFermer();try{$("b-calc").focus();}catch(x){}return;}
  e.stopPropagation();
});
document.addEventListener("keydown",function(e){
  if(e.altKey&&!e.ctrlKey&&!e.metaKey&&e.code==="KeyC"){e.preventDefault();if(!$("b-calc").hidden)calcBascule();}
},true);
