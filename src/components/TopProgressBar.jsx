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
import React, { useState, useEffect } from 'react';
import '../css/TopProgressBar.css'; // 我们将为它创建 CSS 文件

const TopProgressBar = ({ isActive }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (isActive) {
      setWidth(0); // 开始时宽度为0
      // 模拟进度条增长
      const interval = setInterval(() => {
        setWidth(prevWidth => {
          if (prevWidth >= 95) { // 接近完成时减缓速度，等待实际加载完成
            clearInterval(interval);
            return 95;
          }
          return prevWidth + 5; // 每隔一段时间增加宽度
        });
      }, 100); // 每 100ms 更新一次

      return () => clearInterval(interval);
    } else {
      // 当不活跃时，快速完成进度条并隐藏
      setWidth(100);
      const hideTimeout = setTimeout(() => setWidth(0), 300); // 0.3s 后隐藏
      return () => clearTimeout(hideTimeout);
    }
  }, [isActive]);

  // 如果 width 为 0 且不活跃，则不渲染组件，避免不必要的 DOM 元素
  if (!isActive && width === 0) {
    return null;
  }

  return (
    <div className="top-progress-bar-container">
      <div className="top-progress-bar" style={{ width: `${width}%` }}></div>
    </div>
  );
};

export default TopProgressBar;
