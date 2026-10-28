#!/usr/bin/env python3
"""Public scholarship source monitor. No student data, AI API, or paid services.
A successful HTTP check is NOT a renewed eligibility review. New headings are
leads only. Initial baselines never generate 'new scholarship' announcements.
"""
import concurrent.futures,datetime,hashlib,json,re,sys,urllib.request,urllib.error
from difflib import SequenceMatcher
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from zoneinfo import ZoneInfo
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.skip=0;self.heading=None;self.headingText=[];self.sections=[];self.current=None;self.text=[]
 def handle_starttag(self,tag,attrs):
  if tag in ('script','style','noscript'):self.skip+=1
  if not self.skip and tag in ('h1','h2','h3','h4'):
   self.heading=tag;self.headingText=[]
 def handle_endtag(self,tag):
  if tag in ('script','style','noscript') and self.skip:self.skip-=1
  if tag==self.heading:
   h=' '.join(' '.join(self.headingText).split());self.current={'heading':h,'body':''};self.sections.append(self.current);self.heading=None
 def handle_data(self,data):
  if self.skip:return
  self.text.append(data)
  if self.heading:self.headingText.append(data)
  elif self.current:self.current['body']+=' '+data

def norm(s):return re.sub('[^a-z0-9]+',' ',s.lower()).strip()
def fetch_source(item):
 url,provider=item
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'AeroAid-PublicScholarshipSourceMonitor/1.0 (+https://sueaim.github.io/scholarships/)'})
  with urllib.request.urlopen(req,timeout=18) as r:
   content_type=r.headers.get('Content-Type','')
   body=r.read(3000000)
   if body.startswith(b'%PDF-'):
    return {'url':url,'provider':provider,'digest':hashlib.sha256(body).hexdigest(),'sections':[],'httpStatus':200,'sourceType':'pdf'}
   if 'text/html' not in content_type:return {'url':url,'provider':provider,'error':'Non-HTML source; requires manual review'}
   raw=body.decode('utf-8','replace')
  p=Page();p.feed(raw)
  text=' '.join(' '.join(p.text).split())
  if len(text)<200:return {'url':url,'provider':provider,'error':'Page too short to verify content'}
  if re.search(r'(verify you are human|just a moment|checking your browser|access denied)',text,re.I):return {'url':url,'provider':provider,'error':'Source returned a verification/access screen'}
  return {'url':url,'provider':provider,'digest':hashlib.sha256(text.encode()).hexdigest(),'sections':p.sections,'httpStatus':200}
 except urllib.error.HTTPError as e:return {'url':url,'provider':provider,'error':'HTTP '+str(e.code),'httpStatus':e.code}
 except Exception as e:return {'url':url,'provider':provider,'error':type(e).__name__}

def local_day(now):
 return datetime.datetime.fromisoformat(now.replace('Z','+00:00')).astimezone(ZoneInfo('America/New_York')).date().isoformat()

def keep_cycle(record,today):
 return record.get('recurring') is True or any(record.get(k) and record[k]>=today for k in ('reopens','opens')) or bool(record.get('opensMonth') and record['opensMonth']>=today[:7])

def hidden_reason(record,today):
 if record.get('sourceHealth',{}).get('state')=='missing':return 'source-missing'
 ended=record.get('status')=='closed' or bool(record.get('deadline') and record['deadline']<today)
 if ended and not keep_cycle(record,today):return 'expired'
 return None

def reconcile(catalog,state,results,now):
 """Keep all URLs in the recovery set; change public visibility, not history."""
 today=local_day(now);events=[]
 for result in results:
  url=result['url'];old=state.get(url,{});entry=dict(old,lastChecked=now)
  if 'error' not in result:
   entry.update(digest=result['digest'],headings=[s['heading'] for s in result['sections']],lastReached=now,missing=False,lastError=None,httpStatus=result.get('httpStatus',200))
  else:
   entry.update(lastError=result['error'],httpStatus=result.get('httpStatus'))
   if result.get('httpStatus') in (404,410):entry.update(missing=True,missingSince=old.get('missingSince') or now)
   # 403/429/5xx/timeouts cannot clear a previous confirmed missing state.
  state[url]=entry
 for r in catalog['records']+catalog.get('resources',[]):
  health=state.get(r['url'],{});before=r.get('maintenance',{}).get('hiddenReason')
  r['sourceHealth']={'state':'missing' if health.get('missing') else 'ok' if health.get('lastError') is None and health.get('lastReached') else 'unconfirmed','checkedAt':health.get('lastChecked'),'lastReached':health.get('lastReached'),'httpStatus':health.get('httpStatus')}
  reason=('source-missing' if health.get('missing') else None) if 'id' not in r else hidden_reason(r,today)
  r['maintenance']={'hidden':bool(reason),'hiddenReason':reason,'evaluatedOn':today}
  if before!=reason:
   events.append({'id':r.get('id'),'name':r.get('name'),'action':'hidden' if reason else 'restored','reason':reason,'at':now})
 counts={k:sum(r['maintenance']['hiddenReason']==k for r in catalog['records']) for k in ('expired','source-missing')}
 return events,{'visibleRecords':sum(not r['maintenance']['hidden'] for r in catalog['records']),'hiddenExpired':counts['expired'],'hiddenMissing':counts['source-missing'],'restoredThisRun':sum(x['action']=='restored' for x in events),'timezone':'America/New_York'}

def discover(catalog,result,old,today):
 """New headings on maintained official pages become leads, never open awards."""
 if not old.get('digest'):return []
 found=[]
 for section in result['sections']:
  title=section['heading'];n=norm(title)
  if n in {norm(x) for x in old.get('headings',[])}:continue
  if not 18<len(title)<130 or not re.search(r'\b(scholarship|grant|award)\b',title,re.I):continue
  if not re.search(r'(maintenance|avionics|airframe|powerplant|A&P|mechanic)',title+' '+section['body'],re.I):continue
  if re.search(r'(scholarship program|scholarship descriptions|application|how to|scholarships for|are open|winners|recipients|award ceremony)',title,re.I):continue
  if any(n==norm(r['name']) or SequenceMatcher(None,n,norm(r['name'])).ratio()>.83 for r in catalog['records']):continue
  rid='lead-'+hashlib.sha256((result['url']+title).encode()).hexdigest()[:14]
  if any(r['id']==rid for r in catalog['records']):continue
  catalog['records'].append(dict(id=rid,name=title,org=result['provider'],url=result['url'],amount='Not yet verified',value=None,status='verify',deadline=None,opens=None,geo='unknown',states=[],benefit='unconfirmed',gender='all',community=[],veteran=False,parent=False,minAge=None,maxAge=None,stage='check',requirements='New maintenance-related provider heading detected automatically. Eligibility, amount, payment route and dates require confirmation.',group=None,ai='unknown',kind='lead',note='Not a confirmed NJ match or an open award. Check the official application before sending personal information.',reviewed=None,added=today,recurring=False))
  found.append({'name':title,'url':result['url'],'at':today,'id':rid})
 return found

def run():
 catalog=json.loads((ROOT/'data/catalog.json').read_text());statefile=ROOT/'data/source-state.json'
 state=json.loads(statefile.read_text()) if statefile.exists() else {}
 previous=json.loads((ROOT/'data/updates.json').read_text())
 now=datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z');today=local_day(now)
 # Includes hidden entries: every missing URL remains eligible for recovery.
 source={r['url']:r['org'] for r in catalog['records']}
 source.update({r['url']:r['name'] for r in catalog['resources']})
 changes=previous.get('changes',[]);discovered=previous.get('discovered',[]);failures=[];reached=0
 results=list(concurrent.futures.ThreadPoolExecutor(max_workers=5).map(fetch_source,sorted(source.items())))
 for result in results:
  url=result['url'];old=state.get(url,{})
  if 'error' in result:
   failures.append({k:result[k] for k in ('url','provider','error','httpStatus') if k in result});continue
  reached+=1
  if old.get('digest') and old['digest']!=result['digest']:changes.insert(0,{'provider':result['provider'],'url':url,'at':now})
  discovered=discover(catalog,result,old,today)+discovered
 events,maintenance=reconcile(catalog,state,results,now)
 # Do not promote currently missing URLs through announcement/history links.
 changes=[x for x in changes if not state.get(x['url'],{}).get('missing')]
 updates=dict(lastAttempt=now,lastSuccessful=now if not failures else previous.get('lastSuccessful'),sourcesChecked=reached,sourcesTotal=len(source),changes=changes[:35],discovered=discovered[:35],failures=failures,maintenance=maintenance,lifecycle=(events+previous.get('lifecycle',[]))[:100],message='Automatic expiry, missing-link recovery and maintenance-heading discovery. Reachability is not eligibility verification.')
 if reached==0:updates['message']='All source checks failed. Date cleanup still ran; no successful source check is claimed.'
 for path,obj in [(ROOT/'data/catalog.json',catalog),(ROOT/'data/updates.json',updates),(statefile,state)]:path.write_text(json.dumps(obj,indent=2,ensure_ascii=False)+'\n')
 write_feed(catalog,updates)
 print(f'Public source check: {reached}/{len(source)} reached, {len(failures)} failed. Visibility: {maintenance}.')

def write_feed(catalog,updates):
 entries=[]
 for r in sorted([r for r in catalog['records'] if not hidden_reason(r,local_day(updates.get('lastAttempt') or catalog['reviewed']+'T12:00:00Z'))],key=lambda x:x['added'],reverse=True)[:100]:
  entries.append('<entry><title>'+escape(('Unverified lead: ' if r['kind']=='lead' else '')+r['name'])+'</title><id>https://sueaim.github.io/scholarships/#'+escape(r['id'])+'</id><updated>'+r['added']+'T12:00:00Z</updated><link href="'+escape(r['url'],quote=True)+'"/><summary>'+escape(r['org']+' — '+r['amount']+'. '+r['requirements']+' Check official terms; not necessarily open.')+'</summary></entry>')
 updated=updates.get('lastAttempt') or catalog['reviewed']+'T12:00:00Z'
 feed='<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>AeroAid · Scholarship directory updates</title><id>https://sueaim.github.io/scholarships/</id><link href="https://sueaim.github.io/scholarships/"/><link rel="self" href="https://sueaim.github.io/scholarships/feed.xml"/><updated>'+updated+'</updated><subtitle>Public directory additions, including closed cycles and unverified leads. Check providers.</subtitle>'+''.join(entries)+'</feed>\n'
 (ROOT/'feed.xml').write_text(feed)

if __name__=='__main__':run()
