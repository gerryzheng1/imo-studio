from pathlib import Path
import json,zipfile,hashlib,re,shutil

root=Path(__file__).resolve().parent.parent;work=root/'work';out=root/'outputs';folder=out/'IMO文件包生成器'
version='3.2.2'
assert (folder/'打开生成器.html').is_file(),'Run build.py first'
assert not list((folder/'保存工程').iterdir()),'Release save directory must be empty'
for p in folder.rglob('*'):
 assert p.name not in ['本地设置.json','.imo-local-session.json'] and not p.name.endswith('.imoproject.json'),p
for source,target in [(out/'使用说明_v3.2.2.md',folder/'使用说明.md'),(out/'使用说明_v3.2.2.html',folder/'使用说明.html'),(root/'制作思路与开发交接.md',folder/'制作思路与开发交接.md')]:shutil.copy2(source,target)
(folder/'开始使用.txt').write_text('''IMO Studio 3.2.2 · Liquid Glass

1. 完整解压后，双击“启动生成器.exe”。不要移走 assets 文件夹。
2. 底部“资料”填写船舶、船员和申报默认方案。
3. 顶部添加或切换港口；省略号管理准备列表，已完成港口可核对日期后转历史并移出。
   底部“航次”编辑本港资料、未来计划和历史；第4份文件核对本港申报清单。
4. 底部“文件”选择申报文件；也可点击文件标题，或 Ctrl / Command + K 搜索。
5. 只要一份，点“下载本份 XLSX”；整包在“输出”点“生成本港 ZIP”，多港点“批量生成 N 港”。
6. “保存工程”保存整个工作台，下次从启动器打开自动恢复。

右上角齿轮打开设置。文件搜索 Enter 进入首个结果，Esc 关闭。
工程默认保存在同目录“保存工程”，按日期时间和港口命名，最多保留 10 个受管备份。
更新前保留自己的旧工程，在新版导入恢复；本包不含演示工程或私人资料。
直接打开“打开生成器.html”也可离线编辑，首次保存须授权文件夹。
各原始工作表按单页配置，正式打印请在 Excel / WPS 检查可读性。
详细操作见“使用说明.html”；继续开发见“制作思路与开发交接.md”。
作者：郑晓天 / Author: Zheng Xiaotian · 更新：2026-10-21
''',encoding='utf-8-sig')
checks={}
for name in ['stay-prefill-report.json','route-navigation-report.json','completed-ports-report.json','multiport-verification.json','flow32-report.json','yzrt-navigation-report.json','liquid-reset-regression-report.json']:
 p=work/name;assert p.is_file(),p;data=json.loads(p.read_text(encoding='utf-8'));assert not any(data.get(k) for k in ['errors','browserErrors','externalRequests','failures','requests']),p
 values=data.get('passed',data.get('checks',data.get('browserChecks',[])));checks[name]=len(values) if isinstance(values,list) else values
(folder/'本版更新与检查.md').write_text("# 3.2.2 航次与准备列表\n\n未来计划和历史编辑集中到航次，第4份文件只核对本港申报清单。顶部省略号管理准备列表，完成挂靠需核对实际日期，可先下载单港工程备份；原子写历史并移出计划和任务，重复与日期冲突受保护。\n\n仅移除保留未来计划；最后任务移除会清空旧港投影。停留时间按到离港日期差预填，手工修改后保留。原液态玻璃、用户空模板和打印规则保留。\n\n本轮重跑：\n\n"+''.join('- '+k+'：'+str(v)+' 组\n' for k,v in checks.items())+"\n其余历史报告是基线证据，不计作本轮重跑。原生 Excel / WPS 实际打印未重新验收。\n",encoding='utf-8')

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
names=js|{'app.html','v12.css','workflow.css','multiport.css','liquid_desk.css','yzrt_material.css','appearance.css','flow32.css','prism_glass.css','legacy-template-config.json','legacy-default-templates.zip','build.py','build_launcher.ps1','LocalLauncher.cs','IMO_Launcher.exe','config.json','default-config.json','port-catalog.json','port-locode-audit.json','default-templates.zip','liquid-reset-direction.md','liquid-reset-finish-review.md','baseline-state.json','overflow-state.json','reduced-state.json','departure-state.json','run_checks.mjs','verify_route_inventory.mjs','verify_multiport.mjs','verify_multiport_xml.py','verify_liquid_reset_stock.mjs','verify_liquid_reset_regression.mjs','verify_liquid_reset_workflow.mjs','verify_yzrt_navigation.mjs','verify_liquid_reset_outputs.mjs','verify_liquid_reset_native.mjs','capture_yzrt.mjs','verify_v322_source_package.py','make_v322_guide.mjs','package_v322.py','final_v322_check.mjs'}
names.update({'flow32.css','verify_flow32.mjs','capture_flow32.mjs','flow32-direction.md','flow32-ui-audit.md','flow32-finish-review.md','flow32-documentation-review.md','notice-fix-direction.md','notice-fix-finish-review.md','notice-fix-documentation-review.md','verify_notice_fix.mjs','capture_notice_fix.mjs','verify_replacement_templates.mjs','template-replacement-install.json','template-replacement-inspection.json','install_replacement_templates.py','inspect_replacement_templates.py','verify_home_scroll.mjs','verify_yzrt_appearance.mjs','verify_modal_keyboard.mjs','yzrt-integration-direction.md','yzrt-finish-review.md'})
names.update({'verify_stay_prefill.mjs','capture_stay_prefill.mjs','stay-prefill-report.json','verify_route_navigation.mjs','verify_completed_ports.mjs','capture_route_navigation.mjs','route-navigation-direction.md','route-navigation-finish-review.md','route-navigation-documentation-review.md','route-navigation-report.json','completed-ports-report.json','route-navigation-layout.json','multiport-verification.json'})
files += [work/n for n in sorted(names)]
files += [work/'reference-yzrt'/n for n in ['LICENSE','SOURCE_METADATA.json','SOURCE_REVIEW.md','纯CSS液态玻璃/index.html','纯CSS液态玻璃/css/styles.css']]
files += [work/n for n in ['yzrt-appearance-report.json','modal-keyboard-report.json','yzrt-navigation-report.json','yzrt-contrast-report.json','flow32-report.json','flow32-layout-report.json','notice-fix-report.json','template-replacement-report.json','flow32-recovery-chrome.json','flow32-recovery-msedge.json','liquid-reset-native-report.json','liquid-reset-home-scroll-report.json']]
files += sorted((work/'default-input'/'cleaned').glob('*.xlsx'))
source=out/f'IMO_Liquid_Glass_v{version}_开发源码.zip'
with zipfile.ZipFile(source,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in files:
  assert p.is_file(),p
  z.write(p,'IMO_Studio_v3_源码/'+p.relative_to(root).as_posix())
with zipfile.ZipFile(source) as z:assert z.testzip() is None
shutil.copy2(out/'IMO_Generator.html',out/'IMO_Liquid_Glass_3.2.2.html')
shutil.copy2(root/'制作思路与开发交接.md',out/'制作思路与开发交接_v3.2.2.md')
for name,target in [('desktop-file','本次港口清单'),('desktop-plan','航次与航线'),('desktop-manage','准备列表管理'),('mobile-finish','手机完成挂靠')]:shutil.copy2(root/'.impeccable/review/route-322'/(name+'.png'),out/('Liquid_Glass_3.2.2_'+target+'.png'))

report={'version':version,'runtimeZipBytes':archive.stat().st_size,'runtimeSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'sourceZipBytes':source.stat().st_size,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceFiles':len(files),'checks':checks,'nativeOfficePrintVerified':False}
(work/'route322-release-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=True))

