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

import React, { createContext, useContext, useState, useCallback } from 'react';
import NoticePanel from '../components/NoticePanel';

const NoticeContext = createContext();

export const useNotice = () => useContext(NoticeContext);

export const NoticeProvider = ({ children }) => {
  const [notices, setNotices] = useState([]);

  // 添加通知
  const showNotice = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    
    setNotices(prev => {
      // 创建新通知对象
      const newNotice = { id, message, type };
      
      // 合并旧通知和新通知
      const updatedList = [...prev, newNotice];
      
      // 如果超过3个，保留最后3个 (即删除最早的)
      if (updatedList.length > 3) {
        return updatedList.slice(updatedList.length - 3);
      }
      return updatedList;
    });

    // 20秒后自动移除该特定通知
    setTimeout(() => {
      removeNotice(id);
    }, 20000);
  }, []);

  // 移除通知
  const removeNotice = useCallback((id) => {
    setNotices(prev => prev.filter(notice => notice.id !== id));
  }, []);

  return (
    <NoticeContext.Provider value={{ showNotice, removeNotice }}>
      {children}
      <NoticePanel notices={notices} onClose={removeNotice} />
    </NoticeContext.Provider>
  );
};
