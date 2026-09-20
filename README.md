<h1 align="center">CGBGEAR 论坛原网站源码（前端）</h1>

<p align="center">
  <img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" align="absmiddle" alt="license" />
  <img src="https://img.shields.io/badge/Vite-7.2.4-9135FF?logo=vite" align="absmiddle" alt="vite" />
  <img src="https://img.shields.io/badge/React-19.3-58c4dc?logo=react" align="absmiddle" alt="react" />
  <img src="https://img.shields.io/badge/version-latest-green.svg" align="absmiddle" alt="version" />
  <img src="https://img.shields.io/badge/platform-Linux-lightgrey.svg" align="absmiddle" alt="platform" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/ATTENTION!-yellow.svg" align="absmiddle" alt="attention" />
  本项目已全面清理历史归档压缩包与冗余副本，请务必基于 .env.example 独立配置接口地址，严禁将私有环境文件及密钥提交至公开仓库。
</p>

CGBGEAR 论坛系统用户交互界面源码仓库（代码代号 USER_INTERFACE）。

> <img src="https://img.shields.io/badge/DESCRIPTION-0ea5e9.svg" align="absmiddle" alt="description" /> **项目说明**：[@FjiNeko](https://github.com/FjiNeko) 与 @DayingNeko 均为作者本人。项目于2025/11落地立项，历经一年持续全栈独立开发与工程迭代。

## 项目架构矩阵

| 架构节点 | 代号 | 职责定位 | 仓库直达 |
| :--- | :--- | :--- | :--- |
| **客户端** | `USER_INTERFACE` | React 19 / Vite / 双端自适应交互界面（当前仓库） | [FjiNeko/CGBGEAR_USER_INTERFACE](https://github.com/FjiNeko/CGBGEAR_USER_INTERFACE) |
| **服务端** | `SERVER` | RESTful API / 数据库 / 认证 / 缓存 | [FjiNeko/CGBGEAR_SERVER](https://github.com/FjiNeko/CGBGEAR_SERVER) |

## 项目背景与开源声明

CGBGEAR 原网站（cgbgear.cn）系由合伙人提出业务构想，并由作者 [@FjiNeko](https://github.com/FjiNeko) 作为核心开发者统筹全盘研发落地的一款军警战术装备垂直社区。运营期间受限于细分垂直领域受众基数、常态化合规审查边界以及长期运维的算力与资金成本，平台最终终止线上商业化运作。

本项目前端系统——涵盖双端响应式视口架构、战术终端沉浸式交互、Tiptap 富文本深度定制及端侧状态管理流——均由作者独立编码完成。代码产权清晰完整，不存在第三方商业争议或未厘清的知识产权纠纷。鉴于个人精力有限难以长期独自支撑多端演进，现将全部完整交互界面与端侧工程代码无保留开源发布，旨在为前端工程化、垂直领域社区交互以及赛博极客设计规范提供实战参考范例。

## 核心功能与交互特性

*   **双端原生自适应**：包含完整的 PC 桌面端与移动端双重视图，针对不同视口提供定制化交互与排版布局。
*   **赛博与战术终端美学**：黑绿对比配色、极客终端登录界面、动效音效（夜视仪启闭音效）结合，沉浸感极强。
*   **富文本编辑体验**：定制 Tiptap 富文本框架，支持代码块、自适应图片缩放、表格交互与高亮标记。
*   **装备交易与社区板块**：内置二手装备供需集市、发布求购、图文详情、交流评论与分类检索。
*   **互动组件与数据可视化**：集成 D3 / React-Simple-Maps 地理可视化地图、幸运轮盘、红包雨互动及新年倒计时。
*   **状态与安全守卫**：全站上下文状态驱动（AuthContext / NoticeContext），集成政策更新守卫（PolicyUpdateGuard）与全流程骨架屏加载。

## 技术栈

| 分类 | 核心技术 / 库 | 版本 | 说明 |
| :--- | :--- | :--- | :--- |
| **视图层** | React / React DOM | `19.3` / `19.2` | 响应式 UI 声明式开发 |
| **工程构建** | Vite | `7.2.4` | 本地 HMR 调试与打包构建 |
| **路由导航** | React Router DOM | `7.9.6` | 单页面应用端侧路由分发与守卫 |
| **富文本生态** | @tiptap/react / 扩展集 | `3.15.3` | 图文排版、代码块与表格编辑 |
| **网络通信** | Axios | `1.13.2` | 拦截器封装与凭据跨域支持 |
| **数据可视化** | D3-Scale / React-Simple-Maps | `4.0.2` / `3.0.0` | 地理拓扑可视化与社区互动图表 |
| **组件与图标** | Lucide-react / Bootstrap | `0.574.0` / `4.6.2` | 矢量图标集与基础栅格布局 |

## 本地开发与构建步骤

### 1. 克隆项目

```bash
git clone https://github.com/FjiNeko/CGBGEAR_USER_INTERFACE.git
cd CGBGEAR_USER_INTERFACE
```

### 2. 依赖安装

```bash
npm install
```

### 3. 环境配置

创建本地开发环境变量：

```bash
cp .env.example .env
```

在 `.env` 中按需指定后端服务端接口地址：

```env
# 本地后端联调
VITE_API_BASE_URL=http://127.0.0.1:3052/api

# 或远程测试节点
# VITE_API_BASE_URL=https://api-test.cgbgear.cn/api
```

### 4. 运行与构建

```bash
# 启动本地开发服务 (支持 HMR)
npm run dev

# 执行代码规范检测
npm run lint

# 生产环境打包构建
npm run build

# 预览生产构建包
npm run preview
```

## 目录结构概览

```text
CGBGEAR_USER_INTERFACE/
├── index.html            # 单页面应用入口
├── vite.config.js        # Vite 构建与 React Compiler 配置
├── package.json          # 依赖声明与编译脚本
├── eslint.config.js      # ESLint 规范定义
├── .env.example          # 前端环境变量模板
├── .gitignore            # Git 忽略安全策略
├── public/               # 公共静态资源
└── src/
    ├── main.jsx          # React 根挂载点
    ├── App.jsx           # 全局路由分发、懒加载与守卫注入
    ├── api/              # 后端 API 请求交互模块 (Axios)
    ├── assets/           # 音效、矢量图形资产
    ├── components/       # 通用业务组件 (导航、页脚、骨架屏、地图、活动)
    │   ├── Tiptap/       # 富文本编辑器定制节点 (图片缩放等)
    │   └── activity/     # 互动营销组件 (轮盘、红包)
    ├── context/          # 全局认证与消息 Context
    ├── css/              # 页面及主题样式表集合
    ├── fonts/            # 自定义字体资源 (DingTalk 字体系列)
    ├── pages/            # 核心路由页面 (论坛、交易、用户中心、后台仪表盘等)
    │   └── admin/        # 管理员工作台视图
    └── utils/            # 认证工具、日期计算、文件哈希算法等
```

## 开源协议

本项目代码严格遵循 [AGPL-3.0](https://choosealicense.com/licenses/agpl-3.0/) 开源协议。请在遵守协议条款的前提下使用、修改和分发代码。

---

Written by FjiNeko  
Update: 2026/09/20
