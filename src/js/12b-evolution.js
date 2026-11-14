/* ---------- Progrès (v2.4 ; lisible en v6.3) : le journal du jour en graphiques, les simulations face aux objectifs ----------
   v6.3 : le chiffre vedette se dit en phrase (« si on t'interrogeait maintenant… ») et se décompose en « vu » (part des
   questions déjà vues) × « retenu » (mémoire moyenne sur celles-là) ; « Prêt pour l'examen ? » relie objectif, dernière
   simulation et rythme ; une liste déroulante pour la matière, la période ne règle que l'activité ; le détail d'un jour
   s'écrit sous le graphique ; une seule note repliée explique le calcul.
   Données d'une matière, lues sans l'activer : SRS.days (n réponses, sec secondes de travail, et depuis la v2.3 ok justes,
   r rappel moyen en millièmes), les notes des simulations (<préfixe>simh) et les examens du profil.
   Graphiques en SVG dans la page : une seule série par graphique, couleur d'accent, traits fins, infobulle au survol, au
   toucher et au clavier (flèches), et le tableau des chiffres en dessous : aucune valeur n'est réservée à l'infobulle. */
var EV={k:null,per:30,back:"hub",rt:null},EV_PER=[7,30,90],SVGNS="http://www.w3.org/2000/svg";
function svgEl(tag,a,parent){var e=document.createElementNS(SVGNS,tag),k;for(k in a){if(a.hasOwnProperty(k))e.setAttribute(k,a[k]);}if(parent)parent.appendChild(e);return e;}
function evMats(){return univPrets();}  /* l'univers ouvert (08b) */
function evDonnees(k){
  var M=MATS[k],act=MAT&&MAT.k===k,s=act?SRS:load(M.pre+"srs",null),h=act?SIMH:asArray(load(M.pre+"simh",[])).filter(simhValide);
  return {k:k,M:M,days:(s&&s.days&&typeof s.days==="object")?s.days:{},items:(s&&s.items&&typeof s.items==="object")?s.items:{},simh:h};
}
function evADonnees(k){var D=evDonnees(k),d;for(d in D.days){if(D.days.hasOwnProperty(d)&&D.days[d].n)return true;}return D.simh.length>0;}
/* Mémoire du cours un jour donné : moyenne du rappel de chaque question (0 si jamais vue), comme r dans le journal */
function evRappel(D,day){
  var ids=D.M.Q.filter(function(q){return !q.cas;}),s=0;
  if(!ids.length)return 0;
  ids.forEach(function(q){var it=D.items[q.id];if(it&&typeof it.s==="number")s+=fR(Math.max(0,day-it.last),it.s);});
  return s/ids.length;
}
function evDuree(sec){var m=Math.round(sec/60);return m<1?(sec?t("evo.duree_moins"):t("evo.duree_min",{n:0})):m<60?t("evo.duree_min",{n:m}):t("evo.duree_hm",{h:Math.floor(m/60),m:(m%60<10?"0":"")+(m%60)});}
function evJourCourt(d){var x=new Date(d*864e5);return x.getUTCDate()+" "+MOIS[x.getUTCMonth()];}
function evSigne(x,u){return (x>0?"+":x<0?"−":"")+fmtNote(Math.abs(x))+(u||"");}
function evNiceMax(m){
  if(m<=4)return 4;
  var p=Math.pow(10,Math.floor(Math.log(m)/Math.LN10)),c=[1,2,3,4,6,8,10],i,v;
  for(i=0;i<c.length;i++){v=c[i]*p;if(v>=m&&v%2===0)return v;}
  return 10*p;
}

/* ---------- Ouverture, matière, période ---------- */
function openEvol(back){
  var ms=evMats();
  EV.back=back||"hub";NAV_PRE.evol=EV.back;EV.k=ms.indexOf(MAT.k)>=0?MAT.k:(ms[0]||null);
  show("evol");renderEvol();
}
function evRetour(){if(EV.back==="home"){renderHome();show("home");}else{renderHub();show("hub");}}
window.addEventListener("resize",function(){
  if($("evol").hidden)return;
  if(EV.rt)clearTimeout(EV.rt);
  EV.rt=setTimeout(function(){EV.rt=null;if(!$("evol").hidden)renderEvol();},150);
});
function evChip(txt,sel,fn){var b=el("button","chip"+(sel?" sel":""),txt);b.type="button";b.setAttribute("aria-pressed",sel?"true":"false");b.addEventListener("click",fn);return b;}
$("ev-mat").addEventListener("change",function(){EV.k=$("ev-mat").value;renderEvol();});
function renderEvol(){
  var ms=evMats(),body=$("evol-body"),sel=$("ev-mat");
  clear(body);clear($("progress"));clear(sel);
  carnetBouton($("ev-carnet"),"evol");  /* v16 (12o) */
  $("ev-mat-l").hidden=ms.length<2;
  if(!EV.k||ms.indexOf(EV.k)<0)EV.k=ms[0]||null;
  if(!EV.k){body.appendChild(el("p","lead",(univ().vide||t("evo.vide_lead"))+" "+t("evo.vide_suite")));return;}
  ms.forEach(function(k){var o=el("option",null,MATS[k].titre);o.value=k;if(k===EV.k)o.selected=true;sel.appendChild(o);});
  /* Détail de la matière (07, renderProgress) : par thème, révisions prévues, méthode */
  if(MAT.k!==EV.k)activate(EV.k);
  var D=evDonnees(EV.k),td=today(),P=EV.per,x0=td-P+1;
  if(!Object.keys(D.days||{}).length)body.appendChild(etatVide(t("evo.etat_t"),t("evo.etat_s"),t("evo.etat_b"),function(){renderHub();show("hub");},"b-ev-vide"));
  var jours=[],d,j,tot={n:0,sec:0,ok:0,nok:0,act:0},prev=0;
  for(d=x0;d<=td;d++){
    j=D.days[d]||null;
    jours.push({d:d,j:j});
    if(j&&j.n){tot.n+=j.n;tot.sec+=j.sec||0;tot.act++;if(j.ok!==undefined){tot.ok+=j.ok;tot.nok+=j.n;}}
  }
  for(d=x0-P;d<x0;d++){if(D.days[d])prev+=D.days[d].n||0;}
  if(!tot.n&&!evADonnees(EV.k)){
    /* v19 : l'état vide (etatVide, plus haut) le dit déjà */
    return;
  }
  /* Valeur vedette : ce que tu retrouverais aujourd'hui, en phrase, puis vu × retenu */
  var mem=evRappel(D,td),ids=D.M.Q.filter(function(q){return !q.cas;}),vus=ids.filter(function(q){return !!D.items[q.id];}),hero=el("div","ev-hero"),premier=null;
  var ret=vus.length?mem*ids.length/vus.length:0;
  jours.forEach(function(x){if(!premier&&x.j&&x.j.r!==undefined&&x.d<td)premier=x;});
  hero.appendChild(el("span","kk",t("evo.hero")));
  hero.appendChild(el("div","ev-big",pct(mem)));
  hero.appendChild(el("span","kk ev-big-s",t("evo.des_reponses")));
  var st=el("div","ev-stack"),f1=el("i","ev-ret"),f2=el("i","ev-vu");st.setAttribute("aria-hidden","true");
  f1.style.width=Math.round(mem*100)+"%";f2.style.width=Math.max(0,Math.round(vus.length/ids.length*100)-Math.round(mem*100))+"%";
  st.appendChild(f1);st.appendChild(f2);hero.appendChild(st);
  var dec=el("div","ev-dec");
  dec.appendChild(kvItem(t("evo.vues"),vus.length+" / "+ids.length));
  dec.appendChild(kvItem(t("evo.retenu_vues"),vus.length?pct(ret):"—"));
  hero.appendChild(dec);
  if(premier){var dl=Math.round(mem*100)-Math.round(premier.j.r/10);hero.appendChild(el("span","ev-delta",nb(t("evo.depuis",{d:dl?(dl>0?"+":"−")+tn("evo.pts",Math.abs(dl)):t("evo.stable"),date:fmtDay(premier.d)}))));}
  body.appendChild(hero);
  evPret(body,D,ids.length-vus.length);
  /* Activité sur la période choisie */
  var s0=el("div","ev-act"),tt=el("div","tete-ligne");tt.appendChild(el("h2",null,t("evo.activite")));
  var ch=el("div","chips ev-per");EV_PER.forEach(function(p){ch.appendChild(evChip(t("evo.jours_court",{n:p}),p===P,function(){EV.per=p;renderEvol();}));});
  tt.appendChild(ch);s0.appendChild(tt);body.appendChild(s0);
  var kv=el("div","kv ev-kv");
  var t1=kvItem(t("evo.reponses"),String(tot.n));
  if(prev){t1.appendChild(el("span","ev-delta",nb(t("evo.vs_avant",{d:evSigne(tot.n-prev),p:P}))));}
  kv.appendChild(t1);
  kv.appendChild(kvItem(t("evo.reussite"),tot.nok?pct(tot.ok/tot.nok):"—"));
  kv.appendChild(kvItem(t("evo.temps"),evDuree(tot.sec)));
  kv.appendChild(kvItem(t("evo.jours_travailles"),tot.act+" / "+P));
  s0.appendChild(kv);
  /* Réponses par jour */
  var s1=evSection(body,t("evo.rpj"),t("evo.rpj_s"));
  if(tot.n){
    var mx=0;jours.forEach(function(x){if(x.j&&x.j.n>mx)mx=x.j.n;});
    var ym=evNiceMax(mx);
    evGraphe(s1,{type:"col",x0:x0,x1:td,ymax:ym,ticks:[0,ym/2,ym],fy:String,
      aria:t("evo.rpj_aria",{p:P,n:tot.n}),
      pts:jours.map(function(x){
        var j=x.j||{n:0,sec:0},bits=[fmtDay(x.d)];
        if(j.ok!==undefined&&j.n)bits.push(tn("evo.n_justes",j.ok));
        if(j.n)bits.push(evDuree(j.sec||0));
        return {d:x.d,y:j.n||0,tip:[tn("evo.n_rep",j.n||0),bits.join(" · ")]};
      })});
  }else{s1.appendChild(el("p","src",t("evo.aucune_rep")));}
  /* Ce que tu retiens, jour après jour */
  var s2=evSection(body,t("evo.retiens"),t("evo.retiens_s"));
  var mp=jours.filter(function(x){return x.j&&x.j.r!==undefined;}).map(function(x){
    return {d:x.d,y:x.j.r/1000,tip:[pct(x.j.r/1000),fmtDay(x.d)+(x.j.v!==undefined?" · "+tn("evo.n_vues",x.j.v):"")]};
  });
  if(mp.length){
    evGraphe(s2,{type:"line",x0:x0,x1:td,ymax:1,ticks:[0,0.5,1],fy:function(v){return Math.round(v*100)+" %";},pts:mp,fin:function(p){return pct(p.y);},
      aria:t("evo.retiens_aria",{p:pct(mp[mp.length-1].y),date:fmtDay(mp[mp.length-1].d)})});
  }else{s2.appendChild(el("p","src",t("evo.pas_mesure")));}
  if(blocOn("progression"))renderProgress();
  /* Simulations */
  evObjectifs(body,D);
  /* Tableau des chiffres : utile à partir d'une semaine de travail */
  var act=jours.filter(function(x){return x.j&&x.j.n;}).reverse();
  if(act.length>=7){
    var det=el("details","ev-table"),tb=el("table"),tr=el("tr");
    det.appendChild(el("summary",null,t("evo.chiffres")));
    [t("evo.th_jour"),t("evo.reponses"),t("evo.th_justes"),t("evo.temps"),t("evo.th_retenu")].forEach(function(h){tr.appendChild(el("th",null,h));});
    tb.appendChild(tr);
    act.forEach(function(x){
      var r=el("tr");
      [fmtDay(x.d),String(x.j.n),x.j.ok!==undefined?String(x.j.ok):"—",evDuree(x.j.sec||0),x.j.r!==undefined?pct(x.j.r/1000):"—"].forEach(function(c){r.appendChild(el("td",null,nb(c)));});
      tb.appendChild(r);
    });
    det.appendChild(tb);$("progress").appendChild(det);
  }
  evMethode();
}
/* « Prêt pour l'examen ? » : le prochain examen de la matière, son objectif, la dernière simulation, le rythme */
function evPret(body,D,reste){
  var x=prochainExam(D.k);if(!x)return;
  var td=today(),jx=examJour(x),c=el("div","pcard ev-pret");
  c.appendChild(el("p","plab",nb(t("evo.pret",{titre:examTitre(x,true),quand:jx===td?t("evo.c_auj"):jx===td+1?t("evo.c_demain"):tn("evo.dans_cap",jx-td)}))));
  var l=[];
  if(typeof x.objectif==="number")l.push(t("evo.objectif_pt",{n:fmtNote(x.objectif)}));
  /* Programme choisi (v10) : ce qui reste à voir et ce que tu retiens, sur ses seuls thèmes */
  var lth=examThemes(x),td0=td;
  if(lth){
    var qs=D.M.Q.filter(function(q){return !q.cas&&lth.indexOf(q.th)>=0;}),vu=0,m=0;
    qs.forEach(function(q){var it=D.items[q.id];if(it&&typeof it.s==="number"){vu++;m+=fR(Math.max(0,td0-it.last),it.s);}});
    reste=qs.length-vu;
    var noms=D.M.THEMES.filter(function(t){return lth.indexOf(t.k)>=0;}).map(function(t){return t.n;});
    var pp=el("p","src ev-perim",nb(t("evo.perim",{themes:tn("exm.n_themes_sur",lth.length,{tot:D.M.THEMES.length}),noms:noms.join(", "),vu:vu,qs:qs.length,p:pct(qs.length?m/qs.length:0)})));
    pp.id="ev-perim";c.appendChild(pp);
  }
  var H=D.simh,der=H.length?H[H.length-1]:null;
  if(der){var n20=Math.round(der.note/der.sur*200)/10;l.push(t("evo.der_sim",{n:fmtNote(n20),fin:typeof x.objectif==="number"?(n20>=x.objectif?t("evo.fin_atteint"):tn("evo.fin_manque",x.objectif-n20,{x:fmtNote(Math.round((x.objectif-n20)*10)/10)})):"."}));}
  else if(D.M.blocs.simulation)l.push(t("evo.pas_sim"));
  if(reste>0&&D.M.blocs.seance_du_jour){
    var npj=Math.max(1,srsNewPerDay()),fin=td+Math.ceil(reste/npj)-1;
    l.push(nb(tn("evo.rythme",npj,{quand:fin<=td?t("exm.auj"):fin===td+1?t("exm.demain"):t("evo.le_date",{date:fmtDay(fin)}),fin:fin>=jx?t("evo.apres_exam"):"."})));
  }else if(!reste)l.push(t(lth?"evo.tout_vu_prog":"evo.tout_vu"));
  c.appendChild(el("p","src",l.join(" ")));
  body.appendChild(c);
}
/* Une seule note sur la façon de calculer, repliée */
function evMethode(){
  var det=el("details","ev-methode");
  det.appendChild(el("summary",null,t("evo.methode")));
  det.appendChild(el("p","src",t("evo.methode_1")));
  det.appendChild(el("p","src",t("evo.methode_2")));
  var sy=el("p","src");sy.id="sync-st";det.appendChild(sy);
  $("progress").appendChild(det);renderSyncStatus();
}
function evSection(body,titre,sous){
  var s=el("div","ev-sec");s.appendChild(el("h2",null,titre));if(sous)s.appendChild(el("p","src",sous));body.appendChild(s);return s;
}

/* ---------- Simulations face aux objectifs de note (examens du profil, sur 20) ---------- */
function evObjectifs(body,D){
  var exs=examsAVenir(D.k).filter(function(x){return typeof x.objectif==="number";}),H=D.simh,simOn=!!D.M.blocs.simulation;
  if(!H.length&&!(simOn&&exs.length))return;
  var s=evSection($("progress"),t("evo.simulations"),null),der=H.length?H[H.length-1]:null,n20=der?der.note/der.sur*20:null,td=today();
  exs.forEach(function(x){
    var o=el("div","ev-obj"),j=examJour(x);
    o.appendChild(el("p","ev-ot",nb(t("evo.obj_titre",{titre:examTitre(x,true),quand:j===td?t("exm.auj"):j===td+1?t("exm.demain"):tn("exm.dans",j-td),n:fmtNote(x.objectif)}))));
    var tr=el("div","ev-track"),fill=el("i"),cible=el("b");
    tr.setAttribute("role","img");
    tr.setAttribute("aria-label",n20===null?t("evo.aria_sans",{o:fmtNote(x.objectif)}):t("evo.aria_avec",{n:fmtNote(Math.round(n20*10)/10),o:fmtNote(x.objectif)}));
    fill.style.width=(n20===null?0:Math.max(0,Math.min(100,n20/20*100)))+"%";
    if(n20===null)fill.hidden=true;
    cible.style.left=Math.max(0,Math.min(100,x.objectif/20*100))+"%";
    tr.appendChild(fill);tr.appendChild(cible);o.appendChild(tr);
    var sc=el("div","ev-scale");sc.appendChild(el("span",null,"0"));sc.appendChild(el("span",null,"20"));o.appendChild(sc);
    var txt;
    if(n20===null){txt=t(simOn?"evo.sans_sim":"evo.pas_de_sim");}
    else{
      var ec=Math.round((x.objectif-n20)*10)/10;
      var dj=fmtDay(dayOf(der.at));  /* « oct. » finit déjà par un point */
      txt=t("evo.sim_derniere",{n:fmtNote(Math.round(n20*10)/10),prov:der.prov?t("evo.prov"):"",date:dj})+(/\.$/.test(dj)?" ":". ")
        +(ec>0?tn("evo.il_manque",ec,{x:fmtNote(ec)}):ec<0?tn("evo.depasse",-ec,{x:fmtNote(-ec)}):t("evo.pile"));
    }
    o.appendChild(el("p","src",nb(txt)));
    s.appendChild(o);
  });
  if(!exs.length)s.appendChild(el("p","src",t("evo.donne_obj")));
  if(H.length>=2){
    var obj=exs.length?exs[0].objectif:null,x0=dayOf(H[0].at),x1=Math.max(today(),dayOf(H[H.length-1].at));
    evGraphe(s,{type:"line",x0:x0,x1:x1,ymax:20,ticks:[0,10,20],fy:String,ref:obj===null?null:{y:obj,lab:t("evo.ref_obj",{n:fmtNote(obj)})},
      fin:function(p){return fmtNote(Math.round(p.y*10)/10);},
      aria:t("evo.aria_notes",{n:fmtNote(Math.round(n20*10)/10)}),
      pts:H.map(function(h){var v=h.note/h.sur*20;return {d:dayOf(h.at),y:v,tip:[fmtNote(Math.round(v*10)/10)+"/20"+(h.prov?t("evo.prov"):""),fmtDay(dayOf(h.at))]};})});
  }
  if(H.length){
    var l=el("ul","ev-sims");
    H.slice().reverse().forEach(function(h){l.appendChild(el("li",null,nb(fmtDay(dayOf(h.at))+" · "+fmtNote(Math.round(h.note/h.sur*200)/10)+"/20"+(h.sur!==20?" ("+fmtNote(h.note)+" / "+h.sur+")":"")+(h.prov?t("evo.li_prov"):""))));});
    s.appendChild(l);
  }
}

/* ---------- Graphique : colonnes (type col) ou ligne (type line) sur un axe de jours ----------
   c = {type, x0, x1 (jours), ymax, ticks, fy (texte d'une graduation), pts:[{d, y, tip:[valeur, détail]}], ref:{y, lab},
   fin (étiquette du dernier point, ligne), aria}. Un seul axe vertical ; la cible est toute la hauteur de la colonne. */
function evGraphe(box,c){
  var wrap=el("div","ev-chart");box.appendChild(wrap);
  var W=Math.max(240,Math.floor(wrap.clientWidth||box.clientWidth||320)),H=c.type==="col"?150:160,PL=34,PR=c.fin?42:8,PT=12,PB=24;
  var w=W-PL-PR,h=H-PT-PB,n=c.x1-c.x0+1,slot=w/n,yb=PT+h;
  function X(d){return PL+(d-c.x0+0.5)*slot;}
  function Y(v){return PT+h-Math.max(0,Math.min(1,v/c.ymax))*h;}
  var s=svgEl("svg",{width:W,height:H,viewBox:"0 0 "+W+" "+H,tabindex:"0",role:"img","aria-label":c.aria||""},wrap);
  c.ticks.forEach(function(t){
    var y=Math.round(Y(t))+0.5;
    svgEl("line",{x1:PL,x2:W-PR,y1:y,y2:y,"class":"ev-grid"},s);
    var tx=svgEl("text",{x:PL-6,y:y+4,"text-anchor":"end","class":"ev-ax"},s);tx.textContent=c.fy(t);
  });
  [[c.x0,"start"],[c.x1,"end"]].forEach(function(a,i){
    if(i===1&&c.x1===c.x0)return;
    var tx=svgEl("text",{x:i?PL+w:PL,y:H-6,"text-anchor":a[1],"class":"ev-ax"},s);tx.textContent=a[0]===today()?"auj.":evJourCourt(a[0]);
  });
  if(c.ref){
    var ry=Math.round(Y(c.ref.y))+0.5;
    svgEl("line",{x1:PL,x2:PL+w,y1:ry,y2:ry,"class":"ev-ref"},s);
    var rt=svgEl("text",{x:PL+4,y:ry-5,"class":"ev-ax"},s);rt.textContent=c.ref.lab;  /* à gauche : la fin de la ligne porte déjà son étiquette */
  }
  var marks=[],cross=null,dot=null;
  if(c.type==="col"){
    var bw=Math.max(2,Math.min(24,slot-2));
    c.pts.forEach(function(p){
      var bh=Math.round(p.y/c.ymax*h),x=X(p.d)-bw/2,yt=yb-bh,r=Math.min(4,bw/2,bh);
      marks.push(bh>0?svgEl("path",{d:"M"+x+","+yb+"V"+(yt+r)+"Q"+x+","+yt+" "+(x+r)+","+yt+"H"+(x+bw-r)+"Q"+(x+bw)+","+yt+" "+(x+bw)+","+(yt+r)+"V"+yb+"Z","class":"ev-col"},s):null);
    });
  }else{
    var dd="",i;
    for(i=0;i<c.pts.length;i++){dd+=(i?"L":"M")+X(c.pts[i].d).toFixed(1)+","+Y(c.pts[i].y).toFixed(1);}
    if(c.pts.length>1){
      svgEl("path",{d:dd+"L"+X(c.pts[c.pts.length-1].d).toFixed(1)+","+yb+"L"+X(c.pts[0].d).toFixed(1)+","+yb+"Z","class":"ev-area"},s);
      svgEl("path",{d:dd,"class":"ev-line"},s);
    }
    var last=c.pts[c.pts.length-1];
    svgEl("circle",{cx:X(last.d),cy:Y(last.y),r:4,"class":"ev-dot"},s);
    if(c.fin){var lt=svgEl("text",{x:X(last.d)+8,y:Y(last.y)+4,"class":"ev-lab"},s);lt.textContent=c.fin(last);}
    cross=svgEl("line",{x1:0,x2:0,y1:PT,y2:yb,"class":"ev-cross",visibility:"hidden"},s);
    dot=svgEl("circle",{cx:0,cy:0,r:5,"class":"ev-dot",visibility:"hidden"},s);
  }
  svgEl("rect",{x:PL,y:0,width:w,height:H,"class":"ev-hit"},s);
  var tip=el("div","ev-tip"),sel=-1;tip.hidden=true;wrap.appendChild(tip);
  function montrer(i){
    if(i<0||i>=c.pts.length)return;
    if(sel>=0&&marks[sel])marks[sel].setAttribute("class","ev-col");
    sel=i;var p=c.pts[i],x=X(p.d);
    if(marks[i])marks[i].setAttribute("class","ev-col on");
    if(cross){cross.setAttribute("x1",x);cross.setAttribute("x2",x);cross.setAttribute("visibility","visible");dot.setAttribute("cx",x);dot.setAttribute("cy",Y(p.y));dot.setAttribute("visibility","visible");}
    clear(tip);tip.appendChild(el("b",null,nb(p.tip[0])));if(p.tip[1])tip.appendChild(el("span",null,nb(p.tip[1])));
    tip.hidden=false;  /* sous le graphique (v6.3) : elle ne couvre plus le texte */
  }
  function cacher(){
    tip.hidden=true;if(sel>=0&&marks[sel])marks[sel].setAttribute("class","ev-col");
    if(cross){cross.setAttribute("visibility","hidden");dot.setAttribute("visibility","hidden");}
    sel=-1;
  }
  function proche(px){
    var d=c.x0+(px-PL)/slot-0.5,b=-1,bd=1e9,i;
    for(i=0;i<c.pts.length;i++){var e=Math.abs(c.pts[i].d-d);if(e<bd){bd=e;b=i;}}
    return b;
  }
  function pos(e){var r=s.getBoundingClientRect();return (e.clientX-r.left)*(W/(r.width||W));}
  s.addEventListener("pointermove",function(e){montrer(proche(pos(e)));});
  s.addEventListener("pointerdown",function(e){montrer(proche(pos(e)));});
  s.addEventListener("pointerleave",function(e){if(e.pointerType==="mouse")cacher();});
  s.addEventListener("focus",function(){if(sel<0){var i=c.pts.length-1;if(c.type==="col")while(i>0&&!c.pts[i].y)i--;montrer(i);}});
  s.addEventListener("blur",cacher);
  s.addEventListener("keydown",function(e){
    var k=e.key,i=sel<0?c.pts.length-1:sel;
    if(k==="ArrowLeft"){i--;}else if(k==="ArrowRight"){i++;}else if(k==="Home"){i=0;}else if(k==="End"){i=c.pts.length-1;}else if(k==="Escape"){cacher();return;}else{return;}
    e.preventDefault();montrer(Math.max(0,Math.min(c.pts.length-1,i)));
  });
  return wrap;
}
