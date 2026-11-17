'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const f=path.join(__dirname,'../training_cases/PE02_data_fusion_identity_synthetic.json'),c=JSON.parse(fs.readFileSync(f,'utf8'));
assert.equal(c.classification,'PUBLIC_SYNTHETIC_TRAINING_ONLY');
assert.equal(c.approval_status,'EXPERT_VERIFICATION_PENDING');
assert.equal(c.events.length,7);assert.equal(c.assets.length,4);
const key=(system,id)=>system+':'+id;
const assets=new Map(c.assets.map(a=>[key(a.system,a.source_asset_id),a.canonical_asset_id]));
assert.equal(assets.size,c.assets.length,'Duplicate asset mapping');
const seen=new Set(),rows=[],orphans=[],duplicates=[];
for(const e of c.events){
 const eventKey=key(e.system,e.event_id);
 if(seen.has(eventKey)){duplicates.push(e);continue;}seen.add(eventKey);
 const canonical=assets.get(key(e.system,e.source_asset_id));
 const t=Date.parse(e.occurred_at);assert(Number.isFinite(t),'Bad source timestamp');
 if(!canonical){orphans.push(e);continue;}
 rows.push({...e,canonical_asset_id:canonical,utc:new Date(t).toISOString()});
}
const count={};
for(const e of rows)count[e.canonical_asset_id]=(count[e.canonical_asset_id]||0)+1;
const ref=c.teacher_reference_only;
assert.equal(c.events.length,ref.total_source_events);
assert.equal(duplicates.length,ref.duplicate_count);
assert.equal(seen.size,ref.unique_event_count);
assert.equal(orphans.length,ref.unmatched_event_count);
assert.equal(rows.length,ref.matched_event_count);
assert.equal(Object.keys(count).length,ref.unique_canonical_ids);
assert.deepEqual(count,ref.counts_by_canonical_id);
const converted=rows.find(r=>r.system==='ALPHA'&&r.event_id==='M-003');
assert.equal(converted.utc,ref.utc_example['ALPHA:M-003']);
assert.notEqual(assets.get('ALPHA:E-01'),assets.get('BRAVO:E-01'),'A source ID collision must map to separate assets');
assert(seen.has('ALPHA:M-001')&&seen.has('BRAVO:M-001'),'Event IDs are scoped by source');
assert.equal(c.max_points,5);
assert.equal(c.rubric_id,'PE02');
console.log('SYNTHETIC_PRACTICUM_QA_PASS: 7 raw, 1 duplicate, 6 unique, 1 orphan, 5 matched, 4 canonical IDs, UTC converted.');
console.log('NOTE: technical fixture verified; real teaching validity and examiner signoff still PENDING');
