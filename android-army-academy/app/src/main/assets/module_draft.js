(()=>{
'use strict';
// Ephemeral input protection only. Official learning evidence is saved separately.
const drafts=Object.create(null);
function slot(key){return drafts[key]||(drafts[key]={reflection:null,lab:null});}
function capture(key,reflection,lab){
 if(typeof key!=='string'||!key.includes(':'))throw Error('Invalid module key');
 const d=slot(key);
 if(typeof reflection==='string')d.reflection=reflection.slice(0,3000);
 if(lab&&typeof lab==='object'&&!Array.isArray(lab)){
   const safe=Object.create(null);
   for(const [k,v] of Object.entries(lab).slice(0,32))if(typeof k==='string'&&k.length<=80)safe[k]=String(v??'').slice(0,80);
   d.lab=safe;
 }
}
function getReflection(key,saved){return drafts[key]?.reflection??String(saved??'');}
function getLab(key,saved){return {...(drafts[key]?.lab??saved??{})};}
function clear(key){delete drafts[key];}
window.ACADEMY_MODULE_DRAFTS=Object.freeze({capture,getReflection,getLab,clear});
})();
