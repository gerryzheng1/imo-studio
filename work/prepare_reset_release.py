from pathlib import Path
import json
root=Path(__file__).resolve().parent.parent;p=root/'work'
product=root/'PRODUCT.md'
text=product.read_text(encoding='utf-8')
if '## 当前视觉承诺 · 3.0' not in text:
 text+='\n\n## 当前视觉承诺 · 3.0\n\n2026-10-19，用户明确否定 2.1 的界面框架，要求“从头开始重新设计页面风格，跳出原有框架”，进一步要求“全面的重置”“极致的 liquid glass”。当前承诺为全屏液态玻璃工作台：底部悬浮操作坞、顶部靠港胶囊、按需打开的文件资料库与宽幅编辑面，表单、按钮、表格、弹窗、设置和欢迎状态共同使用新的视觉系统。此前的固定左侧文件大纲及官网极简结合版只作为历史记录，不再是视觉依据。现有业务能力、离线方式、工程兼容和固定作者署名要求继续保留。\n'
 product.write_text(text,encoding='utf-8')
s=(p/'verify_v2_native.mjs').read_text(encoding='utf-8').replace("work/v2-native-verification.json","work/liquid-reset-native-report.json")
for view in ['settings','records']:
 s=s.replace("await page.locator('#nav [data-view="+view+"]').click();", "await page.locator('#sharedDock').click();await page.locator('#nav [data-view="+view+"]').click();")
s=s.replace("v2-native-verification.json","liquid-reset-native-report.json")
(p/'verify_liquid_reset_native.mjs').write_text(s,encoding='utf-8')
s=(p/'verify_v2_confirmations.mjs').read_text(encoding='utf-8').replace("v2-confirmations-verification.json","liquid-reset-output-report.json")
s=s.replace("await page.locator('[data-action=wsGo][data-view=health]').click();", "await page.locator('#filesDock').click();await page.locator('#nav [data-action=wsGo][data-view=health]').click();")
(p/'verify_liquid_reset_outputs.mjs').write_text(s,encoding='utf-8')
s=(p/'make_v21_guide.mjs').read_text(encoding='utf-8').replace('2.1.0','3.0.0').replace('Studio 2.1','Studio 3.0')
(p/'make_v3_guide.mjs').write_text(s,encoding='utf-8')
data=json.loads((root/'package.json').read_text(encoding='utf-8'));data['version']='3.0.0'
data['scripts']['test:ui']='node work/verify_liquid_reset_regression.mjs && node work/verify_liquid_reset_workflow.mjs && node work/verify_liquid_reset_navigation.mjs'
data['scripts']['test:native']='node work/verify_liquid_reset_native.mjs'
data['scripts']['package']='python work/package_v3.py'
(root/'package.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
s=(p/'run_checks.mjs').read_text(encoding='utf-8').replace('verify_studio_v21.mjs','verify_liquid_reset_regression.mjs').replace('verify_studio_workflow.mjs','verify_liquid_reset_workflow.mjs').replace('verify_v2_confirmations.mjs','verify_liquid_reset_outputs.mjs')
s=s.replace("'verify_liquid_reset_workflow.mjs',","'verify_liquid_reset_workflow.mjs','verify_liquid_reset_navigation.mjs',")
(p/'run_checks.mjs').write_text(s,encoding='utf-8')
print('Prepared version 3 documentation contract and actual output/native checks')
