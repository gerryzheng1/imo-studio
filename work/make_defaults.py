"""Derive a second, explicitly inspected mapping; clean only mapped dynamic cells."""
import pathlib,json,zipfile,xml.etree.ElementTree as ET,copy,re
P=pathlib.Path(__file__).parent
cfg=json.loads((P/'config.json').read_text(encoding='utf-8'))
inv=json.loads((P/'default-input'/'inventory.json').read_text(encoding='utf-8'))
sc=cfg['templates'][2]['sheets'][0]
sc['fields']=[{'cell':'B7','key':'ship.name'},{'cell':'B9','key':'ship.flag'},{'cell':'I8','key':'effectsDeclaration'},{'cell':'I34','key':'ship.master','prefix':'Master: '},{'cell':'B34','key':'$signatureDate','prefix':'Date: '}]
sc['table']['rows']=list(range(11,32));sc['table']['clear']=['B11:J31']
for c,b in zip(cfg['templates'],inv):
 for s,source in zip(c['sheets'],b['sheets']):
  s['expectedMerges']=source['merges'];s['expectedDimension']=source['dimension']
  # Labels are compared with whitespace-insensitive normalization by the engine.
  if c['id']==3:
   refs=['B3','B6','I6','J6','B8']+[chr(k)+'10' for k in range(ord('B'),ord('J')+1)]+['B32','I35']
   s['expectedLabels']={r:source['cells'][r]['v'] for r in refs}
  else:
   s['expectedLabels']={r:source['cells'].get(r,{}).get('v',v) for r,v in s.get('expectedLabels',{}).items()}
(P/'default-config.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2),encoding='utf-8')
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def num(c):
 n=0
 for x in c:n=n*26+ord(x)-64
 return n
def rect(ref):
 a=ref.split(':');b=a[-1];a=a[0];x=re.fullmatch(r'([A-Z]+)(\d+)',a);y=re.fullmatch(r'([A-Z]+)(\d+)',b)
 return num(x[1]),int(x[2]),num(y[1]),int(y[2])
def inside(ref,r):
 c,row,_,_=rect(ref);a,b,d,e=rect(r);return a<=c<=d and b<=row<=e
cleaned=P/'default-input'/'cleaned';cleaned.mkdir(exist_ok=True)
report=[]
for c,b in zip(cfg['templates'],inv):
 src=P/'default-input'/'templates'/b['name'];dest=cleaned/b['name']
 with zipfile.ZipFile(src) as z:
  changes={};clean_count=0
  for sc,sh in zip(c['sheets'],b['sheets']):
   ranges=list(sc.get('clear',[]))+list((sc.get('table') or {}).get('clear',[]))+[f['cell'] for f in sc['fields'] if f.get('type') not in ['masterFormula','signatureFormula']]
   if sc.get('page'):ranges.append(sc['page'])
   raw=z.read(sh['path']).decode('utf-8')
   def clear(match):
    global clean_count
    chunk=match[0];ref=re.search(r'\br="([A-Z]+\d+)"',chunk)[1]
    if not any(inside(ref,r) for r in ranges):return chunk
    clean_count+=1
    chunk=re.sub(r'\s+t="[^"]*"','',chunk,count=1)
    return re.sub(r'<(?:\w+:)?(?:v|f|is)\b[^>]*(?:/>|>[\s\S]*?</(?:\w+:)?(?:v|f|is)>)','',chunk)
   raw=re.sub(r'<c\b[^>]*?(?:/>|>[\s\S]*?</c>)',clear,raw)
   # No old formula cache even in the supplied blank pack.
   raw=re.sub(r'(<f\b[^>]*>[^<]*</f>)\s*<v>[^<]*</v>',r'\1',raw)
   changes[sh['path']]=raw.encode('utf-8')
  # Keep original string indexes and rich text; blank only unused entries.
  used=set()
  for sh in b['sheets']:
   root=ET.fromstring(changes[sh['path']])
   for cell in root.findall('.//s:sheetData/s:row/s:c',NS):
    if cell.get('t')=='s':used.add(int(cell.findtext('s:v',default='0',namespaces=NS)))
  if 'xl/sharedStrings.xml' in z.namelist():
   index=[0]
   def ss(m):
    i=index[0];index[0]+=1
    return m[0] if i in used else '<si><t/></si>'
   changes['xl/sharedStrings.xml']=re.sub(r'<si\b[^>]*(?:/>|>[\s\S]*?</si>)',ss,z.read('xl/sharedStrings.xml').decode('utf-8')).encode('utf-8')
  with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as out:
   for info in z.infolist():out.writestr(info,changes.get(info.filename,z.read(info.filename)))
 report.append({'id':c['id'],'file':dest.name,'clearedCells':clean_count})
with zipfile.ZipFile(P/'default-templates.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for f in sorted(cleaned.glob('*.xlsx')):z.write(f,f.name)
(P/'default-input'/'cleaning-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
