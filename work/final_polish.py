from pathlib import Path
P=Path(__file__).parent
f=P/'engine.js';s=f.read_text(encoding='utf-8')
old="if(row._sectionHeader&&field==='name'){const original=book.sheets.find(s=>s.name===sc.name)?.cells.get(t.headerStyleCell||t.columns.name+t.rows[0]);if(original?.hasAttribute('s'))ensureCell(doc,col+t.rows[i]).setAttribute('s',original.getAttribute('s'))}"
new="if(t.source==='stores'&&field==='name'){const original=book.sheets.find(s=>s.name===sc.name)?.cells.get(row._sectionHeader?(t.headerStyleCell||t.columns.name+t.rows[0]):t.columns.name+(t.bodyStyleRow||t.rows[0]+1)),cell=ensureCell(doc,col+t.rows[i]);if(original?.hasAttribute('s'))cell.setAttribute('s',referenceFontStyle(book,cell.getAttribute('s')||'0',original.getAttribute('s')))}"
assert old in s;s=s.replace(old,new);f.write_text(s,encoding='utf-8')
f=P/'visual.js';s=f.read_text(encoding='utf-8')
s=s.replace("style=sheetStyle(entry.book,cell),height=", "style=sheetStyle(entry.book,cell),height=")
s=s.replace("cells+=`<td tabindex=", "if(mode==='write'&&plan.s.table?.source==='stores'&&plan.s.table.columns.name===colName(col)&&plan.s.table.rows.includes(r)){style.css+=';font-weight:'+(plan.rows[plan.s.table.rows.indexOf(r)]?._sectionHeader?'bold':'normal')}cells+=`<td tabindex=")
f.write_text(s,encoding='utf-8')
f=P/'settings.js';s=f.read_text(encoding='utf-8').replace("'text/tab-separated-values;charset=utf-8')};", "(uiSettings.csvDelimiter==='\\t'?'text/tab-separated-values':'text/csv')+';charset=utf-8')};")
f.write_text(s,encoding='utf-8')
f=P/'ui.js';s=f.read_text(encoding='utf-8')
s=s.replace('保存工程 JSON 下次复用。默认包含所选原始模板，可以取消。含模板的工程能在离线环境完整恢复；不含模板时使用已载入模板，须核对版本与映射。','保存工程到工程文件夹，下次自动恢复；另存为可保留独立备份。总设置中的“导出工程”还可选择不含模板，恢复时须核对模板版本。')
s=s.replace('页面关闭不会自动保存，请主动保存工程。','默认需要主动保存；可在左下角总设置启用定时保存。Windows 启动器默认使用解压目录旁的“保存工程”。')
f.write_text(s,encoding='utf-8')
f=P/'ports.js';s=f.read_text(encoding='utf-8').replace('<h2>新增的常用操作</h2>','<h2>新增的常用操作</h2><p>左下角“总设置”可调整主题、字号、表格密度、快捷键、保存位置、历史数量及自动恢复。Windows 用户双击随包启动器可直接保存到解压目录的“保存工程”，按日期时间命名，默认保留最新 10 份。直接 HTML 首次写入需要浏览器目录授权。</p>')
f.write_text(s,encoding='utf-8')
