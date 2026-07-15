// src/context/AuthContext.jsx

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


import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser, logoutUser } from '../api/api'; // 引入你的 API

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // 用户信息对象
  const [loading, setLoading] = useState(true); // 是否正在初始检查

  // 初始化检查
  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (userData && userData.is_logged_in) {
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth init failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 提供给登录页面的方法：登录成功后手动更新状态
  const login = (userData) => {
    setUser(userData);
  };

  // 提供给导航栏的方法：退出登录
  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      // 可选：在这里处理跳转，或者由组件处理
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // 这里的 value 是所有子组件能拿到的东西
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义 Hook，方便组件调用
export const useAuth = () => useContext(AuthContext);
