
/* ---------- Simulation en conditions réelles (chrono, sans aide, correction à la fin) ----------
   Réglages du bloc simulation de la recette : durée, nombre de questions tirées de la réserve (simulation.md),
   exercice servant de cas pratique, points du quiz et du cas, textes de l'écran de départ. État : <préfixe>sim. */
var KSIM="qfcc2.sim",SIM_DUR=3600,SIM_QN=6,SIM_CAS="e11",SIMB=null;
var SIM_T=null,simArm=false,simArmT=null,simQuitArm=false,simQuitT=null,simBq=-1,simSaveT=null;
var SIM=null;
/* Notes des simulations rendues (v2.4, écran Évolution) : [{at, note, sur, prov}], une par simulation, mise à jour quand
   la copie du cas est notée (prov : notes du cas encore à donner). Clé <préfixe>simh, suivie sur le compte (07b). */
var KSIMH="qfcc2.simh",SIMH=[];
function simNoter(){
  if(!SIM||!SIM.sub||!SIMB)return;
  var e=EXBY[SIM.cas],st=EX[simExId()],sc=st?exScore(e,st):{pts:0,max:0,unrated:0},pq=SIMB.points.quiz,pc=SIMB.points.cas,
      note=simQuizScore()/SIM.ids.length*pq+(sc.max?sc.pts/sc.max:0)*pc,h={at:SIM.subAt,note:Math.round(note*10)/10,sur:pq+pc,prov:sc.unrated?1:0},i;
  for(i=0;i<SIMH.length;i++){
    if(SIMH[i].at===h.at){if(JSON.stringify(SIMH[i])!==JSON.stringify(h)){SIMH[i]=h;save(KSIMH,SIMH);}return;}
  }
  SIMH.push(h);SIMH.sort(function(a,b){return a.at-b.at;});save(KSIMH,SIMH);
}
function simhValide(h){return !!h&&typeof h.at==="number"&&typeof h.note==="number"&&typeof h.sur==="number"&&h.sur>0;}
/* Appelé par activate() : réglages de la matière, puis état sauvegardé (rendu automatique si le chrono a expiré) */
function simLoad(){
  SIMB=MAT.blocs.simulation||null;
  SIM=null;
  if(!SIMB)return;
  SIM_DUR=SIMB.duree_min*60;SIM_QN=SIMB.questions;SIM_CAS=SIMB.cas;
  SIM=load(KSIM,null);
  if(!simValid(SIM)){SIM=null;}
  if(SIM){ensureSimEx(SIM.cas);if(!SIM.sub&&simLeft()<=0){submitSim(true,true);}}
}
function dureeTxt(min){return min%60===0?t("sim.duree_h",{n:min/60}):t("sim.duree_min",{n:min});}
function simValid(s){
  var n;
  if(!s||!(s.ids instanceof Array)||!s.ids.length||!s.cas||!EXBY[s.cas]||typeof s.end!=="number"||!s.perm||!s.pick||!s.ca)return false;
  for(n=0;n<s.ids.length;n++){if(!BYID[s.ids[n]]||!(s.perm[s.ids[n]] instanceof Array))return false;}
  return true;
}
if(!simValid(SIM)){SIM=null;}
function saveSim(){save(KSIM,SIM);}
function saveSimSoon(){if(simSaveT)clearTimeout(simSaveT);simSaveT=setTimeout(saveSim,300);}
function simExId(){return "sim-"+SIM.cas;}
function ensureSimEx(cas){
  var e=EXBY[cas],id="sim-"+cas,c={},p;
  if(!EXBY[id]){
    for(p in e){if(e.hasOwnProperty(p)){c[p]=e[p];}}
    c.id=id;c.t=t("sim.titre_ex",{t:e.t});c.min=SIMB?SIMB.duree_min:60;
    EXBY[id]=c;
  }
  return EXBY[id];
}
function simLeft(){return Math.max(0,Math.ceil((SIM.end-Date.now())/1000));}
function simAnswered(){var c=0,n;for(n=0;n<SIM.ids.length;n++){if(SIM.pick[SIM.ids[n]]!==undefined)c++;}return c;}
function simCasAnswered(){return exAnswered(EXBY[SIM.cas],{a:SIM.ca});}

/* écran de départ : textes de la recette */
function openSimStart(){
  var min=SIMB.duree_min,ul;
  $("ss-eyebrow").textContent=t("sim.eyebrow",{d:dureeTxt(min)});
  $("ss-title").textContent=SIMB.nom;
  $("ss-lead").textContent=SIMB.intro||"";
  [["ss-rules",SIMB.regles],["ss-prog",SIMB.programme]].forEach(function(x){
    ul=$(x[0]);clear(ul);(x[1]||[]).forEach(function(t){ul.appendChild(richText(el("li"),t));});
    ul.hidden=ul.previousElementSibling.hidden=!(x[1]&&x[1].length);
  });
  $("ss-go-s").textContent=t("sim.chrono",{n:min});
  $("ss-note").textContent=SIMB.note||"";$("ss-note").hidden=!SIMB.note;
  show("simstart");
}
function startSim(){
  var ths=THEMES.map(function(t){return t.k;}),rest=QX.slice(),sel=[],perm={},ids=[],now=Date.now(),p;
  ths.forEach(function(t){
    var c=rest.filter(function(x){return x.th===t;}),q;
    if(c.length){q=pickN(c,1)[0];sel.push(q);rest.splice(rest.indexOf(q),1);}
  });
  while(sel.length<SIM_QN&&rest.length){p=pickN(rest,1)[0];sel.push(p);rest.splice(rest.indexOf(p),1);}
  sel=shuffle(sel);
  sel.forEach(function(it){
    var o=[],n;
    for(n=0;n<it.o.length;n++){o.push(n);}
    perm[it.id]=it.fixed?o:shuffle(o);ids.push(it.id);
  });
  ensureSimEx(SIM_CAS);
  delete EX["sim-"+SIM_CAS];save(KEX,EX);
  SIM={v:2,start:now,end:now+SIM_DUR*1000,dur:SIM_DUR,ids:ids,perm:perm,pick:{},flag:{},cas:SIM_CAS,ca:{},bro:"",qi:0,view:"quiz",sub:false,subAt:0,auto:false};
  saveSim();
  openSim();
}
function resumeSim(){
  if(!SIM||SIM.sub)return;
  if(simLeft()<=0){submitSim(true);return;}
  openSim();
}

/* épreuve */
function openSim(){
  var e=EXBY[SIM.cas];
  simArm=false;simQuitArm=false;simBq=-1;
  $("sc-meta").textContent=nb(t("sim.cas_meta",{q:tn("cours.nb_question",e.subs.length),min:e.min}));
  $("sc-title").textContent=e.t;
  ctxRendre($("sc-ctx"),e.ctx);
  annexeReset("b-scbareme","scbareme",e.b);
  $("sc-bro").value=SIM.bro||"";
  renderSimCas();
  show("sim");
  setSimView(SIM.view==="cas"?"cas":"quiz");
  startSimTimer();
}
function setSimView(v){
  SIM.view=v;
  $("sim-quiz").hidden=(v!=="quiz");$("sim-cas").hidden=(v!=="cas");
  $("t-quiz").className="tab"+(v==="quiz"?" sel":"");$("t-cas").className="tab"+(v==="cas"?" sel":"");
  renderSimQuiz();
  renderSimEnd();saveSim();
  try{window.scrollTo(0,0);}catch(e){}
}
function renderSimQuiz(){
  var ids=SIM.ids,i=SIM.qi,it=BYID[ids[i]],g=$("qgrid"),box=$("sq-opts"),cx=$("sq-ctx");
  clear(g);
  ids.forEach(function(id,k){
    var has=(SIM.pick[id]!==undefined),b=el("button","qn"+(has?" done":"")+(SIM.flag[id]?" flag":"")+(k===i?" cur":""),String(k+1));
    b.type="button";
    b.setAttribute("aria-label",t("sim.q_aria",{n:k+1})+(has?t("sim.repondue"):t("sim.sans_rep"))+(SIM.flag[id]?t("sim.marquee"):""));
    b.addEventListener("click",function(){SIM.qi=k;saveSim();renderSimQuiz();try{window.scrollTo(0,0);}catch(e){}});
    g.appendChild(b);
  });
  $("sq-meta").textContent=t("sim.q_sur",{i:i+1,n:ids.length});
  if(it.ctx){ctxRendre(cx,it.ctx);cx.hidden=false;}else{cx.hidden=true;}
  $("sq-text").textContent=nb(it.q);
  if(simBq!==i){annexeReset("b-sqbareme","sqbareme",it.b);simBq=i;}
  $("b-sqbareme").hidden=!(it.b&&MAT.annexe);
  clear(box);
  SIM.perm[it.id].forEach(function(orig,pos){
    var on=(SIM.pick[it.id]===orig),b=el("button","opt"+(on?" sel":""));b.type="button";
    b.setAttribute("aria-pressed",on?"true":"false");
    b.appendChild(el("span","k",String.fromCharCode(65+pos)));
    b.appendChild(el("span","x",nb(it.o[orig])));
    b.addEventListener("click",function(){
      if(SIM.pick[it.id]===orig){delete SIM.pick[it.id];}else{SIM.pick[it.id]=orig;}
      saveSim();renderSimQuiz();renderSimEnd();
    });
    box.appendChild(b);
  });
  var fl=!!SIM.flag[it.id];
  $("b-sqflag").textContent=fl?t("sim.flag_on"):t("sim.flag_off");
  $("b-sqflag").setAttribute("aria-pressed",fl?"true":"false");
  $("b-sqprev").disabled=(i===0);
  $("b-sqnext-t").textContent=(i===ids.length-1)?t("sim.vers_cas"):t("sim.suivante");
}
function renderSimCas(){
  var box=$("sc-subs"),e=EXBY[SIM.cas];
  clear(box);
  e.subs.forEach(function(s,i){
    var w=el("div","sq"),q=el("div","sqq"),field;
    q.appendChild(el("span","sn",(i+1)+"."));
    q.appendChild(document.createTextNode(nb(s.q)));
    w.appendChild(q);
    if(s.k==="num"){
      var row=el("div","inrow");
      field=el("input","field");field.type="text";field.id="sc-in-"+i;
      field.setAttribute("autocomplete","off");field.setAttribute("autocapitalize","off");field.setAttribute("autocorrect","off");field.setAttribute("spellcheck","false");
      if(!s.neg)field.setAttribute("inputmode","decimal");
      field.setAttribute("aria-label",t("sim.rep_aria",{n:i+1}));
      field.placeholder=s.neg?t("sim.ph_neg"):t("sim.ph_nombre");
      row.appendChild(field);row.appendChild(el("span","unit",s.u||""));
      w.appendChild(row);
    }else{
      field=el("textarea","field");field.id="sc-in-"+i;field.rows=3;
      field.setAttribute("aria-label",t("sim.rep_aria",{n:i+1}));
      field.placeholder=t("sim.ph_texte");
      w.appendChild(field);
    }
    field.value=SIM.ca[i]||"";
    field.addEventListener("input",function(){SIM.ca[i]=field.value;saveSimSoon();renderSimEnd();});
    box.appendChild(w);
  });
}
function renderSimEnd(){
  var e=EXBY[SIM.cas],q=simAnswered(),c=simCasAnswered(),miss=(SIM.ids.length-q)+(e.subs.length-c);
  $("t-quiz").textContent=t("sim.onglet_quiz",{a:q,n:SIM.ids.length});
  $("t-cas").textContent=t("sim.onglet_cas",{a:c,n:e.subs.length});
  $("b-simquit").textContent=simQuitArm?t("sim.abandon_conf"):t("sim.abandonner");
  if(simArm){
    $("b-simsubmit-t").textContent=t("sim.rendre_conf");
    $("b-simsubmit-s").textContent=(miss?tn("sim.reste_vides",miss)+" ":t("sim.tout_rempli")+" ")+t("sim.plus_modifier");
  }else{
    $("b-simsubmit-t").textContent=t("sim.rendre");
    $("b-simsubmit-s").textContent=t("sim.rendre_s",{q:q,n:SIM.ids.length,c:c,m:e.subs.length});
  }
}
function tickSim(){
  if(!SIM||SIM.sub||$("sim").hidden)return;
  var l=simLeft(),t=$("sim-time");
  t.textContent=mmss(l);t.className="score"+(l<=300?" over":"");
  if(l<=0){submitSim(true);}
}
function stopSimTimer(){if(SIM_T){clearInterval(SIM_T);SIM_T=null;}}
function startSimTimer(){stopSimTimer();tickSim();SIM_T=setInterval(tickSim,1000);}
function armSubmit(){
  if(!simArm){
    simArm=true;renderSimEnd();
    if(simArmT)clearTimeout(simArmT);
    simArmT=setTimeout(function(){simArm=false;if(SIM&&!SIM.sub&&!$("sim").hidden)renderSimEnd();},7000);
    return;
  }
  submitSim(false);
}
function armQuit(){
  if(!simQuitArm){
    simQuitArm=true;renderSimEnd();
    if(simQuitT)clearTimeout(simQuitT);
    simQuitT=setTimeout(function(){simQuitArm=false;if(SIM&&!SIM.sub&&!$("sim").hidden)renderSimEnd();},5000);
    return;
  }
  stopSimTimer();SIM=null;drop(KSIM);simQuitArm=false;
  renderHome();show("home");
}

/* rendu et correction */
function submitSim(auto,quiet){
  if(!SIM||SIM.sub)return;
  stopSimTimer();
  if(!$("sim").hidden){SIM.bro=$("sc-bro").value;}
  SIM.sub=true;SIM.subAt=Math.min(Date.now(),SIM.end);SIM.auto=!!auto;
  SIM.ids.forEach(function(id){if(SIM.pick.hasOwnProperty(id))cptNoter(id,SIM.pick[id]===BYID[id].c,null,false,SIM.subAt);setMiss(id,SIM.pick[id]!==BYID[id].c);});  /* v16 : compteurs (03h) */
  ensureSimEx(SIM.cas);
  EX[simExId()]={a:SIM.ca,g:{},bro:SIM.bro||"",t:Math.round((SIM.subAt-SIM.start)/1000),done:true,ai:""};
  save(KEX,EX);saveSim();simNoter();
  simArm=false;
  if(!quiet){renderSimRes();show("simres");}
}
function f1(x){return fmtNombre(Math.round(x*10)/10,{maximumFractionDigits:1,useGrouping:false});}
function simQuizScore(){
  var right=0,n;
  for(n=0;n<SIM.ids.length;n++){if(SIM.pick[SIM.ids[n]]===BYID[SIM.ids[n]].c)right++;}
  return right;
}
function renderSimRes(){
  if(!SIM||!SIM.sub)return;
  simNoter();
  var e=EXBY[SIM.cas],st=EX[simExId()]||{a:SIM.ca,g:{},bro:"",t:0,done:true},sc=exScore(e,st),right=simQuizScore(),total=SIM.ids.length,
      used=Math.round((SIM.subAt-SIM.start)/1000),sum=$("sr-sum"),n;
  $("sr-meta").textContent=t("sim.rendue",{u:mmss(used),d:mmss(SIM.dur)})+(SIM.auto?t("sim.auto"):"");
  clear(sum);
  var two=el("div","two"),h1=el("div","half"),h2=el("div","half");
  h1.appendChild(el("p","lab",t("sim.quiz")));h1.appendChild(el("div","big",right+" / "+total));
  h2.appendChild(el("p","lab",t("sim.cas_pratique")));h2.appendChild(el("div","big",scoreText(sc)));
  two.appendChild(h1);two.appendChild(h2);sum.appendChild(two);
  var pq=SIMB.points.quiz,pc=SIMB.points.cas,note=right/total*pq+(sc.max?sc.pts/sc.max:0)*pc;
  sum.appendChild(el("p","",t("sim.note_ind",{n:f1(note),sur:pq+pc,prov:sc.unrated?tn("sim.provisoire",sc.unrated):""})));
  $("sr-note").textContent=SIMB.note_points||t("sim.note_points",{q:pq,c:pc});
  var tb=$("sr-themes");clear(tb);
  THEMES.forEach(function(t){
    var tot=0,ok=0,m,id;
    for(m=0;m<SIM.ids.length;m++){id=SIM.ids[m];if(BYID[id].th===t.k){tot++;if(SIM.pick[id]===BYID[id].c)ok++;}}
    if(!tot)return;
    var row=el("div","row"),rl=el("div","rl");
    rl.appendChild(el("span","",t.n));rl.appendChild(el("b","",ok+" / "+tot));
    var bar=el("div","bar"),fill=el("i");fill.style.width=Math.round(ok/tot*100)+"%";bar.appendChild(fill);bar.style.marginBottom="0";
    row.appendChild(rl);row.appendChild(bar);tb.appendChild(row);
  });
  var cb=$("sr-cas");clear(cb);
  cb.appendChild(el("p","",nb(t("sim.cas_bilan",{t:e.t,r:tn("sim.nb_reponse",exAnswered(e,st)),n:e.subs.length}))));
  cb.appendChild(bigBtn(t("sim.voir_copie"),t("sim.voir_copie_s"),true,function(){openEx(simExId());}));
  var missed=SIM.ids.filter(function(id){return SIM.pick[id]!==BYID[id].c;}),mw=$("sr-missed");
  clear(mw);$("sr-missed-wrap").hidden=(missed.length===0);
  missed.forEach(function(id){
    var it=BYID[id],d=el("div","miss"),pos,pk=SIM.pick[id],goodL="";
    for(pos=0;pos<SIM.perm[id].length;pos++){if(SIM.perm[id][pos]===it.c)goodL=String.fromCharCode(65+pos);}
    if(it.ctx&&!it.cas){var cx=el("div","ctx");ctxRendre(cx,it.ctx);d.appendChild(cx);}  /* énoncé propre à la question (v7.3) */
    d.appendChild(el("div","mq",nb(it.q)));
    var mine=el("p","");
    mine.appendChild(el("span","lab",t("sim.ta_reponse")+" "));
    mine.appendChild(document.createTextNode(pk===undefined?t("sim.aucune"):nb(it.o[pk])));
    d.appendChild(mine);
    var good=el("p","");good.appendChild(el("span","mb",t("sim.bonne")));good.appendChild(document.createTextNode(goodL+" · "+nb(it.o[it.c])));
    d.appendChild(good);
    d.appendChild(el("p","",nb(it.e)));
    d.appendChild(el("p","src",t("sim.source",{s:it.s})));
    mw.appendChild(d);
  });
  var act=$("sr-actions");clear(act);
  if(missed.length){act.appendChild(bigBtn(t("sim.refaire"),t("sim.refaire_s"),false,function(){BACK="home";start(shuffle(missed.map(function(id){return BYID[id];})),t("sim.erreurs"));}));}
  act.appendChild(bigBtn(t("sim.nouvelle"),t("sim.nouvelle_s"),false,openSimStart));
  act.appendChild(bigBtn(t("sim.accueil"),"",false,function(){renderHome();show("home");}));
}
function renderSimHome(){
  var box=$("sim-home"),e;
  clear(box);
  if(!SIMB)return;
  if(SIM&&!SIM.sub){
    e=EXBY[SIM.cas];
    box.appendChild(bigBtn(t("sim.reprendre"),t("sim.reprendre_s",{r:mmss(simLeft()),a:simAnswered(),n:SIM.ids.length,c:simCasAnswered(),m:e.subs.length}),true,resumeSim));
    return;
  }
  box.appendChild(carteMode("simulation",t("sim.carte_meta",{d:dureeTxt(SIMB.duree_min),q:tn("cours.nb_question",SIM_QN)}),openSimStart,SIMB.nom));
  if(SIM&&SIM.sub){
    e=EXBY[SIM.cas];
    var st=EX[simExId()]||{a:SIM.ca,g:{},bro:"",t:0,done:true};
    box.appendChild(bigBtn(t("sim.dernier"),t("sim.dernier_s",{a:simQuizScore(),n:SIM.ids.length,s:scoreText(exScore(e,st))}),false,function(){renderSimRes();show("simres");}));
  }
}

/* branchements */
$("b-simgo").addEventListener("click",startSim);
$("b-simquit").addEventListener("click",armQuit);
$("t-quiz").addEventListener("click",function(){if(SIM&&!SIM.sub)setSimView("quiz");});
$("t-cas").addEventListener("click",function(){if(SIM&&!SIM.sub)setSimView("cas");});
$("b-sqprev").addEventListener("click",function(){if(SIM.qi>0){SIM.qi--;saveSim();renderSimQuiz();try{window.scrollTo(0,0);}catch(e){}}});
$("b-sqnext").addEventListener("click",function(){
  if(SIM.qi<SIM.ids.length-1){SIM.qi++;saveSim();renderSimQuiz();try{window.scrollTo(0,0);}catch(e){}}
  else{setSimView("cas");}
});
$("b-sqflag").addEventListener("click",function(){
  var id=SIM.ids[SIM.qi];
  if(SIM.flag[id]){delete SIM.flag[id];}else{SIM.flag[id]=true;}
  saveSim();renderSimQuiz();
});
$("sc-bro").addEventListener("input",function(){if(SIM&&!SIM.sub){SIM.bro=$("sc-bro").value;saveSimSoon();}});
$("b-simsubmit").addEventListener("click",armSubmit);
document.addEventListener("visibilitychange",function(){if(!document.hidden)tickSim();});
window.addEventListener("pagehide",function(){if(SIM&&!SIM.sub){if(!$("sim").hidden)SIM.bro=$("sc-bro").value;saveSim();}});
