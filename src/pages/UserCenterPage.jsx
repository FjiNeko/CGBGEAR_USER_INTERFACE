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
import { useNavigate, Link } from 'react-router-dom';
import MainNav from '../components/MainNav';
import SiteFooter from '../components/SiteFooter';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotice } from '../context/NoticeContext';
import {
  getUserProfile,
  updateUserNickname,
  deleteForumPost,
  uploadAvatar,
  updateProfileCustomization // [引入] 新增的 API 函数
} from '../api/api';

import { formatDate } from '../utils/dateUtils';
import '../css/main.css';

// ==========================================================
// 辅助函数
// ==========================================================

const getInitials = (name) => {
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length === 1) {
    return name.substring(0, 2).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const stringToHslColor = (str, s, l) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

// ==========================================================
// 组件: 编辑资料模态框 (改名、改头像、改颜色、改称号)
// ==========================================================
const EditProfileModal = ({ isOpen, onClose, userData, onUpdateSuccess }) => {
  const { showNotice } = useNotice();
  const [activeTab, setActiveTab] = useState('name'); // 'name' | 'avatar' | 'style'

  // 改名状态
  const [newName, setNewName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  // 改头像状态
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [avatarPosition, setAvatarPosition] = useState('center');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef(null);

  // 个性化状态 (颜色 & 称号)
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedTitleId, setSelectedTitleId] = useState('');
  const [styleLoading, setStyleLoading] = useState(false);

  // [新增] 权限判断：是否有权使用特效颜色
  // 依据：拥有双倍增益(cgb_booster_active) 即代表拥有首发者权益包，或者管理员
  const hasColorPermission = userData?.user_info?.cgb_booster_active || userData?.user_info?.role === 'admin';

  useEffect(() => {
    if (isOpen && userData) {
      setNewName(userData.user_info.username);
      setPreviewUrl(userData.user_info.avatar_url);
      setSelectedColor(userData.user_info.nickname_color || '');
      setSelectedTitleId(userData.user_info.current_title ? userData.user_info.current_title.id : '');
      
      setSelectedFile(null);
      setAvatarPosition('center');
      setActiveTab('name'); 
    }
  }, [isOpen, userData]);

  // 处理文件选择
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  // 提交：修改昵称
  const handleNameSubmit = async () => {
    if (userData.user_info.cgb_points < 10) {
      showNotice('您的 CGB 点数不足 10 点，无法修改名称。', 'error');
      return;
    }
    setNameLoading(true);
    try {
      const res = await updateUserNickname(newName);
      if (res.code === 200) {
        showNotice('名称修改成功！已扣除 10 CGB。', 'success');
        onUpdateSuccess();
        onClose();
      } else {
        showNotice(res.msg || '修改失败。', 'error');
      }
    } catch (err) {
      showNotice(err.message || '系统错误。', 'error');
    } finally {
      setNameLoading(false);
    }
  };

  // 提交：修改头像
  const handleAvatarSubmit = async () => {
    if (!selectedFile) {
      showNotice('请先选择一张图片。', 'warning');
      return;
    }
    if (userData.user_info.cgb_points < 15) {
      showNotice('您的 CGB 点数不足 15 点，无法修改头像。', 'error');
      return;
    }
    setAvatarLoading(true);
    try {
      const res = await uploadAvatar(selectedFile);
      if (res.code === 200) {
        showNotice('头像修改成功！已扣除 15 CGB。', 'success');
        onUpdateSuccess();
        onClose();
      } else {
        showNotice(res.msg || '头像上传失败。', 'error');
      }
    } catch (err) {
      showNotice(err.message || '上传发生错误。', 'error');
    } finally {
      setAvatarLoading(false);
    }
  };

  // 提交：修改颜色
  const handleColorSubmit = async (colorVal) => {
    setStyleLoading(true);
    try {
      // [修改] 调用封装的 API 函数
      const res = await updateProfileCustomization({
        action: 'update_color',
        color: colorVal
      });
      if (res.code === 200) {
        showNotice('昵称颜色已更新', 'success');
        setSelectedColor(colorVal);
        onUpdateSuccess(); // 刷新父组件数据
      } else {
        showNotice(res.msg || '更新失败', 'error');
      }
    } catch (err) {
      showNotice(typeof err === 'string' ? err : '更新请求失败', 'error');
    } finally {
      setStyleLoading(false);
    }
  };

  // 提交：修改称号
  const handleTitleSubmit = async (e) => {
    const newTitleId = e.target.value;
    const titleIdToSend = newTitleId === '' ? null : parseInt(newTitleId); // 空字符串转 null

    setStyleLoading(true);
    try {
      // [修改] 调用封装的 API 函数
      const res = await updateProfileCustomization({
        action: 'update_title',
        title_id: titleIdToSend
      });
      if (res.code === 200) {
        showNotice(titleIdToSend ? '称号佩戴成功' : '称号已卸下', 'success');
        setSelectedTitleId(newTitleId);
        onUpdateSuccess();
      } else {
        showNotice(res.msg || '更新失败', 'error');
      }
    } catch (err) {
      showNotice(typeof err === 'string' ? err : '更新请求失败', 'error');
    } finally {
      setStyleLoading(false);
    }
  };

  // [新增] 辅助函数：根据权限生成按钮样式
  const getButtonStyle = (baseStyle) => {
    if (hasColorPermission) return baseStyle;
    // 无权限时的样式：灰色、禁用光标、无阴影、加边框
    return {
      padding: '8px 12px',
      borderRadius: '4px',
      cursor: 'not-allowed',
      background: '#f0f0f0',
      color: '#999',
      fontWeight: 'normal',
      border: '1px solid #ddd',
      boxShadow: 'none'
    };
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h3>编辑个人资料</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {/* Tabs */}
        <div className="uc-modal-tabs" style={{ display: 'flex', borderBottom: '1px solid #eee', marginBottom: '20px' }}>
          {['name', 'avatar', 'style'].map(tab => (
            <button
              key={tab}
              className={`uc-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={{ 
                padding: '10px 20px', 
                background: 'none', 
                border: 'none', 
                borderBottom: activeTab === tab ? '2px solid #007bff' : '2px solid transparent', 
                cursor: 'pointer', 
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                color: activeTab === tab ? '#007bff' : '#666'
              }}
            >
              {tab === 'name' ? '修改昵称' : tab === 'avatar' ? '修改头像' : '个性化'}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {/* Tab 1: Name */}
          {activeTab === 'name' && (
            <div className="uc-tab-content">
              <p style={{ color: '#fbbf24', marginBottom: '15px', fontSize: '14px', background: '#fffbeb', padding: '10px', borderRadius: '4px' }}>
                ⚠️ 修改名称将消耗 <strong>10 CGB</strong> 点数。
              </p>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>新昵称</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="modal-input"
                placeholder="请输入新的昵称"
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button className="uc-btn secondary" onClick={onClose} disabled={nameLoading}>取消</button>
                <button
                  className="uc-btn primary"
                  onClick={handleNameSubmit}
                  disabled={nameLoading || !newName.trim() || newName === userData.user_info.username}
                >
                  {nameLoading ? '处理中...' : '确认修改 (-10 CGB)'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Avatar */}
          {activeTab === 'avatar' && (
            <div className="uc-tab-content">
              <p style={{ color: '#fbbf24', marginBottom: '15px', fontSize: '14px', background: '#fffbeb', padding: '10px', borderRadius: '4px' }}>
                ⚠️ 修改头像将消耗 <strong>15 CGB</strong> 点数。
              </p>
              <div className="uc-avatar-upload-area" style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div
                  className="uc-avatar-preview"
                  style={{
                    width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 15px',
                    overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    position: 'relative', backgroundColor: '#f0f0f0'
                  }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: avatarPosition }}
                    />
                  ) : (
                    <div style={{ lineHeight: '120px', color: '#999' }}>暂无预览</div>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
                <button className="uc-btn secondary" onClick={() => fileInputRef.current.click()} style={{ fontSize: '13px', padding: '6px 12px' }}>
                  {selectedFile ? '重新选择图片' : '选择图片'}
                </button>
              </div>
              <div className="uc-position-selector" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>选择展示重点位置:</label>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  {['top', 'center', 'bottom'].map(pos => (
                    <button
                      key={pos}
                      onClick={() => setAvatarPosition(pos)}
                      style={{
                        padding: '6px 15px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px',
                        border: avatarPosition === pos ? '1px solid #007bff' : '1px solid #ddd',
                        backgroundColor: avatarPosition === pos ? '#e6f0ff' : '#fff',
                        color: avatarPosition === pos ? '#007bff' : '#333',
                      }}
                    >
                      {pos === 'center' ? '居中' : pos === 'top' ? '顶部' : '底部'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="uc-btn secondary" onClick={onClose} disabled={avatarLoading}>取消</button>
                <button className="uc-btn primary" onClick={handleAvatarSubmit} disabled={avatarLoading || !selectedFile}>
                  {avatarLoading ? '上传中...' : '确认修改 (-15 CGB)'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Style (Color & Title) */}
          {activeTab === 'style' && (
            <div className="uc-tab-content">
              
              {/* 昵称颜色 */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  昵称颜色
                  {!hasColorPermission && <span style={{fontSize: '12px', color: '#dc3545', marginLeft: '8px', fontWeight: 'normal'}}>* 需解锁首发者权益</span>}
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {/* 默认颜色 (始终可用) */}
                  <button 
                    onClick={() => handleColorSubmit('')}
                    disabled={styleLoading}
                    style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}
                  >
                    默认 (重置)
                  </button>
                  
                  {/* 彩虹色 (受限) */}
                  <button 
                    onClick={() => handleColorSubmit('rainbow-text')}
                    disabled={styleLoading || !hasColorPermission}
                    style={getButtonStyle({ 
                      padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                      background: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)',
                      color: 'white', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    })}
                  >
                    彩虹色 {!hasColorPermission && '(未解锁)'}
                  </button>
                  
                  {/* 鎏金色 (受限) */}
                  <button 
                    onClick={() => handleColorSubmit('gold-text')}
                    disabled={styleLoading || !hasColorPermission}
                    style={getButtonStyle({ 
                      padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                      background: 'linear-gradient(to bottom, #FFD700, #FDB931)',
                      color: '#5c4500', fontWeight: 'bold'
                    })}
                  >
                    鎏金 {!hasColorPermission && '(未解锁)'}
                  </button>
                  
                  {/* 极光色 (受限) */}
                   <button 
                    onClick={() => handleColorSubmit('aurora-text')}
                    disabled={styleLoading || !hasColorPermission}
                    style={getButtonStyle({ 
                      padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #00c6ff, #0072ff)',
                      color: 'white', fontWeight: 'bold'
                    })}
                  >
                    科技极光 {!hasColorPermission && '(未解锁)'}
                  </button>
                </div>
              </div>

              {/* 称号选择 */}
              <div style={{ marginBottom: '25px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>佩戴称号</label>
                <select 
                  value={selectedTitleId} 
                  onChange={handleTitleSubmit} 
                  disabled={styleLoading}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">(不展示称号)</option>
                  {userData.owned_titles && userData.owned_titles.map(title => (
                    <option key={title.id} value={title.id}>
                      {title.name}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                  * 您可以在此处选择已获得的永久称号。
                </p>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================================
// UserCenterPage 主组件
// ==========================================================

const UserCenterPage = () => {
  const navigate = useNavigate();
  const { showNotice } = useNotice();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 状态：编辑资料模态框
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUserProfile = async () => {
    if (!userData) setIsLoading(true);
    setError(null);
    try {
      const response = await getUserProfile();
      if (response.code === 200 && response.data) {
        setUserData(response.data);
      } else {
        const msg = response.msg || '获取个人资料失败，请检查登录状态或稍后再试。';
        setError(msg);
        if (response.code === 401 || response.code === 403) navigate('/terminal/login');
      }
    } catch (err) {
      const httpStatus = err.response?.status;
      const errorMessage = err.response?.data?.message || err.message || '未知错误';
      setError('加载个人资料失败: ' + errorMessage);
      if (httpStatus === 401 || httpStatus === 403) navigate('/terminal/login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [navigate]);

  const handleDeletePost = async (postId) => {
    if (!window.confirm("确定要删除这条帖子吗？此操作无法撤销。")) return;
    setIsDeleting(true);
    try {
      const res = await deleteForumPost(postId);
      if (res.code === 200) {
        showNotice('帖子已删除。', 'success');
        setUserData(prev => ({
          ...prev,
          latest_posts: prev.latest_posts.filter(p => p.id !== postId)
        }));
        fetchUserProfile();
      } else {
        showNotice(res.msg || '删除失败。', 'error');
      }
    } catch (err) {
      showNotice('删除请求失败，请稍后重试。', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditPost = (post) => {
    navigate(`/thread/edit/${post.id}`);
  };

  if (isLoading) {
    return (
      <div className="page">
        <MainNav navSolid={true} />
        <div className="main-wrapper" style={{ paddingTop: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 160px)' }}>
          <LoadingSpinner />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <MainNav navSolid={true} />
        <div className="main-wrapper" style={{ paddingTop: '80px', textAlign: 'center', paddingBottom: '50px', color: '#dc3545' }}>
          <h2>访问被拒绝</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="uc-btn primary" style={{ marginTop: '20px' }}>重试连接</button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!userData || !userData.user_info) return null;

  const { user_info, forum_contribution, today_performance, weekly_goals, latest_posts, recent_activities, user_badges } = userData;
  const isAdmin = user_info.role === 'admin';
  const bgColor = user_info ? stringToHslColor(user_info.username, 70, 40) : '#333';
  const calculateProgress = (current, target) => target ? Math.min((current / target) * 100, 100) : 0;

  // 根据 nickname_color 生成样式对象
  const getNicknameStyle = () => {
    const colorCode = user_info.nickname_color;
    if (!colorCode) return {};
    
    // 预设样式
    if (colorCode === 'rainbow-text') {
      return { 
        backgroundImage: 'linear-gradient(to right, red, orange, yellow, #00ff00, #00c6ff, indigo, violet)', 
        WebkitBackgroundClip: 'text', 
        color: 'transparent',
        fontWeight: 'bold'
      };
    }
    if (colorCode === 'gold-text') {
       return { color: '#FFD700', textShadow: '0 0 5px rgba(255, 215, 0, 0.4)', fontWeight: 'bold' };
    }
    if (colorCode === 'aurora-text') {
      return { 
        backgroundImage: 'linear-gradient(135deg, #00c6ff, #0072ff)', 
        WebkitBackgroundClip: 'text', 
        color: 'transparent',
        fontWeight: 'bold'
      };
    }
    // 默认回退：假设是 Hex 颜色
    return { color: colorCode };
  };

  return (
    <div className="page user-center-page">
      <MainNav navSolid={true} />

      <div className="uc-container">
        {/* 1. 顶部个人档案卡 */}
        <div className="uc-hero-card">
          <div className="uc-hero-bg"></div>
          <div className="uc-hero-content">
            <div className="uc-avatar-wrapper">
              {user_info.avatar_url && user_info.avatar_url.startsWith('http') ? (
                <div className="uc-avatar-directly">
                  <img
                    src={user_info.avatar_url}
                    alt={user_info.username}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.style.backgroundColor = bgColor;
                      e.target.parentNode.innerHTML = `<span>${getInitials(user_info.username)}</span>`;
                    }}
                  />
                </div>
              ) : (
                <div className="uc-avatar-directly" style={{ backgroundColor: bgColor }}>
                  <span>{getInitials(user_info.username)}</span>
                </div>
              )}
              <div className="uc-level-badge">Lv.{user_info.level}</div>
            </div>

            <div className="uc-info-main">
              <div className="uc-name-row" style={{alignItems: 'center'}}>
                {/* 昵称 + 颜色 */}
                <h1 className="uc-username" style={getNicknameStyle()}>
                  {user_info.username}
                  
                  {/* 编辑按钮 */}
                  <button
                    className="uc-edit-name-btn"
                    onClick={() => setIsEditModalOpen(true)}
                    title="编辑资料 (修改昵称/头像/颜色)"
                    style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                </h1>

                {/* 称号展示 */}
                {user_info.current_title && (
                   <span 
                    className="uc-title-tag" 
                    style={{ 
                      marginLeft: '10px', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      ... (user_info.current_title.style_css ? 
                          user_info.current_title.style_css.split(';').reduce((acc, rule) => {
                              const [k, v] = rule.split(':');
                              if (k && v) acc[k.trim().replace(/-./g, x=>x[1].toUpperCase())] = v.trim();
                              return acc;
                          }, {}) : {})
                    }}
                   >
                     {user_info.current_title.name}
                   </span>
                )}

                {/* 身份标签：互斥显示 */}
                {isAdmin ? (
                   <span className="uc-role-tag admin" style={{marginLeft: '10px'}}>管理员</span>
                ) : (
                   <span className="uc-role-tag user" style={{marginLeft: '10px'}}>普通用户</span>
                )}
              </div>

              <div className="uc-meta-row">
                <span className="uc-meta-item">UID: <span className="code-font">{user_info.uid}</span></span>
                {user_info.true_name && <span className="uc-meta-item" title="实名认证">{user_info.true_name}</span>}
                <span className="uc-meta-item">注册: {formatDate(user_info.created_at)}</span>
              </div>

              {/* 权益展示区 (CGB 旁) */}
              <div className="uc-points-bar-wrap" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="uc-points-info">
                  <span className="label">CGB点</span>
                  <span className="value">{user_info.cgb_points}</span>
                </div>

                {/* 权益图标 */}
                <div className="uc-benefits-row" style={{ display: 'flex', gap: '15px' }}>
                  {/* 双倍卡 */}
                  {user_info.cgb_booster_active && (
                    <div className="benefit-item" title="永久 CGB 点双倍增益生效中" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '18px' }}>⚡x2</span>
                      <span style={{ fontSize: '10px', color: '#ffcc00' }}>双倍增益</span>
                    </div>
                  )}
                  {/* 抽奖券 */}
                  {user_info.lottery_tickets > 0 && (
                    <div className="benefit-item" title={`剩余抽奖次数: ${user_info.lottery_tickets}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '18px' }}>🎟️ {user_info.lottery_tickets}</span>
                      <span style={{ fontSize: '10px', color: '#ccc' }}>抽奖次数</span>
                    </div>
                  )}
                  {/* 战术小队 */}
                  <div className="benefit-item" title={`战术小队创建上限: ${user_info.squad_limit}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px' }}>🛡️ {user_info.squad_limit}</span>
                    <span style={{ fontSize: '10px', color: '#ccc' }}>小队上限</span>
                  </div>
                </div>

                <div className="uc-deco-stripe" style={{ flex: 1 }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 核心数据仪表盘 (保持不变) */}
        <div className="uc-stats-grid">
           {/* ... 原有 Stat Card 代码保持不变 ... */}
          <div className="uc-stat-card">
            <div className="uc-stat-icon"><svg className="icon" viewBox="0 0 1024 1024" width="16" height="16"><path d="M802.133333 1024H221.013333A128.853333 128.853333 0 0 1 92.16 896v-768A128.853333 128.853333 0 0 1 221.013333 0h452.266667l256 256v640A128.853333 128.853333 0 0 1 802.133333 1024zM673.28 64v128a64 64 0 0 0 64.853333 64h128.853334L673.28 64z m193.706667 256H738.133333a128.853333 128.853333 0 0 1-129.706666-128V64H221.013333a64.853333 64.853333 0 0 0-64 64v768a64.853333 64.853333 0 0 0 64 64h581.12a64.853333 64.853333 0 0 0 64.853334-64V320zM705.706667 768H318.293333a32.426667 32.426667 0 1 1 0-64h387.413334a32.426667 32.426667 0 1 1 0 64z m0-192H318.293333a32.426667 32.426667 0 1 1 0-64h387.413334a32.426667 32.426667 0 1 1 0 64z" fill="#22c55e" /></svg></div>
            <div className="uc-stat-data">
              <span className="uc-stat-value">{forum_contribution.total_posts}</span>
              <span className="uc-stat-label">发帖总数</span>
            </div>
          </div>
          <div className="uc-stat-card">
            <div className="uc-stat-icon"><svg className="icon" viewBox="0 0 1024 1024" width="16" height="16"><path d="M960 838.4l-224 0 0 0L371.2 838.4l0 0L320 838.4l0 0L307.2 838.4l-128 128c-6.4 6.4-19.2 12.8-32 12.8l0 0 0 0 0 0c-12.8 0-25.6-6.4-32-12.8l0 0-6.4-6.4 0 0 0-6.4 0 0 0-6.4c0 0 0-6.4 0-12.8l0 0L108.8 832 102.4 832l0 0L44.8 832C19.2 832 0 812.8 0 787.2L0 96c0-25.6 19.2-51.2 44.8-51.2l928 0C998.4 44.8 1024 64 1024 96l0 691.2C1011.2 819.2 992 838.4 960 838.4zM256 358.4c-51.2 0-96 44.8-96 96S204.8 550.4 256 550.4s96-44.8 96-96S313.6 358.4 256 358.4zM499.2 358.4C448 358.4 403.2 403.2 403.2 454.4S448 550.4 499.2 550.4s96-44.8 96-96S550.4 358.4 499.2 358.4zM736 358.4c-51.2 0-96 44.8-96 96s44.8 96 96 96S832 499.2 832 454.4 793.6 358.4 736 358.4z" fill="#ffffff" /></svg></div>
            <div className="uc-stat-data">
              <span className="uc-stat-value">{forum_contribution.total_replies}</span>
              <span className="uc-stat-label">回复总数</span>
            </div>
          </div>
          <div className="uc-stat-card highlight">
            <div className="uc-stat-icon">
              <svg className="icon" viewBox="0 0 1024 1024" width="20" height="20"><path d="M395.765333 586.570667h-171.733333c-22.421333 0-37.888-22.442667-29.909333-43.381334L364.768 95.274667A32 32 0 0 1 394.666667 74.666667h287.957333c22.72 0 38.208 23.018667 29.632 44.064l-99.36 243.882666h187.050667c27.509333 0 42.186667 32.426667 24.042666 53.098667l-458.602666 522.56c-22.293333 25.408-63.626667 3.392-54.976-29.28l85.354666-322.421333z" fill="#f4ea2a" /></svg>
            </div>
            <div className="uc-stat-data">
              <span className="uc-stat-value">
                {today_performance.points_gained_today > 0 ? '+' : ''}
                {today_performance.points_gained_today}
              </span>
              <span className="uc-stat-label">今日点数</span>
            </div>
          </div>
          <div className="uc-stat-card">
            <div className="uc-stat-icon">❤️</div>
            <div className="uc-stat-data">
              <span className="uc-stat-value">{today_performance.likes_received_today}</span>
              <span className="uc-stat-label">今日获赞</span>
            </div>
          </div>
        </div>

        <div className="uc-layout-columns">
          {/* 左侧主要内容 */}
          <div className="uc-main-column">

            {/* 本周任务 */}
            <div className="uc-panel">
              <div className="uc-panel-header">
                <h3>本周任务</h3>
                <span className="uc-panel-sub">完成进度</span>
              </div>
              <div className="uc-panel-body">
                <div className="uc-goal-item">
                  <div className="uc-goal-info">
                    <span className="uc-goal-label">发帖达标</span>
                    <span className="uc-goal-status">
                      {weekly_goals.post_goal.current} / {weekly_goals.post_goal.target}
                      {weekly_goals.post_goal.completed && <span className="uc-completed-check">✓</span>}
                    </span>
                  </div>
                  <div className="uc-progress-bg">
                    <div
                      className="uc-progress-fill"
                      style={{ width: `${calculateProgress(weekly_goals.post_goal.current, weekly_goals.post_goal.target)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="uc-goal-item">
                  <div className="uc-goal-info">
                    <span className="uc-goal-label">回复活跃</span>
                    <span className="uc-goal-status">
                      {weekly_goals.reply_goal.current} / {weekly_goals.reply_goal.target}
                      {weekly_goals.reply_goal.completed && <span className="uc-completed-check">✓</span>}
                    </span>
                  </div>
                  <div className="uc-progress-bg">
                    <div
                      className="uc-progress-fill"
                      style={{ width: `${calculateProgress(weekly_goals.reply_goal.current, weekly_goals.reply_goal.target)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 最新动态 (Posts) */}
            <div className="uc-panel">
              <div className="uc-panel-header">
                <h3>最新动态</h3>
                <Link to="/forum?filter=my_posts" className="uc-more-link">查看全部 &gt;</Link>
              </div>
              <div className="uc-panel-body no-padding">
                {latest_posts.length > 0 ? (
                  <div className="uc-list">
                    {latest_posts.map(post => (
                      <div key={post.id} className="uc-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: 0, marginRight: '10px' }}>
                          <Link to={`/thread/${post.id}`} className="uc-list-title" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {post.title}
                          </Link>
                          <span className="uc-list-date">{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                        {/* [功能修复] 添加编辑与删除功能 */}
                        <div className="uc-post-actions" style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEditPost(post)}
                            className="uc-action-btn edit"
                            title="重新编辑"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="uc-action-btn delete"
                            title="删除帖子"
                            disabled={isDeleting}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545' }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="uc-empty">暂无相关数据记录</div>
                )}
              </div>
            </div>

            {/* 活动日志 */}
            <div className="uc-panel">
              <div className="uc-panel-header">
                <h3>活动日志</h3>
              </div>
              <div className="uc-panel-body no-padding">
                {recent_activities.length > 0 ? (
                  <div className="uc-activity-list">
                    {recent_activities.map((activity, index) => (
                      <div key={index} className="uc-activity-item">
                        <div className="uc-activity-dot"></div>
                        <div className="uc-activity-content">
                          <p className="uc-activity-desc">{activity.description}</p>
                          <span className="uc-activity-time">{new Date(activity.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="uc-empty">暂无活动记录</div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧侧边栏 */}
          <div className="uc-side-column">
            {/* 徽章墙 */}
            <div className="uc-panel">
              <div className="uc-panel-header">
                <h3>荣誉徽章</h3>
                <span className="uc-panel-sub">成就一览</span>
              </div>
              <div className="uc-panel-body">
                {user_badges.length > 0 ? (
                  <div className="uc-badge-grid">
                    {user_badges.map(badge => (
                      <div key={badge.id} className="uc-badge-item" title={badge.description}>
                        <div className="uc-badge-icon">
                          {badge.icon_url ? <img src={badge.icon_url} alt={badge.name} /> : '🏅'}
                        </div>
                        <span className="uc-badge-name">{badge.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="uc-empty">暂未获得徽章</div>
                )}
                {user_badges.length >= 6 && (
                  <div className="uc-center-link">
                    <Link to="/user/badges">查看所有徽章</Link>
                  </div>
                )}
              </div>
            </div>

            {/* 管理员面板 */}
            {isAdmin && (
              <div className="uc-panel admin-panel">
                <div className="uc-panel-header">
                  <h3 style={{ color: '#fbbf24' }}>管理控制台</h3>
                </div>
                <div className="uc-panel-body">
                  <ul className="uc-admin-links">
                    <li><Link to="/admin/dashboard">进入仪表盘</Link></li>
                    <li><Link to="/admin/users">用户管理</Link></li>
                    <li><Link to="/admin/content">内容审核</Link></li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userData={userData}
        onUpdateSuccess={fetchUserProfile}
      />

      <SiteFooter />
    </div>
  );
};

export default UserCenterPage;