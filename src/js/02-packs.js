/* ---------- Packs de cours (v7) : une matière entière dans un seul texte, importée sans assemblage ----------
   Un pack commence par « # Pack · <titre> » : un en-tête (lignes « Clé : valeur », et un bloc ```json facultatif avec la
   recette entière), puis des sections « # QCM · <thème> », « # Cas », « # Exercices », « # Simulation », « # Règles »,
   jusqu'à « # Fin du pack ». Dans chaque section, le format des fichiers de univers/ (univers/README.md, « Packs »).
   Une IA en écrit un à partir d'un cours avec docs/modele-de-pack.md (MODELE_PACK, copié depuis l'app).
   packLire() refait les contrôles de build.py et rend la même recette (test_packs vérifie la parité avec RECETTES) ;
   chaque erreur donne la ligne du pack. Plus souple que build.py sur la forme : « Clé: valeur », « **Clé :** valeur »,
   espace insécable avant les deux-points, options « * [x] » ; consignes de l'aide absentes : PACK_CONSIGNES.
   Les packs importés (Profil › Importer un cours, 12h) sont gardés dans ce navigateur : qfcc2.packs (identifiants, dans
   l'ordre) et qfcc2.pack.<id> = {id, programme, maj, texte, ids}. Au démarrage, ils rejoignent RECETTES avant la
   construction des matières (08) : même chemin que le contenu assemblé. Un pack qui porte l'identifiant d'une matière
   assemblée la remplace en gardant son stockage et son univers : la progression suit. Le calcul mental (du code) ne
   voyage pas dans un pack ; une matière assemblée remplacée garde le sien. */
var KPACKS="qfcc2.packs",KPACK="qfcc2.pack.",PACKS={},PACK_INT={};
var PACK_ID_RE=/^[A-Za-z0-9_-]+$/,PACK_NIVEAUX=["comprendre","faire","expliquer","recommander"],PACK_STATUTS=["prête","en préparation"];
var PACK_M_QCM=["Thème","Explication","Source","Ordre fixe","Barème","Niveau","Regard","Rappel","Repère","Repère après","Type"];
/* v13.4 : associer, ordonner, trous (build.py : TYPES_Q, PAIRE_RE, ORDRE_RE) */
var TYPES_Q=["associer","ordonner","trous"],PAIRE_RE=/^- (?!\[)(.+?) = (.+)$/,ORDRE_RE=/^(\d+)\. (.+)$/;
var PACK_M_EX=["Thème","Étiquette","Durée conseillée","Barème","Source","Niveau","Regard","Repère"];
var PACK_M_SUB=["Réponse","Tolérance","Accepté aussi","Calcul","Attendu","Indice","Niveau","Regard"];
var PACK_M_TETE=["Titre","Identifiant","Univers","Surtitre","Résumé","Sources","Agenda","Thème","Regard","Mise à jour"];
var PACK_M_CONS=["Thème","Documents","Unité","Source","Montants","Signes"],PACK_M_LIGNE=["Cases","Admis","Résultat","Explication","Indice"];  /* v8 : constructions */
var PACK_M_TOUTES=PACK_M_QCM.concat(PACK_M_EX,PACK_M_SUB,PACK_M_TETE,PACK_M_CONS,PACK_M_LIGNE,["Thèmes","Introduction"]);
var PACK_CONS={"Consigne · explication d'une question":"instr","Consigne · question sur un exercice":"exq","Consigne · correction d'une copie":"corr"};
RECETTES.forEach(function(r){PACK_INT[r.id]=r;});

/* Situer une ligne dans un message d'erreur (« ligne 12 », « ligne 12 (id-de-la-question) ») : la phrase vient de la langue */
function packLigne(n){return tx("pack.ligne",{n:n});}
function packLigneId(n,id){return tx("pack.ligne_id",{n:n,id:id});}
function packDans(l,x){return l.indexOf(x)>=0;}
function packTrim(s){return String(s).replace(/^\s+|\s+$/g,"");}
/* Ligne de suite d'une explication, d'un calcul ou d'une réponse attendue : « | » passe à la ligne (écritures comptables),
   espaces insécables gardés (retrait des crédits) ; sinon collée par une espace. Même règle que build.py. */
function packSuite(l){return l.indexOf("| ")===0?"\n"+l.slice(2).replace(/^[ \t]+|[ \t]+$/g,""):" "+packTrim(l);}
/* Une ligne écrite à peu près au format devient exactement au format (même règle dans build.py, norm_ligne) */
function packNormLigne(l){
  var m;
  l=l.replace(/[\u00a0\u202f]:/g," :");
  m=/^\*\*([^*:]{1,30}?)\s*:\s*\*\*\s*(.*)$/.exec(l);
  if(m&&packDans(PACK_M_TOUTES,packTrim(m[1])))return packTrim(m[1])+" : "+m[2];
  m=/^([^:]{1,30}?)\s*:\s+(.*)$/.exec(l);
  if(m&&packDans(PACK_M_TOUTES,packTrim(m[1]))&&l.indexOf(packTrim(m[1])+" : ")!==0)return packTrim(m[1])+" : "+m[2];
  m=/^\* \[( |x|X)\] (.*)$/.exec(l);
  if(m)return "- ["+m[1]+"] "+m[2];
  return l;
}
function packMeta(l,cles){var m=/^(.+?) : (.*)$/.exec(l);return m&&packDans(cles,m[1])?[m[1],packTrim(m[2])]:null;}
function packOui(v,ou,err){if(v==="oui"||v==="non")return v==="oui";err.push(tx("pack.oui_ou_non_attendu_pas",{ou:ou,v:v}));return false;}
/* Titres d'un niveau (## ou ###) entre debut et fin : [{n : ligne du titre, titre, d : début du corps, f : fin}] */
function packBlocs(ls,niv,debut,fin){
  var marque=new Array(niv+1).join("#")+" ",pos=[],i,out=[];
  for(i=debut;i<fin;i++){if(ls[i].indexOf(marque)===0)pos.push(i);}
  pos.forEach(function(p,k){out.push({n:p,titre:packTrim(ls[p].slice(marque.length)),d:p+1,f:k+1<pos.length?pos[k+1]:fin});});
  return out;
}
function packCitation(ls,d,f){
  var out=[],i;
  for(i=d;i<f;i++){if(ls[i]===">"||ls[i].indexOf("> ")===0)out.push(ls[i].indexOf("> ")===0?ls[i].slice(2):"");}
  return out.join("\n");
}
var PACK_NB=/^([−-]?\d+(?:[ \u00a0\u202f]\d{3})*(?:,\d+)?)\s*([\s\S]*)$/;
function packNombre(s){
  var m=PACK_NB.exec(packTrim(s));
  if(!m)return [null,s];
  return [parseFloat(m[1].replace(/[ \u00a0\u202f]/g,"").replace("−","-").replace(",",".")),packTrim(m[2])];
}
function packMaitrise(it,m,ctl,ou,err){
  [["Niveau","n",ctl.niv,tx("pack.nom_niveau")],["Regard","r",ctl.reg,tx("pack.nom_regard")]].forEach(function(x){
    if(m[x[0]]===undefined)return;
    if(packDans(x[2],m[x[0]]))it[x[1]]=m[x[0]];
    else err.push(tx("pack.inconnu",{ou:ou,quoi:x[3],v1:m[x[0]],liste:(x[2].join(", ")||tx("pack.aucun_regard_entete"))}));
  });
}
function packCles(m){var k,n=0;for(k in m){if(m.hasOwnProperty(k)&&k!=="Thème"&&k!=="Niveau"&&k!=="Regard"&&k!=="Rappel"&&k!=="Repère"&&k!=="Repère après"&&k!=="Type")n++;}return n;}
/* « Repère : DU, EH » (v7.3) : lignes des documents types ; leur existence est vérifiée à la fin de packLire */
function packReperes(v,ou,err){
  var ids=v.split(",").map(packTrim).filter(function(x){return !!x;});
  ids.forEach(function(x){if(!PACK_ID_RE.test(x))err.push(tx("pack.repere_invalide_lettres_chiffres_et",{ou:ou,x:x}));});
  if(!ids.length)err.push(tx("pack.repere_vide",{ou:ou}));
  return ids;
}
/* Une question à choix (build.py : lire_qcm) */
function packQcm(ls,d,f,ident,err,themes,theme,ctl,niv){
  var q=[],opts=[],bonne=[],m={},vu=false,cle=null,i,l,mo,mm,mp,mr,ou=packLigneId(d,ident),ctx=[],paires=[],ordre=[];
  function ici(j){return packLigneId(j+1,ident);}
  for(i=d;i<f;i++){
    l=ls[i];
    if(!l){cle=null;continue;}
    mo=/^- \[( |x|X)\] (.*)$/.exec(l);mm=packMeta(l,PACK_M_QCM);mp=PAIRE_RE.exec(l);mr=ORDRE_RE.exec(l);
    if(mp&&m.Type==="associer"){paires.push([packTrim(mp[1]),packTrim(mp[2])]);vu=true;cle=null;}
    else if(mr&&m.Type==="ordonner"){
      if(parseInt(mr[1],10)!==ordre.length+1)err.push(tx("pack.etapes_a_numeroter_1_2",{ou:ici(i)}));
      ordre.push(packTrim(mr[2]));vu=true;cle=null;
    }
    else if(mo){
      if(packCles(m))err.push(tx("pack.option_apres_l_explication",{ou:ici(i)}));
      if(mo[1]!==" ")bonne.push(opts.length);
      opts.push(packTrim(mo[2]));vu=true;cle=null;
    }else if(mm){
      if(m[mm[0]]!==undefined)err.push(tx("pack.en_double",{ou:ici(i),cle:mm[0]}));
      m[mm[0]]=mm[1];cle=mm[0];
    }else if(cle==="Explication"||cle==="Source"){m[cle]+=packSuite(l);}
    else if((l===">"||l.indexOf("> ")===0)&&!vu&&!q.length&&!packCles(m)){ctx.push(l.indexOf("> ")===0?l.slice(2):"");}  /* v7.3 : énoncé de la question */
    else if(!vu&&!packCles(m)){q.push(packTrim(l));}
    else{err.push(tx("pack.ligne_non_reconnue",{ou:ici(i),extrait:l.slice(0,60)}));}
  }
  var it={id:ident,th:theme||m["Thème"]||"",q:q.join(" "),o:opts,c:bonne.length===1?bonne[0]:-1,e:m.Explication||"",s:m.Source||""};
  var ty=m.Type===undefined?null:m.Type;
  function uniques(a){return a.every(function(x,j){return a.indexOf(x)===j;});}
  if(ty!==null&&!packDans(TYPES_Q,ty)){err.push(tx("pack.type_inconnu",{ou:ou,ty:ty,liste:TYPES_Q.join(", ")}));ty=null;}
  if(ty)it.t=ty;
  if(ty==="associer"){
    it.o=paires.map(function(p){return p[0];});it.d=paires.map(function(p){return p[1];});it.c=-1;
    if(opts.length)err.push(tx("pack.type_associer_des_lignes_gauche",{ou:ou}));
    if(paires.length<3||paires.length>6)err.push(tx("pack.type_associer_3_a_6",{ou:ou}));
    if(!uniques(it.o)||!uniques(it.d))err.push(tx("pack.type_associer_chaque_cote_sans",{ou:ou}));
  }else if(ty==="ordonner"){
    it.o=ordre;it.c=-1;
    if(opts.length)err.push(tx("pack.type_ordonner_des_lignes_1",{ou:ou}));
    if(ordre.length<3||ordre.length>7)err.push(tx("pack.type_ordonner_3_a_7",{ou:ou}));
    if(!uniques(ordre))err.push(tx("pack.type_ordonner_deux_etapes_identiques",{ou:ou}));
  }else if(ty==="trous"&&it.q.indexOf("___")<0)err.push(tx("pack.type_trous_la_question_contient",{ou:ou}));
  if(m["Ordre fixe"]!==undefined&&packOui(m["Ordre fixe"],ou,err))it.fixed=true;
  if(m["Barème"]!==undefined&&packOui(m["Barème"],ou,err))it.b=true;
  if(m.Rappel!==undefined)it.rl=packOui(m.Rappel,ou,err);
  if(ctx.length){it.ctx=ctx.join("\n").replace(/^\n+|\n+$/g,"");packEnonce(ls,d,f,err);}
  if(m["Repère"]!==undefined)it.rp=packReperes(m["Repère"],ou,err);
  if(m["Repère après"]!==undefined)it.rpa=packReperes(m["Repère après"],ou,err);  /* montrées seulement avec la correction */
  if(niv&&m.Niveau===undefined)m.Niveau=niv;
  packMaitrise(it,m,ctl,ou,err);
  if(!PACK_ID_RE.test(ident))err.push(tx("pack.identifiant_invalide_lettres_sans_accents",{ou:ou,id:ident}));
  if(!it.q)err.push(tx("pack.question_vide",{ou:ou}));
  if(ty==="associer"||ty==="ordonner"){}
  else if(opts.length<(ty==="trous"?1:2))err.push(tx("pack.il_faut_au_moins_2",{ou:ou}));
  if(ty!=="associer"&&ty!=="ordonner"&&bonne.length!==1)err.push(tx("pack.il_faut_exactement_une_bonne",{ou:ou,n:bonne.length}));
  if(!it.e)err.push(tx("pack.explication_manquante_explication",{ou:ou}));
  if(!it.s)err.push(tx("pack.source_manquante_source",{ou:ou}));
  if(!packDans(themes,it.th))err.push(tx("pack.theme_inconnu_de_l_en",{ou:ou,th:it.th}));
  return it;
}
/* v13.4 : associer, ordonner et trous seulement dans une section « # QCM » (build.py : sans_type) */
function packSansType(items,err){items.forEach(function(it){if(it.t)err.push(tx("pack.type_seulement_dans_les_qcm",{id:it.id,type:it.t}));});return items;}
function packCas(ls,d0,f0,themes,err,ctl){
  var out=[];
  packBlocs(ls,2,d0,f0).forEach(function(b){
    var ou=packLigne(b.n+1),p=b.titre.indexOf(" · "),k=p<0?b.titre:b.titre.slice(0,p),nom=p<0?"":b.titre.slice(p+3);
    var et=packBlocs(ls,3,b.d,b.f),tete=et.length?et[0].n:b.f,th="",niv=null,i,mm;
    for(i=b.d;i<tete;i++){mm=packMeta(ls[i],["Thème"]);if(mm){th=mm[1];break;}}
    for(i=b.d;i<tete;i++){mm=packMeta(ls[i],["Niveau"]);if(mm){niv=mm[1];break;}}
    var c={k:packTrim(k),th:th,n:packTrim(nom),ctx:packCitation(ls,b.d,tete),steps:packSansType(et.map(function(s){return packQcm(ls,s.d,s.f,s.titre,err,themes,th,ctl,niv);}),err)};
    if(!c.n)err.push(tx("pack.titre_attendu_cle_nom_du",{ou:ou}));
    if(!packDans(themes,th))err.push(tx("pack.theme_inconnu",{ou:ou,th:th}));
    if(!c.ctx)err.push(tx("pack.enonce_manquant_lignes",{ou:ou}));
    packEnonce(ls,b.d,tete,err);
    if(!c.steps.length)err.push(tx("pack.aucune_etape_identifiant",{ou:ou}));
    out.push(c);
  });
  return out;
}
function packExos(ls,d0,f0,themes,err,ctl){
  var out=[];
  packBlocs(ls,2,d0,f0).forEach(function(b){
    var ou=packLigne(b.n+1),p=b.titre.indexOf(" · "),ident=packTrim(p<0?b.titre:b.titre.slice(0,p)),t=p<0?"":b.titre.slice(p+3);
    var qs=packBlocs(ls,3,b.d,b.f),tete=qs.length?qs[0].n:b.f,m={},i,mm,l;
    for(i=b.d;i<tete;i++){
      l=ls[i];mm=packMeta(l,PACK_M_EX);
      if(mm)m[mm[0]]=mm[1];
      else if(l&&!(l===">"||l.indexOf("> ")===0))err.push(tx("pack.ligne_non_reconnue",{ou:ou,extrait:l.slice(0,60)}));
    }
    var e={id:ident,th:m["Thème"]||"",t:packTrim(t)},dm=/^(\d+) min$/.exec(m["Durée conseillée"]||"");
    if(m["Étiquette"]!==undefined)e.tl=m["Étiquette"];
    e.min=dm?parseInt(dm[1],10):0;
    e.b=m["Barème"]!==undefined?packOui(m["Barème"],ou,err):false;
    e.src=m.Source||"";e.ctx=packCitation(ls,b.d,tete);e.subs=[];
    packEnonce(ls,b.d,tete,err);
    if(m.Regard!==undefined)packMaitrise(e,{Regard:m.Regard},ctl,ou,err);
    if(m["Repère"]!==undefined)e.rp=packReperes(m["Repère"],ou,err);
    qs.forEach(function(qb){
      var ou2=packLigne(qb.n+1),q=[],sm={},cle=null,j,s,a;
      for(j=qb.d;j<qb.f;j++){
        l=ls[j];
        if(!l){cle=null;continue;}
        mm=packMeta(l,PACK_M_SUB);
        if(mm){sm[mm[0]]=mm[1];cle=mm[0];}
        else if(cle==="Calcul"||cle==="Attendu"||cle==="Indice"){sm[cle]+=packSuite(l);}
        else if(!Object.keys(sm).length){q.push(packTrim(l));}
        else{err.push(tx("pack.ligne_non_reconnue",{ou:ou2,extrait:l.slice(0,60)}));}
      }
      if(sm["Réponse"]!==undefined){
        a=packNombre(sm["Réponse"]);
        s={k:"num",q:q.join(" "),a:a[0],u:a[1],sol:sm.Calcul||""};
        if(a[0]===null)err.push(tx("pack.reponse_doit_commencer_par_un",{ou:ou2}));
        if(sm["Tolérance"]!==undefined)s.tol=packNombre(sm["Tolérance"])[0];
        if(sm["Accepté aussi"]!==undefined)s.alt=sm["Accepté aussi"].split(" ou ").map(function(x){return packNombre(x)[0];});
        if(a[0]!==null&&a[0]<0)s.neg=true;
        if(!s.sol)err.push(tx("pack.calcul_manquant",{ou:ou2}));
        if((s.alt&&packDans(s.alt,null))||(s.tol===null))err.push(tx("pack.nombre_illisible",{ou:ou2}));
      }else if(sm.Attendu!==undefined){
        s={k:"txt",q:q.join(" "),m:sm.Attendu};
      }else{err.push(tx("pack.il_faut_reponse_chiffree_ou",{ou:ou2}));return;}
      if(sm.Indice!==undefined)s.ind=sm.Indice;
      if(sm.Niveau===undefined&&m.Niveau!==undefined)sm.Niveau=m.Niveau;
      packMaitrise(s,sm,ctl,ou2,err);
      if(!s.q)err.push(tx("pack.question_vide",{ou:ou2}));
      e.subs.push(s);
    });
    if(!PACK_ID_RE.test(e.id))err.push(tx("pack.identifiant_invalide",{ou:ou,id:e.id}));
    if(!e.t)err.push(tx("pack.titre_attendu_identifiant_titre",{ou:ou}));
    if(!packDans(themes,e.th))err.push(tx("pack.theme_inconnu",{ou:ou,th:e.th}));
    if(!e.min)err.push(tx("pack.duree_conseillee_n_min_manquante",{ou:ou}));
    if(!e.src)err.push(tx("pack.source_manquante",{ou:ou}));
    if(!e.ctx)err.push(tx("pack.enonce_manquant_lignes",{ou:ou}));
    if(!e.subs.length)err.push(tx("pack.aucune_question_question_n",{ou:ou}));
    out.push(e);
  });
  return out;
}
/* Règles et consignes de l'aide de l'IA : celles qui manquent viennent de PACK_CONSIGNES */
function packRegles(ls,secs,themes,err){
  var out={regles:[],par_theme:{}};
  secs.forEach(function(sec){
    packBlocs(ls,2,sec.d,sec.f).forEach(function(b){
      var ou=packLigne(b.n+1),corps=[],i,th,n;
      for(i=b.d;i<b.f;i++){if(ls[i])corps.push(ls[i]);}
      if(PACK_CONS[b.titre]){out[PACK_CONS[b.titre]]=corps.join("\n");}
      else if(b.titre.indexOf("Règle · ")===0){
        th=corps.length?packMeta(corps[0],["Thèmes"]):null;
        if(!th){err.push(tx("pack.la_ligne_themes_doit_suivre",{ou:ou}));return;}
        n=out.regles.length;out.regles.push(corps.slice(1).join("\n"));
        th[1].split(",").map(packTrim).filter(function(x){return !!x;}).forEach(function(t){
          if(!packDans(themes,t))err.push(tx("pack.theme_inconnu",{ou:ou,th:t}));
          (out.par_theme[t]=out.par_theme[t]||[]).push(n);
        });
      }else{err.push(tx("pack.section_inconnue_regle_nom_ou",{ou:ou,titre:b.titre}));}
    });
  });
  ["instr","exq","corr"].forEach(function(k){if(out[k]===undefined)out[k]=(typeof PACK_CONSIGNES!=="undefined"&&PACK_CONSIGNES[k])||"";});
  return out;
}
/* La section clé d'une fiche : « L'essentiel » en tête (ancien format) ou « À retenir » en dernier (v13.1) (build.py : cle_fiche) */
function ficheCle(k){return k.intro?k.sections[k.sections.length-1]:k.sections[0];}
/* v13 : un thème sans « Règle · » reçoit « L'essentiel » de sa fiche comme règle envoyée à l'IA (build.py : regles_des_fiches) */
function packReglesFiches(cl,cours,themes){
  var noms={};themes.forEach(function(x){noms[x.id]=x.nom||x.id;});
  cours.forEach(function(k){
    var t=k.th;
    if(cl.par_theme.hasOwnProperty(t)||!k.sections.length)return;
    cl.par_theme[t]=[cl.regles.length];
    cl.regles.push((noms[t]||t)+" : l'essentiel\n"+ficheCle(k).md);
  });
}
/* ---------- Figures et tableaux (v7.3) : dans les fiches et les énoncés (build.py : controle_figure, controle_visuels) ----------
   Une figure s'écrit entre « ::: <type> <titre> » et « ::: ». packFigure la lit pour la dessiner (03d) et pour la
   contrôler à l'import d'un pack, avec les règles de build.py : une cascade doit tomber juste, les deux côtés d'un
   bilan être égaux, un camembert faire son total. Rend {f : la figure, err : [[indice de ligne, message]]} (-1 : la
   ligne « ::: »). Format : univers/README.md, « Figures ». */
var FIG_TYPES=["cascade","bilan","barres","courbe","camembert","etapes","essai","ecriture"],FIG_DEBUT=/^:::\s*(\S+)\s*(.*)$/;
var FIG_CLE=/^(Note|Unité|Séries|Axe|Total|Écart|Colonnes)\s*:\s*(.*)$/;
var FIG_CLES={cascade:["Note","Unité"],bilan:["Note","Unité","Colonnes","Écart"],barres:["Note","Unité","Séries"],courbe:["Note","Unité","Axe"],camembert:["Note","Unité","Total"],etapes:["Note"],essai:[],ecriture:["Note"]};
function figNombre(s){var r=packNombre(packTrim(s).replace(/^([−-])\s+(?=\d)/,"$1"));return r[0]!==null&&r[1]===""?r[0]:null;}
function figDec(s){var m=/,(\d+)\s*$/.exec(packTrim(s));return m?m[1].length:0;}
function figTol(vs){return vs.some(function(v){return v!==Math.floor(v);})?0.05:1;}
function figFmt(v,dec){
  var a=Math.abs(v),s=dec!=null?a.toFixed(dec):a===Math.floor(a)?String(a):a.toFixed(2).replace(/0+$/,"").replace(/\.$/,""),p=s.split(".");
  return (v<0?"− ":"")+p[0].replace(/(\d)(?=(\d{3})+$)/g,"$1 ")+(p[1]?","+p[1]:"");
}
function figParts(l){return l.split("|").map(packTrim);}
function packFigure(typ,titre,corps){
  var e=[],f={type:typ,titre:titre},cles={},ecarts=[],data=[],i,l,m,k,v;
  if(!packDans(FIG_TYPES,typ))return {f:f,err:[[-1,"figure « "+typ+" » inconnue ("+FIG_TYPES.join(", ")+")"]]};
  if(!titre)e.push([-1,tx("pack.titre_manquant_titre",{typ:typ})]);
  for(i=0;i<corps.length;i++){
    l=packTrim(corps[i]);if(!l)continue;
    m=FIG_CLE.exec(l);
    if(m){
      k=m[1];v=packTrim(m[2]);
      if(!packDans(FIG_CLES[typ],k))e.push([i,tx("pack.ne_va_pas_dans_une",{code:k,typ:typ})]);
      else if(k==="Écart")ecarts.push([i,v]);
      else if(cles[k])e.push([i,tx("pack.en_double_2",{code:k})]);
      else if(!v)e.push([i,tx("pack.vide",{code:k})]);
      else cles[k]=[i,v];
      continue;
    }
    data.push([i,l]);
  }
  var dec=0;f.dec=0;
  function nb(i,s,pos){
    var x=figNombre(s);
    if(x===null){e.push([i,tx("pack.nombre_illisible_2",{s:s})]);return null;}
    dec=figDec(s);if(dec>f.dec)f.dec=dec;
    if(pos&&x<0){e.push([i,tx("pack.montant_negatif_ici_le_signe",{s:s})]);return null;}
    return x;
  }
  function combien(n,lo,hi,quoi){if(n<lo||n>hi)e.push([-1,tx("pack.de_a_attendus_ici",{lo:lo,hi:hi,quoi:quoi,n:n})]);}
  if(cles["Note"])f.note=cles["Note"][1];
  if(cles["Unité"])f.unite=cles["Unité"][1];
  if(typ==="cascade"){
    var tot=null,vus=[],debut=true,dernier=null;f.pas=[];
    data.forEach(function(x){
      var mm=/^([+=]|[−-])\s+([\s\S]*)$/.exec(x[1]),p=mm?figParts(mm[2]):[],sg,val;
      if(p.length!==2||!p[0]){e.push([x[0],tx("pack.ligne_attendue_libelle_montant_libelle")]);tot=null;debut=false;return;}
      sg=(mm[1]==="−"||mm[1]==="-")?"-":mm[1];val=nb(x[0],p[1],sg!=="=");dernier=sg;
      if(val!==null){vus.push(val);f.pas.push({s:sg,l:p[0],v:val,k:dec});}
      if(debut){
        debut=false;
        if(sg==="-")e.push([x[0],tx("pack.la_cascade_commence_par_ou")]);
        tot=sg!=="-"?val:null;
      }else if(sg==="="){
        if(tot!==null&&val!==null&&Math.abs(tot-val)>figTol(vus))e.push([x[0],tx("pack.le_calcul_donne_la_ligne",{v1:p[0],v2:figFmt(tot),v3:p[1]})]);
        tot=val;
      }else if(tot!==null&&val!==null){tot=sg==="+"?tot+val:tot-val;}
      else tot=null;
    });
    combien(data.length,2,16,tx("pack.nom_lignes"));
    if(data.length&&dernier!=="=")e.push([data[data.length-1][0],tx("pack.la_cascade_finit_par_une")]);
  }else if(typ==="bilan"){
    var cote=0,sg2=0,sd=0,vs=[];f.g=[];f.d=[];f.ecarts=[];
    data.forEach(function(x){
      if(x[1]==="--"){if(cote)e.push([x[0],tx("pack.un_seul_entre_la_colonne")]);cote=1;return;}
      var p=figParts(x[1]),val;
      if((p.length!==2&&p.length!==3)||!p[0]||(p.length===3&&!p[2])){e.push([x[0],tx("pack.ligne_attendue_libelle_montant_ou")]);return;}
      val=nb(x[0],p[1],true);
      if(val!==null){vs.push(val);(cote?f.d:f.g).push({l:p[0],v:val,k:dec,fam:p[2]||""});if(cote)sd+=val;else sg2+=val;}
    });
    if(!cote)e.push([-1,tx("pack.il_manque_la_ligne_entre")]);
    else if(!(f.g.length>=1&&f.g.length<=8&&f.d.length>=1&&f.d.length<=8))e.push([-1,tx("pack.de_1_a_8_masses")]);
    else if(Math.abs(sg2-sd)>figTol(vs))e.push([-1,tx("pack.les_deux_cotes_ne_sont",{v1:figFmt(sg2),v2:figFmt(sd)})]);
    if(cles["Colonnes"]){var cc=figParts(cles["Colonnes"][1]);if(cc.length!==2||!cc[0]||!cc[1])e.push([cles["Colonnes"][0],tx("pack.colonnes_gauche_droite_attendu")]);else f.cols=cc;}
    ecarts.forEach(function(x){
      var p=figParts(x[1]);
      if(p.length!==3||!p[0]||!/^\d+$/.test(p[1])||!/^\d+$/.test(p[2])){e.push([x[0],tx("pack.ecart_libelle_n_m_attendu")]);return;}
      var n=parseInt(p[1],10),mm2=parseInt(p[2],10);
      if(cote&&!(n>=1&&n<=f.g.length&&mm2>=1&&mm2<=f.d.length)){e.push([x[0],tx("pack.ecart_masses_a_gauche_et",{v1:p[0],v2:p[1],v3:p[2],v4:f.g.length,v5:f.d.length})]);return;}
      f.ecarts.push({l:p[0],n:n,m:mm2});
    });
  }else if(typ==="barres"||typ==="courbe"){
    var n,lo,hi,quoi;
    if(typ==="barres"){
      var se=cles["Séries"]?figParts(cles["Séries"][1]):[""];
      if(cles["Séries"]&&(se.length<2||se.length>3||!se.every(function(x){return !!x;})))e.push([cles["Séries"][0],tx("pack.series_a_b_2_ou")]);
      f.series=cles["Séries"]?se:[];n=se.length;lo=1;hi=12;quoi=tx("pack.nom_barres");
    }else{
      var ax=cles["Axe"]?figParts(cles["Axe"][1]):[];
      if(!cles["Axe"])e.push([-1,tx("pack.ligne_axe_x1_x2_manquante")]);
      else if(!(ax.length>=2&&ax.length<=12&&ax.every(function(x){return !!x;})))e.push([cles["Axe"][0],tx("pack.axe_de_2_a_12")]);
      f.axe=ax;n=ax.length;lo=1;hi=3;quoi=tx("pack.nom_courbes");
    }
    f.lignes=[];
    data.forEach(function(x){
      var p=figParts(x[1]),vals=[],decs=[],ok=true,j,w;
      if(p.length!==n+1||!p[0]){var t=[];for(j=0;j<Math.max(n,1);j++)t.push(tx("pack.mot_nombre"));e.push([x[0],tnx("pack.ligne_attendue_nombres",n,{cols:t.join(" | ")})]);return;}
      for(j=1;j<p.length;j++){w=nb(x[0],p[j]);if(w===null)ok=false;vals.push(w);decs.push(dec);}
      if(ok)f.lignes.push({l:p[0],v:vals,k:decs});
    });
    combien(data.length,lo,hi,quoi);
  }else if(typ==="camembert"){
    var vp=[];f.parts=[];
    data.forEach(function(x){
      var p=figParts(x[1]),val;
      if(p.length!==2||!p[0]){e.push([x[0],tx("pack.ligne_attendue_libelle_montant")]);return;}
      val=nb(x[0],p[1],true);
      if(val!==null){if(val===0)e.push([x[0],tx("pack.une_part_ne_peut_pas")]);vp.push(val);f.parts.push({l:p[0],v:val,k:dec});}
    });
    combien(data.length,2,6,tx("pack.nom_parts"));
    if(cles["Total"]){
      var t=nb(cles["Total"][0],cles["Total"][1]),som=vp.reduce(function(a,b){return a+b;},0);
      if(t!==null){f.total=t;if(vp.length===data.length&&Math.abs(som-t)>figTol(vp.concat([t])))e.push([cles["Total"][0],tx("pack.les_parts_font_pas",{v1:figFmt(som),v2:cles["Total"][1]})]);}
    }
  }else if(typ==="etapes"){
    f.etapes=[];
    data.forEach(function(x){
      var p=figParts(x[1]);
      if(p.length>2||!p[0]){e.push([x[0],tx("pack.ligne_attendue_etape_ou_etape")]);return;}
      f.etapes.push({t:p[0],d:p[1]||""});
    });
    combien(data.length,2,8,tx("pack.nom_etapes"));
  }else if(typ==="essai"){
    /* v7.4 : « À toi » (build.py : même contrôle). Titre = la question ; avant « -- », les données ; après, la réponse */
    var seps=data.filter(function(x){return x[1]==="--";}).map(function(x){return x[0];});
    if(seps.length!==1)e.push([seps.length>1?seps[1]:-1,tx("pack.une_ligne_et_une_seule")]);
    else if(!data.some(function(x){return x[0]>seps[0];}))e.push([seps[0],tx("pack.la_reponse_manque_apres_la")]);
    f.q=[];f.r=[];
    corps.forEach(function(l,k){if(packTrim(l)==="--")return;(seps.length&&k>seps[0]?f.r:f.q).push(l);});
  }else if(typ==="ecriture"){
    /* v10.4 : une écriture au journal, un compte par ligne, les débits d'abord (build.py : même contrôle) */
    var vuC=false,sens=[],avec=0,sd=0,sc=0,lis=true;
    f.lignes=[];
    data.forEach(function(x){
      var p=figParts(x[1]),val=null;
      if((p.length!==3&&p.length!==4)||(p[0]!=="D"&&p[0]!=="C")||!p[1]||!p[2]){e.push([x[0],tx("pack.ligne_attendue_d_compte_libelle")]);return;}
      if(p[0]==="C")vuC=true;else if(vuC)e.push([x[0],tx("pack.un_debit_apres_un_credit")]);
      sens.push(p[0]);
      if(p.length===4){avec++;val=nb(x[0],p[3],true);if(val===null)lis=false;else if(p[0]==="D")sd+=val;else sc+=val;}
      f.lignes.push({s:p[0],c:p[1],l:p[2],v:val,k:p.length===4?figDec(p[3]):0});
    });
    if(sens.indexOf("D")<0||sens.indexOf("C")<0)e.push([-1,tx("pack.il_faut_au_moins_un")]);
    if(avec&&avec!==f.lignes.length)e.push([-1,tx("pack.montants_sur_toutes_les_lignes")]);
    else if(avec&&lis&&Math.abs(sd-sc)>0.005)e.push([-1,tx("pack.ecriture_desequilibree_au_debit_au",{v1:figFmt(sd),v2:figFmt(sc)})]);
    f.montants=avec>0&&avec===f.lignes.length;
  }
  return {f:f,err:e};
}
/* Tableaux et figures d'un texte : items = [[n° de ligne, texte]] ; ou(n) situe la ligne dans les messages */
/* v13.1 : dans une fiche (encOk), encadrés typés « ::: definition|formule|exemple|attention|source <titre> » … « ::: »
   (build.py : controle_visuels, ENCADRES) */
var ENCADRES=["definition","formule","exemple","attention","source"];
function packVisuels(items,ou,err,encOk){
  var tab=null,fig=null,enc=null;
  items.forEach(function(it){
    var n=it[0],l=it[1],m,c;
    if(fig){
      if(packTrim(l)===":::"){
        packFigure(fig.t,fig.titre,fig.l.map(function(x){return x[1];})).err.forEach(function(x){err.push(tx("pack.figure",{ou:ou(x[0]<0?fig.n:fig.l[x[0]][0]),type:fig.t,detail:x[1]}));});
        fig=null;
      }else fig.l.push([n,l]);
      return;
    }
    m=FIG_DEBUT.exec(l);
    if(m&&packDans(ENCADRES,m[1])){
      if(!encOk)err.push(tx("pack.encadre_seulement_dans_une_fiche",{ou:ou(n),type:m[1]}));
      else if(enc)err.push(tx("pack.encadre_dans_un_autre_encadre",{ou:ou(n),type:m[1]}));
      enc={n:n,t:m[1]};tab=null;return;
    }
    if(enc&&packTrim(l)===":::"){enc=null;tab=null;return;}
    if(m){fig={n:n,t:m[1],titre:packTrim(m[2]),l:[]};tab=null;return;}
    if(l.charAt(0)!=="|"){tab=null;return;}
    c=l.split("|").length-2;
    if(l.charAt(l.length-1)!=="|"||c<1)err.push(tx("pack.une_ligne_de_tableau_commence",{ou:ou(n)}));
    else if(!tab)tab=[c,1];
    else{
      tab[1]++;
      if(c!==tab[0])err.push(tx("pack.colonnes_ici_dans_l_en",{ou:ou(n),c:c,attendu:tab[0]}));
      if(tab[1]===2&&!PACK_TABLE_SEP.test(l))err.push(tx("pack.la_2e_ligne_d_un",{ou:ou(n)}));
    }
  });
  if(fig)err.push(tx("pack.figure_sans_ligne_de_fin",{ou:ou(fig.n),type:fig.t}));
  if(enc)err.push(tx("pack.encadre_sans_ligne_de_fin",{ou:ou(enc.n),type:enc.t}));
}
/* Les lignes « > » d'un énoncé (cas, exercice, QCM) */
function packEnonce(ls,d,f,err){
  var items=[],i;
  for(i=d;i<f;i++){if(ls[i]===">"||ls[i].indexOf("> ")===0)items.push([i,ls[i].indexOf("> ")===0?ls[i].slice(2):""]);}
  packVisuels(items,function(n){return packLigne(n+1);},err);
}
/* Documents types (v7.3) : section « # Documents » = documents.md (build.py : lire_documents). v8 : « - BJ / BK · … »
   (code de la 2e colonne) et « Colonnes : <1re> · <2e> » */
var DOC_LIGNE=/^- ([A-Za-z0-9_-]+)(?: \/ ([A-Za-z0-9_-]+))? · (.+?)(?: · (.+))?$/;
function packDocuments(ls,d0,f0,err){
  var out=[],vus={};
  packBlocs(ls,2,d0,f0).forEach(function(b){
    var ou=packLigne(b.n+1),p=b.titre.indexOf(" · "),i,l,m,x;
    var doc={id:packTrim(p<0?b.titre:b.titre.slice(0,p)),t:packTrim(p<0?"":b.titre.slice(p+3)),src:"",intro:packCitation(ls,b.d,b.f),g:[]};
    for(i=b.d;i<b.f;i++){
      l=ls[i];
      if(!l||l===">"||l.indexOf("> ")===0)continue;
      if(l.indexOf("Source : ")===0){doc.src=packTrim(l.slice(9));continue;}
      if(l.indexOf("Colonnes : ")===0){
        doc.col=l.slice(11).split(" · ").map(packTrim);
        if(doc.col.length!==2||!doc.col[0]||!doc.col[1])err.push(tx("pack.colonnes_1re_colonne_2e_colonne",{ou:packLigne(i+1)}));
        continue;
      }
      if(l.indexOf("### ")===0){doc.g.push({t:packTrim(l.slice(4)),l:[]});continue;}
      m=DOC_LIGNE.exec(l);
      if(!m){err.push(tx("pack.ligne_attendue_code_poste_ce",{ou:packLigne(i+1)}));continue;}
      if(!doc.g.length)doc.g.push({t:"",l:[]});
      x={k:m[1],p:packTrim(m[3])};if(m[2])x.k2=m[2];if(m[4])x.u=packTrim(m[4]);
      [x.k,x.k2].forEach(function(k){
        if(!k)return;
        if(vus[k])err.push(tx("pack.code_en_double_dans_les",{ou:packLigne(i+1),code:k}));
        vus[k]=1;
      });
      doc.g[doc.g.length-1].l.push(x);
    }
    if(!PACK_ID_RE.test(doc.id))err.push(tx("pack.identifiant_de_document_invalide",{ou:ou,id:doc.id}));
    if(!doc.t)err.push(tx("pack.titre_attendu_identifiant_titre",{ou:ou}));
    if(!doc.src)err.push(tx("pack.source_manquante_source",{ou:ou}));
    if(!doc.g.some(function(g){return g.l.length>0;}))err.push(tx("pack.aucune_ligne_code_poste",{ou:ou}));
    if(out.some(function(o){return o.id===doc.id;}))err.push(tx("pack.document_en_double",{ou:ou,id:doc.id}));
    out.push(doc);
  });
  if(!out.length)err.push(tx("pack.documents_aucun_document_identifiant_titre"));
  return out;
}
/* Chaque code des documents (1re et 2e colonne) → identifiant de son document (build.py : codes_documents) */
function packCodesDocs(docs){
  var o={};
  (docs||[]).forEach(function(d){d.g.forEach(function(g){g.l.forEach(function(x){o[x.k]=d.id;if(x.k2)o[x.k2]=d.id;});});});
  return o;
}
/* Constructions (v8) : section « # Constructions » = constructions.md (build.py : lire_constructions). Lue après les
   documents, où qu'ils soient dans le pack. */
var PACK_MONTANT=/^([A-Za-z0-9_-]+)\s*=\s*([\s\S]+)$/,PACK_CASE=/^([−-])?\s*(@?[A-Za-z0-9_-]+)$/;
function packConstructions(ls,d0,f0,themes,docs,err){
  var tous=packCodesDocs(docs),out=[];
  function ld(i){return packLigne(i+1);}
  packBlocs(ls,2,d0,f0).forEach(function(b){
    var ou=ld(b.n),p=b.titre.indexOf(" · "),lgs=packBlocs(ls,3,b.d,b.f),tete=lgs.length?lgs[0].n:b.f,m={},ap=[],mt={},i,l,mm;
    for(i=b.d;i<tete;i++){
      l=ls[i];
      if(!l||l===">"||l.indexOf("> ")===0)continue;
      mm=packMeta(l,PACK_M_CONS);
      if(mm&&mm[0]==="Montants"){
        mm[1].split(";").map(packTrim).filter(function(x){return !!x;}).forEach(function(q){
          var mo=PACK_MONTANT.exec(q),v=mo?figNombre(mo[2]):null;
          if(v===null){err.push(tx("pack.montant_attendu_code_nombre_pas",{ou:ld(i),q:q}));return;}
          if(mt.hasOwnProperty(mo[1]))err.push(tx("pack.montant_de_en_double",{ou:ld(i),cle:mo[1]}));
          mt[mo[1]]=v;
        });
      }else if(mm){
        if(m.hasOwnProperty(mm[0]))err.push(tx("pack.en_double",{ou:ld(i),cle:mm[0]}));
        m[mm[0]]=mm[1];
      }else if(l.indexOf("- ")===0){
        var q=l.slice(2).split(" · ").map(packTrim),v=q.length>2?figNombre(q[q.length-1]):null;
        var x={k:q[0],p:(v!==null?q.slice(1,-1):q.slice(1)).join(" · ")};
        if(v!==null)x.v=v;
        if(!PACK_ID_RE.test(x.k)||!x.p)err.push(tx("pack.donnee_attendue_identifiant_libelle_montant",{ou:ld(i)}));
        else if(tous.hasOwnProperty(x.k)||ap.some(function(a){return a.k===x.k;}))err.push(tx("pack.existe_deja_documents_ou_donnees",{ou:ld(i),id:x.k}));
        ap.push(x);
      }else err.push(tx("pack.ligne_non_reconnue",{ou:ld(i),extrait:l.slice(0,60)}));
    }
    var c={id:packTrim(p<0?b.titre:b.titre.slice(0,p)),t:packTrim(p<0?"":b.titre.slice(p+3)),th:m["Thème"]||"",
      docs:(m.Documents||"").split(",").map(packTrim).filter(function(x){return !!x;}),u:m["Unité"]||"",src:m.Source||"",
      ctx:packCitation(ls,b.d,tete),mt:mt,ap:ap,l:[]};
    if(m.hasOwnProperty("Signes")){
      c.sg=m.Signes.split(" / ").map(packTrim);
      if(c.sg.length!==2||!c.sg[0]||!c.sg[1])err.push(tx("pack.signes_ajoute_retranche_attendu_debit",{ou:ou}));
    }
    packEnonce(ls,b.d,tete,err);
    c.docs.forEach(function(x){if(!(docs||[]).some(function(d){return d.id===x;}))err.push(tx("pack.document_absent_de_documents_md",{ou:ou,x:x}));});
    var dispo={},k,apk={},res={};
    for(k in tous){if(tous.hasOwnProperty(k)&&packDans(c.docs,tous[k]))dispo[k]=1;}
    for(k in mt){if(mt.hasOwnProperty(k)&&!dispo[k])err.push(tx("pack.montant_de_code_absent_des",{ou:ou,code:k}));}
    ap.forEach(function(a){apk[a.k]=a;});
    lgs.forEach(function(g){
      var o2=ld(g.n),pp=g.titre.indexOf(" · "),sm={},cle=null,j,L;
      for(j=g.d;j<g.f;j++){
        l=ls[j];
        if(!l){cle=null;continue;}
        mm=packMeta(l,PACK_M_LIGNE);
        if(mm){if(sm.hasOwnProperty(mm[0]))err.push(tx("pack.en_double",{ou:ld(j),cle:mm[0]}));sm[mm[0]]=mm[1];cle=mm[0];}
        else if(cle==="Explication"||cle==="Indice")sm[cle]+=" "+packTrim(l);
        else err.push(tx("pack.ligne_non_reconnue",{ou:ld(j),extrait:l.slice(0,60)}));
      }
      L={id:packTrim(pp<0?g.titre:g.titre.slice(0,pp)),t:packTrim(pp<0?"":g.titre.slice(pp+3)),c:[],e:sm.Explication||""};
      if(!PACK_ID_RE.test(L.id))err.push(tx("pack.identifiant_de_ligne_invalide",{ou:o2,id:L.id}));
      else if(res.hasOwnProperty(L.id))err.push(tx("pack.ligne_en_double",{ou:o2,id:L.id}));
      if(!L.t)err.push(tx("pack.titre_attendu_identifiant_libelle",{ou:o2}));
      if(!L.e)err.push(tx("pack.explication_manquante_explication",{ou:o2}));
      if(!sm.hasOwnProperty("Cases"))err.push(tx("pack.cases_manquant_aucune_si_rien",{ou:o2}));
      else if(packTrim(sm.Cases)!=="aucune"){
        sm.Cases.split(",").map(packTrim).forEach(function(q){
          var mo=PACK_CASE.exec(q),kk;
          if(!mo){err.push(tx("pack.case_illisible",{ou:o2,q:q}));return;}
          kk=mo[2];
          if(kk.charAt(0)==="@"){if(!res.hasOwnProperty(kk.slice(1)))err.push(tx("pack.aucune_ligne_avant_celle_ci",{ou:o2,code:kk,cible:kk.slice(1)}));}
          else if(!dispo[kk]&&!apk[kk])err.push(tx("pack.case_absente_des_documents_de",{ou:o2,code:kk}));
          if(L.c.some(function(x){return x.k===kk;}))err.push(tx("pack.case_en_double",{ou:o2,code:kk}));
          L.c.push({k:kk,s:mo[1]?-1:1});
        });
      }
      if(sm.hasOwnProperty("Admis")){
        L.adm=sm.Admis.split(",").map(packTrim).filter(function(x){return !!x;});
        L.adm.forEach(function(kk){
          if(!dispo[kk]&&!apk[kk])err.push(tx("pack.case_admise_absente_des_documents",{ou:o2,code:kk}));
          if(L.c.some(function(x){return x.k===kk;}))err.push(tx("pack.est_deja_dans_cases",{ou:o2,code:kk}));
        });
      }
      if(sm.hasOwnProperty("Indice"))L.ind=sm.Indice;
      if(sm.hasOwnProperty("Résultat")){
        var r=figNombre(sm["Résultat"]);
        if(r===null)err.push(tx("pack.resultat_doit_etre_un_nombre",{ou:o2}));
        else{
          L.r=r;
          var vals=[],manque=[];
          L.c.forEach(function(x){
            var kk=x.k,v=kk.charAt(0)==="@"?res[kk.slice(1)]:apk[kk]?apk[kk].v:mt[kk];
            if(v===undefined||v===null)manque.push(kk);else vals.push(x.s*v);
          });
          var tot=vals.reduce(function(a,v){return a+v;},0);
          if(manque.length)err.push(tx("pack.montant_inconnu_pour_montants_donnee",{ou:o2,liste:manque.join(", ")}));
          else if(Math.abs(tot-r)>figTol(vals.map(Math.abs).concat([r]))+1e-9)err.push(tx("pack.le_resultat_ne_tombe_pas",{ou:o2,v1:figFmt(tot),v2:figFmt(r)}));
        }
      }
      res[L.id]=L.hasOwnProperty("r")?L.r:null;
      c.l.push(L);
    });
    if(!PACK_ID_RE.test(c.id))err.push(tx("pack.identifiant_de_construction_invalide",{ou:ou,id:c.id}));
    if(!c.t)err.push(tx("pack.titre_attendu_identifiant_titre",{ou:ou}));
    if(!packDans(themes,c.th))err.push(tx("pack.theme_inconnu",{ou:ou,th:c.th}));
    if(!c.src)err.push(tx("pack.source_manquante_source",{ou:ou}));
    if(!c.l.length)err.push(tx("pack.aucune_ligne_identifiant_libelle",{ou:ou}));
    if(out.some(function(o){return o.id===c.id;}))err.push(tx("pack.construction_en_double",{ou:ou,id:c.id}));
    out.push(c);
  });
  if(!out.length)err.push(tx("pack.constructions_aucune_construction_identifiant_titre"));
  return out;
}
/* Fiche de cours (v7.2) : section « # Cours · <thème> » = le fichier cours/<thème>.md (build.py : lire_cours) */
var PACK_ESSENTIEL=["L'essentiel","L\u2019essentiel"],PACK_RETENIR=["À retenir","A retenir"],PACK_TABLE_SEP=/^\|(\s*:?-{3,}:?\s*\|)+$/;
function packCours(ls,d,f,th,err){
  var out={th:th,min:null,sections:[],src:""},cur=null,fin=false,i,l,ou,m;
  for(i=d;i<f;i++){
    l=ls[i];ou=packLigne(i+1);
    if(fin){if(l)err.push(tx("pack.rien_apres_la_ligne_sources",{ou:ou}));continue;}
    m=/^Durée : (\d+) min$/.exec(l);
    if(m&&!cur){out.min=parseInt(m[1],10);continue;}
    if(l.indexOf("Introduction :")===0&&!cur){out.intro=packTrim(l.slice(14));if(!out.intro)err.push(tx("pack.introduction_2_ou_3_phrases",{ou:ou}));continue;}  /* v13.1 */
    if(l.indexOf("Avant de lire :")===0&&!cur){out.av=packTrim(l.slice(15));if(!out.av)err.push(tx("pack.avant_de_lire_une_question",{ou:ou}));continue;}  /* v7.4 */
    if(l.indexOf("Sources : ")===0){out.src=packTrim(l.slice(10));fin=true;continue;}
    if(l.indexOf("## ")===0){cur={t:packTrim(l.slice(3)),l:[],n:[]};out.sections.push(cur);continue;}
    if((l.charAt(0)==="#"&&l.indexOf("### ")!==0)||l.indexOf("```")===0){err.push(tx("pack.seuls_section_et_sous_titre",{ou:ou,extrait:l.slice(0,30)}));continue;}
    if(!cur){if(l)err.push(tx("pack.texte_avant_la_premiere_section",{ou:ou}));continue;}
    cur.l.push(l);cur.n.push(i);
  }
  out.sections.forEach(function(s){
    packVisuels(s.l.map(function(x,k){return [s.n[k],x];}),function(n){return packLigne(n+1);},err,true);  /* tableaux et figures (v7.3), encadrés (v13.1) */
    s.md=s.l.join("\n").replace(/^\n+|\n+$/g,"");delete s.l;delete s.n;if(!s.md)err.push(tx("pack.cours_section_vide",{th:th,titre:s.t}));
  });
  var ts=out.sections.map(function(s){return s.t;});
  if(!ts.length)err.push(tx("pack.cours_aucune_section_titre",{th:th}));
  else if(out.hasOwnProperty("intro")){  /* v13.1 : introduction, parties, « À retenir » en dernier (build.py : lire_cours) */
    if(!packDans(PACK_RETENIR,ts[ts.length-1]))err.push(tx("pack.cours_avec_introduction_la_derniere",{th:th}));
    else if(ts.length<3)err.push(tx("pack.cours_au_moins_deux_parties",{th:th}));
    if(ts.slice(0,-1).some(function(x){return packDans(PACK_ESSENTIEL,x)||packDans(PACK_RETENIR,x);}))err.push(tx("pack.cours_l_essentiel_ou_a",{th:th}));
  }
  else if(!packDans(PACK_ESSENTIEL,ts[0]))err.push(tx("pack.cours_la_fiche_commence_par",{th:th}));
  if(!out.src)err.push(tx("pack.cours_ligne_sources_manquante_a",{th:th}));
  return out;
}
function packSlug(s){s=String(s).toLowerCase();if(s.normalize)s=s.normalize("NFD");return s.replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");}
/* ---------- Pack de mise à jour (v13) ----------
   Une IA complète ou corrige un cours importé en rendant seulement ce qui change : « Mise à jour : oui », le même
   identifiant, les thèmes, questions, cas, exercices et fiches ajoutés ou corrigés. packFusion le fond dans le texte du
   cours importé : en-tête (Titre, Surtitre, Résumé, Sources, Agenda remplacés ; Thème et Regard par identifiant),
   fiche (« # Cours · » , « # Synthèse ») remplacée en entier, et dans les autres sections un bloc « ## » remplace celui
   de même identifiant (avant « · » ; titre entier pour « Règle · ») ou s'ajoute. Rien n'est supprimé. Le texte fondu
   est ensuite lu par packLire comme un pack ordinaire ; situer() renvoie une erreur à sa ligne d'origine. */
function packEnveloppe(texte){
  var ls=String(texte==null?"":texte).replace(/\r\n?/g,"\n").split("\n"),deb=-1,fin=ls.length,i,n;
  for(i=0;i<ls.length;i++){if(/^# Pack( · |$)/.test(packNormLigne(ls[i].replace(/\s+$/,"")))){deb=i;break;}}
  if(deb<0)return null;
  for(i=deb+1;i<ls.length;i++){n=packNormLigne(ls[i].replace(/\s+$/,""));if(n==="# Fin du pack"||n==="# Fin"){fin=i;break;}}
  return {ls:ls,deb:deb,fin:fin};
}
function packEstMaj(texte){
  var e=packEnveloppe(texte),i,m;if(!e)return false;
  for(i=e.deb+1;i<e.fin;i++){
    var l=packNormLigne(e.ls[i].replace(/\s+$/,""));if(l.indexOf("# ")===0)break;
    m=packMeta(l,["Mise à jour"]);if(m)return /^oui$/i.test(m[1]);
  }
  return false;
}
function packIdDe(texte){
  var e=packEnveloppe(texte),i,m;if(!e)return null;
  for(i=e.deb+1;i<e.fin;i++){var l=packNormLigne(e.ls[i].replace(/\s+$/,""));if(l.indexOf("# ")===0)break;m=packMeta(l,["Identifiant"]);if(m)return m[1];}
  return null;
}
/* Découpe un pack en en-tête et sections, chaque ligne gardant son origine [texte, origine] */
function packDecouper(texte,orig){
  var e=packEnveloppe(texte),out={titre:null,tete:[],secs:[]},cur=null,fence=false,i,l,n;
  if(!e)return out;
  out.titre=[e.ls[e.deb],orig+e.deb];
  for(i=e.deb+1;i<e.fin;i++){
    l=e.ls[i];n=packNormLigne(l.replace(/\s+$/,""));
    if(n.indexOf("```")===0)fence=!fence;
    if(!fence&&n.indexOf("# ")===0){cur={t:packTrim(n.slice(2)),l:[[l,orig+i]],pre:[],blocs:[]};out.secs.push(cur);continue;}
    if(!cur){out.tete.push([l,orig+i]);continue;}
    if(n.indexOf("## ")===0)cur.blocs.push({k:packCleBloc(cur.t,packTrim(n.slice(3))),l:[[l,orig+i]]});
    else if(cur.blocs.length)cur.blocs[cur.blocs.length-1].l.push([l,orig+i]);
    else cur.pre.push([l,orig+i]);
  }
  return out;
}
function packCleBloc(sec,titre){return sec==="Règles"||titre.indexOf("Règle · ")===0?titre:packTrim(titre.split(" · ")[0]);}
function packFiche(t){return t.indexOf("Cours · ")===0||t==="Synthèse";}
function packFusion(ancien,maj){
  var A=packDecouper(ancien,"a"),N=packDecouper(maj,"n"),st={themes:0,questions:[0,0],fiches:[0,0],autres:[0,0]};
  /* En-tête */
  var tete=A.tete.slice();
  function cle(l){var m=packMeta(packNormLigne(l[0].replace(/\s+$/,"")),PACK_M_TETE);if(!m)return null;
    if(m[0]==="Thème"||m[0]==="Regard")return m[0]+":"+packTrim(m[1].split(" · ")[0]);return m[0];}
  N.tete.forEach(function(l){
    var k=cle(l),j,der=-1;
    if(!k||k==="Identifiant"||k==="Univers"||k==="Mise à jour")return;
    for(j=0;j<tete.length;j++){if(cle(tete[j])===k){tete[j]=l;return;}}
    if(k.indexOf("Thème:")===0)st.themes++;
    for(j=0;j<tete.length;j++){var kj=cle(tete[j]);if(kj&&kj.split(":")[0]===k.split(":")[0])der=j;}
    if(der<0)for(j=0;j<tete.length;j++){if(trim(tete[j][0]))der=j;}
    tete.splice(der+1,0,l);
  });
  /* Sections */
  var secs=A.secs.slice();
  N.secs.forEach(function(s){
    var j,old=null;
    if(packFiche(s.t)){
      for(j=0;j<secs.length;j++){if(secs[j].t===s.t){secs[j]=s;st.fiches[1]++;return;}}
      secs.push(s);st.fiches[0]++;return;
    }
    var memes=secs.filter(function(x){return x.t===s.t;}),q=/^(QCM · |Simulation$)/.test(s.t)?"questions":"autres";
    if(!memes.length){secs.push(s);st[q][0]+=s.blocs.length;return;}
    s.blocs.forEach(function(b){
      var fait=memes.some(function(x){for(var k=0;k<x.blocs.length;k++){if(x.blocs[k].k===b.k){x.blocs[k]=b;return true;}}return false;});
      if(fait)st[q][1]++;else{memes[memes.length-1].blocs.push(b);st[q][0]++;}
    });
  });
  /* Texte fondu, et l'origine de chaque ligne */
  var L=[A.titre||N.titre];
  L=L.concat(tete);
  secs.forEach(function(s){
    if(L.length&&trim(L[L.length-1][0]))L.push(["",null]);
    L=L.concat(s.l,s.pre);
    s.blocs.forEach(function(b){if(trim(L[L.length-1][0]))L.push(["",null]);L=L.concat(b.l);});
  });
  L.push(["",null]);L.push(["# Fin du pack",null]);
  var texte=L.map(function(x){return x[0];}).join("\n");
  var motif=new RegExp("^"+tx("pack.ligne",{n:"\u0001"}).replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace("\u0001","(\\d+)"));  /* « ligne 12 » / « line 12 » au début d'un message */
  function situer(msg){
    return String(msg).replace(motif,function(m0,n){
      var o=L[+n-1]&&L[+n-1][1];if(!o)return m0;
      return tx(o.charAt(0)==="n"?"pack.ligne_maj":"pack.ligne_cours",{n:+o.slice(1)+1});
    });
  }
  return {texte:texte,stats:st,situer:situer};
}
function packMajTexte(st){
  var l=[];
  function c(n,cle){if(n)l.push(tnx(cle,n));}
  c(st.themes,"pack.maj_themes_ajoutes");
  c(st.questions[0],"pack.maj_questions_ajoutees");c(st.questions[1],"pack.maj_questions_corrigees");
  c(st.fiches[0],"pack.maj_fiches_ajoutees");c(st.fiches[1],"pack.maj_fiches_remplacees");
  c(st.autres[0],"pack.maj_autres_ajoutes");c(st.autres[1],"pack.maj_autres_corriges");
  return l.length?l.join(", "):tx("pack.maj_rien");
}
/* Lit un pack : {r : recette prête pour RECETTES (null si erreur), err : [messages avec la ligne], ids : identifiants} */
function packLire(texte){
  var err=[],ls=String(texte==null?"":texte).replace(/\r\n?/g,"\n").split("\n").map(function(l){return packNormLigne(l.replace(/\s+$/,""));});
  var deb=-1,i,l,secs=[],tete=[],js=[],jsLigne=0,dansJs=false,fence=false,fin=ls.length;
  for(i=0;i<ls.length;i++){if(/^# Pack( · |$)/.test(ls[i])){deb=i;break;}}
  if(deb<0)return {r:null,err:[tx("pack.pas_de_pack")],ids:[]};
  for(i=deb+1;i<ls.length;i++){
    l=ls[i];
    if(l.indexOf("```")===0){
      fence=!fence;
      if(!secs.length){dansJs=fence&&l.indexOf("json")>=0;if(dansJs)jsLigne=i+1;continue;}
    }
    if(!fence&&l.indexOf("# ")===0){
      if(secs.length)secs[secs.length-1].f=i;
      if(l==="# Fin du pack"||l==="# Fin"){fin=i;break;}
      secs.push({titre:packTrim(l.slice(2)),n:i,d:i+1,f:ls.length});continue;
    }
    if(fence&&dansJs&&!secs.length)js.push(l);
    else if(!secs.length)tete.push(i);
  }
  if(secs.length&&secs[secs.length-1].f>fin)secs[secs.length-1].f=fin;
  /* En-tête : le bloc JSON d'abord, les lignes « Clé : valeur » par-dessus, puis les valeurs par défaut */
  var r={};
  if(js.length){
    try{r=JSON.parse(js.join("\n"),function(k,v){return k==="__proto__"||k==="constructor"||k==="prototype"?undefined:v;});}
    catch(e){err.push(tx("pack.bloc_json_illisible",{ou:packLigne(jsLigne),detail:e.message}));r={};}
    if(!r||typeof r!=="object"||r instanceof Array){err.push(tx("pack.le_bloc_json_doit_etre",{ou:packLigne(jsLigne)}));r={};}
  }
  if(!r.accueil||typeof r.accueil!=="object")r.accueil={};
  var acc=r.accueil,themes=[],regards=[],prog=null;
  tete.forEach(function(j){
    var mm=packMeta(ls[j],PACK_M_TETE),p,v;if(!mm)return;v=mm[1];
    if(mm[0]==="Titre")r.titre=v;else if(mm[0]==="Identifiant")r.id=v;else if(mm[0]==="Univers")prog=v;
    else if(mm[0]==="Surtitre")acc.surtitre=v;else if(mm[0]==="Résumé")acc.resume=v;else if(mm[0]==="Sources")acc.sources=v;
    else if(mm[0]==="Agenda")r.agenda=v.split(",").map(packTrim).filter(function(x){return !!x;});
    else if(mm[0]==="Thème"){p=v.indexOf(" · ");themes.push({id:packTrim(p<0?v:v.slice(0,p)),nom:packTrim(p<0?"":v.slice(p+3))});}
    else if(mm[0]==="Regard"){p=v.split(" · ").map(packTrim);regards.push({id:p[0],nom:p[1]||"",quoi:p[2]||""});}
  });
  if(themes.length)r.themes=themes;
  if(regards.length){r.blocs=r.blocs||{};r.blocs.maitrise=r.blocs.maitrise||{};r.blocs.maitrise.regards=regards;}
  if(r.titre===undefined)r.titre="";
  if(r.id===undefined)r.id=packSlug(r.titre);
  if(!r.modele)r.modele="matiere-de-cours";
  if(!r.statut)r.statut="prête";
  if(!r.titre_h1)r.titre_h1=r.titre;
  if(!r.stockage)r.stockage="qfcc2.pk."+r.id+".";
  if(!acc.surtitre)acc.surtitre=tx("pack.defaut_surtitre");
  if(!acc.resume)acc.resume=tx("pack.defaut_resume");
  if(!acc.sources)acc.sources=tx("pack.defaut_sources");
  if(prog)r.programme=prog;
  /* Contrôles de la recette (build.py : lire_matiere) */
  var tete0=tx("pack.entete",{n:deb+1});
  if(!r.titre)err.push(tx("pack.titre_manquant",{ou:tete0}));
  if(typeof r.id!=="string"||!PACK_ID_RE.test(r.id))err.push(tx("pack.identifiant_invalide_identifiant_en_minuscules",{ou:tete0,id:r.id}));
  if(typeof r.stockage!=="string"||!/^[A-Za-z0-9_.-]+$/.test(r.stockage))err.push(tx("pack.stockage_invalide",{ou:tete0,stockage:r.stockage}));
  if(r.agenda!==undefined&&!(r.agenda instanceof Array&&r.agenda.every(function(m){return typeof m==="string"&&!!packTrim(m);})))err.push(tx("pack.agenda_doit_etre_une_liste",{ou:tete0}));
  if(!packDans(PACK_STATUTS,r.statut))err.push(tx("pack.statut_inconnu_prete_ou_en",{ou:tete0,statut:r.statut}));
  if(!(r.themes instanceof Array))r.themes=[];
  var ths=r.themes.map(function(t){return t&&t.id;});
  ths.forEach(function(t,k){if(!t||!PACK_ID_RE.test(t))err.push(tx("pack.theme_invalide_theme_id_nom",{ou:tete0,th:t}));if(ths.indexOf(t)!==k)err.push(tx("pack.theme_en_double",{ou:tete0,th:t}));});
  r.themes.forEach(function(t){if(t&&!t.nom)err.push(tx("pack.le_theme_n_a_pas",{ou:tete0,id:t.id}));});
  var B=r.blocs||{},ma=B.maitrise||{};
  var ctl={niv:ma.niveaux instanceof Array&&ma.niveaux.length?ma.niveaux.map(function(n){return n.id;}):PACK_NIVEAUX,reg:(ma.regards instanceof Array?ma.regards:[]).map(function(g){return g.id;})};
  (ma.regards instanceof Array?ma.regards:[]).forEach(function(g){if(!(g&&g.id&&g.nom&&g.quoi))err.push(tx("pack.un_regard_demande_id_nom",{ou:tete0}));});
  /* Sections */
  var parTh={},parCours={},c={qcm:[],cas:[],reserve:[],exercices:[],cours:[]},rg=[],docs=null,cons=[],syn=null;
  secs.forEach(function(s){
    var q=/^QCM · (.+)$/.exec(s.titre),k=/^Cours · (.+)$/.exec(s.titre),ou=packLigne(s.n+1);
    if(k){
      var tc=packTrim(k[1]);
      if(!packDans(ths,tc))err.push(tx("pack.section_cours_theme_absent_de",{ou:ou,th:tc}));
      else if(parCours[tc])err.push(tx("pack.deuxieme_section_cours_une_seule",{ou:ou,th:tc}));
      else parCours[tc]=packCours(ls,s.d,s.f,tc,err);
    }else if(q){
      var th=packTrim(q[1]);
      if(!packDans(ths,th)){err.push(tx("pack.section_qcm_theme_absent_de",{ou:ou,th:th}));return;}
      parTh[th]=(parTh[th]||[]).concat(packBlocs(ls,2,s.d,s.f).map(function(b){return packQcm(ls,b.d,b.f,b.titre,err,ths,th,ctl);}));
    }else if(s.titre==="Cas")c.cas=c.cas.concat(packCas(ls,s.d,s.f,ths,err,ctl));
    else if(s.titre==="Exercices")c.exercices=c.exercices.concat(packExos(ls,s.d,s.f,ths,err,ctl));
    else if(s.titre==="Simulation")c.reserve=c.reserve.concat(packSansType(packBlocs(ls,2,s.d,s.f).map(function(b){return packQcm(ls,b.d,b.f,b.titre,err,ths,null,ctl);}),err));
    else if(s.titre==="Documents")docs=(docs||[]).concat(packDocuments(ls,s.d,s.f,err));
    else if(s.titre==="Constructions")cons.push(s);
    else if(s.titre==="Règles")rg.push(s);
    else if(s.titre==="Synthèse"){if(syn)err.push(tx("pack.deuxieme_section_synthese_une_seule",{ou:ou}));else syn=packCours(ls,s.d,s.f,"synthese",err);}  /* v10.3 */
    else err.push(tx("pack.section_inconnue_qcm_theme_cours",{ou:ou,v1:s.titre}));
  });
  ths.forEach(function(t){
    if(parTh[t])c.qcm=c.qcm.concat(parTh[t]);
    else if(r.statut==="prête")err.push(tx("pack.theme_aucune_section_qcm",{th:t}));
  });
  ths.forEach(function(t){if(parCours[t])c.cours.push(parCours[t]);});
  if(syn)c.synthese=syn;
  if(docs)c.documents=docs;
  if(cons.length)c.constructions=[].concat.apply([],cons.map(function(s){return packConstructions(ls,s.d,s.f,ths,docs||[],err);}));
  c.claude=packRegles(ls,rg,ths,err);
  packReglesFiches(c.claude,c.cours,r.themes||[]);
  r.contenu=c;
  /* Cohérence (build.py : fin de lire_matiere) */
  var qids=c.qcm.map(function(q){return q.id;}),eids=c.exercices.map(function(e){return e.id;}),kids=c.cas.map(function(k){return k.k;}),vus={};
  c.cas.forEach(function(k){k.steps.forEach(function(s){qids.push(s.id);});});
  c.reserve.forEach(function(q){qids.push(q.id);});
  qids.forEach(function(i){if(vus[i])err.push(tx("pack.identifiant_de_question_en_double",{id:i}));vus[i]=1;});
  eids.forEach(function(i,k){if(eids.indexOf(i)!==k)err.push(tx("pack.identifiant_d_exercice_en_double",{id:i}));});
  kids.forEach(function(i,k){if(kids.indexOf(i)!==k)err.push(tx("pack.cas_en_double",{id:i}));});
  var sr=(B.qcm&&B.qcm.serie_rapide)||{},t;
  for(t in sr){if(sr.hasOwnProperty(t)){
    var dispo=c.qcm.filter(function(q){return q.th===t;}).length;
    if(!packDans(ths,t))err.push(tx("pack.serie_rapide_theme_inconnu",{ou:tete0,th:t}));
    else if(sr[t]>dispo)err.push(tx("pack.serie_rapide_questions_demandees_en",{ou:tete0,v1:sr[t],th:t,dispo:dispo}));
  }}
  var sim=B.simulation;
  if(sim){
    if(!packDans(eids,sim.cas))err.push(tx("pack.simulation_exercice_introuvable",{ou:tete0,v1:sim.cas}));
    if(!c.reserve.length)err.push(tx("pack.simulation_activee_sans_section_simulation",{ou:tete0}));
    else if((sim.questions||0)>c.reserve.length)err.push(tx("pack.simulation_plus_de_questions_que",{ou:tete0}));
  }
  if(r.statut==="prête"&&!c.qcm.length)err.push(tx("pack.matiere_prete_sans_aucune_question"));
  var codes=packCodesDocs(c.documents);
  [].concat(c.qcm,c.reserve,c.exercices,[].concat.apply([],c.cas.map(function(k){return k.steps;}))).forEach(function(it){
    (it.rp||[]).concat(it.rpa||[]).forEach(function(x){if(!codes[x])err.push(tx("pack.repere_absent_de_la_section",{v1:(it.id||""),x:x}));});
  });
  return {r:err.length?null:r,err:err,ids:qids.concat(eids.map(function(i){return "ex:"+i;}))};
}
/* Identifiants d'une recette déjà construite (la progression y est attachée) */
function packIdsDe(r){
  var c=(r&&r.contenu)||{},ids=[];
  (c.qcm||[]).forEach(function(q){ids.push(q.id);});
  (c.cas||[]).forEach(function(k){k.steps.forEach(function(s){ids.push(s.id);});});
  (c.reserve||[]).forEach(function(q){ids.push(q.id);});
  (c.exercices||[]).forEach(function(e){ids.push("ex:"+e.id);});
  return ids;
}
/* v7.1 : part des questions dont la bonne réponse est, seule, la plus longue (build.py : biais_longueur). Au-delà de
   PACK_BIAIS, l'import avertit : la longueur trahit la réponse (Haladyna, Downing et Rodriguez, 2002). */
var PACK_BIAIS=0.4;
function packBiais(r){
  var c=(r&&r.contenu)||{},qs=[],n=0;
  qs=qs.concat(c.qcm||[]);
  (c.cas||[]).forEach(function(k){qs=qs.concat(k.steps);});
  qs=qs.concat(c.reserve||[]).filter(function(q){return q.o&&q.o.length>1&&!q.t;});
  qs.forEach(function(q){
    var L=q.o.map(function(o){return o.length;}),m=Math.max.apply(null,L);
    if(L[q.c]===m&&L.filter(function(x){return x===m;}).length===1)n++;
  });
  return {n:n,tot:qs.length,trop:qs.length>=10&&n>PACK_BIAIS*qs.length};
}

/* ---------- Packs gardés dans ce navigateur ---------- */
function packLsGet(k){try{var v=localStorage.getItem(k);return v===null?null:JSON.parse(v);}catch(e){return null;}}
function packLsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
function packListe(){var l=packLsGet(KPACKS);return (l instanceof Array)?l.filter(function(x){return typeof x==="string";}):[];}
function packUnivers(id){return UNIVERS.some(function(u){return u.id===id;});}
/* Univers et stockage d'un pack : ceux de la matière assemblée qu'il remplace, sinon le choix fait à l'import, l'univers
   de l'en-tête, le premier univers */
function packPreparer(r,prog){
  var b=PACK_INT[r.id];
  if(b){r.stockage=b.stockage;r.programme=b.programme;}
  else r.programme=prog&&packUnivers(prog)?prog:(r.programme&&packUnivers(r.programme)?r.programme:(UNIVERS[0]?UNIVERS[0].id:"bachelor"));
  return r;
}
function packPlacer(r){
  var i;
  for(i=0;i<RECETTES.length;i++){if(RECETTES[i].id===r.id){RECETTES[i]=r;return;}}
  RECETTES.push(r);
}
/* Le stockage d'un pack nouveau ne doit pas être celui d'une autre matière : sa progression s'y mélangerait */
function packStockagePris(r){
  var i;
  if(PACK_INT[r.id])return null;
  for(i=0;i<RECETTES.length;i++){if(RECETTES[i].id!==r.id&&RECETTES[i].stockage===r.stockage)return RECETTES[i].titre;}
  return null;
}
function packsCharger(){
  packListe().forEach(function(id){
    var p=packLsGet(KPACK+id),res;
    if(!p||typeof p.texte!=="string")return;
    res=packLire(p.texte);
    if(!res.r||res.r.id!==id){PACKS[id]={p:p,err:res.err.length?res.err:[tx("pack.id_change")]};return;}
    if(packStockagePris(res.r)){PACKS[id]={p:p,err:[tx("pack.stockage_pris",{titre:packStockagePris(res.r)})]};return;}
    PACKS[id]={p:p,r:packPreparer(res.r,p.programme)};
    packPlacer(PACKS[id].r);
    if(revueValide(p.revue)&&!REVUES[id])REVUES[id]=p.revue;  /* v13 : relecture venue avec le cours (import, 12m) */
  });
}
/* Relecture des fiches (forme de REVUES, build.py) : {date, par, fiches:{thème:{v:{critère:[verdict, note]}, h}}} */
function revueValide(R){
  if(!R||typeof R!=="object"||typeof R.date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(R.date)||typeof R.par!=="string"||!R.fiches||typeof R.fiches!=="object")return false;
  var t,x,k;
  for(t in R.fiches){if(R.fiches.hasOwnProperty(t)){
    x=R.fiches[t];if(!x||typeof x.h!=="string"||!x.v||typeof x.v!=="object")return false;
    for(k in x.v){if(x.v.hasOwnProperty(k)&&!(x.v[k] instanceof Array&&typeof x.v[k][0]==="string"))return false;}
  }}
  return true;
}

/* ---------- Univers et systèmes créés dans l'app (v13, Maitrise) ----------
   Gardés dans le profil (PROF.mondes, suit le compte ; copie locale qfcc2.profil, lue ici avant le profil de 13) :
   {maj, base, univers:[{id, nom, description, libelle, vide, galaxie, cree}],
    systemes:[{id, univers, nom, stockage, planetes:[{id, nom}], cree}]}. Un univers s'ajoute à UNIVERS (avant 08b) ; un
   système = une matière : son cours importé (pack de même identifiant, packsCharger) s'il en a un, sinon une matière
   « en préparation » dont les planètes sont les thèmes. base : date d'un import complet (12m) ; les univers et systèmes
   plus anciens, venus d'un autre appareil, sont alors laissés de côté (mondesUnion). Format : docs/format-donnees.md. */
var MONDES={maj:0,base:0,univers:[],systemes:[]},MONDES_BY={};
var GAL_BORNES={teinte:[0,360,200],bras:[1,6,2],enroulement:[0.5,6,3],inclinaison:[-3.2,3.2,0],aplatissement:[0.2,1,0.6]};  /* build.py : GALAXIE */
var STOCK_RE=/^(qfcc2|tm)\.[A-Za-z0-9_.-]*$/;
function mondeTexte(s,n){return typeof s==="string"?packTrim(s).replace(/\s+/g," ").slice(0,n):"";}
function mondeGalaxie(g){
  var o={},k,v;g=(g&&typeof g==="object")?g:{};
  for(k in GAL_BORNES){if(GAL_BORNES.hasOwnProperty(k)){v=g[k];o[k]=(typeof v==="number"&&isFinite(v)&&v>=GAL_BORNES[k][0]&&v<=GAL_BORNES[k][1])?v:GAL_BORNES[k][2];}}
  return o;
}
function mondesNormaliser(m){
  var o={maj:0,base:0,univers:[],systemes:[]},vu={},vs={};
  if(!m||typeof m!=="object")return o;
  o.maj=typeof m.maj==="number"?m.maj:0;o.base=typeof m.base==="number"?m.base:0;
  asArray(m.univers).forEach(function(u){
    if(!u||typeof u.id!=="string"||!PACK_ID_RE.test(u.id)||vu[u.id]||!mondeTexte(u.nom,60))return;
    vu[u.id]=1;
    o.univers.push({id:u.id,nom:mondeTexte(u.nom,60),description:mondeTexte(u.description,200),libelle:mondeTexte(u.libelle,30)||"matières",
      vide:mondeTexte(u.vide,300),galaxie:mondeGalaxie(u.galaxie),cree:typeof u.cree==="number"?u.cree:0});
  });
  asArray(m.systemes).forEach(function(s){
    if(!s||typeof s.id!=="string"||!PACK_ID_RE.test(s.id)||vs[s.id]||!mondeTexte(s.nom,80))return;
    vs[s.id]=1;
    var pl=[],vp={};
    asArray(s.planetes).forEach(function(x){if(x&&typeof x.id==="string"&&PACK_ID_RE.test(x.id)&&!vp[x.id]&&mondeTexte(x.nom,80)){vp[x.id]=1;pl.push({id:x.id,nom:mondeTexte(x.nom,80)});}});
    o.systemes.push({id:s.id,univers:typeof s.univers==="string"?s.univers:"",nom:mondeTexte(s.nom,80),
      stockage:(typeof s.stockage==="string"&&STOCK_RE.test(s.stockage))?s.stockage:"qfcc2.pk."+s.id+".",planetes:pl,cree:typeof s.cree==="number"?s.cree:0});
  });
  return o;
}
/* Deux appareils : tout ce que l'un ou l'autre a créé (rien ne s'efface) ; un import complet (base) écarte ce qui est plus ancien */
function mondesUnion(a,b){
  a=mondesNormaliser(a);b=mondesNormaliser(b);
  if(a.base&&a.base>=b.maj)return a;
  if(b.base&&b.base>=a.maj)return b;
  var o={maj:Math.max(a.maj,b.maj),base:Math.max(a.base,b.base),univers:a.univers.slice(),systemes:a.systemes.slice()};
  var vu={},vs={};o.univers.forEach(function(u){vu[u.id]=1;});o.systemes.forEach(function(s){vs[s.id]=1;});
  b.univers.forEach(function(u){if(!vu[u.id])o.univers.push(u);});
  b.systemes.forEach(function(s){if(!vs[s.id])o.systemes.push(s);});
  return o;
}
/* Un univers créé, tel que le reste de l'app les connaît (build.py : lire_programmes) */
function mondeUnivers(u){
  return {id:u.id,nom:u.nom,description:u.description||"",galaxie:u.galaxie,libelle:(u.libelle&&u.libelle!=="matières")?u.libelle:tx("pack.univers_libelle"),matieres:[],perso:1,
    vide:u.vide||tx("pack.univers_vide")};
}
/* Un système sans cours : une matière en préparation, ses planètes pour thèmes */
function systemeRecette(s){
  var n=s.planetes.length;
  return {id:s.id,modele:"matiere-de-cours",statut:"en préparation",titre:s.nom,titre_h1:s.nom,stockage:s.stockage,programme:s.univers,
    accueil:{surtitre:tx("pack.systeme_surtitre"),resume:n?tnx("pack.systeme_planetes",n):tx("pack.systeme_sans_planete"),sources:"",
      vide:tx("pack.systeme_vide")},
    themes:s.planetes.map(function(p){return {id:p.id,nom:p.nom};}),blocs:{},contenu:{qcm:[],cas:[],reserve:[],exercices:[],cours:[]},systeme:1};
}
/* Au chargement : les univers d'abord (un cours importé y est rangé), puis les systèmes sans cours */
function mondesUnivers(){
  var p=packLsGet("qfcc2.profil");
  MONDES=mondesNormaliser(p&&p.mondes);
  MONDES.univers.forEach(function(u){if(!packUnivers(u.id))UNIVERS.push(mondeUnivers(u));});
}
function mondesSystemes(){
  MONDES.systemes.forEach(function(s){
    MONDES_BY[s.id]=s;
    if(!packUnivers(s.univers)||RECETTES.some(function(r){return r.id===s.id;}))return;
    RECETTES.push(systemeRecette(s));
  });
}
try{mondesUnivers();}catch(e){}
try{packsCharger();}catch(e){}
try{mondesSystemes();}catch(e){}
