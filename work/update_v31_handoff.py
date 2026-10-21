from pathlib import Path

root=Path(__file__).resolve().parent.parent
(root/'README.md').write_text('''# IMO Studio 3.1.0 · Liquid Glass

本机离线的 IMO 航次文件工作台。3.1 采用用户指定的 yzrt 纯 CSS 液态玻璃材质，增加简单外观选项，修复矮屏编辑空间、弹窗焦点和批量操作栏。保留多港工程、十份 Excel 原模板、连续库存、申报默认方案、个人物品快照与滚动记忆。

## 开始使用

完整解压 `IMO文件包生成器_Liquid_Glass_v3.1.0.zip`，双击 `启动生成器.exe`，保留 assets 文件夹。直接打开 `打开生成器.html` 也可离线编辑，首次写入工程须授权文件夹。

从“开始准备港口”进入；顶部切换各港。底部“文件”选择申报文件，“资料”管理共用档案，“输出”检查并选择文件。“保存工程”保存整批航次。Ctrl / Command + K 打开文件库，Enter 进入结果，Esc 关闭。

右上角齿轮进入总设置。主题、强调色、字号和表格密度直接可见；展开“玻璃与背景”再选玻璃效果、背景配色、圆角和动态。“恢复默认外观”仅重置外观，不影响保存、命名和工程。选择即时生效，可通过总设置备份迁移；生成的 Excel 保持模板样式。

## 开发与构建

使用 Node.js 24+、Python 3.11+ 和 Chrome / Edge，固定依赖见 package.json、requirements-dev.txt。

```text
npm install
python -m pip install -r requirements-dev.txt
python work/build.py
```

Windows 的 python 若为商店别名，改用实际 Python 路径。可用 IMO_NODE_MODULES 指定已安装依赖目录，构建本身不联网。

当前视觉为 liquid_desk.css、yzrt_material.css、appearance.css 顺序加载；css_glass.js 最后加载，负责有像素上限的背景和系统偏好。旧 fusion_glass.js 已退出运行包。修改 work 内源码再构建，不手改生成的 HTML。

## 检查与发布

```text
npm test
npm run test:native
python work/verify_multiport_xml.py
node work/capture_yzrt.mjs
node work/make_v31_guide.mjs
python work/package_v31.py
node work/final_v31_check.mjs
python work/verify_v31_source_package.py
```

检查覆盖实际界面、设置备份、键盘弹窗、滚动、保存重启、多港隔离、连续库存、ZIP 与工作表结构。自动检查不代表所有环境均无缺陷；Excel / WPS 原生实际打印仍需在使用电脑核对。

新版入口 outputs/IMO_Liquid_Glass_3.1.html；离线包、源码包、详细说明和交接 MD 均在 outputs。保留旧入口和 ZIP，不把工程及本机认证文件打入发布包。

接续规则见 制作思路与开发交接.md、PRODUCT.md、DESIGN.md 和 .impeccable/design.json。上游原始文件、完整许可与修改说明见 THIRD_PARTY_NOTICES.md 和 work/reference-yzrt，分发时一起保留。
''',encoding='utf-8')

product=root/'PRODUCT.md'
p=product.read_text(encoding='utf-8')
if '## 当前材质与简单外观 · 3.1' not in p:
 p+='''

## 当前材质与简单外观 · 3.1

用户指定使用 https://gitee.com/greyd097/yzrt/tree/master/ 的源码优化，并要求更多简单外观设置与三个智能体协作。保留 3.0 开放工作台拓扑，采用实际“纯CSS液态玻璃”源码的局部材质。边缘、高光与层次由 CSS 实现；本地背景为有像素上限、按需绘制的 Canvas，不再采用持续更新的 SVG 位移透镜。

主题、强调色、字号、密度保持直接可见；玻璃效果、背景配色、圆角与动态置于默认折叠的“玻璃与背景”。恢复默认外观只复位九个外观字段，不动工程、保存、命名与启动选项。系统减少动态／透明度优先，固定较淡署名始终显示。设置即时生效，保存在浏览器，可备份迁移；不影响 Excel。

来源、原始文件、GPL v2 正文及修改说明随运行包和源码包保留。短屏编辑区、保护性弹窗焦点和选择行后的批量栏同步纳入本轮优化。多港隔离、最近十港、一页打印、人工申报确认与工程轮换规则继续适用。
'''
 product.write_text(p,encoding='utf-8')

file=root/'制作思路与开发交接.md'
s=file.read_text(encoding='utf-8')
s=s.replace('> 3.0 当前入口：outputs/IMO_Liquid_Glass_3.0.html。第 2、3、5.3、16 节描述本次全面重置；业务数据与输出规则继续沿用。换环境优先阅读这些章节、PRODUCT.md 和当前 DESIGN.md。','> 3.1 当前入口：outputs/IMO_Liquid_Glass_3.1.html。第 2、3 节说明保留的工作台，第 5.3、17 节说明当前材质、设置与发布方法；第 16 节为 3.0 历史审查记录。换环境优先阅读这些章节、PRODUCT.md 和当前 DESIGN.md。')
s=s.replace('版本：3.0.0','版本：3.1.0')
s=s.replace('玻璃是代码实现的材质：本地 Canvas 绘制水色流线，SVG 位移映射在控件圆角边缘折射背景，层叠高光、暗侧缘和轻微色散表现弧面厚度。表格采用清晰的数据背板。深色、移动端、减少动态效果和减少透明度都有对应行为。旧预览、旧截图和旧 DESIGN 不是当前视觉依据。','3.1 保留这一拓扑，材质改用用户指定的 yzrt 纯 CSS 源码：对向内阴影、斜向高光、内层软白边和下侧暗缘。Canvas 仅在尺寸、主题或配色变化时重绘，不加载 SVG 位移映射；表格保持可读背板，系统减少动态／透明度优先。当前证据在 .impeccable/review/yzrt/。')
s=s.replace('app_shell.js            ← 2.1 单层文件导航、港口切换与集中核对','app_shell.js            ← 开放工作台、文件库、港口切换与集中核对')
s=s.replace('liquid_desk.css        ← 3.0 唯一视觉与响应式入口','liquid_desk.css         ← 工作台布局与基础组件')
s=s.replace('fusion_glass.js        ← 3.0 透镜折射与水色光场','yzrt_material.css       ← 有来源说明的 CSS 材质\n│  ├─ appearance.css          ← 外观模式、系统偏好与矮屏覆盖\n│  ├─ css_glass.js            ← 按需背景绘制与偏好同步')
s=s.replace('package_v3.py           ←','package_v31.py          ←').replace('make_v3_guide.mjs        ←','make_v31_guide.mjs       ←')
s=s.replace('work/app_shell.js 是最终渲染路径，work/app.html 提供新壳体。work/liquid_desk.css 是 APP_STYLE 的唯一视觉入口；旧 document_shell.css、fusion_glass.css 不再加载。旧 v12 / workflow / multiport 样式保留领域编辑结构，3.0 对交互表面有明确覆盖。','work/app_shell.js 是最终渲染路径，work/app.html 提供壳体。APP_STYLE 顺序拼接 liquid_desk.css、yzrt_material.css、appearance.css；后两者负责实际材质和偏好／矮屏覆盖。旧 document_shell.css、fusion_glass.css 不再加载；v12 / workflow / multiport 保留领域编辑结构。')
s=s.replace('fusion_glass.js 负责本地水色场和七种透镜角色：靠港条、操作坞、资料库、编辑面、欢迎入口、当前操作、当前港口。位移图按尺寸缓存，DPR 上限 1.25，环境更新不超过约 8 帧/秒，页面隐藏暂停、减少动态效果冻结。CSS 有无 SVG 支持的退化路径和减少透明度处理；透明效果不能参与业务状态或导出。','css_glass.js 最后加载，保留 StudioGlass 对象。背景缓存键为尺寸、主题、配色；DPR 上限 1.25 且最终像素上限 2,000,000，不做持续 JS 重绘。可选 CSS 合成层缓慢移动，隐藏页面暂停，减少动态时关闭。减少透明度／清晰模式移除模糊和装饰高光。没有 SVG filters、位移图或表格监听；渲染不改业务及导出。')
s=s.replace('发布命令：构建 → npm test → npm run test:native → python work/verify_multiport_xml.py → node work/make_v3_guide.mjs → python work/package_v3.py → node work/final_v3_check.mjs。旧版压缩包保留，3.0 源码包带完整空模板与本地依赖版本，换环境后重新安装依赖、构建即可。','当前发布命令见第 17 节。保留旧 ZIP，3.1 源码包带完整空模板、第三方原始文件和固定依赖版本。')
s=s.replace('## 16. 当前视觉与交接状态：Liquid Desk 3.0','## 16. 3.0 历史视觉与审查记录')
s=s.replace('当前设计以 work/liquid-reset-direction.md 为方向合同，以最终 DESIGN.md 和 .impeccable/design.json 为可复用系统。','3.0 的拓扑合同为 work/liquid-reset-direction.md；3.1 当前材质的补充合同为 work/yzrt-integration-direction.md，最终 DESIGN.md 与 .impeccable/design.json 记录当前系统。')
if '## 17. 3.1 源码材质、外观设置与接续' not in s:
 s+='''

## 17. 3.1 源码材质、外观设置与接续

### 17.1 实际来源与改动

仓库为 https://gitee.com/greyd097/yzrt/tree/master/，采用“纯CSS液态玻璃”目录，读取真实 HTML/CSS，未执行上游脚本。仓库快照为 `2cae7d6a61d6a019a5c40bda05dc6a065ae7e246`，目标目录最后修改提交为 `2afaed0b401dbc39cdf24cce9420d7620c1fdd59`。

work/reference-yzrt 保留原始字节、SHA-256、Git blob 标识及 GPL v2 正文。修改版 yzrt_material.css 有来源说明，未沿用全局禁止选择、全局动画、整层 contrast 与固定高层级。THIRD_PARTY_NOTICES.md 说明归属和改动；运行包和源码包带原始文件及许可，单 HTML 也嵌入正文。研究用 upstream/.git 不打包。

### 17.2 外观状态与边界

UI_DEFAULTS / validateUISettings 在 settings.js，继续使用 IMO-UI-1.2 本地键和原设置备份 schema；旧设置缺新字段时按默认补齐，非法枚举整体拒绝。工程格式不变。

| 字段 | 默认 | 可选值 | 位置 |
| --- | --- | --- | --- |
| theme | light | light / dark / auto | 外观 |
| accent | blue | blue / teal / violet | 外观 |
| fontSize | 14 | 12 / 14 / 16 / 18 | 外观 |
| density | normal | compact / normal / relaxed | 外观 |
| glassStyle | liquid | liquid / soft / clear | 玻璃与背景 |
| backgroundStyle | ocean | ocean / aurora / plain | 玻璃与背景 |
| cornerStyle | rounded | rounded / soft | 玻璃与背景 |
| motion | auto | auto / reduced | 玻璃与背景 |
| tableFont | 12 | 11 / 12 / 14 / 16 | 更多显示与操作 |

APPEARANCE_SETTING_KEYS 只列以上九项。恢复外观先复制九项默认再校验，保留其他选项：不动工程、保存位置、命名规则、自动保存、临期提醒及预览缩放。没有作者文字／开关设置。

applyUISettings 同步 root data-theme、data-density、data-glass-style、data-background-style、data-corner-style、data-motion，持久化后调用 StudioGlass.refreshPreferences。派生 data-effects-motion / data-effects-transparency 表示系统优先后的结果，不进工程，用户不能覆盖系统减少动态／透明度。

### 17.3 修复与验证范围

短高度规则以 640px 为界收紧壳体。844×390、390×480 的实际编辑区分别约 194.6px、252px，可滚动到输入行且不被操作坞遮挡。updateBulkCounts 立即同步批量栏可见性，清空选择时隐藏。

modal()/closeModal() 记录原打开控件和背景 inert 原值；Tab 双向循环，空弹窗聚焦自身，Escape 只关闭一次。替换预览／确认保持同一会话，完全关闭后恢复原焦点，preventScroll 避免跳动。原生非模态文件库不走此路径。

本次实测：Chrome / Edge 界面回归 32 组、工作流 18 组、CSS 材质与文件库 16 组、外观 26 组、弹窗及批量 14 组、首页滚动 2 组、实际输出 2 组、库存界面 16 组；Windows 保存／重启 12 组。多港 56 组、库存算术 14 组；60 本真实 XLSX、66 张原有可见工作表通过结构／一页配置检查。4K DPR 2 背景为 1,998,100 像素，空闲 paintCount 不变；这不是所有硬件帧率保证。

当前审查记录 work/yzrt-finish-review.md：完整审查通过界面矩阵，唯一材料修正是同步过时 DESIGN 说明，最终评分以该文件最新结论为准。自动 detector 被 Windows 组策略阻止；Office 原生实际打印未验收，不得写成通过。

### 17.4 换环境与发布

先读本文件、PRODUCT.md、DESIGN.md，再看 work/yzrt-integration-direction.md 和 THIRD_PARTY_NOTICES.md。不要从旧预览或旧 fusion_glass.js 继续，不手改生成 HTML。

```text
npm install
python -m pip install -r requirements-dev.txt
python work/build.py
npm test
npm run test:native
python work/verify_multiport_xml.py
node work/capture_yzrt.mjs
node work/make_v31_guide.mjs
python work/package_v31.py
node work/final_v31_check.mjs
python work/verify_v31_source_package.py
```

源码验证解压到 work/source-v31-qa-时间戳目录，用固定依赖重建，不访问用户工程。分发不含 node_modules、研究 Git、真实工程或认证文件；正式“保存工程”必须为空；保留旧 3.0 ZIP。源码包内留存的测试报告是本次证据，换环境应重新执行检查。

交付入口 IMO_Liquid_Glass_3.1.html，离线包 IMO文件包生成器_Liquid_Glass_v3.1.0.zip，源码包 IMO_Liquid_Glass_v3.1.0_开发源码.zip，交接 制作思路与开发交接_v3.1.md。使用说明从实际帮助导出为 HTML/MD，包含 12 主题、24 命名字段及四项外观说明。
'''
file.write_text(s,encoding='utf-8')
print('Updated README, product and current implementation handoff.')
