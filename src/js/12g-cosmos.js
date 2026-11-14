/* ---------- Univers : passer d'une galaxie à l'autre (v5) ----------
   Un univers = une galaxie, dessinée en 2D une fois pour toutes sur un canvas (programme.json, galaxie : teinte, bras,
   enroulement, inclinaison, aplatissement ; hasard fixe par univers : toujours le même dessin). Même style que l'app :
   des points nets d'une seule couleur, celle de l'accent (sa saturation et sa luminosité, en clair comme en sombre)
   à la teinte de l'univers, des orbites en pointillé, un ciel de points gris (--muted) sur le fond de l'app.
   Changer d'univers (pastille de « Aujourd'hui », panneau des univers) est un seul mouvement de caméra, en 1,8 s :
   1. dézoom : la page recule jusqu'à n'être plus que le cœur de sa galaxie ; la galaxie, vue de face au départ,
      bascule sur sa tranche (aplatissement) pendant que la caméra roule ;
   2. travelling : la caméra glisse vers la galaxie voisine, avec un lacet marqué (rotation 3D) et les deux couches
      d'étoiles en parallaxe ; elle prend un peu de recul au milieu du trajet ;
   3. plongée : la caméra fonce dans la nouvelle galaxie, qui se redresse face à elle et se floute en grossissant ;
      la page du nouvel univers arrive de son cœur en finissant de tourner.
   Les galaxies tournent sur elles-mêmes tout le long (bras traînants). Le flou est un fondu entre la galaxie nette
   et sa version floue (cosFloue) : un flou CSS animé faisait sauter des images sur téléphone.
   Le chemin de la caméra (zoom, position, lacet, roulis) est calculé ici, échantillonné en images clés et confié aux
   Web Animations : le navigateur l'anime sans dépendre du reste de la page (la nouvelle page se prépare pendant le vol).
   Pendant le vol, la page entière (#scene) est figée en plein écran (classe cam) pour bouger comme une seule image.
   « Réduire les animations » sur l'appareil : un simple fondu. */
var COS={vol:false,cache:{},ciel:null},COS_T=1800,COS_Z=8,COS_N=60;
function cosMoinsDeMouvement(){try{return window.matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){return false;}}

/* Hasard fixe (mulberry32) à partir du nom de l'univers */
function cosGraine(s){
  var a=2166136261,i;
  for(i=0;i<s.length;i++){a^=s.charCodeAt(i);a=Math.imul(a,16777619);}
  return function(){a=(a+0x6D2B79F5)|0;var t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
}

/* Couleurs prises dans les jetons de l'app au moment du dessin (thème clair ou sombre) */
function cosHsl(c){
  var m=/^#?([0-9a-f]{6})$/i.exec(trim(c)),n,r,g,b,mx,mn,h=0,s=0,l;
  if(!m)return null;
  n=parseInt(m[1],16);r=(n>>16&255)/255;g=(n>>8&255)/255;b=(n&255)/255;
  mx=Math.max(r,g,b);mn=Math.min(r,g,b);l=(mx+mn)/2;
  if(mx!==mn){
    var d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);
    h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;
  }
  return [Math.round(h),Math.round(s*100),Math.round(l*100)];
}
function cosJeton(nom,def){var v="";try{v=trim(window.getComputedStyle(document.documentElement).getPropertyValue(nom));}catch(e){}return v||def;}
/* La couleur d'un univers : sa teinte, avec la saturation et la luminosité de l'accent ; « a » = opacité */
function cosCouleur(u){
  var a=cosHsl(cosJeton("--accent","#17605B"))||[176,61,23];
  return function(op){return "hsla("+u.galaxie.teinte+","+a[1]+"%,"+a[2]+"%,"+(op===undefined?1:op)+")";};
}

/* Galaxie vue de face, carrée, px pixels CSS de côté. L'inclinaison et l'aplatissement sont donnés par CSS
   (.cos-plan), pour que la rotation propre de la galaxie se fasse dans son plan. */
function cosGalaxie(u,px){
  var col=cosCouleur(u),cle=u.id+":"+px+":"+col(1);if(COS.cache[cle])return COS.cache[cle];
  var g=u.galaxie,dpr=Math.min(2,window.devicePixelRatio||1),N=Math.max(16,Math.round(px*dpr)),c=document.createElement("canvas"),x;
  c.width=c.height=N;c.style.width=c.style.height=px+"px";
  try{x=c.getContext("2d");}catch(e){x=null;}
  if(!x)return c;
  /* petite (pastille, cartes du panneau) : plus de points, plus fins, sans orbites, pour rester lisible */
  var R=N/2,rnd=cosGraine(u.id),bras=Math.round(g.bras),enr=g.enroulement*Math.PI,petit=px<140,mini=px<40,s=mini?dpr*.6:petit?dpr*.42:dpr*Math.max(.7,Math.min(1.1,px/300));
  function gauss(){var a=rnd()||1e-9;return Math.sqrt(-2*Math.log(a))*Math.cos(6.2831853*rnd());}
  function point(r,t){return [R+Math.cos(t)*r*R*.94,R+Math.sin(t)*r*R*.94];}
  /* bras en spirale logarithmique : serrés près du cœur, de plus en plus ouverts vers le bord */
  function angle(r,b){return b*6.2831853/bras+enr*Math.log(r/.04)/Math.log(25);}
  function rond(p,r){x.beginPath();x.arc(p[0],p[1],r,0,6.2831853);x.fill();}
  /* orbites en pointillé : elles rendent visibles la rotation et l'inclinaison */
  x.strokeStyle=col(.3);x.lineWidth=Math.max(1,dpr*.8);
  if(x.setLineDash)x.setLineDash([dpr*1.5,dpr*6]);
  if(!petit)[.44,.72,.99].forEach(function(f){x.beginPath();x.arc(R,R,f*R*.94,0,6.2831853);x.stroke();});
  if(x.setLineDash)x.setLineDash([]);
  /* halo du cœur, très léger */
  var gr=x.createRadialGradient(R,R,0,R,R,R*.34);
  gr.addColorStop(0,col(petit?.4:.22));gr.addColorStop(1,col(0));
  x.fillStyle=gr;x.fillRect(0,0,N,N);
  /* étoiles : des points ronds, surtout le long des bras, quelques-uns dans le disque */
  var n=petit?Math.round(Math.min(1400,px*px*.3)):Math.min(4200,Math.round(px*px*.03)),i,r,t,p,al;
  x.fillStyle=col(1);
  for(i=0;i<n;i++){
    if(rnd()<.82){
      r=.07+.93*Math.pow(rnd(),1.05);t=angle(r,i%bras)+gauss()*.11*(1.2-r);p=point(r,t);
      p[0]+=gauss()*R*(.012+.026*r);p[1]+=gauss()*R*(.012+.026*r);
      x.globalAlpha=mini?(.65+.35*rnd())*(1-r*.3):(.35+.6*rnd())*(1-r*.45);rond(p,s*(.55+rnd()*.75));
    }else{
      r=Math.min(1,-Math.log(1-rnd()*.96)*.3);p=point(r,rnd()*6.2831853);
      x.globalAlpha=.12+.2*rnd();rond(p,s*(.45+rnd()*.4));
    }
  }
  /* cœur : un disque plein et son anneau */
  x.globalAlpha=.3;rond([R,R],R*.09);
  x.globalAlpha=1;rond([R,R],R*.048);
  COS.cache[cle]=c;
  return c;
}
/* La même galaxie floue : réduite puis agrandie (le lissage fait le flou, sans filtre, partout). Pendant le zoom, la
   version nette s'efface sur celle-ci : un fondu ne coûte presque rien, un flou animé coûte cher sur un téléphone. */
function cosFloue(u,px){
  var src=cosGalaxie(u,px),cle=u.id+":"+px+":"+cosCouleur(u)(1)+":flou";if(COS.cache[cle])return COS.cache[cle];
  var N=src.width,n=Math.max(8,Math.round(N/6)),p=document.createElement("canvas"),c=document.createElement("canvas"),x;
  p.width=p.height=n;c.width=c.height=N;c.style.width=c.style.height=px+"px";
  try{
    x=p.getContext("2d");x.imageSmoothingEnabled=true;x.drawImage(src,0,0,n,n);
    x=c.getContext("2d");x.imageSmoothingEnabled=true;x.globalAlpha=.6;x.drawImage(p,0,0,N,N);
    x.globalAlpha=.3;x.drawImage(p,-N*.04,-N*.04,N*1.08,N*1.08);
  }catch(e){}
  COS.cache[cle]=c;
  return c;
}
/* Copie d'une galaxie déjà dessinée (un canvas n'est qu'à un endroit à la fois) */
function cosCopie(u,px){
  var src=cosGalaxie(u,px),c=document.createElement("canvas");
  c.width=src.width;c.height=src.height;c.style.width=c.style.height=px+"px";
  try{c.getContext("2d").drawImage(src,0,0);}catch(e){}
  return c;
}
/* Petite galaxie inclinée dans un rond (pastille de « Aujourd'hui », cartes du panneau) */
function cosVignette(u,px,cls){
  var d=el("span","cos-vig"+(cls?" "+cls:"")),pl=el("span","cos-plan");
  d.style.width=d.style.height=px+"px";
  pl.style.transform="rotate("+u.galaxie.inclinaison+"rad) scaleY("+u.galaxie.aplatissement+")";
  var c=cosCopie(u,Math.round(px*1.15));c.style.left=c.style.top=(-Math.round(px*1.15)/2)+"px";
  pl.appendChild(c);d.appendChild(pl);d.setAttribute("aria-hidden","true");
  return d;
}

/* Ciel : deux couches d'étoiles (lointaine : des points ; proche : de petites croix), un peu plus grandes que
   l'écran pour la parallaxe, couleur --muted */
function cosCiel(W,H){
  var m=cosJeton("--muted","#5B6A68"),cle=W+"x"+H+":"+m;if(COS.ciel===cle)return;
  var dpr=Math.min(2,window.devicePixelRatio||1),rnd=cosGraine("ciel");
  [["cos-loin",W*H/2200],["cos-pres",W*H/15000]].forEach(function(L,j){
    var c=$(L[0]),w=Math.round(W*1.6),h=Math.round(H*1.6),x,i,X,Y,r;
    c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);c.style.width=w+"px";c.style.height=h+"px";
    c.style.left=Math.round(-W*.3)+"px";c.style.top=Math.round(-H*.3)+"px";
    try{x=c.getContext("2d");}catch(e){return;}
    if(!x)return;
    x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,w,h);x.fillStyle=m;x.strokeStyle=m;x.lineWidth=1;
    for(i=0;i<L[1]*2.56;i++){
      X=rnd()*w;Y=rnd()*h;
      if(j){
        r=2+rnd()*1.6;x.globalAlpha=.35+.25*rnd();
        x.beginPath();x.moveTo(X-r,Y);x.lineTo(X+r,Y);x.moveTo(X,Y-r);x.lineTo(X,Y+r);x.stroke();
      }else{
        r=.5+rnd()*.5;x.globalAlpha=.18+.3*rnd();
        x.beginPath();x.arc(X,Y,r,0,6.2831853);x.fill();
      }
    }
    x.globalAlpha=1;
  });
  COS.ciel=cle;
}

/* Courbes d'accélération, comme cubic-bezier() en CSS */
function cosBezier(x1,y1,x2,y2){
  function b(a1,a2,t){var m=1-t;return 3*a1*t*m*m+3*a2*t*t*m+t*t*t;}
  return function(p){
    if(p<=0)return 0;if(p>=1)return 1;
    var lo=0,hi=1,t=p,k;for(k=0;k<26;k++){t=(lo+hi)/2;if(b(x1,x2,t)<p)lo=t;else hi=t;}
    return b(y1,y2,t);
  };
}
var COS_RECUL=cosBezier(.45,0,.15,1),COS_GLISSE=cosBezier(.62,0,.3,1),COS_PLONGE=cosBezier(.55,0,.22,1),COS_DOUX=cosBezier(.45,0,.55,1);
function cosSeg(u,a,b){return u<=a?0:u>=b?1:(u-a)/(b-a);}
/* La caméra à l'instant u (0 → 1) : zoom s (1 = galaxies en entier, COS_Z = la page remplit l'écran), position x
   sur la piste des galaxies, lacet l (-1 → 1, pendant le travelling), roulis r en degrés (la caméra tourne d'un
   côté en reculant, de l'autre en plongeant : 0 au départ et à l'arrivée) */
function cosCamera(u,dir,D){
  var L=Math.log(COS_Z),pB=cosSeg(u,.28,.68);
  var z=L*(1-COS_RECUL(cosSeg(u,0,.36)))-Math.log(1.16)*Math.sin(Math.PI*pB)+L*COS_PLONGE(cosSeg(u,.6,1));
  return {u:u,z:z,s:Math.exp(z),x:dir*D*COS_GLISSE(pB),l:dir*Math.sin(Math.PI*pB),r:dir*16*Math.sin(2*Math.PI*COS_DOUX(u))};
}

/* La piste : une galaxie par univers, côte à côte, la courante au centre de l'écran */
/* Nombre de matières d'un univers : le libellé du programme (« matières », « cours »…) s'il en a un, sinon le mot de l'app */
function cosNbMat(u,n){
  if(u.libelle){var w=u.libelle.replace(/s$/,"");return n+" "+w+(n>1&&!/[sxz]$/.test(w)?"s":"");}
  return tn("cos.n_mat",n);
}
function cosPiste(i0,G,D){
  var p=$("cos-piste"),noms=[];clear(p);
  UNIVERS.forEach(function(u,i){
    var g=u.galaxie,w=el("div","cos-gal"),pl=el("div","cos-plan"),di=el("div","cos-disque"),c=cosGalaxie(u,G),fl=cosFloue(u,G),nom=el("div","cos-nom");
    w.style.left=Math.round((i-i0)*D-G/2)+"px";w.style.top=Math.round(-G/2)+"px";w.style.width=w.style.height=G+"px";
    pl.style.transform="rotate("+g.inclinaison+"rad) scaleY("+g.aplatissement+")";
    di.style.left=di.style.top=(-G/2)+"px";di.style.width=di.style.height=G+"px";
    fl.className="cos-flou";c.className="cos-net";di.appendChild(fl);di.appendChild(c);pl.appendChild(di);w.appendChild(pl);
    var a=G/2,b=G/2*g.aplatissement,hy=Math.sqrt(a*a*Math.pow(Math.sin(g.inclinaison),2)+b*b*Math.pow(Math.cos(g.inclinaison),2));
    nom.style.top=Math.round(G/2+hy*.95+12)+"px";
    nom.appendChild(el("span","cos-nom-t",u.nom));
    nom.appendChild(el("span","cos-nom-s",cosNbMat(u,univMats(u.id).length)));
    w.appendChild(nom);p.appendChild(w);noms.push(nom);
  });
  return noms;
}

/* Taille des galaxies et écart entre elles pour cet écran ; dessine (une fois par thème) les galaxies et le ciel.
   Appelé dès l'ouverture du choix d'univers, pour que le voyage parte sans attendre. */
function cosPreparer(){
  var W=window.innerWidth,H=window.innerHeight,G=Math.round(Math.min(W*.8,H*.62,560));
  cosCiel(W,H);UNIVERS.forEach(function(u){cosFloue(u,G);});
  return {W:W,H:H,G:G,ecart:Math.round(W*.5+G*.42)};
}
/* Le voyage vers l'univers id */
function cosVers(id){
  if(COS.vol||!UNIV_BY[id]||id===UNIV)return;
  var arrivee=function(){univFixer(id);univPoser(id);BACK="hub";renderHub();show("hub");$("cos-annonce").textContent=tx("cos.annonce",{nom:UNIV_BY[id].nom});};
  var sc=$("scene");
  if(!sc.animate){arrivee();return;}
  COS.vol=true;
  if(cosMoinsDeMouvement()){
    var f=sc.animate([{opacity:1},{opacity:0,offset:.5},{opacity:1}],{duration:420,easing:"ease-in-out"});
    setTimeout(arrivee,210);
    f.onfinish=function(){COS.vol=false;};
    return;
  }
  var g=cosPreparer(),G=g.G,i0=UNIVERS.indexOf(univ()),i1=UNIVERS.indexOf(UNIV_BY[id]),dir=i1>i0?1:-1,D=g.ecart*Math.abs(i1-i0);
  var noms=cosPiste(i0,G,g.ecart),cos=$("cosmos"),piste=$("cos-piste"),loin=$("cos-loin"),pres=$("cos-pres");
  /* La page devient une image en plein écran, au même endroit (barres comprises) */
  var bs=window.getComputedStyle(document.body),y=window.pageYOffset||0;
  sc.style.paddingTop=bs.paddingTop;sc.style.paddingBottom=bs.paddingBottom;
  sc.classList.add("cam");sc.scrollTop=y;
  cos.hidden=false;document.body.classList.add("en-vol");
  /* Le chemin de la caméra, échantillonné */
  var kS=[],kP=[],kL=[],kN=[],kF=[],kX=[],k,u,c,ech,t,flou,op;
  for(k=0;k<=COS_N;k++){
    u=k/COS_N;c=cosCamera(u,dir,D);
    /* la page : l'ancienne au cœur de la galaxie de départ (x = 0), la nouvelle au cœur de celle d'arrivée (x = dir·D) ;
       elle tourne avec la caméra (roulis) */
    ech=c.s/COS_Z;
    if(u<.5){t=-c.x*c.s;op=1-cosSeg(u,.12,.3);}else{t=(dir*D-c.x)*c.s;op=cosSeg(u,.74,.93);}
    kS.push({offset:u,transform:"rotate("+c.r.toFixed(2)+"deg) translate3d("+t.toFixed(1)+"px,0,0) scale("+ech.toFixed(4)+")",opacity:+op.toFixed(3),
        borderRadius:(u<.5?28*cosSeg(u,0,.12):28*(1-cosSeg(u,.85,1))).toFixed(1)+"px"});
    /* flou : de net (galaxie entière à l'écran) à flou (la caméra est dans le cœur) */
    flou=Math.max(0,Math.min(1,(c.z-Math.log(1.8))/(Math.log(COS_Z*.6)-Math.log(1.8))));
    kX.push({offset:u,opacity:+(1-flou).toFixed(3)});
    kP.push({offset:u,transform:"perspective(1000px) rotateZ("+c.r.toFixed(2)+"deg) rotateY("+(-c.l*24).toFixed(2)+"deg) rotateX("+(Math.abs(c.l)*8).toFixed(2)+"deg) scale("+c.s.toFixed(4)+") translate3d("+(-c.x).toFixed(1)+"px,0,0)"});
    kL.push({offset:u,transform:"rotate("+c.r.toFixed(2)+"deg) translate3d("+(-c.x*.05).toFixed(1)+"px,0,0) scale("+Math.pow(c.s,.12).toFixed(4)+")"});
    kN.push({offset:u,transform:"rotate("+(c.r*1.15).toFixed(2)+"deg) translate3d("+(-c.x*.22).toFixed(1)+"px,0,0) scale("+Math.pow(c.s,.42).toFixed(4)+")"});
    kF.push({offset:u,opacity:+(cosSeg(u,.22,.34)*(1-cosSeg(u,.6,.7))).toFixed(3)});
  }
  var o={duration:COS_T,fill:"both"},anims=[sc.animate(kS,o),piste.animate(kP,o),loin.animate(kL,o),pres.animate(kN,o)];
  noms.forEach(function(n){anims.push(n.animate(kF,o));});
  /* chaque galaxie tourne sur elle-même (sens des bras traînants) ; celle de départ bascule de face à sa tranche en
     reculant, celle d'arrivée se redresse face à la caméra en plongeant */
  [].forEach.call(piste.querySelectorAll(".cos-disque"),function(d){anims.push(d.animate([{transform:"rotate(0deg)"},{transform:"rotate(-110deg)"}],{duration:COS_T,fill:"both",easing:"cubic-bezier(.3,.1,.4,1)"}));});
  [].forEach.call(piste.querySelectorAll(".cos-plan"),function(pl,i){
    var gx=UNIVERS[i].galaxie,inc="rotate("+gx.inclinaison+"rad) ",plat=inc+"scaleY("+gx.aplatissement+")",face=inc+"scaleY(1)";
    if(i===i0)anims.push(pl.animate([{offset:0,transform:face},{offset:.36,transform:plat,easing:"linear"},{offset:1,transform:plat}],{duration:COS_T,fill:"both",easing:"linear"}));
    else if(i===i1)anims.push(pl.animate([{offset:0,transform:plat},{offset:.62,transform:plat},{offset:1,transform:face}],{duration:COS_T,fill:"both",easing:"linear"}));
  });
  [].forEach.call(piste.querySelectorAll(".cos-net"),function(n){anims.push(n.animate(kX,o));});
  /* Le contenu change quand la page est invisible, au milieu du trajet : on suit l'horloge de l'animation elle-même
     (une animation ralentie ou mise en pause garde le changement au bon moment) */
  var fait=false;
  function bascule(){
    if(fait)return;fait=true;arrivee();sc.scrollTop=0;
    var b2=window.getComputedStyle(document.body);sc.style.paddingTop=b2.paddingTop;sc.style.paddingBottom=b2.paddingBottom;
  }
  (function guette(){
    if(fait)return;
    var t=anims[0].currentTime;
    if(t!==null&&t>=COS_T*.5){bascule();return;}
    window.requestAnimationFrame(guette);
  })();
  anims[0].onfinish=function(){
    bascule();
    sc.classList.remove("cam");sc.style.paddingTop="";sc.style.paddingBottom="";
    anims.forEach(function(a){try{a.cancel();}catch(e){}});
    cos.hidden=true;clear(piste);document.body.classList.remove("en-vol");
    try{window.scrollTo(0,0);}catch(e){}
    COS.vol=false;
  };
}

/* ---------- Choisir son univers : la pastille de « Aujourd'hui » ouvre le panneau des univers ---------- */
function renderHubUnivers(){
  var b=$("b-hub-univers");clear(b);b.hidden=UNIVERS.length<2&&!APP.vierge;  /* Maitrise : on y crée aussi un univers */
  if(b.hidden)return;
  var u=univ();
  b.appendChild(astEtoileCanvas(u,24));b.appendChild(el("span","univ-pastille-t",u.nom));  /* v21 : la seule galaxie de l'accueil */
  b.appendChild(el("span","univ-pastille-c",t(UNIVERS.length>1?"cos.changer":"cos.creer")));
  b.setAttribute("aria-label",t("cos.aria_pastille",{nom:u.nom}));
}
function univPanneau(){
  var l=$("menu-univ-liste");clear(l);
  UNIVERS.forEach(function(u){
    var ici=u.id===UNIV,b=el("button","univ-carte"+(ici?" ici":"")),tx=el("span","univ-carte-tx"),n=univMats(u.id).length,p=univPrets(u.id).length;
    b.type="button";b.id="univ-"+u.id;
    b.appendChild(astEtoileCanvas(u,64));
    tx.appendChild(el("span","univ-carte-t",u.nom));
    if(u.description)tx.appendChild(el("span","univ-carte-s",u.description));
    tx.appendChild(el("span","univ-carte-m",ici?t("cos.ici"):cosNbMat(u,n)+(p?" · "+tn("cos.n_prets",p):" · "+t("cos.en_prep"))));
    b.appendChild(tx);
    if(ici)b.setAttribute("aria-current","true");
    b.addEventListener("click",function(){menuFermer();if(!ici)navAller(function(){cosVers(u.id);});});
    l.appendChild(b);
  });
  var cb=el("button","btn univ-tout");cb.type="button";cb.id="b-univ-carte";
  cb.appendChild(el("span","t",t("cos.voir_carte")));cb.appendChild(el("span","s",t("cos.voir_carte_s")));
  cb.addEventListener("click",function(){menuFermer();navAller(function(){carteOuvrir(UNIV);});});
  l.appendChild(cb);
  if(APP.vierge){  /* v13 : Maitrise, un univers de plus (12l) */
    var c=bigBtn(t("cos.creer_univers"),t("cos.creer_univers_s"),false,function(){menuFermer();navAller(function(){crOuvrir("univers",{depuis:"hub"});});});
    c.id="b-univ-creer";c.className+=" univ-creer";l.appendChild(c);
  }
}
$("b-hub-univers").addEventListener("click",menuOuvrir);
