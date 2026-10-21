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

## 尚未在目标环境验收

- 本轮完整Chromium检查是在Windows本机运行的云端兼容入口，不能写成Codex Linux环境已经通过。目标环境创建后仍需执行 `bash scripts/cloud-setup.sh` 和 `npm run test:cloud`，确认Linux字体、系统依赖及下载网络权限。
- Windows启动器、原生保存／重启及Excel/WPS实际打印本轮没有重新执行；现有历史成功记录不计为本轮验证。
- GitHub私有仓库上传、远程分支和Codex环境发布需在登录／连接后核对实际状态。建立本地上传包不等于已完成云端迁移。
