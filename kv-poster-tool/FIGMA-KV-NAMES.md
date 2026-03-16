# Figma KV 图层元素命名（Hackquest Graphic Design）

来源：[Figma - Hackquest Graphic Design](https://www.figma.com/design/XNL2kfx3Pkm0Ln5yItb7RT/Hackquest-Graphic-Design?node-id=4388-3421)

---

## 画板「模板搭建」下结构

### 1. 主 KV 画板：`kv`（id: 4388:3422）

| 尺寸 | 2382 × 1080 px |
|------|-----------------|

| 图层名 | Node ID | 类型 | 说明 / 默认文案 |
|--------|---------|------|------------------|
| **background** | 4388:3423 | frame | 背景（含多组 Vector / Group） |
| **hero** | 4388:3451 | frame | 主视觉（多组 Group，插画/图形） |
| **date2** | 4388:3499 | frame | 地点/副信息文案 |
| **date** | 4388:3506 | frame | 日期文案 |
| **logo** | 4388:3516 | frame | 品牌/主办 logo 区域 |
| **subTitle** | 4388:3528 | frame | 副标题 |
| **mainTitle** | 4388:3547 | frame | 主标题 |
| **partnerlogo** | 4388:3571 | frame | 合作方 logo 区域 |

**kv 内文本节点（可编辑字段）**：

| 字段 | 所在 frame | 默认内容 |
|------|------------|----------|
| 主标题 | mainTitle (4388:3547) | "Mega Co-Learning Camp 2024" (id: 4388:3570) |
| 副标题 | subTitle (4388:3528) | "Bangalore, India" (id: 4388:3546) |
| 日期 | date (4388:3506) | "3rd - 5th December" (id: 4388:3508) |
| 地点/日期2 | date2 (4388:3499) | "Yello Living, Bangalore, India" (id: 4388:3500) |

---

### 2. 模板画板：`模板1 luma 海报`（id: 4388:3583）

| 尺寸 | **1080 × 1080 px**（用于网页模板 1） |
|------|--------------------------------------|

与 kv 同层，为另一尺寸/排版变体。主要可编辑与展示元素对应关系：

| 元素 | 说明 |
|------|------|
| 主标题 | "EDU Chain X HackQuest Mega Co-Learning Camp 2024" (id: 4388:3600) |
| 日期区 | Group 1261153380 内 "3rd - 5th December" (id: 4388:3592) |
| 地点/日期2 | "Yello Living, Bangalore, India" (id: 4388:3585) |
| HOST | Group 1261153384，含 "HOST" 文本 (id: 4388:3603) |
| Layer_1 | Logo 矢量 (4388:3654 等) |
| 主图区 | Group 1261153702、Group 1261153701 等（hero 主视觉） |
| 装饰线 | Vector 1 / Vector 2 / Vector 3 (4388:3651–3653) 等 |

---

## 与 WORKFLOW 的 KV 类型对应

| Figma 图层名 | WORKFLOW 元素类型 |
|--------------|-------------------|
| mainTitle | 主标题 |
| subTitle | 副标题 |
| date / date2 | 时间 / 地点 |
| hero | 主元素 |
| background | 背景 |
| logo / partnerlogo | 辅助小元素（logo 类） |
