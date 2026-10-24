'use strict';
// Save/export a text file. Android WebView ignores blob downloads, so inside the native app write to cache and open the share sheet.
async function saveFile(name,text,type){
  const C=window.Capacitor;
  if(C&&C.isNativePlatform&&C.isNativePlatform()){
    try{const{Filesystem,Share}=C.Plugins;
      const r=await Filesystem.writeFile({path:name,data:text,directory:'CACHE',encoding:'utf8'});
      await Share.share({title:name,url:r.uri,dialogTitle:'Save or send '+name});return}
    catch(e){if(e&&/cancel/i.test(e.message||''))return;toast('Export failed')}}
  const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([text],{type}));l.download=name;l.click()}

const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
// Ranks (the "Ascent"): 10 XP per set, 100 XP for the first real workout of each day (3+ sets), 50 XP per personal record
const RANKS=[['Iron',0],['Bronze',300],['Silver',800],['Gold',1600],['Platinum',3000],['Diamond',5000],['Titan',8000]];
const $=s=>document.querySelector(s);
const todayIdx=()=>(new Date().getDay()+6)%7;
const dstr=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let USER=localStorage.getItem('ironclad_session'),S,authMode='login',session=null,PH=[],tab='home',editDay=todayIdx(),rest=0,wl=null,tt,opener=null,HE=null,PK={q:'',m:'',eq:'',sel:[]};
let cal=(d=>({y:d.getFullYear(),m:d.getMonth()}))(new Date()),selDay=null,pex='',pmt='auto',hv='log',dg=null,cd=null;
const OPEN=new Set();
const blank=()=>({routines:{},history:[],photos:[],custom:[],last:{},pr:{},fav:[],recent:[],bw:[],set:{unit:'kg',theme:'auto',rest:90,goal:3,pg:'tip',bwGoal:''},session:null});
const KEY=()=>'ironclad_u_'+USER;
const sv=()=>{if(!USER||!S)return false;S.session=session;try{localStorage.setItem(KEY(),JSON.stringify(S));return true}catch(e){toast('Storage full – export a backup and delete old data');return false}};
const accts=()=>{try{return JSON.parse(localStorage.getItem('ironclad_accts'))||{}}catch(e){return{}}};
function toast(t){const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(tt);tt=setTimeout(()=>e.hidden=true,2400)}

// ---- accounts (local only, not real security) ----
function sha256js(m){const b=new TextEncoder().encode(m),l=b.length,n=((l+9+63)>>6)<<4,w=new Uint32Array(n);
  for(let i=0;i<l;i++)w[i>>2]|=b[i]<<(24-(i&3)*8);w[l>>2]|=0x80<<(24-(l&3)*8);w[n-1]=l*8;
  const K=[],H=[];for(let i=0,p=2;i<64;p++){let c=1;for(let j=2;j*j<=p;j++)if(p%j===0){c=0;break}if(c){if(i<8)H[i]=Math.pow(p,.5)%1*4294967296|0;K[i++]=Math.pow(p,1/3)%1*4294967296|0}}
  const rr=(x,k)=>x>>>k|x<<32-k,W=new Int32Array(64);
  for(let o=0;o<n;o+=16){for(let i=0;i<64;i++)W[i]=i<16?w[o+i]:(rr(W[i-2],17)^rr(W[i-2],19)^W[i-2]>>>10)+W[i-7]+(rr(W[i-15],7)^rr(W[i-15],18)^W[i-15]>>>3)+W[i-16]|0;
    let[a,B,c,d,e,f,g,h]=H;
    for(let i=0;i<64;i++){const t1=h+(rr(e,6)^rr(e,11)^rr(e,25))+(e&f^~e&g)+K[i]+W[i]|0,t2=(rr(a,2)^rr(a,13)^rr(a,22))+(a&B^a&c^B&c)|0;h=g;g=f;f=e;e=d+t1|0;d=c;c=B;B=a;a=t1+t2|0}
    [a,B,c,d,e,f,g,h].forEach((v,i)=>H[i]=H[i]+v|0)}
  return H.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('')}
// Same SHA-256 result with or without HTTPS, so one account works everywhere
async function hash(p,salt){const m=salt+p;if(window.crypto&&crypto.subtle)try{return[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(m)))].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){}return sha256js(m)}
const rnd=()=>window.crypto&&crypto.getRandomValues?[...crypto.getRandomValues(new Uint8Array(12))].map(x=>x.toString(16).padStart(2,'0')).join(''):Math.random().toString(36).slice(2);

// ---- state ----
function load(){try{S=JSON.parse(localStorage.getItem(KEY()))}catch(e){}
  S=Object.assign(blank(),S||{});S.set=Object.assign(blank().set,S.set);
  S.history.forEach((h,i)=>{h.id=h.id||Date.parse(h.date)+i;(h.log||[]).forEach(l=>{if(typeof l.sets==='number')l.sets=Array.from({length:l.sets},()=>({kg:l.kg===''||l.kg==null?'':+l.kg,reps:''}))})});
  Object.keys(S.last).forEach(k=>{if(!Array.isArray(S.last[k]))S.last[k]=[{kg:S.last[k]===''?'':+S.last[k],reps:''}]});
  rebuild();session=S.session;theme();loadPhotos()}
const theme=()=>document.documentElement.dataset.theme=S?S.set.theme:'auto';
if(USER)load();
const R=i=>S.routines[i]||(S.routines[i]={name:'',items:[]});
const UN=()=>S.set.unit;
const kgd=v=>v===''||v==null?'':+(UN()==='lb'?v*2.20462:v).toFixed(1);
const tokg=v=>v===''||v==null?'':(UN()==='lb'?v/2.20462:+v);
const fmtSet=(s,t)=>s.kg!==''&&s.kg!=null&&+s.kg?`${kgd(s.kg)} ${UN()} × ${s.reps||'?'}${t?' s':''}`:`${s.reps||'?'} ${t?'sec':'reps'}`;
const score=s=>{const k=+s.kg||0,r=+s.reps||0;return k>0?k*(1+(r||1)/30):r};
// Time-based exercises (planks, holds, carries, cardio machines) log seconds instead of reps; an item's own `tm` flag overrides the guess
const TM=/\b(plank|hold|wall sit|l-sit|carry|battle ropes?|bike|ski erg|run|running|sprints?|skipping|jump rope|treadmill|elliptical|bear crawl|mountain climber|dead hang)\b/i;
const prk=(id,ss)=>ss.some(s=>+s.kg>0)?id:id+'#r'; // weighted and unweighted records never compare against each other
const isT=it=>it.tm!=null?!!it.tm:(e=>TM.test(e.name||'')||/cardio/i.test(e.m||''))(ex(it));
const U=it=>isT(it)?'sec':'reps';
// Supersets: consecutive items sharing the same `ss` id form one block (a lone item is a block of 1)
const blocks=l=>{const b=[];l.forEach((it,i)=>{const p=b[b.length-1];it.ss&&p&&l[p[p.length-1]].ss===it.ss?p.push(i):b.push([i])});return b};
const hs=()=>S.history.slice().sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.id-b.id);
const bws=()=>S.bw.slice().sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
// Double progression: hit the target on every set -> add weight (or +1 rep / +5 s when unweighted); otherwise repeat the load
function sugg(it){const lt=S.last[it.id];if(!lt||!lt.length||S.set.pg==='off')return null;
  const t=isT(it),tr=+it.reps||0,n=Array.isArray(it.sets)?it.sets.length:it.sets,w=Math.max(0,...lt.map(s=>+s.kg||0)),hit=lt.length>=n&&lt.every(s=>(+s.reps||0)>=tr),u=t?' s':' reps',st=UN()==='lb'?2.27:2.5;
  if(!hit)return{d:0,reps:tr,txt:`Repeat ${w?kgd(w)+' '+UN()+' × ':''}${tr}${u} on every set`};
  if(w>0&&!t)return{d:st,reps:tr,txt:`Add weight: +${kgd(st)} ${UN()} on every set (top set ${kgd(w+st)} ${UN()} × ${tr})`};
  return{d:0,reps:tr+(t?5:1),txt:`Go for ${tr+(t?5:1)}${u}`}}
// per-set weights keep your ramps (e.g. 10/12/14 becomes 12.5/14.5/16.5)
const sgKg=(it,g,k)=>{const lt=S.last[it.id]||[],l=lt[k]||lt[lt.length-1]||{};return l.kg===''||l.kg==null?'':l.kg+g.d};
function stats(id){const rows=hs().flatMap(h=>(h.log||[]).filter(l=>l.id===id&&l.sets.some(x=>!x.wu)).map(l=>({d:h.date,tm:l.tm,s:l.sets.filter(x=>!x.wu)}))),k=s=>+s.kg||0,r=s=>+s.reps||0;
  return{rows,top:x=>Math.max(0,...x.s.map(k)),e1:x=>Math.max(0,...x.s.map(s=>k(s)*(1+r(s)/30))),vol:x=>x.s.reduce((a,s)=>a+k(s)*r(s),0),rp:x=>Math.max(0,...x.s.map(r))}}
function gainTxt(id){const{rows,top}=stats(id);if(rows.length<2||top(rows[0])<=0)return'';const d=top(rows[rows.length-1])-top(rows[0]);return d>0?`💪 +${kgd(d)} ${UN()} since you started`:''}
// Match every built-in exercise to its dataset GIF: all name words must appear, then prefer same equipment and the shortest name
let GM={};
function matchGifs(){GM={};if(!DBX.length)return;const tk=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(Boolean),D=DBX.map(d=>({d,t:new Set(tk(d.name))}));
  LIB.forEach(e=>{const nt=tk(e.name),eq=(e.q||'').toLowerCase();let best=null,bs=-1;
    D.forEach(({d,t})=>{if(!nt.every(w=>t.has(w)||t.has(w.replace(/s$/,''))))return;const s=100-t.size+(d.q.toLowerCase().replace(/\s/g,'')===eq?30:0);if(s>bs){bs=s;best=d}});
    if(best)GM[e.id]=best})}
const allEx=()=>LIB.concat(DBX,S.custom);
const snap=e=>({id:e.id,name:e.name,m:e.m,q:e.q,t:e.t,gif:e.gif,steps:e.steps,sec:e.sec,g:e.g,p:e.p,r:e.r,w:e.w});
// Looks an exercise up by id; falls back to the copy stored inside the routine/session item (works offline)
const ex=x=>{const it=typeof x==='string'?{id:x}:x,id=OLD[it.id]||it.id,e=allEx().find(y=>y.id===id);
  if(!e)return it.name?it:{id,name:'Unknown',m:'',g:''};
  let r=e;if(!e.gif){const d=GM[e.id];if(d)r={...e,gif:d.gif,steps:d.steps,t:d.t,sec:d.sec}}
  return r.gif||!it.gif?r:{...r,gif:it.gif,steps:it.steps||r.steps,t:r.t||it.t,sec:r.sec||it.sec}};
function backfill(){let c=0;const fix=it=>{if(!it.name||!it.gif){const e=ex(it);if(e.name!=='Unknown'&&(e.gif||!it.name)){Object.assign(it,snap(e),{id:it.id});c++}}};
  Object.values(S.routines).forEach(r=>r.items.forEach(fix));if(session)session.items.forEach(fix);if(c)sv()}
function xp(){return S.history.reduce((a,h)=>a+h.xp,0)}
function rank(){const x=xp();let i=0;RANKS.forEach((r,k)=>{if(x>=r[1])i=k});
  const nx=RANKS[i+1];return{i,name:RANKS[i][0],next:nx&&nx[0],pct:nx?(x-RANKS[i][1])/(nx[1]-RANKS[i][1])*100:100,left:nx?nx[1]-x:0,x}}
// Streak: counts workout days in a row, allowing one rest day between sessions
function streak(){const ds=[...new Set(S.history.map(h=>h.date))].sort().reverse();if(!ds.length)return 0;
  const gap=(a,b)=>Math.round((new Date(a)-new Date(b))/864e5);
  if(gap(dstr(new Date()),ds[0])>2)return 0;let n=1;
  for(let i=1;i<ds.length;i++){if(gap(ds[i-1],ds[i])<=2)n++;else break}return n}
function rebuild(s=S){s.pr={};s.last={};s.history.slice().sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.id-b.id).forEach(h=>(h.log||[]).forEach(l=>{
  const w=l.sets.filter(x=>!x.wu);if(!w.length)return;const b=Math.max(...w.map(score)),k=prk(l.id,w);if(s.pr[k]==null||b>s.pr[k])s.pr[k]=b;s.last[l.id]=w}))}

// ---- photos in IndexedDB ----
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('ironclad',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const tx=(mode,fn)=>idb().then(db=>new Promise((res,rej)=>{const t=db.transaction('photos',mode),r=fn(t.objectStore('photos'));t.oncomplete=()=>res(r&&r.result);t.onerror=t.onabort=()=>rej(t.error)}));
async function loadPhotos(){PH.forEach(p=>URL.revokeObjectURL(p.url));PH=[];
  try{if(S.photos.length){for(const p of[...S.photos].reverse()){const b=await(await fetch(p.src)).blob();await tx('readwrite',s=>s.put({id:Date.now()+Math.random(),user:USER,date:p.date,blob:b}))}S.photos=[];sv()}
    PH=(await tx('readonly',s=>s.getAll())).filter(p=>p.user===USER).sort((a,b)=>b.id-a.id);PH.forEach(p=>p.url=URL.createObjectURL(p.blob))}catch(e){PH=[]}
  if(tab==='album')render()}
function addPhotos(files){files.forEach(f=>{const im=new Image(),u=URL.createObjectURL(f);im.onload=()=>{
  const k=Math.min(1,1000/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);
  c.toBlob(b=>{if(!b)return toast('Could not read that image');const p={id:Date.now()+Math.random(),user:USER,date:dstr(new Date()),blob:b};
    tx('readwrite',s=>s.put(p)).then(()=>{p.url=URL.createObjectURL(b);PH.unshift(p);if(tab==='album')render()}).catch(()=>toast('Photo not saved – browser storage is full or unavailable'))},'image/jpeg',.8)};
  im.onerror=()=>toast('Could not read that image');im.src=u})}

// ---- views ----
function render(){
  $('#tabs').hidden=!USER;
  if(!USER){$('#rankPill').innerHTML='';$('#view').innerHTML=authView();return}
  document.querySelectorAll('#tabs button').forEach(b=>{const on=b.dataset.tab===tab;b.classList.toggle('on',on);on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current')});
  $('#rankPill').innerHTML=badge(rank().i,22)+rank().name;
  $('#view').innerHTML={home,train,routine,history:histTab,album,profile}[tab]();
  prog();tickRest();if(session)wake();
}
function home(){
  const r=rank(),t=todayIdx(),mon=new Date();mon.setDate(mon.getDate()-t);let wk=0;
  const week=DAYS.map((d,i)=>{const x=new Date(mon);x.setDate(mon.getDate()+i);const did=S.history.some(h=>h.date===dstr(x));wk+=did;
    return `<span class="${did?'done ':''}${i===t?'today':''}">${d[0]}</span>`}).join('');
  const rt=R(t),g=S.set.goal;
  const today=session?`<div class="mute">In progress</div><h2>${esc(session.name)}</h2><button class="btn full" data-act="resume">Resume workout</button><button class="btn ghost full" data-act="pickDay">Start a different workout</button>`
    :rt.rest?`<div class="mute">Today · ${DAYS[t]}</div><h2>Rest day</h2><button class="btn ghost full" data-act="pickDay">Train anyway</button>`
    :`<div class="mute">Today · ${DAYS[t]}</div><h2>${rt.items.length?esc(rt.name||'Workout'):'No routine set'}</h2><button class="btn full" data-act="startToday">${rt.items.length?'Start workout':'Choose a routine'}</button>`;
  return `<div class="card"><div class="mute">Current streak</div><div class="row between"><div class="big"><svg class="flame" viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 3-7 1 2 2 2 3 0z" fill="var(--acc)"/></svg>${streak()}<span class="mute" style="font-size:20px"> days</span></div>
    <div class="mute">${S.history.length} workouts total</div></div><div class="week">${week}</div></div>
  <div class="card"><div class="row between"><h3>Weekly goal</h3><span class="mute">${wk}/${g} workouts</span></div><div class="bar"><i style="width:${Math.min(100,wk/g*100)}%"></i></div></div>
  <div class="card"><div class="row between"><div class="row">${badge(r.i,48)}<h3>${r.name}</h3></div><span class="mute">${r.x} XP</span></div>
    <div class="bar"><i style="width:${r.pct}%"></i></div><div class="mute">${r.next?`${r.left} XP to ${r.next}`:'Top rank reached'}</div></div>
  <div class="card">${today}</div>${bwCard()}`;
}
function train(){
  if(!session)return `<h2>Train</h2><div class="card"><p class="mute" style="margin-bottom:12px">Starts today's routine if you set one.</p>
    <button class="btn full" data-act="startToday">Start workout</button><button class="btn ghost full" data-act="pickDay">Start a different day's routine</button></div>`;
  return `<div class="thead"><h2>${esc(session.name)}</h2><div class="row between mute"><span id="prog"></span><span id="dur"></span></div><div class="bar"><i id="pbar"></i></div></div>`+
  blocks(session.items).map(b=>{const items=session.items,gd=i=>`<details data-i="${i}"${OPEN.has(i)?' open':''}><summary>${b.length>1?'How to do '+esc(ex(items[i]).name):'How to do it'}</summary>${guideHtml(ex(items[i]))}</details>`;
    if(b.length>1){const rn=Math.max(...b.map(i=>items[i].sets.length));
      return `<div class="card ss-card"><div class="mute">🔗 Superset · alternate the exercises, rest after each round</div>${b.map(i=>exHead(items[i],i)).join('')}${Array.from({length:rn},(_,k)=>`<div class="rnd"><b>Round ${k+1}</b>${b.filter(i=>!items[i].skip&&items[i].sets[k]).map(i=>setRow(items[i],i,k,'ABCDEF'[b.indexOf(i)]+(k+1))).join('')}</div>`).join('')}${b.map(gd).join('')}</div>`}
    const i=b[0],it=items[i];return `<div class="card${it.skip?' skipped':''}">${exHead(it,i)}${it.skip?'':`<div class="sl">${it.sets.map((s,k)=>setRow(it,i,k)).join('')}</div>${gd(i)}`}</div>`}).join('')+
  `<button class="btn full" data-act="finish">Finish workout</button><button class="btn ghost full" data-act="cancel">Cancel</button>`;
}
function exHead(it,i){const e=ex(it),lt=S.last[it.id],t=isT(it),sg=!it.skip&&S.set.pg==='tip'&&sugg(it),gn=gainTxt(it.id);
  return `<div class="ex">${gif(e,i)}<div class="grow"><h3>${esc(e.name)}</h3><div class="mute">${it.sets.length} sets × ${it.reps} ${U(it)}${e.t?` · ${esc(e.t)}`:''}${!lt&&it.kg!==''&&it.kg!=null?` · start ${kgd(it.kg)} ${UN()}`:''}</div>
    ${lt&&lt.length&&!it.skip?`<div class="mute">Last time: ${esc(lt.map(s=>fmtSet(s,t)).join(', '))}</div>`:''}${gn&&!it.skip?`<div class="mute">${gn}</div>`:''}${sg?`<div class="mute">💡 ${esc(sg.txt)} <button class="btn ghost sm" data-act="apply" data-i="${i}">Apply</button></div>`:''}${it.note?`<div class="mute">📝 ${esc(it.note)}</div>`:''}
    ${!t&&!it.skip&&!/body/i.test(e.q||'')?`<button class="btn ghost sm" style="margin-top:6px" data-act="plates" data-i="${i}">Plates</button>`:''}</div>
    <button class="btn ghost sm" data-act="skip" data-i="${i}">${it.skip?'Undo skip':'Skip'}</button></div>`}
function setRow(it,i,k,lb){const s=it.sets[k],t=isT(it),wt=!(t&&/body/i.test(ex(it).q||'')),run=cd&&cd.i===i&&cd.s===k;
  return `<div class="srow"><button class="chip${s.done?' on':''}" aria-pressed="${!!s.done}" data-act="set" data-i="${i}" data-s="${k}"><span class="cb"><svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5"/></svg></span>${lb||'Set '+(k+1)}</button>
    <button class="stp" data-act="wu" data-i="${i}" data-s="${k}" aria-pressed="${!!s.wu}" aria-label="Warm-up set" title="Warm-up: no XP, ignored by records" style="${s.wu?'color:var(--ok)':''}">W</button>
    ${wt?`<span class="stepper"><button class="stp" data-act="step" data-d="-1" data-i="${i}" data-s="${k}" aria-label="Less weight">−</button><input class="n" type="number" inputmode="decimal" step="0.5" min="0" placeholder="${UN()}" value="${kgd(s.kg)}" data-act="skg" data-i="${i}" data-s="${k}" aria-label="Set ${k+1} weight in ${UN()}"><button class="stp" data-act="step" data-d="1" data-i="${i}" data-s="${k}" aria-label="More weight">+</button></span><span aria-hidden="true">×</span>`:''}
    <input class="n" type="number" inputmode="numeric" min="0" placeholder="${U(it)}" value="${s.reps}" data-act="srep" data-i="${i}" data-s="${k}" aria-label="Set ${k+1} ${t?'seconds':'reps'}">${t?`<span class="mute">s</span><button class="btn ghost sm" data-act="cd" data-i="${i}" data-s="${k}">${run?'■':'▶ Timer'}</button>`:''}</div>`}
function platesModal(i){const it=session.items[i],s=it.sets.find(x=>!x.done&&!x.wu)||it.sets[0],bar=UN()==='lb'?45:20;
  modal(`<h2>Plate calculator</h2><div class="row" style="margin-bottom:10px"><label for="pt">Target</label><input id="pt" type="number" step="0.5" value="${kgd(s.kg)}"><label for="pb">Bar</label><input id="pb" type="number" step="0.5" value="${bar}"></div><p id="pout" style="font-weight:800;margin:12px 0">${plateTxt(+kgd(s.kg)||0,bar)}</p><button class="btn full" data-act="close">Close</button>`)}
function plateTxt(t,b){const P=UN()==='lb'?[45,35,25,10,5,2.5]:[25,20,15,10,5,2.5,1.25];let r=(t-b)/2;if(!(r>=0))return 'Target is below the bar weight';const o=[];P.forEach(p=>{while(r>=p-1e-9){o.push(p);r-=p}});
  return (o.length?`Per side: ${o.join(' + ')} ${UN()}`:'Just the bar')+(r>0.01?` · ${+(r*2).toFixed(2)} ${UN()} short of target`:'')}
function bwCard(){const b=bws(),l=b[b.length-1],p=b[b.length-2],g=S.set.bwGoal,dl=l&&p?l.kg-p.kg:0;
  return `<div class="card"><div class="row between"><h3>Body weight</h3><span class="mute">${l?l.d:'No weigh-ins yet'}</span></div>${l?`<div class="row between"><div class="big" style="font-size:40px">${kgd(l.kg)}<span class="mute" style="font-size:18px">${UN()}</span></div><div class="mute" style="text-align:right">${p?`${dl>0?'+':''}${kgd(dl)} ${UN()} since last`:''}${g!==''&&g!=null?`<br>${kgd(Math.abs(l.kg-g))} ${UN()} ${l.kg>g?'above':'below'} goal`:''}</div></div>`:''}<button class="btn${l?' ghost':''} full" style="margin-top:12px" data-act="bw">Log weigh-in</button></div>`}
function bwModal(){const b=bws().reverse().slice(0,8);
  modal(`<h2>Weigh-in</h2><div class="row" style="margin-bottom:8px"><input id="bwv" type="number" inputmode="decimal" step="0.1" min="0" placeholder="Weight (${UN()})" aria-label="Body weight in ${UN()}"><input id="bwd" type="date" value="${dstr(new Date())}" aria-label="Date"></div>
  <input id="bwg" type="number" inputmode="decimal" step="0.1" min="0" placeholder="Goal weight (${UN()}, optional)" value="${kgd(S.set.bwGoal)}" aria-label="Goal weight" style="margin-bottom:12px"><button class="btn full" data-act="bwsave">Save</button>
  ${b.map(x=>`<div class="row between" style="margin-top:10px"><span>${x.d} · ${kgd(x.kg)} ${UN()}</span><button class="btn ghost sm" data-act="bwdel" data-d="${x.d}">Delete</button></div>`).join('')}<button class="btn ghost full" data-act="close" style="margin-top:16px">Close</button>`);$('#bwv').focus()}
function prog(){const p=$('#prog');if(!session||!p)return;const a=session.items.filter(i=>!i.skip),d=a.reduce((n,i)=>n+i.sets.filter(s=>s.done).length,0),t=a.reduce((n,i)=>n+i.sets.length,0),sk=session.items.length-a.length;
  p.textContent=`${d}/${t} sets done${sk?` · ${sk} skipped`:''}`;$('#pbar').style.width=(t?d/t*100:0)+'%'}
function gif(e,i){return `<div class="gif" role="button" tabindex="0" data-act="zoom" data-i="${i}" aria-label="Enlarge ${esc(e.name)}">${e.gif?`<img src="${esc(e.gif)}" alt="${esc(e.name)} demonstration" crossorigin="anonymous" loading="lazy" onerror="this.replaceWith('🏋️')">`:fig(e)}</div>`}
function guideHtml(e){return (e.steps?`<ol class="steps">${e.steps.map(x=>`<li>${esc(x.replace(/^step:?\s*\d+[.:]?\s*/i,''))}</li>`).join('')}</ol>`:`<p style="margin-top:8px">${esc(e.g||'')}</p>`)+
  (e.sec&&e.sec.length?`<p class="mute" style="margin-top:8px">Also works: ${esc(e.sec.join(', '))}</p>`:'')}
function startRest(sec){rest=Date.now()+(sec||S.set.rest)*1e3;$('#rest').hidden=false;tickRest()}
function stopCd(sec){const c=cd;cd=null;if(!session||!c)return;const s=session.items[c.i].sets[c.s];s.reps=sec;sv();render();const ch=document.querySelector(`.chip[data-i="${c.i}"][data-s="${c.s}"]`);if(ch&&!s.done)ch.click()}
function tickRest(){const el=$('#rest');
  if(cd){const l=Math.ceil((cd.t0+cd.tg*1e3-Date.now())/1e3),bt=document.querySelector(`[data-act=cd][data-i="${cd.i}"][data-s="${cd.s}"]`);if(l<=0){navigator.vibrate&&navigator.vibrate([200,100,200]);return stopCd(cd.tg)}if(bt)bt.textContent='■ '+l+'s'}
  const d=$('#dur');if(session&&d){const s=Math.floor((Date.now()-session.start)/1e3);d.textContent=`⏱ ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
  if(!rest){el.hidden=true;return}const l=Math.ceil((rest-Date.now())/1e3);
  if(l<=0){rest=0;el.hidden=true;toast('Rest over – next set');navigator.vibrate&&navigator.vibrate(200);return}
  $('#restT').textContent=`Rest ${Math.floor(l/60)}:${String(l%60).padStart(2,'0')}`}
async function wake(){try{if(session&&navigator.wakeLock&&!wl){wl=await navigator.wakeLock.request('screen');wl.onrelease=()=>wl=null}}catch(e){}}
function unwake(){try{wl&&wl.release()}catch(e){}wl=null}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake()});

function routine(){
  const rt=R(editDay),n=rt.items.length,bl=blocks(rt.items);
  return `<h2>Routine</h2><div class="days">${DAYS.map((d,i)=>`<button class="${i===editDay?'on ':''}${R(i).items.length||R(i).rest?'has':''}" data-act="day" data-i="${i}">${d.slice(0,3)}</button>`).join('')}</div>
  <div class="card"><label class="mute" for="rname">Name for ${DAYS[editDay]}</label>
  <input id="rname" placeholder="e.g. Chest & Triceps" value="${esc(rt.name)}" data-act="rename">
  <label class="row" style="margin-top:10px"><input type="checkbox" style="width:auto" data-act="restday"${rt.rest?' checked':''}> Rest day</label>
  <div class="row" style="margin-top:10px"><select id="cpto" aria-label="Copy this day to"><option value="">Copy this day to…</option>${DAYS.map((d,i)=>i===editDay?'':`<option value="${i}">${d}</option>`).join('')}</select><button class="btn ghost sm" style="white-space:nowrap" data-act="programs">Programs</button></div></div>
  ${rt.items.map((it,i)=>{const t=isT(it),nx=rt.items[i+1],lk=bl.some(b=>b.length>1&&b.includes(i)),e=ex(it),nm=esc(e.name),wt=!(t&&/body/i.test(e.q||''));return `<div class="card rc${lk?' lk':''}"><div class="row between"><div class="row">${gif(e,i)}<h3>${nm}</h3></div><div class="row"><button class="btn ghost sm" data-act="del" data-i="${i}">Remove</button><button class="dh" data-drag="${i}" aria-label="Reorder ${nm}: drag, or use the up and down arrow keys">⠿</button></div></div>
    <div class="row wrap" style="margin-top:10px"><label>Sets</label><input class="n" type="number" min="1" value="${it.sets}" data-act="sets" data-i="${i}"><label>${t?'Sec':'Reps'}</label><input class="n" type="number" min="1" value="${it.reps}" data-act="reps" data-i="${i}">${wt?`<label>${UN()}</label><input class="n" type="number" step="0.5" min="0" placeholder="start" value="${kgd(it.kg)}" data-act="wkg" data-i="${i}" aria-label="Starting weight in ${UN()}">`:''}</div>
    <div class="row wrap" style="margin-top:8px"><select data-act="tm" data-i="${i}" aria-label="Measured in" style="width:auto"><option value="0"${t?'':' selected'}>reps</option><option value="1"${t?' selected':''}>seconds</option></select><label>Rest</label><input class="n" type="number" min="0" placeholder="${S.set.rest}" value="${it.rs||''}" data-act="irest" data-i="${i}" aria-label="Rest seconds after this exercise"></div>
    <input placeholder="Note (tempo, seat setting…)" value="${esc(it.note||'')}" data-act="note" data-i="${i}" aria-label="Note" style="margin-top:8px">${nx?`<button class="btn ghost sm" style="margin-top:10px" data-act="link" data-i="${i}">${it.ss&&it.ss===nx.ss?'✂ Unlink superset':'🔗 Superset with next'}</button>`:''}</div>`}).join('')}
  ${n?'':'<div class="card"><p class="mute">No exercises yet. Add some, or load a ready-made program.</p></div>'}<button class="btn full" data-act="addEx">Add exercise</button>`;
}
// Ready-made programs: [id, sets, reps]
const DX={push:[['bench-press',4,8],['incline-dumbbell-press',3,10],['overhead-press',3,8],['lateral-raise',3,15],['triceps-pushdown',3,12]],
  pull:[['pull-up',4,8],['barbell-row',4,8],['face-pull',3,15],['dumbbell-curl',3,12],['hammer-curl',3,12]],
  legs:[['back-squat',4,8],['romanian-deadlift',3,10],['leg-press',3,12],['standing-calf-raise',4,15]],
  upper:[['bench-press',4,8],['barbell-row',4,8],['overhead-press',3,10],['lat-pulldown',3,10],['dumbbell-curl',3,12],['triceps-pushdown',3,12]],
  a:[['back-squat',5,5],['bench-press',5,5],['barbell-row',5,5]],b:[['back-squat',5,5],['overhead-press',5,5],['deadlift',1,5]]};
DX.lower=DX.legs;
const NM={push:'Push',pull:'Pull',legs:'Legs',upper:'Upper',lower:'Lower',a:'Workout A',b:'Workout B'};
const PRG={ppl:['Push / Pull / Legs','6 days: push, pull, legs twice, rest on Thursday',['push','pull','legs',0,'push','pull','legs']],
  ul:['Upper / Lower','4 days a week',['upper','lower',0,'upper','lower',0,0]],
  fx:['5×5 strength','3 days a week, alternating A and B',['a',0,'b',0,'a',0,0]]};
function album(){return `<h2>Album</h2><label class="btn full" style="display:block;text-align:center;cursor:pointer;margin-bottom:14px">Upload photos<input type="file" id="up" accept="image/*" multiple hidden></label>
  ${PH.length?`<div class="photos">${PH.map((p,i)=>`<img src="${p.url}" alt="Progress photo ${p.date}" role="button" tabindex="0" data-act="photo" data-i="${i}">`).join('')}</div>`:'<p class="mute">No photos yet. Add your first progress photo.</p>'}`}
function histTab(){
  if(hv==='prog')return '<h2>Progress</h2>'+seg()+progView();
  const f=new Date(cal.y,cal.m,1),off=(f.getDay()+6)%7,nd=new Date(cal.y,cal.m+1,0).getDate(),has=new Set(S.history.map(h=>h.date)),td=dstr(new Date());
  let c='<i></i>'.repeat(off);for(let d=1;d<=nd;d++){const ds=dstr(new Date(cal.y,cal.m,d));
    c+=`<button class="cd${has.has(ds)?' has':''}${ds===td?' today':''}${ds===selDay?' on':''}" data-act="cday" data-d="${ds}" aria-label="${ds}${has.has(ds)?', workout logged':''}">${d}</button>`}
  const list=S.history.filter(h=>!selDay||h.date===selDay).sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:b.id-a.id).slice(0,selDay?50:15);
  const names={};S.history.forEach(h=>(h.log||[]).forEach(l=>names[l.id]=l.name||ex(l.id).name));
  return `<h2>History</h2>${seg()}<div class="card"><div class="row between" style="margin-bottom:10px"><button class="btn ghost sm" data-act="cal" data-i="-1" aria-label="Previous month">‹</button><h3>${f.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h3><button class="btn ghost sm" data-act="cal" data-i="1" aria-label="Next month">›</button></div>
  <div class="cal">${DAYS.map(d=>`<span>${d[0]}</span>`).join('')}${c}</div></div>
  <h3 style="margin-bottom:8px">${selDay?`Workouts on ${selDay}`:'Recent workouts'}</h3>
  ${list.length?list.map(h=>`<button class="pick" data-act="hist" data-id="${h.id}"><h3>${esc(h.name)}</h3><span class="mute">${h.date} · ${h.sets} sets · ${h.xp} XP${h.dur?` · ${h.dur} min`:''}${h.pr&&h.pr.length?` · 🏆 ${h.pr.length} PR`:''}</span></button>`).join(''):'<p class="mute" style="margin-bottom:14px">No workouts here.</p>'}
`;
}
const MT={auto:'Best set',e1:'Estimated 1RM',vol:'Volume',rep:'Reps / seconds'};
const seg=()=>`<div class="seg">${[['log','Log'],['prog','Progress']].map(([v,n])=>`<button class="${hv===v?'on':''}" aria-pressed="${hv===v}" data-act="hv" data-v="${v}">${n}</button>`).join('')}</div>`;
function lineSvg(pts,fm,lb='Best'){const vs=pts.map(p=>p.v),lo=Math.min(...vs),hi=Math.max(...vs),X=i=>20+i*260/(pts.length-1),Y=v=>hi===lo?60:100-(v-lo)/(hi-lo)*80;
  return `<svg class="chart" viewBox="0 0 300 120" role="img" aria-label="Trend from ${fm(pts[0].v)} to ${fm(pts[pts.length-1].v)}"><polyline points="${pts.map((p,i)=>X(i)+','+Y(p.v)).join(' ')}" fill="none" stroke="var(--acc)" stroke-width="2.5" stroke-linejoin="round"/>${pts.map((p,i)=>`<circle cx="${X(i)}" cy="${Y(p.v)}" r="3.5" fill="var(--acc)"/>`).join('')}</svg>
  <div class="row between mute"><span>${pts[0].d}</span><span>${lb} ${fm(hi)}</span><span>${pts[pts.length-1].d}</span></div>`}
function chartHtml(id,mt='auto'){if(!id)return '<p class="mute" style="margin-top:8px">Pick an exercise to see how it is progressing.</p>';
  const k=s=>+s.kg||0,r=s=>+s.reps||0,pts=hs().flatMap(h=>(h.log||[]).filter(l=>l.id===id&&l.sets.some(x=>!x.wu)).map(l=>{l={...l,sets:l.sets.filter(x=>!x.wu)};const w=Math.max(0,...l.sets.map(k)),wm=mt==='e1'||mt==='vol'||(mt==='auto'&&w>0);
    return{d:h.date,wm,tm:l.tm,v:mt==='vol'?l.sets.reduce((a,s)=>a+k(s)*r(s),0):mt==='e1'?Math.max(0,...l.sets.map(s=>k(s)*(1+r(s)/30))):wm?w:Math.max(0,...l.sets.map(r))}}));
  const L=pts[pts.length-1]||{},fm=v=>L.wm?`${kgd(Math.round(v*10)/10)} ${UN()}`:`${v} ${L.tm?'sec':'reps'}`;
  if(pts.length<2)return `<p class="mute" style="margin-top:8px">Log this exercise in two or more workouts to see a chart.${pts[0]?` Best so far: ${fm(pts[0].v)}.`:''}</p>`;
  return lineSvg(pts,fm)}
function muscleCard(){const wk=dstr(new Date(Date.now()-7*864e5)),mv={};S.history.filter(h=>h.date>wk).forEach(h=>(h.log||[]).forEach(l=>{const m=ex(l.id).m||'Other';mv[m]=(mv[m]||0)+l.sets.filter(x=>!x.wu).length}));
  const e=Object.entries(mv).sort((a,b)=>b[1]-a[1]),mx=e.length?e[0][1]:1;
  return `<div class="card"><h3>Sets per muscle, last 7 days</h3>${e.length?e.map(([m,n])=>`<div class="row between" style="margin-top:8px"><span style="width:96px">${esc(m)}</span><div class="bar grow" style="margin:0"><i style="width:${n/mx*100}%"></i></div><b style="width:28px;text-align:right">${n}</b></div>`).join(''):'<p class="mute" style="margin-top:8px">No sets in the last 7 days.</p>'}</div>`}
function exModal(id){const{rows,top,e1,vol,rp}=stats(id);if(!rows.length)return;const nm=(S.history.flatMap(h=>h.log||[]).find(l=>l.id===id)||{}).name||ex(id).name,f=rows[0],l=rows[rows.length-1],wm=top(f)>0||top(l)>0,m=wm?e1:rp,
  fm=v=>wm?`${kgd(Math.round(v*10)/10)} ${UN()}`:`${v} ${l.tm?'sec':'reps'}`,cut8=dstr(new Date(Date.now()-56*864e5)),old=rows.filter(x=>x.d<=cut8).pop(),pc=(a,b)=>a>0?`${b>=a?'+':''}${Math.round((b-a)/a*100)}%`:'–',bw=bws().pop(),
  best=fn=>rows.reduce((a,x)=>fn(x)>fn(a)?x:a,rows[0]),pr=(lab,fn,fo)=>{const b=best(fn);return `<div class="row between" style="margin-top:8px"><span>${lab}</span><span><b>${fo(fn(b))}</b> <span class="mute">${b.d}</span></span></div>`},kw=v=>`${kgd(Math.round(v*10)/10)} ${UN()}`;
  modal(`<h2>${esc(nm)}</h2><div class="card"><div class="mute">${wm?'Estimated 1-rep max':'Best set'}</div><div class="row between"><b>${fm(m(f))} → ${fm(m(l))}</b><b>${pc(m(f),m(l))}</b></div>
    <p class="mute">${old&&old!==f?`vs 8 weeks ago (${fm(m(old))}): ${pc(m(old),m(l))}`:`${rows.length} session${rows.length>1?'s':''} since ${f.d}`}</p>${wm&&bw&&m(l)>0?`<p class="mute">${(m(l)/bw.kg).toFixed(2)}× your body weight</p>`:''}</div>
  <div class="card"><h3>Personal records</h3>${wm?pr('Heaviest set',top,kw)+pr('Best est. 1RM',e1,kw)+pr('Best session volume',vol,kw):''}${pr('Most '+(l.tm?'seconds':'reps')+' in a set',rp,v=>v)}</div>
  <div class="card"><h3>Trend</h3>${chartHtml(id,wm?'e1':'rep')}</div>
  <div class="card"><h3>Recent sessions</h3>${rows.slice(-5).reverse().map(x=>`<div class="mute" style="margin-top:6px">${x.d} · ${esc(x.s.map(z=>fmtSet(z,x.tm)).join(', '))}</div>`).join('')}</div><button class="btn full" data-act="close">Close</button>`)}
function progView(){const names={};S.history.forEach(h=>(h.log||[]).forEach(l=>names[l.id]=l.name||ex(l.id).name));const b=bws(),inR=Object.values(S.routines).flatMap(r=>r.items);
  const ov=Object.keys(names).slice(-12).map(id=>{const sc=hs().flatMap(h=>(h.log||[]).filter(l=>l.id===id&&l.sets.some(x=>!x.wu)).map(l=>Math.max(...l.sets.filter(x=>!x.wu).map(score)))).slice(-6),n=sc.length,since=n-1-sc.indexOf(Math.max(...sc)),it=inR.find(x=>x.id===id),sg=it&&sugg(it),lw=(r=>r?r.s.reduce((a,x)=>Math.max(a,+x.kg||0),0):0)(stats(id).rows.slice(-1)[0]);
    return `<div style="margin-top:12px"><div class="row between"><button class="pickb" data-act="exd" data-id="${esc(id)}"><b>${esc(names[id])}</b> ›</button><span class="mute">${n<2?'Needs 2+ sessions':since===0?'▲ New best':since>=3?`▬ Plateau · ${since} sessions`:'● Steady'}</span></div>${sg?`<div class="mute">Next: ${esc(sg.txt)}</div>`:''}${since>=3&&lw>0?`<div class="mute">Deload idea: ${kgd(Math.round(lw*.9/2.5)*2.5)} ${UN()} for a week, then build back up</div>`:''}</div>`}).join('');
  return `<div class="card"><div class="row between"><h3>Body weight</h3><button class="btn ghost sm" data-act="bw">Log weigh-in</button></div>${b.length>1?lineSvg(b.map(x=>({d:x.d,v:x.kg})),v=>`${kgd(Math.round(v*10)/10)} ${UN()}`,'High'):'<p class="mute" style="margin-top:8px">Log two or more weigh-ins to see a chart.</p>'}</div>
  <div class="card"><h3>Exercise progress</h3><select id="pe" aria-label="Exercise" style="margin-top:8px"><option value="">Choose an exercise</option>${Object.entries(names).sort((a,b)=>a[1].localeCompare(b[1])).map(([id,n])=>`<option value="${esc(id)}"${id===pex?' selected':''}>${esc(n)}</option>`).join('')}</select>
    <select id="pm" aria-label="Metric" style="margin-top:8px">${Object.entries(MT).map(([k,v])=>`<option value="${k}"${k===pmt?' selected':''}>${v}</option>`).join('')}</select><div id="chart">${chartHtml(pex,pmt)}</div></div>
  ${muscleCard()}
  <div class="card"><h3>Progression</h3><p class="mute">Hit your target on every set and the next target goes up: more weight, or more reps / seconds for unweighted work. A plateau is flagged after 3 sessions without a new best; try a lighter deload week or a different rep range.</p>${ov||'<p class="mute" style="margin-top:8px">Finish a workout to start tracking.</p>'}</div>`}
function profile(){const st=S.set,sel=(k,o,v)=>`<select data-act="cfg" data-k="${k}" aria-label="${k}">${o.map(([a,b])=>`<option value="${a}"${String(a)===String(v)?' selected':''}>${b}</option>`).join('')}</select>`;
  return `<h2>${esc(USER)}</h2><div class="card"><h3>Settings</h3>
  <div class="row between" style="margin-top:10px"><label>Weight unit</label>${sel('unit',[['kg','kg'],['lb','lb']],st.unit).replace('<select','<select style="width:auto"')}</div>
  <div class="row between" style="margin-top:10px"><label>Theme</label>${sel('theme',[['auto','Auto'],['dark','Dark'],['light','Light']],st.theme).replace('<select','<select style="width:auto"')}</div>
  <div class="row between" style="margin-top:10px"><label>Rest timer</label>${sel('rest',[30,45,60,90,120,180,240].map(x=>[x,x+' s']),st.rest).replace('<select','<select style="width:auto"')}</div>
  <div class="row between" style="margin-top:10px"><label>Weekly goal</label>${sel('goal',[1,2,3,4,5,6,7].map(x=>[x,x+' workouts']),st.goal).replace('<select','<select style="width:auto"')}</div>
  <div class="row between" style="margin-top:10px"><label>Progression</label>${sel('pg',[['tip','Suggest'],['fill','Auto-fill'],['off','Off']],st.pg).replace('<select','<select style="width:auto"')}</div></div>
  <div class="card"><h3>Your data</h3><p class="mute" style="margin:6px 0 12px">Everything is saved in this browser on this device (photos in the browser's photo storage, not in the backup file). Export a backup file to move your routines and history to another device.</p>
  <button class="btn full" data-act="export">Export backup</button><button class="btn ghost full" data-act="csv" style="margin-top:10px">Export CSV (spreadsheet)</button><label class="btn ghost full" style="display:block;text-align:center;cursor:pointer;margin-top:10px">Import backup<input type="file" id="imp" accept=".json" hidden></label></div>
  <div class="card"><button class="btn ghost full" data-act="guide">How ranks and XP work</button><button class="btn ghost full" data-act="logout">Log out</button>
  <p class="mute" style="margin-top:14px;font-size:12px">Accounts exist only in this browser. They stop someone from opening your data by accident, but they are not real security – anyone with access to this browser can read the data.</p>
  <p class="mute" style="margin-top:8px;font-size:12px">Exercise GIFs and guides come from the open exercises-dataset by hasaneyldrm. Media © Gym visual (gymvisual.com).</p></div>`}

// ---- modals (focus managed, Escape closes) ----
function modal(html){if($('#modal').hidden)opener=document.activeElement;$('#sheet').innerHTML=html;$('#modal').hidden=false;$('#sheet').focus()}
function closeModal(){$('#modal').hidden=true;if(opener&&opener.isConnected)opener.focus();opener=null}
function begin(d){const rt=R(d);if(!rt.items.length)return toast('That day has no exercises');
  if(session&&!confirm('A workout is already in progress. Discard it and start a new one?'))return;
  session={name:`${DAYS[d]} – ${rt.name||'Workout'}`,day:d,start:Date.now(),items:rt.items.map(it=>{const lt=S.last[it.id]||[];
    return{...it,skip:false,sets:Array.from({length:it.sets},(_,s)=>{const l=lt[s]||lt[lt.length-1]||{},sg=S.set.pg==='fill'&&sugg(it);return{kg:sg?sgKg(it,sg,s):l.kg==null?(it.kg==null?'':it.kg):l.kg,reps:sg?sg.reps:it.reps,done:false}})}})};
  OPEN.clear();sv();closeModal();tab='train';render()}
function pickDay(){
  const has=DAYS.map((d,i)=>[d,i]).filter(([,i])=>R(i).items.length);
  if(!has.length){tab='routine';closeModal();render();return toast('Set up a routine first')}
  modal(`<h2>Which routine?</h2>`+has.map(([d,i])=>`<button class="pick" data-act="begin" data-i="${i}"><h3>${d}</h3><span class="mute">${esc(R(i).name||'Workout')} · ${R(i).items.length} exercises</span></button>`).join(''))}
const pool=()=>(DBX.length?DBX:LIB).concat(S.custom);
function pickerModal(){PK={q:'',m:'',eq:'',sel:[]};const p=pool(),opt=k=>[...new Set(p.map(e=>e[k]).filter(Boolean))].sort().map(x=>`<option>${esc(x)}</option>`).join('');
  modal(`<h2>Add exercises</h2><input id="q" type="search" placeholder="Search ${p.length} exercises" aria-label="Search exercises" style="margin-bottom:8px">
  <div class="row" style="margin-bottom:12px"><select id="fm" aria-label="Muscle group"><option value="">All muscles</option>${opt('m')}</select><select id="fe" aria-label="Equipment"><option value="">All equipment</option>${opt('q')}</select></div>
  <div id="plist"></div><div id="padd"></div>
  <details style="margin-top:14px"><summary>Create your own</summary><input id="cn" placeholder="Exercise name" style="margin:8px 0"><input id="cg" placeholder="Short guide" style="margin-bottom:8px"><button class="btn full" data-act="newEx">Create & add</button></details>`);
  $('#q').focus();pickList()}
function pickList(){const toks=PK.q.toLowerCase().split(/\s+/).filter(Boolean),p=pool(),all=!toks.length&&!PK.m&&!PK.eq;
  const row=e=>{const on=PK.sel.includes(e.id),fv=S.fav.includes(e.id);return `<div class="pick row${on?' sel':''}">${e.th?`<img class="th" src="${esc(e.th)}" alt="" crossorigin="anonymous" loading="lazy">`:''}<button class="grow pickb" data-act="pickEx" data-id="${esc(e.id)}" aria-pressed="${on}"><b>${esc(e.name)}</b><br><span class="mute">${esc(e.m)} · ${esc(e.q||'')}</span></button><button class="star" data-act="fav" data-id="${esc(e.id)}" aria-pressed="${fv}" aria-label="Favourite ${esc(e.name)}">${fv?'★':'☆'}</button></div>`};
  const by=ids=>ids.map(id=>p.find(e=>e.id===id)).filter(Boolean);let h='';
  if(all){const fv=by(S.fav),rc=by(S.recent).filter(e=>!S.fav.includes(e.id)).slice(0,6);h+=(fv.length?'<h3>Favourites</h3>'+fv.map(row).join(''):'')+(rc.length?'<h3>Recent</h3>'+rc.map(row).join(''):'')}
  const list=p.filter(e=>(!PK.m||e.m===PK.m)&&(!PK.eq||e.q===PK.eq)&&toks.every(t=>(e.name+' '+e.m+' '+(e.q||'')+' '+(e.t||'')).toLowerCase().includes(t)));
  h+=(all?'<h3>All exercises</h3>':'')+list.slice(0,60).map(row).join('')+(list.length>60?`<p class="mute">Showing 60 of ${list.length}. Search to narrow down.</p>`:'')+(list.length?'':'<p class="mute">No matches.</p>');
  $('#plist').innerHTML=h;$('#padd').innerHTML=PK.sel.length?`<button class="btn full" data-act="addSel">Add ${PK.sel.length} exercise${PK.sel.length>1?'s':''}</button>`:''}
const addItem=id=>{const it={...snap(ex(id)),id,sets:3,reps:10,note:''};if(isT(it))it.reps=30;R(editDay).items.push(it)};
const remember=ids=>{S.recent=[...ids,...S.recent.filter(x=>!ids.includes(x))].slice(0,12)};

function finish(){
  const act=session.items.filter(i=>!i.skip),dn=i=>i.sets.filter(s=>s.done),vd=i=>dn(i).filter(s=>!s.wu&&+s.reps>0),n=act.reduce((a,i)=>a+vd(i).length,0);
  if(!n&&!confirm('No sets logged. Finish anyway?'))return;
  const before=rank().i,today=dstr(new Date()),bonus=n>=3&&!S.history.some(h=>h.date===today&&h.bonus),prs=[];
  const log=act.filter(i=>dn(i).length).map(i=>{const ss=dn(i).map(s=>({kg:s.kg,reps:s.reps,...(s.wu?{wu:1}:{})})),w=ss.filter(s=>!s.wu&&+s.reps>0),nm=ex(i).name;
    if(w.length){const b=Math.max(...w.map(score)),k=prk(i.id,w),old=S.pr[k];if(old!=null&&b>old)prs.push(nm);if(old==null||b>old)S.pr[k]=b;S.last[i.id]=w}return{id:i.id,name:nm,sets:ss,tm:isT(i)}});
  const gain=n*10+(bonus?100:0)+prs.length*50;
  S.history.push({id:Date.now(),date:today,name:session.name,sets:n,xp:gain,bonus,pr:prs,log,skipped:session.items.length-act.length,dur:Math.round((Date.now()-session.start)/6e4)});
  endSession();tab='home';sv();render();
  const r=rank();modal(`<div style="text-align:center"><h2>Workout complete</h2><div class="big" id="xpn" style="justify-content:center">+0</div><div class="mute">XP earned · ${n} sets${bonus?'':' · daily bonus already claimed or under 3 sets'}</div>
    ${prs.length?`<p style="margin-top:10px">🏆 New personal record${prs.length>1?'s':''}: ${esc(prs.join(', '))}</p>`:''}
    ${r.i>before?`<div class="rankup">${badge(r.i,110)}<h3>Rank up: ${r.name}</h3></div>`:`<div style="margin:14px 0"><div class="bar"><i style="width:${r.pct}%"></i></div><span class="mute">${r.next?r.left+' XP to '+r.next:'Top rank'}</span></div>`}
    <button class="btn full" data-act="close">Done</button></div>`);
  const el=$('#xpn'),t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/900);el.textContent='+'+Math.round(gain*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)})(t0)}
function endSession(){cd=null;session=null;S.session=null;rest=0;OPEN.clear();unwake()}
function openHist(id){const h=S.history.find(x=>x.id===id);if(!h)return;HE=JSON.parse(JSON.stringify(h));
  modal(`<h2>Edit workout</h2><input id="hn" value="${esc(HE.name)}" aria-label="Name" style="margin-bottom:8px"><input id="hd" type="date" value="${HE.date}" aria-label="Date" style="margin-bottom:12px">
  ${(HE.log||[]).map((l,k)=>`<div class="card"><h3>${esc(l.name||ex(l.id).name)}</h3>${l.sets.map((s,j)=>`<div class="srow"><span class="mute" style="width:48px">Set ${j+1}</span><input class="n" type="number" step="0.5" min="0" placeholder="${UN()}" value="${kgd(s.kg)}" data-act="hkg" data-k="${k}" data-j="${j}" aria-label="Set ${j+1} weight"><span>×</span><input class="n" type="number" min="0" placeholder="${l.tm?'sec':'reps'}" value="${s.reps}" data-act="hrep" data-k="${k}" data-j="${j}" aria-label="Set ${j+1} reps"></div>`).join('')}</div>`).join('')||'<p class="mute">No set details were saved for this workout.</p>'}
  <button class="btn full" data-act="hsave">Save changes</button><button class="btn ghost full" data-act="hdel">Delete workout</button><button class="btn ghost full" data-act="close">Close</button>`)}

// ---- events ----
document.addEventListener('click',e=>{
  if(e.target.id==='modal')return closeModal();
  const t=e.target.closest('[data-tab],[data-act]');if(!t)return;
  if(t.dataset.tab){tab=t.dataset.tab;render();return scrollTo(0,0)}
  const a=t.dataset.act,i=+t.dataset.i;
  if(a==='startToday'){const rt=R(todayIdx());rt.items.length&&!rt.rest?begin(todayIdx()):pickDay()}
  else if(a==='pickDay')pickDay();
  else if(a==='resume'){tab='train';render()}
  else if(a==='begin')begin(i);
  else if(a==='set'){const k=+t.dataset.s,s=session.items[i].sets[k],bk=blocks(session.items).find(x=>x.includes(i));s.done=!s.done;t.classList.toggle('on',s.done);t.setAttribute('aria-pressed',s.done);
    if(s.done){t.classList.add('pop');setTimeout(()=>t.classList.remove('pop'),400);if(bk.every(j=>{const o=session.items[j];return o.skip||!o.sets[k]||o.sets[k].done}))startRest(session.items[i].rs)}sv();prog()}
  else if(a==='step'){const s=session.items[i].sets[+t.dataset.s],v=Math.max(0,+((+kgd(s.kg)||0)+(+t.dataset.d)*(UN()==='lb'?5:2.5)).toFixed(1));s.kg=tokg(v);t.parentElement.querySelector('input').value=v;sv()}
  else if(a==='skip'){const it=session.items[i];it.skip=!it.skip;it.sets.forEach(s=>s.done=false);sv();render()}
  else if(a==='rest+'){rest+=15e3;tickRest()}
  else if(a==='restx'){rest=0;tickRest()}
  else if(a==='close')closeModal();
  else if(a==='finish')finish();
  else if(a==='cancel'){if(confirm('Discard this workout?')){endSession();sv();render()}}
  else if(a==='day'){editDay=i;render()}
  else if(a==='del'){R(editDay).items.splice(i,1);sv();render()}
  else if(a==='link'){const l=R(editDay).items,A=l[i],B=l[i+1];if(!B)return;
    if(A.ss&&A.ss===B.ss){const g0=A.ss,n=Date.now();for(let j=i+1;l[j]&&l[j].ss===g0;j++)l[j].ss=n}
    else{const g=A.ss||Date.now(),b=B.ss;for(let j=i+1;b&&l[j]&&l[j].ss===b;j++)l[j].ss=g;A.ss=g;B.ss=g}sv();render()}
  else if(a==='apply'){const it=session.items[i],g=sugg(it);if(g){it.sets.forEach((s,k)=>{if(!s.done&&!s.wu){s.kg=sgKg(it,g,k);s.reps=g.reps}});sv();render()}}
  else if(a==='hv'){hv=t.dataset.v;render()}
  else if(a==='wu'){const s=session.items[i].sets[+t.dataset.s];s.wu=!s.wu;sv();render()}
  else if(a==='plates')platesModal(i);
  else if(a==='exd')exModal(t.dataset.id);
  else if(a==='cd'){const k=+t.dataset.s;if(cd&&cd.i===i&&cd.s===k)stopCd(Math.max(1,Math.round((Date.now()-cd.t0)/1e3)));else{const s=session.items[i].sets[k];cd={i,s:k,t0:Date.now(),tg:+s.reps||+session.items[i].reps||30};tickRest()}}
  else if(a==='csv'){const q=v=>{v=String(v);if(/^[=+\-@]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'},r=[['date','workout','exercise','set','warmup','weight_kg','reps_or_seconds','unit']];
    hs().forEach(h=>(h.log||[]).forEach(l=>l.sets.forEach((s,j)=>r.push([h.date,h.name,l.name||ex(l.id).name,j+1,s.wu?1:0,s.kg===''||s.kg==null?'':+(+s.kg).toFixed(2),s.reps,l.tm?'sec':'reps']))));bws().forEach(b=>r.push([b.d,'','BODYWEIGHT',1,0,b.kg,'','']));
    saveFile(`sinew-${USER}.csv`,r.map(x=>x.map(q).join(',')).join('\n'),'text/csv')}
  else if(a==='bw')bwModal();
  else if(a==='bwsave'){const v=tokg($('#bwv').value),d=$('#bwd').value,g=$('#bwg').value;if(!(v>=20&&v<=500)||!/^\d{4}-\d\d-\d\d$/.test(d))return toast('Enter a valid weight and date');
    S.bw=S.bw.filter(x=>x.d!==d);S.bw.push({d,kg:+v.toFixed(2)});S.set.bwGoal=g===''?'':tokg(g);sv();closeModal();render();toast('Weigh-in saved')}
  else if(a==='bwdel'){S.bw=S.bw.filter(x=>x.d!==t.dataset.d);sv();bwModal();render()}
  else if(a==='addEx')pickerModal();
  else if(a==='pickEx'){const k=PK.sel.indexOf(t.dataset.id);k<0?PK.sel.push(t.dataset.id):PK.sel.splice(k,1);pickList()}
  else if(a==='fav'){const k=S.fav.indexOf(t.dataset.id);k<0?S.fav.push(t.dataset.id):S.fav.splice(k,1);sv();pickList()}
  else if(a==='addSel'){PK.sel.forEach(addItem);remember(PK.sel);sv();closeModal();render()}
  else if(a==='newEx'){const n=$('#cn').value.trim();if(!n)return toast('Enter a name');
    const id='c'+Date.now();S.custom.push({id,name:n,m:'Custom',g:$('#cg').value.trim()||'No guide added.'});addItem(id);remember([id]);sv();closeModal();render()}
  else if(a==='programs')modal(`<h2>Ready-made programs</h2><p class="mute" style="margin-bottom:12px">Loading one replaces your whole weekly routine.</p>`+Object.entries(PRG).map(([k,p])=>`<button class="pick" data-act="prog" data-k="${k}"><h3>${p[0]}</h3><span class="mute">${p[1]}</span></button>`).join(''));
  else if(a==='prog'){if(!confirm('Replace your whole weekly routine with this program?'))return;S.routines={};
    PRG[t.dataset.k][2].forEach((k,d)=>{S.routines[d]=k?{name:NM[k],items:DX[k].map(([id,s,r])=>({...snap(ex(id)),id,sets:s,reps:r,note:''}))}:{name:'',rest:true,items:[]}});sv();closeModal();render();toast('Program loaded')}
  else if(a==='zoom'){const it=(tab==='train'&&session?session.items:R(editDay).items)[i],e=ex(it);
    modal(`<div class="big-gif">${e.gif?`<img src="${esc(e.gif)}" alt="${esc(e.name)} demonstration" crossorigin="anonymous" onerror="this.replaceWith('🏋️')">`:fig(e)}</div><h2>${esc(e.name)}</h2><p class="mute">${esc([e.m,e.q,e.t].filter(Boolean).join(' · '))}</p>${guideHtml(e)}<button class="btn full" style="margin-top:14px" data-act="close">Close</button>`)}
  else if(a==='guide')guide();
  else if(a==='cal'){const d=new Date(cal.y,cal.m+i,1);cal={y:d.getFullYear(),m:d.getMonth()};render()}
  else if(a==='cday'){selDay=selDay===t.dataset.d?null:t.dataset.d;render()}
  else if(a==='hist')openHist(+t.dataset.id);
  else if(a==='hsave'){if(!/^\d{4}-\d\d-\d\d$/.test(HE.date))return toast('Pick a valid date');
    HE.name=HE.name.trim()||'Workout';HE.sets=(HE.log||[]).reduce((n,l)=>n+l.sets.length,0);const k=S.history.findIndex(x=>x.id===HE.id);if(k<0)return closeModal();
    S.history[k]=HE;rebuild();sv();closeModal();render();toast('Workout updated')}
  else if(a==='hdel'){if(!confirm('Delete this workout? Its XP is removed too.'))return;S.history=S.history.filter(x=>x.id!==HE.id);rebuild();sv();closeModal();render()}
  else if(a==='authMode'){const u=$('#au').value,p=$('#ap').value;authMode=authMode==='login'?'new':'login';render();$('#au').value=u;$('#ap').value=p}
  else if(a==='auth')auth();
  else if(a==='logout'){unwake();PH.forEach(p=>URL.revokeObjectURL(p.url));PH=[];USER=null;S=null;session=null;authMode='login';tab='home';localStorage.removeItem('ironclad_session');theme();render()}
  else if(a==='export'){const d={...S};delete d.session;delete d.photos;saveFile(`sinew-${USER}.json`,JSON.stringify(d),'application/json')}
  else if(a==='photo'){const p=PH[i];modal(`<img src="${p.url}" style="width:100%;border-radius:12px" alt="Progress photo ${p.date}"><p class="mute" style="margin:8px 0">${p.date}</p><button class="btn ghost full" data-act="delPhoto" data-i="${i}">Delete photo</button>`)}
  else if(a==='delPhoto'){const p=PH[i];tx('readwrite',s=>s.delete(p.id)).then(()=>{URL.revokeObjectURL(p.url);PH.splice(i,1);closeModal();render()}).catch(()=>toast('Could not delete photo'))}
});
document.addEventListener('input',e=>{
  const t=e.target,a=t.dataset.act,i=+t.dataset.i,s=+t.dataset.s,n=v=>v===''?'':+v;
  if(t.id==='pt'||t.id==='pb')return $('#pout').textContent=plateTxt(+$('#pt').value||0,+$('#pb').value||0);
  if(t.id==='q'){PK.q=t.value;return pickList()}
  if(a==='skg'){session.items[i].sets[s].kg=tokg(t.value);sv()}
  else if(a==='srep'){session.items[i].sets[s].reps=n(t.value);sv()}
  else if(a==='rename'){R(editDay).name=t.value;sv()}
  else if(a==='wkg'){R(editDay).items[i].kg=tokg(t.value);sv()}else if(a==='irest'){R(editDay).items[i].rs=+t.value||0;sv()}
  else if(a==='sets'||a==='reps'){R(editDay).items[i][a]=Math.max(1,+t.value||1);sv()}
  else if(a==='note'){R(editDay).items[i].note=t.value;sv()}
  else if(a==='hkg')HE.log[+t.dataset.k].sets[+t.dataset.j].kg=tokg(t.value);
  else if(a==='hrep')HE.log[+t.dataset.k].sets[+t.dataset.j].reps=n(t.value);
  else if(t.id==='hn')HE.name=t.value;else if(t.id==='hd')HE.date=t.value;
});
document.addEventListener('change',e=>{const t=e.target,a=t.dataset.act;
  if(t.id==='imp'){const f=t.files[0];t.value='';return importData(f)}
  if(t.id==='up'){const fs=[...t.files];t.value='';return addPhotos(fs)}
  if(t.id==='fm'){PK.m=t.value;pickList()}else if(t.id==='fe'){PK.eq=t.value;pickList()}
  else if(t.id==='cpto'&&t.value!==''){const d=+t.value;if(R(d).items.length&&!confirm(`Replace ${DAYS[d]}'s routine?`)){t.value='';return}
    S.routines[d]=JSON.parse(JSON.stringify(R(editDay)));sv();toast('Copied to '+DAYS[d]);render()}
  else if(a==='restday'){R(editDay).rest=t.checked;sv();render()}
  else if(a==='cfg'){const k=t.dataset.k;S.set[k]=['unit','theme','pg'].includes(k)?t.value:+t.value;theme();sv();render()}
  else if(t.id==='pe'||t.id==='pm'){if(t.id==='pe')pex=t.value;else pmt=t.value;$('#chart').innerHTML=chartHtml(pex,pmt)}
  else if(a==='tm'){const it=R(editDay).items[+t.dataset.i],on=t.value==='1';it.tm=on;it.reps=on?(it.reps<20?30:it.reps):(it.reps>30?10:it.reps);sv();render()}
});
document.addEventListener('toggle',e=>{const d=e.target;if(d.tagName==='DETAILS'&&d.dataset.i!==undefined)d.open?OPEN.add(+d.dataset.i):OPEN.delete(+d.dataset.i)},true);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('#modal').hidden)return closeModal();
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[role=button]')){e.preventDefault();return e.target.click()}
  if(e.key==='Tab'&&!$('#modal').hidden){const f=[...$('#sheet').querySelectorAll('button:not(:disabled),input,select,summary,[tabindex="0"]')];if(!f.length)return;
    const a=f[0],z=f[f.length-1],cur=document.activeElement;
    if(e.shiftKey&&(cur===a||cur===$('#sheet'))){e.preventDefault();z.focus()}else if(!e.shiftKey&&cur===z){e.preventDefault();a.focus()}}
});

// ---- drag to reorder (a superset moves as one block) ----
const dgT=()=>dg&&dg.b.forEach(j=>dg.els[j].style.transform=`translateY(${dg.cy-dg.y0+dg.sc}px)`);
document.addEventListener('pointerdown',e=>{const h=e.target.closest('[data-drag]');if(!h)return;e.preventDefault();
  const b=blocks(R(editDay).items).find(x=>x.includes(+h.dataset.drag));dg={b,y0:e.clientY,cy:e.clientY,sc:0,els:[...document.querySelectorAll('.rc')]};
  b.forEach(j=>dg.els[j].classList.add('drag'));h.setPointerCapture(e.pointerId);
  dg.iv=setInterval(()=>{const d=dg.cy<90?-26:dg.cy>innerHeight-130?26:0;if(d){const y=scrollY;scrollBy(0,d);dg.sc+=scrollY-y;dgT()}},16)});
document.addEventListener('pointermove',e=>{if(dg){dg.cy=e.clientY;dgT()}});
document.addEventListener('pointerup',e=>{if(!dg)return;const d=dg,l=R(editDay).items;clearInterval(d.iv);dg=null;let at=l.length;
  for(let j=0;j<l.length;j++){if(d.b.includes(j))continue;const r=d.els[j].getBoundingClientRect();if(e.clientY<r.top+r.height/2){at=j;break}}
  const rest=l.filter((_,j)=>!d.b.includes(j));rest.splice(l.slice(0,at).filter((_,j)=>!d.b.includes(j)).length,0,...d.b.map(j=>l[j]));R(editDay).items=rest;sv();render()});
document.addEventListener('pointercancel',()=>{if(dg){clearInterval(dg.iv);dg=null;render()}});
document.addEventListener('keydown',e=>{const h=e.target.closest&&e.target.closest('[data-drag]');if(!h||!/^Arrow(Up|Down)$/.test(e.key))return;e.preventDefault();
  const l=R(editDay).items,i=+h.dataset.drag,bs=blocks(l),k=bs.findIndex(x=>x.includes(i)),o=k+(e.key==='ArrowUp'?-1:1);if(!bs[o])return;
  [bs[k],bs[o]]=[bs[o],bs[k]];const f=bs.flat();R(editDay).items=f.map(j=>l[j]);sv();render();const n=document.querySelector(`[data-drag="${f.indexOf(i)}"]`);n&&n.focus()});

// ---- import / auth / guide ----
function clean(d){if(!d||typeof d!=='object'||!d.routines||typeof d.routines!=='object'||!Array.isArray(d.history))return null;
  const st=(v,n=80)=>typeof v==='string'?v.slice(0,n):'',nu=(v,lo,hi,df)=>{v=+v;return isFinite(v)?Math.min(hi,Math.max(lo,v)):df},kg=v=>v===''||v==null?'':nu(v,0,2000,''),ar=(v,n)=>Array.isArray(v)?v.slice(0,n):[],o=blank();
  const sn=x=>({name:st(x.name),m:st(x.m,30),q:st(x.q,30),t:st(x.t,30),gif:/^https:\/\//.test(x.gif)?st(x.gif,300):undefined,g:st(x.g,400),p:st(x.p,12),r:nu(x.r,-45,45,0),w:!!x.w,
    steps:Array.isArray(x.steps)?x.steps.slice(0,20).map(s=>st(s,300)):undefined,sec:Array.isArray(x.sec)?x.sec.slice(0,10).map(s=>st(s,30)):undefined});
  for(let i=0;i<7;i++){const r=d.routines[i];if(r&&typeof r==='object')o.routines[i]={name:st(r.name,40),rest:!!r.rest,items:ar(r.items,40).filter(x=>x&&typeof x.id==='string').map(x=>({...sn(x),id:st(x.id,60),sets:nu(x.sets,1,20,3),reps:nu(x.reps,1,900,10),note:st(x.note,200),ss:nu(x.ss,0,9e15,0),tm:x.tm==null?undefined:!!x.tm,kg:kg(x.kg),rs:nu(x.rs,0,600,0)}))}}
  o.history=ar(d.history,5000).filter(h=>h&&/^\d{4}-\d\d-\d\d$/.test(h.date)&&isFinite(+h.xp)).map((h,i)=>({id:nu(h.id,0,9e15,i+1),date:h.date,name:st(h.name),sets:nu(h.sets,0,999,0),xp:nu(h.xp,0,5000,0),bonus:!!h.bonus,dur:nu(h.dur,0,1440,0),pr:ar(h.pr,20).map(x=>st(x)),
    log:ar(h.log,60).filter(l=>l&&typeof l.id==='string').map(l=>({id:st(l.id,60),name:st(l.name),tm:!!l.tm,sets:Array.isArray(l.sets)?l.sets.slice(0,30).map(s=>({kg:kg(s&&s.kg),reps:s&&s.reps!==''&&s.reps!=null?nu(s.reps,0,1000,''):'',wu:!!(s&&s.wu)})):Array.from({length:nu(l.sets,0,30,0)},()=>({kg:kg(l.kg),reps:''}))}))}));
  o.custom=ar(d.custom,200).filter(c=>c&&typeof c.id==='string'&&typeof c.name==='string').map(c=>({id:st(c.id,40),name:st(c.name),m:'Custom',g:st(c.g,400)}));
  o.bw=ar(d.bw,3000).filter(b=>b&&/^\d{4}-\d\d-\d\d$/.test(b.d)&&isFinite(+b.kg)).map(b=>({d:b.d,kg:nu(b.kg,20,500,70)}));
  o.fav=ar(d.fav,500).filter(x=>typeof x==='string');o.recent=ar(d.recent,12).filter(x=>typeof x==='string');
  if(d.set&&typeof d.set==='object')Object.assign(o.set,{unit:d.set.unit==='lb'?'lb':'kg',theme:['dark','light'].includes(d.set.theme)?d.set.theme:'auto',rest:nu(d.set.rest,10,600,90),goal:nu(d.set.goal,1,7,3),pg:['fill','off'].includes(d.set.pg)?d.set.pg:'tip',bwGoal:d.set.bwGoal===''||d.set.bwGoal==null?'':nu(d.set.bwGoal,20,500,'')});
  rebuild(o);return o}
function importData(f){if(!f)return;const r=new FileReader();r.onload=()=>{let o=null;try{o=clean(JSON.parse(r.result))}catch(e){}
  if(!o)return toast('That is not a valid Sinew backup');
  const days=Object.values(o.routines).filter(x=>x.items.length).length;
  if(!confirm(`Replace your current data with this backup (${o.history.length} workouts, ${days} routine days)? This cannot be undone.`))return;
  unwake();session=null;S=o;sv();theme();render();toast('Backup imported')};r.readAsText(f)}
function authView(){const n=authMode==='new';return `<div class="card" style="margin-top:8vh"><h2>${n?'Create account':'Log in'}</h2>
  <input id="au" placeholder="Username" autocomplete="username" aria-label="Username" style="margin-bottom:10px"><input id="ap" type="password" placeholder="Password (4+ characters)" aria-label="Password" autocomplete="${n?'new-password':'current-password'}" style="margin-bottom:12px">
  <button class="btn full" data-act="auth">${n?'Create account':'Log in'}</button><button class="btn ghost full" data-act="authMode">${n?'I already have an account':'Create a new account'}</button></div>`}
async function auth(){const u=$('#au').value.trim().toLowerCase(),p=$('#ap').value;if(!u||p.length<4)return toast('Enter a username and a 4+ character password');
  const A=accts();
  if(authMode==='new'){if(A[u])return toast('That username is taken');const salt=rnd();
    A[u]={salt,h:await hash(p,salt)};localStorage.setItem('ironclad_accts',JSON.stringify(A));
    const old=localStorage.getItem('ironclad_v1');if(old&&Object.keys(A).length===1)localStorage.setItem('ironclad_u_'+u,old)}
  else{const a=A[u];if(!a)return toast('Wrong username or password');const h=await hash(p,a.salt);
    if(a.h!==h){let lg;try{lg=btoa(a.salt+p)}catch(e){}if(a.h!==lg)return toast('Wrong username or password');a.h=h;localStorage.setItem('ironclad_accts',JSON.stringify(A))}} // old weak-hash accounts upgrade on login
  USER=u;localStorage.setItem('ironclad_session',u);load();backfill();tab='home';render()}
function guide(){modal(`<h2>The Ascent</h2><p class="mute" style="margin-bottom:12px">Every set you tick earns <b>10 XP</b>. Your first workout of the day with at least 3 sets adds a <b>100 XP</b> bonus (once per day), and every new personal record adds <b>50 XP</b>. Your streak survives one rest day between workouts.</p>`+
  RANKS.map((r,i)=>`<div class="card row">${badge(i,56)}<div><h3>${r[0]}</h3><span class="mute">${r[1]} XP${i===rank().i?' · you are here':''}</span></div></div>`).join('')+`<button class="btn full" data-act="close">Close</button>`)}

if(USER)backfill();
render();
loadDB().then(ok=>{if(ok)matchGifs();if(!ok)toast('Offline: using built-in exercises');else if(USER){backfill();render()}});
setInterval(tickRest,250);
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
