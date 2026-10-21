from pathlib import Path

root=Path(__file__).parent
p=root/'ports.js'
s=p.read_text(encoding='utf-8').replace('超过原页 10 条时按原版式追加工作表。','本次最多输出最近 10 条，其余历史保留在工程中。')
p.write_text(s,encoding='utf-8')

p=root/'make_v13_guide.mjs'
s=p.read_text(encoding='utf-8')
if 'const version=process.argv[2]' not in s:
 s=s.replace("const browser=", "const version=process.argv[2]||'1.3';\nconst browser=",1)
 s=s.replace("const markdown='# IMO 文件包生成器 v1.3 使用说明", "const markdown='# IMO 文件包生成器 v'+version+' 使用说明")
 s=s.replace("'outputs/使用说明_v1.3.md'", "'outputs/使用说明_v'+version+'.md'")
 s=s.replace("'outputs/使用说明_v1.3.html'", "'outputs/使用说明_v'+version+'.html'")
 s=s.replace('生成器 1.3 新手说明', "生成器 '+version+' 新手说明")
 s=s.replace('生成器 v1.3 新手说明', "生成器 v'+version+' 新手说明")
 s=s.replace('验证历史与前序计划合并、最近 10 港筛选、LOCODE 检索、上船地点港口和国家、下拉框批量粘贴、日期／自定义值切换。', '验证历史与前序计划合并、最近 10 港筛选、LOCODE 检索、上船地点港口和国家、下拉框批量粘贴。v1.3.1 将日期控件改为直接输入文本及右侧原生日历，移除了填写方式下拉框。')
 s=s.replace('使用提供的真实 10 份模板及内置清理版本生成 70 份测试 XLSX', 'v1.3 基础版使用提供的真实 10 份模板及内置清理版本生成 70 份测试 XLSX')
 s=s.replace('本版 70 份 XLSX 通过独立只读和 OOXML 检查', 'v1.3 基础版 70 份 XLSX 通过独立只读和 OOXML 检查；v1.3.1 对日期、备注和港口预览进行了专项离线验证，并实际生成 5 份相关 XLSX 核查')
 s=s.replace("const markdown=", "const patchNotes=version==='1.3.1'?'\\n## v1.3.1 界面调整\\n\\n- 日期直接输入日期、NIL 或文字，右侧日历选择日期，不再有方式下拉框。无效日期会继续提示核查，不会自动改成另一日期。\\n- 手动新增历史和计划港口，保安等级默认 1，备注默认货物作业，可自行修改；导入的空白值和已有资料不改写。\\n- 备注多行显示完整英文内容，下方完整列出已选用途；不含制表符的多行文字可直接粘贴到同一备注格，Excel 多列粘贴仍按列导入。\\n- 本次清单按 7 列对齐显示，包含 LOCODE、中文／英文港口名、日期、完整用途和来源；仍最多输出最近 10 条。港口编辑框下方先显示 LOCODE，再显示中文名。\\n- Chrome 和 Edge 的单文件、文件夹版均离线验证日期直接输入、原生日历选取、默认值、完整备注及表格粘贴；未新增原生 Office 打印验收。\\n':'';\nconst markdown=",1)
 s=s.replace('+extracted.markdown+naming+verification;', '+extracted.markdown+naming+verification+patchNotes;')
p.write_text(s,encoding='utf-8')

p=root/'package_v13.py'
s=p.read_text(encoding='utf-8')
if "version=sys.argv[1]" not in s:
 s=s.replace('import zipfile,json,hashlib','import zipfile,json,hashlib,sys')
 s=s.replace("P=Path(__file__).parent;", "version=sys.argv[1] if len(sys.argv)>1 else '1.3'\nP=Path(__file__).parent;")
 s=s.replace("out/'使用说明_v1.3.md'", "out/f'使用说明_v{version}.md'")
 s=s.replace("out/'使用说明_v1.3.html'", "out/f'使用说明_v{version}.html'")
 s=s.replace("(folder/'开始使用.txt').write_text(quick,", "quick=quick.replace('v1.3 —','v'+version+' —')\nif version=='1.3.1':quick+='\\n本版界面：日期框直接输入日期／文字，右侧日历选日期；新增港口默认保安等级 1、货物作业；备注完整换行显示；本次清单按列对齐，LOCODE 在中文名前。\\n'\n(folder/'开始使用.txt').write_text(quick,")
 s=s.replace("out/'IMO文件包生成器_离线版_v1.3.zip'", "out/f'IMO文件包生成器_离线版_v{version}.zip'")
 s=s.replace("summary={'version':'1.3',", "if version=='1.3.1':checks['v131-verification.json']=len(json.loads((P/'v131-verification.json').read_text(encoding='utf-8'))['passed'])\nsummary={'version':version,")
 s=s.replace("P/'v13-release-verification.json'", "P/('v'+version.replace('.','')+'-release-verification.json')")
p.write_text(s,encoding='utf-8')

p=root/'final_v13_check.mjs'
s=p.read_text(encoding='utf-8')
if 'const version=process.argv[2]' not in s:
 s=s.replace('const root=', "const version=process.argv[2]||'1.3';\nconst root=",1)
 s=s.replace("'outputs/IMO文件包生成器_离线版_v1.3.zip'", "'outputs/IMO文件包生成器_离线版_v'+version+'.zip'")
 s=s.replace("'PASS v1.3 ZIP integrity", "'PASS v'+version+' ZIP integrity")
 s=s.replace("'work/v13-final-package-check.json'", "'work/v'+version.replaceAll('.','')+'-final-package-check.json'")
p.write_text(s,encoding='utf-8')
