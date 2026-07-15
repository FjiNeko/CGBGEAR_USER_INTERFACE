// src/components/SiteFooter.jsx
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
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ************* 修正点 1: 导入新的 API 函数 *************
import { getCurrentUser, logoutUser } from "../api/api";


export default function SiteFooter() {
  const [currentUser, setCurrentUser] = useState(null); // null 表示未登录用户 (包括游客)
  const navigate = useNavigate();

  const handleLogoutEvent = () => {
    setCurrentUser(null);
    console.log("SiteFooter: Global logout event received, user state cleared.");
  };

  // ************* 修正点 2: 修改 checkLoginStatus 逻辑，根据 is_logged_in 判断 *************
  const checkLoginStatus = async () => {
    try {
      const user = await getCurrentUser(); // 调用 API 获取当前用户信息
      if (user && user.is_logged_in) {
        setCurrentUser(user); // 如果已登录，设置完整的用户对象
        // console.log("SiteFooter: User is logged in:", user.username);
      } else {
        setCurrentUser(null); // 如果是游客或未登录，设置 currentUser 为 null
        // console.log("SiteFooter: User is a guest.");
      }
    } catch (e) {
      console.warn("SiteFooter: Failed to get current user info via API:", e);
      setCurrentUser(null); // API 抛出错误，也视为未登录
    }
  };


  useEffect(() => {
    checkLoginStatus(); // 组件挂载时检查一次

    window.addEventListener('cgbgear-logout', handleLogoutEvent);

    return () => {
      window.removeEventListener('cgbgear-logout', handleLogoutEvent);
    };
  }, []);

  const handleAccountClick = () => {
    // 这里使用 crypto.randomUUID() 而不是 buildSearchId 是可以的，因为这只是一个客户端生成的 ID
    const randomId = crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "").slice(0, 16) : Date.now().toString().slice(0, 16);
    const params = new URLSearchParams();
    params.set("id", randomId);
    params.set("view", "pc");
    params.set("broswer", "chrome");
    params.set("statusLogin", "0"); // 登录状态强制为 0，因为是去登录页
    navigate(`/terminal/login?${params.toString()}`);
  };

  // ************* 修正点 3: 修改 handleLogout 逻辑，调用 API *************
  const handleLogout = async () => {
    try {
      await logoutUser(); // 调用 API 登出，api.js 会负责清除 localStorage 和派发事件
      setCurrentUser(null); // 清除本地状态
      navigate("/"); // 退出后导航到首页
    } catch (e) {
      console.error("SiteFooter: Logout failed:", e);
      alert("登出失败，请稍后再试。");
    }
  };

  const handleUserProfileClick = () => {
    if (currentUser && currentUser.is_logged_in) { // 确保是已登录用户
      navigate("/user-center"); // 假设个人中心路由是 /user-center
    } else {
      // 未登录状态点击个人中心，引导到登录页面
      handleAccountClick();
    }
  };

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-columns">
          <div>
            <div className="footer-title">
              账户
              <div className="footer-title-en">ACCOUNT</div>
            </div>
            <div className="footer-links">
              {/* ************* 关键修改点: 根据 currentUser 是否为 null 来条件渲染 ************* */}
              {currentUser ? ( // 用户已登录
                <>
                  <div className="footer-username-display" style={{ cursor: 'default' }}>
                    {currentUser.username}
                  </div>
                  <div className="footer-link" onClick={handleUserProfileClick}>
                    个人中心
                  </div>
                  <div className="footer-link" onClick={handleLogout}>
                    退出登录
                  </div>
                </>
              ) : ( // 用户未登录 (游客)
                <>
                  <div className="footer-link" onClick={handleAccountClick}>
                    登录 / 注册
                  </div>
                  <div className="footer-link" onClick={handleUserProfileClick}>
                    个人中心
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <div className="footer-title">
              支持
              <div className="footer-title-en">SUPPORT</div>
            </div>
            <div className="footer-links">
              <div className="footer-link">帮助中心</div>
              <div className="footer-link">常见问题</div>
            </div>
          </div>

          <div>
            <div className="footer-title">
              联系
              <div className="footer-title-en">CONTACT</div>
            </div>
            <div className="footer-links">
              <div className="footer-link">联系我们</div>
              <div className="footer-link">商务合作</div>
            </div>
          </div>

          <div>
            <div className="footer-title">
              关于
              <div className="footer-title-en">ABOUT</div>
            </div>
            <div className="footer-links">
              <div className="footer-link">关于 CGBGEAR</div>
              <div className="footer-link">品牌故事</div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} CGBGEAR Tactical Community. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
