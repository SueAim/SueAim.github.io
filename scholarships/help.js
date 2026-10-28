'use strict';
(async()=>{
 const box=document.getElementById('resourceCards');
 try{
  const response=await fetch('data/catalog.json',{cache:'no-cache'});
  if(!response.ok)throw new Error('catalog');
  const catalog=await response.json();
  document.getElementById('totalStat').textContent=catalog.records.filter(r=>window.AeroLogic.visible(r)).length;
  for(const r of catalog.resources.filter(r=>r.sourceHealth?.state!=='missing')){
   const url=new URL(r.url);if(url.protocol!=='https:')continue;
   const article=document.createElement('article');article.className='resource-card';
   const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=r.name+' ↗';
   const note=document.createElement('p');note.textContent=r.note;
   article.append(link,note);box.append(article);
  }
 }catch{box.textContent='Sources are temporarily unavailable. Please return to the scholarship directory.';document.getElementById('totalStat').textContent='The directory contains';}
 const target=document.getElementById(location.hash.slice(1));
 if(target){const details=target.matches('details')?target:target.querySelector('details');if(details)details.open=true;}
})();