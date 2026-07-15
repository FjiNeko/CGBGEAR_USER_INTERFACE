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
import { createPortal } from 'react-dom';
import { useNotice } from '../../context/NoticeContext'; // 确保路径正确

const LuckyWheel = () => {
  const { showNotice } = useNotice();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [prize, setPrize] = useState(null);
  const [entranceFinished, setEntranceFinished] = useState(false);
  const [isWuHour, setIsWuHour] = useState(false);
  
  // 用于追踪用户获得奖品的历史，模拟权值衰减
  const [winHistory, setWinHistory] = useState({});

  // 奖品配置 (已按需求调整)
  const PRIZES_CONFIG = [
    { id: 1, text: '88 CGB', color: '#b20a0a', weight: 10 },
    { id: 2, text: '188 CGB', color: '#d11515', weight: 5 },
    { id: 3, text: '888 CGB', color: '#b20a0a', weight: 1 },
    { id: 4, text: '双倍卡', color: '#d11515', weight: 10 },
    { id: 5, text: '龙马勋章', color: '#b20a0a', weight: 5 },
    { id: 6, text: '灰度资格', color: '#d11515', weight: 10 },
    { id: 7, text: '18 CGB', color: '#b20a0a', weight: 40 }, // 高概率
    { id: 8, text: '新春祝福', color: '#d11515', weight: 19 }, // 2026大奖改为祝福语
  ];

  useEffect(() => {
    setTimeout(() => setEntranceFinished(true), 1200);
    const h = new Date().getHours();
    if (h >= 11 && h < 13) setIsWuHour(true);
  }, []);

  const handleSpin = async () => {
    if (spinning) return;

    setShowResult(false);
    setPrize(null);
    setSpinning(true);

    try {
      const res = await fetch('https://api-test.cgbgear.cn/api/activity/lucky_wheel/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      // 处理 429 Too Many Requests
      if (res.status === 429) {
        showNotice('操作太频繁了，请稍后重试', 'warning');
        setSpinning(false);
        return;
      }

      const data = await res.json();

      if (data.code !== 200) {
        showNotice(data.msg || '积分不足或冷却中', 'error');
        setSpinning(false);
        return;
      }

      const wonPrize = data.data.prize;
      
      // 更新获奖历史 (前端逻辑，用于模拟或提示)
      setWinHistory(prev => ({
        ...prev,
        [wonPrize.id]: (prev[wonPrize.id] || 0) + 1
      }));

      setPrize(wonPrize);

      // --- 旋转角度计算 ---
      const prizeIndex = PRIZES_CONFIG.findIndex(p => p.id === wonPrize.id);
      const sectorDeg = 360 / PRIZES_CONFIG.length; 
      const halfSector = sectorDeg / 2;
      const targetDeg = 360 - (prizeIndex * sectorDeg + halfSector);
      
      // 指针随机偏移，避免每次都在中心
      const randomOffset = Math.floor(Math.random() * 30) - 15; 
      let delta = targetDeg - (rotation % 360);
      if (delta < 0) delta += 360;

      const nextRotation = rotation + (360 * 6) + delta + randomOffset;
      setRotation(nextRotation);

      setTimeout(() => {
        setSpinning(false);
        setShowResult(true);
      }, 4500);

    } catch (e) {
      showNotice('网络连接超时，请检查您的网络', 'error');
      setSpinning(false);
    }
  };

  // --- 中奖弹窗组件 ---
  const ResultModal = () => {
    if (!showResult || !prize) return null;

    // 如果中到的是 2026大奖 (ID 8)，展示特殊祝福语
    const isBlessing = prize.id === 8;

    return createPortal(
      <div className="result-overlay" onClick={() => setShowResult(false)}>
        <div className="result-modal" onClick={e => e.stopPropagation()}>
          
          {/* 使用你提供的丙午印章图片 */}
          <div className="seal-image-wrap">
            <img src="https://img.cgbgear.cn/wpage/btn/wrapper-btn/bingwu.png_.webp" alt="丙午印章" />
          </div>

          <div className="prize-display">
            <div className="congrats">{isBlessing ? '获得新春寄语' : '恭喜获得'}</div>
            <div className={`prize-name-ink ${isBlessing ? 'blessing-text' : ''}`}>
              {isBlessing ? "万事大吉，龙马精神" : prize.name}
            </div>
          </div>
          <div className="close-tip">点击任意处关闭</div>
        </div>
        <style jsx>{`
          .result-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.85);
            z-index: 100000;
            display: flex; justify-content: center; align-items: center;
            backdrop-filter: blur(6px);
            animation: fadeIn 0.4s ease-out;
          }
          .result-modal {
            text-align: center;
            max-width: 80%;
          }
          .seal-image-wrap {
            width: 140px; height: 140px;
            margin: 0 auto 10px;
            animation: stampIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            filter: drop-shadow(0 0 15px rgba(209, 21, 21, 0.5));
          }
          .seal-image-wrap img { width: 100%; height: 100%; object-fit: contain; }
          
          @keyframes stampIn {
            0% { opacity: 0; transform: scale(3) rotate(15deg); }
            100% { opacity: 1; transform: scale(1) rotate(0deg); }
          }

          .prize-name-ink {
            color: #ffd700; font-size: 38px; font-weight: bold;
            text-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
            margin-top: 10px;
            animation: inkShow 1s ease-out forwards;
          }
          .blessing-text { font-size: 28px; color: #ff4d4d; }
          
          @keyframes inkShow {
            from { opacity: 0; letter-spacing: 10px; filter: blur(10px); }
            to { opacity: 1; letter-spacing: 2px; filter: blur(0px); }
          }
          .congrats { color: #fff; font-size: 18px; opacity: 0.8; letter-spacing: 4px; }
          .close-tip { margin-top: 50px; color: #888; font-size: 12px; cursor: pointer; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
      </div>,
      document.body
    );
  };

  return (
    <div className={`wheel-container ${entranceFinished ? 'entered' : ''} ${isWuHour ? 'wu-hour' : ''}`}>
      <ResultModal />

      <div className="bg-atmosphere">
        <div className="lantern lantern-left">福</div>
        <div className="lantern lantern-right">春</div>
        {isWuHour && <div className="sun-filter"></div>}
      </div>

      <div className="wheel-wrapper">
        <div 
          className="wheel-body"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4.5s cubic-bezier(0.15, 0, 0.15, 1)' : 'none' 
          }}
        >
          {PRIZES_CONFIG.map((p, i) => (
             <div 
               key={p.id} 
               className="wheel-sector"
               style={{ 
                 transform: `rotate(${i * 45}deg) skewY(-45deg)`,
                 backgroundColor: i % 2 === 0 ? '#b20a0a' : '#900'
               }}
             >
                <div className="sector-content" style={{ transform: 'skewY(45deg) rotate(22.5deg)' }}>
                   <span className="prize-text">{p.text}</span>
                   {/* 如果该奖品被抽中过，颜色变淡示意权重降低（视觉模拟） */}
                   <div className={`horse-watermark ${winHistory[p.id] ? 'won' : ''}`}></div> 
                </div>
             </div>
          ))}
          <div className="wheel-center-deco"><div className="center-text">马</div></div>
        </div>

        <div className={`pointer-horse ${spinning ? 'breathing' : ''}`}>
           <svg viewBox="0 0 100 100" className="horse-head-svg">
             <path d="M20,80 Q10,70 10,50 Q10,20 40,10 Q60,5 80,20 Q90,30 80,50 L50,100 Z" fill="#ffd700" stroke="#b8860b" strokeWidth="2"/>
             <circle cx="45" cy="35" r="4" fill="#ff0000" className="horse-eye" />
           </svg>
        </div>

        <button className="spin-btn" onClick={handleSpin} disabled={spinning}>
           {spinning ? '进行中' : '开启'}
           <div className="btn-sub">66 CGB</div>
        </button>
      </div>

      <style jsx>{`
        .wheel-container {
          position: relative; width: 100%; height: 420px;
          overflow: hidden; background: #1a0505;
          display: flex; justify-content: center; align-items: center;
          margin-bottom: 20px; border-radius: 12px;
        }
        .wheel-wrapper {
          position: relative; width: 280px; height: 280px;
          opacity: 0; transform: translateY(20px);
          transition: all 1s ease-out;
        }
        .entered .wheel-wrapper { opacity: 1; transform: translateY(0); }

        .wheel-body {
          width: 100%; height: 100%; border-radius: 50%;
          border: 6px solid #ffd700; position: relative; overflow: hidden;
          box-shadow: 0 0 30px rgba(0,0,0,0.5);
        }
        .wheel-sector {
          position: absolute; top: 0; right: 0; width: 50%; height: 50%;
          transform-origin: 0% 100%; border: 1px solid rgba(255,215,0,0.1);
        }
        .sector-content {
          position: absolute; left: -100%; width: 200%; height: 200%;
          text-align: center; padding-top: 18px; color: #ffd700;
          font-weight: bold; font-size: 13px;
        }
        .horse-watermark {
           position: absolute; top: 40px; left: 50%; transform: translateX(-50%);
           width: 20px; height: 20px; opacity: 0.2;
           background: #ffd700;
           mask-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><path d='M20,80 Q50,20 80,80' stroke='black' fill='none' stroke-width='15'/></svg>");
        }
        .horse-watermark.won { opacity: 0.05; filter: grayscale(1); }

        .wheel-center-deco {
           position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
           width: 50px; height: 50px; background: radial-gradient(circle, #ffd700, #b8860b);
           border-radius: 50%; z-index: 10; display: flex; justify-content: center; align-items: center;
           font-size: 20px; color: #5e0000; font-weight: bold;
        }

        .pointer-horse {
          position: absolute; top: -30px; left: 50%; transform: translateX(-50%);
          width: 32px; height: 55px; z-index: 20; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.8));
        }

        .spin-btn {
          position: absolute; bottom: -60px; left: 50%; transform: translateX(-50%);
          background: linear-gradient(180deg, #ffd700, #ffaa00);
          border: none; padding: 10px 30px; border-radius: 25px;
          color: #8b0000; font-weight: 900; font-size: 16px;
          cursor: pointer; box-shadow: 0 4px 0 #b8860b; transition: 0.1s;
        }
        .spin-btn:active:not(:disabled) { transform: translateX(-50%) translateY(3px); box-shadow: 0 1px 0 #b8860b; }
        .spin-btn:disabled { filter: grayscale(0.8); cursor: not-allowed; }
        .btn-sub { font-size: 10px; font-weight: normal; margin-top: 2px; }

        .lantern {
          position: absolute; top: 15px; background: #d11515; color: #ffd700;
          width: 28px; height: 38px; display: flex; justify-content: center; align-items: center;
          border-radius: 5px; font-weight: bold; border: 1px solid #ffd700;
          animation: swing 3s ease-in-out infinite alternate;
        }
        .lantern-left { left: 20px; }
        .lantern-right { right: 20px; animation-delay: 1.5s; }
        @keyframes swing { from { transform: rotate(-8deg); } to { transform: rotate(8deg); } }
        
        .wu-hour { box-shadow: inset 0 0 100px rgba(255,165,0,0.2); }
      `}</style>
    </div>
  );
};

export default LuckyWheel;
