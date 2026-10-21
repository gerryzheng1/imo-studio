// In-memory editing history. Project saves and generated downloads are separate side effects.
const editHistory={undo:[],redo:[],anchor:null,pending:false,context:null,sequence:0,enabled:false,restoring:false,baselineEpoch:0,limit:30,byteLimit:24*1024*1024};
function historySnapshot(){
 const data=structuredClone(state);if(data.workflow)delete data.workflow.lastGenerated;
 data.preferences.warningsAcknowledged=false;
 const value={state:data,config:structuredClone(CONFIG),settings:structuredClone(uiSettings)};
 const text=JSON.stringify(value),selection=[...templates].map(([id,entries])=>[id,entries.map(e=>e.token)]);
 return {...value,baseline:state.workflow?.lastGenerated||null,baselineEpoch:editHistory.baselineEpoch,templates:new Map([...templates].map(([id,entries])=>[id,[...entries]])),text,signature:text+'|'+JSON.stringify(selection)};
}
function resetEditHistory(){editHistory.undo=[];editHistory.redo=[];editHistory.anchor=historySnapshot();editHistory.pending=false;updateEditHistoryButtons()}
function historyContext(event){
 const el=event.target;if(!(el instanceof Element))return;
 if(event.type==='input'&&!event.isTrusted&&editHistory.context&&/^(action|event):/.test(editHistory.context.key)&&Date.now()-editHistory.context.time<50)return;
 const button=el.closest('[data-action]');
 if(event.type==='click'&&button){editHistory.context={key:'action:'+ ++editHistory.sequence,label:(button.textContent||button.title||'修改资料').trim().slice(0,50),time:Date.now()};return}
 if(!['input','change','paste'].includes(event.type))return;
 const field=el.dataset.field||el.dataset.bind||el.dataset.nilDefinition||el.dataset.outputValue||el.id;
 if(!field&&!el.closest('.choice-editor,.date-editor'))return;
 const target=el.matches('.value-choice,.date-calendar-picker')?el.closest('.choice-editor,.date-editor')?.querySelector('[data-table],[data-bind]')||el:el;
 const key=[target.dataset.table||target.dataset.bind||target.id,target.dataset.id,target.dataset.field||field].join(':');
 const label=target.dataset.field?(schema[target.dataset.table]?.find(([k])=>k===target.dataset.field)?.[1]||target.dataset.field):target.closest('label')?.querySelector('span')?.textContent||'编辑资料';
 editHistory.context={key:event.type==='input'&&el.tagName!=='SELECT'?'typing:'+key:'event:'+ ++editHistory.sequence,label:'编辑 '+label.trim().slice(0,45),time:Date.now()};
}
for(const event of ['click','input','change','paste'])document.addEventListener(event,historyContext,true);
function flushEditHistory(){
 if(!editHistory.enabled||editHistory.restoring)return;
 editHistory.pending=false;const next=historySnapshot(),before=editHistory.anchor;
 if(!before){editHistory.anchor=next;return}
 if(before.signature===next.signature)return;
 const context=editHistory.context||{key:'operation:'+ ++editHistory.sequence,label:'修改 '+viewTitle(currentView),time:Date.now()},last=editHistory.undo.at(-1);
 if(next.text.length>editHistory.byteLimit||before.text.length>editHistory.byteLimit){editHistory.undo=[];editHistory.redo=[];editHistory.anchor=next;updateEditHistoryButtons();toast('当前资料较大，已重新建立撤销起点；请保存工程备份。');return}
 if(!(last&&last.key===context.key&&Date.now()-last.time<1600))editHistory.undo.push({snapshot:before,key:context.key,label:context.label,time:Date.now()});
 else last.time=Date.now();
 editHistory.anchor=next;editHistory.redo=[];
 while(editHistory.undo.length>editHistory.limit||editHistory.undo.reduce((n,x)=>n+x.snapshot.text.length,0)>editHistory.byteLimit)editHistory.undo.shift();
 updateEditHistoryButtons();
}
function scheduleEditHistory(){if(editHistory.pending||!editHistory.enabled||editHistory.restoring)return;editHistory.pending=true;queueMicrotask(flushEditHistory)}
function updateEditHistoryButtons(){for(const [key,stack]of [['undo',editHistory.undo],['redo',editHistory.redo]]){const el=$('#'+key+'Edit');if(!el)continue;el.disabled=busy||!stack.length;el.textContent=key==='undo'?'↶ 撤销':'↷ 重做';el.title=stack.length?(key==='undo'?'撤销：':'重做：')+stack.at(-1).label:'暂无可'+(key==='undo'?'撤销':'重做')+'的操作'}}
const changedHistoryBefore=changed;changed=function(){changedHistoryBefore();scheduleEditHistory()};
function restoreHistoryEntry(direction){
 if(busy)return;flushEditHistory();const from=editHistory[direction],to=editHistory[direction==='undo'?'redo':'undo'],entry=from.pop();if(!entry)return;
 to.push({snapshot:historySnapshot(),key:entry.key,label:entry.label,time:Date.now()});
 const baseline=state.workflow?.lastGenerated;editHistory.restoring=true;
 try{state=structuredClone(entry.snapshot.state);state.workflow??={};state.workflow.lastGenerated=entry.snapshot.baselineEpoch===editHistory.baselineEpoch?entry.snapshot.baseline:baseline||null;CONFIG=structuredClone(entry.snapshot.config);templates=new Map([...entry.snapshot.templates].map(([id,entries])=>[id,[...entries]]));uiSettings=structuredClone(entry.snapshot.settings);applyUISettings();changedHistoryBefore();render();editHistory.anchor=historySnapshot();toast((direction==='undo'?'已撤销：':'已重做：')+entry.label)}finally{editHistory.restoring=false;updateEditHistoryButtons()}
}
actions.undoEdit=()=>restoreHistoryEntry('undo');actions.redoEdit=()=>restoreHistoryEntry('redo');
document.addEventListener('keydown',e=>{if(!uiSettings.shortcuts||!(e.ctrlKey||e.metaKey)||e.altKey||$('#modalRoot').children.length)return;const target=e.target;if(target.closest('input,textarea,select,[contenteditable=true]'))return;const key=e.key.toLowerCase();if(key==='z'||key==='y'){e.preventDefault();restoreHistoryEntry(key==='y'||e.shiftKey?'redo':'undo')}});
const metersHistoryBefore=updateMeters;updateMeters=function(){metersHistoryBefore();updateEditHistoryButtons()};
const historyLoadBefore=loadProject;loadProject=async file=>{flushEditHistory();const enabled=editHistory.enabled;editHistory.enabled=false;try{await historyLoadBefore(file);resetEditHistory()}finally{editHistory.enabled=enabled}};
const historyReadyBefore=IMOApp.ready;IMOApp.ready=Promise.resolve(historyReadyBefore).then(()=>{editHistory.enabled=true;resetEditHistory()});
IMOApp.history={undo:()=>restoreHistoryEntry('undo'),redo:()=>restoreHistoryEntry('redo'),flush:flushEditHistory,reset:resetEditHistory,get counts(){return {undo:editHistory.undo.length,redo:editHistory.redo.length}}};
