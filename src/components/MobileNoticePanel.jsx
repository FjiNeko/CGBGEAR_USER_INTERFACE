// src/components/MobileNoticePanel.jsx
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

const MobileNoticePanel = ({ notices, onClose }) => {
  if (!Array.isArray(notices) || notices.length === 0) return null;

  // 根据类型返回标题和图标（与 NoticePanel 同步）
  const getHeaderInfo = (type) => {
    switch (type) {
      case 'error':
        return { title: '>> SYSTEM_FAILURE', icon: '✕' };
      case 'success':
        return { title: '>> OPERATION_SUCCESS', icon: '✓' };
      case 'warning':
        return { title: '>> SYSTEM_WARNING', icon: '!' };
      default:
        return { title: '>> SYSTEM_INFO', icon: 'i' };
    }
  };

  return (
    // 使用单独的容器类，确保与 PC/Web 公告页面样式解耦
    <div className="app-mobile-notice-container" aria-live="polite" aria-atomic="true">
      {notices.map((notice) => {
        const { title, icon } = getHeaderInfo(notice.type);
        return (
          <div key={notice.id} className={`notice-box ${notice.type}`}>
            {/* Header */}
            <div className="notice-header">
              <span className="notice-title-group">
                <span className="notice-icon-badge">
                  <i>{icon}</i>
                </span>
                <span className="notice-title-text">{title}</span>
              </span>
              <button
                className="notice-close-btn"
                onClick={() => onClose(notice.id)}
                aria-label="Close notification"
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

export default MobileNoticePanel;

