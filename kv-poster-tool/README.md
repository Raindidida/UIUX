# KV 延展海报制作工具

基于 [Figma 设计稿](https://www.figma.com/design/XNL2kfx3Pkm0Ln5yItb7RT/Hackquest-Graphic-Design?node-id=4388-3421) 的 KV 图层结构，**仅保留一个 Luma 海报模板**，画布内所有元素均为可替换组件。新 KV 通过「重新定义 KV」从 Figma 刷新后会自动适配到模板并更新。

## 使用方式

1. 用浏览器打开 `index.html`（建议用本地静态服务，如 `npx serve .`，以便「重新定义 KV」能加载 `kv-config.json`）。
2. 点击 **「生成 Luma 海报」**，生成 1080×1080 画布（尺寸与文案来自 `kv-config.json` 或页面内默认配置）。
3. 在画布上直接修改主标题、副标题、日期、地点等文案。
4. 点击 **「重新定义 KV」**：从 `kv-config.json` 重新加载 KV 并替换模板内所有组件；若画布已打开会立即重绘。更新 `kv-config.json` 需在 Cursor 中通过 Figma MCP 读取当前 KV 后由 AI 写入，详见 `REFRESH-KV.md`。
5. 使用 **下载 JPEG** / **下载 PDF** 导出（需联网，依赖 CDN 的 html2canvas / jsPDF）。

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 单页：生成 Luma 海报 + 重新定义 KV 按钮 + 画布编辑与导出 |
| `kv-config.json` | 当前 KV 配置：模板尺寸与各组件插槽（background、logo、mainTitle、subTitle、date、date2、hero、partner） |
| `REFRESH-KV.md` | 如何从 Figma 刷新 KV 并更新 `kv-config.json` |
| `FIGMA-KV-NAMES.md` | kv 及「模板1 luma 海报」图层命名与 Node ID 对照 |
| `WORKFLOW.md` | 整体工作流与后续扩展说明 |

## 模板与组件

- **4 个模板**：**Luma**（1080×1080 方版）、**ID card**（600×900 竖版、含照片/姓名占位）、**EDU 感族**（600×1000 竖版）、**EDU 方旗**（600×1000 竖版）。由「模板」下拉选择后点击「生成海报」生成对应画布。
- **组件插槽**：background、logo、mainTitle、subTitle、cta（行动按钮）、date、date2、placeholder（占位区）、hero、partner；给新 KV 时只需按同结构更新 `kv-config.json`，页面点击「重新定义 KV」即可替换并更新所有模板展示。
