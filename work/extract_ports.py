from pathlib import Path
from pypdf import PdfReader
import re,json
P=Path(__file__).parent/'default-input'
reader=PdfReader(P/'hoegh-port-agents.pdf')
groups=[]
for index,page in enumerate(reader.pages):
 lines=(page.extract_text() or '').splitlines()
 for n,line in enumerate(lines):
  if not line.startswith('Ports:'):continue
  country=lines[n-1].strip() if n else ''
  text=line[6:].strip()
  # The only wrapped ports line continues after a semicolon, or starts with (Aus).
  j=n+1
  while j<len(lines) and (text.endswith((';','-',' Port',' Newport')) or lines[j].strip().startswith('(Aus)')):
   text+=('' if text.endswith('-') else ' ')+lines[j].strip();j+=1
  groups.append({'country':country,'ports':text,'page':index+1})
(P/'port-groups.json').write_text(json.dumps(groups,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(groups,ensure_ascii=False,indent=2))
