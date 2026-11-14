/* ---------- Répétition espacée : FSRS-6 (formules et paramètres par défaut de ts-fsrs 5.4.2) ---------- */
var FW=[0.212,1.2931,2.3065,8.2956,6.4133,0.8334,3.0194,0.001,1.8722,0.1666,0.796,1.4835,0.0614,0.2629,1.6483,0.6014,1.8729,0.5425,0.0912,0.0658,0.1542];
function r8(x){return Math.round(x*1e8)/1e8;}
function clampN(v,a,b){return Math.min(Math.max(v,a),b);}
var F_DECAY=-FW[20],F_FACTOR=r8(Math.exp(Math.log(0.9)/F_DECAY)-1),F_RET=0.9;
function fR(t,s){return r8(Math.pow(1+F_FACTOR*t/s,F_DECAY));}
function fD0(g){return r8(FW[4]-Math.exp((g-1)*FW[5])+1);}
function fNextD(d,g){var nd=d+r8(-FW[6]*(g-3)*(10-d)/9);return clampN(r8(FW[7]*fD0(4)+(1-FW[7])*nd),1,10);}
function fRecallS(d,s,r,g){var hp=g===2?FW[15]:1,eb=g===4?FW[16]:1;return r8(clampN(s*(1+Math.exp(FW[8])*(11-d)*Math.pow(s,-FW[9])*(Math.exp((1-r)*FW[10])-1)*hp*eb),0.001,36500));}
function fForgetS(d,s,r){return r8(clampN(FW[11]*Math.pow(d,-FW[12])*(Math.pow(s+1,FW[13])-1)*Math.exp((1-r)*FW[14]),0.001,36500));}
function fShortS(s,g){var sinc=Math.pow(s,-FW[19])*Math.exp(FW[17]*(g-3+FW[18])),m=g>=2?Math.max(sinc,1):sinc;return r8(clampN(s*m,0.001,36500));}
/* st : {d,s} ou null (jamais vue) ; t : jours entiers depuis la dernière révision ; g : 1 à revoir, 2 difficile, 3 bien, 4 facile */
function fNext(st,t,g){
  if(!st)return {d:clampN(fD0(g),1,10),s:Math.max(FW[g-1],0.1)};
  var r=fR(t,st.s),ns;
  if(t===0){ns=fShortS(st.s,g);}
  else if(g===1){ns=clampN(r8(st.s/Math.exp(FW[17]*FW[18])),0.001,fForgetS(st.d,st.s,r));}
  else{ns=fRecallS(st.d,st.s,r,g);}
  return {d:fNextD(st.d,g),s:ns};
}
function fIvl(s){var im=r8((Math.pow(F_RET,1/F_DECAY)-1)/F_FACTOR);return Math.min(Math.max(1,Math.round(s*im)),36500);}

/* ---------- Jours (calendrier local) ---------- */
var MOIS=["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."],JOURS=["dim.","lun.","mar.","mer.","jeu.","ven.","sam."];
function dayOf(ts){var d=new Date(ts);return Math.round(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5);}
function today(){return dayOf(Date.now());}
function pad2(n){return (n<10?"0":"")+n;}
function dayFromISO(s){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||"");return m?Math.round(Date.UTC(+m[1],+m[2]-1,+m[3])/864e5):null;}
function isoOfDay(n){var d=new Date(n*864e5);return d.getUTCFullYear()+"-"+pad2(d.getUTCMonth()+1)+"-"+pad2(d.getUTCDate());}
function fmtDay(n){var d=new Date(n*864e5);return JOURS[d.getUTCDay()]+" "+d.getUTCDate()+" "+MOIS[d.getUTCMonth()];}
function inDays(n){var td=today();return n<=td?t("srs.aujourdhui"):n===td+1?t("srs.demain"):tn("srs.dans_jours",n-td,{d:fmtDay(n)});}

/* ---------- État par matière : local d'abord, synchronisé avec le compte quand c'est possible ---------- */
/* Réglages du bloc séance du jour (recette) : DAILY_MAX questions au plus, NEW_BASE nouvelles par jour sans date d'examen,
   une question ratée revient REPRISE_ECART questions plus loin, REPRISE_MAX fois au plus. Chargés par activate(). */
var SRS,SRS_KEY,SRS_SET={},DAILY_MAX=20,NEW_BASE=10,REPRISE_ECART=4,REPRISE_MAX=3;
function srsEmpty(){return {v:1,items:{},days:{},exam:null,examAt:0,newd:{day:0,n:0}};}
function srsLoad(){
  SRS_KEY=MAT.pre+"srs";SRS_SET={};
  var o=load(SRS_KEY,null);
  SRS=(o&&typeof o==="object"&&o.items&&typeof o.items==="object")?o:srsEmpty();
  if(!SRS.days||typeof SRS.days!=="object")SRS.days={};
  if(!SRS.newd)SRS.newd={day:0,n:0};
  pool().forEach(function(it){SRS_SET[it.id]=true;});
  CHAIN={start:0,last:0,shown:false};
  srsSyncPull(true);
}
function srsSave(){save(SRS_KEY,SRS);srsPushSoon();iphPlusTard();}  /* iphPlusTard : widgets de l'app iPhone (12k) */
function examDay(){return SRS&&SRS.exam?dayFromISO(SRS.exam):null;}
function srsSeen(){var r=[],id;for(id in SRS.items){if(SRS.items.hasOwnProperty(id)&&SRS_SET[id])r.push(id);}return r;}
function srsUnseen(){return pool().filter(function(it){return !SRS.items[it.id];});}
function srsRnow(id,day){var it=SRS.items[id];if(!it)return 0;return fR(Math.max(0,(day===undefined?today():day)-it.last),it.s);}
/* Avec un examen dont le programme est choisi (v10, examPerim) : seulement ses thèmes. Le reste attend l'examen passé. */
function srsAVoir(){var P=examPerim();return srsUnseen().filter(function(it){return perimDans(P,it.th);});}
function srsDue(){
  var td=today(),P=examPerim();
  return srsSeen().filter(function(id){return SRS.items[id].due<=td&&perimDans(P,BYID[id].th);}).sort(function(a,b){return srsRnow(a)-srsRnow(b);});
}
function srsNewPerDay(){
  var unseen=srsAVoir().length,ex=examDay(),td=today();
  if(ex!==null&&ex>td){return Math.min(unseen,Math.max(NEW_BASE,Math.ceil(unseen/Math.max(1,ex-td-1))));}
  return Math.min(unseen,NEW_BASE);
}
function srsNewLeft(){var td=today(),used=(SRS.newd&&SRS.newd.day===td)?SRS.newd.n:0;return Math.max(0,srsNewPerDay()-used);}
/* Entremêler : on alterne les thèmes, en gardant l'ordre d'urgence à l'intérieur de chaque thème */
function interleave(items){
  var groups={},order=[],out=[],k,left=items.length;
  items.forEach(function(it){if(!groups[it.th]){groups[it.th]=[];order.push(it.th);}groups[it.th].push(it);});
  while(left>0){for(k=0;k<order.length;k++){if(groups[order[k]].length){out.push(groups[order[k]].shift());left--;}}}
  return out;
}
function srsPlan(){
  var due=srsDue(),nl=srsNewLeft(),fresh=interleave(shuffle(srsAVoir())).slice(0,nl);
  return {due:due,fresh:fresh.map(function(it){return it.id;})};
}
/* Prochaine échéance après aujourd'hui : {day, n} ou null */
function srsNextDue(){
  var P=examPerim(),vus=srsSeen().filter(function(id){return perimDans(P,BYID[id].th);}),next=null;
  vus.forEach(function(id){var d=SRS.items[id].due;if(next===null||d<next)next=d;});
  if(next===null)return null;
  return {day:next,n:vus.filter(function(id){return SRS.items[id].due===next;}).length};
}
function startDaily(){
  var p=srsPlan(),ids=p.due.slice(0,DAILY_MAX);
  ids=ids.concat(p.fresh.slice(0,Math.max(0,DAILY_MAX-ids.length)));
  if(!ids.length)return false;
  start(interleave(ids.map(function(id){return BYID[id];})),t("srs.seance"),{srs:true});
  return true;
}
function startAhead(){
  var td=today(),P=examPerim(),ids=srsSeen().filter(function(id){return SRS.items[id].due>td&&perimDans(P,BYID[id].th);}).sort(function(a,b){return srsRnow(a)-srsRnow(b);}).slice(0,15);
  if(!ids.length)return;
  start(interleave(ids.map(function(id){return BYID[id];})),t("srs.avance"),{srs:true});
}

/* Une réponse : met à jour la mémoire de la question. conf : "sure" | "hes" | "guess" | undefined (quiz libre).
   quand : heure de la réponse quand elle a été donnée ailleurs (widget de l'app iPhone, 12k), sinon maintenant. */
function srsGrade(ok,conf){return ok?(conf==="hes"?2:conf==="guess"?1:3):1;}
function srsReview(id,ok,conf,quand){
  if(!SRS||!SRS_SET[id])return null;
  var now=quand||Date.now(),td=dayOf(now),it=SRS.items[id],g=srsGrade(ok,conf);
  var ns=fNext(it?{d:it.d,s:it.s}:null,it?Math.max(0,td-it.last):0,g);
  var due=td+fIvl(ns.s),ex=examDay();
  if(ex!==null&&td<ex){var cap=ex-1;if(cap<=td)cap=ex;if(due>cap)due=Math.max(td+1,cap);}
  var o={d:ns.d,s:ns.s,last:td,due:due,at:now,reps:(it?it.reps:0)+1,lapses:(it?it.lapses:0)+(it&&g===1?1:0),g:g};
  if(!ok&&conf==="sure")o.hc=now;else if(it&&it.hc&&!(ok&&conf==="sure"))o.hc=it.hc;
  if(!it){if(!SRS.newd||SRS.newd.day!==td)SRS.newd={day:td,n:0};SRS.newd.n++;}
  SRS.items[id]=o;
  srsTick(now,td,ok);
  srsSave();
  return o;
}

/* ---------- Temps de travail et pause (24 min de travail, puis 6 min de pause) ----------
   Journal du jour (SRS.days, 180 jours) : n réponses, sec secondes de travail, ok réponses justes,
   v questions déjà vues et r rappel moyen estimé (en millièmes) après la dernière réponse du jour. */
var CHAIN={start:0,last:0,shown:false};
function srsTick(now,td,ok){
  var gap=CHAIN.last?(now-CHAIN.last)/1000:0,dd=SRS.days[td]||{n:0,sec:0};
  if(!CHAIN.last||gap>300){CHAIN.start=now;CHAIN.shown=false;}else{dd.sec+=Math.round(gap);}
  dd.n++;if(ok)dd.ok=(dd.ok||0)+1;
  dd.v=srsSeen().length;dd.r=Math.round(srsRecallAvg(pool().map(function(it){return it.id;}),td)*1000);
  SRS.days[td]=dd;CHAIN.last=now;
  var k;for(k in SRS.days){if(SRS.days.hasOwnProperty(k)&&+k<td-180)delete SRS.days[k];}
}
function pauseDue(){return CHAIN.start&&!CHAIN.shown&&(CHAIN.last-CHAIN.start)>=24*60*1000;}
function streak(){
  var td=today(),d=(SRS.days[td]&&SRS.days[td].n)?td:td-1,n=0;
  while(SRS.days[d]&&SRS.days[d].n){n++;d--;}
  return n;
}
function secPerQ(){var k,n=0,s=0;for(k in SRS.days){if(SRS.days.hasOwnProperty(k)){n+=SRS.days[k].n;s+=SRS.days[k].sec;}}return n>=20&&s>0?Math.max(15,Math.min(90,s/n)):30;}

/* ---------- Synchronisation avec le compte (capacité db, sous-arbre privé data/users/<id>/) ---------- */
var DB=null,UID=null,SYNC={state:"local",busy:false,dirty:false,timer:null,pulled:0};
function srsDoc(){return DB.doc("data/users/"+UID+"/srs_"+MAT.k);}
function clone(o){return JSON.parse(JSON.stringify(o));}
/* Fusion : pour chaque question, la révision la plus récente gagne ; jours : le maximum ; date d'examen : la plus récente modification */
function srsMerge(remote){
  var ch={local:false,remote:!remote},id,k;
  if(!remote||!remote.items)return ch;
  for(id in remote.items){if(remote.items.hasOwnProperty(id)){
    var r=remote.items[id],l=SRS.items[id];
    if(!l||(r.at||0)>(l.at||0)){SRS.items[id]=r;ch.local=true;}
  }}
  for(id in SRS.items){if(SRS.items.hasOwnProperty(id)){
    var rr=remote.items[id];if(!rr||(SRS.items[id].at||0)>(rr.at||0))ch.remote=true;
  }}
  var rd=remote.days||{};
  for(k in rd){if(rd.hasOwnProperty(k)){
    var a=SRS.days[k]||{n:0,sec:0},b=rd[k],m=dayMerge(a,b);
    if(JSON.stringify(m)!==JSON.stringify(a)){SRS.days[k]=m;ch.local=true;}
  }}
  for(k in SRS.days){if(SRS.days.hasOwnProperty(k)){var x=rd[k];if(!x||JSON.stringify(dayMerge(x,SRS.days[k]))!==JSON.stringify(x))ch.remote=true;}}
  if((remote.examAt||0)>(SRS.examAt||0)){SRS.exam=remote.exam||null;SRS.examAt=remote.examAt;ch.local=true;}
  else if((SRS.examAt||0)>(remote.examAt||0))ch.remote=true;
  var rn=remote.newd;
  if(rn&&SRS.newd&&rn.day===SRS.newd.day&&rn.n>SRS.newd.n){SRS.newd={day:rn.day,n:rn.n};ch.local=true;}
  else if(rn&&(!SRS.newd||rn.day>SRS.newd.day)){SRS.newd={day:rn.day,n:rn.n};ch.local=true;}
  return ch;
}
/* Une journée vue sur deux appareils : le plus grand de chaque compteur ; le rappel de l'appareil qui a le plus répondu */
function dayMerge(a,b){
  var m={n:Math.max(a.n||0,b.n||0),sec:Math.max(a.sec||0,b.sec||0)},k;
  ["ok","v"].forEach(function(f){if(a[f]!==undefined||b[f]!==undefined)m[f]=Math.max(a[f]||0,b[f]||0);});
  k=(b.n||0)>(a.n||0)?b:a;if(k.r!==undefined)m.r=k.r;else if(a.r!==undefined)m.r=a.r;else if(b.r!==undefined)m.r=b.r;
  return m;
}
function srsSyncPull(force){
  if(!DB||!UID||!MAT||!MAT.ready||!SRS)return;
  var now=Date.now();if(!force&&now-SYNC.pulled<60000)return;
  SYNC.pulled=now;
  suiviPull();
  var k=MAT.k;
  srsDoc().get().then(function(snap){
    if(!MAT||MAT.k!==k)return;
    var ch=srsMerge(snap.exists?clone(snap.data()):null);
    SYNC.state="sync";
    if(ch.local){save(SRS_KEY,SRS);if(!$("home").hidden)renderHome();if(!$("hub").hidden)renderHub();if(!$("chap").hidden&&chapTh())renderChap();}
    if(ch.remote){srsPush();}else{renderSyncStatus();}
  },function(){SYNC.state="err";renderSyncStatus();});
}
function srsPush(){
  if(!DB||!UID||!SRS||!MAT||!MAT.ready)return;
  if(SYNC.busy){SYNC.dirty=true;return;}
  SYNC.busy=true;SYNC.dirty=false;
  var ref=srsDoc(),body=clone(SRS);
  ref.set(body).then(function(){
    SYNC.busy=false;SYNC.state="sync";renderSyncStatus();
    if(SYNC.dirty)srsPush();
  },function(){SYNC.busy=false;SYNC.state="err";renderSyncStatus();});
}
function srsPushSoon(){if(!DB||!UID)return;if(SYNC.timer)clearTimeout(SYNC.timer);SYNC.timer=setTimeout(function(){SYNC.timer=null;srsPush();},3000);}
function renderSyncStatus(){
  var n=$("sync-st");if(!n)return;
  n.textContent=SYNC.state==="sync"?t("srs.sync_ok")
    :SYNC.state==="err"?t("srs.sync_err")
    :t("srs.sync_local");
}
/* Le profil (12) est prévenu dans tous les cas : compte joignable ou non */
function initSync(){
  try{
    if(!(window.claude&&window.claude.use))return;
    Promise.all([window.claude.use("db"),window.claude.use("user")]).then(function(r){
      var db=r[0],u=r[1];
      if(!db||typeof db.doc!=="function"||!u||typeof u.id!=="function"){profilCompte(false);return;}
      return u.id().then(function(id){if(!id){profilCompte(false);return;}DB=db;UID=id;srsSyncPull(true);profilCompte(true);});
    }).then(null,function(){profilCompte(false);});
  }catch(e){}
}
document.addEventListener("visibilitychange",function(){
  if(document.hidden){if(SYNC.timer){clearTimeout(SYNC.timer);SYNC.timer=null;srsPush();}suiviFlush();}
  else{srsSyncPull(false);}
});
initSync();

/* ---------- Accueil : séance du jour et progression ---------- */
function srsRecallAvg(ids,day){if(!ids.length)return 0;var s=0;ids.forEach(function(id){s+=srsRnow(id,day);});return s/ids.length;}
function pct(x){return t("srs.pct",{n:Math.round(x*100)});}
function renderToday(){
  var box=$("today");clear(box);
  if(!MAT.ready)return;
  var p=srsPlan(),nd=p.due.length,nn=p.fresh.length,tot=Math.min(DAILY_MAX,nd+nn),seen=srsSeen().length,P=examPerim();
  if(tot>0){
    /* Ce que contient cette séance (au plus DAILY_MAX questions), pas tout ce qui reste à voir */
    var rv=Math.min(nd,tot),nv=tot-rv,bits=[];
    if(rv)bits.push(t("srs.a_revoir",{n:rv}));
    if(nv)bits.push(tn("srs.nouvelles",nv));
    var mins=Math.max(1,Math.round(tot*secPerQ()/60));
    box.appendChild(bigBtn(t("srs.seance"),bits.join(" · ")+t("srs.environ",{n:mins}),true,function(){BACK="home";startDaily();}));
    if(nd+nn>DAILY_MAX)box.appendChild(el("p","src today-quoi",t("srs.restera",{n:nd+nn-DAILY_MAX})));
  }else{
    var nx=srsNextDue(),f=el("div","fait");
    f.appendChild(el("p","fait-t",t("srs.faite")));
    f.appendChild(el("p","src",nx===null?t("srs.rien"):t("srs.prochaine",{quand:inDays(nx.day),q:tn("srs.nb_question",nx.n)})));
    box.appendChild(f);
    if(seen)box.appendChild(bigBtn(t("srs.prendre_avance"),t("srs.avance_sous"),false,function(){BACK="home";startAhead();}));
  }
  if(P){var hors=P.de-P.n,pp=el("p","src today-perim",nb(t("srs.centree",{nom:P.x.nom,themes:perimNoms(P).join(", "),suite:hors>1?t("srs.autres_n",{n:hors}):t("srs.autre_un")})));pp.id="today-perim";box.appendChild(pp);}
}
/* Progrès (12b) : la mémoire par thème, puis les révisions prévues des 7 prochains jours */
function renderProgress(){
  var box=$("progress");
  if(!MAT.ready)return;
  var td=today(),ex=examDay();
  /* Par thème */
  var tr=el("div","ev-themes");tr.appendChild(el("h2",null,t("srs.par_theme")));
  var card=el("div","pcard"),pr=el("div","prow");
  THEMES.forEach(function(t){
    var ids=pool().filter(function(x){return x.th===t.k;}).map(function(x){return x.id;}),v=srsRecallAvg(ids);
    var row=el("div","row"),rl=el("div","rl");
    rl.appendChild(el("span","",t.n));rl.appendChild(el("b","",pct(v)));
    var bar=el("div","bar"),fill=el("i");fill.style.width=Math.round(v*100)+"%";bar.appendChild(fill);
    row.appendChild(rl);row.appendChild(bar);pr.appendChild(row);
  });
  card.appendChild(pr);tr.appendChild(card);box.appendChild(tr);
  /* Prévision 7 jours */
  var fr=el("div","ev-prev");fr.appendChild(el("h2",null,t("srs.prevues")));
  var c2=el("div","pcard"),p2=el("div","prow"),counts=[],mx=1,d;
  for(d=0;d<7;d++){var c=srsSeen().filter(function(id){var du=SRS.items[id].due;return d===0?du<=td:du===td+d;}).length;counts.push(c);if(c>mx)mx=c;}
  var ch=el("div","fc");
  counts.forEach(function(c,i){
    var col=el("div","fcol");
    col.appendChild(el("span","fn",String(c)));
    var bar=el("span","fb2");bar.style.height=Math.round(c/mx*64)+"px";if(!c)bar.className+=" zero";col.appendChild(bar);
    col.appendChild(el("span","fd",i===0?t("srs.auj"):i===1?t("srs.dem"):JOURS[new Date((td+i)*864e5).getUTCDay()]));
    ch.appendChild(col);
  });
  p2.appendChild(ch);
  if(ex!==null&&ex>td)p2.appendChild(el("p","src",nb(t("srs.sans_reviser",{d:fmtDay(ex),p:pct(srsRecallAvg(pool().map(function(it){return it.id;}),ex))}))));
  c2.appendChild(p2);fr.appendChild(c2);box.appendChild(fr);
}
function kvItem(k,v){var d=el("div","kvi");d.appendChild(el("span","kk",k));d.appendChild(el("b","kn",v));return d;}
function applyExam(iso){
  var d=dayFromISO(iso);
  SRS.exam=d===null?null:isoOfDay(d);SRS.examAt=Date.now();
  /* Recaler les échéances qui tombent après l'examen */
  var td=today(),id;
  if(d!==null&&d>td){for(id in SRS.items){if(SRS.items.hasOwnProperty(id)){var it=SRS.items[id],cap=Math.max(td+1,d-1);if(it.due>cap)it.due=cap;}}}
  srsSave();
}
function themeRecall(k){var ids=pool().filter(function(x){return x.th===k;}).map(function(x){return x.id;});return srsRecallAvg(ids);}
