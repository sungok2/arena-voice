#!/usr/bin/env python3
from pathlib import Path
from collections import Counter
import json,re,hashlib,sys
base=Path(__file__).resolve().parents[1]/'app'/'src'/'main'/'assets'
js_files=['data_core.js','data_assessment.js','data_plan.js','lesson_df001.js','lesson_df_expansion.js','lesson_at_expansion.js','lesson_sp_expansion.js','app.js','styles.css']
html=(base/'index.html').read_text()
for f in js_files[:-1]:
 assert (base/f).is_file() and (f'src="{f}"' in html or f'href="{f}"' in html), f
assert not re.search(r'<(?:script|link)[^>]+(?:src|href)=["\']https?://',html,re.I)
core=json.loads((base/'data_core.js').read_text()[len('window.ACADEMY_DATA='):-1])
def unpack(file,prefix,suffix):
 s=(base/file).read_text().strip();assert s.startswith(prefix) and s.endswith(suffix),file
 return json.loads(s[len(prefix):-len(suffix)])
df1=unpack('lesson_df001.js','window.ACADEMY_LESSONS=',';')
all_lessons=dict(df1)
for f in ('lesson_df_expansion.js','lesson_at_expansion.js','lesson_sp_expansion.js'):
 data=unpack(f,'Object.assign(window.ACADEMY_LESSONS,',');')
 for id,lessons in data.items():
  assert id not in all_lessons,id
  all_lessons[id]=lessons
ids=[c['id'] for c in core['courses']];assert len(ids)==42 and len(set(ids))==42
assert set(ids)==set(all_lessons),set(ids)^set(all_lessons)
assert len(all_lessons)==42
modules=[(c,m) for c in core['courses'] for m in c['modules']]
assert len(modules)==252
texts=[];all_questions=[]
for c in core['courses']:
 lessons=all_lessons[c['id']]
 assert len(lessons)==len(c['modules'])==6,c['id']
 for m,l in zip(c['modules'],lessons):
  assert l['status']=='EDUCATIONAL_DRAFT_NOT_EXPERT_APPROVED',(c['id'],m['sequence'])
  assert len(l['sections'])>=3 and all(len(x)==2 and len(x[1])>40 for x in l['sections']),c['id']
  assert len(l['example']['lines'])>=3 and all(len(x)>=5 for x in l['example']['lines']),c['id']
  assert len(l['task'])>=35,c['id']
  assert len(l['questions'])==2,c['id']
  assert l.get('reference_url','').startswith('https://'),(c['id'],m['sequence'])
  for q in l['questions']:
   assert len(q['q'])>=18 and len(q['choices'])==4 and len(set(q['choices']))==4,c['id']
   assert isinstance(q['a'],int) and 0<=q['a']<4
   assert len(q['why'])>=(16 if c['id']=='DF-001' else 40)
   all_questions.append(q)
  texts.append(l['sections'][0][1])
assert len(set(texts))==252, 'duplicate exact content'
print('COURSE_CONTENT_ALL_252_PASS, MODULES=252, LECTURES=252, QUIZ=504, DISTINCT_CORES=252')
print('TRACKS',Counter(c['track'] for c in core['courses']))
print('CORRECT_OPTION_DISTRIBUTION',Counter(q['a'] for q in all_questions))
import subprocess
for f in js_files[:-1]:
 if f.endswith('.js'):
  subprocess.run(['node','--check',str(base/f)],check=True,stdout=subprocess.PIPE)
print('JS_SYNTAX_PASS')