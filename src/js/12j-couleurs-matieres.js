/* ---------- Couleurs des matières (v10.6) ----------
   Chaque matière a sa couleur, une des 16 teintes de l'agenda (semClasse, 12d). Réviser la montre (une bordure à gauche
   de chaque matière), et le cours de l'agenda qui porte son nom (agMatieres, 12c) prend la même.
   Gardée dans PROF.couleurs = {matière: {t, at}} : suit le compte, fusion par matière, la plus récente gagne
   (profilFusion, 13). Choisie dans Réviser (« Couleurs des matières »). À la première lecture, une matière reprend la
   couleur que le cours de l'agenda a déjà, sinon la première teinte libre. */
function matCouleurEntree(k){var c=PROF&&PROF.couleurs&&PROF.couleurs[k];return c&&typeof c.t==="number"&&c.t>=0&&c.t<SEM_NB?c:null;}
function matTeintesPrises(){
  var s={},k,c,src=(PROF&&PROF.couleurs)||{};
  for(k in src){if(src.hasOwnProperty(k)){c=matCouleurEntree(k);if(c)s[c.t]=1;}}
  return s;
}
function matTeinteLibre(k){
  var ag=(PROF&&PROF.agenda&&PROF.agenda.couleurs)||{},pris=matTeintesPrises(),x,i;
  for(x in ag){if(ag.hasOwnProperty(x)&&typeof ag[x]==="number"&&ag[x]>=0)pris[ag[x]]=1;}
  /* le cours de l'agenda qui porte déjà son nom garde sa couleur */
  for(x in ag){if(ag.hasOwnProperty(x)&&x.indexOf("c:")===0&&typeof ag[x]==="number"&&ag[x]>=0&&agMatieres(x.slice(2)).indexOf(k)>=0)return ag[x];}
  for(i=0;i<SEM_NB;i++){if(!pris[i])return i;}
  return 0;
}
function matPoser(k,t){
  var o={},src=(PROF&&PROF.couleurs)||{},x,p={};
  if(!PROF)return;
  for(x in src){if(src.hasOwnProperty(x))o[x]=src[x];}
  o[k]={t:t,at:Date.now()};
  for(x in PROF){if(PROF.hasOwnProperty(x))p[x]=PROF[x];}  /* copie : le profil peut venir du compte, ne jamais le modifier en place */
  p.couleurs=o;PROF=p;profilSave();
}
/* La couleur d'une matière (teinte 0-15), donnée et gardée au premier appel */
function matCouleur(k){
  var c=matCouleurEntree(k);
  if(c)return c.t;
  var t=matTeinteLibre(k);
  matPoser(k,t);
  return t;
}
/* Réviser : la bordure à gauche de la matière prend sa couleur */
function matColore(b,k){var t=matCouleur(k);b.classList.add("bach-col");semClasse(t).split(" ").forEach(function(c){b.classList.add(c);});}
/* Le panneau « Couleurs des matières » : une ligne par matière, 16 pastilles ; la choisie est marquée */
function matPastille(k,n){
  var b=el("button","mcol-sw "+semClasse(n));b.type="button";b.title=tx("matcol.couleur_n",{n:n+1});
  b.setAttribute("aria-label",tx("matcol.aria",{titre:MATS[k].titre,n:n+1}));
  b.setAttribute("aria-pressed",matCouleur(k)===n?"true":"false");
  b.addEventListener("click",function(){matPoser(k,n);renderBach();if(!$("ag-semaine").hidden)semRendre();});
  return b;
}
function renderBachCouleurs(ms){
  var box=$("bach-couleurs");clear(box);
  if(box.hidden)return;
  box.appendChild(el("p","src",tx("matcol.consigne")));
  ms.forEach(function(k){
    var row=el("div","mcol-row"),sws=el("div","mcol-sws"),n;
    row.appendChild(el("span","mcol-nom",nb(MATS[k].titre)));
    for(n=0;n<SEM_NB;n++){sws.appendChild(matPastille(k,n));}
    row.appendChild(sws);box.appendChild(row);
  });
}
$("b-bach-couleurs").addEventListener("click",function(){
  var box=$("bach-couleurs"),btn=$("b-bach-couleurs");
  box.hidden=!box.hidden;
  btn.textContent=box.hidden?tx("matcol.ouvrir"):tx("matcol.fermer");
  btn.setAttribute("aria-expanded",box.hidden?"false":"true");
  renderBach();
});
