import zipfile,io,pathlib,json,xml.etree.ElementTree as ET,posixpath,re
P=pathlib.Path(__file__).parent
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
cfg=json.loads((P/'config.json').read_text(encoding='utf-8'))
original=json.loads((P/'inventory.json').read_text(encoding='utf-8'))
result=[]
out=P/'default-input'/'templates';out.mkdir(exist_ok=True)
with zipfile.ZipFile(P/'default-input'/'blank-templates.zip') as outer:
 for entry in outer.infolist():
  if not entry.filename.lower().endswith('.xlsx'):continue
  raw=outer.read(entry);name=pathlib.PurePosixPath(entry.filename.replace('\\','/')).name
  number=re.match(r'\d+',name)
  if not number:raise ValueError('Unnumbered template: '+name)
  tid=int(number[0]);c=next(x for x in cfg['templates'] if x['id']==tid)
  old=next(x for x in original if x['id']==tid)
  (out/name).write_bytes(raw)
  with zipfile.ZipFile(io.BytesIO(raw)) as z:
   strings=[''.join(si.itertext()) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))] if 'xl/sharedStrings.xml' in z.namelist() else []
   rel={r.get('Id'):r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
   wb=ET.fromstring(z.read('xl/workbook.xml'))
   b={'id':tid,'name':name,'size':len(raw),'sheets':[],'issues':[]}
   for i,sh in enumerate(wb.findall('s:sheets/s:sheet',NS)):
    target=rel[sh.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')]
    path=posixpath.normpath(posixpath.join('xl',target)) if not target.startswith('/') else target[1:]
    root=ET.fromstring(z.read(path));cells={}
    for ce in root.findall('.//s:sheetData/s:row/s:c',NS):
     v=ce.find('s:v',NS);v=v.text or '' if v is not None else ''
     if ce.get('t')=='s':v=strings[int(v)] if v else ''
     elif ce.get('t')=='inlineStr':v=''.join(ce.find('s:is',NS).itertext())
     if v or ce.find('s:f',NS) is not None:cells[ce.get('r')]={'v':v,'f':ce.findtext('s:f',None,NS)}
    s={'name':sh.get('name'),'path':path,'dimension':root.find('s:dimension',NS).get('ref'),'merges':[m.get('ref') for m in root.findall('s:mergeCells/s:mergeCell',NS)],'cells':cells,'formulas':{k:v for k,v in cells.items() if v['f'] is not None}}
    b['sheets'].append(s)
    expected=c['sheets'][i] if i<len(c['sheets']) else None
    if not expected or s['name']!=expected['name']:b['issues'].append('Sheet name/order changed '+s['name']);continue
    for key in ['dimension']:
     if s[key]!=old['sheets'][i][key]:b['issues'].append(key+' changed '+s['name'])
    if set(s['merges'])!=set(expected['expectedMerges']):b['issues'].append('Merges changed '+s['name'])
    for ref,value in expected.get('expectedLabels',{}).items():
     if cells.get(ref,{}).get('v','')!=value:b['issues'].append('Label differs '+s['name']+' '+ref+' '+value)
   b['media']=[n for n in z.namelist() if n.startswith('xl/media/') and not n.endswith('/')]
   result.append(b)
result.sort(key=lambda b:b['id'])
(P/'default-input'/'inventory.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps([{k:b[k] for k in ['id','name','size','issues','media']}|{'sheets':[{'name':s['name'],'dimension':s['dimension'],'nonempty':len(s['cells']),'formulas':s['formulas']} for s in b['sheets']]} for b in result],ensure_ascii=False,indent=2))
