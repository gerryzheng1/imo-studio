from pathlib import Path
import json
P=Path(__file__).parent
f=P/'core.js';s=f.read_text(encoding='utf-8').replace("'See storage locations in article rows.'","storeStorageSummary()")
f.write_text(s,encoding='utf-8')
f=P/'engine.js';s=f.read_text(encoding='utf-8').replace('物料位置写在对应物料下方的 Storage 明细行；整条物料与位置保持同页。','物料先按存放位置列分类标题，再列名称、数量和单位；跨页重复分类标题，标题至少与一项物料同页。')
f.write_text(s,encoding='utf-8')
for name in ['config.json','default-config.json']:
 f=P/name;c=json.loads(f.read_text(encoding='utf-8'));c['templates'][4]['sheets'][0]['table']['headerStyleCell']='B12';f.write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
f=P/'defaults.js';s=f.read_text(encoding='utf-8')
s=s.replace("if(e?.mapping){CONFIG.templates[CONFIG.templates.findIndex(c=>c.id===id)]=structuredClone(e.mapping);changed();render()}","if(e){const mapping=knownTemplateMapping(id,e.book);CONFIG.templates[CONFIG.templates.findIndex(c=>c.id===id)]=structuredClone(mapping);changed();render()}")
f.write_text(s,encoding='utf-8')
f=P/'stores.js';s=f.read_text(encoding='utf-8')
s=s.replace("function storeLocationKey(value){return String(value||'').trim().replace(/\\s*:\\s*$/,'').replace(/\\s+/g,' ').toUpperCase()||'__UNASSIGNED__'}","function storeLocationKey(value){return storageAreaKey(value)}")
s=s.replace("const groups=storeGroups(),selected=groups.find(g=>g.key===storeFilter),visible=storeFilter==='*'?groups.filter(g=>g.rows.length):selected?[selected]:[];if(storeFilter!=='*'&&!selected)storeFilter='*';", "const groups=storeGroups();if(storeFilter!=='*'&&!groups.some(g=>g.key===storeFilter))storeFilter='*';const selected=groups.find(g=>g.key===storeFilter),visible=storeFilter==='*'?groups.filter(g=>g.rows.length):selected?[selected]:[];")
s=s.replace('数量、单位和存放位置写入原模板，超量自动追加原版工作表。','生成时先列存放位置大类，再列物料、数量和单位；同类跨页自动重复分类标题。')
f.write_text(s,encoding='utf-8')
f=P/'ui.js';s=f.read_text(encoding='utf-8')
s=s.replace('位置写在对应物料下方的 Storage 行，并保持同页；超过 32 个打印行时生成续页。','生成时按存放位置先列大类，再列物料、数量和单位；跨页重复分类标题，不逐项重复存放位置。')
s=s.replace('逐项位置会写在各物料下方。','空白时从物料分组生成概括说明；详细分类列在物料区。')
s=s.replace('逐项存放位置另占明细行，名称与位置保持同页。','先输出存放位置大类标题，再列名称、数量和单位，不逐项重复 Storage 行。同类跨页时重复大类标题，标题至少与一条物料同页。')
f.write_text(s,encoding='utf-8')
