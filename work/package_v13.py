from pathlib import Path
import zipfile,json,hashlib,sys
version=sys.argv[1] if len(sys.argv)>1 else '1.3'
P=Path(__file__).parent;out=P.parent/'outputs';folder=out/'IMO文件包生成器'
guide=(out/f'使用说明_v{version}.md').read_text(encoding='utf-8')
(out/'使用说明与验收记录.md').write_text(guide,encoding='utf-8')
(folder/'使用说明.md').write_text(guide,encoding='utf-8')
(folder/'使用说明.html').write_bytes((out/f'使用说明_v{version}.html').read_bytes())
quick='''IMO 文件包生成器 v1.3 — 开始使用

1. 完整解压文件包，双击“启动生成器.exe”。保留 assets 文件夹。
2. 看右上角模板应为 10/10。内置空模板已准备好，无需每次导入。
3. 确认船舶档案，准备进港与离港两份名单，再填本次航次和专项资料。
4. 底部“检查资料”后看每份预览，再“生成并下载 ZIP”。ZIP 内为 10 份独立 XLSX。
5. 保存工程默认写入本目录“保存工程”，文件名：保存日期_时间_毫秒_靠港港口.imoproject.json。
   默认最多保留 10 份受管记录，按保存时间删除最旧记录。独立“另存为”不参与轮换。
6. 下次从启动器打开会恢复最新工程。可在总设置自定义保存目录、文件名、自动保存和启动行为。
7. 关闭所有生成器网页后默认约 8 秒退出；总设置或托盘菜单可改成“常驻托盘”。
8. 所有申报表不生成续页，超量时插入行并缩放为一页；健康主表和附表分别一页。
   实际字号及页数请在 Excel/WPS 打印预览检查，当前环境未完成原生 Office 打印验收。

重要区别：
“生成 ZIP”是申报文件；“保存工程”是下次继续填写的完整资料（包含模板）；二者用途不同。
历史清单按本次计划站合并前序站与已存历史，再取最近 10 条，预计日期须核实。
物料可按港口和盘点日期存快照，伙食估算先确认标准与计算结果再写入。
应税／受限物品总申报默认 NIL；健康答案和各人烟酒数量不会自动假设。

详细新手说明：双击“使用说明.html”，或在网页侧边栏打开“使用说明与限制”。
命名规则有 24 项可用信息及实时示例，入口：左下角“总设置 → 检查与导出”。

直接双击“打开生成器.html”也能填表、读 PDF 和下载；首次保存工程要在浏览器选择并授权文件夹。
Windows 启动器只使用本机 127.0.0.1 保存服务，不上传资料。纯 HTML 模式不启动托盘程序。
升级时先备份旧“保存工程”目录和独立工程文件，再在新版导入工程；不要覆盖未备份资料。
'''
quick=quick.replace('v1.3 —','v'+version+' —')
if version in ['1.3.1','1.3.2','1.3.3','1.3.4','1.3.5']:quick+='\n本版界面：日期框直接输入日期／文字，右侧日历选日期；新增港口默认保安等级 1、货物作业；备注完整换行显示；本次清单按列对齐，LOCODE 在中文名前。\n'
if version in ['1.3.2','1.3.3','1.3.4','1.3.5']:quick+='职务选项扩充为 50 项，按部门分组，包含初级三副 Jr. 3rd Off；仍可选“自定义 / 其他…”输入本船使用的写法。生成 Excel 时写入英文职务。\n'
if version in ['1.3.3','1.3.4','1.3.5']:quick+='职务英文写法统一为 Chief Off、2nd Off、3rd Off、Jr. 3rd Off、Chief Eng 等；旧工程中原有缩写保留，重新选择统一选项时才更新。\n'
if version=='1.3.4':quick+='本次港口清单已独立为顶部页签，历史与未来计划分别编辑。自动恢复最新工程、整包 ZIP 成功后保存工程、未保存关闭提醒默认开启；升级时启用一次，后续保留手动选择。修改选项和移动记录后保留滚动位置，不再跳回顶部。\n'
if version=='1.3.5':quick+='本版修复工程恢复丢失自定义申报、港口批量粘贴联动、冲突证件误合并及浏览器另存为备份问题。详细记录见“本轮BUG检查与修复.md”。\n'
if version in ['1.4.0','1.4.1','1.5.0']:
 quick+='\n新版入口：侧边栏“航次交接与方案”“进离港人员对照”。顶部固定航次栏旁可撤销／重做。表格左侧勾选多行，批量修改先预览后应用。生成 ZIP 前核对与上次生成的变化。\n升级可在总设置打开“迁移旧版资料”，选择旧版目录或备份文件，预览后恢复；不需要手动复制资料目录。\n个人署名：作者：郑晓天 / Author: Zheng Xiaotian；程序更新 / Updated: 2026-10-18。仅在侧边栏左下角显示，不提供文字编辑。\n详细新增功能见“本版更新说明.md”。\n'
 (folder/'本版更新说明.md').write_bytes((out/f'更新说明_v{version}.md').read_bytes())
if version=='1.4.1':quick+='\n作者署名固定默认显示，深浅为较淡。总设置不再提供作者署名、显示开关或深浅选项。旧版的隐藏和深浅选择不再生效，其余设置继续保留。\n'
if version=='1.5.0':
 (folder/'本轮BUG检查与修复.md').write_bytes((out/f'BUG检查记录_v{version}.md').read_bytes())
 quick='''IMO 文件包生成器 v1.5.0 — 开始使用

1. 完整解压文件包，双击“启动生成器.exe”。请保留 assets 文件夹。
2. 先确认船舶档案，导入或填写船员档案，准备当前港的进离港名单和航次资料。
3. 一次准备多个港口：打开“多港口准备工作台”，补齐计划港口，勾选需要的站点，建立港口任务。
4. 按“准备此港”逐港填写。先安排上下船人员，再做连续库存推算，最后分别核对日期、健康和 NIL。
5. 每港可选择本次需要的文件。到第三步逐港检查，再下载按港口分文件夹的整批 ZIP。
6. 点底部“保存工程”保存整个工作台；下次打开自动恢复。“单港工程”只导出一港，适合交接。

连续库存怎么用：
先选一份真实盘点和日期，填写每项伙食每人每天的耗用量，再按港口加入补给并核对各段人数。
点“预览全部港口”，核对到港、离港剩余及耗用明细，通过后再应用。
起始盘点会固定，重复预览不重复扣减；实际更换起点时点“重新读取当前库存”。
不输出文件的中间站也参与推算。缺标准、缺日期、单位不一致或库存短缺时先处理，不能直接应用。
计算结果是估算，申报前请结合实际盘点核对。详细例子见“使用说明.html”。

保存与升级：
默认写入解压目录“保存工程”，文件名为保存日期_时间_毫秒_靠港港口.imoproject.json。
默认最多保留 10 个受管工程版本；一个工程可包含多个港口，不受“10 个备份版本”限制。
“另存为”保留独立备份，不参与普通保存轮换。可在左下角总设置修改目录、命名和自动保存。
升级前备份旧工程，在新版导入或通过“迁移旧版资料”恢复；不要覆盖未备份的旧资料。

要分清三件事：
“生成 ZIP”提供申报用 Excel；“保存工程”供以后继续编辑；“物料快照”记录一次盘点。
每港最多选择 10 类文件，整批总文件数可超过 10；历史挂靠港清单每港只输出最近 10 条。
原工作表不生成续页，超量插入行并缩放为一页，健康主表和附表各一页。
实际打印字号和页数请在 Excel/WPS 打印预览核对；本环境未完成原生 Office 打印验收。

其他提示：
直接打开“打开生成器.html”也能填写；首次保存目录需浏览器授权。
从启动器打开才能自动保存到解压目录。启动器只使用本机服务，不上传资料。
默认关闭全部生成器网页后约 8 秒退出，也可在总设置选择常驻托盘。
作者：郑晓天 / Author: Zheng Xiaotian · 更新 / Updated: 2026-10-18，侧边栏默认较淡显示。
详细步骤、24 项命名规则、旧版资料迁移与常见问题，见“使用说明.html”和“本版更新说明.md”。
'''
(folder/'开始使用.txt').write_text(quick,encoding='utf-8-sig')
(folder/'配置参考'/'港口代码核对记录.json').write_bytes((P/'port-locode-audit.json').read_bytes())
(folder/'assets'/'港口数据来源.txt').write_text('''港口参考：Höegh Autoliners 官方代理资料，2026-10-17。
https://autoliners2.hoegh.com/web/basic/hal_commoncontacts.nsf/AgentPDF/AgentPDF/$File/Agent.pdf?openElement=
含区域覆盖及历史地点，不代表每港当前直航或本船本次实际挂靠。

UN/LOCODE：United Nations Economic Commission for Europe，官方 2025-1 发布数据。
核对日期：2026-10-18。官方说明／下载入口：
https://unlocode.unece.org/publications/
https://service.unece.org/trade/locode/Service/LocodeColumn.htm
官方页面标注 UN/CEFACT standards 采用 CC BY 4.0。

304 个参考地点均有中文检索名，293 个匹配已发布代码；11 个未唯一核定条目不强行赋码。
9 个歧义条目提供 20 个从官方 CSV 核对的候选。中文名是常用译名或音译，不声称联合国官方中文名称。
完整核对标识、原始下载校验值与待确认原因见“配置参考/港口代码核对记录.json”。
''',encoding='utf-8')
for part in folder.rglob('*'):
 if part.name in ['本地设置.json','.imo-local-session.json']or part.name.endswith('.imoproject.json'):raise RuntimeError('Release contains runtime data: '+str(part))
assert not list((folder/'保存工程').iterdir())
archive=out/f'IMO文件包生成器_离线版_v{version}.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 for part in sorted(folder.rglob('*')):
  rel=part.relative_to(out).as_posix()
  if part.is_dir():z.writestr(rel+'/',b'')
  else:z.write(part,rel)
with zipfile.ZipFile(archive)as z:
 assert z.testzip()is None
 assert sum(n.endswith('.xlsx')for n in z.namelist())==10
 assert any(n.endswith('/启动生成器.exe')for n in z.namelist())
 assert any(n.endswith('/保存工程/')for n in z.namelist())
 assert any(n.endswith('/使用说明.html')for n in z.namelist())
checks={}
for name in ['v13-verification.json','v13-xml-verification.json','v13-lifecycle-naming-verification.json','storage-settings-verification.json','pdf-input/pdf-verification.json']:
 data=json.loads((P/name).read_text(encoding='utf-8'));checks[name]=len(data['passed'])if isinstance(data.get('passed'),list)else data.get('passed')
if version in ['1.3.1','1.3.2','1.3.3','1.3.4','1.3.5']:checks['v131-verification.json']=len(json.loads((P/'v131-verification.json').read_text(encoding='utf-8'))['passed'])
if version=='1.3.2':checks['v132-rank-verification.json']=len(json.loads((P/'v132-rank-verification.json').read_text(encoding='utf-8'))['passed'])
if version=='1.3.3':checks['v133-rank-verification.json']=len(json.loads((P/'v133-rank-verification.json').read_text(encoding='utf-8'))['passed'])
if version=='1.3.4':checks['v134-verification.json']=len(json.loads((P/'v134-verification.json').read_text(encoding='utf-8'))['passed'])
if version=='1.3.5':
 for name in ['v135-bug-verification.json','v135-regression-verification.json','v135-xml-verification.json','v135-storage-verification.json']:
  data=json.loads((P/name).read_text(encoding='utf-8'));checks[name]=len(data['passed']) if isinstance(data.get('passed'),list) else data.get('passed')
if version in ['1.4.0','1.4.1']:
 for name in ['v140-workflow-verification.json','v140-edge-verification.json','v140-regression-verification.json','v140-xml-verification.json','v140-storage-verification.json','v140-scroll-verification.json','v135-bug-verification.json','pdf-input/v140-pdf-verification.json']:
  data=json.loads((P/name).read_text(encoding='utf-8'));checks[name]=len(data['passed']) if isinstance(data.get('passed'),list) else data.get('passed')
if version=='1.4.1':
 data=json.loads((P/'v141-credit-verification.json').read_text(encoding='utf-8'));checks['v141-credit-verification.json']=len(data['passed'])
if version=='1.5.0':
 for name in ['multiport-verification.json','multiport-ui-verification.json','multiport-stock-verification.json','route-inventory-verification.json','multiport-full-xml-verification.json','v150-regression-verification.json','v150-xml-verification.json','v150-storage-verification.json','v140-workflow-verification.json','v135-bug-verification.json','pdf-input/v150-pdf-verification.json']:
  data=json.loads((P/name).read_text(encoding='utf-8'));value=data.get('passed',data.get('browserChecks'));checks[name]=len(value) if isinstance(value,list) else value
summary={'version':version,'zipBytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'checks':checks,'nativeOfficePrintVerified':False}
(P/('v'+version.replace('.','')+'-release-verification.json')).write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False))
