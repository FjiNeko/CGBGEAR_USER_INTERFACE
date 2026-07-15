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

import { useEffect } from 'react';

const usePageTransition = () => {
  useEffect(() => {
    // 页面加载时触发页面切换动画
    playPageScan();

    // 页面链接点击时触发页面切换动画
    const links = document.querySelectorAll("a[href]");
    links.forEach(link => {
      link.addEventListener("click", (e) => {
        const url = link.getAttribute("href");
        if (!url || url.startsWith("#") || url.startsWith("javascript")) return;

        e.preventDefault(); // 阻止默认跳转行为
        playPageScan(); // 执行页面过渡动画

        // 延迟跳转，给动画时间
        setTimeout(() => {
          window.location.href = url;
        }, 600); // 根据动画时长调整延迟
      });
    });

    // 清理事件监听器
    return () => {
      links.forEach(link => {
        link.removeEventListener("click", (e) => {
          e.preventDefault();
          playPageScan();
        });
      });
    };
  }, []);

  // 页面切换动画函数
  const playPageScan = () => {
    const scan = document.getElementById("page-scan-transition");

    if (!scan) return;

    scan.innerHTML = "";

    // 随机方向
    const vertical = Math.random() > 0.5;
    scan.classList.toggle("page-scan-vertical", vertical);

    // 添加噪点层
    const noise = document.createElement("div");
    noise.className = "page-scan-noise";
    scan.appendChild(noise);

    // 添加扫描线
    for (let i = 0; i < 3; i++) {
      const beam = document.createElement("div");
      beam.className = "page-scan-beam";
      scan.appendChild(beam);
    }

    // 使动画重新播放
    scan.style.animation = "none";
    void scan.offsetWidth;

    // 选择动画方向
    scan.style.animation = vertical
      ? "scan-vertical 0.65s cubic-bezier(0.32,0.11,0.51,0.88)"
      : "scan-horizontal 0.65s cubic-bezier(0.32,0.11,0.51,0.88)";

    // 添加 HUD 抖动效果
    document.body.classList.add("hud-shake");
    document.body.style.animation = "hudShake 0.65s";

    setTimeout(() => {
      document.body.classList.remove("hud-shake");
      document.body.style.animation = "";
    }, 650);
  };
};

export default usePageTransition;
