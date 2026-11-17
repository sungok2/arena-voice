const fs=require('fs'),assert=require('assert'),vm=require('vm');
const base=__dirname+'/../app/src/main/assets/';
const data=JSON.parse(fs.readFileSync(base+'lesson_df001.js','utf8').replace(/^window\.ACADEMY_LESSONS=/,'').replace(/;\s*$/,''));
assert.equal(data['DF-001'].length,6);
for(let i=0;i<6;i++){
 const l=data['DF-001'][i];
 assert(l.sections.length>=3 && l.example.lines.length>=3 && l.task.length>=35);
 assert.equal(l.questions.length,2);
 l.questions.forEach(q=>{assert.equal(q.choices.length,4);assert(Number.isInteger(q.a)&&q.a>=0&&q.a<4);assert(q.why.length>20);});
}
const js=fs.readFileSync(base+'app.js','utf8');
assert(!js.includes('data-course-module'));
assert(js.includes('function openModule('));
assert(js.includes('function completeModuleLesson('));
assert(js.includes("if(reflection.length<30)"));
assert(js.includes("moduleChoices[i]!==q.a"));
assert(js.includes('state.lessonEvidence[key]={passed:true'));
assert(js.includes('if(!lesson){'));
console.log('LESSON_READER_QA_PASS: DF001 6 written lessons + 12 checks + gated completion + fallback drafts');
