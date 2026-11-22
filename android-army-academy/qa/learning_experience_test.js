'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'../app/src/main/assets');
const w={};
vm.runInNewContext(fs.readFileSync(path.join(root,'learning_experience.js'),'utf8'),{window:w});
const E=w.ACADEMY_EXPERIENCE;
assert(E&&Object.isFrozen(E));
const courses=[
 {id:'AT-001',modules:[1,2,3,4,5,6].map(sequence=>({sequence}))},
 {id:'DF-001',modules:[1,2,3,4,5,6].map(sequence=>({sequence}))}
];
const t=x=>JSON.parse(JSON.stringify(x));
assert.deepEqual(t(E.validTarget({course:'AT-001',module:3},courses)),{course:'AT-001',module:3});
assert.equal(E.validTarget({course:'BAD',module:1},courses),null);
assert.equal(E.validTarget({course:'AT-001',module:0},courses),null);
assert.equal(E.validTarget({course:'AT-001',module:1.4},courses),null);
assert.equal(E.validTarget({course:'AT-001',module:'1'},courses),null);
let completed=new Set(['AT-001:1','AT-001:2']);
assert.deepEqual(t(E.suggestNext({course:'AT-001',module:2},courses,k=>completed.has(k))),{course:'AT-001',module:3},'advance to next incomplete module');
assert.deepEqual(t(E.suggestNext({course:'AT-001',module:4},courses,k=>completed.has(k))),{course:'AT-001',module:4},'preserve incomplete current module');
assert.deepEqual(t(E.suggestNext({course:'BAD',module:99},courses,k=>completed.has(k))),{course:'AT-001',module:3},'stale pointer must not crash');
completed=new Set(['AT-001:1','AT-001:2','AT-001:3','AT-001:4','AT-001:5','AT-001:6']);
assert.deepEqual(t(E.suggestNext({course:'AT-001',module:6},courses,k=>completed.has(k))),{course:'DF-001',module:1},'completed course selects next course');
assert.deepEqual(t(E.learningSummary(courses,k=>completed.has(k))),{total:12,done:6,percent:50});
completed=new Set(courses.flatMap(c=>c.modules.map(m=>c.id+':'+m.sequence)));
assert.equal(E.suggestNext({course:'DF-001',module:6},courses,k=>completed.has(k)),null,'all done yields no resume button');
const questions=[...['AT','DF','SP'].flatMap(track=>[1,2].map(n=>({id:track+n,track,options:{A:'a',B:'b'}})))];
assert.deepEqual(t(E.diagnosticForTrack('AT',{index:3,answers:{AT1:'B',AT2:'WRONG',DF1:'A',fake:'A'}},questions)),{index:3,answers:{AT1:'B'}});
assert.deepEqual(t(E.diagnosticForTrack('DF',{index:99,answers:{DF1:'A'}},questions)),{index:9,answers:{DF1:'A'}});
assert.deepEqual(t(E.diagnosticForTrack('SP',{index:-15,answers:{SP2:'B'}},questions)),{index:0,answers:{SP2:'B'}});
assert.deepEqual(t(E.cleanDiagnosticDrafts({AT:{index:2,answers:{AT1:'B'}},DF:{index:0,answers:{}},BAD:{index:8,answers:{AT1:'A'}}},questions)),{AT:{index:2,answers:{AT1:'B'}}});
const app=fs.readFileSync(path.join(root,'app.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
assert(html.indexOf('src="learning_experience.js"')>0&&html.indexOf('src="learning_experience.js"')<html.indexOf('src="app.js"'));
for(const id of ['home-next-lesson','main-content'])assert(html.includes('id="'+id+'"'));
assert(html.includes('class="skip-link"'));
assert(html.includes('aria-label="이어서 학습하기"'));
assert(html.includes('data-view-target="capstone"'), 'Capstone is first-class bottom navigation');
assert(!html.includes('id="floating-mission"'), 'No content-obscuring floating button');
assert(html.includes('data-action="resume-lesson"'), 'One tap continue above the fold');
assert(app.includes("const oldFloating=$('floating-mission');if(oldFloating)"), 'Navigation no longer requires floating button');

for(const fn of ['renderNextLesson','resumeNextLesson','saveDiagnosticDraft','restoreDiagnosticDraft'])assert(app.includes('function '+fn+'('));
assert(app.includes("if(act==='resume-lesson')resumeNextLesson()"));
assert(app.includes("state.lastLesson={course:id,module:seq};save();"));
assert(app.includes('state.diagDrafts=window.ACADEMY_EXPERIENCE.cleanDiagnosticDrafts('));
assert(app.includes('clean.diagDrafts=window.ACADEMY_EXPERIENCE.cleanDiagnosticDrafts('));
assert(app.includes("if(act==='answer'){"));
assert(app.includes("diagAnswers[q.id]=t.dataset.answer;saveDiagnosticDraft()"));
assert(app.includes('delete state.diagDrafts[diagTrack]'));
for(const k of ['.skip-link:focus','.resume-panel','.academy-guide','@media(max-width:359px)'])assert(css.includes(k));

const flowStart=app.indexOf('function renderNextLesson(){'),flowEnd=app.indexOf('function renderHome(){',flowStart);
assert(flowStart>=0&&flowEnd>flowStart,'Executable experience functions found');
let saves=0;const navigation=[],nodes={'home-next-lesson':{innerHTML:''}};
const flowContext={
 window:w,D:{courses,diagnostic:questions},state:{lastLesson:{course:'AT-001',module:2},diagDrafts:{}},
 $:id=>nodes[id],courseById:id=>courses.find(c=>c.id===id),
 moduleVerified:key=>new Set(['AT-001:1','AT-001:2']).has(key),
 esc:x=>String(x),pad:n=>String(n).padStart(2,'0'),
 diagTrack:'AT',diagIndex:0,diagAnswers:{},diagFinished:false,TRACKS:['AT','DF','SP'],
 save:()=>{saves++},
 showCourse:id=>navigation.push('course:'+id),
 openModule:(id,n)=>navigation.push('module:'+id+':'+n),
 go:id=>navigation.push('go:'+id)
};
vm.createContext(flowContext);
vm.runInContext(app.slice(flowStart,flowEnd)+'globalThis.flowFunctions={renderNextLesson,resumeNextLesson,saveDiagnosticDraft,restoreDiagnosticDraft};',flowContext);
flowContext.flowFunctions.renderNextLesson();
assert(nodes['home-next-lesson'].innerHTML.includes('data-action="resume-lesson"'));
assert(nodes['home-next-lesson'].innerHTML.includes('모듈 03'));
flowContext.flowFunctions.resumeNextLesson();
assert.deepEqual(navigation,['course:AT-001','module:AT-001:3']);
flowContext.diagAnswers={AT1:'B'};flowContext.diagIndex=1;
flowContext.flowFunctions.saveDiagnosticDraft();
assert.equal(saves,1);assert.equal(flowContext.state.diagDrafts.AT.index,1);
assert.equal(flowContext.state.diagDrafts.AT.answers.AT1,'B');
flowContext.diagAnswers={};flowContext.diagIndex=0;
flowContext.flowFunctions.restoreDiagnosticDraft('AT');
assert.equal(flowContext.diagIndex,1);
assert.equal(flowContext.diagAnswers.AT1,'B');
flowContext.flowFunctions.restoreDiagnosticDraft('DF');
assert.equal(flowContext.diagIndex,0);
assert.equal(Object.keys(flowContext.diagAnswers).length,0);

console.log('ACADEMY_EXPERIENCE_QA_PASS: resume, next incomplete module, draft restore, invalid input rejection, accessible integration verified');
