/* ---------- Exercices rédigés ----------
   Deux façons de faire un exercice (v6.4), au choix, gardé pour les suivants (qfcc2.exmode) :
   - guidé (par défaut) : une question à la fois, « Vérifier » tout de suite, puis des indices gradués (l'indice de la
     question s'il existe, le rappel du cours du thème) et la correction de la question ; chrono masqué ;
   - comme à l'examen : toutes les questions ouvertes, chrono, correction à la fin (comme avant la v6.4).
   Mode guidé, dans l'état de l'exercice : v = {question: 1 juste du premier coup, 2 juste après un indice ou une
   erreur, 3 correction affichée}, h = {question: indices montrés}. Une question dont la correction a été affichée ne
   compte pas comme preuve dans la grille de maîtrise (08c). Une simulation (sim-…) reste toujours « à l'examen ». */
var EXS=null,exFilter=false,exSaveT=null,KEXMODE="qfcc2.exmode";  /* CORR_INSTR : consigne de la matière (regles.md), chargée par activate() */
function exGuide(){return !!(EXS&&EXS.e.id.indexOf("sim-")!==0&&!EXS.st.done&&load(KEXMODE,"guide")!=="exam");}
function exState(id){if(!EX[id]){EX[id]={a:{},g:{},bro:"",t:0,done:false,ai:""};}return EX[id];}
function saveEx(){save(KEX,EX);}
function saveExSoon(){if(exSaveT)clearTimeout(exSaveT);exSaveT=setTimeout(saveEx,400);}
function fmtNum(x){
  var neg=x<0,p=Math.abs(x).toString().split("."),fr=LANG==="fr",i=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,fr?" ":",");
  return (neg?"−":"")+i+(p[1]?(fr?",":".")+p[1]:"");  /* 9 552,42 en français, 9,552.42 en anglais */
}
function parseNum(s){
  if(s==null)return NaN;
  var v=String(s).replace(/[\s  ]/g,"").replace(/€|%|parts?|km/gi,"").replace(/[−–—]/g,"-");
  if(LANG!=="fr"&&/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(v))v=v.replace(/,/g,"");  /* anglais : 1,234.5 */
  v=v.replace(",",".");
  if(!/^-?\d+(\.\d+)?$/.test(v))return NaN;
  return parseFloat(v);
}
function numOk(sub,v){
  if(isNaN(v))return false;
  var tol=(sub.tol||0)+1e-9,al=[sub.a].concat(sub.alt||[]),n;
  for(n=0;n<al.length;n++){if(Math.abs(v-al[n])<=tol)return true;}
  return false;
}
function exAnswered(e,st){var n,c=0;for(n=0;n<e.subs.length;n++){if(trim(st.a[n])!=="")c++;}return c;}
function exScore(e,st){
  var pts=0,unrated=0,n,s,g;
  for(n=0;n<e.subs.length;n++){
    s=e.subs[n];
    if(s.k==="num"){if(numOk(s,parseNum(st.a[n])))pts++;}
    else{g=st.g[n];if(g===2)pts+=1;else if(g===1)pts+=0.5;else if(g===undefined)unrated++;}
  }
  return {pts:pts,max:e.subs.length,unrated:unrated};
}
function scoreText(sc){return (LANG==="fr"?String(sc.pts).replace(".",","):String(sc.pts))+" / "+sc.max;}
function exStatus(e){
  var st=EX[e.id];
  if(!st)return null;  /* pas commencé : rien à signaler */
  if(st.done)return t("exo.corrige",{score:scoreText(exScore(e,st)),temps:mmss(st.t)});
  var c=exAnswered(e,st);
  return c?t("exo.en_cours",{c:c,n:e.subs.length}):null;
}
function openExList(onlyMarked){
  exFilter=!!onlyMarked;
  $("exl-lead").textContent=MAT.blocs.exercices.intro||"";
  renderExList();show("exlist");
}
function renderExList(){
  var box=$("exitems");clear(box);
  var list=EXO.filter(function(e){return !exFilter||isMarked("ex:"+e.id);});
  $("b-exfilter").textContent=t(exFilter?"exo.voir_tous":"exo.voir_marques");
  if(!list.length){box.appendChild(el("p","lead",t("exo.aucun_marque")));return;}
  /* Programme du prochain examen (v10) : ses exercices d'abord */
  var P=examPerim(),T=perimTri(P,list,function(e){return e.th;});
  function bouton(e){
    var mk=isMarked("ex:"+e.id);
    box.appendChild(bigBtn((mk?"★ ":"")+e.t,tn("exo.sous",e.subs.length,{theme:e.tl||themeName(e.th),min:e.min}),false,function(){openEx(e.id);},false,exStatus(e)||(P&&P.th[e.th]?t("exo.au_exam",{nom:P.x.nom}):null)));
  }
  T.de.forEach(bouton);
  if(T.hors.length){box.appendChild(perimHors(P));T.hors.forEach(bouton);}
}
function updateExMark(){
  var on=isMarked("ex:"+EXS.e.id),b=$("b-exmark");
  b.textContent=t(on?"exo.marque":"exo.marquer");
  b.setAttribute("aria-pressed",on?"true":"false");
}
function showTime(){
  var t=EXS.st.t;
  $("ex-time").textContent=mmss(t);
  $("ex-time").className="score"+(t>EXS.e.min*60?" over":"");
}
function stopTimer(){if(EXS&&EXS.timer){clearInterval(EXS.timer);EXS.timer=null;}}
function startTimer(){
  stopTimer();showTime();
  if(EXS.st.done)return;
  EXS.timer=setInterval(function(){
    if(document.hidden||$("ex").hidden)return;
    EXS.st.t++;showTime();
    if(EXS.st.t%15===0)saveEx();
  },1000);
}
function openEx(id,ret){  /* ret (v13.3) : "chap" si ouvert depuis la page d'un chapitre, pour y revenir */
  stopTimer();
  if(EXS&&EXS.qa&&EXS.qa.ctl){try{EXS.qa.ctl.abort();}catch(x){}}
  var e=EXBY[id],st=exState(id);
  EXS={e:e,ret:ret||null,st:st,timer:null,gb:{},aiBusy:false,aiCtl:null,sq:[],chipBtns:[],qa:(EXQA[id]||(EXQA[id]=newQa()))};
  LASTEX=id;save(KLAST,id);
  var isSim=(id.indexOf("sim-")===0);
  $("ex-meta").textContent=nb(isSim?tn("exo.sous_sim",e.subs.length,{nom:SIMB?SIMB.nom:t("exo.simulation")}):tn("exo.sous",e.subs.length,{theme:e.tl||themeName(e.th),min:e.min}));
  $("b-exmark").hidden=isSim;
  $("ex-title").textContent=e.t;
  ctxRendre($("ex-ctx"),e.ctx);
  annexeReset("b-exbareme","exbareme",e.b);
  repInit("b-exrep","exrep",isSim?[]:repDe(e));  /* documents types (v7.3) : pas en simulation */
  $("ex-bro").value=st.bro||"";$("ex-bro").disabled=!!st.done;
  updateExMark();
  EXS.gi=0;while(EXS.gi<e.subs.length-1&&st.v&&st.v[EXS.gi])EXS.gi++;  /* guidé : reprendre à la première question non vérifiée */
  renderSubs();renderExFoot();renderExAsk();
  show("ex");startTimer();
}
/* Guidé ou comme à l'examen : le choix, son effet, la question affichée */
function renderExMode(){
  var g=exGuide(),sim=EXS.e.id.indexOf("sim-")===0;
  $("ex-mode").hidden=sim||EXS.st.done;$("ex-mode-s").hidden=sim||EXS.st.done;
  [["ex-mode-guide",g],["ex-mode-exam",!g]].forEach(function(x){$(x[0]).classList.toggle("sel",x[1]);$(x[0]).setAttribute("aria-pressed",x[1]?"true":"false");});
  $("ex-mode-s").textContent=t(g?"exo.mode_guide":"exo.mode_examen");
  $("ex-time").hidden=g;
  var n=EXS.e.subs.length;$("ex-gnav").hidden=!g;
  if(g){$("ex-gpos").textContent=t("exo.q_pos",{i:EXS.gi+1,n:n});$("b-exg-prev").disabled=EXS.gi===0;$("b-exg-next").disabled=EXS.gi>=n-1;}
}
function exAller(i){
  if(!EXS)return;EXS.gi=Math.max(0,Math.min(EXS.e.subs.length-1,i));
  EXS.sq.forEach(function(w,k){w.hidden=k!==EXS.gi;});renderExMode();
  try{$("ex-gnav").scrollIntoView({block:"nearest"});}catch(x){}
}
/* Indices d'une question : son indice s'il y en a un, puis le rappel du cours de son thème (règles de regles.md) */
function exIndices(e,s){
  var l=[];if(s.ind)l.push([t("exo.indice"),[s.ind]]);
  var th=e.th,rg=(MAT.ruleMap&&MAT.ruleMap[th])||[];
  var tx=rg.filter(function(i){return i!==0;}).map(function(i){return MAT.rulesList[i];}).filter(function(x){return !!x;});
  if(tx.length)l.push([t("exo.rappel_cours"),tx]);
  return l;
}
function exGuideBloc(w,s,i,st){
  var g=el("div","sq-guide"),e=EXS.e,ind=exIndices(e,s),nh=(st.h&&st.h[i])||0,k;
  for(k=0;k<Math.min(nh,ind.length);k++){
    var hb=el("div","sq-ind");hb.appendChild(el("p","plab",ind[k][0]));
    ind[k][1].forEach(function(t){hb.appendChild(el("p","",nb(t)));});
    g.appendChild(hb);
  }
  if(EXS.ko&&EXS.ko[i])g.appendChild(el("p","v-ko sq-pas",t(nh<ind.length?"exo.pas_encore":"exo.pas_encore_cor")));
  var bt=el("div","ag-btns");
  var vb=el("button","sbtn",t(s.k==="num"?"exo.verifier":"exo.voir_attendue"));vb.type="button";vb.id="b-exg-ok-"+i;
  vb.addEventListener("click",function(){exVerifier(i);});bt.appendChild(vb);
  if(nh<ind.length){var ib=el("button","link",t("exo.un_indice"));ib.type="button";ib.id="b-exg-ind-"+i;
    ib.addEventListener("click",function(){if(!st.h)st.h={};st.h[i]=nh+1;saveEx();renderSubs();});bt.appendChild(ib);}
  if(s.k==="num"&&(nh||(EXS.ko&&EXS.ko[i]))){var cb=el("button","link",t("exo.voir_correction"));cb.type="button";cb.id="b-exg-cor-"+i;
    cb.addEventListener("click",function(){exMarque(i,3);});bt.appendChild(cb);}
  g.appendChild(bt);
  w.appendChild(g);
}
function exMarque(i,v){
  var st=EXS.st;if(!st.v)st.v={};st.v[i]=v;st.a[i]=$("in-"+i)?$("in-"+i).value:st.a[i];
  if(EXS.e.subs[i].k==="num"&&!exCompte(EXS.e,i))exNoter(EXS.e,i,v===1);  /* v16 (03h) : juste du premier coup, sans indice ; sinon une erreur */
  saveEx();renderSubs();renderExFoot();
}
function exVerifier(i){
  var s=EXS.e.subs[i],st=EXS.st,f=$("in-"+i);st.a[i]=f?f.value:st.a[i];
  if(s.k!=="num"){exMarque(i,1);return;}
  var raw=trim(st.a[i]);
  if(raw===""){try{f.focus();}catch(x){}return;}
  if(numOk(s,parseNum(raw))){exMarque(i,(st.h&&st.h[i])||(EXS.ko&&EXS.ko[i])||exCompte(EXS.e,i)?2:1);return;}
  if(!exCompte(EXS.e,i))exNoter(EXS.e,i,false);  /* v16 : l'erreur compte même si la réponse est retapée ensuite */
  if(!EXS.ko)EXS.ko={};EXS.ko[i]=1;saveEx();renderSubs();
}
function renderSubs(){
  var box=$("ex-subs"),e=EXS.e,st=EXS.st,gd=exGuide();
  parkAsk();
  clear(box);EXS.gb={};EXS.sq=[];
  e.subs.forEach(function(s,i){
    var w=el("div","sq"),q=el("div","sqq"),field;
    q.appendChild(el("span","sn",(i+1)+"."));
    q.appendChild(document.createTextNode(nb(s.q)));
    w.appendChild(q);
    var mv=blocOn("maitrise")&&s.n?maiNiv(s.n):null,rg=blocOn("maitrise")?maiRegard(s.r||e.r):null;
    if(mv||rg)w.appendChild(el("p","sqtag",[mv?mv.nom:"",rg?t("exo.au_dela",{nom:rg.nom}):""].filter(function(x){return !!x;}).join(" · ")));
    if(s.k==="num"){
      var row=el("div","inrow");
      field=el("input","field");field.type="text";field.id="in-"+i;
      field.setAttribute("autocomplete","off");field.setAttribute("autocapitalize","off");field.setAttribute("autocorrect","off");field.setAttribute("spellcheck","false");
      if(!s.neg)field.setAttribute("inputmode","decimal");
      field.setAttribute("aria-label",t("exo.reponse_n",{n:i+1}));
      field.placeholder=t(s.neg?"calc.ph_neg":"calc.ph_nombre");
      row.appendChild(field);
      row.appendChild(el("span","unit",s.u||""));
      w.appendChild(row);
    }else{
      field=el("textarea","field");field.id="in-"+i;field.rows=3;
      field.setAttribute("aria-label",t("exo.reponse_n",{n:i+1}));
      var ma=blocOn("maitrise")?maiNiv(maiSub(s)):null;  /* consigne de la marche (Expliquer, Recommander) */
      field.placeholder=(ma&&ma.aide)||t("exo.ph_texte");
      w.appendChild(field);
    }
    field.value=st.a[i]||"";
    var vu=gd&&st.v&&st.v[i];
    field.disabled=!!st.done||!!vu;
    field.addEventListener("input",function(){st.a[i]=field.value;if(EXS.ko&&EXS.ko[i]){delete EXS.ko[i];}saveExSoon();});
    if(gd&&s.k==="num")field.addEventListener("keydown",function(ev){if(ev.key==="Enter"&&!vu){ev.preventDefault();exVerifier(i);}});
    if(!st.done&&!vu)w.appendChild(exConfRangee(e,i));  /* v16 : ta confiance, avant la correction (03h) */
    if(st.done||vu){paintCorrection(w,s,i,st);}
    if(vu&&st.v[i]===3)w.appendChild(el("p","src sq-aide",t("exo.corr_affichee")));
    if(gd&&!vu)exGuideBloc(w,s,i,st);
    if(gd&&vu){var nx=el("div","ag-btns"),last=i>=e.subs.length-1,nb2=el("button","sbtn",t(last?"exo.terminer":"exo.suivante"));nb2.type="button";nb2.id="b-exg-suiv-"+i;
      nb2.addEventListener("click",function(){if(last){correctEx();}else{exAller(i+1);}});nx.appendChild(nb2);w.appendChild(nx);}
    var ql=el("button","link qlink",t("exo.question_sur_celle"));ql.type="button";ql.hidden=!aiOn();
    ql.addEventListener("click",function(){openExAsk(i);});
    w.appendChild(ql);
    if(e.id.indexOf("sim-")!==0)w.appendChild(sigExBouton(i));  /* v16 (12o) ; pas pendant une simulation */
    if(gd)w.hidden=(i!==EXS.gi);
    EXS.sq[i]=w;
    box.appendChild(w);
  });
  renderExMode();
}
function paintCorrection(w,s,i,st){
  var fb=el("div","sfb"),p;
  if(s.k==="num"){
    var raw=trim(st.a[i]),v=parseNum(raw),ok=numOk(s,v);
    p=el("p","");
    if(raw===""){p.appendChild(el("span","v-ko",t("exo.sans_reponse")));}
    else if(isNaN(v)){p.appendChild(el("span","v-ko",t("exo.illisible")));}
    else if(ok){p.appendChild(el("span","v-ok",t("exo.juste")));}
    else{p.appendChild(el("span","v-ko",t("exo.faux")));p.appendChild(document.createTextNode(" "+t("exo.ta_reponse",{r:nb(raw)})));}
    fb.appendChild(p);
    var att=el("p","");att.appendChild(el("span","lab",t("exo.attendu")+" "));
    att.appendChild(document.createTextNode(fmtNum(s.a)+(s.u?" "+s.u:"")+(s.alt?t("exo.alt",{l:s.alt.map(fmtNum).join(" / ")}):"")));
    fb.appendChild(att);
    var cal=el("p","");cal.appendChild(el("span","lab",t("exo.calcul")+" "));cal.appendChild(document.createTextNode(nb(s.sol)));
    fb.appendChild(cal);
    w.className="sq "+(ok?"ok":"ko");
  }else{
    p=el("p","");p.appendChild(el("span","lab",t("exo.attendu")+" "));p.appendChild(document.createTextNode(nb(s.m)));
    fb.appendChild(p);
    var gp=el("p","");gp.appendChild(el("span","lab",t("exo.ta_note")+" "));
    var btns=[],labs=[[t("exo.n_juste"),2],[t("exo.n_moitie"),1],[t("exo.n_faux"),0]];
    labs.forEach(function(L){
      var b=el("button","chip",L[0]);b.type="button";
      if(st.g[i]===L[1])b.className="chip sel";
      b.addEventListener("click",function(){
        st.g[i]=L[1];saveEx();exNoter(EXS.e,i,L[1]===2);  /* v16 : « À moitié » n'est pas une réussite */
        btns.forEach(function(x){x.b.className="chip"+(x.g===L[1]?" sel":"");});
        renderExFoot();
      });
      btns.push({b:b,g:L[1]});gp.appendChild(b);
    });
    fb.appendChild(gp);
  }
  w.appendChild(fb);
}
function renderExFoot(){
  var act=$("ex-actions"),sum=$("ex-summary"),e=EXS.e,st=EXS.st;
  clear(act);
  if(!st.done){
    sum.hidden=true;$("ex-ai").hidden=true;
    if(exGuide())act.appendChild(bigBtn(t("exo.terminer"),t("exo.terminer_t"),false,correctEx));
    else act.appendChild(bigBtn(t("exo.corriger"),t("exo.corriger_t"),true,correctEx));
    return;
  }
  var sc=exScore(e,st);
  clear(sum);
  sum.appendChild(el("p","lab",t("exo.resultat")));
  sum.appendChild(el("div","big",scoreText(sc)));
  var isSim=(e.id.indexOf("sim-")===0);
  var line=(isSim?t("exo.temps_sim",{temps:mmss(st.t)}):t("exo.temps",{temps:mmss(st.t),min:e.min}))+(sc.unrated?" "+tn("exo.reste_noter",sc.unrated):"");
  sum.appendChild(el("p","",line));
  sum.appendChild(el("p","src",t("exo.sources",{src:e.src,note:MAT.blocs.exercices.note||t("exo.note_defaut")})));
  sum.hidden=false;
  if(!aiOn()&&blocOn("aide_claude"))copieIaEx(sum);
  if(aiOn()){act.appendChild(bigBtn(t("exo.faire_corriger"),t("exo.faire_corriger_t"),false,askCorrection));}
  if(!isSim){act.appendChild(bigBtn(t("exo.recommencer"),t("exo.recommencer_t"),false,restartEx));}
  act.appendChild(bigBtn(isSim?t("exo.retour_resultat"):EXS.ret==="chap"&&chapTh()?t("exo.retour_theme",{nom:themeName(chapTh())}):t("exo.retour_exercices"),"",false,function(){leaveEx();}));
  if(st.ai){$("ex-ai").hidden=false;$("ex-ai-text").textContent=st.ai;}else{$("ex-ai").hidden=true;}
}
function correctEx(){
  var st=EXS.st;
  st.bro=$("ex-bro").value;st.done=true;
  EXS.e.subs.forEach(function(s,i){  /* v16 (03h) : les réponses chiffrées pas encore comptées */
    var a=trim($("in-"+i)?$("in-"+i).value:st.a[i]);
    if(s.k==="num"&&a!==""&&!exCompte(EXS.e,i))exNoter(EXS.e,i,numOk(s,parseNum(a)));
  });
  stopTimer();saveEx();
  $("ex-bro").disabled=true;
  renderSubs();renderExFoot();renderExAsk();showTime();$("ex-time").hidden=false;
  try{$("ex-summary").scrollIntoView(true);}catch(e){}
}
function restartEx(){
  var id=EXS.e.id,ret=EXS.ret;
  stopTimer();
  delete EXQA[id];exReset(id);
  EX[id]={a:{},g:{},bro:"",t:0,done:false,ai:""};
  saveEx();openEx(id,ret);
}
function leaveEx(){
  if(EXS){
    if(EXS.aiCtl){try{EXS.aiCtl.abort();}catch(e){}}
    if(EXS.qa&&EXS.qa.ctl){try{EXS.qa.ctl.abort();}catch(e){}}
    stopTimer();
    if(!EXS.st.done){EXS.st.bro=$("ex-bro").value;}
    saveEx();
  }
  if(EXS&&EXS.e.id.indexOf("sim-")===0&&SIM&&SIM.sub){renderSimRes();show("simres");return;}
  if(EXS&&EXS.ret==="chap"&&chapTh()){openChap(chapTh());return;}
  renderExList();show("exlist");
}
/* La copie et sa correction de référence, pour Claude ou, sans l'aide de Claude, pour une autre IA (12h) */
function corrMessage(){
  var e=EXS.e,st=EXS.st,lines=[],n,s,a,ref;
  for(n=0;n<e.subs.length;n++){
    s=e.subs[n];a=trim(st.a[n]);
    ref=refText(s);
    lines.push(t("exo.msg_q",{n:n+1,niv:blocOn("maitrise")&&s.n?" ("+maiNom(s.n)+")":"",q:s.q,a:a||t("exo.msg_vide"),ref:ref}));
  }
  return t("exo.msg_corps",{instr:CORR_INSTR,regles:rulesFor(e.th,e.b,!!e.tl),titre:e.t,ctx:e.ctx,lignes:lines.join("\n\n")});
}
function askCorrection(){
  if(!SAMPLE||EXS.aiBusy)return;
  var msg=corrMessage();
  var out=$("ex-ai-text"),note=$("ex-ai-note"),stop=$("b-exai-stop"),ctl=(typeof AbortController!=="undefined")?new AbortController():null;
  var opts={modelTier:AI.niveau,effort:AI.effort,onText:function(u){out.textContent=u.text;}};
  if(ctl)opts.signal=ctl.signal;
  EXS.aiBusy=true;EXS.aiCtl=ctl;
  $("ex-ai").hidden=false;out.textContent=t("exo.je_corrige");note.textContent="";stop.hidden=false;
  var mine=EXS;
  SAMPLE([{role:"user",content:msg}],opts).then(function(res){
    mine.aiBusy=false;mine.aiCtl=null;stop.hidden=true;
    out.textContent=res.text;mine.st.ai=res.text;saveEx();
    note.textContent=t(res.truncated?"exo.rep_coupee":"exo.avis_claude");
  },function(err){
    mine.aiBusy=false;mine.aiCtl=null;stop.hidden=true;
    var code=err&&err.code;
    if(err&&err.text){out.textContent=err.text;}else{out.textContent=mine.st.ai||"";if(!mine.st.ai)$("ex-ai").hidden=true;}
    if(code==="cancelled")return;
    if(ASK_GONE[code]){SAMPLE=null;renderExFoot();renderExAsk();return;}
    note.textContent=ASK_ERR[code]||ASK_ERR.upstream_error;
    $("ex-ai").hidden=false;
  });
}

/* ---------- Événements ---------- */
$("b-mark").addEventListener("click",function(){toggleMark(S.list[S.i].id);updateMark();});
$("b-next").addEventListener("click",nextQ);
$("b-explain").addEventListener("click",askFirst);
$("c-ex").addEventListener("click",function(){ask(t("exo.ask_exemple"),S.ai.turns.length===0);});
$("c-why").addEventListener("click",function(){ask(t("exo.ask_pourquoi"),S.ai.turns.length===0);});
$("b-stop").addEventListener("click",function(){if(S.ai&&S.ai.ctl){try{S.ai.ctl.abort();}catch(e){}}});
$("aform").addEventListener("submit",function(ev){
  ev.preventDefault();
  var v=trim($("ainput").value);
  if(!v)return;
  $("ainput").value="";
  ask(v,S.ai.turns.length===0);
});
$("b-home").addEventListener("click",goBack);
$("cf-sure").addEventListener("click",function(){confChoisi("sure");});
$("cf-hes").addEventListener("click",function(){confChoisi("hes");});
$("cf-guess").addEventListener("click",function(){confChoisi("guess");});
$("b-pause-ok").addEventListener("click",function(){$("pause").hidden=true;});
/* Confiance au clavier (v17.4, demande de l'auteur du 8 nov. : sur Mac, pas de pavé numérique) : H au hasard, J j'hésite, S sûr, dans l'ordre
   affiché ; 1, 2 et 3 marchent toujours. Aucune de ces lettres n'est une réponse (A à D) ni le jugement du rappel libre (O, N). */
var CONF_TOUCHES=(function(){var l=t("clavier.conf"),o={"1":"guess","2":"hes","3":"sure"};o[l.charAt(0)]="guess";o[l.charAt(1)]="hes";o[l.charAt(2)]="sure";return o;})();  /* lettres par langue : table clavier.conf (fr hjs, en gus) */
var RL_TOUCHES=t("clavier.oui_non");  /* rappel libre : oui, non (fr on, en yn) */
function confTouche(k){return CONF_TOUCHES.hasOwnProperty(k)?CONF_TOUCHES[k]:null;}
/* Clavier sur le quiz : A-D pour répondre, H J S (ou 1-3) pour la confiance, Entrée pour continuer */
document.addEventListener("keydown",function(ev){
  if($("quiz").hidden||!S||ev.ctrlKey||ev.metaKey||ev.altKey)return;
  var tg=ev.target&&ev.target.tagName;if(tg==="INPUT"||tg==="TEXTAREA"||tg==="SELECT")return;
  var k=(ev.key||"").toLowerCase(),pos="abcd".indexOf(k);
  if(S.rl&&!S.locked){  /* rappel libre (03b) : pas de choix à prendre au clavier, seulement la confiance */
    if(S.rl.phase==="conf"&&confTouche(k)){ev.preventDefault();rappelConf(confTouche(k));}
    else if(S.rl.phase==="juge"&&(k===RL_TOUCHES.charAt(0)||k===RL_TOUCHES.charAt(1))){ev.preventDefault();rappelJuger(k===RL_TOUCHES.charAt(0));}  /* commentaire de l'auteur, 1er nov. : O oui, juste ; N non, raté */
    return;
  }
  if(!S.locked&&S.vu===false){  /* choix cachés (v16, 03b) : Entrée ou Espace les montre, rien d'autre avant */
    if((k==="enter"||k===" ")&&tg!=="BUTTON"&&tg!=="A"&&tg!=="SUMMARY"){ev.preventDefault();choixVoir();}
    return;
  }
  var itq=S.list[S.i];if(!S.locked&&itq&&(itq.t==="associer"||itq.t==="ordonner"))return;  /* v13.4 : leurs propres contrôles (03g) */
  if(!S.locked&&pos>=0&&pos<S.perm.length){ev.preventDefault();var o=S.perm[pos];if(confDemandee()){selectOpt(o);}else{choose(o);}return;}
  if(!S.locked&&confDemandee()&&S.sel!==null&&confTouche(k)){ev.preventDefault();choose(S.sel,confTouche(k));return;}
  if(S.locked&&k==="enter"&&!$("b-next").hidden){
    var t=ev.target;if(t===$("b-next")||(t&&t.closest&&t.closest("#ask")))return;
    ev.preventDefault();nextQ();
  }
});
$("b-again").addEventListener("click",function(){
  var prev=S,first=prev.list[0];
  if(prev.srs){if(!startDaily()){renderHome();show("home");}return;}
  if(prev.label===t("core.serie_rapide")){startQuick();return;}
  var oneCas=first.cas&&prev.list.every(function(x){return x.cas===first.cas;});
  start(oneCas?prev.list.slice():shuffle(prev.list),prev.label);
});
$("b-redo").addEventListener("click",function(){
  var seenR={},ids=[];
  S.ans.forEach(function(a){if(!a.ok&&!seenR[a.id]){seenR[a.id]=1;ids.push(BYID[a.id]);}});
  start(shuffle(ids),t("core.mes_erreurs"));
});
$("b-exfilter").addEventListener("click",function(){exFilter=!exFilter;renderExList();});
$("ex-mode-guide").addEventListener("click",function(){if(!EXS||exGuide())return;save(KEXMODE,"guide");renderSubs();renderExFoot();});
$("ex-mode-exam").addEventListener("click",function(){if(!EXS||!exGuide())return;save(KEXMODE,"exam");renderSubs();renderExFoot();});
$("b-exg-prev").addEventListener("click",function(){if(EXS)exAller(EXS.gi-1);});
$("b-exg-next").addEventListener("click",function(){if(EXS)exAller(EXS.gi+1);});
$("b-exmark").addEventListener("click",function(){toggleMark("ex:"+EXS.e.id);updateExMark();});
$("b-exai-stop").addEventListener("click",function(){if(EXS&&EXS.aiCtl){try{EXS.aiCtl.abort();}catch(e){}}});
$("ex-bro").addEventListener("input",function(){if(EXS&&!EXS.st.done){EXS.st.bro=$("ex-bro").value;saveExSoon();}});
window.addEventListener("pagehide",function(){if(EXS){saveEx();}});

/* Le démarrage est à la fin de 12-parcours.js */
