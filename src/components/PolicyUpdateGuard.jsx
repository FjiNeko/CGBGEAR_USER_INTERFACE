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

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // 引入 useNavigate
import { useAuth } from '../context/AuthContext';

const POLICY_VERSION = "20260217"; 

const PolicyUpdateGuard = () => {
  // 1. 从 useAuth 获取 user 和封装好的 logout 方法
  const { user: currentUser, loading, logout } = useAuth(); 
  const location = useLocation();
  const navigate = useNavigate();

  const [isVisible, setIsVisible] = useState(false);
  const [isDisagreeing, setIsDisagreeing] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // 2. 判断是否显示弹窗
  useEffect(() => {
    if (loading) return;

    const isPolicyPage = location.pathname.startsWith('/policies/');
    if (isPolicyPage) {
      setIsVisible(false);
      return;
    }

    const acceptedVersion = localStorage.getItem("cgb_policy_accepted_version");
    const isLogin = currentUser && currentUser.is_logged_in;

    if (isLogin && acceptedVersion !== POLICY_VERSION) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [currentUser, loading, location.pathname]);

  // 3. 倒计时逻辑
  useEffect(() => {
    let timer = null;
    if (isDisagreeing && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (isDisagreeing && countdown === 0) {
      handleFinalLogout();
    }
    return () => clearInterval(timer);
  }, [isDisagreeing, countdown]);

  const handleAgree = () => {
    localStorage.setItem("cgb_policy_accepted_version", POLICY_VERSION);
    setIsVisible(false);
    setIsDisagreeing(false);
  };

  // 4. 使用你提供的 logout 方法执行退出
  const handleFinalLogout = async () => {
    try {
      await logout(); // 执行 AuthContext 里的退出逻辑（含 API 请求）
      navigate("/");  // 跳转回首页
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/"; // 兜底方案：强制刷新跳转
    }
  };

  if (!isVisible) return null;

  return (
    <div className="policy-guard-overlay" style={{ zIndex: 99999 }}>
      {!isDisagreeing ? (
        <div className="policy-guard-card">
          <div className="policy-guard-title">政策更新确认</div>
          <div className="policy-guard-content">
            <p>为了保障您的账号安全及合法权益，CGBGEAR 对以下政策进行了修订，请您务必仔细阅读：</p>
            
            <ul className="policy-link-list">
              <li><a href="/policies/terms" target="_blank">《用户协议》</a></li>
              <li><a href="/policies/privacy" target="_blank">《隐私政策》</a></li>
              <li><a href="/policies/community" target="_blank">《社区管理规范》</a></li>
              <li><a href="/policies/disclaimer" target="_blank">《免责声明》</a></li>
              <li><a href="/policies/ip" target="_blank">《知识产权声明》</a></li>
              <li><a href="/policies/children-privacy" target="_blank">《儿童隐私政策》</a></li>
              <li><a href="/policies/cookies" target="_blank">《Cookie 政策》</a></li>
            </ul>

            <p className="policy-hint">点击链接可查看详细内容。继续使用本平台服务即视为您已充分理解并同意上述协议的全部内容。</p>
          </div>
          <div className="policy-guard-footer">
            <button className="guard-btn-agree" onClick={handleAgree}>同意并继续使用</button>
            <button className="guard-btn-disagree" onClick={() => setIsDisagreeing(true)}>不同意</button>
          </div>
        </div>
      ) : (
        <div className="policy-guard-card warning">
          <div className="policy-guard-title" style={{color: '#ff3e3e'}}>拒绝确认</div>
          <div className="policy-guard-content">
            <div className="logout-warning-text">您已拒绝同意相关法律政策。</div>
            <p>很抱歉，若您不同意《隐私政策》及相关协议，我们将无法继续为您提供会员服务。</p>
            <div className="countdown-number">{countdown}s</div>
            <p style={{fontSize: '13px', color: '#666', marginTop: '10px'}}>
              您的账号将在倒计时结束后自动安全退出。<br />
              如有疑问请联系：<a href="mailto:policy-legal@cgbgear.cn" style={{color: '#007bff'}}>policy-legal@cgbgear.cn</a>
            </p>
          </div>
          <div className="policy-guard-footer">
            <button 
              className="guard-btn-agree" 
              onClick={() => setIsDisagreeing(false)}
              style={{background: '#333', color: '#fff'}}
            >
              返回并同意
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyUpdateGuard;
