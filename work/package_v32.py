from pathlib import Path
import json,zipfile,hashlib,re,shutil

root=Path(__file__).resolve().parent.parent;work=root/'work';out=root/'outputs';folder=out/'IMO文件包生成器'
version='3.2.0'
assert (folder/'打开生成器.html').is_file(),'Run build.py first'
assert not list((folder/'保存工程').iterdir()),'Release save directory must be empty'
for p in folder.rglob('*'):
 assert p.name not in ['本地设置.json','.imo-local-session.json'] and not p.name.endswith('.imoproject.json'),p
for source,target in [(out/'使用说明_v3.2.0.md',folder/'使用说明.md'),(out/'使用说明_v3.2.0.html',folder/'使用说明.html'),(root/'制作思路与开发交接.md',folder/'制作思路与开发交接.md')]:shutil.copy2(source,target)
(folder/'开始使用.txt').write_text('''IMO Studio 3.2 · Liquid Glass

1. 完整解压后，双击“启动生成器.exe”。不要移走 assets 文件夹。
2. 底部“资料”填写船舶、船员和申报默认方案。
3. 顶部“靠港计划”添加或切换港口，各港资料独立。
4. 底部“文件”选择申报文件；也可点击文件标题，或 Ctrl / Command + K 搜索。
5. 只要一份，点“下载本份 XLSX”；整包在“输出”点“生成本港 ZIP”，多港点“批量生成 N 港”。
6. “保存工程”保存整个工作台，下次从启动器打开自动恢复。

右上角齿轮打开设置。文件搜索 Enter 进入首个结果，Esc 关闭。
工程默认保存在同目录“保存工程”，按日期时间和港口命名，最多保留 10 个受管备份。
更新前保留自己的旧工程，在新版导入恢复；本包不含演示工程或私人资料。
直接打开“打开生成器.html”也可离线编辑，首次保存须授权文件夹。
各原始工作表按单页配置，正式打印请在 Excel / WPS 检查可读性。
详细操作见“使用说明.html”；继续开发见“制作思路与开发交接.md”。
作者：郑晓天 / Author: Zheng Xiaotian · 更新：2026-10-20
''',encoding='utf-8-sig')
checks={}
for name in ['liquid-reset-regression-report.json','liquid-reset-workflow-report.json','yzrt-navigation-report.json','liquid-reset-home-scroll-report.json','liquid-reset-output-report.json','liquid-reset-stock-report.json','liquid-reset-native-report.json','yzrt-appearance-report.json','modal-keyboard-report.json','flow32-report.json']:
 p=work/name;assert p.is_file(),p;data=json.loads(p.read_text(encoding='utf-8'));assert not data.get('errors'),p
 values=data.get('passed',data.get('checks',data.get('browserChecks',[])));checks[name]=len(values) if isinstance(values,list) else values
(folder/'本版更新与检查.md').write_text("# 3.2 流程与单份下载\n\n编辑页、输出行和填写预览支持下载本份 XLSX，无需逐个取消勾选。仅核对目标文件，保留整包选择、其他港口和整包成功记录。\n\n新增直接切换文件、上一份/下一份、整包仅选一份、全选与本港 ZIP 入口，明确区分多港批量。问题列表按需展开，核对时保留焦点及滚动，并收紧编辑空间。\n\n检查：\n\n"+''.join('- '+k+'：'+str(v)+' 项\n' for k,v in checks.items())+"\n检查范围见开发交接与报告；不代表所有环境均无缺陷。Excel / WPS 的原生实际打印仍需核对。\n",encoding='utf-8')
shutil.copy2(work/'port-locode-audit.json',folder/'配置参考'/'港口代码核对记录.json')
archive=out/f'IMO文件包生成器_Liquid_Glass_v{version}.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(folder.rglob('*')):
  name=p.relative_to(out).as_posix()
  if p.is_dir():z.writestr(name+'/',b'')
  else:z.write(p,name)
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 assert sum(n.endswith('.xlsx') for n in z.namelist())==10

build=(work/'build.py').read_text(encoding='utf-8')
js={n for n in re.findall(r"\('[A-Z_]+','([^']+\.js)'\)",build) if (work/n).exists()}|{'core.js','engine.js','ui.js','pdf_import.js'}
files=[root/n for n in ['PRODUCT.md','DESIGN.md','.impeccable/design.json','README.md','制作思路与开发交接.md','package.json','requirements-dev.txt','.gitignore','THIRD_PARTY_NOTICES.md']]
names=js|{'app.html','v12.css','workflow.css','multiport.css','liquid_desk.css','yzrt_material.css','appearance.css','flow32.css','build.py','build_launcher.ps1','LocalLauncher.cs','IMO_Launcher.exe','config.json','default-config.json','port-catalog.json','port-locode-audit.json','default-templates.zip','liquid-reset-direction.md','liquid-reset-finish-review.md','baseline-state.json','overflow-state.json','reduced-state.json','departure-state.json','run_checks.mjs','verify_route_inventory.mjs','verify_multiport.mjs','verify_multiport_xml.py','verify_liquid_reset_stock.mjs','verify_liquid_reset_regression.mjs','verify_liquid_reset_workflow.mjs','verify_yzrt_navigation.mjs','verify_liquid_reset_outputs.mjs','verify_liquid_reset_native.mjs','capture_yzrt.mjs','verify_v32_source_package.py','make_v32_guide.mjs','package_v32.py','final_v32_check.mjs'}
names.update({'flow32.css','verify_flow32.mjs','capture_flow32.mjs','flow32-direction.md','flow32-ui-audit.md','flow32-finish-review.md','flow32-documentation-review.md','verify_home_scroll.mjs','verify_yzrt_appearance.mjs','verify_modal_keyboard.mjs','yzrt-integration-direction.md','yzrt-finish-review.md'})
files += [work/n for n in sorted(names)]
files += [work/'reference-yzrt'/n for n in ['LICENSE','SOURCE_METADATA.json','SOURCE_REVIEW.md','纯CSS液态玻璃/index.html','纯CSS液态玻璃/css/styles.css']]
files += [work/n for n in ['yzrt-appearance-report.json','modal-keyboard-report.json','yzrt-navigation-report.json','yzrt-contrast-report.json','flow32-report.json','flow32-layout-report.json','flow32-recovery-chrome.json','flow32-recovery-msedge.json','liquid-reset-native-report.json','liquid-reset-home-scroll-report.json']]
files += sorted((work/'default-input'/'cleaned').glob('*.xlsx'))
source=out/f'IMO_Liquid_Glass_v{version}_开发源码.zip'
with zipfile.ZipFile(source,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in files:
  assert p.is_file(),p
  z.write(p,'IMO_Studio_v3_源码/'+p.relative_to(root).as_posix())
with zipfile.ZipFile(source) as z:assert z.testzip() is None
shutil.copy2(out/'IMO_Generator.html',out/'IMO_Liquid_Glass_3.2.html')
shutil.copy2(root/'制作思路与开发交接.md',out/'制作思路与开发交接_v3.2.md')
for name,target in [('editor-1280','编辑页'),('output-desktop','单份与整包输出'),('output-mobile','手机输出')]:shutil.copy2(root/'.impeccable/review/flow32'/(name+'.png'),out/('Liquid_Glass_3.2_'+target+'.png'))
report={'version':version,'runtimeZipBytes':archive.stat().st_size,'runtimeSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'sourceZipBytes':source.stat().st_size,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceFiles':len(files),'checks':checks,'nativeOfficePrintVerified':False}
(work/'flow32-release-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=True))
