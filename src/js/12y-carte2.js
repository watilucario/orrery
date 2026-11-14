/* ---------- Carte et saut entre univers (v23) ----------
   Demande de l'auteur (11 nov.) : la carte et le passage d'un univers à l'autre « dénotent » : une autre esthétique que le reste.
   Ici, les deux parlent la langue de l'accueil : chaque univers est une ÉTOILE (la sienne), chaque matière une planète éclairée
   par elle, le tout dessiné par le même moteur WebGL (12x). Ce fichier remplace carteOuvrir (12n) et cosVers (12g) : leurs
   anciennes versions, plus bas dans le code, ne sont plus appelées.
   - Niveau « Univers » : toutes les étoiles dans le ciel. Toucher une étoile : la caméra s'en approche.
   - Niveau « Système » : l'étoile au centre, ses matières en orbite. Toucher une planète : la matière s'ouvre ; toucher l'étoile :
     retour aux univers.
   - Changer d'univers (pastille, panneau, Réviser) : un saut à vitesse lumière, étoiles étirées puis arrivée dans le nouveau système.
   Moins de mouvement : pas de vol, pas de saut, un seul affichage. */
var CAR2={raf:0,gl:undefined,foc:-1,s:0,anim:null,t0:0,boutons:[],px:0,py:0,cx:-1,cy:-1,pret:false,uid:null};

function car2GL(){var cv=$("carte2-gl");if(!cv)return null;if(CAR2.gl===undefined)CAR2.gl=aglCreer(cv);return CAR2.gl;}
function car2Facile(u){u=Math.max(0,Math.min(1,u));return 1-Math.pow(1-u,3);}
function car2Doux(u){u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);}

/* Position d'une étoile au niveau « Univers » (coordonnées de l'écran) */
function car2Pos(i,n,W,H){
  var u=UNIVERS[i],g=astGraine(u.id),ecart=Math.min(W*.3,Math.max(150,W*.8/Math.max(1,n))),etroit=W<560;
  if(etroit){var yy=H*(.3+.4*(n>1?i/(n-1):.5)),xx=W*(.5+(i%2?.16:-.16)*(n>1?1:0));return {x:xx,y:yy};}
  return {x:W*.5+(i-(n-1)/2)*ecart,y:H*.5+Math.sin(g+i*1.7)*H*.07};
}
function car2Construire(){
  var sec=$("carte");
  [].forEach.call(sec.children,function(e){if(e.id!=="carte2")e.hidden=true;});
  var box=$("carte2");
  if(!box){
    box=el("div","carte2");box.id="carte2";
    var oc=el("canvas","carte2-gl carte2-orb");oc.id="carte2-orb";oc.setAttribute("aria-hidden","true");box.appendChild(oc);
    var cv=el("canvas","carte2-gl");cv.id="carte2-gl";cv.setAttribute("aria-hidden","true");
    var h=el("h1","carte2-t");h.id="carte2-t";var s=el("p","carte2-s");s.id="carte2-s";s.setAttribute("aria-live","polite");
    var z=el("div","carte2-z");z.id="carte2-z";
    box.appendChild(cv);box.appendChild(h);box.appendChild(s);box.appendChild(z);sec.appendChild(box);
  }
  box.hidden=false;
}
/* Paramètres de la galaxie de l'univers i (déterministes : nom -> forme) */
function car2Galaxie(i){var u=UNIVERS[i]||{};return galParams(u.nom||u.id||"?",i);}
/* La forme d'une galaxie se tire de son nom : l'aperçu de « Créer un univers » montre la même que la carte */
function galParams(cle,i){
  var g=astGraine(cle)*7.31;
  return {teinte:(g*13)%360,bras:2+((g*3|0)%2),wind:.8+((g*0.37)%1)*.7,incl:((g*.11)%1-.5)*.9,aplat:.5+((g*.29)%1)*.18,seed:g%50,spin0:g%6.28,vit:((i||0)%2?-1:1)*.045};
}
function car2Centre(i,R,spin){
  var ms=univMats(UNIVERS[i].id),n=ms.length,j,sx=0,sy=0,gp=car2Galaxie(i),o={x:0,y:0,r:R,bras:gp.bras,wind:gp.wind,incl:gp.incl,aplat:gp.aplat,spin:spin||0},q;
  if(!n)return {x:0,y:0};
  for(j=0;j<n;j++){q=aglPosEtoile(o,j,n);sx+=q.x;sy+=q.y;}
  return {x:sx/n,y:sy/n};
}
/* Au cœur de la galaxie : les étoiles-matières, grandes et immobiles, réparties dans l'écran (angle d'or) pour qu'on choisisse l'une ou l'autre */
function car2Dedans(j,n,W,H,i,cx,cy){
  if(n===1)return {x:cx,y:cy};
  var g=astGraine(UNIVERS[i].id),a=j*2.39996+g*.7,rad=Math.min(W,H)*(.2+.17*((j*.618+g*.01)%1)),x=cx+rad*Math.cos(a)*(W<560?.9:1.6),y=cy+rad*Math.sin(a);
  return {x:Math.max(W*.14,Math.min(W*.86,x)),y:Math.max(H*.3,Math.min(H*.72,y))};
}
function car2Boutons(){
  var z=$("carte2-z"),n=UNIVERS.length,i;clear(z);CAR2.boutons=[];
  for(i=0;i<n;i++){
    (function(i){
      var u=UNIVERS[i],b=el("button","carte2-b carte2-e");b.type="button";b.setAttribute("aria-label",tx("zcar.u_aria",{nom:u.nom}));
      b.appendChild(el("span","carte2-n",u.nom+(u.id===UNIV?tx("zcar.ici"):"")));b.firstChild.style.position="absolute";b.addEventListener("click",function(){car2Entrer(i);});
      z.appendChild(b);CAR2.boutons.push({el:b,k:"u",i:i});
    })(i);
  }
  z.onclick=function(e){if(e.target===z&&CAR2.foc>=0&&CAR2.s>.8)car2Sortir();};
}
function car2Systeme(i){
  var z=$("carte2-z");
  [].slice.call(z.querySelectorAll(".carte2-p,.carte2-sol")).forEach(function(b){z.removeChild(b);});
  CAR2.boutons=CAR2.boutons.filter(function(b){return b.k==="u";});
  if(i<0)return;
  var u=UNIVERS[i],ms=univMats(u.id),sol=el("button","carte2-b carte2-sol");sol.type="button";sol.setAttribute("aria-label",tx("zcar.retour_aria"));sol.textContent=tx("zcar.tous");
  sol.addEventListener("click",function(){car2Sortir();});z.appendChild(sol);CAR2.boutons.push({el:sol,k:"s",i:i});
  ms.forEach(function(k,j){
    var M=MATS[k],b=el("button","carte2-b carte2-p"+(M.ready?"":" attente"));b.type="button";
    b.appendChild(el("span","carte2-n",M.titre));
    if(!M.ready)b.appendChild(el("span","carte2-m",tx("zcar.prepa")));
    b.setAttribute("aria-label",M.titre+(M.ready?"":", "+tx("zcar.prepa")));
    b.addEventListener("click",function(){activate(k);BACK="home";NAV_PRE.home="hub";renderHome();show("home");});
    z.appendChild(b);var t=0;try{t=matCouleur(k);}catch(e){t=j;}
    CAR2.boutons.push({el:b,k:"p",i:i,j:j,mat:k,arch:t,graine:astGraine(k),roulis:((astGraine(k)*7.3)%1-.5)*.9});
  });
}
function car2Titre(){
  var t=$("carte2-t"),s=$("carte2-s");
  if(CAR2.foc<0){t.textContent=tx("zcar.titre");s.textContent=nb(tx("zcar.aide"));}
  else{var u=UNIVERS[CAR2.foc],n=univMats(u.id).length;t.textContent=u.nom;s.textContent=nb(tx("zcar.aide_galaxie",{liste:(function(w){return LANG==="fr"?plural(n,w):n+" "+w+(n===1?"":"s");})((u.libelle||tx("zcar.matieres")).replace(/s$/,""))}));}
}
function car2Vol(vers,dur){
  var moins=cosMoinsDeMouvement();
  CAR2.anim={t0:0,from:CAR2.s,to:vers,dur:moins?1:dur};
}
function car2Entrer(i){
  if(CAR2.anim||COS.vol)return;
  car2Warp(i,function(){CAR2.foc=i;car2Systeme(i);car2Titre();AST.sem=i;CAR2.s=1;CAR2.anim=null;if(!CAR2.raf)car2Lancer();});
}
function car2Sortir(){
  if(CAR2.anim||COS.vol)return;
  var vi=Math.max(0,CAR2.foc);
  car2Warp(vi,function(){CAR2.s=0;CAR2.foc=-1;CAR2.anim=null;car2Systeme(-1);car2Titre();if(!CAR2.raf)car2Lancer();});
}

function carteOuvrir(uid){
  car2Construire();car2Boutons();
  /* Demande de l'auteur : la carte s'ouvre sur TOUS les univers (on comprend qu'on est au milieu d'un seul parmi plusieurs), jamais directement dans l'un d'eux */
  CAR2.foc=-1;CAR2.s=0;CAR2.anim=null;CAR2.sortie=false;car2Systeme(-1);
  car2Titre();
  show("carte");
  car2Lancer();
}

function car2Lancer(){
  if(CAR2.raf){try{window.cancelAnimationFrame(CAR2.raf);}catch(e){}CAR2.raf=0;}
  var cv=$("carte2-gl"),G=car2GL(),fixe=orrMoins(),fin=orrFin(),ox=0,oy=0,qual=1,lent=0,dernier=0,t00=0;
  if(!cv)return;
  if(!CAR2.pret){
    CAR2.pret=true;
    document.addEventListener("pointermove",function(e){if($("carte").hidden)return;CAR2.cx=e.clientX;CAR2.cy=e.clientY;CAR2.px=e.clientX/Math.max(1,window.innerWidth)-.5;CAR2.py=e.clientY/Math.max(1,window.innerHeight)-.5;});
  }
  function pas(ts){
    if($("carte").hidden){CAR2.raf=0;return;}
    if(!t00)t00=ts;
    var t=fixe?0:(ts-t00)/1000,W=window.innerWidth,H=window.innerHeight,dpr=Math.min(2,window.devicePixelRatio||1)*qual,n=UNIVERS.length,i,b;
    if(typeof window.__astres_t==="number")t=window.__astres_t;
    if(dernier){var dt=ts-dernier;lent=lent*.95+dt*.05;if(lent>22&&qual>.55&&!fixe){qual=Math.max(.55,qual*.85);lent=16;}}dernier=ts;
    ox+=(CAR2.px-ox)*.05;oy+=(CAR2.py-oy)*.05;
    /* animation du niveau : s = 0 (univers) … 1 (système) */
    var A=CAR2.anim;
    if(A){if(!A.t0)A.t0=ts;var u=(ts-A.t0)/A.dur;CAR2.s=A.from+(A.to-A.from)*car2Doux(u);
      if(u>=1){CAR2.s=A.to;CAR2.anim=null;if(A.to===0&&CAR2.sortie){CAR2.sortie=false;CAR2.foc=-1;car2Systeme(-1);car2Titre();}}}
    var s=CAR2.s,foc=CAR2.foc;
    cielDessiner(fixe?0:ox,fixe?0:oy,t,foc>=0?foc:AST.sem);
    if(G&&!G.perdu){aglTaille(G,W,H,dpr);aglDebut(G);}
    var etroit=W<560,oc0=$("carte2-orb");
    if(oc0&&oc0.width){var x0=oc0.getContext("2d");x0.setTransform(1,0,0,1,0,0);x0.clearRect(0,0,oc0.width,oc0.height);}
    /* Chaque univers est une GALAXIE (bras en spirale) ; ses matières sont des étoiles posées dans les bras, présentes dès la vue d'ensemble :
       plonger dans la galaxie ne fait que les grossir (rien n'apparaît d'un coup). */
    var Rg0=etroit?Math.min(W*.3,H*.15):Math.min(W/(n+.4)*.62,H*.27),Rbig=Math.min(W,H)*(etroit?2.4:2.1),cxS=W/2,cyS=H*(etroit?.5:.52),zg=null;
    for(i=0;i<n;i++){
      var p0=car2Pos(i,n,W,H),foc_i=(i===foc),x,y,r,al,gp=car2Galaxie(i);
      if(foc_i){r=Rg0*Math.pow(Rbig/Rg0,car2Facile(s));var cen=car2Centre(i,r,gp.spin0+t*gp.vit),zz=car2Doux(s);x=p0.x+(cxS-cen.x-p0.x)*zz;y=p0.y+(cyS-cen.y-p0.y)*zz;al=1;}
      else{var dx=p0.x-cxS,dy=p0.y-cyS;x=p0.x+dx*s*.5;y=p0.y+dy*s*.5;r=Rg0*(1-.25*s);al=1-Math.min(1,s*1.5);}
      var bt=null;for(b=0;b<CAR2.boutons.length;b++){if(CAR2.boutons[b].k==="u"&&CAR2.boutons[b].i===i)bt=CAR2.boutons[b];}
      var go={x:x,y:y,r:r,teinte:gp.teinte,bras:gp.bras,wind:gp.wind,incl:gp.incl,aplat:gp.aplat,seed:gp.seed,spin:gp.spin0+t*gp.vit,alpha:al,det:Math.max(1,r/Rg0*.7)};if(foc_i)go.alpha=Math.max(0,1-s*2.2);  /* au cœur de la galaxie, on ne la voit plus */
      if(foc_i)zg=go;
      if(G&&!G.perdu&&al>.02){
        if(go.alpha>.02)aglGalaxie(G,go);
        /* étoiles-matières : posées sur les bras, elles tournent avec la galaxie */
        var ms=univMats(UNIVERS[i].id),mm=ms.length,jj;
        var sa=foc_i?car2Doux((s-.3)/.55):0;  /* vue d'ensemble : aucune étoile (à cette échelle, on ne distingue que des galaxies) ; elles se révèlent en plongeant */
        for(jj=0;jj<mm;jj++){
          var sp=foc_i?car2Dedans(jj,mm,W,H,i,cxS,cyS):aglPosEtoile(go,jj,mm),kk=ms[jj],ci=0;try{ci=matCouleur(kk)%8;}catch(e){ci=jj;}
          var rs=foc_i?((MATS[kk]&&MATS[kk].ready)?(etroit?20:26):(etroit?15:19))*(.4+.6*sa):((MATS[kk]&&MATS[kk].ready)?3.4:2.4);
          if(sa>.02){aglCouronne(G,{x:sp.x,y:sp.y,r:rs,etoile:ci,t:t,graine:jj+i*7,fondu:2.8,alpha:sa});aglEtoile(G,{x:sp.x,y:sp.y,r:rs,etoile:ci,t:t,graine:jj*3.1,alpha:sa});}
          if(foc_i){var mb=CAR2.boutons.filter(function(q){return q.k==="p"&&q.j===jj;})[0];
            if(mb){var bw=Math.max(88,rs*3),bh=rs*2+40;mb.el.style.width=bw+"px";mb.el.style.height=bh+"px";
              mb.el.style.transform="translate("+(sp.x-bw/2).toFixed(1)+"px,"+(sp.y-rs-4).toFixed(1)+"px)";mb.el.style.opacity=s>.5?String(Math.min(1,(s-.5)*3)):"0";
              mb.el.style.pointerEvents=s>.8?"auto":"none";mb.el.firstChild.style.marginTop=(rs*2+10)+"px";}}
        }
      }
      if(bt){var bs=Math.max(76,r*1.7);bt.el.style.width=bs+"px";bt.el.style.height=bs+"px";bt.el.style.transform="translate("+(x-bs/2).toFixed(1)+"px,"+(y-bs/2).toFixed(1)+"px)";
        bt.el.style.opacity=al>.1?String(al):"0";bt.el.style.pointerEvents=(s<.15&&al>.5)?"auto":"none";bt.el.firstChild.style.top=(bs/2+r*.42)+"px";bt.el.firstChild.style.opacity=String(Math.max(0,1-s*3));}
    }
    var sol=CAR2.boutons.filter(function(q){return q.k==="s";})[0];
    if(sol){sol.el.style.opacity=s>.1?String(Math.min(1,(s-.1)*2)):"0";sol.el.style.pointerEvents=s>.8?"auto":"none";}
    if(fixe&&!A){CAR2.raf=0;return;}
    CAR2.raf=window.requestAnimationFrame(pas);
  }
  CAR2.raf=window.requestAnimationFrame(pas);
}

/* ---------- Saut entre univers ---------- */
function cosVers(id){
  if(COS.vol||!UNIV_BY[id]||id===UNIV)return;
  var vi=0,k;for(k=0;k<UNIVERS.length;k++){if(UNIVERS[k].id===id)vi=k;}
  car2Warp(vi,function(){univFixer(id);univPoser(id);BACK="hub";renderHub();show("hub");$("cos-annonce").textContent=tx("zcar.annonce",{nom:UNIV_BY[id].nom});});
}
/* Saut à vitesse lumière : étoiles étirées, flash à la couleur de l'étoile vi ; milieu() est appelé quand l'écran est noir (le décor change alors) */
function car2Warp(vi,milieu){
  var cv=$("warp"),fait=false;
  var arrivee=function(){if(!fait){fait=true;milieu();}};
  if(cosMoinsDeMouvement()||!document.createElement("canvas").getContext){arrivee();return;}
  if(!cv){cv=el("canvas","warp");cv.id="warp";cv.setAttribute("aria-hidden","true");document.body.appendChild(cv);}
  var x=cv.getContext("2d");if(!x){arrivee();return;}
  COS.vol=true;cv.hidden=false;
  var dpr=Math.min(2,window.devicePixelRatio||1),W=window.innerWidth,H=window.innerHeight,N=Math.round(Math.min(320,W*H/3000)),g=17+vi*31,E=AST_ETOILES[vi%AST_ETOILES.length],etoiles=[],i,dur=1600,t0=0;
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cv.style.width=W+"px";cv.style.height=H+"px";
  function r(){g=(g*16807)%2147483647;return (g-1)/2147483646;}
  for(i=0;i<N;i++)etoiles.push({a:r()*6.2832,p:r(),v:.5+r()*1.1,w:.5+r()*1.4,c:r()<.3?E.cB:"#FFFFFF"});
  var cx=W*.5,cy=H*.46,R=Math.sqrt(cx*cx+cy*cy)*1.15;
  function pas(ts){
    if(!t0)t0=ts;var u=(ts-t0)/dur;
    if(u>=1){arrivee();x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,cv.width,cv.height);cv.hidden=true;COS.vol=false;return;}
    if(u>=.5)arrivee();
    var vit=Math.sin(Math.PI*u),noir=u<.5?car2Doux(u/.5):1-car2Doux((u-.5)/.5),prog=car2Doux(u)*5;
    x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,W,H);
    x.fillStyle="rgba(7,9,13,"+(noir*.96).toFixed(3)+")";x.fillRect(0,0,W,H);
    x.lineCap="round";
    for(i=0;i<N;i++){
      var e=etoiles[i],pos=(e.p+prog*e.v*.35)%1,rr=Math.pow(pos,1.9)*R,tr=rr*(.05+.5*vit*e.v),ca=Math.cos(e.a),sa=Math.sin(e.a);
      x.strokeStyle=e.c;x.globalAlpha=Math.min(1,.15+.85*Math.pow(pos,.6))*(.3+.7*vit);x.lineWidth=e.w*(.4+1.3*pos);
      x.beginPath();x.moveTo(cx+ca*(rr-tr),cy+sa*(rr-tr));x.lineTo(cx+ca*rr,cy+sa*rr);x.stroke();
    }
    x.globalAlpha=1;
    var fl=Math.max(0,1-Math.abs(u-.5)*5);
    if(fl>0){var gr=x.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.6);gr.addColorStop(0,E.cB);gr.addColorStop(.35,E.cA);gr.addColorStop(1,"rgba(0,0,0,0)");x.globalAlpha=fl*.75;x.fillStyle=gr;x.fillRect(0,0,W,H);x.globalAlpha=1;}
    window.requestAnimationFrame(pas);
  }
  window.requestAnimationFrame(pas);
}
