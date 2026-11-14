/* ---------- Plan du jour (v17) : quoi voir aujourd'hui, combien, et quoi comprendre ----------
   Demande de l'auteur (6 nov.) : la séance du jour doit être plus visuelle, dire ce qu'il faut voir, ce qu'il faut
   comprendre et le volume, expliquer au besoin (une requête Claude, sur un bouton), et répartir les choses à voir selon la
   date d'échéance, par défaut sur 3 semaines. Les thèmes gardent l'ordre du cours (THEMES) : un thème qui en prépare un
   autre se voit avant. Calendrier (j = jours avant l'examen ; sans examen, j reste à 21 : ce qui n'est pas encore vu est
   étalé sur les 14 jours avant J-7 et le plan est recalculé chaque jour, donc il avance avec le travail fait) :
     j ≥ 8   Découverte : les thèmes pas encore vus, répartis sur les jours qui restent selon leur volume (fiche à lire +
             questions nouvelles). Tout est vu à J-7.
     7 à 5   Retenir : on revoit les thèmes les plus fragiles. Tout est retenu à J-4.
     4 à 3   Tout maîtriser : erreurs et thèmes les plus fragiles. Tout est maîtrisé à J-2.
     ≤ 2     Exercices et simulation.
   Le plan se recalcule chaque jour d'après ce qui est réellement vu : un jour manqué est reporté, il n'y a pas de dette.
   Si le temps manque (examen dans moins de 8 jours et des thèmes jamais vus), ils passent avant tout : « Rattrapage ».
   Rien de propre à une matière : thèmes, fiches et questions viennent du contenu. Les chiffres sont ceux de l'app. */
var PL={k:null,busy:false,rep:null,jour:null},PL_DEFAUT=21;
/* Texte brut d'une ligne Markdown (listes, gras, code, liens) */
function plTexte(md){
  return trim(String(md).replace(/\*\*([^*]+)\*\*/g,"$1").replace(/\*([^*]+)\*/g,"$1").replace(/`([^`]*)`/g,"$1").replace(/\[([^\]]*)\]\([^)]*\)/g,"$1").replace(/^\s*(?:[-*+]|\d+[.)])\s+/,""));
}
/* Ce qu'il faut comprendre d'un thème : les premières lignes de sa section clé (« À retenir » ou « L'essentiel ») */
function plComprendre(th,n){
  var c=coursDe(th),r=[],ls,i,l;
  if(!c)return r;
  ls=String(ficheCle(c).md).split("\n");
  for(i=0;i<ls.length&&r.length<n;i++){
    l=trim(ls[i]);
    if(/^(?:[-*+]|\d+[.)])\s+\S/.test(l)){r.push(plTexte(l));}
  }
  if(!r.length){
    for(i=0;i<ls.length&&r.length<1;i++){l=trim(ls[i]);if(l&&!/^(?::::|\||>|#)/.test(l))r.push(plTexte(l));}
  }
  return r.map(function(x){return x.length>190?x.slice(0,187)+"…":x;});
}
/* L'état d'un thème : fiche, questions, ce qui reste à voir, volume en minutes */
function plTheme(k){
  var qs=pool().filter(function(x){return x.th===k;}),nu=qs.filter(function(x){return !SRS.items[x.id];}).length,
      c=coursDe(k),lu=!!COURS_LU[k],min=c?coursMin(c):0,sq=secPerQ()/60,vues=qs.length-nu,
      dues=srsDue().filter(function(id){return BYID[id]&&BYID[id].th===k;}).length;
  return {k:k,n:themeName(k),nQ:qs.length,nu:nu,dues:dues,fiche:!!c,min:min,lu:lu,
    rappel:vues?themeRecall(k):null,
    vu:(!c||lu)&&nu<=Math.floor(qs.length*0.2),
    poids:Math.max(1,(c&&!lu?min:0)+nu*sq)};
}
/* Répartit des thèmes (dans l'ordre du cours) sur nd jours, selon leur poids. Le premier est toujours aujourd'hui.
   Retourne nd listes (certaines peuvent être vides si un thème est gros). */
function plRepartir(R,nd){
  var jours=[],tot=0,acc=0,i,cap,mid,j;
  nd=Math.max(1,Math.min(nd,R.length||1));
  for(i=0;i<nd;i++)jours.push([]);
  R.forEach(function(t){tot+=t.poids;});
  cap=tot/nd||1;
  R.forEach(function(t,n){
    mid=acc+t.poids/2;acc+=t.poids;
    j=n===0?0:Math.min(nd-1,Math.floor(mid/cap));
    jours[j].push(t);
  });
  return jours;
}
/* Les plus fragiles d'abord : jamais vus (rappel nul), puis rappel croissant ; l'ordre du cours départage */
function plFragiles(L,n){
  return L.map(function(t,i){return {t:t,i:i,r:t.rappel===null?-1:t.rappel};}).sort(function(a,b){return a.r-b.r||a.i-b.i;}).slice(0,n).map(function(x){return x.t;});
}
/* Le calendrier de la matière ouverte : phase, thèmes du jour, jours suivants */
function plCalcul(){
  var P=examPerim(),td=today(),ex=examDay(),defaut=!(ex!==null&&ex>=td),d=defaut?PL_DEFAUT:ex-td,
      L=THEMES.filter(function(t){return perimDans(P,t.k);}).map(function(t){return plTheme(t.k);}),
      R=L.filter(function(t){return !t.vu;}),phase,jours=[],aujourdhui,note="";
  if(d>=8){
    phase="decouverte";
    if(R.length){jours=plRepartir(R,d-7);aujourdhui=jours[0];}
    else{aujourdhui=plFragiles(L,3);note=tx("zplan.note_tout_vu");}
  }else if(R.length){
    phase="rattrapage";jours=plRepartir(R,Math.max(1,d-2));aujourdhui=jours[0];
    note=tx("zplan.note_rattrapage");
  }else{
    phase=d>=5?"retenir":d>=3?"maitriser":"exercices";
    aujourdhui=plFragiles(L,phase==="exercices"?2:3);
  }
  return {P:P,d:d,defaut:defaut,ex:ex,phase:phase,L:L,aujourdhui:aujourdhui,suite:jours.slice(1),note:note};
}
var PL_PHASES=[["decouverte",tx("zplan.ph_decouvrir"),tx("zplan.ph_decouvrir_s")],["retenir",tx("zplan.ph_retenir"),tx("zplan.ph_retenir_s")],["maitriser",tx("zplan.ph_maitriser"),tx("zplan.ph_maitriser_s")],["exercices",tx("zplan.ph_exercices"),tx("zplan.ph_exercices_s")]];
var PL_NOMS={decouverte:tx("zplan.nom_decouverte"),rattrapage:tx("zplan.nom_rattrapage"),retenir:tx("zplan.nom_retenir"),maitriser:tx("zplan.nom_maitriser"),exercices:tx("zplan.nom_exercices")};
/* Frise : quatre étapes, la part de chacune proportionnelle à ses jours, un repère « aujourd'hui » */
function plFrise(C){
  var box=$("pl-frise"),D=C.defaut?PL_DEFAUT:Math.max(C.d,1),ph=C.phase==="rattrapage"?"retenir":C.phase,parts,seg,fait=true;
  clear(box);
  /* largeurs en jours : découverte = jours avant J-7, puis J-7→J-4, J-4→J-2 et J-2→J ; une étape reste visible même courte */
  parts=[[Math.max(D-7,0),"decouverte"],[Math.min(D,7)-Math.min(D,4),"retenir"],[Math.min(D,4)-Math.min(D,2),"maitriser"],[Math.min(D,2),"exercices"]];
  var barre=el("div","pl-barre"),leg=el("ul","pl-leg");
  PL_PHASES.forEach(function(p,n){
    var w=parts[n][0],cur=p[0]===ph,li;
    if(!w&&!cur)return;
    seg=el("span","pl-seg"+(cur?" is-cur":(fait?" is-past":"")));
    seg.style.flexGrow=String(Math.max(w,0.6));barre.appendChild(seg);
    li=el("li",cur?"is-cur":(fait?"is-past":""));
    li.appendChild(el("span","pl-seg-n",p[1]));li.appendChild(el("span","pl-seg-s",nb(p[2])));leg.appendChild(li);
    if(cur)fait=false;
  });
  box.appendChild(barre);box.appendChild(leg);
  box.setAttribute("aria-label",nb(C.defaut?tx("zplan.frise_defaut",{phase:PL_NOMS[C.phase]}):tnx("zplan.frise_exam",C.d,{phase:PL_NOMS[C.phase]})));
}
/* Le volume du jour : lecture, questions nouvelles, révisions */
function plVolume(C){
  var box=$("pl-volume"),lec=0,nn=0,rev=0,sq=secPerQ()/60,min;
  clear(box);
  C.aujourdhui.forEach(function(t){
    if(C.phase==="decouverte"||C.phase==="rattrapage"){lec+=(t.fiche&&!t.lu)?t.min:0;nn+=t.nu;}
    rev+=t.dues;
  });
  min=Math.max(1,Math.round(lec+(nn+rev)*sq));
  function puce(g,t){var c=el("div","pl-vol");c.appendChild(el("span","pl-vol-g",g));c.appendChild(el("span","pl-vol-t",t));box.appendChild(c);}
  puce("≈ "+min+" min",tx("zplan.vol_total"));
  if(lec)puce(lec+" min",tx("zplan.vol_lecture"));
  if(nn)puce(String(nn),tnx("zplan.vol_nouv",nn));
  if(rev)puce(String(rev),tx("zplan.vol_revoir"));
  if(!lec&&!nn&&!rev)puce(tx("zplan.vol_rien"),tx("zplan.vol_rien_s"));
}
/* Une carte par thème du jour */
function plCarte(t,i,n,C){
  var c=el("section","pl-carte"),h=el("div","pl-carte-h"),m=el("p","pl-meta"),pts=plComprendre(t.k,3),a=el("div","pl-carte-a"),b;
  h.appendChild(el("h2",null,nb(t.n)));
  if(n>1)h.appendChild(el("span","pl-rang",(i+1)+" / "+n));
  c.appendChild(h);
  if(t.fiche)m.appendChild(el("span","pl-chip",t.lu?tx("zplan.chip_fiche_lue",{min:t.min}):tx("zplan.chip_fiche",{min:t.min})));
  if(t.nu)m.appendChild(el("span","pl-chip",tnx("zplan.chip_voir",t.nu)));
  if(t.dues)m.appendChild(el("span","pl-chip",tx("zplan.chip_revoir",{n:t.dues})));
  if(t.rappel!==null)m.appendChild(el("span","pl-chip",nb(tx("zplan.chip_retiens",{p:pct(t.rappel)}))));
  c.appendChild(m);
  if(pts.length){
    c.appendChild(el("p","pl-l",tx("zplan.a_comprendre")));
    var ul=el("ul","pl-pts");pts.forEach(function(x){ul.appendChild(el("li",null,nb(x)));});c.appendChild(ul);
  }
  if(t.fiche){b=el("button","btn"+(t.lu?"":" primary"),t.lu?tx("zplan.relire_fiche"):tx("zplan.lire_fiche"));b.type="button";b.setAttribute("data-th",t.k);
    b.addEventListener("click",function(){openFiche(t.k,"plan");});a.appendChild(b);}
  if(t.nQ){b=el("button","btn",tx("zplan.entrainer"));b.type="button";b.setAttribute("data-ent",t.k);
    b.addEventListener("click",function(){
      var qs=pool().filter(function(x){return x.th===t.k;});BACK="plan";start(shuffle(qs),themeName(t.k));
    });a.appendChild(b);}
  c.appendChild(a);
  return c;
}
function plNomJour(i){var td=today();return i===1?tx("zplan.demain"):fmtDay(td+i);}
function planLien(k){
  var p=el("p","pl-lien"),b=el("button","link",tx("zplan.voir_plan"));b.type="button";b.id="b-hub-plan";
  b.addEventListener("click",function(){NAV_PRE.plan="hub";openPlan(k);});
  p.appendChild(b);return p;
}
function openPlan(k){
  if(!MATS[k]||!MATS[k].ready)return;  /* une matière en préparation n'a rien à planifier */
  if(!MAT||MAT.k!==k)activate(k);
  PL.k=k;PL.rep=null;PL.busy=false;
  renderPlanJour();show("plan");
}
function renderPlanJour(){
  var C=plCalcul(),box=$("pl-cartes"),act=$("pl-actions"),td=today(),t=C.aujourdhui;
  PL.jour=td;
  $("pl-eyebrow").textContent=nb(MAT.titre+" · "+fmtDay(td));
  $("pl-titre").textContent=nb(PL_NOMS[C.phase]);
  $("pl-lead").textContent=nb(C.defaut
    ?tx("zplan.lead_defaut")
    :tx("zplan.lead_exam",{quand:(C.ex===td?tx("zplan.exam_auj"):C.ex===td+1?tx("zplan.exam_dem"):tnx("zplan.exam_dans",C.d)),prog:(C.P?tnx("zplan.exam_prog",C.P.n):""),note:(C.note?" "+C.note:"")}));
  if(C.defaut&&C.note)$("pl-lead").textContent=nb($("pl-lead").textContent+" "+C.note);
  plFrise(C);plVolume(C);plNiveaux();
  clear(box);clear(act);
  t.forEach(function(x,i){box.appendChild(plCarte(x,i,t.length,C));});
  var go=bigBtn(tx("zplan.lancer"),tx("zplan.lancer_s"),true,function(){
    BACK="hub";if(!startDaily()){NAV_PRE.home="hub";renderHome();show("home");}
  });
  go.id="b-pl-seance";act.appendChild(go);
  if(C.phase==="exercices"){
    var ex=el("button","btn",tx("zplan.faire_ex"));ex.type="button";ex.id="b-pl-ex";
    ex.addEventListener("click",function(){BACK="home";NAV_PRE.home="hub";openExList(false);});act.appendChild(ex);
    if(MAT.blocs.simulation){var sm=el("button","btn",tx("zplan.faire_sim"));sm.type="button";sm.id="b-pl-sim";
      sm.addEventListener("click",function(){NAV_PRE.home="hub";openSimStart();});act.appendChild(sm);}
  }
  var ex2=el("button","btn",aiOn()?tx("zplan.expliquer"):tx("zplan.copier"));ex2.type="button";ex2.id="b-pl-expl";
  ex2.addEventListener("click",function(){plExpliquer(C);});act.appendChild(ex2);
  $("pl-expl").hidden=true;$("pl-expl").textContent="";
  /* Les jours suivants : les thèmes de chaque jour, puis les étapes d'après */
  var su=$("pl-suite"),i,n=0,L2;clear(su);
  C.suite.forEach(function(j,i2){
    if(!j.length)return;
    if(n>=5)return;n++;
    su.appendChild(plLigne(plNomJour(i2+1),j.map(function(x){return x.n;}).join(", "),tx("zplan.tag_decouverte")));
  });
  if(C.phase==="decouverte"||C.phase==="rattrapage"){
    /* En rattrapage (moins de 8 jours), J-7, J-4 ou J-2 peuvent être déjà passés : on n'annonce que ce qui reste à venir */
    if(C.defaut||C.ex-7>td)su.appendChild(plLigne(C.defaut?tx("zplan.dans_2_sem"):fmtDay(C.ex-7),tx("zplan.tout_vu"),tx("zplan.j7")));
    if(!C.defaut&&C.ex-4>td)su.appendChild(plLigne(fmtDay(C.ex-4),tx("zplan.tout_retenu"),tx("zplan.j4")));
    if(!C.defaut&&C.ex-2>td)su.appendChild(plLigne(fmtDay(C.ex-2),tx("zplan.tout_maitrise"),tx("zplan.j2")));
  }
  $("pl-suite-t").hidden=!su.childNodes.length;
  $("b-pl-exam").textContent=C.defaut?tx("zplan.add_exam"):tx("zplan.mod_exam");
}
/* v23 (demande de l'auteur) : ce que le plan vise, les quatre niveaux de maîtrise, et pourquoi il faut avoir fini avant la veille */
function plNiveaux(){
  var box=$("pl-niveaux");if(!box)return;clear(box);
  var m=MAT&&MAT.blocs&&MAT.blocs.maitrise,nv=(m&&m.niveaux)||[{nom:tx("zplan.niv1"),quoi:tx("zplan.niv1_q")},{nom:tx("zplan.niv2"),quoi:tx("zplan.niv2_q")},{nom:tx("zplan.niv3"),quoi:tx("zplan.niv3_q")},{nom:tx("zplan.niv4"),quoi:tx("zplan.niv4_q")}];
  box.appendChild(el("h2",null,tx("zplan.objectif")));
  box.appendChild(el("p","pl-obj",nb(tx("zplan.objectif_t"))));
  var ol=el("ol","pl-niv");
  nv.forEach(function(x){var li=el("li");li.appendChild(el("strong",null,x.nom));li.appendChild(el("span",null,nb(x.quoi)));ol.appendChild(li);});
  box.appendChild(ol);
}
function plLigne(quand,quoi,tag){
  var r=el("div","pl-jour");
  r.appendChild(el("span","pl-j-q",nb(quand)));r.appendChild(el("span","pl-j-c",nb(quoi)));
  if(tag)r.appendChild(el("span","pl-j-t",tag));
  return r;
}
/* Ce que Claude reçoit : le plan chiffré, les points à comprendre de chaque thème et les règles du cours de ces thèmes.
   Court : une seule requête, 150 mots, sur un bouton. Sans l'aide de Claude : le même message est copié pour une autre IA. */
function plMessage(C){
  var qui=APP.eleve?APP.eleve+(APP.contexte?", "+APP.contexte:"")+",":(PROF&&PROF.prenom)?PROF.prenom+",":tx("zplan.m_etudiant"),
      th=C.aujourdhui.map(function(t){
        var pts=plComprendre(t.k,3);
        return "- "+t.n+tx("zplan.m_deux_points")+(t.fiche?tx(t.lu?"zplan.m_fiche_lue":"zplan.m_fiche",{min:t.min}):tx("zplan.m_sans_fiche"))+", "+tnx("zplan.m_jamais",t.nu)+", "+tx("zplan.m_revoir",{n:t.dues})+
          (t.rappel!==null?", "+tx("zplan.m_rappel",{p:pct(t.rappel)}):"")+(pts.length?"\n  "+tx("zplan.m_points",{l:pts.join(" | ")}):"");
      }).join("\n"),
      regles=C.aujourdhui.map(function(t){return rulesFor(t.k,false,false);}).filter(function(x){return x;}).join("\n\n"),
      quand=C.defaut?tx("zplan.m_sans_date"):tnx("zplan.m_exam_dans",C.d);
  return [tx("zplan.m_intro",{qui:qui,titre:MAT.titre}),
    tx("zplan.m_phase")+"\n"+PL_NOMS[C.phase]+". "+quand+(C.note?" "+C.note:""),
    tx("zplan.m_themes")+"\n"+th,regles?tx("zplan.m_regles")+"\n"+regles:""].filter(function(x){return x;}).join("\n\n");
}
function plExpliquer(C){
  var box=$("pl-expl"),msg=plMessage(C),opts,mine;
  if(PL.busy)return;
  box.hidden=false;
  if(!aiOn()){
    box.textContent="";
    var note=el("p","src");box.appendChild(note);
    copierTexte(msg,note,box,tx("zplan.copie_ok"));
    return;
  }
  box.className="pl-expl wait";box.textContent=tx("zplan.prepare");
  PL.busy=true;mine=PL.rep={};
  opts={modelTier:AI.niveau,effort:AI.effort,cache:false,onText:function(u){if(PL.rep===mine&&u&&trim(u.text||"")){box.className="pl-expl";box.textContent=u.text;}}};
  SAMPLE([{role:"user",content:msg}],opts).then(function(res){
    if(PL.rep!==mine)return;
    PL.busy=false;box.className="pl-expl";
    box.textContent=res&&trim(res.text||"")?res.text:tx("zplan.rien_repondu");
  },function(err){
    if(PL.rep!==mine)return;
    PL.busy=false;var code=err&&err.code;box.className="pl-expl";
    if(ASK_GONE[code]){SAMPLE=null;$("b-pl-expl").textContent=tx("zplan.copier");box.textContent=tx("zplan.aide_indispo");}
    else{box.textContent=(err&&err.text)||ASK_ERR[code]||ASK_ERR.upstream_error;}
  });
}
/* L'app est restée ouverte pendant la nuit : au retour, le plan affiché est celui d'aujourd'hui, pas celui de la veille */
document.addEventListener("visibilitychange",function(){
  if(document.hidden||ECRAN!=="plan"||!PL.k||!MATS[PL.k]||PL.jour===today())return;
  if(!MAT||MAT.k!==PL.k)activate(PL.k);
  renderPlanJour();
});
$("b-pl-exam").addEventListener("click",function(){
  var nx=MAT.ready?prochainExam(MAT.k):null,back=NAV_PRE.plan==="home"?"home":"hub";
  if(nx){examModifier(back,nx);}else{examAjouter(back,{type:"cc",matiere:MAT.k});}
});
