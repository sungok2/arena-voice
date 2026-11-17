#!/usr/bin/env python3
"""Offline package structural QA. No classified data or external network access."""
from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]/'app'/'src'/'main'/'assets'
if not root.is_dir():
    root=Path(__file__).resolve().parents[1]/'assets'
files=[root/x for x in ('index.html','styles.css','app.js','data_core.js','data_assessment.js','data_plan.js','lesson_df001.js','lesson_df_expansion.js')]
assert all(x.is_file() for x in files),[str(x) for x in files if not x.is_file()]
html=files[0].read_text(encoding='utf-8')
assert all(f'src="{p.name}"' in html or f'href="{p.name}"' in html for p in files[1:]),'missing asset script/style references'
assert not re.search(r'<(?:script|link)[^>]+(?:src|href)=["\']https?://',html,re.I),'remote resource found'
assert 'ArmyNative' in files[2].read_text(encoding='utf-8'),'Android export bridge absent'
assert 'window.importAcademyBackup' in files[2].read_text(encoding='utf-8'),'Backup restore absent'
def data(name,header):
    s=(root/name).read_text(encoding='utf-8').strip();assert s.startswith(header) and s.endswith(';');return json.loads(s[len(header):-1])
c=data('data_core.js','window.ACADEMY_DATA=')
# Assessment/plan lines have closing ); around raw JSON.
def assigned(name):
    s=(root/name).read_text(encoding='utf-8').strip();prefix='Object.assign(window.ACADEMY_DATA,'
    assert s.startswith(prefix) and s.endswith(');')
    return json.loads(s[len(prefix):-2])
a=assigned('data_assessment.js');p=assigned('data_plan.js')
assert len(c['courses'])==42
assert len({x['id'] for x in c['courses']})==42
assert {t:sum(1 for x in c['courses'] if x['track']==t) for t in ('AT','DF','SP')}=={'AT':14,'DF':14,'SP':14}
assert sum(len(x['modules']) for x in c['courses'])==252
assert all(len(x['modules'])==6 and x.get('insight') and x.get('misconception') for x in c['courses'])
assert len(a['diagnostic'])==30 and len(a['questions'])==210
assert all(sum(q['course_id']==c['id'] for q in a['questions'])==5 for c in c['courses'])
assert len(p['recommended']['weeks'])==12
assert p['recommended']['total_hours']==144
assert p['recommended']['track_hours']=={'AT':30,'DF':30,'SP':30}
assert all(sum(w[k] for k in ('common','personal','capstone','assessment'))==12 for w in p['recommended']['weeks'])
print('OFFLINE_CONTENT_QA_PASS courses=42 modules=252 diagnostic=30 reflections=210 plan=12 weeks 144h')
lessons=data('lesson_df001.js','window.ACADEMY_LESSONS=')
assert len(lessons['DF-001'])==6 and all(len(x['sections'])>=3 and len(x['questions'])==2 for x in lessons['DF-001'])
assert 'data-action="open-module"' in (root/'app.js').read_text()
assert 'data-course-module' not in (root/'app.js').read_text(), 'Legacy checkbox should be removed'
assert 'lessonEvidence' in (root/'app.js').read_text()
print('INTERACTIVE_LESSON_QA_PASS DF001=6 modules / 12 quiz questions')

# 13 newly authored Data Fusion courses / 78 modules and 156 topical quiz checks.
s=(root/'lesson_df_expansion.js').read_text(encoding='utf-8').strip()
prefix='Object.assign(window.ACADEMY_LESSONS,'
assert s.startswith(prefix) and s.endswith(');')
import json
exp=json.loads(s[len(prefix):-2])
assert sorted(exp)==[f'DF-{i:03d}' for i in range(2,15)]
assert all(len(v)==6 for v in exp.values())
for course,modules in exp.items():
    for module in modules:
        assert len(module['sections'])>=3
        assert len(module['example']['lines'])>=3
        assert len(module['questions'])==2
        assert all(len(q['choices'])==4 and len(set(q['choices']))==4 and 0<=q['a']<4 for q in module['questions'])
print('DATA_FUSION_LESSON_QA_PASS courses=14 modules=84 quiz=168 (including DF-001)')
