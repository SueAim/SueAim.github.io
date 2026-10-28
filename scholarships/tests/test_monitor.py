import importlib.util,unittest,copy,urllib.error
from unittest.mock import patch,MagicMock
from pathlib import Path
spec=importlib.util.spec_from_file_location('monitor',Path(__file__).resolve().parents[1]/'scripts/monitor_sources.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ParserTests(unittest.TestCase):
 def test_hidden_script_not_evidence(self):
  p=m.Page();p.feed('<h3>New Technician Scholarship</h3><p>Maintenance tuition.</p><script>Fake scholarship</script><h3>Other award</h3><p>Other criteria.</p>')
  self.assertEqual(p.sections[0]['heading'],'New Technician Scholarship')
  self.assertIn('Maintenance tuition.',p.sections[0]['body'])
  self.assertNotIn('Fake scholarship',' '.join(p.text))
  self.assertNotIn('Other criteria.',p.sections[0]['body'])
 def test_normalization(self):self.assertEqual(m.norm('A&P — Maintenance Scholarship'),'a p maintenance scholarship')

class MaintenanceTests(unittest.TestCase):
 def setUp(self):
  self.catalog={'records':[{'id':'award','name':'Award','org':'Provider','url':'https://example.org/award','status':'open','deadline':'2026-10-28'}],'resources':[]}
  self.state={};self.now='2026-10-29T12:15:00Z'
 def result(self,code):
  r={'url':'https://example.org/award','provider':'Provider','httpStatus':code}
  return r|({'digest':'valid','sections':[{'heading':'Scholarship','body':'Maintenance.'}]} if code==200 else {'error':'HTTP '+str(code)})
 def test_deadline_and_recurring_exception(self):
  m.reconcile(self.catalog,self.state,[self.result(200)],self.now)
  self.assertEqual(self.catalog['records'][0]['maintenance']['hiddenReason'],'expired')
  self.catalog['records'][0]['recurring']=True
  events,_=m.reconcile(self.catalog,self.state,[self.result(200)],self.now)
  self.assertFalse(self.catalog['records'][0]['maintenance']['hidden'])
  self.assertEqual(self.catalog['records'][0]['status'],'open') # Visibility never fabricates a new application cycle.
  self.assertEqual(events[0]['action'],'restored')
 def test_missing_recovers_but_expired_stays_hidden(self):
  m.reconcile(self.catalog,self.state,[self.result(404)],self.now)
  self.assertEqual(self.catalog['records'][0]['maintenance']['hiddenReason'],'source-missing')
  m.reconcile(self.catalog,self.state,[self.result(503)],self.now)
  self.assertTrue(self.state['https://example.org/award']['missing'])
  m.reconcile(self.catalog,self.state,[self.result(200)],self.now)
  self.assertEqual(self.catalog['records'][0]['maintenance']['hiddenReason'],'expired')
  self.assertFalse(self.state['https://example.org/award']['missing'])
 def test_active_missing_link_restored(self):
  self.catalog['records'][0]['deadline']='2026-11-15'
  m.reconcile(self.catalog,self.state,[self.result(410)],self.now)
  events,counts=m.reconcile(self.catalog,self.state,[self.result(200)],self.now)
  self.assertFalse(self.catalog['records'][0]['maintenance']['hidden'])
  self.assertEqual(counts['restoredThisRun'],1)
  self.assertEqual(events[0]['action'],'restored')
 def test_temporary_errors_do_not_hide_active_award(self):
  self.catalog['records'][0]['deadline']='2026-11-15'
  for code in [403,429,500,503]:
   m.reconcile(self.catalog,self.state,[self.result(code)],self.now)
   self.assertFalse(self.catalog['records'][0]['maintenance']['hidden'])
 def test_nj_day_boundary(self):
  self.assertEqual(m.local_day('2026-10-29T02:00:00Z'),'2026-10-28')
  m.reconcile(self.catalog,self.state,[self.result(200)],'2026-10-29T02:00:00Z')
  self.assertFalse(self.catalog['records'][0]['maintenance']['hidden'])
 def test_past_opening_is_not_recurring(self):
  r=self.catalog['records'][0];r['opens']='2026-10-01'
  self.assertEqual(m.hidden_reason(r,'2026-10-29'),'expired')
  r['opens']='2026-11-02'
  self.assertIsNone(m.hidden_reason(r,'2026-10-29'))
 def test_http_status_preserved(self):
  error=urllib.error.HTTPError('https://example.org/award',404,'Missing',None,None)
  with patch.object(m.urllib.request,'urlopen',side_effect=error):
   self.assertEqual(m.fetch_source(('https://example.org/award','Provider'))['httpStatus'],404)
 def test_new_heading_is_a_lead_once(self):
  r=self.result(200);r['sections']=[{'heading':'New Aircraft Maintenance Scholarship','body':'Technician education support.'}]
  old={'digest':'old','headings':['Old scholarship']}
  found=m.discover(self.catalog,r,old,'2026-10-28')
  self.assertEqual(len(found),1);self.assertEqual(self.catalog['records'][-1]['status'],'verify')
  self.assertEqual(self.catalog['records'][-1]['kind'],'lead')
  self.assertEqual(m.discover(self.catalog,r,old,'2026-10-28'),[])
 def test_pdf_sources_are_checked_for_recovery(self):
  response=MagicMock();response.headers={'Content-Type':'application/pdf'};response.read.return_value=b'%PDF-1.7\nOfficial scholarship flyer';response.__enter__.return_value=response
  with patch.object(m.urllib.request,'urlopen',return_value=response):
   result=m.fetch_source(('https://example.org/flyer.pdf','Provider'))
  self.assertEqual(result['httpStatus'],200);self.assertEqual(result['sourceType'],'pdf');self.assertEqual(result['sections'],[])
 def test_first_baseline_does_not_claim_new_award(self):
  self.assertEqual(m.discover(self.catalog,self.result(200),{},'2026-10-28'),[])

if __name__=='__main__':unittest.main()
