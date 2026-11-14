/* ---------- Contenu d'une matière : construit à partir de sa recette (RECETTES, assemblé par build.py depuis univers/) ---------- */
/* Questions : {id, th, q, o, c (index de la bonne option), e (explication), s (source), b (annexe affichée), fixed (ordre des options fixe), cas, ctx,
   n (marche de la grille de maîtrise, si l'énoncé la donne), r (regard « au-delà du calcul »), rl (v7.1 : true/false si l'énoncé
   dit « Rappel : oui|non », sinon null : l'app décide si la question peut revenir sans les choix), ctx (v7.3 : l'énoncé du
   cas, puis celui de la question, lignes « > »), rp (v7.3 : codes des lignes des documents types, « Repère : »), rpa (« Repère après : », montrées seulement
   avec la correction : pour une question « où trouve-t-on… ? », la carte donnerait la réponse)} */
var THEMES=[],Q=[],BYID={},CAS=[],CASQ={},QX=[],EXO=[],EXBY={};
function qItem(d,th,cas,ctx){return {id:d.id,th:th,q:d.q,o:d.o,c:d.c,e:d.e,s:d.s,b:!!d.b,fixed:!!d.fixed,cas:cas||null,ctx:[ctx,d.ctx].filter(function(x){return !!x;}).join("\n\n")||null,n:d.n||null,r:d.r||null,rl:typeof d.rl==="boolean"?d.rl:null,rp:d.rp||null,rpa:d.rpa||null,t:d.t||null,d:d.d||null};}  /* t, d : v13.4 (03g) */
function construireContenu(r){
  var c=r.contenu||{},out={THEMES:[],Q:[],BYID:{},CAS:[],CASQ:{},QX:[],EXO:[],EXBY:{},COURS:{},DOCS:c.documents||[],CONS:c.constructions||[]};
  (r.themes||[]).forEach(function(t){out.THEMES.push({k:t.id,n:t.nom});});
  (c.qcm||[]).forEach(function(d){var o=qItem(d,d.th);out.Q.push(o);out.BYID[o.id]=o;});
  /* Cas pratiques en étapes : chaque étape est une question, l'énoncé du cas est affiché à chaque étape */
  (c.cas||[]).forEach(function(k){
    var steps=[];
    k.steps.forEach(function(d,j){
      var o=qItem(d,k.th,k.k,k.ctx);o.step=j+1;o.of=k.steps.length;
      out.Q.push(o);out.BYID[o.id]=o;steps.push(o);
    });
    out.CASQ[k.k]=steps.slice();
    out.CAS.push({k:k.k,th:k.th,n:k.n,ctx:k.ctx,steps:steps});
  });
  /* Questions réservées à la simulation (absentes des séries d'entraînement) */
  (c.reserve||[]).forEach(function(d){var o=qItem(d,d.th);out.QX.push(o);out.BYID[o.id]=o;});
  (c.exercices||[]).forEach(function(e){out.EXO.push(e);out.EXBY[e.id]=e;});
  /* Fiches de cours (v7.2, 03c) : une par thème */
  (c.cours||[]).forEach(function(f){out.COURS[f.th]=f;});
  out.SYN=c.synthese||null;  /* v10.3 : la fiche de synthèse de la matière (tout le programme), ouverte comme une fiche (03c) */
  return out;
}
function pool(){var r=[],n;for(n=0;n<Q.length;n++){if(!Q[n].cas)r.push(Q[n]);}return r;}
function themeName(k){var n;for(n=0;n<THEMES.length;n++){if(THEMES[n].k===k)return THEMES[n].n;}return k;}
