// src/components/UserAvatar.jsx
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

const generateAvatarStyle = () => {
  const colors = [
    '#667eea', '#764ba2', '#6b82a7', '#80d0c7', '#c79081',
    '#e0e0e0', '#fbd786', '#f7797d', '#b1f4cf', '#d5d4d0',
    '#a18cd1', '#fbc2eb', '#fad0c4', '#ffdee9', '#c471ed'
  ];
  const startColor = colors[Math.floor(Math.random() * colors.length)];
  let endColor = colors[Math.floor(Math.random() * colors.length)];
  while (endColor === startColor) { // 确保开始和结束颜色不同
    endColor = colors[Math.floor(Math.random() * colors.length)];
  }
  const angle = Math.floor(Math.random() * 360);
  return {
    background: `linear-gradient(${angle}deg, ${startColor}, ${endColor})`,
    color: '#ffffff', // 白色文本确保对比度
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    width: '100%', // 占满父容器
    height: '100%', // 占满父容器
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  };
};

const UserAvatar = ({ username, avatarUrl, size = '32px' }) => {
  if (!username) return null;

  const style = {
    width: size,
    height: size,
    minWidth: size, // 确保最小尺寸
    minHeight: size,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // 防止在flex容器中收缩
  };

  if (avatarUrl) {
    return (
      <div className="user-avatar-container" style={style}>
        <img src={avatarUrl} alt={username} className="user-avatar-image" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  const initial = username[0]?.toUpperCase() || 'U';
  const avatarBgStyle = generateAvatarStyle();

  return (
    <div className="user-avatar-container" style={style}>
      <div style={avatarBgStyle}>
        {initial}
      </div>
    </div>
  );
};

export default UserAvatar;
