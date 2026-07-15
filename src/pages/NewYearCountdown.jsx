import React, { useState, useEffect, useRef } from 'react';
import './NewYearCountdown.css'; // 样式见下文

const NewYearCountdown = ({ user }) => {
    const [timeLeft, setTimeLeft] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isLastTen, setIsLastTen] = useState(false);
    const [isMidnight, setIsMidnight] = useState(false);
    const [redEnvelopes, setRedEnvelopes] = useState([]);
    const hasClaimed = useRef(false);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const target = new Date();
            // 设置目标时间为跨年 00:00:00
            if (now.getHours() >= 23) {
                target.setDate(now.getDate() + 1);
            }
            target.setHours(0, 0, 0, 0);

            const diff = target - now;

            // 逻辑控制：23:30 (11:30 PM) 开始显示
            if (now.getHours() === 23 && now.getMinutes() >= 30) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }

            // 最后10秒特效触发
            if (diff > 0 && diff <= 10000) {
                setIsLastTen(true);
            }

            // 到达零点
            if (diff <= 0) {
                if (!isMidnight) {
                    setIsMidnight(true);
                    triggerRedEnvelopeRain();
                    claimGift(); // 触发后端发放积分
                }
                setTimeLeft(0);
                clearInterval(timer);
            } else {
                setTimeLeft(diff);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isMidnight]);

    // 发放红包奖励接口调用
    const claimGift = async () => {
        if (hasClaimed.current) return;
        hasClaimed.current = true;
        try {
            await fetch('/api/claim_new_year_gift', { method: 'POST' });
            console.log("新年红包已到账！");
        } catch (e) {
            console.error("奖励领取失败", e);
        }
    };

    // 红包雨特效
    const triggerRedEnvelopeRain = () => {
        const envelopes = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + '%',
            delay: Math.random() * 5 + 's',
            duration: 2 + Math.random() * 3 + 's'
        }));
        setRedEnvelopes(envelopes);
    };

    if (!isVisible && !isMidnight) return null;

    const formatTime = (ms) => {
        const totalSec = Math.floor(ms / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className={`new-year-overlay ${isLastTen ? 'intense-mode' : ''} ${isMidnight ? 'midnight-active' : ''}`}>
            {/* 跨年祝福语层 */}
            {isMidnight && (
                <div className="blessing-container">
                    <h1 className="midnight-text">龙行马跃 祝您新年快乐！</h1>
                    <p className="sub-text">8888 CGB 跨年礼包已存入账户</p>
                </div>
            )}

            {/* 倒计时主区域 */}
            {!isMidnight && (
                <div className="countdown-box">
                    <div className="title">距离马年跨年还有</div>
                    <div className={`timer-display ${isLastTen ? 'shake-anim' : ''}`}>
                        {formatTime(timeLeft)}
                    </div>
                    {/* 策马奔腾 AI 特效预留位 */}
                    {isLastTen && (
                        <div className="horse-gallop-container">
                             {/* 此处插入你生成的 AI 策马奔腾透明视频或 GIF */}
                             <div className="horse-placeholder">🐎 骏马奔腾中...</div>
                        </div>
                    )}
                </div>
            )}

            {/* 红包雨 DOM 节点 */}
            {isMidnight && redEnvelopes.map(env => (
                <div key={env.id} className="red-envelope" 
                     style={{ left: env.left, animationDelay: env.delay, animationDuration: env.duration }}>
                    🧧
                </div>
            ))}
        </div>
    );
};

export default NewYearCountdown;
