/* ---------- Autonomie (v7) : l'app sans Claude Pro ----------
   Trois outils pour continuer sans l'aide de Claude ni le compte claude.ai, ou ailleurs que sur claude.ai :
   - Importer un cours (écran packs) : un pack fait par une IA avec le modèle de réponse (MODELE_PACK,
     docs/modele-de-pack.md), vérifié par packLire (02) puis ajouté aux matières, sans assemblage ni Claude Code ;
   - Sauvegarde (écran sauve) : toute la mémoire locale de l'app (clés qfcc2.*, tm.* et préfixes des matières) dans un
     fichier ou un texte, et sa restauration ;
   - « Copier pour ton IA » : sans l'aide de Claude (capacité sample absente ou refusée), la même demande (consignes,
     règles du thème, contexte) est copiée pour être collée dans n'importe quelle IA. Quiz : #copie-ia (showAsk, 03) ;
     exercice corrigé : lien sous le résultat (renderExFoot, 11).
   Les deux écrans s'ouvrent depuis le Profil. */

/* Copier un texte : presse-papiers, sinon l'ancienne commande, sinon le texte affiché à sélectionner soi-même */
function copierTexte(txt,note,zone,ok){
  function fini(){note.textContent=ok;if(zone)clear(zone);}
  function manuel(){
    note.textContent=tx("aut.copie_refusee");
    if(!zone)return;
    clear(zone);var t=el("textarea","field mono");t.readOnly=true;t.rows=6;t.value=txt;zone.appendChild(t);
    try{t.focus();t.select();}catch(e){}
  }
  function ancien(){
    var t=document.createElement("textarea"),r=false;
    t.value=txt;t.setAttribute("readonly","");t.style.position="fixed";t.style.top="0";t.style.opacity="0";
    document.body.appendChild(t);
    try{t.select();r=document.execCommand("copy");}catch(e){r=false;}
    document.body.removeChild(t);return r;
  }
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(fini,function(){if(ancien())fini();else manuel();});
      return;
    }
  }catch(e){}
  if(ancien())fini();else manuel();
}
function lireFichier(input,fn){
  var f=input.files&&input.files[0];if(!f)return;
  var rd=new FileReader();
  rd.onload=function(){fn(String(rd.result||""));input.value="";};
  rd.readAsText(f);
}
function dateCourte(t){var d=new Date(t||0);return d.getDate()+" "+MOIS[d.getMonth()]+" "+d.getFullYear();}

/* ---------- « Copier pour ton IA » ---------- */
function copieIaMaj(){
  var b=$("copie-ia");if(!b)return;
  b.hidden=!(S&&S.locked&&!aiOn()&&MAT&&MAT.blocs.aide_claude);
  $("copie-ia-note").textContent="";clear($("copie-ia-zone"));
}
$("b-copie-ia").addEventListener("click",function(){
  if(!S||!S.locked)return;
  copierTexte(askMessage(S.list[S.i],askDemande()),$("copie-ia-note"),$("copie-ia-zone"),
    t("aut.copie_ia_ok"));
});
function copieIaEx(sum){
  var p=el("p","pk-ex-copie"),b=el("button","link",t("aut.copier_copie")),note=el("p","src pk-note"),zone=el("div");
  b.type="button";b.id="b-ex-copie";note.setAttribute("role","status");
  b.addEventListener("click",function(){
    copierTexte(corrMessage(),note,zone,t("aut.copie_ex_ok"));
  });
  p.appendChild(b);sum.appendChild(p);sum.appendChild(note);sum.appendChild(zone);
}

/* ---------- Importer un cours ---------- */
var PK={res:null,texte:"",retirer:null,langue:"docs"};  /* langue : "docs" (celle des documents), "fr" ou "en" : la consigne copiée, pas retenue d'une visite à l'autre */
/* La consigne à copier : dans la langue choisie ; « Langue des documents » = celle de l'app + une ligne qui demande de suivre la langue des documents. Rend {txt, l} */
function pkConsigne(){
  var c=PK.langue;
  if(c==="fr"||c==="en")return {txt:modelePack(c),l:c};
  return {txt:modelePack(LANG)+"\n\n"+tl(LANG,"aut.ligne_docs"),l:LANG};
}
/* Les trois puces du choix ; elles redessinent aussi les autres choix de la page */
function pkChoixLangue(){
  var d=el("div","pk-langue"),ch=el("div","chips regl-modes"),opts=[["docs",t("aut.langue_docs")],["fr",t("aut.langue_fr")],["en",t("aut.langue_en")]];
  d.appendChild(el("p","plab",t("aut.langue_lab")));
  ch.setAttribute("role","group");ch.setAttribute("aria-label",t("aut.langue_lab"));
  opts.forEach(function(o){
    var b=el("button","chip"+(PK.langue===o[0]?" sel":""),o[1]);b.type="button";b.setAttribute("aria-pressed",PK.langue===o[0]?"true":"false");
    if(o[0]!=="docs")b.setAttribute("lang",o[0]);
    b.addEventListener("click",function(){PK.langue=o[0];pkLangueMaj();});
    ch.appendChild(b);
  });
  d.appendChild(ch);return d;
}
function pkLangueMaj(){
  var h=$("pk-langue-haut");if(h){clear(h);h.appendChild(pkChoixLangue());}
  renderPkListe();
}

function packCompte(r){
  var c=r.contenu||{},l=[tn("aut.n_themes",(r.themes||[]).length),tn("aut.n_qcm",(c.qcm||[]).length)];
  if((c.cours||[]).length)l.push(tn("aut.n_fiches",c.cours.length));
  if((c.cas||[]).length)l.push(tn("aut.n_cas",c.cas.length));
  if((c.exercices||[]).length)l.push(tn("aut.n_exos",c.exercices.length));
  if((c.reserve||[]).length)l.push(tn("aut.n_reserve",c.reserve.length));
  return l.join(" · ");
}
function openPacks(){
  PK.res=null;PK.maj=null;PK.retirer=null;$("pk-modele-note").textContent="";clear($("pk-modele-zone"));
  /* v18 : choix de la langue du cours au-dessus du bouton de copie, et un message visible dessous (jamais replié) */
  var bt=$("b-pk-modele").parentNode,h=$("pk-langue-haut"),m=$("pk-langue-info");
  if(!h){h=el("div");h.id="pk-langue-haut";bt.parentNode.insertBefore(h,bt);}
  if(!m){m=el("p","src pk-langue-info");m.id="pk-langue-info";bt.parentNode.insertBefore(m,bt.nextSibling);}
  m.textContent=t("aut.langue_info");
  clear(h);h.appendChild(pkChoixLangue());
  renderPacks();show("packs");
}
function renderPacks(){renderPkRes();renderPkListe();}
function pkVerifier(){
  PK.texte=$("pk-texte").value;PK.maj=null;
  if(trim(PK.texte)&&packEstMaj(PK.texte)){  /* v13 : pack de mise à jour, fusionné avec le cours importé du même identifiant (02, packFusion) */
    var id=packIdDe(PK.texte),base=id&&PACKS[id]&&PACKS[id].p&&PACKS[id].p.texte;
    if(!base){
      PK.res={r:null,err:[id&&PACK_INT[id]?t("aut.err_matiere_app",{id:id}):t("aut.err_aucun_cours",{id:id||"?"})],ids:[]};
      renderPkRes();return;
    }
    var fu=packFusion(base,PK.texte);
    PK.texte=fu.texte;PK.maj=fu.stats;
    PK.res=packLire(fu.texte);
    PK.res.err=PK.res.err.map(fu.situer);
  }
  else PK.res=trim(PK.texte)?packLire(PK.texte):{r:null,err:[t("aut.err_colle")],ids:[]};
  renderPkRes();
  try{$("pk-res").scrollIntoView({block:"start"});}catch(e){}
}
function renderPkRes(){
  var box=$("pk-res"),R=PK.res;clear(box);
  if(!R)return;
  var c=el("div","pcard pk-carte"),row=el("div","prow"),bt=el("div","ag-btns");
  c.appendChild(row);box.appendChild(c);
  if(!R.r){
    row.appendChild(el("p","plab",tn("aut.points",R.err.length)));
    var ul=el("ul","pk-erreurs");
    R.err.slice(0,40).forEach(function(m){ul.appendChild(el("li",null,m));});
    if(R.err.length>40)ul.appendChild(el("li",null,t("aut.et_autres",{n:R.err.length-40})));
    row.appendChild(ul);
    row.appendChild(el("p","src",t("aut.lignes_aide")));
    var note=el("p","src pk-note"),zone=el("div"),b=el("button","sbtn",t("aut.copier_erreurs"));
    b.type="button";b.id="b-pk-erreurs";note.setAttribute("role","status");
    b.addEventListener("click",function(){
      copierTexte(t("aut.refus_ia",{liste:R.err.join("\n- ")}),
        note,zone,t("aut.refus_ok"));
    });
    bt.appendChild(b);row.appendChild(bt);row.appendChild(note);row.appendChild(zone);
    return;
  }
  var r=R.r,id=r.id,integ=PACK_INT[id],deja=PACKS[id]&&PACKS[id].r?PACKS[id]:null,avant,parti,pris=packStockagePris(r);
  row.appendChild(el("p","plab",r.titre));
  row.appendChild(el("p","src",packCompte(r)+(r.statut==="prête"?"":t("aut.en_prep"))));
  if(PK.maj)row.appendChild(el("p","src pk-maj",nb(t("aut.maj_texte",{x:packMajTexte(PK.maj)}))));
  else if(deja)row.appendChild(el("p","src",t("aut.maj_ce_cours",{date:dateCourte(deja.p.maj)})));
  else if(integ)row.appendChild(el("p","src",t("aut.remplace",{titre:integ.titre,id:id})));
  avant=deja?asArray(deja.p.ids):(integ?packIdsDe(integ):[]);
  parti=avant.filter(function(x){return R.ids.indexOf(x)<0;});
  if(parti.length)row.appendChild(el("p","pk-avert",tn("aut.parti",parti.length,{liste:parti.slice(0,5).join(", ")+(parti.length>5?"…":"")})));
  var bi=packBiais(r);
  if(bi.trop)row.appendChild(el("p","pk-avert",t("aut.biais",{p:Math.round(100*bi.n/bi.tot),n:bi.n,tot:bi.tot})));
  if(r.blocs&&r.blocs.calcul&&!CALCULS[id])row.appendChild(el("p","src",t("aut.calcul_ne_voyage")));
  if(pris){row.appendChild(el("p","pk-avert",t("aut.stockage_pris",{s:r.stockage,p:pris})));return;}
  if(integ){row.appendChild(el("p","src",t("aut.univers_nom",{nom:(UNIV_BY[integ.programme]||{}).nom||integ.programme})));}
  else{
    var lab=el("label","pk-univ"),sel=el("select","field"),pref=deja?deja.p.programme:(r.programme&&UNIV_BY[r.programme]?r.programme:UNIV);
    sel.id="pk-univ";lab.appendChild(el("span",null,t("aut.dans_univers")));
    UNIVERS.forEach(function(u){var o=el("option",null,u.nom);o.value=u.id;if(u.id===pref)o.selected=true;sel.appendChild(o);});
    lab.appendChild(sel);row.appendChild(lab);
  }
  var add=el("button","sbtn",t(deja||integ?"aut.maj_cours":"aut.ajouter_matieres"));add.type="button";add.id="b-pk-ajout";
  add.addEventListener("click",function(){
    var res=packEnregistrer(PK.texte,$("pk-univ")?$("pk-univ").value:null);
    if(res.err){PK.res={r:null,err:res.err,ids:[]};renderPkRes();return;}
    PK.res=null;PK.maj=null;$("pk-texte").value="";
    activate(res.r.id);BACK="home";NAV_PRE.home="bach";renderHome();show("home");
  });
  bt.appendChild(add);row.appendChild(bt);
}
/* Garde un pack lu et l'ajoute aux matières sans recharger l'app (même préparation qu'au démarrage, 02) */
function packEnregistrer(texte,prog){
  var res=packLire(texte),r,id,rec,l,pris;
  if(!res.r)return {err:res.err};
  r=res.r;id=r.id;pris=packStockagePris(r);
  if(pris)return {err:[t("aut.err_stockage_pris",{s:r.stockage,p:pris})]};
  rec={id:id,programme:prog||(PACKS[id]&&PACKS[id].p.programme)||r.programme||UNIV,maj:Date.now(),texte:texte,ids:res.ids};
  if(!packLsSet(KPACK+id,rec))return {err:[t("aut.err_memoire_pleine")]};
  l=packListe();if(l.indexOf(id)<0){l.push(id);packLsSet(KPACKS,l);}
  r=packPreparer(r,rec.programme);PACKS[id]={p:rec,r:r};packPlacer(r);
  MATS[id]=matiereDe(r);if(MATS_ORDER.indexOf(id)<0)MATS_ORDER.push(id);
  return {r:r};
}
/* Retire un cours importé. Sa progression reste dans ce navigateur : réimporté, il la retrouve. Une matière de l'app
   qu'il remplaçait revient telle qu'assemblée. */
function packRetirer(id){
  var b=PACK_INT[id],i;
  try{localStorage.removeItem(KPACK+id);}catch(e){}
  packLsSet(KPACKS,packListe().filter(function(x){return x!==id;}));
  delete PACKS[id];
  for(i=0;i<RECETTES.length;i++){if(RECETTES[i].id===id){if(b)RECETTES[i]=b;else RECETTES.splice(i,1);break;}}
  if(b){MATS[id]=matiereDe(b);}
  else if(MONDES_BY[id]&&UNIV_BY[MONDES_BY[id].univers]){b=systemeRecette(MONDES_BY[id]);RECETTES.push(b);MATS[id]=matiereDe(b);}  /* v13 : le système reste, sans cours (12l) */
  else{delete MATS[id];i=MATS_ORDER.indexOf(id);if(i>=0)MATS_ORDER.splice(i,1);}
  if(MAT&&MAT.k===id)activate(MATS[id]?id:univMat(UNIV));
}
function renderPkListe(){
  var ids=packListe(),box=$("pk-liste");clear(box);
  $("pk-liste-t").hidden=!ids.length;
  ids.forEach(function(id){
    var P=PACKS[id]||{},p=P.p||packLsGet(KPACK+id)||{},r=P.r,it=el("div","pk-item"),bt=el("div","ag-btns"),note=el("p","src pk-note"),zone=el("div");
    it.id="pk-item-"+id;
    it.appendChild(el("p","pk-titre",r?r.titre:t("aut.illisible",{id:id})));
    it.appendChild(el("p","src",r?t("aut.importe_le",{compte:packCompte(r),date:dateCourte(p.maj)}):((P.err||[])[0]||"")));
    if(r&&MATS[id]){
      var o=el("button","link",t("aut.ouvrir"));o.type="button";
      o.addEventListener("click",function(){activate(id);BACK="home";NAV_PRE.home="bach";renderHome();show("home");});
      bt.appendChild(o);
    }
    if(p.texte){  /* v13 : la consigne et le cours actuel, à donner à l'IA avec les nouveaux documents ; v18 : même choix de langue */
      var mj=el("button","link",t("aut.maj_bouton"));mj.type="button";mj.id="b-pk-maj-"+id;
      mj.addEventListener("click",function(){var c=pkConsigne();copierTexte(c.txt+"\n\n---\n\n"+tl(c.l,"aut.maj_intro")+"\n\n"+p.texte,note,zone,t("aut.maj_copie"));});
      bt.appendChild(mj);
    }
    var cp=el("button","link",t("aut.copier_pack"));cp.type="button";
    cp.addEventListener("click",function(){copierTexte(p.texte||"",note,zone,t("aut.pack_copie"));});
    bt.appendChild(cp);
    var rm=el("button","link pk-retirer",t(PK.retirer===id?"aut.retirer_vraiment":"aut.retirer"));rm.type="button";rm.id="b-pk-retirer-"+id;
    rm.addEventListener("click",function(){
      if(PK.retirer!==id){PK.retirer=id;renderPkListe();return;}
      PK.retirer=null;packRetirer(id);renderPacks();
    });
    bt.appendChild(rm);
    if(p.texte)it.appendChild(pkChoixLangue());  /* même choix que pour la consigne, pour « Compléter ou mettre à jour » */
    it.appendChild(bt);it.appendChild(note);it.appendChild(zone);
    box.appendChild(it);
  });
}
$("b-pk-modele").addEventListener("click",function(){
  copierTexte(pkConsigne().txt,$("pk-modele-note"),$("pk-modele-zone"),t("aut.consigne_ok"));
});
$("b-pk-verif").addEventListener("click",pkVerifier);
$("pk-fichier").addEventListener("change",function(){lireFichier($("pk-fichier"),function(t){$("pk-texte").value=t;pkVerifier();});});

/* ---------- Sauvegarde ---------- */
var SAUVE_PREF=["qfcc2.","tm."];
function sauveCle(k){
  var p=SAUVE_PREF.slice(),m;
  for(m in MATS){if(MATS.hasOwnProperty(m)&&MATS[m].pre)p.push(MATS[m].pre);}
  return p.some(function(x){return k.indexOf(x)===0;});
}
function sauveCles(){
  var l=[],i,k;
  try{for(i=0;i<localStorage.length;i++){k=localStorage.key(i);if(k&&sauveCle(k))l.push(k);}}catch(e){}
  return l.sort();
}
function sauveTexte(){
  var c={};
  sauveCles().forEach(function(k){try{c[k]=localStorage.getItem(k);}catch(e){}});
  return JSON.stringify({app:"revisions",sauvegarde:1,cree:new Date().toISOString(),cles:c});
}
/* Lit une sauvegarde : {o, n} ou {err} */
function sauveLire(txt){
  var o,n=0,k;
  try{o=JSON.parse(txt);}catch(e){return {err:t("aut.sv_illisible")};}
  if(!o||o.app!=="revisions"||o.sauvegarde!==1||!o.cles||typeof o.cles!=="object")return {err:t("aut.sv_pas_une")};
  for(k in o.cles){if(o.cles.hasOwnProperty(k)&&typeof o.cles[k]==="string"&&sauveCle(k))n++;}
  if(!n)return {err:t("aut.sv_vide")};
  return {o:o,n:n};
}
var SV={o:null};
function openSauve(){SV.o=null;renderSauve();show("sauve");}
function renderSauve(){
  var c=sauveCles(),t=0;
  c.forEach(function(k){try{t+=(localStorage.getItem(k)||"").length+k.length;}catch(e){}});
  $("sv-info").textContent=c.length?tn("aut.sv_info",c.length,{ko:Math.max(1,Math.round(t/1024))}):tx("aut.sv_rien");
  $("sv-compte").textContent=PROF_COMPTE?tx("aut.sv_compte"):"";
  $("sv-note").textContent="";$("sv-res").textContent="";clear($("sv-zone"));
  $("sv-conf").hidden=!SV.o;
}
$("b-sv-fichier").addEventListener("click",function(){
  var nom="revisions-sauvegarde-"+new Date().toISOString().slice(0,10)+".json";
  try{
    var u=URL.createObjectURL(new Blob([sauveTexte()],{type:"application/json"})),a=el("a");
    a.href=u;a.download=nom;document.body.appendChild(a);a.click();document.body.removeChild(a);
    setTimeout(function(){try{URL.revokeObjectURL(u);}catch(e){}},4000);
    $("sv-note").textContent=t("aut.sv_telecharge",{nom:nom});
  }catch(e){$("sv-note").textContent=t("aut.sv_telechargement_non");}
});
$("b-sv-copier").addEventListener("click",function(){
  copierTexte(sauveTexte(),$("sv-note"),$("sv-zone"),t("aut.sv_copiee"));
});
function svProposer(txt){
  var L=sauveLire(txt);SV.o=null;$("sv-conf").hidden=true;
  if(L.err){$("sv-res").textContent=L.err;return;}
  SV.o=L.o;$("sv-res").textContent="";
  var d=new Date(L.o.cree||0);
  $("sv-conf-t").textContent=t("aut.sv_conf",{du:isNaN(d.getTime())?"":t("aut.sv_du",{date:dateCourte(d.getTime())}),n:tn("aut.n_elements",L.n)});
  $("sv-conf").hidden=false;
}
$("b-sv-restaurer").addEventListener("click",function(){svProposer($("sv-texte").value);});
$("sv-fichier").addEventListener("change",function(){lireFichier($("sv-fichier"),function(t){$("sv-texte").value=t;svProposer(t);});});
$("b-sv-non").addEventListener("click",function(){SV.o=null;$("sv-conf").hidden=true;});
$("b-sv-oui").addEventListener("click",function(){
  var o=SV.o,k;if(!o)return;
  try{
    sauveCles().forEach(function(x){localStorage.removeItem(x);});
    for(k in o.cles){if(o.cles.hasOwnProperty(k)&&typeof o.cles[k]==="string"&&sauveCle(k))localStorage.setItem(k,o.cles[k]);}
  }catch(e){$("sv-res").textContent=t("aut.sv_echec");return;}
  SV.o=null;$("sv-conf").hidden=true;
  $("sv-res").textContent=t("aut.sv_ok");
  setTimeout(function(){try{location.reload();}catch(e){$("sv-res").textContent=t("aut.sv_ok_manuel");}},400);
});

/* ---------- Profil ---------- */
function profAutonomieMaj(){
  var n=packListe().length;
  $("b-prof-packs-s").textContent=n?tn("aut.prof_packs",n):t("aut.prof_packs_0");
}
$("b-prof-packs").addEventListener("click",openPacks);
$("b-prof-sauve").addEventListener("click",openSauve);
