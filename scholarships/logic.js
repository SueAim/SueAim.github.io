(function(root){
'use strict';
const labels={open:'Open now',rolling:'Year-round cycles',upcoming:'Opening later',closed:'Closed · next cycle',verify:'Confirm with provider'};
const benefits={cash:'Cash paid to student',school:'Tuition / school payment',reimbursement:'Tuition reimbursement',exam:'Testing / exam fees',tools:'Tools / tool box',training:'Training / course award','paid-training':'Paid training / stipend role',internship:'Paid internship / apprenticeship',job:'Job placement / referral',unconfirmed:'Payment route unconfirmed'};
function day(){const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const v=t=>p.find(x=>x.type===t).value;return v('year')+'-'+v('month')+'-'+v('day');}
function status(r,today){today=today||day();if(r.deadline&&r.deadline<today)return 'closed';if(r.status==='closed')return 'closed';if(r.status==='upcoming'){if(r.opens&&r.opens<=today)return 'verify';return 'upcoming';}if((r.status==='open'||r.status==='rolling')&&r.reviewed&&Date.parse(today)-Date.parse(r.reviewed)>30*86400000)return 'verify';return r.status;}
function matches(r,f,today){const s=status(r,today);if(f.search&&!([r.name,r.org,r.amount,r.requirements,r.note,benefits[r.benefit],...(r.community||[])].join(' ').toLowerCase().includes(f.search.toLowerCase().trim())))return false;
if(f.location&&f.location!=='all'&&r.geo==='state'&&!r.states.includes(f.location))return false;
if(f.status&&f.status!=='all'&&(f.status==='available'?!['open','rolling'].includes(s):s!==f.status))return false;
if(f.benefit&&f.benefit!=='all'&&r.benefit!==f.benefit)return false;
if(f.amount&&f.amount!=='all'){if(f.amount==='unknown'){if(r.value!==null)return false;}else{const [lo,hi]=f.amount.split(':').map(Number);if(r.value===null||r.value<lo||r.value>hi)return false;}}
if(f.gender==='women-only'&&r.gender!=='women')return false;if(f.gender==='all-genders'&&r.gender==='women')return false;
if(f.community&&f.community!=='all'&&r.ethnicity&&r.ethnicity.length&&!r.ethnicity.includes(f.community))return false;
if(f.military==='specific'&&!r.veteran&&!r.community.includes('Military family')&&!r.community.includes('Military transition'))return false;
if(f.military==='none'&&(r.veteran||r.community.includes('Military family')))return false;
if(f.parents==='specific'&&!r.parent)return false;
if(f.age!==''&&f.age!=null){const a=Number(f.age);if(Number.isFinite(a)&&((r.minAge!==null&&a<r.minAge)||(r.maxAge!==null&&a>r.maxAge)))return false;}
if(f.stage==='student'&&!['student','check'].includes(r.stage))return false;return true;}
function sortRows(rows,f,today){const weights={open:0,rolling:1,upcoming:2,verify:3,closed:4};return [...rows].sort((a,b)=>{if(f.sort==='name')return a.name.localeCompare(b.name);if(f.sort==='amount')return (b.value??-1)-(a.value??-1)||a.name.localeCompare(b.name);if(f.sort==='newest')return b.added.localeCompare(a.added)||a.name.localeCompare(b.name);if(f.sort==='deadline')return (['open','rolling'].includes(status(a,today))?0:1)-(['open','rolling'].includes(status(b,today))?0:1)||(a.deadline||'9999').localeCompare(b.deadline||'9999')||a.name.localeCompare(b.name);
const community=f.community&&f.community!=='all';return weights[status(a,today)]-weights[status(b,today)]||(community?Number(b.community.includes(f.community))-Number(a.community.includes(f.community)):0)||(Number(b.geo==='state'&&b.states.includes(f.location))-Number(a.geo==='state'&&a.states.includes(f.location)))||(a.deadline||'9999').localeCompare(b.deadline||'9999')||a.name.localeCompare(b.name);});}
const api={day,status,matches,sortRows,labels,benefits};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.AeroLogic=api;
})(typeof window!=='undefined'?window:globalThis);
