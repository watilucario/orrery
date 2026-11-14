function resetAsk(){
  if(S&&S.ai&&S.ai.ctl){try{S.ai.ctl.abort();}catch(e){}}
  if(S){S.ai={turns:[],busy:false,ctl:null};}
  showAsk(false);$("aibox").hidden=true;clear($("aitext"));
  $("ainote").textContent="";$("b-stop").hidden=true;$("ainput").value="";
  $("b-explain").hidden=false;setAskBusy(false);
}
function setAskBusy(b){
  $("b-send").disabled=b;$("c-ex").disabled=b;$("c-why").disabled=b;$("b-explain").disabled=b;$("b-stop").hidden=!b;
}
function ctxText(it){
  var a=S.ans[S.ans.length-1],L=function(k){var pos;for(pos=0;pos<S.perm.length;pos++){if(S.perm[pos]===k)return String.fromCharCode(65+pos);}return "?";};
  var props=S.perm.map(function(k,pos){return String.fromCharCode(65+pos)+". "+it.o[k];}).join(" ; ");
  if(it.t==="associer"||it.t==="ordonner")return [t("iaq.theme",{v:themeName(it.th)}),it.ctx?t("iaq.enonce",{v:it.ctx}):"",t("iaq.question_type",{type:it.t==="associer"?t("iaq.type_associer"):t("iaq.type_ordonner"),q:it.q}),
    t("iaq.reponse_eleve",{txt:a.txt||"",etat:a.ok?t("iaq.juste"):t("iaq.fausse")}),t("iaq.bonne",{v:bonneTexte(it)}),t("iaq.correction",{v:it.e}),t("iaq.source",{v:it.s})].filter(function(x){return x;}).join("\n");
  return [t("iaq.theme",{v:themeName(it.th)}),
    it.ctx?t(it.cas?"iaq.enonce_cas":"iaq.enonce",{v:it.ctx}):"",
    t("iaq.question",{v:it.q}),
    a.rl?t("iaq.sans_prop")
      :t("iaq.propositions",{v:props}),
    a.rl?t("iaq.reponse_memoire",{q:quiEleve(),r:a.txt?"« "+a.txt+" »":t("iaq.ne_savait_plus"),etat:a.ok?t("iaq.juste_selon_lui"):t("iaq.fausse")})
      :t("iaq.reponse_de",{q:quiEleve(),l:L(a.pick),o:it.o[a.pick],etat:a.ok?t("iaq.juste"):t("iaq.fausse")}),
    a.rl?t("iaq.bonne",{v:it.o[it.c]}):t("iaq.bonne_lettre",{l:L(it.c),o:it.o[it.c]}),
    t("iaq.correction",{v:it.e}),
    t("iaq.source",{v:it.s})].filter(function(x){return x;}).join("\n");
}
var ASK_ERR={
  rate_limited:t("iaq.err_rate"),
  session_expired:t("iaq.err_session"),
  prompt_too_large:t("iaq.err_long"),
  refused:t("iaq.err_refus"),
  empty_completion:t("iaq.err_vide"),
  upstream_error:t("iaq.err_coupee")
};
var ASK_GONE={not_granted:1,sampling_disabled:1,not_declared:1,capability_disabled:1,capability_removed:1,tools_unavailable:1};
function addBlock(cls,txt){var d=el("div",cls,txt);$("aitext").appendChild(d);return d;}
function ask(text,first){
  var ai=S.ai,it=S.list[S.i];
  if(!SAMPLE||!ai||ai.busy||!S.locked)return;
  var msg=first?askMessage(it,text):text;
  var turns=trimTurns(ai.turns).concat([{role:"user",content:msg}]);
  ai.busy=true;ai.ctl=(typeof AbortController!=="undefined")?new AbortController():null;
  setAskBusy(true);$("ainote").textContent="";$("aibox").hidden=false;$("b-explain").hidden=true;
  if(!first){addBlock("q",t("iaq.toi",{v:text}));}
  var out=addBlock("wait",t("iaq.reflechit"));
  var opts={modelTier:AI.niveau,effort:AI.effort,onText:function(u){out.className="";out.textContent=u.text;}};
  if(ai.ctl)opts.signal=ai.ctl.signal;
  if(!first)opts.cache=false;
  var mine=ai;
  SAMPLE(turns,opts).then(function(res){
    if(S.ai!==mine)return;
    out.className="";out.textContent=res.text;
    mine.turns=turns.concat([{role:"assistant",content:res.text}]);
    mine.busy=false;mine.ctl=null;setAskBusy(false);
    if(res.truncated)$("ainote").textContent=t("iaq.coupee");
  },function(e){
    if(S.ai!==mine)return;
    mine.busy=false;mine.ctl=null;setAskBusy(false);
    var code=e&&e.code;
    if(e&&e.text){out.className="";out.textContent=e.text;}else{out.parentNode&&out.parentNode.removeChild(out);}
    if(first&&!(e&&e.text))$("b-explain").hidden=false;
    if(code==="cancelled")return;
    if(ASK_GONE[code]){SAMPLE=null;showAsk(false);return;}
    $("ainote").textContent=ASK_ERR[code]||ASK_ERR.upstream_error;
  });
}
/* Premier message d'une explication : consignes, règles du thème, contexte, demande. Le même texte part vers Claude ou,
   sans l'aide de Claude, est copié pour une autre IA (12h, copieIa). */
function askMessage(it,demande){return INSTR+"\n\n"+t("iaq.h_regles")+"\n"+rulesFor(it.th,it.b)+"\n\n"+t("iaq.h_contexte")+"\n"+ctxText(it)+"\n\n"+t("iaq.h_demande")+"\n"+demande+iaLangue();}
function askDemande(){
  var a=S.ans[S.ans.length-1];
  return t("iaq.demande",{faux:a.ok?"":t("iaq.demande_faux")});
}
function askFirst(){ask(askDemande(),true);}

