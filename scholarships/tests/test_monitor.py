import importlib.util,unittest
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
if __name__=='__main__':unittest.main()
