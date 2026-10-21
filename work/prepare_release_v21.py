from pathlib import Path
import json
P=Path(__file__).resolve().parent;root=P.parent
p=P/'verify_studio_workflow.mjs';s=p.read_text(encoding='utf-8').replace("page.locator('[data-action=wsGo]", "page.locator('#nav [data-action=wsGo]")
s=s.replace("/passportExpiry 日期无效 BAD-DATE/", "/passportExpiry.*BAD-DATE/")
p.write_text(s,encoding='utf-8')
p=P/'verify_v2_native.mjs';s=p.read_text(encoding='utf-8').replace("page.locator('#nav>button').count(),4", "page.locator('#nav .nav').count(),18").replace("#nav [data-section=settings]", "#nav [data-view=settings]").replace("#nav [data-section=records]", "#nav [data-view=records]").replace('four-entry shell','document workspace')
p.write_text(s,encoding='utf-8')
p=P/'run_checks.mjs';s=p.read_text(encoding='utf-8').replace("'verify_v2_ui.mjs'", "'verify_studio_v21.mjs','verify_studio_workflow.mjs'");p.write_text(s,encoding='utf-8')
p=root/'package.json';d=json.loads(p.read_text(encoding='utf-8'));d['version']='2.1.0';d['scripts']['test:ui']='node work/verify_studio_v21.mjs && node work/verify_studio_workflow.mjs';d['scripts']['package']='python work/package_v21.py';p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Versioned guides and packages never overwrite older published ZIPs.
s=(P/'make_v2_guide.mjs').read_text(encoding='utf-8').replace('2.0.0','2.1.0').replace('Studio 2.0','Studio 2.1').replace('2026-10-18','2026-10-19');(P/'make_v21_guide.mjs').write_text(s,encoding='utf-8')
s=(P/'package_v2.py').read_text(encoding='utf-8').replace('2.0.0','2.1.0').replace('Studio 2.0','Studio 2.1').replace('2026-10-18','2026-10-19').replace('IMO_Studio_v2_源码','IMO_Studio_v21_源码')
s=s.replace("'v2-ui-verification.json'", "'studio-v21-report.json','studio-workflow-report.json'")
s=s.replace("'app_shell.css'", "'document_shell.css'")
s=s.replace("'verify_v2_ui.mjs'", "'verify_studio_v21.mjs','verify_studio_workflow.mjs','capture_studio.mjs'")
s=s.replace("'make_v2_guide.mjs','package_v2.py','final_v2_check.mjs','preview_v2.mjs'", "'make_v21_guide.mjs','package_v21.py','final_v21_check.mjs'")
s=s.replace('在“基础资料”核对船舶、船员和疫苗；内置 10 份空模板自动载入。','左侧直接打开船舶档案、船员档案和疫苗资料；内置 10 份空模板自动载入。').replace('在“航次工作台”添加靠港港口，直接填写人员、物料和申报；一港、多港操作相同。','上方添加、切换港口，左侧直接打开需要填写的文件；一港、多港操作相同。').replace('每港“预览”选择文件','每港“预览与输出”选择文件')
s=s.replace("notes='# IMO Studio 2.1.0 更新与检查\\n\\n本版把操作集中为四个主要入口、逐港四个页签和生成前集中核对，重做全部界面。新增港口直接加入准备列表。原有资料隔离、连续库存、输出选择、最近 10 港与一页打印规则保留。", "notes='# IMO Studio 2.1.0 更新与检查\\n\\n本版重做为单层文件导航与横向靠港计划。四类申报支持保存默认并只带入新建港口；个人物品支持按港口、日期及阶段保存快照，按船员身份预览匹配再恢复；页面与表格双轴滚动按港口和文件记住。原有资料隔离、连续库存、输出选择、最近 10 港与一页打印规则保留。")
s=s.replace("source_files=[root/'README.md'", "source_files=[root/'PRODUCT.md',root/'DESIGN.md',root/'.impeccable'/'design.json',root/'README.md'")
s=s.replace("v=d.get('passed',d.get('browserChecks'))", "v=d.get('passed',d.get('checks',d.get('browserChecks')))")
s=s.replace("(work/'v2-release-verification.json')", "(work/'studio-v21-release-verification.json')")
(P/'package_v21.py').write_text(s,encoding='utf-8')
