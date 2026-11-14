/* ---------- Signaler une erreur, Contact (v16) ----------
   Demande de l'auteur (1er nov.) : signaler une erreur de contenu là où il la voit, et pouvoir écrire. Claude lit les
   signalements en début de session et corrige le contenu dans univers/ (CLAUDE.md, « Signalements »).
   « Signaler une erreur » : sous la correction d'une question (quiz et étapes de cas, #b-sig-q), sous chaque question
   d'un exercice (sigExBouton, 11), en bas d'une fiche (#b-sig-fi). « Contact » et « Mes signalements » : Profil (#prof-sig).
   Un panneau (#sig, créé ici) : type, commentaire ; matière, question ou fiche et réponse donnée sont joints seuls.
   Gardés dans qfcc2.signalements = {v:1, items:{<id>: signalement}} et, avec un compte (capacité db), dans le document
   privé data/users/<id>/signalements (même forme, plus maj). Fusion par identifiant : « corrige » > « envoye » > « local »,
   puis le plus récent (maj). Sans compte : « local », proposé à la copie. Claude seul passe un signalement à « corrige ». */
var KSIG="qfcc2.signalements",SIG={busy:false,again:false,ctx:null,type:null,pulled:0};
var SIG_TYPES=[["enonce",tx("sig.t_enonce")],["reponse",tx("sig.t_reponse")],["explication",tx("sig.t_explication")],["autre",tx("sig.t_autre")]];
var SIG_ETATS={local:tx("sig.e_local"),envoye:tx("sig.e_envoye"),corrige:tx("sig.e_corrige")},SIG_RANG={local:0,envoye:1,corrige:2};
function sigLire(){var s=load(KSIG,null);return s&&s.items&&typeof s.items==="object"?s:{v:1,items:{}};}
function sigListe(){var s=sigLire(),k,l=[];for(k in s.items){if(s.items.hasOwnProperty(k))l.push(s.items[k]);}l.sort(function(a,b){return (b.at||0)-(a.at||0);});return l;}
function sigDoc(){return DB.doc("data/users/"+UID+"/signalements");}
function sigCompte(){return !!(DB&&UID);}
/* Le plus avancé gagne (corrigé par Claude), sinon le plus récent */
function sigGagne(a,b){
  if(!a)return b;if(!b)return a;
  var ra=SIG_RANG[a.etat]||0,rb=SIG_RANG[b.etat]||0;
  if(ra!==rb)return ra>rb?a:b;
  return (b.maj||0)>(a.maj||0)?b:a;
}
function sigFusion(loc,dist){
  var m={v:1,items:{}},k,ch={local:false,remote:!dist};
  dist=dist&&dist.items?dist.items:{};
  for(k in loc.items){if(loc.items.hasOwnProperty(k))m.items[k]=loc.items[k];}
  for(k in dist){if(dist.hasOwnProperty(k)){
    var g=sigGagne(m.items[k],dist[k]);
    if(g!==m.items[k]&&JSON.stringify(g)!==JSON.stringify(m.items[k])){m.items[k]=g;ch.local=true;}
  }}
  for(k in m.items){if(m.items.hasOwnProperty(k)){
    if(m.items[k].etat==="local")ch.remote=true;
    else if(!dist[k]||JSON.stringify(dist[k])!==JSON.stringify(m.items[k]))ch.remote=true;
  }}
  return {m:m,ch:ch};
}
/* Lit le document du compte, fusionne, puis écrit ce qui manque ; une seule écriture à la fois */
function sigSync(fin){
  if(!sigCompte()){if(fin)fin(false);return;}
  if(SIG.busy){SIG.again=true;if(fin)fin(false);return;}
  SIG.busy=true;
  function finir(ok){SIG.busy=false;if(SIG.again){SIG.again=false;sigSync();}if(fin)fin(ok);sigProf();}
  sigDoc().get().then(function(snap){
    var r=sigFusion(sigLire(),snap.exists?clone(snap.data()):null),m=r.m,k;  /* data() est gelé (db.d.ts) : copier */
    SIG.pulled=Date.now();
    if(!r.ch.remote){if(r.ch.local)save(KSIG,m);finir(true);return;}
    var corps=clone(m);corps.maj=Date.now();
    for(k in corps.items){if(corps.items.hasOwnProperty(k)&&corps.items[k].etat==="local"){corps.items[k].etat="envoye";corps.items[k].maj=corps.maj;}}
    sigDoc().set(corps).then(function(){delete corps.maj;save(KSIG,corps);finir(true);},function(){if(r.ch.local)save(KSIG,m);finir(false);});
  },function(){finir(false);});
}
function sigId(){return "s"+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36);}
function sigCourt(s,n){s=trim(String(s==null?"":s)).replace(/\s+/g," ");return s.length>n?s.slice(0,n-1)+"…":s;}

/* ---------- Ce qui est joint, selon l'endroit ---------- */
function sigMatiere(){return MAT?{matiere:MAT.k,nomMatiere:MAT.titre}:{matiere:null,nomMatiere:null};}
function sigCtxQuiz(){
  if(!S||!S.list[S.i])return null;
  var it=S.list[S.i],a=S.ans[S.ans.length-1],r=null,pos;
  if(a&&a.id===it.id){
    var donnee=a.txt!=null?a.txt:(a.pick>=0&&it.o&&it.o[a.pick]!=null?it.o[a.pick]:tx("sig.aucune"));
    if(!a.txt&&S.perm){for(pos=0;pos<S.perm.length;pos++){if(S.perm[pos]===a.pick)donnee=String.fromCharCode(65+pos)+" · "+donnee;}}
    r={donnee:sigCourt(donnee,400),juste:!!a.ok,attendue:it.o&&it.o[it.c]!=null?sigCourt(it.o[it.c],400):null};
    if(a.rl)r.deMemoire=true;
  }
  var c={genre:it.cas?"cas":"qcm",cible:{id:it.id,theme:it.th||null,nomTheme:it.th?themeName(it.th):null,libelle:sigCourt(it.q,300)},reponse:r};
  if(it.cas){c.cible.cas=it.cas;var cs=CAS.filter(function(x){return x.k===it.cas;})[0];if(cs)c.cible.nomCas=cs.n;}
  return c;
}
function sigCtxEx(i){
  if(!EXS||!EXS.e.subs[i])return null;
  var e=EXS.e,s=e.subs[i],st=EXS.st,v=trim(st.a[i]),r=null;
  if(v!==""||st.done||(st.v&&st.v[i])){
    r={donnee:v===""?tx("sig.aucune"):sigCourt(v,400)};
    if(s.k==="num"){r.attendue=fmtNum(s.a)+(s.u?" "+s.u:"");if(v!==""&&(st.done||(st.v&&st.v[i])))r.juste=numOk(s,parseNum(v));}
    else if(st.done||(st.v&&st.v[i]))r.attendue=sigCourt(s.m,400);
  }
  return {genre:"exercice",cible:{id:e.id,question:i+1,theme:e.th||null,nomTheme:e.th?themeName(e.th):null,nomExercice:e.t||null,libelle:sigCourt(s.q,300)},reponse:r};
}
function sigCtxFiche(){
  if(!FI)return null;
  return {genre:"fiche",cible:{id:FI,theme:FI,nomTheme:FI===SYN_K?tx("sig.fiche_syn"):themeName(FI),libelle:null},reponse:null};
}

/* ---------- Le panneau ---------- */
function sigConstruire(){
  if($("sig"))return;
  var v=el("div","sig-voile");v.id="sig-voile";v.hidden=true;v.addEventListener("click",sigFermer);
  var f=el("div","sig-feuille");f.id="sig";f.hidden=true;f.setAttribute("role","dialog");f.setAttribute("aria-modal","true");f.setAttribute("aria-labelledby","sig-titre");
  var h=el("div","sig-tete"),t=el("p","sig-titre");t.id="sig-titre";h.appendChild(t);
  var x=el("button","link sig-x",tx("sig.fermer"));x.type="button";x.id="b-sig-x";x.addEventListener("click",sigFermer);h.appendChild(x);
  f.appendChild(h);
  var form=el("form","sig-form");form.id="sig-form";form.setAttribute("autocomplete","off");
  var lt=el("p","plab",tx("sig.quoi"));lt.id="sig-types-l";form.appendChild(lt);
  var ch=el("div","chips");ch.id="sig-types";ch.setAttribute("role","radiogroup");ch.setAttribute("aria-labelledby","sig-types-l");
  SIG_TYPES.forEach(function(T){
    var b=el("button","chip",T[1]);b.type="button";b.setAttribute("data-t",T[0]);b.setAttribute("role","radio");b.setAttribute("aria-checked","false");
    b.addEventListener("click",function(){sigType(T[0]);});ch.appendChild(b);
  });
  form.appendChild(ch);
  var lc=el("label","plab",tx("sig.ton_commentaire"));lc.id="sig-txt-l";lc.setAttribute("for","sig-txt");form.appendChild(lc);
  var ta=el("textarea","field");ta.id="sig-txt";ta.rows=4;ta.maxLength=2000;form.appendChild(ta);
  var ex=el("p","sig-extrait");ex.id="sig-extrait";ex.hidden=true;form.insertBefore(ex,lt);
  var j=el("p","src sig-joint");j.id="sig-joint";form.appendChild(j);
  var er=el("p","v-ko sig-err");er.id="sig-err";er.hidden=true;er.setAttribute("role","alert");form.appendChild(er);
  var bs=el("div","ag-btns"),ok=el("button","sbtn",tx("sig.envoyer"));ok.type="submit";ok.id="b-sig-ok";bs.appendChild(ok);
  var an=el("button","link",tx("sig.annuler"));an.type="button";an.addEventListener("click",sigFermer);bs.appendChild(an);
  form.appendChild(bs);
  form.addEventListener("submit",function(ev){ev.preventDefault();sigEnvoyer();});
  f.appendChild(form);
  var fin=el("div","sig-fin");fin.id="sig-fin";fin.hidden=true;fin.setAttribute("role","status");f.appendChild(fin);
  document.body.appendChild(v);document.body.appendChild(f);
}
function sigType(t){
  SIG.type=t;
  Array.prototype.forEach.call($("sig-types").childNodes,function(b){var on=b.getAttribute("data-t")===t;b.className="chip"+(on?" sel":"");b.setAttribute("aria-checked",on?"true":"false");});
  $("sig-err").hidden=true;
}
/* ctx : {genre, cible, reponse, extrait} ; genres « contact » et « idee » (v16.3) : un message libre, sans type ;
   extrait (v16.3) : le passage choisi avec le « + » de la sélection (12i) */
function sigLibre(g){return g==="contact"||g==="idee";}
function sigOuvrir(ctx){
  if(!ctx)return;
  sigConstruire();
  var contact=sigLibre(ctx.genre),idee=ctx.genre==="idee";
  SIG.ctx=ctx;SIG.type=null;SIG.retour=document.activeElement;
  $("sig-titre").textContent=idee?tx("sig.t_idee"):contact?tx("sig.t_message"):tx("sig.t_signaler");
  $("sig-extrait").textContent=ctx.extrait?"« "+nb(ctx.extrait)+" »":"";$("sig-extrait").hidden=!ctx.extrait;
  $("sig-types-l").hidden=contact;$("sig-types").hidden=contact;
  sigType(null);
  $("sig-txt-l").textContent=idee?tx("sig.l_idee"):contact?tx("sig.l_message"):tx("sig.ton_commentaire");
  $("sig-txt").placeholder=idee?tx("sig.ph_idee"):contact?tx("sig.ph_message"):tx("sig.ph_erreur");
  $("sig-txt").value="";
  $("sig-joint").textContent=nb(sigJointTexte(ctx));
  $("sig-err").hidden=true;$("sig-form").hidden=false;$("sig-fin").hidden=true;
  $("sig-voile").hidden=false;$("sig").hidden=false;
  try{(contact?$("sig-txt"):$("sig-types").firstChild).focus();}catch(e){}
}
function sigJointTexte(c){
  if(c.genre==="contact")return tx("sig.j_contact");
  if(c.genre==="idee")return c.extrait?tx("sig.j_idee_p"):tx("sig.j_idee");
  var m=MAT?MAT.titre:"",b=[];
  if(c.genre==="fiche")b.push(tx("sig.j_fiche",{nom:c.cible.nomTheme}));
  else if(c.genre==="exercice")b.push(c.cible.nomExercice?tx("sig.j_ex_n",{q:c.cible.question,nom:c.cible.nomExercice}):tx("sig.j_ex",{q:c.cible.question}));
  else if(c.genre==="cas")b.push(c.cible.nomCas?tx("sig.j_cas_n",{nom:c.cible.nomCas}):tx("sig.j_cas"));
  else if(c.genre==="passage")b.push(tx("sig.j_passage"));
  else b.push(tx("sig.j_question",{id:c.cible.id}));
  if(c.extrait&&c.genre!=="passage")b.push(tx("sig.j_passage"));
  if(c.reponse)b.push(tx("sig.j_reponse"));
  return tx("sig.j_auto",{m:m?m+", ":"",liste:b.join(tx("sig.et"))});
}
function sigFermer(){
  if(!$("sig"))return;
  $("sig").hidden=true;$("sig-voile").hidden=true;SIG.ctx=null;
  try{if(SIG.retour&&SIG.retour.focus)SIG.retour.focus();}catch(e){}
}
function sigEnvoyer(){
  var c=SIG.ctx,txt=trim($("sig-txt").value),contact=c&&sigLibre(c.genre),idee=c&&c.genre==="idee";
  if(!c)return;
  if(!contact&&!SIG.type){$("sig-err").textContent=tx("sig.err_type");$("sig-err").hidden=false;return;}
  if(contact&&!txt){$("sig-err").textContent=idee?tx("sig.err_idee"):tx("sig.err_message");$("sig-err").hidden=false;return;}
  var now=Date.now(),m=sigMatiere(),av=$("app-version");
  var it={id:sigId(),at:now,maj:now,etat:"local",genre:c.genre,type:contact?null:SIG.type,texte:txt,
    matiere:c.genre==="contact"?null:m.matiere,nomMatiere:c.genre==="contact"?null:m.nomMatiere,univers:typeof UNIV!=="undefined"&&UNIV?UNIV:null,
    cible:contact?null:c.cible,reponse:contact?null:c.reponse,extrait:c.extrait||null,app:av?av.textContent:null,ecran:selEcran()};
  var s=sigLire();s.items[it.id]=it;save(KSIG,s);
  sigFin(it,null);
  sigSync(function(ok){if($("sig")&&!$("sig").hidden&&SIG.fin===it.id)sigFin(sigLire().items[it.id]||it,ok);});
}
/* Après l'envoi : l'état ; sans compte, le texte à copier */
function sigFin(it,ok){
  SIG.fin=it.id;
  var f=$("sig-fin");clear(f);$("sig-form").hidden=true;f.hidden=false;
  var compte=sigCompte(),contact=sigLibre(it.genre);
  if(it.etat!=="local"){
    f.appendChild(el("p","v-ok sig-ok","✓ "+(it.genre==="idee"?tx("sig.ok_idee"):contact?tx("sig.ok_message"):tx("sig.ok_signalement"))));
    f.appendChild(el("p","src",nb(tx("sig.ok_texte"))));
  }else if(compte&&ok===null){
    f.appendChild(el("p","src",tx("sig.en_cours")));
  }else{
    f.appendChild(el("p","v-ok sig-ok","✓ "+(it.genre==="idee"?tx("sig.loc_idee"):contact?tx("sig.loc_message"):tx("sig.loc_signalement"))));
    f.appendChild(el("p","src",nb(compte?tx("sig.loc_compte"):tx("sig.loc_sans"))));
    sigCopieBloc(f,[it],"b-sig-copie");
  }
  var bs=el("div","ag-btns"),b=el("button","sbtn",tx("sig.fermer"));b.type="button";b.id="b-sig-fin";b.addEventListener("click",sigFermer);bs.appendChild(b);f.appendChild(bs);
  try{b.focus();}catch(e){}
}
function sigCopieBloc(box,items,id,lib){
  var b=el("button",lib?"sbtn":"link",lib||(items.length>1?tx("sig.copier_n",{n:items.length}):tx("sig.copier_un")));b.type="button";b.id=id;
  var note=el("p","src pk-note");note.setAttribute("role","status");var zone=el("div");
  b.addEventListener("click",function(){copierTexte(sigTexte(items),note,zone,tx("sig.copie_ok"));});
  box.appendChild(b);box.appendChild(note);box.appendChild(zone);
}
function sigNom(it){var t=SIG_TYPES.filter(function(T){return T[0]===it.type;})[0];return it.genre==="contact"?tx("sig.n_message"):it.genre==="idee"?tx("sig.n_idee"):(t?t[1]:tx("sig.n_signalement"));}
/* Texte lisible, pour une IA ou un message */
function sigTexte(items){
  var L=[tx("sig.x_titre",{n:items.length})];
  items.forEach(function(it){
    L.push("");
    L.push("— "+fmtDate(it.at,{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"})+" · "+sigNom(it)+" · id "+it.id+(it.etat?" · "+(SIG_ETATS[it.etat]||it.etat):""));
    if(it.nomMatiere)L.push(tx("sig.x_matiere",{nom:it.nomMatiere,id:it.matiere}));
    if(it.cible){
      var c=it.cible;
      L.push(tx("sig.x_ou",{lieu:it.genre==="fiche"?tx("sig.x_fiche",{id:c.id}):it.genre==="exercice"?tx("sig.x_ex",{id:c.id,q:c.question}):it.genre==="cas"?tx("sig.x_cas",{cas:c.cas,id:c.id}):it.genre==="passage"?tx("sig.x_ecran",{id:c.id}):tx("sig.x_question",{id:c.id}),theme:c.nomTheme?tx("sig.x_theme",{nom:c.nomTheme}):""}));
      if(c.libelle)L.push(tx("sig.x_enonce",{txt:c.libelle}));
    }
    if(it.reponse){
      var r=it.reponse;
      L.push(tx("sig.x_donnee",{txt:r.donnee+(r.juste===true?tx("sig.x_juste"):r.juste===false?tx("sig.x_fausse"):"")+(r.deMemoire?tx("sig.x_memoire"):"")}));
      if(r.attendue)L.push(tx("sig.x_attendue",{txt:r.attendue}));
    }
    if(it.extrait)L.push(tx("sig.x_passage",{txt:it.extrait}));
    if(it.genre==="idee"&&it.ecran)L.push(tx("sig.x_ecran_l",{ecran:it.ecran})+(it.app?tx("sig.x_app",{app:it.app}):""));
    if(it.texte)L.push(tx(it.genre==="contact"?"sig.x_c_message":it.genre==="idee"?"sig.x_c_idee":"sig.x_c_commentaire",{txt:it.texte}));
  });
  return L.join("\n");
}

/* ---------- Profil : Contact et Mes signalements ---------- */
function sigProf(){
  var box=$("prof-sigs");if(!box)return;
  var l=sigListe(),loc=l.filter(function(x){return x.etat==="local";}),ouverts=l.filter(function(x){return x.etat!=="corrige";});
  clear(box);
  $("b-prof-sigs-s").textContent=l.length?tnx("sig.p_envois",l.length)+(loc.length?tx("sig.p_local",{n:loc.length}):""):tx("sig.p_rien");
  if(!l.length){box.appendChild(el("p","src",tx("sig.p_vide")));return;}
  /* v16.3 : tout ce qui n'est pas corrigé se copie d'un coup, pour le coller à Claude sans rien dépenser */
  if(ouverts.length){
    var cp=el("div","sig-copie");cp.appendChild(el("p","src",nb(tx("sig.p_copie_aide"))));
    sigCopieBloc(cp,ouverts,"b-prof-sigs-copie",tx("sig.p_copie_btn",{n:ouverts.length}));box.appendChild(cp);
  }
  var ul=el("ul","sig-liste");
  l.forEach(function(it){
    var li=el("li","sig-li"),tete=el("p","sig-li-t");
    tete.appendChild(el("span","sig-etat sig-"+it.etat,SIG_ETATS[it.etat]||it.etat));
    tete.appendChild(document.createTextNode(" "+nb(sigNom(it))));
    li.appendChild(tete);
    var o=sigLibre(it.genre)||it.genre==="passage"?(it.genre==="contact"?null:it.nomMatiere):[it.nomMatiere,it.cible&&(it.genre==="fiche"?tx("sig.p_fiche",{nom:it.cible.nomTheme}):it.genre==="exercice"?tx("sig.p_ex",{q:it.cible.question}):it.genre==="cas"?tx("sig.p_cas"):tx("sig.p_question",{id:it.cible.id}))].filter(function(x){return !!x;}).join(" · ");
    li.appendChild(el("p","src",nb(fmtDate(it.at,{day:"numeric",month:"short"})+(o?" · "+o:""))));
    if(it.extrait)li.appendChild(el("p","src",nb("« "+sigCourt(it.extrait,160)+" »")));
    if(it.texte)li.appendChild(el("p","sig-li-x",nb(sigCourt(it.texte,240))));
    if(it.note)li.appendChild(el("p","src sig-note",nb(tx("sig.p_reponse",{note:it.note}))));
    ul.appendChild(li);
  });
  box.appendChild(ul);
}
/* À l'ouverture du Profil (renderProf, 12e) : la liste, et ce qui attend encore le compte part */
function sigProfMaj(){sigProf();if(sigCompte()&&sigListe().some(function(x){return x.etat==="local";}))sigSync();}
function sigProfOuvrir(){
  var d=$("prof-sigs"),b=$("b-prof-sigs");
  d.hidden=!d.hidden;b.setAttribute("aria-expanded",d.hidden?"false":"true");
  if(!d.hidden){sigProf();if(Date.now()-SIG.pulled>30000)sigSync();}
}

/* Le bouton sous chaque question d'un exercice (renderSubs, 11) */
function sigExBouton(i){
  var b=el("button","link sig-b",tx("sig.t_signaler"));b.type="button";b.id="b-sig-ex-"+i;
  b.addEventListener("click",function(){sigOuvrir(sigCtxEx(i));});
  return b;
}
$("b-sig-q").addEventListener("click",function(){sigOuvrir(sigCtxQuiz());});
$("b-sig-fi").addEventListener("click",function(){sigOuvrir(sigCtxFiche());});
$("b-prof-contact").addEventListener("click",function(){sigOuvrir({genre:"contact",cible:null,reponse:null});});
$("b-prof-sigs").addEventListener("click",sigProfOuvrir);
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&$("sig")&&!$("sig").hidden)sigFermer();});
