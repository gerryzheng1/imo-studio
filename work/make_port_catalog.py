import pathlib,json,re,unicodedata
P=pathlib.Path(__file__).parent
groups=json.loads((P/'default-input'/'port-groups.json').read_text(encoding='utf-8'))
overrides={
 'Auckland':'New Zealand','Lyttelton':'New Zealand','Wellington':'New Zealand','Noumea':'New Caledonia','Oslo':'Norway',
 'Takoradi':'Ghana','Tema':'Ghana','San Lorenzo':'Honduras','Liepaja':'Latvia','Riga':'Latvia','Ventspils':'Latvia','Tamatave':'Madagascar',
 'Lazaro Cardenas':'Mexico','Beira':'Mozambique','Vigo':'Spain','Dar Es Salaam':'Tanzania','Newport News':'United States of America','Norfolk':'United States of America','Portsmouth':'United States of America','La Guaira':'Venezuela',
 'Batangas':'Philippines','Manila':'Philippines','Bintulu':'Malaysia','Port Klang':'Malaysia','Belawan, Sumatra':'Indonesia','Jakarta':'Indonesia','Ho Chi Minh City':'Viet Nam','Laem Chabang':'Thailand','Singapore':'Singapore','Hong Kong':'Hong Kong',
 'Lattakia':'Syria','Tartous':'Syria','Port Louis':'Mauritius','Longoni (Dzaoudzi)':'Mayotte',
 'Port-au-Prince':'Haiti',"St John's (Ant)":'Antigua and Barbuda','Puerto Santo Tomas de Castilla':'Guatemala','Le Havre':'France',
 'Malm�':'Sweden','Port Reunion':'Réunion'}
port_names={'Malm�':'Malmö'}
country_names={'JAPAN':'Japan','NETHERLANDS':'Netherlands','R�union':'Réunion'}
zh_ports=dict(x.split('=',1) for x in '''Brisbane=布里斯班
Adelaide=阿德莱德
Bell Bay=贝尔湾
Fremantle=弗里曼特尔
Mackay=麦凯
Melbourne=墨尔本
Newcastle (Aus)=纽卡斯尔 澳大利亚
Port Kembla=肯布拉港
Auckland=奥克兰
Lyttelton=利特尔顿
Wellington=惠灵顿
Noumea=努美阿
Shanghai=上海
Taicang=太仓
Tianjinxingang=天津新港
Guangzhou=广州
Qingdao=青岛
Ningbo=宁波
Lian Yun Gang=连云港
Xiaomo=小漠
Hong Kong=香港
Singapore=新加坡
Laem Chabang=林查班
Ho Chi Minh City=胡志明市
Jakarta=雅加达
Manila=马尼拉
Batangas=八打雁
Port Klang=巴生港
Bintulu=民都鲁
Yokohama=横滨
Nagoya=名古屋
Kobe=神户
Osaka=大阪
Toyohashi=丰桥
Hiroshima=广岛
Pyongtaek=平泽 Pyeongtaek
Pusan=釜山 Busan
Incheon=仁川
Masan=马山
Ulsan=蔚山
Durban=德班
East London=东伦敦
Port Elizabeth=伊丽莎白港 Gqeberha
Port Reunion=留尼汪港
Port Louis=路易港
Mombasa=蒙巴萨
Dar Es Salaam=达累斯萨拉姆
Jebel Ali=杰贝阿里
Dubai=迪拜
Abu Dhabi=阿布扎比
Sharjah=沙迦
Jeddah=吉达
Yanbu=延布
Dammam=达曼
Sohar=苏哈尔
Mumbai=孟买
Chennai=钦奈
Ennore=恩诺尔
Pipavav (Victor) Port=皮帕瓦夫 Pipavav
Hamburg=汉堡
Bremerhaven=不来梅哈芬
Antwerp=安特卫普
Zeebrugge=泽布吕赫
Southampton=南安普顿
Amsterdam=阿姆斯特丹
Rotterdam=鹿特丹
Le Havre=勒阿弗尔
Barcelona=巴塞罗那
Livorno=利沃诺
Oslo=奥斯陆
Baltimore=巴尔的摩
Brunswick=布伦瑞克
Charleston, SC=查尔斯顿
Jacksonville=杰克逊维尔
Freeport, Tx=弗里波特 德克萨斯
Mobile=莫比尔
Kingston (Jam)=金斯敦 牙买加
Veracruz=韦拉克鲁斯
Tangier=丹吉尔
Suez Canal=苏伊士运河
Panama Canal=巴拿马运河'''.splitlines())
zh_countries=dict(x.split('=',1) for x in '''Australia=澳大利亚
New Zealand=新西兰
New Caledonia=新喀里多尼亚
China=中国
Hong Kong=中国香港
Taiwan Province of China=中国台湾
Japan=日本
Korea Republic of=韩国
Singapore=新加坡
Malaysia=马来西亚
Indonesia=印度尼西亚
Philippines=菲律宾
Thailand=泰国
Viet Nam=越南
India=印度
Sri Lanka=斯里兰卡
United Arab Emirates=阿联酋
Saudi Arabia=沙特阿拉伯
Oman=阿曼
South Africa=南非
Kenya=肯尼亚
Tanzania=坦桑尼亚
Mauritius=毛里求斯
Réunion=留尼汪
Madagascar=马达加斯加
Germany=德国
Belgium=比利时
United Kingdom=英国
Netherlands=荷兰
France=法国
Spain=西班牙
Italy=意大利
Norway=挪威
United States of America=美国
Canada=加拿大
Mexico=墨西哥
Jamaica=牙买加
Brazil=巴西
Morocco=摩洛哥
Egypt=埃及
Panama=巴拿马'''.splitlines())
ports={}
for group in groups:
 for raw in group['ports'].split(';'):
  raw=raw.strip()
  if not raw:continue
  name=port_names.get(raw,raw)
  country=country_names.get(group['country'],group['country'])
  country=overrides.get(raw,country)
  if not country:raise ValueError('Missing country '+raw)
  key=(name.casefold(),country.casefold())
  if key not in ports:
   ports[key]={'id':'h-'+re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',name+'-'+country).encode('ascii','ignore').decode().lower()).strip('-'),'name':name,'country':country,'countryZh':zh_countries.get(country,''),'aliases':zh_ports.get(name,''),'pages':[]}
  if group['page'] not in ports[key]['pages']:ports[key]['pages'].append(group['page'])
result={'version':1,'asOf':'2026-10-17','sourceTitle':'Höegh Autoliners 官方港口代理资料（含区域代理覆盖及历史港口）','sourceUrl':'https://autoliners2.hoegh.com/web/basic/hal_commoncontacts.nsf/AgentPDF/AgentPDF/$File/Agent.pdf?openElement=','scheduleUrl':'https://www.hoeghautoliners.com/sailing-schedule','note':'离线参考库；包含区域代理覆盖和历史港口，不代表每港当前有直航，也不代表本船本次挂靠。请按本次资料选择；未列港口可自定义。','ports':sorted(ports.values(),key=lambda p:(p['country'],p['name']))}
(P/'port-catalog.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(len(result['ports']),'ports,',len({p['country'] for p in ports.values()}),'countries/regions')
