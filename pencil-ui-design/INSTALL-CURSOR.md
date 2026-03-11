# Cursor 本地安装说明

本仓库已通过 **Git** 克隆到本地。Skill 已同步到 Cursor：

- **Skill 位置**: `C:\Users\Mayn\.cursor\skills\pencil-ui-design\`
- **来源**: 本仓库 `skills/pencil-ui-design/` 下的文件

## 更新 Skill（仓库更新后）

仓库有更新时，在本目录执行：

```powershell
git pull
Copy-Item -Path "skills\pencil-ui-design\*" -Destination "$env:USERPROFILE\.cursor\skills\pencil-ui-design\" -Recurse -Force
```

或在 Cursor 中打开终端，在 `d:\UI design\pencil-ui-design` 下运行上述命令。

## Git 未在 PATH 时

若终端报错找不到 `git`，可用完整路径：

```powershell
& "C:\Program Files\Git\bin\git.exe" pull
```
