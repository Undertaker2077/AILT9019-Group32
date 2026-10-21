'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hkDateFormatter = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Hong_Kong',year:'numeric',month:'2-digit',day:'2-digit'});
function hongKongDate(now=new Date()){
 const parts=Object.fromEntries(hkDateFormatter.formatToParts(now).map(p=>[p.type,p.value]));
 return `${parts.year}-${parts.month}-${parts.day}`;
}
let hkDate=hongKongDate();
let [todayY,todayM,todayD] = hkDate.split('-').map(Number);
let year=todayY, month=todayM-1, view='calendar', filter=null, state={courses:[],tasks:[]}, timetable={lessons:[],tutorials:[]}, assessments={courses:[]}, academicCalendar={periods:[]}, toastTimer;
function syncCalendarDate(now=new Date()){
 const nextDate=hongKongDate(now);
 if(nextDate===hkDate)return false;
 // Follow a new month only if the calendar was showing the current month.
 const followingCurrentMonth=year===todayY&&month===todayM-1;
 hkDate=nextDate;[todayY,todayM,todayD]=hkDate.split('-').map(Number);
 if(followingCurrentMonth){year=todayY;month=todayM-1;}
 return true;
}
const keyDate = (y,m,d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const course = id => state.courses.find(c=>c.id===id) || {name:tr('未分类'),color:'#777777'};
const sorted = tasks => [...tasks].sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999') || (a.time||'99:99').localeCompare(b.time||'99:99') || a.id-b.id);
const filtered = () => state.tasks.filter(t=>(filter===null || t.course_id===filter) && ($('#show-done').checked || t.progress<100));
const shortWeight = t => {
 const w=t.weight;
 if(!w) return tr('自定学习任务');
 if(w.includes('无独立') || w.includes('前置')) return tr('无独立占比');
 if(w.includes('未公布') && !w.includes('合计')) return tr('占比待定');
 if(w.includes('rubric')) return tr('占比待定');
 const pct=w.match(/\d+(?:\.\d+)?%/);
 return pct ? tr(w.includes('合计')?'类别合计 {value}':'占比 {value}',{value:pct[0]}) : w;
};
const formatDate = date => new Intl.DateTimeFormat(I18N.locale,{timeZone:'UTC',month:'short',day:'numeric'}).format(new Date(date+'T12:00:00Z'));
const displayDate = task => task.date ? `${formatDate(task.date)}${task.time?' '+task.time:' · '+tr('时间待定')}${task.tentative?' · '+tr('暂定'):''}` : tr('日期待定');
function toast(message){$('#toast').textContent=message;$('#toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.display='none',3000);}
async function api(path,method='GET',data){
 const response=await fetch(path,{method,headers:method==='GET'?{}:{'Content-Type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)})});
 const result=await response.json();if(!response.ok) throw new Error(tr(result.error)||tr('保存失败，请重试'));return result;
}
async function refresh(){
 try{[state,timetable,assessments,academicCalendar]=await Promise.all([api('/api/state'),api('/timetable.json'),api('/assessments.json'),api('/academic-calendar.json')]);$('#load-error').hidden=true;render();}
 catch(e){$('#load-error').hidden=false;$('#load-error').textContent=tr('暂时无法连接本机服务，请重新打开启动文件，再刷新网页。')+e.message;throw e;}
}
function setView(nextView){view=nextView;render();}
function render(){
 syncCalendarDate();
 const all=state.tasks.filter(t=>filter===null||t.course_id===filter), tasks=filtered();
 const soonLimit=new Date(Date.UTC(todayY,todayM-1,todayD+7)).toISOString().slice(0,10);
 $('#total-count').textContent=state.tasks.length;
 $('#undated-count').textContent=state.tasks.filter(t=>!t.date).length;
 $('#stat-total').textContent=all.length;
 $('#stat-done').textContent=all.filter(t=>t.progress===100).length;
 $('#stat-soon').textContent=all.filter(t=>t.progress<100&&t.date>=hkDate&&t.date<soonLimit).length;
 $('#stat-undated').textContent=all.filter(t=>!t.date).length;
 $('#stat-progress').textContent=tr('{value}% 平均任务进度',{value:all.length?Math.round(all.reduce((s,t)=>s+t.progress,0)/all.length):0});
 $('#aside-undated').textContent=all.filter(t=>!t.date&&t.progress<100).length;
 $('#today-label').textContent=new Intl.DateTimeFormat(I18N.locale,{timeZone:'Asia/Hong_Kong',year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(new Date(hkDate+'T00:00:00+08:00'));
 $('#view-title').textContent={calendar:tr('学习日历'),timetable:tr('每周课程表'),tasks:tr('所有任务'),undated:tr('日期待定')}[view];
 $('.workspace').hidden=view==='timetable';$('.stats').hidden=view==='timetable';$('#timetable-panel').hidden=view!=='timetable';
 $('#filter-label').textContent=filter===null?tr('全部课程'):course(filter).name;
 document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 $('#courses').innerHTML=`<button class="course-btn ${filter===null?'active':''}" data-course="all"><span class="swatch" style="--course:var(--accent)"></span>${tr('全部课程')}<b>${state.tasks.length}</b></button>`+state.courses.map(c=>`<button class="course-btn ${filter===c.id?'active':''}" data-course="${c.id}"><span class="swatch" style="--course:${esc(c.color)}"></span>${esc(c.name)}<b>${state.tasks.filter(t=>t.course_id===c.id).length}</b></button>`).join('')+`<button class="course-btn manage-mobile" id="mobile-manage">${tr('＋ 管理课程')}</button>`;
 $('#courses').querySelectorAll('[data-course]').forEach(b=>b.onclick=()=>{filter=b.dataset.course==='all'?null:Number(b.dataset.course);render();});
 $('#mobile-manage').onclick=openCourses;
 $('#month-title').textContent=view==='calendar'?new Intl.DateTimeFormat(I18N.locale,{year:'numeric',month:'long'}).format(new Date(year,month,1)):view==='tasks'?tr('所有任务'):tr('日期待定');
 ['#prev','#next','#today'].forEach(s=>$(s).hidden=view!=='calendar');
 $('#calendar').hidden=view!=='calendar';$('#task-list').hidden=view==='calendar';$('.calendar-footer').hidden=view!=='calendar';$('#academic-note').hidden=view!=='calendar';
 renderCalendar(tasks);
 if(view!=='calendar'&&view!=='timetable') renderList(view==='undated'?tasks.filter(t=>!t.date):tasks);
 if(view==='timetable') renderTimetable();
 const pending=sorted(all.filter(t=>t.progress<100&&t.date));
 $('#agenda-count').textContent=tr('{count} 项已安排',{count:pending.length});
 $('#upcoming').innerHTML=pending.slice(0,6).map(t=>{const c=course(t.course_id);return `<button class="agenda-item" data-task="${t.id}" style="--course:${esc(c.color)}"><div class="agenda-meta"><span class="agenda-course">${esc(c.name)}</span><span>${t.date<hkDate?tr('已过期 · '):''}${esc(formatDate(t.date))}</span></div><div class="agenda-title">${esc(t.title)}</div><div class="agenda-detail"><span>${esc(shortWeight(t))}</span><span>${t.progress}%</span></div><div class="progress-track"><i style="width:${t.progress}%"></i></div></button>`;}).join('')||`<div class="empty">${tr('暂时没有待办截止任务。')}</div>`;
 bindTaskClicks($('#upcoming'));
 renderAssessments();
}
function renderAssessments(){
 let section=$('#assessment-section');
 if(!section){section=document.createElement('section');section.id='assessment-section';}
 section.setAttribute('aria-label',tr('课程评分组成'));
 const anchor=filter===null?$('main > footer'):$('#timetable-panel');anchor.before(section);
 const data=assessments.courses.filter(a=>(filter===null||a.course_id===filter)&&state.courses.some(c=>c.id===a.course_id));
 section.hidden=data.length===0;
 section.classList.toggle('single-course',filter!==null);
 const palette=['#759bb9','#c58b60','#9984bd','#76a18c','#ca8593','#c3ad67','#729dac','#999da8'];
 section.innerHTML=`<div class="assessment-heading"><h2>${tr('评分组成')}</h2><span>${tr('各部分占课程总成绩的比例')}</span></div><div class="assessment-grid">${data.map(a=>{
  const c=course(a.course_id),total=a.parts.reduce((s,p)=>s+p.weight,0);
  const title=/^https:\/\/moodle\.hku\.hk\/course\/view\.php\?id=\d+$/.test(a.moodle_url||'')?`<a class="course-moodle-link" href="${esc(a.moodle_url)}" target="_blank" rel="noopener noreferrer" title="${esc(tr('{course}：在新标签页打开 Moodle',{course:c.name}))}" aria-label="${esc(tr('{course}：在新标签页打开 Moodle',{course:c.name}))}">${esc(c.name)}<span aria-hidden="true">↗</span></a>`:esc(c.name);
  if(total!==100) return `<article class="assessment-card"><h3>${title}</h3><p>${tr('评分比例合计不是100%，请核对资料。')}</p></article>`;
  let angle=-Math.PI/2;
  const slices=a.parts.map((p,i)=>{
   const start=angle;angle+=p.weight/100*Math.PI*2;
   const x1=110+94*Math.cos(start),y1=110+94*Math.sin(start),x2=110+94*Math.cos(angle),y2=110+94*Math.sin(angle);
   const path=`M 110 110 L ${x1.toFixed(3)} ${y1.toFixed(3)} A 94 94 0 ${p.weight>50?1:0} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
   return `<path d="${path}" fill="${palette[i%palette.length]}" class="pie-slice" tabindex="0" role="img" aria-label="${esc(tr(p.name))}：${p.weight}%" data-assessment="${a.course_id}" data-part="${i}"><title>${esc(tr(p.name))}：${p.weight}%</title></path>`;
  }).join('');
  return `<article class="assessment-card" data-assessment-card="${a.course_id}"><div class="assessment-card-heading"><h3><span class="swatch" style="--course:${esc(c.color)}"></span>${title}</h3><span>${a.warning?tr('比例待确认'):tr('合计 100%')}</span></div><div class="assessment-body"><figure><svg viewBox="0 0 220 220" aria-label="${esc(tr('{course}评分组成饼图',{course:c.name}))}">${slices}</svg><figcaption id="pie-caption-${a.course_id}" aria-live="polite">${tr('全部评分部分 · 100%')}</figcaption></figure><ul class="assessment-legend">${a.parts.map((p,i)=>`<li><button type="button" data-assessment="${a.course_id}" data-part="${i}" aria-label="${esc(tr(p.name))}：${p.weight}%"><i style="background:${palette[i%palette.length]}"></i><span>${esc(tr(p.name))}</span><strong>${p.weight}%</strong></button></li>`).join('')}</ul></div>${a.warning?`<p class="assessment-warning">${esc(tr(a.warning))}</p>`:''}<p class="assessment-note">${esc(tr(a.note))}</p><details class="assessment-source"><summary>${tr('查看评分依据')}</summary><p>${esc(tr(a.source))} · ${tr('核对日期')} ${esc(assessments.updated)}</p></details></article>`;
 }).join('')}</div>`;
 section.querySelectorAll('[data-part]').forEach(el=>{
  const activate=()=>{const id=Number(el.dataset.assessment),index=Number(el.dataset.part),a=assessments.courses.find(a=>a.course_id===id),p=a.parts[index];
   section.querySelectorAll(`[data-assessment-card="${id}"] .pie-slice`).forEach(s=>{s.classList.toggle('pie-muted',Number(s.dataset.part)!==index);s.classList.toggle('pie-selected',Number(s.dataset.part)===index);});
   $(`#pie-caption-${id}`).textContent=`${tr(p.name)} · ${p.weight}%`;
  };
  const clear=()=>{const id=Number(el.dataset.assessment);section.querySelectorAll(`[data-assessment-card="${id}"] .pie-slice`).forEach(s=>s.classList.remove('pie-muted','pie-selected'));$(`#pie-caption-${id}`).textContent=tr('全部评分部分 · 100%');};
  el.addEventListener('mouseenter',activate);el.addEventListener('mouseleave',clear);el.addEventListener('focus',activate);el.addEventListener('blur',clear);el.addEventListener('click',activate);
 });
}
function academicPeriods(date){return academicCalendar.periods.filter(p=>date>=p.start&&date<=p.end);}
function academicLabel(p){return `<span class="academic-label ${p.coverage==='afternoon'?'afternoon':''}" tabindex="0" title="${esc(tr(p.label)+' · '+p.start+(p.end!==p.start?' – '+p.end:'')+'\n'+tr(p.detail))}">${esc(tr(p.label))}</span>`;}
function renderCalendar(tasks){
 const first=new Date(year,month,1), offset=first.getDay(), totalDays=new Date(year,month+1,0).getDate(), cells=Math.ceil((offset+totalDays)/7)*7;
 let html='';
 for(let i=0;i<cells;i++){
  const day=new Date(year,month,1-offset+i), date=keyDate(day.getFullYear(),day.getMonth(),day.getDate()), items=sorted(tasks.filter(t=>t.date===date)), periods=academicPeriods(date);
  const partial=periods.length&&periods.every(p=>p.coverage==='afternoon');
  html+=`<div class="day ${items.length||periods.length?'has-events':'empty-day'} ${periods.length?'academic-day':''} ${partial?'academic-afternoon':''} ${day.getMonth()!==month?'outside':''} ${date===hkDate?'is-today':''}"><button class="day-num" data-date="${date}" aria-label="${esc(tr('在{date}新建任务',{date}))}">${day.getDate()}</button>${periods.length?`<div class="academic-labels">${periods.map(academicLabel).join('')}</div>`:''}`;
  html+=items.map(t=>{const c=course(t.course_id);return `<button class="event ${t.tentative?'tentative':''} ${t.progress===100?'done':''}" data-task="${t.id}" style="--course:${esc(c.color)};--task-progress:${t.progress}%" title="${esc(c.name+' · '+t.title+'\n'+displayDate(t)+'\n'+t.weight+'\n'+tr('进度')+' '+t.progress+'%')}"><span class="event-course">${esc(c.name)}</span><span class="event-title">${t.progress===100?'✓ ':''}${esc(t.title)}</span><span class="event-time">${t.tentative?tr('暂定')+' · ':''}${esc(t.time||tr('时间待定'))} · ${t.progress}%</span></button>`;}).join('');
  html+='</div>';
 }
 $('#academic-note').textContent=tr(academicCalendar.note||'');
 $('#calendar-grid').innerHTML=html;bindTaskClicks($('#calendar-grid'));
 $('#calendar-grid').querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>openTask(null,b.dataset.date));
}
function renderList(tasks){
 $('#task-list').innerHTML=sorted(tasks).map(t=>{const c=course(t.course_id);return `<button class="task-row" data-task="${t.id}"><span class="swatch" style="--course:${esc(c.color)}"></span><span class="row-content"><span class="row-title">${t.progress===100?'✓ ':''}${esc(t.title)}</span><span class="row-meta" style="display:block">${esc(c.name)} · ${esc(displayDate(t))} · ${esc(shortWeight(t))}</span></span><span class="row-progress">${t.progress}%</span></button>`;}).join('')||`<div class="empty">${tr('这里暂时没有任务，可以新建一项。')}</div>`;
 bindTaskClicks($('#task-list'));
}
function bindTaskClicks(root){root.querySelectorAll('[data-task]').forEach(b=>b.onclick=()=>openTask(Number(b.dataset.task)));}
function renderTimetable(){
 const days=[tr('周日'),tr('周一'),tr('周二'),tr('周三'),tr('周四'),tr('周五'),tr('周六')];
 const weekdayNumbers=[7,1,2,3,4,5,6]; // Timetable data uses Monday=1 through Sunday=7.
 const lessons=timetable.lessons.filter(l=>filter===null||l.course_id===filter);
 const mins=s=>Number(s.slice(0,2))*60+Number(s.slice(3));
 const hours=Array.from({length:9},(_,i)=>i+10);
 const card=l=>{const c=state.courses.find(c=>c.id===l.course_id);return `<div class="lesson" style="--course:${esc(c?.color||'#777777')};top:${(mins(l.start)-600)/480*100}%;height:${(mins(l.end)-mins(l.start))/480*100}%" title="${esc(tr(l.note))}"><strong>${esc(course(l.course_id).name)}</strong><span>${esc(l.start)}–${esc(l.end)}</span><span>${esc(l.room)} · ${esc(l.kind)}</span></div>`;};
 $('#timetable-panel').innerHTML=`<div class="timetable-intro"><div><h2>${tr('常规周课表')}</h2><p>${filter===null?tr('全部课程'):esc(course(filter).name)} · ${tr('{count} 个时段 · 香港时间',{count:lessons.length})}</p></div><span class="timetable-badge">LOCAL TIMETABLE</span></div><div class="week-table"><div class="week-table-head"><span>${tr('时间')}</span>${days.map(d=>`<span>${d}</span>`).join('')}</div><div class="week-table-body"><div class="time-ruler">${hours.map(h=>`<span style="top:${(h-10)/8*100}%">${h}:00</span>`).join('')}</div>${days.map((d,i)=>`<div class="lesson-day">${lessons.filter(l=>l.day===weekdayNumbers[i]).map(card).join('')}</div>`).join('')}</div></div><div class="mobile-timetable">${days.map((d,i)=>`<section><h3>${d}</h3>${lessons.filter(l=>l.day===weekdayNumbers[i]).map(l=>`<div class="mobile-lesson"><strong>${esc(course(l.course_id).name)} <small>${esc(l.kind)}</small></strong><span>${esc(l.start)}–${esc(l.end)} · ${esc(l.room)}</span></div>`).join('')||`<p>${tr('没有课程')}</p>`}</section>`).join('')}</div>${lessons.length?'':`<p class="empty">${tr('这门课程尚未配置固定时段。')}</p>`}<p class="timetable-note">${esc(tr(timetable.note))}</p>${timetable.tutorials.length?`<section class="tutorial-audit"><h2>${tr('Tutorial 登记核查')} <small>${tr('核查于')} ${esc(timetable.updated)}</small></h2><div>${timetable.tutorials.map(t=>`<article><div><strong>${esc(t.course)}</strong><span class="audit-status">${esc(tr(t.status))}</span></div><p>${esc(tr(t.detail))}</p></article>`).join('')}</div></section>`:''}`;
}
const taskForm=$('#task-form');
function updateProgress(){const v=taskForm.elements.progress.value;$('#progress-output').textContent=v+'%';}
function openTask(id,date=''){
 const t=state.tasks.find(t=>t.id===id);taskForm.reset();
 taskForm.elements.course_id.innerHTML=state.courses.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
 const defaults={id:'',title:'',course_id:filter??state.courses[0]?.id??'',date,time:'',progress:0,weight:'',notes:''};
 Object.entries(t||defaults).forEach(([k,v])=>{if(taskForm.elements[k]&&k!=='tentative')taskForm.elements[k].value=v;});
 taskForm.elements.tentative.checked=!!t?.tentative;
 $('#task-heading').textContent=t?tr('任务详情'):tr('新建任务');$('#delete-task').hidden=!t;$('#task-error').textContent='';updateProgress();updateFolderButton();
 $('#task-dialog').showModal();
}
async function saveTask(payload,id){if(id)payload.expected_version=state.tasks.find(t=>t.id===Number(id))?.version;const result=await api('/api/tasks'+(id?'/'+id:''),id?'PUT':'POST',payload);await refresh();return result;}
taskForm.onsubmit=async e=>{
 e.preventDefault();const f=taskForm.elements,button=taskForm.querySelector('[type=submit]');button.disabled=true;$('#task-error').textContent='';
 try{await saveTask({title:f.title.value,course_id:Number(f.course_id.value),date:f.date.value,time:f.time.value,tentative:f.tentative.checked,progress:Number(f.progress.value),weight:f.weight.value,notes:f.notes.value},f.id.value);$('#task-dialog').close();toast(tr('任务已保存'));}
 catch(e){$('#task-error').textContent=tr(e.message);}finally{button.disabled=false;}
};
taskForm.elements.progress.oninput=updateProgress;
function updateFolderButton(){
 const available=!!course(Number(taskForm.elements.course_id.value)).folder_available;
 $('#open-course-folder').disabled=!available;
 $('#folder-status').textContent=available?'':tr('这门课程尚未关联本地文件夹');
}
taskForm.elements.course_id.onchange=updateFolderButton;
$('#open-course-folder').onclick=async()=>{
 const button=$('#open-course-folder');button.disabled=true;$('#folder-status').textContent=tr('正在打开…');
 try{const result=await api('/api/courses/'+Number(taskForm.elements.course_id.value)+'/open-folder','POST',{});$('#folder-status').textContent=tr('已打开文件夹 {folder}',{folder:result.folder});}
 catch(e){$('#folder-status').textContent=tr(e.message);}
 finally{button.disabled=!course(Number(taskForm.elements.course_id.value)).folder_available;}
};
taskForm.elements.date.oninput=()=>{if(!taskForm.elements.date.value)taskForm.elements.time.value='';};
document.querySelectorAll('[data-progress]').forEach(b=>b.onclick=()=>{taskForm.elements.progress.value=b.dataset.progress;updateProgress();});
$('#delete-task').onclick=async()=>{
 if(!confirm(tr('确定删除这项任务？')))return;
 try{await api('/api/tasks/'+taskForm.elements.id.value,'DELETE',{expected_version:state.tasks.find(t=>t.id===Number(taskForm.elements.id.value))?.version});await refresh();$('#task-dialog').close();toast(tr('任务已删除'));}catch(e){$('#task-error').textContent=tr(e.message);}
};
const courseForm=$('#course-form');
function openCourses(){renderCourseManager();courseForm.reset();courseForm.elements.id.value='';$('#course-error').textContent='';$('#course-dialog').showModal();}
function renderCourseManager(){
 $('#course-manager').innerHTML=state.courses.map(c=>`<div class="manager-row"><span class="swatch" style="--course:${esc(c.color)}"></span><span>${esc(c.name)}</span><button class="small-btn" data-edit-course="${c.id}">${tr('编辑')}</button><button class="danger" data-delete-course="${c.id}">${tr('删除')}</button></div>`).join('');
 $('#course-manager').querySelectorAll('[data-edit-course]').forEach(b=>b.onclick=()=>{const c=course(Number(b.dataset.editCourse));Object.entries(c).forEach(([k,v])=>{if(courseForm.elements[k])courseForm.elements[k].value=v;});$('#course-error').textContent='';});
 $('#course-manager').querySelectorAll('[data-delete-course]').forEach(b=>b.onclick=async()=>{
 const id=Number(b.dataset.deleteCourse);if(!confirm(tr('删除 {course}？有任务的课程需要先移动任务。',{course:course(id).name})))return;
 try{await api('/api/courses/'+id,'DELETE',{});if(filter===id)filter=null;await refresh();renderCourseManager();courseForm.reset();courseForm.elements.id.value='';toast(tr('课程已删除'));}catch(e){$('#course-error').textContent=tr(e.message);}
 });
}
courseForm.onsubmit=async e=>{
 e.preventDefault();const f=courseForm.elements,b=courseForm.querySelector('[type=submit]');b.disabled=true;
 try{await api('/api/courses'+(f.id.value?'/'+f.id.value:''),f.id.value?'PUT':'POST',{name:f.name.value,color:f.color.value});await refresh();renderCourseManager();courseForm.reset();f.id.value='';$('#course-error').textContent='';toast(tr('课程已保存'));}catch(e){$('#course-error').textContent=tr(e.message);}finally{b.disabled=false;}
};
$('#reset-course').onclick=()=>{courseForm.reset();courseForm.elements.id.value='';$('#course-error').textContent='';};
$('#manage-courses').onclick=openCourses;
document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
$('#new-task').onclick=()=>openTask(null);
$('#open-undated').onclick=()=>setView('undated');
$('#prev').onclick=()=>{if(--month<0){month=11;year--;}render();};
$('#next').onclick=()=>{if(++month>11){month=0;year++;}render();};
$('#today').onclick=()=>{syncCalendarDate();year=todayY;month=todayM-1;render();};
$('#show-done').onchange=render;
function applyTheme(dark){document.body.classList.toggle('dark',dark);$('#theme').textContent=dark?tr('☀ 切换浅色模式'):tr('☾ 切换夜间模式');}
let savedTheme;try{savedTheme=localStorage.getItem('study-theme');}catch{}
applyTheme(savedTheme==='dark');
$('#theme').onclick=()=>{const dark=!document.body.classList.contains('dark');applyTheme(dark);try{localStorage.setItem('study-theme',dark?'dark':'light');}catch{}};
$('#export').onclick=async()=>{try{const data={...await api('/api/export'),timetable:await api('/timetable.json'),assessments:await api('/assessments.json'),academicCalendar:await api('/academic-calendar.json')},url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='学习日历备份-'+hkDate+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(tr('备份已导出'));}catch(e){toast(tr(e.message));}};
function applyLanguage(){
 I18N.applyStatic();
 applyTheme(document.body.classList.contains('dark'));
 render();
 $('#task-heading').textContent=tr(taskForm.elements.id.value?'任务详情':'新建任务');
 if($('#course-dialog').open)renderCourseManager();
 if($('#task-dialog').open)updateFolderButton();
}
$('#language').onchange=e=>{I18N.setLanguage(e.target.value);applyLanguage();};
I18N.applyStatic();applyTheme(document.body.classList.contains('dark'));
refresh().catch(()=>{});
// Use the Mac's clock in Hong Kong time, including after sleep or a background tab.
// Re-render only on a date change so open forms and in-progress edits stay intact.
let clockTimer;
function syncClock(){
 clearTimeout(clockTimer);
 if(syncCalendarDate())render();
 const nextMidnight=Date.UTC(todayY,todayM-1,todayD+1)-8*60*60*1000;
 clockTimer=setTimeout(syncClock,Math.max(50,Math.min(30000,nextMidnight-Date.now()+50)));
}
window.addEventListener('focus',syncClock);
window.addEventListener('pageshow',syncClock);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncClock();});
syncClock();
