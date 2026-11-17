#!/usr/bin/env python3
"""Structural quality audit; NOT educational/official approval."""
import json
from pathlib import Path
from collections import Counter
base=Path(__file__).resolve().parents[1]/'app/src/main/assets'
def load(name,start,end):
 raw=(base/name).read_text().strip()
 assert raw.startswith(start) and raw.endswith(end),name
 return json.loads(raw[len(start):-len(end)])
core=load('data_core.js','window.ACADEMY_DATA=',';')
ls=load('lesson_df001.js','window.ACADEMY_LESSONS=',';')
for f in ('lesson_df_expansion.js','lesson_at_expansion.js','lesson_sp_expansion.js'):
 x=load(f,'Object.assign(window.ACADEMY_LESSONS,',');')
 assert not (set(x)&set(ls)),f
 ls.update(x)
assert len(core['courses'])==len(ls)==42
assert all(len(ls[c['id']])==6 for c in core['courses'])
qs=[q for course in ls.values() for lecture in course for q in lecture['questions']]
assert len(qs)==504
assert all(len(l['sections'])>=3 and len(l['example']['lines'])>=3 and len(l['questions'])==2 and l['status']=='EDUCATIONAL_DRAFT_NOT_EXPERT_APPROVED' for arr in ls.values() for l in arr)
assert all(len(q['choices'])==4 and len(set(q['choices']))==4 and 0<=q['a']<4 for q in qs)
stem=Counter(lecture['questions'][1]['q'] for arr in ls.values() for lecture in arr)
assert max(stem.values())==1,"Repeated second question stem"
pilot=load('pilot_labs.js','window.ACADEMY_PILOT_LABS=',';')
assert len(pilot)>=15
opts=Counter(x for q in qs for x in q['choices'])
count=sum(v>=10 for v in opts.values())
nist=sum(l['reference_url']=='https://www.nist.gov/itl/ai-risk-management-framework' for arr in ls.values() for l in arr)
print('STRUCTURAL_QA_PASS: 252 lectures, 504 questions, 15+ interactive pilots')
print(f'EDUCATIONAL_APPROVAL_HOLD: repeated distractor phrases {count}; broad NIST links {nist}; expert reviews 0')
