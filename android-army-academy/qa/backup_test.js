const fs=require('fs'),vm=require('vm'),assert=require('assert');
const s=fs.readFileSync(__dirname+'/../app/src/main/assets/app.js','utf8');
const start=s.indexOf('function sanitizeBackup('),end=s.indexOf('function importAcademyBackup(',start);
assert(start>=0&&end>start);
const source=s.slice(start,end);
const ids=Array.from({length:14},(_,i)=>`AT-${String(i+1).padStart(3,'0')}`);
const ctx={
 D:{courses:ids.map(id=>({id}))},
 defaults:{weights:{AT:34,DF:33,SP:33},currentWeek:1,bookmarks:[],notes:{},modules:{},xpEvents:[],capstone:[],diagRuns:[],settings:{sound:false,volume:34,haptics:false,contrast:false,textSize:100,reducedMotion:false}},
 TRACKS:['AT','DF','SP'],CAPSTONE:Array.from({length:14},(_,i)=>String(i)),
 structuredClone,listUnique:a=>[...new Set(a)],sanitize:(v,max=4000)=>String(v).slice(0,max),
};
vm.createContext(ctx);vm.runInContext(source+'globalThis.sanitizeBackupExport=sanitizeBackup',ctx);
const valid={version:1,data:{weights:{AT:60,DF:25,SP:15},currentWeek:7,bookmarks:['AT-001','BAD'],notes:{'AT-001':'학습'},modules:{'AT-001':[1,2,2,8],BAD:[1]},xpEvents:['AT-001:1','SP-001:1','BAD:1'],capstone:[1,13,15],settings:{sound:true,volume:200,textSize:120},diagRuns:[{track:'AT',correct:8,total:10,time:'2026-01-01'}]}};
const out=ctx.sanitizeBackupExport(valid);
assert.deepEqual(Array.from(out.modules['AT-001']),[1,2]);
assert(!('BAD' in out.modules));
assert(!out.bookmarks.includes('BAD'));
assert.equal(out.currentWeek,7);
assert.equal(out.settings.volume,100);
assert.equal(out.weights.AT,60);
assert(!out.xpEvents.includes('SP-001:1'));
assert.equal(out.capstone.length,2);
assert.throws(()=>ctx.sanitizeBackupExport({version:9,data:{}}));
const invalid=ctx.sanitizeBackupExport({version:1,data:{weights:{AT:100,DF:100,SP:0}}});
assert.deepEqual(Array.from(Object.values(invalid.weights)),[34,33,33]);
console.log('BACKUP_VALIDATION_PASS');
