# 仓库内容与构建边界

当前应用版本 3.2.2；此次整理只准备 GitHub / Codex 云端开发，不改变应用离线运行方式或申报模板。

| 路径 | 用途 |
| --- | --- |
| `work/*.js`、`*.css`、`app.html` | 应用源文件；由 `build.py` 拼装 |
| `work/config.json`、`default-config.json` | 字段映射与内置配置 |
| `work/default-input/cleaned/*.xlsx` | 用户提供的10份原字节空模板 |
| `work/default-templates.zip` | 同一批原始模板压缩包 |
| `work/legacy-*.json`、`legacy-default-templates.zip` | 旧模板映射和兼容测试样本 |
| `work/*-state.json` | PACIFIC TEST / CREW 人工测试数据，不是实际船员工程 |
| `work/run_checks.mjs` | 当前16个回归脚本的唯一整套入口 |
| `work/IMO_Launcher.exe`、`LocalLauncher.cs`、`build_launcher.ps1` | Windows启动器及其源码、编译方法 |
| `work/reference-yzrt/` | 构建需要的原始第三方文件、来源和GPL v2许可 |
| `scripts/` | 云端准备、完整检查、仓库审计和上传包导出 |
| `docs/` | 云端迁移步骤及本次交接 |
| `.impeccable/design.json`、`DESIGN.md`、`PRODUCT.md` | 产品与视觉约束 |

`work/` 仍保留历史开发脚本和旧版审查 Markdown，便于追溯。`enable_*`、`upgrade_*`、`reset_*`、`implement_*`、`install_replacement_templates.py`、旧版 `package_*` / `audit_*` 等不是安装步骤，可能依赖原开发机路径、原始资料或旧版输出，不要批量执行。当前源码已包含其结果。

本机保留、Git排除：`outputs/`、依赖目录、源码验证解压副本、原生测试目录、历史截图／报告、`saved-project.json`、原始个人／船舶PDF、`work/templates/`、模板备份、上游研究仓库、用户工程与本地设置。没有删除这些本地资料。

## 日常开发

安装 Node.js 24+ 和 Python 3.11+；版本建议为 Node.js 24、Python 3.12。

```text
npm ci
python -m pip install -r requirements-dev.txt
python work/build.py
```

构建生成 `outputs/IMO_Generator.html` 及 `outputs/IMO文件包生成器/打开生成器.html`。构建会复制随附Windows EXE，在Linux不会执行它。构建不下载资料、不读取用户工程。可用 `IMO_NODE_MODULES` 指向另一个已安装依赖目录；正常云端使用仓库根 `node_modules`。

云端完整回归：`npm run test:cloud`。固定 Chromium，先构建，依次执行16个当前脚本，再以 openpyxl/XML 独立验证生成的30份多港 XLSX、33张可见工作表。`npm run guide:cloud` 从实际帮助导出使用说明。若需指定Python，设置 `IMO_PYTHON` 为可执行文件路径。

Windows完整回归：构建后运行 `npm test`（Chrome和Edge），`npm run test:native`，`python work/verify_multiport_xml.py`。原生Excel/WPS打印须单独人工核对；通过XML一页配置检查不代表实际打印已通过。

## 发布包

GitHub源码上传包由 `python scripts/repository_export.py` 生成，与应用发布包是两件事。上传包不含 `.git`，保留点文件；适合本机解压后用GitHub Desktop提交，不能把ZIP直接上传后期待Codex自动解压。

旧版 `work/package_v322.py` 是应用发布流程，依赖新生成的报告、帮助和截图：先构建、`npm test`、原生检查、XML检查、`node work/capture_route_navigation.mjs`、`node work/make_v322_guide.mjs`，再按README现有步骤打包和验证。历史截图不入Git；换机器需重新捕获。旧发布包清单不包含此次新增的云端工具；GitHub交接以仓库及 `repository_export.py` 为准。此轮不重新发布应用，不覆盖旧发布ZIP。

## 上传检查

```text
python scripts/repository_audit.py
python scripts/repository_export.py
```

审计实际Git候选文件、必要源码、常见密钥模式和原模板SHA-256。审计不打印密钥值，也不能替代所有个人资料的人工检查。清单位于 `outputs/github/UPLOAD_MANIFEST.json`；该目录不上传。不要用 `git add -f` 绕过忽略规则，也不要把本机整个目录拖入GitHub网页。
