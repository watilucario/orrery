/* ---------- Univers (v5) : un par programme (univers/<programme>/programme.json) ----------
   Bachelor (les matières des cours), TAGE MAGE (ses sous-tests)… UNIVERS vient de build.py, dans l'ordre des dossiers :
   {id, nom, description, galaxie, libelle (« matières », « sous-tests »), vide (texte quand rien n'est prêt), matieres}.
   L'univers ouvert (UNIV) choisit ce que montrent l'accueil, Réviser, Progrès et les prochains examens ; le profil,
   l'agenda et les réglages restent communs. Gardé dans les réglages (PROF.reglages.univers, suit le compte, et
   qfcc2.reglages). La dernière matière ouverte de chaque univers : qfcc2.univmat.
   Changer d'univers : menu « Univers » ou la pastille de l'accueil, avec le passage d'une galaxie à l'autre (12g). */
var KUNIVMAT="qfcc2.univmat",UNIV_BY={},UNIV=UNIVERS.length?UNIVERS[0].id:null;
UNIVERS.forEach(function(u){UNIV_BY[u.id]=u;});
function univ(){return UNIV_BY[UNIV]||UNIVERS[0]||{id:null,nom:"",description:"",libelle:t("univ.matieres"),vide:"",matieres:[]};}
function univDe(k){return MATS[k]?MATS[k].programme:null;}
function univMats(u){u=u||UNIV;return MATS_ORDER.filter(function(k){return univDe(k)===u;});}
function univPrets(u){return univMats(u).filter(function(k){return MATS[k].ready;});}
function univLib(){return univ().libelle||t("univ.matieres");}
/* L'univers a-t-il des cours dans l'agenda (champ agenda de ses recettes) ? Sinon, pas de cours du jour sur son accueil. */
function univAgenda(){return univMats().some(function(k){return MATS[k].agenda.length>0;});}
/* Matière à ouvrir dans un univers : la dernière ouverte, sinon la première prête, sinon la première */
function univMat(u){
  var m=load(KUNIVMAT,{}),k=(m&&typeof m==="object")?m[u]:null;
  if(k&&univDe(k)===u)return k;
  var p=univPrets(u);return p.length?p[0]:(univMats(u)[0]||MATS_ORDER[0]);
}
/* Appelé par renderHome (03) : la matière ouverte est retenue pour son univers, et l'univers la suit
   (une matière d'un autre univers ouverte depuis l'agenda fait passer dans son univers, sans animation) */
function univSuivreMat(){
  if(!MAT)return;
  var m=load(KUNIVMAT,{});if(!m||typeof m!=="object")m={};
  if(m[MAT.programme]!==MAT.k){m[MAT.programme]=MAT.k;save(KUNIVMAT,m);}
  if(MAT.programme!==UNIV&&UNIV_BY[MAT.programme])univFixer(MAT.programme);
}
/* Change l'univers retenu (réglages, donc le compte) */
function univFixer(id){
  if(!UNIV_BY[id])return false;
  var ch=id!==UNIV;UNIV=id;
  if(reglages().univers!==id)reglEnregistrer({univers:id});
  return ch;
}
/* Passe dans un univers : sa matière, puis son accueil (rendu par l'appelant) */
function univPoser(id){UNIV=id;activate(univMat(id));}
/* Démarrage (13) : l'univers des réglages, sinon celui de la dernière matière ouverte, sinon le premier */
function univDemarrer(){
  var r=reglages().univers,k=load(KMAT,null);
  if(r&&UNIV_BY[r])UNIV=r;
  else if(MATS[k]&&UNIV_BY[univDe(k)])UNIV=univDe(k);
  if(!MATS[k]||univDe(k)!==UNIV)k=univMat(UNIV);
  activate(k);
}
/* Profil arrivé du compte (reglProfil, 12e) : son univers gagne s'il est plus récent. On ne change d'univers sous les
   yeux qu'aux écrans de départ (accueil, Réviser, Progrès) ; ailleurs, au prochain lancement. */
function univSuivreCompte(){
  var u=reglages().univers;
  if(!u||!UNIV_BY[u]||u===UNIV)return;
  if(ECRAN!=="hub"&&ECRAN!=="bach"&&ECRAN!=="evol")return;
  univPoser(u);
  if(ECRAN==="bach"){renderBach();navMaj("bach");}else{renderHub();show("hub");}
}
/* Liste dans la langue : « A, B et C » */
function univListe(l){return l.length<2?l.join(""):l.slice(0,-1).join(", ")+t("univ.et")+l[l.length-1];}
function univCap(s){return s?s.charAt(0).toUpperCase()+s.slice(1):s;}
