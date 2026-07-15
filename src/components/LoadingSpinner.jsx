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
import '../css/LoadingSpinner.css';
const LOGO_URL = 'https://img.cgbgear.cn/favicon.ico'; 

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner-overlay">
      <div className="loading-spinner-container">
        <div className="loading-spinner">
          <img src={LOGO_URL} alt="Logo" className="spinner-logo" />
        </div>
        <p className="loading-text">加载中...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
