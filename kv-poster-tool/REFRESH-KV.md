# 重新定义 KV — 从 Figma 刷新模板

点击页面上的 **「重新定义 KV」** 会从 `kv-config.json` 重新加载配置，并替换当前 Luma 模板中的所有元素（background、logo、mainTitle、subTitle、date、date2、hero、partner）。若画布已打开，会立即重绘。

## 如何用 Figma 里的新 KV 更新模板

1. **在 Figma 中** 打开对应设计稿，选中要作为新 KV 的 **画板/Frame**（例如 KV 主画板 `kv` 或「模板1 luma 海报」）。
2. **在 Cursor 里** 对 AI 说：
   - 「用当前 Figma 选中的 KV 更新海报模板」
   - 或「从 Figma 刷新 KV：读取当前选中的节点并更新 kv-config.json」
3. AI 会通过 **Figma MCP** 读取当前选中节点，把解析出的文案、图片 URL、样式等写入 `kv-config.json` 的 `slots`（并保持 `templateId`、`width`、`height` 等不变或按需调整）。
4. **在浏览器中** 打开或刷新 `index.html`，点击 **「重新定义 KV」**，即可用新 KV 替换模板内所有组件并更新展示。

## kv-config.json 的 slots 结构

| 插槽 | 说明 | 示例字段 |
|------|------|----------|
| background | 背景 | type: "gradient" \| "image", value: CSS 或图片 URL |
| logo | 品牌区 | hostLabel, brandText, images: string[] |
| mainTitle | 主标题 | text |
| subTitle | 副标题 | text |
| date | 日期 | text |
| date2 | 地点/副信息 | text |
| hero | 主视觉 | images: string[], placeholder?: boolean |
| partner | 合作方 | label, text, images: string[] |

新 KV 只需按上述结构填充各 slot，模板会自动适配并更新所有模板展示。
