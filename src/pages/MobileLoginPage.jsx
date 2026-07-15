import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../css/main.css"; 

import { 
  loginUser, 
  registerUser, 
  getCurrentUser, 
  generateCaptcha,
  requestPasswordReset,
  resetPasswordWithToken,
} from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useNotice } from "../context/NoticeContext";

export default function MobileLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showNotice } = useNotice();

  // 模仿TerminalLoginPage.jsx 修复手机端（MobileLoginPage.jsx)的 忘记密码无法使用。

  // --- 状态管理 ---
  const [isLoginView, setIsLoginView] = useState(true);
  // 忘记/重置密码流程控制：'login' | 'forgot' | 'reset'
  const [flow, setFlow] = useState('login');
  const [agreed, setAgreed] = useState(false);

  // 表单字段
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [subscribe, setSubscribe] = useState(false);

  // 验证码状态
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaId, setCaptchaId] = useState(null);
  const [captchaImageSrc, setCaptchaImageSrc] = useState("");
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);
  
  // 提交状态
  const [submitting, setSubmitting] = useState(false);

  // --- 辅助方法：获取验证码 ---
  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const res = await generateCaptcha();
      if (res.data && res.data.captcha_image_src && res.data.captcha_id) {
        setCaptchaImageSrc(res.data.captcha_image_src);
        setCaptchaId(res.data.captcha_id);
        setCaptchaValue(""); // 刷新时清空输入框
      } else {
        const msg = res.msg || "获取验证码失败";
        showNotice(msg, "error");
      }
    } catch (err) {
      console.error("Captcha load failed", err);
      showNotice("获取验证码失败，请检查网络", "error");
    } finally {
      setCaptchaLoading(false);
    }
  };

  // --- 核心修复 1: 移除监听 password 的自动刷新 ---
  // --- 新增: 仅在切换到登录视图且没有验证码时，加载一次 ---
  useEffect(() => {
    if (isLoginView) {
      setShowCaptcha(true);
      // 如果当前没有验证码图片，加载一张
      if (!captchaId) {
        fetchCaptcha();
      }
    } else {
      setShowCaptcha(false);
    }
  }, [isLoginView]); // 只依赖视图切换，不依赖密码输入

  // 解析 URL 上的 forgot/reset 流程
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('reset_token');
    if (token) {
      setFlow('reset');
      setIsLoginView(true);
      setResetToken(token);
    } else if (params.get('forgot') === '1') {
      setFlow('forgot');
      setIsLoginView(true);
    } else {
      setFlow('login');
    }
  }, [location.search]);

  // --- 登录逻辑 ---
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // 基础校验
    if (!email || !password) return showNotice("请完整填写邮箱和密码", "warning");
    if (!agreed) return showNotice("请先同意用户协议", "warning");
    if (showCaptcha && !captchaValue) return showNotice("请输入验证码", "warning");

    setSubmitting(true);
    try {
      const res = await loginUser({
        email,
        password,
        captcha_id: captchaId,
        captcha_value: captchaValue,
      });

      // 如果后端返回 200，且没有抛出异常
      if (res.code === 200) {
        showNotice("登录成功", "success");
        const userData = await getCurrentUser();
        login(userData);
        navigate("/");
      } else {
        // 虽然通常 400/401 会进 catch，但为了保险处理 code != 200 的情况
        showNotice(res.msg || "登录失败", "error");
        fetchCaptcha(); // 失败必须刷新验证码
      }
    } catch (err) {
      // --- 核心修复 2: 提取后端返回的具体错误信息 ---
      // 兼容 axios 的 err.response.data 和普通对象的 err.msg
      let errorMsg = "登录请求失败";
      
      if (err.response && err.response.data && err.response.data.msg) {
        errorMsg = err.response.data.msg; // 获取 "验证码已使用" 或 "账号或密码错误"
      } else if (err.msg) {
        errorMsg = err.msg;
      } else if (err.message) {
        errorMsg = err.message;
      }

      showNotice(errorMsg, "error");
      
      // 因为后端逻辑是：无论验证码错误还是密码错误，验证码都会被标记为 used
      // 所以只要报错，就强制刷新验证码
      fetchCaptcha(); 
    } finally {
      setSubmitting(false);
    }
  };

  // --- 注册逻辑 ---
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!agreed) return showNotice("请先同意用户协议", "warning");
    if (password !== passwordConfirm) return showNotice("两次密码不一致", "warning");
    
    setSubmitting(true);
    try {
      const res = await registerUser({
        email,
        password,
        confirm_password: passwordConfirm,
        first_name: firstName,
        last_name: lastName,
        company: company,
        is_subscribed: subscribe,
      });
      if (res.code === 200) {
        showNotice("注册成功！请登录", "success");
        setIsLoginView(true);
        // 自动填入注册的邮箱
        setPassword("");
        setPasswordConfirm("");
      } else {
        showNotice(res.msg || "注册失败", "error");
      }
    } catch (err) {
      // 同样的错误提取逻辑
      let errorMsg = "注册请求失败";
      if (err.response && err.response.data && err.response.data.msg) {
        errorMsg = err.response.data.msg;
      } else if (err.msg) {
        errorMsg = err.msg;
      }
      showNotice(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ========== 忘记密码 / 重置密码 ==========
  // forgot 表单状态
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotCaptchaId, setForgotCaptchaId] = useState(null);
  const [forgotCaptchaImageSrc, setForgotCaptchaImageSrc] = useState("");
  const [forgotCaptchaValue, setForgotCaptchaValue] = useState("");
  const [forgotCaptchaLoading, setForgotCaptchaLoading] = useState(false);
  const [forgotErrors, setForgotErrors] = useState({});

  // reset 表单状态
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetErrors, setResetErrors] = useState({});

  // 获取“忘记密码”流程验证码
  const fetchForgotCaptcha = async () => {
    setForgotCaptchaLoading(true);
    try {
      const res = await generateCaptcha();
      if (res.data && res.data.captcha_image_src && res.data.captcha_id) {
        setForgotCaptchaImageSrc(res.data.captcha_image_src);
        setForgotCaptchaId(res.data.captcha_id);
        setForgotCaptchaValue("");
        setForgotErrors((p) => ({ ...p, captcha: undefined }));
      } else {
        const msg = res.msg || "获取验证码失败";
        setForgotErrors((p) => ({ ...p, captcha: msg }));
        showNotice(msg, "error");
      }
    } catch (e) {
      const msg = "获取验证码失败，请检查网络";
      setForgotErrors((p) => ({ ...p, captcha: msg }));
      showNotice(msg, "error");
    } finally {
      setForgotCaptchaLoading(false);
    }
  };

  // 提交“忘记密码”申请
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!forgotEmail || !forgotEmail.includes('@')) errors.email = '请输入有效邮箱地址';
    if (!forgotCaptchaId) errors.captcha = '请先获取验证码';
    if (!forgotCaptchaValue) errors.captcha = '请输入验证码';
    setForgotErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setForgotSubmitting(true);
    try {
      const resp = await requestPasswordReset({
        email: forgotEmail,
        captcha_id: forgotCaptchaId,
        captcha_value: forgotCaptchaValue,
      });
      if (resp.code === 200) {
        showNotice('重置邮件已发送，请检查邮箱（可能在垃圾箱）', 'success');
        // 清理URL中的 forgot 参数
        const params = new URLSearchParams(location.search);
        params.delete('forgot');
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
        setFlow('login');
      } else {
        const msg = resp.msg || '发送失败，请稍后再试';
        setForgotErrors((p) => ({ ...p, api: msg }));
        showNotice(msg, 'error');
        fetchForgotCaptcha();
      }
    } catch (err) {
      const msg = err.message || '请求失败，请稍后重试';
      setForgotErrors((p) => ({ ...p, api: msg }));
      showNotice(msg, 'error');
      fetchForgotCaptcha();
    } finally {
      setForgotSubmitting(false);
    }
  };

  // 提交“重置密码”
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!newPassword || newPassword.length < 6) errors.password = '请填写不少于6位的新密码';
    if (newPassword !== newPassword2) errors.password2 = '两次输入不一致';
    setResetErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setResetSubmitting(true);
    try {
      const resp = await resetPasswordWithToken({
        reset_token: resetToken,
        new_password: newPassword,
        confirm_password: newPassword2,
      });
      if (resp.code === 200) {
        showNotice('密码已重置，请使用新密码登录', 'success');
        // 清掉 URL 的 token
        const params = new URLSearchParams(location.search);
        params.delete('reset_token');
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
        setFlow('login');
      } else {
        const msg = resp.msg || '重置失败，请稍后再试';
        setResetErrors((p) => ({ ...p, api: msg }));
        showNotice(msg, 'error');
      }
    } catch (err) {
      const msg = err.message || '请求失败，请稍后重试';
      setResetErrors((p) => ({ ...p, api: msg }));
      showNotice(msg, 'error');
    } finally {
      setResetSubmitting(false);
    }
  };

  // 在点击“忘记密码？”时，切换到 forgot 流程并准备验证码
  const goForgot = () => {
    const params = new URLSearchParams(location.search);
    params.set('forgot', '1');
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    setFlow('forgot');
    // 准备验证码
    setForgotCaptchaId(null);
    setForgotCaptchaValue('');
    fetchForgotCaptcha();
  };

  return (
    <div className="terminal-login-page mobile-login-wrapper">
      {/* 顶部切换：严禁添加提示框 */}
      <div className="mobile-toggle-header">
        <span 
          onClick={() => {
            setIsLoginView(!isLoginView);
            // 切换时清空旧状态
            setCaptchaId(null); 
            setCaptchaValue("");
            // 错误提示清理等逻辑由 Context 控制，这里只需切换视图
          }}
          style={{ cursor: "pointer" }}
        >
          {isLoginView ? "注册" : "登录"}
        </span>
      </div>

      <div className="mobile-auth-container">
        <h1 className="mobile-main-title">
          {flow === 'forgot' ? '找回密码' : flow === 'reset' ? '重置密码' : (isLoginView ? '账号密码登录' : '创建新账号')}
        </h1>

        {/* 登录 / 注册表单 */}
        {flow === 'login' && (
        <form className="auth-form" onSubmit={isLoginView ? handleLogin : handleRegister}>
          
          {/* 邮箱 */}
          <div className="auth-field">
            <label className="auth-label">邮箱地址</label>
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              required
            />
          </div>

          {/* 注册特有字段 */}
          {!isLoginView && (
            <div style={{ display: "flex", gap: "20px" }}>
              <div className="auth-field" style={{ flex: 1 }}>
                <label className="auth-label">姓</label>
                <input
                  type="text"
                  className="auth-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                />
              </div>
              <div className="auth-field" style={{ flex: 1 }}>
                <label className="auth-label">名</label>
                <input
                  type="text"
                  className="auth-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                />
              </div>
            </div>
          )}

          {/* 密码 */}
          <div className="auth-field">
            <label className="auth-label">密码</label>
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>

          {/* 注册特有：确认密码 */}
          {!isLoginView && (
            <>
              <div className="auth-field">
                <label className="auth-label">确认密码</label>
                <input
                  type="password"
                  className="auth-input"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="再次确认密码"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">公司/队伍 (选填)</label>
                <input
                  type="text"
                  className="auth-input"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="输入公司或队伍名称"
                />
              </div>
            </>
          )}

          {/* 登录特有：验证码 */}
          {isLoginView && showCaptcha && (
            <div className="auth-field">
              <label className="auth-label">验证码</label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="text"
                  className="auth-input"
                  style={{ flex: 1 }}
                  value={captchaValue}
                  onChange={(e) => setCaptchaValue(e.target.value.toUpperCase())}
                  placeholder="输入字符"
                />
                {/* 点击图片刷新 */}
                <div 
                  className="mobile-captcha-box" 
                  onClick={fetchCaptcha} 
                  style={{ cursor: 'pointer' }}
                >
                  {captchaLoading ? (
                    <span style={{ fontSize: '11px', color: '#888' }}>加载中...</span>
                  ) : captchaImageSrc ? (
                    <img src={captchaImageSrc} alt="captcha" />
                  ) : (
                    <span style={{ fontSize: '11px', color: '#888' }}>暂无</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 注册订阅 */}
          {!isLoginView && (
            <label className="auth-checkbox-row">
              <input
                type="checkbox"
                checked={subscribe}
                onChange={(e) => setSubscribe(e.target.checked)}
              />
              <span className="auth-hint">订阅 CGBGEAR 活动资讯与福利</span>
            </label>
          )}

          {/* 协议勾选 (修复跳转链接) */}
          <label className="auth-checkbox-row" style={{ marginTop: "20px" }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="auth-hint">
              登录或注册即同意 
              <Link to="/policies/terms" style={{ color: "#6af500", textDecoration: 'none', margin: '0 4px' }}>用户协议</Link> 
              和 
              <Link to="/policies/privacy" style={{ color: "#6af500", textDecoration: 'none', margin: '0 4px' }}>隐私政策</Link>
            </span>
          </label>

          {/* 提交按钮 */}
          <button type="submit" className="auth-btn primary" disabled={submitting} style={{ marginTop: "30px" }}>
            {submitting ? "提交中..." : isLoginView ? "登 录" : "注 册"}
          </button>

          {/* 底部链接：移除手机验证，右对齐忘记密码 */}
          <div className="mobile-footer-links">
            {isLoginView && (
              <>
                <div></div> 
                <a onClick={goForgot} style={{ color: "rgba(255,255,255,0.7)", cursor: 'pointer' }}>忘记密码？</a>
              </>
            )}
          </div>
        </form>
        )}

        {/* 忘记密码表单 */}
        {flow === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="auth-form">
            <div className={`auth-field ${forgotErrors.email ? 'has-error' : ''}`}>
              <label className="auth-label">注册邮箱</label>
              <input
                type="email"
                className="auth-input"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="请输入注册邮箱"
                required
              />
              {forgotErrors.email && <div className="auth-error-box">{forgotErrors.email}</div>}
            </div>

            <div className={`auth-field ${forgotErrors.captcha ? 'has-error' : ''}`}>
              <label className="auth-label">验证码</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  className="auth-input"
                  style={{ flex: 1 }}
                  value={forgotCaptchaValue}
                  onChange={(e) => setForgotCaptchaValue(e.target.value.toUpperCase())}
                  placeholder="输入字符"
                />
                <div className="mobile-captcha-box" onClick={fetchForgotCaptcha} style={{ cursor: 'pointer' }}>
                  {forgotCaptchaLoading ? (
                    <span style={{ fontSize: '11px', color: '#888' }}>加载中...</span>
                  ) : forgotCaptchaImageSrc ? (
                    <img src={forgotCaptchaImageSrc} alt="captcha" />
                  ) : (
                    <span style={{ fontSize: '11px', color: '#888' }}>点击获取</span>
                  )}
                </div>
              </div>
              {forgotErrors.captcha && <div className="auth-error-box">{forgotErrors.captcha}</div>}
            </div>

            {forgotErrors.api && <div className="auth-error-box api-error">{forgotErrors.api}</div>}

            <button type="submit" className="auth-btn primary" disabled={forgotSubmitting}>
              {forgotSubmitting ? '正在发送…' : '发送重置邮件'}
            </button>
          </form>
        )}

        {/* 重置密码表单 */}
        {flow === 'reset' && (
          <form onSubmit={handleResetSubmit} className="auth-form">
            <div className={`auth-field ${resetErrors.password ? 'has-error' : ''}`}>
              <label className="auth-label">新密码</label>
              <input
                type="password"
                className="auth-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码"
                required
              />
              {resetErrors.password && <div className="auth-error-box">{resetErrors.password}</div>}
            </div>
            <div className={`auth-field ${resetErrors.password2 ? 'has-error' : ''}`}>
              <label className="auth-label">确认新密码</label>
              <input
                type="password"
                className="auth-input"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                placeholder="再次输入新密码"
                required
              />
              {resetErrors.password2 && <div className="auth-error-box">{resetErrors.password2}</div>}
            </div>

            {resetErrors.api && <div className="auth-error-box api-error">{resetErrors.api}</div>}

            <button type="submit" className="auth-btn primary" disabled={resetSubmitting}>
              {resetSubmitting ? '正在提交…' : '确认重置'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
