from pathlib import Path
import hashlib,json,zipfile,xml.etree.ElementTree as ET

root=Path(__file__).resolve().parent.parent
source=Path('C:/1/Zheng/GPT/IMO/IMO文件包生成器_Liquid_Glass_v3.2.0/IMO文件包生成器/内置空模板.zip')
report={'source':str(source),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'entries':[]}
with zipfile.ZipFile(source) as archive:
 assert archive.testzip() is None
 for entry in archive.infolist():
  if entry.is_dir():continue
  data=archive.read(entry)
  item={'name':entry.filename,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
  if entry.filename.lower().endswith('.xlsx'):
   import io
   with zipfile.ZipFile(io.BytesIO(data)) as book:
    assert book.testzip() is None
    doc=ET.fromstring(book.read('xl/workbook.xml'))
    item['sheets']=[e.attrib for e in doc.iter() if e.tag.endswith('}sheet')]
    item['xmlFiles']=len(book.namelist())
    if Path(entry.filename).name.startswith(('1.','2.','9.')):
     strings=[]
     if 'xl/sharedStrings.xml' in book.namelist():
      strings=[''.join(el.itertext()) for el in ET.fromstring(book.read('xl/sharedStrings.xml'))]
     sheet=ET.fromstring(book.read('xl/worksheets/sheet1.xml'))
     item['dimension']=next((el.attrib.get('ref') for el in sheet.iter() if el.tag.endswith('}dimension')),None)
     item['merges']=[el.attrib['ref'] for el in sheet.iter() if el.tag.endswith('}mergeCell')]
     cells={}
     for el in sheet.iter():
      if not el.tag.endswith('}c'):continue
      value=next((x.text or '' for x in el if x.tag.endswith('}v')),'')
      if el.attrib.get('t')=='s':value=strings[int(value)] if value else ''
      elif el.attrib.get('t')=='inlineStr':value=''.join(x.text or '' for x in el.iter() if x.tag.endswith('}t'))
      if value:cells[el.attrib['r']]=value
     item['cells']=cells
    existing=root/'work/default-input/cleaned'/Path(entry.filename).name
    item['matchesExisting']=existing.is_file() and hashlib.sha256(existing.read_bytes()).hexdigest()==item['sha256']
  report['entries'].append(item)
(root/'work/template-replacement-inspection.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=True,indent=2))
