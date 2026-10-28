(function(root){
'use strict';
const labels={open:'Available now',rolling:'Year-round cycles',upcoming:'Available soon',closed:'Closed · next cycle',verify:'Confirm with provider'};
const benefits={cash:'Cash paid to student',school:'Tuition / school payment',reimbursement:'Tuition reimbursement',exam:'Testing / exam fees',tools:'Tools / tool box',training:'Training / course award','paid-training':'Paid training / stipend role',internship:'Paid internship / apprenticeship',job:'Job placement / referral',unconfirmed:'Payment route unconfirmed'};
function day(){const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const v=t=>p.find(x=>x.type===t).value;return v('year')+'-'+v('month')+'-'+v('day');}
function status(r,today){today=today||day();if(r.deadline&&r.deadline<today)return 'closed';if(r.status==='closed')return 'closed';if(r.status==='upcoming'){if((r.opens&&r.opens<=today)||(r.opensMonth&&r.opensMonth<=today.slice(0,7)))return 'verify';return 'upcoming';}if((r.status==='open'||r.status==='rolling')&&r.reviewed&&Date.parse(today)-Date.parse(r.reviewed)>30*86400000)return 'verify';return r.status;}
function keepCycle(r,today){return r.recurring===true||['reopens','opens'].some(k=>r[k]&&r[k]>=today)||!!(r.opensMonth&&r.opensMonth>=today.slice(0,7));}
function visible(r,today){today=today||day();if(r.sourceHealth?.state==='missing')return false;const ended=r.status==='closed'||!!(r.deadline&&r.deadline<today);return !ended||keepCycle(r,today);}
function closingSoon(r,today){today=today||day();const s=status(r,today);if(!['open','rolling'].includes(s)||!r.deadline)return false;const days=(Date.parse(r.deadline)-Date.parse(today))/86400000;return days>=0&&days<=30;}
function support(r){return r.benefits||[r.benefit];}
function matches(r,f,today){if(!visible(r,today))return false;const s=status(r,today);if(f.search&&!([r.name,r.org,r.amount,r.requirements,r.note,...support(r).map(b=>benefits[b]),r.workLocation||'',...(r.community||[])].join(' ').toLowerCase().includes(f.search.toLowerCase().trim())))return false;
if(f.location&&f.location!=='all'&&r.geo==='state'&&!r.states.includes(f.location))return false;
if(f.status&&f.status!=='all'){if(f.status==='closing'?!closingSoon(r,today):f.status==='available'?!['open','rolling'].includes(s):s!==f.status)return false;}
if(f.benefit&&f.benefit!=='all'&&(f.benefit==='money'?!(r.monetaryAward===true||support(r).some(b=>['cash','school','reimbursement','exam','paid-training','internship'].includes(b))):!support(r).includes(f.benefit)))return false;
if(f.provider&&f.provider!=='all'&&r.provider!==f.provider)return false;
if(f.kind==='awards'&&['program','lead'].includes(r.kind))return false;if(f.kind==='program'&&r.kind!=='program')return false;
if(f.fit==='aim-nj'&&['other-program','degree-check'].includes(r.fit))return false;
if(f.career==='any'&&(!r.career||r.career==='none'))return false;if(f.career&& !['all','any'].includes(f.career)&&r.career!==f.career)return false;
if(f.amount&&f.amount!=='all'){if(f.amount==='published'){if(!/\$\s*\d/.test(r.amount||''))return false;}else if(f.amount==='unknown'){if(r.value!==null)return false;}else{const [lo,hi]=f.amount.split(':').map(Number);if(r.value===null||r.value<lo||(r.minValue??r.value)>hi)return false;}}
if(f.gender==='women-only'&&r.gender!=='women')return false;if(f.gender==='all-genders'&&r.gender==='women')return false;
if(f.community&&f.community!=='all'&&r.ethnicity&&r.ethnicity.length&&!r.ethnicity.includes(f.community))return false;
if(f.military==='specific'&&!r.veteran&&!r.community.includes('Military family')&&!r.community.includes('Military transition'))return false;
if(f.military==='none'&&(r.veteran||r.community.includes('Military family')))return false;
if(f.parents==='specific'&&!r.parent)return false;
if(f.age!==''&&f.age!=null){const a=Number(f.age);if(Number.isFinite(a)&&((r.minAge!==null&&a<r.minAge)||(r.maxAge!==null&&a>r.maxAge)))return false;}
if(f.stage==='near-graduation'&&r.stage!=='near-graduation')return false;
if(f.stage==='student'&&!['student','check','near-graduation'].includes(r.stage))return false;return true;}
function sortRows(rows,f,today){const weights={open:0,rolling:1,upcoming:2,verify:3,closed:4};return [...rows].sort((a,b)=>{if(f.sort==='name')return a.name.localeCompare(b.name);if(f.sort==='amount')return (b.value??-1)-(a.value??-1)||a.name.localeCompare(b.name);if(f.sort==='newest')return (b.addedAt||b.added).localeCompare(a.addedAt||a.added)||a.name.localeCompare(b.name);if(f.sort==='deadline')return (['open','rolling'].includes(status(a,today))?0:1)-(['open','rolling'].includes(status(b,today))?0:1)||(a.deadline||'9999').localeCompare(b.deadline||'9999')||a.name.localeCompare(b.name);
const community=f.community&&f.community!=='all';return weights[status(a,today)]-weights[status(b,today)]||(community?Number(b.community.includes(f.community))-Number(a.community.includes(f.community)):0)||(Number(b.geo==='state'&&b.states.includes(f.location))-Number(a.geo==='state'&&a.states.includes(f.location)))||(a.deadline||'9999').localeCompare(b.deadline||'9999')||a.name.localeCompare(b.name);});}
const api={day,status,keepCycle,visible,closingSoon,support,matches,sortRows,labels,benefits};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.AeroLogic=api;
})(typeof window!=='undefined'?window:globalThis);
