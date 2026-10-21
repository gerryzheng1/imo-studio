"""Build an audited, offline subset of the original UNECE 2025-1 release.

Chinese names below are reading/search translations, not purported UNECE names.
Codes must exist in the downloaded primary-source CSV; fuzzy suggestions never
become production matches without the explicit name/code review table below.
"""
import csv, json, re, unicodedata, difflib, hashlib
from pathlib import Path

P = Path(__file__).parent
catalog = json.loads((P/'port-catalog.json').read_text(encoding='utf-8'))
country_pairs = '''Algeria DZ
Angola AO
Antigua and Barbuda AG
Aruba AW
Australia AU
Bahamas BS
Bahrain BH
Bangladesh BD
Barbados BB
Belgium BE
Benin BJ
Brazil BR
Cameroon CM
Canada CA
Cayman Islands KY
Chile CL
China CN
Colombia CO
Congo CG
Costa Rica CR
Cuba CU
Curacao CW
Cyprus CY
Côte D'Ivoire CI
Denmark DK
Djibouti DJ
Dominica DM
Dominican Republic DO
Ecuador EC
Egypt EG
El Salvador SV
Finland FI
France FR
French Guiana GF
Gabon GA
Georgia GE
Germany DE
Ghana GH
Gibraltar GI
Greece GR
Grenada GD
Guadeloupe GP
Guatemala GT
Guinea GN
Guyana GY
Haiti HT
Honduras HN
Hong Kong HK
India IN
Indonesia ID
Iraq IQ
Ireland IE
Italy IT
Jamaica JM
Japan JP
Jordan JO
Kenya KE
Korea Republic of KR
Kuwait KW
Latvia LV
Lebanon LB
Liberia LR
Libya LY
Lithuania LT
Madagascar MG
Malaysia MY
Malta MT
Martinique MQ
Mauritania MR
Mauritius MU
Mayotte YT
Mexico MX
Morocco MA
Mozambique MZ
Namibia NA
Netherlands NL
Netherlands Antilles BQ
New Caledonia NC
New Zealand NZ
Nicaragua NI
Nigeria NG
Norway NO
Oman OM
Pakistan PK
Panama PA
Peru PE
Philippines PH
Poland PL
Portugal PT
Puerto Rico PR
Qatar QA
Russian Federation RU
Réunion RE
Saint Kitts and Nevis KN
Saint Lucia LC
Saint Martin SX
Saint Vincent and the Grenadines VC
Saudi Arabia SA
Senegal SN
Sierra Leone SL
Singapore SG
Slovenia SI
South Africa ZA
Spain ES
Sri Lanka LK
Sudan SD
Suriname SR
Sweden SE
Syria SY
Taiwan Province of China TW
Tanzania TZ
Thailand TH
Togo TG
Trinidad and Tobago TT
Tunisia TN
Turkey TR
Ukraine UA
United Arab Emirates AE
United Kingdom GB
United States of America US
Uruguay UY
Venezuela VE
Viet Nam VN
Virgin Islands British VG'''
country_codes = dict(line.rsplit(' ',1) for line in country_pairs.splitlines())

translations = '''阿尔及尔
杰恩杰恩
莫斯塔加奈姆
罗安达
圣约翰（安提瓜）
奥拉涅斯塔德
阿德莱德
贝尔湾
布里斯班
弗里曼特尔
麦凯
墨尔本
纽卡斯尔（澳大利亚）
肯布拉港
弗里波特（巴哈马）
拿骚
巴林
吉大港
布里奇敦
安特卫普
泽布吕赫
科托努
库里蒂巴
巴拉那瓜
里奥格兰德
里约热内卢
桑托斯
维多利亚（巴西）
杜阿拉
哈利法克斯
乔治敦（大开曼）
伊基克
圣安东尼奥（智利）
广州
连云港
宁波
青岛
上海
太仓
天津新港
小漠
布埃纳文图拉
卡塔赫纳（哥伦比亚）
圣玛尔塔
黑角
卡尔德拉（哥斯达黎加）
哈瓦那
威廉斯塔德
拉纳卡
利马索尔
阿比让
哥本哈根
埃斯比约
吉布提
罗索
里奥海纳
圣多明各
埃斯梅拉达斯
瓜亚基尔
亚历山大
苏伊士
苏伊士运河
阿卡胡特拉
汉科
赫尔辛基
科特卡
图尔库
勒阿弗尔
塞特
德格拉德卡讷
利伯维尔
巴统
波季
不来梅哈芬
埃姆登
汉堡
基尔／基尔运河
塔科拉迪
特马
直布罗陀
比雷埃夫斯
圣乔治（格林纳达）
皮特尔角
圣托马斯德卡斯蒂利亚港
科纳克里
乔治敦（圭亚那）
太子港
圣洛伦索（洪都拉斯）
香港
钦奈
恩诺尔
卡图帕利
孟买
蒙德拉
皮帕瓦夫（维克托港）
勿拉湾（苏门答腊）
雅加达
巴士拉
乌姆盖斯尔
都柏林
卡塔尼亚
奇维塔韦基亚
热那亚
焦亚陶罗
利沃诺
萨勒诺
萨沃纳
金斯敦（牙买加）
蒲郡
东播磨
广岛
日立
常陆那珂
金泽
苅田
川崎
神户
水岛
门司
名古屋
中关
御前崎
大阪
堺
堺泉北
下关
丰桥
四日市
横滨
横须贺
亚喀巴
蒙巴萨
群山
仁川
光阳
马山
木浦
釜山
平泽
蔚山
科威特
舒艾拜（科威特）
利耶帕亚
里加
文茨皮尔斯
贝鲁特
蒙罗维亚
班加西
胡姆斯
米苏拉塔
的黎波里（利比亚）
克莱佩达
塔马塔夫（图阿马西纳）
民都鲁
巴生港
马尔萨什洛克
瓦莱塔
法兰西堡
努瓦克肖特
路易港
隆戈尼（藻德济）
阿尔塔米拉
拉萨罗卡德纳斯
马萨特兰
韦拉克鲁斯
卡萨布兰卡
丹吉尔
贝拉
马普托
鲸湾港
阿姆斯特丹
鹿特丹
弗利辛恩
博奈尔
努美阿
奥克兰
利特尔顿
纳尔逊
惠灵顿
科林托
拉各斯
德拉门
奥斯陆
塞拉莱
苏哈尔
卡拉奇
卡西姆港
巴尔博亚
克里斯托瓦尔
曼萨尼约（巴拿马）
巴拿马运河
卡亚俄
八打雁
马尼拉
格但斯克
格丁尼亚
里斯本
塞图巴尔
圣胡安（波多黎各）
哈马德港
梅赛伊德
纳霍德卡
新罗西斯克
圣彼得堡
乌斯季卢加
符拉迪沃斯托克（海参崴）
留尼汪港
巴斯特尔
卡斯特里（圣卢西亚）
菲利普斯堡
金斯敦（圣文森特）
达曼
吉达
延布
达喀尔
弗里敦
新加坡
科佩尔
好望角
德班
东伦敦
伊丽莎白港（格贝哈）
阿尔赫西拉斯
巴塞罗那
毕尔巴鄂
加的斯
希洪
拉斯帕尔马斯
萨贡托
桑坦德
塔拉戈纳
瓦伦西亚
维哥
科伦坡
汉班托塔
苏丹港
帕拉马里博
哥德堡
马尔默
瓦尔哈姆
拉塔基亚
塔尔图斯
台中
台北
达累斯萨拉姆
林查班
洛美
西班牙港
拉古莱特
斯法克斯
扎尔吉斯
博鲁桑／盖姆利克
代林杰
伊斯肯德伦
伊斯坦布尔
伊兹密尔
梅尔辛
亚勒姆贾
耶尼科伊
切尔诺莫尔斯克
敖德萨
阿布扎比
迪拜
杰贝阿里
沙迦
乌姆盖万
布里斯托尔
伊明赫姆
纽卡斯尔（英国）
希尔内斯
南安普顿
蒂尔伯里
怀特希尔角
巴尔的摩
博蒙特
布伦瑞克
查尔斯顿（南卡罗来纳）
科珀斯克里斯蒂
戴维斯维尔
弗里波特（得克萨斯）
加尔维斯顿
格尔夫波特（密西西比）
休斯敦
杰克逊维尔
长滩
迈阿密
莫比尔
纽约
纽波特纽斯
诺福克
费城
阿瑟港
卡纳维拉尔港
埃弗格莱兹港
怀尼米港
朴次茅斯（美国）
萨凡纳
坦帕
威尔明顿（特拉华）
蒙得维的亚
拉瓜伊拉
卡贝略港
胡志明市
罗德城'''.splitlines()
assert len(translations) == len(catalog['ports']), (len(translations),len(catalog['ports']))

rows, countries = [], {}
for path in sorted((P/'default-input/unlocode-2025-1/release/csv').glob('*CodeListPart*.csv')):
    for r in csv.reader(path.open(encoding='utf-8-sig',newline='')):
        r += ['']*(12-len(r))
        if not r[2] and r[3].startswith('.'): countries[r[1]]=r[3][1:]
        elif r[2] and r[0] != '=':
            rows.append(dict(zip(['change','countryCode','locationCode','name','nameAscii','subdivision','function','status','updated','iata','coordinates','remarks'],r)))
by_code = {r['countryCode']+r['locationCode']:r for r in rows}
def norm(s):
    return re.sub('[^a-z0-9]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())

# Explicit aliases to official location names, inspected in the downloaded CSV.
aliases = {
    'Alger':'Algiers', "St John's (Ant)":"St Johns", 'Newcastle (Aus)':'Newcastle',
    'Georgetown (Gr.Caym)':'Georgetown, Grand Cayman', 'Cartagena (Colombia)':'Cartagena',
    'Lian Yun Gang':'Lianyungang', 'Tianjinxingang':'Xingang',
    'Pipavav (Victor) Port Merchant Shipping Services Pvt Ltd':'Pipavav (Victor) Port',
    'Belawan, Sumatra':'Belawan, Sumatra', 'Kingston (Jam)':'Kingston',
    'Kwangyang':'Gwangyang', 'Pyongtaek':'Pyeongtaek', 'Pusan':'Busan',
    'Kuwait (Shuaiba)':'Shuaiba', 'Tripoli (Lib)':'Tripoli',
    'Longoni (Dzaoudzi)':'Longoni', 'Manzanillo (Pan)':'Manzanillo',
    'San Juan (Pue)':'San Juan', 'Castries (St. Lucia)':'Castries',
    'Port Elizabeth':'Port Elizabeth', 'Borusan - Gemlik':'Gemlik',
    'Charleston, SC':'Charleston', 'Freeport, Tx':'Freeport', 'Gulfport, Ms':'Gulfport',
    'Wilmington, De':'Wilmington', 'Georgetown (Guy)':'Georgetown',
}
reviewed_codes = {
    'Alger':'DZALG', "St John's (Ant)":'AGSJO', 'Freeport':'BSFPO',
    'Chittagong':'BDCGP', 'Antwerp':'BEANR', 'Taicang':'CNTAC',
    'Tianjinxingang':'CNTXG', 'Habana':'CUHAV', 'Copenhagen':'DKCPH',
    'Alexandria':'EGALY','Suez':'EGSUZ','Suez Canal':'EGSCN',
    'Hanko':'FIHKO','Turku':'FITKU',"St. George's":'GDSTG',
    'Pointe A Pitre':'GPPTP','Chennai':'INMAA','Mumbai':'INBOM',
    'Jakarta':'IDJKT','Umm Qasr':'IQUQR','Kanda':'JPKND','Moji':'JPMOJ',
    'Nagoya':'JPNGO','Benghazi':'LYBEN','Tamatave':'MGTMM','Bintulu':'MYBTU',
    'Port Klang':'MYPKG','Port Qasim':'PKBQM','Panama Canal':'PAPCN',
    'Batangas':'PHBTG','Lisbon':'PTLIS','Hamad Port':'QAHMD','Mesaieed':'QAUMS',
    'Novorossiysk':'RUNVS','St Petersburg':'RULED','Port Reunion':'RELPT',
    'Basseterre':'KNBAS','Dammam':'SADMM','Port Elizabeth':'ZAPLZ',
    'Gothenburg':'SEGOT','Lattakia':'SYLTK','Tartous':'SYTTS',
    'La Goulette':'TNLGN','Chernomorsk':'UAILK','Odessa':'UAODS',
    'Baltimore':'USBAL','Beaumont':'USBPT','Brunswick':'USSSI',
    'Charleston, SC':'USCHS','Freeport, Tx':'USFPO','Gulfport, Ms':'USGPT',
    'Houston':'USHOU','Jacksonville':'USJAX','Long Beach':'USLGB','Miami':'USMIA',
    'New York':'USNYC','Norfolk':'USORF','Philadelphia':'USPHL','Savannah':'USSAV',
    'Tampa':'USTPA','Wilmington, De':'USILG','Road Town':'VGRAD','Lagos':'NGLOS',
}
unresolved_reasons = {
    'Cape of Good Hope':'地理通过点，不以开普敦港代码替代好望角。',
    'Kiel / Kieler Kanal':'原参考名称同时包含基尔港和基尔运河，请自定义明确地点后填写代码。',
    'Bahrain':'原参考名称为国家／地区名称，未指明码头，请核对具体港口后自定义。',
    'Xiaomo':'UNECE 2025-1 未找到小漠的唯一同名记录；不以厦门、深圳或其他港口代码代替。',
    'Khoms':'官方清单含 Khoms、Al Khums 和 El Choms 等相近条目，需确认具体地点。',
    'Aqaba':'官方清单同时列有 JOAQB 和 JOAQJ，请按实际申报／代理资料确认。',
    'Djibouti':'官方清单同时列有 DJJIB 和 DJPOD，请按实际港区／代理资料确认。',
    'Vladivostok':'官方清单同时列有 RUFIP 和 RUVVO，请按实际码头／代理资料确认。',
    'Yanbu':'需区分延布商业港（SAYNB）和工业城／港区（SAYBI），请核对具体地点。',
    'Yenikoy':'需区分 TRJYN、TRYEK 和 Yeniköy-Autoport（TRAUT），请核对具体地点。',
    'Portsmouth':'美国存在多个同名港口（含 USPSM、USPTM），原参考名称未注明州，请确认后选择。',
}
audit, missing = [], []
for p,zh in zip(catalog['ports'],translations):
    p['nameZh']=zh
    p['countryCode']=country_codes[p['country']]
    if p['name']=='Bonaire': p['country']='Bonaire, Sint Eustatius and Saba'
    if p['name']=='Philipsburg': p['country']='Sint Maarten'
    text = aliases.get(p['name'],p['name'])
    matches = [r for r in rows if r['countryCode']==p['countryCode'] and norm(text) in (norm(r['name']),norm(r['nameAscii'])) and r['change']!='X' and r['status'] not in ('XX','RR')]
    if p['name'] in reviewed_codes: matches=[by_code[reviewed_codes[p['name']]]]
    if p['name'] in unresolved_reasons: matches=[]
    p['locode']='';p['locodeNote']=''
    if len(matches)==1:
        r=matches[0];p.update(locode=r['countryCode']+r['locationCode'],locodeName=r['name'],locodeStatus=r['status'],locodeFunction=r['function'])
    else:
        candidates=[r for r in rows if r['countryCode']==p['countryCode']]
        near=sorted(candidates,key=lambda r:difflib.SequenceMatcher(None,norm(text),norm(r['nameAscii'])).ratio(),reverse=True)[:5]
        p['locodeNote']=unresolved_reasons.get(p['name'],'当前名称尚未唯一核定；请核对具体码头／港区，或在自定义港口中填写经核实的代码。')
        missing.append({'name':p['name'],'country':p['country'],'candidates':[{k:r[k] for k in ['locationCode','name','subdivision','function','change','status']}for r in near]})
    variants={
        'Bahrain':['BHGBQ','BHAHD'], 'Djibouti':['DJJIB','DJPOD'],
        'Kiel / Kieler Kanal':['DEKEL','DECKL'], 'Aqaba':['JOAQB','JOAQJ'],
        'Khoms':['LYKHM','LYKHO','LYELK'], 'Vladivostok':['RUFIP','RUVVO'],
        'Yanbu':['SAYNB','SAYBI'], 'Yenikoy':['TRJYN','TRYEK','TRAUT'],
        'Portsmouth':['USPSM','USPTM'],
    }.get(p['name'],[])
    p['locodeCandidates']=[dict(code=code,**{k:by_code[code][k]for k in ['name','subdivision','function','status']})for code in variants]
    p['aliases']=' '.join(dict.fromkeys([zh,p.get('aliases',''),p.get('locodeName','')])).strip()
    audit.append({k:p.get(k,'')for k in ['id','name','nameZh','country','countryCode','locode','locodeName','locodeStatus','locodeFunction','locodeNote']})
catalog.update(version=2,locodeRelease='2025-1',locodeCheckedOn='2026-10-18',locodeSourceUrl='https://unlocode.unece.org/publications/',locodeDownloadUrl='https://opensource.unicc.org/un/unece/uncefact/vocab-locode/-/jobs/artifacts/2025-1/download?job=package-release',translationNote='中文名称为常用译名或音译检索名；英文名称和 UN/LOCODE 用于核对具体地点。')
catalog['countries']=[{'code':code,'name':name}for code,name in sorted(countries.items())]
(P/'port-catalog-enriched.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
(P/'port-locode-audit.json').write_text(json.dumps({'release':'2025-1','sourceSha256':hashlib.sha256((P/'default-input/unlocode-2025-1.zip').read_bytes()).hexdigest(),'matched':sum(bool(p['locode'])for p in catalog['ports']),'ports':audit,'unresolved':missing},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'ports':len(catalog['ports']),'matched':sum(bool(p['locode'])for p in catalog['ports']),'unresolved':[p['name']for p in missing]},ensure_ascii=False))
