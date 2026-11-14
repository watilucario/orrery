/* ---------- Question sur un passage sélectionné (v10.2) ----------
   Demande de l'auteur : sélectionner du texte n'importe où (fiche, question, exercice, correction) et poser une question à
   une IA dans une bulle. Un bouton « Demander à Claude » apparaît sous la sélection (#sel-btn) ; il ouvre la bulle
   (#sel-bulle) : le passage cité, trois questions toutes faites, un champ libre, la réponse et les suivantes.
   Économie de tokens comme ailleurs : règles du seul thème de l'écran (rulesFor), contexte court, historique plafonné
   (trimTurns), 120 mots. Sans l'aide de Claude (aiOn, 04) : la même demande est copiée pour une autre IA (copierTexte, 12h).
   Rien pendant l'épreuve d'une simulation. Une question ou un exercice pas encore corrigé : Claude aide sans donner la
   réponse. La bulle se ferme quand on change d'écran (show, 03). */
var SEL={txt:"",ctx:null,turns:[],busy:false,ctl:null,ouvert:false,tm:null};
var SEL_MAX=1500,SEL_CHIPS=[[tx("sel.chip_simple"),tx("sel.chip_simple_q")],[tx("sel.chip_exemple"),tx("sel.chip_exemple_q")],[tx("sel.chip_pourquoi"),tx("sel.chip_pourquoi_q")]];
function selEcran(){var n;for(n=0;n<SCREENS.length;n++){if(!$(SCREENS[n]).hidden)return SCREENS[n];}return "";}
function selBloque(){return selEcran()==="sim"&&!!(SIM&&!SIM.sub);}
function selCourt(s,n){s=String(s||"");return s.length>n?s.slice(0,n)+"…":s;}
/* Ce que Claude doit savoir de l'endroit : lieu, thème (pour ses seules règles), contexte, et s'il ne faut pas donner la réponse */
function selContexte(noeud){
  var scr=selEcran(),c={lieu:"",th:"",contexte:"",cache:false},it,e,dans;
  if(scr==="quiz"&&S&&S.list&&S.list[S.i]){
    it=S.list[S.i];c.th=it.th;c.lieu=it.cas?tx("sel.lieu_cas"):tx("sel.lieu_qcm");
    c.contexte=[it.ctx?tx("sel.ctx_enonce",{txt:selCourt(it.ctx,900)}):"",tx("sel.ctx_question",{txt:it.q}),(it.t==="associer"||it.t==="ordonner"?"":tx("sel.ctx_propositions",{txt:it.o.join(" ; ")}))].filter(function(x){return x;}).join("\n");
    if(S.locked){c.contexte+="\n"+tx("sel.ctx_bonne",{txt:bonneTexte(it)})+"\n"+tx("sel.ctx_correction",{txt:it.e});}else{c.cache=true;}
  }else if(scr==="ex"&&EXS&&EXS.e){
    e=EXS.e;c.th=e.tl?"*":e.th;c.lieu=tx("sel.lieu_ex",{nom:e.t});
    c.contexte=tx("sel.ctx_enonce",{txt:selCourt(e.ctx,1200)});
    dans=noeud&&noeud.closest?noeud.closest(".sfb"):null;
    c.cache=!dans&&!(EXS.st&&EXS.st.done);
  }else if(scr==="fiche"&&FI===SYN_K){
    c.lieu=tx("sel.lieu_syn");
  }else if(scr==="fiche"&&FI){
    c.th=FI;c.lieu=tx("sel.lieu_fiche",{nom:themeName(FI)});
  }else if(scr==="drill"&&DR&&DR.list&&DR.list[DR.i]){
    it=DR.list[DR.i];c.lieu=tx("sel.lieu_calcul");
    c.contexte=tx("sel.ctx_question",{txt:it.q})+(DR.locked?"\n"+tx("sel.ctx_attendue",{txt:it.a+" "+it.u})+"\n"+tx("sel.ctx_calcul",{txt:it.sol}):"");
    c.cache=!DR.locked;
  }else{
    var t=NAV[scr]&&NAV[scr].titre;if(typeof t==="function")t=t();
    c.lieu=scr?tx("sel.lieu_ecran",{nom:t||scr}):tx("sel.lieu_app");
  }
  return c;
}
function selConsigne(){
  /* v13 : la personne vient de univers/app.json (version perso) ou du profil (Maitrise) */
  var qui=APP.eleve?APP.eleve+(APP.contexte?", "+APP.contexte:"")+",":(PROF&&PROF.prenom)?PROF.prenom+",":tx("sel.qui_defaut");
  return tx("sel.consigne",{qui:qui,matiere:MAT?MAT.titre:tx("sel.matiere_defaut")});
}
function selMessage(q){
  var c=SEL.ctx||{},regles=!c.th?"":rulesFor(c.th==="*"?"":c.th,false,c.th==="*");
  return [selConsigne(),
    c.cache?tx("sel.cache_msg"):"",
    regles?tx("sel.h_regles")+"\n"+regles:"",
    tx("sel.h_ou")+"\n"+c.lieu,
    c.contexte?tx("sel.h_contexte")+"\n"+c.contexte:"",
    tx("sel.h_passage",{txt:SEL.txt}),
    tx("sel.h_question",{q:q})].filter(function(x){return x;}).join("\n\n");
}
/* La sélection : du texte de l'app, hors champs de saisie, hors bulle et barres de navigation */
function selTexte(){
  var s=window.getSelection?window.getSelection():null,n,t;
  if(!s||s.isCollapsed||!s.rangeCount)return null;
  n=s.anchorNode;if(n&&n.nodeType===3)n=n.parentNode;
  if(!n||!n.closest||n.closest("input,textarea,select,[contenteditable],#sel-bulle,#appbar,#tabbar,#menu"))return null;
  t=trim(String(s.toString()).replace(/\s+/g," "));
  if(t.length<2)return null;
  return {txt:selCourt(t,SEL_MAX),noeud:n,rect:s.getRangeAt(0).getBoundingClientRect(),range:s.getRangeAt(0).cloneRange()};  /* range : pour surligner (12u) */
}
function selPlacer(r){
  var b=$("sel-btn"),pl=$("sel-plus"),wb=b.hidden?0:(b.offsetWidth||170),w=wb+(wb?8:0)+44,h=b.offsetHeight||44,bas=window.innerHeight-((document.body.className.indexOf("onglets")>=0)?84:12),
      top=r.bottom+10,left=r.left+r.width/2-w/2;
  if(top+h>bas)top=r.top-h-10;
  if(top<64)top=Math.min(Math.max(r.bottom+10,64),bas-h);
  left=Math.max(8,Math.min(left,window.innerWidth-w-8));
  b.style.top=Math.round(top)+"px";b.style.left=Math.round(left)+"px";
  pl.style.top=Math.round(top)+"px";pl.style.left=Math.round(left+wb+(wb?8:0))+"px";
}
function selMaj(){
  var r=selTexte(),b=$("sel-btn"),pl=$("sel-plus");
  if(!$("sel-menu").hidden)return;  /* menu du « + » ouvert : on garde le passage choisi */
  if(!r||selBloque()||!MAT){b.hidden=true;pl.hidden=true;return;}
  SEL.cand=r;b.textContent=aiOn()?tx("sel.btn_claude"):tx("sel.btn_ia");
  b.hidden=!MAT.blocs.aide_claude;pl.hidden=false;selPlacer(r.rect);
}
document.addEventListener("selectionchange",function(){
  if(SEL.tm)clearTimeout(SEL.tm);
  SEL.tm=setTimeout(selMaj,220);
});
function selSuivre(){if(!$("sel-plus").hidden&&$("sel-menu").hidden){var r=selTexte();if(r)selPlacer(r.rect);else{$("sel-btn").hidden=true;$("sel-plus").hidden=true;}}}
window.addEventListener("scroll",selSuivre,{passive:true});
window.addEventListener("resize",selSuivre);
$("sel-btn").addEventListener("pointerdown",function(e){e.preventDefault();});  /* garde la sélection au clic */
$("sel-btn").addEventListener("click",function(){
  var r=SEL.cand||selTexte();if(!r)return;
  selOuvrir(r.txt,selContexte(r.noeud));
});
/* Le « + » (v16.3) : signaler une erreur sur le passage, ou proposer une idée, sans IA ni forfait (12p) */
$("sel-plus").addEventListener("pointerdown",function(e){e.preventDefault();});
function selMenuFermer(){var m=$("sel-menu");if(m.hidden)return;m.hidden=true;$("sel-plus").setAttribute("aria-expanded","false");}
$("sel-plus").addEventListener("click",function(){
  var m=$("sel-menu"),pl=$("sel-plus");
  if(!m.hidden){selMenuFermer();return;}
  SEL.menu=SEL.cand||selTexte();if(!SEL.menu)return;
  var fiche=ntMenuMaj(SEL.menu);  /* v17 : « Surligner » et « Ajouter une note » dans une fiche (12u) */
  m.hidden=false;pl.setAttribute("aria-expanded","true");
  var r=pl.getBoundingClientRect(),w=m.offsetWidth||200,h=m.offsetHeight||100,top=r.bottom+8,left=Math.max(8,Math.min(r.right-w,window.innerWidth-w-8));
  if(top+h>window.innerHeight-12)top=Math.max(8,r.top-h-8);
  m.style.top=Math.round(top)+"px";m.style.left=Math.round(left)+"px";
  try{$(fiche?"b-sel-c1":"b-sel-sig").focus();}catch(e){}
});
/* Ce qui est joint : l'endroit (question, exercice, fiche) comme « Signaler une erreur », plus le passage choisi */
function selSigCtx(r){
  var scr=selEcran(),c=null,q,i;
  if(scr==="quiz")c=sigCtxQuiz();
  else if(scr==="fiche")c=sigCtxFiche();
  else if(scr==="ex"&&EXS&&EXS.sq){q=r.noeud&&r.noeud.closest?r.noeud.closest(".sq"):null;i=q?EXS.sq.indexOf(q):-1;if(i>=0)c=sigCtxEx(i);}
  if(!c)c={genre:"passage",cible:{id:scr,theme:null,nomTheme:null,libelle:null},reponse:null};
  c.extrait=r.txt;return c;
}
function selPlusAgir(idee){
  var r=SEL.menu;selMenuFermer();$("sel-btn").hidden=true;$("sel-plus").hidden=true;
  if(!r)return;
  try{window.getSelection().removeAllRanges();}catch(e){}
  sigOuvrir(idee?{genre:"idee",cible:null,reponse:null,extrait:r.txt}:selSigCtx(r));
}
$("b-sel-sig").addEventListener("click",function(){selPlusAgir(false);});
$("b-sel-idee").addEventListener("click",function(){selPlusAgir(true);});
document.addEventListener("pointerdown",function(e){if(!$("sel-menu").hidden&&!e.target.closest("#sel-menu,#sel-plus"))selMenuFermer();});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!$("sel-menu").hidden){selMenuFermer();try{$("sel-plus").focus();}catch(x){}}});
/* La bulle */
function selOuvrir(txt,ctx){
  selArreter();
  SEL.txt=txt;SEL.ctx=ctx;SEL.turns=[];SEL.ouvert=true;
  $("sel-btn").hidden=true;$("sel-plus").hidden=true;selMenuFermer();
  $("sel-cite").textContent=nb(txt);
  $("sel-lieu").textContent=ctx.lieu?tx("sel.dans",{lieu:ctx.lieu}):"";
  clear($("sel-fil"));$("sel-note").textContent="";clear($("sel-zone"));$("sel-q").value="";
  $("sel-go").textContent=aiOn()?tx("sel.go_ask"):tx("sel.go_copy");
  $("sel-cout").hidden=!aiOn();
  $("sel-cache").hidden=!ctx.cache;
  selChips(true);
  $("sel-bulle").hidden=false;
  try{window.getSelection().removeAllRanges();}catch(e){}
  try{if(window.matchMedia&&window.matchMedia("(hover: hover)").matches)$("sel-q").focus();}catch(e){}
}
function selChips(on){
  var box=$("sel-chips");clear(box);if(!on)return;
  SEL_CHIPS.forEach(function(c){
    var b=el("button","chip",c[0]);b.type="button";
    b.addEventListener("click",function(){selDemander(c[1]);});
    box.appendChild(b);
  });
}
function selArreter(){if(SEL.ctl){try{SEL.ctl.abort();}catch(e){}}SEL.ctl=null;SEL.busy=false;}
function selFermer(){
  if(!SEL||(!SEL.ouvert&&$("sel-btn").hidden&&$("sel-plus").hidden))return;
  selArreter();SEL.ouvert=false;$("sel-bulle").hidden=true;$("sel-btn").hidden=true;$("sel-plus").hidden=true;selMenuFermer();
}
function selOccupe(b){$("sel-go").disabled=b;$("sel-stop").hidden=!b;[].forEach.call($("sel-chips").childNodes,function(x){x.disabled=b;});}
function selDemander(q){
  q=trim(q||"");
  if(!q){$("sel-q").focus();return;}
  if(SEL.busy)return;
  var premier=!SEL.turns.length,msg=premier?selMessage(q):q;
  if(!aiOn()){
    copierTexte(selMessage(q),$("sel-note"),$("sel-zone"),tx("sel.copie_ok"));
    return;
  }
  var fil=$("sel-fil"),moi=el("div","sel-moi",q),rep=el("div","sel-rep wait",tx("sel.reflechis")),turns=trimTurns(SEL.turns).concat([{role:"user",content:msg}]),
      opts={modelTier:AI.niveau,effort:AI.effort,onText:function(u){rep.className="sel-rep";rep.textContent=u.text;}},mine;
  fil.appendChild(moi);fil.appendChild(rep);
  $("sel-q").value="";$("sel-note").textContent="";selChips(false);
  SEL.busy=true;SEL.ctl=(typeof AbortController!=="undefined")?new AbortController():null;
  if(SEL.ctl)opts.signal=SEL.ctl.signal;
  if(!premier)opts.cache=false;
  selOccupe(true);mine=SEL.turns;
  SAMPLE(turns,opts).then(function(res){
    if(SEL.turns!==mine)return;
    rep.className="sel-rep";rep.textContent=res.text;
    SEL.turns=turns.concat([{role:"assistant",content:res.text}]);
    SEL.busy=false;SEL.ctl=null;selOccupe(false);
    if(res.truncated)$("sel-note").textContent=tx("sel.coupee");
    try{rep.scrollIntoView({block:"nearest"});}catch(e){}
  },function(err){
    if(SEL.turns!==mine)return;
    SEL.busy=false;SEL.ctl=null;selOccupe(false);
    var code=err&&err.code;
    if(err&&err.text){rep.className="sel-rep";rep.textContent=err.text;}else if(rep.parentNode){rep.parentNode.removeChild(rep);fil.removeChild(moi);$("sel-q").value=q;if(premier)selChips(true);}
    if(code==="cancelled")return;
    if(ASK_GONE[code]){SAMPLE=null;$("sel-go").textContent=tx("sel.go_copy");$("sel-cout").hidden=true;}
    $("sel-note").textContent=ASK_GONE[code]?tx("sel.gone"):(ASK_ERR[code]||ASK_ERR.upstream_error);
  });
}
$("sel-go").addEventListener("click",function(){selDemander($("sel-q").value);});
$("sel-stop").addEventListener("click",selArreter);
$("sel-fermer").addEventListener("click",selFermer);
$("sel-q").addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();selDemander($("sel-q").value);}});  /* Entrée envoie, Maj+Entrée va à la ligne */
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&SEL.ouvert)selFermer();});
