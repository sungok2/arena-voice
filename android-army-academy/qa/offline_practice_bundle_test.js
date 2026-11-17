'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.join(__dirname,'../app/src/main/assets'),data=fs.readFileSync(path.join(base,'performance_practice.js'),'utf8');
const w={};vm.runInNewContext(data,{window:w});
const p=w.ACADEMY_PUBLIC_PRACTICA;
assert.equal(p.length,6);assert.deepEqual(p.map(x=>x.id).join(','),'PE01,PE02,PE03,PE04,PE05,PE06');
const sources={
 PE01:'PE01_quality_etl_synthetic.json',PE02:'PE02_data_fusion_identity_synthetic.json',
 PE03:'PE03_model_validation_synthetic.json',PE04:'PE04_rag_authorization_synthetic.json',
 PE05:'PE05_alternative_cost_synthetic.json',PE06:'PE06_tevv_release_gate_synthetic.json'
};
for(const c of p){
 assert.equal(c.approval_status,'FORMATIVE_PUBLIC_PRACTICE_NOT_OFFICIAL');
 assert.equal(c.assessment_id,c.id);
 assert(c.title.length>8&&c.task.length>30);
 assert(c.expected_evidence.length>=3);
 assert(c.plo.length>0);
 assert(!Object.hasOwn(c,'instructor_reference')&&!Object.hasOwn(c,'teacher_reference_only'));
 assert(!Object.hasOwn(c,'rubric')&&!Object.hasOwn(c.inputs,'instructor_reference'));
 const src=JSON.parse(fs.readFileSync(path.join(__dirname,'../training_cases',sources[c.id]),'utf8'));
 for(const k of Object.keys(c.inputs)){
  if(k==='requests'){
    assert.deepEqual(JSON.parse(JSON.stringify(c.inputs.requests)),src.requests.map(({expected,...x})=>x));
    for(const r of c.inputs.requests)assert(!Object.hasOwn(r,'expected'),'Answer leaked to learner');
  }else assert.deepEqual(JSON.parse(JSON.stringify(c.inputs[k])),src[k],c.id+':'+k+' bundle stale');
 }
}
const index=fs.readFileSync(path.join(base,'index.html'),'utf8'),app=fs.readFileSync(path.join(base,'app.js'),'utf8');
assert(index.includes('<script src="performance_practice.js"></script>'));
assert(index.indexOf('src="performance_practice.js"')<index.indexOf('src="app.js"'));
assert(index.includes('id="performance-practice-overview"'));
assert(app.includes('function renderPublicPerformancePractica('));
assert(app.includes('renderPublicPerformancePractica();'));
assert(app.includes("const id=t.dataset.practice;"),'Export uses DOM button dataset, not string dataset');
assert(app.includes("if(act==='export-public-practice')"));
assert(app.includes('FORMATIVE')||app.includes('공식 성적/수료 인증 불가'));
assert(!app.includes("target.dataset.practice"),'Invalid action binding');
console.log('OFFLINE_PRACTICA_BUNDLE_PASS: 6 independently matched synthetic cases, no educator benchmark fields in learner asset, export action bound');
