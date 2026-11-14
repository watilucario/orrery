/* ---------- App iPhone (v12, dossier ios/) : widgets, rappels et copie de secours ----------
   Ne fait quelque chose que dans l'app iPhone, qui fournit window.webkit.messageHandlers.revisions (messages vers l'app)
   et window.__iphone, posé avant la page : {reponses (données dans le widget « Question »), notif ("autorisees",
   "refusees" ou "a-demander"), restaure (date de la copie remise)}. Partout ailleurs (claude.ai, navigateur, tests) :
   aucun message, aucun tirage au sort, aucune clé écrite.
   Résumé envoyé à l'app (iphResume) : pour chaque matière prête, de quoi suivre les jours suivants sans rouvrir l'app
   (échéances par jour, questions jamais vues, nouvelles par jour, mémoire du cours sur 8 jours, jours travaillés),
   son prochain examen ; les examens à venir ; quelques questions courtes pour le widget « Question » ; les rappels.
   L'app en tire les widgets et les notifications (ios/Partage/Resume.swift refait le calcul de srsDue et
   srsNewPerDay, 07, jour par jour).
   Copie de secours : la sauvegarde de Profil › Sauvegarder (sauveTexte, 12h), envoyée quand l'app passe en arrière-plan ;
   l'app la remet avant le chargement si l'iPhone a vidé la mémoire de la page (constaté sur le téléphone de l'auteur).
   Réglages propres à cet iPhone : qfcc2.iphone = {rappel (true, false, absent tant que rien n'est choisi), heure
   "HH:MM", veille (rappel la veille d'un examen), applique (heure de la dernière réponse du widget reportée)}. */
var KIPH="qfcc2.iphone",IPH={ok:false,h:null,timer:null,qs:null,qat:0,notif:null},IPH_Q={max:8,parMat:3,q:150,o:70};
var IPH_OCCUPE=["quiz","ex","sim","drill","cons","onb"];  /* un entraînement en cours n'est jamais interrompu */
(function(){
  try{IPH.h=(window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.revisions)||null;}catch(e){IPH.h=null;}
  IPH.ok=!!IPH.h;
  if(IPH.ok&&window.__iphone&&typeof window.__iphone==="object")IPH.notif=window.__iphone.notif||null;
})();
function iphEnvoyer(type,data){if(!IPH.ok)return;try{IPH.h.postMessage({type:type,data:data});}catch(e){}}
/* Le résumé part en texte JSON : l'app l'écrit tel quel pour le widget (nombres intacts) */
function iphEnvoyerResume(neuf){iphEnvoyer("resume",JSON.stringify(iphResume(neuf)));}
function iphRegl(){
  var o=load(KIPH,null);if(!o||typeof o!=="object")o={};
  return {rappel:o.rappel===true,decide:o.rappel===true||o.rappel===false,heure:/^\d{2}:\d{2}$/.test(o.heure||"")?o.heure:"18:00",
    veille:o.veille!==false,applique:+o.applique||0};
}
function iphReglSauver(chg){
  var o=load(KIPH,null),k;if(!o||typeof o!=="object")o={};
  for(k in chg){if(chg.hasOwnProperty(k))o[k]=chg[k];}
  save(KIPH,o);
}
function iphHeure(h){var m=/^(\d{2}):(\d{2})$/.exec(h||"");if(!m)return h;return m[2]==="00"?tx("iph.heure_pile",{h:+m[1],hh:m[1]}):tx("iph.heure",{h:+m[1],hh:m[1],m:m[2]});}
function iphEcran(){var n;for(n=0;n<SCREENS.length;n++){if(!$(SCREENS[n]).hidden)return SCREENS[n];}return null;}

/* ---------- Résumé d'une matière, lu dans sa mémoire sans l'ouvrir (comme evDonnees, 12b) ---------- */
function iphSecParQ(days){var k,n=0,s=0;for(k in days){if(days.hasOwnProperty(k)&&days[k]){n+=days[k].n||0;s+=days[k].sec||0;}}return n>=20&&s>0?Math.max(15,Math.min(90,s/n)):30;}
function iphPerim(k){var l=examThemes(prochainExam(k)),P=null;if(l){P={th:{}};l.forEach(function(t){P.th[t]=true;});}return P;}
function iphSrs(k){var M=MATS[k],s=(MAT&&MAT.k===k)?SRS:load(M.pre+"srs",null);return (s&&typeof s==="object")?s:{};}
function iphMat(k){
  var M=MATS[k],s=iphSrs(k),td=today(),P=iphPerim(k),x=prochainExam(k),sd=(M.blocs&&M.blocs.seance_du_jour)||MODELES["matiere-de-cours"].blocs.seance_du_jour;
  var items=(s.items&&typeof s.items==="object")?s.items:{},days=(s.days&&typeof s.days==="object")?s.days:{};
  var ech={},e=[],vues=0,non=0,tot=0,mem=[],jours=[],d,i;
  M.Q.forEach(function(q){
    if(q.cas)return;tot++;
    var it=items[q.id];if(it)vues++;
    if(!perimDans(P,q.th))return;  /* comme srsDue et srsAVoir : seulement le programme du prochain examen */
    if(!it){non++;return;}
    d=Math.max(td,it.due);ech[d]=(ech[d]||0)+1;
  });
  for(d in ech){if(ech.hasOwnProperty(d))e.push([+d,ech[d]]);}
  e.sort(function(a,b){return a[0]-b[0];});
  for(i=0;i<8;i++)mem.push(Math.round(evRappel({M:M,items:items},td+i)*1000)/1000);
  for(d in days){if(days.hasOwnProperty(d)&&days[d]&&days[d].n)jours.push(+d);}
  jours.sort(function(a,b){return a-b;});
  var se=load(M.pre+"sess",null),reste=0;
  if(se&&se.srs&&se.ids instanceof Array&&se.ans instanceof Array&&se.ans.length<se.ids.length)reste=se.ids.length-se.ans.length;
  return {k:k,titre:M.titre,univers:univDe(k),max:sd.max,base:sd.nouvelles_par_jour,nonVues:non,
    nouvellesDuJour:(s.newd&&s.newd.day===td)?s.newd.n:0,examJour:s.exam?dayFromISO(s.exam):null,ech:e,vues:vues,total:tot,
    memoire:mem,secParQ:iphSecParQ(days),jours:jours,enCours:reste,
    examen:x?{nom:x.nom||EXAM_TYPES[x.type]||"Examen",type:x.type||null,date:x.date,jour:examJour(x),themes:P?examThemes(x).length:null}:null};
}

/* ---------- Questions du widget : courtes, sans énoncé ni tableau, celles à revoir d'abord ---------- */
function iphCourte(q){
  if(q.cas||q.ctx||q.t||!(q.o instanceof Array)||q.o.length<2||q.o.length>4)return false;
  if(String(q.q).length>IPH_Q.q)return false;
  return q.o.every(function(o){return String(o).length<=IPH_Q.o;});
}
function iphQuestionsDe(k){
  var M=MATS[k],s=iphSrs(k),items=(s.items&&typeof s.items==="object")?s.items:{},P=iphPerim(k),td=today(),due=[],neuves=[];
  function r(q){var it=items[q.id];return fR(Math.max(0,td-it.last),it.s);}
  M.Q.forEach(function(q){
    if(!iphCourte(q)||!perimDans(P,q.th))return;
    var it=items[q.id];
    if(it){if(it.due<=td)due.push(q);}else{neuves.push(q);}
  });
  due.sort(function(a,b){return r(a)-r(b);});
  return due.map(function(q){return [q,"revoir"];}).concat(shuffle(neuves).map(function(q){return [q,"nouvelle"];})).slice(0,IPH_Q.parMat).map(function(x){
    var q=x[0],perm=[],n,th=M.THEMES.filter(function(t){return t.k===q.th;})[0];
    for(n=0;n<q.o.length;n++)perm.push(n);
    if(!q.fixed)perm=shuffle(perm);
    return {id:q.id,k:k,mat:M.titre,th:th?th.n:"",q:nb(q.q),o:perm.map(function(i){return nb(q.o[i]);}),c:perm.indexOf(q.c),
      e:nb(q.e),s:q.s,etat:x[1]};
  });
}
/* Les matières à l'examen le plus proche d'abord. Gardées tant qu'il en reste assez : une question vue dans l'app
   depuis (révision plus récente que le tirage) sort de la liste. */
function iphQuestions(neuf){
  var t=Date.now();
  if(!neuf&&IPH.qs){
    IPH.qs=IPH.qs.filter(function(q){var M=MATS[q.k],it=M&&(iphSrs(q.k).items||{})[q.id];return M&&!(it&&it.at>=IPH.qat);});
    if(IPH.qs.length>=3)return IPH.qs;
  }
  var ks=MATS_ORDER.filter(function(k){return MATS[k].ready&&MATS[k].blocs.seance_du_jour;}),l=[];
  ks.sort(function(a,b){var x=prochainExam(a),y=prochainExam(b);return (x?examJour(x):1e9)-(y?examJour(y):1e9);});
  ks.forEach(function(k){if(l.length<IPH_Q.max)l=l.concat(iphQuestionsDe(k).slice(0,IPH_Q.max-l.length));});
  IPH.qs=l;IPH.qat=t;
  return l;
}
function iphResume(neuf){
  var r=iphRegl();
  return {v:1,maj:Date.now(),jour:today(),prenom:(PROF&&PROF.prenom)||"",
    mats:MATS_ORDER.filter(function(k){return MATS[k].ready&&MATS[k].blocs.seance_du_jour;}).map(iphMat),
    examens:examsAVenir().slice(0,8).map(function(x){return {id:x.id,nom:x.nom||EXAM_TYPES[x.type]||"Examen",type:x.type||null,
      matiere:x.matiere,titreMatiere:examMatiere(x.matiere),date:x.date,jour:examJour(x)};}),
    questions:iphQuestions(neuf),rappels:{on:r.rappel,heure:r.heure,veille:r.veille},theme:reglages().theme||"auto"};
}
/* Après une réponse ou un examen changé : un seul envoi, un peu plus tard (srsSave, 07 ; examSync, 12) */
function iphPlusTard(){
  if(!IPH||!IPH.ok)return;  /* IPH n'existe qu'une fois ce fragment lu : 07 et 12 peuvent appeler avant */
  if(IPH.timer)clearTimeout(IPH.timer);
  IPH.timer=setTimeout(function(){IPH.timer=null;iphEnvoyerResume(false);},1500);
}
function iphTout(){
  if(IPH.timer){clearTimeout(IPH.timer);IPH.timer=null;}
  iphEnvoyerResume(false);
  iphEnvoyer("sauvegarde",{texte:sauveTexte()});
}
function iphTheme(){if(IPH&&IPH.ok)iphEnvoyer("theme",{theme:reglages().theme||"auto"});}

/* ---------- Réponses données dans le widget : reportées dans la mémoire, à leur heure (quiz libre : juste = 3, faux = 1) ---------- */
function iphAppliquer(l){
  if(!(l instanceof Array)||!l.length)return 0;
  var r=iphRegl(),cur=MAT.k,max=r.applique,n=0;
  l.filter(function(a){return a&&typeof a.at==="number"&&a.at>r.applique&&MATS[a.k]&&MATS[a.k].ready;})
   .sort(function(a,b){return a.at-b.at;}).forEach(function(a){
    if(MAT.k!==a.k)activate(a.k);
    if(BYID[a.id]&&!BYID[a.id].cas){cptNoter(a.id,!!a.ok,null,false,a.at);setMiss(a.id,!a.ok);srsReview(a.id,!!a.ok,undefined,a.at);n++;}
    if(a.at>max)max=a.at;
  });
  if(MAT.k!==cur)activate(cur);
  if(max>r.applique)iphReglSauver({applique:max});
  iphEnvoyer("reponsesAppliquees",{jusqua:max});
  return n;
}

/* ---------- Appelés par l'app (evaluateJavaScript) ---------- */
/* Lien d'un widget ou d'une notification : séance du jour, page d'une matière, examens, accueil */
function iphOuvrir(cible,k){
  if(IPH_OCCUPE.indexOf(iphEcran())>=0)return false;
  if((cible==="seance"||cible==="matiere")&&MATS[k]&&MATS[k].ready){
    activate(k);
    if(cible==="seance"&&SESS&&SESS.srs&&SESS.ans.length<SESS.ids.length){BACK="hub";resumeSess();return true;}
    if(cible==="seance"){BACK="hub";if(startDaily())return true;}
    BACK="home";NAV_PRE.home="hub";renderHome();show("home");return true;
  }
  if(cible==="examens"){openAgenda("hub","ex");return true;}
  renderHub();show("hub");return true;
}
/* L'app revient au premier plan : réponses du widget données entre-temps. Faux = laissées pour plus tard. */
function iphActif(l){
  var e=iphEcran();
  if(IPH_OCCUPE.indexOf(e)>=0)return false;
  var n=iphAppliquer(l);
  if(e==="hub")renderHub();else if(n&&e==="home")renderHome();
  iphEnvoyerResume(n>0);
  return true;
}
function iphRetour(o){
  if(o&&o.notif)IPH.notif=o.notif;
  if(!$("prof").hidden)renderRegl();
  if(!$("hub").hidden)renderHubDepart();
}

/* ---------- Rappels : Profil › Réglages de l'app, et « Pour bien démarrer » tant que rien n'est choisi ---------- */
function iphRappel(on){
  iphReglSauver({rappel:on});
  if(on&&IPH.notif!=="autorisees")iphEnvoyer("notifications",{demande:true});
  iphEnvoyerResume(false);
}
function iphDepart(l){
  if(!IPH.ok||iphRegl().decide)return;
  l.push(["b-hub-rappel",tx("iph.depart_t"),tx("iph.depart_d",{heure:iphHeure(iphRegl().heure)}),
    function(){iphRappel(true);renderHubDepart();}]);
}
function iphPuces(box,id,choix,val,fn){
  var c=el("div","chips");
  choix.forEach(function(x){
    var b=el("button","chip"+(val===x[0]?" sel":""),x[1]);b.type="button";b.id=id+"-"+x[0];
    b.setAttribute("aria-pressed",val===x[0]?"true":"false");
    b.addEventListener("click",function(){fn(x[0]);renderRegl();});
    c.appendChild(b);
  });
  box.appendChild(c);
}
function iphReglRendre(){
  var box=$("regl-iphone");if(!box)return;
  box.hidden=!IPH.ok;clear(box);if(!IPH.ok)return;
  var r=iphRegl();
  box.appendChild(el("p","plab",tx("iph.titre")));
  iphPuces(box,"regl-iph",[["oui",tx("iph.chaque_jour")],["non",tx("iph.aucun")]],r.rappel?"oui":"non",function(v){iphRappel(v==="oui");});
  if(r.rappel){
    var lg=el("div","iph-heure"),lb=el("label","src",tx("iph.a")),inp=el("input","field");
    lb.setAttribute("for","regl-iph-heure");inp.type="time";inp.id="regl-iph-heure";inp.value=r.heure;inp.step="300";
    inp.addEventListener("change",function(){if(/^\d{2}:\d{2}$/.test(inp.value)){iphReglSauver({heure:inp.value});iphEnvoyerResume(false);}});
    lg.appendChild(lb);lg.appendChild(inp);box.appendChild(lg);
    box.appendChild(el("p","plab iph-veille",tx("iph.veille")));
    iphPuces(box,"regl-iph-veille",[["oui",tx("iph.veille_dit")],["non",tx("iph.rappel_normal")]],r.veille?"oui":"non",function(v){iphReglSauver({veille:v==="oui"});iphEnvoyerResume(false);});
  }
  box.appendChild(el("p","src",IPH.notif==="refusees"?tx("iph.notif_off")
    :r.rappel?tx("iph.rappel_on"):tx("iph.rappel_off")));
  box.appendChild(el("p","src",tx("iph.secours")));
}

/* Démarrage (fin du 13) : réponses du widget, puis tout ce qu'il faut à l'app */
function iphDemarrer(){
  if(!IPH.ok)return;
  window.iphOuvrir=iphOuvrir;window.iphActif=iphActif;window.iphRetour=iphRetour;
  var w=window.__iphone||{};
  if(iphAppliquer(w.reponses)&&!$("hub").hidden)renderHub();
  document.addEventListener("visibilitychange",function(){if(document.hidden)iphTout();});
  iphTheme();
  iphEnvoyerResume(true);
  iphEnvoyer("sauvegarde",{texte:sauveTexte()});
  iphEnvoyer("pret",{});
}
