import json,pathlib,zipfile,xml.etree.ElementTree as E
P=pathlib.Path(__file__).parent
inventory=json.loads((P/'inventory.json').read_text(encoding='utf-8'))
def f(cell,key,**kw):return dict(cell=cell,key=key,**kw)
def tab(source,start,end,cols,clear,nilCell=None):return dict(source=source,rows=list(range(start,end+1)),columns=cols,clear=[clear],nilCell=nilCell)
crewcols=dict(seq='A',name='B',rank='C',sex='D',nationality='E',birthDate='F',birthPlace='H',seamanBook='I',seamanExpiry='J',passport='K',passportExpiry='L',signOnDate='M',signOnPlace='N')
cfg={'version':'1.0.0','templateSet':'IMO-2026-10 supplied templates','templates':[]}
def add(i,title,ident,fields,table=None,page=None,extra=None):
 b=inventory[i-1];s=b['sheets'][0]
 sh=dict(name=s['name'],fields=fields)
 if table:sh['table']=table
 if page:sh['page']=page
 sheets=[sh]+(extra or [])
 cfg['templates'].append(dict(id=i,title=title,filename=b['name'],identify=ident,sheets=sheets))
def ident(cell,text,sheet=None):return dict(sheet=sheet,cell=cell,contains=text)
for i,side in [(1,'arrival'),(2,'departure')]:
 add(i,'进港船员名单' if i==1 else '离港船员名单',[ident('D4','Port of '+side,'Arr.Crew list')],
 [f('A5','ship.name'),f('A7','ship.flag'),f('D5','voyage.'+side+'Port'),f('I5','voyage.'+side+'Date',type='date'),f('D7','voyage.lastPort' if i==1 else 'voyage.nextPort'),f('D3','$arrivalMark'),f('F3','$departureMark'),f('L31','$master',type='masterFormula'),f('L32','$signatureDate',type='signatureFormula',dateRef='I5')],
 tab(side,9,29,crewcols,'A9:N29'),page='N3',extra=[dict(name='Sheet1',fields=[],clear=['A1:M2'],note='原附表两条历史人员记录全部清空，保留工作表与版式。')])
add(3,'船员个人物品',[ident('B3','CREW EFFECT','Crew effects')],[f('B6','ship.name',prefix='1.Name of Ship\n'),f('B7','ship.flag',prefix='2.Nationality of Ship\n'),f('I7','effectsDeclaration'),f('I32','ship.master',prefix='Master: '),f('B32','$signatureDate',prefix='Date: ')],tab('effects',9,29,dict(seq='B',name='C',rank='D',cigs='E',beer='F',wine='G',spirit='H',articles='I',signature='J'),'B9:J29'),page='J7')
add(4,'历史挂靠港',[ident('B4','Ports of Call','PORTS OF CALL ')],[f('B7','ship.name'),f('B9','ship.flag'),f('E7','$port'),f('H7','$date',type='date'),f('E9','$from'),f('F22','ship.master',prefix='CAPT: '),f('F23','ship.name',prefix='Master of '),f('B23','$signatureDate',prefix='Date: ')],tab('ports',11,20,dict(seq='B',port='C',country='D',security='E',remarks='F',arrivalDate='G',departureDate='H'),'B11:H20',nilCell='C11'),page='H5')
add(5,'船舶物料',[ident('C3',"SHIP'S STORES",'Store list')],[f('B6','ship.name'),f('B8','ship.flag'),f('F6','$port'),f('J6','$date',type='date'),f('F8','$from'),f('F4','$arrivalMark'),f('H4','$departureMark'),f('B10','$aboardCount',type='number'),f('C10','voyage.stay'),f('F10','$storage'),f('G46','ship.master',prefix='CAPT.'),f('G48','$signatureDate',prefix='Date: ')],tab('stores',12,43,dict(name='B',quantity='D',unit='E'),'B12:K43',nilCell='B12'),page='K4')
healthfields=[f('C5','voyage.arrivalPort'),f('J5','voyage.arrivalDate',type='date'),f('C6','ship.name'),f('G6','voyage.lastPort'),f('J6','voyage.nextPort'),f('C7','ship.flag'),f('H7','ship.master'),f('D8','ship.netTonnage',type='number'),f('D10','health.certType'),f('J10','health.certDate',type='date'),f('D12','health.certPlace'),f('D14','$passengerCount'),f('I14','$crewCountLabel'),f('G49','ship.master',prefix='CAPT. '),f('G51','health.surgeon'),f('B53','$signatureDate',type='signatureFormula',dateRef='J5'),f('A36','health.measures',prefix='    and date: '),f('A37','health.stowawayPlace',prefix='8. Have any stowaways been found onboard? If yes, where did they join the ship? ')]
healthfields += [f(cell,'health.q'+str(i+1)) for i,cell in enumerate(['I24','I26','I28','I30','I32','I34','I36','I37','I38'])]
add(6,'健康申报与病例附表',[ident('A1','Maritime Declaration of Health','Health')],healthfields,extra=[dict(name='healthback',fields=[],titlePage='A9',table=tab('cases',14,28,dict(name='A',rank='B',age='C',sex='D',nationality='E',embarkPort='F',embarkDate='G',illness='H',onsetDate='I',result='J',disposal='K'),'A14:K28',nilCell='A14'))])
add(7,'旅客名单',[ident('B3','PASSENGER LIST','Crewlist (passport)')],[f('B6','ship.company'),f('B8','ship.name'),f('B10','ship.flag'),f('C10','$blank'),f('G8','$port'),f('J8','$date',type='date'),f('G10','$from'),f('F6','$arrivalMark'),f('I6','$departureMark'),f('G34','ship.master',prefix='Capt.'),f('G36','$signatureDate',prefix='Date: ')],tab('passengers',12,31,dict(seq='B',name='C',rank='D',nationality='E',birthDate='G',birthPlace='H',passport='J',passportExpiry='K'),'B12:K31',nilCell='C12'),page='K6')
add(8,'药品名单',[ident('B4','Narcotics List','Narcotics List')],[f('B3','ship.name',prefix='   MV. '),f('D20','ship.master',prefix='Master:'),f('D21','$signatureDate',prefix='Date: ')],tab('medicines',6,17,dict(seq='B',name='C',quantity='D',expiry='E',mark='F'),'B6:F17',nilCell='C6'),extra=None)
cfg['templates'][-1]['sheets'][0]['titlePage']='B4'
nilkeys=['stowaways','firearms','explosives','toxicWaste','radioactive','animals','floatingCargo','passengers','dangerousGoods','parcels']
add(9,'NIL 各项申报',[ident('B16','N I L','NIL LIST')],[f('E7','ship.name'),f('J7','ship.callSign'),f('E9','ship.registry'),f('J9','ship.imo'),f('E11','ship.flag'),f('F35','ship.master',prefix='CAPT.'),f('H37','$signatureDate',prefix='Date: ')]+[f('K'+str(22+i),'nil.'+k) for i,k in enumerate(nilkeys)])
add(10,'船员疫苗有效日期',[ident('B3','VACCINATION LIST','Vaccination')],[f('B6','ship.company'),f('B8','ship.name',prefix='MV  '),f('B10','ship.imo'),f('E34','ship.master',prefix='CAPT.'),f('E36','$signatureDate',prefix='Date: ')],tab('vaccines',12,32,dict(seq='B',name='C',rank='D',nationality='E',cholera='F',yellowFever='G'),'B12:G32'),page='G6')
for b in cfg['templates']:
 actual=inventory[b['id']-1]
 for s in b['sheets']:
  inv=next(x for x in actual['sheets'] if x['name']==s['name'])
  s['expectedMerges']=inv['merges']
  s['expectedDimension']=inv['dimension']
cfg['templates'][5]['drawingRules']=[dict(path='xl/drawings/drawing1.xml',source='cases',nilAnchorIds=['2049'],note='病例附表的斜体 NIL 字样，只有明确无病例时保留。')]
cfg['templates'][6]['drawingRules']=[dict(path='xl/drawings/drawing1.xml',source='passengers',nilAnchorIds=['3','4','7'],note='旅客表 NIL 字样与两条斜线，有旅客时移除；公司标识与公约说明保留。')]
for id,positions in [(4,['E6','H6','E8']),(5,['F5','J5','F7']),(7,['G7','J7','G9'])]:
 cfg['templates'][id-1]['sheets'][0]['fields'] += [f(cell,key) for cell,key in zip(positions,['$portLabel','$dateLabel','$fromLabel'])]
import re
def address(ref):
 col,row=re.match(r'([A-Z]+)(\d+)',ref).groups();n=0
 for ch in col:n=n*26+ord(ch)-64
 return n,int(row)
def inside(ref,ranges):
 col,row=address(ref)
 for rng in ranges:
  a,b=(rng.split(':')+[rng])[:2];c1,r1=address(a);c2,r2=address(b)
  if c1<=col<=c2 and r1<=row<=r2:return True
 return False
for c in cfg['templates']:
 for s in c['sheets']:
  inv=next(x for x in inventory[c['id']-1]['sheets'] if x['name']==s['name'])
  edited={f['cell'] for f in s['fields']}|{s.get('page'),s.get('titlePage')}
  ranges=s.get('clear',[])+s.get('table',{}).get('clear',[])
  s['expectedLabels']={ref:cell['v'] for ref,cell in inv['cells'].items() if str(cell['v']).strip() and not cell['f'] and ref not in edited and not inside(ref,ranges)}
(P/'config.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2),encoding='utf-8')
for b in inventory:
 if b['id'] in [5,6,7,8,9,10]:
  with zipfile.ZipFile(P/'templates'/b['name']) as z:
   r=E.fromstring(z.read(b['sheets'][0]['path']));ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
   print(b['id'],E.tostring(r.find('s:cols',ns),encoding='unicode'))
   if b['id']==9:print(E.tostring(r.find('s:sheetData/s:row[@r="22"]',ns),encoding='unicode'))
