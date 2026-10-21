# 本次仓库准备验证 · 2026-10-21

## 已完成

- 本机运行 `node scripts/cloud-check.mjs`（指定本机Python路径）：构建成功，当前16个回归脚本全部通过，共163组；使用Playwright 1.62.1自带Chromium 151。Windows默认Chrome/Edge入口保持原值。
- 独立Python/openpyxl检查通过：实际生成的30本多港XLSX，33张原始可见工作表。检查ZIP CRC、每个XML、工作表清单、一页宽高配置及不写入应用作者署名。
- 原模板核对：`default-templates.zip`及其10份XLSX的SHA-256与原安装清单完全一致；旧模板导入检查通过。
- 从实际上传ZIP解压到新的空目录，使用生成的 `package-lock.json` 执行 `npm ci --ignore-scripts`，成功安装固定依赖；首次下载遇到registry连接中断，单连接缓存重试成功。未依赖原有共享node_modules。
- 在该新目录运行 `python work/build.py` 成功，生成单文件及文件夹版，单文件5,950,305字节；Windows EXE只被复制，没有在此步骤执行。
- 修改的10个浏览器检查脚本及新增Node检查入口全部通过 `node --check`；新增Python工具通过语法编译检查。
- 与原3.2.2开发源码ZIP对照，58项应用、启动器及模板源资产字节一致；云端准备没有修改业务脚本、样式、页面、C#源码或原模板。
- 云端帮助导出入口通过，实际导出12个帮助主题和24项命名字段。
- Git上传候选审计通过：无常见密钥模式命中，必要源码／模板／许可完整，历史生成目录和用户数据文件被排除。结果与逐文件SHA-256清单随上传包保存在 `outputs/github/`。

整套163组按脚本计数：停留7、完成挂靠9、航次13、通知10、模板5、单份流程14、库存算术14、界面业务16、工作流9、导航8、外观13、弹窗7、首页滚动1、十文件输出1、多港28、库存界面8。详细运行报告为本机生成物，不提交到Git；云端应重新生成。

## 实际发现的依赖事项

`npm audit`报告既有 `pdfjs-dist@5.6.205` 命中一项high级别公告：[GHSA-hq66-cqwq-w95j / CVE-2026-16633](https://github.com/advisories/GHSA-hq66-cqwq-w95j)。公告列出的修复版本为6.2.108，触发描述涉及恶意PDF、启用脚本及CSP条件。项目当前仅做文本提取，调用有 `isEvalSupported:false`，但本轮没有用恶意样本验证此公告的可利用性，因此不把当前选项当作已修复的证明。

此次迁移保留原有PDF.js版本及离线资源嵌入方式，没有跨大版本升级。后续升级需单独核对 `build.py` 的模块、worker、cmaps及standard_fonts打包方式，并补充合成PDF导入回归；不能用 `npm audit fix --force` 代替兼容验证。此项不妨碍私有仓库上传，但不能宣称依赖安全审计零问题。

## Codex Linux 云端验收（已完成）

云端于2026-10-21在提交 `6ef801cd0e3f810e8c81a3644a109484106382a6` 完成验收。Node.js 24.19.0、Python 3.12.14、Chromium 151.0.7922.34。`bash scripts/cloud-setup.sh` 和 `npm run test:cloud` 均退出0：16个脚本、163组全部通过，独立Python/openpyxl/XML检查通过30本XLSX／33张可见原工作表。仓库295份文件与HEAD一致，Git工作区及索引干净，10份原模板哈希不变。

实际环境修正：npm使用可写缓存，脚本默认不要求sudo；`.gitattributes` 保留既有源码字节，避免GitHub初次上传的CRLF在Linux被强制转换而出现伪修改。原有113项纯换行差异经确认及备份后安全处理，原缓存和venv保留。

下载诊断：Chrome和headless shell的官方链路为cdn.playwright.dev → storage.googleapis.com，返回307 → 200。FFmpeg首选地址跳转到playwright.download.prss.microsoft.com时曾被403拒绝，安装器随后从内置官方备用地址cdn.playwright.dev/builds/ffmpeg/1011/ffmpeg-linux.zip成功下载。没有关闭TLS或完整性校验，也没有使用非官方镜像。环境保存了上述三个域名；微软首选地址在新增域名后未单独复验，官方备用路径已实际成功。

云端启动配置使用轻量就绪检查；依赖或浏览器缺失时才安装，健康的新任务不自动重跑163组。改动后按AGENTS.md选择适当检查。完整基线不是未来变更或新实例恢复的自动通过证明。

## 仍需单独验收的范围

Windows启动器、原生保存／重启、Chrome／Edge及Excel/WPS实际打印本轮没有重新执行；Linux/XML检查不代替这些验收。PDF.js已知公告仍保留，未跨版本升级。环境发布和新实例恢复以云端界面的实际状态为准。
