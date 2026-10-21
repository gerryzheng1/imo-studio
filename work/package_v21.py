from pathlib import Path
import json, zipfile, hashlib, re, shutil

root=Path(__file__).resolve().parent.parent
work=root/'work';out=root/'outputs';folder=out/'IMO文件包生成器';version='2.1.0'
assert (folder/'打开生成器.html').is_file(), 'Run build.py first'
for source,target in [(out/'使用说明_v2.1.0.md',folder/'使用说明.md'),(out/'使用说明_v2.1.0.html',folder/'使用说明.html'),(root/'制作思路与开发交接.md',folder/'制作思路与开发交接.md')]:shutil.copy2(source,target)
quick='''IMO Studio 2.1 — 开始使用

1. 完整解压后，双击“启动生成器.exe”，保留 assets 文件夹。
2. 左侧直接打开船舶档案、船员档案和疫苗资料；内置 10 份空模板自动载入。
3. 上方添加、切换港口，左侧直接打开需要填写的文件；一港、多港操作相同。
4. 需要推算时，在物料中选择起始盘点，填写伙食定额与补给，预览后再采用。
5. 每港“预览与输出”选择文件，底部“检查并生成”集中核对各港日期、健康和 NIL，下载分港口 ZIP。
6. 点“保存工程”保存整批资料。下次从启动器打开会恢复最新工程。

普通工程默认保存在本目录“保存工程”，最多保留 10 个受管版本。
底部省略号可另存为独立备份、下载完整工程或当前港工程；独立备份不参与轮换。
总设置中可调整保存目录、命名和常驻方式，模板与映射位于高级选项。
关闭网页前请保存修改。程序仅在本机处理，不上传资料。

直接打开“打开生成器.html”也能填写，目录写入需浏览器授权。
实际打印字号和页数请在 Excel / WPS 预览核对；本环境未完成原生打印验收。

新手说明：使用说明.html。
换环境继续开发：制作思路与开发交接.md，并带走配套开发源码包。
作者：郑晓天 / Author: Zheng Xiaotian · 更新：2026-10-19。
'''
(folder/'开始使用.txt').write_text(quick,encoding='utf-8-sig')
checks={}
for name in ['studio-v21-report.json','studio-workflow-report.json','fusion-material-report.json','v2-confirmations-verification.json','multiport-verification.json','multiport-stock-verification.json','route-inventory-verification.json','multiport-full-xml-verification.json','v2-regression-verification.json','v2-xml-verification.json','v2-native-verification.json','pdf-input/v2-pdf-verification.json']:
 p=work/name
 if p.exists():
  d=json.loads(p.read_text(encoding='utf-8'));v=d.get('passed',d.get('checks',d.get('browserChecks')));checks[name]=len(v) if isinstance(v,list) else v
notes='# IMO Studio 2.1.0 更新与检查\n\n本版重做为单层文件导航与横向靠港计划。四类申报支持保存默认并只带入新建港口；个人物品支持按港口、日期及阶段保存快照，按船员身份预览匹配再恢复；页面与表格双轴滚动按港口和文件记住。原有资料隔离、连续库存、输出选择、最近 10 港与一页打印规则保留。\n\n修复跨港问题定位、预览入口的本次数据模式、页面重画后的焦点与折叠状态，以及尚未写入工程时的保存提示。单港 ZIP 使用自定义原名，多港按首个勾选港展开并追加数量。\n\n实际检查结果：\n\n'+''.join('- '+k+'：'+str(v)+' 项。\n' for k,v in checks.items())+'\n检查使用真实离线界面、实际 XLSX 及独立本地测试目录。系统文件对话框采用受控选择，未人工鼠标点击验收。原生 Excel/WPS 实际打印未完成验收，最终字号及可读性请预览核对。\n'
(folder/'本版更新与检查.md').write_text(notes,encoding='utf-8')
shutil.copy2(work/'port-locode-audit.json',folder/'配置参考'/'港口代码核对记录.json')
(folder/'assets'/'港口数据来源.txt').write_text('港口参考：Höegh Autoliners 官方代理资料（2026-10-17）。UN/LOCODE 核对采用 UNECE 已发布 2025-1 数据，核对日期 2026-10-19。304 个双语地点、293 个核定代码，歧义条目保留待确认。来源与核对细节见配置参考/港口代码核对记录.json。\nhttps://unlocode.unece.org/publications/\nhttps://service.unece.org/trade/locode/Service/LocodeColumn.htm\n',encoding='utf-8')
assert not list((folder/'保存工程').iterdir()), 'Release save folder must be empty'
for p in folder.rglob('*'):
 assert p.name not in ['本地设置.json','.imo-local-session.json'] and not p.name.endswith('.imoproject.json'), p
archive=out/f'IMO文件包生成器_离线版_v{version}.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(folder.rglob('*')):
  name=p.relative_to(out).as_posix()
  if p.is_dir():z.writestr(name+'/',b'')
  else:z.write(p,name)
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 assert sum(n.endswith('.xlsx') for n in z.namelist())==10

# Curated portable source, excluding dependencies, runtime data and historical outputs.
build=(work/'build.py').read_text(encoding='utf-8')
js={name for name in re.findall(r"\('[A-Z_]+','([^']+\.js)'\)",build) if (work/name).exists()}|{'core.js','engine.js','ui.js','pdf_import.js'}
source_files=[root/'PRODUCT.md',root/'DESIGN.md',root/'.impeccable'/'design.json',root/'README.md',root/'制作思路与开发交接.md',root/'package.json',root/'requirements-dev.txt',root/'.gitignore']
names=js|{'app.html','v12.css','workflow.css','multiport.css','document_shell.css','fusion_glass.css','build.py','build_launcher.ps1','LocalLauncher.cs','IMO_Launcher.exe','config.json','default-config.json','port-catalog.json','port-locode-audit.json','default-templates.zip','studio-direction.md','studio-finish-review.md','fusion-direction.md','fusion-finish-review.md','verify_fusion_material.mjs','baseline-state.json','overflow-state.json','reduced-state.json','departure-state.json','run_checks.mjs','verify_route_inventory.mjs','verify_multiport.mjs','verify_multiport_xml.py','verify_multiport_stock_browser.mjs','verify_studio_v21.mjs','verify_studio_workflow.mjs','capture_studio.mjs','verify_v2_confirmations.mjs','verify_v2_native.mjs','verify_source_package.py','make_v21_guide.mjs','package_v21.py','final_v21_check.mjs'}
source_files += [work/name for name in sorted(names)]
source_files += sorted((work/'default-input'/'cleaned').glob('*.xlsx'))
source_archive=out/f'IMO_Studio_v{version}_开发源码.zip'
with zipfile.ZipFile(source_archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in source_files:
  assert p.is_file(),p
  z.write(p,'IMO_Studio_v21_源码/'+p.relative_to(root).as_posix())
with zipfile.ZipFile(source_archive) as z:assert z.testzip() is None
report={'version':version,'runtimeZipBytes':archive.stat().st_size,'runtimeSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'sourceZipBytes':source_archive.stat().st_size,'sourceSha256':hashlib.sha256(source_archive.read_bytes()).hexdigest(),'sourceFiles':len(source_files),'checks':checks,'nativeOfficePrintVerified':False}
(work/'studio-v21-release-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
shutil.copy2(out/'IMO_Generator.html',out/'IMO_Studio_2.1.html')
for name,target in [('desktop','新版界面.png'),('defaults','申报默认方案.png'),('restore-preview','个人物品快照.png')]:shutil.copy2(root/'.impeccable'/'review'/'fusion'/(name+'.png'),out/target)
print(json.dumps(report,ensure_ascii=False))
