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

const advanced=fs.readFileSync(__dirname+'/../app/src/main/assets/lesson_df_expansion.js','utf8').trim();
const start='Object.assign(window.ACADEMY_LESSONS,';
assert(advanced.startsWith(start) && advanced.endsWith(');'));
const df=JSON.parse(advanced.slice(start.length,-2));
assert.equal(Object.keys(df).length,13);
assert.equal(Object.values(df).reduce((n,items)=>n+items.length,0),78);
for (const [id,items] of Object.entries(df)) for (const [i,m] of items.entries()) {
 assert.equal(m.questions.length,2,id+':'+(i+1));
 assert(m.task.length>40);
 assert(m.sections.every(s=>s[1].length>35));
 for(const q of m.questions){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert(q.choices[q.a].length>10)}
}
console.log('DATA_FUSION_78_LESSONS_STRUCTURE_TEST_PASS');
