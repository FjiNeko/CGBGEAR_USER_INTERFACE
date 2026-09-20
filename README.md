<h1 align="center">CGBGEAR 论坛原网站源码（前端）</h1>

<p align="center">
  <img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" align="absmiddle" alt="license" />
  <img src="https://img.shields.io/badge/python-3.10%2B-blue.svg" align="absmiddle" alt="python" />
  <img src="https://img.shields.io/badge/version-latest-green.svg" align="absmiddle" alt="version" />
  <img src="https://img.shields.io/badge/platform-Linux-lightgrey.svg" align="absmiddle" alt="platform" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/ALERT-yellow.svg" align="absmiddle" alt="ALERT" /> <strong>安全与开源规范告示</strong>：仓库已剔除全部历史遗留压缩归档与冗余副本，严禁将包含真实私密凭据的 .env 配置文件提交至公开仓库，请参考 .env.example 自行配置私有环境变量。
</p>

欢迎来到 **CGBGEAR** 论坛的开源前端仓库！本仓库命名为 `USER_INTERFACE`。

> **项目说明**：FjiNeko 与 @DayingNeko 均为本人。该项目于 2025 年 11 月正式落地并开始建设，历时将近一年的持续开发与迭代。

## 项目目录（持续更新）

*   **前端（当前仓库）**：[点击跳转到前端 Github 仓库](https://github.com/FjiNeko/CGBGEAR_USER_INTERFACE)
*   **后端仓库**：[点击跳转到后端 Github 仓库](https://github.com/FjiNeko/CGBGEAR_SERVER)

## 这是个什么项目？

原网站 [www.cgbgear.cn](http://www.cgbgear.cn) 是一个**独立自创的军警垂直领域论坛平台**。后因用户基数较小、维护资金不足以及人力成本过高，导致平台遗憾无法继续维持常态化运营。

## 为什么选择开源？

本网站的**全栈代码编写、架构设计以及日常运营均由我一人独立完成**。

虽然项目早期发起人曾尝试招聘过相关人员，但后续加入的成员均未参与过实质性的代码开发与后台管理。因此，该项目的完整代码所有权**严格隶属于本人**。

鉴于个人精力有限、无力继续独自维护与开发，我决定将完整的项目代码无保留开源，希望能给有需要的朋友提供参考或帮助。

## 本地开发与环境配置

本项目基于 React 19 + Vite 构建：

1. **安装依赖**：
   ```bash
   npm install
   ```
2. **环境配置**：
   复制示例环境变量文件：
   ```bash
   cp .env.example .env
   ```
   并在 `.env` 中指定后端 API 地址：
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:3052/api
   ```
3. **启动开发服务器**：
   ```bash
   npm run dev
   ```
4. **项目构建**：
   ```bash
   npm run build
   ```

## 开源协议

本项目代码严格遵循 **[AGPL-3.0](https://choosealicense.com/licenses/agpl-3.0/)** 开源协议。请在遵守协议条款的前提下使用、修改和分发代码。

---

**Written by FjiNeko**  
*Update: 2026/07/16*