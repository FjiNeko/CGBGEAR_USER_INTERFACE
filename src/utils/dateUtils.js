// src/utils/dateUtils.js

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


/**
 * 将 ISO 格式的日期字符串转换为本地化的日期和时间
 * @param {string} isoString - 例如 '2026-01-13T22:40:37'
 * @returns {string} - 例如 '2026/1/13 22:40'
 */
export const formatDate = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
