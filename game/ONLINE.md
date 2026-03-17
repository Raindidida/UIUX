# 成语死斗 — 联网对战说明

## 启动方式

### 一键启动（推荐）
```powershell
D:\UIUX\game\start-all.ps1
```

### 分别启动

**后端服务器（端口 3001）：**
```powershell
Set-Location D:\UIUX\game-server
npx ts-node src/index.ts
```

**前端游戏（端口 3000）：**
```powershell
Set-Location D:\UIUX\game
npm run dev
```

## 访问地址

- 游戏：http://localhost:3000
- 后端健康检查：http://localhost:3001/health

## 联网对战流程

1. 在首页输入**玩家昵称**
2. 选择**难度**（两名玩家需选相同难度才能匹配到一起）
3. 点击**联网对战**按钮
4. 等待匹配界面自动寻找对手
5. 匹配成功后自动进入游戏，轮流接龙
6. 接龙失败/超时触发轮盘赌（由服务端仲裁，防作弊）

## 配置

前端环境变量（`game/.env`）：
```
VITE_SOCKET_URL=http://localhost:3001
```

## 目录结构

```
D:\UIUX\
├── game\           前端 React 游戏
│   ├── src\
│   │   ├── socket\socketClient.ts    Socket.IO 客户端封装
│   │   ├── components\
│   │   │   ├── MatchmakingScreen.tsx 匹配等待界面
│   │   │   └── ...
│   │   └── App.tsx                  含联网状态机
│   └── .env                         服务器地址配置
└── game-server\    Node.js 后端
    └── src\
        ├── index.ts        Socket.IO 服务器入口
        ├── matchQueue.ts   玩家匹配队列
        ├── roomManager.ts  房间和弹仓管理
        ├── gameLogic.ts    游戏逻辑（弹仓计算）
        └── types.ts        共享类型定义
```
