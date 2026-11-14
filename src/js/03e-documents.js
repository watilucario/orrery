/* ---------- Documents types (v7.3) : le bilan et le compte de résultat, ligne par ligne ----------
   Demande de l'auteur (18 oct.) : « un modèle de bilan et compte de résultat lisible m'aidera pour le jour J à me repérer,
   savoir chercher les informations aux bons endroits ». Contenu : univers/<programme>/<matière>/documents.md (build.py :
   lire_documents ; dans un pack : « # Documents », packDocuments, 02). Un document = {id, t, src, intro, g:[{t, l:[{k,
   p, u}]}]} : ses groupes dans l'ordre de l'examen, chaque ligne avec son code (k : celui de la liasse fiscale quand il
   a deux caractères, AB, DU, FW…), son poste (p) et ce que l'analyse en fait (u).
   Écran docs (tuile « Modèles ») : un document à la fois, ou une recherche dans tous. Dans une question qui dit
   « Repère : DU, EH » : avant la réponse, la carte du document avec ces lignes surlignées (où chercher, sans dire quoi
   en faire : ce serait souffler la réponse) ; sous la correction, ces lignes avec ce que tu en fais. « Repère après : »
   (question « où trouve-t-on… ? ») : seulement sous la correction. Même carte dans un exercice. Rien en simulation :
   conditions d'examen. */
var DOCS=[],DOC_PAR={},DOCV={id:null,q:""};
function docsCharger(M){
  DOCS=M.DOCS||[];DOC_PAR={};DOCV={id:DOCS.length?DOCS[0].id:null,q:""};
  DOCS.forEach(function(d){d.g.forEach(function(g){g.l.forEach(function(x){DOC_PAR[x.k]={d:d,g:g,x:x};if(x.k2)DOC_PAR[x.k2]={d:d,g:g,x:x};});});});
}
function docLignes(d){return d.g.reduce(function(n,g){return n+g.l.length;},0);}
function docCode(k){return /^([A-Z0-9]{2}|\d{3,8})$/.test(k);}  /* un code de la liasse fiscale, ou un numéro de compte (v8) ; les autres identifiants restent cachés */
/* Les repères d'une question qui existent dans les documents de la matière */
function repDe(it,apres){
  var ks=it?(it.rp||[]).concat(apres&&it.rpa?it.rpa:[]):[];
  return blocOn("documents")?ks.filter(function(k,i){return !!DOC_PAR[k]&&ks.indexOf(k)===i;}):[];
}
function repDocs(ks){var out=[];ks.forEach(function(k){var d=DOC_PAR[k].d;if(out.indexOf(d)<0)out.push(d);});return out;}
function repResume(ks){
  return repDocs(ks).map(function(d){
    var c=ks.filter(function(k){return DOC_PAR[k].d===d;}).map(function(k){return docCode(k)?k:DOC_PAR[k].x.p;});
    return d.t+" · "+c.join(", ");
  }).join(" ; ");
}
/* Une ligne d'un document. usage : écrire ce que l'analyse en fait */
function docLigne(x,hl,usage){
  var r=el("div","doc-r"+(hl?" hl":"")),h=el("div","doc-h");
  h.appendChild(el("span","doc-p",nb(x.p)));
  if(docCode(x.k))h.appendChild(el("span","doc-k",x.k));
  if(x.k2&&docCode(x.k2))h.appendChild(el("span","doc-k doc-k2",x.k2));  /* v8 : code de la 2e colonne (amortissements) */
  r.appendChild(h);
  if(usage&&x.u)r.appendChild(el("p","doc-u",nb(x.u)));
  r.setAttribute("data-k",x.k);
  return r;
}
/* Un document entier : ses groupes et ses lignes ; hl = codes à surligner ; usage : pour chaque ligne */
function docRendre(d,hl,usage,intro){
  var box=el("div","doc");
  if(intro&&d.intro)box.appendChild(el("p","doc-i",nb(d.intro)));
  d.g.forEach(function(g){
    var gr=el("div","doc-gr");
    if(g.t)gr.appendChild(el("p","doc-g",nb(g.t)));
    g.l.forEach(function(x){gr.appendChild(docLigne(x,hl.indexOf(x.k)>=0||(!!x.k2&&hl.indexOf(x.k2)>=0),usage));});
    box.appendChild(gr);
  });
  return box;
}
/* Sous la question : la carte des documents concernés, lignes surlignées, sans ce qu'on en fait */
function repCarte(box,ks){
  clear(box);
  repDocs(ks).forEach(function(d){
    var mine=ks.filter(function(k){return DOC_PAR[k].d===d;});
    box.appendChild(el("p","rep-t",nb(d.t)));
    box.appendChild(el("p","rep-l",nb(tn("doc.a_trouver",mine.length,{liste:mine.map(function(k){var x=DOC_PAR[k].x;return x.p+(docCode(k)?" ("+k+")":"");}).join(" ; ")}))));
    var w=el("div","rep-carte");w.appendChild(docRendre(d,ks,false,false));box.appendChild(w);
  });
  /* la source du document lui-même (la liasse) ; celles de « ce que tu en fais » sont dans l'écran Modèles */
  box.appendChild(el("p","src rep-src",nb(t("doc.source",{src:repDocs(ks).map(function(d){return d.src.split(" · ")[0];}).join(" ; ")}))));
}
function repRecentrer(box){
  [].forEach.call(box.querySelectorAll(".rep-carte"),function(w){
    var h=w.querySelector(".doc-r.hl");
    if(h)w.scrollTop=Math.max(0,h.offsetTop-w.clientHeight/3);  /* .rep-carte est positionnée : offsetTop y est relatif */
  });
}
function repInit(btn,box,ks){
  var b=$(btn),x=$(box);
  x.hidden=true;b.hidden=!ks.length;b.setAttribute("aria-expanded","false");
  b.textContent=t("doc.ou_trouver");
  if(ks.length)repCarte(x,ks);else clear(x);
}
function repBascule(btn,box){
  var b=$(btn),x=$(box);
  x.hidden=!x.hidden;b.setAttribute("aria-expanded",x.hidden?"false":"true");
  b.textContent=x.hidden?t("doc.ou_trouver"):t("doc.masquer");
  if(!x.hidden)repRecentrer(x);
}
$("b-rep").addEventListener("click",function(){repBascule("b-rep","rep");});
$("b-exrep").addEventListener("click",function(){repBascule("b-exrep","exrep");});
/* Sous la correction (03, choose) : les lignes repérées, avec ce que tu en fais */
function repFb(it){
  var d=$("fb-rep"),ks=repDe(it,true);
  d.hidden=!ks.length;d.open=false;
  if(!ks.length)return;
  $("fb-rep-t").textContent=nb(t("doc.dans_docs",{resume:repResume(ks)}));
  var c=$("fb-rep-c");clear(c);
  ks.forEach(function(k){var e=DOC_PAR[k],r=docLigne(e.x,false,true);if(e.g.t)r.insertBefore(el("p","doc-g",nb(e.d.t+" · "+e.g.t)),r.firstChild);c.appendChild(r);});
}

/* ---------- Écran « Modèles » ---------- */
function openDocs(){DOCV.q="";$("docs-q").value="";renderDocs();show("docs");}
function docNorm(s){s=String(s).toLowerCase();if(s.normalize)s=s.normalize("NFD");return s.replace(/[̀-ͯ]/g,"").replace(/[  ]/g," ");}
function renderDocs(){
  var c=carteDe("documents");
  $("docs-titre").textContent=nb(c.titre);
  var seg=$("docs-seg"),corps=$("docs-corps"),q=trim(DOCV.q);
  clear(seg);clear(corps);
  seg.hidden=!!q;
  DOCS.forEach(function(d){
    var b=el("button","chip"+(d.id===DOCV.id?" sel":""),nb(d.t));b.type="button";b.setAttribute("aria-pressed",d.id===DOCV.id?"true":"false");b.setAttribute("data-doc",d.id);
    b.addEventListener("click",function(){DOCV.id=d.id;renderDocs();});
    seg.appendChild(b);
  });
  if(q){
    var n=docNorm(q),tr=0;
    DOCS.forEach(function(d){
      var hits=[];
      d.g.forEach(function(g){g.l.forEach(function(x){if(docNorm(x.p+" "+(x.u||"")+" "+g.t).indexOf(n)>=0||x.k.toLowerCase()===n||(x.k2||"").toLowerCase()===n)hits.push([g,x]);});});
      if(!hits.length)return;
      tr+=hits.length;
      corps.appendChild(el("h2",null,nb(d.t)));
      var box=el("div","doc");
      hits.forEach(function(h){var r=docLigne(h[1],false,true);if(h[0].t)r.insertBefore(el("p","doc-g",nb(h[0].t)),r.firstChild);box.appendChild(r);});
      corps.appendChild(box);
    });
    $("docs-src").textContent="";
    $("docs-nb").textContent=tr?t("doc.pour",{n:tn("doc.nb_ligne",tr),q:q}):t("doc.rien",{q:q});
    return;
  }
  var d=DOCS.filter(function(x){return x.id===DOCV.id;})[0]||DOCS[0];
  if(!d)return;
  $("docs-nb").textContent=nb(t("doc.ordre",{n:tn("doc.nb_ligne",docLignes(d))}));
  corps.appendChild(docRendre(d,[],true,true));
  $("docs-src").textContent=nb(t("doc.source",{src:d.src}));
}
$("docs-q").addEventListener("input",function(){DOCV.q=this.value;renderDocs();});
