const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const file=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/app.js'),'utf8');
const start=file.indexOf('function moduleVerified(k){'),stop=file.indexOf('\n}',start);
assert(start>=0&&stop>start,'Cannot locate moduleVerified');
const fnCode=file.slice(start,stop+2)+'\nmoduleVerified;';
function check(e,hasLab){
 const state={lessonEvidence:{'AT-006:5':e}},window={ACADEMY_PILOT_LABS:hasLab?{'AT-006:5':{}}:{}};
 return vm.runInNewContext(fnCode,{state,window})('AT-006:5');
}
assert.equal(check({passed:true,version:'2.3.2'},false),false,'Old answer keys cannot retain new pass');
assert.equal(check({passed:true,version:'2.3.3'},false),true,'New answer keys may retain formative pass');
assert.equal(check({passed:true,version:'2.3.3',labVerified:false},true),false,'Lab still required');
assert.equal(check({passed:true,version:'2.3.3',labVerified:true},true),true,'New check + lab are sufficient for self study');
assert.equal(check({passed:false,version:'2.3.3'},false),false);
assert.equal(check({passed:true,version:'2.3.3',reflection:'saved'},false),true);
console.log('PROGRESS_REVALIDATION_PASS: old pass invalidated without deleting learner notes or lab evidence');
