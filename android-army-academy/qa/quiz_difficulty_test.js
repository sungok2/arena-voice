const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const base=path.resolve(__dirname,'../app/src/main/assets'),W={},ctx={window:W};
vm.createContext(ctx);
for(const f of ['data_core.js','data_assessment.js','lesson_df001.js','lesson_df_expansion.js','lesson_at_expansion.js','lesson_sp_expansion.js','quiz_upgrade.js','quiz_applied_v2_3_3.js'])
 vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),ctx,{filename:f});
const qs=Object.values(W.ACADEMY_LESSONS).flatMap(x=>x.flatMap(v=>v.questions)),counts=[0,0,0,0],seen=new Set();
assert.equal(qs.length,504);
assert.equal(W.ACADEMY_QUIZ_UPGRADE.customScenarios,24);
assert.equal(W.ACADEMY_QUIZ_UPGRADE.additionalAppliedScenarios,24);
assert.equal(W.ACADEMY_QUIZ_UPGRADE.foundationRestored,456);
for(const q of qs){
 assert.equal(q.choices.length,4);
 assert.equal(new Set(q.choices).size,4);
 assert(q.a>=0&&q.a<4);
 assert(q.why.length>15);
 assert.equal(q.review_flag,'EXPERT_REVIEW_PENDING');
 assert(['FOUNDATION_RESTORED','APPLIED_SCENARIO'].includes(q.item_type));
 counts[q.a]++;seen.add(q.q);
}
assert.deepEqual(counts,[126,126,126,126]);
assert.equal(seen.size,504,'Duplicate question stems');
for(const id of ['AT','DF','SP']){
 const a=W.ACADEMY_DATA.diagnostic.filter(x=>x.track===id);assert.equal(a.length,10);
 for(const q of a){assert.equal(new Set(Object.values(q.options)).size,4);assert.equal(q.status,'EXPERT_REVIEW_PENDING');}
}
console.log('QUESTION_STRUCTURE_PASS: 504 module items, 48 applied scenarios, 456 foundation items, 30 foundation diagnostics, 126/126/126/126 answer positions');
console.log('EDUCATIONAL_VALIDITY=NOT_EXPERT_APPROVED');
