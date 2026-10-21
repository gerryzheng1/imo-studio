from pathlib import Path
P=Path(__file__).parent
p=P/'ui.js';s=p.read_text(encoding='utf-8')
start=s.index('async function loadProject(file){');end=s.index('async function manageSignatures()',start)
s=s[:start]+'''async function loadProject(file){
 if(file.size>60*1024*1024)throw Error('工程文件超过 60MB');
 const p=cleanObject(JSON.parse(await file.text()));
 if(p.kind!=='IMO-PROJECT'||p.schema!==1||!p.state)throw Error('不是当前版本 IMO 工程');
 const cfg=checkConfiguration(p.config||BASE_CONFIG),blank=blankState(),incoming=p.state;
 for(const k of Object.keys(blank)){
  if(incoming[k]===undefined)continue;
  if(Array.isArray(blank[k])){if(!Array.isArray(incoming[k]))throw Error('工程字段 '+k+' 应为数组');blank[k]=incoming[k]}
  else if(blank[k]&&typeof blank[k]==='object'){
   if(!incoming[k]||typeof incoming[k]!=='object'||Array.isArray(incoming[k]))throw Error('工程字段 '+k+' 应为对象');
   blank[k]={...blank[k],...incoming[k]};
  }
 }
 if(typeof blank.ship.confirmed!=='boolean')throw Error('船舶确认状态应为 true / false');
 const ids=new Set();for(const person of blank.people){
  if(!person||typeof person.id!=='string'||!person.id||ids.has(person.id))throw Error('船员档案标识重复或缺失');ids.add(person.id);
  if(person.vaccines!==undefined&&(!person.vaccines||typeof person.vaccines!=='object'||Array.isArray(person.vaccines)))throw Error('疫苗档案格式无效');
 }
 for(const side of ['arrival','departure'])for(const e of blank[side]){
  if(!e||typeof e.personId!=='string'||!ids.has(e.personId))throw Error('本次名单引用了不存在的人员');
  if(!e.overrides)e.overrides={};if(typeof e.overrides!=='object'||Array.isArray(e.overrides))throw Error('本次名单覆盖值无效');
 }
 for(const key of ['ports','stores','passengers','medicines','cases']){
  const rowIds=new Set();for(const row of blank[key]){if(!row||typeof row.id!=='string'||!row.id||rowIds.has(row.id))throw Error(key+' 记录标识重复或缺失');rowIds.add(row.id)}
 }
 if(!Array.isArray(blank.preferences.signatureAnchors))throw Error('签名图片设置无效');
 if(p.templates!==undefined&&!Array.isArray(p.templates))throw Error('工程模板列表无效');
 const newTemplates=new Map();for(const t of p.templates||[]){
  if(!Number.isInteger(t.id)||t.id<1||t.id>10||typeof t.name!=='string'||typeof t.base64!=='string')throw Error('工程模板无效');
  const bytes=fromBase64(t.base64),book=await readBook(bytes,t.name);if(!newTemplates.has(t.id))newTemplates.set(t.id,[]);
  newTemplates.get(t.id).push({bytes,book,name:t.name,token:uid()});
 }
 CONFIG=cfg;state=blank;if(p.includesTemplates)templates=newTemplates;importProblems=[];changed();currentView='check';closeModal();render();
 toast('工程已恢复；'+(p.includesTemplates?'已恢复原始模板。':'工程不含模板，请确认当前模板或重新选择。'));
}
''' + s[end:]
old="const options=[...cols.filter(x=>x[2]!=='person'),...(['effects','vaccines'].includes(c.view)?[['personId','人员标识（优先匹配）']]:[])];"
assert old in s;s=s.replace(old,"const options=[...cols,...(['effects','vaccines'].includes(c.view)?[['personId','人员标识（优先匹配）']]:[])];",1)
start=s.index('function exportCsv(view){');end=s.index('\n',start)
s=s[:start]+'''function exportCsv(view){const cols=schema[view],linked=['effects','vaccines'].includes(view);download(csvText([[...(linked?['人员标识']:[]),...cols.map(x=>x[1])],...getRows(view).map(r=>[...(linked?[r.id]:[]),...cols.map(([k])=>r[k]??'')])]),viewTitle(view)+'.csv','text/csv;charset=utf-8')}''' +s[end:]
s=s.replace('配置与页面逻辑分开，随工程保存。','配置与页面逻辑分开，随工程保存。配置同时包含健康附表和旅客表的历史 NIL 绘图控制。',1)
p.write_text(s,encoding='utf-8')
print('final refinements applied')
