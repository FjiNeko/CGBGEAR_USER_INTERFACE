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
import RedPacketRain from '../components/activity/RedPacketRain';
import LuckyWheel from '../components/activity/LuckyWheel';
import { useLocation } from 'react-router-dom';

const NewYearActivityManager = () => {
  const location = useLocation();
  
  // 只在首页或论坛页面展示活动入口
  const showActivity = location.pathname === '/' || location.pathname.startsWith('/forum');

  if (!showActivity) return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <RedPacketRain />
    </div>
  );
};

export default NewYearActivityManager;
