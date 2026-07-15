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

import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/main.css";
import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";

import { loginUser, registerUser, getCurrentUser, generateCaptcha, requestPasswordReset, resetPasswordWithToken } from "../api/api";
import { buildSearchId } from "../utils/auth";
import { useAuth } from "../context/AuthContext";
import { useNotice } from "../context/NoticeContext" // <--- 1. 引入 Notice Hook
import { Color } from "@tiptap/extension-text-style";

export default function TerminalLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotice } = useNotice(); // <--- 2. 获取 showNotice 方法

  // 左侧登录状态
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaId, setCaptchaId] = useState(null);
  const [captchaImageSrc, setCaptchaImageSrc] = useState("");
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // 右侧注册状态
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regCompany, setRegCompany] = useState("");
  const [regSubscribe, setRegSubscribe] = useState(false);
  const [regErrors, setRegErrors] = useState({});
  const [regSubmitting, setRegSubmitting] = useState(false);

  // 先分析写的app.py的路由，在分析当前JSX页面内的忘记密码，如何修复，SMTP服务器用的是ZOHO企业邮箱。

  // 忘记密码/重置密码 流程
  const [flow, setFlow] = useState('login'); // 'login' | 'forgot' | 'reset'
  // forgot 表单状态
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCaptchaId, setForgotCaptchaId] = useState(null);
  const [forgotCaptchaImageSrc, setForgotCaptchaImageSrc] = useState("");
  const [forgotCaptchaValue, setForgotCaptchaValue] = useState("");
  const [forgotCaptchaLoading, setForgotCaptchaLoading] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotErrors, setForgotErrors] = useState({});

  // reset 表单状态
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetErrors, setResetErrors] = useState({});

  // 初始化 URL 参数
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let changed = false;

    if (!params.get("id")) {
      params.set("id", typeof buildSearchId === 'function' ? buildSearchId() : Date.now().toString());
      changed = true;
    }
    if (!params.get("view")) {
      params.set("view", "pc");
      changed = true;
    }
    if (!params.get("broswer")) {
      params.set("broswer", "chrome");
      changed = true;
    }

    if (changed) {
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }

    // 流程判定：重置优先，其次忘记密码
    const token = params.get('reset_token');
    if (token) {
      setFlow('reset');
      setResetToken(token);
    } else if (params.get('forgot') === '1') {
      setFlow('forgot');
    } else {
      setFlow('login');
    }
  }, [location.pathname, location.search, navigate]);

  // 获取验证码
  const fetchCaptcha = async (clearPreviousErrors = true) => {
    setCaptchaLoading(true);
    if (clearPreviousErrors) {
      setLoginErrors((prev) => ({ ...prev, captcha: undefined, api: undefined }));
    }

    try {
      const responseData = await generateCaptcha();
      // console.log("验证码API返回的原始数据:", responseData); 

      if (responseData.data && responseData.data.captcha_image_src && responseData.data.captcha_id) {
        setCaptchaImageSrc(responseData.data.captcha_image_src);
        setCaptchaId(responseData.data.captcha_id);

        setCaptchaValue('');
        setLoginErrors((prev) => ({ ...prev, captcha: undefined }));
      } else {
        const errorMessage = responseData.msg || '获取验证码失败，数据格式错误';
        setLoginErrors((prev) => ({ ...prev, captcha: errorMessage }));
        showNotice(errorMessage, 'error'); // <--- 添加错误提示
      }
    } catch (error) {
      console.error("Failed to fetch captcha:", error);
      const msg = '获取验证码失败，请检查网络';
      setLoginErrors((prev) => ({ ...prev, captcha: msg }));
      showNotice(msg, 'error'); // <--- 添加错误提示
    } finally {
      setCaptchaLoading(false);
    }
  };

  // 获取“忘记密码”流程验证码
  const fetchForgotCaptcha = async () => {
    setForgotCaptchaLoading(true);
    setForgotErrors((prev) => ({ ...prev, captcha: undefined, api: undefined }));
    try {
      const responseData = await generateCaptcha();
      if (responseData.data && responseData.data.captcha_image_src && responseData.data.captcha_id) {
        setForgotCaptchaId(responseData.data.captcha_id);
        setForgotCaptchaImageSrc(responseData.data.captcha_image_src);
        setForgotCaptchaValue('');
      } else {
        const msg = responseData.msg || '获取验证码失败，数据格式错误';
        setForgotErrors((prev) => ({ ...prev, captcha: msg }));
        showNotice(msg, 'error');
      }
    } catch (e) {
      const msg = '获取验证码失败，请检查网络';
      setForgotErrors((prev) => ({ ...prev, captcha: msg }));
      showNotice(msg, 'error');
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
      // resp 结构: { code, msg, data? }
      const ok = resp.code === 200;
      const infoMsg = (resp.data && resp.data.message) || resp.msg || '请求已受理';
      showNotice(infoMsg, ok ? 'success' : 'warning');

      // 开发环境可能返回 debug_reset_token
      if (resp.data && resp.data.debug_reset_token) {
        console.debug('调试用 reset_token:', resp.data.debug_reset_token);
      }
    } catch (err) {
      const msg = err.message || '请求失败，请稍后再试';
      setForgotErrors((prev) => ({ ...prev, api: msg }));
      showNotice(msg, 'error');
    } finally {
      setForgotSubmitting(false);
      setForgotCaptchaValue('');
      // 刷新验证码
      fetchForgotCaptcha();
    }
  };

  // 提交“重置密码”
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!newPassword) errors.password = '请输入新密码';
    if (newPassword !== newPassword2) errors.password2 = '两次输入的密码不一致';
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
        showNotice('密码重置成功，请使用新密码登录', 'success');
        // 清理 URL 上的 token
        const params = new URLSearchParams(location.search);
        params.delete('reset_token');
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
        setFlow('login');
        setNewPassword('');
        setNewPassword2('');
      } else {
        const msg = resp.msg || '重置失败，请稍后再试';
        setResetErrors((prev) => ({ ...prev, api: msg }));
        showNotice(msg, 'error');
      }
    } catch (err) {
      const msg = err.message || '网络异常，重置失败';
      setResetErrors((prev) => ({ ...prev, api: msg }));
      showNotice(msg, 'error');
    } finally {
      setResetSubmitting(false);
    }
  };

  const goForgot = () => {
    const params = new URLSearchParams(location.search);
    params.set('forgot', '1');
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    setFlow('forgot');
    // 准备验证码
    fetchForgotCaptcha();
  };

  const goLogin = () => {
    const params = new URLSearchParams(location.search);
    params.delete('forgot');
    params.delete('reset_token');
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    setFlow('login');
  };

  // 当密码输入框有内容时，显示验证码
  useEffect(() => {
    if (loginPassword.length > 0 && !showCaptcha) {
      setShowCaptcha(true);
      fetchCaptcha();
    } else if (loginPassword.length === 0 && showCaptcha) {
      setShowCaptcha(false);
      setCaptchaId(null);
      setCaptchaImageSrc("");
      setCaptchaValue("");
      setLoginErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.captcha;
        delete newErrors.api;
        return newErrors;
      });
    }
  }, [loginPassword, showCaptcha]); // 移除 fetchCaptcha 依赖以避免死循环风险，或者使用 useCallback 包裹 fetchCaptcha


  // 登录逻辑
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!loginEmail || !loginEmail.includes("@")) {
      errors.email = "请输入有效邮箱地址";
    }
    if (!loginPassword) {
      errors.password = "请输入密码";
    }
    if (showCaptcha) {
      if (!captchaValue) {
        errors.captcha = "请输入验证码";
      }
      if (!captchaId) {
        errors.captcha = "验证码已失效，请点击刷新";
      }
    }
    setLoginErrors(errors);

    if (Object.keys(errors).length > 0) {
      showNotice("请检查登录表单中的错误项", 'warning'); // <--- 添加表单验证提示
      return;
    }

    setLoginSubmitting(true);
    try {
      const response = await loginUser({
        email: loginEmail,
        password: loginPassword,
        captcha_id: captchaId,
        captcha_value: captchaValue,
      });

      if (response.code === 200) {
        // 登录成功
        showNotice("登录成功，正在跳转...", 'success'); // <--- 成功提示
        const userData = await getCurrentUser();
        if (userData && userData.is_logged_in) {
          login(userData);
          navigate("/", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        // 登录失败处理
        const errorMsg = response.msg || "登录失败，请检查您的输入";

        if (errorMsg.includes("验证码")) {
          setLoginErrors((prev) => ({ ...prev, captcha: errorMsg }));
        } else {
          setLoginErrors((prev) => ({ ...prev, api: errorMsg }));
        }
        showNotice(errorMsg, 'error'); // <--- 失败提示

        if (showCaptcha) {
          fetchCaptcha(false);
        }
      }
    } catch (err) {
      console.error("Login API call failed:", err);
      const apiErrorMsg = err.message.includes("429")
        ? "请求过于频繁，请稍后再试"
        : err.message || "网络异常，无法连接服务器";

      setLoginErrors((prev) => ({ ...prev, api: apiErrorMsg }));
      showNotice(apiErrorMsg, 'error'); // <--- 网络/系统错误提示

      if (showCaptcha) {
        fetchCaptcha(false);
      }
    } finally {
      setLoginSubmitting(false);
      if (showCaptcha) {
        setCaptchaValue('');
      }
    }
  };


  // 注册逻辑
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!regEmail || !regEmail.includes("@")) errors.email = "请输入有效邮箱地址";
    if (!regPassword) errors.password = "请输入密码";
    if (regPassword2 !== regPassword) errors.password2 = "两次输入的密码不一致";
    if (!regFirstName.trim()) errors.firstName = "名字为必填项";
    if (!regLastName.trim()) errors.lastName = "姓氏为必填项";

    setRegErrors(errors);
    if (Object.keys(errors).length > 0) {
      showNotice("请修正注册表单中的错误", 'warning'); // <--- 表单验证提示
      return;
    }

    setRegSubmitting(true);
    try {
      const response = await registerUser({
        email: regEmail,
        password: regPassword,
        confirm_password: regPassword2,
        first_name: regFirstName,
        last_name: regLastName,
        company: regCompany,
        is_subscribed: regSubscribe,
      });

      if (response.code === 200) {
        // alert("注册成功！请使用您的邮箱和密码登录。"); // <--- 删除旧 alert
        showNotice("注册成功！请使用您的邮箱和密码登录。", 'success'); // <--- 替换为 Notice

        setRegEmail(""); setRegPassword(""); setRegPassword2("");
        setRegFirstName(""); setRegLastName(""); setRegCompany("");
        setRegSubscribe(false); setRegErrors({});
        setLoginEmail(regEmail);
        setLoginPassword("");
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const msg = response.msg || "注册失败，请稍后再试";
        setRegErrors((prev) => ({ ...prev, api: msg }));
        showNotice(msg, 'error'); // <--- 失败提示
      }
    } catch (err) {
      const msg = err.message || "网络异常，无法连接服务器";
      setRegErrors((prev) => ({ ...prev, api: msg }));
      showNotice(msg, 'error'); // <--- 网络错误提示
    } finally {
      setRegSubmitting(false);
    }
  };

  return (
    <div className="page terminal-login-page">
      <MainNav navSolid={true} />
      <main className="terminal-login-main">
        <div className="auth-layout">
          {/* 登录 */}
          {flow === 'login' && (
            <section className="auth-card login-card">
              <h1 className="auth-title">登录账号</h1>
              <form onSubmit={handleLoginSubmit} className="auth-form">
                <div className={`auth-field ${loginErrors.email ? "has-error" : ""}`}>
                  <label className="auth-label">邮箱地址</label>
                  <input
                    type="email"
                    className="auth-input"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="请输入注册邮箱"
                  />
                  {loginErrors.email && <div className="auth-error-box">{loginErrors.email}</div>}
                </div>

                <div className={`auth-field ${loginErrors.password ? "has-error" : ""}`}>
                  <label className="auth-label">密码</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="请输入密码"
                  />
                  {loginErrors.password && <div className="auth-error-box">{loginErrors.password}</div>}
                </div>

                {showCaptcha && (
                  <div className={`auth-field captcha-field ${loginErrors.captcha ? "has-error" : ""}`}>
                    <label className="auth-label">验证码</label>
                    <div className="captcha-input-group">
                      <input
                        type="text"
                        className="auth-input captcha-input"
                        value={captchaValue}
                        onChange={(e) => setCaptchaValue(e.target.value.toUpperCase())}
                        placeholder="请输入验证码"
                        maxLength="5"
                        autoComplete="off"
                      />
                      <div className="captcha-image-wrapper">
                        {captchaLoading ? (
                          <div className="captcha-placeholder">加载中...</div>
                        ) : captchaImageSrc ? (
                          <img
                            src={captchaImageSrc}
                            alt="验证码"
                            className="captcha-image"
                            onClick={() => fetchCaptcha()} // 这里使用匿名函数更安全
                            title="点击刷新"
                            style={{ cursor: 'pointer' }}
                          />
                        ) : (
                          <div className="captcha-placeholder" onClick={() => fetchCaptcha()}>
                            点击获取
                          </div>
                        )}
                      </div>
                    </div>
                    {loginErrors.captcha && <div className="auth-error-box">{loginErrors.captcha}</div>}
                  </div>
                )}

                {loginErrors.api && <div className="auth-error-box api-error">{loginErrors.api}</div>}

                <button type="submit" className="auth-btn primary" disabled={loginSubmitting}>
                  {loginSubmitting ? "正在登录…" : "登 录"}
                </button>

                <div className="auth-extra-link">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      goForgot();
                    }}
                  >
                    忘记密码？
                  </a>
                </div>
              </form>
            </section>
          )}

          {/* 忘记密码 */}
          {flow === 'forgot' && (
            <section className="auth-card login-card">
              <h1 className="auth-title">找回密码</h1>
              <form onSubmit={handleForgotSubmit} className="auth-form">
                <div className={`auth-field ${forgotErrors.email ? 'has-error' : ''}`}>
                  <label className="auth-label">注册邮箱</label>
                  <input
                    type="email"
                    className="auth-input"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="请输入注册邮箱"
                  />
                  {forgotErrors.email && <div className="auth-error-box">{forgotErrors.email}</div>}
                </div>

                <div className={`auth-field captcha-field ${forgotErrors.captcha ? 'has-error' : ''}`}>
                  <label className="auth-label">验证码</label>
                  <div className="captcha-input-group">
                    <input
                      type="text"
                      className="auth-input captcha-input"
                      value={forgotCaptchaValue}
                      onChange={(e) => setForgotCaptchaValue(e.target.value.toUpperCase())}
                      placeholder="请输入验证码"
                      maxLength="5"
                      autoComplete="off"
                    />
                    <div className="captcha-image-wrapper">
                      {forgotCaptchaLoading ? (
                        <div className="captcha-placeholder">加载中...</div>
                      ) : forgotCaptchaImageSrc ? (
                        <img
                          src={forgotCaptchaImageSrc}
                          alt="验证码"
                          className="captcha-image"
                          onClick={() => fetchForgotCaptcha()}
                          title="点击刷新"
                          style={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <div className="captcha-placeholder" onClick={() => fetchForgotCaptcha()}>
                          点击获取
                        </div>
                      )}
                    </div>
                  </div>
                  {forgotErrors.captcha && <div className="auth-error-box">{forgotErrors.captcha}</div>}
                </div>

                {forgotErrors.api && <div className="auth-error-box api-error">{forgotErrors.api}</div>}

                <button type="submit" className="auth-btn primary" disabled={forgotSubmitting}>
                  {forgotSubmitting ? '正在发送…' : '发送重置邮件'}
                </button>
                <div className="auth-extra-link">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      goLogin();
                    }}
                  >
                    返回登录
                  </a>
                </div>
              </form>
            </section>
          )}

          {/* 重置密码 */}
          {flow === 'reset' && (
            <section className="auth-card login-card">
              <h1 className="auth-title">重置密码</h1>
              <form onSubmit={handleResetSubmit} className="auth-form">
                <div className={`auth-field ${resetErrors.password ? 'has-error' : ''}`}>
                  <label className="auth-label">新密码</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="至少 8 位，包含字母和数字"
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
                    placeholder="请再次输入新密码"
                  />
                  {resetErrors.password2 && <div className="auth-error-box">{resetErrors.password2}</div>}
                </div>

                {resetErrors.api && <div className="auth-error-box api-error">{resetErrors.api}</div>}

                <button type="submit" className="auth-btn primary" disabled={resetSubmitting}>
                  {resetSubmitting ? '正在提交…' : '确认重置'}
                </button>
                <div className="auth-extra-link">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      goLogin();
                    }}
                  >
                    返回登录
                  </a>
                </div>
              </form>
            </section>
          )}

          <section className="auth-card register-card">
            <h1 className="auth-title">创建新账号</h1>
            <form onSubmit={handleRegisterSubmit} className="auth-form">
              {/* ... 注册表单内容 ... */}
              <div className={`auth-field ${regErrors.email ? "has-error" : ""}`}>
                <label className="auth-label">邮箱地址（登录名）</label>
                <input
                  type="email"
                  className="auth-input"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="用于登录和接收通知"
                />
                {regErrors.email && <div className="auth-error-text">{regErrors.email}</div>}
              </div>

              <div className={`auth-field ${regErrors.password ? "has-error" : ""}`}>
                <label className="auth-label">设置密码</label>
                <input
                  type="password"
                  className="auth-input"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="至少 8 位，建议混合字母和数字"
                />
                <div className="auth-hint">推荐使用 12 位以上密码，并混合大小写字母、数字与符号。</div>
                {regErrors.password && <div className="auth-error-text">{regErrors.password}</div>}
              </div>

              <div className={`auth-field ${regErrors.password2 ? "has-error" : ""}`}>
                <label className="auth-label">再次输入密码</label>
                <input
                  type="password"
                  className="auth-input"
                  value={regPassword2}
                  onChange={(e) => setRegPassword2(e.target.value)}
                  placeholder="请再次输入同一密码"
                />
                {regErrors.password2 && <div className="auth-error-text">{regErrors.password2}</div>}
              </div>

              <div className="auth-row-2">
                <div className={`auth-field ${regErrors.firstName ? "has-error" : ""}`}>
                  <label className="auth-label">名字</label>
                  <input
                    type="text"
                    className="auth-input"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="例如：三"
                  />
                  {regErrors.firstName && <div className="auth-error-text">{regErrors.firstName}</div>}
                </div>
                <div className={`auth-field ${regErrors.lastName ? "has-error" : ""}`}>
                  <label className="auth-label">姓氏</label>
                  <input
                    type="text"
                    className="auth-input"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="例如：张"
                  />
                  {regErrors.lastName && <div className="auth-error-text">{regErrors.lastName}</div>}
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">公司 / 队伍（选填）</label>
                <input
                  type="text"
                  className="auth-input"
                  value={regCompany}
                  onChange={(e) => setRegCompany(e.target.value)}
                  placeholder="例如：XX 战术小队"
                />
              </div>

              <label className="auth-checkbox-row">
                <input
                  type="checkbox"
                  checked={regSubscribe}
                  onChange={(e) => setRegSubscribe(e.target.checked)}
                />
                <span>订阅 CGBGEAR 活动资讯、装备更新与专属福利</span>
              </label>

              {regErrors.api && <div className="auth-error-text api-error">{regErrors.api}</div>}

              <button type="submit" className="auth-btn primary" disabled={regSubmitting}>
                {regSubmitting ? "正在创建…" : "创建新账号"}
              </button>
            </form>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
