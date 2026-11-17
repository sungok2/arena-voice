(()=>{'use strict';
const D=window.ACADEMY_DATA;
if(!D||!Array.isArray(D.courses)||D.courses.length!==42){document.body.textContent='교육 콘텐츠가 손상되었습니다. 설치 파일을 다시 확인하십시오.';return;}
const TRACKS=['AT','DF','SP'];
const TRACK={AT:{name:'AI Technology',ko:'AI 기술',icon:'⌘',color:'#50e5cc'},DF:{name:'Data Fusion',ko:'데이터 융합',icon:'◇',color:'#78aeff'},SP:{name:'AI Strategy',ko:'정책·사업기획',icon:'▣',color:'#f3c77a'}};
const CAPSTONE=['Problem Statement','Objective / Expected Outcome','Stakeholders','AS-IS / TO-BE','AI Feasibility','Data Requirements','Architecture','Alternatives','Cost & TCO','Risk & Security','TEV&V','Roadmap','Governance','Expected Benefits & Evidence'];
const WEEK_TITLES=['AI·데이터 기초 진단','공통역량과 정책·보안','Python·SQL·문제정의','데이터 모델과 업무분석','머신러닝·ETL·요구사항','품질·평가·사업기획','LLM·메타데이터·계획서','RAG·데이터통합·타당성','AI 검증·데이터보안·TEV&V','Capstone 문제정의·요구사항','Capstone 아키텍처·시연','최종 검증·발표·평가'];
const LEVELS=[[0,'Recruit'],[200,'Explorer'],[500,'Learner'],[900,'Practitioner'],[1400,'Engineer'],[2000,'Specialist'],[2700,'Designer'],[3500,'Architect'],[4400,'Expert'],[5500,'Master']];
const WEEK_TEMPLATE=[{common:9,personal:2,capstone:0,assessment:1},{common:9,personal:2,capstone:0,assessment:1},...Array.from({length:7},()=>({common:0,personal:12,capstone:0,assessment:0})),{common:0,personal:2,capstone:8,assessment:2},{common:0,personal:0,capstone:10,assessment:2},{common:0,personal:0,capstone:10,assessment:2}];
const KEY='army_academy_rc3_local_v1';
const defaults={weights:{AT:34,DF:33,SP:33},currentWeek:1,bookmarks:[],notes:{},modules:{},xpEvents:[],capstone:[],diagRuns:[],lessonEvidence:{},settings:{sound:false,volume:34,haptics:false,contrast:false,textSize:100,reducedMotion:false}};
const state=(()=>{try{const saved=localStorage.getItem(KEY);if(saved){const s=JSON.parse(saved);return {...structuredClone(defaults),...s,settings:{...defaults.settings,...s.settings}};}const old=JSON.parse(localStorage.getItem('academy_demo_v1')||'{}');const s=structuredClone(defaults);if(old.weights&&TRACKS.every(t=>Number.isInteger(old.weights[t])&&old.weights[t]>=0)&&TRACKS.reduce((a,t)=>a+old.weights[t],0)===100)s.weights=old.weights;if(Array.isArray(old.completed))s.capstone=old.completed.map(n=>CAPSTONE.indexOf(n)).filter(n=>n>=0);return s;}catch{return structuredClone(defaults);}})();
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sanitize=(v,max=4000)=>String(v??'').slice(0,max);
const pad=n=>String(n).padStart(2,'0');
const displayTrack=t=>TRACK[t]?.name||t;
const courseById=id=>D.courses.find(c=>c.id===id);
const listUnique=a=>[...new Set(a)];
const counts=()=>Object.entries(state.lessonEvidence||{}).filter(([key,e])=>e?.passed===true && !!window.ACADEMY_LESSONS?.[key.split(':')[0]]?.[Number(key.split(':')[1])-1]).length;
const totalXP=()=>Math.min(6360,counts()*25);
const level=()=>{let l=LEVELS[0],i=1;LEVELS.forEach((v,j)=>{if(totalXP()>=v[0]){l=v;i=j+1}});return {name:l[1],lvl:i,min:l[0]};};
let view='home',courseFilter='ALL',bookmarkOnly=false,query='',openedCourse=null,openedWeek=1,diagTrack='AT',diagIndex=0,diagAnswers={},diagFinished=false,toastHandle=null,openedModule=null,moduleChoices={};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{toast('저장 공간이 부족해 변경을 저장하지 못했습니다.');}}
function toast(message,kind='success'){const t=$('toast');t.textContent=message;t.style.background=kind==='warning'?'#64482d':'#24504d';t.classList.add('show');clearTimeout(toastHandle);toastHandle=setTimeout(()=>t.classList.remove('show'),3400);}
let audioContext=null;
function cue(kind='tap'){
 const st=state.settings;if(!st.sound||!st.volume||document.hidden)return;
 try{
  const Ctor=window.AudioContext||window.webkitAudioContext;if(!Ctor)return;
  const ac=audioContext||(audioContext=new Ctor());
  if(ac.state==='suspended')ac.resume().catch(()=>{});
  const notes={tap:[[440,0,.055]],advance:[[550,0,.09],[740,.075,.14]],success:[[523,0,.11],[659,.1,.11],[784,.2,.17]],level:[[494,0,.10],[622,.1,.13],[740,.24,.15],[988,.38,.20]],warning:[[370,0,.11],[280,.13,.19]]}[kind]||[[480,0,.08]];
  const gainLimit=Math.min(.09,Math.max(.004,(Number(st.volume)||0)/100*.09));
  for(const [hz,offset,duration] of notes){
   const osc=ac.createOscillator(),g=ac.createGain();osc.type=kind==='warning'?'triangle':'sine';
   osc.frequency.setValueAtTime(hz,ac.currentTime+offset);
   g.gain.setValueAtTime(.00001,ac.currentTime+offset);
   g.gain.exponentialRampToValueAtTime(gainLimit,ac.currentTime+offset+.018);
   g.gain.exponentialRampToValueAtTime(.00001,ac.currentTime+offset+duration);
   osc.connect(g);g.connect(ac.destination);
   osc.onended=()=>{osc.disconnect();g.disconnect();};
   osc.start(ac.currentTime+offset);osc.stop(ac.currentTime+offset+duration+.025);
  }
 }catch{}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&audioContext?.state==='running')audioContext.suspend().catch(()=>{});});
function haptic(ms=22){if(state.settings.haptics&&navigator.vibrate)try{navigator.vibrate(ms)}catch{}}
function applySettings(){document.documentElement.style.setProperty('--font-scale',(Number(state.settings.textSize)||100)/100);document.body.classList.toggle('high-contrast',!!state.settings.contrast);document.body.classList.toggle('reduce-motion',!!state.settings.reducedMotion);document.documentElement.style.scrollBehavior=state.settings.reducedMotion?'auto':'smooth';}
function go(target){if(!['home','schedule','courses','diagnostic','capstone','profile'].includes(target))return;view=target;document.querySelectorAll('[data-view]').forEach(el=>el.hidden=el.dataset.view!==target);document.querySelectorAll('[data-view-target]').forEach(el=>{const active=el.dataset.viewTarget===target;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});$('floating-mission').hidden=target==='capstone';renderCurrent();window.scrollTo({top:0,behavior:state.settings.reducedMotion?'instant':'smooth'});cue('tap');haptic();}
function intTrackHours(w=state.weights){const raw=TRACKS.map(t=>90*w[t]);const h=raw.map(x=>Math.floor(x/100));let remain=90-h.reduce((a,b)=>a+b,0);const ranked=raw.map((v,i)=>({i,r:v%100})).sort((a,b)=>b.r-a.r||a.i-b.i);for(let i=0;i<remain;i++)h[ranked[i].i]++;return Object.fromEntries(TRACKS.map((t,i)=>[t,h[i]]));}
function plan(){const weights={...state.weights},hours=intTrackHours();if(TRACKS.every(t=>weights[t]===D.recommended.weights[t]))return {weights,track_hours:hours,core:18,personal:90,capstone:28,assessment:8,total:144,weeks:D.recommended.weeks.map(w=>({...w,sessions:TRACKS.flatMap(t=>Object.entries(w[t]).map(([id,n])=>({track:t,id,hours:n}))) })),source:'RECOMMENDED_CURRICULUM'};
 const queues=Object.fromEntries(TRACKS.map(t=>[t,D.priority[t].flatMap(([id,count])=>Array(count).fill({track:t,id})).slice(0,hours[t])]));const taken={AT:0,DF:0,SP:0};const schedule=[];
 for(let i=0;i<90;i++){let best=null,score=-Infinity;TRACKS.forEach(t=>{if(taken[t]>=hours[t])return;const v=(i+1)*hours[t]/90-taken[t];if(v>score){best=t;score=v}});schedule.push(queues[best][taken[best]++]);}
 let pos=0;const weeks=WEEK_TEMPLATE.map((w,i)=>{const batch=schedule.slice(pos,pos+w.personal);pos+=w.personal;const sessions=[];batch.forEach(item=>{const s=sessions.find(x=>x.id===item.id);if(s)s.hours++;else sessions.push({...item,hours:1})});return {week:i+1,...w,total:12,sessions,topics:i<2?'공통역량·선수학습':i<9?'전문분야 단계별 설계·실습':'Capstone · 통합검증',lab:i<9?'선택 모듈의 교육용 가상 실습 수행':'통합 사업기획·검증·보고',deliverable:i<9?'실습 증거 및 학습 노트':'Capstone 검증 산출물'}});
 return {weights,track_hours:hours,core:18,personal:90,capstone:28,assessment:8,total:144,weeks,source:'AUTOMATED_DRAFT_REVIEW_PREREQUISITES'};}
function changeWeight(t,v){v=Math.max(0,Math.min(100,Math.round(Number(v)||0)));const others=TRACKS.filter(x=>x!==t),n=100-v,old=state.weights[others[0]]+state.weights[others[1]];const first=old?Math.round(n*state.weights[others[0]]/old):Math.floor(n/2);state.weights[t]=v;state.weights[others[0]]=first;state.weights[others[1]]=n-first;save();renderSchedule();renderHome();cue('tap');}
function currentWeek(){return Math.max(1,Math.min(12,Number(state.currentWeek)||1));}
function fmtCourseList(sessions){if(!sessions?.length)return '공통 역량 · Capstone · 평가 중심';return sessions.map(s=>`${s.id} ${s.hours}h`).join(' · ');}
function renderHome(){const done=counts(),xp=totalXP(),p=plan(),rank=level(),w=p.weeks[currentWeek()-1],day=new Date();$('today-date').textContent=Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric'}).format(day);
 $('home-stats').innerHTML=`<div class="stat-card"><div class="stat-main">${done}<small style="font-size:.68rem;font-weight:600;color:var(--muted)"> / 252</small></div><div class="stat-sub">자가 체크한 학습 모듈</div></div><div class="stat-card"><div class="stat-main">${xp.toLocaleString()} <small style="font-size:.65rem">XP</small></div><div class="stat-sub">학습 시연 · L${rank.lvl}</div></div><div class="stat-card"><div class="stat-main">144<small style="font-size:.68rem">h</small></div><div class="stat-sub">12주 교육 제안</div></div>`;
 $('home-week').innerHTML=`<div class="mission-card"><span class="tag tag-aqua">CURRENT MISSION · WEEK ${pad(w.week)}</span><h3 style="font-size:1.25rem;margin:15px 0 7px">${esc(WEEK_TITLES[w.week-1])}</h3><p>${esc(w.lab?.slice(0,115)||'선수지식 학습과 설계·실습을 수행합니다.')}</p><button class="btn btn-primary" data-action="open-current-week" type="button">주차별 과제 확인 ↗</button></div><div class="mission-side"><div><span class="eyebrow">MISSION PROGRESS</span><p style="margin:10px 0 0;font-size:.79rem">${esc(w.deliverable||'교육용 실습 및 평가 증거 확보')}</p></div><div class="ring" style="--pct:${Math.round(done/252*100)}%"><span>${Math.round(done/252*100)}%</span></div></div>`;
 $('home-tracks').innerHTML=TRACKS.map(t=>`<div class="track-card" data-track="${t}"><div class="track-top"><span class="track-icon">${TRACK[t].icon}</span><h3>${TRACK[t].name}</h3></div><div class="track-value">${p.track_hours[t]}<small>시간</small></div><div class="track-sub">전문학습 ${p.weights[t]}% 선택</div></div>`).join('');}
function renderSchedule(){const p=plan();$('weight-controls').innerHTML=TRACKS.map(t=>`<div class="weight-row" data-track="${t}"><label for="weight-${t}">${TRACK[t].ko}</label><input type="range" id="weight-${t}" min="0" max="100" value="${p.weights[t]}" data-track-weight="${t}" aria-label="${TRACK[t].name} 선택 비율"><output for="weight-${t}">${p.weights[t]}%</output></div>`).join('');$('mix-bar').innerHTML=TRACKS.map(t=>`<i class="${t}" style="width:${p.weights[t]}%"></i>`).join('');$('mix-summary').innerHTML=TRACKS.map(t=>`<span><strong style="color:${TRACK[t].color}">${p.track_hours[t]}h</strong> · ${TRACK[t].ko}</span>`).join('');
 $('weeks-list').innerHTML=p.weeks.map(w=>{const open=openedWeek===w.week;const kind=w.week<=2?'기초·진단':w.week>=10?'Capstone':'전문 실습';return `<article class="week-card ${open?'active':''}"><button class="week-trigger" type="button" data-action="toggle-week" data-week="${w.week}" aria-expanded="${open}"><span class="week-number">${pad(w.week)}</span><span class="week-title"><strong>${kind} · ${esc(WEEK_TITLES[w.week-1])}</strong><small>공통 ${w.common}h · 전문 ${w.personal}h · 프로젝트 ${w.capstone}h · 평가 ${w.assessment}h</small></span><span class="chevron" aria-hidden="true">›</span></button>${open?`<div class="week-details"><div class="meta-box"><strong>이번 주 전문학습</strong><span>${w.personal}시간</span></div><div class="week-units">${w.sessions.length?w.sessions.map(s=>`<span class="unit ${s.track}">${esc(s.id)} · ${s.hours}h</span>`).join(''):'<span class="unit">공통 교육·Capstone·평가</span>'}</div><div class="week-tasks"><div class="task-box"><b>실습 미션</b><p>${esc(w.lab)}</p></div><div class="task-box"><b>제출 증거</b><p>${esc(w.deliverable)}</p></div></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"><button class="btn btn-soft" data-action="set-current-week" data-week="${w.week}" type="button">이 주차를 현재 미션으로</button>${w.sessions.length?`<button class="btn btn-ghost" data-action="open-course" data-course="${w.sessions[0].id}" type="button">첫 과목 열기 ↗</button>`:''}</div></div>`:''}</article>`}).join('');}
function renderCourses(){const filtered=D.courses.filter(c=>(courseFilter==='ALL'||c.track===courseFilter)&&(!bookmarkOnly||state.bookmarks.includes(c.id))&&(!query||[c.id,c.name_ko,c.insight,...c.modules.map(m=>m.title)].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase())));$('course-filters').innerHTML=[['ALL','전체 42개'],['AT','AI 기술 14개'],['DF','데이터 융합 14개'],['SP','전략·기획 14개']].map(([t,n])=>`<button type="button" class="micro-btn" data-action="course-filter" data-filter="${t}" aria-pressed="${courseFilter===t}">${n}</button>`).join('');$('course-count').textContent=`${filtered.length}개 과목`;$('bookmark-filter').setAttribute('aria-pressed',String(bookmarkOnly));$('bookmark-filter').classList.toggle('selected',bookmarkOnly);
 $('courses-grid').innerHTML=filtered.length?filtered.map(c=>{const done=c.modules.filter(m=>state.lessonEvidence?.[c.id+':'+m.sequence]?.passed).length;const available=(window.ACADEMY_LESSONS?.[c.id]||[]).length;return `<article class="course-card" data-track="${c.track}"><div class="course-header"><span class="course-code">${c.id} / ${TRACK[c.track].name}</span><button type="button" class="course-bookmark ${state.bookmarks.includes(c.id)?'saved':''}" data-action="bookmark" data-course="${c.id}" aria-label="${esc(c.name_ko)} 관심 과목 ${state.bookmarks.includes(c.id)?'해제':'저장'}">${state.bookmarks.includes(c.id)?'★':'☆'}</button></div><h3>${esc(c.name_ko)}</h3><p>${esc(c.insight)}</p><div class="course-footer"><small>${done}/6 학습 확인 · ${available}/6 강의</small><button class="open-link" type="button" data-action="open-course" data-course="${c.id}">학습 열기 ↗</button></div></article>`}).join(''):'<div class="empty-state">조건에 맞는 과목이 없습니다. 검색어와 필터를 다시 확인하세요.</div>';}
function showCourse(id){const c=courseById(id);if(!c)return;openedCourse=id;renderCourseDetail();const d=$('course-dialog');if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');cue('advance');haptic();}
function renderCourseDetail(){if(openedModule!==null){renderModuleLesson();return;}const c=courseById(openedCourse);if(!c)return;const note=state.notes[c.id]||'',done=state.modules[c.id]||[];const p=D.questions.filter(q=>q.course_id===c.id);const question=p[0];$('course-detail').innerHTML=`<div class="dialog-top"><div><span class="eyebrow">${c.id} / ${TRACK[c.track].name}</span><h2>${esc(c.name_ko)}</h2><span class="tiny-meta">${c.modules.filter(m=>state.lessonEvidence?.[c.id+':'+m.sequence]?.passed).length}/6 학습 근거 확인 · ${esc(c.status)}</span></div><button type="button" data-action="close-course" class="icon-btn" aria-label="과목 상세 닫기">✕</button></div><div class="lesson-lead"><span class="eyebrow">CORE INSIGHT</span><p style="color:#e3f5f8;font-size:.9rem">${esc(c.insight)}</p></div><div class="lesson-pitfall"><strong>주의할 오개념</strong><div>${esc(c.misconception)}</div></div><div class="section-heading"><div><span class="eyebrow">6 CORE MODULES</span><h2>이수할 모듈</h2></div></div><div class="module-list">${c.modules.map(m=>`<div class="module-item"><button type="button" class="module-open" data-action="open-module" data-course="${c.id}" data-seq="${m.sequence}"><span class="module-num">${pad(m.sequence)}</span><span class="module-copy"><strong>${esc(m.title)}</strong><small>${esc(m.objective)}</small></span><span class="module-state">${state.lessonEvidence?.[c.id+':'+m.sequence]?.passed?'✓ 학습 확인':done.includes(m.sequence)?'이전 체크 기록':'내용 보기 →'}</span></button></div>`).join('')}</div><div class="section-heading"><div><span class="eyebrow">LEARNING EVIDENCE</span><h2>나의 실습·검증 기록</h2></div></div><p style="font-size:.8rem"><strong style="color:var(--ink)">실습:</strong> ${esc(c.lab)}<br><strong style="color:var(--ink)">제출물:</strong> ${esc(c.deliverable)}<br><strong style="color:var(--ink)">선수과목:</strong> ${c.prerequisites?.length?c.prerequisites.join(' · '):'없음'}</p><div class="reference-note"><b>참고 기준</b><p>${c.references?.length?c.references.map(url=>esc(url)).join('<br>'):'출처 추가 검토 필요'}</p><span class="microcopy">오프라인 앱에서 원문 링크는 열리지 않습니다. 과목별 인용의 적합성과 최신성은 전문가 검토 전입니다.</span></div><label for="course-reflection" class="eyebrow">검증 메모 · 본인 학습기록</label><textarea class="reflection-area" id="course-reflection" maxlength="4000" placeholder="핵심 개념, 실습방법, 실패 조건, 확인한 근거와 미검증 부분을 기록하세요. (30자 이상 작성 후 자체 완료 체크 가능)">${esc(note)}</textarea><p class="microcopy" id="note-feedback">${note.length} / 30자 최소 · 이 기기에만 저장</p><div class="lesson-question"><span class="eyebrow">PRACTICE / 5 REFLECTIONS</span><h3 style="margin-top:8px">근거 기반 서술형 질문</h3>${p.map((item,i)=>`<details class="reflection-question"><summary>${i+1}. ${esc(item.question)}</summary><div class="rubric">${esc(item.answer_key)}<br><br>평가: 개념 정확성 · 근거 · 제약 및 보안 · 설명 명확성</div></details>`).join('')}<p class="microcopy">총 210문항의 자기 점검 문제은행 중 이 과목의 5문항입니다. 정식 채점에는 교관 검토가 필요합니다.</p></div><div style="display:flex;gap:9px;flex-wrap:wrap"><button type="button" class="btn btn-primary" data-action="save-reflection" data-course="${c.id}">학습 메모 저장</button><button class="btn btn-ghost" data-action="close-course" type="button">목록으로</button></div>`;}
function moduleKey(){return openedCourse+':'+openedModule;}
function courseLesson(){return window.ACADEMY_LESSONS?.[openedCourse]?.[openedModule-1]||null;}
function renderModuleLesson(){
 const c=courseById(openedCourse);if(!c||openedModule===null)return;
 const m=c.modules.find(x=>x.sequence===openedModule);if(!m)return;
 const lesson=courseLesson(),key=moduleKey(),e=state.lessonEvidence?.[key]||{},qs=lesson?.questions||[];
 const legacy=(state.modules[c.id]||[]).includes(openedModule)&&!e.passed;
 const intro='<div class="dialog-top"><div><span class="eyebrow">'+esc(c.id)+' / MODULE '+pad(openedModule)+'</span><h2>'+esc(m.title)+'</h2><span class="tiny-meta">'+(e.passed?'✓ 학습 근거 확인':legacy?'이전 버전 체크 기록 · 학습 검증 전':'학습 중')+'</span></div><button type="button" class="icon-btn" data-action="back-to-course" aria-label="과목으로 돌아가기">↩</button></div>';
 let html=intro+'<p class="module-objective">'+esc(m.objective)+'</p>';
 if(!lesson){
  html+='<div class="honesty-notice"><span>!</span><p>이 모듈의 독립 강의·확인문항은 아직 작성·검수되지 않았습니다. 현재는 과목 개요와 실습 방향만 제공합니다. 내용 없이 완료 처리하지 않습니다.</p></div>';
  html+='<section class="lesson-chapter"><h3>이 과목의 핵심 개념</h3><p>'+esc(c.insight)+'</p><h3>주의할 오개념</h3><p>'+esc(c.misconception)+'</p><h3>예비 실습 방향</h3><p>'+esc(c.lab)+'</p><p class="microcopy">자료 상태: 교육용 개요 초안 · 전문 학습 완료 미지원</p></section>';
 }else{
  html+='<div class="lesson-progress"><span>1. 개념 학습</span><span>2. 사례·실습</span><span>3. 이해도 확인</span></div>';
  for(const s of lesson.sections)html+='<section class="lesson-chapter"><h3>'+esc(s[0])+'</h3><p>'+esc(s[1])+'</p></section>';
  html+='<section class="lesson-example"><h3>🧩 '+esc(lesson.example.heading)+'</h3><ol>'+lesson.example.lines.map(line=>'<li>'+esc(line)+'</li>').join('')+'</ol></section>';
  html+='<section class="lesson-chapter"><h3>직접 해보기</h3><p>'+esc(lesson.task)+'</p><label for="module-practice">내 실습 답변 (30자 이상)</label><textarea id="module-practice" class="reflection-area" maxlength="3000" placeholder="개념, 적용 방법, 주의사항을 직접 작성하세요.">'+esc(e.reflection||'')+'</textarea></section>';
  html+='<section class="lesson-chapter lesson-quiz"><h3>이해도 확인 · 2문항</h3>'+qs.map((q,qi)=>'<div class="module-question"><p><strong>'+(qi+1)+'. '+esc(q.q)+'</strong></p><div class="module-options">'+q.choices.map((ch,oi)=>'<button type="button" class="module-option '+(moduleChoices[qi]===oi?'selected':'')+'" data-action="module-choice" data-q="'+qi+'" data-option="'+oi+'" aria-pressed="'+(moduleChoices[qi]===oi)+'">'+String.fromCharCode(65+oi)+'. '+esc(ch)+'</button>').join('')+'</div>'+(moduleChoices[qi]===undefined?'':'<p class="module-explain '+(moduleChoices[qi]===q.a?'answer-ok':'answer-review')+'">'+(moduleChoices[qi]===q.a?'✓ 정답입니다. ':'다시 확인해 보세요. ')+esc(q.why)+'</p>')+'</div>').join('')+'</section>';
  html+='<div class="lesson-actions"><button class="btn btn-primary" type="button" data-action="module-complete">'+(e.passed?'다시 검증하고 저장':'정답 확인 후 학습 기록 저장')+'</button><button class="btn btn-ghost" data-action="back-to-course" type="button">과목 목록으로</button></div>';
  html+='<div class="source-line"><strong>검토 상태:</strong> 교육용 강의 원고 · 독립 전문가·보안 승인 전<br><strong>참고자료:</strong> '+esc(lesson.reference_url||'모듈 단위 참고자료 검토 필요')+'<br><small>개별 사실관계의 원문 적합성은 학습자와 교관이 별도 대조해야 합니다.</small></div>';
 html+='<p class="microcopy">두 문항 모두 정답이고 본인 작성 답변이 30자 이상이어야 학습 근거가 저장됩니다. 자동 채점은 기초 이해도 확인용이며 공식 이수가 아닙니다.</p>';
 }
 $('course-detail').innerHTML=html;
}
function openModule(id,seq){
 const c=courseById(id);if(!c||!c.modules.some(m=>m.sequence===seq))return;
 openedCourse=id;openedModule=seq;moduleChoices={};
 renderModuleLesson();
 const f=$('course-dialog')?.querySelector('.modal-frame');if(f)f.scrollTop=0;
 cue('advance');
}
function completeModuleLesson(){
 const lesson=courseLesson();if(!lesson)return;
 const key=moduleKey(),previous=state.lessonEvidence?.[key]||{};
 const reflection=String($('module-practice')?.value||previous.reflection||'').trim();
 if(reflection.length<30){toast('실습 답변을 30자 이상 직접 작성해 주세요.','warning');cue('warning');return;}
 const failed=lesson.questions.map((q,i)=>({q,i})).filter(({q,i})=>moduleChoices[i]!==q.a);
 if(failed.length){toast('이해도 확인: '+failed.map(x=>(x.i+1)+'번').join(', ')+' 문항을 다시 검토해 주세요.','warning');cue('warning');return;}
 if(!state.lessonEvidence||typeof state.lessonEvidence!=='object')state.lessonEvidence={};
 state.lessonEvidence[key]={passed:true,reflection:reflection.slice(0,3000),at:new Date().toISOString(),version:'2.0.2'};
 if(!Array.isArray(state.modules[openedCourse]))state.modules[openedCourse]=[];
 if(!state.modules[openedCourse].includes(openedModule))state.modules[openedCourse].push(openedModule);
 const event=key;if(!state.xpEvents.includes(event))state.xpEvents.push(event);
 save();toast('학습 내용과 실습 답변을 저장했습니다. (교육용 자체 확인)');cue('success');haptic(24);
 openedModule=null;moduleChoices={};renderCourseDetail();renderHome();renderCourses();
}
function renderDiagnostic(){const questions=D.diagnostic.filter(x=>x.track===diagTrack);$('diag-filters').innerHTML=TRACKS.map(t=>`<button type="button" class="micro-btn" data-action="diag-track" data-track="${t}" aria-pressed="${diagTrack===t}">${TRACK[t].name}</button>`).join('');const body=$('diagnostic-body');if(diagFinished){const correct=questions.filter(q=>diagAnswers[q.id]===q.correct).length;const attempted=questions.filter(q=>diagAnswers[q.id]).length;const band=correct>=8?'심화 진입 검토':correct>=5?'기초학습 후 실습 추천':'기초 보충 권고';body.innerHTML=`<div class="diag-result"><span class="eyebrow">DIAGNOSTIC RESULT</span><div class="score-large">${correct}<small style="font-size:1.2rem;color:var(--muted)"> / 10</small></div><h2>${band}</h2><p>응답 ${attempted}개 · 자동 채점은 학습용이며 공적 평가가 아닙니다.</p><button class="btn btn-soft" data-action="retry-diag">다시 풀기</button><button class="btn btn-ghost" data-action="go" data-target="courses">보완 과목 탐색</button></div><div style="margin-top:20px"><h3>문항별 해설</h3>${questions.map((q,i)=>{const ok=diagAnswers[q.id]===q.correct;return `<div class="result-review"><span class="result-icon ${ok?'':'wrong'}">${ok?'✓':'•'}</span><strong>${i+1}. ${esc(q.question)}</strong><p>내 답: ${esc(diagAnswers[q.id]||'미응답')} · 정답: ${esc(q.correct)}</p><p>${esc(q.rationale)}</p></div>`}).join('')}</div>`;return;}
 const q=questions[diagIndex];body.innerHTML=`<div class="diag-top"><span>QUESTION ${pad(diagIndex+1)} / 10</span><span>${Math.round((diagIndex+1)/10*100)}% 진행</span></div><div class="progress-track"><div class="progress-fill" style="width:${Math.round(diagIndex/10*100)}%"></div></div><h2 class="question-title">${esc(q.question)}</h2><div class="option-list" role="group" aria-label="선택지">${Object.entries(q.options).map(([k,v])=>`<button type="button" class="option ${diagAnswers[q.id]===k?'selected':''}" data-action="answer" data-answer="${k}" aria-pressed="${diagAnswers[q.id]===k}"><b>${k}</b><span>${esc(v)}</span></button>`).join('')}</div><div class="question-controls"><button type="button" class="btn btn-ghost" data-action="diag-back" ${diagIndex===0?'disabled':''}>← 이전</button><button type="button" class="btn btn-primary" data-action="diag-next">${diagIndex===9?'결과 확인':'다음 문항 →'}</button></div><p class="microcopy">모든 문항 응답 후 정답·해설을 확인할 수 있습니다.</p>`;}
function renderCapstone(){$('capstone-count').textContent=`${state.capstone.length} / ${CAPSTONE.length}`;$('capstone-fill').style.width=`${100*state.capstone.length/CAPSTONE.length}%`;$('capstone-list').innerHTML=CAPSTONE.map((v,i)=>`<label class="capstone-entry"><input type="checkbox" data-capstone="${i}" ${state.capstone.includes(i)?'checked':''}><span><strong>${pad(i+1)}. ${esc(v)}</strong><small style="display:block">${i<4?'문제·요구사항 검증':i<10?'기술·데이터·경제성 설계':'검증·이행·성과 증거'}</small></span></label>`).join('');}
function settingsHTML(){const s=state.settings;return `<div class="setting-row"><div><strong>학습 피드백 효과음</strong><p>직접 합성한 짧은 효과음 · 기본 꺼짐</p></div><input type="checkbox" id="setting-sound" data-setting="sound" ${s.sound?'checked':''} aria-label="효과음 켜기"></div><div class="setting-row"><div><strong>효과음 크기</strong><p>조용한 장소에서도 사용 가능한 볼륨</p></div><input type="range" min="0" max="100" value="${s.volume}" data-setting="volume" aria-label="효과음 크기"></div><div class="setting-row"><div><strong>촉각 피드백</strong><p>지원 기기의 진동 · 기본 꺼짐</p></div><input type="checkbox" data-setting="haptics" ${s.haptics?'checked':''} aria-label="진동 켜기"></div><div class="setting-row"><div><strong>고대비 화면</strong><p>밝고 선명한 색 대비</p></div><input type="checkbox" data-setting="contrast" ${s.contrast?'checked':''}></div><div class="setting-row"><div><strong>애니메이션 최소화</strong><p>움직임에 민감한 학습자 지원</p></div><input type="checkbox" data-setting="reducedMotion" ${s.reducedMotion?'checked':''}></div><div class="setting-row"><div><strong>화면 글자 크기</strong><p>90~120% 단계 조정</p></div><select data-setting="textSize">${[90,100,110,120].map(n=>`<option value="${n}" ${s.textSize==n?'selected':''}>${n}%</option>`).join('')}</select></div><div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:17px"><button type="button" class="btn btn-soft" data-action="test-sound">소리 미리듣기</button><button type="button" class="btn btn-ghost" data-action="export-progress">학습 기록 JSON 저장</button><button type="button" class="btn btn-soft" data-action="import-progress">학습 기록 복원</button><button type="button" class="btn btn-danger" data-action="reset-progress">학습기록 삭제</button></div><p class="microcopy">계정 로그인·서버 동기화가 없으며 앱 데이터 삭제 시 학습 기록도 지워집니다. JSON 백업을 권장합니다.</p>`;}
function renderProfile(){const rank=level(),next=LEVELS.find(([v])=>v>totalXP())||[6360,'Max'];const before=rank.min;const pct=Math.round(Math.min(100,(totalXP()-before)/(next[0]-before||1)*100));$('profile-rank').innerHTML=`<div class="rank-top"><div><span class="eyebrow">DEMONSTRATION PROGRESS</span><h2>L${rank.lvl} · ${rank.name}</h2><p>학습 근거 확인 ${counts()} / 252개 기초 강의 · 시연 XP ${totalXP().toLocaleString()}</p></div><div class="rank-emblem">${rank.lvl}</div></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><p class="microcopy">XP는 자체 학습관리용 점수이며 공식 전문성 평가와 연결되지 않습니다.</p>`;$('settings-surface').innerHTML=`<div class="dialog-top"><div><span class="eyebrow">PERSONAL CONTROLS</span><h2>학습 환경</h2></div><button class="btn btn-soft" data-action="open-settings">변경</button></div><p>효과음 ${state.settings.sound?'켜짐':'꺼짐'} · 진동 ${state.settings.haptics?'켜짐':'꺼짐'} · 글자 ${state.settings.textSize}%</p><button class="btn btn-ghost" data-action="export-progress">내 학습 기록 백업</button> <button class="btn btn-soft" data-action="import-progress">JSON 기록 복원</button>`;}
function renderCurrent(){if(view==='home')renderHome();if(view==='schedule')renderSchedule();if(view==='courses')renderCourses();if(view==='diagnostic')renderDiagnostic();if(view==='capstone')renderCapstone();if(view==='profile')renderProfile();}
function exportJSON(filename,obj){const content=JSON.stringify(obj,null,2);if(window.ArmyNative&&typeof window.ArmyNative.saveJson==='function'){window.ArmyNative.saveJson(filename,content);toast('저장할 위치를 선택하세요.');return;}try{const blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),2500);toast('JSON 파일을 내보냈습니다.');}catch{toast('내보내기를 지원하지 않는 환경입니다.','warning');}}
function sanitizeBackup(input){
 if(!input||typeof input!=='object'||input.version!==1||!input.data||typeof input.data!=='object')throw Error('지원하지 않는 백업 형식입니다.');
 const b=input.data;
 const clean=structuredClone(defaults);
 const ids=new Set(D.courses.map(c=>c.id));
 const weights=b.weights;
 if(weights&&TRACKS.every(t=>Number.isInteger(weights[t])&&weights[t]>=0&&weights[t]<=100)&&TRACKS.reduce((n,t)=>n+weights[t],0)===100)clean.weights=Object.fromEntries(TRACKS.map(t=>[t,weights[t]]));
 if(Number.isInteger(b.currentWeek)&&b.currentWeek>=1&&b.currentWeek<=12)clean.currentWeek=b.currentWeek;
 if(Array.isArray(b.bookmarks))clean.bookmarks=listUnique(b.bookmarks.filter(id=>typeof id==='string'&&ids.has(id)));
 if(b.notes&&typeof b.notes==='object'&&!Array.isArray(b.notes))for(const [id,value] of Object.entries(b.notes))if(ids.has(id)&&typeof value==='string')clean.notes[id]=sanitize(value);
 if(b.modules&&typeof b.modules==='object'&&!Array.isArray(b.modules))for(const [id,items] of Object.entries(b.modules))if(ids.has(id)&&Array.isArray(items))clean.modules[id]=listUnique(items.filter(n=>Number.isInteger(n)&&n>=1&&n<=6)).sort((a,b)=>a-b);
 if(b.lessonEvidence&&typeof b.lessonEvidence==='object'&&!Array.isArray(b.lessonEvidence)){
  for(const [k,v] of Object.entries(b.lessonEvidence)){
   const match=/^(AT|DF|SP)-\d{3}:[1-6]$/.test(k)&&ids.has(k.split(':')[0]);
   if(match&&v&&typeof v==='object'&&typeof v.reflection==='string'){
    const reflection=v.reflection.slice(0,3000);
    const passed=v.passed===true&&reflection.trim().length>=30;
    clean.lessonEvidence[k]={passed,reflection,at:typeof v.at==='string'?v.at.slice(0,40):'',version:'2.0.3'};
   }
  }
 }
 if(Array.isArray(b.xpEvents))clean.xpEvents=listUnique(b.xpEvents.filter(v=>typeof v==='string'&&/^(AT|DF|SP)-\d{3}:[1-6]$/.test(v)&&ids.has(v.split(':')[0])));
 if(Array.isArray(b.capstone))clean.capstone=listUnique(b.capstone.filter(n=>Number.isInteger(n)&&n>=0&&n<CAPSTONE.length));
 if(Array.isArray(b.diagRuns))clean.diagRuns=b.diagRuns.slice(-30).filter(r=>r&&TRACKS.includes(r.track)&&Number.isInteger(r.correct)&&r.correct>=0&&r.correct<=10&&r.total===10).map(r=>({track:r.track,correct:r.correct,total:10,time:typeof r.time==='string'?r.time.slice(0,40):'',status:'SELF_TEST_ONLY'}));
 if(b.settings&&typeof b.settings==='object'){
  for(const k of ['sound','haptics','contrast','reducedMotion'])if(typeof b.settings[k]==='boolean')clean.settings[k]=b.settings[k];
  if(Number.isInteger(b.settings.volume))clean.settings.volume=Math.max(0,Math.min(100,b.settings.volume));
  if([90,100,110,120].includes(b.settings.textSize))clean.settings.textSize=b.settings.textSize;
 }
 return clean;
}
function importAcademyBackup(raw){
 try{
  if(typeof raw!=='string'||raw.length>2000000)throw Error('파일 크기가 허용 범위를 초과했습니다.');
  const data=sanitizeBackup(JSON.parse(raw));
  if(!confirm('현재 기기의 학습기록을 선택한 백업 내용으로 교체할까요? 기존 기록은 덮어써집니다.'))return false;
  localStorage.setItem(KEY,JSON.stringify(data));
  location.reload();return true;
 }catch(e){toast('복원 실패: '+String(e.message||e).slice(0,90),'warning');return false;}
}
window.importAcademyBackup=importAcademyBackup;
async function selectBackup(){
 if(window.ArmyNative&&typeof window.ArmyNative.importJson==='function'){window.ArmyNative.importJson();return;}
 const chooser=document.createElement('input');chooser.type='file';chooser.accept='.json,application/json';chooser.style.display='none';
 document.body.appendChild(chooser);
 chooser.addEventListener('change',async()=>{try{const file=chooser.files?.[0];if(!file)return;if(file.size>2000000)throw Error('파일이 2MB보다 큽니다.');importAcademyBackup(await file.text());}catch(e){toast('복원 실패: '+String(e.message||e),'warning');}finally{chooser.remove();}});
 chooser.click();
}
function openSettings(){applySettings();$('settings-dialog-content').innerHTML=settingsHTML();$('settings-dialog').showModal();}
function updateSetting(key,val){if(key==='volume'||key==='textSize')val=Number(val);state.settings[key]=val;save();applySettings();if(key==='sound'&&val)cue('success');if(view==='profile')renderProfile();}
function validateState(){if(!state.weights||!TRACKS.every(t=>Number.isInteger(state.weights[t])&&state.weights[t]>=0&&state.weights[t]<=100)||TRACKS.reduce((sum,t)=>sum+state.weights[t],0)!==100)state.weights={...defaults.weights};state.currentWeek=currentWeek();if(!Array.isArray(state.bookmarks))state.bookmarks=[];if(!Array.isArray(state.xpEvents))state.xpEvents=[];if(!Array.isArray(state.capstone))state.capstone=[];if(!state.modules||typeof state.modules!=='object')state.modules={};if(!state.notes||typeof state.notes!=='object')state.notes={};if(!Array.isArray(state.diagRuns))state.diagRuns=[];if(!state.lessonEvidence||typeof state.lessonEvidence!=='object'||Array.isArray(state.lessonEvidence))state.lessonEvidence={};state.bookmarks=state.bookmarks.filter(x=>courseById(x));state.xpEvents=listUnique(state.xpEvents.filter(x=>typeof x==='string'&&/^(AT|DF|SP)-\d{3}:[1-6]$/.test(x)));state.capstone=listUnique(state.capstone.filter(i=>Number.isInteger(i)&&i>=0&&i<14));for(const [id,items] of Object.entries(state.modules)){if(!courseById(id)||!Array.isArray(items)){delete state.modules[id];continue;}state.modules[id]=listUnique(items.filter(n=>Number.isInteger(n)&&n>=1&&n<=6));}for(const [id,v] of Object.entries(state.notes)){if(!courseById(id)||typeof v!=='string')delete state.notes[id];else state.notes[id]=sanitize(v);}applySettings();}
validateState();
for(const button of document.querySelectorAll('[data-view-target]'))button.addEventListener('click',()=>go(button.dataset.viewTarget));
$('settings-open').addEventListener('click',openSettings);
$('course-search').addEventListener('input',e=>{query=e.target.value.slice(0,80);renderCourses()});
document.body.addEventListener('input',e=>{const t=e.target;if(t.dataset.trackWeight)changeWeight(t.dataset.trackWeight,t.value);if(t.id==='course-reflection'&&openedCourse){state.notes[openedCourse]=sanitize(t.value);save();const f=$('note-feedback');if(f)f.textContent=`${state.notes[openedCourse].length} / 30자 최소 · 자동 저장됨`;}if(t.id==='module-practice'&&openedModule!==null){const k=moduleKey();if(!state.lessonEvidence||typeof state.lessonEvidence!=='object')state.lessonEvidence={};const e=state.lessonEvidence[k]||{};state.lessonEvidence[k]={...e,reflection:String(t.value||'').slice(0,3000)};save();}if(t.dataset.setting){updateSetting(t.dataset.setting,t.type==='checkbox'?t.checked:t.value);}});
document.body.addEventListener('change',e=>{const t=e.target;if(t.dataset.capstone!==undefined){const i=Number(t.dataset.capstone);if(t.checked&&!state.capstone.includes(i))state.capstone.push(i);if(!t.checked)state.capstone=state.capstone.filter(x=>x!==i);save();renderCapstone();cue(t.checked?'success':'tap');haptic();}if(t.dataset.setting)updateSetting(t.dataset.setting,t.type==='checkbox'?t.checked:t.value);});
document.body.addEventListener('click',e=>{const t=e.target.closest('[data-action]');if(!t)return;const act=t.dataset.action;const target=t.dataset.target;
if(act==='go')go(target);
if(act==='open-current-week'){openedWeek=currentWeek();go('schedule')}
if(act==='toggle-week'){const n=Number(t.dataset.week);openedWeek=openedWeek===n?0:n;renderSchedule();cue('tap')}
if(act==='set-current-week'){state.currentWeek=Number(t.dataset.week);save();renderSchedule();toast(`${state.currentWeek}주차를 현재 미션으로 설정했습니다.`);cue('success')}
if(act==='preset'){const m={balanced:[34,33,33],technology:[60,25,15],fusion:[25,60,15],strategy:[20,20,60]};const a=m[t.dataset.preset];if(a){TRACKS.forEach((key,i)=>state.weights[key]=a[i]);save();renderSchedule();renderHome();cue('advance')}}
if(act==='course-filter'){courseFilter=t.dataset.filter;renderCourses();cue('tap')}
if(act==='bookmarks-only'){bookmarkOnly=!bookmarkOnly;renderCourses();cue('tap')}
if(act==='bookmark'){const id=t.dataset.course;state.bookmarks=state.bookmarks.includes(id)?state.bookmarks.filter(x=>x!==id):[...state.bookmarks,id];save();renderCourses();cue('success');}
if(act==='open-course')showCourse(t.dataset.course);
if(act==='open-module')openModule(t.dataset.course,Number(t.dataset.seq));
if(act==='back-to-course'){openedModule=null;moduleChoices={};renderCourseDetail();const f=$('course-dialog')?.querySelector('.modal-frame');if(f)f.scrollTop=0;}
if(act==='module-choice'){moduleChoices[Number(t.dataset.q)]=Number(t.dataset.option);const f=$('course-dialog')?.querySelector('.modal-frame');const pos=f?.scrollTop||0;renderModuleLesson();if(f)f.scrollTop=pos;}
if(act==='module-complete')completeModuleLesson();
if(act==='close-course'){$('course-dialog').close();openedCourse=null;openedModule=null;renderCourses();renderHome();}
if(act==='save-reflection'&&openedCourse){state.notes[openedCourse]=sanitize($('course-reflection').value);save();toast('학습 기록을 기기에 저장했습니다.');cue('success');}
if(act==='diag-track'){diagTrack=t.dataset.track;diagIndex=0;diagFinished=false;diagAnswers={};renderDiagnostic();cue('tap')}
if(act==='answer'){const q=D.diagnostic.filter(q=>q.track===diagTrack)[diagIndex];diagAnswers[q.id]=t.dataset.answer;renderDiagnostic();cue('tap');}
if(act==='diag-back'){diagIndex=Math.max(0,diagIndex-1);renderDiagnostic();cue('tap')}
if(act==='diag-next'){const q=D.diagnostic.filter(q=>q.track===diagTrack)[diagIndex];if(!diagAnswers[q.id]){toast('응답을 선택한 뒤 진행하세요.','warning');cue('warning');return}if(diagIndex<9){diagIndex++;renderDiagnostic();cue('advance')}else{diagFinished=true;const questions=D.diagnostic.filter(q=>q.track===diagTrack);const correct=questions.filter(q=>diagAnswers[q.id]===q.correct).length;state.diagRuns.push({track:diagTrack,correct,total:10,time:new Date().toISOString(),status:'SELF_TEST_ONLY'});state.diagRuns=state.diagRuns.slice(-30);save();renderDiagnostic();cue(correct>=8?'level':'success');toast('진단을 완료했습니다. 정답과 해설을 확인하세요.')}}
if(act==='retry-diag'){diagIndex=0;diagAnswers={};diagFinished=false;renderDiagnostic();cue('tap')}
if(act==='open-settings')openSettings();
if(act==='close-settings')$('settings-dialog').close();
if(act==='test-sound'){const old=state.settings.sound;state.settings.sound=true;cue('level');state.settings.sound=old;}
if(act==='export-plan')exportJSON('academy_personal_12week_plan.json',{...plan(),status:'EDUCATIONAL_PLAN_NOT_OFFICIAL'});
if(act==='export-capstone')exportJSON('academy_capstone_selfcheck.json',{status:'SELF_CHECK_NOT_OFFICIAL',completed:state.capstone.map(i=>CAPSTONE[i]),total:CAPSTONE.length});
if(act==='export-progress')exportJSON('academy_private_learning_backup.json',{version:1,exportedAt:new Date().toISOString(),status:'LOCAL_SELF_REPORTED_NOT_OFFICIAL',data:state});
if(act==='import-progress')selectBackup();
if(act==='reset-progress'){if(confirm('로컬 학습 기록·메모·진도·XP를 모두 삭제하시겠습니까? 되돌릴 수 없습니다.')){localStorage.removeItem(KEY);location.reload();}}
});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('course-dialog').open)$('course-dialog').close();if($('settings-dialog').open)$('settings-dialog').close();}});
$('course-dialog').addEventListener('close',()=>{openedCourse=null;openedModule=null;renderCourses();renderHome()});
$('settings-dialog').addEventListener('close',()=>{if(view==='profile')renderProfile();});
// Android system Back: close overlays first, then return to the learning home screen.
window.handleAndroidBack=()=>{
 if($('course-dialog').open){if(openedModule!==null){openedModule=null;moduleChoices={};renderCourseDetail();}else $('course-dialog').close();return true;}
 if($('settings-dialog').open){$('settings-dialog').close();return true;}
 if(view!=='home'){go('home');return true;}
 return false;
};
// Test-only introspection is read-only and contains no external calls.
window.academyQA={plan,trackHours:intTrackHours,courseCount:D.courses.length,diagnosticCount:D.diagnostic.length,questionCount:D.questions.length,version:D.version};
go('home');
})();