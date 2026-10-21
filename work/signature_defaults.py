from pathlib import Path
P=Path(__file__).parent
def rep(n,a,b):
 p=P/n;s=p.read_text(encoding='utf-8');assert a in s,(n,a[:70]);p.write_text(s.replace(a,b),encoding='utf-8')
rep('core.js',"function outputFieldId(id,sc,f){return JSON.stringify([id,sc.name,f.key,f.cell])}","function outputFieldId(id,sc,f){return JSON.stringify([id,sc.name,f.key,f._originalCell||f.cell])}")
rep('core.js',"function isOutputFieldEnabled(id,sc,f){const p=outputPolicy();return !(p.keys||[]).includes(f.key)&&!(p.fields||[]).includes(outputFieldId(id,sc,f))&&!(p.cells||[]).includes(outputCellId(id,sc,f.cell))}","""function templateHasSignatureDate(id,sc,f){const book=chosenTemplate(id)?.book,sh=book?.sheets.find(s=>s.name===sc.name),ref=f._originalCell||f.cell,c=sh?.cells.get(ref);if(!c)return false;if(els(c,'f').length||!isBlank(cellText(c,book.strings)))return true;const target=rect(ref);return [...sh.cells].some(([address,cell])=>{const r=rect(address);return r.r1===target.r1&&r.c1<target.c1&&r.c1>=target.c1-4&&/^(date|data|日期|签署日期)\\s*[:：]?$/i.test(cellText(cell,book.strings).trim())})}
function isOutputFieldEnabled(id,sc,f){const p=outputPolicy(),key=f.key==='$master'?'ship.master':f.key,field=outputFieldId(id,sc,f);if((p.keys||[]).includes(key)||(p.fields||[]).includes(field)||(p.cells||[]).includes(outputCellId(id,sc,f._originalCell||f.cell)))return false;if(f.key==='$signatureDate'&&!templateHasSignatureDate(id,sc,f)&&!(p.enabledFields||[]).includes(field))return false;return true}""")
rep('core.js',"return tid===id&&sheet===sc.name?[cell]:[]", "return tid===id&&sheet===sc.name?[sc._insert?shiftA1(cell,sc._insert.at,sc._insert.count):cell]:[]")
rep('core.js',"for(const k of ['keys','fields','columns','cells']){if(!Array.isArray(p[k])", "for(const k of ['keys','fields','columns','cells','enabledFields']){if(k==='enabledFields'&&p[k]===undefined)continue;if(!Array.isArray(p[k])")
rep('output_options.js',"function setOutputChoice(list,value,enabled){", "function setOutputChoice(list,value,enabled){")
rep('output_options.js',"if(!enabled)p[list].push(value);changed()}","if(!enabled)p[list].push(value);if(list==='fields'){p.enabledFields=(p.enabledFields||[]).filter(v=>v!==value);if(enabled)p.enabledFields.push(value)}if(list==='keys'&&value==='$signatureDate'){p.enabledFields=(p.enabledFields||[]).filter(v=>{try{return JSON.parse(v)[2]!=='$signatureDate'}catch{return true}});if(enabled)for(const c of CONFIG.templates)for(const sc of c.sheets)for(const f of sc.fields)if(f.key==='$signatureDate'){const target=outputFieldId(c.id,sc,f);p.enabledFields.push(target);p.fields=(p.fields||[]).filter(v=>v!==target);p.cells=(p.cells||[]).filter(v=>v!==outputCellId(c.id,sc,f.cell))}}changed()}")
rep('output_options.js',"!(policy.keys||[]).includes(key))).join('')", "key==='$signatureDate'?CONFIG.templates.every(c=>isOutputKeyEnabled(c.id,key)):!(policy.keys||[]).includes(key))).join('')")
rep('output_options.js',"['$signatureDate','签署日期（所有文件）']", "['$signatureDate','签署日期（所有文件，勾选后统一添加）']")
rep('output_options.js',"原有边框、合并和打印版式保留，资料仍留在工程中。", "原有边框、合并和打印版式保留，资料仍留在工程中。签署日期默认跟随原模板：原签署区没有日期项的默认不添加，可在下方单独开启。")
rep('output_options.js',"(policy.keys||[]).includes(f.key)?'该字段还受上方全局开关控制':''", "(policy.keys||[]).includes(f.key)?'该字段还受上方全局开关控制':f.key==='$signatureDate'&&!templateHasSignatureDate(c.id,sc,f)?'原模板此处无日期项，默认不输出；勾选可主动添加。':''")
rep('output_options.js',"labelZh='", "labelZh='") if False else None
rep('visual.js',"const FIELD_LABELS={", "const FIELD_LABELS={'$master':'船长签署',")
print('Template-sensitive signature dates enabled')
