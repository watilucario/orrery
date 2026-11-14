/* ---------- « À lire avant » un examen (v16) ----------
   Demande de l'auteur (1er nov.) : avant un CC ou un partiel, une liste de ce qu'il doit lire, tirée des thèmes choisis
   pour l'examen (x.themes, Agenda › Examens ; sans thèmes : tout le programme, examThemes). Dans l'ordre :
   1. les fiches des thèmes, 2. leurs « À retenir », 3. la fiche de synthèse de la matière limitée à ces thèmes,
   4. les pièges et les erreurs des corrigés signalés dans les fiches (encadrés « attention » et « source »),
   5. les questions ratées sur ces thèmes, avec une série pour les refaire.
   Chaque ligne se coche. Cases gardées par examen dans le profil : PROF.lire = {id d'examen: {c:{clé:1}, at}}, qui suit
   le compte (profilFusion, 13 : par examen, le plus récent gagne).
   Ouvert depuis l'échéance sur « Aujourd'hui » (renderHubExams), Agenda › Examens (renderExams) et le surtitre de la
   page d'une matière (#b-h-alire, renderHome). Rien de propre à une matière : tout vient de la recette et des fiches. */
var AL={id:null};
function alExam(){var i,l=examens();for(i=0;i<l.length;i++){if(l[i].id===AL.id)return l[i];}return null;}
/* Les thèmes de l'examen, dans l'ordre de la recette */
function alThemes(x){var l=examThemes(x);return THEMES.filter(function(t){return !l||l.indexOf(t.k)>=0;}).map(function(t){return t.k;});}
/* Questions ratées sur ces thèmes. Aujourd'hui : les erreurs de la matière (MISS, « À retravailler »). Le carnet
   d'erreurs (v16, point 3) se rebranche ici, et nulle part ailleurs. */
/* v16 : les erreurs du carnet (12o) pas encore maîtrisées, sur ces thèmes */
function alErreurs(th){return carnetMat(MAT.k).filter(function(x){return !x.ok&&th.indexOf(x.it.th)>=0;}).map(function(x){return BYID[x.it.id];}).filter(function(it){return !!it;});}

/* Cases cochées de l'examen ouvert. Jamais modifier en place un objet venu du compte (gelé) : on recopie. */
function alCoches(){var o=PROF&&PROF.lire&&PROF.lire[AL.id];return (o&&o.c&&typeof o.c==="object")?o.c:{};}
function alCocher(cle,on){
  if(!PROF)profilSave("");
  var l={},src=PROF.lire||{},c={},a=alCoches();
  Object.keys(src).forEach(function(k){l[k]=src[k];});
  Object.keys(a).forEach(function(k){c[k]=1;});
  if(on)c[cle]=1;else delete c[cle];
  l[AL.id]={c:c,at:Date.now()};
  PROF.lire=l;profilSave();
}
/* Fusion de deux PROF.lire : par examen, la liste cochée la plus récente gagne */
function alFusion(a,b){
  var m={},n=0;
  [a,b].forEach(function(s){
    if(!s||typeof s!=="object")return;
    Object.keys(s).forEach(function(k){var v=s[k];if(v&&typeof v==="object"&&(!m[k]||(v.at||0)>(m[k].at||0))){m[k]={c:clone(v.c||{}),at:v.at||0};n++;}});
  });
  return n?m:null;
}

/* Synthèse limitée aux thèmes : les mots des noms de thèmes (sans accents, 4 lettres au moins, coupés à 5) cherchés
   dans les titres « ### » et les lignes de liste. Un titre qui parle d'un thème garde sa partie entière ; sinon, on ne
   garde que les lignes de liste qui en parlent (avec l'encadré qui les contient). */
var AL_VIDES=["dans","pour","avec","sans","entre","leurs","leur","plus","moins","autres","autre","comme","sous","tout","tous","toutes"];
function alMots(th){
  var m=[];
  th.forEach(function(k){
    agNorm(themeName(k)).split(/[^a-z0-9]+/).forEach(function(w){
      if(w.length<4||AL_VIDES.indexOf(w)>=0)return;
      w=w.slice(0,5);if(m.indexOf(w)<0)m.push(w);
    });
  });
  return m;
}
function alParle(txt,mots){var t=" "+agNorm(txt).replace(/[^a-z0-9]+/g," ");return mots.some(function(w){return t.indexOf(" "+w)>=0;});}
function alSynthese(md,mots){
  var ls=String(md).split("\n"),secs=[],s=null,u=null,i;
  function unite(t){u={t:t,ls:[]};s.u.push(u);}
  for(i=0;i<ls.length;i++){
    if(ls[i].indexOf("## ")===0){s={t:trim(ls[i].slice(3)),u:[]};secs.push(s);unite(null);continue;}
    if(!s)continue;  /* introduction et « Avant de lire » : pas dans la liste */
    if(ls[i].indexOf("### ")===0){unite(trim(ls[i].slice(4)));continue;}
    u.ls.push(ls[i]);
  }
  return secs.map(function(s){
    var out=[];
    s.u.forEach(function(u){
      var garde=u.t?alParle(u.t,mots):false,r=garde?u.ls.slice():alLignes(u.ls,mots);
      if(!r.some(function(l){return /^(- |\d+\. )/.test(l);})&&!garde)return;
      if(u.t)out.push("### "+u.t);
      out=out.concat(r);
    });
    return {t:s.t,md:out.join("\n")};
  }).filter(function(s){return trim(s.md)!=="";});
}
/* Les lignes de liste qui parlent d'un thème, avec leurs suites, dans leurs encadrés */
function alLignes(ls,mots){
  var out=[],pile=[],i=0,m;
  while(i<ls.length){
    var l=ls[i];
    m=FIG_DEBUT.exec(l);
    if(m&&ENCADRES.indexOf(m[1])>=0){pile.push({l:l,ecrit:false});i++;continue;}
    if(trim(l)===":::"){var e=pile.pop();if(e&&e.ecrit)out.push(":::");i++;continue;}
    if(/^(- |\d+\. )/.test(l)){
      var bloc=[l];i++;
      while(i<ls.length&&/^\s+\S/.test(ls[i])){bloc.push(ls[i]);i++;}
      if(alParle(bloc.join(" "),mots)){
        pile.forEach(function(e){if(!e.ecrit){out.push(e.l);e.ecrit=true;}});
        out=out.concat(bloc);
      }
      continue;
    }
    if(!trim(l)&&out.length&&trim(out[out.length-1]))out.push("");
    i++;
  }
  while(pile.length){if(pile.pop().ecrit)out.push(":::");}
  return out;
}
/* Pièges (« ::: attention ») et erreurs des documents (« ::: source ») d'une fiche, dans l'ordre */
function alPieges(c){
  var r=[];
  c.sections.forEach(function(s){
    var ls=s.md.split("\n"),i=0,m;
    while(i<ls.length){
      m=FIG_DEBUT.exec(ls[i]);
      if(m&&(m[1]==="attention"||m[1]==="source")){
        var j=i+1,prof=0,b=[ls[i]];
        while(j<ls.length){
          if(trim(ls[j])===":::"){if(!prof)break;prof--;}
          else if(FIG_DEBUT.test(ls[j]))prof++;
          b.push(ls[j]);j++;
        }
        b.push(":::");
        r.push({type:m[1],t:trim(m[2]),md:b.join("\n")});
        i=j+1;continue;
      }
      i++;
    }
  });
  return r;
}

/* Ouvrir l'écran. de : « hub », « agenda » ou « home », pour le retour. */
function openLire(id,de){
  var x=null;AL.id=id;x=alExam();
  if(!x)return;
  if(de)NAV_PRE.lire=de;
  NAV.lire.onglet=NAV_PRE.lire==="agenda"?"b-agenda":NAV_PRE.lire==="home"?"tab-rev":"tab-hub";
  if(!MAT||MAT.k!==x.matiere){if(!MATS[x.matiere])return;activate(x.matiere);}
  renderLire();show("lire");
}
function renderLire(){
  var x=alExam(),box=$("al-liste");clear(box);
  if(!x)return;
  var th=alThemes(x),tout=!examThemes(x),d=examJour(x),td=today(),c=alCoches(),cles=[];
  $("al-eyebrow").textContent=nb(x.nom+" · "+MAT.titre+" · "+fmtDay(d)+" · "+(d===td?tx("al.auj"):d===td+1?tx("al.demain"):d>td?tnx("al.dans",d-td):tx("al.passe")));
  $("al-lead").textContent=nb((tout?tx("al.tout"):tnx("al.n_themes",th.length,{total:THEMES.length,liste:th.map(themeName).join(", ")}))+". "+tx("al.lead_fin"));
  /* Une ligne cochable : case, titre, détail, et ce qu'on y fait (bouton, contenu replié) */
  function ligne(g,cle,titre,sous,corps){
    var on=!!c[cle],r=el("div","al-l"+(on?" fait":"")),id="al-c-"+cles.length,cb=el("input","al-cb");
    cles.push(cle);
    cb.type="checkbox";cb.id=id;cb.checked=on;cb.setAttribute("data-cle",cle);
    cb.addEventListener("change",function(){alCocher(cle,cb.checked);r.classList.toggle("fait",cb.checked);alAvance(cles);});
    var b=el("div","al-b"),lab=el("label","al-t");lab.setAttribute("for",id);lab.appendChild(document.createTextNode(nb(titre)));
    b.appendChild(lab);
    if(sous)b.appendChild(el("span","al-s",nb(sous)));
    if(corps)corps(b);
    r.appendChild(cb);r.appendChild(b);g.appendChild(r);
  }
  function partie(n,titre){var h=el("h2","al-h");h.appendChild(el("span","al-n",String(n)));h.appendChild(document.createTextNode(nb(titre)));box.appendChild(h);var g=el("div","al-g");box.appendChild(g);return g;}
  function replie(lab,md){return function(b){var dt=el("details","al-d"),sm=el("summary",null,lab);dt.appendChild(sm);var cc=el("div","al-dc");coursMd(md,cc);dt.appendChild(cc);b.appendChild(dt);};}
  var fi=th.filter(function(k){return !!coursDe(k);}),n=0,g;
  if(fi.length){
    g=partie(++n,tx("al.les_fiches"));
    fi.forEach(function(k){
      ligne(g,"fiche:"+k,themeName(k),tx("al.min",{n:coursMin(coursDe(k))}),function(b){
        var o=el("button","link al-ouvre",tx("al.lire_fiche"));o.type="button";o.setAttribute("data-th",k);
        o.addEventListener("click",function(){openFiche(k,"lire");});b.appendChild(o);
      });
    });
    g=partie(++n,i18nTitre("À retenir"));
    fi.forEach(function(k){var cl=ficheCle(coursDe(k));ligne(g,"ret:"+k,themeName(k),null,replie(nb(i18nTitre(cl.t)),cl.md));});
  }
  var syn=synDe();
  if(syn){
    var parts=tout?null:alSynthese(syn.sections.map(function(s){return "## "+s.t+"\n"+s.md;}).join("\n"),alMots(th));
    if(tout||parts.length){
      g=partie(++n,tx("al.synthese"));
      var ouvre=function(b){var o=el("button","link al-ouvre",tx("al.ouvrir_syn"));o.type="button";o.id="b-al-syn";o.addEventListener("click",function(){openFiche(SYN_K,"lire");});b.appendChild(o);};
      if(tout)ligne(g,"syn",nb(tx("al.fiche_syn")),tx("al.min",{n:coursMin(syn)})+" · "+tx("al.tout_prog"),ouvre);
      else{
        box.lastChild.previousSibling.appendChild(el("span","al-hs",nb(tx("al.limitee"))));
        parts.forEach(function(p){ligne(g,"syn:"+agNorm(p.t),p.t,null,replie(tx("al.lire"),p.md));});
        g.appendChild(el("p","src al-note")).appendChild(document.createTextNode(nb(tx("al.seulement"))));
        ouvre(g.lastChild);
      }
    }
  }
  var pg=[];
  fi.forEach(function(k){alPieges(coursDe(k)).forEach(function(p,i){p.th=k;p.i=i;pg.push(p);});});
  if(pg.length){
    g=partie(++n,tx("al.pieges"));
    pg.forEach(function(p){ligne(g,"pg:"+p.th+":"+p.i,(p.type==="source"?tx("al.divergent"):tx("al.piege"))+(p.t?" · "+p.t:""),themeName(p.th),replie(tx("al.lire"),p.md));});
  }
  var er=alErreurs(th);
  g=partie(++n,tx("al.tes_erreurs"));
  if(!er.length)g.appendChild(el("p","src al-vide",nb(tout?tx("al.vide_prog"):tx("al.vide_th"))));
  else{
    var sb=bigBtn(tx("al.refaire"),tnx(tout?"al.ratees_prog":"al.ratees_th",er.length),true,function(){BACK="lire";start(shuffle(alErreurs(alThemes(alExam()))),tx("al.serie",{nom:x.nom}),{exige:true});});
    sb.id="b-al-serie";g.appendChild(sb);
    er.forEach(function(it){ligne(g,"q:"+it.id,it.q,themeName(it.th),null);});
  }
  alAvance(cles);
}
/* Avancement : cases cochées sur le total */
function alAvance(cles){
  var c=alCoches(),f=cles.filter(function(k){return !!c[k];}).length,box=$("al-prog");clear(box);
  if(!cles.length)return;
  box.appendChild(el("p","statline",nb(f===cles.length?tx("al.tout_lu"):tx("al.lus",{f:f,n:cles.length}))));
  var bar=el("div","bar al-bar"),i=el("i");i.style.width=Math.round(f/cles.length*100)+"%";bar.appendChild(i);box.appendChild(bar);
}
/* Le lien « À lire avant » d'un examen, posé sous une liste d'échéances */
function alLiens(l,de){
  var p=el("div","al-liens");
  l.forEach(function(x){
    var b=el("button","link al-lien",nb(tx("al.lien",{nom:x.nom,mat:MATS[x.matiere]?" · "+MATS[x.matiere].titre:""})));b.type="button";b.setAttribute("data-x",x.id);
    b.addEventListener("click",function(){openLire(x.id,de);});p.appendChild(b);
  });
  return p;
}
$("b-al-modif").addEventListener("click",function(){var x=alExam();if(x)examModifier(NAV_PRE.lire==="agenda"?null:NAV_PRE.lire,x);});
