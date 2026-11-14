/* ---------- Examens du profil : CC d'une matière, partiels du programme, avec date et objectif de note ----------
   PROF.examens = [{id, type:"cc"|"partiel"|"autre", nom, programme, matiere, date:"AAAA-MM-JJ", objectif:null|0..20,
   themes (v10, facultatif) : [id de thème]}], gardés avec le profil (compte et navigateur). La séance du jour de chaque
   matière prépare son prochain examen : examSync() reporte sa date dans la mémoire de révision de la matière (SRS.exam,
   voir applyExam) ; examPerim() donne les thèmes au programme (sans « themes » : tout le programme). */
var EXAM_TYPES={cc:t("exm.type_cc"),partiel:t("exm.type_partiel"),autre:t("exm.type_autre")},XF=null,PROF_BACK="hub";
function examens(){return (PROF&&PROF.examens instanceof Array)?PROF.examens:[];}
function examJour(x){return dayFromISO(x.date);}
function examMatiere(k){return (MATS[k]&&MATS[k].titre)||k;}
function examTitre(x,sansMat){return (x.nom||EXAM_TYPES[x.type]||t("exm.type_autre"))+(sansMat?"":" · "+examMatiere(x.matiere));}
function fmtNote(n){return LANG==="fr"?String(n).replace(".",","):String(n);}  /* virgule décimale en français seulement */
function examsTries(){return examens().filter(function(x){return examJour(x)!==null;}).sort(function(a,b){return examJour(a)-examJour(b);});}
function examsAVenir(k){var td=today();return examsTries().filter(function(x){return examJour(x)>=td&&(!k||x.matiere===k);});}
function examsPasses(k){var td=today();return examsTries().filter(function(x){return examJour(x)<td&&(!k||x.matiere===k);}).reverse();}
function prochainExam(k){return examsAVenir(k)[0]||null;}
/* Programme d'un examen (v10) : les thèmes choisis qui existent encore dans la matière, ou null pour tout le programme */
function examThemes(x){
  var M=x&&MATS[x.matiere],L=(M&&M.THEMES)||[];
  if(!M||!(x.themes instanceof Array)||!x.themes.length)return null;
  var r=L.filter(function(t){return x.themes.indexOf(t.k)>=0;}).map(function(t){return t.k;});
  return r.length&&r.length<L.length?r:null;
}
/* Périmètre de la matière ouverte : celui de son prochain examen. {x, th:{id:true}, n, de} ou null (tout compte).
   La séance du jour, la révision d'avance, la série rapide, le conseil et la prochaine marche s'y tiennent ; les listes
   (thèmes, cas, exercices, grille) le mettent en tête. */
function examPerim(){
  if(!MAT||!MAT.ready||!PROF)return null;
  var x=prochainExam(MAT.k),l=examThemes(x),m={};
  if(!l)return null;
  l.forEach(function(k){m[k]=true;});
  return {x:x,th:m,n:l.length,de:THEMES.length};
}
function perimDans(P,th){return !P||!!P.th[th];}
function perimNoms(P){return THEMES.filter(function(t){return P.th[t.k];}).map(function(t){return t.n;});}
/* « 4 thèmes sur 8 » */
function perimCourt(x){var l=examThemes(x);return l?tn("exm.n_themes_sur",l.length,{tot:MATS[x.matiere].THEMES.length}):null;}
/* Range une liste : ce qui est au programme d'abord, ordre d'origine gardé dans chaque partie */
function perimTri(P,l,th){if(!P)return {de:l,hors:[]};return {de:l.filter(function(o){return P.th[th(o)];}),hors:l.filter(function(o){return !P.th[th(o)];})};}
function perimHors(P){return el("p","src perim-hors",nb(t("exm.hors_programme",{nom:P.x.nom})));}
function examSous(x){
  var d=examJour(x),td=today(),b=[fmtDay(d)];
  b.push(d===td?t("exm.auj"):d>td?tn("exm.dans",d-td):t("exm.passe"));
  if(typeof x.objectif==="number")b.push(t("exm.objectif",{n:fmtNote(x.objectif)}));
  if(perimCourt(x))b.push(perimCourt(x));
  return b.join(" · ");
}
/* Avant la v2.3 : une date d'examen par matière, dans sa mémoire de révision. Elle devient un examen du profil. */
function examMigrer(){
  if(!PROF||PROF.examens instanceof Array)return false;
  var l=[];
  MATS_ORDER.forEach(function(k){
    var M=MATS[k],o=load(M.pre+"srs",null);
    if(o&&o.exam&&dayFromISO(o.exam)!==null)l.push({id:"m-"+k,type:"autre",nom:t("exm.nom_defaut"),programme:M.programme,matiere:k,date:o.exam,objectif:null});
  });
  PROF.examens=l;
  return true;
}
/* Chaque matière prête vise son prochain examen. Un examen passé déjà enregistré reste tel quel (« Examen passé »). */
function examSync(){
  if(!PROF||!MAT)return;
  var cur=MAT.k;
  MATS_ORDER.forEach(function(k){
    var M=MATS[k];if(!M.ready)return;
    var nx=prochainExam(k),want=nx?nx.date:null,o=load(M.pre+"srs",null),have=(o&&o.exam)||null;
    if(want===have)return;
    if(!want&&have&&dayFromISO(have)!==null&&dayFromISO(have)<today())return;
    if(MAT.k!==k)activate(k);
    applyExam(want);
  });
  if(MAT.k!==cur)activate(cur);
  iphPlusTard();  /* examens changés : widgets de l'app iPhone (12k) */
}
function examEnregistrer(x){
  var l=examens().filter(function(y){return y.id!==x.id;});
  l.push(x);PROF.examens=l;profilSave();examSync();
}
function examSupprimer(id){PROF.examens=examens().filter(function(y){return y.id!==id;});profilSave();examSync();}
function examNomDefaut(type,k){
  if(type!=="cc")return EXAM_TYPES[type];
  return t("exm.cc_n",{n:examens().filter(function(y){return y.type==="cc"&&y.matiere===k;}).length+1});
}

/* ---------- Agenda › Examens (v6) : à venir, trouvés dans l'agenda, passés, et le formulaire ----------
   Avant la v6, les examens se géraient dans le Profil. EXAM_BACK : où revenir après un formulaire ouvert depuis
   « Aujourd'hui » ou une matière (hub, home), ou rien (le formulaire reste dans l'agenda). */
var EXAM_BACK=null;
function examRetour(){var b=EXAM_BACK;XF=null;EXAM_BACK=null;if(b==="home"){renderHome();show("home");}else if(b==="hub"){renderHub();show("hub");}else{renderExams();}}
function examFin(){if(XF&&XF.retour){examRetour();}else{XF=null;renderExams();}}
function examLigne(x,fn){
  var d=examJour(x),td=today(),b=el("button","btn ech");b.type="button";
  var dt=el("span","ech-d");dt.appendChild(el("span",null,JOURS[new Date(d*864e5).getUTCDay()]));dt.appendChild(el("b",null,String(new Date(d*864e5).getUTCDate())));dt.appendChild(el("span",null,MOIS[new Date(d*864e5).getUTCMonth()]));
  b.appendChild(dt);
  var tx=el("span","ech-tx");tx.appendChild(el("span","t",nb(examTitre(x))));
  var bits=[];if(d<td)bits.push(t("exm.passe"));else bits.push(d===td?t("exm.auj"):d===td+1?t("exm.demain"):tn("exm.dans",d-td));
  if(typeof x.objectif==="number")bits.push(t("exm.objectif",{n:fmtNote(x.objectif)}));
  if(perimCourt(x))bits.push(perimCourt(x));
  tx.appendChild(el("span","s",nb(bits.join(" · "))));b.appendChild(tx);
  if(d>=td&&d-td<=7)b.appendChild(el("span","st ech-j",d===td?t("exm.auj_court"):"J-"+(d-td)));
  b.addEventListener("click",fn);
  return b;
}
/* Examens annoncés par l'agenda (12c) : une ligne avec Ajouter et Ignorer */
function examPropose(p,back){
  var r=el("div","ag-prop"),t=el("div","ag-t");
  t.appendChild(el("span","ag-n",nb(p.nom+" · "+MATS[p.mats[0]].titre)));
  t.appendChild(el("span","ag-l",nb(fmtDay(p.e.jour)+(p.e.deb!==null?", "+agHeure(p.e.deb):"")+" · « "+p.e.titre+" »")));
  var a=el("button","sbtn",tx("exm.ajouter"));a.type="button";
  a.addEventListener("click",function(){examAjouter(back,{type:p.type,nom:p.nom,matiere:p.mats[0],date:isoOfDay(p.e.jour),agenda:p.e.id});});
  var i=el("button","link",tx("exm.ignorer"));i.type="button";
  i.addEventListener("click",function(){agIgnorer(p.e.id);});
  var bt=el("div","ag-btns");bt.appendChild(a);bt.appendChild(i);
  r.appendChild(t);r.appendChild(bt);
  return r;
}
function renderExams(){
  var box=$("ag-exams");if(!box)return;clear(box);
  var av=examsAVenir(),pa=examsPasses(),props=(AG.mcp&&agLie())?agExamens():[];
  var dans=props.filter(function(x){return x.mats.length;}),hors=props.filter(function(x){return !x.mats.length;});
  if(!av.length&&!pa.length&&!dans.length)box.appendChild(etatVide(t("exm.vide_t"),t("exm.vide_s")));
  if(av.length){
    box.appendChild(el("h2",null,t("exm.a_venir")));
    var g=el("div","group");
    av.forEach(function(x){g.appendChild(examLigne(x,function(){xfOuvrir(x);renderExams();examForm();}));});
    box.appendChild(g);
    box.appendChild(alLiens(av,"agenda"));  /* v16 : « À lire avant » (12o) */
  }
  if(dans.length){
    box.appendChild(el("h2",null,t("exm.trouves")));
    dans.forEach(function(p){box.appendChild(examPropose(p,null));});
  }
  if(hors.length)box.appendChild(el("p","src ag-hors",nb(t(hors.length>3?"exm.hors_plus":"exm.hors",{liste:hors.slice(0,3).map(function(x){return x.e.titre+" ("+fmtDay(x.e.jour)+")";}).join(" ; "),n:hors.length-3}))));
  if(pa.length){
    var det=el("details","ag-passes"),gp=el("div","group");det.id="ag-passes";
    det.appendChild(el("summary",null,t("exm.passes",{n:pa.length})));
    pa.forEach(function(x){gp.appendChild(examLigne(x,function(){xfOuvrir(x);renderExams();examForm();}));});
    det.appendChild(gp);box.appendChild(det);
  }
  renderXF();
}
function examForm(){if(XF){try{$("ag-exam-form").scrollIntoView({block:"start"});}catch(e){}}}
/* Formulaire d'un examen : nouveau (preset {type, matiere}) ou existant */
function xfOuvrir(x){
  var neuf=!x.id,k=MATS[x.matiere]?x.matiere:((MAT&&MAT.k)||MATS_ORDER[0]),t=x.type||"cc";  /* matière retirée (cours importé, v7) : celle qui est ouverte */
  XF={neuf:neuf,x:{id:x.id||("x"+Date.now().toString(36)),type:t,nom:neuf?(x.nom||examNomDefaut(t,k)):x.nom,programme:x.programme||MATS[k].programme,matiere:k,date:x.date||"",objectif:typeof x.objectif==="number"?x.objectif:null,agenda:x.agenda||null,themes:examThemes(x)}};
}
function renderXF(){
  var box=$("ag-exam-form");clear(box);box.hidden=!XF;
  $("b-exam-add").hidden=!!XF;
  if(!XF)return;
  var x=XF.x;
  box.appendChild(el("p","plab",t(XF.neuf?"exm.nouveau":"exm.modifier")));
  var ty=el("div","chips");
  [["cc",t("exm.f_cc")],["partiel",t("exm.f_partiel")],["autre",t("exm.f_autre")]].forEach(function(o){
    var b=el("button","chip"+(x.type===o[0]?" sel":""),o[1]);b.type="button";b.id="xf-type-"+o[0];
    b.addEventListener("click",function(){
      xfLire();
      if(x.nom===examNomDefaut(x.type,x.matiere)||!x.nom)x.nom=examNomDefaut(o[0],x.matiere);
      x.type=o[0];renderXF();
    });
    ty.appendChild(b);
  });
  box.appendChild(ty);
  /* Les matières de l'univers de l'examen (08b) : un CC du Bachelor ne propose pas les sous-tests du TAGE MAGE */
  var mat=el("select","field");mat.id="xf-mat";
  univMats(univDe(x.matiere)||UNIV).forEach(function(k){var op=el("option",null,MATS[k].titre);op.value=k;if(k===x.matiere)op.selected=true;mat.appendChild(op);});
  mat.addEventListener("change",function(){xfLire();x.themes=null;if(XF.neuf&&/^CC \d+$/.test(x.nom||""))x.nom=examNomDefaut(x.type,x.matiere);renderXF();});
  box.appendChild(xfChamp(t("exm.matiere"),mat));
  xfThemes(box,x);
  var nom=el("input","field");nom.id="xf-nom";nom.type="text";nom.maxLength=40;nom.value=x.nom||"";nom.placeholder=t("exm.nom_ph");
  box.appendChild(xfChamp(t("exm.nom"),nom));
  var dt=el("input","field");dt.id="xf-date";dt.type="date";dt.value=x.date||"";
  box.appendChild(xfChamp(t("exm.date"),dt));
  var ob=el("input","field");ob.id="xf-obj";ob.type="number";ob.min="0";ob.max="20";ob.step="0.5";ob.setAttribute("inputmode","decimal");ob.placeholder=t("exm.obj_ph");
  ob.value=typeof x.objectif==="number"?String(x.objectif):"";
  box.appendChild(xfChamp(t("exm.obj_lab"),ob));
  var err=el("p","v-ko");err.id="xf-err";err.hidden=true;box.appendChild(err);
  var row=el("div","exform");
  var sv=el("button","sbtn",t("exm.enregistrer"));sv.type="button";sv.id="xf-save";sv.addEventListener("click",xfValider);row.appendChild(sv);
  var an=el("button","link",t("exm.annuler"));an.type="button";an.id="xf-cancel";an.addEventListener("click",examFin);row.appendChild(an);
  if(!XF.neuf){var del=el("button","link danger",t("exm.supprimer"));del.type="button";del.id="xf-del";del.addEventListener("click",function(){examSupprimer(x.id);examFin();});row.appendChild(del);}
  box.appendChild(row);
}
/* Ce que l'examen couvre (v10) : tout le programme, ou les thèmes touchés. Le dernier thème retiré ou le dernier
   ajouté revient à « Tout le programme ». */
function xfThemes(box,x){
  var L=MATS[x.matiere].THEMES||[];
  if(L.length<2)return;
  var d=el("div","onb-ex"),lab=el("p","plab",t("exm.au_programme"));d.appendChild(lab);
  d.appendChild(el("p","src xf-th-aide",t("exm.th_aide")));
  var c=el("div","chips xf-themes");c.id="xf-themes";c.setAttribute("role","group");c.setAttribute("aria-label",t("exm.th_aria"));
  var tout=el("button","chip"+(x.themes?"":" sel"),t("exm.tout_prog"));tout.type="button";tout.id="xf-th-tout";tout.setAttribute("aria-pressed",x.themes?"false":"true");
  tout.addEventListener("click",function(){xfLire();x.themes=null;renderXF();});
  c.appendChild(tout);
  L.forEach(function(t){
    var on=!!(x.themes&&x.themes.indexOf(t.k)>=0),b=el("button","chip"+(on?" sel":""),t.n);b.type="button";b.setAttribute("data-th",t.k);b.setAttribute("aria-pressed",on?"true":"false");
    b.addEventListener("click",function(){
      xfLire();
      var s=x.themes?x.themes.slice():[],i=s.indexOf(t.k);
      if(i>=0)s.splice(i,1);else s.push(t.k);
      s=L.filter(function(u){return s.indexOf(u.k)>=0;}).map(function(u){return u.k;});
      x.themes=s.length&&s.length<L.length?s:null;
      renderXF();
    });
    c.appendChild(b);
  });
  d.appendChild(c);
  d.appendChild(el("p","src xf-th-n",x.themes?tn("exm.n_themes_sur",x.themes.length,{tot:L.length}):t("exm.tous_themes",{n:L.length})));
  box.appendChild(d);
}
function xfChamp(l,inp){var d=el("div","onb-ex"),lab=el("label","plab",l);lab.setAttribute("for",inp.id);d.appendChild(lab);d.appendChild(inp);return d;}
function xfLire(){
  var x=XF.x;
  x.matiere=$("xf-mat").value;x.programme=MATS[x.matiere].programme;x.nom=trim($("xf-nom").value);x.date=$("xf-date").value;
  var o=trim($("xf-obj").value).replace(",",".");x.objectif=o===""?null:parseFloat(o);
}
function xfValider(){
  xfLire();
  var x=XF.x,err=$("xf-err"),msg="";
  if(dayFromISO(x.date)===null)msg=t("exm.err_date");
  else if(x.objectif!==null&&(isNaN(x.objectif)||x.objectif<0||x.objectif>20))msg=t("exm.err_obj");
  if(msg){err.textContent=msg;err.hidden=false;return;}
  if(x.objectif!==null)x.objectif=Math.round(x.objectif*2)/2;
  if(!x.nom)x.nom=examNomDefaut(x.type,x.matiere);
  var o={id:x.id,type:x.type,nom:x.nom,programme:x.programme,matiere:x.matiere,date:x.date,objectif:x.objectif};
  if(x.agenda)o.agenda=x.agenda;  /* examen ajouté depuis l'agenda : ne plus le proposer */
  if(x.themes)o.themes=x.themes.slice();  /* v10 : sans ce champ, tout le programme */
  examEnregistrer(o);
  examFin();
}
/* Depuis « Aujourd'hui », une matière ou la semaine : le formulaire s'ouvre dans Agenda › Examens et ramène d'où l'on vient */
function examOuvrir(back,x){
  if(!PROF)profilSave("");
  EXAM_BACK=(back==="hub"||back==="home")?back:null;
  openAgenda(EXAM_BACK||"tab","ex");
  xfOuvrir(x);if(EXAM_BACK)XF.retour=true;
  renderExams();examForm();
}
function examAjouter(back,preset){examOuvrir(back,preset);}
function examModifier(back,x){examOuvrir(back,x);}

/* « Aujourd'hui » : les échéances de l'univers ouvert, examens à venir et examens trouvés dans l'agenda */
function renderHubExams(){
  var box=$("hub-exams");clear(box);
  if(!PROF||!univPrets().length)return;
  var av=examsAVenir().filter(function(x){return univDe(x.matiere)===UNIV;}).slice(0,3);  /* l'univers ouvert (08b) */
  var props=(AG.mcp&&agLie()&&univAgenda())?agExamens().filter(function(p){return p.mats.length&&univDe(p.mats[0])===UNIV;}):[];
  if(!av.length&&!props.length)return;  /* rien à venir : « Pour bien démarrer » invite à en ajouter (13) */
  var t=el("div","tete-ligne");t.appendChild(el("h2",null,tx("exm.echeances")));
  var l=el("button","link",tx("exm.agenda"));l.type="button";l.id="b-hub-echeances";l.addEventListener("click",function(){openAgenda("hub","ex");});
  t.appendChild(l);box.appendChild(t);
  if(av.length){
    var g=el("div","group");
    av.forEach(function(x){g.appendChild(examLigne(x,function(){examModifier("hub",x);}));});
    box.appendChild(g);
    box.appendChild(alLiens(av,"hub"));  /* v16 : « À lire avant » (12o) */
  }
  props.slice(0,2).forEach(function(p){box.appendChild(examPropose(p,"hub"));});
}

$("b-exam-add").addEventListener("click",function(){xfOuvrir({type:"cc"});renderExams();examForm();});
