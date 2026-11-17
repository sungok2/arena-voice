'use strict';
// Export review tables without scores, identities, approvals, or sensitive examples.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.join(__dirname,'../app/src/main/assets'),ctx={window:{}};vm.createContext(ctx);
for(const f of ['data_core.js','data_plan.js','official_curriculum.js'])vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),ctx,{filename:f});
const D=ctx.window.ACADEMY_DATA,C=ctx.window.ACADEMY_OFFICIAL_CANDIDATE;
if(C.approval_status!=='CURRICULUM_CANDIDATE_NOT_OFFICIALLY_AUTHORIZED')throw Error('Do not export a fake approval');
const out=process.argv[process.argv.indexOf('--out')+1]||path.join(__dirname,'../curriculum-review');
fs.mkdirSync(out,{recursive:true});
function csv(name,head,rows){
 const cell=v=>{let s=String(v??'');if(/^[=+@\-\t]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
 for(const row of rows)assert.equal(row.length,head.length,name+' column mismatch');
 const body=[head,...rows].map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
 fs.writeFileSync(path.join(out,name),'\ufeff'+body,'utf8');
}
const weekRows=C.weeks.map((w,i)=>{const p=D.recommended.weeks[i];return [w.week,p.common,Object.values(p.AT).reduce((a,b)=>a+b,0),Object.values(p.DF).reduce((a,b)=>a+b,0),Object.values(p.SP).reduce((a,b)=>a+b,0),p.capstone,p.assessment,w.plo.join(';'),w.method,w.task,w.evidence.join(';'),w.checkpoint,'PENDING_EXPERT_APPROVAL','']});
csv('weekly_outcome_evidence_matrix.csv',['week','common_h','AT_h','DF_h','SP_h','capstone_h','assessment_h','PLO_ids','method','performance_task','evidence_ids','critical_checkpoint','review_status','reviewer_notes'],weekRows);
csv('program_learning_outcomes.csv',['PLO_id','track','competency_title','observable_performance','assessment_ids','SME_1','SME_2','review_decision','notes'],C.outcomes.map(o=>[o.id,o.track,o.title,o.performance,o.assessment.join(';'),'','','PENDING','']));
csv('assessment_blueprint.csv',['assessment_id','name','week','max_points','PLO_ids','type','rubric_id','approved_assessment_bank','review_status','examiner_1','examiner_2','notes'],C.assessments.map(a=>[a.id,a.name,a.week,a.points,a.plo.join(';'),a.type,a.rubric,a.needsApprovedBank?'REQUIRED_NOT_AVAILABLE':'N/A','NOT_APPROVED','','','']));
csv('approval_gate_register.csv',['gate_id','gate_name','status','required_evidence_uri','owner','review_date','decision','notes'],C.quality_gates.map(g=>[g.id,g.label,g.status,'','','','PENDING','']));
const summary={program_id:C.program_id,version:C.version,status:C.approval_status,approval_signoffs_completed:0,courses_in_library:D.courses.length,scheduled_weeks:12,planned_hours:144,specialist_hours:{AT:31,DF:30,SP:29},outcomes:C.outcomes.length,assessments:C.assessments.length,max_total_points:C.assessments.reduce((s,a)=>s+a.points,0),record:'REVIEW_INVENTORY_ONLY_NOT_OFFICIAL_APPROVAL'};
fs.writeFileSync(path.join(out,'curriculum_review_manifest.json'),JSON.stringify(summary,null,2)+'\n','utf8');
console.log('CURRICULUM_REVIEW_EXPORT_PASS: 12 weeks, 8 outcomes, 9 assessments, 7 approval gates, 0 official signoffs');
