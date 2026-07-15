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
import React, { useState, useEffect, useCallback } from 'react';

// --- 配置常量 ---
const TARGET_DATE = new Date("2026-02-17T00:00:00");
const SESSION_HOURS = [12, 13, 18, 19, 20, 21];
const SESSION_DURATION_MINS = 5;

const RedPacketRain = () => {
  const [now, setNow] = useState(new Date());
  const [isEventDate, setIsEventDate] = useState(false);
  const [status, setStatus] = useState('waiting_date');
  const [countdownStr, setCountdownStr] = useState('');
  const [nextHour, setNextHour] = useState(0);
  const [packets, setPackets] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]); 
  const [totalCGB, setTotalCGB] = useState(0); 

  // 1. 金额随机逻辑 (仅前端展示用)
  const generateCGB = () => {
    const rand = Math.random() * 100;
    if (rand < 0.1) return 8888;
    if (rand < 5) return (Math.random() * 0.99 + 0.01).toFixed(2);
    if (rand < 15) return (Math.random() * 9 + 1).toFixed(2);
    return (Math.random() * 980 + 20).toFixed(2);
  };

  // 2. 同步时间
  const syncTime = useCallback(async () => {
    try {
      const res = await fetch('https://api-test.cgbgear.cn/api/server_time_proxy');
      const data = await res.json();
      const [h, m, s] = data.current_time.split(':').map(Number);
      const serverTime = new Date();
      serverTime.setHours(h, m, s, 0);
      setNow(serverTime);
      setIsEventDate(data.is_event_date);
    } catch (e) {
      const local = new Date();
      setNow(local);
      setIsEventDate(local.getMonth() === 1 && local.getDate() === 17);
    }
  }, []);

  useEffect(() => {
    syncTime();
    const timer = setInterval(() => setNow(prev => new Date(prev.getTime() + 1000)), 1000);
    const syncTimer = setInterval(syncTime, 30000);
    return () => { clearInterval(timer); clearInterval(syncTimer); };
  }, [syncTime]);

  // 3. 核心状态判定与倒计时计算
  useEffect(() => {
    if (!isEventDate) {
      setStatus('waiting_date');
      const diff = TARGET_DATE - now;
      if (diff > 0) {
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        setCountdownStr(`${d}天${h}时`);
      } else { setCountdownStr("准时开启"); }
      return;
    }

    const currSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    let foundActive = false;
    let nextIdx = -1;

    for (let i = 0; i < SESSION_HOURS.length; i++) {
      const start = SESSION_HOURS[i] * 3600;
      const end = start + SESSION_DURATION_MINS * 60;
      if (currSec >= start && currSec < end) {
        setStatus('active');
        foundActive = true;
        break;
      } else if (currSec < start) {
        nextIdx = i;
        break;
      }
    }

    if (!foundActive) {
      if (nextIdx !== -1) {
        setStatus('waiting');
        setNextHour(SESSION_HOURS[nextIdx]);
        
        // --- 修复点：动态倒计时逻辑 ---
        const diffSeconds = SESSION_HOURS[nextIdx] * 3600 - currSec;
        
        if (diffSeconds >= 3600) {
          // 超过1小时：显示 X时Y分
          const hh = Math.floor(diffSeconds / 3600);
          const mm = Math.floor((diffSeconds % 3600) / 60);
          setCountdownStr(`${hh}时${mm}分`);
        } else {
          // 1小时以内：显示 MM:SS
          const mm = String(Math.floor(diffSeconds / 60)).padStart(2, '0');
          const ss = String(diffSeconds % 60).padStart(2, '0');
          setCountdownStr(`${mm}:${ss}`);
        }
      } else { 
        setStatus('ended'); 
      }
    }
  }, [now, isEventDate]);

  // 4. 红包生成控制
  useEffect(() => {
    if (status === 'active') {
      const itv = setInterval(() => {
        setPackets(prev => [...prev.slice(-12), { // 限制同屏数量，优化性能
          id: Math.random(),
          left: Math.random() * 85 + 5 + '%',
          duration: Math.random() * 2 + 1.5 + 's',
          size: Math.random() * 15 + 65 + 'px'
        }]);
      }, 500);
      return () => clearInterval(itv);
    } else { setPackets([]); }
  }, [status]);

  // 5. 点击处理
  const handlePacketClick = async (p, e) => {
    e.stopPropagation();

    const amountStr = generateCGB();
    const amountFloat = parseFloat(amountStr);
    const x = e.clientX;
    const y = e.clientY;

    // 乐观更新 UI
    setTotalCGB(prev => prev + amountFloat);

    const textId = Math.random();
    setFloatingTexts(prev => [...prev, { id: textId, x, y, amount: amountStr }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== textId));
    }, 1000);

    setPackets(prev => prev.filter(item => item.id !== p.id));

    // 后端入账
    try {
      await fetch('https://api-test.cgbgear.cn/api/activity/red_packet/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: amountFloat })
      });
    } catch (err) {
      console.error("入账失败", err);
    }
  };

  if (status === 'ended') return null;

  return (
    <>
      {/* 飘字层 */}
      <div className="effect-layer">
        {floatingTexts.map(t => (
          <div key={t.id} className="float-amt" style={{ left: t.x, top: t.y }}>
            +{t.amount} CGB
          </div>
        ))}
      </div>

      {/* 红包雨层 */}
      <div className="rain-container">
        {packets.map(p => (
          <div key={p.id} className="falling-packet"
            style={{ left: p.left, animationDuration: p.duration, width: p.size }}
            onClick={(e) => handlePacketClick(p, e)}>
            <svg viewBox="0 0 1024 1024" width="100%" height="100%">
              <path d="M187.7 0h648.5v1024H187.7z" fill="#D10D0D"></path>
              <path d="M785.1 972.8H238.9V119.5h34.1v819.2h477.9V119.5h34.1z" fill="#FFC50B"></path>
              <path d="M187.7 138.2L512 298.7l324.3-160.4V0H187.7z" fill="#FF642E"></path>
              <path d="M512 300.4m-175.8 0a175.8 175.8 0 1 0 351.6 0 175.8 175.8 0 1 0-351.6 0Z" fill="#FFC50B"></path>
              <path d="M512.6 694.4l-90.5-90.5 90.5-90.5 90.5 90.5z" fill="#D10D0D"></path>
            </svg>
          </div>
        ))}
      </div>

      {/* 对联系统 */}
      <div className={`couplet-system ${status === 'active' ? 'active-mode' : ''}`}>
        <div className="banner-top">新春大吉</div>

        <div className="couplet-main">
          {/* 左联 */}
          <div className="scroll-v left-scroll">马腾盛世千家喜</div>

          {/* 中间核心 */}
          <div className="couplet-center-box">
            <div className="center-header">
              {status === 'waiting_date' && "马年演习"}
              {status === 'waiting' && `${nextHour}点场`}
              {status === 'active' && "正在发放"}
            </div>
            <div className={`center-timer ${status === 'active' ? 'is-active' : ''}`}>
               {countdownStr || "00:00"}
            </div>
            {totalCGB > 0 && (
              <div className="total-score">
                已获: <span>{totalCGB.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* 右联 */}
          <div className="scroll-v right-scroll">龙舞神州万象新</div>
        </div>
      </div>

      <style jsx>{`
        .effect-layer { position: fixed; inset: 0; pointer-events: none; z-index: 10001; }
        .float-amt {
          position: absolute;
          color: #ffeb3b;
          font-weight: bold;
          font-size: 24px;
          text-shadow: 0 0 10px rgba(210, 10, 10, 0.8), 2px 2px 2px #000;
          animation: floatUp 1s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
          white-space: nowrap;
        }

        .couplet-system {
          position: fixed;
          right: 30px;
          top: 100px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          filter: drop-shadow(0 4px 15px rgba(0,0,0,0.4));
          user-select: none;
          transition: all 0.5s;
        }

        .banner-top {
          background: #b20a0a;
          color: #ffd700;
          padding: 6px 20px;
          border: 2px solid #ffd700;
          border-radius: 4px;
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 8px;
          white-space: nowrap;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }

        .couplet-main {
          display: flex;
          align-items: stretch;
          gap: 8px;
        }

        .scroll-v {
          background: #b20a0a;
          color: #ffd700;
          width: 28px;
          padding: 15px 4px;
          border: 2px solid #ffd700;
          writing-mode: vertical-rl;
          font-family: "STKaiti", "Kaiti", serif;
          font-size: 15px;
          font-weight: bold;
          letter-spacing: 4px;
          border-radius: 3px;
        }

        .couplet-center-box {
          background: radial-gradient(circle, #e62e2e 0%, #b20a0a 100%);
          border: 3px solid #ffd700;
          width: 110px;
          padding: 15px 5px;
          text-align: center;
          color: #ffd700;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-shadow: inset 0 0 15px rgba(0,0,0,0.3);
        }

        .center-header { font-size: 13px; font-weight: bold; border-bottom: 1px solid rgba(255,215,0,0.3); margin-bottom: 10px; padding-bottom: 5px; }
        
        .center-timer { 
          font-size: 20px; 
          font-weight: 900; 
          text-shadow: 0 0 8px rgba(255, 255, 0, 0.6);
          font-family: monospace;
        }
        
        .center-timer.is-active {
          color: #fff;
          animation: blink 0.8s infinite;
        }

        .total-score { 
          font-size: 11px; 
          margin-top: 12px; 
          color: #fff; 
          background: rgba(0,0,0,0.3); 
          padding: 2px 4px;
          border-radius: 10px; 
        }
        .total-score span { color: #ffeb3b; font-weight: bold; }

        .rain-container {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 10000; overflow: hidden;
        }
        
        .falling-packet {
          position: absolute;
          top: -120px;
          cursor: pointer;
          pointer-events: auto;
          animation: fall linear forwards;
          filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3));
          user-select: none;
        }

        @keyframes fall { to { transform: translateY(115vh) rotate(360deg); } }
        @keyframes floatUp { 
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-120px) scale(1); opacity: 0; }
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

        /* 移动端适配 */
        @media screen and (max-width: 768px) {
          .couplet-system {
            top: 15px;
            right: 15px;
            transform: scale(0.85);
            transform-origin: right top;
          }
          .scroll-v { display: none; } /* 移动端隐藏侧联 */
          .banner-top { font-size: 14px; padding: 4px 15px; }
          .couplet-center-box { width: 95px; padding: 10px 5px; }
          .falling-packet { width: 75px !important; } /* 手机端红包略微加大提升手感 */
        }

        .active-mode { 
          animation: activePulse 2s infinite; 
          filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.5));
        }
        @keyframes activePulse {
          0%, 100% { transform: scale(0.85); }
          50% { transform: scale(0.92); }
        }
      `}</style>
    </>
  );
};

export default RedPacketRain;
