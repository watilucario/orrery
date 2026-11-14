/* ---------- Carte (v14, 12n) : un espace profond, des échelles vraies, un geste = un niveau ----------
   Demande de l'auteur (26 oct., 2e retour) : plus premium, et une navigation simple.
   - Rendu : fond d'espace toujours sombre (nébuleuse à la teinte de l'univers, étoiles sur trois profondeurs qui
     défilent quand on plonge, traînées de vitesse pendant les grands zooms), galaxies lumineuses (bulbe, bras de
     poussière et d'étoiles, régions roses), soleils avec couronne, planètes en volume (texture qui tourne, côté nuit,
     atmosphère, parfois un anneau), orbites inclinées.
   - Échelles : un système n'est qu'un point de lumière dans sa galaxie (invisible depuis la vue globale) ; la vue d'un
     univers plonge au cœur de la galaxie, assez loin des systèmes pour les voir tous ; les planètes n'existent qu'en
     entrant dans un système.
   - Navigation : un pincement = un niveau. On suit le geste en direct ; dès qu'on lâche, la carte finit le voyage vers
     le niveau suivant (doigts écartés, vers ce qui est sous les doigts) ou précédent (doigts rapprochés). Molette ou
     pavé : pareil, un cran suffit. Toucher un élément : vol vers lui. Double toucher : on entre. Glisser : on se déplace,
     avec de l'élan, sans perdre le système suivi. + et − : un niveau.
   Moins de mouvement : pas de vol ni de rotation, les points de vue se posent d'un coup.
   v14.1 (l'auteur, 26 oct. : « mets la planète et la vue multi univers au niveau visuellement de l'image d'un seul
   univers ») : vue d'ensemble disposée selon l'écran (carDisposer : galaxies 2 à 3 fois plus grandes, un halo flou et
   un nuage à leur teinte) ; dans un univers, les autres galaxies s'effacent ; dans un système ou sur une planète, la
   bande de la galaxie traverse le ciel (carBande) ; soleil plus grand, avec sa surface, sa couronne et un reflet ; un
   système vide montre trois orbites en pointillé ; planètes plus grandes, textures deux fois plus fines. */
var CAR={cv:null,W:0,H:0,dpr:1,cam:{x:0,y:0,k:1},vol:null,suit:null,frozen:null,sc:null,hits:[],foc:null,cle:"",raf:0,t:0,tEst:0,tR:0,
  ptr:{},pinch:null,clic:null,dbl:null,apercus:[],geste:null,molT:0,molVerrou:0,elan:null,vit:{x:0,y:0},lk:0,vz:0,
  off:{x:0,y:0},pcx:null,pcy:null,volCoupe:false,etq:{},dtE:0.016};
/* v14.1 : CAR_KG = plus grande galaxie de la vue d'ensemble, CAR_SU = seuil d'un univers ouvert (part du petit côté) */
var CAR_INIT=false,CAR_R=100,CAR_SIG=0.012,CAR_P0=52,CAR_PG=22,CAR_PR=10,CAR_SUN=28,CAR_INC=0.5,
    CAR_TAU=6.2831853,CAR_SPIN=0.035,CAR_TOUR=0.44,CAR_KU=0.62,CAR_KP=0.22,CAR_KG=0.38,CAR_SU=0.48;
/* Couleurs de la carte : la palette des matières (mêmes teintes que l'agenda), plus lumineuses sur le noir */
var CAR_PAL=["#5AA2FF","#FF7A42","#34D39B","#FFB629","#FF74A8","#4BD25A","#9D8FFF","#FF6262"];
var CAR_ESP={ink:"#EDF3F7",muted:"rgba(205,218,228,.68)",line:"rgba(165,200,235,.15)",lineFort:"rgba(190,222,248,.45)",acc:"#5DBFB3",
  bg:"#02040A",ombre:"rgba(0,0,0,.95)"};
var CAR_CACHE={glow:{},tex:{},neb:{},tuiles:null,warp:null,polices:null,floue:{},bande:{},gran:{},couronne:{}};

/* ---------- Petits outils de couleur ---------- */
function carHex(h){var m=/^#?([0-9a-f]{6})$/i.exec(h||""),n=m?parseInt(m[1],16):0x88AAFF;return [n>>16&255,n>>8&255,n&255];}
function carRgba(h,a){var c=carHex(h);return "rgba("+c[0]+","+c[1]+","+c[2]+","+a+")";}
/* vers le blanc (t = 0 : la couleur, 1 : blanc) */
function carBlanc(h,t){var c=carHex(h);return "rgb("+Math.round(c[0]+(255-c[0])*t)+","+Math.round(c[1]+(255-c[1])*t)+","+Math.round(c[2]+(255-c[2])*t)+")";}
/* nuance d'une base : l = 0 sombre, 1 claire */
function carNuance(b,l,a){
  var i,o=[];
  for(i=0;i<3;i++)o.push(Math.round(b[i]*0.3+((b[i]+(255-b[i])*0.5)-b[i]*0.3)*Math.max(0,Math.min(1,l))));
  return a==null?"rgb("+o.join(",")+")":"rgba("+o.join(",")+","+a+")";
}
function carLiss(a,b,x){var t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}

/* ---------- Le monde : univers → systèmes → planètes (unités de l'univers : 100 = rayon d'une galaxie) ---------- */
/* Rayon d'un système dans son échelle propre (la planète la plus loin, plus son rayon). Sans planète : trois (v14.1 :
   son soleil se voit, avec les trois orbites en pointillé qui attendent ses thèmes). */
function carRayon(S){return S.pl.length?CAR_P0+CAR_PG*(S.pl.length-1)+CAR_PR:CAR_P0+CAR_PG*2+CAR_PR;}
/* Part vue du thème (questions non cas), comme la progression des matières (12b) */
function carProgres(k,th){
  var M=MATS[k],D,ids,vues=0;
  if(!M.ready)return 0;
  D=evDonnees(k);ids=D.M.Q.filter(function(q){return q.th===th&&!q.cas;});
  if(!ids.length)return 0;
  ids.forEach(function(q){if(D.items[q.id])vues++;});
  return vues/ids.length;
}
/* Les systèmes d'une galaxie : un anneau intérieur (jusqu'à six) et un extérieur, un peu irréguliers (graine fixe) */
function carPlaceSys(U){
  var n=U.s.length,n1=Math.min(n,6),n2=n-n1;
  U.s.forEach(function(S,j){
    var r=cosGraine("sys-place:"+S.id),ring=j<n1?0:1,idx=ring?j-n1:j,cnt=ring?n2:n1,
        rad=(ring?66:34)+(r()-0.5)*8,a=CAR_TAU*idx/Math.max(1,cnt)+ring*0.5+(r()-0.5)*0.35;
    S.gx=rad*Math.cos(a);S.gy=rad*Math.sin(a);
  });
}
/* Rotation lente d'une galaxie sur elle-même (rad, à l'instant t) */
function carSpin(U,t){return CAR_SPIN*(0.8+0.05*(U.u.galaxie.teinte%5))*t;}
/* Position d'un système dans le monde : son anneau, tourné, aplati et incliné comme la galaxie */
function carGalPos(U,S,t){
  var g=U.u.galaxie,sp=carSpin(U,t),c=Math.cos(sp),s=Math.sin(sp),x=S.gx*c-S.gy*s,y=(S.gx*s+S.gy*c)*g.aplatissement,
      ci=Math.cos(g.inclinaison),si=Math.sin(g.inclinaison);
  return {x:U.x+x*ci-y*si,y:U.y+x*si+y*ci};
}
/* Position d'une planète : orbite circulaire autour du soleil, vue inclinée (z > 0 : devant le soleil) */
function carPlanetePos(S,P,t){var a=P.a0+t*P.om,d=CAR_SIG*P.r;return {x:S.x+d*Math.cos(a),y:S.y+d*Math.sin(a)*CAR_INC,z:Math.sin(a)};}
function carXYP(P,t){return carPlanetePos(P.S,P,t);}
function carMajPos(t){
  CAR.sc.u.forEach(function(U){U.s.forEach(function(S){var p=carGalPos(U,S,t);S.x=p.x;S.y=p.y;});});
}
/* Une planète : taille, vitesse, texture et anneau tirés de son identifiant (toujours les mêmes) */
function carPlanete(S,id,nom,j,prog){
  var r=cosGraine("planete:"+id),a0=r()*CAR_TAU,t2=cosGraine("planete-t:"+id);
  return {S:S,id:id,nom:nom,r:CAR_P0+CAR_PG*j,a0:a0,om:CAR_TAU/(110+50*j),prog:prog||0,col:j%8,
    taille:CAR_PR*(0.72+0.5*t2()),spin:0.012+0.02*t2(),anneau:t2()>0.72,incl:(t2()-0.5)*0.5};
}
/* La boîte d'une galaxie inclinée et aplatie (demi-largeur, demi-hauteur, unités du monde) */
function carBoite(U){
  var g=U.u.galaxie,R=CAR_R*1.04,a=g.aplatissement,ci=Math.cos(g.inclinaison),si=Math.sin(g.inclinaison);
  return {w:R*Math.sqrt(ci*ci+a*a*si*si),h:R*Math.sqrt(si*si+a*a*ci*ci)};
}
/* La vue d'ensemble (v14.1, l'auteur : « au niveau de l'image d'un seul univers ») : les galaxies aussi grandes que l'écran
   le permet. On essaie chaque nombre de colonnes (une sur téléphone, plusieurs à l'ordinateur), on garde celui qui
   les montre le plus grandes, plafonné sous le seuil d'un univers ouvert ; en une colonne, elles alternent à gauche et
   à droite. Dépend de la taille de la carte : refait à chaque changement de taille (carTaille). */
function carDisposer(sc){
  var c=CAR,us=sc.u,n=us.length,W=c.W||360,H=c.H||600,m=Math.min(W,H),LAB=46,bw=0,bh=0,best=null,cols,rows,k,dec;
  if(!n){sc.vue={x:0,y:0,k:1};return;}
  us.forEach(function(U){var b=carBoite(U);bw=Math.max(bw,b.w);bh=Math.max(bh,b.h);});
  for(cols=1;cols<=n;cols++){
    rows=Math.ceil(n/cols);
    k=Math.min(0.92*W/(cols*2.24*bw),(0.94*H-rows*LAB)/(rows*2.16*bh),CAR_KG*m/CAR_R);
    if(!best||k>best.k*1.001)best={cols:cols,rows:rows,k:k};
  }
  k=Math.max(0.001,best.k);cols=best.cols;rows=best.rows;  /* (beaucoup d'univers sur une carte basse : jamais négatif) */
  dec=cols===1&&n>1?Math.max(0,Math.min(0.13*W,(0.92*W-2*bw*k)/2))/k:0;
  us.forEach(function(U,i){
    var cc=i%cols,r=Math.floor(i/cols),rowN=Math.min(cols,n-r*cols);
    U.x=(cc-(rowN-1)/2)*0.94*W/cols/k+(r%2?dec:-dec);
    U.y=(r-(rows-1)/2)*0.94*H/rows/k-LAB/2/k;
    U.bh=carBoite(U).h;
  });
  sc.vue={x:0,y:0,k:k};
}
function carScene(){
  var us=UNIVERS,out=[];
  us.forEach(function(u){
    var U={id:u.id,nom:u.nom,u:u,x:0,y:0,bh:CAR_R,s:[]};
    univMats(u.id).forEach(function(k){
      var M=MATS[k],S={id:k,nom:M.titre,k:k,u:U,x:U.x,y:U.y,gx:0,gy:0,pl:[],col:matCouleur(k)%8,sunCol:null};
      M.THEMES.forEach(function(t,j){S.pl.push(carPlanete(S,t.k,t.n,j,carProgres(k,t.k)));});
      U.s.push(S);
    });
    carPlaceSys(U);
    out.push(U);
  });
  return {u:out,vue:{x:0,y:0,k:1}};
}
/* Un système dessiné seul (aperçus de la création) : même forme que ceux de la carte */
function carSysObj(pl,col,sunCol){
  var S={x:0,y:0,gx:0,gy:0,col:col||0,sunCol:sunCol||null,pl:[]};
  pl.forEach(function(p,i){var id=String(p.id||p.nom||i);S.pl.push(carPlanete(S,id,p.nom||p.n||"",i,p.prog||0));});
  return S;
}

/* ---------- Images faites une fois : galaxies, nébuleuses, étoiles, halos, textures de planètes ---------- */
function carToile(n){var c=document.createElement("canvas"),x=null;c.width=c.height=n;try{x=c.getContext("2d");}catch(e){}return {c:c,x:x};}
/* Une galaxie : halo, nuages des bras, poussière sombre, étoiles, régions roses, bulbe ; transparente autour */
function carImage(U){
  if(U.img)return U.img;
  var N=1024,R=N/2,o=carToile(N),x=o.x,r=cosGraine("galaxie-v14:"+U.id),gal=U.u.galaxie,hue=gal.teinte,
      arms=Math.max(2,Math.min(4,gal.bras||2)),tw=(gal.enroulement||2.6),i,rad,th,px,py,g,s,h,a,sz,l,bras;
  U.img=o.c;
  if(!x)return o.c;
  function spire(rr,b){return b*CAR_TAU/arms+tw*Math.log(1+rr/(R*0.06));}
  x.globalCompositeOperation="lighter";
  g=x.createRadialGradient(R,R,0,R,R,R);
  g.addColorStop(0,"hsla("+hue+",80%,62%,.30)");g.addColorStop(0.35,"hsla("+hue+",75%,50%,.10)");g.addColorStop(1,"hsla("+hue+",70%,40%,0)");
  x.fillStyle=g;x.fillRect(0,0,N,N);
  for(i=0;i<900;i++){
    rad=R*(0.07+0.85*Math.pow(r(),0.8));th=spire(rad,Math.floor(r()*arms))+(r()-0.5)*0.55;
    px=R+rad*Math.cos(th);py=R+rad*Math.sin(th);
    s=R*(0.025+0.07*r())*(1-0.45*rad/R);h=hue+(r()-0.5)*60;a=0.045+0.07*r();
    g=x.createRadialGradient(px,py,0,px,py,s);g.addColorStop(0,"hsla("+h+",90%,66%,"+a+")");g.addColorStop(1,"hsla("+h+",90%,50%,0)");
    x.fillStyle=g;x.fillRect(px-s,py-s,2*s,2*s);
  }
  x.globalCompositeOperation="destination-out";
  for(i=0;i<320;i++){
    rad=R*(0.12+0.72*r());th=spire(rad,Math.floor(r()*arms))+0.2+(r()-0.5)*0.12;
    px=R+rad*Math.cos(th);py=R+rad*Math.sin(th);s=R*(0.018+0.035*r());
    g=x.createRadialGradient(px,py,0,px,py,s);g.addColorStop(0,"rgba(0,0,0,.22)");g.addColorStop(1,"rgba(0,0,0,0)");
    x.fillStyle=g;x.fillRect(px-s,py-s,2*s,2*s);
  }
  x.globalCompositeOperation="lighter";
  for(i=0;i<16000;i++){
    bras=r()<0.75;
    rad=bras?R*(0.04+0.92*Math.pow(r(),0.85)):R*0.95*Math.pow(r(),0.6);
    th=bras?spire(rad,Math.floor(r()*arms))+(r()-0.5)*(0.18+0.6*(1-rad/R)):r()*CAR_TAU;
    px=R+rad*Math.cos(th);py=R+rad*Math.sin(th);l=r();
    x.fillStyle=(l<0.5?"rgba(236,243,255,":l<0.82?"hsla("+(hue+(r()-0.5)*40)+",95%,80%,":"rgba(255,224,186,")+(0.25+0.75*r()*(1-0.5*rad/R))+")";
    sz=0.8+r()*r()*2.6;x.fillRect(px-sz/2,py-sz/2,sz,sz);
  }
  for(i=0;i<80;i++){
    rad=R*(0.2+0.7*r());th=spire(rad,Math.floor(r()*arms))+(r()-0.5)*0.25;
    px=R+rad*Math.cos(th);py=R+rad*Math.sin(th);s=3+r()*7;
    g=x.createRadialGradient(px,py,0,px,py,s);g.addColorStop(0,"rgba(255,170,215,.85)");g.addColorStop(0.4,"rgba(255,95,170,.35)");g.addColorStop(1,"rgba(255,80,160,0)");
    x.fillStyle=g;x.fillRect(px-s,py-s,2*s,2*s);
  }
  g=x.createRadialGradient(R,R,0,R,R,R*0.36);
  g.addColorStop(0,"rgba(255,252,244,1)");g.addColorStop(0.1,"rgba(255,238,210,.95)");g.addColorStop(0.32,"hsla("+(hue+25)+",85%,72%,.45)");
  g.addColorStop(0.65,"hsla("+hue+",80%,60%,.12)");g.addColorStop(1,"hsla("+hue+",80%,60%,0)");
  x.fillStyle=g;x.beginPath();x.arc(R,R,R*0.36,0,CAR_TAU);x.fill();
  return o.c;
}
/* La galaxie floue (réduite par étapes, pour un vrai flou), posée en halo sous la nette */
function carFloue(U){
  if(CAR_CACHE.floue[U.id])return CAR_CACHE.floue[U.id];
  var src=carImage(U),n=512,o;
  while(n>=48){o=carToile(n);if(!o.x)break;o.x.imageSmoothingQuality="high";o.x.drawImage(src,0,0,n,n);src=o.c;n=n/2;}
  CAR_CACHE.floue[U.id]=src;
  return src;
}
/* Une nébuleuse : une bande de nuages colorés en diagonale, des voiles sombres ; teinte de l'univers */
function carNebuleuse(hue){
  hue=Math.round(hue);
  if(CAR_CACHE.neb[hue])return CAR_CACHE.neb[hue];
  var N=512,o=carToile(N),x=o.x,r=cosGraine("neb:"+hue),hs=[hue,hue+40,hue-55,200,300],i,t,px,py,s,g,h;
  CAR_CACHE.neb[hue]=o.c;
  if(!x)return o.c;
  x.globalCompositeOperation="lighter";
  for(i=0;i<34;i++){
    t=r();px=N*(0.05+0.9*t)+(r()-0.5)*N*0.25;py=N*(0.8-0.6*t)+(r()-0.5)*N*0.3;
    s=N*(0.08+0.24*r());h=hs[i%hs.length];
    g=x.createRadialGradient(px,py,0,px,py,s);g.addColorStop(0,"hsla("+h+",85%,58%,"+(0.05+0.08*r())+")");g.addColorStop(1,"hsla("+h+",85%,45%,0)");
    x.fillStyle=g;x.fillRect(px-s,py-s,2*s,2*s);
  }
  x.globalCompositeOperation="destination-out";
  for(i=0;i<16;i++){
    px=r()*N;py=r()*N;s=N*(0.05+0.12*r());
    g=x.createRadialGradient(px,py,0,px,py,s);g.addColorStop(0,"rgba(0,0,0,.5)");g.addColorStop(1,"rgba(0,0,0,0)");
    x.fillStyle=g;x.fillRect(px-s,py-s,2*s,2*s);
  }
  return o.c;
}
/* La même nébuleuse, éteinte en rond vers les bords (posée derrière une galaxie de la vue d'ensemble) */
function carNebuleuseRonde(hue){
  hue=Math.round(hue);
  var cle="r"+hue,N=512,o,g;
  if(CAR_CACHE.neb[cle])return CAR_CACHE.neb[cle];
  o=carToile(N);CAR_CACHE.neb[cle]=o.c;
  if(!o.x)return o.c;
  o.x.drawImage(carNebuleuse(hue),0,0,N,N);
  o.x.globalCompositeOperation="lighter";
  g=o.x.createRadialGradient(N/2,N/2,0,N/2,N/2,N*0.32);
  g.addColorStop(0,"hsla("+hue+",80%,55%,.16)");g.addColorStop(1,"hsla("+hue+",80%,45%,0)");
  o.x.fillStyle=g;o.x.fillRect(0,0,N,N);
  o.x.globalCompositeOperation="destination-in";
  g=o.x.createRadialGradient(N/2,N/2,N*0.12,N/2,N/2,N/2);
  g.addColorStop(0,"rgba(0,0,0,1)");g.addColorStop(1,"rgba(0,0,0,0)");
  o.x.fillStyle=g;o.x.fillRect(0,0,N,N);
  return o.c;
}
/* Tirage presque normal (moyenne 0, écart type 1) */
function carGauss(r){return (r()+r()+r()+r()+r()+r()-3)*1.4142;}
/* La bande d'une galaxie vue de l'intérieur (comme la Voie lactée) : une lueur à sa teinte, des nuages d'étoiles, une
   veine de poussière sombre au milieu, son centre plus clair, des régions roses ; éteinte vers les bords. Une fois par
   univers, en douze étapes : carBandeAvance en fait une par image pendant qu'on regarde l'univers, pour qu'elle soit
   prête quand on plonge dans un système (d'un bloc, elle faisait attendre le premier vol). */
function carBandeEtat(U){
  var B=CAR_CACHE.bande[U.id];
  if(B)return B;
  var Wb=1280,Hb=640,c=document.createElement("canvas"),x=null,r=cosGraine("bande:"+U.id),hue=U.u.galaxie.teinte,
      ph=r()*6,xg=Wb*(0.3+0.4*r()),et=[],k;
  c.width=Wb;c.height=Hb;
  try{x=c.getContext("2d");}catch(e){}
  B=CAR_CACHE.bande[U.id]={c:c,et:et,i:0};
  if(!x)return B;
  function yc(px){return Hb/2+Hb*0.045*Math.sin(px/Wb*5.2+ph);}
  function nuage(px,py,s,cl){var g=x.createRadialGradient(px,py,0,px,py,s);g.addColorStop(0,cl[0]);g.addColorStop(1,cl[1]);x.fillStyle=g;x.fillRect(px-s,py-s,2*s,2*s);}
  et.push(function(){
    var i,px,s,h;x.globalCompositeOperation="lighter";
    for(i=0;i<70;i++){
      px=r()*Wb;s=Hb*(0.14+0.22*r());h=[hue,hue+35,hue-35,32][i%4];
      nuage(px,yc(px)+carGauss(r)*Hb*0.07,s,["hsla("+h+",75%,58%,"+(0.04+0.05*r())+")","hsla("+h+",75%,45%,0)"]);
    }
    x.save();x.translate(xg,yc(xg));x.scale(1.7,1);
    var g=x.createRadialGradient(0,0,0,0,0,Hb*0.42);
    g.addColorStop(0,"rgba(255,240,214,.55)");g.addColorStop(0.25,"hsla("+(hue+25)+",85%,70%,.22)");g.addColorStop(1,"hsla("+hue+",80%,60%,0)");
    x.fillStyle=g;x.fillRect(-Hb*0.42,-Hb*0.42,Hb*0.84,Hb*0.84);x.restore();
  });
  for(k=0;k<4;k++)et.push(function(){
    var i,px,s,l,h;x.globalCompositeOperation="lighter";
    for(i=0;i<250;i++){
      px=r()*Wb;s=Hb*(0.008+0.03*r());l=r();h=l<0.45?"236,243,255":l<0.8?null:"255,224,190";
      nuage(px,yc(px)+carGauss(r)*Hb*0.06,s,h?["rgba("+h+","+(0.05+0.12*r())+")","rgba("+h+",0)"]:["hsla("+(hue+(r()-0.5)*50)+",90%,72%,"+(0.06+0.12*r())+")","hsla("+hue+",90%,60%,0)"]);
    }
  });
  for(k=0;k<2;k++)et.push(function(){
    var i,px;x.globalCompositeOperation="destination-out";
    for(i=0;i<180;i++){px=r()*Wb;nuage(px,yc(px)+Hb*0.012+carGauss(r)*Hb*0.022,Hb*(0.012+0.045*r()),["rgba(0,0,0,"+(0.25+0.3*r())+")","rgba(0,0,0,0)"]);}
  });
  for(k=0;k<4;k++)et.push(function(){
    var i,px,py,l,sz;x.globalCompositeOperation="lighter";
    for(i=0;i<1700;i++){
      px=r()*Wb;py=yc(px)+carGauss(r)*Hb*(r()<0.7?0.065:0.18);l=r();
      x.fillStyle=(l<0.55?"rgba(240,246,255,":l<0.8?"hsla("+(hue+(r()-0.5)*40)+",95%,82%,":"rgba(255,226,192,")+(0.2+0.7*r())+")";
      sz=0.7+r()*r()*2;x.fillRect(px-sz/2,py-sz/2,sz,sz);
    }
  });
  et.push(function(){
    var i,px,g;x.globalCompositeOperation="lighter";
    for(i=0;i<50;i++){px=r()*Wb;nuage(px,yc(px)+carGauss(r)*Hb*0.04,2.5+r()*6,["rgba(255,150,205,.75)","rgba(255,80,160,0)"]);}
    x.globalCompositeOperation="destination-in";
    g=x.createLinearGradient(0,0,Wb,0);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(0.14,"rgba(0,0,0,1)");g.addColorStop(0.86,"rgba(0,0,0,1)");g.addColorStop(1,"rgba(0,0,0,0)");
    x.fillStyle=g;x.fillRect(0,0,Wb,Hb);
    g=x.createLinearGradient(0,0,0,Hb);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(0.24,"rgba(0,0,0,1)");g.addColorStop(0.76,"rgba(0,0,0,1)");g.addColorStop(1,"rgba(0,0,0,0)");
    x.fillStyle=g;x.fillRect(0,0,Wb,Hb);
    x.globalCompositeOperation="source-over";
  });
  return B;
}
/* Une étape de plus (appelée par la boucle quand on regarde un univers) ; vrai tant qu'il en reste */
function carBandeAvance(U){var B=carBandeEtat(U);if(B.i<B.et.length){B.et[B.i++]();return true;}return false;}
/* Pendant qu'on regarde un univers, une image par étape : sa bande, puis la couronne et la surface de chaque soleil
   et la texture de chaque planète de ses systèmes (gardées en cache) : le premier plongeon ne fait plus rien attendre */
function carPrepare(U){
  var i,j,S,P,col;
  if(carBandeAvance(U))return;
  for(i=0;i<U.s.length;i++){
    S=U.s[i];col=CAR_PAL[S.col]||CAR_PAL[0];
    if(!CAR_CACHE.couronne[col]){carCouronne(col);return;}
    if(!CAR_CACHE.gran[col]){carGranules(col);return;}
    for(j=0;j<S.pl.length;j++){P=S.pl[j];if(!CAR_CACHE.tex[P.id+"|"+P.col]){carTexture(P);return;}}
  }
}
/* La bande finie (les étapes qui restent sont faites d'un coup) */
function carBande(U){var B=carBandeEtat(U);while(B.i<B.et.length)B.et[B.i++]();return B.c;}
/* La bande à l'écran : en travers, inclinée (angle propre à l'univers), qui glisse un peu quand on se déplace */
function carBandeDessin(x,v,U,a){
  var c=CAR,an=-0.62+0.45*cosGraine("bande-angle:"+U.id)(),L=Math.sqrt(v.W*v.W+v.H*v.H)*1.3,h=L*0.5,
      ox=Math.sin(c.off.x*0.0004)*L*0.06,oy=Math.sin(c.off.y*0.0004)*L*0.06;
  x.save();x.globalAlpha=0.7*a;x.translate(v.W/2+ox,v.H/2+oy);x.rotate(an);x.drawImage(carBande(U),-L/2,-h/2,L,h);x.restore();
}
/* Une étoile d'une tuile, recopiée de l'autre côté quand son halo dépasse un bord (v14.1 : les tuiles se répètent ;
   un halo coupé net au bord faisait un trait droit dans le ciel) */
function carTuileEtoile(x,px,py,s,col,a){
  var m=s>1.8?s*5:s,dx,dy,g;
  for(dx=-1024;dx<=1024;dx+=1024)for(dy=-1024;dy<=1024;dy+=1024){
    if(px+dx<-m||px+dx>1024+m||py+dy<-m||py+dy>1024+m)continue;
    x.save();x.translate(dx,dy);
    if(s>1.8){
      g=x.createRadialGradient(px,py,0,px,py,s*5);g.addColorStop(0,"rgba("+col+",.35)");g.addColorStop(1,"rgba("+col+",0)");
      x.fillStyle=g;x.fillRect(px-s*5,py-s*5,s*10,s*10);
    }
    x.fillStyle="rgba("+col+","+a+")";x.beginPath();x.arc(px,py,s,0,CAR_TAU);x.fill();
    x.restore();
  }
}
/* Trois tuiles d'étoiles (1024 px pour 512 px à l'écran), répétées et agrandies pour donner la profondeur */
function carTuiles(){
  if(CAR_CACHE.tuiles)return CAR_CACHE.tuiles;
  var out=[],i,j,o,x,r,px,py,s,col,g;
  for(i=0;i<3;i++){
    o=carToile(1024);x=o.x;r=cosGraine("etoiles-v14:"+i);out.push(o.c);
    if(!x)continue;
    for(j=0;j<190;j++){
      px=r()*1024;py=r()*1024;s=r()<0.88?0.6+r()*1.1:1.6+r()*1.6;
      col=r()<0.6?"255,255,255":r()<0.6?"188,212,255":"255,226,192";
      carTuileEtoile(x,px,py,s,col,0.3+0.7*r());
    }
    /* v14.1 : quelques galaxies lointaines, petites taches ovales */
    for(j=0;j<5;j++){
      px=40+r()*944;py=40+r()*944;s=4+r()*8;col=r()<0.5?"255,236,214":"205,220,255";
      x.save();x.translate(px,py);x.rotate(r()*CAR_TAU);x.scale(1,0.25+0.4*r());
      g=x.createRadialGradient(0,0,0,0,0,s);g.addColorStop(0,"rgba("+col+",.55)");g.addColorStop(0.35,"rgba("+col+",.18)");g.addColorStop(1,"rgba("+col+",0)");
      x.fillStyle=g;x.fillRect(-s,-s,2*s,2*s);x.restore();
    }
  }
  CAR_CACHE.tuiles=out;
  return out;
}
/* Halo lumineux d'une couleur : cœur blanc, couronne colorée, qui s'éteint */
function carGlow(col){
  if(CAR_CACHE.glow[col])return CAR_CACHE.glow[col];
  var o=carToile(128),x=o.x,g;
  CAR_CACHE.glow[col]=o.c;
  if(!x)return o.c;
  g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(0.06,"rgba(255,255,255,.92)");g.addColorStop(0.15,carRgba(col,0.7));
  g.addColorStop(0.34,carRgba(col,0.2));g.addColorStop(0.62,carRgba(col,0.055));g.addColorStop(1,carRgba(col,0));
  x.fillStyle=g;x.fillRect(0,0,128,128);
  return o.c;
}
function carSprite(x,col,cx,cy,r){x.drawImage(carGlow(col),cx-r,cy-r,2*r,2*r);}
/* Texture d'une planète (512 × 256, se raccorde à gauche et à droite) : bandes de gaz et tempêtes ovales, ou sol
   tacheté et cratères. v14.1 : deux fois plus fine, pour la planète vue de près. */
function carTexture(P){
  var key=P.id+"|"+P.col;
  if(CAR_CACHE.tex[key])return CAR_CACHE.tex[key];
  var c=document.createElement("canvas"),x=null,r=cosGraine("tex:"+P.id),b=carHex(CAR_PAL[P.col]),gaz=r()>0.3,
      f1=(0.05+r()*0.12)/2,f2=(0.16+r()*0.32)/2,p1=r()*6,p2=r()*6,y,v,i,cx,cy,w,h,d,TW=512,TH=256;
  c.width=TW;c.height=TH;CAR_CACHE.tex[key]=c;
  try{x=c.getContext("2d");}catch(e){}
  if(!x)return c;
  for(y=0;y<TH;y++){
    v=gaz?0.55*Math.sin(y*f1+p1)+0.3*Math.sin(y*f2+p2)+0.14*(r()-0.5):0.22*Math.sin(y*f1*0.5+p1)+0.1*(r()-0.5);
    x.fillStyle=carNuance(b,0.5+0.5*v);x.fillRect(0,y,TW,1);
  }
  for(i=0;i<(gaz?620:420);i++){
    cx=r()*TW;cy=r()*TH;w=gaz?10+r()*80:5+r()*30;h=gaz?2+r()*6:4+r()*16;
    x.fillStyle=carNuance(b,r(),gaz?0.3:0.38);
    for(d=-TW;d<=TW;d+=TW){if(cx+d+w<0||cx+d-w>TW)continue;x.beginPath();x.ellipse(cx+d,cy,w,h,0,0,CAR_TAU);x.fill();}
  }
  for(i=0;i<(gaz?3:26);i++){
    cx=r()*TW;cy=TH*(0.2+0.6*r());w=gaz?14+r()*20:3+r()*9;h=gaz?w*0.5:w;
    for(d=-TW;d<=TW;d+=TW){
      if(cx+d+w<0||cx+d-w>TW)continue;
      x.fillStyle=gaz?carNuance(b,0.95,0.55):carNuance(b,0.15,0.35);x.beginPath();x.ellipse(cx+d,cy,w,h,0,0,CAR_TAU);x.fill();
      x.fillStyle=gaz?carNuance(b,0.7,0.6):carNuance(b,0.85,0.3);x.beginPath();x.ellipse(cx+d+(gaz?0:w*0.18),cy+(gaz?0:h*0.18),w*0.62,h*0.62,0,0,CAR_TAU);x.fill();
    }
  }
  return c;
}

/* ---------- Ce qu'on regarde : le niveau au centre de l'écran ---------- */
function carProche(lst,cx,cy,t,fn){
  var b=null,bd=Infinity,i,p,d;
  for(i=0;i<lst.length;i++){
    p=fn?fn(lst[i],t):lst[i];d=(p.x-cx)*(p.x-cx)+(p.y-cy)*(p.y-cy);
    if(d<bd){bd=d;b=lst[i];}
  }
  return b;
}
/* nu/ns/np : les plus proches du centre à chaque niveau, et leur taille à l'écran (pu, ps, pp) ;
   u/s/p : le niveau retenu (fil d'Ariane, actions, liste) */
function carFoyer(t){
  var c=CAR,k=c.cam.k,m=Math.min(c.W,c.H),cx=c.cam.x,cy=c.cam.y,f={};
  f.m=m;
  f.nu=carProche(c.sc.u,cx,cy,t);
  f.pu=f.nu?k*CAR_R:0;
  f.ns=f.nu?carProche(f.nu.s,cx,cy,t):null;
  f.ps=f.ns?k*CAR_SIG*carRayon(f.ns):0;
  f.np=f.ns&&f.ns.pl.length?carProche(f.ns.pl,cx,cy,t,carXYP):null;
  f.pp=f.np?k*CAR_SIG*f.np.taille:0;
  f.u=f.pu>=CAR_SU*m?f.nu:null;
  f.s=f.u&&f.ps>=0.18*m?f.ns:null;
  f.p=f.s&&f.pp>=0.1*m?f.np:null;
  return f;
}
function carNiveau(f){return f.p?3:f.s?2:f.u?1:0;}

/* ---------- Dessin ---------- */
/* Une vue : le contexte, la taille en px CSS, la caméra (cx, cy, k), ce qui est touchable et écrit */
function carVue(x,W,H,dpr,cx,cy,k){return {x:x,W:W,H:H,dpr:dpr,cx:cx,cy:cy,k:k,m:Math.min(W,H),hits:[],labels:[],sansEtiq:false,apercu:false};}
function carMonde(v){v.x.setTransform(v.dpr*v.k,0,0,v.dpr*v.k,v.dpr*(v.W/2-v.cx*v.k),v.dpr*(v.H/2-v.cy*v.k));}
function carEcr(v){v.x.setTransform(v.dpr,0,0,v.dpr,0,0);}
function carEcran(v,wx,wy){return {x:v.W/2+(wx-v.cx)*v.k,y:v.H/2+(wy-v.cy)*v.k};}
/* Tons : l'espace de la carte (toujours sombre) ou, pour les aperçus posés sur l'app, les jetons du thème */
function carTons(apercu){
  var P=CAR_CACHE.polices;
  if(!P)P=CAR_CACHE.polices={corps:cosJeton("--font-body","sans-serif"),fond:cosJeton("--font-display","sans-serif"),mono:cosJeton("--font-mono","monospace")};
  if(apercu)return {ink:cosJeton("--ink","#13201F"),muted:cosJeton("--muted","#5B6A68"),line:cosJeton("--line","#C9D2D0"),
    lineFort:cosJeton("--muted","#5B6A68"),acc:cosJeton("--accent","#17605B"),ombre:"transparent",corps:P.corps,fond:P.fond,mono:P.mono};
  return {ink:CAR_ESP.ink,muted:CAR_ESP.muted,line:CAR_ESP.line,lineFort:CAR_ESP.lineFort,acc:CAR_ESP.acc,ombre:CAR_ESP.ombre,
    corps:P.corps,fond:P.fond,mono:P.mono};
}
function carEtiq(v,e){v.labels.push(e);}
function carHit(v,t,ref,x,y,r){v.hits.push({t:t,ref:ref,x:x,y:y,r:r});}

/* Étiquettes : les plus importantes d'abord, sans se chevaucher, dans l'écran, sur une ombre douce */
function carEtiquettes(v,T){
  /* Stables : une étiquette déjà affichée garde sa place (à priorité égale, elle passe avant les nouvelles), une nouvelle
     n'apparaît que s'il reste de la marge autour, et elles apparaissent et s'effacent en fondu : plus de clignotement
     quand les objets tournent. Rien sous les boutons + − ⤢. */
  var rects=v.apercu?[]:[{x:v.W-62,y:0,w:62,h:160}],x=v.x,mem=CAR.etq,dt=Math.min(0.1,CAR.dtE||0.016),vus={};
  if(v.sansEtiq)return;
  carEcr(v);
  v.labels.forEach(function(e){e.k=e.k||e.txt;e.vu=!!(mem[e.k]&&mem[e.k].vu);});
  v.labels.sort(function(a,b){return (b.prio-a.prio)||((b.vu?1:0)-(a.vu?1:0));});
  v.labels.forEach(function(e){
    var txt=e.txt,w,max=e.max||Math.min(170,v.W*0.5),lx,h=e.sub?34:18,r,pad=e.vu?0:4,ok,m=mem[e.k]||(mem[e.k]={a:0,vu:false}),al;
    vus[e.k]=1;
    x.font=e.font||("600 12.5px "+T.corps);
    w=x.measureText(txt).width;
    while(w>max&&txt.length>4){txt=txt.slice(0,-2);w=x.measureText(txt+"…").width;}
    if(txt!==e.txt)txt+="…";
    lx=Math.max(w/2+8,Math.min(v.W-w/2-8,e.x));
    r={x:lx-w/2-5,y:e.y-14,w:w+10,h:h};
    ok=!(e.y<-30||e.y>v.H+30||e.x<-60||e.x>v.W+60)&&
       !rects.some(function(q){return r.x-pad<q.x+q.w&&q.x<r.x+r.w+pad&&r.y-pad<q.y+q.h&&q.y<r.y+r.h+pad;});
    m.vu=ok;
    if(ok)rects.push(r);
    m.a+=((ok?1:0)-m.a)*Math.min(1,dt*(ok?7:12));
    al=m.a*(e.al==null?1:e.al);
    if(al<0.02)return;
    x.save();
    x.globalAlpha=al;
    x.textAlign="center";x.textBaseline="alphabetic";
    x.shadowColor=T.ombre;x.shadowBlur=8;
    x.fillStyle=e.col||T.ink;x.fillText(txt,lx,e.y);
    if(e.sub){x.font="500 11.5px "+T.mono;x.fillStyle=T.muted;x.fillText(e.sub,lx,e.y+17);}
    x.restore();
  });
  Object.keys(mem).forEach(function(k){if(!vus[k])delete mem[k];});
}
/* Le fond : nébuleuse (neutre au loin, à la teinte de l'univers dedans), étoiles sur trois profondeurs, traînées */
function carFond(v,f){
  var c=CAR,x=v.x,lk=Math.log(v.k),m=v.m,wu=f.nu?carLiss(0.4*m,0.6*m,f.pu):0,ba=f.nu?carLiss(1.6*m,6*m,f.pu):0,
      S=Math.max(v.W,v.H)*1.7*(1+0.06*Math.sin(lk*0.6)),ox=Math.sin(c.off.x*0.0005)*S*0.1,oy=Math.sin(c.off.y*0.0005)*S*0.1;
  x.save();
  x.globalCompositeOperation="lighter";
  if(wu<0.99){
    /* sans univers, un voile neutre ; avec, chaque galaxie a le sien (dessous) */
    if(!c.sc.u.length){x.globalAlpha=0.6*(1-wu);x.drawImage(carNebuleuse(205),v.W/2-S/2+ox,v.H/2-S/2+oy,S,S);}
    /* vue d'ensemble (v14.1) : chaque galaxie baigne dans un nuage à sa teinte */
    c.sc.u.forEach(function(U){
      var e=carEcran(v,U.x,U.y),d=CAR_R*v.k*4.4;
      if(e.x+d/2<0||e.x-d/2>v.W||e.y+d/2<0||e.y-d/2>v.H)return;
      x.globalAlpha=0.7*(1-wu);x.drawImage(carNebuleuseRonde(U.u.galaxie.teinte),e.x-d/2,e.y-d/2,d,d);
    });
  }
  if(wu*(1-ba)>0.01){x.globalAlpha=0.8*wu*(1-ba);x.drawImage(carNebuleuse(f.nu.u.galaxie.teinte),v.W/2-S/2+ox,v.H/2-S/2+oy,S,S);}
  /* dans un système ou sur une planète, on est dans la galaxie : sa bande d'étoiles traverse le ciel */
  if(ba>0.01)carBandeDessin(x,v,f.nu,ba);
  carEtoiles(x,v,lk);
  carWarp(x,v,c.vz,lk);
  x.restore();
}
/* Étoiles de fond : chaque couche grossit avec le zoom puis s'efface, relayée par la suivante (zoom sans fin) */
function carEtoiles(x,v,lk){
  var tiles=carTuiles(),c=CAR,i,ph,sc,a,ts,cx,cy,n0,n1,m0,m1,ix,iy,TL=512;
  for(i=0;i<3;i++){
    ph=lk*0.32+i/3;ph-=Math.floor(ph);
    sc=Math.pow(3,ph);a=Math.sin(Math.PI*ph);
    if(a<0.02)continue;
    x.globalAlpha=a;
    cx=c.off.x*0.08+i*173;cy=c.off.y*0.08+i*97;ts=TL*sc;
    n0=Math.floor((cx-v.W/2/sc)/TL);n1=Math.floor((cx+v.W/2/sc)/TL);
    m0=Math.floor((cy-v.H/2/sc)/TL);m1=Math.floor((cy+v.H/2/sc)/TL);
    for(ix=n0;ix<=n1;ix++)for(iy=m0;iy<=m1;iy++)x.drawImage(tiles[i],v.W/2+(ix*TL-cx)*sc,v.H/2+(iy*TL-cy)*sc,ts,ts);
  }
  x.globalAlpha=1;
}
/* Traînées de vitesse pendant les grands zooms : elles partent du centre (on plonge) ou y reviennent (on remonte) */
function carWarp(x,v,vz,lk){
  var a=0.55*carLiss(1.5,5,Math.abs(vz)),D,cx,cy,len,sg,r;
  if(a<0.02)return;
  if(!CAR_CACHE.warp){r=cosGraine("warp");CAR_CACHE.warp=[];for(D=0;D<80;D++)CAR_CACHE.warp.push({th:r()*CAR_TAU,ph:r(),w:0.6+r()*1.2});}
  D=Math.sqrt(v.W*v.W+v.H*v.H)*0.6;cx=v.W/2;cy=v.H/2;len=Math.min(0.6,0.08*Math.abs(vz));sg=vz>0?1:-1;
  x.lineCap="round";x.strokeStyle="rgba(205,226,255,.9)";
  CAR_CACHE.warp.forEach(function(s){
    var f=s.ph+lk*0.5,r0,r1,co=Math.cos(s.th),si=Math.sin(s.th);
    f-=Math.floor(f);r0=D*f*f;r1=r0*(1+sg*len);
    if(r0<6)return;
    x.globalAlpha=a*f;x.lineWidth=s.w*(0.4+f);
    x.beginPath();x.moveTo(cx+co*r0,cy+si*r0);x.lineTo(cx+co*r1,cy+si*r1);x.stroke();
  });
  x.globalAlpha=1;x.lineCap="butt";
}
function carVignette(v){
  var x=v.x,g=x.createRadialGradient(v.W/2,v.H/2,v.m*0.3,v.W/2,v.H/2,Math.max(v.W,v.H)*0.8);
  g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.6)");
  carEcr(v);x.fillStyle=g;x.fillRect(0,0,v.W,v.H);
}
/* La galaxie d'un univers : son image tournée sur elle-même, inclinée ; elle s'efface quand on plonge dedans.
   Son nom n'est écrit que dans la vue d'ensemble : dans un univers, le fil d'Ariane le dit. */
function carGalaxie(v,U,t,T,nom,al){
  var g=U.u.galaxie,R=CAR_R,s=carEcran(v,U.x,U.y),pr=R*v.k*1.45,x=v.x,n,bl;
  if(al>0.01&&s.x+pr>-20&&s.x-pr<v.W+20&&s.y+pr>-20&&s.y-pr<v.H+20){
    /* v14.1 : petite (vue d'ensemble), elle garde l'éclat de la vue d'un univers : un halo flou à sa forme */
    bl=0.6*(1-carLiss(0.4*v.m,0.62*v.m,R*v.k));
    carMonde(v);x.save();x.globalAlpha=al;x.globalCompositeOperation="lighter";x.imageSmoothingQuality="high";
    x.translate(U.x,U.y);x.rotate(g.inclinaison);x.scale(1,g.aplatissement);x.rotate(carSpin(U,CAR.tR));
    if(bl>0.01){x.globalAlpha=al*bl;x.drawImage(carFloue(U),-R*1.45,-R*1.45,2.9*R,2.9*R);x.globalAlpha=al;}
    x.drawImage(carImage(U),-R*1.1,-R*1.1,2.2*R,2.2*R);x.restore();
  }
  if(nom){
    carHit(v,"u",U,s.x,s.y,Math.max(30,R*v.k*0.8));
    n=univMats(U.id).length;
    carEtiq(v,{k:"u:"+U.id,txt:U.nom,x:s.x,y:s.y+(U.bh||R)*v.k+24,prio:1,font:"700 17px "+T.fond,
      sub:tnx("carte.n_mot",n,{mot:plurielCat(n)==="other"?(U.u.libelle||tx("cr.libelle_defaut")):(U.u.libelle||tx("cr.libelle_defaut")).replace(/s$/,"")})});
  }
}
/* Un soleil : de loin, un point de lumière avec ses aigrettes ; de près, un disque avec sa couronne */
function carSoleilDessin(v,S,c0,sunR,T,al,vise,ecrire){
  var x=v.x,col=CAR_PAL[S.col]||CAR_PAL[0],gr=Math.max(v.apercu?6:10,sunR*3.2),sp,g;
  if(al<0.01)return;
  carEcr(v);
  x.save();x.globalAlpha=al;x.globalCompositeOperation="lighter";
  carSprite(x,col,c0.x,c0.y,gr);
  if(sunR>=2){x.globalAlpha=al*0.4;carSprite(x,col,c0.x,c0.y,Math.min(sunR*7,sunR+0.45*v.m)*(v.apercu?0.6:1));x.globalAlpha=al;}
  /* v14.1 : de près, sa couronne (jets fins qui tournent lentement) */
  if(sunR>=5&&!v.apercu&&sunR<140){
    /* s'éteint quand le soleil devient immense (vu depuis une planète) : ses jets deviendraient de larges traînées */
    x.save();x.translate(c0.x,c0.y);x.rotate(CAR.tR*0.02);x.globalAlpha=al*0.8*(1-carLiss(70,140,sunR));
    x.drawImage(carCouronne(col),-sunR*3.6,-sunR*3.6,sunR*7.2,sunR*7.2);x.restore();
  }
  if(sunR<4&&!v.apercu){
    sp=gr*(vise?2.2:1.6);x.lineWidth=1;
    g=x.createLinearGradient(c0.x-sp,0,c0.x+sp,0);g.addColorStop(0,carRgba(col,0));g.addColorStop(0.5,"rgba(255,255,255,.55)");g.addColorStop(1,carRgba(col,0));
    x.strokeStyle=g;x.beginPath();x.moveTo(c0.x-sp,c0.y);x.lineTo(c0.x+sp,c0.y);x.stroke();
    g=x.createLinearGradient(0,c0.y-sp,0,c0.y+sp);g.addColorStop(0,carRgba(col,0));g.addColorStop(0.5,"rgba(255,255,255,.55)");g.addColorStop(1,carRgba(col,0));
    x.strokeStyle=g;x.beginPath();x.moveTo(c0.x,c0.y-sp);x.lineTo(c0.x,c0.y+sp);x.stroke();
  }
  x.restore();
  if(sunR>=5)carSoleilDisque(x,c0,sunR,col,al,CAR.tR,!v.apercu);
  else if(sunR>=1.6){
    x.save();x.globalAlpha=al;
    g=x.createRadialGradient(c0.x-sunR*0.25,c0.y-sunR*0.25,sunR*0.05,c0.x,c0.y,sunR);
    g.addColorStop(0,"#FFFFFF");g.addColorStop(0.35,carBlanc(col,0.78));g.addColorStop(0.82,carBlanc(col,0.38));g.addColorStop(1,carBlanc(col,0.18));
    x.fillStyle=g;x.beginPath();x.arc(c0.x,c0.y,sunR,0,CAR_TAU);x.fill();x.restore();
  }
  if(v.apercu||!ecrire)return;
  carHit(v,"s",S,c0.x,c0.y,Math.max(22,sunR*1.6));
  if(al>0.5&&!(CAR.foc&&CAR.foc.p))carEtiq(v,{k:"s:"+S.id,txt:S.nom,x:c0.x,y:c0.y+Math.max(gr*0.45,sunR*1.5)+16,prio:vise?4:3,al:al,
    font:(vise?"700 14px ":"600 12.5px ")+T.corps});
}
/* La couronne d'un soleil (une fois par couleur) : des jets fins qui partent du bord du disque (0,28 du rayon de
   l'image) et s'éteignent en s'éloignant, quelques pétales plus larges */
function carCouronne(col){
  if(CAR_CACHE.couronne[col])return CAR_CACHE.couronne[col];
  var N=512,R=N/2,o=carToile(N),x=o.x,r=cosGraine("couronne:"+col),i,a,l,w,g;
  CAR_CACHE.couronne[col]=o.c;
  if(!x)return o.c;
  x.globalCompositeOperation="lighter";
  g=x.createRadialGradient(R,R,R*0.27,R,R,R);
  g.addColorStop(0,carRgba(col,0.85));g.addColorStop(0.16,carRgba(col,0.32));g.addColorStop(0.5,carRgba(col,0.07));g.addColorStop(1,carRgba(col,0));
  x.fillStyle=g;x.strokeStyle=g;x.lineCap="round";
  for(i=0;i<9;i++){
    a=r()*CAR_TAU;w=0.06+0.12*r();l=R*(0.62+0.38*r());
    x.globalAlpha=0.35+0.3*r();x.beginPath();x.moveTo(R+Math.cos(a-w)*R*0.27,R+Math.sin(a-w)*R*0.27);
    x.quadraticCurveTo(R+Math.cos(a)*l*0.6,R+Math.sin(a)*l*0.6,R+Math.cos(a)*l,R+Math.sin(a)*l);
    x.quadraticCurveTo(R+Math.cos(a)*l*0.6,R+Math.sin(a)*l*0.6,R+Math.cos(a+w)*R*0.27,R+Math.sin(a+w)*R*0.27);x.fill();
  }
  for(i=0;i<260;i++){
    a=r()*CAR_TAU;l=R*(0.36+0.64*Math.pow(r(),1.7));
    x.globalAlpha=0.12+0.45*r();x.lineWidth=0.7+r()*2.4;
    x.beginPath();x.moveTo(R+Math.cos(a)*R*0.27,R+Math.sin(a)*R*0.27);x.lineTo(R+Math.cos(a)*l,R+Math.sin(a)*l);x.stroke();
  }
  return o.c;
}
/* La surface d'un soleil (une fois par couleur) : granulation, cellules plus claires ou plus sombres que sa couleur */
function carGranules(col){
  if(CAR_CACHE.gran[col])return CAR_CACHE.gran[col];
  var N=128,o=carToile(N),x=o.x,r=cosGraine("gran:"+col),b=carHex(col),i,px,py,s;
  CAR_CACHE.gran[col]=o.c;
  if(!x)return o.c;
  x.fillStyle=carBlanc(col,0.12);x.fillRect(0,0,N,N);
  for(i=0;i<3200;i++){
    px=r()*N;py=r()*N;s=0.6+r()*1.6;
    x.fillStyle=r()<0.55?"rgba(255,255,255,"+(0.05+0.12*r())+")":carNuance(b,0.2+0.35*r(),0.08+0.12*r());
    x.beginPath();x.arc(px,py,s,0,CAR_TAU);x.fill();
  }
  for(i=0;i<22;i++){
    px=r()*N;py=r()*N;s=3+r()*7;
    x.save();x.translate(px,py);x.rotate(r()*CAR_TAU);x.scale(1,0.35);
    x.fillStyle="rgba(255,255,255,"+(0.08+0.1*r())+")";x.beginPath();x.arc(0,0,s,0,CAR_TAU);x.fill();x.restore();
  }
  return o.c;
}
/* Le disque d'un soleil vu de près : sa surface qui tourne lentement, plus claire au centre et plus sombre au bord
   (assombrissement centre-bord), un liseré lumineux, et un reflet d'objectif horizontal */
function carSoleilDisque(x,c0,R,col,al,tR,eclat){
  var b=carHex(col),g,L;
  x.save();x.globalAlpha=al;
  x.beginPath();x.arc(c0.x,c0.y,R,0,CAR_TAU);x.clip();
  x.translate(c0.x,c0.y);x.rotate(tR*0.03);
  x.drawImage(carGranules(col),-R*1.42,-R*1.42,R*2.84,R*2.84);
  g=x.createRadialGradient(0,0,0,0,0,R);
  g.addColorStop(0,"rgba(255,255,255,.5)");g.addColorStop(0.38,"rgba(255,255,255,.12)");g.addColorStop(0.72,carRgba(col,0.05));
  g.addColorStop(0.92,carNuance(b,0.25,0.42));g.addColorStop(1,carNuance(b,0.1,0.7));
  x.fillStyle=g;x.fillRect(-R,-R,2*R,2*R);
  x.restore();
  if(!eclat)return;
  x.save();x.globalAlpha=al;x.globalCompositeOperation="lighter";
  g=x.createRadialGradient(c0.x,c0.y,R*0.9,c0.x,c0.y,R*1.16);
  g.addColorStop(0,carRgba(col,0));g.addColorStop(0.35,carRgba(col,0.6));g.addColorStop(1,carRgba(col,0));
  x.fillStyle=g;x.beginPath();x.arc(c0.x,c0.y,R*1.16,0,CAR_TAU);x.fill();
  L=R*11;x.globalAlpha=al*(1-carLiss(50,110,R));
  if(x.globalAlpha<0.01){x.restore();return;}
  /* de part et d'autre du disque seulement (sur le disque, le trait le barrait) */
  [-1,1].forEach(function(sg){
    var a0=c0.x+sg*R*1.02,a1=c0.x+sg*L,gl=x.createLinearGradient(a0,0,a1,0);
    gl.addColorStop(0,"rgba(255,255,255,.5)");gl.addColorStop(0.18,carRgba(col,0.28));gl.addColorStop(1,carRgba(col,0));
    x.fillStyle=gl;x.fillRect(Math.min(a0,a1),c0.y-Math.max(0.8,R*0.03),Math.abs(a1-a0),Math.max(1.6,R*0.06));
  });
  x.restore();
}
/* Une planète en volume : texture qui tourne, côté nuit à l'opposé du soleil (lx, ly), atmosphère, anneau éventuel */
function carAnneau(x,cx,cy,r,P,devant){
  var b=carHex(CAR_PAL[P.col]),a0=devant?0:Math.PI,a1=devant?Math.PI:CAR_TAU;
  x.save();x.translate(cx,cy);x.rotate(P.incl);
  x.lineWidth=Math.max(1,r*0.3);x.strokeStyle=carNuance(b,0.8,0.32);x.beginPath();x.ellipse(0,0,r*1.85,r*0.5,0,a0,a1);x.stroke();
  x.lineWidth=Math.max(0.6,r*0.12);x.strokeStyle=carNuance(b,0.95,0.5);x.beginPath();x.ellipse(0,0,r*2.2,r*0.6,0,a0,a1);x.stroke();
  x.restore();
}
function carPlaneteDisque(x,cx,cy,r,P,lx,ly,tR){
  var col=CAR_PAL[P.col]||CAR_PAL[0],tex,w,sc,g;
  if(r<2.6){x.fillStyle=carBlanc(col,0.2);x.beginPath();x.arc(cx,cy,Math.max(1.2,r),0,CAR_TAU);x.fill();return;}
  if(P.anneau)carAnneau(x,cx,cy,r,P,false);
  tex=carTexture(P);w=4*r;sc=(tR*P.spin*w)%w;
  x.save();x.beginPath();x.arc(cx,cy,r,0,CAR_TAU);x.clip();
  x.drawImage(tex,cx-r-sc,cy-r,w,2*r);x.drawImage(tex,cx-r-sc+w,cy-r,w,2*r);
  g=x.createRadialGradient(cx+lx*r*0.5,cy+ly*r*0.5,r*0.05,cx-lx*r*0.2,cy-ly*r*0.2,r*1.3);
  g.addColorStop(0,"rgba(255,255,255,.2)");g.addColorStop(0.42,"rgba(0,0,0,0)");g.addColorStop(0.72,"rgba(0,0,0,.6)");g.addColorStop(1,"rgba(0,0,0,.94)");
  x.fillStyle=g;x.fillRect(cx-r,cy-r,2*r,2*r);
  x.restore();
  x.save();x.globalCompositeOperation="lighter";
  g=x.createRadialGradient(cx,cy,r*0.88,cx,cy,r*1.2);
  g.addColorStop(0,carRgba(col,0));g.addColorStop(0.3,carRgba(col,0.32));g.addColorStop(1,carRgba(col,0));
  x.fillStyle=g;x.beginPath();x.arc(cx,cy,r*1.2,0,CAR_TAU);x.fill();x.restore();
  if(P.anneau)carAnneau(x,cx,cy,r,P,true);
}
function carPlaneteDessin(v,o,c0,T,al,big){
  var x=v.x,P=o.P,e=o.e,r=Math.max(1.4,CAR_SIG*P.taille*v.k),dx=c0.x-e.x,dy=c0.y-e.y,dl=Math.sqrt(dx*dx+dy*dy)||1,vise=big===P,rr,lw;
  carEcr(v);
  x.save();x.globalAlpha=al;carPlaneteDisque(x,e.x,e.y,r,P,dx/dl,dy/dl,CAR.tR);x.restore();
  if(v.apercu)return;
  carHit(v,"p",P,e.x,e.y,Math.max(20,r+10));
  if(al>0.5&&(!big||vise))carEtiq(v,{k:"p:"+P.id,txt:P.nom,x:e.x,y:e.y+r*(vise?1.32:1)+(P.anneau&&!vise?r*0.4:0)+(vise?24:16),prio:vise?5:2,al:al,
    font:(vise?"700 16px ":"600 12.5px ")+T.corps,sub:vise?tx("carte.prog",{p:Math.round(P.prog*100)}):null,max:vise?v.W-24:0});
  if(vise){
    rr=r*1.32;lw=Math.max(3,r*0.045);
    x.save();x.lineCap="round";x.lineWidth=lw;
    x.strokeStyle="rgba(255,255,255,.13)";x.beginPath();x.arc(e.x,e.y,rr,0,CAR_TAU);x.stroke();
    if(P.prog>0){x.strokeStyle=T.acc;x.shadowColor=T.acc;x.shadowBlur=14;x.beginPath();x.arc(e.x,e.y,rr,-Math.PI/2,-Math.PI/2+CAR_TAU*P.prog);x.stroke();}
    x.restore();
  }
}
/* Un système de près : orbites inclinées, planètes derrière le soleil, le soleil, planètes devant */
function carSysteme(v,S,t,T,al,f,vise,alSol){
  var x=v.x,c0=carEcran(v,S.x,S.y),k=v.k,big=f&&f.p?f.p:null,pl=[];
  carEcr(v);
  x.save();x.globalAlpha=al;x.lineWidth=1;
  S.pl.forEach(function(P){
    var rx=CAR_SIG*P.r*k;
    x.strokeStyle=big===P?T.lineFort:T.line;x.beginPath();x.ellipse(c0.x,c0.y,rx,rx*CAR_INC,0,0,CAR_TAU);x.stroke();
  });
  /* v14.1 : un système sans planète montre en pointillé les orbites qui attendent ses thèmes */
  if(!S.pl.length&&!v.apercu){
    x.setLineDash([3,6]);x.lineWidth=1.2;x.strokeStyle="rgba(205,228,250,.4)";
    [0,1,2].forEach(function(j){var rx=CAR_SIG*(CAR_P0+CAR_PG*j)*k;x.beginPath();x.ellipse(c0.x,c0.y,rx,rx*CAR_INC,0,0,CAR_TAU);x.stroke();});
    x.setLineDash([]);
  }
  x.restore();
  S.pl.forEach(function(P){var p=carXYP(P,t);pl.push({P:P,p:p,e:carEcran(v,p.x,p.y)});});
  pl.sort(function(a,b){return a.p.z-b.p.z;});
  pl.forEach(function(o){if(o.p.z<0)carPlaneteDessin(v,o,c0,T,al,big);});
  carSoleilDessin(v,S,c0,CAR_SIG*CAR_SUN*k,T,alSol==null?1:alSol,vise,true);
  pl.forEach(function(o){if(o.p.z>=0)carPlaneteDessin(v,o,c0,T,al,big);});
}
/* Le dessin complet, à la caméra courante */
function carDessiner(t){
  var c=CAR,x=c.cv.getContext("2d"),v=carVue(x,c.W,c.H,c.dpr,c.cam.x,c.cam.y,c.cam.k),f=carFoyer(t),T=carTons(false),m=v.m,
      su=f.nu?carLiss(0.45*m,0.6*m,f.pu):0,sp=f.ns?carLiss(0.06*m,0.2*m,f.ps):0,lk=Math.log(v.k),ga;
  c.foc=f;
  if(c.pcx!==null){c.off.x+=(c.cam.x-c.pcx)*v.k;c.off.y+=(c.cam.y-c.pcy)*v.k;}
  c.pcx=c.cam.x;c.pcy=c.cam.y;
  x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.globalCompositeOperation="source-over";
  x.fillStyle=CAR_ESP.bg;x.fillRect(0,0,c.cv.width,c.cv.height);
  carEcr(v);
  carFond(v,f);
  ga=1-carLiss(1.8*m,7*m,CAR_R*v.k);
  /* un univers ouvert : les autres galaxies s'effacent (v14.1, la vue d'ensemble les rapproche) */
  c.sc.u.forEach(function(U){carGalaxie(v,U,t,T,!f.u,U===f.nu?ga:ga*(1-su));});
  if(su>0.01){
    f.nu.s.forEach(function(S){
      if(S===f.ns&&sp>0.01)carSysteme(v,S,t,T,sp,f,true,su);
      else carSoleilDessin(v,S,carEcran(v,S.x,S.y),CAR_SIG*CAR_SUN*v.k,T,su,false,!f.s);
    });
  }
  carVignette(v);
  carEtiquettes(v,T);
  c.hits=v.hits;
  c.cv.__pos=v.hits.map(function(h){return {t:h.t,x:h.x,y:h.y,r:h.r,nom:h.ref.nom||""};});
  c.cv.setAttribute("data-niveau",String(carNiveau(f)));
  c.cv.setAttribute("data-zoom",c.cam.k.toFixed(3));
  void lk;
  return f;
}

/* ---------- Aperçus d'un système (création, matière à remplir) : le même dessin, sans navigation ---------- */
function carApercu(cv,t){
  var W=cv.clientWidth,H=cv.clientHeight,dpr=Math.min(2,window.devicePixelRatio||1),S=cv.__sys,k,v,T;
  if(!W||!H||!S)return;
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
  k=Math.min(0.46*W,0.44*H/CAR_INC)/(CAR_SIG*carRayon(S));
  v=carVue(cv.getContext("2d"),W,H,dpr,0,0,k);v.sansEtiq=true;v.apercu=true;
  T=carTons(true);
  v.x.setTransform(1,0,0,1,0,0);v.x.clearRect(0,0,cv.width,cv.height);
  carSysteme(v,S,t,T,1,null,false,1);
}
/* Un aperçu de système (création, matière à remplir, liste) : planètes et soleil, animés tant qu'ils sont affichés */
function carApercuDe(cv,planets,col,sunCol){
  cv.__sys=carSysObj(planets,col,sunCol);
  if(!CAR.apercus.some(function(x){return x===cv;}))CAR.apercus.push(cv);
  carLancer();
}

/* ---------- La caméra : points de vue, vols, suivi ---------- */
/* La vue d'ensemble : celle que carDisposer a calculée pour cet écran */
function carBordTout(){var v=CAR.sc&&CAR.sc.vue;return v?{x:v.x,y:v.y,k:v.k}:{x:0,y:0,k:1};}
function carKMin(){return carBordTout().k*0.5;}
function carKMax(){return 4*CAR_KP*Math.min(CAR.W,CAR.H)/(CAR_SIG*CAR_PR*0.72);}
/* Destination d'un point de vue : 0 vue globale, 1 univers, 2 système, 3 planète ; -1 : une caméra donnée */
function carDest(niv,e,t){
  var c=CAR,m=Math.min(c.W,c.H),b,p;
  if(niv===-1)return {x:e.x,y:e.y,k:e.k,suit:null,frozen:null};
  if(niv===0){b=carBordTout();return {x:b.x,y:b.y,k:b.k,suit:null,frozen:null};}
  if(niv===1)return {x:e.x,y:e.y,k:CAR_KU*m/CAR_R,suit:null,frozen:null};
  /* v14.1 : plafonné pour qu'une planète, même grande et seule, reste loin du seuil d'une planète regardée (0,1) */
  if(niv===2)return {x:e.x,y:e.y,k:Math.min(Math.min(CAR_TOUR*c.W,0.4*c.H/CAR_INC)/(CAR_SIG*carRayon(e)),0.06*m/(CAR_SIG*CAR_PR*1.22)),suit:{ref:e},frozen:null};
  p=carXYP(e,t);
  return {x:p.x,y:p.y,k:CAR_KP*m/(CAR_SIG*e.taille),suit:{P:e},frozen:{P:e}};
}
function carSuitPos(s){return s.ref?{x:s.ref.x,y:s.ref.y}:carXYP(s.P,CAR.tEst);}
/* Se poser sur une destination, d'un coup */
function carPoser(d){
  var c=CAR;
  c.cam={x:d.x,y:d.y,k:d.k};c.vol=null;c.frozen=d.frozen||null;
  c.suit=d.suit?{ref:d.suit.ref||null,P:d.suit.P||null,ox:0,oy:0}:null;
}
/* Un vol : le zoom suit une courbe douce (en échelle log) et la cible glisse vers le centre de l'écran sans jamais
   en sortir ; durée selon l'écart de zoom (0,4 à 1,3 s). La cible est recalculée à chaque image (elle tourne). */
function carVoler(niv,e,dur){
  var c=CAR,d=carDest(niv,e,c.tEst),dl;
  c.suit=null;c.frozen=null;c.vol=null;c.elan=null;
  if(cosMoinsDeMouvement()||!c.cv){carPoser(d);carLancer();return;}
  dl=Math.abs(Math.log(d.k/c.cam.k));
  c.vol={niv:niv,e:e,d:d,k0:c.cam.k,sx0:(d.x-c.cam.x)*c.cam.k,sy0:(d.y-c.cam.y)*c.cam.k,t0:Date.now(),
    dur:dur||Math.min(1300,Math.max(420,380+200*dl))};
  carLancer();
}
function carEase(u){return u<0.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;}
function carVolPas(now){
  var c=CAR,v=c.vol,u=Math.min(1,(now-v.t0)/v.dur),ez=carEase(u),ep=carEase(Math.min(1,u*1.18)),
      d=v.niv===-1?v.d:carDest(v.niv,v.e,c.tEst),k=Math.exp(Math.log(v.k0)+(Math.log(d.k)-Math.log(v.k0))*ez);
  c.cam.k=k;c.cam.x=d.x-v.sx0*(1-ep)/k;c.cam.y=d.y-v.sy0*(1-ep)/k;
  if(u>=1)carPoser(d);
}
/* Suivi : la caméra reste sur le système ou la planète regardés, même quand ils tournent ; un glisser décale */
function carSuitPas(){var s=CAR.suit,p;if(!s)return;p=carSuitPos(s);CAR.cam.x=p.x+s.ox;CAR.cam.y=p.y+s.oy;}
function carSuitRecale(){var s=CAR.suit,p;if(!s)return;p=carSuitPos(s);s.ox=CAR.cam.x-p.x;s.oy=CAR.cam.y-p.y;}
function carDeplacer(dx,dy){var c=CAR;c.cam.x+=dx;c.cam.y+=dy;if(c.suit){c.suit.ox+=dx;c.suit.oy+=dy;}}
/* Élan après un glisser */
function carElanPas(dtms){
  var e=CAR.elan,k=CAR.cam.k;
  carDeplacer(-e.vx*dtms/k,-e.vy*dtms/k);
  e.vx*=Math.exp(-dtms/320);e.vy*=Math.exp(-dtms/320);
  if(Math.abs(e.vx)+Math.abs(e.vy)<0.02)CAR.elan=null;
}

/* ---------- Un geste = un niveau ---------- */
/* Où on en est au début d'un geste : le niveau et ce qu'on regarde */
function carGesteDebut(){
  var c=CAR,f=carFoyer(c.tEst),n=carNiveau(f);
  return {niv:n,e:n===3?f.p:n===2?f.s:n===1?f.u:null,k0:c.cam.k};
}
/* Entrer d'un niveau, vers ce qui est le plus près du point visé (coordonnées du monde) */
function carPlonger(g,w){
  var c=CAR,U,S,P;
  if(g.niv===0){U=carProche(c.sc.u,w.x,w.y);return U?carVoler(1,U):carVoler(0,null);}
  if(g.niv===1){S=g.e.s.length?carProche(g.e.s,w.x,w.y):null;return S?carVoler(2,S):carVoler(1,g.e);}
  if(g.niv===2){P=g.e.pl.length?carProche(g.e.pl,w.x,w.y,c.tEst,carXYP):null;return P?carVoler(3,P):carVoler(2,g.e);}
  return carVoler(3,g.e);
}
/* Remonter d'un niveau */
function carRemonter(g){
  if(g.niv===3)return carVoler(2,g.e.S);
  if(g.niv===2)return carVoler(1,g.e.u);
  return carVoler(0,null);
}
function carRevenir(g){return g.niv===0?carVoler(0,null):carVoler(g.niv,g.e);}
/* Fin d'un pincement ou d'une série de molette : le sens du geste décide (un petit geste suffit) */
function carFinGeste(sx,sy){
  var c=CAR,g=c.geste,dl,w;
  c.geste=null;
  if(!g)return;
  dl=Math.log(c.cam.k/g.k0);w={x:c.cam.x+(sx-c.W/2)/c.cam.k,y:c.cam.y+(sy-c.H/2)/c.cam.k};
  if(dl>0.12)carPlonger(g,w);
  else if(dl<-0.12)carRemonter(g);
  else carRevenir(g);
}
/* Après un vol interrompu par un glisser : se poser sur le point de vue le plus proche */
function carSnapNiveau(){
  var c=CAR,f=carFoyer(c.tEst),m=f.m;
  if(!f.nu||f.pu<CAR_SU*m)return carVoler(0,null);
  if(!f.ns||f.ps<0.12*m)return carVoler(1,f.nu);
  if(!f.np||f.pp<0.07*m)return carVoler(2,f.ns);
  return carVoler(3,f.np);
}
/* Zoom continu (molette, pavé) autour d'un point de l'écran, borné autour du début du geste */
function carZoomEn(sx,sy,fac){
  var c=CAR,k0=c.cam.k,g=c.geste,lo=carKMin(),hi=carKMax(),k1,wx,wy;
  if(g){lo=Math.max(lo,g.k0/6);hi=Math.min(hi,g.k0*6);}
  k1=Math.max(lo,Math.min(hi,k0*fac));wx=c.cam.x+(sx-c.W/2)/k0;wy=c.cam.y+(sy-c.H/2)/k0;
  c.vol=null;c.elan=null;c.cam.k=k1;c.cam.x=wx-(sx-c.W/2)/k1;c.cam.y=wy-(sy-c.H/2)/k1;
  carSuitRecale();carLancer();
}
/* + et − : un niveau de plus (vers ce qui est au centre) ou de moins */
function carEtage(dir){
  var c=CAR,g=carGesteDebut();
  if(dir>0)carPlonger(g,{x:c.cam.x,y:c.cam.y});else carRemonter(g);
}
function carVueEnsemble(){carVoler(0,null);}

/* ---------- Le fil d'Ariane, les actions et la liste (DOM, seulement quand le niveau change) ---------- */
function carMajFoyer(){
  var f=CAR.foc,cle=(f.u?f.u.id:"-")+"|"+(f.s?f.s.k:"-")+"|"+(f.p?f.p.id:"-")+"|"+CAR.sc.u.length;
  if(cle!==CAR.cle){CAR.cle=cle;carMaj();}
}
function carBouton(parent,txt,cls,fn){var b=el("button",cls,txt);b.type="button";b.addEventListener("click",fn);parent.appendChild(b);return b;}
function carOuvrirMatiere(k){activate(k);BACK="home";NAV_PRE.home="hub";renderHome();show("home");}
function carOuvrirUnivers(id){univFixer(id);univPoser(id);BACK="hub";renderHub();show("hub");}
function carLire(k,th){activate(k);openFiche(th,"carte");}
function carExo(k,id){activate(k);BACK="home";NAV_PRE.home="hub";openEx(id);}
function carCas(k,cas){activate(k);BACK="caslist";start(CASQ[cas.k].slice(),cas.n);}
function carEntrainer(k,th,nom){
  activate(k);
  var L=pool().filter(function(q){return q.th===th;});
  if(!L.length)return;
  BACK="home";start(shuffle(L),nom);
}
/* Un thème de la carte (une planète) : son cours, ses cas, ses exercices, ses QCM */
function carPanneauTheme(f,act){
  var M=MATS[f.s.k],th=f.p.id,k=f.s.k,fiche=M.ready&&M.blocs.cours&&M.COURS[th],
      qs=M.Q.filter(function(q){return q.th===th&&!q.cas;}),cs=M.CAS.filter(function(c){return c.th===th;}),
      es=M.EXO.filter(function(e){return e.th===th;}),sec;
  act.appendChild(el("p","src carte-bilan",tnx("carte.nq",qs.length)+" · "+tnx("carte.ncas",cs.length)+" · "+tnx("carte.nex",es.length)+(fiche?" · "+tx("carte.un_cours"):"")));
  if(!fiche&&!qs.length&&!cs.length&&!es.length){
    act.appendChild(el("p","src",tx("carte.pas_contenu")));
    carBouton(act,tx("carte.ouvrir_matiere"),"sbtn",function(){carOuvrirMatiere(k);});
    return;
  }
  if(fiche)carBouton(act,tx("carte.lire_cours"),"sbtn",function(){carLire(k,th);});
  if(qs.length)carBouton(act,tnx("carte.entrainer",qs.length),"sbtn sbtn-2",function(){carEntrainer(k,th,f.p.nom);});
  if(cs.length){
    sec=el("div","carte-sec");sec.appendChild(el("p","eyebrow",tx("carte.cas")));
    cs.forEach(function(c){carBouton(sec,c.n,"chip",function(){carCas(k,c);});});
    act.appendChild(sec);
  }
  if(es.length){
    sec=el("div","carte-sec");sec.appendChild(el("p","eyebrow",tx("carte.exercices")));
    es.slice(0,12).forEach(function(e){carBouton(sec,e.t,"chip",function(){carExo(k,e.id);});});
    act.appendChild(sec);
  }
  carBouton(act,tx("carte.ouvrir_matiere"),"sbtn sbtn-2",function(){carOuvrirMatiere(k);});
}
function carMaj(){
  var f=CAR.foc||carFoyer(CAR.tEst),fil=$("carte-fil"),act=$("carte-act"),lis=$("carte-liste"),sep;
  clear(fil);clear(act);clear(lis);
  carBouton(fil,tx("carte.tous"),"link",carVueEnsemble);
  if(f.u){sep=el("span","sep","›");fil.appendChild(sep);carBouton(fil,f.u.nom,"link",function(){carVoler(1,f.u);});}
  if(f.s){sep=el("span","sep","›");fil.appendChild(sep);carBouton(fil,f.s.nom,"link",function(){carVoler(2,f.s);});}
  if(f.p){sep=el("span","sep","›");fil.appendChild(sep);carBouton(fil,f.p.nom,"link",function(){carVoler(3,f.p);});}
  if(f.p){
    carPanneauTheme(f,act);
  }else if(f.s){
    if(!f.s.pl.length)act.appendChild(el("p","src",tx("carte.pas_cours")));
    carBouton(act,tx("carte.ouvrir_matiere"),"sbtn",function(){carOuvrirMatiere(f.s.k);});
  }
  else if(f.u){carBouton(act,tx("carte.ouvrir_univers"),"sbtn",function(){carOuvrirUnivers(f.u.id);});}
  else if(!CAR.sc.u.length){carBouton(act,tx("carte.creer_premier"),"sbtn",function(){crOuvrir("univers",{depuis:"hub"});});}
  else{act.appendChild(el("p","src",tx("carte.gestes")));}
  /* les voisins du niveau : univers, systèmes ou planètes ; la planète regardée est marquée */
  if(!f.u){CAR.sc.u.forEach(function(U){carBouton(lis,U.nom,"chip",function(){carVoler(1,U);});});}
  else if(!f.s){f.u.s.forEach(function(S){carBouton(lis,S.nom,"chip",function(){carVoler(2,S);});});}
  else{f.s.pl.forEach(function(Q){var b=carBouton(lis,Q.nom,"chip",function(){carVoler(3,Q);});if(f.p===Q)b.setAttribute("aria-current","true");});}
  lis.hidden=!CAR.sc.u.length;
}

/* ---------- Pointeur, molette, clavier ---------- */
function carLoc(e){var r=CAR.cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
function carPtrBas(e){
  var c=CAR,p=carLoc(e),ids,a,b,mx,my;
  try{c.cv.setPointerCapture(e.pointerId);}catch(x){}
  c.ptr[e.pointerId]={x:p.x,y:p.y,t:Date.now()};
  ids=Object.keys(c.ptr);
  if(ids.length===2){
    c.vol=null;c.elan=null;c.clic=null;c.volCoupe=false;
    a=c.ptr[ids[0]];b=c.ptr[ids[1]];mx=(a.x+b.x)/2;my=(a.y+b.y)/2;
    if(!c.geste)c.geste=carGesteDebut();
    c.pinch={d:Math.max(10,Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y))),k:c.cam.k,mx:mx,my:my,
      w:{x:c.cam.x+(mx-c.W/2)/c.cam.k,y:c.cam.y+(my-c.H/2)/c.cam.k}};
  }else if(ids.length===1){
    c.elan=null;c.pinch=null;c.vit={x:0,y:0};
    c.clic={x:p.x,y:p.y,t:Date.now(),bouge:false};
  }
  carLancer();
}
function carPtrBouge(e){
  var c=CAR,p=c.ptr[e.pointerId],q,ids,a,b,mx,my,d,k,lo,hi,now=Date.now(),dt;
  if(!p)return;
  q=carLoc(e);
  ids=Object.keys(c.ptr);
  if(ids.length===2&&c.pinch){
    p.x=q.x;p.y=q.y;a=c.ptr[ids[0]];b=c.ptr[ids[1]];mx=(a.x+b.x)/2;my=(a.y+b.y)/2;
    d=Math.max(10,Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y)));
    lo=Math.max(carKMin(),c.pinch.k/8);hi=Math.min(carKMax(),c.pinch.k*8);
    /* amplifié : écarter les doigts de 2× zoome d'environ 3× ; le geste n'a pas besoin d'être grand */
    k=Math.max(lo,Math.min(hi,c.pinch.k*Math.pow(d/c.pinch.d,1.7)));
    c.cam.k=k;c.cam.x=c.pinch.w.x-(mx-c.W/2)/k;c.cam.y=c.pinch.w.y-(my-c.H/2)/k;
    c.pinch.mx=mx;c.pinch.my=my;
    carSuitRecale();carLancer();return;
  }
  if(ids.length===1&&c.clic){
    if(!c.clic.bouge&&Math.abs(q.x-c.clic.x)+Math.abs(q.y-c.clic.y)>8){
      c.clic.bouge=true;
      if(c.vol){c.vol=null;c.volCoupe=true;}
    }
    if(c.clic.bouge){
      dt=Math.max(1,now-p.t);
      carDeplacer(-(q.x-p.x)/c.cam.k,-(q.y-p.y)/c.cam.k);
      c.vit.x=0.7*c.vit.x+0.3*(q.x-p.x)/dt;c.vit.y=0.7*c.vit.y+0.3*(q.y-p.y)/dt;
    }
    p.x=q.x;p.y=q.y;p.t=now;carLancer();
  }
}
function carPtrLeve(e){
  var c=CAR,now=Date.now(),q,reste,pm,last=c.ptr[e.pointerId],g,w;
  delete c.ptr[e.pointerId];
  try{c.cv.releasePointerCapture(e.pointerId);}catch(x){}
  reste=Object.keys(c.ptr).length;
  if(c.pinch&&reste<2){
    pm={x:c.pinch.mx,y:c.pinch.my};c.pinch=null;c.clic=null;
    carFinGeste(pm.x,pm.y);
  }
  if(reste===0){
    if(c.clic&&!c.clic.bouge&&now-c.clic.t<450){
      q=c.clic;
      if(c.dbl&&now-c.dbl.t<350&&Math.abs(q.x-c.dbl.x)+Math.abs(q.y-c.dbl.y)<40){
        /* double toucher : on entre d'un niveau, vers le point touché */
        g=c.dbl.g;w=c.dbl.w;c.dbl=null;
        carPlonger(g,w);
      }else{
        c.dbl={x:q.x,y:q.y,t:now,g:carGesteDebut(),w:{x:c.cam.x+(q.x-c.W/2)/c.cam.k,y:c.cam.y+(q.y-c.H/2)/c.cam.k}};
        carToucher(q.x,q.y);
      }
    }else if(c.clic&&c.clic.bouge){
      if(c.volCoupe){c.volCoupe=false;carSnapNiveau();}
      else if(last&&now-last.t<90&&Math.abs(c.vit.x)+Math.abs(c.vit.y)>0.25)c.elan={vx:c.vit.x,vy:c.vit.y};
    }
    c.clic=null;
  }
  carLancer();
}
function carToucher(x,y){
  var best=null,ordre=["p","s","u"],i,j,h,d,bd;
  for(j=0;j<ordre.length&&!best;j++){
    bd=Infinity;
    for(i=0;i<CAR.hits.length;i++){
      h=CAR.hits[i];if(h.t!==ordre[j])continue;
      d=Math.sqrt((h.x-x)*(h.x-x)+(h.y-y)*(h.y-y));
      if(d<=h.r&&d<bd){bd=d;best=h;}
    }
  }
  if(!best)return;
  carVoler(best.t==="p"?3:best.t==="s"?2:1,best.ref);
}
/* Molette et pavé : on suit en direct ; un cran franc (ou une petite pause) fait le reste du voyage. Pendant le vol,
   les crans qui arrivent encore (inertie du pavé) sont ignorés. */
function carMolette(e){
  var c=CAR,p=carLoc(e),now=Date.now();
  e.preventDefault();
  if(now<c.molVerrou)return;
  if(!c.geste)c.geste=carGesteDebut();
  carZoomEn(p.x,p.y,Math.exp(-e.deltaY*(e.ctrlKey?0.012:0.0022)));
  clearTimeout(c.molT);
  if(Math.abs(Math.log(c.cam.k/c.geste.k0))>0.32){
    carFinGeste(p.x,p.y);
    c.molVerrou=now+(c.vol?c.vol.dur:400)+180;
    return;
  }
  c.molT=setTimeout(function(){carFinGeste(p.x,p.y);c.molVerrou=Date.now()+(CAR.vol?CAR.vol.dur*0.6:0);},200);
}
function carClavier(e){
  var c=CAR,st=60/c.cam.k;
  if(e.key==="+"||e.key==="="){carEtage(1);}
  else if(e.key==="-"||e.key==="_"){carEtage(-1);}
  else if(e.key==="ArrowLeft"){carDeplacer(-st,0);}
  else if(e.key==="ArrowRight"){carDeplacer(st,0);}
  else if(e.key==="ArrowUp"){carDeplacer(0,-st);}
  else if(e.key==="ArrowDown"){carDeplacer(0,st);}
  else if(e.key==="0"){carVueEnsemble();}
  else return;
  e.preventDefault();carLancer();
}

/* ---------- La boucle : la carte quand elle est ouverte, les aperçus quand ils sont affichés ---------- */
function carTaille(){
  var c=CAR,r=c.cv.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1),W=Math.max(1,Math.round(r.width)),H=Math.max(1,Math.round(r.height));
  c.dpr=d;c.W=W;c.H=H;c.cv.width=Math.round(W*d);c.cv.height=Math.round(H*d);
}
function carLancer(){if(!CAR.raf)CAR.raf=requestAnimationFrame(carBoucle);}
function carBoucle(){
  var c=CAR,now=Date.now(),dt=c.t?Math.min(0.1,(now-c.t)/1000):0.016,vis,apercu=false,lk,calme=cosMoinsDeMouvement();
  c.t=now;c.raf=0;
  /* le temps s'arrête quand une planète est regardée de près : la scène reste lisible, la planète sur son orbite */
  /* le temps des orbites ne s'écoule que dans un système (ou en vol) : dans un univers, les systèmes restent en place,
     sur une planète elle reste où elle est ; la galaxie, elle, continue de tourner doucement */
  if(!calme){c.tR+=dt;if(!c.frozen&&(c.vol||(c.foc&&carNiveau(c.foc)!==1)))c.tEst+=dt;}
  c.dtE=dt;
  if(c.sc)carMajPos(c.tEst);
  if(c.vol){carVolPas(now);}
  else{if(c.elan)carElanPas(dt*1000);if(c.suit)carSuitPas();}
  lk=Math.log(c.cam.k);c.vz=0.75*c.vz+0.25*((lk-c.lk)/Math.max(dt,0.001));c.lk=lk;
  c.apercus=c.apercus.filter(function(cv){return cv.isConnected;});
  c.apercus.forEach(function(cv){if(cv.offsetParent!==null){apercu=true;carApercu(cv,c.tEst);}});
  vis=ECRAN==="carte"&&c.cv&&c.cv.offsetParent!==null&&c.sc;
  if(vis){
    carDessiner(c.tEst);carMajFoyer();
    /* dans un univers, au repos : une image de plus pour ses systèmes (carPrepare) */
    if(!c.vol&&c.foc&&c.foc.u&&!c.foc.s)carPrepare(c.foc.u);
  }
  if(vis||c.vol){c.raf=requestAnimationFrame(carBoucle);}
  else if(apercu||c.apercus.length){c.raf=setTimeout(function(){c.raf=0;carLancer();},apercu?33:250);}
  else{c.t=0;}
}

/* ---------- Ouverture ---------- */
function carInit(){
  if(CAR_INIT)return;CAR_INIT=true;
  var cv=$("carte-cv");
  CAR.cv=cv;
  cv.addEventListener("pointerdown",carPtrBas);
  cv.addEventListener("pointermove",carPtrBouge);
  cv.addEventListener("pointerup",carPtrLeve);
  cv.addEventListener("pointercancel",carPtrLeve);
  cv.addEventListener("wheel",carMolette,{passive:false});
  cv.addEventListener("keydown",carClavier);
  /* Safari : pas de zoom de la page quand on pince la carte */
  ["gesturestart","gesturechange","gestureend"].forEach(function(n){cv.addEventListener(n,function(e){e.preventDefault();},{passive:false});});
  $("carte-plus").addEventListener("click",function(){carEtage(1);});
  $("carte-moins").addEventListener("click",function(){carEtage(-1);});
  $("carte-tout").addEventListener("click",carVueEnsemble);
  window.addEventListener("resize",function(){
    if(ECRAN!=="carte"||!CAR.sc)return;
    /* la vue d'ensemble dépend de la taille de la carte : si elle a changé, on la refait, puis on revient sur ce qu'on
       regardait (un vol en cours finit son chemin : sa cible est recalculée à chaque image) */
    var g=carGesteDebut(),W=CAR.W,H=CAR.H;
    carTaille();
    if(CAR.W!==W||CAR.H!==H){
      carDisposer(CAR.sc);carMajPos(CAR.tEst);
      if(!CAR.vol)carPoser(carDest(g.niv,g.e,CAR.tEst));
      CAR.pcx=null;
    }
    carLancer();
  });
}
/* La carte, posée sur un univers (uid) ou sur la vue globale */
function carteOuvrir(uid){
  var c,U=null;
  carInit();
  c=CAR;
  c.sc=carScene();
  c.cle="";c.foc=null;c.vol=null;c.suit=null;c.frozen=null;c.elan=null;c.geste=null;c.ptr={};c.pinch=null;c.clic=null;
  show("carte");
  c.cv=$("carte-cv");
  carTaille();
  carDisposer(c.sc);
  if(uid)c.sc.u.forEach(function(x){if(x.id===uid)U=x;});
  carMajPos(c.tEst);
  if(U)carPoser(carDest(1,U,c.tEst));else carPoser(carDest(0,null,c.tEst));
  c.lk=Math.log(c.cam.k);c.vz=0;c.pcx=null;
  c.foc=carFoyer(c.tEst);
  carMaj();
  carLancer();
}
