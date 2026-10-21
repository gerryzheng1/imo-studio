from pathlib import Path
import json
for name in ['PRODUCT.md','work/fusion-direction.md','DESIGN.md','work/fusion_glass.js']:
 s=Path(name).read_text(encoding='utf-8')
 print(json.dumps({'file':name,'cjk':sum('\u4e00'<=c<='\u9fff' for c in s),'literal_question_marks':s.count('?'),'sample':s[:170]},ensure_ascii=True))
