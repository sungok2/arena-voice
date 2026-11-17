'use strict';
// Structural inventory, never an approval decision. All review entries default to pending.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.join(__dirname,'../app/src/main/assets'),window={},ctx=vm.createContext({window});
for(const file of ['data_core.js','data_plan.js','lesson_df001.js','lesson_df_expansion.js','lesson_at_expansion.js','lesson_sp_expansion.js','pilot_labs.js','quiz_upgrade.js','quiz_applied_v2_3_3.js','official_curriculum.js']){
 vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),ctx,{filename:file});
}
const D=window.ACADEMY_DATA,L=window.ACADEMY_LESSONS,C=window.ACADEMY_OFFICIAL_CANDIDATE;
assert.equal(C.approval_status,'CURRICULUM_CANDIDATE_NOT_OFFICIALLY_AUTHORIZED');
const course=new Map(D.courses.map(c=>[c.id,c]));assert.equal(course.size,42);
const taught=new Map();
for(const w of C.module_allocations)for(const [id,seqs] of Object.entries(w.modules))for(const seq of seqs){
 const k=id+':'+seq;const a=taught.get(k)||[];a.push(w.week);taught.set(k,a);
}
const labs=window.ACADEMY_PILOT_LABS||{};
const lessonRows=[];
for(const [id,courseLessons] of Object.entries(L)){
 const c=course.get(id);assert(c,'Missing course '+id);
 for(let i=0;i<courseLessons.length;i++){
  const m=courseLessons[i],obj=c.modules[i],key=id+':'+(i+1),weeks=taught.get(key)||[];
  assert.equal(m.status,'EDUCATIONAL_DRAFT_NOT_EXPERT_APPROVED',key);
  assert(Array.isArray(m.questions)&&m.questions.length===2);
  lessonRows.push([key,c.track,id,c.name_ko,i+1,obj.title,obj.objective,weeks.join(';'),weeks.length?'REQUIRED_TEACHING':'OPTIONAL_LIBRARY',m.reference_url||'','PENDING_EXACT_CLAUSE_PAGE_VERSION','PENDING_INDEPENDENT_2_SME','PENDING_INSTRUCTOR','NOT_APPROVED','']);
 }
}
assert.equal(lessonRows.length,252);
const labRows=Object.entries(labs).map(([id,l])=>{
 const [courseId,moduleNo]=id.split(':');assert(course.get(courseId),'Unknown lab course '+id);
 assert(Number(moduleNo)>=1&&Number(moduleNo)<=6);
 assert(l.scenario&&l.standard&&l.fields?.length);
 return [id,l.title,l.fields.length,l.reference||'', 'SELF_CHECK_ONLY','PENDING_INDEPENDENT_REFERENCE','PENDING_POSITIVE_NEGATIVE_TEST','PENDING_INSTRUCTOR','NOT_APPROVED',''];
});
assert.equal(labRows.length,15);
const scheduled=[...taught.values()].reduce((n,x)=>n+x.length,0);assert.equal(scheduled,90);
const taughtUnique=lessonRows.filter(r=>r[7].length).length;
function cell(value){let s=String(value??'');if(/^[=+\-@\t]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function csv(name,headers,rows,out){
 for(const row of rows)assert.equal(row.length,headers.length,name+': wrong column count '+row.length+' vs '+headers.length);
 fs.writeFileSync(path.join(out,name),'\ufeff'+[headers,...rows].map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n','utf8');
}
const pos=process.argv.indexOf('--out');if(pos>=0){const out=process.argv[pos+1];assert(out&&!out.startsWith('--'));fs.mkdirSync(out,{recursive:true});
 csv('252_lesson_source_review.csv',['lesson_id','track','course_id','course_name','module','module_title','performance_objective','scheduled_weeks','curriculum_use','reference_url_NOT_VERIFIED','exact_clause_page_version','independent_reviewers','course_instructor','content_approval','review_notes'],lessonRows,out);
 csv('15_lab_verification_review.csv',['lab_id','lab_title','auto_checked_fields','source_url_NOT_VERIFIED','scope','source_review','independent_positive_negative_test','instructor_approval','status','notes'],labRows,out);
 const info={curriculum_version:C.version,lesson_total:252,required_course_sessions:scheduled,required_unique_modules:taughtUnique,lab_total:15,content_signoffs:0,lab_signoffs:0,source_verifications:0,legal_authority_approved:false,official_education_ready:false};
 fs.writeFileSync(path.join(out,'content_review_coverage.json'),JSON.stringify(info,null,2)+'\n','utf8');
}
console.log('TEACHING_EVIDENCE_INVENTORY_PASS: 252 lesson records, '+scheduled+' scheduled hours / '+taughtUnique+' unique required modules, 15 synthetic lab candidates');
console.log('G2/G3=NOT_APPROVED: content/exact citations/instructor independent review not evidenced');
