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
import '../css/HomePostListSkeleton.css'; // 我们将为它创建 CSS 文件

const HomePostListSkeleton = ({ count = 3 }) => {
  return (
    <div className="post-list skeleton">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="post-item skeleton-item">
          <div className="post-title skeleton-text-line large"></div>
          <div className="post-meta skeleton-text-line small"></div>
        </div>
      ))}
    </div>
  );
};

export default HomePostListSkeleton;
