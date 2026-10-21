# 从本机迁移到 GitHub 私有仓库和 Codex 云端

你只需要现有GitHub账号。本次已创建的目标为 `gerryzheng1/imo-studio`：https://github.com/gerryzheng1/imo-studio，可见性为 **Private**。源码上传与Codex环境发布状态需另行核对。源码在云端开发，应用仍离线运行。

## 1. 首次上传（推荐 GitHub Desktop）

1. 安装GitHub Desktop并登录你的GitHub账号。
2. 选择 **File → Add local repository**，选择本项目目录。该目录已有Git；如果使用导出的源码ZIP，在新的空目录完整解压后选择 **File → New repository** 初始化该目录，确认仓库根直接有 `README.md` 和 `work/`。
3. 查看Changes：应有源码、10份空模板、两份模板ZIP、启动器和许可；不应出现outputs、node_modules、船员工程、船舶PDF或本地设置。已有 `.gitignore` 会处理这些边界。
4. 填写提交说明 `Prepare IMO Studio for Codex Cloud` 并提交。若还没有提交身份，按GitHub Desktop提示配置自己的姓名和邮箱，可选GitHub的隐私邮箱。
5. 新建仓库时点击 **Publish repository**，名称填 `imo-studio`，勾选 **Keep this code private**，然后Publish。如果接续本次已经建立的空仓库，使用 **Repository → Repository settings → Remote** 配置 `https://github.com/gerryzheng1/imo-studio.git` 后Push；若远程已有文件，先Clone远程仓库到新的目录再继续，不强推覆盖。
6. 在GitHub打开仓库，确认顶部为Private，默认分支有README、package-lock.json、AGENTS.md、docs、scripts和work。不要只上传源码ZIP文件。

也可以在GitHub网页创建一个空Private仓库，不添加README／许可证／gitignore，再用本地Git连接和push。保留项目原有第三方许可，不要随意换成另一份开源许可证。

## 2. 创建 Codex 云端环境

官方入口：<https://learn.chatgpt.com/docs/environments/cloud-environments>

在Codex的新任务选择 **Work in → Cloud → Select environment → Create environment**；或从 **Settings → Codex Cloud → Environments → Create environment** 进入。按提示连接GitHub，仅授权目标私有仓库，然后选择它。

环境准备消息可直接粘贴：

> 配置这个IMO Studio仓库用于Codex云端开发。先读AGENTS.md和docs/REPOSITORY.md。使用Node.js 24、Python 3.12和Playwright的Chromium。运行bash scripts/cloud-setup.sh，再运行npm run test:cloud。安装阶段需要npm/PyPI/Playwright浏览器下载权限。不要运行Windows EXE，不要执行历史一次性迁移脚本。若有Linux或字体差异导致失败，保留检查并报告原因；不要降低断言来制造通过。完成后给出安装和测试结果。

正常安装命令已保存在 `scripts/cloud-setup.sh`：使用项目内可写npm缓存，安装锁定的Node依赖、openpyxl、Chromium，并构建和审计。默认使用基础镜像的Linux系统库；只有具备系统包安装权限且确实缺库时，才设置 `IMO_INSTALL_SYSTEM_DEPS=1` 运行脚本。环境无需OpenAI API key；应用本身不调用模型。浏览器下载若被网络策略阻止，需为实际报错的Playwright官方CDN开启安装下载。

检查环境报告、修复未完成项后选择 **Publish**。看到 **Environment published** 后再开始正式云端任务。保存配置与发布环境是两个步骤。新任务使用发布的准备状态，已有任务保留自己的工作状态。

## 3. 第一条云端任务

复制下面文字，并把最后一行换成实际需求：

> 接续IMO Studio 3.2.2项目。先读AGENTS.md、docs/HANDOFF.md、PRODUCT.md和制作思路与开发交接.md第20节，界面以DESIGN.md最新约束为准。源码在work，改后构建，不手改outputs。保留离线运行、10份原模板和打印结构、多港隔离、旧工程兼容、人工申报确认和固定作者署名。本轮先验证仓库可在新环境执行npm run test:cloud，报告实际结果及Windows原生检查边界。具体需求：……

原聊天和你本机的整个文件夹不会因建立云端任务而自动变成云端上下文。交接信息以已提交的仓库文档为准；新需求需写进云端任务。此文件不意味着云端环境已经创建或发布。

## 4. 带回本机

在云端审查修改并提交到分支／创建PR。用GitHub Desktop拉取对应修改。Windows构建后运行相关Chrome／Edge检查；涉及保存、启动器时跑 `npm run test:native`，正式输出在Excel/WPS核对。通过前不替换正在使用的离线发布包，不丢弃旧工程。
