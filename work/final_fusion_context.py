from pathlib import Path
P=Path(__file__).resolve().parent;root=P.parent
p=root/'PRODUCT.md';s=p.read_text(encoding='utf-8');s+='\n当前最终视觉方向（2026-10-19）：用户明确选择 Apple 官网式极简与 Liquid Glass 两者结合。保留新的单层文件目录、横向靠港计划与真实操作流程，增加大标题、留白、悬浮透明导航及真实边缘折射。旧的蓝色壁纸、模拟系统窗口稿不作为依据。署名继续固定、低调、无设置，使用小号低对比层级的灰色保证可读，不写入 Excel。\n';p.write_text(s,encoding='utf-8')
p=root/'制作思路与开发交接.md';s=p.read_text(encoding='utf-8');s+='''

## 16. 最终视觉选择：官网极简 × Liquid Glass

用户在本轮后续明确指定两者结合，并再次要求使用 Impeccable。当前最终版本以 `work/fusion-direction.md` 为方向，不以旧的干式工作台截图或历史 Liquid_Glass_效果预览.html 为依据。参考已直接读取的 Apple 官网 MacBook Air 与 2025 软件设计介绍。

构建把 `fusion_glass.css` 接在 `document_shell.css` 后，把 `fusion_glass.js` 装在 app_shell.js 后。新增文件属于表现层：本机 Canvas 生成天蓝/浅绿光场；5 个独立圆角 SVG 位移映射用于侧栏、港口栏、操作坞、选中导航和当前港口的边缘折射，数据编辑区保持接近不透明。指针只改变高光位置及按压状态，不改变工程数据。窗口、按钮与字体全部本地，无外部素材或网络。

提供动态效果降级：减少动态效果时固定背景，页面隐藏时暂停绘制；无 SVG backdrop 支持时保留 CSS 模糊与实体表面；减少透明度的系统偏好使用实色导航。位移图仅按尺寸变化重建，不在每次指针移动时重新生成。大标题和留白用于建立层级，录入表格的字号仍独立设置。作者署名保留低调位置与小字号，改用不透明灰色维持阅读对比，不提供署名编辑设置。

实际最新入口为 `outputs/IMO_Studio_2.1.html`，主截图为 `outputs/新版界面.png`。当前设计审查为 `work/fusion-finish-review.md`，不是前一轮干式工作台的审查。最新设计系统仍输出根目录 DESIGN.md 与 .impeccable/design.json。`verify_fusion_material.mjs` 核查本地玻璃层、减少动态效果、指针与窄屏。
''';s=s.replace('│  ├─ declaration_defaults.js', '│  ├─ fusion_glass.css / .js ← 最终结合版材质、折射与光场\n│  ├─ declaration_defaults.js');p.write_text(s,encoding='utf-8')
p=root/'README.md';s=p.read_text(encoding='utf-8');s+='\n最终视觉为 Apple 官网式极简排版与 Liquid Glass 结合，材质文件 work/fusion_glass.css 与 fusion_glass.js 在文档式工作流之上装载；参考和验证边界见 work/fusion-direction.md。\n';p.write_text(s,encoding='utf-8')
p=P/'final_v21_check.mjs';s=p.read_text(encoding='utf-8').replace("opacity),'0.35'", "opacity),'1'");p.write_text(s,encoding='utf-8')
p=P/'package_v21.py';s=p.read_text(encoding='utf-8').replace("'studio-direction.md','studio-finish-review.md'", "'studio-direction.md','studio-finish-review.md','fusion-direction.md','fusion-finish-review.md','verify_fusion_material.mjs'").replace("/'review'/'studio'/", "/'review'/'fusion'/");p.write_text(s,encoding='utf-8')
