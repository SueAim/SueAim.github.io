'use strict';
(async()=>{
 try{
  const response=await fetch('data/catalog.json',{cache:'no-cache'});
  if(!response.ok)throw new Error('catalog');
  const catalog=await response.json();
  document.getElementById('totalStat').textContent=catalog.records.filter(r=>window.AeroLogic.visible(r)).length;
 }catch{document.getElementById('totalStat').textContent='Previously reviewed';}
 const target=document.getElementById(location.hash.slice(1));
 if(target){const details=target.matches('details')?target:target.querySelector('details');if(details)details.open=true;}
})();