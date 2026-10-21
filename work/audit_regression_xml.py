"""Independent OOXML and openpyxl read-only checks, never workbook authoring."""
import json, zipfile, re, datetime, math
from pathlib import Path
import xml.etree.ElementTree as E
import openpyxl
P=Path(__file__).parent;N={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def el(root,name):return root.find('s:'+name,N)
def texts(z):
 if 'xl/sharedStrings.xml'not in z.namelist():return []
 return [''.join(n.itertext())for n in E.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',N)]
def cell_value(c,strings):
 if c is None:return ''
 if c.get('t')=='inlineStr':return ''.join(c.find('s:is',N).itertext())
 v=el(c,'v');value=v.text or '' if v is not None else ''
 return strings[int(value)]if c.get('t')=='s' and value else value
def shift(ref,insert):
 if not insert:return ref
 return re.sub(r'(\$?[A-Z]{1,3})(\$?)(\d+)',lambda m:m[1]+m[2]+str(int(m[3])+insert['count'])if int(m[3])>=insert['at']else m[0],ref)
def same(a,b):return a is b if a is None or b is None else E.tostring(a)==E.tostring(b)
def iso(value):
 value=str(value)
 try:return datetime.date.fromisoformat(value)
 except ValueError:
  try:return datetime.datetime.strptime(value,'%d/%m/%Y').date()
  except ValueError:return None
def numeric_equal(a,b):
 try:return math.isclose(float(a),float(b),rel_tol=1e-12,abs_tol=1e-10)
 except(ValueError,TypeError):return False
reports=[]
for manifest in sorted((P/'v135-generated').glob('*/expectations.json')):
 expected=json.loads(manifest.read_text(encoding='utf-8'));source_dir=P/('templates'if expected['variant']=='originals'else'default-input/cleaned')
 for item in expected['files']:
  path=manifest.parent/item['name'];src=next(source_dir.glob(str(item['id'])+'.*xlsx'))
  with zipfile.ZipFile(path)as z,zipfile.ZipFile(src)as original:
   assert z.testzip()is None,path
   for part in z.namelist():
    if part.endswith(('.xml','.rels')):E.fromstring(z.read(part))
   wb=E.fromstring(z.read('xl/workbook.xml'));owb=E.fromstring(original.read('xl/workbook.xml'));sheets=wb.find('s:sheets',N);osheets=owb.find('s:sheets',N)
   assert [s.get('name')for s in sheets]==[s.get('name')for s in osheets],path
   visible=[s for s in sheets if s.get('state','visible')=='visible'];assert len(visible)==(2 if item['id']==6 else 1),(path,len(visible))
   strings=texts(z);styles=E.fromstring(z.read('xl/styles.xml'));oldstyles=E.fromstring(original.read('xl/styles.xml'))
   for kind in ['fonts','fills','borders','cellStyleXfs','cellXfs']:
    a=el(styles,kind);b=el(oldstyles,kind)
    if b is not None:
     assert len(a)>=len(b),(path,kind)
     assert all(same(a[i],node)for i,node in enumerate(b)),(path,kind,'original style modified')
   date1904=el(wb,'workbookPr')is not None and el(wb,'workbookPr').get('date1904')=='1'
   for index,plan in enumerate(item['plans']):
    part='xl/worksheets/sheet'+str(index+1)+'.xml';out=E.fromstring(z.read(part));old=E.fromstring(original.read(part));layout=plan['layout'];insert=layout.get('_insert');cells={c.get('r'):c for c in out.findall('.//s:c',N)}
    assert same(el(out,'cols'),el(old,'cols')),(path,plan['sheet'],'column widths')
    assert same(el(out,'pageMargins'),el(old,'pageMargins')),(path,plan['sheet'],'margins')
    setup=el(out,'pageSetup');assert setup is not None and setup.get('fitToWidth')=='1' and setup.get('fitToHeight')=='1',(path,plan['sheet'],'one page setup')
    assert el(el(out,'sheetPr'),'pageSetUpPr').get('fitToPage')=='1'
    oldsetup=el(old,'pageSetup')
    if oldsetup is not None:
     for attr,value in oldsetup.attrib.items():
      if attr not in ['scale','fitToWidth','fitToHeight']:assert setup.get(attr)==value,(path,'paper/orientation',attr)
    assert el(out,'rowBreaks')is None and el(out,'colBreaks')is None
    oldrows={int(r.get('r')):r for r in old.findall('s:sheetData/s:row',N)};newrows={int(r.get('r')):r for r in out.findall('s:sheetData/s:row',N)}
    for row,node in oldrows.items():
     target=row+(insert['count']if insert and row>=insert['at']else 0)
     assert {k:v for k,v in newrows[target].attrib.items()if k!='r'}=={k:v for k,v in node.attrib.items()if k!='r'},(path,row,'row height')
    expected_merges=[shift(m.get('ref'),insert)for m in old.findall('s:mergeCells/s:mergeCell',N)]
    if insert:
     proto=insert['prototypeRow'];horizontal=[m.get('ref')for m in old.findall('s:mergeCells/s:mergeCell',N)if re.fullmatch(r'[A-Z]+%d:[A-Z]+%d'%(proto,proto),m.get('ref'))]
     for r in range(insert['at'],insert['at']+insert['count']):expected_merges.extend(re.sub(str(proto),str(r),ref)for ref in horizontal)
    assert sorted(expected_merges)==sorted(m.get('ref')for m in out.findall('s:mergeCells/s:mergeCell',N)),(path,'merges')
    for field in plan['fields']:
     cell=cells.get(field['cell'])
     if not field['enabled']:assert cell_value(cell,strings)=='' and el(cell,'f')is None,(path,field,'suppressed output')
     elif field.get('type') in ('masterFormula','signatureFormula'):assert el(cell,'f')is not None and el(cell,'v')is not None,(path,field,'formula/cache')
     if field['enabled']:
      state=expected['input'];v=state['voyage'];key=field['key'];side='arrival'if item['id']in(1,6)else'departure'if item['id']==2 else v['mode'];wanted=None
      if key.startswith(('ship.','voyage.','health.')):
       wanted=state
       for segment in key.split('.'):wanted=wanted.get(segment,'')if isinstance(wanted,dict)else''
      elif key in('$master','$blank','$port','$date','$from','$to','$signatureDate','$crewCount','$crewCountLabel','$aboardCount','$passengerCount','$arrivalMark','$departureMark'):
       count=len(state[side]);passengers=len(state['passengers'])if state['declarations']['passengers']=='records'else 0
       wanted={'$master':state['ship']['master'],'$blank':'','$port':v[side+'Port'],'$date':v[side+'Date'],'$from':v['lastPort'if side=='arrival'else'nextPort'],'$to':v['nextPort'],'$signatureDate':v.get('signArrival'if side=='arrival'else'signDeparture')or v[side+'Date'],'$crewCount':count,'$crewCountLabel':str(count)+' including Master','$aboardCount':count+passengers,'$passengerCount':passengers if state['declarations']['passengers']=='records'else'NIL','$arrivalMark':'X'if side=='arrival'else'','$departureMark':'X'if side=='departure'else''}[key]
      if wanted is not None:
       actual=cell_value(cell,strings)
       if field.get('type')in('date','signatureFormula'):
        date=iso(wanted);base=datetime.date(1904,1,1)if date1904 else datetime.date(1899,12,30);assert date and numeric_equal(actual,(date-base).days),(path,'common date',key,actual,wanted)
       elif field.get('type')=='number':assert numeric_equal(actual,wanted),(path,'count/tonnage',key,actual,wanted)
       else:
        if field.get('type')=='masterFormula':wanted=state['ship']['master']
        else:
         if key=='$signatureDate'and(field.get('prefix')or field.get('suffix')):wanted=iso(wanted).strftime('%d/%m/%Y')
         wanted=field.get('prefix','')+str(wanted)+field.get('suffix','')
        assert actual==str(wanted),(path,'common field',key,actual,wanted)
    table=layout.get('table')
    if table:
     assert len(plan['rows'])<=len(table['rows'])
     for i,row in enumerate(plan['rows']):
      for field,col in table['columns'].items():
       cell=cells.get(col+str(table['rows'][i]));value=cell_value(cell,strings)
       expected_value=i+1 if field=='seq'else row.get(field,'')
       if not plan['columns'].get(field,True):assert value=='';continue
       date=iso(expected_value)if field in ['birthDate','seamanExpiry','passportExpiry','signOnDate','arrivalDate','departureDate','expiry','embarkDate','onsetDate','cholera','yellowFever']else None
       if date:
        base=datetime.date(1904,1,1)if date1904 else datetime.date(1899,12,30);assert numeric_equal(value,(date-base).days),(path,col,expected_value,value)
       elif field in ['seq','quantity','cigs','beer','wine','spirit','age']and str(expected_value).strip()and numeric_equal(expected_value,expected_value):assert numeric_equal(value,expected_value),(path,field,i,value,expected_value)
       else:assert value==str(expected_value or ''),(path,field,i,value,expected_value)
     # Every unused source detail slot must be empty, apart from explicit NIL.
     for r in table['rows'][len(plan['rows']):]:
      for col in table['columns'].values():assert cell_value(cells.get(col+str(r)),strings)in('','NIL'),(path,'old row residue',r)
    for formula in out.findall('.//s:f',N):assert '#REF!'not in(formula.text or ''),(path,'broken formula')
    original_names=[n for n in owb.findall('s:definedNames/s:definedName',N)if n.get('localSheetId')==str(index)]
    output_names=[n for n in wb.findall('s:definedNames/s:definedName',N)if n.get('localSheetId')==str(index)]
    for oldname in original_names:
     newname=next(n for n in output_names if n.get('name')==oldname.get('name'))
     assert newname.text==shift(oldname.text,insert),(path,'shifted print area/title',oldname.text,newname.text)
   for part in original.namelist():
    if part.startswith('xl/media/'):assert z.read(part)==original.read(part),(path,'image bytes')
   dynamic='\n'.join(z.read(p).decode('utf-8')for p in z.namelist()if p=='xl/sharedStrings.xml'or re.fullmatch(r'xl/worksheets/sheet\d+\.xml',p))
   for stale in ['XUE,FENG','JI,QUANBO','EL8227841']:assert stale not in dynamic,(path,'old dynamic value',stale)
  readback=openpyxl.load_workbook(path,read_only=True,data_only=False);assert len(readback.sheetnames)==len(item['plans']);readback.close()
  reports.append({'file':str(path.relative_to(P)),'sheets':len(item['plans']),'visiblePrintSheets':len(visible),'result':'pass'})
assert len(reports)==70,len(reports)
(P/'v135-xml-verification.json').write_text(json.dumps({'passed':len(reports),'checks':'OOXML parse, all original tabs, one-page fit settings, hidden cleared auxiliaries, full overflow records, shifted merges and row heights, styles, margins, paper/orientation, images, known formulas/cache, date defaults/suppression, old-data cleanup, independent openpyxl read-only open','files':reports},ensure_ascii=False,indent=2),encoding='utf-8')
print('PASS',len(reports),'generated XLSX independently parsed and checked')
