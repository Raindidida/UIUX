# Cursor 本地安装说明

本仓库已通过 **Git** 克隆。所有 Pencil Skills 已复制到 Cursor：

- **Skill 根目录**: `C:\Users\Mayn\.cursor\skills\`
- **来源**: 本仓库 `skills/` 下各子文件夹（每个子文件夹为一个 Skill）

## 已安装技能（22 个）

- **编排器**: `pencil-ui-designer`
- **MCP 原子技能**: `pencil-mcp-open-document`、`pencil-mcp-get-editor-state`、`pencil-mcp-batch-design`、`pencil-mcp-batch-get` 等
- **设计系统**: `pencil-ui-design-system-layui`、`pencil-ui-design-system-antd`、`pencil-ui-design-system-element`、`pencil-ui-design-system-vant`、`pencil-ui-design-system-uview`、`pencil-ui-design-system-uviewpro`、`pencil-ui-design-system-bootstrap`、`pencil-ui-design-system-echarts`、`pencil-ui-design-system-ucharts`
- **其他**: `pencil`、`pencil-skill-creator`、`pencil-ui-design-spec-generator`、`pencil-design-from-stitch-html`

技能索引见仓库内 [docs/skills-index.md](docs/skills-index.md)。

## 更新 Skill（仓库更新后）

```powershell
cd "d:\UI design\pencil-skills"
& "C:\Program Files\Git\bin\git.exe" pull
$src = "d:\UI design\pencil-skills\skills"; $dest = "$env:USERPROFILE\.cursor\skills"
Get-ChildItem $src -Directory | ForEach-Object { Copy-Item -Path $_.FullName -Destination (Join-Path $dest $_.Name) -Recurse -Force }
```

## 使用方式

在对话中提及「Pencil」和目标框架，例如：

- 「Pencil，为我初始化 Layui 的表格和表单组件」
- 「使用 Pencil 规范流，基于 Ant Design 设计一个后台管理系统」
- 「用 Pencil 打开新文档并获取编辑器状态」
