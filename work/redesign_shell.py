from pathlib import Path
P=Path(__file__).resolve().parent
p=P/'app_shell.js';s=p.read_text(encoding='utf-8')
def span(start,end,new):
 global s
 a=s.index(start);b=s.index(end,a);s=s[:a]+new+'\n'+s[b:]
s=s.replace("search:'',stockArchives:false", "search:'',stockArchives:false,page:'arrival'")
span(' function resolve(){',' function segmented(',r'''
 const documents=[['arrival','进港船员名单','people',1],['departure','离港船员名单','people',2],['effects','船员个人物品','box',3],['ports','本次港口清单','ship',4],['stores','船舶物料','box',5],['health','健康申报及病例','file',6],['passengers','旅客名单','people',7],['medicines','药品名单','file',8],['nil','NIL 各项申报','file',9],['vaccines','疫苗有效日期','file',10]];
 function resolve(){
  if(documents.some(d=>d[0]===currentView)||['voyage','crewChanges','check','plannedPorts'].includes(currentView)){ui.page=currentView;ui.section='workspace'}
  else if(['ship','profiles'].includes(currentView)){ui.library=currentView;ui.section='library'}
  else if(currentView==='declarationDefaults')ui.section='defaults';
  else if(['settings','templates','mapping','voyageTools'].includes(currentView)){ui.section='settings';ui.advanced=currentView==='settings'?'':currentView}
  else if(['records','help'].includes(currentView))ui.section=currentView;
  else ui.section='workspace';
  ui.route=['ports','plannedPorts'].includes(ui.page);ui.tab=peopleViews.includes(ui.page)?'people':declarationViews.includes(ui.page)?'declarations':ui.page==='stores'?'stores':'preview';
  if(peopleViews.includes(ui.page))ui.people=ui.page;if(declarationViews.includes(ui.page))ui.declaration=ui.page;
 }
 function goButton(view,title,glyph='file',suffix=''){const on=(ui.section==='workspace'?ui.page:currentView)===view;return `<button class="nav ${on?'active':''}" data-action="wsGo" data-view="${view}" ${on?'aria-current="page"':''}>${icon(glyph,18)}<span>${title}</span>${suffix}</button>`}
 function nav(){return `<div class="nav-main"><div class="nav-caption">本港准备</div>${goButton('voyage','靠港资料','ship')}${goButton('crewChanges','人员变动','people')}<div class="nav-caption">申报文件</div>${documents.map(([v,label,glyph,id])=>goButton(v,label,glyph,`<span class="nav-index">${String(id).padStart(2,'0')}</span>`)).join('')}<div class="nav-preview">${goButton('check','预览与输出','eye')}</div></div><div class="nav-secondary"><div class="nav-caption">常用资料</div>${goButton('declarationDefaults','申报默认方案','check')}${goButton('ship','船舶档案','ship')}${goButton('profiles','船员档案','people')}${goButton('records','工程记录','records')}${goButton('settings','总设置','settings')}</div>`}
 function portStrip(){const tasks=api().tasks(),used=new Set(tasks.map(t=>t.planId)),plans=(api().workspace().shared?.plannedPorts||state.plannedPorts||[]).filter(p=>!used.has(p.id));return `<div class="port-strip-label">靠港计划 <span>${tasks.length} 港</span></div><div class="port-strip-scroll" data-scroll-region="portStrip">${tasks.map((t,i)=>{const p=portLabel(t);return `<button class="port-stop ${t.id===api().activeId()?'active':''}" data-action="wsOpenPort" data-id="${esc(t.id)}" ${t.id===api().activeId()?'aria-current="true"':''}><span class="stop-sequence">${i+1}</span><span class="stop-copy"><strong>${esc(p.zh||p.name)}${p.code?'<code>'+esc(displayLocode(p.code))+'</code>':''}</strong><small>${p.zh?esc(p.name)+' · ':''}${esc(t.data.voyage.arrivalDate||'日期待填')}</small></span><span class="stop-state ${status(t)[1]}" title="${esc(status(t)[0])}"></span></button>`}).join('')}${plans.map(p=>`<button class="port-stop planned" data-action="wsPreparePlan" data-id="${esc(p.id)}"><span class="stop-copy"><strong>${esc(portInfo(p.port,p.country,p.portMeta)?.nameZh||p.port||'计划港口')}</strong><small>未准备 · 点击添加</small></span></button>`).join('')}</div><button class="add-stop" data-action="wsAddPort" aria-label="添加靠港港口">${icon('plus',19)}<span>添加港口</span></button>`}
''')
span(' function welcome(){',' function portRail(',r'''
 function welcome(){return `<section class="ws-welcome"><div class="welcome-symbol">${icon('ship',48)}</div><h1>准备下一次靠港。</h1><p>先添加港口，左侧直接选择要填写的文件。<br>基础资料与申报默认方案，可供后续港口重复使用。</p><div class="row"><button class="primary" data-action="wsAddPort">${icon('plus',18)}添加第一个港口</button><button data-action="loadProject">打开已有工程</button></div><div class="welcome-links"><button class="text-button" data-action="wsGo" data-view="ship">填写船舶档案 ${icon('arrow',15)}</button><span>10 份内置模板 · 全程本机处理</span></div></section>`}
''')
span(' function portHeading(){',' function issueView(',r'''
 function pageHeader(title,sub='',tools=''){const t=active(),p=t?portLabel(t):null;return `<div class="document-heading"><div><h1>${esc(title)}</h1><p>${p?'<span>'+esc(p.zh||p.name)+'</span><span class="heading-divider"></span>':''}${sub||'编辑本港资料'}</p></div><div class="row">${tools}${t?`<button class="small text-button" data-action="wsPortMore" data-id="${esc(t.id)}" aria-label="本港更多操作">${icon('more',20)}</button>`:''}</div></div>`}
 function workspace(){
  const page=ui.page,hasData=!!(active()||state.voyage.arrivalPort||state.voyage.departurePort||page==='voyage');if(!hasData)return welcome();
  let body='',title=documents.find(d=>d[0]===page)?.[1]||({voyage:'靠港资料',crewChanges:'人员变动',check:'预览与输出',plannedPorts:'未来港口计划'})[page]||'本港资料',sub='',tools='';
  if(page==='check'){body=preview();sub='选择需要的文件，再统一核对与生成'}
  else if(page==='voyage'){ui.portInfo=true;body=voyageDetails();sub='设置日期、前后港与本次申报阶段'}
  else if(page==='ports'||page==='plannedPorts'){body=portWorkspace();sub='结合历史与前序计划，最近 10 次靠港'}
  else{body=editorViews[page]?.()||editorViews.arrival();sub=page==='effects'?getRows('effects').length+' 人 · 随本港名单关联':page==='stores'?state.stores.length+' 项 · 按存放位置归类':page==='arrival'||page==='departure'?state[page].length+' 人 · 本港独立名单':page==='health'?'常用答案可设默认，病例按本港实际填写':page==='nil'?activeNilItems().length+' 项申报':page==='vaccines'?'随本港船员关联':'本港独立保存';
   if(page==='stores')tools='<button class="small" data-action="wsStock">'+icon('box',16)+'连续库存推算</button>';
   if(page==='effects')tools='<button class="small" data-action="saveEffectsSnapshot">'+icon('plus',16)+'保存物品快照</button>';
  }
  const stale=active()?.stale.length?'<div class="draft-banner">本港有上游资料变化。<button class="text-button" data-action="wsResolve">核对变化 '+icon('chevron',14)+'</button></div>':'';
  return pageHeader(title,sub,tools)+stale+(declarationViews.includes(page)?DeclarationDefaults.bar(page):'')+(page==='effects'?EffectsArchive.panel():'')+`<div class="document-editor" data-ws-editor="${page}">${body}</div>`;
 }
 function routePanel(){return workspace()}
 function library(){return pageHeader(ui.library==='ship'?'船舶档案':'船员档案','维护常用资料，供新港口带入',api().tasks().length?'<button class="small" data-action="wsSync">同步到港口…</button>':'')+`<div class="document-editor" data-ws-editor="${ui.library}">${editorViews[ui.library]()}</div>`}
''')
# Remove the two-tier old form headers without hiding any editor actions.
s=s.replace("if(first)first.remove();", "if(first)first.remove();")
a=s.index(' function renderApp(){');b=s.index(' function updateShellStatus()',a)
s=s[:a]+r'''
 function renderApp(){
  if(rendering)return;rendering=true;
  try{
   const content=$('#content'),previous=ViewMemory.before(content),navTop=$('#nav').scrollTop,strip=$('#portbar .port-strip-scroll'),stripLeft=strip?.scrollLeft||0;
   resolve();const view=ui.section==='workspace'?ui.page:ui.section==='library'?ui.library:ui.section==='settings'?ui.advanced||'settings':ui.section;
   const key=[state.multiport?.id||'single',api().activeId()||'single',view,view==='ports'?portTab:''].join('|');
   $('#nav').innerHTML=nav();$('#topTitle').textContent=state.ship.name||'IMO Studio';$('#portbar').innerHTML=portStrip();
   content.className='app-content section-'+ui.section;content.innerHTML=ui.section==='workspace'?workspace():ui.section==='library'?library():ui.section==='records'?records():ui.section==='settings'?settings():ui.section==='defaults'?pageHeader('申报默认方案','长期不变的内容，统一在这里管理')+DeclarationDefaults.view():helpView();
   enhanceView();condenseEditors();updateMeters();$('#nav').scrollTop=navTop;const nextStrip=$('#portbar .port-strip-scroll');if(nextStrip)nextStrip.scrollLeft=stripLeft;
   ViewMemory.after(content,key,previous);
  }finally{rendering=false}
 }
''' +s[b:]
# New navigation owns one stable view, even when ports change.
s=s.replace("actions.wsOpenPort=el=>task(async()=>{ui.route=false;await api().switchTask(el.dataset.id,'multiport')});", "actions.wsOpenPort=el=>task(async()=>{const view=ui.section==='workspace'?ui.page:'arrival';await api().switchTask(el.dataset.id,view)});")
s=s.replace("const ids=api().selectedIds();", "const ids=api().selectedIds();")
s=s.replace("请在左侧勾选这次要输出的港口。", "请在生成核对中选择要输出的港口。")
s=s.replace("document.documentElement.dataset.uiVersion='2'", "document.documentElement.dataset.uiVersion='2.1'")
s=s.replace("actions.wsHelp=()=>", "actions.wsGo=el=>{flushEditHistory();closeModal();currentView=el.dataset.view;if(currentView==='ports')portTab='current';render();if(currentView==='records'||currentView==='settings')return task(async()=>{await refreshProjectStorage();if(currentView===el.dataset.view)render()})};\n actions.navigate=actions.wsGo;\n actions.wsHelp=()=>")
# All ports remain selectable in generation review; outputs are controlled per document.
s=s.replace("ids=ids||api().selectedIds();", "ids=ids||(api().selectedIds().length?api().selectedIds():api().tasks().map(t=>t.id));")
s=s.replace("return pageTitle('总设置','常用设置放在前面，其余选项按需展开。')", "return pageTitle('总设置','让工作台适合你的使用习惯。')")
s=s.replace("${settingSelect('sidebarWidth','侧栏宽度',[[170,'窄'],[210,'标准'],[250,'宽']])}", "")
s=s.replace(" const ready=IMOApp.ready;", " if(!views.some(v=>v[0]==='declarationDefaults'))views.push(['declarationDefaults','申报默认方案','']);\n const ready=IMOApp.ready;")
p.write_text(s,encoding='utf-8')
# The shell markup no longer contains layered workspaces or a second sidebar.
p=P/'app.html';s=p.read_text(encoding='utf-8')
s=s.replace('<span class="brand-symbol" aria-hidden="true">I</span>', '<span class="brand-symbol" aria-hidden="true"><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65"><path d="M5 12V7h14v5M9 7V3h6v4M3 13l9-3 9 3-3 7H6z"/></svg></span>')
s=s.replace('航次文件工作台 · 2.0','航次文件工作台 · 2.1').replace('2026-10-18</span></div><button data-action="wsHelp"','2026-10-19</span></div><button data-action="wsHelp"')
s=s.replace('<main id="content"', '<div id="portbar" class="portbar" aria-label="靠港计划"></div><main id="content"')
p.write_text(s,encoding='utf-8')
p=P/'multiport.js';s=p.read_text(encoding='utf-8').replace('s[key]=clone(w.shared?.[key]??s[key]);','s[key]=clone(w.shared?.[key]??s[key]??blankState()[key]);').replace('delete s.multiport;return s}', "s.declarationSources??={};s.effectsAsOf??={port:'',date:'',snapshotId:''};delete s.multiport;return s}")
p.write_text(s,encoding='utf-8')
p=P/'defaults.js';s=p.read_text(encoding='utf-8').replace('state.preferences.customPorts=parsed.state.preferences.customPorts;state.nilItems=', "state.preferences.customPorts=parsed.state.preferences.customPorts;if(parsed.bundle.archive?.declarationDefaults)state.declarationDefaults=structuredClone(parsed.state.declarationDefaults);state.nilItems=")
p.write_text(s,encoding='utf-8')
