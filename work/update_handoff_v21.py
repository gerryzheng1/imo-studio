from pathlib import Path
P=Path(__file__).resolve().parent;root=P.parent
p=root/'制作思路与开发交接.md';s=p.read_text(encoding='utf-8').replace('版本：2.0.0','版本：2.1.0').replace('程序更新日期：2026-10-18','程序更新日期：2026-10-19')
a=s.index('## 2. 为什么重做');b=s.index('## 4. 交付与开发目录',a)
s=s[:a]+'''## 2. 为什么重新设计 2.1

用户否定了 2.0 的多层工作台，也否定过独立的 macOS / Liquid Glass 壁纸效果稿。它们不再是视觉依据。本次从“选一个港口、直接填一份文件”的操作顺序重置界面，不再沿用四大类页签加子页签或两层侧栏。

- 上方横向靠港计划负责选港；同港再次挂靠按站次区分。
- 单层左侧文件目录直接打开 10 类文件、靠港资料、人员变动和预览输出。
- 船舶、船员、申报默认方案、工程记录和总设置位于常用资料区。
- 港口、文件各自记住主页面与表格双轴滚动；修改下拉选项、恢复快照和重绘不回顶部。
- 四类稳定申报保存为显式默认方案，只在新建港口时自动采用；已有港口需要主动应用。各港仍独立保存，健康与 NIL 仍在生成前核对。
- 个人物品像库存一样按港口、日期、进离港阶段存快照，恢复前列出匹配姓名，按人员身份对应，不按行号。
- 生成窗口展示全部准备港口，先勾选范围，再核对日期、健康和 NIL。确认其他港口不会把已取消的港口重新勾上。
- 视觉使用浅珍珠灰、白色工作面与中性深色；毛玻璃只用于导航和弹窗，表格保持不透明。系统字体适合实际录入，字号与表格字号分别可调。三种强调色均满足普通文字对比度。

完整设计系统在根目录 `DESIGN.md` 和 `.impeccable/design.json`；本次方向和审查记录在 `work/studio-direction.md` 与 `work/studio-finish-review.md`。没有已批准的图片效果稿。Impeccable 上下文工具被系统组策略阻止，使用已读取的项目资料与独立审查流程；不虚构工具输出或概念种子。

## 3. 页面与内容归属

| 入口 | 内容 |
| --- | --- |
| 上方靠港计划 | 添加港口、切换站次；保留当前文件和各港位置 |
| 本港准备 | 靠港资料、日期与阶段、上下船人员变动 |
| 申报文件 | 进港、离港、个人物品、本次最近 10 港、物料、健康及病例、旅客、药品、NIL、疫苗 |
| 预览与输出 | 本港文件选择、实际数据预览、问题定位 |
| 申报默认方案 | 健康、NIL、旅客、药品的默认内容与自动采用开关 |
| 船舶与船员档案 | 常用资料，新港口带入，已有港口显式同步 |
| 工程记录 | 实际保存目录中的版本、恢复与独立备份 |
| 总设置 | 外观、字号、保存、启动、命名、导出和高级模板/映射 |
| 使用说明 | 左下角入口；窄屏也可在页面选择框找到 |

窄屏用一个原生选择框打开全部文件与常用资料，表格在内部横向滚动。底部保存、检查生成始终可见。内部仍保留 arrival、stores、health 等旧视图名称，用于调用可靠编辑器和兼容旧工程；页面层不再堆叠旧工作台导航。

''' +s[b:]
s=s.replace('2.0 统一导航、渲染、港口工作台、集中核对','2.1 单层文件导航、港口切换与集中核对').replace('app_shell.css           ← 2.0 全局视觉与响应式规则','document_shell.css      ← 2.1 实际装载的视觉与响应式规则')
s=s.replace('│  ├─ app_help.js', '│  ├─ declaration_defaults.js ← 四类申报默认内容、校验与应用\n│  ├─ effects_archive.js      ← 个人物品快照、身份匹配、导入导出\n│  ├─ view_memory.js          ← 按工程/港口/文件的滚动与焦点\n│  ├─ app_help.js')
s=s.replace('package_v2.py','package_v21.py').replace('make_v2_guide.mjs','make_v21_guide.mjs').replace('app_shell.js / app_shell.css','app_shell.js / document_shell.css')
s=s.replace('- 新界面：四入口、直接加港、各页签可达、逐港输出、集中确认、跨港问题定位、窄屏、深色、滚动和焦点。','- 新界面：单层文件目录、横向靠港计划、全部文件可达、逐港输出与集中确认、跨港问题定位、窄屏原生页面选择、深色和可调字号。\n- 新功能：四类默认方案的作用域与工程兼容；快照身份匹配、未匹配人员保留、独立导入导出；页面和表格双轴滚动、焦点与快速展开。')
s+='''

## 15. 2.1 新功能的数据边界与接续注意

### 15.1 申报默认方案

`declarationDefaults = {version: 1, sections: {health, nil, passengers, medicines}}`。每项未设置时为 null；保存后有 id、enabled、savedAt、data。`declarationSources` 在单港保存默认来源。使用当前已填写内容明确保存，程序不猜健康答案；健康默认不包含病例记录，应用时保留已有病例。

`DeclarationDefaults.capture` 取对应内容，`save` 生成新默认版本，`applyTo(target, keys, {automatic})` 应用到目标状态。自动模式只采用 enabled 项；创建新港口时在继承逻辑完成之后调用，避免被后续清空覆盖。已有港口不自动刷新；“恢复默认 / 应用到本港”先显示替换确认，操作可撤销。默认答案改变会按原规则取消健康或 NIL 确认，绝不提前确认。

`archiveForDefaults` 和 `validateArchive` 包含声明默认内容，因此“保存为本机默认”和导出常用配置能跨工程复用。工程导入兼容缺少这些字段的旧版本，不隐式把旧工程的答案保存为默认。

### 15.2 个人物品快照

`effectsSnapshots` 是共享档案数组，单港 `effectsAsOf` 记录来源。每份快照包含 id、port、date、phase、savedAt、note、declaration、rows。rows 保存 person 的稳定 ID、姓名、护照、出生日期、国籍，以及 values 的 cigs、beer、wine、spirit、articles、signature。

恢复按本港当前阶段名单匹配：优先相同稳定 ID（证件/姓名/出生日期不能冲突），其次明确唯一护照，再其次姓名与有效出生日期同时唯一。重复或冲突不猜；同一个目标不能重复匹配。恢复只覆盖匹配人员的物品，不替换或复活旧名单；未匹配的本港人员保留现值。预览展示匹配人数与姓名、未匹配和未覆盖人员；预览后数据变化会阻止陈旧应用。

独立文件为 `{kind:"IMO-EFFECTS", schema:1, snapshots:[...]}`；导入校验 30MB 上限、最多 1000 份、明细格式和唯一标识。同 ID 跳过，不覆盖已有档案。保存快照只加入工程资料，仍需保存工程写入磁盘。

`multiport.js` 的共享投影键新增 declarationDefaults 与 effectsSnapshots。每港的实际申报答案与 effects 仍独立；共享快照改变不触发库存重新推算。旧工程的 shared 与 task.data 缺字段时使用 blankState 的空结构补齐。

### 15.3 滚动位置

`ViewMemory.before` 根据旧 DOM 的 renderKey 捕获位置，不能根据已经改变的新视图/过滤器推断旧位置。key 包含工程 ID、港口 ID、实际文件视图；表格区域按 data-grid 和物料位置识别。捕获主滚动、window 位置、表格双轴、折叠状态、选择框焦点和文字光标。

新 DOM 完成编辑器增强后，`after` 立即恢复折叠与位置，再用一帧只修正布局相关位置。延后回调不能再次重放折叠状态，否则会覆盖刚打开的面板或问题定位。焦点使用 preventScroll，迟到回调有版本令牌，不能修改新视图。只是内存工作状态，不混入用户工程或生成结果。

### 15.4 当前检查入口

`verify_studio_v21.mjs`：Chrome/Edge 共 32 组，覆盖默认作用域、快照身份、工程往返、滚动/焦点/切港、深色与离线。

`verify_studio_workflow.mjs`：Chrome/Edge 共 18 组，覆盖真实按钮添加港口、默认设置保存、常用配置、文件选择和预览、生成范围不重选、问题定位、字号、移动入口、姓名预览与旧多港工程升级。

兼容检查：multiport 56 组，连续库存算术 14 组，库存界面 16 组，本机磁盘与重启 12 组，集中确认 2 组；实际多港 Excel 60 本、原有可见工作表 66 张通过独立 XML/结构检查。Excel/WPS 原生实际打印仍未验收。

发布命令：构建 → npm test → npm run test:native → python work/verify_multiport_xml.py → node work/make_v21_guide.mjs → python work/package_v21.py → node work/final_v21_check.mjs。旧版压缩包保留，2.1 源码包带完整空模板与本地依赖版本，换环境后重新安装依赖、构建即可。
'''
p.write_text(s,encoding='utf-8')
p=root/'README.md';s=p.read_text(encoding='utf-8').replace('2.0.0','2.1.0').replace('make_v2_guide.mjs','make_v21_guide.mjs').replace('package_v2.py','package_v21.py').replace('final_v2_check.mjs','final_v21_check.mjs');s=s.replace('本地离线航次文件工作台。','本地离线航次文件工作台。上方选港口，左侧直接选文件；四类申报可保存默认，个人物品可按港口/日期留快照，切换文件与港口保留滚动位置。');s+='\n当前界面系统见 DESIGN.md 与 .impeccable/design.json；产品背景见 PRODUCT.md。旧的独立效果稿已被用户否定，不属于当前运行界面。\n';p.write_text(s,encoding='utf-8')
