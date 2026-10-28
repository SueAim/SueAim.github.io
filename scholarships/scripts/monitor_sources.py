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
   if 'text/html' not in r.headers.get('Content-Type',''):return {'url':url,'provider':provider,'error':'Non-HTML source; requires manual review'}
   raw=r.read(3000000).decode('utf-8','replace')
  p=Page();p.feed(raw)
  text=' '.join(' '.join(p.text).split())
  if len(text)<200:return {'url':url,'provider':provider,'error':'Page too short to verify content'}
  if re.search(r'(verify you are human|just a moment|checking your browser|access denied)',text,re.I):return {'url':url,'provider':provider,'error':'Source returned a verification/access screen'}
  return {'url':url,'provider':provider,'digest':hashlib.sha256(text.encode()).hexdigest(),'sections':p.sections}
 except Exception as e:return {'url':url,'provider':provider,'error':type(e).__name__}

def run():
 catalog=json.loads((ROOT/'data/catalog.json').read_text());statefile=ROOT/'data/source-state.json'
 state=json.loads(statefile.read_text()) if statefile.exists() else {}
 previous=json.loads((ROOT/'data/updates.json').read_text())
 now=datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z');today=now[:10]
 source={r['url']:r['org'] for r in catalog['records'] if not r['url'].lower().endswith('.pdf')}
 source.update({r['url']:r['name'] for r in catalog['resources']})
 changes=previous.get('changes',[]);discovered=previous.get('discovered',[]);failures=[];reached=0
 for result in concurrent.futures.ThreadPoolExecutor(max_workers=5).map(fetch_source,sorted(source.items())):
  url=result['url'];old=state.get(url)
  if 'error' in result:failures.append({k:result[k] for k in ('url','provider','error')});continue
  reached+=1;headings=[s['heading'] for s in result['sections']]
  if old and old['digest']!=result['digest']:
   changes.insert(0,{'provider':result['provider'],'url':url,'at':now})
  # Narrow discovery: new maintenance-related headings on selected known catalogs.
  if old and any(domain in url for domain in ('aea.net/','lpa-aero.org/','chooseaerospace.org/scholarship')):
   for section in result['sections']:
    title=section['heading'];n=norm(title)
    if n in {norm(x) for x in old.get('headings',[])}:continue
    if not 18<len(title)<130 or not re.search(r'\b(scholarship|grant|award)\b',title,re.I):continue
    if not re.search(r'(maintenance|avionics|airframe|powerplant|A&P)',title+' '+section['body'],re.I):continue
    if re.search(r'(scholarship program|scholarship descriptions|application|how to|scholarships for|are open|winners|recipients)',title,re.I):continue
    known=[norm(r['name']) for r in catalog['records']]
    if any(n==k or SequenceMatcher(None,n,k).ratio()>.83 for k in known):continue
    rid='lead-'+hashlib.sha256((url+title).encode()).hexdigest()[:14]
    record=dict(id=rid,name=title,org=result['provider'],url=url,amount='Not yet verified',value=None,status='verify',deadline=None,opens=None,geo='unknown',states=[],benefit='unconfirmed',gender='all',community=[],veteran=False,parent=False,minAge=None,maxAge=None,stage='check',requirements='New provider heading detected automatically. Eligibility, location, amount, payment route and dates require editorial confirmation.',group=None,ai='unknown',kind='lead',note='Do not submit until you have checked the official application. This listing is not a confirmed NJ match.',reviewed=None,added=today)
    catalog['records'].append(record);discovered.insert(0,{'name':title,'url':url,'at':now,'id':rid})
  state[url]={'digest':result['digest'],'headings':headings,'lastReached':now}
 updates=dict(lastAttempt=now,lastSuccessful=now if not failures else previous.get('lastSuccessful'),sourcesChecked=reached,sourcesTotal=len(source),changes=changes[:35],discovered=discovered[:35],failures=failures,message='Daily source checks; source changes and newly discovered leads are not eligibility verification.')
 if reached==0:
  # Still publish a failure report; never invent a successful check timestamp.
  updates['message']='All source checks failed. Catalog remains the last editorially reviewed version.'
 for path,obj in [(ROOT/'data/catalog.json',catalog),(ROOT/'data/updates.json',updates),(statefile,state)]:path.write_text(json.dumps(obj,indent=2,ensure_ascii=False)+'\n')
 write_feed(catalog,updates)
 print(f'Public source check: {reached}/{len(source)} reached, {len(failures)} failed. {len(discovered)} leads in discovery log.')

def write_feed(catalog,updates):
 entries=[]
 for r in sorted(catalog['records'],key=lambda x:x['added'],reverse=True)[:100]:
  entries.append('<entry><title>'+escape(('Unverified lead: ' if r['kind']=='lead' else '')+r['name'])+'</title><id>https://sueaim.github.io/scholarships/#'+escape(r['id'])+'</id><updated>'+r['added']+'T12:00:00Z</updated><link href="'+escape(r['url'],quote=True)+'"/><summary>'+escape(r['org']+' — '+r['amount']+'. '+r['requirements']+' Check official terms; not necessarily open.')+'</summary></entry>')
 updated=updates.get('lastAttempt') or catalog['reviewed']+'T12:00:00Z'
 feed='<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>AeroAid · Scholarship directory updates</title><id>https://sueaim.github.io/scholarships/</id><link href="https://sueaim.github.io/scholarships/"/><link rel="self" href="https://sueaim.github.io/scholarships/feed.xml"/><updated>'+updated+'</updated><subtitle>Public directory additions, including closed cycles and unverified leads. Check providers.</subtitle>'+''.join(entries)+'</feed>\n'
 (ROOT/'feed.xml').write_text(feed)

if __name__=='__main__':run()
