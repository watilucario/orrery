/* ---------- Figures (v7.3) : schémas et graphiques des fiches et des énoncés ----------
   Demande de l'auteur (18 oct.) : « je suis très visuel » ; des schémas, des tableaux, des courbes, des camemberts dans les
   cours, et des tableaux dans les questions pleines de chiffres. Le contenu écrit « ::: <type> <titre> » … « ::: »
   (univers/README.md, « Figures ») ; packFigure (02) le lit avec les contrôles de build.py, figRendre le dessine.
   Six types : cascade (des SIG, de la CAF, de la trésorerie : chaque « = » tombe juste), bilan (deux colonnes de masses
   proportionnelles, et les écarts entre elles : FRNG, TN), barres (une à trois séries, N-1 et N), courbe (une à trois
   séries sur un axe, à l'échelle si l'axe est chiffré), camembert (parts d'un tout, 6 au plus), etapes (un enchaînement).
   Méthode du skill dataviz : traits fins, accent pour ce qui compte et gris pour le contexte, palette catégorielle
   --t0… en ordre fixe, texte toujours en couleur d'encre, légende dès deux séries, et sous chaque graphique le tableau
   de ses chiffres : aucune valeur n'est réservée au dessin. Tout le texte passe par des nœuds texte. */
/* Un montant de la figure, avec les décimales écrites dans le contenu (k ; sinon celles de la figure) et son unité */
function figVal(v,f,k){return nb(figFmt(v,k!=null?k:f?f.dec:null)+(f&&f.unite?" "+f.unite:""));}
function figRendre(f){
  if(f.type==="essai")return essaiRendre(f);
  var fig=el("figure","fig fig-"+f.type),c=el("div","fig-c");
  fig.appendChild(el("figcaption","fig-t",nb(f.titre)));
  fig.appendChild(c);
  if(FIG_DESSIN[f.type])FIG_DESSIN[f.type](f,c,fig);
  if(f.note)fig.appendChild(el("p","fig-n",nb(f.note)));
  var t=figTableau(f);
  if(t){var d=el("details","fig-tab");d.appendChild(el("summary",null,tx("fig.chiffres")));d.appendChild(t);fig.appendChild(d);}
  return fig;
}
/* « À toi » (v7.4) : une question à tenter avant de lire la solution, ses données, puis la réponse repliée sous
   « Voir la réponse ». Demande de l'auteur (18 oct.) : des fiches qui font chercher (effet test, docs/grille-cours.md). */
function essaiRendre(f){
  var fig=el("figure","fig fig-essai"),d=el("details","es-r"),r=el("div","cours es-rc");
  fig.appendChild(el("p","es-l",t("fig.a_toi")));
  fig.appendChild(coursInline(el("p","es-q"),f.titre));
  if((f.q||[]).some(function(l){return !!trim(l);}))fig.appendChild(coursMd(f.q.join("\n"),el("div","cours es-d")));
  d.appendChild(el("summary",null,t("fig.voir_reponse")));
  coursMd((f.r||[]).join("\n"),r);d.appendChild(r);fig.appendChild(d);
  return fig;
}
/* Lit une figure à partir de la ligne i (« ::: … ») : {n : le nœud, i : la ligne après « ::: »} */
function figDepuis(ls,i){
  var m=FIG_DEBUT.exec(ls[i]),corps=[],j=i+1;
  while(j<ls.length&&trim(ls[j])!==":::"){corps.push(ls[j]);j++;}
  return {n:figRendre(packFigure(m[1],trim(m[2]),corps).f),i:j+1};
}
/* Dessin qui dépend de la largeur (bilan, courbe) : refait quand la figure prend sa taille (écran caché au rendu) */
function figQuandVisible(box,fn){
  var w0=-1,ro=null;
  function go(){
    if(ro&&!document.body.contains(box)){ro.disconnect();return;}  /* figure retirée (autre fiche, autre question) */
    var w=box.clientWidth;if(w>0&&w!==w0){w0=w;fn(w);}
  }
  if(window.ResizeObserver){try{ro=new ResizeObserver(go);ro.observe(box);return;}catch(e){ro=null;}}
  setTimeout(go,0);window.addEventListener("resize",go);
}
function figLegende(noms,cls){
  var l=el("div","fig-leg");
  noms.forEach(function(n,k){var s=el("span","fig-leg-i "+cls[k]);s.appendChild(el("i","fig-sw"));s.appendChild(document.createTextNode(nb(n)));l.appendChild(s);});
  return l;
}
/* Couleur des séries : une seule = l'accent ; deux = avant (gris) et après (accent) ; trois = palette catégorielle */
function figSeries(n){return n<=1?["fig-sa"]:n===2?["fig-sg","fig-sa"]:["fig-s0","fig-s1","fig-s2"];}
function figPct(v,lo,hi){return (hi>lo?(v-lo)/(hi-lo)*100:0).toFixed(2)+"%";}
function figBarre(tr,a,b,lo,hi,cls){
  var i=el("i","fig-b "+cls);i.style.left=figPct(Math.min(a,b),lo,hi);i.style.width=figPct(lo+Math.abs(b-a),lo,hi);
  tr.appendChild(i);return i;
}
var FIG_DESSIN={
  /* Cascade : chaque ligne part du total précédent ; les « = » partent de zéro (les soldes, en accent) */
  cascade:function(f,c){
    var cur=0,seg=[],lo=0,hi=0;
    f.pas.forEach(function(p,k){
      var a,b;
      if(k===0||p.s==="="){a=0;b=p.v;}else{a=cur;b=p.s==="+"?cur+p.v:cur-p.v;}
      cur=b;seg.push([a,b]);lo=Math.min(lo,a,b);hi=Math.max(hi,a,b);
    });
    f.pas.forEach(function(p,k){
      var r=el("div","fig-cas-r"+(p.s==="="?" solde":k===0?" base":"")),h=el("div","fig-cas-h");
      h.appendChild(el("span","fig-cas-l",nb(p.l)));
      h.appendChild(el("span","fig-cas-v",(k&&p.s!=="="?(p.s==="+"?"+ ":"− "):"")+figVal(p.v,f,p.k)));
      r.appendChild(h);
      var tr=el("div","fig-tr");
      if(lo<0)tr.appendChild(el("i","fig-zero")).style.left=figPct(0,lo,hi);
      figBarre(tr,seg[k][0],seg[k][1],lo,hi,p.s==="="||k===0?"fig-sa":"fig-sg");
      r.appendChild(tr);c.appendChild(r);
    });
  },
  /* Barres horizontales, une à trois séries ; les valeurs sont écrites au bout de chaque ligne */
  barres:function(f,c){
    var n=Math.max(1,f.series.length),cls=figSeries(n),lo=0,hi=0,lk=0,lv=0;
    f.series.forEach(function(s){lk=Math.max(lk,s.length);});
    f.lignes.forEach(function(l){l.v.forEach(function(v,j){lv=Math.max(lv,figVal(v,f,l.k[j]).length);});});  /* même largeur de valeur partout : pistes alignées */
    f.lignes.forEach(function(l){l.v.forEach(function(v){lo=Math.min(lo,v);hi=Math.max(hi,v);});});
    if(n>1)c.appendChild(figLegende(f.series,cls));
    f.lignes.forEach(function(l){
      var g=el("div","fig-bar-g");g.appendChild(el("div","fig-bar-l",nb(l.l)));
      l.v.forEach(function(v,j){
        var r=el("div","fig-bar-r");
        if(n>1)r.appendChild(el("span","fig-bar-k",nb(f.series[j]))).style.width=Math.min(7.5,Math.max(2.2,lk*0.6))+"em";
        var tr=el("div","fig-tr");
        if(lo<0)tr.appendChild(el("i","fig-zero")).style.left=figPct(0,lo,hi);
        figBarre(tr,0,v,lo,hi,cls[j]);
        r.appendChild(tr);r.appendChild(el("span","fig-bar-v",figVal(v,f,l.k[j]))).style.width=(lv*0.62+0.2)+"em";g.appendChild(r);
      });
      c.appendChild(g);
    });
  },
  /* Bilan en grandes masses : deux colonnes de même hauteur sur une seule échelle verticale (figEchelle) : chaque masse
     à l'échelle de son montant, une petite masse agrandie juste assez pour son nom, et l'ordre des limites entre les deux
     colonnes toujours respecté. Une couleur par famille (cycle) ; au milieu, les écarts entre les limites des masses :
     FRNG = ressources stables − emplois stables, TN = trésorerie active − trésorerie passive. */
  bilan:function(f,c,fig){
    var fams=[],grille=el("div","fig-bil"),cols=[],mid=el("div","fig-bil-mid"),note=el("p","fig-n");
    f.g.concat(f.d).forEach(function(m){if(m.fam&&fams.indexOf(m.fam)<0)fams.push(m.fam);});
    if(f.cols){grille.appendChild(el("div","fig-bil-h",nb(f.cols[0])));grille.appendChild(el("div"));grille.appendChild(el("div","fig-bil-h",nb(f.cols[1])));}
    [f.g,f.d].forEach(function(ms,k){
      var col=el("div","fig-bil-col"),els=[];
      ms.forEach(function(m){
        if(!m.v){els.push(null);return;}
        var fi=fams.indexOf(m.fam),b=el("div","fig-bil-m "+(fi<0?"fig-cn":"fig-c"+Math.min(fi,7)));
        b.appendChild(el("span","fig-bil-l",nb(m.l)));b.appendChild(el("span","fig-bil-v",figVal(m.v,f,m.k)));
        b.setAttribute("title",nb(m.l+" : "+figVal(m.v,f,m.k)));
        col.appendChild(b);els.push(b);
      });
      cols.push({col:col,els:els,ms:ms});
      grille.appendChild(col);
      if(!k)grille.appendChild(mid);
    });
    [f.g,f.d].forEach(function(ms,k){var s=0;ms.forEach(function(m){s+=m.v;});grille.appendChild(el("div","fig-bil-tot",nb(t("fig.total_v",{v:figVal(s,f)}))));if(!k)grille.appendChild(el("div"));});
    c.appendChild(grille);
    note.hidden=true;fig.appendChild(note);
    function cumul(ms,n){var s=0,j;for(j=0;j<n;j++)s+=ms[j].v;return s;}
    var Y=null;
    /* Place les masses ; mesure : la hauteur du nom de chaque masse, une fois la figure visible (1 à 3 lignes) */
    function placer(mesure){
      var mins=cols.map(function(cl){return cl.els.map(function(e){if(!e)return 0;if(!mesure)return 52;e.style.height="auto";return Math.max(36,e.offsetHeight+2);});});
      var E=figEchelle([f.g.map(function(m){return m.v;}),f.d.map(function(m){return m.v;})],mins,300);
      Y=E.y;
      cols.forEach(function(cl,k){
        cl.col.style.height=E.H+"px";
        cl.els.forEach(function(e,j){if(!e)return;var a=Y(cumul(cl.ms,j)),b=Y(cumul(cl.ms,j+1));e.style.top=(a+1)+"px";e.style.height=Math.max(2,b-a-2)+"px";});
      });
      mid.style.height=E.H+"px";
      note.hidden=!E.agr;
      note.textContent=t("fig.note_bilan");
    }
    placer(false);
    figQuandVisible(grille,function(){
      placer(true);
      clear(mid);
      if(!f.ecarts.length)return;
      var w=mid.clientWidth||64,hh=mid.clientHeight,s=svgEl("svg",{width:w,height:hh,viewBox:"0 0 "+w+" "+hh,"aria-hidden":"true"},mid);
      f.ecarts.forEach(function(x){
        var y1=Y(cumul(f.g,x.n)),y2=Y(cumul(f.d,x.m)),xm=w/2,v=cumul(f.d,x.m)-cumul(f.g,x.n),ym=(y1+y2)/2,ht=Math.min(y1,y2);
        svgEl("path",{d:"M0,"+y1+"H"+xm+"V"+y2+"H"+w,"class":"fig-ec"},s);
        svgEl("circle",{cx:0,cy:y1,r:2.5,"class":"fig-ec-p"},s);svgEl("circle",{cx:w,cy:y2,r:2.5,"class":"fig-ec-p"},s);
        /* écart court : le nom et le montant au-dessus du trait ; sinon au milieu du trait vertical */
        var ya=Math.abs(y2-y1)<34?ht-19:ym-3;
        var t=svgEl("text",{x:xm,y:ya,"text-anchor":"middle","class":"fig-ec-t"},s);t.textContent=nb(x.l);
        var t2=svgEl("text",{x:xm,y:ya+13,"text-anchor":"middle","class":"fig-ec-v"},s);t2.textContent=figVal(v,f);
      });
    });
    if(f.ecarts.length){
      var ec=el("p","fig-n");
      ec.textContent=nb(f.ecarts.map(function(x){return x.l+" = "+figVal(cumul(f.d,x.m)-cumul(f.g,x.n),f);}).join(" · "));
      fig.appendChild(ec);
    }
  },
  /* Courbes sur un axe : à l'échelle si les repères de l'axe sont des nombres de même unité, sinon régulièrement espacés */
  courbe:function(f,c){
    var n=f.lignes.length,cls=n<=1?["fig-sa"]:["fig-s0","fig-s1","fig-s2"],ax=f.axe.map(function(a){return packNombre(a);});
    var num=ax.every(function(a,k){return a[0]!==null&&a[1]===ax[0][1]&&(k===0||a[0]>ax[k-1][0]);});
    var xs=f.axe.map(function(a,k){return num?(ax[k][0]-ax[0][0])/(ax[ax.length-1][0]-ax[0][0]):(f.axe.length>1?k/(f.axe.length-1):0);});
    var lo=Infinity,hi=-Infinity;
    f.lignes.forEach(function(l){l.v.forEach(function(v){lo=Math.min(lo,v);hi=Math.max(hi,v);});});
    if(lo>0&&lo<hi/2)lo=0;
    var tk=figTicks(lo,hi);lo=tk[0];hi=tk[tk.length-1];
    if(n>1)c.appendChild(figLegende(f.lignes.map(function(l){return l.l;}),cls));
    var box=el("div","fig-crb"),tip=el("div","ev-tip");tip.hidden=true;c.appendChild(box);c.appendChild(tip);
    figQuandVisible(box,function(W){
      clear(box);
      var H=210,PL=44,PR=46,PT=12,PB=26,w=W-PL-PR,h=H-PT-PB;
      function X(t){return PL+t*w;}function Y(v){return PT+(hi-v)/(hi-lo||1)*h;}
      var s=svgEl("svg",{width:W,height:H,viewBox:"0 0 "+W+" "+H,tabindex:"0",role:"img","aria-label":nb(f.titre)},box);
      tk.forEach(function(t){
        var y=Math.round(Y(t))+0.5;
        svgEl("line",{x1:PL,x2:PL+w,y1:y,y2:y,"class":t===0&&lo<0?"fig-zl":"ev-grid"},s);
        var tx=svgEl("text",{x:PL-6,y:y+4,"text-anchor":"end","class":"ev-ax"},s);tx.textContent=figVal(t,null);
      });
      f.axe.forEach(function(a,k){var tx=svgEl("text",{x:X(xs[k]),y:H-6,"text-anchor":k===0?"start":k===f.axe.length-1?"end":"middle","class":"ev-ax"},s);tx.textContent=nb(a);});
      var cross=svgEl("line",{x1:0,x2:0,y1:PT,y2:PT+h,"class":"ev-cross",visibility:"hidden"},s),dots=[];
      f.lignes.forEach(function(l,j){
        var d="";l.v.forEach(function(v,k){d+=(k?"L":"M")+X(xs[k]).toFixed(1)+","+Y(v).toFixed(1);});
        svgEl("path",{d:d,"class":"fig-ln "+cls[j]},s);
        l.v.forEach(function(v,k){svgEl("circle",{cx:X(xs[k]),cy:Y(v),r:3.5,"class":"fig-pt "+cls[j]},s);});
        var lt=svgEl("text",{x:X(1)+8,y:Y(l.v[l.v.length-1])+4,"class":"fig-lab"},s);lt.textContent=figVal(l.v[l.v.length-1],f,l.k[l.k.length-1]);
        dots.push(svgEl("circle",{cx:0,cy:0,r:5,"class":"fig-pt on "+cls[j],visibility:"hidden"},s));
      });
      svgEl("rect",{x:PL-8,y:0,width:w+16,height:H,"class":"ev-hit"},s);
      var sel=-1;
      function montrer(k){
        if(k<0||k>=f.axe.length)return;sel=k;var x=X(xs[k]);
        cross.setAttribute("x1",x);cross.setAttribute("x2",x);cross.setAttribute("visibility","visible");
        f.lignes.forEach(function(l,j){dots[j].setAttribute("cx",x);dots[j].setAttribute("cy",Y(l.v[k]));dots[j].setAttribute("visibility","visible");});
        clear(tip);tip.appendChild(el("b",null,nb(f.axe[k])));
        f.lignes.forEach(function(l){tip.appendChild(el("span",null,nb(l.l+" : "+figVal(l.v[k],f,l.k[k]))));});
        tip.hidden=false;
      }
      function cacher(){sel=-1;tip.hidden=true;cross.setAttribute("visibility","hidden");dots.forEach(function(d){d.setAttribute("visibility","hidden");});}
      function proche(e){var r=s.getBoundingClientRect(),px=(e.clientX-r.left)*(W/(r.width||W)),b=0,bd=1e9;xs.forEach(function(t,k){var d=Math.abs(X(t)-px);if(d<bd){bd=d;b=k;}});return b;}
      s.addEventListener("pointermove",function(e){montrer(proche(e));});
      s.addEventListener("pointerdown",function(e){montrer(proche(e));});
      s.addEventListener("pointerleave",function(e){if(e.pointerType==="mouse")cacher();});
      s.addEventListener("focus",function(){if(sel<0)montrer(f.axe.length-1);});
      s.addEventListener("blur",cacher);
      s.addEventListener("keydown",function(e){
        var k=sel<0?f.axe.length-1:sel;
        if(e.key==="ArrowLeft")k--;else if(e.key==="ArrowRight")k++;else if(e.key==="Escape"){cacher();return;}else return;
        e.preventDefault();montrer(Math.max(0,Math.min(f.axe.length-1,k)));
      });
    });
  },
  /* Camembert (anneau) : six parts au plus, la légende donne chaque montant et sa part */
  camembert:function(f,c){
    var tot=0,a0=-Math.PI/2,R=78,r=48,C=84,wrap=el("div","fig-cam");
    f.parts.forEach(function(p){tot+=p.v;});
    var s=svgEl("svg",{width:2*C,height:2*C,viewBox:"0 0 "+2*C+" "+2*C,role:"img","aria-label":nb(f.titre)},wrap);
    function pt(rr,a){return (C+rr*Math.cos(a)).toFixed(2)+","+(C+rr*Math.sin(a)).toFixed(2);}
    f.parts.forEach(function(p,k){
      var a1=a0+p.v/tot*2*Math.PI,g=a1-a0>Math.PI?1:0,d;
      if(f.parts.length===1||p.v===tot)d="M"+pt(R,0)+"A"+R+","+R+" 0 1,1 "+pt(R,Math.PI)+"A"+R+","+R+" 0 1,1 "+pt(R,0)+"Z";
      else d="M"+pt(R,a0)+"A"+R+","+R+" 0 "+g+",1 "+pt(R,a1)+"L"+pt(r,a1)+"A"+r+","+r+" 0 "+g+",0 "+pt(r,a0)+"Z";
      var seg=svgEl("path",{d:d,"class":"fig-part fig-s"+k},s);
      svgEl("title",{},seg).textContent=nb(p.l+" : "+figVal(p.v,f,p.k)+" ("+figFmt(p.v/tot*100,1)+" %)");
      a0=a1;
    });
    var t1=svgEl("text",{x:C,y:C+2,"text-anchor":"middle","class":"fig-cam-t"},s);t1.textContent=figVal(f.total!=null?f.total:tot,f);
    var t2=svgEl("text",{x:C,y:C+18,"text-anchor":"middle","class":"fig-cam-s"},s);t2.textContent=t("fig.total_bas");
    var lg=el("ul","fig-cam-l");
    f.parts.forEach(function(p,k){
      var li=el("li","fig-s"+k);li.appendChild(el("i","fig-sw"));
      var t=el("span","fig-cam-n",nb(p.l));li.appendChild(t);
      li.appendChild(el("b",null,nb(figFmt(p.v/tot*100,1)+" %")));
      li.appendChild(el("span","fig-cam-v",figVal(p.v,f,p.k)));
      lg.appendChild(li);
    });
    wrap.appendChild(lg);c.appendChild(wrap);
  },
  /* Écriture (v10.4) : le journal classique, une ligne par compte, les débits puis les crédits en retrait ; D et C en
     couleur (accent pour le débit, --t1 pour le crédit), et la lettre dit le sens : la couleur n'est jamais seule */
  ecriture:function(f,c){
    var t=el("table","fig-ecr"),tb=el("tbody");
    if(f.montants){var h=el("thead"),tr=el("tr");[tx("fig.ecr_compte"),tx("fig.ecr_libelle"),tx("fig.ecr_debit"),tx("fig.ecr_credit")].forEach(function(x,k){tr.appendChild(el("th",k>1?"num":null,x));});h.appendChild(tr);t.appendChild(h);}
    f.lignes.forEach(function(x){
      var tr=el("tr",x.s==="D"?"ecr-d":"ecr-c"),cp=el("td","ecr-cpt");
      cp.appendChild(el("span","ecr-s",x.s));cp.appendChild(el("span","ecr-n",nb(x.c)));
      cp.appendChild(coursInline(el("span","ecr-lib"),x.l));tr.appendChild(cp);  /* téléphone : le libellé sous le compte (CSS) */
      tr.appendChild(coursInline(el("td","ecr-l"),x.l));
      if(f.montants){tr.appendChild(el("td","num",x.s==="D"?figVal(x.v,f,x.k):""));tr.appendChild(el("td","num",x.s==="C"?figVal(x.v,f,x.k):""));}
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    var w=el("div","ecr-w");w.appendChild(t);c.appendChild(w);
  },
  /* Étapes : un enchaînement numéroté, du haut vers le bas */
  etapes:function(f,c){
    var ol=el("ol","fig-et");
    f.etapes.forEach(function(e,k){
      var li=el("li");li.appendChild(el("span","fig-et-n",String(k+1)));
      var d=el("div");d.appendChild(el("b",null,nb(e.t)));if(e.d)d.appendChild(el("span",null,nb(e.d)));
      li.appendChild(d);ol.appendChild(li);
    });
    c.appendChild(ol);
  }
};
/* Échelle verticale commune aux colonnes d'un bilan. Les limites des masses (montants cumulés, des deux colonnes)
   découpent l'axe en intervalles ; chacun reçoit d'abord sa part de H0 pixels, puis une masse trop basse pour son nom
   (mins) agrandit les intervalles qu'elle couvre. L'axe reste monotone : une limite plus basse en montant l'est aussi à
   l'écran, dans les deux colonnes. {y(montant cumulé) → pixels, H : hauteur totale, agr : une masse agrandie} */
function figEchelle(cols,mins,H0){
  var T=0,pts=[0],blocs=[],k,j,n,tour,agr=false;
  cols.forEach(function(vs){var s=0;vs.forEach(function(v){s+=v;pts.push(s);});T=Math.max(T,s);});
  pts.sort(function(a,b){return a-b;});
  pts=pts.filter(function(v,i){return i===0||v-pts[i-1]>1e-9;});
  n=pts.length-1;
  var p=[];for(k=0;k<n;k++)p.push(T?(pts[k+1]-pts[k])/T*H0:0);
  function idx(v){var b=0,d=1e18;pts.forEach(function(x,i){if(Math.abs(x-v)<d){d=Math.abs(x-v);b=i;}});return b;}
  cols.forEach(function(vs,c){var s=0;vs.forEach(function(v,j2){if(v)blocs.push({a:idx(s),b:idx(s+v),m:mins[c][j2]});s+=v;});});
  for(tour=0;tour<60;tour++){
    var bouge=false;
    blocs.forEach(function(bl){
      var h=0,dd=0;for(j=bl.a;j<bl.b;j++){h+=p[j];dd+=pts[j+1]-pts[j];}
      if(h+0.5>=bl.m)return;
      bouge=agr=true;
      for(j=bl.a;j<bl.b;j++)p[j]+=(bl.m-h)*(dd?(pts[j+1]-pts[j])/dd:1/(bl.b-bl.a));
    });
    if(!bouge)break;
  }
  var cum=[0];for(k=0;k<n;k++)cum.push(cum[k]+p[k]);
  return {H:Math.round(cum[n]),agr:agr,y:function(v){
    var i;for(i=0;i<n;i++){if(v<=pts[i+1]+1e-9){var t=pts[i+1]>pts[i]?(v-pts[i])/(pts[i+1]-pts[i]):0;return Math.round(cum[i]+t*p[i]);}}
    return Math.round(cum[n]);}};
}
/* Graduations « rondes » de lo à hi (4 à 6 traits), zéro compris s'il est dans l'intervalle */
function figTicks(lo,hi){
  if(hi===lo){hi=lo+1;}
  var brut=(hi-lo)/4,p=Math.pow(10,Math.floor(Math.log(brut)/Math.LN10)),m=brut/p,pas=(m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p,out=[],v;
  for(v=Math.floor(lo/pas)*pas;v<=hi+pas*1e-9;v+=pas)out.push(Math.round(v/pas)*pas);
  if(out[out.length-1]<hi)out.push(out[out.length-1]+pas);
  return out.map(function(x){return Math.round(x*1e6)/1e6;});
}
/* Le tableau des chiffres d'une figure, sous elle (accessibilité : aucune valeur réservée au dessin) */
function figTableau(f){
  var rows=[],head=null,k;
  if(f.type==="cascade"){head=[tx("fig.tab_ligne"),tx("fig.tab_montant")];f.pas.forEach(function(p,j){rows.push([(j===0||p.s==="="?(p.s==="="&&j?"= ":""):p.s==="+"?"+ ":"− ")+p.l,(j&&p.s==="-"?"− ":"")+figVal(p.v,f,p.k)]);});}
  else if(f.type==="bilan"){
    var cg=f.cols?f.cols[0]:tx("fig.tab_gauche"),cd=f.cols?f.cols[1]:tx("fig.tab_droite"),n=Math.max(f.g.length,f.d.length),sg=0,sd=0;
    head=[cg,tx("fig.tab_montant"),cd,tx("fig.tab_montant")];
    for(k=0;k<n;k++){var a=f.g[k],b=f.d[k];if(a)sg+=a.v;if(b)sd+=b.v;rows.push([a?a.l:"",a?figVal(a.v,f,a.k):"",b?b.l:"",b?figVal(b.v,f,b.k):""]);}
    rows.push([tx("fig.tab_total"),figVal(sg,f),tx("fig.tab_total"),figVal(sd,f)]);
  }
  else if(f.type==="barres"){head=[""].concat(f.series.length?f.series:[tx("fig.tab_valeur")]);f.lignes.forEach(function(l){rows.push([l.l].concat(l.v.map(function(v,j){return figVal(v,f,l.k[j]);})));});}
  else if(f.type==="courbe"){head=[""].concat(f.lignes.map(function(l){return l.l;}));f.axe.forEach(function(a,j){rows.push([a].concat(f.lignes.map(function(l){return figVal(l.v[j],f,l.k[j]);})));});}
  else if(f.type==="camembert"){var t=0;f.parts.forEach(function(p){t+=p.v;});head=[tx("fig.tab_part"),tx("fig.tab_montant"),"%"];f.parts.forEach(function(p){rows.push([p.l,figVal(p.v,f,p.k),figFmt(p.v/t*100,1)+" %"]);});rows.push([tx("fig.tab_total"),figVal(t,f),"100 %"]);}
  else return null;
  var w=el("div","cours-tw"),tb=el("table","cours-t"),th=el("thead"),tr=el("tr"),bd=el("tbody");
  function num(j){return j>0&&!(f.type==="bilan"&&j===2);}  /* colonnes de nombres, à droite */
  head.forEach(function(h,j){tr.appendChild(el("th",num(j)?"num":null,nb(h)));});
  th.appendChild(tr);tb.appendChild(th);
  rows.forEach(function(r){var x=el("tr",r[0]===tx("fig.tab_total")||/^= /.test(r[0])?"tot":null);r.forEach(function(v,j){x.appendChild(el("td",num(j)?"num":null,nb(v)));});bd.appendChild(x);});
  tb.appendChild(bd);w.appendChild(tb);
  return w;
}
