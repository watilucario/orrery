/* ---------- Exigence (v16) : compteurs par question, règle de maîtrise, confiance partout ----------
   Demande de l'auteur (1er nov.) : l'app surévaluait son niveau (une marche se validait juste après une série). Pour chaque
   question, on compte : bonnes réponses (hors « au hasard »), mauvaises, justes « au hasard » à part, justes sans les
   choix (rappel libre, 03b), jours distincts de réussite, et si la dernière réponse était juste.
   Stockage : <préfixe>cpt = {v:1, q:{id: entrée}}, entrée = {d:{appareil:{b, m, h, r, at, l}}, j:[jours de réussite]}.
   b bonnes, m mauvaises, h justes au hasard, r bonnes sans les choix, at heure de la dernière réponse, l dernière juste.
   Chaque appareil compte à part (qfcc2.appareil) : à la fusion (07b, élément cpt:<id>), on garde pour chaque appareil
   son compteur le plus avancé et l'union des jours. Rien ne se perd entre le téléphone et l'ordinateur.
   Avant la v16 : l'entrée « av » est reconstruite depuis la mémoire de révision (répétitions, oublis, dernière note,
   dernier jour) et la liste des erreurs, au premier enregistrement ; avant, elle se calcule à la volée (cptEntree).
   Identifiants : celui de la question (QCM, étape de cas) ; « <exercice>#<n° de question> » pour un exercice ;
   « dr:<catégorie>.<générateur> » pour le calcul mental. Seules les questions du contenu entrent au carnet (12o). */
var KAPPAREIL="qfcc2.appareil",KCPT=null,CPT={v:1,q:{}},KEXC=null,EXC={};
/* Règle par défaut, réglable dans le modèle et dans la recette (blocs.maitrise.exigence) : une question est maîtrisée
   avec au moins « bonnes » bonnes réponses sur « jours » jours, dont « sans_choix » sans les choix quand elle s'y prête,
   « ratio » bonnes pour une mauvaise, et la dernière juste. Une marche QCM : « part » de ses questions maîtrisées.
   Un cas guidé : réussi en entier « cas » jours différents. Un exercice : ses questions réussies « ex_jours » jours. */
var EXIG_DEF={bonnes:3,jours:2,sans_choix:1,ratio:3,part:0.8,cas:2,ex_jours:2};
function exigence(M){
  M=M||MAT;var b=M&&M.blocs&&M.blocs.maitrise,s=(b&&b.exigence)||{},o={},k;
  for(k in EXIG_DEF){if(EXIG_DEF.hasOwnProperty(k))o[k]=typeof s[k]==="number"?s[k]:EXIG_DEF[k];}
  return o;
}
/* Identifiant de l'appareil : sans Math.random (le hasard des séries est réglé par les tests) */
function appareil(){
  var a=load(KAPPAREIL,null),u;
  if(typeof a==="string"&&a)return a;
  try{u=new Uint32Array(2);window.crypto.getRandomValues(u);a="a"+u[0].toString(36)+u[1].toString(36);}
  catch(e){a="a"+Date.now().toString(36)+Math.floor((window.performance?performance.now():0)*1000).toString(36);}
  try{localStorage.setItem(KAPPAREIL,JSON.stringify(a));}catch(e){}
  return a;
}
function cptValide(e){return !!e&&typeof e==="object"&&!!e.d&&typeof e.d==="object"&&e.j instanceof Array;}
function cptCharger(k){
  var o=load(k,null),q={},id;
  if(o&&o.q&&typeof o.q==="object"){for(id in o.q){if(o.q.hasOwnProperty(id)&&cptValide(o.q[id]))q[id]=o.q[id];}}
  return {v:1,q:q};
}
function cptSave(){if(KCPT)save(KCPT,CPT);}
/* Ce que disait l'app avant la v16 : x = SRS.items[id] (reps, lapses, g, last, at), enMiss = dans la liste des erreurs */
function cptDeriver(x,enMiss){
  var c={b:0,m:0,h:0,r:0,at:0,l:0},j=[];
  if(x&&typeof x==="object"){
    var reps=x.reps||0,lap=x.lapses||0;
    if(x.g===1&&reps===1)lap=1;  /* première réponse ratée : pas comptée dans les oublis */
    c.m=lap;c.b=Math.max(0,reps-lap);c.at=x.at||0;c.l=x.g>1?1:0;
    if(x.g===1&&!c.m)c.m=1;
    if(c.l&&typeof x.last==="number")j=[x.last];
  }
  if(enMiss){if(!c.m)c.m=1;c.l=0;}
  if(!c.b&&!c.m)return null;
  return {d:{av:c},j:j};
}
function cptEntree(id,C,items,miss){
  var e=C.q[id];if(e)return e;
  return cptDeriver(items?items[id]:null,!!miss&&miss.indexOf(id)>=0);
}
/* Totaux d'une entrée : la dernière réponse est celle de l'appareil qui a répondu le plus tard */
function cptTotal(e){
  var t={b:0,m:0,h:0,r:0,at:0,l:0,j:e?e.j.length:0,n:0},a,c;
  if(!e)return t;
  for(a in e.d){if(e.d.hasOwnProperty(a)){c=e.d[a];t.b+=c.b||0;t.m+=c.m||0;t.h+=c.h||0;t.r+=c.r||0;if((c.at||0)>=t.at){t.at=c.at||0;t.l=c.l?1:0;}}}
  t.n=t.b+t.m+t.h;
  return t;
}
function cptJour(e,d){if(e.j.indexOf(d)<0){e.j.push(d);e.j.sort(function(x,y){return x-y;});if(e.j.length>30)e.j=e.j.slice(-30);}}
/* Une réponse. conf : "sure" | "hes" | "guess" | null ; sansChoix : réponse donnée de mémoire ; quand : heure d'ailleurs (widget) */
function cptNoter(id,ok,conf,sansChoix,quand){
  if(!KCPT||!id)return;
  var now=quand||Date.now(),e=CPT.q[id],dev=appareil(),res=!ok?"m":conf==="guess"?"h":"b",c;
  if(!e)e=cptDeriver(SRS&&SRS.items?SRS.items[id]:null,MISS.indexOf(id)>=0)||{d:{},j:[]};
  c=e.d[dev]||(e.d[dev]={b:0,m:0,h:0,r:0,at:0,l:0});
  c[res]++;if(res==="b"&&sansChoix)c.r++;
  c.at=now;c.l=res==="b"?1:0;
  if(res==="b")cptJour(e,dayOf(now));
  CPT.q[id]=e;cptSave();
}
/* Une note changée après coup (réponse rédigée d'un exercice notée autrement) : le nombre de réponses ne change pas */
function cptChanger(id,ancien,nouveau){
  var e=CPT.q[id],c=e&&e.d[appareil()];
  if(!c||!(c[ancien]>0)){cptNoter(id,nouveau==="b"||nouveau==="h",nouveau==="h"?"guess":null);return;}
  c[ancien]--;c[nouveau]=(c[nouveau]||0)+1;c.at=Math.max(Date.now(),(c.at||0)+1);c.l=nouveau==="b"?1:0;
  if(nouveau==="b")cptJour(e,dayOf(Date.now()));
  cptSave();
}
/* Fusion sans perte : pour chaque appareil, le compteur qui a vu le plus de réponses ; « av » (reconstruit), le plus
   ancien (celui qui ne compte pas encore les réponses d'après la v16) ; les jours de réussite réunis */
function cptFusion(a,b){
  if(!cptValide(b))return a;
  if(!cptValide(a))return clone(b);
  var o={d:{},j:[]},k,x,y,nx,ny;
  for(k in a.d){if(a.d.hasOwnProperty(k))o.d[k]=clone(a.d[k]);}
  for(k in b.d){if(b.d.hasOwnProperty(k)){
    x=o.d[k];y=b.d[k];
    if(!y||typeof y!=="object")continue;
    if(!x){o.d[k]=clone(y);continue;}
    nx=(x.b||0)+(x.m||0)+(x.h||0);ny=(y.b||0)+(y.m||0)+(y.h||0);
    if(k==="av"?((y.at||0)<(x.at||0)||((y.at||0)===(x.at||0)&&ny<nx)):(ny>nx||(ny===nx&&(y.at||0)>(x.at||0))))o.d[k]=clone(y);
  }}
  a.j.concat(b.j).forEach(function(d){if(typeof d==="number")cptJour(o,d);});
  return o;
}
/* Cas guidés : les jours où le cas a été réussi en entier (v16 : j) ; avant, le jour du dernier résultat s'il était complet */
function casrJours(o){if(!o)return [];if(o.j instanceof Array)return o.j.slice();return o.full?[dayOf(o.at)]:[];}
function casrFusion(a,b){
  if(!casrValide(b))return a;
  if(!casrValide(a))return clone(b);
  var o=clone(b.at>=a.at?b:a),j=casrJours(a);
  casrJours(b).forEach(function(d){if(j.indexOf(d)<0)j.push(d);});
  o.full=!!(a.full||b.full);o.j=j.sort(function(x,y){return x-y;});
  return o;
}

/* ---------- La règle ---------- */
/* Sans les choix : seulement pour une question qui s'y prête (03b) et si le réglage « Questions déjà sues » le permet */
function cptRappelExige(it,E){return !!it&&!it.cas&&E.sans_choix>0&&rappelActif()&&rappelEligible(it);}
function maitrisee(it,t,E){
  return t.b>=E.bonnes&&t.j>=E.jours&&(!cptRappelExige(it,E)||t.r>=E.sans_choix)&&t.b>=E.ratio*t.m&&t.l===1;
}
/* Ce qui manque encore, en mots */
function cptManque(it,t,E){
  var l=[],nb2=Math.max(E.bonnes,Math.ceil(E.ratio*t.m))-t.b,nj=E.jours-t.j;
  if(nb2>0)l.push(tnx("exig.encore_bonnes",nb2)+(t.m&&E.ratio*t.m>E.bonnes?tx("exig.par_erreur",{r:E.ratio}):""));
  if(nj>0)l.push(nj>1?tx("exig.autres_jours",{n:nj}):(t.j?tx("exig.reussite_autre_jour"):tx("exig.une_reussite")));
  if(cptRappelExige(it,E)&&t.r<E.sans_choix)l.push(tx("exig.sans_choix"));
  if(t.l!==1)l.push(tx("exig.prochaine_juste"));
  return l;
}
/* Les questions d'une matière avec leurs compteurs (sans l'activer) */
function cptMat(k){
  var M=MATS[k],act=!!(MAT&&MAT.k===k);
  if(!M)return null;
  var srs=act?SRS:load(M.pre+"srs",null);
  return {M:M,E:exigence(M),C:act?CPT:cptCharger(M.pre+"cpt"),items:(srs&&srs.items&&typeof srs.items==="object")?srs.items:{},miss:act?MISS:asArray(load(M.pre+"miss",[]))};
}
function cptDe(D,it){var t=cptTotal(cptEntree(it.id,D.C,D.items,D.miss));return {it:it,t:t,ok:maitrisee(it,t,D.E)};}
/* Questions d'une liste : combien maîtrisées, et la réussite réelle (bonnes sur toutes les réponses) */
function cptBilan(qs,D){
  D=D||cptMat(MAT.k);
  var o={n:qs.length,nm:0,b:0,tot:0,vues:0,non:[]};
  qs.forEach(function(it){var x=cptDe(D,it);if(x.ok)o.nm++;else o.non.push(it);o.b+=x.t.b;o.tot+=x.t.n;if(x.t.n)o.vues++;});
  o.part=o.n?o.nm/o.n:0;o.reussite=o.tot?o.b/o.tot:0;
  return o;
}

/* ---------- Confiance partout (point 7) ---------- */
/* Quiz : la confiance est demandée en séance (révision espacée), aux étapes des cas guidés et dans les séries du carnet */
function confDemandee(){var it=S&&S.list[S.i];return !!(S&&(S.srs||S.exige||(it&&it.cas)));}
/* Exercices : choix de confiance par question, avant la correction. <préfixe>exc = {exercice:{c:{n°:conf}, k:{n°:compté}}},
   gardé dans ce navigateur (une tentative en cours), remis à zéro quand on recommence l'exercice. */
function exCptId(e,i){return e.id.replace(/^sim-/,"")+"#"+i;}
function exConf(e,i){var x=EXC[e.id];return x&&x.c?x.c[i]||null:null;}
function exNoter(e,i,juste){
  var x=EXC[e.id]||(EXC[e.id]={c:{},k:{}}),conf=x.c[i]||null,r=!juste?"m":conf==="guess"?"h":"b",old=x.k[i],id=exCptId(e,i);
  if(old===r)return;
  if(old)cptChanger(id,old,r);else cptNoter(id,juste,conf,false);
  x.k[i]=r;save(KEXC,EXC);
}
function exCompte(e,i){var x=EXC[e.id];return !!(x&&x.k&&x.k[i]);}
function exReset(id){if(EXC[id]){delete EXC[id];save(KEXC,EXC);}}
var CONF_LAB=[["guess",t("exig.conf_guess")],["hes",t("exig.conf_hes")],["sure",t("exig.conf_sure")]];
/* Rangée « Tu es : au hasard · j'hésite · sûr » (exercices, calcul mental) ; pre : préfixe des identifiants */
function confRangee(pre,cur,fn){
  var r=el("div","chips confx");r.setAttribute("role","group");r.setAttribute("aria-label",t("exig.conf_aria"));
  r.appendChild(el("span","confx-l",t("exig.tu_es")));
  CONF_LAB.forEach(function(c){
    var b=el("button","chip"+(cur===c[0]?" sel":""),c[1]);b.type="button";b.id=pre+c[0];
    b.setAttribute("aria-pressed",cur===c[0]?"true":"false");
    b.addEventListener("click",function(){fn(cur===c[0]?null:c[0]);});
    r.appendChild(b);
  });
  return r;
}
function exConfRangee(e,i){
  return confRangee("exc-"+i+"-",exConf(e,i),function(v){
    var x=EXC[e.id]||(EXC[e.id]={c:{},k:{}});
    if(v)x.c[i]=v;else delete x.c[i];
    save(KEXC,EXC);
    var old=$("exc-"+i+"-guess");if(old&&old.parentNode)old.parentNode.parentNode.replaceChild(exConfRangee(e,i),old.parentNode);
  });
}
/* Calcul mental : la rangée sous le champ, une par question */
function drConfRendre(){
  var box=$("dr-conf");
  if(!box){box=el("div");box.id="dr-conf";var f=$("dr-in").parentNode;f.parentNode.insertBefore(box,f.nextSibling);}
  clear(box);
  if(!DR||DR.locked)return;
  box.appendChild(confRangee("drc-",DR.conf||null,function(v){DR.conf=v;drConfRendre();}));
}
