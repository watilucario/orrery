/* ---------- Suivi sur le compte : erreurs, marques, exercices, série en cours, simulation (v2.3.1), notes des simulations (v2.4),
   résultats des cas guidés pour la grille de maîtrise (v5.1, casr:<clé du cas>), constructions (v8, cons:<id>),
   compteurs par question (v16, cpt:<id>, 03h ; réunis sans perte, comme casr), surlignages et notes (v17, note:<id>, 12u)
   ----------
   Le navigateur du téléphone peut oublier sa mémoire locale : ces données vont aussi dans le document privé
   data/users/<id>/suivi_<matière> (capacité db). Chaque élément porte l'heure de sa dernière modification ; à la fusion,
   la plus récente gagne, suppressions comprises. Les formats locaux (miss, mark, ex, sess, sim, lastex) ne changent pas :
   les heures sont gardées à part, dans <préfixe>suivi. save() et drop() (03) signalent chaque écriture d'une de ces clés. */
var SUIVI=null,SUIVI_W={busy:false,next:{}};
function suiviHash(s){var h=5381,i;for(i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36)+"."+s.length;}
/* État local d'une matière, élément par élément */
function suiviEtat(){
  var o={},id;
  MISS.forEach(function(x){o["miss:"+x]=1;});
  MARK.forEach(function(x){o["mark:"+x]=1;});
  for(id in EX){if(EX.hasOwnProperty(id)&&EX[id]&&typeof EX[id]==="object")o["ex:"+id]=EX[id];}
  if(SESS)o.sess=SESS;
  if(SIM)o.sim=SIM;
  if(LASTEX)o.last=LASTEX;
  SIMH.forEach(function(h){o["simh:"+h.at]=h;});
  for(id in CASR){if(CASR.hasOwnProperty(id))o["casr:"+id]=CASR[id];}
  for(id in CONSR){if(CONSR.hasOwnProperty(id))o["cons:"+id]=CONSR[id];}
  for(id in CPT.q){if(CPT.q.hasOwnProperty(id))o["cpt:"+id]=CPT.q[id];}  /* v16 : compteurs par question (03h) */
  for(id in NTR){if(NTR.hasOwnProperty(id)&&NTR[id]&&typeof NTR[id]==="object")o["note:"+id]=NTR[id];}  /* v17 : surlignages et notes (12u) */
  return o;
}
/* Note l'heure de chaque élément changé depuis la dernière fois (h : empreinte, "" : supprimé) */
function suiviNote(){
  if(!SUIVI||!MAT||SUIVI.k!==MAT.k)return false;
  var cur=suiviEtat(),st=SUIVI.st,at=SUIVI.t||Date.now(),ch=false,key,h;
  for(key in cur){if(cur.hasOwnProperty(key)){h=suiviHash(JSON.stringify(cur[key]));if(!st[key]||st[key].h!==h){st[key]={at:at,h:h};ch=true;}}}
  for(key in st){if(st.hasOwnProperty(key)&&!cur.hasOwnProperty(key)&&st[key].h!==""){st[key]={at:at,h:""};ch=true;}}
  SUIVI.t=0;
  if(ch)save(SUIVI.pre+"suivi",{v:1,st:st});
  return ch;
}
/* Appelé par activate() une fois la matière chargée. Données d'avant la v2.3.1 : heure 1, toute modification datée gagne. */
function suiviLoad(){
  var o=load(MAT.pre+"suivi",null),neuf=!(o&&o.st&&typeof o.st==="object");
  SUIVI={k:MAT.k,pre:MAT.pre,keys:{},st:neuf?{}:o.st,t:neuf?1:0,nt:null,pt:null,applying:false};
  [KMISS,KMARK,KEX,KSESS,KSIM,KLAST,KSIMH,KCASR,KCONS,KCPT,KNOTES].forEach(function(k){SUIVI.keys[k]=1;});
  suiviNote();
}
function suiviChange(k){
  if(!SUIVI||SUIVI.applying||!SUIVI.keys[k])return;
  SUIVI.t=Date.now();
  if(SUIVI.nt)clearTimeout(SUIVI.nt);
  SUIVI.nt=setTimeout(function(){SUIVI.nt=null;if(suiviNote())suiviPushSoon();},300);
}
/* Avant de changer de matière ou de passer en arrière-plan : tout noter et envoyer sans attendre */
function suiviFlush(){
  if(!SUIVI)return;
  var n=!!SUIVI.nt,p=!!SUIVI.pt;
  if(SUIVI.nt){clearTimeout(SUIVI.nt);SUIVI.nt=null;}
  if(SUIVI.pt){clearTimeout(SUIVI.pt);SUIVI.pt=null;}
  if((n&&suiviNote())||p)suiviPush();
}
function suiviCorps(){
  var cur=suiviEtat(),st=SUIVI.st,e={},key;
  for(key in st){if(st.hasOwnProperty(key))e[key]={at:st[key].at,d:cur.hasOwnProperty(key)?cur[key]:null};}
  return {v:1,e:e};
}
function suiviPushSoon(){if(!DB||!UID||!SUIVI)return;if(SUIVI.pt)clearTimeout(SUIVI.pt);SUIVI.pt=setTimeout(function(){SUIVI.pt=null;suiviPush();},3000);}
/* v17.1 : une matière sans cours (MAT.ready faux) n'est jamais relue sur le compte (suiviPull) : elle ne le réécrit pas non plus,
   sinon un « set » de l'état local effacerait ce qu'un autre appareil y a mis (notes perso). */
function suiviPush(){if(DB&&UID&&SUIVI&&MAT&&MAT.ready&&SUIVI.k===MAT.k)suiviEnvoi(SUIVI.k,suiviCorps());}
/* Une seule écriture à la fois ; si une autre arrive entre-temps, seule la dernière de chaque matière part ensuite */
function suiviEnvoi(k,body){
  if(SUIVI_W.busy){SUIVI_W.next[k]=body;return;}
  SUIVI_W.busy=true;
  function fin(){
    SUIVI_W.busy=false;
    var n;for(n in SUIVI_W.next){if(SUIVI_W.next.hasOwnProperty(n)){var b=SUIVI_W.next[n];delete SUIVI_W.next[n];suiviEnvoi(n,b);return;}}
  }
  DB.doc("data/users/"+UID+"/suivi_"+k).set(body).then(fin,function(){SYNC.state="err";renderSyncStatus();fin();});
}
/* Applique un élément venu du compte ; refuse ce qui n'existe plus dans le contenu et ce qui est ouvert à l'écran */
function suiviApplique(key,d){
  var p=key.indexOf(":"),kind=p<0?key:key.slice(0,p),id=p<0?"":key.slice(p+1),i,L;
  if(kind==="miss"||kind==="mark"){
    if(kind==="miss"?!BYID[id]:!(id.indexOf("ex:")===0?EXBY[id.slice(3)]:BYID[id]))return false;
    L=kind==="miss"?MISS:MARK;i=L.indexOf(id);
    if(d&&i<0)L.push(id);
    if(!d&&i>=0)L.splice(i,1);
    return true;
  }
  if(kind==="ex"){
    if(!EXBY[id.indexOf("sim-")===0?id.slice(4):id]||(d&&typeof d!=="object"))return false;
    if(!$("ex").hidden||!$("sim").hidden)return false;
    if(d){EX[id]=d;}else{delete EX[id];}
    return true;
  }
  if(kind==="sess"){
    if(!$("quiz").hidden||(d&&!(d.ids instanceof Array&&d.ans instanceof Array)))return false;
    SESS=d||null;return true;
  }
  if(kind==="sim"){
    if(!SIMB||!$("sim").hidden||(d&&!simValid(d)))return false;
    SIM=d||null;return true;
  }
  if(kind==="simh"){
    if(d&&!simhValide(d))return false;
    for(i=SIMH.length-1;i>=0;i--){if(String(SIMH[i].at)===id)SIMH.splice(i,1);}
    if(d){SIMH.push(d);SIMH.sort(function(a,b){return a.at-b.at;});}
    return true;
  }
  if(kind==="casr"){
    if(!CASQ[id]||(d&&!casrValide(d)))return false;
    if(d){CASR[id]=d;}else{delete CASR[id];}
    return true;
  }
  if(kind==="cons"){  /* v8 : lignes faites d'une construction ; rien n'est changé sous les yeux */
    if(!CONSBY[id]||(d&&!consValide(d))||(!$("cons").hidden&&CQ&&CQ.c.id===id))return false;
    if(d){CONSR[id]=d;}else{delete CONSR[id];}
    return true;
  }
  if(kind==="cpt"){  /* v16 : jamais effacé ; la fusion (suiviFusion) n'apporte que des compteurs réunis */
    if(!d||!cptValide(d))return false;
    CPT.q[id]=clone(d);return true;
  }
  if(kind==="note"){  /* v17 (12u) : rien n'est retiré parce que la fiche a changé ; pas sous les yeux d'une note ouverte */
    if((d&&(!ntValide(d)||d.id!==id))||ntEnEdition(id))return false;
    if(d){NTR[id]=clone(d);}else{delete NTR[id];}
    return true;
  }
  if(kind==="last"){
    if(d&&!EXBY[d])return false;
    LASTEX=d||null;return true;
  }
  return false;
}
/* Fusion : pour chaque élément, la modification la plus récente gagne. Sauf (v16) les compteurs par question et les
   résultats des cas guidés, réunis sans perte (SUIVI_REUNIR, 03h) : si le résultat diffère de ce qu'a le compte, il repart. */
var SUIVI_REUNIR={cpt:function(id){return CPT.q[id];},casr:function(id){return CASR[id];}};
var SUIVI_FUSION={cpt:function(a,b){return cptFusion(a,b);},casr:function(a,b){return casrFusion(a,b);}};
function suiviFusion(remote){
  var e=(remote&&remote.e&&typeof remote.e==="object")?remote.e:{},st=SUIVI.st,ch={local:false,remote:false,sim:false},key,r,kd,loc,m,hm,hl;
  for(key in e){if(e.hasOwnProperty(key)){
    r=e[key];
    if(!r||typeof r.at!=="number")continue;
    kd=key.slice(0,Math.max(0,key.indexOf(":")));
    if(SUIVI_REUNIR[kd]&&r.d&&(loc=SUIVI_REUNIR[kd](key.slice(kd.length+1)))){
      m=SUIVI_FUSION[kd](loc,r.d);hm=suiviHash(JSON.stringify(m));hl=suiviHash(JSON.stringify(loc));
      if(hm!==hl){if(!suiviApplique(key,m))continue;ch.local=true;}
      st[key]={at:hm===suiviHash(JSON.stringify(r.d))?Math.max(r.at,st[key]?st[key].at:0):Math.max(r.at,st[key]?st[key].at:0)+1,h:hm};
      continue;
    }
    if(st[key]&&r.at<=st[key].at)continue;
    if(!suiviApplique(key,r.d===undefined?null:r.d))continue;
    st[key]={at:r.at,h:r.d==null?"":suiviHash(JSON.stringify(r.d))};
    ch.local=true;if(key==="sim")ch.sim=true;
  }}
  for(key in st){if(st.hasOwnProperty(key)){
    r=e[key];
    if(!r||typeof r.at!=="number"||st[key].at>r.at)ch.remote=true;
  }}
  return ch;
}
function suiviEcrire(sim){
  SUIVI.applying=true;
  save(KMISS,MISS);save(KMARK,MARK);save(KEX,EX);
  if(SESS){save(KSESS,SESS);}else{drop(KSESS);}
  if(LASTEX){save(KLAST,LASTEX);}else{drop(KLAST);}
  save(KSIMH,SIMH);save(KCASR,CASR);save(KCONS,CONSR);save(KCPT,CPT);save(KNOTES,NTR);
  if(sim){if(SIM){save(KSIM,SIM);}else{drop(KSIM);}simLoad();}
  save(SUIVI.pre+"suivi",{v:1,st:SUIVI.st});
  SUIVI.applying=false;
}
function suiviPull(){
  if(!DB||!UID||!MAT||!MAT.ready)return;
  var k=MAT.k;
  DB.doc("data/users/"+UID+"/suivi_"+k).get().then(function(snap){
    if(!SUIVI||!MAT||SUIVI.k!==k||MAT.k!==k)return;
    if(SUIVI.nt){clearTimeout(SUIVI.nt);SUIVI.nt=null;suiviNote();}
    var ch=suiviFusion(snap.exists?clone(snap.data()):null);
    if(ch.local){
      suiviEcrire(ch.sim);
      if(!$("home").hidden)renderHome();
      if(!$("hub").hidden)renderHub();
      if(!$("chap").hidden&&chapTh())renderChap();
      ntApresSync();
    }
    if(ch.remote)suiviPush();
  },function(){SYNC.state="err";renderSyncStatus();});
}
