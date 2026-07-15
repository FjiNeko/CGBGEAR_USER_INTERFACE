// src/components/MainNav.jsx
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
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { buildSearchId } from "../utils/auth";
import UserAvatar from "./UserAvatar";
import { useAuth } from "../context/AuthContext"; // 1. 引入 Context Hook

// --- 添加图标定义 ---
const navIcons = {
  home: (
    <svg className="mobile-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  brand: (
    <svg className="mobile-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
    </svg>
  ),
  players: (
    <svg className="mobile-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  forum: (
    <svg className="mobile-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
  ),
  qa: (
    <svg className="mobile-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.09 18h.01"></path>
      <path d="M15.09 18h.01"></path>
      <path d="M10.93 14L9 10.5M4 19h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"></path>
    </svg>
  ),
  trade: (
    <svg className="mobile-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  ),
};

const navItems = [
  { key: "home", label: "首页", routes: "/" },
  { key: "brand", label: "品牌产品", routes: "/product" },
  { key: "players", label: "玩家优质作品", routes: "/premium-players" },
  { key: "forum", label: "论坛", routes: "/forum" },
  { key: "qa", label: "答疑解惑", routes: "/qa" },
  { key: "trade", label: "出物 / 收物", routes: "/trade" }
];

// 定义移动端判断的屏幕宽度断点，与 App.jsx 中的保持一致
const MOBILE_BREAKPOINT = 768; 

export default function MainNav({ navSolid }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeNav, setActiveNav] = useState("home");
  const [searchText, setSearchText] = useState("");

  // --- 新增：isMobile 状态 ---
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  const { user: currentUser, logout } = useAuth(); 

  // --- 新增：监听窗口大小变化 ---
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    // 首次渲染时也检查一次
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  // --- 结束新增 ---

  // 路由高亮逻辑保持不变
  useEffect(() => {
    const matched = navItems.find((item) => {
      if (item.routes === location.pathname) {
        return true;
      }
      if (item.key === 'forum' && location.pathname.startsWith('/forum')) {
        return true;
      }
      // --- 修正：移动端点击 Home Logo 后，应该高亮 Home ---
      // 当点击Logo跳转到根路径时，如果当前活跃项不是home，则设置为home
      if (location.pathname === '/' && item.key === 'home') {
          return true;
      }
      // --- 结束修正 ---
      return false;
    });

    if (matched) {
      setActiveNav(matched.key);
    } else {
      setActiveNav(null);
      if (location.pathname.startsWith('/terminal') || location.pathname.startsWith('/user-center')) {
        setActiveNav(null);
      }
    }
  }, [location.pathname]);

  const handleNavClick = (item) => {
    setActiveNav(item.key);
    if (item.routes) {
      navigate(item.routes);
    }
  };

  const triggerSearch = () => {
    const kw = searchText.trim();
    const id = buildSearchId();
    // 未提供关键词：跳转到纯 /search（无任何参数）
    if (!kw) {
      navigate(`/search?id=${id}`);
      return;
    }
    // 提供关键词：保留 id + 关键词参数
    const params = new URLSearchParams();
    params.set('id', id);
    params.set('keywords', kw);
    params.set('show', '12');
    navigate(`/search?${params.toString()}`);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") triggerSearch();
  };

  const handleLoginClick = () => {
    const id = buildSearchId();
    const params = new URLSearchParams();
    params.set("id", id);
    params.set("view", isMobile ? "mobile" : "pc"); // 根据设备传递参数
    params.set("broswer", "chrome");
    params.set("statusLogin", "0");
    navigate(`/terminal/login?${params.toString()}`);
  };

  const handleLogout = async () => {
    await logout(); 
    navigate("/"); 
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleUserProfileClick = () => {
    if (currentUser) {
      navigate("/user-center");
    } else {
      navigate("/terminal/login");
    }
  };

  const handleJoinUsClick = () => {
    navigate("/terminal/register");
  };

  return (
    <header className={`main-nav ${navSolid ? "nav-solid" : "nav-transparent"}`}>
      {/* --- 新增：手机端顶部搜索和登录状态区域 --- */}
      {isMobile && (
        <div className="mobile-nav-top-bar">
          <div className="mobile-search-wrapper">
            <input
              className="search-input mobile-search-input" // 沿用现有 search-input，并添加 mobile 专用类
              placeholder="搜索..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <span className="search-icon mobile-search-icon" onClick={triggerSearch}>
              {/* 复用原始搜索图标 */}
              <svg className="search-icon-svg" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path d="M650.666667 245.333333c113.066667 113.066667 113.066667 294.4 0 407.466667-113.066667 113.066667-294.4 113.066667-407.466667 0-113.066667-113.066667-113.066667-294.4 0-407.466667 113.066667-113.066667 296.533333-113.066667 407.466667 0z m-44.8 44.8c-87.466667-87.466667-228.266667-87.466667-315.733334 0-87.466667 87.466667-87.466667 228.266667 0 315.733334 87.466667 87.466667 228.266667 87.466667 315.733334 0 87.466667-87.466667 87.466667-228.266667 0-315.733334z" />
                <path d="M614.4 661.333333l179.2 179.2c8.533333 8.533333 21.333333 8.533333 29.866667 0l14.933333-14.933333c8.533333-8.533333 8.533333-21.333333 0-29.866667L661.333333 614.4 614.4 661.333333z" />
              </svg>
            </span>
          </div>

          <div className="mobile-auth-actions">
            {currentUser ? (
              <div className="nav-user-profile mobile-user-profile" onClick={handleUserProfileClick}>
                <div className="nav-user-avatar">
                  <UserAvatar username={currentUser.username} avatarUrl={currentUser.avatar_url} size="28px" />
                </div>
                <button className="nav-cta primary mobile-logout-btn" type="button" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>
                  退出
                </button>
              </div>
            ) : (
              <button className="nav-cta primary mobile-login-btn" type="button" onClick={handleLoginClick}>
                登录
              </button>
            )}
          </div>
        </div>
      )}
      {/* --- 结束新增：手机端顶部区域 --- */}


      {/* --- 现有 PC 端导航结构：在手机端隐藏 --- */}
      <div className="nav-inner" style={{ display: isMobile ? 'none' : 'flex' }}> {/* 添加内联样式控制显示/隐藏 */}
        <div className="nav-left">
          <div className="logo" onClick={handleLogoClick}>
            <div className="logo-mark"></div>
          </div>
          <nav className="nav-links">
            {navItems.map((item) => (
              <div
                key={item.key}
                className={`nav-link ${activeNav === item.key ? "active" : ""}`}
                onClick={() => handleNavClick(item)}
              >
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        <div className="nav-right">
          <div className="search-wrapper">
            <input
              className="search-input"
              placeholder="搜索战术装备 / 玩家 / 帖子"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <span className="search-icon" onClick={triggerSearch}>
              <svg className="search-icon-svg" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path d="M650.666667 245.333333c113.066667 113.066667 113.066667 294.4 0 407.466667-113.066667 113.066667-294.4 113.066667-407.466667 0-113.066667-113.066667-113.066667-294.4 0-407.466667 113.066667-113.066667 296.533333-113.066667 407.466667 0z m-44.8 44.8c-87.466667-87.466667-228.266667-87.466667-315.733334 0-87.466667 87.466667-87.466667 228.266667 0 315.733334 87.466667 87.466667 228.266667 87.466667 315.733334 0 87.466667-87.466667 87.466667-228.266667 0-315.733334z" />
                <path d="M614.4 661.333333l179.2 179.2c8.533333 8.533333 21.333333 8.533333 29.866667 0l14.933333-14.933333c8.533333-8.533333 8.533333-21.333333 0-29.866667L661.333333 614.4 614.4 661.333333z" />
              </svg>
            </span>
          </div>

          {currentUser ? (
            <div className="nav-user-profile" onClick={handleUserProfileClick} style={{ cursor: 'pointer' }}>
              <div className="nav-user-avatar">
                <UserAvatar username={currentUser.username} avatarUrl={currentUser.avatar_url} size="32px" />
              </div>
              <div className="nav-user-name">{currentUser.username}</div>
              <button className="nav-cta primary" type="button" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>
                退出登录
              </button>
            </div>
          ) : (
            <>
              <button className="nav-cta" onClick={handleJoinUsClick}>加入我们</button>
              <button className="nav-cta primary" type="button" onClick={handleLoginClick}>
                登录
              </button>
            </>
          )}
        </div>
      </div>
      {/* --- 结束现有 PC 端导航结构 --- */}


      {/* --- 新增：手机端底部导航 --- */}
      {isMobile && (
        <nav className="mobile-bottom-nav">
          {navItems.map((item) => (
            <div
              key={item.key}
              className={`mobile-nav-item ${activeNav === item.key ? "active" : ""}`}
              onClick={() => handleNavClick(item)}
            >
              {item.key === 'home' ? (
                <div className="mobile-nav-logo-wrapper">
                  <div className="logo mobile-home-logo"> {/* 复用 logo class, 添加 mobile 专用类 */}
                    <div className="logo-mark"></div>
                  </div>
                </div>
              ) : (
                <>
                  {navIcons[item.key]}
                  <span className="mobile-nav-label">{item.label}</span>
                </>
              )}
            </div>
          ))}
        </nav>
      )}
      {/* --- 结束新增：手机端底部导航 --- */}
    </header>
  );
}
