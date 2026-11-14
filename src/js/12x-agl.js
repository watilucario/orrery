/* ---------- Astres en WebGL (v23) ----------
   Demande de l'auteur (11 nov.) : des astres nets, éclairés par le soleil en direct. Soleil, couronne et planètes sont calculés
   par la carte graphique, pixel par pixel, à la résolution réelle de l'écran : plus d'escalier, plus d'image qui tourne.
   Aucune bibliothèque : un seul quad, trois programmes (étoile, couronne, planète), bruit de gradient 3D écrit pour le projet.
   Plan et réglages : docs/plan-v23-astres.md. Repère de la vue : x à droite, y vers le HAUT, z vers l'observateur.
   Crochet de test : si window.__astres_t est un nombre, il remplace le temps (secondes). */
var AGL={off:null,essai:false};
var AGL_V="attribute vec2 aP;uniform vec4 uRect;uniform vec2 uRes;void main(){vec2 p=uRect.xy+(aP*.5+.5)*uRect.zw;gl_Position=vec4(p/uRes*2.-1.,0.,1.);}";
var AGL_P="#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n";
var AGL_BRUIT=
"vec3 hach3(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return -1.+2.*fract(sin(p)*43758.5453123);}"+
"float bruit(vec3 p){vec3 i=floor(p),f=fract(p),u=f*f*f*(f*(f*6.-15.)+10.);"+
"float a=dot(hach3(i),f),b=dot(hach3(i+vec3(1.,0.,0.)),f-vec3(1.,0.,0.)),c=dot(hach3(i+vec3(0.,1.,0.)),f-vec3(0.,1.,0.)),d=dot(hach3(i+vec3(1.,1.,0.)),f-vec3(1.,1.,0.)),"+
"e=dot(hach3(i+vec3(0.,0.,1.)),f-vec3(0.,0.,1.)),g=dot(hach3(i+vec3(1.,0.,1.)),f-vec3(1.,0.,1.)),h=dot(hach3(i+vec3(0.,1.,1.)),f-vec3(0.,1.,1.)),k=dot(hach3(i+vec3(1.,1.,1.)),f-vec3(1.,1.,1.));"+
"return mix(mix(mix(a,b,u.x),mix(c,d,u.x),u.y),mix(mix(e,g,u.x),mix(h,k,u.x),u.y),u.z);}"+
"float fbm(vec3 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*bruit(p);p=p*2.02+vec3(13.1,7.7,5.3);a*=.5;}return s;}"+
"float fbm3(vec3 p){float s=0.,a=.5;for(int i=0;i<3;i++){s+=a*bruit(p);p=p*2.02+vec3(13.1,7.7,5.3);a*=.5;}return s;}";

/* Disque de l'étoile : plasma, granulation, filaments, taches, limbe assombri */
var AGL_FS_ETOILE=AGL_P+"uniform vec2 uC;uniform float uR,uTime,uSeed,uAlpha;uniform vec3 uT0,uT1,uT2,uT3,uT4;"+AGL_BRUIT+
"void main(){vec2 d=(gl_FragCoord.xy-uC)/uR;float r2=dot(d,d),r=sqrt(r2),px=1.5/uR;float m=1.-smoothstep(1.-px,1.+px*.5,r);"+
"if(m<=0.){gl_FragColor=vec4(0.);return;}"+
"float mu=sqrt(max(1.-r2,0.));vec3 n=vec3(d,mu);float a=uTime*.02+uSeed;"+
"vec3 q=vec3(n.x*cos(a)+n.z*sin(a),n.y,-n.x*sin(a)+n.z*cos(a));"+
"vec3 w=q*2.4+vec3(uSeed);vec3 fl=vec3(bruit(w+vec3(0.,0.,uTime*.05)),bruit(w+vec3(4.,1.,uTime*.05)),bruit(w+vec3(8.,2.,uTime*.05)));"+
"float big=fbm(q*3.+fl*1.3+uSeed),gran=bruit(q*24.+fl*2.+vec3(0.,0.,uTime*.25)),fine=bruit(q*60.+vec3(0.,uTime*.4,0.)),fil=pow(1.-abs(bruit(q*7.+fl*1.8)*2.),5.);"+
"float I=.56+.55*big+.16*gran+.07*fine+.22*fil;"+
"I*=1.-.5*smoothstep(.16,.26,fbm3(q*1.7+vec3(5.,2.,uSeed)));"+
"I*=1.-.62*(1.-mu)-.12*(1.-mu)*(1.-mu);"+
"vec3 c=mix(uT0,uT1,smoothstep(.0,.3,I));c=mix(c,uT2,smoothstep(.3,.58,I));c=mix(c,uT3,smoothstep(.58,.85,I));c=mix(c,uT4,smoothstep(.85,1.15,I));"+
"c+=uT2*.5*exp(-pow((1.-r)/.022,2.));c=1.-exp(-1.6*c);c=pow(c,vec3(1./2.2));gl_FragColor=vec4(c*m,m)*uAlpha;}";

/* Couronne : jets filamenteux et halo, ajoutés autour du disque */
var AGL_FS_COURONNE=AGL_P+"uniform vec2 uC;uniform float uR,uTime,uSeed,uFade,uAlpha;uniform vec3 uCa,uCb;"+AGL_BRUIT+
"void main(){vec2 d=(gl_FragCoord.xy-uC)/uR;float r=length(d),x=max(r-1.,0.),a=atan(d.y,d.x);vec3 pa=vec3(cos(a),sin(a),uSeed*.1);"+
"float s=clamp(.5+fbm3(pa*1.6+vec3(0.,0.,r*.55-uTime*.02))*1.6,0.,1.);"+
"float g=exp(-x*1.9)*(.22+.55*s*s)+exp(-x*5.5)*.55+exp(-x*16.)*.9;g*=smoothstep(.8,1.,r);g*=1.-smoothstep(uFade*.72,uFade,r);"+
"vec3 col=pow(mix(uCa,uCb,exp(-x*5.)),vec3(1./2.2));float gi=1.-exp(-1.7*g);gl_FragColor=vec4(col*gi,gi*.4)*uAlpha;}";

/* Planète : sphère éclairée en direct (terminateur, phases, croissant à contre-jour), surface propre à sa famille, anneaux */
var AGL_FS_PLANETE=AGL_P+"uniform vec2 uC;uniform float uR,uTime,uSeed,uAtmK,uAlpha,uRing;uniform int uType;uniform mat3 uM;uniform vec3 uL,uLc,uP0,uP1,uP2,uP3,uAtm,uRn,uRc;uniform vec4 uK;"+AGL_BRUIT+
"float hgt(vec3 q){return fbm(q*2.3+uSeed);}"+
"float ringD(float rho){float t=(rho-1.22)/1.1;if(t<0.||t>1.)return 0.;float e=smoothstep(0.,.04,t)*smoothstep(1.,.93,t);"+
"float b=.55+.45*bruit(vec3(t*38.,uSeed,1.))+.2*bruit(vec3(t*95.,uSeed,3.));return e*clamp(b,0.,1.)*mix(.12,1.,smoothstep(.012,.04,abs(t-.63)));}"+
"void main(){vec2 d=(gl_FragCoord.xy-uC)/uR;float r2=dot(d,d),r=sqrt(r2),px=1.5/uR;"+
"float md=1.-smoothstep(1.-px,1.+px*.5,r);vec3 pc=vec3(0.);float pa=0.;float contre=smoothstep(.1,-.7,uL.z);"+
"if(md>0.){vec3 n=vec3(d,sqrt(max(1.-r2,0.)));vec3 q=uM*n,Lo=uM*uL;vec3 nb=q;vec3 alb=uP1;float sea=0.,emit=0.,cloud=0.,lights=0.;"+
"if(uType==0){float land=fbm(q*1.7+uSeed)+uK.x;float lm=smoothstep(-.02,.03,land);vec3 oc=mix(uP0,uP1,smoothstep(-.35,0.,land));"+
"vec3 ln=mix(uP2,uP3,smoothstep(0.,.3,land+fbm3(q*6.)*.2));alb=mix(oc,ln,lm);sea=1.-lm;"+
"float ice=smoothstep(.72,.9,abs(q.y)+fbm3(q*5.)*.12);alb=mix(alb,vec3(.9,.95,1.),ice);sea*=1.-ice;"+
"float ca=uTime*.012;vec3 qc=vec3(q.x*cos(ca)+q.z*sin(ca),q.y,-q.x*sin(ca)+q.z*cos(ca));cloud=smoothstep(.02,.34,fbm(qc*3.1+uSeed)+.02)*uK.z*(1.-.4*ice);lights=lm*(1.-ice)*uK.w*smoothstep(.1,.5,fbm3(q*9.));}"+
"else if(uType==1){float h=hgt(q);alb=mix(uP0,uP1,smoothstep(-.1,.2,h));alb=mix(alb,uP2,smoothstep(.15,.4,h));float cr=0.;"+
"for(int i=0;i<7;i++){float fi=float(i);vec3 c=normalize(hach3(vec3(fi*1.7+uSeed,3.3,1.1)));float dd=acos(clamp(dot(q,c),-1.,1.));float rr=.07+.07*fract(sin(fi*12.9+uSeed)*43758.5);"+
"cr-=smoothstep(rr,rr*.6,dd)*.5;cr+=smoothstep(rr*.8,rr*1.05,dd)*smoothstep(rr*1.25,rr*1.05,dd)*.3;}"+
"alb*=1.+cr*.7;alb=mix(alb,uP3,smoothstep(uK.w,uK.w+.1,abs(q.y)));"+
"float e=.012;vec3 g=vec3(hgt(q+vec3(e,0.,0.))-h,hgt(q+vec3(0.,e,0.))-h,hgt(q+vec3(0.,0.,e))-h)/e;g-=q*dot(g,q);nb=normalize(q-.05*uK.x*g);}"+
"else if(uType==2){float wob=fbm3(vec3(q.x*2.,q.y*7.,q.z*2.)+uSeed)*.35;float b1=sin((q.y+wob*.35)*14.)*.5+.5,b2=sin((q.y+wob*.2)*31.)*.5+.5;"+
"float t=.55*b1+.3*b2+.35*fbm3(vec3(q.x*1.5,q.y*10.,q.z*1.5)+uSeed*2.)*uK.x;"+
"alb=mix(mix(uP0,uP1,smoothstep(.2,.5,t)),mix(uP2,uP3,smoothstep(.5,.85,t)),smoothstep(.45,.7,t));"+
"vec3 sc=normalize(vec3(cos(uSeed),-.35,sin(uSeed)));float dd=acos(clamp(dot(q,sc),-1.,1.));float st=smoothstep(.34,.1,dd)*uK.y;"+
"alb=mix(alb,mix(uP3,vec3(1.),.35),st*(.45+.4*fbm3(q*14.+uSeed)));}"+
"else if(uType==3){float t=.5+.35*fbm3(vec3(q.x*1.2,q.y*5.,q.z*1.2)+uSeed)+.12*sin(q.y*9.);alb=mix(mix(uP0,uP1,clamp(t,0.,1.)),uP2,smoothstep(.55,.9,t));"+
"alb=mix(alb,uP3,smoothstep(.55,.8,fbm3(vec3(q.x*.8,q.y*14.,q.z*.8)+uSeed))*uK.x*.5);}"+
"else{float h=hgt(q);alb=mix(uP0,uP1,smoothstep(-.2,.3,h));float cr=pow(1.-abs(fbm3(q*3.4+uSeed)*2.2),7.);emit=cr*(.7+.3*sin(uTime*.6+uSeed));"+
"float e=.012;vec3 g=vec3(hgt(q+vec3(e,0.,0.))-h,hgt(q+vec3(0.,e,0.))-h,hgt(q+vec3(0.,0.,e))-h)/e;g-=q*dot(g,q);nb=normalize(q-.05*uK.x*g);}"+
"float ndl=dot(nb,Lo),gndl=dot(q,Lo),w=.06+.2*uAtmK;float dif=clamp((ndl+w)/(1.+w),0.,1.)*smoothstep(-.12-w,.10,gndl);"+
"if(uRing>.5&&abs(dot(uL,uRn))>.04){float tt=-dot(n,uRn)/dot(uL,uRn);if(tt>0.){dif*=1.-.75*ringD(length(n+tt*uL));}}"+
"vec3 col=alb*(uLc*dif*1.15+vec3(.05,.06,.085));"+
"col=mix(col,uLc*dif*1.05,cloud*.9);"+
"vec3 hv=normalize(uL+vec3(0.,0.,1.));col+=uLc*sea*pow(max(dot(n,hv),0.),44.)*.55*dif;"+
"col+=vec3(1.,.82,.5)*lights*(1.-smoothstep(-.1,.12,gndl))*.9;"+
"col+=mix(uP2,uP3,.5)*emit*1.6;"+
"float fres=pow(1.-n.z,2.6);col+=uAtm*uLc*fres*uAtmK*(.12+.88*smoothstep(-.35,.5,gndl))*.9;"+
"col+=uAtm*uLc*pow(1.-n.z,5.)*contre*uAtmK*1.4;"+
"col=pow(1.-exp(-1.35*col),vec3(1./2.2));pc=col*md;pa=md;}"+
"float halo=0.;if(r>=1.&&r<1.5){float k=exp(-(r-1.)/(.03+.045*uAtmK))*uAtmK;float facing=smoothstep(-.3,.5,dot(d/r,uL.xy));halo=k*(.25+.55*facing+.7*contre)*(1.-smoothstep(1.3,1.5,r));}"+
"vec3 hc=pow(uAtm*uLc,vec3(1./2.2))*halo;"+
"float ra=0.,rz=0.;vec3 rc=vec3(0.);"+
"if(uRing>.5&&abs(uRn.z)>.05){rz=-(d.x*uRn.x+d.y*uRn.y)/uRn.z;vec3 p=vec3(d,rz);float rho=length(p);ra=ringD(rho);"+
"float tp=dot(p,uL);if(tp<0.){ra*=smoothstep(.93,1.05,length(p-tp*uL));}"+
"float lum=.3+.7*abs(dot(uL,uRn))+.4*contre;rc=pow(uRc*uLc*lum,vec3(1./2.2))*ra;}"+
"vec3 col2;float al2;"+
"if(rz>0.){col2=rc+pc*(1.-ra);al2=ra+pa*(1.-ra);}else{col2=pc+rc*(1.-pa);al2=pa+ra*(1.-pa);}"+
"col2+=hc*(1.-pa);al2=clamp(al2+halo*.6*(1.-pa),0.,1.);"+
"gl_FragColor=vec4(col2,al2)*uAlpha;}";

/* Galaxie : bras en spirale logarithmique, noyau, poussière, étoiles diffuses ; ajoutée au ciel (mélange additif) */
var AGL_FS_GALAXIE=AGL_P+"uniform vec2 uC;uniform float uR,uSeed,uAlpha,uAplat,uIncl,uSpin,uArms,uWind,uDet;uniform vec3 uCa,uCb;"+AGL_BRUIT+
"void main(){vec2 d=(gl_FragCoord.xy-uC)/uR;float ci=cos(uIncl),si=sin(uIncl);vec2 p=vec2(ci*d.x+si*d.y,-si*d.x+ci*d.y);p.y/=uAplat;"+
"float r=length(p);if(r>1.15){gl_FragColor=vec4(0.);return;}"+
"float a=atan(p.y,p.x)-uSpin;float arm=pow(.5+.5*cos(uArms*(a+uWind*log(r+.03))),2.2);"+
"float n=fbm3(vec3(p*5.,uSeed))*1.6+.5;float dens=arm*(.35+.9*n)*exp(-r*1.5)*(1.-smoothstep(.8,1.05,r));"+
"float core=exp(-r*11.)*1.3+exp(-r*3.5)*.16;float dust=smoothstep(.45,.75,fbm3(vec3(p*9.+3.,uSeed+4.)))*arm*.35;"+
"float spec=pow(max(bruit(vec3(p*70.*uDet,uSeed))+.5,0.),9.)*(arm*.9+.2)*exp(-r*1.6);"+
"vec3 col=(mix(uCa,uCb,clamp(r*1.6,0.,1.))*dens*1.5+vec3(1.,.9,.75)*core+vec3(1.)*spec*.8)*(1.-dust);"+
"float g=clamp(dens*1.2+core+spec*.6,0.,1.);col=1.-exp(-1.4*col);col=pow(col,vec3(1./2.2));gl_FragColor=vec4(col*g,g*.35)*uAlpha;}";
function aglHsl(h,s,l){h=((h%360)+360)%360/360;function f(n){var k=(n+h*12)%12,a=s*Math.min(l,1-l);return l-a*Math.max(-1,Math.min(k-3,Math.min(9-k,1)));}return [f(0),f(8),f(4)];}
/* Une galaxie : o = {x, y, r, teinte (0-360), bras, wind, incl, aplat, spin, seed, alpha} ; aglPosEtoile en donne les bras (pour y poser des étoiles) */
function aglGalaxie(C,o){
  var pg=C.pg.gal;if(!pg)return;aglUtiliser(C,pg,o.x,o.y,o.r*1.25);
  var ca=aglHsl(o.teinte||200,.7,.58),cb=aglHsl((o.teinte||200)+30,.55,.82),lin=function(c){return [Math.pow(c[0],2.2),Math.pow(c[1],2.2),Math.pow(c[2],2.2)];};
  aglU(C,pg,"uR","1f",o.r*C.dpr);aglU(C,pg,"uSeed","1f",o.seed||0);aglU(C,pg,"uAlpha","1f",o.alpha===undefined?1:o.alpha);aglU(C,pg,"uAplat","1f",Math.max(.2,o.aplat||.6));
  aglU(C,pg,"uIncl","1f",o.incl||0);aglU(C,pg,"uSpin","1f",o.spin||0);aglU(C,pg,"uArms","1f",Math.max(2,Math.round(o.bras||2)));aglU(C,pg,"uWind","1f",o.wind||1.4);aglU(C,pg,"uDet","1f",o.det||1);
  aglU(C,pg,"uCa","3f",lin(ca));aglU(C,pg,"uCb","3f",lin(cb));
  C.gl.drawArrays(C.gl.TRIANGLE_STRIP,0,4);
}
/* Position (pixels, repère de l'écran) de la j-ième étoile sur un bras d'une galaxie ; même géométrie que le shader */
function aglPosEtoile(o,j,m){
  var arms=Math.max(2,Math.round(o.bras||2)),r=.2+.4*(j+.5)/Math.max(1,m),k=j%arms,a=2*Math.PI*k/arms-(o.wind||1.4)*Math.log(r+.03)+(o.spin||0),
      px=r*Math.cos(a),py=r*Math.sin(a)*Math.max(.2,o.aplat||.6),ci=Math.cos(o.incl||0),si=Math.sin(o.incl||0);
  return {x:o.x+o.r*(ci*px-si*py),y:o.y+o.r*(-(si*px+ci*py))};
}

/* ---------- Ciel de l'étoile et archétypes ---------- */
function aglLin(h){var c=astHex(h);return [Math.pow(c[0]/255,2.2),Math.pow(c[1]/255,2.2),Math.pow(c[2]/255,2.2)];}
var AGL_ARCH=[
  {f:0,p:["#0A2550","#1E6DB0","#3F7A3C","#B59A66"],atm:"#7DB4FF",ak:1,k:[0,0,1,1]},
  {f:1,p:["#4A2014","#A8502A","#DFA070","#F4EAE3"],atm:"#F0B088",ak:.45,k:[.9,.5,.5,.86]},
  {f:3,p:["#0B4A56","#2CA39C","#A5EBD9","#FFFFFF"],atm:"#9FFBEA",ak:1,k:[1,0,0,0]},
  {f:2,p:["#9C7A44","#C9A765","#E8D3A0","#F6EACB"],atm:"#FFE6AE",ak:.6,k:[.55,0,0,0],ring:"#D9C7A0"},
  {f:2,p:["#6B2848","#C85C90","#EFB0CB","#FFE6F0"],atm:"#FFBEDA",ak:.7,k:[1,1,0,0]},
  {f:0,p:["#053434","#168477","#1D6A2A","#73A23C"],atm:"#98F0BE",ak:1,k:[.14,0,1.25,0]},
  {f:2,p:["#241A5E","#5A49CC","#A294EF","#E6DFFF"],atm:"#B6A6FF",ak:.9,k:[.8,1,0,0]},
  {f:4,p:["#140B0A","#3B1D17","#FF4A12","#FFD27A"],atm:"#FF6A3A",ak:.55,k:[1,0,0,0]},
  /* 8 à 15 : les teintes rayées de l'agenda ont leurs propres astres (demande de l'auteur) */
  {f:3,p:["#0A1E5A","#2F5BD8","#7EA2F5","#EAF1FF"],atm:"#8FB4FF",ak:1,k:[.8,0,0,0]},
  {f:1,p:["#2A2A2C","#6E6C68","#B9B5AB","#EDEAE2"],atm:"#B9B5AB",ak:.12,k:[.8,.9,.3,1.3]},
  {f:3,p:["#5C86B0","#A9CBE6","#E3F1FF","#FFFFFF"],atm:"#CFE8FF",ak:.9,k:[.6,0,0,0]},
  {f:2,p:["#6B3F22","#B87B46","#E8C99B","#FFF1D8"],atm:"#FFD9A6",ak:.55,k:[.9,1,0,0]},
  {f:0,p:["#1B1450","#5436B8","#8E5BA8","#D6B6C8"],atm:"#B79BFF",ak:1,k:[.05,0,1,.9]},
  {f:2,p:["#5A2216","#A8472B","#E0956C","#F7D8BE"],atm:"#FFB894",ak:.5,k:[.7,0,0,0],ring:"#E8B99A"},
  {f:3,p:["#06454A","#17A8A8","#8EEDE4","#F2FFFC"],atm:"#9FFBEA",ak:1,k:[1,0,0,0]},
  {f:1,p:["#5E3A0E","#C48A2A","#F0CC7A","#FFF6DC"],atm:"#FFE0A0",ak:.4,k:[.8,.6,.4,1.3]}];
/* L'astre d'une matière suit la couleur de la matière (teinte 0-15, matCouleur) : le même partout dans l'app */
function astArchetype(teinte){var t=Math.max(0,teinte|0)%AGL_ARCH.length,a=AGL_ARCH[t];
  if(!a.lin)a.lin={p:a.p.map(aglLin),atm:aglLin(a.atm),ring:a.ring?aglLin(a.ring):null};
  return a;}
/* Couleurs d'une étoile : rampe du disque (5 arrêts, en linéaire), couronne, lumière reçue par les planètes */
function astEtoile(vi){var E=AST_ETOILES[(vi||0)%AST_ETOILES.length];
  if(!E.lin){var w=[1,1,1],b=aglLin(E.cB);E.lin={t:E.l.map(aglLin),ca:aglLin(E.cA),cb:b,lum:[b[0]*.7+.3,b[1]*.7+.3,b[2]*.7+.3]};}
  return E.lin;}

/* ---------- Contexte ---------- */
function aglCompiler(gl,type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){try{console.error("Astres : shader refusé\n"+gl.getShaderInfoLog(s));}catch(e){}return null;}return s;}
function aglProgramme(gl,fs){var v=aglCompiler(gl,gl.VERTEX_SHADER,AGL_V),f=aglCompiler(gl,gl.FRAGMENT_SHADER,fs);if(!v||!f)return null;
  var p=gl.createProgram();gl.attachShader(p,v);gl.attachShader(p,f);gl.bindAttribLocation(p,0,"aP");gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){try{console.error("Astres : programme refusé\n"+gl.getProgramInfoLog(p));}catch(e){}return null;}
  return {p:p,u:{}};}
function aglMontage(C){var gl=C.gl;
  C.pg={etoile:aglProgramme(gl,AGL_FS_ETOILE),cor:aglProgramme(gl,AGL_FS_COURONNE),pl:aglProgramme(gl,AGL_FS_PLANETE),gal:aglProgramme(gl,AGL_FS_GALAXIE)};
  C.buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,C.buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  C.ok=!!(C.pg.etoile&&C.pg.cor&&C.pg.pl&&C.pg.gal);}
function aglCreer(cv){
  var gl=null;
  try{gl=cv.getContext("webgl",{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false})||cv.getContext("experimental-webgl");}catch(e){gl=null;}
  if(!gl)return null;
  var C={gl:gl,cv:cv,W:1,H:1,dpr:1,ok:false,perdu:false};
  aglMontage(C);if(!C.ok)return null;
  cv.addEventListener("webglcontextlost",function(e){e.preventDefault();C.perdu=true;},false);
  cv.addEventListener("webglcontextrestored",function(){C.perdu=false;aglMontage(C);},false);
  return C;
}
function aglTaille(C,w,h,dpr){C.W=w;C.H=h;C.dpr=dpr;var cv=C.cv,pw=Math.max(1,Math.round(w*dpr)),ph=Math.max(1,Math.round(h*dpr));
  if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph;}C.gl.viewport(0,0,pw,ph);}
function aglDebut(C){var gl=C.gl;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);}
function aglUtiliser(C,pg,x,y,half){
  var gl=C.gl;gl.useProgram(pg.p);gl.bindBuffer(gl.ARRAY_BUFFER,C.buf);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  var d=C.dpr,X=x*d,Y=(C.H-y)*d,H=half*d;
  aglU(C,pg,"uRect","4f",[X-H,Y-H,2*H,2*H]);aglU(C,pg,"uRes","2f",[C.cv.width,C.cv.height]);aglU(C,pg,"uC","2f",[X,Y]);
}
function aglU(C,pg,nom,t,v){var gl=C.gl,l=pg.u[nom];if(l===undefined){l=pg.u[nom]=gl.getUniformLocation(pg.p,nom);}if(l===null)return;
  if(t==="1f")gl.uniform1f(l,v);else if(t==="1i")gl.uniform1i(l,v);else if(t==="2f")gl.uniform2f(l,v[0],v[1]);else if(t==="3f")gl.uniform3f(l,v[0],v[1],v[2]);
  else if(t==="4f")gl.uniform4f(l,v[0],v[1],v[2],v[3]);else if(t==="m3")gl.uniformMatrix3fv(l,false,new Float32Array(v));}
function aglTemps(t){return (typeof window.__astres_t==="number")?window.__astres_t:t;}

/* Disque de l'étoile (x, y : centre en pixels CSS depuis le coin haut gauche ; r : rayon) */
function aglEtoile(C,o){
  var pg=C.pg.etoile,E=astEtoile(o.etoile);aglUtiliser(C,pg,o.x,o.y,o.r*1.06);
  aglU(C,pg,"uR","1f",o.r*C.dpr);aglU(C,pg,"uTime","1f",aglTemps(o.t||0));aglU(C,pg,"uSeed","1f",o.graine||0);aglU(C,pg,"uAlpha","1f",o.alpha===undefined?1:o.alpha);
  for(var i=0;i<5;i++)aglU(C,pg,"uT"+i,"3f",E.t[i]);
  C.gl.drawArrays(C.gl.TRIANGLE_STRIP,0,4);
}
function aglCouronne(C,o){
  var pg=C.pg.cor,E=astEtoile(o.etoile),fade=o.fondu||2.8;aglUtiliser(C,pg,o.x,o.y,o.r*fade);
  aglU(C,pg,"uR","1f",o.r*C.dpr);aglU(C,pg,"uTime","1f",aglTemps(o.t||0));aglU(C,pg,"uSeed","1f",o.graine||0);aglU(C,pg,"uFade","1f",fade);aglU(C,pg,"uAlpha","1f",o.alpha===undefined?1:o.alpha);
  aglU(C,pg,"uCa","3f",E.ca);aglU(C,pg,"uCb","3f",E.cb);
  C.gl.drawArrays(C.gl.TRIANGLE_STRIP,0,4);
}
/* Matrice objet → vue : V = Rz(roulis)·Rx(inclinaison)·Ry(rotation) ; renvoie V (3 rangées) */
function aglMat(rot,incl,roulis){
  function mul(a,b){var r=[],i,j,k;for(i=0;i<3;i++)for(j=0;j<3;j++){var s=0;for(k=0;k<3;k++)s+=a[i*3+k]*b[k*3+j];r.push(s);}return r;}
  var cy=Math.cos(rot),sy=Math.sin(rot),cx=Math.cos(incl),sx=Math.sin(incl),cz=Math.cos(roulis),sz=Math.sin(roulis);
  return mul([cz,-sz,0,sz,cz,0,0,0,1],mul([1,0,0,0,cx,-sx,0,sx,cx],[cy,0,sy,0,1,0,-sy,0,cy]));
}
/* Planète : o = {x, y, r, arch (0-7), graine, rot, roulis, k (aplatissement de l'orbite), L:[x,y,z] vers le soleil, lum:[r,g,b], t, alpha} */
function aglPlanete(C,o){
  var pg=C.pg.pl,A=astArchetype(o.arch),ring=!!A.lin.ring,V=aglMat(o.rot||0,Math.asin(Math.min(.95,o.k||.3))*.8,o.roulis||0),
      L=o.L||[-.56,.48,.68],n=Math.sqrt(L[0]*L[0]+L[1]*L[1]+L[2]*L[2])||1,lum=o.lum||[1,.97,.92];
  aglUtiliser(C,pg,o.x,o.y,o.r*(ring?2.5:1.55));
  aglU(C,pg,"uR","1f",o.r*C.dpr);aglU(C,pg,"uTime","1f",aglTemps(o.t||0));aglU(C,pg,"uSeed","1f",(o.graine||0)%97);aglU(C,pg,"uAlpha","1f",o.alpha===undefined?1:o.alpha);
  aglU(C,pg,"uType","1i",A.f);aglU(C,pg,"uM","m3",V);aglU(C,pg,"uL","3f",[L[0]/n,L[1]/n,L[2]/n]);aglU(C,pg,"uLc","3f",lum);
  for(var i=0;i<4;i++)aglU(C,pg,"uP"+i,"3f",A.lin.p[i]);
  aglU(C,pg,"uAtm","3f",A.lin.atm);aglU(C,pg,"uAtmK","1f",A.ak);aglU(C,pg,"uK","4f",A.k);
  aglU(C,pg,"uRing","1f",ring?1:0);aglU(C,pg,"uRn","3f",[V[1],V[4],V[7]]);aglU(C,pg,"uRc","3f",ring?A.lin.ring:[0,0,0]);
  C.gl.drawArrays(C.gl.TRIANGLE_STRIP,0,4);
}

/* ---------- Une planète dans un canvas 2D ordinaire (Réviser, panneau des univers, visite) ----------
   Un contexte WebGL hors écran partagé dessine l'astre, puis l'image est copiée : pas de contexte par vignette. */
function astVignette(cv2,o){
  var px=cv2.width,x2=cv2.getContext("2d"),A=astArchetype(o.arch),ring=!!A.lin.ring;
  if(!AGL.essai){AGL.essai=true;var c=document.createElement("canvas");AGL.off=aglCreer(c);}
  if(!x2)return;
  x2.clearRect(0,0,px,px);
  if(!AGL.off){  /* sans WebGL : un disque ombré */
    var p=astHex(A.p[1]),g=x2.createRadialGradient(px*.38,px*.34,px*.04,px*.5,px*.5,px*.5);g.addColorStop(0,"rgb("+Math.min(255,p[0]+70)+","+Math.min(255,p[1]+70)+","+Math.min(255,p[2]+70)+")");g.addColorStop(1,"rgb("+(p[0]>>2)+","+(p[1]>>2)+","+(p[2]>>2)+")");
    x2.fillStyle=g;x2.beginPath();x2.arc(px/2,px/2,px*.38,0,6.2832);x2.fill();return;}
  var dpr=Math.min(2,window.devicePixelRatio||1),S=Math.round(px/dpr),C=AGL.off;
  aglTaille(C,S,S,dpr);aglDebut(C);
  aglPlanete(C,{x:S/2,y:S/2,r:S/2/(ring?2.45:1.34),arch:o.arch,graine:o.graine,rot:o.rot,roulis:o.roulis,k:o.k||.3,L:o.L||[-.56,.48,.68],lum:o.lum,t:o.t||0});
  x2.drawImage(C.cv,0,0,px,px);
}

/* Une étoile (avec sa couronne) dans un canvas 2D : pastille d'univers, panneau, visite. o = {vi : numéro d'étoile} */
function astVignetteEtoile(cv2,o){
  var px=cv2.width,x2=cv2.getContext("2d");if(!x2)return;
  if(!AGL.essai){AGL.essai=true;var c=document.createElement("canvas");AGL.off=aglCreer(c);}
  x2.clearRect(0,0,px,px);
  if(!AGL.off){var E=AST_ETOILES[(o.vi||0)%AST_ETOILES.length],g=x2.createRadialGradient(px/2,px/2,px*.05,px/2,px/2,px*.42);g.addColorStop(0,E.l[4]);g.addColorStop(.55,E.l[2]);g.addColorStop(1,"rgba(0,0,0,0)");x2.fillStyle=g;x2.fillRect(0,0,px,px);return;}
  var dpr=Math.min(2,window.devicePixelRatio||1),S=Math.round(px/dpr),C=AGL.off,r=S/2/2.15;
  aglTaille(C,S,S,dpr);aglDebut(C);
  aglCouronne(C,{x:S/2,y:S/2,r:r,etoile:o.vi||0,t:o.t||0,graine:o.vi||0,fondu:2.15});
  aglEtoile(C,{x:S/2,y:S/2,r:r,etoile:o.vi||0,t:o.t||0,graine:(o.vi||0)*3.1});
  x2.drawImage(C.cv,0,0,px,px);
}
function astVignetteGalaxie(cv2,o){
  var px=cv2.width,x2=cv2.getContext("2d");if(!x2)return;
  if(!AGL.essai){AGL.essai=true;var c=document.createElement("canvas");AGL.off=aglCreer(c);}
  x2.clearRect(0,0,px,px);
  if(!AGL.off){var g=x2.createRadialGradient(px/2,px/2,px*.03,px/2,px/2,px*.45);g.addColorStop(0,"rgba(255,240,215,.95)");g.addColorStop(.4,"rgba(150,175,230,.5)");g.addColorStop(1,"rgba(0,0,0,0)");x2.fillStyle=g;x2.fillRect(0,0,px,px);return;}
  var dpr=Math.min(2,window.devicePixelRatio||1),S=Math.round(px/dpr),C=AGL.off,gp=o.cle!==undefined?galParams(o.cle,0):car2Galaxie(o.vi||0);
  aglTaille(C,S,S,dpr);aglDebut(C);
  aglGalaxie(C,{x:S/2,y:S/2,r:S/2*.98,teinte:gp.teinte,bras:gp.bras,wind:gp.wind,incl:gp.incl,aplat:Math.min(.8,gp.aplat+.12),seed:gp.seed,spin:gp.spin0});
  x2.drawImage(C.cv,0,0,px,px);
}
/* Galaxie tirée d'un nom (aperçu de « Créer un univers ») */
function astGalaxieNom(nom,cssPx){
  var cv=document.createElement("canvas"),dp=Math.min(2,window.devicePixelRatio||1);cv.width=cv.height=Math.round(cssPx*dp);cv.style.width=cv.style.height=cssPx+"px";
  cv.className="cos-vig-e";cv.setAttribute("aria-hidden","true");astVignetteGalaxie(cv,{cle:nom});return cv;
}
/* Pastille d'un univers : sa galaxie (la même que sur la carte) */
function astEtoileCanvas(u,cssPx){
  var cv=document.createElement("canvas"),dp=Math.min(2,window.devicePixelRatio||1);cv.width=cv.height=Math.round(cssPx*dp);cv.style.width=cv.style.height=cssPx+"px";
  cv.className="cos-vig-e";cv.setAttribute("aria-hidden","true");astVignetteGalaxie(cv,{vi:Math.max(0,UNIVERS.indexOf(u))});return cv;
}
