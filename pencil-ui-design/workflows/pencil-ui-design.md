---
description: 使用 Pencil MCP 创建工业级 UI 设计的标准工作流
---

# Pencil MCP UI 设计工作流

## 前置准备

// turbo
1. 确认 Pencil MCP 服务已启动
2. 阅读 skills: `.agent/skills/pencil-ui-design/SKILL.md`

## 第一步：初始化设计文件

1. 打开或创建 .pen 文件
```
mcp_pencil_open_document({ filePathOrTemplate: "new" })
```

2. 获取编辑器状态
```
mcp_pencil_get_editor_state({ include_schema: false })
```

## 第二步：创建可复用组件

1. 参考 `components.md` 创建基础组件
2. 使用 `reusable: true` 标记为可复用
3. 组件命名规范: `Category/Name` (如 `Button/Primary`)

```javascript
mcp_pencil_batch_design({
  filePath: "design.pen",
  operations: `
    buttonPrimary=I(document, {type: "frame", reusable: true, name: "Button/Primary", ...})
  `
})
```

## 第三步：创建页面结构

1. 创建页面 Frame (390x844 for iPhone)
2. 设置背景色 `#FAFAFA`
3. 使用垂直布局

```javascript
page=I(document, {
  type: "frame",
  name: "Page Name",
  x: 0, y: 0,
  width: 390, height: 844,
  fill: "#FAFAFA",
  layout: "vertical"
})
```

## 第四步：构建 UI

1. 通过 `ref` 引用可复用组件
2. 使用 `U()` 覆盖特定属性

```javascript
btn1=I(parent, {type: "ref", ref: "buttonPrimary"})
U(btn1+"/text", {content: "确认"})
```

## 第五步：验证设计

// turbo
1. 截图检查
```
mcp_pencil_get_screenshot({ nodeId: "pageId" })
```

2. 检查布局问题
```
mcp_pencil_snapshot_layout({ filePath: "design.pen", problemsOnly: true })
```

## 第六步：批量优化

如需批量更新样式：

```javascript
mcp_pencil_replace_all_matching_properties({
  filePath: "design.pen",
  parents: ["page1", "page2"],
  properties: {
    "fontFamily": {"Fredoka": "Inter"},
    "fillColor": {"#FFF9F2": "#FAFAFA"}
  }
})
```

## 质量检查清单

- [ ] 背景色统一 `#FAFAFA`
- [ ] 卡片边框 `1px #E4E4E7`
- [ ] 阴影 blur 2-6px
- [ ] 按钮圆角 8px
- [ ] 字体 Inter
- [ ] 图标 Lucide
- [ ] 字体层级 12/14/16/18/20/24px
- [ ] 间距 4px 网格
