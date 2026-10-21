from pathlib import Path
import json

root=Path(__file__).resolve().parent.parent
work=root/'work'

guide=(work/'make_v3_guide.mjs').read_text(encoding='utf-8').replace('3.0.0','3.1.0').replace('Studio 3.0','Studio 3.1')
(work/'make_v31_guide.mjs').write_text(guide,encoding='utf-8')

package=(work/'package_v3.py').read_text(encoding='utf-8').replace('3.0.0','3.1.0').replace('3.0','3.1')
package=package.replace('liquid-reset-navigation-report.json','yzrt-navigation-report.json').replace("'liquid-reset-native-report.json']", "'liquid-reset-native-report.json','yzrt-appearance-report.json','modal-keyboard-report.json']")
package=package.replace('liquid-reset-release-report.json','yzrt-release-report.json')
package=package.replace("root/'.impeccable/review/liquid-reset'", "root/'.impeccable/review/yzrt'")
package=package.replace("'liquid_desk.css','build.py'", "'liquid_desk.css','yzrt_material.css','appearance.css','build.py'")
for old,new in [('verify_liquid_reset_navigation.mjs','verify_yzrt_navigation.mjs'),('capture_liquid_reset.mjs','capture_yzrt.mjs'),('verify_v3_source_package.py','verify_v31_source_package.py'),('make_v3_guide.mjs','make_v31_guide.mjs'),('package_v3.py','package_v31.py'),('final_v3_check.mjs','final_v31_check.mjs')]:package=package.replace(old,new)
package=package.replace("'requirements-dev.txt','.gitignore'", "'requirements-dev.txt','.gitignore','THIRD_PARTY_NOTICES.md'")
package=package.replace("names.add('verify_home_scroll.mjs')", "names.update({'verify_home_scroll.mjs','verify_yzrt_appearance.mjs','verify_modal_keyboard.mjs','yzrt-integration-direction.md','yzrt-finish-review.md'})")
package=package.replace("files += sorted((work/'default-input'", "files += [work/'reference-yzrt'/n for n in ['LICENSE','SOURCE_METADATA.json','SOURCE_REVIEW.md','纯CSS液态玻璃/index.html','纯CSS液态玻璃/css/styles.css']]\nfiles += [work/n for n in ['yzrt-appearance-report.json','modal-keyboard-report.json','yzrt-navigation-report.json','yzrt-contrast-report.json']]\nfiles += sorted((work/'default-input'")
a=package.index("(folder/'本版更新与检查.md').write_text(")
b=package.index("shutil.copy2(work/'port-locode-audit.json'",a)
package=package[:a]+'''(folder/'本版更新与检查.md').write_text('''+repr('''# 3.1 新版改动与检查

按用户提供的 yzrt 源码改进玻璃边缘、高光和层次，并保留宽阔编辑面、浮动靠港条与操作坞。

总设置新增“玻璃与背景”折叠区：玻璃效果、背景配色、圆角样式、页面动效。选框即时生效，可导出备份；“恢复默认外观”只重置外观，不影响工程、保存、命名和启动选项。

改为 CSS 玻璃材质与有像素上限的本地背景；取消持续逐帧重绘，支持系统减少动态和减少透明度。修复矮屏编辑区、弹窗键盘焦点与选择行后批量工具栏不显示的问题。保留文件/港口滚动记忆。

对应源码、第三方来源和完整许可随包提供；详见“第三方源码与许可.md”和同版本开发源码包。

本次实际回归：

''')+"+''.join('- '+k+'：'+str(v)+' 项\\n' for k,v in checks.items())+"+repr('\n上述为已执行检查的范围，不代表所有环境均无 Bug。Excel / WPS 的实际打印效果仍需在本机核对。\n')+",encoding='utf-8')\n"+package[b:]
(work/'package_v31.py').write_text(package,encoding='utf-8')

final=(work/'final_v3_check.mjs').read_text(encoding='utf-8').replace('3.0.0','3.1.0').replace('3.0','3.1')
final=final.replace("'work/fusion_glass.js'", "'work/css_glass.js','work/yzrt_material.css','work/appearance.css','THIRD_PARTY_NOTICES.md','work/reference-yzrt/LICENSE','work/reference-yzrt/纯CSS液态玻璃/css/styles.css'")
final=final.replace('work/final_v3_check.mjs','work/final_v31_check.mjs').replace('work/verify_liquid_reset_navigation.mjs','work/verify_yzrt_navigation.mjs')
final=final.replace("await p.locator('.settings-disclosure').first().locator('summary').first().click();", "assert.equal(await p.locator('[data-ui-pref=accent]').count(),1);await p.locator('details.settings-disclosure').filter({has:p.locator('.naming-guide')}).locator('summary').first().click();")
final=final.replace("const errors=[],external=[],checked=[];", "assert.ok(zip.file('IMO文件包生成器/第三方源码与许可.md'));assert.ok(zip.file('IMO文件包生成器/第三方源代码/yzrt/LICENSE'));assert.ok(zip.file('IMO文件包生成器/第三方源代码/yzrt/纯CSS液态玻璃/css/styles.css'));assert.equal(zip.file('IMO文件包生成器/assets/fusion_glass.js'),null);const errors=[],external=[],checked=[];")
final=final.replace("assert.equal(await p.evaluate(()=>templates.size),10);", "assert.equal(await p.evaluate(()=>templates.size),10);assert.equal(await p.evaluate(()=>StudioGlass.status.renderer),'css');assert.ok((await p.locator('#imo-yzrt-license').textContent()).includes('GNU GENERAL PUBLIC LICENSE'));assert.equal(await p.locator('svg filter').count(),0);")
final=final.replace('liquid-reset-package-report.json','yzrt-package-report.json')
(work/'final_v31_check.mjs').write_text(final,encoding='utf-8')

source=(work/'verify_v3_source_package.py').read_text(encoding='utf-8').replace('v3.0.0','v3.1.0').replace('source-v3-qa-','source-v31-qa-').replace('Liquid Glass 3.0','Liquid Glass 3.1').replace('liquid-reset-source-package-report.json','yzrt-source-package-report.json').replace('version 3 source','version 3.1 source')
source=source.replace("assert len(list((checkout/", "assert 'imo-yzrt-license' in html and 'css_glass.js' in html and 'fusion_glass.js' not in html\nassert (checkout/'work'/'reference-yzrt'/'LICENSE').is_file()\nassert len(list((checkout/",1)
(work/'verify_v31_source_package.py').write_text(source,encoding='utf-8')

runner=(work/'run_checks.mjs').read_text(encoding='utf-8').replace('verify_liquid_reset_navigation.mjs','verify_yzrt_navigation.mjs').replace("'verify_home_scroll.mjs'", "'verify_yzrt_appearance.mjs','verify_modal_keyboard.mjs','verify_home_scroll.mjs'")
(work/'run_checks.mjs').write_text(runner,encoding='utf-8')
p=json.loads((root/'package.json').read_text(encoding='utf-8'))
p['version']='3.1.0'
p['scripts']['test:ui']='node work/verify_liquid_reset_regression.mjs && node work/verify_liquid_reset_workflow.mjs && node work/verify_yzrt_navigation.mjs && node work/verify_yzrt_appearance.mjs && node work/verify_modal_keyboard.mjs && node work/verify_home_scroll.mjs'
p['scripts']['package']='python work/package_v31.py'
(root/'package.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Prepared 3.1 release, offline guide and source rebuild verification scripts.')
