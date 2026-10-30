'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const L=require('../logic.js');
const catalog=require('../data/catalog.json');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const today='2026-10-30';
const defaults={search:'',location:'NJ',status:'available',benefit:'all',amount:'all',gender:'all',community:'all',military:'all',parents:'all',age:'',stage:'student',kind:'all',fit:'aim-nj',career:'all',provider:'all',sort:'amount'};
const choices=Object.fromEntries([...html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)].map(m=>[m[1],[...m[2].matchAll(/<option\b[^>]*value="([^"]*)"/g)].map(x=>x[1])]));
choices.search=['','women trade','trade women','women   trade','female','Gregg Aviation','gregg','  GREGG  ','tuition','military','tools','P.E.O.','Lift Women’s','Lift Women\'s','ZZZ-no-award-123','<script>alert(1)</script>','飞机','&','500','school payment'];
choices.age=['','13','16','18','21','26','27','40','42','65','100'];
// Independent predicate: do not use AeroLogic.matches to establish expected membership.
function expected(r,f){
 if(r.sourceHealth?.state==='missing')return false;
 const ended=r.status==='closed'||r.deadline&&r.deadline<today;
 if(ended&&!(r.recurring||r.reopens>=today||r.opens>=today||r.opensMonth>=today.slice(0,7)))return false;
 let s=r.deadline&&r.deadline<today?'closed':r.status;
 if(s==='upcoming'&&(r.opens&&r.opens<=today||r.opensMonth&&r.opensMonth<=today.slice(0,7)))s='verify';
 if(['open','rolling'].includes(s)&&r.reviewed&&(Date.parse(today)-Date.parse(r.reviewed))/86400000>30)s='verify';
 const open=['open','rolling'].includes(s),days=(Date.parse(r.deadline)-Date.parse(today))/86400000;
 if(f.status==='active'&&!['open','rolling','upcoming'].includes(s)||f.status==='available'&&!open||f.status==='closing'&&!(open&&r.deadline&&days>=0&&days<=30)||!['all','active','available','closing'].includes(f.status)&&f.status!==s)return false;
 const normalize=x=>String(x??'').normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[‐‑–—]/g,'-');
 const benefits=r.benefits||[r.benefit];
 const hay=normalize([r.name,r.org,r.amount,r.requirements,r.note,...benefits.map(b=>L.benefits[b]),r.workLocation||'',...(r.community||[]),r.gender==='women'?'women female':''].join(' '));
 if(normalize(f.search).trim().split(/\s+/).filter(Boolean).some(t=>!hay.includes(t)))return false;
 if(f.location!=='all'&&r.geo==='state'&&!r.states.includes(f.location))return false;
 if(f.benefit==='money'&&!(r.monetaryAward||benefits.some(b=>['cash','school','reimbursement','exam','paid-training','internship'].includes(b))))return false;
 if(!['all','money'].includes(f.benefit)&&!benefits.includes(f.benefit))return false;
 if(f.provider!=='all'&&!(r.provider===f.provider||f.provider==='association'&&r.provider==='foundation'))return false;
 if(f.kind==='awards'&&['program','lead'].includes(r.kind)||f.kind==='program'&&r.kind!=='program')return false;
 if(f.fit==='aim-nj'&&['other-program','degree-check'].includes(r.fit))return false;
 if(f.career==='any'&&(!r.career||r.career==='none')||!['all','any'].includes(f.career)&&r.career!==f.career)return false;
 if(f.amount==='published'&&!/\$\s*\d/.test(r.amount)||f.amount==='unknown'&&r.value!==null)return false;
 if(f.amount.includes(':')){const [lo,hi]=f.amount.split(':').map(Number);if(r.value===null||r.value<lo||(r.minValue??r.value)>hi)return false;}
 if(f.gender==='women-only'&&r.gender!=='women'||f.gender==='all-genders'&&r.gender==='women')return false;
 if(f.community!=='all'&&r.ethnicity?.length&&!r.ethnicity.includes(f.community))return false;
 const military=!!r.veteran||(r.community||[]).some(c=>/^military (family|families|transition)$/i.test(c));
 if(f.military==='none'&&military||f.military==='specific'&&!military)return false;
 if(f.parents==='specific'&&!r.parent)return false;
 if(f.age!==''&&(r.minAge!==null&&Number(f.age)<r.minAge||r.maxAge!==null&&Number(f.age)>r.maxAge))return false;
 if(f.stage==='near-graduation'&&r.stage!=='near-graduation'||f.stage==='student'&&!['student','check','near-graduation'].includes(r.stage))return false;
 return true;
}
const ids=rows=>rows.map(r=>r.id);
let checks=0;
function verify(f){
 const actual=catalog.records.filter(r=>L.matches(r,f,today)),want=catalog.records.filter(r=>expected(r,f));
 assert.deepEqual(ids(actual),ids(want),JSON.stringify(f));
 const sorted=L.sortRows(actual,f,today);
 assert.deepEqual([...ids(sorted)].sort(),[...ids(want)].sort());
 for(let i=1;i<sorted.length;i++){
  const a=sorted[i-1],b=sorted[i];
  if(f.sort==='amount')assert((a.value??-1)>=(b.value??-1));
  if(f.sort==='name')assert(a.name.localeCompare(b.name)<=0);
  if(f.sort==='newest')assert((a.addedAt||a.added).localeCompare(b.addedAt||b.added)>=0);
  if(f.sort==='deadline'){
   const rank=r=>['open','rolling'].includes(L.status(r,today))?0:1;
   assert(rank(a)<=rank(b));if(rank(a)===rank(b))assert((a.deadline||'9999')<=(b.deadline||'9999'));
  }
 }
 checks++;return sorted;
}
// Every UI option, and every pair of options, including the search text and age fields.
const entries=Object.entries(choices);
for(const [key,values]of entries)for(const v of values)verify({...defaults,[key]:v});
for(let a=0;a<entries.length;a++)for(let b=a+1;b<entries.length;b++)for(const v of entries[a][1])for(const w of entries[b][1])verify({...defaults,[entries[a][0]]:v,[entries[b][0]]:w});
let seed=20261030;function random(n){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;}
// Both focused visits (1–4 changed controls) and heavily constrained visits.
for(let i=0;i<5000;i++){const f={...defaults};for(let j=0;j<(i%2?1+random(4):entries.length);j++){const [key,values]=entries[random(entries.length)];f[key]=values[random(values.length)];}verify(f);}
// Isolated fixtures preserve these regressions if a provider closes or changes later.
const fixture={name:'Mechanic training',org:'Example Foundation',amount:'$500',value:500,minAge:null,maxAge:null,status:'open',reviewed:today,deadline:null,geo:'national',states:[],requirements:'Trade school study',note:'',benefit:'school',provider:'foundation',kind:'scholarship',stage:'student',fit:'check',gender:'women',community:[]};
assert(L.matches(fixture,{...defaults,provider:'association'},today));
assert(!L.matches({...fixture,community:['Military transition']},{...defaults,military:'none'},today));
assert(L.matches({...fixture,community:['Military families']},{...defaults,military:'specific'},today));
assert(L.matches(fixture,{...defaults,search:'women mechanic'},today));
assert(L.matches(fixture,{...defaults,search:'mechanic women'},today));
assert(L.matches({...fixture,org:'Lift Women’s Foundation'},{...defaults,search:"Lift Women's"},today));
assert(!L.matches(fixture,{...defaults,search:'women boat'},today));

// DOM contract simulation executes the real app, controls and event listeners.
// These are simulations of browser feature branches, not separate browser engines.
async function visit(profile){
 const elements=new Map(),events=new Map();let focus=null;
 class Element{
  constructor(id){this.id=id;this.value='';this.hidden=false;this.open=false;this.attrs={};this.listeners={};this.dataset={};this.textContent='';this.innerHTML='';this.isConnected=true;this.style={};this.classList={toggle(){}};}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  setAttribute(k,v){this.attrs[k]=v;}
  focus(){focus=this;document.activeElement=this;}
  blur(){if(focus===this)focus=null;}
  scrollIntoView(){} remove(){} click(){return this.fire('click');}
  fire(type,event={}){for(const fn of this.listeners[type]||[])fn({key:'',preventDefault(){},...event});}
  querySelectorAll(){return [];}
 }
 const get=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);};
 for(const m of html.matchAll(/\bid="([^"]+)"/g))get(m[1]);
 const windows=[...html.matchAll(/data-window="([^"]+)"/g)].map(m=>{const x=new Element();x.dataset.window=m[1];return x;});
 const document={hidden:false,activeElement:null,body:{style:{},classList:{toggle(){return true;}},appendChild(){}},documentElement:{},getElementById(id){assert(elements.has(id),'Missing HTML control '+id);return get(id);},querySelector(s){return get(s);},querySelectorAll(s){return s==='[data-window]'?windows:[];},addEventListener(type,fn){(events.get(type)||events.set(type,[]).get(type)).push(fn);},createElement(){return new Element();}};
 const timeouts=[];
 const sandbox={window:{AeroLogic:{...L,day:()=>today,status:r=>L.status(r,today),visible:r=>L.visible(r,today),closingSoon:r=>L.closingSoon(r,today),matches:(r,f)=>L.matches(r,f,today),sortRows:(r,f)=>L.sortRows(r,f,today)},matchMedia:q=>({matches:profile.mobile&&q.includes('max-width')||profile.reducedMotion&&q.includes('reduced-motion')})},document,Intl,Date,URL,Blob,Set,console,setTimeout(fn){timeouts.push(fn);return 1;},clearTimeout(){},setInterval(){},fetch:async url=>{if(url.includes('catalog')&&profile.catalogFailure)throw Error('Offline');if(url.includes('updates')&&profile.updatesFailure)throw Error('Offline');return {ok:true,json:async()=>url.includes('catalog')?catalog:{}};}};
 if(profile.noFullscreen)document.documentElement={};
 vm.runInNewContext(app,sandbox);await new Promise(r=>setImmediate(r));
 if(profile.catalogFailure){assert.equal(get('resultsCount').textContent,'The catalog could not load.');return 1;}
 let visits=0;
 function check(f,limit=12){const total=catalog.records.filter(r=>expected(r,{...defaults,status:'active'})).length;assert.equal(document.title,'AIM NJ Scholarships Daily Update | '+total+' Open & Upcoming');assert.equal(get('siteTitleCount').textContent,'Daily Update · '+total+' Open & Upcoming');assert.equal(get('homeTitle').textContent,document.title);const rows=verify(f),rendered=[...get('cards').innerHTML.matchAll(/data-detail="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(rendered,ids(rows.slice(0,limit)),profile.name+JSON.stringify(f));assert.equal(get('resultsCount').textContent,rows.length+(rows.length===1?' opportunity':' opportunities'));assert.equal(get('loadMore').hidden,limit>=rows.length);assert.equal(get('resultEnd').textContent,rows.length?'Showing '+Math.min(limit,rows.length)+' of '+rows.length+' listings · Eligibility is not guaranteed.':'');visits++;}
 const f={...defaults};check(f);
 get('loadMore').fire('click');check(f,24);
 get('search').value='zzzz-no-award';f.search=get('search').value;get('search').fire('input');check(f);assert(get('cards').innerHTML.includes('data-reset'));
 get('search').value='';f.search='';get('search').fire('keydown',{key:'Enter'});check(f);assert.equal(get('filterDetails').open,false);
 for(let i=0;i<300;i++){
  if(i%15===0){get('resetFilters').fire('click');Object.assign(f,defaults);check(f);}
  const [key,values]=entries[random(entries.length)];f[key]=values[random(values.length)];get(key).value=f[key];get(key).fire(key==='search'||key==='age'?'input':'change');check(f);
  if(i%10===0){get('applyFilters').fire('click');check(f);assert.equal(get('filterDetails').open,false);assert.equal(focus.id,'searchResults');}
 }
 get('resetFilters').fire('click');Object.assign(f,defaults);
 for(const [button,patch]of [['showCash',{benefit:'money'}],['showTools',{benefit:'tools'}],['showCareer',{status:'active',career:'any',sort:'recommended'}],['showNew',{status:'active',sort:'newest'}]]){
  get('resetFilters').fire('click');get(button).fire('click');check({...defaults,...patch});
 }
 get('resetFilters').fire('click');check(defaults);
 get('fullscreen').fire('click');await new Promise(r=>setImmediate(r));assert(get('toast').textContent.includes('not supported'));
 return visits;
}
(async()=>{let journeys=0;for(const profile of [{name:'desktop'},{name:'phone',mobile:true},{name:'reduced motion',reducedMotion:true},{name:'fullscreen unavailable',noFullscreen:true,mobile:true},{name:'source status offline',updatesFailure:true},{name:'catalog offline',catalogFailure:true}])journeys+=await visit(profile);console.log(JSON.stringify({filterScenarios:checks,domVisitorStates:journeys,catalogRecords:catalog.records.length,featureProfiles:6,result:'PASS'}));})().catch(e=>{console.error(e);process.exitCode=1;});
