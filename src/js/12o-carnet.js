/* ---------- Carnet d'erreurs (v16) ----------
   Demande de l'auteur (1er nov.) : toutes ses erreurs, de toutes les matières de l'univers, filtrées par matière et par
   thème, avec pour chaque question ses bonnes et mauvaises réponses. Une question y entre dès qu'elle a été ratée une
   fois (compteurs, 03h) et sort de la liste active quand elle est maîtrisée (maitrisee, même règle que la grille) ; on
   peut revoir les erreurs sorties. On ouvre le carnet depuis Réviser, Progrès, la page d'une matière (qui en montre un
   aperçu à la place de « À retravailler ») et la page d'un chapitre (ses erreurs). Une série se lance sur les erreurs
   filtrées d'une matière : confiance demandée, rappel libre possible (S.exige), retour au carnet (BACK = "carnet").
   Rien n'est gardé : les filtres se remettent à zéro à chaque ouverture. */
var CN={mat:null,th:null,sorties:false};
SCREENS.push("carnet");
NAV.carnet={titre:tx("cn.titre"),onglet:"tab-rev",retour:function(){
  var r=NAV_PRE.carnet;
  if(r==="evol")return [tx("nav.progres"),function(){openEvol(NAV_PRE.evol);}];
  if(r==="home"&&MAT)return navRetourMat();
  if(r==="chap"&&chapTh())return navRetourChap();
  return [tx("nav.reviser"),function(){renderBach();show("bach");}];
}};
/* ret : écran d'où l'on vient (bach, evol, home, chap) ; mat, th : filtres de départ */
function openCarnet(ret,mat,th){
  NAV_PRE.carnet=ret||"bach";NAV.carnet.onglet=ret==="evol"?"tab-evol":"tab-rev";
  CN.mat=mat||null;CN.th=th||null;CN.sorties=false;
  renderCarnet();show("carnet");
}
/* Les erreurs d'une matière : {k, it, t (totaux), ok (maîtrisée)}, dans l'ordre du contenu */
function carnetMat(k){
  var D=MATS[k]&&MATS[k].ready?cptMat(k):null,out=[];
  if(!D)return out;
  D.M.Q.forEach(function(it){var x=cptDe(D,it);if(x.t.m>0){x.k=k;x.E=D.E;out.push(x);}});
  return out;
}
function carnetTout(){var r=[];univPrets().forEach(function(k){r=r.concat(carnetMat(k));});return r;}
function cnTheme(k,th){var M=MATS[k],n;for(n=0;n<M.THEMES.length;n++){if(M.THEMES[n].k===th)return M.THEMES[n].n;}return th;}
function cnCas(k,c){var M=MATS[k],n;for(n=0;n<M.CAS.length;n++){if(M.CAS[n].k===c)return M.CAS[n].n;}return c;}
/* Une série sur des erreurs d'une matière : la matière s'ouvre si besoin */
function carnetLancer(k,its,ret){
  if(!its.length)return;
  if(!MAT||MAT.k!==k)activate(k);
  BACK=ret||"carnet";
  start(shuffle(its.map(function(x){return MAT.BYID[x.it.id];}).filter(function(x){return !!x;})),tx("cn.titre"),{exige:true});
}
function cnCompte(t){return tx("cn.compte",{b:t.b,m:t.m})+(t.h?tx("cn.compte_h",{h:t.h}):"");}
/* Une ligne : la question, son thème, son compteur et son état ; dépliée, ce qui manque et la correction */
function carnetLigne(x,avecMat){
  var it=x.it,d=el("details","cn-l"+(x.ok?" cn-ok":"")),sm=el("summary");
  d.setAttribute("data-id",it.id);
  sm.appendChild(el("span","cn-q",nb(it.q)));
  var mt=el("span","cn-m");
  mt.appendChild(el("span","cn-th",nb((avecMat?MATS[x.k].titre+" · ":"")+cnTheme(x.k,it.th)+(it.cas?tx("cn.cas",{nom:cnCas(x.k,it.cas)}):""))));
  mt.appendChild(el("span","cn-c",cnCompte(x.t)));
  mt.appendChild(el("span","cn-e "+(x.ok?"ok":"ko"),x.ok?tx("cn.maitrisee"):tx("cn.a_retravailler")));
  sm.appendChild(mt);d.appendChild(sm);
  var c=el("div","cn-d");
  if(!x.ok){var mq=cptManque(it,x.t,x.E);if(mq.length)c.appendChild(el("p","cn-manque",nb(tx("cn.pour_maitriser",{liste:mq.join(", ")}))));}
  else c.appendChild(el("p","cn-manque",nb(tnx("cn.sortie",x.t.j,{b:x.t.b}))));
  var bo=el("p");bo.appendChild(el("span","mb",tx("cn.bonne")));bo.appendChild(document.createTextNode(nb(bonneTexte(it))));c.appendChild(bo);
  if(it.e)c.appendChild(el("p",null,nb(it.e)));
  if(it.s)c.appendChild(el("p","src",tx("cn.source",{s:it.s})));
  d.appendChild(c);
  return d;
}
function renderCarnet(){
  var ms=univPrets(),tout=carnetTout(),sel=$("cn-mat"),ts=$("cn-th"),seg=$("cn-seg"),liste=$("cn-liste"),go=$("cn-go");
  if(CN.mat&&ms.indexOf(CN.mat)<0)CN.mat=null;
  if(!CN.mat)CN.th=null;
  var E=exigence(CN.mat?MATS[CN.mat]:MAT);
  $("cn-regle").textContent=nb(tx("cn.regle",{bonnes:E.bonnes,jours:E.jours,ratio:E.ratio}));
  /* Filtres : matière, puis thème */
  clear(sel);
  function opt(v,t,on){var o=el("option",null,nb(t));o.value=v;if(on)o.selected=true;sel.appendChild(o);}
  opt("",tx("cn.toutes",{lib:univLib(),n:tout.filter(function(x){return !x.ok;}).length}),!CN.mat);
  ms.forEach(function(k){opt(k,MATS[k].titre+" ("+tout.filter(function(x){return x.k===k&&!x.ok;}).length+")",CN.mat===k);});
  $("cn-mat-l").hidden=ms.length<2;
  clear(ts);$("cn-th-l").hidden=!CN.mat;
  if(CN.mat){
    var o0=el("option",null,tx("cn.tous_themes"));o0.value="";ts.appendChild(o0);
    MATS[CN.mat].THEMES.forEach(function(t){
      var n=tout.filter(function(x){return x.k===CN.mat&&x.it.th===t.k&&!x.ok;}).length,o=el("option",null,nb(t.n+" ("+n+")"));
      o.value=t.k;if(CN.th===t.k)o.selected=true;ts.appendChild(o);
    });
  }
  var L=tout.filter(function(x){return (!CN.mat||x.k===CN.mat)&&(!CN.th||x.it.th===CN.th);});
  var act=L.filter(function(x){return !x.ok;}),sor=L.filter(function(x){return x.ok;}),vue=CN.sorties?sor:act;
  clear(seg);
  [[false,tx("cn.actives",{n:act.length}),"cn-actives"],[true,tx("cn.sorties",{n:sor.length}),"cn-sorties"]].forEach(function(s){
    var b=el("button","chip"+(CN.sorties===s[0]?" sel":""),s[1]);b.type="button";b.id=s[2];b.setAttribute("aria-pressed",CN.sorties===s[0]?"true":"false");
    b.addEventListener("click",function(){CN.sorties=s[0];renderCarnet();});seg.appendChild(b);
  });
  /* Séries : une par matière (une série vit dans sa matière) */
  clear(go);
  var parMat={};act.forEach(function(x){(parMat[x.k]=parMat[x.k]||[]).push(x);});
  var mk=ms.filter(function(k){return parMat[k];});
  if(!CN.sorties)mk.forEach(function(k){
    var n=parMat[k].length,b=bigBtn(mk.length>1?tx("cn.refaire_mat",{titre:MATS[k].titre}):tx("cn.refaire_ces"),tnx("cn.nq",n)+(CN.th?" · "+cnTheme(k,CN.th):"")+tx("cn.go_sous"),false,function(){carnetLancer(k,parMat[k]);});
    b.setAttribute("data-mat",k);if(mk.length===1)b.id="b-cn-go";go.appendChild(b);
  });
  clear(liste);
  if(!vue.length){
    liste.appendChild(el("p","lead",CN.sorties?tx("cn.vide_sorties")
      :L.length?tx("cn.vide_maitrisees"):tx("cn.vide")));
    return;
  }
  var g=el("div","cn-liste");vue.forEach(function(x){g.appendChild(carnetLigne(x,!CN.mat&&ms.length>1));});liste.appendChild(g);
}
$("cn-mat").addEventListener("change",function(){CN.mat=$("cn-mat").value||null;CN.th=null;renderCarnet();});
$("cn-th").addEventListener("change",function(){CN.th=$("cn-th").value||null;renderCarnet();});

/* Entrées : un bouton dans Réviser et dans Progrès */
function carnetBouton(box,ret){
  if(!box)return;clear(box);
  var t=carnetTout(),a=t.filter(function(x){return !x.ok;}).length,s=t.length-a;
  var b=bigBtn(tx("cn.titre"),a?tnx("cn.q_a_retravailler",a)+(s?tnx("cn.n_sorties",s):""):t.length?tnx("cn.tout_maitrise",s):tx("cn.aucune"),false,function(){openCarnet(ret);});
  b.id=ret==="evol"?"b-ev-carnet":"b-bach-carnet";box.appendChild(b);
}
/* Page d'une matière : le carnet de la matière à la place de « À retravailler » (avant les questions marquées) */
function carnetHome(kp){
  var old=$("keep-carnet");if(old&&old.parentNode)old.parentNode.removeChild(old);
  if(!blocOn("qcm"))return;
  var t=carnetMat(MAT.k),a=t.filter(function(x){return !x.ok;}),box=el("div","cn-home");box.id="keep-carnet";
  box.appendChild(el("p","statline cn-res",a.length?tnx("cn.q_a_retravailler",a.length)+tnx("cn.n_sorties",t.length-a.length):t.length?tx("cn.home_ok"):tx("cn.home_vide")));
  if(a.length){
    var g=el("div","cn-liste");a.slice(0,3).forEach(function(x){g.appendChild(carnetLigne(x,false));});box.appendChild(g);
    var gb=el("div","group"),b=bigBtn(tx("cn.refaire_miennes"),tnx("cn.nq",a.length)+tx("cn.conf_suite"),false,function(){carnetLancer(MAT.k,a,"home");});b.id="b-keep-carnet";gb.appendChild(b);box.appendChild(gb);
  }
  if(t.length){var lk=el("button","link cn-voir",tx("cn.voir_tout"));lk.type="button";lk.id="b-keep-cn-voir";lk.addEventListener("click",function(){openCarnet("home",MAT.k);});box.appendChild(lk);}
  kp.parentNode.insertBefore(box,kp);
}
/* Page d'un chapitre : ses erreurs */
function carnetChap(box,th){
  if(!box)return;clear(box);
  var t=carnetMat(MAT.k).filter(function(x){return x.it.th===th;}),a=t.filter(function(x){return !x.ok;});
  if(!t.length)return;
  box.appendChild(el("h2",null,tx("cn.chap_h")));
  box.appendChild(el("p","statline cn-res",a.length?tnx("cn.q_a_retravailler",a.length)+tnx("cn.n_sorties",t.length-a.length):tx("cn.chap_ok")));
  if(a.length){
    var g=el("div","cn-liste");a.slice(0,5).forEach(function(x){g.appendChild(carnetLigne(x,false));});box.appendChild(g);
    var gb=el("div","group"),b=bigBtn(tx("cn.refaire_ces"),tnx("cn.nq",a.length)+tx("cn.conf_suite"),false,function(){carnetLancer(MAT.k,a,"chap");});b.id="b-ch-carnet";gb.appendChild(b);box.appendChild(gb);
  }
  var lk=el("button","link cn-voir",tx("cn.voir_carnet"));lk.type="button";lk.id="b-ch-cn-voir";lk.addEventListener("click",function(){openCarnet("chap",MAT.k,th);});box.appendChild(lk);
}
