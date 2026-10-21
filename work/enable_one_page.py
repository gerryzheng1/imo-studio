from pathlib import Path
P=Path(__file__).parent
def rep(name,a,b):
 p=P/name;s=p.read_text(encoding='utf-8');assert a in s,(name,a[:100]);p.write_text(s.replace(a,b),encoding='utf-8')
rep('app.html','<script>__ENGINE__</script>','<script>__LAYOUT__</script>\n<script>__ENGINE__</script>')
rep('build.py',"for key,name in [('DEFAULTS'", "for key,name in [('LAYOUT','layout.js'),('DEFAULTS'")
rep('build.py',"('ENGINE','engine.js'),('UI','ui.js')", "('LAYOUT','layout.js'),('ENGINE','engine.js'),('UI','ui.js')")
p=P/'engine.js';s=p.read_text(encoding='utf-8');a=s.index(' const plans=[];for(const sc of cfg.sheets)');b=s.index('\n let masterRef',a)
s=s[:a]+" const plans=[];for(const originalConfig of cfg.sheets){const sh=book.sheets.find(s=>s.name===originalConfig.name),source=originalConfig.table?.source,records=source?(source==='cases'?caseRecords():sectionRecords(source,id)):[],sc=sheetLayout(originalConfig,records),baseTitle=originalConfig.titlePage?cellText(sh.cells.get(originalConfig.titlePage),book.strings):'';await applyBookLayout(book,sh,sc);plans.push({sc,sh,baseTitle,rows:records,page:1,total:1,offset:0})}"+s[b:]
a=s.index('  for(const sh of c.sheets)if(sh.table)');b=s.index('\n  if([1,2].includes(r.id))',a)
s=s[:a]+"  for(const sh of c.sheets){r.pages++;if(sh.table){try{const rec=sh.table.source==='cases'?caseRecords():sectionRecords(sh.table.source,r.id),layout=sheetLayout(sh,rec);if(layout._insert)r.notes.push(sh.name+'：插入 '+layout._insert.count+' 行，完整输出 '+rec.length+' 条；表头及签署区保留，本表缩放为 1 页打印。');if(rec.length>sh.table.rows.length)r.warnings.push(sh.name+' 记录超过原容量，已插入行并缩放成一页；打印字号会缩小，请核查可读性。');if(sh.table.source==='stores')r.notes.push('物料按存放位置列大类标题，再列各项名称、数量及单位。')}catch(e){r.errors.push(e.message)}}}r.notes.push(r.id===6?'主表与病例附表各 1 页；保留两张原工作表，不生成续页。':'各原工作表设为宽 1 页、高 1 页；不生成续页。');"+s[b:]
p.write_text(s,encoding='utf-8')
p=P/'visual.js';s=p.read_text(encoding='utf-8');a=s.index('function graphicPlans(');b=s.index('\nfunction inRange',a)
s=s[:a]+"function graphicPlans(id,mode){const c=CONFIG.templates.find(c=>c.id===id);return c.sheets.map(original=>{const records=original.table?(original.table.source==='cases'?caseRecords():sectionRecords(original.table.source,id)):[];return {s:mode==='write'?sheetLayout(original,records):original,rows:mode==='write'?records:[],index:0,total:1,offset:0}})}"+s[b:]
s=s.replace("sh=entry.book.sheets.find(s=>s.name===plan.s.name),geo=sheetGeometry(sh)","original=entry.book.sheets.find(s=>s.name===plan.s.name),sh=mode==='write'?{...original,doc:parseXML(xml(original.doc)),_insert:plan.s._insert}:original,_layoutApplied=mode==='write'?(insertDetailRows(sh.doc,plan.s._insert),setOnePagePrint(sh.doc),sh.cells=new Map(allCells(sh.doc).map(c=>[c.getAttribute('r'),c])),true):false,geo=sheetGeometry(sh)")
s=s.replace("(geo.ys[get(from,'row')]||25)","(geo.ys[get(from,'row')+(mode==='write'&&sc._insert&&get(from,'row')>=sc._insert.at-1?sc._insert.count:0)]||25)")
s=s.replace("(geo.ys[get(to,'row')]||geo.ys.at(-1))", "(geo.ys[get(to,'row')+(mode==='write'&&sc._insert&&get(to,'row')>=sc._insert.at-1?sc._insert.count:0)]||geo.ys.at(-1))")
s=s.replace("area.replace(/(?:'", "(sh._insert?shiftA1(area,sh._insert.at,sh._insert.count):area).replace(/(?:'")
s=s.replace('工作表${mode===\'write\'?\' / 续页\':\'\'}','工作表')
s=s.replace("'每页容量 <b>'+plan.s.table.rows.length+'</b> 行'","'明细 <b>'+plan.rows.length+'</b> 条 · 本表 1 页打印'")
s=s.replace('超出每页容量会按原版续页。','超出原有行数时插入明细行，签署区下移，本表缩放为 1 页打印。')
p.write_text(s,encoding='utf-8')
for name in ['ports.js','output_options.js','ui.js']:
 p=P/name;s=p.read_text(encoding='utf-8');s=s.replace('每页最多 10 项，超出时生成原版续页。','超过原有 10 项时插入行，签署区下移，整表缩放为 1 页打印。').replace('超过原容量 10 条时生成原版续页，不截断记录。','输出最近 10 条，本表保持 1 页打印。').replace('超过 32 个打印行时生成续页。','超过原有行数时插入行，本表缩放为 1 页打印。')
 p.write_text(s,encoding='utf-8')
print('One-page sheet layout enabled')
