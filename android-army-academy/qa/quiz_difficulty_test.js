const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const base=path.resolve(__dirname,'../app/src/main/assets'),W={},ctx={window:W};
vm.createContext(ctx);
for(const f of ['data_core.js','data_assessment.js','lesson_df001.js','lesson_df_expansion.js','lesson_at_expansion.js','lesson_sp_expansion.js','quiz_upgrade.js'])vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),ctx,{filename:f});
const qs=Object.values(W.ACADEMY_LESSONS).flatMap(x=>x.flatMap(v=>v.questions)),counts=[0,0,0,0],seen=new Set();
assert.equal(qs.length,504);assert.equal(W.ACADEMY_QUIZ_UPGRADE.customScenarios,24);
for(const q of qs){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert(q.a>=0&&q.a<4);assert(q.why.length>15);counts[q.a]++;assert(!q.choices.some(c=>/검증은 불필요하다|무조건 승인|대상·시점·버전이 달라져도 추가 검증은 불필요/.test(c)));seen.add(q.q);}
assert(counts.every(x=>x>=110&&x<=145),JSON.stringify(counts));
for(const id of ['AT','DF','SP']){const a=W.ACADEMY_DATA.diagnostic.filter(x=>x.track===id);assert.equal(a.length,10);for(const q of a)assert.equal(new Set(Object.values(q.options)).size,4);}
console.log('ADVANCED_QUIZ_QA_PASS 504 module items, 24 applied-case revisions, 30 diagnostics, answer positions '+counts.join('/')+', unique stems '+seen.size);
