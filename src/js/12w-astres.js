/* ---------- Astres et ciel réalistes (v22) ----------
   Demande de l'auteur (10 nov.) : des astres et des étoiles « ultra réalistes ». Tout est dessiné par code, pixel par pixel,
   une seule fois, puis gardé en cache : aucune image à télécharger, l'app reste un seul fichier.
   - Ciel : étoiles de toutes magnitudes, teintées selon leur température (du bleu-blanc à l'orange), les plus brillantes avec
     halo et aigrettes de diffraction, une Voie lactée (bande, amas, bandes de poussière) ; deux couches pour la parallaxe.
   - Soleil : granulation, assombrissement du limbe, taches, puis couronne à filaments (calque séparé, additif).
   - Planètes : sphère éclairée (terminateur doux, limbe sombre, voile atmosphérique), surface propre à chaque type
     (bandes et tempête d'une géante gazeuse, glaces, désert rocheux, lune cratérisée), anneaux pour l'une.
   Le bruit est un bruit de valeur à plusieurs octaves (astFbm), déterministe : le même astre donne le même dessin. */
var AST={cache:{},sem:0};
var AST_ETOILES=[  /* une étoile par univers : orange, bleu-blanc, jaune, naine rouge */
  {l:["#D8532D","#F26A3F","#FF9A66","#FFD3A6","#FFF7E8"],cA:"#FF7D4B",cB:"#FFE6BF",lueur:"255,111,77"},
  {l:["#3D6FD8","#5C93F2","#9BC1FF","#D8E8FF","#F6FAFF"],cA:"#6FA0FF",cB:"#EAF3FF",lueur:"110,160,255"},
  {l:["#D99A1E","#F0B63A","#FFD36B","#FFEBB0","#FFFBEA"],cA:"#FFC24D",cB:"#FFF3CF",lueur:"255,196,80"},
  {l:["#A8261C","#D4402A","#F26B4A","#FFA283","#FFD9C9"],cA:"#E8502F",cB:"#FFC7B0",lueur:"232,80,47"},
  {l:["#9AA5B5","#C9D3E0","#EEF2F8","#FAFCFF","#FFFFFF"],cA:"#BFD2F2",cB:"#FFFFFF",lueur:"200,215,245"},
  {l:["#1E7A83","#37B7BD","#8AE6E2","#D2FBF6","#F5FFFD"],cA:"#5ED4D0",cB:"#E6FFFB",lueur:"94,212,208"},
  {l:["#B8456B","#E8708F","#FFA9B8","#FFDDE0","#FFF6F6"],cA:"#FF86A5",cB:"#FFE8EC",lueur:"255,134,165"},
  {l:["#C77A12","#EBA02E","#FFCB63","#FFE9AE","#FFFBEA"],cA:"#FFC24D",cB:"#FFF3D6",lueur:"255,194,77"}];
function astH(n){var s=Math.sin(n)*43758.5453;return s-Math.floor(s);}
function astBruit(x,y,s){
  var xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),k=s*74.7;
  var a=astH(xi*127.1+yi*311.7+k),b=astH((xi+1)*127.1+yi*311.7+k),c=astH(xi*127.1+(yi+1)*311.7+k),d=astH((xi+1)*127.1+(yi+1)*311.7+k);
  return a*(1-u)*(1-v)+b*u*(1-v)+c*(1-u)*v+d*u*v;
}
function astFbm(x,y,s,o){var a=.5,t=0,i;for(i=0;i<o;i++){t+=a*astBruit(x,y,s+i*3.1);x=x*2.03+17.3;y=y*2.03+9.1;a*=.5;}return t;}
function astMix(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function astHex(h){h=h.replace("#","");return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)];}
function astLisse(a,b,x){var t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
function astRampe(st,t){  /* st : [[position, [r,g,b]], …] */
  var i;t=Math.max(0,Math.min(1,t));
  for(i=0;i<st.length-1;i++){if(t<=st[i+1][0])return astMix(st[i][1],st[i+1][1],(t-st[i][0])/Math.max(1e-6,st[i+1][0]-st[i][0]));}
  return st[st.length-1][1];
}
function astGraine(s){var h=0,i;s=String(s);for(i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h%1000/10;}
function astToile(w,h){var c=document.createElement("canvas");c.width=w;c.height=h;return c;}

function astTemp(t){
  var st=[[155,176,255],[202,216,255],[255,244,234],[255,222,160],[255,190,110],[255,150,90]],f=Math.max(0,Math.min(.9999,t))*(st.length-1),i=Math.floor(f);
  return astMix(st[i],st[i+1],f-i);
}
function astCiel(W,H,sem){
  sem=sem||0;var cle="c"+W+"x"+H+":"+sem;if(AST.cache[cle])return AST.cache[cle];
  var far=astToile(W,H),near=astToile(W,H),f=far.getContext("2d"),n=near.getContext("2d"),g=11+sem*977,i,bright=[];
  function r(){g=(g*16807)%2147483647;return (g-1)/2147483646;}
  if(!f||!n)return {far:far,near:near,bright:[]};
  /* Voie lactée : bande inclinée, amas, poussière */
  var lw=Math.max(32,Math.round(W/5)),lh=Math.max(32,Math.round(H/5)),low=astToile(lw,lh),lx=low.getContext("2d"),id=lx.createImageData(lw,lh),d=id.data,py,qx,
      a=-.5+sem*.9,ca=Math.cos(a),sa=Math.sin(a),larg=Math.min(lw,lh)*.2;
  for(py=0;py<lh;py++){for(qx=0;qx<lw;qx++){
    var X=qx-lw*.55,Y=py-lh*.45,across=-sa*X+ca*Y,along=ca*X+sa*Y,band=Math.exp(-Math.pow(across/larg,2)),core=Math.exp(-Math.pow(across/(larg*.38),2));
    var cl=astFbm(qx*.09,py*.09,2+sem*5,4),dust=astFbm(qx*.07+9,py*.14,6+sem*3,4),v=band*(.35+.9*cl)*(1-Math.max(0,dust-.5)*1.9)*(.8+.5*Math.exp(-Math.pow(along/(lw*.5),2)));
    var col=astMix([120,135,175],[236,206,170],core*cl),o=(py*lw+qx)*4;
    d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=Math.max(0,Math.min(255,v*118));
  }}
  lx.putImageData(id,0,0);f.imageSmoothingEnabled=true;f.drawImage(low,0,0,W,H);
  /* Étoiles faibles, plus denses dans la bande */
  var nf=Math.round(Math.min(900,W*H/1800));
  for(i=0;i<nf;i++){
    var sx=r()*W,sy=r()*H,X2=sx-W*.55,Y2=sy-H*.45,ac=(-sa*X2+ca*Y2)/(Math.min(W,H)),dens=.35+.65*Math.exp(-Math.pow(ac/.25,2));
    if(r()>dens)continue;
    var m=Math.pow(r(),3.2),rad=.25+m*.85,tc=astTemp(.12+.8*Math.pow(r(),1.4)),al=.18+.6*m+.12*r();
    f.fillStyle="rgba("+Math.round(tc[0])+","+Math.round(tc[1])+","+Math.round(tc[2])+","+al.toFixed(2)+")";
    f.beginPath();f.arc(sx,sy,rad,0,6.2832);f.fill();
  }
  /* Étoiles brillantes : halo et aigrettes de diffraction */
  var nb=Math.round(Math.max(8,Math.min(26,W*H/52000)));
  for(i=0;i<nb;i++){
    var bx=r()*W,by=r()*H,mag=Math.pow(r(),1.8),rad2=.9+mag*1.7,tc2=astTemp(.05+.85*r()),cr=Math.round(tc2[0]),cg=Math.round(tc2[1]),cb=Math.round(tc2[2]),R2=rad2*(5+mag*9);
    var gr=n.createRadialGradient(bx,by,0,bx,by,R2);
    gr.addColorStop(0,"rgba("+cr+","+cg+","+cb+","+(.55+.3*mag).toFixed(2)+")");gr.addColorStop(.25,"rgba("+cr+","+cg+","+cb+",.16)");gr.addColorStop(1,"rgba("+cr+","+cg+","+cb+",0)");
    n.fillStyle=gr;n.beginPath();n.arc(bx,by,R2,0,6.2832);n.fill();
    if(mag>.25){
      var L=R2*(1.8+mag*2.2),k;
      for(k=0;k<2;k++){
        var gs=n.createLinearGradient(bx-(k?0:L),by-(k?L:0),bx+(k?0:L),by+(k?L:0));
        gs.addColorStop(0,"rgba("+cr+","+cg+","+cb+",0)");gs.addColorStop(.5,"rgba("+cr+","+cg+","+cb+","+(.35+.4*mag).toFixed(2)+")");gs.addColorStop(1,"rgba("+cr+","+cg+","+cb+",0)");
        n.fillStyle=gs;if(k)n.fillRect(bx-.5,by-L,1,2*L);else n.fillRect(bx-L,by-.5,2*L,1);
      }
    }
    n.fillStyle="rgba(255,255,255,.95)";n.beginPath();n.arc(bx,by,rad2*.62,0,6.2832);n.fill();
    bright.push({x:bx,y:by,r:R2*.55,p:r()*6.28,v:.5+r()*1.3,c:[cr,cg,cb]});
  }
  AST.cache[cle]={far:far,near:near,bright:bright};return AST.cache[cle];
}
/* Le ciel est un canvas fixe derrière toute l'app (#ciel). ox, oy : décalage de parallaxe en [-.5,.5] ; t : secondes */
function cielDessiner(ox,oy,t,sem){
  var cv=$("ciel");if(!cv)return;
  var dpr=Math.min(2,window.devicePixelRatio||1),W=Math.round(window.innerWidth*dpr),H=Math.round(window.innerHeight*dpr);
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
  var x=cv.getContext("2d");if(!x)return;
  var S=astCiel(W,H,sem===undefined?AST.sem:sem),mx=W*.018,my=H*.018,i,b;
  x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,W,H);
  x.drawImage(S.far,-ox*mx*1.2,-oy*my*1.2);
  x.drawImage(S.near,-ox*mx*2.6,-oy*my*2.6);
  for(i=0;i<S.bright.length;i++){  /* scintillement léger des plus brillantes */
    b=S.bright[i];var al=.1+.1*Math.sin(b.p+t*b.v);
    x.fillStyle="rgba("+b.c[0]+","+b.c[1]+","+b.c[2]+","+al.toFixed(3)+")";x.beginPath();x.arc(b.x-ox*mx*2.6,b.y-oy*my*2.6,b.r,0,6.2832);x.fill();
  }
}

/* Le ciel suit la fenêtre : si elle change de taille, il est redessiné aussitôt (sinon il s'arrête au bord de l'ancienne taille) */
(function(){var att=0;window.addEventListener("resize",function(){if(att)return;att=window.setTimeout(function(){att=0;try{cielDessiner(0,0,0,AST.sem);}catch(e){}},60);});})();
