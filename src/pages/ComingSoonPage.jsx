/*
 * Copyright (C) 2026 FjiNeko
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/main.css"; // 引入主样式文件
import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";

// ================== 与搜索 / 登录相同逻辑的 ID 生成（可选，但保持一致性） ==================
const ID_CHAR_POOL = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildSearchId() {
  const len = randomInt(10, 30);
  const letters = ["c", "g", "b", "g", "e", "a", "r"];
  const mode = Math.random() < 0.5 ? "whole" : "scatter";

  const arr = Array.from({ length: len }, () => {
    const idx = Math.floor(Math.random() * ID_CHAR_POOL.length);
    return ID_CHAR_POOL[idx];
  });

  if (mode === "whole") {
    const word = letters.join(""); // "cgbgear"
    const insertPos = randomInt(0, len - word.length);
    const before = arr.slice(0, insertPos).join("");
    const after = arr.slice(insertPos + word.length).join("");
    return before + word + after;
  } else {
    const posSet = new Set();
    while (posSet.size < letters.length) {
      posSet.add(randomInt(0, len - 1));
    }
    const positions = Array.from(posSet).sort((a, b) => a - b);
    positions.forEach((pos, idx) => {
      arr[pos] = letters[idx];
    });
    return arr.join("");
  }
}

export default function ComingSoonPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // 保持 URL 参数的一致性（如果从其他“终端”页面跳转过来）
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let changed = false;

    if (!params.get("id")) {
      params.set("id", buildSearchId());
      changed = true;
    }
    if (!params.get("view")) {
      params.set("view", "pc");
      changed = true;
    }
    if (!params.get("broswer")) {
      params.set("broswer", "chrome");
      changed = true;
    }
    if (!params.get("statusLogin")) {
      params.set("statusLogin", "0");
      changed = true;
    }

    if (changed) {
      navigate(`${location.pathname}?available=0`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  return (
    // ******** 修改：页面整体背景应为深色 ********
    <div className="page terminal-page coming-soon-page">
      {/* 顶部导航：设置为实色（navSolid={true}），防止与背景融合 */}
      <MainNav navSolid={true} />

      {/* ******** 修改：主内容区域，使用新的样式类 ******** */}
      <main className="terminal-main coming-soon-main">
        <div className="terminal-container coming-soon-container">
          <h1 className="terminal-title">
            <span className="prompt-prefix">root@cgbgear:~#</span>
            <span className="prompt-prefix-green">页面正在加载...</span>
            <span className="blinking-cursor">_</span>
          </h1>
          <p className="terminal-message">
            系统提示：功能模块正在进行紧张的编译与部署，请耐心等候。
          </p>
          <p className="terminal-message">
            预计完成时间：&lt;不可预测&gt;
          </p>
          <p className="terminal-message">
            任务状态：[████████░░] 80% 完成 (优化阶段)
          </p>
          <p className="terminal-message">
            我们正在努力为您提供更稳定、高效的服务，敬请期待新版本的上线。
          </p>
          <button className="terminal-btn primary" onClick={() => navigate('/')}>
            返回主控制台
          </button>
        </div>
      </main>

      {/* 页脚 */}
      <SiteFooter />
    </div>
  );
}
