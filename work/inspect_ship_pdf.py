from pathlib import Path
from pypdf import PdfReader
import json
P=Path(__file__).parent
file=P/'pdf-input/9.TRTR Ship particulars.pdf'
r=PdfReader(file)
out=[]
print('PAGES',len(r.pages),'ENCRYPTED',r.is_encrypted)
for i,p in enumerate(r.pages):
 text=p.extract_text(extraction_mode='layout')
 out.append({'page':i+1,'text':text})
 print('PAGE',i+1,json.dumps(text,ensure_ascii=True))
(P/'pdf-input/extracted.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
