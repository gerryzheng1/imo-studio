'use strict';
// Local PDF.js import. PDF text is data only: no PDF JavaScript/actions are run.
let imoPdfRuntimePromise=null, shipPdfPending=null;
const shipPdfFields=[['name','船名'],['imo','IMO 编号'],['callSign','呼号'],['flag','船旗 / 国籍'],['registry','船籍港'],['company','船公司'],['netTonnage','净登记吨位'],['master','船长姓名']];
async function localPdfRuntime(){
 if(imoPdfRuntimePromise)return imoPdfRuntimePromise;
 imoPdfRuntimePromise=(async()=>{
  const bytes=id=>fromBase64(document.getElementById(id).textContent.trim());
  const mainURL=URL.createObjectURL(new Blob([bytes('imo-pdf-main')],{type:'text/javascript'}));
  let pdf;
  try{pdf=await import(mainURL)}finally{URL.revokeObjectURL(mainURL)}
  const workerURL=URL.createObjectURL(new Blob([bytes('imo-pdf-worker')],{type:'text/javascript'}));
  pdf.GlobalWorkerOptions.workerSrc=workerURL;
  const assets=await JSZip.loadAsync(bytes('imo-pdf-assets'));
  class LocalBinaryDataFactory{
   async fetch({filename}){
    if(typeof filename!=='string'||!/^[A-Za-z0-9_.-]+$/.test(filename))throw Error('PDF 字体资源名称无效');
    const entry=assets.file('cmaps/'+filename)||assets.file('cmaps/'+filename+'.bcmap')||assets.file('standard_fonts/'+filename);
    if(!entry)throw Error('此 PDF 需要未内嵌的字体资源：'+filename);
    return entry.async('uint8array');
   }
  }
  return {pdf,LocalBinaryDataFactory};
 })();
 try{return await imoPdfRuntimePromise}catch(e){imoPdfRuntimePromise=null;throw Error('离线 PDF 读取器无法启动。请用当前版本 Chrome / Edge 重新打开本 HTML。'+e.message)}
}
function pdfRows(items,pageNo,width,height){
 const rows=[];
 for(const item of items){
  if(typeof item.str!=='string'||!item.str.trim()||!item.transform)continue;
  const x=item.transform[4],y=item.transform[5],size=Math.abs(item.height)||Math.hypot(item.transform[2],item.transform[3])||10;
  let row=rows.find(r=>Math.abs(r.y-y)<=Math.max(1.5,Math.min(size,r.size)*.18));
  if(!row){row={page:pageNo,y,size,width,height,items:[]};rows.push(row)}
  row.items.push({text:item.str,x,y,width:Math.abs(item.width)||0,size});row.size=Math.max(row.size,size);
 }
 rows.sort((a,b)=>b.y-a.y);
 for(const row of rows){
  row.items.sort((a,b)=>a.x-b.x);row.cells=[];
  for(const item of row.items){const last=row.cells.at(-1),gap=last?item.x-last.right:Infinity;
   if(last&&gap<Math.max(8,item.size*.85)){
    const space=gap>Math.max(.7,item.size*.12)&&!last.text.endsWith(' ')&&!item.text.startsWith(' ')?' ':'';
    last.text+=space+item.text;last.right=Math.max(last.right,item.x+item.width);last.size=Math.max(last.size,item.size);
   }else row.cells.push({text:item.text,x:item.x,right:item.x+item.width,size:item.size});
  }
  row.text=row.cells.map(c=>c.text.trim()).join('  |  ');
 }
 return rows;
}
const pdfLabelRules=[
 {field:'name',re:/^(?:NAME\s+OF\s+(?:SHIP|VESSEL)|(?:SHIP|VESSEL)\s*NAME|船名)\s*[:：]?\s*(.*)$/i,label:'船名'},
 {field:'imo',re:/^(?:IMO(?:\s*(?:NO\.?|NUMBER))?|IMO\s*编号)\s*[:：]?\s*(.*)$/i,label:'IMO NUMBER'},
 {field:'callSign',re:/^(?:CALL\s*SIGN|呼号)\s*[:：]?\s*(.*)$/i,label:'CALL SIGN'},
 {field:'flag',re:/^(?:NATIONALITY(?:\s+OF\s+(?:SHIP|VESSEL))?|FLAG(?:\s*STATE)?|船旗|国籍)\s*[:：]?\s*(.*)$/i,label:'NATIONALITY / FLAG'},
 {field:'registry',re:/^(?:PORT\s+OF\s+REGISTRY|PORT\s+OF\s+REGISTER|PORT\s+OF\s+REGISTRATION|船籍港)\s*[:：]?\s*(.*)$/i,label:'PORT OF REGISTRY'},
 {field:'company',re:/^(?:REGISTERED\s+OWNER|SHIP\s*OWNER|OWNER|船东)\s*[:：]?\s*(.*)$/i,label:'OWNER / 船东',priority:0},
 {field:'company',re:/^(?:ISM\s+MANAGEMENT\s+COMPANY|ISM\s+MANAGER|MANAGEMENT\s+COMPANY|MANAGER|管理公司)\s*[:：]?\s*(.*)$/i,label:'ISM Management Company / 管理公司',priority:1},
 {field:'company',re:/^(?:CHARTERER|租家公司|租家)\s*[:：]?\s*(.*)$/i,label:'CHARTERER / 租家',priority:2},
 {field:'company',re:/^(?:SHIPPING\s+COMPANY|COMPANY\s+NAME|船公司)\s*[:：]?\s*(.*)$/i,label:'Shipping Company',priority:0},
 {field:'netTonnage',re:/^(?:NET\s+(?:REGISTERED\s+)?TONNAGE|NET\s+REGISTER\s+TONNAGE|NRT|净吨|净登记吨位)\s*[:：]?\s*(.*)$/i,label:'NET TONNAGE'},
 {field:'master',re:/^(?:MASTER(?:[’']S)?\s*NAME|NAME\s+OF\s+(?:MASTER|CAPTAIN)|CAPTAIN(?:[’']S)?\s*NAME|船长姓名)\s*[:：]?\s*(.*)$/i,label:'MASTER NAME'}
];
function pdfValueAfter(row,cellIndex,rule){
 const cell=row.cells[cellIndex],match=cell.text.trim().match(rule.re);if(!match)return null;
 let value=match[1]?.trim()||'';
 if(!value){const next=row.cells[cellIndex+1];if(!next||next.x-cell.x>row.width*.47||pdfLabelRules.some(r=>r.re.test(next.text.trim()))||/^(?:IP\s*PHONE|RADIO|MINI\s*[-–]?\s*C|E[-–]?MAIL|MMSI|ANSWER\s*BACK)\b/i.test(next.text.trim()))return null;value=next.text.trim()}
 value=value.replace(/^[:：]\s*/,'').trim();if(!value)return null;
 if(rule.field==='imo'){const m=value.match(/\b\d{7}\b/);return m?m[0]:null}
 if(rule.field==='callSign'){const m=value.match(/^[A-Z0-9-]{3,12}\b/i);return m?m[0]:null}
 if(rule.field==='netTonnage'){const m=value.match(/^([\d,]+(?:\.\d+)?)\b/);return m?m[1].replace(/,/g,''):null}
 return value;
}
function extractShipPdfCandidates(pages){
 const candidates=Object.fromEntries(shipPdfFields.map(([k])=>[k,[]]));
 function add(field,value,row,label,priority=0){
  value=String(value||'').trim();if(!value)return;
  if(!candidates[field].some(c=>c.value===value&&c.page===row.page&&c.label===label))candidates[field].push({value,page:row.page,label,source:row.text,priority});
 }
 for(const page of pages){for(const row of page.rows){for(let i=0;i<row.cells.length;i++)for(const rule of pdfLabelRules){const value=pdfValueAfter(row,i,rule);if(value)add(rule.field,value,row,rule.label,rule.priority||0)}}
  // Match INTERNATIONAL '69 to the geometrically aligned NET column.
  for(const row of page.rows){
   if(!row.cells.some(c=>/^(?:INTERNATIONAL\b.*(?:69|1969)|ITC\s*[’']?\s*(?:69|1969))/i.test(c.text.trim())))continue;
   const header=page.rows.filter(h=>h.y>row.y&&h.y-row.y<85&&h.cells.some(c=>/^NET$/i.test(c.text.trim()))&&h.cells.some(c=>/^GROSS$/i.test(c.text.trim()))).sort((a,b)=>a.y-b.y)[0];
   if(!header)continue;
   const net=header.cells.find(c=>/^NET$/i.test(c.text.trim())),gross=header.cells.find(c=>/^GROSS$/i.test(c.text.trim()));
   const nx=(net.x+net.right)/2,gx=(gross.x+gross.right)/2,tolerance=Math.max(18,Math.abs(nx-gx)*.47);
   const values=row.cells.filter(c=>/^[\d,]+(?:\.\d+)?$/.test(c.text.trim())&&Math.abs((c.x+c.right)/2-nx)<=tolerance).sort((a,b)=>Math.abs((a.x+a.right)/2-nx)-Math.abs((b.x+b.right)/2-nx));
   if(values.length)add('netTonnage',values[0].text.replace(/,/g,''),row,"INTERNATIONAL ’69 / NET",-1);
  }
 }
 if(!candidates.name.length){
  const titleRows=pages.flatMap(p=>p.rows.filter(r=>r.y>p.height*.72&&r.page===1&&r.text.trim().length>=3&&r.text.length<=85&&!/(?:particulars|communication|specification|ship\s+information|船舶资料|技术参数)/i.test(r.text)&&!/[\d@]|\|/.test(r.text)));
  titleRows.sort((a,b)=>b.size-a.size||b.y-a.y);const title=titleRows[0];if(title)add('name',title.cells.map(c=>c.text.trim()).join(' '),title,'页首大字标题候选，请核对',10);
 }
 for(const list of Object.values(candidates))list.sort((a,b)=>a.priority-b.priority||a.page-b.page);
 return candidates;
}
async function readShipPdf(file){
 if(!file||file.size>25*1024*1024)throw Error('请选择不超过 25MB 的 PDF 文件。');
 const raw=new Uint8Array(await file.arrayBuffer());
 if(!new TextDecoder('latin1').decode(raw.subarray(0,1024)).includes('%PDF-'))throw Error('该文件不是可识别的 PDF。');
 const {pdf,LocalBinaryDataFactory}=await localPdfRuntime();
 const loading=pdf.getDocument({data:raw,BinaryDataFactory:LocalBinaryDataFactory,useWorkerFetch:false,useWasm:false,isEvalSupported:false,disableFontFace:true,useSystemFonts:true,stopAtErrors:true,enableXfa:false,verbosity:0});
 let timer,doc;let rejectBlocked;
 const blocked=new Promise((_,reject)=>{rejectBlocked=reject});
 loading.onPassword=()=>{rejectBlocked(Error('此 PDF 有密码保护；请先提供未加密版本，本次未导入任何资料。'));void loading.destroy().catch(()=>{})};
 timer=setTimeout(()=>{rejectBlocked(Error('PDF 读取超过 60 秒，已停止；请检查文件是否损坏或过大。'));void loading.destroy().catch(()=>{})},60000);
 try{
  doc=await Promise.race([loading.promise,blocked]);if(doc.numPages>50)throw Error('PDF 超过 50 页，请选择船舶资料相关页面的文件。');
  const pages=[];
  for(let i=1;i<=doc.numPages;i++){
   $('#status').textContent='正在本地读取船舶资料 PDF：第 '+i+' / '+doc.numPages+' 页';
   const page=await doc.getPage(i),viewport=page.getViewport({scale:1});
   const content=await Promise.race([page.getTextContent({includeMarkedContent:false,disableNormalization:false}),blocked]);
   if(content.items.length>60000)throw Error('PDF 单页文字内容过多，请拆分资料后读取。');
   const rows=pdfRows(content.items,i,viewport.width,viewport.height);pages.push({page:i,width:viewport.width,height:viewport.height,rows,text:rows.map(r=>r.text).join('\n')});page.cleanup();
  }
  if(pages.reduce((n,p)=>n+p.text.replace(/\s/g,'').length,0)<20)throw Error('PDF 中没有足够的可提取文字，可能是扫描件。本版不包含 OCR；本次未导入任何资料。');
  const candidates=extractShipPdfCandidates(pages);
  if(!Object.values(candidates).some(a=>a.length))throw Error('已读取 PDF 文字，但未识别到船舶档案字段。请查看文件格式，或在“船舶档案”手工填写；本次未自动导入。');
  return {fileName:file.name,pageCount:pages.length,pages,candidates};
 }finally{clearTimeout(timer);await loading.destroy().catch(()=>{})}
}
function showShipPdfImport(result){
 shipPdfPending=result;
 modal('核对 PDF 船舶资料 · '+result.fileName,`<div class="note">已在本地读取 ${result.pageCount} 页。只导入勾选的船舶静态字段；本次港口、日期、名单和健康答案均不改动。PDF 原文件不包含在 HTML 或工程文件中。</div><p class="muted">公司可能包括船东、管理公司和租家：均列为候选，存在 OWNER 时优先显示船东，请按实际用途选择。国际净吨与苏伊士 / 巴拿马吨位分开识别；设计定员不作为本次人数。</p><div class="tablewrap pdf-field-wrap"><table class="pdf-import-table"><thead><tr><th>导入</th><th>字段</th><th>当前档案</th><th>PDF 候选值（可编辑）</th><th>来源</th></tr></thead><tbody>${shipPdfFields.map(([key,label])=>{
  const list=result.candidates[key],first=list[0];
  return `<tr><td><input type="checkbox" data-pdf-check="${key}" ${first?'checked':'disabled'} aria-label="导入${esc(label)}"></td><td>${esc(label)}${list.length>1?'<br><span class="badge warn">'+list.length+' 个候选</span>':''}</td><td>${esc(state.ship[key]||'未填写')}</td><td>${first?`<select data-pdf-select="${key}" aria-label="${esc(label)}候选">${list.map((c,i)=>`<option value="${i}">${esc(c.value)} · 第 ${c.page} 页 / ${esc(c.label)}</option>`).join('')}</select><input data-pdf-value="${key}" value="${esc(first.value)}" aria-label="${esc(label)}导入值" style="margin-top:6px">`:'<span class="muted">未识别，不覆盖现值</span>'}</td><td data-pdf-source="${key}" style="min-width:240px">${first?'第 '+first.page+' 页 / '+esc(first.label)+'<br><span class="muted">'+esc(first.source)+'</span>':'请另行填写；不会从电话、邮箱或其他栏推断。'}</td></tr>`
 }).join('')}</tbody></table></div><details><summary>查看 PDF 原始提取文字（数据参考）</summary>${result.pages.map(p=>`<h3>第 ${p.page} 页</h3><textarea readonly style="min-height:260px;font:12px/1.6 Consolas,monospace" aria-label="PDF 第 ${p.page} 页原始文字">${esc(p.text)}</textarea>`).join('')}</details>`,`<button data-action="closeModal">取消</button><button class="primary" data-action="applyShipPdf">导入勾选字段，去确认船舶档案</button>`);
}
function applyShipPdfImport(){
 if(!shipPdfPending)throw Error('尚未读取 PDF。');const picked=[];
 for(const check of $$('[data-pdf-check]:checked')){
  const field=check.dataset.pdfCheck,input=document.querySelector('[data-pdf-value="'+field+'"]'),select=document.querySelector('[data-pdf-select="'+field+'"]'),value=input?.value.trim();
  if(!value)throw Error(shipPdfFields.find(x=>x[0]===field)[1]+' 的导入值为空，请填写或取消勾选。');
  if(field==='imo'&&!/^\d{7}$/.test(value))throw Error('IMO 编号应为 7 位数字，请核对 PDF 候选值。');
  if(field==='netTonnage'&&(!Number.isFinite(+value)||+value<0))throw Error('净吨应为非负数，请核对国际吨位表的 NET 栏。');
  const candidate=shipPdfPending.candidates[field][+select.value];picked.push({field,value,page:candidate.page,label:candidate.label,extractedValue:candidate.value});
 }
 if(!picked.length)throw Error('请至少勾选一个可导入字段。');
 for(const item of picked)state.ship[item.field]=item.value;
 state.ship.pdfSource={fileName:shipPdfPending.fileName,pageCount:shipPdfPending.pageCount,importedAt:new Date().toISOString(),fields:picked};
 state.ship.confirmed=false;changed();closeModal();currentView='ship';render();toast('已导入 '+picked.length+' 个船舶字段，请核对后确认船舶档案。');shipPdfPending=null;
}
function shipPdfSourceNote(){const source=state.ship.pdfSource;if(!source||typeof source!=='object')return '';return `<div class="note">上次 PDF 导入来源：${esc(source.fileName)}（${esc(source.pageCount)} 页）。工程保存导入后的字段和来源记录，不保存 PDF 原文件。</div>`}
actions.pickShipPdf=()=>$('#shipPdfFile').click();
actions.applyShipPdf=applyShipPdfImport;
$('#shipPdfFile').addEventListener('change',e=>{const file=e.target.files[0];e.target.value='';if(file)task(async()=>{shipPdfPending=null;showShipPdfImport(await readShipPdf(file))})});
document.addEventListener('change',e=>{const select=e.target;if(!select.dataset.pdfSelect||!shipPdfPending)return;const field=select.dataset.pdfSelect,c=shipPdfPending.candidates[field][+select.value];document.querySelector('[data-pdf-value="'+field+'"]').value=c.value;document.querySelector('[data-pdf-source="'+field+'"]').innerHTML='第 '+c.page+' 页 / '+esc(c.label)+'<br><span class="muted">'+esc(c.source)+'</span>'});
IMOApp.pdfImport={readShipPdf,extractShipPdfCandidates,pdfRows};
