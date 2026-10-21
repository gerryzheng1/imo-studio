import pathlib
P=pathlib.Path(__file__).parent
def edit(name,old,new):
 p=P/name;s=p.read_text(encoding='utf-8')
 if old not in s:raise RuntimeError('Missing edit anchor in '+name+': '+old[:100])
 p.write_text(s.replace(old,new,1),encoding='utf-8')
edit('ui.js',"$('#content').innerHTML=fn?fn():'';updateMeters();","$('#content').innerHTML=fn?fn():'';enhanceView();updateMeters();")
edit('ui.js',"return {name:sh.name,rows}","return {name:sh.name,rows,date1904:book.date1904}") if False else None
edit('core.js',"return {name:sh.name,rows}","return {name:sh.name,rows,date1904:book.date1904}")
edit('ui.js',"row[field]??''", "row[field]??''") if False else None
edit('ui.js',"header:1,hasHeader:true};renderImportDialog()", "header:1,hasHeader:true,end:matrices[0].rows.length};renderImportDialog()")
edit('ui.js','</label></div><div class="tablewrap"><table><thead><tr><th>源列</th>', '</label><label><span>末条数据行（含本行）</span><input id="importEnd" type="number" min="1" max="${rows.length||1}" value="${c.end||rows.length}"></label></div><div class="tablewrap"><table><thead><tr><th>源列</th>')
edit('ui.js',"m.rows.slice(c.header-1+(c.hasHeader?1:0)).filter(r=>r.some(v=>String(v).trim()!==''))", "m.rows.slice(c.header-1+(c.hasHeader?1:0),c.end||m.rows.length).filter(r=>map.some(([i])=>String(r[i]??'').trim()!==''))")
edit('ui.js',"['importSheet','importHeader','importHasHeader']", "['importSheet','importHeader','importHasHeader','importEnd']")
edit('ui.js',"importContext.sheet=+el.value;importContext.header=1", "importContext.sheet=+el.value;importContext.header=1;importContext.end=importContext.matrices[importContext.sheet].rows.length")
edit('ui.js',"else importContext.hasHeader=el.value==='1';renderImportDialog()", "else if(el.id==='importEnd')importContext.end=Math.min(importContext.matrices[importContext.sheet].rows.length,Math.max(1,+el.value||1));else importContext.hasHeader=el.value==='1';renderImportDialog()")
edit('ui.js',"state.ship.confirmed=false;changed()}else if(el.dataset.table)", "state.ship.confirmed=false;if(el.dataset.bind.startsWith('ship.')&&el.dataset.bind!=='ship.confirmed'){const confirmed=document.querySelector('[data-bind=\"ship.confirmed\"]');if(confirmed)confirmed.checked=false}changed()}else if(el.dataset.table)")
edit('ui.js',"const backup=structuredClone(state);try{\n  if(rows.length>10000)", "const backup=structuredClone(state);const linkedSeen=new Set();try{\n  if(rows.length>10000)")
edit('ui.js',"const allowed=schema[view].filter", "if(linkedSeen.has(p.id))throw Error('导入包含重复人员：'+(row.name||p.id));linkedSeen.add(p.id);const allowed=schema[view].filter")
edit('ui.js',"document.addEventListener('click',e=>{", """function enhanceView(){
 const folder=document.querySelector('[data-action=pickFolder]');if(folder&&!('webkitdirectory' in document.getElementById('templateFolder')))folder.hidden=true;
 const table=document.querySelector('[data-grid]');if(table&&!['effects','vaccines'].includes(table.dataset.grid)){const view=table.dataset.grid;const add=document.querySelector('[data-action=addRow][data-view="'+view+'"]');if(add)add.insertAdjacentHTML('afterend','<button class="danger" data-action="clearTable" data-view="'+view+'">清空本表记录</button>')}
}
actions.clearTable=el=>{const view=el.dataset.view;modal('清空表格记录','<p>将清空 '+esc(viewTitle(view))+' 中的 '+getRows(view).length+' 条记录。需要保留时请先保存工程。</p>', '<button data-action="closeModal">取消</button><button class="danger" data-action="confirmClearTable" data-view="'+view+'">清空记录</button>')};
actions.confirmClearTable=el=>{const view=el.dataset.view;if(view==='profiles'){if(state.arrival.length||state.departure.length||state.cases.some(r=>r.personId))throw Error('船员档案仍被名单或病例关联，请先移除关联。');state.people=[];state.effects={}}else state[view]=[];changed();closeModal();render()};
aliases.personId=['人员标识','personid','stableid','id'];
document.addEventListener('click',e=>{""")
edit('ui.js','姓名、职务、性别、国籍、上船港口和日期随该人员档案同步','姓名、职务、性别、国籍、上船港口和日期优先随进港名单同步（未在名单时使用档案）')
edit('ui.js','空白、NIL 与数字 0 分别保存，不自动互换。','空白、NIL 与数字 0 分别保存；选“无”前请先清空已有记录。')
edit('ui.js','<div class="card"><h2>限制</h2>', '<div class="card"><h2>交付验证范围</h2><p>使用这 10 个实际模板，在浏览器完全离线状态验证了单份与 ZIP 下载、进出港名单差异、所有明细超量续页、减少记录清理、健康附表、前导零、稳定人员关联及工程恢复。40 份测试 XLSX 通过 XML、内容、样式与打印设置对照，并进行工作表渲染检查。</p><p>原生 Excel 自动化被当前系统组策略限制；尚未完成原生 Excel/WPS 打开与实际打印测试，不能把数据预览视作这项验证。</p></div><div class="card"><h2>限制</h2>')
edit('ui.js','两份历史 Sheet1 的 A1:M2 全部清空。', '两份历史 Sheet1 的 A1:M2 全部清空。有旅客或病例时，移除对应旧 NIL 绘图及旅客斜线；明确无记录时才沿用。')
print('UI refinements applied')
