from pathlib import Path
import re
root=Path(__file__).resolve().parent.parent
(root/'README.md').write_text('''# IMO Studio 3.0.0 · Liquid Glass

本机离线的 IMO 航次文件工作台。3.0 全面更换页面布局与视觉系统，保留多港工程、原始 Excel 模板、连续库存、申报默认方案、个人物品快照和滚动位置记忆。

## 普通使用

下载 `IMO文件包生成器_Liquid_Glass_v3.0.0.zip`，完整解压后双击 `启动生成器.exe`。不要移走 `assets` 文件夹。直接打开 `打开生成器.html` 也能离线编辑，首次写入工程时须选择并授权文件夹。

顶部“靠港计划”切换港口；底部“文件”打开申报文件面板，“资料”管理船舶、人员、默认方案和工程记录，“航次”填写本港资料，“输出”核对文件。右上角齿轮进入设置。当前文件标题也能切换文件。Ctrl / Command + K 打开文件搜索，Enter 进入匹配文件，Esc 关闭。

先保存自己的旧工程，再在新版导入。新版离线包不包含演示名单或个人工程。

## 开发环境

Node.js 24+、Python 3.11+；使用 Chrome / Edge 检查。依赖按 package.json、requirements-dev.txt 固定版本安装：

```text
npm install
python -m pip install -r requirements-dev.txt
python work/build.py
```

若 Python 命令指向 Windows 商店，请用真正的 Python 解释器路径。可用 `IMO_NODE_MODULES` 指向已经安装的依赖，不需要把依赖复制到源码包。

## 检查

```text
npm run test:ui
node work/verify_liquid_reset_outputs.mjs
npm run test:native
npm run test:multiport
npm run test:inventory
```

UI 检查覆盖实际编辑、默认方案、快照、滚动位置、文件搜索、Esc 焦点返回、移动端资料库和真实玻璃响应。输出检查实际生成原有十份文件；本地启动器检查在隔离测试目录中保存、轮换、恢复与另存为，不使用用户的保存目录。

## 构建与发布

```text
python work/build.py
node work/make_v3_guide.mjs
python work/package_v3.py
node work/final_v3_check.mjs
python work/verify_v3_source_package.py
```

新版入口是 `outputs/IMO_Liquid_Glass_3.0.html`。离线运行包、源码包、使用说明与开发交接文档均在 outputs。旧 2.1 ZIP 与入口保留。

当前视觉源是 `work/liquid_desk.css`、`work/app_shell.js`、`work/fusion_glass.js` 与 `work/app.html`。build.py 的 APP_STYLE 只读取 liquid_desk.css；旧 document_shell.css / fusion_glass.css 不是 3.0 的视觉依据。十份原模板与 OOXML 输出逻辑继续保留。

换环境前阅读 `制作思路与开发交接.md`、PRODUCT.md、DESIGN.md 和 `.impeccable/design.json`。本机实际 Excel / WPS 打印仍需人工确认；自动检查证明的是工作表结构与单页缩放配置。
''',encoding='utf-8')
p=root/'制作思路与开发交接.md';s=p.read_text(encoding='utf-8')
def section(start,end,text):
 global s
 a=s.index(start);b=s.index(end,a);s=s[:a]+text+'\n\n'+s[b:]
section('## 2.','## 3.','''## 2. 3.0 为什么全面重置

用户已明确否定 2.1 的固定侧栏与官网极简结合版，要求跳出原框架、全面重置为充分表达 Liquid Glass 的页面。3.0 的业务模式仍是同一份离线多港工程，界面拓扑和视觉源已替换。

不再常驻十八项左侧菜单。顶部保留小型工程上下文和独立靠港胶囊，底部悬浮操作坞提供航次、文件、资料、输出、保存与生成。中央是宽幅玻璃编辑面，文件与常用资料采用按需展开的原生 popover。首次使用为大标题与真实港口入口组成的开放工作台。

玻璃是代码实现的材质：本地 Canvas 绘制水色流线，SVG 位移映射在控件圆角边缘折射背景，层叠高光、暗侧缘和轻微色散表现弧面厚度。表格采用清晰的数据背板。深色、移动端、减少动态效果和减少透明度都有对应行为。旧预览、旧截图和旧 DESIGN 不是当前视觉依据。''')
section('## 3.','## 4.','''## 3. 页面与内容归属

| 入口 | 内容 |
| --- | --- |
| 顶部靠港计划 | 添加与切换已经准备的港口，各港资料独立 |
| 底部航次 | 本港阶段、日期、前后港、停留时间和签署日期 |
| 底部文件 | 两份船员名单、个人物品、港口清单、物料、健康与病例、旅客、药品、NIL、疫苗；人员变动与文件预览也在此 |
| 底部资料 | 申报默认方案、船舶档案、船员档案、工程记录、总设置 |
| 底部输出 | 选择本港要输出的文件、检查问题、查看待写入模板 |
| 右上角齿轮／帮助 | 设置与详细操作说明 |
| 底部保存／检查并生成 | 保存全部工程；或集中核对后生成选定港口的 ZIP |

文件标题也能打开文件面板；Ctrl / Command + K 搜索，Enter 进入首个匹配文件，Esc 一次关闭并返回焦点。原生 popover 允许点击外部收起。移动端使用同一套文件资料库，不依赖隐藏的桌面侧栏或嵌套标签。

WorkspaceUI 的临时视图状态不进入业务数据。ViewMemory 仍按工程、港口和文件保存主区域、表格双轴、展开区域和输入焦点。显示首页时应移除旧编辑面的光学 filter，避免空白区域出现矩形裁切。''')
section('### 5.3','## 6.','''### 5.3 统一外壳，保留稳定业务边界

work/app_shell.js 是最终渲染路径，work/app.html 提供新壳体。work/liquid_desk.css 是 APP_STYLE 的唯一视觉入口；旧 document_shell.css、fusion_glass.css 不再加载。旧 v12 / workflow / multiport 样式保留领域编辑结构，3.0 对交互表面有明确覆盖。

文件资料库使用原生 popover，不用 modalRoot 模拟普通导航。后者只用于保护性确认、恢复预览、导入映射和生成核对。点击文件后关闭资料库再渲染；搜索输入的 Escape 必须显式处理，避免 type=search 的原生清空行为截获关闭。

fusion_glass.js 负责本地水色场和七种透镜角色：靠港条、操作坞、资料库、编辑面、欢迎入口、当前操作、当前港口。位移图按尺寸缓存，DPR 上限 1.25，环境更新不超过约 8 帧/秒，页面隐藏暂停、减少动态效果冻结。CSS 有无 SVG 支持的退化路径和减少透明度处理；透明效果不能参与业务状态或导出。

全局基础字号和表格字号独立，主题、常用配置和工程兼容逻辑保留。自动申报开关必须使用 input[type=checkbox][data-default-auto] 的完整选择器，避免基础复选框尺寸把 34×21 的开关压缩。''')
section('## 16.', '\uffff' if '\uffff' in s else '## 16.', '') if False else None
if '## 16.' in s:
 s=s[:s.index('## 16.')]+'''## 16. 当前视觉与交接状态：Liquid Desk 3.0

当前设计以 work/liquid-reset-direction.md 为方向合同，以最终 DESIGN.md 和 .impeccable/design.json 为可复用系统。极致 Liquid Glass 是用户明确指定的材料要求；深浅主题、表单、表格、弹窗、欢迎和导航都属于同一套界面。旧 2.1 结合版已经被替代。

本轮 Impeccable launcher / concept-seed 曾被 Windows 组策略阻止，不能伪称产生过设计种子、批准的效果图或自动 detector 分数。代码实现与真实渲染截图是证据，截图中的 PACIFIC TEST 与人员均为明确标注的演示数据，正式包不内置该工程。

审查记录：work/liquid-reset-finish-review.md。完整首轮审查识别三个具体问题：搜索 Esc、过时导航说明和开关几何。修复后同一组十个视口／状态重新捕获，并由原审查者逐项评分。该结论限于列出的修复，不等同于无任何 Bug。

主要新检查：verify_liquid_reset_regression.mjs、verify_liquid_reset_workflow.mjs、verify_liquid_reset_navigation.mjs、verify_liquid_reset_outputs.mjs、verify_liquid_reset_native.mjs。它们分别覆盖领域行为、新界面的实际操作、原生资料库与光学交互、真实十文件输出、本地保存和进程重启。原有库存、模板和多港领域测试继续保留。

发布前先运行 build、导出 guide、运行 package_v3.py；然后 final_v3_check.mjs 检查两个压缩包及 Chrome/Edge 单文件与文件夹离线运行，verify_v3_source_package.py 从全新解压目录独立构建。不要把用户工程或本地认证数据放入分发包，不覆盖旧 2.1 压缩包。
'''
s=s.replace('版本：2.1.0','版本：3.0.0').replace('IMO_Studio_2.1.html','IMO_Liquid_Glass_3.0.html').replace('IMO文件包生成器_离线版_v2.1.0.zip','IMO文件包生成器_Liquid_Glass_v3.0.0.zip').replace('IMO_Studio_v2.1.0_开发源码.zip','IMO_Liquid_Glass_v3.0.0_开发源码.zip')
s=s.replace('verify_studio_v21.mjs','verify_liquid_reset_regression.mjs').replace('verify_studio_workflow.mjs','verify_liquid_reset_workflow.mjs').replace('package_v21.py','package_v3.py').replace('make_v21_guide.mjs','make_v3_guide.mjs').replace('final_v21_check.mjs','final_v3_check.mjs').replace('verify_source_package.py','verify_v3_source_package.py')
s=s.replace('> 本文以','> 本文以')
if '3.0 当前入口' not in s:
 s=s.replace('\n', '\n\n> 3.0 当前入口：outputs/IMO_Liquid_Glass_3.0.html。第 2、3、5.3、16 节描述本次全面重置；业务数据与输出规则继续沿用。换环境优先阅读这些章节、PRODUCT.md 和当前 DESIGN.md。\n',1)
p.write_text(s,encoding='utf-8')
print('Updated README and complete handoff for the 3.0 reset')
