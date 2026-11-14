/* ---------- Agenda (v2.5) : l'emploi du temps de l'école, lu par le connecteur Google Agenda (capacité mcp) ----------
   Le lecteur relie lui-même ses agendas dans Agenda › ⚙ (v6 ; PROF.agenda = {cals:[{id, nom}], ignores:[id d'événement], maj}) ;
   la page lit leurs événements avec ses identifiants à lui, sans jamais voir de jeton. « Aujourd'hui » montre les cours
   du jour (ou du prochain jour de cours), avec la matière de l'app quand le titre la nomme (recette : "agenda", mots
   cherchés dans le titre), et les examens annoncés dans les 120 jours (titres « CC1 … », « Partiel … », « Examen … ») :
   un geste les ajoute aux examens (« Échéances » de « Aujourd'hui », Agenda › Examens). Sans connecteur (hors de claude.ai, ou connecteur refusé), rien d'autre ne change.
   Outils du connecteur : list_calendars {pageSize} -> {calendars:[{id, summary}]} ; list_events {calendarId, startTime,
   endTime (heure locale sans décalage ni Z), orderBy, pageSize, pageToken} -> {events:[{id, summary, location, status,
   start:{dateTime|date}, end}], nextPageToken} (pas de clé events quand il n'y a rien). */
var AG={mcp:null,perm:null,etat:"off",evs:[],lu:0,jour:null,err:null,essai:false,cals:null,sel:{},listeErr:null},AG_SRV="Google Calendar",AG_JOURS=120;
var AG_EXAM=/^\s*(?:(cc|controle continu)\s*(\d*)|(partiel)|(examen|exam|rattrapage|midterm|final|test))(?![a-z])/;
function agLie(){return !!(PROF&&PROF.agenda&&PROF.agenda.cals instanceof Array&&PROF.agenda.cals.length);}
function agNorm(s){s=String(s||"").toLowerCase();try{s=s.normalize("NFD").replace(/[̀-ͯ]/g,"");}catch(e){}return s;}
function agMatieres(titre){
  var t=agNorm(titre);
  return MATS_ORDER.filter(function(k){return MATS[k].agenda.some(function(m){return m&&t.indexOf(agNorm(m))>=0;});});
}
function agHeure(ms){var d=new Date(ms),m=d.getMinutes();if(LANG!=="fr")return d.getHours()+":"+(m<10?"0":"")+m;return d.getHours()+"h"+(m?(m<10?"0":"")+m:"");}  /* 14h30 en français, 14:30 ailleurs */
function agEvt(e,cal){
  var s=(e&&e.start)||{},f=(e&&e.end)||{},deb=s.dateTime?Date.parse(s.dateTime):null,fin=f.dateTime?Date.parse(f.dateTime):null;
  var jour=deb!==null&&!isNaN(deb)?dayOf(deb):dayFromISO(s.date||"");
  return {id:String(e.id||""),cal:cal,titre:trim(e.summary)||t("agd.sans_titre"),lieu:trim(e.location),deb:isNaN(deb)?null:deb,fin:isNaN(fin)?null:fin,jour:jour,annule:e.status==="cancelled"};
}

/* ---------- Démarrage : le connecteur n'existe que dans claude.ai ---------- */
function agInit(){
  try{
    if(!(window.claude&&window.claude.use))return;
    window.claude.use("mcp").then(function(m){
      if(!m||typeof m.callTool!=="function")return;
      AG.mcp=m;AG.etat="libre";
      window.claude.use("permissions").then(function(p){AG.perm=p||null;},function(){});
      agProfil();
      if(!$("agenda").hidden)agVue();
      if(!$("hub").hidden)renderHubDepart();
    },function(){});
  }catch(e){}
}
/* Profil arrivé ou changé (compte, autre appareil) : lire l'agenda s'il est relié et pas encore lu aujourd'hui */
function agProfil(){
  if(!AG.mcp)return;
  if(!agLie()){AG.etat="libre";AG.evs=[];AG.jour=null;agMontrer();return;}
  if(AG.jour!==today()&&AG.etat!=="charge")agCharger(false);
  else agMontrer();
}

/* ---------- Lecture : tous les agendas reliés entre deux jours (deb inclus, fin exclu), page par page ----------
   Rend {evs (triés, sans les annulés), lu (heure de la donnée la plus ancienne : cache du connecteur ou maintenant)}. */
function agLire(d0,d1,frais){
  var deb=isoOfDay(d0)+"T00:00:00",fin=isoOfDay(d1)+"T00:00:00",acc=[],lu=[];
  function page(cal,tok,n){
    var inp={calendarId:cal,startTime:deb,endTime:fin,orderBy:"startTime",pageSize:250};
    if(tok)inp.pageToken=tok;
    return AG.mcp.callTool(AG_SRV,"list_events",inp,{cache:frais?{staleTime:0,gcTime:86400000,refresh:true}:{staleTime:300000,gcTime:86400000}}).then(function(r){
      var p=r&&r.payload;
      if(!p||typeof p!=="object")throw {code:"forme"};
      lu.push(r.cache&&r.cache.storedAt?r.cache.storedAt:Date.now());
      (p.events instanceof Array?p.events:[]).forEach(function(e){if(e&&typeof e==="object")acc.push(agEvt(e,cal));});
      if(p.nextPageToken&&n<4)return page(cal,p.nextPageToken,n+1);
    });
  }
  return Promise.all(PROF.agenda.cals.map(function(c){return page(c.id,null,0);})).then(function(){
    acc.sort(function(a,b){return (a.deb||a.jour*864e5)-(b.deb||b.jour*864e5);});
    return {evs:acc.filter(function(e){return !e.annule&&e.jour!==null;}),lu:Math.min.apply(null,lu.length?lu:[Date.now()])};
  });
}
/* Ce qui montre l'agenda est redessiné quand il change : « Aujourd'hui » (cours, échéances), Agenda › Examens */
function agMontrer(){
  if(!$("hub").hidden){renderHubAgenda();renderHubExams();renderHubDepart();}
  if(!$("agenda").hidden&&!$("ag-examens").hidden)renderExams();
}
/* « Aujourd'hui » : d'aujourd'hui à +120 jours (cours du jour, examens annoncés) */
function agCharger(frais){
  if(!AG.mcp||!agLie())return;
  var td=today();
  AG.etat="charge";AG.jour=td;AG.err=null;
  if(!$("hub").hidden)renderHubAgenda();
  agLire(td,td+AG_JOURS,frais).then(function(r){
    AG.evs=r.evs;AG.lu=r.lu;
    AG.etat="ok";AG.essai=false;
    agMontrer();
  },function(e){
    var c=(e&&e.code)||"upstream_error";
    /* Une seule nouvelle tentative, et seulement quand l'erreur la permet */
    if(e&&e.retryable&&!AG.essai){AG.essai=true;setTimeout(function(){agCharger(false);},Math.min(60000,e.retryAfterMs||(1500+Math.random()*1500)));return;}
    AG.essai=false;AG.etat="err";AG.err=c;
    if(c==="needs_reauth"||c==="server_not_connected"||c==="not_in_manifest"||c==="blocked_by_policy")AG.evs=[];
    if(c==="not_granted"||c==="capability_disabled"||c==="capability_removed"){AG.mcp=null;AG.etat="off";}
    agMontrer();
  });
}
/* Ce qu'il faut dire et proposer pour chaque refus : une action par cas, jamais un message fourre-tout */
function agErreur(box,code,refaire){
  var c=code||AG.err,p=el("p","src"),txt,act=null;
  refaire=refaire||function(){agCharger(true);};
  if(c==="needs_reauth")txt=t("agd.err_reauth");
  else if(c==="server_not_connected")txt=t("agd.err_non_connecte");
  else if(c==="selection_required")txt=t("agd.err_selection");
  else if(c==="not_in_manifest"||c==="consent_required"){
    txt=t("agd.err_pas_autorise");
    if(AG.perm&&typeof AG.perm.manage==="function")act=[t("agd.act_autorisations"),function(){AG.perm.manage().then(function(){refaire();},function(){});}];
    else txt+=t("agd.err_menu_auto");
  }
  else if(c==="approval_required"){txt=t("agd.err_accord");act=[t("agd.act_autoriser"),refaire];}
  else if(c==="blocked_by_policy")txt=t("agd.err_org");
  else if(c==="server_unavailable"||c==="upstream_error"||c==="rate_limited"){txt=t("agd.err_ne_repond_pas");act=[t("agd.act_reessayer"),refaire];}
  else if(c==="tool_error"){txt=t("agd.err_refus");act=[t("agd.act_reessayer"),refaire];}
  else{txt=t("agd.err_autre",{c:c});act=[t("agd.act_reessayer"),refaire];}
  p.appendChild(document.createTextNode(txt));
  if(act){var b=el("button","link",act[0]);b.type="button";b.id="b-ag-action";b.addEventListener("click",act[1]);p.appendChild(b);}
  box.appendChild(p);
}

/* ---------- « Aujourd'hui » : cours du jour, examens annoncés ---------- */
function agExamens(){
  var td=today(),ign=(PROF&&PROF.agenda&&PROF.agenda.ignores)||[],out=[];
  AG.evs.forEach(function(e){
    if(e.jour<td||ign.indexOf(e.id)>=0)return;
    var m=AG_EXAM.exec(agNorm(e.titre));if(!m)return;
    var type=m[1]?"cc":m[3]?"partiel":"autre",nom=m[1]?"CC"+(m[2]?" "+m[2]:""):m[3]?t("exm.type_partiel"):t("exm.type_autre"),mats=agMatieres(e.titre),iso=isoOfDay(e.jour);
    var deja=examens().some(function(x){return x.agenda===e.id||(x.date===iso&&mats.indexOf(x.matiere)>=0);});
    if(!deja)out.push({e:e,type:type,nom:nom,mats:mats});
  });
  return out;
}
function renderHubAgenda(){
  var box=$("hub-agenda");if(!box)return;clear(box);
  if(!AG.mcp||!PROF||!univAgenda()||!agLie())return;  /* jamais relié : « Pour bien démarrer » (13) ; univers sans cours à l'agenda (08b) : rien */
  if(AG.jour!==null&&AG.jour!==today()&&AG.etat!=="charge"){agCharger(false);return;}
  var td=today();
  if(AG.etat==="charge"&&!AG.evs.length){box.appendChild(el("h2",null,t("agd.cours")));box.appendChild(el("p","src",t("agd.lecture")));return;}
  if(AG.etat==="err"&&!AG.evs.length){box.appendChild(el("h2",null,t("agd.cours")));agErreur(box);return;}
  /* Cours : aujourd'hui, sinon le prochain jour de cours dans la semaine */
  var cours=AG.evs.filter(function(e){return !AG_EXAM.test(agNorm(e.titre));}),jour=td,liste=cours.filter(function(e){return e.jour===td;});
  if(!liste.length){var nx=cours.filter(function(e){return e.jour>td&&e.jour<=td+7;});if(nx.length){jour=nx[0].jour;liste=nx.filter(function(e){return e.jour===jour;});}}
  if(!liste.length)return;
  box.appendChild(el("h2",null,jour===td?t("agd.cours_auj"):jour===td+1?t("agd.cours_demain"):t("agd.cours_date",{date:fmtDay(jour)})));
  var l=el("div","ag-list");
  liste.forEach(function(e){
    var r=el("div","ag-row"),h=el("span","ag-h",e.deb!==null?agHeure(e.deb)+(e.fin!==null?"–"+agHeure(e.fin):""):tx("agd.journee")),t=el("div","ag-t");
    t.appendChild(el("span","ag-n",e.titre));
    if(e.lieu)t.appendChild(el("span","ag-l",e.lieu));
    agMatieres(e.titre).filter(function(k){return MATS[k].ready;}).forEach(function(k){
      var b=el("button","link ag-rev",tx("agd.reviser",{mat:MATS[k].titre}));b.type="button";
      b.addEventListener("click",function(){activate(k);BACK="home";NAV_PRE.home="hub";renderHome();show("home");});
      t.appendChild(b);
    });
    r.appendChild(h);r.appendChild(t);l.appendChild(r);
  });
  box.appendChild(l);
  if(AG.etat==="err")agErreur(box);
}
function agIgnorer(id){
  var l=(PROF.agenda.ignores||[]).filter(function(x){return x!==id;});
  l.push(id);PROF.agenda=semAgendaCopie({ignores:l.slice(-60)});profilSave();agMontrer();  /* copie : jamais modifier en place */
}

/* ---------- Agenda › ⚙ : relier, modifier ou délier ses agendas ---------- */
function renderAgLien(){
  var box=$("ag-lien");if(!box)return;clear(box);
  if(!AG.mcp){
    box.appendChild(el("p","src",t("agd.hors_claude")));
    return;
  }
  if(AG.cals){
    box.appendChild(el("p","src",t("agd.coche")));
    var l=el("div","ag-cals");
    AG.cals.forEach(function(c,i){
      var lab=el("label","ag-cal"),cb=el("input");cb.type="checkbox";cb.id="ag-cal-"+i;cb.checked=!!AG.sel[c.id];
      cb.addEventListener("change",function(){if(cb.checked){AG.sel[c.id]=1;}else{delete AG.sel[c.id];}});
      lab.appendChild(cb);lab.appendChild(el("span",null,c.nom));l.appendChild(lab);
    });
    box.appendChild(l);
    var bt=el("div","ag-btns"),ok=el("button","sbtn",t("exm.enregistrer"));ok.type="button";ok.id="b-ag-save";
    ok.addEventListener("click",function(){
      var cals=AG.cals.filter(function(c){return AG.sel[c.id];}).map(function(c){return {id:c.id,nom:c.nom};});
      var ig=(PROF.agenda&&PROF.agenda.ignores)||[];
      PROF.agenda={cals:cals,ignores:ig,maj:Date.now()};profilSave();
      AG.cals=null;AG.jour=null;AG.evs=[];SEM.cache={};renderAgLien();renderReglAgenda();agProfil();if(!$("agenda").hidden)agVue();
    });
    var no=el("button","link",t("exm.annuler"));no.type="button";no.addEventListener("click",function(){AG.cals=null;renderAgLien();});
    bt.appendChild(ok);bt.appendChild(no);box.appendChild(bt);
    return;
  }
  if(AG.listeErr){agErreurListe(box);}
  if(agLie()){
    box.appendChild(el("p","src",nb(PROF.agenda.cals.map(function(c){return c.nom;}).join(", "))));
    var bt2=el("div","ag-btns"),m=el("button","link",t("agd.modifier"));m.type="button";m.id="b-ag-modif";m.addEventListener("click",agListeCals);
    var d=el("button","link danger",t("agd.delier"));d.type="button";d.id="b-ag-delier";
    d.addEventListener("click",function(){PROF.agenda={cals:[],ignores:[],maj:Date.now()};profilSave();AG.evs=[];AG.jour=null;SEM.cache={};renderAgLien();renderReglAgenda();if(!$("agenda").hidden)agVue();});
    bt2.appendChild(m);bt2.appendChild(d);box.appendChild(bt2);
  }else{
    box.appendChild(el("p","src",t("agd.relie_t")));
    var r=el("button","sbtn",t("agd.relier"));r.type="button";r.id="b-ag-relier";r.addEventListener("click",agListeCals);
    box.appendChild(r);
  }
}
/* Sur un geste : la première lecture demande l'accord du lecteur */
function agListeCals(){
  AG.listeErr=null;
  var box=$("ag-lien");clear(box);box.appendChild(el("p","src",t("agd.lecture_agendas")));
  AG.mcp.callTool(AG_SRV,"list_calendars",{pageSize:250},{cache:false}).then(function(r){
    var p=r&&r.payload,l=(p&&p.calendars instanceof Array)?p.calendars:[];
    var deja=agLie()?PROF.agenda.cals.map(function(c){return c.id;}):null;
    AG.cals=l.filter(function(c){return c&&c.id;}).map(function(c){return {id:String(c.id),nom:trim(c.summary)||String(c.id)};});
    AG.sel={};
    AG.cals.forEach(function(c){if(deja?deja.indexOf(c.id)>=0:/cours|courses|emploi du temps|timetable|schedule/.test(agNorm(c.nom)))AG.sel[c.id]=1;});
    if(!AG.cals.length){AG.cals=null;AG.listeErr="vide";}
    renderAgLien();
  },function(e){AG.cals=null;AG.listeErr=(e&&e.code)||"upstream_error";renderAgLien();});
}
function agErreurListe(box){
  if(AG.listeErr==="vide"){box.appendChild(el("p","src",t("agd.aucun")));return;}
  var keep=AG.err;AG.err=AG.listeErr;agErreur(box);AG.err=keep;
  /* Ici, réessayer = relire la liste : le bouton « Relier » ou « Modifier » ci-dessous le fait */
  var b=box.querySelector("#b-ag-action");if(b&&AG.listeErr!=="not_in_manifest"&&AG.listeErr!=="consent_required")b.parentNode.removeChild(b);
}
