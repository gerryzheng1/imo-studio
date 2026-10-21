# 3.2.2 航次归属与准备列表 · 设计文档对照

日期：2026-10-21。模式：Operate。依据 Impeccable `document` 做已授权的最小事实维护，保留 Liquid Desk 3.1／3.2.1 视觉世界。

## 已维护

- `DESIGN.md`：将当前 UI 版本更正为 3.2.2；说明 flow32 的局部流程层继续沿用共享材质。
- 在既有 Components 中记录“航次”的本港资料／未来港口计划／历史挂靠港切换、明确选中态与手机换行；第 4 份仅保留本港申报状态、来源清楚的只读最近 10 港、预览和独立下载。记录管理航线资料与返回申报清单的路径、源行错误定位和按工程／港口／页面／航次子页独立滚动。
- 在顶部港口组件中记录正在准备／未准备标签、省略号管理入口、完成／仅移除的独立语义；完成窗口的实际日期、移除资料提示、单港工程下载，以及列表行／操作换行。
- 追加本港资料原有“停留时间”字段的日期预填事实；手动修改、主动清空及旧工程已有非空值均保留，不增加控件或视觉规则。

## 保留与未新增

YAML 的颜色、字体、圆角、间距和组件 tokens 字节不变；Overview、北极星、全局命名规则、Do／Don’t 和玻璃叙事不变。没有将本次局部尺寸、按钮、日期输入或完成确认流程提升为全局设计规则，也没有新增全局组件、动效或调色。

`.impeccable/design.json` 通过 JSON 解析，现有 schemaVersion 2 与 10 个自包含组件继续对应共享材质。此轮是正文中的局部事实更正，不重建视觉系统；sidecar 的 token 扩展、预览和叙事均无必要变化，因此文件字节保持不变，未刷新 generatedAt。

## 对照与边界

已核对 `work/app_shell.js`、`ports.js`、`multiport.js`、`multiport_ui.js`、`flow32.css`、`build.py`，并沿第 4 份汇总／归档覆盖链补读 `route_history.js`。3.2.2 的当前渲染路径、实际日期与去重归档、独立移除、最后任务空投影、CSS 及构建顺序与记录一致。产品源码、其他产品文档、构建与发布输出均未由本次文档对照修改。

本轮沿用 `work/route-navigation-finish-review.md` 的收尾结论，以及 `.impeccable/review/route-322/` 的既有 12 张桌面／手机截图和既有 Chrome／Edge 回归记录；本次未重跑回归、重拍或构建。context 已在本会话被 Windows 策略阻止，不重试；未运行 detector。无新 seed、approved comp、quality bar 或 detector 分数。既有截图和浏览器验证不构成原生 Excel／WPS 打印验收，Office 打印边界保留。

停留时间追加对照：已核对 `ports.js` 的 `suggestedStay`／`syncVoyageStay`、`app_shell.js` 的原字段提示及 `MultiPort` 的航线、快照和同步调用。自动值使用 UTC 日期差，同日为 `LESS THAN 1 DAY`；仍为原字段的行为完善。引用既有 `work/stay-prefill-report.json`：Chrome／Edge 合计 14 组通过，errors、requests、failures 均为空；`.impeccable/review/stay-322/` 保留 desktop／mobile 两张图。本次仅补文字，未重跑或重拍，sidecar 继续字节不变。
