'use strict';
// Validates public SYNTHETIC practice fixtures: not pedagogy validity or official scoring.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..','training_cases');
const names={
 PE01:'PE01_quality_etl_synthetic.json',
 PE02:'PE02_data_fusion_identity_synthetic.json',
 PE03:'PE03_model_validation_synthetic.json',
 PE04:'PE04_rag_authorization_synthetic.json',
 PE05:'PE05_alternative_cost_synthetic.json',
 PE06:'PE06_tevv_release_gate_synthetic.json'
};
const fixtures=Object.fromEntries(Object.entries(names).map(([id,name])=>[id,JSON.parse(fs.readFileSync(path.join(root,name),'utf8'))]));
assert.deepEqual(Object.keys(fixtures),['PE01','PE02','PE03','PE04','PE05','PE06']);
for(const [id,c] of Object.entries(fixtures)){
 assert.equal(c.classification,'PUBLIC_SYNTHETIC_TRAINING_ONLY',id);
 assert(c.instructor_reference||c.teacher_reference_only,'No benchmark '+id);
 if(id!=='PE02'){
  assert.equal(c.id,id);
  assert.equal(c.assessment_id,id);
  assert.equal(c.approval_status,'INSTRUCTIONAL_DRAFT_NOT_APPROVED_FOR_OFFICIAL_SCORING');
  assert.equal(Object.values(c.rubric).reduce((n,x)=>n+x,0),5);
  assert.equal(c.max_points,5);
  assert(c.task.length>40&&c.expected_evidence.length>=3);
  assert(c.methodological_reference.startsWith('https://'));
 }
}
const pe1=fixtures.PE01,r1=pe1.instructor_reference;
const ids=new Set(),duplicates=[],valid=[],quarantine=[];
for(const row of pe1.records){
 if(ids.has(row.event_id)){duplicates.push(row);continue;}
 ids.add(row.event_id);
 const isValid=!!row.asset_id&&pe1.rules.accepted_states.includes(row.state)&&Number.isFinite(Date.parse(row.at))&&/Z|[+-]\d\d:\d\d$/.test(row.at);
 (isValid?valid:quarantine).push(row);
}
assert.equal(pe1.records.length,r1.raw);assert.equal(duplicates.length,r1.duplicates);
assert.equal(ids.size,r1.unique);assert.equal(quarantine.length,r1.quarantined);
assert.equal(valid.length,r1.valid);
assert.deepEqual(valid.map(x=>x.event_id).sort(),[...r1.valid_event_ids].sort());
assert.deepEqual(quarantine.map(x=>x.event_id).sort(),[...r1.quarantined_event_ids].sort());
const p100=n=>Math.round(n*1000/pe1.records.length)/10;
assert.equal(p100(pe1.records.filter(x=>x.asset_id).length),r1.raw_asset_id_complete_pct);
assert.equal(p100(pe1.records.filter(x=>pe1.rules.accepted_states.includes(x.state)).length),r1.raw_state_valid_pct);
assert.equal(p100(pe1.records.filter(x=>Number.isFinite(Date.parse(x.at))).length),r1.raw_timestamp_valid_pct);

const pe3=fixtures.PE03,r3=pe3.instructor_reference;
const tr=pe3.rows.filter(x=>x.split==='TRAIN'),te=pe3.rows.filter(x=>x.split==='TEST');
const trainSet=new Set(tr.map(x=>x.asset_id)),testSet=new Set(te.map(x=>x.asset_id));
assert.equal(tr.length,r3.train_rows);assert.equal(te.length,r3.test_rows);
assert.deepEqual([...trainSet].sort(),r3.train_groups);assert.deepEqual([...testSet].sort(),r3.test_groups);
assert.deepEqual([...trainSet].filter(x=>testSet.has(x)),r3.overlap_groups);
const cm={TP:0,TN:0,FP:0,FN:0};
for(const x of te){assert([0,1].includes(x.actual)&&[0,1].includes(x.predicted));const key=x.actual===1?(x.predicted===1?'TP':'FN'):(x.predicted===1?'FP':'TN');cm[key]++;}
for(const k of Object.keys(cm))assert.equal(cm[k],r3[k]);
assert.equal((cm.TP+cm.TN)/te.length,r3.accuracy);
assert.equal(cm.TP/(cm.TP+cm.FP),r3.precision);
assert.equal(cm.TP/(cm.TP+cm.FN),r3.recall);

const pe4=fixtures.PE04,r4=pe4.instructor_reference,docs=new Map(pe4.documents.map(d=>[d.id,d]));
const results=[];
for(const req of pe4.requests){
 const doc=docs.get(req.doc_id);assert(doc);
 const allowed=pe4.role_permissions[req.role].includes(doc.access);
 const supported=Object.hasOwn(doc.claims,req.claim);
 let actual=!allowed?'DENY_ACCESS':!supported?'ABSTAIN_UNSUPPORTED':doc.injected_text?'ALLOW_CITED_IGNORE_INJECTION':'ALLOW_CITED';
 assert.equal(actual,req.expected,req.id);results.push(actual);
}
assert.equal(results.filter(x=>x.startsWith('ALLOW_')).length,r4.allow_cited);
assert.equal(results.filter(x=>x==='DENY_ACCESS').length,r4.denied);
assert.equal(results.filter(x=>x==='ABSTAIN_UNSUPPORTED').length,r4.abstained);
assert.equal(r4.external_actions_performed,0,'No tools/networks in dry run');

const pe5=fixtures.PE05,r5=pe5.instructor_reference,eligible=[];
for(const o of pe5.options){
 const cost=o.capex+o.annual_opex*pe5.evaluation_years;
 assert.equal(cost,r5.costs_by_id[o.id]);
 if(o.license_allows_training===pe5.hard_requirements.licensed_for_training&&o.mean_processing_seconds<=pe5.hard_requirements.max_mean_processing_seconds)eligible.push({id:o.id,cost});
}
assert.deepEqual(eligible.map(x=>x.id).sort(),[...r5.eligible_ids].sort());
const cheapest=eligible.sort((a,b)=>a.cost-b.cost)[0];
assert.equal(cheapest.id,r5.selected);
assert.equal(r5.costs_by_id['AI-ONPREM']-cheapest.cost,r5.savings_vs_ai_onprem);

const pe6=fixtures.PE06,r6=pe6.instructor_reference,checks=pe6.tests;
const failed=checks.filter(x=>!x.passed),blocked=failed.filter(x=>x.blocking);
const passRate=checks.filter(x=>x.passed).length*100/checks.length;
assert.equal(checks.length,r6.total);assert.equal(checks.length-failed.length,r6.passed);
assert.equal(failed.length,r6.failed);assert.equal(passRate,r6.pass_rate_pct);
assert.equal(blocked.length,r6.blocking_failed);
assert.equal(failed.length-blocked.length,r6.nonblocking_failed);
const go=passRate>=pe6.acceptance_rule.overall_pass_rate_min_pct&&blocked.length<=pe6.acceptance_rule.blocking_failures_max;
assert.equal(go,false);assert.equal(r6.decision,'NO_GO_RETEST_REQUIRED');
assert.equal(r6.remediation.length,4);

console.log('SYNTHETIC_PERFORMANCE_CASES_PASS: 5 new cases PE01/03/04/05/06 recomputed; PE02 is checked by synthetic_practicum_test.js');
console.log('WARNING: all are PUBLIC PRACTICE drafts, no independent SME or examination approval');
