(function(){
"use strict";
const $=id=>document.getElementById(id);
const NS="http://www.w3.org/2000/svg";
const reduceMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SUP={"-":"⁻","0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹"};
const sup=s=>String(s).split("").map(c=>SUP[c]||c).join("");
function fmt(v,d){ if(!isFinite(v))return "–"; const a=Math.abs(v);
  if(a!==0&&(a<0.01||a>=1e4)){const e=Math.floor(Math.log10(a));return (v/Math.pow(10,e)).toFixed(1)+"×10"+sup(e);}
  return v.toFixed(d==null?(a<1?3:a<10?2:a<100?1:0):d);}
function fmtT(fs){ return fs<1000? fmt(fs)+" fs" : fmt(fs/1000)+" ps"; }
function cssv(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}

/* ---------- tiny SVG plotting ---------- */
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function niceTicks(a,b,n){const span=b-a, step0=span/n, mag=Math.pow(10,Math.floor(Math.log10(step0))), r=step0/mag;
  const step=(r<1.5?1:r<3?2:r<7?5:10)*mag; const t=[]; for(let v=Math.ceil(a/step)*step; v<=b+step*1e-9; v+=step) t.push(Math.abs(v)<step*1e-9?0:v); return t;}
function logLabel(k){ if(k>=-2&&k<=3) return String(+Math.pow(10,k).toFixed(Math.max(0,-k))); return "10"+sup(k); }
function makePlot(svg,o){
  while(svg.firstChild)svg.removeChild(svg.firstChild);
  const W=Math.max(260,svg.clientWidth||svg.parentNode.clientWidth||600), H=o.h||Math.round(Math.min(300,Math.max(210,W*0.58)));
  svg.setAttribute("viewBox",`0 0 ${W} ${H}`); svg.setAttribute("height",H);
  const m={l:o.ml||52,r:o.mr||12,t:10,b:42};
  const X=o.x,Y=o.y; const tx=v=>X.log?Math.log10(v):v, ty=v=>Y.log?Math.log10(v):v;
  const x0=tx(X.min),x1=tx(X.max),y0=ty(Y.min),y1=ty(Y.max);
  const sx=v=>m.l+(tx(v)-x0)/(x1-x0)*(W-m.l-m.r);
  const sy=v=>H-m.b-(Math.max(Math.min(ty(v),y1+(y1-y0)*0.5),y0-(y1-y0)*0.5)-y0)/(y1-y0)*(H-m.t-m.b);
  const ax=el("g",{},svg), data=el("g",{},svg), top=el("g",{},svg);
  const clip="c"+Math.random().toString(36).slice(2);
  const cp=el("clipPath",{id:clip},svg); el("rect",{x:m.l,y:m.t-2,width:W-m.l-m.r,height:H-m.t-m.b+4},cp); data.setAttribute("clip-path",`url(#${clip})`);
  const tickPx=W<420?5:7;
  // x ticks
  let xt; if(X.ticks) xt=X.ticks; else if(X.log){xt=[];for(let k=Math.ceil(x0);k<=Math.floor(x1);k++)xt.push(Math.pow(10,k)); if(xt.length>tickPx){const s=Math.ceil(xt.length/tickPx);xt=xt.filter((_,i)=>i%s===0);}} else xt=niceTicks(X.min,X.max,Math.min(6,tickPx));
  for(const v of xt){const x=sx(v); el("line",{x1:x,x2:x,y1:m.t,y2:H-m.b,class:"gd"},ax);
    el("text",{x,y:H-m.b+16,"text-anchor":"middle"},ax).textContent=X.fmt?X.fmt(v):(X.log?logLabel(Math.round(Math.log10(v))):String(+v.toFixed(6)));}
  let yt; if(Y.ticks) yt=Y.ticks; else if(Y.log){yt=[];for(let k=Math.ceil(y0);k<=Math.floor(y1);k++)yt.push(Math.pow(10,k)); if(yt.length>6){const s=Math.ceil(yt.length/6);yt=yt.filter((_,i)=>i%s===0);}} else yt=niceTicks(Y.min,Y.max,5);
  for(const v of yt){const y=sy(v); el("line",{x1:m.l,x2:W-m.r,y1:y,y2:y,class:"gd"},ax);
    el("text",{x:m.l-6,y:y+4,"text-anchor":"end"},ax).textContent=Y.fmt?Y.fmt(v):(Y.log?logLabel(Math.round(Math.log10(v))):String(+v.toFixed(6)));}
  el("line",{x1:m.l,x2:W-m.r,y1:H-m.b,y2:H-m.b,class:"ax"},ax); el("line",{x1:m.l,x2:m.l,y1:m.t,y2:H-m.b,class:"ax"},ax);
  if(X.label) el("text",{x:m.l+(W-m.l-m.r)/2,y:H-6,"text-anchor":"middle",class:"lbl"},ax).textContent=X.label;
  if(Y.label){const t=el("text",{x:12,y:m.t+(H-m.t-m.b)/2,"text-anchor":"middle",class:"lbl",transform:`rotate(-90 12 ${m.t+(H-m.t-m.b)/2})`},ax);t.textContent=Y.label;}
  const P={W,H,m,sx,sy,data,top,
    line(pts,cls,extra){const d=pts.filter(p=>isFinite(p[1])&&(!Y.log||p[1]>0)).map((p,i)=>(i?"L":"M")+sx(p[0]).toFixed(1)+" "+sy(p[1]).toFixed(1)).join("");
      return el("path",Object.assign({d,fill:"none","stroke-width":2,class:cls,"stroke-linejoin":"round"},extra||{}),data);},
    area(pts,cls,base,extra){const b=base==null?Y.min:base; let d="M"+sx(pts[0][0]).toFixed(1)+" "+sy(b).toFixed(1);
      for(const p of pts)d+="L"+sx(p[0]).toFixed(1)+" "+sy(Math.max(p[1],Y.log?Y.min:-1e300)).toFixed(1);
      d+="L"+sx(pts[pts.length-1][0]).toFixed(1)+" "+sy(b).toFixed(1)+"Z"; return el("path",Object.assign({d,class:cls,stroke:"none"},extra||{}),data);},
    step(xs,ys,cls){let d="M"+sx(xs[0]).toFixed(1)+" "+sy(ys[0]).toFixed(1); for(let i=1;i<xs.length;i++){d+="H"+sx(xs[i]).toFixed(1)+"V"+sy(ys[i]).toFixed(1);} return el("path",{d,fill:"none","stroke-width":1.6,class:cls},data);},
    dot(x,y,r,cls,extra){return el("circle",Object.assign({cx:sx(x),cy:sy(y),r,class:cls},extra||{}),data);},
    vline(x,cls,extra){return el("line",Object.assign({x1:sx(x),x2:sx(x),y1:m.t,y2:H-m.b,class:cls,"stroke-width":1.5},extra||{}),top);},
    text(x,y,s,cls,anchor,extra){const t=el("text",Object.assign({x:typeof x==="number"?x:0,y,"text-anchor":anchor||"start",class:cls||"lbl"},extra||{}),top);t.textContent=s;return t;}
  };
  return P;
}
function logspace(a,b,n){const r=[];for(let i=0;i<n;i++)r.push(Math.pow(10,a+(b-a)*i/(n-1)));return r;}
function bindRange(id,outId,f){const r=$(id),o=$(outId);const u=()=>{o.textContent=f(+r.value);};r.addEventListener("input",u);u();return r;}

/* ---------- random number with seed ---------- */
let seed=12345; function rnd(){seed=(seed*1664525+1013904223)>>>0;return (seed+0.5)/4294967296;}
const expo=rate=>-Math.log(rnd())/rate;

/* ========== Figure: telegraph ========== */
const tel={};
function telSim(){
  const ta=Math.pow(10,+$("ta").value), tb=Math.pow(10,+$("tb").value);
  const tc=ta*tb/(ta+tb), dt=tc/20, N=120000, maxLag=80;
  let z=rnd()<tb/(ta+tb)?1:0, t=0, next=expo(z?1/tb:1/ta); const s=new Float32Array(N);
  const evX=[0],evY=[z]; const win=Math.max(30*tc,6*Math.max(ta,tb));
  for(let i=0;i<N;i++){ const ti=i*dt; while(next<ti){ z=1-z; t=next; if(t<win){evX.push(t);evY.push(z);} next=t+expo(z?1/tb:1/ta);} s[i]=z; }
  evX.push(win);evY.push(evY[evY.length-1]);
  let mean=0; for(const v of s)mean+=v; mean/=N;
  const C=[]; for(let L=0;L<=maxLag;L+=4){let a=0;for(let i=0;i+L<N;i++)a+=(s[i]-mean)*(s[i+L]-mean); C.push([L*dt,a/(N-L)]);}
  Object.assign(tel,{ta,tb,tc,evX,evY,C,maxT:maxLag*dt,win});
}
function telDraw(){
  const {ta,tb,tc,evX,evY,C,maxT,win}=tel;
  const P=makePlot($("telTrace"),{x:{min:0,max:win,label:"time (fs)"},y:{min:-0.25,max:1.25,ticks:[0,1],fmt:v=>v?"H⁺":"H"},ml:40});
  P.step(evX,evY,"c-chg");
  const A=ta*tb/(ta+tb)**2;
  const Q=makePlot($("telCorr"),{x:{min:0,max:maxT,label:"time lag (fs)"},y:{min:-0.02,max:0.27,label:"⟨δZ(t) δZ(0)⟩"}});
  const xs=[];for(let i=0;i<=100;i++)xs.push(maxT*i/100);
  Q.line(xs.map(x=>[x,A*Math.exp(-x/tc)]),"c-ink");
  for(const [x,y] of C) Q.dot(x,y,3.2,"f-chg");
  $("telZ").textContent=(tb/(ta+tb)).toFixed(2); $("telA").textContent=A.toFixed(3); $("telT").textContent=fmtT(tc);
}
function telAll(){telSim();telDraw();}
bindRange("ta","taO",v=>fmtT(Math.pow(10,v))); bindRange("tb","tbO",v=>fmtT(Math.pow(10,v)));
$("ta").addEventListener("input",telAll); $("tb").addEventListener("input",telAll); $("telRun").addEventListener("click",telAll);

/* ========== Figure: spectra ========== */
const OMEGA_E=42.85, G_I=0.8, G_E=0.25;
const imIon=w=>G_I*w*G_I/((1-w*w)**2+w*w*G_I*G_I);
const imEl=w=>{const x=w/OMEGA_E;return G_E*x*G_E/((1-x*x)**2+x*x*G_E*G_E);};
const imZ=(w,g)=>2*(w/g)/(1+(w/g)**2);
const WS=logspace(-2.5,3.5,500);
function overlap(g){let s=0;for(let i=1;i<WS.length;i++){const w=WS[i],dw=WS[i]-WS[i-1];s+=imIon(w)*imZ(w,g)*dw;}return s;}
const GS=logspace(-3,3,121), OV=GS.map(overlap), OVmax=Math.max(...OV);
const ovEl=(()=>{let s=0;for(let i=1;i<WS.length;i++){const w=WS[i];s+=imIon(w)*imEl(w)*(WS[i]-WS[i-1]);}return s;})();
function specDraw(){
  const g=Math.pow(10,+$("gam").value), aS=+$("amp").value/0.25;
  const xs=logspace(-2,3,400);
  const A=makePlot($("specA"),{x:{min:0.01,max:1000,log:true,label:"ω / ωₚᵢ"},y:{min:0,max:1.12,ticks:[0,0.5,1]},ml:36});
  A.line(xs.map(w=>[w,imIon(w)]),"c-ion"); A.line(xs.map(w=>[w,imEl(w)]),"c-elec"); A.line(xs.map(w=>[w,aS*imZ(w,g)]),"c-chg",{"stroke-dasharray":"0"});
  const lab=(x,y,s,c)=>A.text(A.sx(x),A.sy(y),s,"lbl","middle",{style:`fill:var(${c})`});
  lab(1,1.06,"ions","--ion"); lab(OMEGA_E,1.06,"electrons","--elec");
  const gx=Math.min(Math.max(g,0.03),300); lab(gx,g>0.3&&g<4?Math.min(0.86,aS+0.06):Math.min(1.06,aS+0.06),"charge","--chg");
  const B=makePlot($("specB"),{x:{min:0.01,max:1000,log:true,label:"ω / ωₚᵢ"},y:{min:1e-4,max:1.2,log:true},ml:44});
  B.area(xs.map(w=>[w,aS*imIon(w)*imZ(w,g)]),"f-chg",1e-4,{opacity:0.22}); B.line(xs.map(w=>[w,aS*imIon(w)*imZ(w,g)]),"c-chg");
  B.area(xs.map(w=>[w,imIon(w)*imEl(w)]),"f-elec",1e-4,{opacity:0.18}); B.line(xs.map(w=>[w,imIon(w)*imEl(w)]),"c-elec");
  B.text(B.W-B.m.r-4,B.m.t+14,"ion × charge","lbl","end",{style:"fill:var(--chg)"});
  B.text(B.W-B.m.r-4,B.m.t+30,"ion × electron","lbl","end",{style:"fill:var(--elec)"});
  const C=makePlot($("specC"),{x:{min:0.001,max:1000,log:true,label:"charge fluctuation rate 1/τ, in units of ωₚᵢ"},y:{min:0,max:1.08,ticks:[0,0.5,1],label:"relative coupling"},h:200});
  C.line(GS.map((x,i)=>[x,aS*OV[i]/OVmax]),"c-chg"); C.vline(1,"c-ion",{"stroke-dasharray":"4 4"});
  C.text(C.sx(1)+6,C.m.t+30,"1/τ = ωₚᵢ","lbl","start",{style:"fill:var(--ion)"});
  C.dot(g,aS*overlap(g)/OVmax,6,"f-chg",{stroke:cssv("--panel"),"stroke-width":2});
}
bindRange("gam","gamO",v=>{const g=Math.pow(10,v);return (g<0.01||g>=100?fmt(g):g.toFixed(g<1?2:1))+" ωₚᵢ";});
$("gam").addEventListener("input",specDraw);
bindRange("amp","ampO",v=>v.toFixed(3)); $("amp").addEventListener("input",specDraw);

/* ========== Figure: coth bracket ========== */
function coth(x){return x>20?1:1/Math.tanh(x);}
function cothDraw(){
  const Te=Math.pow(10,+$("te1").value), Ti=Math.pow(10,+$("ti1").value);
  const f=w=>w*(coth(w/(2*Te))-coth(w/(2*Ti)));
  const lim=2*(Te-Ti), Y=Math.max(Math.abs(lim)*1.2,2);
  const P=makePlot($("cothP"),{x:{min:1e-3,max:1e3,log:true,label:"ħω (eV)"},y:{min:-Y,max:Y,label:"bracket × ħω (eV)"},h:Math.min(280,Math.max(220,($("cothP").clientWidth||600)*0.42))});
  const xs=logspace(-3,3,400); P.area(xs.map(w=>[w,f(w)]),lim>=0?"f-elec":"f-ion",0,{opacity:0.15}); P.line(xs.map(w=>[w,f(w)]),lim>=0?"c-elec":"c-ion");
  P.line([[1e-3,0],[1e3,0]],"c-muted",{"stroke-width":1});
  const same=Math.abs(Te-Ti)<0.02*Math.max(Te,Ti);
  $("cothDir").textContent=same?"none: equilibrium":lim>0?"electrons → ions":"ions → electrons";
  $("cothLim").textContent=lim.toFixed(1)+" eV";
}
const fT=v=>{const t=Math.pow(10,v);return (t<10?t.toFixed(1):t.toFixed(0))+" eV";};
bindRange("te1","te1O",fT); bindRange("ti1","ti1O",fT);
$("te1").addEventListener("input",cothDraw); $("ti1").addEventListener("input",cothDraw);

/* ========== Carbon model ========== */
const SHELLCOL={"2p":["#2F7FA8","#6FB7D6"],"2s":["#B97C05","#F0B23A"],"1s":["#C4572C","#F08A5D"]};
function logE1(x){ if(x<=1){let s=-0.5772156649-Math.log(x),t=1;for(let k=1;k<30;k++){t*=-x/k;s-=t/k;}return Math.log(s);}
  return -x-Math.log(x)+Math.log((x*x+2.334733*x+0.250621)/(x*x+3.330657*x+1.681534)); }
function logAlpha(I,T,q){const aB=5.29177e-11,me=9.10938e-31,eV=1.602177e-19,Ry=13.6057;
  return Math.log(10*Math.PI*aB*aB/Math.sqrt(2*Math.PI*me*T*eV)*(Ry*Ry/I)*eV*q*1e6)+logE1(I/T);}
function jacobi(A){const n=A.length,a=A.map(r=>r.slice()),v=[...Array(n)].map((_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
  for(let sw=0;sw<100;sw++){let off=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)off+=a[i][j]*a[i][j];if(off<1e-30)break;
    for(let p=0;p<n;p++)for(let q=p+1;q<n;q++){if(Math.abs(a[p][q])<1e-300)continue;
      const th=(a[q][q]-a[p][p])/(2*a[p][q]),t=Math.sign(th||1)/(Math.abs(th)+Math.sqrt(th*th+1)),c=1/Math.sqrt(t*t+1),s=t*c;
      for(let k=0;k<n;k++){const x=a[k][p],y=a[k][q];a[k][p]=c*x-s*y;a[k][q]=s*x+c*y;}
      for(let k=0;k<n;k++){const x=a[p][k],y=a[q][k];a[p][k]=c*x-s*y;a[q][k]=s*x+c*y;}
      for(let k=0;k<n;k++){const x=v[k][p],y=v[k][q];v[k][p]=c*x-s*y;v[k][q]=s*x+c*y;}}}
  return {vals:a.map((r,i)=>r[i]),vecs:v};}
const CARBON={name:"C",IP:[11.26,24.38,47.89,64.49,392.09,489.99],Q:[2,1,2,1,2,1],mass:12.011,shell:["2p","2p","2s","2s","1s","1s"]};
const HYDROGEN={name:"H",IP:[13.6057],Q:[1],mass:1.008,shell:["1s"]};
function solveAtom(S,T,rho,f){
  const NZ=S.IP.length, NS=NZ+1;
  const ni=rho/S.mass*6.02214e23, aI=Math.cbrt(3/(4*Math.PI*ni))/5.29177e-9;
  const Ieff=S.IP.map((I,i)=>I-f*1.5*(i+1)*27.2114/aI);
  let zmin=0; Ieff.forEach((v,i)=>{if(v<=0.5)zmin=i+1;});
  let Zb=Math.max(Math.min(zmin,NZ),Math.min(1,NZ)),p,lne;
  for(let it=0;it<300;it++){lne=Math.log(Math.max(Zb,0.02)*ni);
    const lp=new Array(NS).fill(-Infinity); lp[zmin]=0;
    for(let i=zmin;i<NZ;i++) lp[i+1]=lp[i]+Math.log(2*6.0365e21)+1.5*Math.log(T)-Ieff[i]/T-lne;
    const mx=Math.max(...lp); p=lp.map(v=>Math.exp(v-mx)); const s=p.reduce((a,b)=>a+b); p=p.map(v=>v/s);
    const Zn=p.reduce((a,v,i)=>a+v*i,0); if(Math.abs(Zn-Zb)<1e-8){Zb=Zn;break;} Zb=0.5*Zb+0.5*Zn;}
  const up=new Array(NS).fill(0),dn=new Array(NS).fill(0);
  for(let i=zmin;i<NZ;i++){up[i]=Math.exp(logAlpha(Math.max(Ieff[i],0.5),T,S.Q[i])+lne); dn[i+1]=p[i]>0&&p[i+1]>0?up[i]*p[i]/p[i+1]:0;}
  const keep=[];for(let i=0;i<NS;i++)if(p[i]>1e-9)keep.push(i);
  const n=keep.length, Var=p.reduce((a,v,i)=>a+v*(i-Zb)*(i-Zb),0); const comps=[];
  if(n>1){const H=[...Array(n)].map(()=>new Array(n).fill(0));
    for(let a=0;a<n;a++){const i=keep[a];H[a][a]=(a<n-1?up[i]:0)+(a>0?dn[i]:0);
      if(a<n-1){const j=keep[a+1],v=-Math.sqrt(up[i]*dn[j]);H[a][a+1]=v;H[a+1][a]=v;}}
    const sc=Math.max(...H.map((r,a)=>r[a]));for(const r of H)for(let b=0;b<n;b++)r[b]/=sc;
    const {vals,vecs}=jacobi(H);
    for(let k=0;k<n;k++){const lam=vals[k]*sc;let s=0;for(let a=0;a<n;a++)s+=keep[a]*Math.sqrt(p[keep[a]])*vecs[a][k];
      const A=s*s; if(!(lam>1e-9*sc&&A>1e-4*Math.max(Var,1e-12)&&A>1e-5))continue;
      // label the mode by the transition that contributes most to its decay rate
      let best=-1,bi=keep[0];
      for(let a=0;a<n-1;a++){const i=keep[a],psi0=vecs[a][k]/Math.sqrt(p[i]),psi1=vecs[a+1][k]/Math.sqrt(p[keep[a+1]]);
        const fl=p[i]*up[i]*(psi1-psi0)**2; if(fl>best){best=fl;bi=i;}}
      comps.push({A,tau:1/lam,shell:S.shell[bi]});}}
  comps.sort((a,b)=>b.A-a.A);
  const wpi=1.32e3*Math.max(Zb,0.1)*Math.sqrt(ni/S.mass);
  const G=comps.reduce((a,c)=>{const g=1/c.tau;return a+c.A*2*g*wpi/(g*g+wpi*wpi);},0);
  return {p,Zb,ni,zmin,up,dn,Var,comps,wpi,G};
}
const solveCarbon=(T,rho,f)=>solveAtom(CARBON,T,rho,f);
const ZCOL=["#7b8794","#3f8fb0","#167A82","#5b9a3c","#B97C05","#c4572c","#BE2F72"];
const ZCOL_D=["#9aa5b5","#6fb7d6","#4CC3C9","#8dcc68","#F0B23A","#f08a5d","#F06BA8"];
const isDark=()=>cssv("--bg").toLowerCase()==="#0e141e";
const zname=z=>z===0?"C":"C"+(z===1?"":sup(z))+"⁺";
const TS=logspace(0,Math.log10(300),110);
let sweepKey="",sweep=null,sweepH=null;
function carbonDraw(newMC){
  const T=Math.pow(10,+$("cT").value), rho=Math.pow(10,+$("cRho").value), f=+$("cIPD").value;
  const key=rho+"|"+f; if(key!==sweepKey){sweep=TS.map(t=>solveCarbon(t,rho,f));sweepH=TS.map(t=>solveAtom(HYDROGEN,t,0.07,f));sweepKey=key;}
  const r=solveCarbon(T,rho,f); const cols=isDark()?ZCOL_D:ZCOL;
  // occupations
  const A=makePlot($("cOcc"),{x:{min:1,max:300,log:true,label:"electron temperature (eV)",ticks:[1,3,10,30,100,300],fmt:v=>String(v)},y:{min:0,max:1.05,ticks:[0,0.5,1],label:"fraction"},ml:46});
  for(let z=0;z<7;z++){const pts=TS.map((t,i)=>[t,sweep[i].p[z]]); A.line(pts,"",{stroke:cols[z]});
    let bi=0;for(let i=1;i<pts.length;i++)if(pts[i][1]>pts[bi][1])bi=i;
    if(pts[bi][1]>0.25) A.text(Math.min(Math.max(A.sx(pts[bi][0]),A.m.l+12),A.W-A.m.r-14),Math.max(A.sy(pts[bi][1])-5,A.m.t+14),zname(z),"lbl","middle",{style:`fill:${cols[z]};font-weight:600`});}
  A.vline(T,"c-ink",{"stroke-dasharray":"3 3"});
  // tau scatter
  // fluctuation modes, one line per shell
  const B=makePlot($("cTau"),{x:{min:1,max:300,log:true,label:"electron temperature (eV)",ticks:[1,3,10,30,100,300],fmt:v=>String(v)},y:{min:0.001,max:1e4,log:true,label:"mode lifetime τᵢ (fs)"},ml:50});
  B.line(TS.map((t,i)=>[t,1e15/sweep[i].wpi]),"c-ion",{"stroke-dasharray":"5 4","stroke-width":1.6});
  B.text(B.W-B.m.r-4,B.sy(1e15/sweep[sweep.length-1].wpi)-6,"1/ωₚᵢ (carbon)","lbl","end",{style:"fill:var(--ion)"});
  // combine a shell’s modes: total amplitude and amplitude-weighted (log-mean) lifetime
  const shellAgg=(cs,sh)=>{let A=0,L=0;for(const c of cs)if(c.shell===sh){A+=c.A;L+=c.A*Math.log(c.tau);}return A>0?{A,tau:Math.exp(L/A)}:null;};
  const shellCol=sh=>sh==="H"?cssv("--ink"):SHELLCOL[sh][isDark()?1:0];
  const drawShell=(sw,sh,label,dash)=>{
    const pts=TS.map((t,i)=>{const g=shellAgg(sw[i].comps,sh==="H"?"1s":sh);return g&&g.A>=0.01?{t,tau:g.tau*1e15,A:g.A}:null;});
    let seg=[],bestP=null; const flush=()=>{if(seg.length>1)B.line(seg,"",{stroke:shellCol(sh),"stroke-width":2.4,"stroke-dasharray":dash||"0"});seg=[];};
    pts.forEach((q,i)=>{if(!q){flush();return;} seg.push([q.t,q.tau]); if(!bestP||q.A>bestP.A)bestP=q;
      if(!dash&&i%3===0)B.dot(q.t,q.tau,Math.max(1.5,7*Math.sqrt(q.A)),"",{fill:shellCol(sh),"fill-opacity":0.35});});
    flush();
    const first=pts.find(q=>q);
    if(sh==="H"&&first)B.text(B.sx(first.t)+8,Math.max(B.sy(first.tau)-8,B.m.t+12),label,"lbl","start",{style:`fill:${shellCol(sh)};font-weight:600`});
    else if(bestP)B.text(Math.min(Math.max(B.sx(bestP.t),B.m.l+20),B.W-B.m.r-24),Math.max(B.sy(bestP.tau)-10,B.m.t+12),label,"lbl","middle",{style:`fill:${shellCol(sh)};font-weight:600`});
  };
  drawShell(sweepH,"H","H (one shell)","2 4");
  for(const sh of ["2p","2s","1s"]) drawShell(sweep,sh,sh);
  for(const sh of ["2p","2s","1s"]){const g=shellAgg(r.comps,sh);if(!g||g.A<0.01)continue;B.dot(T,g.tau*1e15,Math.max(2.5,7*Math.sqrt(g.A)),"",{fill:shellCol(sh),stroke:cssv("--ink"),"stroke-width":1.5});}
  B.vline(T,"c-ink",{"stroke-dasharray":"3 3"});
  // coupling
  const Gmax=Math.max(0.05,...sweep.map(s=>s.G));
  const C=makePlot($("cG"),{x:{min:1,max:300,log:true,label:"electron temperature (eV)",ticks:[1,3,10,30,100,300],fmt:v=>String(v)},y:{min:0,max:Gmax*1.12,label:"coupling (arb.)"},ml:46});
  const gp=TS.map((t,i)=>[t,sweep[i].G]); C.area(gp,"f-chg",0,{opacity:0.18}); C.line(gp,"c-chg");
  C.vline(T,"c-ink",{"stroke-dasharray":"3 3"}); C.dot(T,r.G,5.5,"f-chg",{stroke:cssv("--panel"),"stroke-width":2});
  // MC trace
  if(newMC||!carbonDraw.mc||carbonDraw.mcKey!==key+"|"+T){carbonDraw.mc=gillespie(r);carbonDraw.mcKey=key+"|"+T;}
  const mc=carbonDraw.mc;
  const D=makePlot($("cMC"),{x:{min:0,max:mc.win*1e15,label:"time (fs)"},y:{min:-0.3,max:6.3,ticks:[0,1,2,3,4,5,6],fmt:v=>zname(v),label:""},ml:44});
  if(mc.xs.length>1) D.step(mc.xs.map(x=>x*1e15),mc.ys,"c-chg");
  D.line([[0,r.Zb],[mc.win*1e15,r.Zb]],"c-ink",{"stroke-dasharray":"4 4","stroke-width":1.2});
  // readouts
  $("cZ").textContent=r.Zb.toFixed(2); $("cV").textContent=r.Var.toFixed(3); $("cW").textContent=fmtT(1e15/r.wpi);
  $("cP").textContent=r.zmin?"C⁰ to "+zname(r.zmin-1)+" (outer "+r.zmin+" e⁻ unbound)":"none";
  const tab=$("cTab"); const rows=r.comps.filter(c=>c.A>=0.005).slice(0,4);
  tab.innerHTML="<thead><tr><th>Mode</th><th>Shell</th><th>Amplitude Aᵢ</th><th>Lifetime τᵢ</th><th>τᵢ ωₚᵢ</th></tr></thead><tbody>"+
    (rows.length?rows.map((c,i)=>`<tr><td>${i+1}</td><td>${c.shell}</td><td>${c.A.toFixed(3)}</td><td>${fmtT(c.tau*1e15)}</td><td>${fmt(c.tau*r.wpi)}</td></tr>`).join(""):"<tr><td colspan=5>No significant fluctuations at this temperature.</td></tr>")+"</tbody>";
}
function gillespie(r){
  const main=r.comps.length?r.comps[0].tau:1e-15; const win=40*main;
  let z=0,u=rnd(),acc=0; for(let i=0;i<7;i++){acc+=r.p[i];if(u<=acc){z=i;break;}}
  const xs=[0],ys=[z]; let t=0;
  for(let n=0;n<5000;n++){const a=r.up[z]||0,b=r.dn[z]||0,tot=a+b; if(tot<=0)break; t+=expo(tot); if(t>win)break;
    z+= rnd()*tot<a?1:-1; xs.push(t);ys.push(z);}
  xs.push(win);ys.push(z); return {xs,ys,win};
}
bindRange("cT","cTO",v=>{const t=Math.pow(10,v);return (t<10?t.toFixed(1):t.toFixed(0))+" eV";});
bindRange("cRho","cRhoO",v=>{const d=Math.pow(10,v);return d.toFixed(2)+" g/cm³"+(Math.abs(d-2.26)<0.03?" (solid)":"");});
bindRange("cIPD","cIPDO",v=>Math.round(v*100)+"%");
["cT","cRho","cIPD"].forEach(id=>$(id).addEventListener("input",()=>carbonDraw(false)));
$("cRun").addEventListener("click",()=>carbonDraw(true));

/* ---------- draw all + resize ---------- */
function drawAll(){telDraw();specDraw();cothDraw();carbonDraw(false);}
telSim(); drawAll();
let rz; window.addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(drawAll,120);});
if(window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>setTimeout(drawAll,50));

/* ========== Hero animation ========== */
const cv=$("hero"), ctx=cv.getContext("2d"); let Wc,Hc,dpr;
const nb=[], el2=[]; let Zc=2, nextFlip=1.2, flash=0, pendingDown=0, ringR=0, running=!reduceMotion, last=0, streaks=[];
function sizeHero(){dpr=Math.min(2,window.devicePixelRatio||1);Wc=cv.clientWidth;Hc=cv.clientHeight;cv.width=Wc*dpr;cv.height=Hc*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
function initHero(){sizeHero(); nb.length=0; el2.length=0;
  const n=Wc<500?9:14;
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2+0.3*Math.sin(i*7), R=Math.min(Wc,Hc*1.6)*0.22+30*Math.sin(i*3.1);
    nb.push({x:Wc/2+Math.cos(a)*R*1.25,y:Hc/2+Math.sin(a)*R*0.75,vx:0,vy:0});}
  const ne=Wc<500?40:70; for(let i=0;i<ne;i++)el2.push({x:Math.random()*Wc,y:Math.random()*Hc,vx:(Math.random()-0.5)*260,vy:(Math.random()-0.5)*260});
}
function stepHero(dt){
  const cx=Wc/2,cy=Hc/2, s=Math.min(Wc,Hc*1.6);
  // Electron speed in px/s; ionized electrons leave the ion and recombining ones arrive at it
  const EV=110, LOUT=1.6, LIN=1.4;
  if(pendingDown>0){pendingDown-=dt; if(pendingDown<=0){Zc=2; flash=1; $("heroZ").textContent="C²⁺"; nextFlip=1.1*(0.5+Math.random());}}
  else { nextFlip-=dt; if(nextFlip<=0){const ang=Math.random()*Math.PI*2, ux=Math.cos(ang), uy=Math.sin(ang);
    if(Zc===2){Zc=3; flash=1; $("heroZ").textContent="C³⁺"; streaks.push({x:cx,y:cy,vx:ux*EV,vy:uy*EV,life:LOUT,max:LOUT,up:true}); nextFlip=1.6*(0.5+Math.random());}
    else {streaks.push({x:cx+ux*EV*LIN,y:cy+uy*EV*LIN,vx:-ux*EV,vy:-uy*EV,life:LIN,max:LIN,up:false}); pendingDown=LIN;}}}
  const ringTarget=s*0.40/Zc; ringR=ringR?ringR+(ringTarget-ringR)*Math.min(1,dt*5):ringTarget;
  flash=Math.max(0,flash-dt*2.2);
  const k=Zc*Zc*s*s*0.9, kn=s*s*0.12;
  for(const a of nb){let fx=0,fy=0; const dx=a.x-cx,dy=a.y-cy,r2=dx*dx+dy*dy+400,r=Math.sqrt(r2);
    fx+=k*dx/(r2*r)*s*0.05; fy+=k*dy/(r2*r)*s*0.05;
    for(const b of nb){if(a===b)continue;const ex=a.x-b.x,ey=a.y-b.y,q2=ex*ex+ey*ey+300,q=Math.sqrt(q2);fx+=kn*ex/(q2*q)*s*0.05;fy+=kn*ey/(q2*q)*s*0.05;}
    // confinement: elliptical wall
    const ux=(a.x-cx)/(Wc*0.47),uy=(a.y-cy)/(Hc*0.44),u=Math.sqrt(ux*ux+uy*uy); if(u>0.85){fx-=(u-0.85)*ux/u*3000;fy-=(u-0.85)*uy/u*3000;}
    a.vx+=(fx-0.35*a.vx)*dt+(Math.random()-0.5)*40*Math.sqrt(dt)*3; a.vy+=(fy-0.35*a.vy)*dt+(Math.random()-0.5)*40*Math.sqrt(dt)*3;
    const sp=Math.hypot(a.vx,a.vy); if(sp>260){a.vx*=260/sp;a.vy*=260/sp;}
    a.x+=a.vx*dt; a.y+=a.vy*dt;}
  for(const e of el2){e.x+=e.vx*dt;e.y+=e.vy*dt; if(e.x<0)e.x+=Wc; if(e.x>Wc)e.x-=Wc; if(e.y<0)e.y+=Hc; if(e.y>Hc)e.y-=Hc;
    if(Math.random()<dt*2){const ang=Math.random()*6.283,v=150+Math.random()*180;e.vx=Math.cos(ang)*v;e.vy=Math.sin(ang)*v;}}
  for(const st of streaks){st.x+=st.vx*dt;st.y+=st.vy*dt;st.life-=dt;} streaks=streaks.filter(s=>s.life>0);
}
function drawHero(){
  const cx=Wc/2,cy=Hc/2; const ion=cssv("--ion"),elc=cssv("--elec"),chg=cssv("--chg"),ink=cssv("--ink"),rule=cssv("--rule");
  ctx.clearRect(0,0,Wc,Hc);
  // bound-electron shells: radius scales as 1/Z, so they contract when the charge rises
  const s=Math.min(Wc,Hc*1.6), R0=ringR||s*0.40/Zc;
  for(let i=3;i>=1;i--){ctx.beginPath();ctx.arc(cx,cy,R0*i*0.62,0,7);ctx.strokeStyle=chg;ctx.globalAlpha=0.08+0.05*(Zc-2)+0.25*flash/(i);ctx.lineWidth=1.5;ctx.stroke();}
  ctx.globalAlpha=1;
  for(const e of el2){ctx.beginPath();ctx.arc(e.x,e.y,1.8,0,7);ctx.fillStyle=elc;ctx.globalAlpha=0.55;ctx.fill();}
  ctx.globalAlpha=1;
  for(const st of streaks){ctx.beginPath();ctx.moveTo(st.x,st.y);ctx.lineTo(st.x-st.vx*0.22,st.y-st.vy*0.22);ctx.strokeStyle=elc;ctx.lineWidth=2.2;ctx.globalAlpha=st.up?Math.min(1,st.life*1.5):Math.min(1,(st.max-st.life)*3);ctx.stroke();ctx.beginPath();ctx.arc(st.x,st.y,3,0,7);ctx.fillStyle=elc;ctx.fill();}
  ctx.globalAlpha=1;
  for(const a of nb){ctx.beginPath();ctx.arc(a.x,a.y,Math.max(7,s*0.022),0,7);ctx.fillStyle=ion;ctx.fill();
    const sp=Math.hypot(a.vx,a.vy); if(sp>40){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x-a.vx*0.12,a.y-a.vy*0.12);ctx.strokeStyle=ion;ctx.globalAlpha=0.35;ctx.lineWidth=3;ctx.stroke();ctx.globalAlpha=1;}}
  const rc=Math.max(11,s*0.035);
  ctx.beginPath();ctx.arc(cx,cy,rc+flash*8,0,7);ctx.fillStyle=chg;ctx.globalAlpha=0.25*flash;ctx.fill();ctx.globalAlpha=1;
  ctx.beginPath();ctx.arc(cx,cy,rc,0,7);ctx.fillStyle=chg;ctx.fill();
  ctx.fillStyle=cssv("--panel");ctx.font=`600 ${Math.round(rc*0.85)}px ${cssv("--sans")}`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(Zc+"+",cx,cy+1);
}
function loop(ts){ if(!running){last=0;return;} const dt=last?Math.min(0.04,(ts-last)/1000):0.016; last=ts; stepHero(dt); drawHero(); requestAnimationFrame(loop);}
initHero(); for(let i=0;i<120;i++)stepHero(0.016); drawHero();
const tg=$("heroToggle"); tg.textContent=running?"Pause":"Play";
tg.addEventListener("click",()=>{running=!running;tg.textContent=running?"Pause":"Play";if(running)requestAnimationFrame(loop);});
if(running)requestAnimationFrame(loop);
let hr; window.addEventListener("resize",()=>{clearTimeout(hr);hr=setTimeout(()=>{initHero();drawHero();},150);});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&running){running=false;tg.dataset.auto="1";tg.textContent="Play";}else if(!document.hidden&&tg.dataset.auto){delete tg.dataset.auto;running=true;tg.textContent="Pause";requestAnimationFrame(loop);}});
})();
