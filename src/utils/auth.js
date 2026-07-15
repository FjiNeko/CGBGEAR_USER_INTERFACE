// src/utils/auth.js

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

const ID_CHAR_POOL = "abcdefghijklmnopqrstuvwxyz0123456789";

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成搜索 / 登录用 id：
 * - 总长度 10 ~ 30 随机
 * - 一半概率：包含连续的 "cgbgear"
 * - 一半概率：拆成 c g b g e a r 分散插入随机位置
 */
export function buildSearchId() {
  const len = randomInt(10, 30);
  const mode = Math.random() < 0.5 ? "whole" : "scatter";
  const letters = ["c", "g", "b", "g", "e", "a", "r"];

  // 先构造一串随机字符
  const arr = Array.from({ length: len }, () => {
    const idx = Math.floor(Math.random() * ID_CHAR_POOL.length);
    return ID_CHAR_POOL[idx];
  });

  if (mode === "whole") {
    const word = letters.join(""); // "cgbgear"
    const insertPos = randomInt(0, len - word.length);
    const before = arr.slice(0, insertPos).join("");
    const after = arr.slice(insertPos + word.length).join("");
    return before + word + after;
  } else {
    const positionsSet = new Set();
    while (positionsSet.size < letters.length) {
      positionsSet.add(randomInt(0, len - 1));
    }
    const positions = Array.from(positionsSet).sort((a, b) => a - b);
    positions.forEach((pos, index) => {
      arr[pos] = letters[index];
    });
    return arr.join("");
  }
}
