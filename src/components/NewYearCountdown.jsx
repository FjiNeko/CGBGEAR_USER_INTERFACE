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
import React, { useState, useEffect, useRef } from 'react';
import '../css/NewYearCountdown.css';

const NewYearCountdown = ({ currentUser }) => {
    // 状态管理
    const [displayTime, setDisplayTime] = useState(""); // 显示的倒计时 HH:MM:SS
    const [isVisible, setIsVisible] = useState(false);  // 是否显示组件
    const [isLastTenSeconds, setIsLastTenSeconds] = useState(false); // 是否最后10秒
    const [isFinished, setIsFinished] = useState(false); // 是否已跨年
    
    // 内部引用的当前时间（用于每秒递增）
    const currentTimeRef = useRef(new Date()); 
    // 标记是否正在从服务器获取时间
    const isFetchingRef = useRef(false);
    // 标记是否已经请求过奖励
    const hasClaimedRef = useRef(false);

    // --- 核心逻辑：时间同步 ---
    const syncTimeFromServer = async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
            const res = await fetch('/api/server_time_proxy');
            const data = await res.json();
            if (data.current_time) {
                // 解析 HH:MM:SS
                const [h, m, s] = data.current_time.split(':').map(Number);
                const now = new Date();
                now.setHours(h, m, s);
                currentTimeRef.current = now;
                console.log(`[Time Sync] Calibrated to ${data.current_time} from ${data.source}`);
            }
        } catch (err) {
            console.error("Time sync failed:", err);
        } finally {
            isFetchingRef.current = false;
        }
    };

    // --- 初始化与定时器 ---
    useEffect(() => {
        // 1. 立即同步一次
        syncTimeFromServer();

        // 2. 建立每分钟同步一次的定时器
        const syncInterval = setInterval(syncTimeFromServer, 60000);

        // 3. 建立每秒递增显示的本地定时器
        const tickInterval = setInterval(() => {
            // 本地时间 + 1秒
            const now = currentTimeRef.current;
            now.setSeconds(now.getSeconds() + 1);
            currentTimeRef.current = new Date(now); // 更新 ref

            // 计算逻辑
            const h = now.getHours();
            const m = now.getMinutes();
            const s = now.getSeconds();

            // 设定目标：今天的 23:59:59 -> 明天的 00:00:00
            // 判断是否在活动区间：23:30:00 到 23:59:59
            
            // 调试模式：如果需要测试，可以将下方条件改为当前时间附近
            const isActiveRange = (h === 23 && m >= 30);
            
            if (isActiveRange) {
                setIsVisible(true);
                
                // 计算距离 24:00:00 (即下一天 00:00:00) 还有多少秒
                const secondsInDay = h * 3600 + m * 60 + s;
                const secondsUntilMidnight = 86400 - secondsInDay;

                // 格式化倒计时
                const rM = Math.floor(secondsUntilMidnight / 60);
                const rS = secondsUntilMidnight % 60;
                setDisplayTime(`${rM.toString().padStart(2, '0')}:${rS.toString().padStart(2, '0')}`);

                // 最后10秒特效
                if (secondsUntilMidnight <= 10 && secondsUntilMidnight > 0) {
                    setIsLastTenSeconds(true);
                }

                // 跨年时刻 (考虑到定时器可能有延迟，只要剩0秒或如果是第二天0点)
                if (secondsUntilMidnight <= 0) {
                    handleMidnight();
                }
            } else if (h === 0 && m === 0 && s <= 59) {
                // 刚好跨完年的一分钟内
                handleMidnight();
            } else {
                setIsVisible(false); // 不在时间段内隐藏
            }

        }, 1000);

        return () => {
            clearInterval(syncInterval);
            clearInterval(tickInterval);
        };
    }, []);

    // --- 跨年触发逻辑 ---
    const handleMidnight = () => {
        setIsVisible(true);
        setIsLastTenSeconds(false);
        setIsFinished(true);
        setDisplayTime("00:00");
        
        // 发放奖励
        if (currentUser && !hasClaimedRef.current) {
            hasClaimedRef.current = true;
            claimReward();
        }
    };

    const claimReward = async () => {
        try {
            await fetch('/api/claim_new_year_gift', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: currentUser.uid }) // 假设传入了user对象
            });
            console.log("Reward Claimed!");
        } catch (e) {
            console.error(e);
        }
    };

    if (!isVisible) return null;

    return (
        <div className={`ny-overlay ${isFinished ? 'ny-finished' : ''} ${isLastTenSeconds ? 'ny-last-10' : ''}`}>
            {/* 倒计时状态 */}
            {!isFinished && (
                <div className="ny-countdown-container">
                    <div className="ny-label">距离马年跨年还有</div>
                    <div className={`ny-timer ${isLastTenSeconds ? 'ny-timer-shake' : ''}`}>
                        {displayTime}
                    </div>
                    
                    {/* 最后10秒特效：策马奔腾 */}
                    {isLastTenSeconds && (
                        <div className="ny-horse-anim">
                            {/* 这里放入AI生成的透明视频或GIF */}
                            <div className="horse-silhouette">🐎</div> 
                            <div className="gold-particles"></div>
                        </div>
                    )}
                </div>
            )}

            {/* 跨年完成状态：全屏祝福 + 红包雨 */}
            {isFinished && (
                <div className="ny-celebration">
                    <div className="ny-title-box">
                        <h1 className="ny-main-title">新年快乐</h1>
                        <h2 className="ny-sub-title">龙行龘龘 · 马跃檀溪</h2>
                        <div className="ny-gift-tag">
                            8888 CGB 跨年红包已到账
                        </div>
                    </div>
                    
                    {/* CSS实现的简单红包雨 DOM */}
                    <div className="red-packet-rain">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <i key={i} className="rp-item" style={{
                                left: `${Math.random() * 100}%`,
                                animationDuration: `${2 + Math.random() * 3}s`,
                                animationDelay: `${Math.random() * 2}s`
                            }}>🧧</i>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewYearCountdown;
