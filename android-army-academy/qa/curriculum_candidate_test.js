'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.join(__dirname,'../app/src/main/assets'),ctx={window:{}};
vm.createContext(ctx);
for(const file of ['data_core.js','data_plan.js','official_curriculum.js']){
  vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),ctx,{filename:file});
}
const D=ctx.window.ACADEMY_DATA,C=ctx.window.ACADEMY_OFFICIAL_CANDIDATE;
assert(C&&D.recommended,'Candidate and schedule required');
assert.equal(C.approval_status,'CURRICULUM_CANDIDATE_NOT_OFFICIALLY_AUTHORIZED');
assert.equal(C.publication_level,'PUBLIC_SYNTHETIC_DESIGN_ONLY');
assert.equal(C.duration.weeks,12);assert.equal(C.duration.hours_per_week,12);assert.equal(C.duration.total_hours,144);
assert.equal(C.allocation.specialist,90);assert.equal(C.allocation.common,18);
assert.equal(C.allocation.capstone,28);assert.equal(C.allocation.assessment,8);
assert.deepEqual(JSON.parse(JSON.stringify(C.allocation.specialist_scheduled_hours)),{AT:31,DF:30,SP:29});
assert.deepEqual(JSON.parse(JSON.stringify(D.recommended.track_hours)),{AT:31,DF:30,SP:29});
assert.equal(D.recommended.status,'CURRICULUM_APPROVAL_CANDIDATE_NOT_AUTHORIZED');
const sum={AT:0,DF:0,SP:0,common:0,personal:0,assessment:0,capstone:0};
const courseIds=new Set(D.courses.map(c=>c.id));
assert.equal(courseIds.size,42);
assert.equal(D.courses.reduce((n,c)=>n+c.modules.length,0),252);
assert.equal(D.recommended.weeks.length,12);
assert.equal(C.weeks.length,12);
for(let i=0;i<12;i++){
 const w=D.recommended.weeks[i],cw=C.weeks[i],h=w.common+w.personal+w.assessment+w.capstone;
 assert.equal(w.week,i+1);assert.equal(cw.week,i+1);assert.equal(h,12,'Week '+(i+1)+' not 12h');
 assert(cw.task.length>=24);assert(cw.evidence.length>=2);assert(cw.method);
 assert(cw.checkpoint.length>=12);assert(cw.plo.length>0);
 for(const t of ['AT','DF','SP']){
  const count=Object.values(w[t]).reduce((a,b)=>a+b,0);
  for(const [c,n] of Object.entries(w[t])){assert(courseIds.has(c),'Unknown course '+c);assert(Number.isInteger(n)&&n>0);}
  sum[t]+=count;
 }
 for(const key of ['common','personal','assessment','capstone'])sum[key]+=w[key];
 assert.equal(['AT','DF','SP'].reduce((n,k)=>n+Object.values(w[k]).reduce((a,b)=>a+b,0),0),w.personal,'Specialist mismatch week '+w.week);
}
assert.deepEqual(sum,{AT:31,DF:30,SP:29,common:18,personal:90,assessment:8,capstone:28});
assert.equal(C.outcomes.length,8);
const ids=new Set(C.outcomes.map(x=>x.id));assert.equal(ids.size,8);
const assIds=new Set(C.assessments.map(x=>x.id));assert.equal(assIds.size,9);
for(const w of C.weeks)for(const o of w.plo)assert(ids.has(o),'Unknown weekly PLO '+o);
for(const o of C.outcomes){assert(o.performance.length>=25);assert(o.assessment.length>0);for(const a of o.assessment)assert(assIds.has(a));}
let total=0,performance=0;
for(const a of C.assessments){
 assert(a.points>0&&Number.isInteger(a.points));
 assert(a.week>=1&&a.week<=12);
 assert(a.plo.length>0);
 for(const o of a.plo)assert(ids.has(o));
 assert(C.rubrics[a.rubric],a.id);
 total+=a.points;
 if(a.type==='HUMAN_RATED_PERFORMANCE')performance+=a.points;
}
assert.equal(total,100);assert.equal(performance,30);
assert.equal(C.assessments.find(a=>a.id==='WR01').points,20);
assert.equal(C.assessments.find(a=>a.id==='CAP01').points,40);
assert.equal(C.assessments.find(a=>a.id==='OR01').points,10);
assert(C.assessments.find(a=>a.id==='WR01').needsApprovedBank);
for(const k of ['PERFORMANCE','CAPSTONE','ORAL']){
 const rubric=C.rubrics[k];
 assert.equal(rubric.dimensions.reduce((n,d)=>n+d.points,0),rubric.max,k+' rubric total');
}
assert.equal(C.completion_policy.status,'PROPOSED_THRESHOLDS_NOT_INSTITUTIONALLY_AUTHORIZED');
assert.equal(C.completion_policy.attendance_min_hours,Math.ceil(144*C.completion_policy.attendance_min_percent/100));
assert.equal(C.completion_policy.critical_violations_must_equal,0);
assert(C.completion_policy.official_grading_excludes.some(s=>s.includes('504')));
assert.equal(C.quality_gates.length,7);
for(let i=1;i<7;i++)assert.equal(C.quality_gates[i].status,'NOT_APPROVED');
assert(!JSON.stringify(C).includes('육규 641'),'Private internal citation leaked into public curriculum');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
assert(html.includes('<script src="official_curriculum.js"></script>'),'Missing curriculum loader');
assert(html.indexOf('src="official_curriculum.js"')<html.indexOf('src="app.js"'));
assert(html.includes('id="curriculum-candidate-overview"'));
const app=fs.readFileSync(path.join(base,'app.js'),'utf8');
assert(app.includes('function renderCurriculumCandidate('));
assert(app.includes('window.ACADEMY_OFFICIAL_CANDIDATE'));
console.log('CURRICULUM_CANDIDATE_STRUCTURE_PASS: 12w x 12h = 144h, specialist AT31 DF30 SP29, 8 PLOs, 9 assessments totaling 100 points, 7 signoff gates');
console.log('STATUS=EDUCATION_PROPOSAL_NOT_AUTHORIZED / NOT_OFFICIAL_COURSE / NOT_CERTIFICATE');
