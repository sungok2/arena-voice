#!/usr/bin/env node
'use strict';
// Review inventory, not a validity or approval certificate. All content is public/synthetic.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.join(__dirname,'../app/src/main/assets');
const W={},ctx=vm.createContext({window:W});
for(const f of ['data_core.js','data_assessment.js','lesson_df001.js','lesson_df_expansion.js','lesson_at_expansion.js','lesson_sp_expansion.js','quiz_upgrade.js']){
  vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),ctx,{filename:f});
}
const D=W.ACADEMY_DATA,L=W.ACADEMY_LESSONS;
const headers=['item_id','item_group','track','course_id','course_title','module','module_title','item_no','item_type','review_flag','stem','option_A','option_B','option_C','option_D','correct_letter','correct_text','rationale','reference_url','risk','expert_1_id','expert_1_decision','expert_2_id','expert_2_decision','adjudicator','single_best_answer','distractor_quality','source_verified','job_relevance','approval_decision','review_notes'];
const rows=[],summ={courses:0,modules:0,module_questions:0,cross_module_true_distractors:0,applied_scenarios:0,diagnostics:0,subject_expert_approved:0};
const letter=i=>String.fromCharCode(65+i);
const courseIndex=new Map(D.courses.map(c=>[c.id,c]));
summ.courses=courseIndex.size;
assert.equal(summ.courses,42,'Expected 42 source courses');
const seen=new Set();
for(const [id,lessons] of Object.entries(L)){
 const course=courseIndex.get(id);assert(course,'Unknown course '+id);
 assert.equal(lessons.length,6,'Missing module in '+id);
 for(let i=0;i<lessons.length;i++){
  const lesson=lessons[i],mod=course.modules[i];summ.modules++;
  assert.equal(lesson.questions.length,2);
  for(let qi=0;qi<2;qi++){
   const q=lesson.questions[qi],type=q.item_type||'UNCLASSIFIED',itemId=id+':'+(i+1)+':Q'+(qi+1);
   assert(!seen.has(itemId),'Duplicate stable ID '+itemId);seen.add(itemId);
   assert.equal(q.choices.length,4,itemId);
   assert.equal(new Set(q.choices).size,4,itemId);
   assert(Number.isInteger(q.a)&&q.a>=0&&q.a<=3,itemId);
   if(type==='NEAR_DOMAIN_CHOICE')summ.cross_module_true_distractors++;
   else if(type==='APPLIED_SCENARIO')summ.applied_scenarios++;
   else throw Error('Undocumented generated question type '+type+' '+itemId);
   assert.equal(q.review_flag,'EXPERT_REVIEW_PENDING',itemId);
   const choices=q.choices.slice();
   const risk=type==='NEAR_DOMAIN_CHOICE'?'HIGH: other modules\u2019 true answers reused as distractors; unique best answer unproven':'MEDIUM: handcrafted scenario, individual key/source review pending';
   rows.push([itemId,'MODULE',course.track,id,course.name_ko,i+1,mod.title,qi+1,type,q.review_flag,q.q,...choices,letter(q.a),choices[q.a],q.why,lesson.reference_url||'',risk,'','','','','','','','','','','']);
   summ.module_questions++;
  }
 }
}
for(const q of D.diagnostic){
 assert(['AT','DF','SP'].includes(q.track),q.id);
 assert(!seen.has(q.id),q.id);seen.add(q.id);
 assert(['A','B','C','D'].includes(q.correct),q.id);
 const choices=['A','B','C','D'].map(k=>q.options[k]);
 assert.equal(new Set(choices).size,4,q.id);
 assert.equal(q.status,'EXPERT_REVIEW_PENDING',q.id);
 rows.push([q.id,'DIAGNOSTIC',q.track,'','','','','', 'DIAGNOSTIC_REWRITTEN',q.status,q.question,...choices,q.correct,q.options[q.correct],q.rationale,'','HIGH: diagnostic score uncalibrated; distractors imported from other true answers','','','','','','','','','','','']);
 summ.diagnostics++;
}
assert.equal(summ.modules,252);assert.equal(summ.module_questions,504);
assert.equal(summ.cross_module_true_distractors,480);
assert.equal(summ.applied_scenarios,24);
assert.equal(summ.diagnostics,30);
assert.equal(rows.length,534);
for(const r of rows)assert.equal(r.length,headers.length,'Column count mismatch: '+r[0]);
function cell(v){
 let s=String(v??'').replace(/\r/g,' ');
 if(/^[=+\-@\t]/.test(s))s="'"+s;
 return '"'+s.replace(/"/g,'""')+'"';
}
const summary={version:D.version,generated_at:new Date().toISOString(),counts:summ,review_status:'NO_GO_UNTIL_INDEPENDENT_EXPERT_REVIEW',rubric:['single_best_answer','distractor_quality','source_verified','job_relevance'],caution:'Answer location balance and structural validity do not prove item validity.'};
const at=process.argv.indexOf('--out');
if(at!==-1){
 const out=process.argv[at+1];assert(out&& !out.startsWith('--'),'--out needs a directory');
 fs.mkdirSync(out,{recursive:true});
 const csv=[headers,...rows].map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n';
 fs.writeFileSync(path.join(out,'academy_item_review_2.3.2.csv'),'\ufeff'+csv,'utf8');
 fs.writeFileSync(path.join(out,'academy_item_audit_2.3.2.json'),JSON.stringify(summary,null,2)+'\n','utf8');
 console.log('WROTE_REVIEW_INVENTORY '+out);
}
console.log('QUESTION_REVIEW_INVENTORY_PASS 534 items (480 cross-module distractors, 24 applied cases, 30 diagnostics). EDUCATIONAL_APPROVAL=NO_GO');
