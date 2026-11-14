
/* ---------- Poser une question dans les exercices rédigés ---------- */
var EXQA={};
/* EXQ_INSTR : consigne de la matière (regles.md), chargée par activate() */
function refText(s){
  return (s.k==="num")?(fmtNum(s.a)+(s.u?" "+s.u:"")+(s.alt?t("iae.alt",{v:s.alt.map(fmtNum).join(" / ")}):"")+t("iae.calcul",{v:s.sol})):s.m;
}
function exAnswersText(e,st){
  var out=[],n,a;
  for(n=0;n<e.subs.length;n++){a=trim(st.a[n]);out.push(tx("iae.question",{n:n+1,v:a||tx("iae.pas_repondu")}));}
  if(trim(st.bro))out.push(tx("iae.brouillon",{q:quiEleve(),v:trim(st.bro).slice(0,1500)}));
  return out.join("\n");
}
function exSig(e,st){return exAnswersText(e,st);}
function exAskCtx(e,st,withRef){
  var L=[tx("iae.exercice",{v:e.t}),tx("iae.enonce",{v:e.ctx})],n,s,a,t;
  for(n=0;n<e.subs.length;n++){
    s=e.subs[n];a=trim(st.a[n]);
    t=tx("iae.question_rep",{n:n+1,q:s.q,e:quiEleve(),v:a||tx("iae.pas_repondu")});
    if(withRef)t+="\n"+tx("iae.correction",{v:refText(s)});
    L.push(t);
  }
  if(trim(st.bro))L.push(tx("iae.brouillon",{q:quiEleve(),v:trim(st.bro).slice(0,1500)}));
  return L.join("\n\n");
}
function newQa(){return {turns:[],log:[],busy:false,ctl:null,focus:null,open:false,sig:"",refSent:false};}
function renderExqLog(){
  var qa=EXS.qa,box=$("exq-text");
  clear(box);
  qa.log.forEach(function(o){o.node=el("div",o.cls,o.txt);box.appendChild(o.node);});
}
function setExqBusy(b){
  var k;
  $("b-exq-send").disabled=b;$("b-exq-stop").hidden=!b;
  for(k=0;k<EXS.chipBtns.length;k++){EXS.chipBtns[k].disabled=b;}
}
function placeAsk(){
  var qa=EXS.qa,host=(qa.open&&qa.focus!==null&&EXS.sq[qa.focus])||$("ex-ask-home");
  if($("ex-ask").parentNode!==host){host.appendChild($("ex-ask"));}
}
function parkAsk(){
  var h=$("ex-ask-home");
  if($("ex-ask").parentNode!==h){h.appendChild($("ex-ask"));}
}
function renderExAsk(){
  var on=aiOn()&&!!EXS,k,ql;
  $("ex-ask").hidden=!on;
  if(EXS&&EXS.sq){
    for(k=0;k<EXS.sq.length;k++){ql=EXS.sq[k]&&EXS.sq[k].querySelector(".qlink");if(ql){ql.hidden=!on;}}
  }
  if(!on)return;
  var qa=EXS.qa,done=!!EXS.st.done,f=qa.focus,chips,box=$("exq-chips");
  placeAsk();
  $("exq-sub").textContent=done?t("iae.sub_corrige"):t("iae.sub_avant");
  $("b-exq-open").hidden=qa.open;
  $("exq-box").hidden=!qa.open;
  $("exq-focus").textContent=(f===null)?t("iae.tout"):t("iae.question_n",{n:f+1});
  $("b-exq-all").hidden=(f===null);
  if(done){
    chips=[[t("iae.c_corr"),t("iae.c_corr_m")],
      [t("iae.c_erreur"),(f===null)?t("iae.c_erreur_m_tout"):t("iae.c_erreur_m_une")]];
  }else{
    chips=[[t("iae.c_regle"),t("iae.c_regle_m")],
      [t("iae.c_indice"),t("iae.c_indice_m")]];
  }
  clear(box);EXS.chipBtns=[];
  chips.forEach(function(c){
    var b=el("button","chip",c[0]);b.type="button";
    b.addEventListener("click",function(){exAsk(c[1]);});
    EXS.chipBtns.push(b);box.appendChild(b);
  });
  renderExqLog();
  setExqBusy(!!qa.busy);
  $("exq-note").textContent="";
}
function openExAsk(i){
  var qa=EXS.qa;
  qa.open=true;qa.focus=(i===undefined)?null:i;
  renderExAsk();
  try{$("ex-ask").scrollIntoView(false);}catch(e){}
}
function closeExAsk(){
  var qa=EXS.qa;
  qa.open=false;qa.focus=null;
  renderExAsk();
}
function exAsk(text){
  var qa=EXS&&EXS.qa;
  if(!SAMPLE||!qa||qa.busy)return;
  var e=EXS.e,st=EXS.st,done=!!st.done,first=(qa.turns.length===0),sig=exSig(e,st),
      pre=(qa.focus!==null)?t("iae.pre",{n:qa.focus+1}):"",msg;
  if(first){
    msg=EXQ_INSTR+"\n\n"+t("iaq.h_regles")+"\n"+rulesFor(e.th,e.b,!!e.tl)+"\n\n"+exAskCtx(e,st,done)+"\n\n"+t("iaq.h_demande")+"\n"+pre+text+iaLangue();
    qa.refSent=done;qa.sig=sig;
  }else if(done&&!qa.refSent){
    msg=t("iae.maj_corrige",{q:quiEleveMaj()})+"\n\n"+exAskCtx(e,st,true)+"\n\n"+t("iaq.h_demande")+"\n"+pre+text;
    qa.refSent=true;qa.sig=sig;
  }else if(sig!==qa.sig){
    msg=t("iae.maj_reponses")+"\n"+exAnswersText(e,st)+"\n\n"+t("iaq.h_demande")+"\n"+pre+text;
    qa.sig=sig;
  }else{
    msg=pre+text;
  }
  var hist=qa.turns;
  if(hist.length>6){
    var dropped=hist.slice(2,-4);hist=trimTurns(hist,4);
    var lostUpdate=dropped.some(function(m){return m.role==="user"&&m.content.indexOf(t("iae.maj_mot"))===0;});
    if(lostUpdate&&msg===pre+text){msg=(done?t("iae.rappel")+"\n"+exAskCtx(e,st,true):t("iae.rappel_rep")+"\n"+exAnswersText(e,st))+"\n\n"+t("iaq.h_demande")+"\n"+pre+text;}
  }
  var turns=hist.concat([{role:"user",content:msg}]);
  qa.busy=true;qa.ctl=(typeof AbortController!=="undefined")?new AbortController():null;
  qa.log.push({cls:"q",txt:t("iaq.toi",{v:text})});
  var out={cls:"wait",txt:t("iaq.reflechit")};qa.log.push(out);
  renderExqLog();setExqBusy(true);$("exq-note").textContent="";
  var paint=function(){if(EXS&&EXS.qa===qa&&out.node){out.node.className=out.cls;out.node.textContent=out.txt;}};
  var opts={modelTier:AI.niveau,effort:AI.effort,cache:false,onText:function(u){out.cls="";out.txt=u.text;paint();}};
  if(qa.ctl)opts.signal=qa.ctl.signal;
  SAMPLE(turns,opts).then(function(res){
    out.cls="";out.txt=res.text;paint();
    qa.turns=turns.concat([{role:"assistant",content:res.text}]);
    qa.busy=false;qa.ctl=null;
    if(EXS&&EXS.qa===qa){setExqBusy(false);$("exq-note").textContent=res.truncated?t("iaq.coupee"):"";}
  },function(err){
    qa.busy=false;qa.ctl=null;
    var code=err&&err.code;
    if(err&&err.text){out.cls="";out.txt=err.text;}else{qa.log.splice(qa.log.indexOf(out),1);}
    if(EXS&&EXS.qa===qa){
      renderExqLog();setExqBusy(false);
      if(code!=="cancelled"){
        if(ASK_GONE[code]){SAMPLE=null;renderExAsk();return;}
        $("exq-note").textContent=ASK_ERR[code]||ASK_ERR.upstream_error;
      }
    }
  });
}
$("b-exq-open").addEventListener("click",function(){openExAsk(null);});
$("b-exq-close").addEventListener("click",closeExAsk);
$("b-exq-all").addEventListener("click",function(){EXS.qa.focus=null;renderExAsk();});
$("b-exq-stop").addEventListener("click",function(){if(EXS&&EXS.qa&&EXS.qa.ctl){try{EXS.qa.ctl.abort();}catch(e){}}});
$("exq-form").addEventListener("submit",function(ev){
  ev.preventDefault();
  var v=trim($("exq-input").value);
  if(!v)return;
  $("exq-input").value="";
  exAsk(v);
});
