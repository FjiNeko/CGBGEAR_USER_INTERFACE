// src/components/NoticePanel.jsx
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
import React from 'react';
import '../css/main.css';

const NoticePanel = ({ notices, onClose }) => {
  if (notices.length === 0) return null;

  // 辅助函数：根据类型获取标题和图标
  const getHeaderInfo = (type) => {
    switch (type) {
      case 'error':
        return { title: '>> SYSTEM_FAILURE', icon: '✕' }; // 错误
      case 'success':
        return { title: '>> OPERATION_SUCCESS', icon: '✓' }; // 成功
      case 'warning':
        return { title: '>> SYSTEM_WARNING', icon: '!' }; // 警告
      default:
        return { title: '>> SYSTEM_INFO', icon: 'i' }; // 默认信息
    }
  };

  return (
    // 使用单独的容器类，避免与 WebsiteNoticePage 的 .notice-container 冲突
    // 并允许通过 CSS 固定在视口顶部，防止撑开页面高度
    <div className="app-notice-container" aria-live="polite" aria-atomic="true">
      {notices.map((notice) => {
        const { title, icon } = getHeaderInfo(notice.type);
        
        return (
          <div key={notice.id} className={`notice-box ${notice.type}`}>
            {/* Header */}
            <div className="notice-header">
              <span className="notice-title-group">
                {/* [修复] 包裹一层 i 标签，用于隔离背景色取值和图标颜色 */}
                <span className="notice-icon-badge">
                  <i>{icon}</i>
                </span>
                <span className="notice-title-text">{title}</span>
              </span>
              <button 
                className="notice-close-btn" 
                onClick={() => onClose(notice.id)}
              >
                [CLOSE]
              </button>
            </div>
            
            {/* Body */}
            <div className="notice-body">
              <span className="notice-cursor">&gt;</span> {notice.message}
            </div>
            
            {/* Progress Bar */}
            <div className="notice-progress"></div>
          </div>
        );
      })}
    </div>
  );
};

export default NoticePanel;
