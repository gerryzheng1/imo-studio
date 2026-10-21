# 第三方源码与许可说明

本版本（IMO Studio 3.2.2，2026-10-21）采用并修改了以下玻璃材质源码。完整原始文件、来源记录和许可正文随运行包与开发源码包提供；原始文件按 Git blob 字节保留。

## 原子软糖 At / GreyD097：yzrt

- 仓库：<https://gitee.com/greyd097/yzrt/tree/master/>
- 采用目录：`纯CSS液态玻璃/`
- 读取快照：`2cae7d6a61d6a019a5c40bda05dc6a065ae7e246`
- 该目录在 Gitee 显示的最后修改提交：`2afaed0b401dbc39cdf24cce9420d7620c1fdd59`
- 上游声明：GPL-2.0；随附 `LICENSE` 为 GNU General Public License Version 2, June 1991。未将许可附录中的示例视为该项目另行授予的“or later”条款。
- 原始文件：`index.html`、`css/styles.css`、仓库根 `LICENSE`。原始来源和散列见 `SOURCE_METADATA.json`。

2026-10-19 的修改位于 `work/yzrt_material.css`：将对向内阴影、45 度双端高光和内层软白边改为局部组件材质；增加深浅主题、可读背板、偏好模式和响应式尺寸。未沿用示例的全局禁止选择、全局过渡、整层对比度或固定高层级。修改后的 CSS 保留来源与修改说明。

运行包中的 `第三方源代码/yzrt/` 包含未经修改的上游文件；`assets/style.css` 包含本版本实际使用的修改版材质。完整对应应用源码在同版本的开发源码包中。单文件 HTML 内也保留 GPL v2 正文。

## 其他随附依赖

- JSZip 3.10.1：上游许可见运行包 `assets/JSZip-LICENSE.markdown`；应用使用其 MIT 许可选项。
- PDF.js 5.6.205：Apache License 2.0，正文见 `assets/PDFjs-LICENSE.txt`，单文件 HTML 内亦保留。
- 浏览器验证仅使用开发依赖 Playwright 1.62.1，不作为运行时脚本加载。

固定页面署名“作者：郑晓天 / Author: Zheng Xiaotian”表示本应用的维护署名，不替代上述第三方作者的归属。

2026-10-21 在 work/prism_glass.css 增强透明表面、双层边缘和指针高光，沿用上述 yzrt 衍生材质及同一许可说明。保持原始来源字节和完整 GPL v2 正文。用户提供的新空模板按原字节接入，源包哈希见 template-replacement-install.json。
