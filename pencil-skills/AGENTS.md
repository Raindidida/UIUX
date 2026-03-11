# AGENTS.md

本文档为 AI 编码智能体（Claude Code、Cursor、Copilot 等）在本仓库中工作时提供指导。

## 推荐智能体

面向 Pencil 设计流程（原子化设计动作、MCP 工具、规范驱动 PENCIL_PLAN）时，请使用 **pencil-ui-designer** 智能体。智能体文件：[agents/pencil-ui-designer.md](agents/pencil-ui-designer.md)（格式与 [fullstack-engineer](https://github.com/anthropics/claude-usage/blob/main/agents/fullstack-engineer.md) 一致）。

## 仓库概览

面向 Claude.ai 与 Claude Code 的一组技能集合，用于 Pencil 设计流程与规范驱动 UI 生成。技能是经过打包的说明与脚本，用于扩展 Claude 的能力。本仓库技能参与**「需求→部署」全链路**的**设计阶段：界面设计**——输入为 **Pencil 设计语言**（可由 [t2ui-skills](https://github.com/partme-ai/t2ui-skills) 需求转译从 PRD 产出），经 Pencil MCP 输出**产品图**（.pen 高保真等）。阶段与技能映射见 [full-stack-skills/docs/pipeline-stage-to-skills.md](../full-stack-skills/docs/pipeline-stage-to-skills.md)，技能生态见 [full-stack-skills/docs/skills-ecosystem.md](../full-stack-skills/docs/skills-ecosystem.md)（同 workspace 内）。

## Agent Skills 规范符合性

本仓库遵循 [Agent Skills 规范](https://agentskills.io/specification) 与 [Claude 自定义 Skills 指南](https://support.claude.com/zh-CN/articles/12512198-如何创建自定义-skills)。详见 [spec/agent-skills-spec.md](spec/agent-skills-spec.md)。

### 技能目录结构

每个技能为独立目录，结构参考 [full-stack-skills/skills/mermaid](https://github.com/...)：

```
skills/{skill-name}/
├── SKILL.md          # 必需：YAML frontmatter (name, description) + Markdown 说明
├── LICENSE.txt       # 可选
├── examples/         # 可选：用法示例，按场景分文件便于渐进式加载
├── references/       # 可选：REFERENCE.md、contract.md、official.md 等
├── scripts/          # 可选：可执行脚本
└── assets/           # 可选：模板、图片等
```

### 元数据与正文要求

- **name**：与目录名一致；仅小写字母、数字、连字符；≤64 字符。
- **description**：说明技能做什么、何时使用；含触发关键词；≤1024 字符。
- **正文**：建议包含「When to use」「How to use」、步骤/参数、「Best practices」「Keywords」；长内容放入 references/ 或 examples/，在 SKILL.md 中用相对路径引用（一层深度）。

## Pencil 路径与技能体系

Pencil 与 Stitch 不同：Stitch 通过提示词由大模型生成界面（Text-to-UI）；Pencil 则**真实模拟设计师操作**，需在分析需求后将任务**细化到每个动作**（调用哪个 Pencil MCP 工具、做什么），再按动作序列执行。

**流程**：PRD / 用户需求 → **pencil-ui-design-spec-generator** 产出动作级 **PENCIL_PLAN** → **pencil-mcp-*** 或 Pencil MCP 工具按序执行 → Stage 5 前端开发。原型/Stitch HTML→设计稿由 **pencil-design-from-stitch-html** 负责。

### MCP 技能命名规范

**Pencil MCP 技能命名必须为** `pencil-mcp-{MCP 方法名}`，其中 MCP 方法名中的下划线改为连字符（kebab-case）。例如：`open_document` → 技能名 `pencil-mcp-open-document`。

### MCP 技能列表（一方法一技能）

| 技能名 | 对应 MCP 方法 | 职责 |
|--------|----------------|------|
| `pencil-mcp-open-document` | open_document | 打开/创建文档 |
| `pencil-mcp-get-editor-state` | get_editor_state | 获取当前编辑器与选区 |
| `pencil-mcp-batch-design` | batch_design | 批量设计操作（增删改移等） |
| `pencil-mcp-batch-get` | batch_get | 批量获取节点 |
| `pencil-mcp-snapshot-layout` | snapshot_layout | 布局快照 |
| `pencil-mcp-get-screenshot` | get_screenshot | 获取截图 |
| `pencil-mcp-get-guidelines` | get_guidelines | 获取设计指南（按 topic） |
| `pencil-mcp-get-style-guide-tags` | get_style_guide_tags | 获取风格标签 |
| `pencil-mcp-get-style-guide` | get_style_guide | 获取风格指南（按 tags/id） |
| `pencil-mcp-get-variables` | get_variables | 获取设计变量 |
| `pencil-mcp-set-variables` | set_variables | 设置设计变量 |
| `pencil-mcp-find-empty-space-on-canvas` | find_empty_space_on_canvas | 查找画布空白区域 |
| `pencil-mcp-search-all-unique-properties` | search_all_unique_properties | 搜索属性唯一值 |
| `pencil-mcp-replace-all-matching-properties` | replace_all_matching_properties | 批量替换属性 |

参数与用法详见 [docs/pencil-mcp-tools.md](docs/pencil-mcp-tools.md)。

### Spec 技能

| 技能名 | 职责 |
|--------|------|
| `pencil-ui-design-spec-generator` | 将模糊需求转为**动作级 PENCIL_PLAN**（不执行，只输出计划）；每步标明工具 + 意图 + 关键参数。 |

### 设计系统初始化技能（pencil-ui-design-system-*）

每个技能对应「初始化 XXX: design system components」：输出可执行的 PENCIL_PLAN（Step 1: set_variables 变量表；Step 2: batch_design 组件总览帧结构），供 Agent 按序调用 Pencil MCP。

| 技能名 | 说明 |
|--------|------|
| `pencil-ui-design-system-layui` | 初始化 Layui design system components |
| `pencil-ui-design-system-antd` | 初始化 Ant Design design system components |
| `pencil-ui-design-system-bootstrap` | 初始化 Bootstrap design system components |
| `pencil-ui-design-system-element` | 初始化 Element Plus design system components |
| `pencil-ui-design-system-uview` | 初始化 uView (2.x) design system components |
| `pencil-ui-design-system-uviewpro` | 初始化 uView Pro design system components |
| `pencil-ui-design-system-vant` | 初始化 Vant design system components |
| `pencil-ui-design-system-ucharts` | 初始化 uCharts（图表占位/数据可视化）design system components |
| `pencil-ui-design-system-echarts` | 初始化 ECharts（图表占位/数据可视化）design system components |

### 工厂技能

| 技能名 | 职责 |
|--------|------|
| `pencil-skill-creator` | 创建新的 `pencil-ui-design-system-<name>` 技能：含 SKILL.md Golden Template、references/workflows.md、references/output-patterns.md、scripts/init_pencil_design_system_skill.py。用法：`./scripts/init_pencil_design_system_skill.py <name> --path skills/`。 |

## 创建新技能

### 目录结构

参考 [full-stack-skills/skills/mermaid](https://agentskills.io/what-are-skills) 与 [spec/agent-skills-spec.md](spec/agent-skills-spec.md)：

```
skills/{skill-name}/
├── SKILL.md          # 必需：YAML frontmatter (name, description) + Markdown 说明
├── LICENSE.txt       # 可选
├── examples/         # 可选：用法示例（按场景分文件）
├── references/       # 可选：REFERENCE.md、contract.md 等
├── scripts/          # 可选：可执行脚本
└── assets/           # 可选：模板、图片等
```

### 命名规范

- **技能目录与 name**：`kebab-case`，且 `name` 必须与目录名一致；仅小写字母、数字、连字符；≤64 字符；不以连字符开头/结尾。
- **MCP 技能**：`pencil-mcp-{MCP 方法名}`，方法名下划线改为连字符（如 `open_document` → `pencil-mcp-open-document`）。
- **设计系统技能**：`pencil-ui-design-system-{框架名}`。
- **SKILL.md**：文件名必须为 `SKILL.md`。

### SKILL.md 格式（Agent Skills 规范）

```markdown
---
name: {skill-name}
description: What this skill does and when to use it. Include trigger keywords. Max 1024 characters.
license: Complete terms in LICENSE.txt
---

# Skill Title

**Constraint**: Only use when ... (e.g. user mentions "Pencil").

## When to use this skill

- Use when ...
- Trigger phrases: ...

## How to use this skill

1. Step one: ...
2. Step two: ...

## Input / Output (if applicable)

| Parameter | Type | Required | Description |

## Best practices

- ...

## Keywords

**English:** ...
**中文关键词：** ...

## References

- [Detail](references/REFERENCE.md)
- [Examples](examples/usage.md)
```

### 渐进式披露（Progressive disclosure）

遵循 [Agent Skills 规范](https://agentskills.io/specification)：

1. **发现**：启动时仅加载各技能的 `name` 与 `description`。
2. **激活**：任务匹配时加载完整 `SKILL.md`。
3. **执行**：按需加载 `references/`、`examples/` 中的文件或执行 `scripts/`。

为减少上下文占用：

- **SKILL.md 建议控制在约 500 行以内**；长内容放入 `references/` 或 `examples/`。
- **description 写得具体并含触发关键词**，便于智能体判断何时激活技能。
- **文件引用保持一层深度**：从 SKILL.md 直接链接到 `references/xxx.md` 或 `examples/xxx.md`。

### 脚本要求

- 使用 `#!/bin/bash` shebang
- 使用 `set -e` 实现失败即退出
- 将状态信息输出到 stderr：`echo "Message" >&2`
- 将机器可读输出（JSON）写入 stdout
- 为临时文件加入 cleanup trap
- 脚本路径引用格式为 `/mnt/skills/user/{skill-name}/scripts/{script}.sh`

### 创建 Zip 包

创建或更新技能后：

```bash
cd skills
zip -r {skill-name}.zip {skill-name}/
```

### 终端用户安装

为用户记录以下两种安装方式：

**Claude Code：**
```bash
cp -r skills/{skill-name} ~/.claude/skills/
```

**claude.ai：**
将技能加入项目知识，或将 SKILL.md 内容粘贴到对话中。

如果技能需要网络访问，提示用户在 `claude.ai/admin-settings/capabilities` 中添加所需域名。

