'use strict';
(async()=>{
 const $=id=>document.getElementById(id),L=window.AeroLogic;
 const date=s=>s?new Date(s.length===10?s+'T12:00:00Z':s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:s.length===10?'UTC':'America/New_York'}):'Not published';
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 try{
  const [cr,ur]=await Promise.all([fetch('data/catalog.json',{cache:'no-cache'}),fetch('data/updates.json',{cache:'no-cache'}).catch(()=>null)]);
  if(!cr.ok)throw new Error('catalog');
  const catalog=await cr.json(),updates=ur?.ok?await ur.json():null;
  $('updatesStatus').textContent=updates?.lastAttempt?'Last automatic check: '+new Date(updates.lastAttempt).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}):'The directory is available; the latest check time could not be loaded.';
  const rows=catalog.records.map((r,i)=>({r,i})).filter(x=>L.visible(x.r)&&!['other-program','degree-check'].includes(x.r.fit)&&(x.r.geo!=='state'||x.r.states.includes('NJ'))).sort((a,b)=>b.r.added.localeCompare(a.r.added)||b.i-a.i).map(x=>x.r);
  let limit=10;
  function render(){
   $('updatesList').replaceChildren();
   for(const r of rows.slice(0,limit)){
    const item=el('li',undefined,'update-item'),badge=el('span',L.labels[L.status(r)],'status-badge status-'+L.status(r));
    item.append(el('small','Added here '+date(r.added)),el('h2',r.name),badge,el('p',r.amount,'value'),el('p',r.org+' · '+L.benefits[r.benefit]));
    if(r.deadline)item.append(el('p','Deadline: '+date(r.deadline)));
    item.append(el('p',r.requirements));
    const url=new URL(r.url);
    if(url.protocol==='https:'){const a=el('a','Official details & application ↗');a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';item.append(a);}
    $('updatesList').append(item);
   }
   $('moreUpdates').hidden=limit>=rows.length;
  }
  $('moreUpdates').addEventListener('click',()=>{limit+=10;render();});render();
  const events=(updates?.lifecycle||[]).slice(0,10);
  if(events.length){$('maintenanceHistory').hidden=false;for(const event of events)$('maintenanceList').append(el('li',(event.action==='restored'?'Restored: ':'Removed from listings: ')+event.name+' · '+date(event.at)));}
 }catch{$('updatesStatus').textContent='Updates could not be loaded. Please try again or return to the scholarship directory.';}
})();