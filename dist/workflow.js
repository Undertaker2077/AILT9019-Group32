'use strict';
const workflowHTML = `
<dialog id="import-dialog" class="workflow-dialog">
 <div class="dialog-heading"><div><span class="eyebrow">DOCUMENT → REVIEW → CALENDAR</span><h2>${tr('导入与审核')}</h2></div><button type="button" class="icon-btn" data-close-workflow="import-dialog" aria-label="Close">×</button></div>
 <p class="workflow-note">${tr('只使用公开或自写的虚构课程文件。预览不会调用模型；确认候选前不会修改日历。')}</p>
 <div class="workflow-controls"><label>${tr('课程')}<select id="import-course"></select></label><button class="small-btn" id="load-demo">${tr('载入虚构示例课程')}</button></div>
 <details class="workflow-step" open><summary>1 · ${tr('选择文件并预览')}</summary>
  <div class="workflow-controls"><label class="file-button">${tr('选择文件夹')}<input type="file" id="folder-files" webkitdirectory multiple></label><label class="file-button">${tr('选择文件')}<input type="file" id="document-files" multiple accept=".pdf,.docx,.txt,.md"></label><span id="selected-files"></span></div>
  <details><summary>${tr('或关联本机文件夹路径')}</summary><div class="workflow-controls"><input id="local-folder" placeholder="C:\\CourseFiles or /Users/you/CourseFiles"><button id="save-folder" class="small-btn">${tr('保存文件夹关联')}</button></div></details>
  <p class="workflow-note">PDF / DOCX / TXT / Markdown · UTF-8 · ≤2 MB/file · ≤20 files</p>
  <button class="primary" id="preview-files">${tr('预览文本与变化')}</button><div id="preview-result"></div>
 </details>
 <div class="workflow-step"><h3>2 · ${tr('选择处理方式')}</h3><div class="workflow-controls"><label>${tr('方式')}<select id="extract-mode"><option value="replay">${tr('示例回放（固定样例，非实时 AI）')}</option><option value="live">${tr('实时 API 提取')}</option></select></label><label class="check-label"><input type="checkbox" id="force-extract">${tr('重新分析已处理文件')}</label></div>
  <p id="provider-notice" class="workflow-note"></p><label class="check-label"><input type="checkbox" id="transmission-consent">${tr('我确认将所选文件的全部预览文本发送到上述模型服务。')}</label>
  <button class="primary" id="extract-files">${tr('提取为待审核候选')}</button><div id="extraction-result" aria-live="polite"></div>
 </div>
 <div class="workflow-step"><div class="review-heading"><h3>3 · ${tr('核对证据并确认')}</h3><button class="small-btn" id="reload-proposals">${tr('刷新候选')}</button></div><div id="proposal-list"></div></div>
 <p class="workflow-status" id="workflow-status" role="status"></p>
</dialog>
<dialog id="settings-dialog" class="settings-dialog"><form id="settings-form">
 <div class="dialog-heading"><h2>${tr('API 设置')}</h2><button type="button" class="icon-btn" data-close-workflow="settings-dialog" aria-label="Close">×</button></div>
 <p class="workflow-note">${tr('密钥只保存于本机私有配置，不返回浏览器、不进入代码仓库。模型调用会发送你确认的文本。')}</p>
 <label>Base URL<input id="api-base" type="url" required></label><label>Model<input id="api-model" required></label><label>API key<input id="api-key" type="password" autocomplete="off" placeholder="Leave blank to keep saved key"></label>
 <label class="check-label"><input type="checkbox" id="clear-api-key">${tr('清除已保存的密钥')}</label><p id="key-state"></p>
 <div class="workflow-controls"><button class="primary" type="submit">${tr('保存设置')}</button><button class="small-btn" type="button" id="test-api">${tr('连接测试（会发送一条虚构请求）')}</button></div><p id="settings-status" role="status"></p>
</form></dialog>`;
document.body.insertAdjacentHTML('beforeend', workflowHTML);
let importSnapshot=null, chosenFiles=[], proposalRows=[], providerSettings=null;
const message=(id,text)=>{$(id).textContent=text;};
const busy=async(button,action,status='#workflow-status')=>{
 button.disabled=true;message(status,tr('处理中…'));
 try{await action();}catch(e){message(status,e.message);}finally{button.disabled=false;}
};
document.querySelectorAll('[data-close-workflow]').forEach(b=>b.onclick=()=>$('#'+b.dataset.closeWorkflow).close());
async function fillImportCourses(selected){
 await refresh();$('#import-course').innerHTML=state.courses.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
 if(selected)$('#import-course').value=selected;
 syncFolderField();
}
function syncFolderField(){
 const c=state.courses.find(c=>c.id===Number($('#import-course').value));$('#local-folder').value=c?.folder||'';
 importSnapshot=null;$('#preview-result').replaceChildren();
}
$('#import-course').onchange=syncFolderField;
async function settingsPublic(){
 providerSettings=await api('/api/settings');
 message('#provider-notice',`${tr('实时模式目标')}: ${providerSettings.base_url} · ${providerSettings.model}. ${tr('回放模式不发送网络请求。')}`);
}
$('#ai-import').onclick=()=>busy($('#ai-import'),async()=>{
 await fillImportCourses();await settingsPublic();await loadProposals();$('#import-dialog').showModal();message('#workflow-status','');
});
$('#load-demo').onclick=()=>busy($('#load-demo'),async()=>{
 const demo=await api('/api/demo','POST',{});await fillImportCourses(demo.course_id);chosenFiles=[];message('#selected-files',tr('将读取仓库自带的虚构文件夹'));message('#workflow-status',tr('示例课程已就绪，点击预览。'));
});
for(const id of ['#folder-files','#document-files'])$(id).onchange=e=>{
 chosenFiles=Array.from(e.target.files).filter(f=>/\.(pdf|docx|txt|md)$/i.test(f.name)&&!(f.webkitRelativePath||f.name).split('/').some(p=>p.startsWith('.')));
 importSnapshot=null;$('#preview-result').replaceChildren();message('#selected-files',`${chosenFiles.length} ${tr('个文件已选择')}`);
};
$('#save-folder').onclick=()=>busy($('#save-folder'),async()=>{
 const cid=Number($('#import-course').value);await api(`/api/courses/${cid}/folder`,'POST',{folder:$('#local-folder').value});chosenFiles=[];await fillImportCourses(cid);message('#selected-files',tr('将读取已关联的本机文件夹'));message('#workflow-status',tr('文件夹关联已保存。'));
});
async function encodedFile(f){
 const bytes=new Uint8Array(await f.arrayBuffer());let binary='';
 for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return {name:f.webkitRelativePath||f.name,content:btoa(binary)};
}
$('#preview-files').onclick=()=>busy($('#preview-files'),async()=>{
 if(!$('#import-course').value)throw new Error(tr('先创建或选择一门课程。'));
 if(chosenFiles.length>20||chosenFiles.some(f=>f.size>2*1024*1024)||chosenFiles.reduce((s,f)=>s+f.size,0)>10*1024*1024)throw new Error(tr('最多20份文件，每份2MB，总计10MB。'));
 const payload={course_id:Number($('#import-course').value)};
 if(chosenFiles.length)payload.files=await Promise.all(chosenFiles.map(encodedFile));
 importSnapshot=await api('/api/scan','POST',payload);
 $('#preview-result').innerHTML=importSnapshot.documents.map(d=>`<article class="preview-card"><label class="check-label"><input type="checkbox" data-document-hash="${d.sha256}" ${d.duplicate_in_selection?'disabled':'checked'}><strong>${esc(d.filename)}</strong></label><p class="workflow-note">${d.units.length} ${tr('处文本')} · ${d.size} bytes · ${d.duplicate_in_selection?tr('同内容副本'):d.previously_processed?tr('已处理过的内容'):tr('新内容')}<br>SHA-256: ${d.sha256}</p><details><summary>${tr('查看将被处理的完整文本')}</summary>${d.units.map(u=>`<h4>${esc(u.locator)}</h4><pre>${esc(u.text)}</pre>`).join('')}</details></article>`).join('')+importSnapshot.errors.map(e=>`<p class="workflow-warning">${esc(e.filename)}: ${esc(e.error)}</p>`).join('');
 message('#workflow-status',tr('预览完成；尚未调用模型或修改日历。'));
});
$('#extract-files').onclick=()=>busy($('#extract-files'),async()=>{
 if(!importSnapshot)throw new Error(tr('请先预览文件。'));
 const mode=$('#extract-mode').value,hashes=Array.from(document.querySelectorAll('[data-document-hash]:checked')).map(x=>x.dataset.documentHash);
 if(mode==='live'&&!$('#transmission-consent').checked)throw new Error(tr('实时模式需要确认文本发送范围。'));
 message('#extraction-result',tr('正在逐份处理，请保持窗口打开…'));
 const r=await api('/api/extract','POST',{scan_id:importSnapshot.scan_id,hashes,mode,provider:{base_url:providerSettings.base_url,model:providerSettings.model},consent:$('#transmission-consent').checked,force:$('#force-extract').checked});
 $('#extraction-result').innerHTML=`<p class="mode-badge">${esc(mode==='replay'?tr('示例回放 · 非实时推理'):tr('实时 API 提取'))}</p>`+r.results.map(x=>`<p class="${x.status==='failed'?'workflow-warning':''}">${esc(x.filename)} · ${esc(x.status)} ${x.tasks===undefined?'':`${x.tasks} ${tr('个候选')}`} ${esc(x.error||'')}${x.validation_rejections?.length?'<br>'+esc(x.validation_rejections.join('; ')):''}</p>`).join('');
 await loadProposals();message('#workflow-status',tr('处理完成。日历尚未改变，请逐项核对候选。'));
});
function taskOptions(p){
 return `<option value="">${tr('创建新任务')}</option>`+state.tasks.filter(t=>t.course_id===p.course_id).map(t=>`<option value="${t.id}" data-version="${t.version}" ${p.target_id===t.id?'selected':''}>#${t.id} ${esc(t.title)} · ${esc(t.date||'TBA')} ${esc(t.time)} · ${t.progress}%</option>`).join('');
}
async function loadProposals(){
 await refresh();proposalRows=await api('/api/proposals');const pending=proposalRows.filter(p=>p.status==='pending');
 $('#proposal-list').innerHTML=pending.map(p=>{
  const x=p.payload;return `<form class="proposal-card" data-proposal="${p.id}"><div class="review-heading"><strong>${esc(course(p.course_id).name)} · ${esc(x.task_key)}</strong><span class="mode-badge">${esc(p.mode.toUpperCase())}</span></div><p class="workflow-note">${esc(p.filename)} · ${esc(p.model)}<br>SHA-256: ${p.sha256}</p>
  ${p.conflict?`<p class="workflow-warning">${tr('存在不同截止日期；请核对所有来源，系统不会自动选择。')}</p>`:''}${p.stale?`<p class="workflow-warning">${tr('原任务已被修改。请拒绝并重新分析，避免覆盖较新的编辑。')}</p>`:''}${p.possible_matches.length?`<p class="workflow-warning">${tr('存在同名任务，请在下面选择更新对象或明确保留为独立任务。')}</p>`:''}
  <label>${tr('任务名称')}<input name="title" value="${esc(x.title)}" required maxlength="300"></label><div class="form-row"><label>${tr('日期')}<input name="date" type="date" value="${esc(x.date)}"></label><label>${tr('时间（可留空）')}<input name="time" type="time" value="${esc(x.time)}"></label></div><label class="check-label"><input name="tentative" type="checkbox" ${x.tentative?'checked':''}>${tr('暂定日期')}</label>
  <label>${tr('写入方式')}<select name="target">${taskOptions(p)}</select></label>${p.current_task?`<p>${tr('当前记录')}: ${esc(p.current_task.title)} · ${esc(p.current_task.date||'TBA')} ${esc(p.current_task.time)} · ${p.current_task.progress}%</p>`:''}
  <p><strong>${tr('提交要求')}</strong>: ${esc(x.requirements.join('; ')||tr('未明确'))}</p>${x.warnings.map(w=>`<p class="workflow-warning">${esc(w)}</p>`).join('')}
  <div class="evidence"><strong>${tr('原文证据')}</strong>${x.evidence.map(e=>`<figure><figcaption>${esc(e.locator)} · ${esc(e.field)}</figcaption><blockquote>${esc(e.quote)}</blockquote></figure>`).join('')}</div>
  <label class="check-label"><input name="ack" type="checkbox" required>${tr('已核对来源、日期及潜在重复／冲突，确认以上内容。')}</label><div class="workflow-controls"><button class="primary" type="submit" ${p.stale?'disabled':''}>${tr('确认写入日历')}</button><button class="small-btn" type="button" data-reject="${p.id}">${tr('拒绝候选')}</button></div><p class="decision-status" role="status"></p></form>`;
 }).join('')||`<p class="workflow-note">${tr('没有待审核候选。')}</p>`;
 const accepted=proposalRows.filter(p=>p.status==='accepted').length,rejected=proposalRows.filter(p=>p.status==='rejected').length;
 $('#proposal-list').insertAdjacentHTML('beforeend',`<p class="workflow-note">${tr('已接受')} ${accepted} · ${tr('已拒绝')} ${rejected}</p>`);
 $('#proposal-list').querySelectorAll('form').forEach(form=>{
  form.elements.date.oninput=()=>{if(!form.elements.date.value)form.elements.time.value='';};
  form.onsubmit=async e=>{e.preventDefault();const f=form.elements,b=form.querySelector('[type=submit]');b.disabled=true;
   try{const opt=f.target.selectedOptions[0];await api(`/api/proposals/${form.dataset.proposal}/decision`,'POST',{decision:'accept',target_id:f.target.value?Number(f.target.value):null,expected_version:opt.dataset.version?Number(opt.dataset.version):null,conflict_ack:f.ack.checked,match_ack:f.ack.checked,patch:{title:f.title.value,date:f.date.value,time:f.time.value,tentative:f.tentative.checked}});await loadProposals();message('#workflow-status',tr('已确认并保存到日历。'));}catch(err){form.querySelector('.decision-status').textContent=err.message;b.disabled=false;}
  };
 });
 $('#proposal-list').querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>busy(b,async()=>{await api(`/api/proposals/${b.dataset.reject}/decision`,'POST',{decision:'reject'});await loadProposals();message('#workflow-status',tr('候选已拒绝，日历未修改。'));}));
}
$('#reload-proposals').onclick=()=>busy($('#reload-proposals'),async()=>{await loadProposals();message('#workflow-status','');});
$('#ai-settings').onclick=()=>busy($('#ai-settings'),async()=>{
 await settingsPublic();$('#api-base').value=providerSettings.base_url;$('#api-model').value=providerSettings.model;$('#api-key').value='';$('#clear-api-key').checked=false;
 message('#key-state',tr(providerSettings.key_configured?'已配置密钥（不会显示密钥）':'尚未配置密钥'));message('#settings-status','');$('#settings-dialog').showModal();
},'#settings-status');
$('#settings-form').onsubmit=e=>{e.preventDefault();busy($('#settings-form [type=submit]'),async()=>{
 await api('/api/settings','POST',{base_url:$('#api-base').value,model:$('#api-model').value,api_key:$('#api-key').value,clear_key:$('#clear-api-key').checked});$('#api-key').value='';await settingsPublic();message('#key-state',tr(providerSettings.key_configured?'已配置密钥（不会显示密钥）':'尚未配置密钥'));message('#settings-status',tr('设置已保存。'));
},'#settings-status');};
$('#test-api').onclick=()=>busy($('#test-api'),async()=>{await api('/api/settings/test','POST',{});message('#settings-status',tr('连接测试成功。'));},'#settings-status');

// Rebuild workflow labels in the selected language while dialogs are closed.
$('#language').addEventListener('change',()=>location.reload());
