// Validate every synthetic lab with correct and incorrect inputs; no app/network required.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const base=path.join(__dirname,'../app/src/main/assets');
const load=fs.readFileSync(path.join(base,'pilot_labs.js'),'utf8').trim();
const pref='window.ACADEMY_PILOT_LABS=';
assert(load.startsWith(pref)&&load.endsWith(';'));
const labs=JSON.parse(load.slice(pref.length,-1));
const app=fs.readFileSync(path.join(base,'app.js'),'utf8');
const start=app.indexOf('function validatePilotLab('),end=app.indexOf('function renderPilotLab(',start);
assert(start>=0&&end>start);
const context={};vm.createContext(context);
vm.runInContext(app.slice(start,end)+';globalThis.grade=validatePilotLab;',context);
let checked=0;
for(const [key,lab] of Object.entries(labs)){
 assert(lab.fields.length>=2,key);
 const good=Object.fromEntries(lab.fields.map(x=>[x.id,String(x.answer)]));
 assert.equal(context.grade(lab,good),true,key+' correct test');
 assert.equal(context.grade(lab,{}),false,key+' empty test');
 const first=lab.fields[0];
 const bad={...good,[first.id]:first.type==='number'?String(first.answer+100000):'__INCORRECT__'};
 assert.equal(context.grade(lab,bad),false,key+' incorrect test');
 checked++;
}
assert(checked>=15);
console.log('PRACTICAL_LAB_POSITIVE_NEGATIVE_TEST_PASS: '+checked+' x 3 cases');
