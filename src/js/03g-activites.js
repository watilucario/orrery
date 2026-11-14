/* ---------- Autres façons de répondre (v13.4) : associer, ordonner ----------
   Demande de l'auteur (29 oct.) : plus de diversité que le QCM, avec une logique. Une question « Type : associer » relie
   chaque élément de gauche (it.o) à son élément de droite (it.d, même rang) ; « Type : ordonner » remet des étapes
   (it.o, dans le bon ordre) dans l'ordre. Le texte à trous (« Type : trous ») passe par le rappel libre (03b). Ces
   questions vivent dans la série comme un QCM : une fois vérifiées, choose(-1, null, {ok, txt}) (03) note la réponse
   (juste seulement si tout est juste ; pas de confiance : juste = 3, faux = 1) et affiche la correction. Contenu :
   build.py (TYPES_Q), 02 (packQcm). */
/* La bonne réponse en une ligne (bilan, aide de Claude, question sur une sélection) */
function bonneTexte(it){
  if(it.t==="associer")return it.o.map(function(g,i){return g+" → "+it.d[i];}).join(" ; ");
  if(it.t==="ordonner")return it.o.map(function(x,i){return (i+1)+". "+x;}).join(" ; ");
  return it.o[it.c];
}
function actRendre(it,box){
  var w=el("div","act act-"+it.t),bt=el("button","sbtn act-ok",t("act.verifier"));bt.type="button";bt.id="b-act-ok";
  if(it.t==="associer")actAssocier(it,w,bt);else actOrdonner(it,w,bt);
  w.appendChild(bt);box.appendChild(w);
}
/* Associer : une liste déroulante par élément de gauche (le plus simple au pouce comme au clavier) */
function actAssocier(it,w,bt){
  var droite=shuffle(it.d.map(function(x,i){return i;})),sels=[];
  w.appendChild(el("p","src act-aide",nb(t("act.relie"))));
  S.perm.forEach(function(g){
    var row=el("div","as-row"),lab=el("label","as-g"),s=el("select","field as-s"),id="as-"+g;
    s.id=id;lab.setAttribute("for",id);lab.textContent=nb(it.o[g]);
    var o0=el("option",null,t("act.choisis"));o0.value="";s.appendChild(o0);
    droite.forEach(function(d){var o=el("option",null,nb(it.d[d]));o.value=String(d);s.appendChild(o);});
    s.addEventListener("change",function(){bt.disabled=sels.some(function(x){return !x.s.value;});});
    row.appendChild(lab);row.appendChild(s);w.appendChild(row);sels.push({g:g,s:s,row:row});
  });
  bt.disabled=true;
  bt.addEventListener("click",function(){
    if(S.locked||sels.some(function(x){return !x.s.value;}))return;
    var ok=true,txt=[];
    sels.forEach(function(x){
      var d=parseInt(x.s.value,10),bon=(d===x.g);x.s.disabled=true;
      x.row.className="as-row "+(bon?"juste":"faux");
      txt.push(it.o[x.g]+" → "+it.d[d]);
      if(!bon){ok=false;x.row.appendChild(el("p","as-c",nb(t("act.bonne",{r:it.d[x.g]}))));}
    });
    bt.hidden=true;
    choose(-1,null,{ok:ok,txt:txt.join(" ; ")});
  });
}
/* Ordonner : chaque étape monte ou descend d'un cran ; jamais proposée déjà dans le bon ordre */
function actOrdonner(it,w,bt){
  var ordre=S.perm.slice(),ol=el("ol","or-l"),n=ordre.length;
  if(ordre.every(function(x,i){return x===i;}))ordre.push(ordre.shift());
  w.appendChild(el("p","src act-aide",nb(t("act.remets"))));
  function bouton(txt,lab,fn){var b=el("button","or-b",txt);b.type="button";b.setAttribute("aria-label",lab);b.addEventListener("click",fn);return b;}
  /* Glisser à la souris ou au doigt (v17.6, fil bc319c5c) : la ligne suit le pointeur ;
     au relâchement elle se place devant les lignes dont le centre est plus haut. Les flèches restent. */
  function glisser(g,li,x,i){
    g.addEventListener("pointerdown",function(e){
      if(S.locked||(e.button!==undefined&&e.button!==0))return;
      e.preventDefault();
      try{g.setPointerCapture(e.pointerId);}catch(err){}
      var y0=e.clientY,ouvert=true;
      li.className+=" or-tire";
      function cible(y){
        var n2=0;[].forEach.call(ol.children,function(k){
          if(k===li)return;var r=k.getBoundingClientRect();if(r.top+r.height/2<y)n2++;
        });
        return n2;
      }
      g.addEventListener("pointermove",function mv(ev){
        if(!ouvert)return;li.style.transform="translateY("+(ev.clientY-y0)+"px)";
      });
      g.addEventListener("pointerup",function up(ev){
        if(!ouvert)return;ouvert=false;
        var j=cible(ev.clientY);
        li.style.transform="";li.className=li.className.replace(" or-tire","");
        if(j!==i){ordre.splice(i,1);ordre.splice(j,0,x);dessiner("h"+j);}
      });
      g.addEventListener("pointercancel",function(){ouvert=false;li.style.transform="";li.className=li.className.replace(" or-tire","");dessiner(null);});
    });
  }
  function dessiner(foc){
    clear(ol);
    ordre.forEach(function(x,i){
      var li=el("li","or-i");li.setAttribute("data-k",x);
      li.appendChild(el("span","or-n",String(i+1)));li.appendChild(el("span","or-t",nb(it.o[x])));
      if(!S.locked){
        var h=bouton("↑",t("act.monter",{x:it.o[x]}),function(){ordre.splice(i,1);ordre.splice(i-1,0,x);dessiner("h"+(i-1));});
        var b=bouton("↓",t("act.descendre",{x:it.o[x]}),function(){ordre.splice(i,1);ordre.splice(i+1,0,x);dessiner("b"+(i+1));});
        h.disabled=i===0;b.disabled=i===n-1;h.id="or-h"+i;b.id="or-b"+i;
        var g=el("span","or-g","⠿");g.setAttribute("aria-hidden","true");g.title=t("act.glisser");
        glisser(g,li,x,i);
        li.appendChild(g);li.appendChild(h);li.appendChild(b);
      }
      ol.appendChild(li);
    });
    if(foc){var f=$("or-"+foc);if(f&&!f.disabled){try{f.focus();}catch(e){}}else{var g=$("or-"+(foc.charAt(0)==="h"?"b":"h")+foc.slice(1));if(g)try{g.focus();}catch(e){}}}
  }
  dessiner(null);w.appendChild(ol);
  bt.addEventListener("click",function(){
    if(S.locked)return;
    var ok=ordre.every(function(x,i){return x===i;});
    bt.hidden=true;  /* choose verrouille la question ; on redessine ensuite sans les flèches */
    choose(-1,null,{ok:ok,txt:ordre.map(function(x,i){return (i+1)+". "+it.o[x];}).join(" ; ")});
    dessiner(null);
    [].forEach.call(ol.childNodes,function(li,i){
      var x=parseInt(li.getAttribute("data-k"),10),bon=(x===i);li.className="or-i "+(bon?"juste":"faux");
      if(!bon)li.appendChild(el("span","or-c",nb(t("act.place",{n:x+1}))));
    });
  });
}
