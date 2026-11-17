const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../app/src/main/assets'),W={},ctx=vm.createContext({window:W});
for(const f of ['data_core.js','data_assessment.js','lesson_df001.js','lesson_df_expansion.js','lesson_at_expansion.js','lesson_sp_expansion.js'])
 vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),ctx,{filename:f});
const baseline={};
let diagnosticBase={};
for(const [id,ms] of Object.entries(W.ACADEMY_LESSONS)){
 assert.equal(ms.length,6,id);
 ms.forEach((m,i)=>m.questions.forEach((q,qi)=>{
  baseline[id+':'+(i+1)+':'+qi]={stem:q.q,why:q.why,correct:q.choices[q.a],choices:[...q.choices]};
 }));
}
for(const q of W.ACADEMY_DATA.diagnostic)diagnosticBase[q.id]={stem:q.question,choices:'ABCD'.split('').map(x=>q.options[x]),correct:q.options[q.correct],rationale:q.rationale};
for(const f of ['quiz_upgrade.js','quiz_applied_v2_3_3.js'])
 vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),ctx,{filename:f});
const items=Object.entries(W.ACADEMY_LESSONS).flatMap(([id,ms])=>ms.flatMap((m,i)=>m.questions.map((q,qi)=>({id:id+':'+(i+1)+':'+qi,q}))));
let foundation=0,applied=0,authored=0;
const counts=[0,0,0,0];
assert.equal(items.length,504);
for(const [index,item] of items.entries()){
 const q=item.q,prior=baseline[item.id];
 assert(prior,item.id);
 assert.equal(q.choices.length,4,item.id);assert.equal(new Set(q.choices).size,4,item.id);
 assert(Number.isInteger(q.a)&&q.a>=0&&q.a<=3,item.id);
 assert.equal(q.a,index%4,'Answer rotation '+item.id);counts[q.a]++;
 assert.equal(q.review_flag,'EXPERT_REVIEW_PENDING',item.id);
 assert(q.why.length>=25,'Explanation too short '+item.id);
 if(q.item_type==='FOUNDATION_RESTORED'){
  foundation++;
  assert.equal(q.q,prior.stem,'Original stem changed '+item.id);
  assert.equal(q.why,prior.why,'Original explanation changed '+item.id);
  assert.equal(q.choices[q.a],prior.correct,'Original key changed '+item.id);
  assert.deepEqual([...q.choices].sort(),[...prior.choices].sort(),'Added unrelated distractor '+item.id);
  assert.equal(q.difficulty,'FOUNDATION_DRAFT');
 }else if(q.item_type==='APPLIED_SCENARIO'){
  applied++;
  if(q.provenance==='2.3.3_HAND_AUTHORED_SYNTHETIC')authored++;
  assert.equal(q.difficulty,'APPLIED_DRAFT',item.id);
 }else throw Error('Unclassified item '+item.id+': '+q.item_type);
}
assert.deepEqual(counts,[126,126,126,126]);
assert.equal(foundation,456);assert.equal(applied,48);assert.equal(authored,24);
const ds=W.ACADEMY_DATA.diagnostic;assert.equal(ds.length,30);
const diagCounts=[0,0,0,0];
for(const q of ds){
 const orig=diagnosticBase[q.id];assert(orig,q.id);
 assert.equal(q.question,orig.stem,q.id);assert.equal(q.rationale,orig.rationale,q.id);
 assert.deepEqual('ABCD'.split('').map(x=>q.options[x]).sort(),orig.choices.sort(),q.id);
 assert.equal(q.options[q.correct],orig.correct,q.id);
 assert.equal(q.item_type,'FOUNDATION_DIAGNOSTIC_RESTORED',q.id);
 assert.equal(q.status,'EXPERT_REVIEW_PENDING',q.id);
 diagCounts['ABCD'.indexOf(q.correct)]++;
}
assert.deepEqual(diagCounts,[8,8,7,7]);
assert.equal(W.ACADEMY_QUIZ_UPGRADE.appliedScenariosTotal,48);
assert.equal(W.ACADEMY_QUIZ_UPGRADE.foundationRestored,456);
console.log('ITEM_INTEGRITY_PASS 456 foundation originals restored, 48 applied items (24 new), 30 diagnostics restored, 504 answers balanced');
console.log('WARNING: this test verifies structural provenance and key preservation, NOT expert correctness or psychometric validity');
