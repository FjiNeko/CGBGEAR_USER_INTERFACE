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
import '../css/HomeStatsSkeleton.css'; // 我们将为它创建 CSS 文件

const HomeStatsSkeleton = () => {
  return (
    <section className="stats-panel skeleton">
      <div className="panel-title skeleton-text-line short"></div>
      <div className="stats-grid">
        {[...Array(4)].map((_, index) => ( // 渲染 4 个骨架项
          <div key={index} className="stats-item skeleton-item">
            <div className="stats-icon skeleton-icon"></div>
            <div className="stats-meta">
              <div className="stats-label skeleton-text-line small"></div>
              <div className="stats-value skeleton-text-line large"></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HomeStatsSkeleton;
