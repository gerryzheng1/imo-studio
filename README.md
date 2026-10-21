# IMO Studio 3.2.2 · Liquid Glass

本机离线的 IMO 航次文件工作台。3.2.2 将未来计划与历史编辑集中到“航次”，第4份文件只负责本港申报清单。停留时间按到离港日期差预填并保留手动修改。顶部省略号管理正在准备的港口；已完成港口核对实际日期后转入历史并移出，可先下载单港工程留档。保留当前液态玻璃、10份用户空模板、单份XLSX、多港工程、连续库存、申报默认方案、个人物品快照和滚动记忆。

## 开始使用

完整解压 IMO文件包生成器_Liquid_Glass_v3.2.2.zip，双击“启动生成器.exe”，保留 assets 文件夹。直接打开“打开生成器.html”也可离线编辑，首次写工程须授权文件夹。

顶部港口胶囊切换任务。“航次”维护本港资料、未来计划、历史与港口库；“文件”选择申报文件；“资料”维护共用档案；“输出”检查和生成。“保存工程”保存整批进度。Ctrl / Command + K 搜索文件，Enter 进入结果，Esc 关闭。

只要一份：点“下载本份 XLSX”，或输出行的“下载 XLSX”；无需取消其他勾选。本港整包用“生成本港 ZIP”，多港用“批量生成 N 港”。顶部省略号的“完成挂靠”会移除该港独立准备资料并保留实际历史，窗口提供单港工程备份；“仅移除”则保留未来计划为未准备。

右上角齿轮打开总设置。主题、强调色、字号、密度直接可见，玻璃与背景选项默认折叠。系统减少透明度与动态优先；外观不会改变 Excel 模板。当前模板与3.2.1原包字节一致，旧工程保留原模板，可在模板管理主动切换内置版本。

## GitHub 与 Codex 云端开发

首次上传私有仓库和创建云端环境，见 [云端迁移步骤](docs/CLOUD.md)。仓库目录与历史脚本边界见 [仓库说明](docs/REPOSITORY.md)，后续代理先读 [AGENTS.md](AGENTS.md) 和 [交接](docs/HANDOFF.md)。本机原文件保留，Git 排除用户工程、依赖、历史生成目录和船舶PDF；原模板和许可纳入仓库。

Linux云端先运行 `bash scripts/cloud-setup.sh`，然后 `npm run test:cloud`。该命令固定Chromium，完成构建、16个当前回归脚本和生成XLSX的独立结构检查。Windows原生启动器与Excel/WPS实际打印需回本机验收。云端开发不改变应用离线运行方式。

## 开发与构建

使用 Node.js 24+、Python 3.11+、Chrome / Edge。固定依赖见 package.json 和 requirements-dev.txt。

```text
npm ci
python -m pip install -r requirements-dev.txt
python work/build.py
```

可用 IMO_NODE_MODULES 指向已安装依赖，构建本身不联网。修改 work 源码，再构建；不要修改生成HTML。样式顺序：liquid_desk.css、yzrt_material.css、appearance.css、prism_glass.css、flow32.css；css_glass.js 提供按需绘制、有像素上限的本地背景。

## 检查与发布

```text
npm test
npm run test:native
python work/verify_multiport_xml.py
node work/capture_route_navigation.mjs
node work/make_v322_guide.mjs
python work/package_v322.py
node work/final_v322_check.mjs
python work/verify_v322_source_package.py
```

本轮重跑190组，范围和报告见制作思路与开发交接第20节。检查不代表所有环境均无缺陷；原生Excel/WPS实际打印仍须在使用电脑核对。当前UI证据在 .impeccable/review/route-322/。

新版入口 outputs/IMO_Liquid_Glass_3.2.2.html；离线包、开发源码、使用说明和交接MD均在 outputs。发布包的保存工程目录为空，保留旧版ZIP，不带用户工程、认证或机器设置。

换环境接续先读 制作思路与开发交接.md 第20节，再读 PRODUCT.md、DESIGN.md 和 .impeccable/design.json。第三方源码与许可见 THIRD_PARTY_NOTICES.md 和 work/reference-yzrt，分发时保留。
