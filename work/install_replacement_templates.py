from pathlib import Path,PurePosixPath
import copy,hashlib,json,re,shutil,zipfile

root=Path(__file__).resolve().parent.parent;work=root/'work'
inspection=json.loads((work/'template-replacement-inspection.json').read_text(encoding='utf-8'))
source=Path(inspection['source']);assert hashlib.sha256(source.read_bytes()).hexdigest()==inspection['sha256']
backup=work/'template-backups'/'v3.2.0';backup.mkdir(parents=True,exist_ok=True)
for filename in ['default-templates.zip','config.json','default-config.json']:
 assert not (backup/filename).exists(),'Replacement already installed; do not shift mappings twice'
 shutil.copy2(work/filename,backup/filename)
configs=[json.loads((work/n).read_text(encoding='utf-8')) for n in ['config.json','default-config.json']]
(work/'legacy-template-config.json').write_text(json.dumps({'kind':'IMO-LEGACY-TEMPLATE-MAPPINGS','configs':configs},ensure_ascii=False,indent=2),encoding='utf-8')

def shift_col(col):
 n=0
 for c in col:n=n*26+ord(c)-64
 n+=1;out=''
 while n:n,r=divmod(n-1,26);out=chr(65+r)+out
 return out
def shift_ref(ref):
 return re.sub(r'([A-Z]+)([1-9][0-9]*)',lambda m:shift_col(m[1])+str(int(m[2])+1),ref)

by_id={int(Path(e['name']).name.split('.')[0]):e for e in inspection['entries']}
assert set(by_id)==set(range(1,11))
for filename,config in zip(['config.json','default-config.json'],configs):
 for template in config['templates']:
  tid=template['id'];entry=by_id[tid]
  if tid in [1,2]:
   for rule in template['identify']:rule['cell']=shift_ref(rule['cell'])
   sheet=copy.deepcopy(template['sheets'][0]);template['sheets']=[sheet]
   for field in sheet['fields']:
    for key in ['cell','dateRef']:
     if field.get(key):field[key]=shift_ref(field[key])
   table=sheet['table'];table['rows']=[r+1 for r in table['rows']]
   table['columns']={k:shift_col(v) for k,v in table['columns'].items()}
   table['clear']=[shift_ref(r) for r in table.get('clear',[])]
   if table.get('nilCell'):table['nilCell']=shift_ref(table['nilCell'])
   if sheet.get('clear'):sheet['clear']=[shift_ref(r) for r in sheet['clear']]
   if sheet.get('page'):sheet['page']=shift_ref(sheet['page'])
   sheet['expectedLabels']={shift_ref(ref):entry['cells'].get(shift_ref(ref),label) for ref,label in sheet['expectedLabels'].items()}
   sheet['expectedMerges']=entry['merges'];sheet['expectedDimension']=entry['dimension']
  elif tid==9:template['sheets'][0]['expectedDimension']=entry['dimension']
 config['templateSet']='User supplied blank templates · 2026-10-21'
 (work/filename).write_text(json.dumps(config,ensure_ascii=False,indent=2),encoding='utf-8')

with zipfile.ZipFile(source) as archive:
 assert archive.testzip() is None
 for item in archive.infolist():
  if item.is_dir():continue
  rel=PurePosixPath(item.filename);assert not rel.is_absolute() and '..' not in rel.parts and '\\' not in item.filename
  assert rel.suffix.lower()=='.xlsx'
  target=work/'default-input'/'cleaned'/rel.name
  assert target.is_file(),'Replacement must retain the ten known filenames'
  target.write_bytes(archive.read(item))
shutil.copy2(source,work/'default-templates.zip')
report={'sourceSha256':inspection['sha256'],'templateCount':10,'bytePreserved':True,'crewMappingOffset':{'rows':1,'columns':1},'legacyConfigs':'legacy-template-config.json','backup':str(backup.relative_to(root)),'files':[{'id':i,'name':Path(e['name']).name,'sha256':e['sha256']} for i,e in sorted(by_id.items())]}
(work/'template-replacement-install.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('Installed ten byte-preserved templates; shifted crew mappings one row/column; retained legacy mappings.')
