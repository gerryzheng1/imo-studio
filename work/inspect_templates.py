import zipfile, xml.etree.ElementTree as ET, json, pathlib, re, posixpath
BASE=pathlib.Path(__file__).parent
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
def tag(e):return e.tag.split('}')[-1]
report=[]; books=[]
for p in sorted((BASE/'templates').glob('*.xlsx'),key=lambda p:int(re.match(r'\d+',p.name)[0])):
 with zipfile.ZipFile(p) as z:
  ss=[]
  if 'xl/sharedStrings.xml' in z.namelist():
   ss=[''.join(x.itertext()) for x in ET.fromstring(z.read('xl/sharedStrings.xml'))]
  wb=ET.fromstring(z.read('xl/workbook.xml'))
  rels={x.get('Id'):x.get('Target') for x in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
  book={'id':int(re.match(r'\d+',p.name)[0]),'name':p.name,'parts':z.namelist(),'sheets':[],'definedNames':[(x.attrib,x.text) for x in wb.findall('s:definedNames/s:definedName',NS)]}
  report.append('\n=== '+p.name+' ===\nNAMES '+json.dumps(book['definedNames'],ensure_ascii=False))
  for s in wb.findall('s:sheets/s:sheet',NS):
   path=posixpath.normpath(posixpath.join('xl',rels[s.get('{'+NS['r']+'}id')]))
   root=ET.fromstring(z.read(path))
   cells={}; formulas={}
   for c in root.findall('.//s:sheetData/s:row/s:c',NS):
    v=c.find('s:v',NS); t=c.get('t')
    value=(v.text or '') if v is not None else ''
    if t=='s':value=ss[int(value)] if value else ''
    if t=='inlineStr':value=''.join(c.find('s:is',NS).itertext())
    f=c.find('s:f',NS)
    if f is not None:formulas[c.get('r')]={'text':f.text,'attr':f.attrib,'cache':value}
    if value or f is not None: cells[c.get('r')]={'v':value,'t':t,'s':c.get('s'),'f':f.text if f is not None else None}
   sh={'name':s.get('name'),'state':s.get('state'),'path':path,'dimension':root.find('s:dimension',NS).get('ref') if root.find('s:dimension',NS) is not None else '', 'cells':cells,'formulas':formulas,'merges':[x.get('ref') for x in root.findall('s:mergeCells/s:mergeCell',NS)],'print':{tag(x):ET.tostring(x,encoding='unicode') for x in root if tag(x) in ['pageSetup','pageMargins','printOptions','headerFooter','rowBreaks','colBreaks','sheetPr']},'rows':{r.get('r'):r.attrib for r in root.findall('s:sheetData/s:row',NS)}}
   relpath=posixpath.join(posixpath.dirname(path),'_rels',posixpath.basename(path)+'.rels')
   if relpath in z.namelist():sh['rels']=z.read(relpath).decode()
   book['sheets'].append(sh)
   report.append('-- SHEET '+sh['name']+' '+sh['path']+' '+str(sh['dimension'])+' --\nMERGES '+', '.join(sh['merges'])+'\nPRINT '+json.dumps(sh['print'],ensure_ascii=False))
   for row in root.findall('s:sheetData/s:row',NS):
    vals=[]
    for c in row.findall('s:c',NS):
     ref=c.get('r')
     if ref in cells:
      v=cells[ref];vals.append(ref+'='+('FORMULA:'+str(v['f'])+' [cache '+str(v['v'])+']' if ref in formulas else json.dumps(v['v'],ensure_ascii=False)))
    if vals:report.append(' | '.join(vals))
  for part in z.namelist():
   if part.startswith('xl/drawings/') and part.endswith('.xml'):report.append('DRAWING '+part+'\n'+z.read(part).decode())
   if part.startswith('xl/media/'):
    out=BASE/'media'/str(book['id'])/posixpath.basename(part);out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(z.read(part))
  books.append(book)
(BASE/'inventory.json').write_text(json.dumps(books,ensure_ascii=False,indent=2),encoding='utf-8')
(BASE/'inventory.txt').write_text('\n'.join(report),encoding='utf-8')
for b in books: print(json.dumps({'id':b['id'],'name':b['name'],'sheets':[{k:s[k] for k in ['name','path','dimension']}|{'formulas':len(s['formulas']),'merges':len(s['merges'])} for s in b['sheets']],'media':[x for x in b['parts'] if x.startswith('xl/media/')]},ensure_ascii=True))
