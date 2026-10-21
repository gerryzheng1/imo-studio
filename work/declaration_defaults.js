// Explicit reusable declarations. Port answers remain independent after applying a profile.
const DeclarationDefaults=(()=>{
 const keys=['health','nil','passengers','medicines'],labels={health:'健康申报',nil:'NIL 申报',passengers:'旅客名单',medicines:'药品名单'},clone=x=>structuredClone(x);
 const empty=()=>({version:1,sections:{health:null,nil:null,passengers:null,medicines:null}});
 const beforeBlank=blankState;blankState=function(){const s=beforeBlank();s.declarationDefaults=empty();s.declarationSources={};return s};
 state.declarationDefaults??=empty();state.declarationSources??={};
 function profile(s=state){return s.declarationDefaults??=empty()}
 function capture(key,s=state){
  if(key==='health')return {health:clone(s.health),casesDeclaration:s.cases.length?'':s.declarations.cases};
  if(key==='nil')return {items:clone(s.nilItems),answers:clone(s.nil)};
  return {rows:clone(s[key]),declaration:s.declarations[key]||''};
 }
 function validate(p){
  if(p===undefined)return;if(!p||p.version!==1||!p.sections||Array.isArray(p.sections))throw Error('申报默认方案格式无效');
  for(const key of keys){const x=p.sections[key];if(x===null||x===undefined)continue;if(!x||typeof x.id!=='string'||!x.id||typeof x.enabled!=='boolean'||typeof x.savedAt!=='string'||!x.data||Array.isArray(x.data))throw Error('申报默认方案缺少有效标识或内容');const d=x.data;
   if(key==='health'){if(!d.health||Array.isArray(d.health)||Object.values(d.health).some(v=>typeof v!=='string')||typeof d.casesDeclaration!=='string'||!['','none','records'].includes(d.casesDeclaration))throw Error('健康申报默认方案无效')}
   else if(key==='nil'){validateNilItems(d.items);if(!d.answers||Array.isArray(d.answers)||Object.values(d.answers).some(v=>typeof v!=='string'))throw Error('NIL 默认答案无效')}
   else{if(!Array.isArray(d.rows)||d.rows.length>10000||!['','none','records'].includes(d.declaration))throw Error('名单默认方案无效');const ids=new Set();for(const r of d.rows){if(!r||typeof r.id!=='string'||!r.id||ids.has(r.id)||Object.values(r).some(v=>v!==null&&typeof v==='object'))throw Error('名单默认记录无效');ids.add(r.id)}}
  }return p;
 }
 function save(keysToSave){for(const key of keysToSave)if(!keys.includes(key))throw Error('申报类别无效');const next=clone(profile());for(const key of keysToSave)next.sections[key]={id:uid(),enabled:true,savedAt:new Date().toISOString(),data:capture(key)};validate(next);state.declarationDefaults=next;for(const key of keysToSave)state.declarationSources[key]={id:next.sections[key].id,appliedAt:new Date().toISOString()};changed();render()}
 function applyTo(target,selected=keys,{automatic=false}={}){const p=profile(target);validate(p);const applied=[];target.declarationSources??={};for(const key of selected){const x=p.sections[key];if(!x||automatic&&!x.enabled)continue;const d=x.data;if(key==='health'){target.health=clone(d.health);if(!target.cases.length)target.declarations.cases=d.casesDeclaration}
   else if(key==='nil'){target.nilItems=clone(d.items);target.nil=clone(d.answers)}else{target[key]=clone(d.rows);target.declarations[key]=d.declaration}
   target.declarationSources[key]={id:x.id,appliedAt:new Date().toISOString()};applied.push(key)}return applied;
 }
 function describe(key,s=state){const d=capture(key,s);if(key==='health'){const n=Array.from({length:9},(_,i)=>d.health['q'+(i+1)]).filter(x=>!isBlank(x)).length;return '9 项健康问题已填 '+n+' 项'+(d.health.certExpiry?' · 卫生证书至 '+d.health.certExpiry:'')}
  if(key==='nil')return d.items.length+' 项申报 · '+d.items.filter(x=>!isBlank(d.answers[x.key])).length+' 项已填写';return d.declaration==='none'?'无记录 · NIL':d.rows.length+' 条记录'+(!d.declaration?' · 状态待填写':'');
 }
 function source(key){const x=profile().sections[key];if(!x)return '尚未设置默认';return JSON.stringify(capture(key))===JSON.stringify(x.data)?'与默认方案一致':'本港已单独修改'}
 function bar(key){const x=profile().sections[key];return `<div class="reuse-bar" data-default-bar="${key}"><div><strong>${x?'常用申报方案':'这项申报可以重复使用'}</strong><span>${esc(source(key))}</span></div><div class="row">${x?`<button class="small" data-action="applyDeclarationDefault" data-section="${key}">恢复默认</button>`:''}<button class="small" data-action="saveDeclarationDefault" data-section="${key}">${x?'更新默认':'将本港内容设为默认'}</button><button class="text-button small" data-action="wsGo" data-view="declarationDefaults">管理方案</button></div></div>`}
 function view(){return `<div class="defaults-intro"><h2>填好一次，后续港口沿用。</h2><p>先在本港填好内容，再保存为默认。开启自动带入后，新建港口会使用这份方案，已有港口保持自己的资料。</p><button data-action="saveDeclarationDefault" data-section="all">将本港四类申报保存为默认</button></div><div class="default-section-list">${keys.map(key=>{const x=profile().sections[key];return `<section class="default-section"><div><h3>${labels[key]}</h3><p>${x?esc(describe(key,{...state,...(key==='health'?{health:x.data.health,cases:[],declarations:{...state.declarations,cases:x.data.casesDeclaration}}:key==='nil'?{nilItems:x.data.items,nil:x.data.answers}:{[key]:x.data.rows,declarations:{...state.declarations,[key]:x.data.declaration}})})):'尚未保存默认 · 当前 '+esc(describe(key))}</p>${x?'<small>更新于 '+esc(new Date(x.savedAt).toLocaleString('zh-CN'))+'</small>':''}</div><div class="default-controls"><label class="switch-line"><input type="checkbox" data-default-auto="${key}" ${x?.enabled?'checked':''} ${x?'':'disabled'}><span>新港口自动带入</span></label><div class="row"><button class="small" data-action="wsGo" data-view="${key}">编辑本港</button><button class="small" data-action="saveDeclarationDefault" data-section="${key}">${x?'更新默认':'设为默认'}</button>${x?`<button class="small" data-action="applyDeclarationDefault" data-section="${key}">应用到本港</button><button class="small danger" data-action="clearDeclarationDefault" data-section="${key}">删除默认</button>`:''}</div></div></section>`}).join('')}</div><div class="defaults-footnote"><p>健康默认包含常用答案与卫生证书。病例逐港填写；已有病例在应用默认时保留。健康与 NIL 申报仍需在生成前按港核对。</p><p>默认方案随工程保存。需要下次新建工程也沿用时，可在模板管理中“保存为本机默认”或导出常用配置。</p></div>`}
 actions.saveDeclarationDefault=el=>{const chosen=el.dataset.section==='all'?keys:[el.dataset.section];modal('保存申报默认方案',`<p>将本港的${chosen.map(k=>labels[k]).join('、')}保存为默认，后续新建港口自动带入。已有港口不会被覆盖。</p><p class="muted">健康方案不保存病例记录。请点底部“保存工程”保留方案。</p>`,`<button data-action="closeModal">取消</button><button class="primary" data-action="confirmSaveDeclarationDefault" data-section="${el.dataset.section}">保存为默认</button>`)};
 actions.confirmSaveDeclarationDefault=el=>{save(el.dataset.section==='all'?keys:[el.dataset.section]);closeModal();toast('默认方案已更新，新港口会自动带入。')};
 actions.applyDeclarationDefault=el=>{const key=el.dataset.section;if(!profile().sections[key])throw Error('请先保存这项默认方案');modal('应用默认到本港',`<p>用已保存的${labels[key]}替换本港对应内容。其他港口保持自己的资料。应用后可以撤销。</p>`,`<button data-action="closeModal">取消</button><button class="primary" data-action="confirmApplyDeclarationDefault" data-section="${key}">应用到本港</button>`)};
 actions.confirmApplyDeclarationDefault=el=>{applyTo(state,[el.dataset.section]);changed();closeModal();render();toast('已应用默认方案，请核对本港实际情况。')};
 actions.clearDeclarationDefault=el=>{const key=el.dataset.section;modal('删除申报默认',`<p>删除${labels[key]}默认方案？各港已填写内容继续保留。</p>`,`<button data-action="closeModal">取消</button><button class="danger" data-action="confirmClearDeclarationDefault" data-section="${key}">删除默认</button>`)};
 actions.confirmClearDeclarationDefault=el=>{profile().sections[el.dataset.section]=null;changed();closeModal();render()};
 document.addEventListener('change',e=>{const key=e.target.dataset.defaultAuto;if(!key)return;const x=profile().sections[key];if(x){x.enabled=e.target.checked;changed()}});
 const extras=validateProjectExtras;validateProjectExtras=function(s){extras(s);validate(s?.declarationDefaults);if(s?.declarationSources!==undefined&&(!s.declarationSources||Array.isArray(s.declarationSources)||Object.entries(s.declarationSources).some(([k,v])=>!keys.includes(k)||!v||typeof v.id!=='string'||typeof v.appliedAt!=='string')))throw Error('申报默认来源记录无效')};
 const archive=archiveForDefaults;archiveForDefaults=function(include){return {...archive(include),declarationDefaults:clone(profile())}};
 const validateDefaults=validateArchive;validateArchive=function(a){const s=validateDefaults(a);if(a?.declarationDefaults){validate(a.declarationDefaults);s.declarationDefaults=clone(a.declarationDefaults)}return s};
 const nextPort=buildNextPortState;buildNextPortState=function(draft){const s=nextPort(draft);applyTo(s,keys,{automatic:true});return s};
 const reset=actions.applyResetVoyage;actions.applyResetVoyage=function(){const p=clone(profile());reset();state.declarationDefaults=p;state.declarationSources={};changed();render()};
 return {keys,labels,profile,capture,save,applyTo,validate,bar,view,source};
})();
globalThis.DeclarationDefaults=DeclarationDefaults;
