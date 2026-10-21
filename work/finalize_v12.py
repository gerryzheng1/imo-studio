from pathlib import Path
P=Path(__file__).parent
f=P/'engine.js';s=f.read_text(encoding='utf-8').replace("if(row._sectionHeader&&field==='name'&&t.headerStyleCell){const original=book.sheets.find(s=>s.name===sc.name)?.cells.get(t.headerStyleCell);", "if(row._sectionHeader&&field==='name'){const original=book.sheets.find(s=>s.name===sc.name)?.cells.get(t.headerStyleCell||t.columns.name+t.rows[0]);")
f.write_text(s,encoding='utf-8')
f=P/'ui.js';s=f.read_text(encoding='utf-8')
s=s.replace('取消后，下次须重新选择模板。','取消后使用恢复时已载入的模板，须核对是否相同版本。')
s=s.replace('不包含模板，下次须重新选择。','不含模板，恢复时使用已载入模板，请核对版本。')
s=s.replace('不含模板时须重新选择原模板。','不含模板时使用已载入模板，须核对版本与映射。')
s=s.replace('不含模板的工程下次需要重新选模板。','不含模板时使用已载入模板，须核对版本。')
f.write_text(s,encoding='utf-8')
