#!/usr/bin/env python3
"""Automated structure gate only. Does not confer educational approval."""
from pathlib import Path
from collections import Counter
import json
base=Path(__file__).resolve().parents[1]/'app/src/main/assets'
def get(n,p,s):
 t=(base/n).read_text().strip()
 assert t.startswith(p) and t.endswith(s),n
 return json.loads(t[len(p):-len(s)])
courses=get('data_core.js','window.ACADEMY_DATA=',';')['courses']
d=get('lesson_df001.js','window.ACADEMY_LESSONS=',';')
for n in ['lesson_df_expansion.js','lesson_at_expansion.js','lesson_sp_expansion.js']:d.update(get(n,'Object.assign(window.ACADEMY_LESSONS,',');'))
labs=get('pilot_labs.js','window.ACADEMY_PILOT_LABS=',';')
assert len(courses)==42 and len(d)==42
stems=[]
allkeys=set()
refs=[]
for c in courses:
 assert len(d[c['id']])==6
 for m,l in zip(c['modules'],d[c['id']]):
  key=f"{c['id']}:{m['sequence']}"
  allkeys.add(key)
  assert l['status']=='EDUCATIONAL_DRAFT_NOT_EXPERT_APPROVED',key
  assert len(l['sections'])>=3 and len(l['example']['lines'])>=3,key
  assert len(l['questions'])==2,key
  assert len(l['task'])>=35,key
  refs.append(l.get('reference_url',''))
  for q in l['questions']:
   assert len(q['choices'])==4 and len(set(q['choices']))==4,key
   assert isinstance(q['a'],int) and 0<=q['a']<4,key
   assert len(q['why'])>=25,key
   stems.append(q['q'])
assert len(stems)==504
dups={q:n for q,n in Counter(stems).items() if n>1}
assert not dups, f"Duplicate stems: {list(dups.items())[:8]}"
assert len(labs)>=15 and set(labs).issubset(allkeys)
for key,v in labs.items():
 assert len(v['fields'])>=2 and len(v['scenario'])>=35,key
 for f in v['fields']:
  assert f['type'] in ['number','select'],key
  if f['type']=='select': assert f['answer'] in [o['value'] for o in f['options']],key
  else:assert isinstance(f['answer'],(int,float)),key
print(f"STRUCTURAL_PASS 42courses 252modules 504uniqueQuestions {len(labs)}scoredLabs")
print(f"QUALITY_DEBT broad_NIST_RMF_references={sum('www.nist.gov/itl/ai-risk-management-framework' in u for u in refs)}")
print("INDEPENDENT_EDUCATIONAL_APPROVAL_STATUS=NOT_APPROVED")
