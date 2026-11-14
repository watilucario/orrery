/* ---------- Changer de version (v13) : tout exporter, tout importer ----------
   Demande de l'auteur (26 oct.) : ses données (cours, exercices, matières, univers, progression, profil avec l'agenda
   relié) à part de l'app, dans un format que la nouvelle version (Maitrise, la version vierge) comprend. Format :
   docs/format-donnees.md. Exporter : les deux versions (Profil › Sauvegarder ou restaurer › « Tout exporter ») ; le
   contenu d'une matière du dépôt part en pack (PACKS_TEXTE, build.py), celui d'un cours importé aussi (son texte).
   Importer : Maitrise seulement, au premier lancement (12l) ou dans la sauvegarde. Le fichier est vérifié en entier
   (les packs par packLire, comme « Importer un cours ») ; rien n'est écrit s'il y a un problème. L'import remplace ce
   que l'app garde sur cet appareil, comme la restauration d'une sauvegarde, puis relance l'app. */
var DX_FORMAT=1;

/* ---------- Exporter ---------- */
function donneesExport(){
  var us=UNIVERS.map(function(u){return {id:u.id,nom:u.nom,description:u.description||"",libelle:u.libelle||tx("cr.libelle_defaut"),vide:u.vide||"",galaxie:u.galaxie};});
  var sy=MATS_ORDER.map(function(k){
    var M=MATS[k],P=PACKS[k],pk=P&&P.r&&P.p&&typeof P.p.texte==="string"?P.p.texte:(PACKS_TEXTE[k]||null);
    return {id:k,univers:M.programme,nom:M.titre,stockage:M.pre,planetes:M.THEMES.map(function(t){return {id:t.k,nom:t.n};}),pack:pk,revue:REVUES[k]||null};
  });
  var cles={};
  sauveCles().forEach(function(k){if(k===KPACKS||k.indexOf(KPACK)===0)return;try{cles[k]=localStorage.getItem(k);}catch(e){}});  /* les cours voyagent dans systemes[].pack */
  return {app:"maitrise",format:DX_FORMAT,cree:new Date().toISOString(),source:APP.nom,univers:us,systemes:sy,progression:{cles:cles}};
}
function donneesTexte(){return JSON.stringify(donneesExport());}
$("b-dx-fichier").addEventListener("click",function(){
  var nom="maitrise-"+new Date().toISOString().slice(0,10)+".json";
  try{
    var u=URL.createObjectURL(new Blob([donneesTexte()],{type:"application/json"})),a=el("a");
    a.href=u;a.download=nom;document.body.appendChild(a);a.click();document.body.removeChild(a);
    setTimeout(function(){try{URL.revokeObjectURL(u);}catch(e){}},4000);
    $("dx-note").textContent=tx("dx.dl_ok",{nom:nom});
  }catch(e){$("dx-note").textContent=tx("dx.dl_non");}
});
$("b-dx-copier").addEventListener("click",function(){
  copierTexte(donneesTexte(),$("dx-note"),$("dx-zone"),tx("dx.copie"));
});

/* ---------- Lire un fichier exporté : {o (normalisé), err, avert, resume} ---------- */
function donneesLire(txt){
  var err=[],avert=[],o,src;
  try{src=JSON.parse(String(txt==null?"":txt),function(k,v){return k==="__proto__"||k==="constructor"||k==="prototype"?undefined:v;});}
  catch(e){return {o:null,err:[tx("dx.illisible")],avert:[]};}
  if(!src||typeof src!=="object"||src.app!=="maitrise")return {o:null,err:[src&&src.app==="revisions"?tx("dx.sauvegarde")
    :tx("dx.pas_export")],avert:[]};
  if(src.format!==DX_FORMAT)return {o:null,err:[tx("dx.format",{f:src.format,v:DX_FORMAT})],avert:[]};
  o={source:mondeTexte(src.source,40),cree:typeof src.cree==="string"?src.cree:null,univers:[],systemes:[],cles:{}};
  var vu={},vs={},st={},nbCours=0,calc=[];
  asArray(src.univers).forEach(function(u,i){
    var ou=tx("dx.univers_n",{n:i+1});
    if(!u||typeof u.id!=="string"||!PACK_ID_RE.test(u.id)){err.push(tx("dx.id_invalide",{ou:ou}));return;}
    if(vu[u.id]){err.push(tx("dx.u_double",{ou:ou,id:u.id}));return;}
    if(!mondeTexte(u.nom,60)){err.push(tx("dx.u_nom",{ou:ou,id:u.id}));return;}
    vu[u.id]=1;
    o.univers.push({id:u.id,nom:mondeTexte(u.nom,60),description:mondeTexte(u.description,200),libelle:mondeTexte(u.libelle,30)||tx("cr.libelle_defaut"),vide:mondeTexte(u.vide,300),galaxie:mondeGalaxie(u.galaxie)});
  });
  asArray(src.systemes).forEach(function(s,i){
    var ou=tx("dx.systeme_n",{n:i+1}),nom,pl=[],vp={},res;
    if(!s||typeof s.id!=="string"||!PACK_ID_RE.test(s.id)){err.push(tx("dx.id_invalide",{ou:ou}));return;}
    nom=mondeTexte(s.nom,80)||s.id;ou="« "+nom+" »";
    if(vs[s.id]){err.push(tx("dx.s_double",{ou:ou,id:s.id}));return;}
    vs[s.id]=1;
    if(!vu[s.univers]){err.push(tx("dx.s_univers",{ou:ou,u:s.univers}));return;}
    if(typeof s.stockage!=="string"||!STOCK_RE.test(s.stockage)){err.push(tx("dx.s_stockage",{ou:ou,s:s.stockage}));return;}
    if(st[s.stockage]){err.push(tx("dx.s_meme",{ou:ou,autre:st[s.stockage],s:s.stockage}));return;}
    st[s.stockage]=nom;
    asArray(s.planetes).forEach(function(x){if(x&&typeof x.id==="string"&&PACK_ID_RE.test(x.id)&&!vp[x.id]&&mondeTexte(x.nom,80)){vp[x.id]=1;pl.push({id:x.id,nom:mondeTexte(x.nom,80)});}});
    var sy={id:s.id,univers:s.univers,nom:nom,stockage:s.stockage,planetes:pl,pack:null,ids:[],revue:revueValide(s.revue)?s.revue:null};
    if(s.pack!=null){
      if(typeof s.pack!=="string"){err.push(tx("dx.s_pack_texte",{ou:ou}));return;}
      res=packLire(s.pack);
      if(!res.r){err.push(tnx("dx.s_refuse",res.err.length,{ou:ou,liste:res.err.slice(0,3).join(" ; ")+(res.err.length>3?" ; …":"")}));return;}
      if(res.r.id!==s.id){err.push(tx("dx.s_id_cours",{ou:ou,a:res.r.id,b:s.id}));return;}
      if(res.r.stockage!==s.stockage){err.push(tx("dx.s_stock_cours",{ou:ou,a:res.r.stockage,b:s.stockage}));return;}
      sy.pack=s.pack;sy.ids=res.ids;nbCours++;
      if(res.r.blocs&&res.r.blocs.calcul)calc.push(nom);
      if(!pl.length)sy.planetes=res.r.themes.map(function(t){return {id:t.id,nom:t.nom};});
    }
    o.systemes.push(sy);
  });
  if(!o.univers.length)err.push(tx("dx.aucun_univers"));
  if(!o.systemes.length)err.push(tx("dx.aucune_matiere"));
  /* La progression : des clés de l'app, ou du stockage d'une de ses matières */
  var pc=src.progression&&src.progression.cles,k,n=0,hors=0;
  if(pc!=null&&(typeof pc!=="object"||pc instanceof Array))err.push(tx("dx.p_cles"));
  else if(pc){
    for(k in pc){if(pc.hasOwnProperty(k)){
      if(typeof pc[k]!=="string"){err.push(tx("dx.p_texte",{k:k}));continue;}
      if(k===KPACKS||k.indexOf(KPACK)===0){hors++;continue;}
      if(!(k.indexOf("qfcc2.")===0||k.indexOf("tm.")===0||Object.keys(st).some(function(p){return k.indexOf(p)===0;}))){err.push(tx("dx.p_cle",{k:k}));continue;}
      o.cles[k]=pc[k];n++;
    }}
  }
  if(hors)avert.push(tnx("dx.hors",hors));
  if(calc.length)avert.push(tx("dx.calcul",{liste:calc.length<2?calc.join(""):calc.slice(0,-1).join(", ")+tx("dx.et")+calc[calc.length-1]}));
  var d=o.cree?new Date(o.cree):null;
  o.resume=tnx("dx.r_univers",o.univers.length)+" · "+tnx("dx.r_matiere",o.systemes.length)+(nbCours?tx("dx.r_cours",{n:nbCours}):"")+tnx("dx.r_prog",n)
    +(d&&!isNaN(d.getTime())?tx("dx.r_date",{d:dateCourte(d.getTime())}):"")+(o.source?tx("dx.r_source",{s:o.source}):"");
  return {o:err.length?null:o,err:err,avert:avert};
}

/* ---------- Appliquer : tout remplacer sur cet appareil, puis relancer ---------- */
function donneesAppliquer(o){
  var now=Date.now(),k,prof=null,ls=[];
  try{prof=JSON.parse(o.cles[KPROF]||"null");}catch(e){prof=null;}
  if(!prof||typeof prof!=="object"||prof instanceof Array)prof={v:1,prenom:"",cree:now,conseils:{}};
  prof.guide=1;prof.maj=now;
  /* base : import complet. Sur le compte, ce qui avait été créé avant (sur un autre appareil) est laissé de côté (02) */
  prof.mondes={maj:now,base:now,
    univers:o.univers.map(function(u){return {id:u.id,nom:u.nom,description:u.description,libelle:u.libelle,vide:u.vide,galaxie:u.galaxie,cree:now};}),
    systemes:o.systemes.map(function(s){return {id:s.id,univers:s.univers,nom:s.nom,stockage:s.stockage,planetes:s.planetes,cree:now};})};
  try{
    sauveCles().forEach(function(x){localStorage.removeItem(x);});
    for(k in o.cles){if(o.cles.hasOwnProperty(k))localStorage.setItem(k,o.cles[k]);}
    o.systemes.forEach(function(s){
      if(!s.pack)return;
      var rec={id:s.id,programme:s.univers,maj:now,texte:s.pack,ids:s.ids};
      if(s.revue)rec.revue=s.revue;
      localStorage.setItem(KPACK+s.id,JSON.stringify(rec));ls.push(s.id);
    });
    localStorage.setItem(KPACKS,JSON.stringify(ls));
    localStorage.setItem(KPROF,JSON.stringify(prof));localStorage.setItem(KONB,"1");
  }catch(e){return tx("dx.echec");}
  return null;
}

/* ---------- L'outil d'import (sauvegarde de Maitrise, premier lancement) : coller ou ouvrir, vérifier, importer ---------- */
function dxWidget(box,pre){
  var ta=el("textarea","field mono"),bt=el("div","ag-btns"),v=el("button","sbtn",tx("dx.verifier")),lab=el("label","link pk-fichier",tx("dx.ouvrir_fichier")),fi=el("input"),res=el("div");
  ta.id=pre+"-texte";ta.rows=3;ta.placeholder=tx("dx.ph");
  ["spellcheck","autocapitalize","autocorrect"].forEach(function(a){ta.setAttribute(a,a==="spellcheck"?"false":"off");});
  v.type="button";v.id="b-"+pre+"-verif";
  fi.type="file";fi.id=pre+"-fichier";fi.accept=".json,application/json,text/plain";fi.hidden=true;lab.setAttribute("for",fi.id);
  res.id=pre+"-res";res.setAttribute("aria-live","polite");
  v.addEventListener("click",function(){dxVerifier(ta.value,res,pre);});
  fi.addEventListener("change",function(){lireFichier(fi,function(t){ta.value=t;dxVerifier(t,res,pre);});});
  bt.appendChild(v);bt.appendChild(lab);bt.appendChild(fi);
  var row=el("div","prow");row.appendChild(ta);row.appendChild(bt);row.appendChild(res);box.appendChild(row);
}
function dxVerifier(txt,res,pre){
  var L=trim(txt)?donneesLire(txt):{o:null,err:[tx("dx.coller_d_abord")],avert:[]};
  clear(res);
  var c=el("div","pk-carte dx-carte");res.appendChild(c);
  if(!L.o){
    c.appendChild(el("p","plab",tnx("dx.a_corriger",L.err.length)));
    var ul=el("ul","pk-erreurs");
    L.err.slice(0,30).forEach(function(m){ul.appendChild(el("li",null,m));});
    if(L.err.length>30)ul.appendChild(el("li",null,tx("dx.autres",{n:L.err.length-30})));
    c.appendChild(ul);c.appendChild(el("p","src",tx("dx.rien")));
    return;
  }
  c.appendChild(el("p","plab",tx("dx.pret")));
  c.appendChild(el("p","src",L.o.resume));
  L.avert.forEach(function(a){c.appendChild(el("p","pk-avert",a));});
  var deja=sauveCles().length;
  c.appendChild(el("p",null,deja?tx("dx.remplacer_q"):tx("dx.redemarre_q")));
  var bt=el("div","ag-btns"),oui=el("button","sbtn",deja?tx("dx.oui_remplacer"):tx("dx.importer")),non=el("button","link",tx("dx.annuler")),fin=el("p","src pk-note");
  oui.type="button";oui.id="b-"+pre+"-oui";non.type="button";non.id="b-"+pre+"-non";fin.id=pre+"-fin";fin.setAttribute("role","status");
  non.addEventListener("click",function(){clear(res);});
  oui.addEventListener("click",function(){
    var e=donneesAppliquer(L.o);
    if(e){fin.textContent=e;return;}
    oui.disabled=true;non.hidden=true;
    fin.textContent=tx("dx.importees");
    setTimeout(function(){try{location.reload();}catch(x){fin.textContent=tx("dx.importees_recharge");}},400);
  });
  bt.appendChild(oui);bt.appendChild(non);c.appendChild(bt);c.appendChild(fin);
}
/* Dans la sauvegarde : l'import n'existe que dans Maitrise (la version perso garde son contenu assemblé) */
if(APP.vierge){$("sv-import").hidden=false;dxWidget($("sv-import-w"),"dx");}
