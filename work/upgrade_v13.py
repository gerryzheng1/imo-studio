from pathlib import Path
import json
P=Path(__file__).parent
def replace(file,old,new):
    p=P/file;s=p.read_text(encoding='utf-8');assert old in s,(file,old[:80]);s=s.replace(old,new);p.write_text(s,encoding='utf-8')

for name in ['config.json','default-config.json']:
    p=P/name;c=json.loads(p.read_text(encoding='utf-8'))
    s=next(t for t in c['templates']if t['id']==9)['sheets'][0]
    s['fields']=[f for f in s['fields']if not f['key'].startswith('nil.')]
    s['table']={'source':'nilItems','rows':list(range(22,32)),'columns':{'name':'E','value':'K'},'clear':['E22:K31']}
    s['titlePage']='B16'
    p.write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')

replace('core.js',"nil:Object.fromEntries(nilKeys.map(k=>[k,''])),preferences:","nil:Object.fromEntries(nilKeys.map(k=>[k,''])),nilItems:defaultNilItems(),preferences:")
replace('core.js',"if(source==='stores'){","if(source==='ports')return portOutputSelection().rows;\n if(source==='nilItems')return activeNilItems().map(r=>({...r,value:state.nil[r.key]??''}));\n if(source==='stores'){")
replace('core.js',"const textFields=new Set(","schemaPlaceholderV13();\nconst textFields=new Set(")
# Function declaration is hoisted; schema is augmented immediately after its declaration instead.
replace('core.js','schemaPlaceholderV13();\n','')

replace('engine.js','function checkConfiguration(config){','function checkConfiguration(config){\n config=migrateNilMapping(config);')
replace('engine.js',"for(const k of [side+'Date',side==='arrival'?'signArrival':'signDeparture'])", "for(const k of [side+'Date',...(isOutputKeyEnabled(r.id,'$signatureDate')?[side==='arrival'?'signArrival':'signDeparture']:[])])")
start="  if(r.id===9){nilKeys.forEach"
p=P/'engine.js';s=p.read_text(encoding='utf-8');lines=s.splitlines();lines=["  if(r.id===9)checkNilItems(r);"if line.startswith(start)else line for line in lines];s='\n'.join(lines)+'\n';p.write_text(s,encoding='utf-8')
replace('engine.js','state.nil.stowaways',"nilAnswer('stowaways')")
replace('engine.js','state.nil.animals',"nilAnswer('animals')")
replace('engine.js',"const mode=state.declarations[source],rows=source==='cases'?caseRecords():state[source];", "const mode=state.declarations[source],allRows=source==='cases'?caseRecords():state[source],rows=source==='ports'?portOutputSelection().rows:allRows;\n if(source==='ports'){const selection=portOutputSelection();r.notes.push('历史共 '+allRows.length+' 条，本次按离港日期由近到远输出 '+rows.length+' 条（最多 10 条）；较早 '+selection.older.length+' 条、晚于本次到港日期 '+selection.future.length+' 条保留在工程，不写入清单。');}")
replace('engine.js',"if(mode==='none'&&rows.length){r.errors.push(source+' 已选“无”但仍有 '+rows.length", "if(mode==='none'&&allRows.length){r.errors.push(source+' 已选“无”但仍有 '+allRows.length")
replace('engine.js',"if(mode==='records'&&!rows.length)r.errors.push(source+' 已选“有记录”但表格为空');", "if(mode==='records'&&!rows.length)r.errors.push(source==='ports'?'当前到港日期之前没有可输出的历史港口，请核查日期或明确选择“无记录”。':source+' 已选“有记录”但表格为空');")
replace('engine.js',"for(const f of sc.fields||[]){let value=getPath(ctx,f.key);", "for(const f of sc.fields||[]){if(!isOutputFieldEnabled(id,sc,f)){clearCell(ensureCell(doc,f.cell));continue}let value=getPath(ctx,f.key);")
replace('engine.js',"const dateFormula=dateValue(effectiveDate(id))===iso?f.dateRef:", "const dateRefField=sc.fields.find(x=>x.cell===f.dateRef),dateFormula=dateValue(effectiveDate(id))===iso&&(!dateRefField||isOutputFieldEnabled(id,sc,dateRefField))?f.dateRef:")
replace('engine.js',"for(const [field,col]of Object.entries(t.columns)){let value=", "for(const [field,col]of Object.entries(t.columns)){if(!isOutputColumnEnabled(id,sc,field)){clearCell(ensureCell(doc,col+t.rows[i]));continue}let value=")
replace('engine.js',"  book.zip.file(sh.path,xml(doc));", "  for(const ref of suppressedOutputCells(id,sc))clearCell(ensureCell(doc,ref));\n  book.zip.file(sh.path,xml(doc));")
replace('engine.js',"  r.errors=[...new Set(r.errors)];", "  const omitted=outputOmissions(r.id);if(omitted.length)r.notes.push('按你的选择清空 '+omitted.length+' 个输出项目：'+omitted.join('、')+'。资料仍保存在工程中。');\n  r.errors=[...new Set(r.errors)];")

replace('visual.js',"if(f.type==='masterFormula')value=state.ship.master;", "if(!isOutputFieldEnabled(id,sc,f)){values.set(f.cell,'');continue}if(f.type==='masterFormula')value=state.ship.master;")
replace('visual.js',"for(const [k,col]of Object.entries(t.columns)){let v=", "for(const [k,col]of Object.entries(t.columns)){if(!isOutputColumnEnabled(id,sc,k)){values.set(col+t.rows[i],'');continue}let v=")
replace('visual.js',"return values}\nfunction sheetGeometry", "for(const ref of suppressedOutputCells(id,sc))values.set(ref,'');return values}\nfunction sheetGeometry")
replace('visual.js',"const f=sc.fields.find(f=>f.cell===ref);if(f)return", "const f=sc.fields.find(f=>f.cell===ref);if(f&&typeof graphic!=='undefined'&&graphic?.mode==='write'&&!isOutputFieldEnabled(graphic.id,sc,f))return {kind:'omitted',label:'已取消输出：'+fieldLabel(f.key),field:f};if(f)return")
replace('visual.js',"if(role.field&&$('#graphicField'))", "if(role.field||role.kind==='static')$('#graphicCellInfo').insertAdjacentHTML('beforeend',graphicOutputToggle(graphic.id,graphic.plan.s,ref,role));if(role.field&&$('#graphicField'))")
replace('visual.js',"if(key.startsWith('nil.'))return nilLabels[nilKeys.indexOf(key.slice(4))]||'NIL 申报';", "if(key.startsWith('nil.'))return nilLabels[nilKeys.indexOf(key.slice(4))]||'NIL 申报';")

replace('app.html','离线办公版 1.2','离线办公版 1.3')
replace('app.html','<script>__PROJECT_STORAGE__</script>','<script>__PROJECT_STORAGE__</script>\n<script>__EDITORS__</script>\n<script>__OUTPUT_OPTIONS__</script>\n<script>__HELP__</script>')
replace('build.py',"('PROJECT_STORAGE','project_storage.js')", "('PROJECT_STORAGE','project_storage.js'),('EDITORS','editors.js'),('OUTPUT_OPTIONS','output_options.js'),('HELP','help.js')")
print('v1.3 source wiring and OOXML edits ready')
