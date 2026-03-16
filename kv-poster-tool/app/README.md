# KV 海报工具 — shadcn Command UI

基于 [shadcn/ui Command 组件](https://www.shadcn.net/docs/components/command)（cmdk）搭建的命令面板 UI。

## 技术栈

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS**
- **cmdk**（Command 底层）
- **Radix UI Dialog**（CommandDialog 弹层）
- **lucide-react** 图标

## 使用

```bash
# 安装依赖（已安装可跳过）
npm install

# 开发
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview
```

## 功能

- **打开命令面板**：点击「打开命令面板」或按 **⌘K**（Windows 下 **Ctrl+K**）
- **搜索**：输入关键词过滤模板与操作
- **分组**：模板 / 操作（从 Figma 读取、导出 JPEG、设置）
- **快捷键**：CommandShortcut 展示 ⌘F、⌘E、⌘S 等

## 组件结构

- `src/components/ui/command.tsx` — Command、CommandInput、CommandList、CommandItem、CommandGroup、CommandEmpty、CommandSeparator、CommandShortcut、CommandDialog
- `src/components/ui/dialog.tsx` — Radix Dialog（CommandDialog 依赖）
- `src/components/ui/button.tsx` — 按钮
- `src/App.tsx` — 入口页与命令面板逻辑
