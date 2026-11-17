'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.join(__dirname,'../training_cases');
const files=['PE01_quality_etl_synthetic.json','PE02_data_fusion_identity_synthetic.json','PE03_model_validation_synthetic.json','PE04_rag_authorization_synthetic.json','PE05_alternative_cost_synthetic.json','PE06_tevv_release_gate_synthetic.json'];
const idx=process.argv.indexOf('--out'),dest=idx<0?path.join(__dirname,'../performance-review'):process.argv[idx+1];
assert(dest&&!dest.startsWith('--'),'--out requires directory');
fs.mkdirSync(dest,{recursive:true});
const cases=files.map((file,i)=>{const c=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));return {id:'PE0'+(i+1),file,...c}});
const enc=v=>{let s=String(v??'');if(/^[=+\-@\t]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
function csv(file,header,rows){for(const row of rows)assert.equal(row.length,header.length);fs.writeFileSync(path.join(dest,file),'\ufeff'+[header,...rows].map(r=>r.map(enc).join(',')).join('\r\n')+'\r\n','utf8');}
const columns=['assessment_id','fixture','title','week','PLO','public_source_reference','reference_clause_verified','key_recomputed_by_automation','SME_1','SME_2','instructor_approval','accessibility_review','rubric_alignment','pilot_evidence','approval_status','notes'];
const rows=cases.map(c=>{
 const plos=c.plo||c.assessed_outcomes,reference=c.methodological_reference||'https://www.postgresql.org/docs/current/queries-table-expressions.html';
 return [c.id,c.file,c.title||'이종 식별자 융합',c.week||8,plos.join(';'),reference,'NOT_VERIFIED','STRUCTURAL_TEST_ONLY','','','','','','','NOT_APPROVED',''];
});
csv('six_performance_case_review.csv',columns,rows);
const capEvidence=['CAP-01','CAP-02','CAP-03','CAP-04','CAP-05','CAP-06','CAP-07','CAP-08','CAP-09'];
csv('capstone_nine_evidence_review.csv',['evidence_id','PLO_trace','deliverable_uri','independent_rater_1','independent_rater_2','rubric_anchor_checked','content_approved','notes'],capEvidence.map(id=>[id,'PENDING_PLO_VALIDATION','','','','','NOT_APPROVED','']));
csv('pilot_assessor_calibration_blank.csv',['fictional_case_only_no_personal_data','assessment_id','rater_A_points','rater_B_points','agreement_rule_approved','disagreement_resolution','evidence_hash','status'],cases.map(c=>['EXAMPLE_TEMPLATE_NO_LEARNER_DATA',c.id,'','','','','','NOT_STARTED']));
const counts={version:'2.5.0',status:'NOT_APPROVED',synthetic_formative_practica:6,source_claim_verified:0,instructor_approved:0,independent_summative_exam_approved:0,capstone_evidence_templates:9,assessor_calibration_completed:0,real_learner_outcomes_evaluated:0};
fs.writeFileSync(path.join(dest,'review_manifest.json'),JSON.stringify(counts,null,2)+'\n','utf8');
console.log('PERFORMANCE_REVIEW_EXPORT_PASS: six case reviews, nine capstone artifacts, six blank assessor calibration rows; zero formal approvals');
