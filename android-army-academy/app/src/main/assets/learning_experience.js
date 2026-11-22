(function(){
'use strict';
// Pure, security-conscious learning navigation helpers.
// Local self-study progress ONLY — never awards official education credentials.
const TRACKS=['AT','DF','SP'];
function isCourse(c){return c&&typeof c.id==='string'&&Array.isArray(c.modules);}
function validTarget(v,courses){
 if(!v||typeof v!=='object'||!isCourse(courses?.find(c=>c.id===v.course)))return null;
 if(!Number.isInteger(v.module)||v.module<1||v.module>6)return null;
 const course=courses.find(c=>c.id===v.course);
 return course.modules.some(m=>m.sequence===v.module)?{course:v.course,module:v.module}:null;
}
function suggestNext(last,courses,verified){
 if(!Array.isArray(courses)||typeof verified!=='function')return null;
 const start=validTarget(last,courses);
 if(start&&!verified(start.course+':'+start.module))return start;
 if(start){
  const c=courses.find(x=>x.id===start.course);
  const remain=c.modules.filter(m=>m.sequence>start.module&&!verified(c.id+':'+m.sequence));
  if(remain.length)return {course:c.id,module:remain[0].sequence};
  const earlier=c.modules.filter(m=>m.sequence<=start.module&&!verified(c.id+':'+m.sequence));
  if(earlier.length)return {course:c.id,module:earlier[0].sequence};
 }
 for(const c of courses){
  if(!isCourse(c))continue;
  const m=c.modules.find(x=>Number.isInteger(x.sequence)&&!verified(c.id+':'+x.sequence));
  if(m)return {course:c.id,module:m.sequence};
 }
 return null;
}
function diagnosticForTrack(track,source,questions){
 if(!TRACKS.includes(track))return {index:0,answers:{}};
 const questionSet=new Map((questions||[]).filter(q=>q.track===track).map(q=>[q.id,q]));
 if(!source||typeof source!=='object'||Array.isArray(source))return {index:0,answers:{}};
 const index=Number.isInteger(source.index)?Math.min(9,Math.max(0,source.index)):0;
 const answers={};
 if(source.answers&&typeof source.answers==='object'&&!Array.isArray(source.answers)){
  for(const [id,value] of Object.entries(source.answers).slice(0,10)){
   const q=questionSet.get(id);
   if(q&&typeof value==='string'&&Object.prototype.hasOwnProperty.call(q.options||{},value))answers[id]=value;
  }
 }
 return {index,answers};
}
function cleanDiagnosticDrafts(value,questions){
 const result={};
 if(!value||typeof value!=='object'||Array.isArray(value))return result;
 for(const t of TRACKS)if(value[t]){
  const clean=diagnosticForTrack(t,value[t],questions);
  if(Object.keys(clean.answers).length)result[t]=clean;
 }
 return result;
}
function learningSummary(courses,verified){
 const total=(courses||[]).reduce((sum,c)=>sum+(isCourse(c)?c.modules.length:0),0);
 const done=(courses||[]).reduce((sum,c)=>sum+(isCourse(c)?c.modules.filter(m=>verified(c.id+':'+m.sequence)).length:0),0);
 return {total,done,percent:total?Math.round(done/total*100):0};
}
window.ACADEMY_EXPERIENCE=Object.freeze({validTarget,suggestNext,diagnosticForTrack,cleanDiagnosticDrafts,learningSummary});
})();
