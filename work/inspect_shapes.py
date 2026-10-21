import pathlib,zipfile,re,xml.etree.ElementTree as E,json
P=pathlib.Path(__file__).parent
for p in sorted((P/'templates').glob('*.xlsx')):
 with zipfile.ZipFile(p) as z:
  for part in z.namelist():
   if part.endswith('.vml') or part.endswith('.xml') and ('drawing' in part.lower() or 'comments' in part.lower()):
    raw=z.read(part).decode('utf-8')
    r=E.fromstring(raw)
    texts=[(el.tag,el.attrib,el.text) for el in r.iter() if el.text and el.text.strip()]
    if part.endswith('.vml') or texts:
     print(p.name,part);print(json.dumps(texts,ensure_ascii=True))
     if part.endswith('.vml'):
      out=P/'vml'/p.name/(part.replace('/','_')+'.txt');out.parent.mkdir(parents=True,exist_ok=True);out.write_text(raw,encoding='utf-8')
      print(json.dumps(raw,ensure_ascii=True))
