const fs=require('fs');
const {FSRSAlgorithm,generatorParameters}=require('ts-fsrs');
const src=fs.readFileSync(__dirname+'/../src/js/07-repetition-espacee.js','utf8');
const document={addEventListener(){}},window={};
const mod=new Function('document','window',src+';return {fNext,fIvl,fR};')(document,window);
const alg=new FSRSAlgorithm(generatorParameters({enable_fuzz:false,enable_short_term:true}));
let n=0,bad=0,maxd=0;
for(let k=0;k<5000;k++){
  let mine=null,ref=null;
  for(let step=0;step<12;step++){
    const g=1+Math.floor(Math.random()*4), t=step===0?0:(Math.random()<0.2?0:Math.floor(Math.random()*60));
    mine=mod.fNext(mine,t,g);
    ref=alg.next_state(ref,t,g);
    const dd=Math.abs(mine.d-ref.difficulty),ds=Math.abs(mine.s-ref.stability)/Math.max(1,ref.stability);
    const iv1=mod.fIvl(mine.s),iv2=alg.next_interval(ref.stability,t);
    n++; maxd=Math.max(maxd,dd,ds);
    if(dd>1e-6||ds>1e-6||iv1!==iv2){bad++; if(bad<5)console.log('DIFF',{t,g,mine,ref,iv1,iv2});}
  }
}
console.log('transitions',n,'mismatches',bad,'max rel diff',maxd);
// a few readable examples
let s=null; const seq=[[0,3],[1,3],[3,3],[8,3],[20,3]];
seq.forEach(([t,g])=>{s=mod.fNext(s,t,g);console.log('t',t,'g',g,'S',s.s.toFixed(2),'D',s.d.toFixed(2),'ivl',mod.fIvl(s.s));});
console.log('R(1 day, S=1)=',mod.fR(1,1),' R(S,S)=',mod.fR(5,5));
