const { ML, MS, N, RIGS, FRAC, FSETS, PROD_OIL, PROD_GAS, OPS, SPEND_BASE, SPEND_YEARS, SPEND_TOTAL } = window.DATA;
const S={p:'1a',prov:new Set(['todas']),rec:new Set(['todos']),fluid:'todos',view:'pozos',spendYr:'2026'};

function range(){const end=N-1;const m={'1m':1,'3m':3,'6m':6,'1a':12,'2a':24}[S.p]||12;return{start:Math.max(0,end-m+1),end,m};}
function fops(){let o=OPS.slice();if(!S.prov.has('todas'))o=o.filter(x=>S.prov.has(x.prov));
  if(!S.rec.has('todos')){const allowed=new Set();if(S.rec.has('shale'))allowed.add('shale');if(S.rec.has('tight'))allowed.add('tight');
    if(S.rec.has('conv'))allowed.add('conv');o=o.filter(x=>allowed.has(x.rec));}return o;}
function agg(field){const ops=fops();return Array.from({length:N},(_,i)=>ops.reduce((s,o)=>s+(o[field]?.[i]||0),0));}
function sumR(ser,s,e){return ser.slice(s,e+1).reduce((a,v)=>a+v,0);}
function avgR(ser,s,e){const n=e-s+1;return Math.round(sumR(ser,s,e)/n);}
function yoy(ser,s,e){const curr=sumR(ser,s,e);const ps=Math.max(0,s-12),pe=Math.max(0,e-12);const prev=sumR(ser,ps,pe);
  if(!prev)return{pct:0,dir:'nt'};const pct=Math.round((curr-prev)/prev*100);return{pct,dir:pct>0?'up':pct<0?'dn':'nt'};}
function fmtYoy(y,prefix=''){if(y.dir==='up')return`▲ +${y.pct}%${prefix}`;if(y.dir==='dn')return`▼ ${y.pct}%${prefix}`;return`= 0%`;}
function spark(id,ser,cl,s,e){const svg=document.getElementById(id);if(!svg)return;const sl=ser.slice(s,e+1),n=sl.length;
  const mx=Math.max(...sl),mn=Math.min(...sl),rng=mx-mn||1;const pts=sl.map((v,i)=>`${(i/(n>1?n-1:1)*90).toFixed(1)},${(18-(v-mn)/rng*16).toFixed(1)}`).join(' ');
  const ly=(18-(sl[n-1]-mn)/rng*16).toFixed(1);svg.innerHTML=`<polyline points="${pts}" fill="none" stroke="${cl}" stroke-width="1.5" opacity=".7"/>
    <circle cx="90" cy="${ly}" r="2.5" fill="${cl}"/>`;}

function lineChart(svgId,series1,c1,series2,c2,s,e,H){const svg=document.getElementById(svgId);if(!svg)return;
  const W=340,PL=30,PR=10,PT=12,PB=24,cW=W-PL-PR,cH=H-PB-PT;const sl1=series1.slice(s,e+1),sl2=series2?series2.slice(s,e+1):null;
  const n=sl1.length;const allVals=[...sl1,...(sl2||[])];const mx=Math.max(...allVals)*1.18,mn=Math.min(...allVals)*0.82,rng=mx-mn||1;
  const pts=(ser)=>ser.map((v,i)=>`${(PL+i/(n>1?n-1:1)*cW).toFixed(1)},${(PT+cH-(v-mn)/rng*cH).toFixed(1)}`);
  const p1=pts(sl1),p2=sl2?pts(sl2):null;const gridH=[.25,.5,.75,1].map(f=>{const v=mn+f*rng,y=(PT+cH-(v-mn)/rng*cH).toFixed(1);
    const lv=v>=1000?(v/1000).toFixed(1)+'k':Math.round(v);return`<line x1="${PL}" y1="${y}" x2="${W-PR}" y2="${y}" stroke="#1b2130" stroke-width="1"/>
      <text x="${PL-4}" y="${parseFloat(y)+3.5}" fill="#252e42" font-family="IBM Plex Mono" font-size="7" text-anchor="end">${lv}</text>`;}).join('');
  const step=n<=4?1:n<=8?2:n<=12?2:n<=18?3:5;const mlab=sl1.map((_,i)=>{if(i%step!==0&&i!==n-1)return'';const x=(PL+i/(n>1?n-1:1)*cW).toFixed(1);
    const col=i===n-1?c1:'#252e42';return`<text x="${x}" y="${H-5}" fill="${col}" font-family="IBM Plex Mono" font-size="7" text-anchor="middle">${MS[s+i]||''}</text>`;}).join('');
  const lx=p1[n-1].split(',')[0],ly1=p1[n-1].split(',')[1];let s2html='';if(p2){s2html=`<polyline points="${p2.join(' ')}" fill="none" stroke="${c2}" stroke-width="1.5"
      stroke-dasharray="3,2" stroke-linecap="round" opacity=".65"/><circle cx="${p2[n-1].split(',')[0]}" cy="${p2[n-1].split(',')[1]}" r="2.5" fill="${c2}" opacity=".7"/>`;}
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('height',H);svg.innerHTML=`<defs><linearGradient id="lg_${svgId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c1}" stop-opacity=".2"/><stop offset="100%" stop-color="${c1}" stop-opacity="0"/></linearGradient></defs>${gridH}
    <polygon points="${p1.join(' ')} ${W-PR},${PT+cH} ${PL},${PT+cH}" fill="url(#lg_${svgId})"/>
    <polyline points="${p1.join(' ')}" fill="none" stroke="${c1}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>${s2html}${mlab}
    <circle cx="${lx}" cy="${ly1}" r="5" fill="${c1}" opacity=".15"><animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values=".15;0;.15" dur="2s" repeatCount="indefinite"/></circle><circle cx="${lx}" cy="${ly1}" r="3" fill="${c1}"/>`;}

function dualAxisChart(svgId,s1,c1,s2,c2,s3,c3,s,e,H){const svg=document.getElementById(svgId);if(!svg)return;
  const W=340,PL=30,PR=40,PT=12,PB=24,cW=W-PL-PR,cH=H-PB-PT;const sl1=s1.slice(s,e+1),sl2=s2.slice(s,e+1),sl3=s3.slice(s,e+1);
  const n=sl1.length;const mx1=Math.max(...sl1,...sl2)*1.2,mn1=Math.min(...sl1,...sl2)*0.8,rng1=mx1-mn1||1;
  const mx2=Math.max(...sl3)*1.2,mn2=Math.min(...sl3)*0.8,rng2=mx2-mn2||1;
  const gridH=[.33,.66,1].map(f=>{const v=mn1+f*rng1,y=(PT+cH-(v-mn1)/rng1*cH).toFixed(1);
    return`<line x1="${PL}" y1="${y}" x2="${W-PR}" y2="${y}" stroke="#1b2130" stroke-width="1"/>
      <text x="${PL-4}" y="${parseFloat(y)+3.5}" fill="#252e42" font-family="IBM Plex Mono" font-size="7" text-anchor="end">${Math.round(v)}</text>`;}).join('');
  const gridH2=[.33,.66,1].map(f=>{const v=mn2+f*rng2,y=(PT+cH-(v-mn2)/rng2*cH).toFixed(1);
    return`<text x="${W-PR+4}" y="${parseFloat(y)+3.5}" fill="${c3}" font-family="IBM Plex Mono" font-size="7">${Math.round(v)}</text>`;}).join('');
  const bars=sl1.map((v,i)=>{const x=(PL+i/(n>1?n-1:1)*cW).toFixed(1),y=(PT+cH-(v-mn1)/rng1*cH).toFixed(1),h=(cH-(parseFloat(y)-PT)).toFixed(1);
    return`<rect x="${parseFloat(x)-4}" y="${y}" width="8" height="${h}" rx="2" fill="${c1}" opacity=".7"/>`;}).join('');
  const pts2=sl2.map((v,i)=>`${(PL+i/(n>1?n-1:1)*cW).toFixed(1)},${(PT+cH-(v-mn1)/rng1*cH).toFixed(1)}`).join(' ');
  const pts3=sl3.map((v,i)=>`${(PL+i/(n>1?n-1:1)*cW).toFixed(1)},${(PT+cH-(v-mn2)/rng2*cH).toFixed(1)}`).join(' ');
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('height',H);svg.innerHTML=`${gridH}${gridH2}${bars}
    <polyline points="${pts2}" fill="none" stroke="${c2}" stroke-width="2" stroke-linecap="round"/>
    <polyline points="${pts3}" fill="none" stroke="${c3}" stroke-width="1.5" stroke-dasharray="4,3" stroke-linecap="round"/>`;}

function barList(id,items,maxV){const c=document.getElementById(id);if(!c)return;const mx=maxV||Math.max(...items.map(i=>i.v),1);
  c.innerHTML=items.map(it=>{const w=(it.v/mx*100).toFixed(0);const yoyHtml=it.yoy!==undefined
    ?`<span class="bli-yoy ${it.dir}">${it.yoy>0?'▲+':'▼'}${Math.abs(it.yoy)}%</span>`:'';
    return`<div class="bli"><span class="bli-n" style="color:${it.cl||'var(--dm)'}">${it.nm}</span>
      <div class="bli-t"><div class="bli-f" style="width:${w}%;background:${it.cl||'var(--or)'}"><span class="bli-fl">${it.lbl||it.v}</span></div></div>${yoyHtml}</div>`;}).join('');}

function rankList(id,items){const c=document.getElementById(id);if(!c)return;c.innerHTML=items.map((it,i)=>`<div class="rk"><div class="rk-n">${i+1}</div>
    <div class="rk-dot" style="background:${it.cl};box-shadow:0 0 7px ${it.cl}55"></div><div class="rk-body"><div class="rk-name">${it.nm}</div>
    <div class="rk-sub">${it.sub||''}</div></div><div class="rk-right"><div class="rk-val" style="color:${it.cl}">${it.v}</div>
    <div class="rk-delta ${it.dir||'nt'}">${it.dt||''}</div></div></div>`).join('');}

function renderPozos(){const{start,end}=range();const rigS=agg('rigs'),wlS=agg('wells');
  const avgRig=avgR(rigS,start,end),sumWell=sumR(wlS,start,end);
  const avgWellPerRig=avgRig?(sumWell/((end-start+1)*avgRig)).toFixed(1):0;
  document.getElementById('h-rigs').textContent=avgRig;document.getElementById('h-period').textContent=`${MS[start]}–${MS[end]}`;
  const yRig=yoy(rigS,start,end);const hb=document.getElementById('h-yoy-badge');hb.className=`yoy-badge yoy-${yRig.dir}`;
  document.getElementById('h-yoy-arrow').textContent=yRig.dir==='up'?'▲':yRig.dir==='dn'?'▼':'=';document.getElementById('h-yoy-val').textContent=` ${Math.abs(yRig.pct)}%`;
  lineChart('lc-svg',rigS,'#f06a1a',wlS,'#27d17a',start,end,135);
  const yW=yoy(wlS,start,end);const shOps=fops().filter(o=>o.rec==='shale'||o.rec==='tight');
  const avgShRigs=shOps.length?avgR(shOps.reduce((a,o)=>a.map((v,i)=>v+(o.rigs[i]||0)),Array(N).fill(0)),start,end):0;
  const shalePct=avgRig?Math.round(avgShRigs/avgRig*100):0;document.getElementById('m-wells').textContent=sumWell;
  const mtS=rigS.map((r,i)=>r*3500);document.getElementById('m-metros').textContent=`${(sumR(mtS,start,end)/1000).toFixed(0)}k`;
  document.getElementById('m-shale').innerHTML=`${shalePct}<span class="u">%</span>`;document.getElementById('m-prod').textContent=avgWellPerRig;
  document.getElementById('my-wells').className=yW.dir;document.getElementById('my-wells').textContent=fmtYoy(yW);
  const yM=yoy(mtS,start,end);document.getElementById('my-metros').className=yM.dir;document.getElementById('my-metros').textContent=fmtYoy(yM);
  document.getElementById('my-shale').textContent=`${100-shalePct}% conv`;document.getElementById('my-prod').textContent=`Conv: 2.5 · NC: 1.1`;
  spark('ms-wells',wlS,'#27d17a',start,end);spark('ms-metros',mtS,'#3d9bff',start,end);
  const WELLS=wlS;document.getElementById('lm-rigs').textContent=RIGS[N-1];document.getElementById('lm-wells').textContent=WELLS[N-1];
  document.getElementById('lm-etapas').textContent=FRAC[N-1].toLocaleString('es-AR');const y1r=yoy(RIGS,N-1,N-1),y1w=yoy(WELLS,N-1,N-1),y1f=yoy(FRAC,N-1,N-1);
  const setLmd=(id,y)=>{const el=document.getElementById(id);el.className=`lm-d ${y.dir}`;el.textContent=fmtYoy(y,' aa');};
  setLmd('lmd-rigs',y1r);setLmd('lmd-wells',y1w);setLmd('lmd-etapas',y1f);
  const provMap={neuquen:'Neuquén',chubut:'Chubut',santacruz:'Santa Cruz',mendoza:'Mendoza'};
  const provs=Object.entries(provMap).map(([p,nm])=>{const ops=OPS.filter(o=>o.prov===p);
    const ser=ops.reduce((a,o)=>a.map((v,i)=>v+(o.rigs[i]||0)),Array(N).fill(0));
    const v=avgR(ser,start,end);const y=yoy(ser,start,end);return{nm,cl:'#f06a1a',v,lbl:`${v} rigs`,yoy:Math.abs(y.pct),dir:y.dir};}).filter(p=>p.v>0);
  barList('bl-prov',provs);document.getElementById('sb-prov').textContent=`${MS[start]}–${MS[end]}`;
  document.getElementById('prd-lbl').textContent=`${MS[start]} – ${MS[end]}`;}

function renderClientes(){const{start,end}=range();const ops=fops();const top3=ops.slice().sort((a,b)=>b.rigs[N-1]-a.rigs[N-1]).slice(0,3);
  const W=340,H=140,PL=30,PR=10,PT=12,PB=24,cW=W-PL-PR,cH=H-PB-PT;const allR=top3.flatMap(o=>o.rigs.slice(start,end+1));
  const mx=Math.max(...allR)*1.2,mn=Math.min(...allR)*0.8,rng=mx-mn||1;const n=end-start+1,step=n<=6?1:n<=12?2:3;
  const gridH=[.33,.66,1].map(f=>{const v=mn+f*rng,y=(PT+cH-(v-mn)/rng*cH).toFixed(1);
    return`<line x1="${PL}" y1="${y}" x2="${W-PR}" y2="${y}" stroke="#1b2130" stroke-width="1"/>
      <text x="${PL-4}" y="${parseFloat(y)+3.5}" fill="#252e42" font-family="IBM Plex Mono" font-size="7" text-anchor="end">${Math.round(v)}</text>`;}).join('');
  const mlab=Array.from({length:n},(_,i)=>{if(i%step!==0&&i!==n-1)return'';const x=(PL+i/(n>1?n-1:1)*cW).toFixed(1);
    return`<text x="${x}" y="${H-5}" fill="#252e42" font-family="IBM Plex Mono" font-size="7" text-anchor="middle">${MS[start+i]||''}</text>`;}).join('');
  const lines=top3.map(o=>{const sl=o.rigs.slice(start,end+1);const pts=sl.map((v,i)=>`${(PL+i/(n>1?n-1:1)*cW).toFixed(1)},${(PT+cH-(v-mn)/rng*cH).toFixed(1)}`);
    const lx=pts[n-1].split(',')[0],ly=pts[n-1].split(',')[1];
    return`<polyline points="${pts.join(' ')}" fill="none" stroke="${o.cl}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
      <circle cx="${lx}" cy="${ly}" r="2.5" fill="${o.cl}"/>`;}).join('');
  const legend=top3.map(o=>`<div class="lc-leg"><div class="lc-dot" style="background:${o.cl}"></div>${o.nm.split(' ')[0]}</div>`).join('');
  document.getElementById('cli-legenda').innerHTML=legend;const svgEl=document.getElementById('cli-lc-svg');svgEl.setAttribute('viewBox',`0 0 ${W} ${H}`);
  svgEl.setAttribute('height',H);svgEl.innerHTML=`${gridH}${lines}${mlab}`;
  const rkR=ops.map(o=>{const v=avgR(o.rigs,start,end);const y=yoy(o.rigs,start,end);
    const sub=`${o.rec==='shale'?'Shale':o.rec==='tight'?'Tight':'Conv'} · ${o.prov}`;
    return{nm:o.nm,cl:o.cl,v,sub,dir:y.dir,dt:fmtYoy(y,' aa')};}).filter(r=>r.v>0).sort((a,b)=>b.v-a.v);rankList('rk-rigs',rkR);
  document.getElementById('sb-rkrigs').textContent=`${MS[start]}–${MS[end]}`;
  const prodBars=ops.map(o=>{const rAvg=avgR(o.rigs,start,end),wSum=sumR(o.wells,start,end);
    const v=(rAvg&&wSum)?parseFloat((wSum/((end-start+1)*rAvg)).toFixed(1)):0;
    return{nm:o.nm.split(' ')[0],cl:o.cl,v,lbl:`${v} pz/rig/mes`};}).filter(m=>m.v>0).sort((a,b)=>b.v-a.v);
  barList('bl-prod-cli',prodBars,3);document.getElementById('sb-prod-cli').textContent=`${MS[start]}–${MS[end]}`;}

function renderFractura(){const{start,end}=range();const etS=agg('et');const sumEt=sumR(etS,start,end),avgFs=avgR(FSETS,start,end);
  const yEt=yoy(etS,start,end),yFs=yoy(FSETS,start,end);
  document.getElementById('fh-etapas').textContent=sumEt>=10000?(sumEt/1000).toFixed(1).replace('.',',')+'k':sumEt.toLocaleString('es-AR');
  document.getElementById('fh-period').textContent=`${MS[start]}–${MS[end]}`;const fhb=document.getElementById('fh-yoy-badge');
  fhb.className=`yoy-badge yoy-${yEt.dir}`;document.getElementById('fh-yoy-a').textContent=yEt.dir==='up'?'▲':yEt.dir==='dn'?'▼':'=';
  document.getElementById('fh-yoy-v').textContent=` ${Math.abs(yEt.pct)}%`;document.getElementById('fm-sets').textContent=avgFs;
  document.getElementById('fmy-sets').className=yFs.dir;document.getElementById('fmy-sets').textContent=fmtYoy(yFs);
  lineChart('frac-lc-svg',etS,'#f5a623',null,null,start,end,130);const ops=fops();const maxEt=Math.max(...ops.map(o=>o.et[N-1]),1);
  const etBars=ops.map(o=>{const v=o.et[N-1],pct=Math.round(v/(etS[N-1]||1)*100);
    return{nm:o.nm.split(' ')[0],cl:o.cl,v,lbl:`${v.toLocaleString('es-AR')} (${pct}%)`};}).filter(b=>b.v>0).sort((a,b)=>b.v-a.v);
  barList('bl-frac-op',etBars,maxEt);const rkF=ops.map(o=>{const v=o.et[N-1];if(!v)return null;const y=yoy(o.et,start,end);
    const pct=Math.round(v/(etS[N-1]||1)*100);return{nm:o.nm,cl:o.cl,v:v.toLocaleString('es-AR'),sub:`${pct}% del mercado`,dir:y.dir,dt:fmtYoy(y,' aa')};
  }).filter(Boolean).sort((a,b)=>parseInt(b.v.replace(/\D/g,''))-parseInt(a.v.replace(/\D/g,'')));rankList('rk-frac',rkF);}

function renderBalance(){const{start,end}=range();const rigS=agg('rigs'),wlS=agg('wells'),etS=agg('et');
  const etPerRig=rigS.map((r,i)=>r?(etS[i]/r):0);dualAxisChart('balance-svg',rigS,'#f06a1a',wlS,'#27d17a',etPerRig,'#f5a623',start,end,140);
  const avgRig=avgR(rigS,start,end),avgWell=avgR(wlS,start,end),avgEt=avgR(etS,start,end),avgSets=avgR(FSETS,start,end);
  const pozPorRig=avgRig?(avgWell/avgRig).toFixed(1):0;
  const setsPerRig=avgRig?(avgSets/avgRig).toFixed(2):0;
  document.getElementById('bal-pw').textContent=pozPorRig;
  document.getElementById('bal-pw-sub').textContent=`${avgWell} pz / ${avgRig} rigs`;
  document.getElementById('bal-ratio').textContent=setsPerRig;
  document.getElementById('bal-ratio-sub').textContent=`${avgSets} sets / ${avgRig} rigs`;
  const rigsNeeded=avgSets*3.5;const pos=Math.min(Math.max((avgRig-rigsNeeded)/rigsNeeded*50+50,0),100);
  document.getElementById('bi-marker').style.left=pos+'%';document.getElementById('bi-fill').style.transform=`scaleX(${pos/100})`;
  let msg='';if(pos<40)msg=`⚖ Equilibrado: ${avgRig} rigs alimentan ${avgSets} sets (~1 set cada 3.5 rigs)`;
  else if(pos<60)msg=`▲ Exceso de sets: ${avgSets} sets necesitan ~${rigsNeeded.toFixed(0)} rigs pero hay ${avgRig}. Riesgo de paradas.`;
  else msg=`▼ Exceso de rigs: ${avgRig} rigs perforando pero solo ${avgSets} sets. Backlog creciendo.`;
  document.getElementById('bi-msg').textContent=msg;}

function renderSpend(){const yr=S.spendYr;const base=SPEND_BASE[yr];let zona=base.zona,opsData=base.ops;
  if(!S.prov.has('todas'))zona=zona.filter(z=>S.prov.has(z.prov));
  if(!S.rec.has('todos')){const allowed=new Set();if(S.rec.has('shale'))allowed.add('shale');if(S.rec.has('tight'))allowed.add('tight');
    if(S.rec.has('conv'))allowed.add('conv');opsData=opsData.filter(o=>allowed.has(o.rec));}
  const totalFiltered=opsData.reduce((s,o)=>s+o.v,0);
  document.getElementById('spend-total').textContent=totalFiltered?`USD ${(totalFiltered/1000).toFixed(1)}B`:`USD ${(base.total/1000).toFixed(1)}B`;
  document.getElementById('spend-yr-lbl').textContent=`${yr} total`;document.getElementById('spend-yoy-val').textContent=`+${base.yoy}%`;
  document.getElementById('spend-yoy-lbl').textContent=`vs ${parseInt(yr)-1}`;
  barList('bl-spend-zona',zona.map(z=>({nm:z.z,cl:'#f06a1a',v:z.v,lbl:`USD ${z.v}MM`})));
  document.getElementById('sb-spend-zona').textContent=`${yr} · Res. 2057`;
  const rkS=opsData.map(o=>({nm:o.nm,cl:OPS.find(x=>x.nm===o.nm)?.cl||'#6b7a94',v:`${o.v}`,
    sub:`${Math.round(o.v/base.total*100)}% del total`,dir:'nt',dt:''}));rankList('rk-spend',rkS);
  document.getElementById('sb-spend-ops').textContent=`${yr} · DDJJ`;
  const W=340,H=120,PL=40,PR=10,PT=12,PB=24,cW=W-PL-PR,cH=H-PB-PT;const n=SPEND_YEARS.length;
  const mx=Math.max(...SPEND_TOTAL)*1.15,mn=0,rng=mx-mn||1;const pts=SPEND_TOTAL.map((v,i)=>`${(PL+i/(n>1?n-1:1)*cW).toFixed(1)},${(PT+cH-(v-mn)/rng*cH).toFixed(1)}`);
  const gridH=[.33,.66,1].map(f=>{const v=mn+f*rng,y=(PT+cH-(v-mn)/rng*cH).toFixed(1);const lv=v>=1000?(v/1000).toFixed(1)+'B':`${Math.round(v)}M`;
    return`<line x1="${PL}" y1="${y}" x2="${W-PR}" y2="${y}" stroke="#1b2130" stroke-width="1"/>
      <text x="${PL-4}" y="${parseFloat(y)+3.5}" fill="#252e42" font-family="IBM Plex Mono" font-size="7" text-anchor="end">${lv}</text>`;}).join('');
  const mlab=SPEND_YEARS.map((yr,i)=>{const x=(PL+i/(n>1?n-1:1)*cW).toFixed(1);
    return`<text x="${x}" y="${H-5}" fill="#252e42" font-family="IBM Plex Mono" font-size="7" text-anchor="middle">${yr}</text>`;}).join('');
  const svgEl=document.getElementById('spend-lc-svg');svgEl.setAttribute('viewBox',`0 0 ${W} ${H}`);svgEl.setAttribute('height',H);
  svgEl.innerHTML=`<defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f06a1a" stop-opacity=".2"/>
    <stop offset="100%" stop-color="#f06a1a" stop-opacity="0"/></linearGradient></defs>${gridH}
    <polygon points="${pts.join(' ')} ${W-PR},${PT+cH} ${PL},${PT+cH}" fill="url(#sg)"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="#f06a1a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>${mlab}`;}

function renderProd(){const{start,end}=range();let oilS=PROD_OIL,gasS=PROD_GAS;
  if(S.fluid==='oil')gasS=Array(N).fill(0);if(S.fluid==='gas')oilS=Array(N).fill(0);
  const avgOil=avgR(oilS,start,end),avgGas=avgR(gasS,start,end);document.getElementById('prod-oil-val').textContent=`${avgOil}k`;
  document.getElementById('prod-gas-val').textContent=avgGas;lineChart('prod-lc-svg',oilS,'#f06a1a',gasS,'#3d9bff',start,end,130);
  const recs=[{r:'shale',nm:'Shale',share:.82},{r:'tight',nm:'Tight',share:.12},{r:'conv',nm:'Convencional',share:.06}].map(rc=>{
    const v=Math.round(avgOil*rc.share);return{nm:rc.nm,cl:'#f06a1a',v,lbl:`${v}k bbl/d`};});barList('bl-prod-rec',recs);
  document.getElementById('sb-prod-rec').textContent='Mar 2026';const ops=fops();
  const rkP=ops.map(o=>{const v=o.oil[N-1];const y=yoy(o.oil,start,end);return{nm:o.nm,cl:o.cl,v:`${v}k`,sub:`${Math.round(v/487*100)}% prod. nacional`,dir:y.dir,dt:fmtYoy(y,' aa')};
  }).sort((a,b)=>parseFloat(b.v)-parseFloat(a.v));rankList('rk-prod-oil',rkP);}

function render(){renderPozos();renderClientes();renderFractura();renderBalance();renderSpend();renderProd();}

function setF(g,v){
  if(g==='prov'||g==='rec'){
    if(v==='todas'||v==='todos'){S[g]=new Set([v]);}else{
      if(S[g].has('todas')||S[g].has('todos'))S[g]=new Set();S[g].has(v)?S[g].delete(v):S[g].add(v);if(S[g].size===0)S[g].add(g==='prov'?'todas':'todos');}
    document.querySelectorAll(`[data-g="${g}"]`).forEach(b=>{const bv=b.dataset.v;
      b.classList.toggle('on',S[g].has(bv)||(S[g].has('todas')&&bv==='todas')||(S[g].has('todos')&&bv==='todos'));});
  }else if(g==='spend-yr'){S.spendYr=v;document.querySelectorAll(`[data-g="${g}"]`).forEach(b=>b.classList.toggle('on',b.dataset.v===v));
    renderSpend();return;
  }else{S[g]=v;document.querySelectorAll(`[data-g="${g}"]`).forEach(b=>b.classList.toggle('on',b.dataset.v===v));}
  document.querySelectorAll('.mini,.hero-card').forEach(k=>k.style.opacity='.35');
  setTimeout(()=>{render();document.querySelectorAll('.mini,.hero-card').forEach(k=>k.style.opacity='1');},140);}
document.querySelectorAll('[data-g]').forEach(b=>b.addEventListener('click',()=>setF(b.dataset.g,b.dataset.v)));

document.querySelectorAll('.vt').forEach(t=>t.addEventListener('click',()=>{S.view=t.dataset.v;
  document.querySelectorAll('.vt').forEach(x=>x.classList.remove('on'));t.classList.add('on');
  document.querySelectorAll('.pg').forEach(p=>p.classList.remove('on'));document.getElementById(`pg-${t.dataset.v}`).classList.add('on');}));

document.querySelectorAll('.bni').forEach(b=>b.addEventListener('click',()=>{const pg=b.dataset.n;
  document.querySelectorAll('.bni').forEach(x=>x.classList.remove('on'));b.classList.add('on');
  document.querySelectorAll('.vt').forEach(x=>x.classList.remove('on'));
  document.querySelector(`.vt[data-v="${pg}"]`)?.classList.add('on');
  document.querySelectorAll('.pg').forEach(p=>p.classList.remove('on'));document.getElementById(`pg-${pg}`).classList.add('on');}));

render();

