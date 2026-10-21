# Codex云端交接 · 2026-10-21

应用为IMO Studio 3.2.2，中文界面、英文Excel输出，本地离线使用。用户希望继续云端开发，而不是把申报资料改成服务器存储。

当前功能与边界见制作思路与开发交接.md第20节：航次集中维护计划与历史，第4份文件只处理本港清单；顶部管理正在准备的港口，完成挂靠核对实际日期后原子写历史并移除任务；停留时间按日期差预填，手工修改及清空保留。

此次仓库准备包含：忽略本地用户数据和历史生成目录；保留必要源码、原模板、兼容样本和第三方许可；增加锁定依赖、云端安装及完整检查入口、上传审计和导出工具。10个当前回归脚本仅调整浏览器选择，Windows仍默认Chrome/Edge，云端命令固定Chromium。业务源码及模板未为迁移改写。

重要入口：

- `README.md`：安装、构建与当前应用发布流程。
- `docs/CLOUD.md`：从GitHub账号开始的上传和创建云端环境步骤。
- `docs/REPOSITORY.md`：仓库清单、历史脚本边界和检查方法。
- `AGENTS.md`：后续代理必须遵守的开发约束。
- `npm run test:cloud`：构建 → 当前16个检查脚本 → 30本XLSX独立检查。
- `scripts/repository_audit.py`：上传候选、必要文件和原模板哈希检查。

本机路径、浏览器资料、下载、原生测试工程、旧版解压副本和PDF输入不随Git上传。已生成的测试报告也不入Git，应在新环境重跑，不把历史成功计为新环境成功。Linux环境无法代替Windows EXE和Office/WPS实际打印验收。

本次实际验证结果在 `docs/VALIDATION.md`。GitHub私有仓库：https://github.com/gerryzheng1/imo-studio。Codex云端环境 `imo-studio` 已发布，仅本人可用；[环境设置与验收记录](https://chatgpt.com/local/01a15e3b-d089-77cd-9cbe-6eedde41609c?hostId=local)。云端Linux在提交 `6ef801cd0e3f810e8c81a3644a109484106382a6` 完成16脚本／163组和30本XLSX／33张可见工作表检查，工作区干净。新任务启动只做轻量就绪检查，缺依赖才安装；代码改动后按AGENTS.md验证。首次独立新任务恢复已于2026-10-21通过：[云端接续聊天](https://chatgpt.com/local/01a15e93-d6d3-7573-9ccc-32bcfedb308e)。新任务在发布快照的 `work` 分支、提交 `6ef801cd0e3f810e8c81a3644a109484106382a6` 实际重跑审计及完整回归，16脚本／163组、30本XLSX／33张原工作表全部通过，最终Git干净。新任务选择器在两张新页面均能正常选择imo-studio。此前平台入口故障已无法复现，恢复原因未知，没有新增环境或扩大权限。

本次新任务未取得环境设置中的Start skill原文，缓存路径也未自动继承；后续代理应使用docs/CLOUD.md和AGENTS.md内的显式venv／缓存环境命令。浏览器测试若受沙箱限制，使用正常审批流程。发布快照与GitHub main的文档提交可能不同，开始改动前核对origin/main，干净工作区仅做正常fast-forward同步，保留任务已有改动，不强制reset。
