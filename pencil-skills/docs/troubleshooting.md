# Pencil 插件 / MCP 故障排除

本文档整理 Pencil 在 Cursor / VS Code 及 MCP 使用过程中的常见错误与处理方式。官方完整排错见 [Pencil Troubleshooting](https://docs.pencil.dev/troubleshooting)。

---

## 1. "Built assets not found. Please build the editor first."

### 现象

打开 Pencil 插件（或从扩展里打开 .pen 文件）时提示：

```text
Error: Built assets not found. Please build the editor first.
```

### 可能原因

- 使用的是**从源码安装或开发的 Pencil 扩展**，扩展内的「编辑器」前端尚未构建，缺少构建产物（如 `dist/`、`out/`、`webview/` 等）。
- 扩展安装不完整或更新/安装过程中断，导致构建产物缺失。

### 处理步骤

1. **确认安装方式**
   - **从 Cursor / VS Code 扩展市场安装**：不应出现此错误；若出现，按下面「从应用市场安装」处理。
   - **从源码或本地路径安装**：需要先在该扩展目录内执行构建，再在 Cursor 中加载。

2. **从应用市场安装时**
   - 完全**卸载** Pencil 扩展，重启 Cursor，再重新从扩展市场**安装** Pencil。
   - 检查扩展是否有可用更新并更新到最新版本。
   - 若仍报错，可尝试清除 Cursor 扩展缓存后重装（视 Cursor 版本，扩展数据通常在 `~/.cursor/extensions` 或类似路径）。

3. **从源码/开发版安装时**
   - 进入 Pencil 扩展的**项目根目录**（含 `package.json` 的目录）。
   - 安装依赖并执行构建，例如：
     ```bash
     npm install
     npm run build
     # 或
     npm run compile
     # 若存在 webview/editor 子工程，可能还需：
     # cd editor && npm install && npm run build
     ```
   - 确认生成目录（如 `dist/`、`out/`、或文档中说明的 webview 输出路径）存在且含构建文件后，再在 Cursor 中「从文件夹加载扩展」或按该开发版说明加载。

4. **仍无法解决时**
   - 使用 Pencil **桌面端应用**（若当前平台支持），桌面端不依赖 IDE 扩展的构建产物。
   - 向 Pencil 官方反馈：提供错误原文、Cursor/VS Code 版本、Pencil 扩展版本与安装方式（市场 / 本地路径），见 [Pencil Troubleshooting - Reporting Bugs](https://docs.pencil.dev/troubleshooting#reporting-bugs)。

---

## 2. MCP 报错 "A file needs to be open in the editor"

### 现象

调用 Pencil MCP 工具（如 `batch_design`、`get_editor_state`）时返回：

```text
A file needs to be open in the editor to perform this action.
```

### 原因与处理

- MCP 依赖**当前在 Pencil 中已打开**的 .pen 文档；没有打开任何 .pen 时会报此错。
- **处理**：在 Pencil（插件或桌面端）中先**打开或新建**一个 .pen 文件，并确保该文档为当前激活标签，再重试 MCP 调用。

---

## 3. 扩展已安装但无法连接 / 看不到 Pencil 图标

- 参见官方 [Extension installed but doesn't connect](https://docs.pencil.dev/troubleshooting#extension-installed-but-doesnt-connect)。
- 简要步骤：确认 MCP 已连接（Cursor：Settings → Tools & MCP）、完成 Pencil 激活、确保 Claude Code 已登录（终端执行 `claude`）、重启 Cursor。

---

## 4. 相关链接

- [Pencil 官方故障排除](https://docs.pencil.dev/troubleshooting)
- [Pencil 安装说明](https://docs.pencil.dev/getting-started/installation)
- 本仓库 [Pencil MCP 工具说明](./pencil-mcp-tools.md)
