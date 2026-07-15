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

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import "../css/main.css";

import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import { useAuth } from "../context/AuthContext";
import { useNotice } from '../context/NoticeContext';

import {
  getForumModules, getThreadDetail, createReply, getPostReplies,
  likePost, unlikePost, likeReply,
} from "../api/api";
import { buildSearchId } from "../utils/auth";
import { formatDate } from '../utils/dateUtils';

// 提取 HTML 中的图片 URL（最多 N 张）
const extractImagesFromHtml = (html, max = 9) => {
  if (!html || typeof html !== 'string') return [];
  try {
    const matches = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi));
    const urls = matches.map(m => m[1]).filter(Boolean);
    return urls.slice(0, max);
  } catch (e) {
    return [];
  }
};

// 简单的头像 Fallback（与 ThreadPage 风格接近）
const getAvatarStyle = (user, size = 40) => {
  const avatarUrl = user.author_avatar_url || user.avatar_url;
  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.startsWith('http')) {
    return { width: size, height: size, borderRadius: 6, objectFit: 'cover', border: '1px solid #333' };
  }
  const name = user.author_name || user.name || '?';
  const colors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#009688', '#4caf50', '#ff9800', '#795548'];
  const index = name.charCodeAt(0) % colors.length;
  return {
    width: size, height: size, borderRadius: 6,
    background: colors[index], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 'bold', fontSize: Math.floor(size * 0.42), border: '1px solid #333'
  };
};

const getNicknameStyle = (colorCode) => {
  if (!colorCode) return { color: '#e3e3e3', textDecoration: 'none' };
  const base = { textDecoration: 'none', fontWeight: 700 };
  if (colorCode === 'rainbow-text') {
    return { ...base, backgroundImage: 'linear-gradient(to right, red, orange, yellow, #00ff00, #00c6ff, indigo, violet)', WebkitBackgroundClip: 'text', color: 'transparent' };
  }
  if (colorCode === 'gold-text') {
    return { ...base, color: '#FFD700', textShadow: '0 0 5px rgba(255, 215, 0, 0.4)' };
  }
  if (colorCode === 'aurora-text') {
    return { ...base, backgroundImage: 'linear-gradient(135deg, #00c6ff, #0072ff)', WebkitBackgroundClip: 'text', color: 'transparent' };
  }
  return { ...base, color: colorCode };
};

// 图片轮播（支持点击查看大图的简易 Lightbox）
const ImageCarousel = ({ images = [] }) => {
  const [idx, setIdx] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const total = images.length;
  useEffect(() => { if (idx >= total) setIdx(0); }, [total, idx]);
  if (!total) return null;
  const to = (i) => setIdx((i + total) % total);
  const openViewer = (i) => { setIdx(i); setViewerOpen(true); };
  const closeViewer = () => setViewerOpen(false);
  return (
    <>
      <div style={{ position: 'relative', width: '100%', height: 220, background: '#111', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', width: `${total * 100}%`, height: '100%', transform: `translateX(-${idx * (100 / total)}%)`, transition: 'transform 280ms ease' }}>
          {images.map((src, i) => (
            <div key={i} style={{ width: `${100 / total}%`, height: '100%' }}>
              <img onClick={() => openViewer(i)} src={src} alt={`img-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} />
            </div>
          ))}
        </div>
        {total > 1 && (
          <>
            <button onClick={() => to(idx - 1)} aria-label="prev" style={{ position: 'absolute', top: '50%', left: 6, transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', color: '#fff', border: 'none', borderRadius: 16, width: 28, height: 28, cursor: 'pointer' }}>{'‹'}</button>
            <button onClick={() => to(idx + 1)} aria-label="next" style={{ position: 'absolute', top: '50%', right: 6, transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', color: '#fff', border: 'none', borderRadius: 16, width: 28, height: 28, cursor: 'pointer' }}>{'›'}</button>
            <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
              {images.map((_, i) => (
                <span key={i} onClick={() => setIdx(i)} style={{ width: 6, height: 6, borderRadius: 6, background: i === idx ? '#a3e635' : 'rgba(255,255,255,0.5)', display: 'inline-block', cursor: 'pointer' }} />
              ))}
            </div>
          </>
        )}
      </div>

      {viewerOpen && (
        <div onClick={closeViewer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={(e) => { e.stopPropagation(); to(idx - 1); }} aria-label="prev" style={{ position: 'absolute', left: 10, background: 'rgba(255,255,255,0.1)', color: '#e5e7eb', border: 'none', borderRadius: 16, width: 36, height: 36, cursor: 'pointer' }}>{'‹'}</button>
          <img src={images[idx]} alt={`view-${idx}`} style={{ maxWidth: '96vw', maxHeight: '86vh', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={(e) => { e.stopPropagation(); to(idx + 1); }} aria-label="next" style={{ position: 'absolute', right: 10, background: 'rgba(255,255,255,0.1)', color: '#e5e7eb', border: 'none', borderRadius: 16, width: 36, height: 36, cursor: 'pointer' }}>{'›'}</button>
          <button onClick={(e) => { e.stopPropagation(); closeViewer(); }} aria-label="close" style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.1)', color: '#e5e7eb', border: 'none', borderRadius: 16, width: 36, height: 36, cursor: 'pointer' }}>×</button>
        </div>
      )}
    </>
  );
};

// 存在轮播图时仅展示文字：移除正文 HTML 中的所有图片标签
const stripImages = (html) => {
  if (!html || typeof html !== 'string') return html;
  return html.replace(/<img[^>]*>/gi, '');
};

const MobileThreadPage = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { showNotice } = useNotice();

  // 加载状态与数据
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainPost, setMainPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');

  // 顶部标签：正文/回复
  const [activeTab, setActiveTab] = useState('正文'); // '正文' | '回复'

  // 回复排序
  const [sortOpen, setSortOpen] = useState(false);
  const [sortMode, setSortMode] = useState('hot'); // hot | asc | desc

  // 分页（保留，但移动端先拉取第一页）
  const [page] = useState(1);
  const limit = 50;

  useEffect(() => {
    const fetchAll = async () => {
      if (!threadId) return;
      setLoading(true);
      setError(null);
      try {
        const threadRes = await getThreadDetail(threadId);
        if (threadRes.code !== 200 || !threadRes.data) {
          setError(threadRes.message || '未能获取帖子详情。');
          setLoading(false);
          return;
        }
        const d = threadRes.data;
        const formatted = {
          id: d.id,
          title: d.title,
          content: d.content,
          created_at: d.created_at,
          view_count: d.view_count,
          reply_count: d.reply_count,
          is_locked: d.is_locked,
          tags: d.tags,
          user_id: d.user_id,
          author_uid: d.author_uid,
          author_name: d.author_name,
          author_avatar_url: d.author_avatar_url,
          nickname_color: d.nickname_color,
          author_badges: d.author_badges,
          author_title: d.author_title,
          level: d.level,
          cgb_points: d.cgb_points,
          likes: d.likes || 0,
          hasLiked: d.has_liked || false,
          images: extractImagesFromHtml(d.content || '')
        };
        setMainPost(formatted);
        await loadReplies(threadId, page);
      } catch (e) {
        console.error('MobileThreadPage error:', e);
        setError('加载主题失败，请稍后重试。');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const loadReplies = useCallback(async (postId, p) => {
    try {
      const res = await getPostReplies(postId, { page: p, limit });
      if (res.code === 200 && res.data) {
        const formatted = res.data.map(r => ({
          id: r.id,
          content: r.content,
          created_at: r.time,
          floor: r.floor,
          likes: r.likes,
          hasLiked: r.hasLiked,
          user_id: r.author.user_id,
          author_uid: r.author.uid,
          author_name: r.author.name,
          author_avatar_url: r.author.avatar_url,
          nickname_color: r.author.nickname_color,
          author_badges: r.author.badges,
          author_title: r.author.title,
          level: r.author.level,
          cgb_points: r.author.cgb_points,
        }));
        setReplies(formatted);
      }
    } catch (e) {
      console.error('loadReplies failed:', e);
      showNotice('获取回复列表失败', 'error');
    }
  }, [showNotice]);

  // 客户端排序
  const sortedReplies = useMemo(() => {
    const arr = [...replies];
    if (sortMode === 'hot') return arr.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    if (sortMode === 'asc') return arr.sort((a, b) => (a.floor || 0) - (b.floor || 0));
    return arr.sort((a, b) => (b.floor || 0) - (a.floor || 0));
  }, [replies, sortMode]);

  // 点赞统一处理
  const handleToggleLike = useCallback(async (id, currentLikes, hasLiked, userId, isReply) => {
    if (!currentUser?.is_logged_in) {
      showNotice('请先登录才能点赞！', 'error');
      return;
    }
    if (currentUser.user_id === userId) {
      showNotice(`不能点赞自己的${isReply ? '回复' : '帖子'}哦！`, 'warning');
      return;
    }
    // 乐观更新
    if (isReply) {
      setReplies(prev => prev.map(r => r.id === id ? { ...r, likes: hasLiked ? r.likes - 1 : r.likes + 1, hasLiked: !hasLiked } : r));
    } else {
      setMainPost(prev => prev ? { ...prev, likes: hasLiked ? prev.likes - 1 : prev.likes + 1, hasLiked: !hasLiked } : null);
    }
    try {
      if (isReply) {
        if (hasLiked) {
          showNotice('取消点赞回复功能暂不可用', 'info');
          setReplies(prev => prev.map(r => r.id === id ? { ...r, likes: currentLikes, hasLiked: true } : r));
        } else {
          await likeReply(id);
        }
      } else {
        if (hasLiked) await unlikePost(id); else await likePost(id);
      }
    } catch (e) {
      showNotice(e?.message || '操作失败', 'error');
      if (isReply) {
        setReplies(prev => prev.map(r => r.id === id ? { ...r, likes: currentLikes, hasLiked } : r));
      } else {
        setMainPost(prev => prev ? { ...prev, likes: currentLikes, hasLiked } : null);
      }
    }
  }, [currentUser, showNotice]);

  // 发送纯文本回复（不使用 tiptap）
  const handleSendReply = useCallback(async () => {
    if (!currentUser?.is_logged_in) {
      showNotice('请先登录才能回复。', 'warning');
      // 附加参数以兼容移动端视图（保持引用 buildSearchId）
      const params = new URLSearchParams();
      params.set('id', buildSearchId());
      params.set('view', 'mobile');
      navigate(`/terminal/login?${params.toString()}`);
      return;
    }
    const text = (replyText || '').trim();
    if (!text) {
      showNotice('来说点什么吧～', 'warning');
      return;
    }
    try {
      // 简单包一层段落，后端字段为 HTML
      const contentHtml = `<p>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
      const res = await createReply(threadId, contentHtml);
      if (res && res.code === 201) {
        showNotice('回复成功！+2 CGB', 'success');
        setReplyText('');
        await loadReplies(threadId, page);
        setMainPost(prev => prev ? { ...prev, reply_count: (prev.reply_count || 0) + 1 } : prev);
        if (activeTab !== '回复') setActiveTab('回复');
      } else {
        showNotice(res?.msg || '回复失败', 'error');
      }
    } catch (e) {
      showNotice('回复请求失败', 'error');
    }
  }, [activeTab, currentUser, loadReplies, navigate, page, replyText, showNotice, threadId]);

  if (loading || authLoading) return (
    <div className="page mobile-page-layout">
      <MainNav navSolid={true} isMobile={true} />
      <div style={{ paddingTop: 100, textAlign: 'center', color: '#888' }}><i className="ri-loader-4-line ri-spin"></i> 正在加载主题...</div>
      <SiteFooter />
    </div>
  );
  if (error || !mainPost) return (
    <div className="page mobile-page-layout">
      <MainNav navSolid={true} isMobile={true} />
      <div style={{ paddingTop: 100, textAlign: 'center', color: '#dc3545' }}>{error || '主题不存在。'}</div>
      <SiteFooter />
    </div>
  );

  return (
    <div className="page mobile-page-layout mobile-thread-page">
      {/* 站点主导航仍保留（与 PC 一致），页面内部自带 App 风格导航栏 */}
      <MainNav navSolid={true} isMobile={true} />

      <main className="main-wrapper" style={{ paddingTop: 50, paddingBottom: 70 }}>
        {/* 页面导航栏（不是 MainNav）：左返回 / 中间标签 / 右更多 */}
        <section style={{ position: 'sticky', top: 50, zIndex: 5, background: '#0f0f0f', borderBottom: '1px solid #1f1f1f' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 10px' }}>
            <button onClick={() => navigate(-1)} aria-label="back" className="nav-cta" style={{ background: 'transparent', border: 'none', color: '#e5e7eb', padding: 6, cursor: 'pointer' }}>{'‹'}</button>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 18 }}>
              {['正文', '回复'].map(tab => {
                const active = activeTab === tab;
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)} className="nav-cta" style={{ background: 'transparent', border: 'none', padding: '6px 2px', color: active ? '#fff' : '#9ca3af', fontSize: active ? 16 : 14, fontWeight: active ? 700 : 500, borderBottom: active ? '2px solid #a3e635' : '2px solid transparent', cursor: 'pointer' }}>{tab}</button>
                );
              })}
            </div>
            <button aria-label="more" className="nav-cta" style={{ background: 'transparent', border: 'none', color: '#e5e7eb', padding: 6, cursor: 'pointer' }}>⋯</button>
          </div>
        </section>

        {/* 正文区（包含图片轮播） */}
        {activeTab === '正文' && (
          <section style={{ padding: '12px 12px 0 12px' }}>
            {/* 图片轮播（若有） */}
            {mainPost.images && mainPost.images.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <ImageCarousel images={mainPost.images} />
              </div>
            )}

            {/* 作者 + 标题 + 时间 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {mainPost.author_avatar_url ? (
                <img src={mainPost.author_avatar_url} alt={mainPost.author_name} style={getAvatarStyle(mainPost, 40)} />
              ) : (
                <div style={getAvatarStyle(mainPost, 40)}>{(mainPost.author_name || '?')[0]}</div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, lineHeight: 1.2 }}>
                  <Link to={`/u/${mainPost.author_uid}`} style={getNicknameStyle(mainPost.nickname_color)}>{mainPost.author_name}</Link>
                  <span style={{ marginLeft: 6, fontSize: 11, color: '#9ca3af' }}>Lv.{mainPost.level || 1}</span>
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{formatDate(mainPost.created_at)}</div>
              </div>
            </div>

            <h1 style={{ fontSize: 18, lineHeight: 1.35, color: '#fff', margin: '6px 0 10px 0' }}>{mainPost.title}</h1>

            <div style={{ fontSize: 15, lineHeight: 1.7, color: '#e5e7eb', background: '#151515', border: '1px solid #222', borderRadius: 8, padding: 12 }}>
              <div dangerouslySetInnerHTML={{ __html: (mainPost.images && mainPost.images.length > 0) ? stripImages(mainPost.content) : mainPost.content }} />
            </div>
            {/* 元信息：浏览数（SVG）与回复数 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e5e7eb', fontSize: 12 }}>
                <svg t="1771567146233" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8794" width="16" height="16">
                  <path d="M639.647253 389.432298c-16.555576-15.991181-35.933125-28.595995-57.380121-37.438177-22.199522-9.030314-45.904097-13.733603-69.796803-13.733603l-0.376263 0.188132c-23.892706 0-47.785412 4.703289-69.796803 13.733602-21.258865 8.654051-40.824545 21.258865-57.19199 37.061915-16.367444 15.80305-29.536653 34.428073-38.566967 55.122543-18.813155 43.082124-18.813155 91.808194 0 134.890317 9.030314 20.69447 22.199522 39.319493 38.566967 55.122543 16.367444 15.80305 35.933125 28.407863 57.19199 37.061914 44.963439 18.24876 95.194562 18.24876 140.158001 0 21.258865-8.654051 40.824545-21.258865 57.191989-37.061914 16.367444-15.80305 29.536653-34.428073 38.566967-55.122543 18.813155-43.082124 18.813155-91.808194 0-134.890317-9.030314-20.506338-22.199522-39.131361-38.566967-54.934412z m-131.692081 234.600037c-62.271541-1.128789-112.126401-50.983649-112.126401-111.938269 0.564395-62.459673 52.676833-112.690796 116.265295-111.93827 63.024068 1.128789 113.25519 52.112438 112.126401 114.007717-1.128789 61.707147-53.241227 110.997612-116.265295 109.868822z m506.073856-145.990079c-40.824545-58.885174-87.857432-113.443322-140.534264-162.545655-46.656623-44.587176-99.145324-82.966011-156.149183-114.195848-62.647805-34.616204-133.197134-53.429359-205.251515-54.558148-72.054382 1.128789-142.603711 20.130075-205.251516 54.934411-57.003858 31.041705-109.492559 69.608672-156.149182 114.195848C98.204667 364.975198 50.983649 419.533346 10.159103 478.418519c-13.545471 20.506338-13.545471 46.844755 0 67.351093C50.983649 604.842918 98.016535 659.401066 150.693368 708.69153c46.656623 44.587176 99.145324 82.966011 156.149182 114.007717 62.647805 34.804336 133.197134 53.805622 205.251516 54.934411 72.054382-1.128789 142.603711-19.941944 205.251515-54.74628 57.003858-31.041705 109.492559-69.608672 156.149183-114.195848 52.488701-49.290465 99.709719-103.848613 140.534264-162.733786 13.545471-20.882602 13.545471-47.409149 0-67.915488z m-53.805622 34.616204S760.051442 815.926511 512.094066 815.926511 63.964725 512.65846 63.964725 512.65846c-0.376263-0.564395-0.376263-1.128789 0-1.693183 0 0 200.171964-303.268051 448.129341-303.268051 247.769245 0 448.12934 303.268051 448.12934 303.268051 0.376263 0.564395 0.376263 1.128789 0 1.693183z" fill="#e5e7eb" p-id="8795"></path>
                </svg>
                <span>{mainPost.view_count}</span>
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>💬 {mainPost.reply_count}</div>
              {/* 主体内点赞按钮 */}
              <div style={{ marginLeft: 'auto' }}>
                <button
                  onClick={() => handleToggleLike(mainPost.id, mainPost.likes, mainPost.hasLiked, mainPost.user_id, false)}
                  className="nav-cta"
                  style={{ background: 'transparent', border: '1px solid #222', borderRadius: 16, padding: '6px 10px', color: mainPost.hasLiked ? '#ff4d4f' : '#e5e7eb', cursor: 'pointer' }}
                  title={mainPost.hasLiked ? '取消点赞' : '点赞'}
                >
                  <span style={{ marginRight: 6, fontSize: 13, color: mainPost.hasLiked ? '#ff4d4f' : '#9ca3af' }}>{mainPost.likes || 0}</span>
                  {mainPost.hasLiked ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 回复区（无论哪个标签，均在此处渲染；当 activeTab 为“回复”时仅显示此区） */}
        <section style={{ marginTop: 12 }}>
          {/* 互动数据栏：左“回复 X”，右“点赞数” + 排序按钮 */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderTop: '1px solid #1f1f1f', borderBottom: '1px solid #1f1f1f', background: '#0f0f0f' }}>
            <div style={{ color: '#fff', fontSize: 14 }}>回复 {replies.length}</div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>👍 {mainPost.likes || 0}</div>
              <button onClick={() => setSortOpen(true)} className="nav-cta" style={{ background: 'transparent', border: 'none', color: '#e5e7eb', cursor: 'pointer', padding: 6 }} title="排序">
                {/* 排序图标 */}
                <svg t="1771565677807" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7420" width="18" height="18">
                  <path fill="#e5e7eb" d="M437 885.4c-9.4 0-18.6-3.7-25.5-10.5L226.7 690.1c-14.1-14.1-14.1-36.9 0-50.9 14.1-14.1 36.9-14.1 50.9 0L401 762.5V178c0-19.9 16.1-36 36-36s36 16.1 36 36v671.4c0 14.6-8.8 27.7-22.2 33.3-4.5 1.8-9.2 2.7-13.8 2.7zM586 560c-19.9 0-36-16.1-36-36V178c0-14.6 8.8-27.7 22.2-33.3 13.5-5.6 29-2.5 39.2 7.9l169 169.5c14 14.1 14 36.9-0.1 50.9s-36.9 14-50.9-0.1L622 265.1V524c0 19.9-16.1 36-36 36zM802 761H676c-19.9 0-36-16.1-36-36s16.1-36 36-36h126c19.9 0 36 16.1 36 36s-16.1 36-36 36zM802 653H676c-19.9 0-36-16.1-36-36s16.1-36 36-36h126c19.9 0 36 16.1 36 36s-16.1 36-36 36zM802 869H676c-19.9 0-36-16.1-36-36s16.1-36 36-36h126c19.9 0 36 16.1 36 36s-16.1 36-36 36z" p-id="7421"></path>
                  <path fill="#e5e7eb" d="M586.9 617m-36 0a36 36 0 1 0 72 0 36 36 0 1 0-72 0Z" p-id="7422"></path>
                  <path fill="#e5e7eb" d="M586.9 725m-36 0a36 36 0 1 0 72 0 36 36 0 1 0-72 0Z" p-id="7423"></path>
                  <path fill="#e5e7eb" d="M585.9 833m-36 0a36 36 0 1 0 72 0 36 36 0 1 0-72 0Z" p-id="7424"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* 排序弹层 */}
          {sortOpen && (
            <div onClick={() => setSortOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 20, display: 'flex', alignItems: 'flex-end' }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: '#1a1a1a', width: '100%', borderTopLeftRadius: 12, borderTopRightRadius: 12, paddingBottom: 60 }}>
                {[
                  { key: 'hot', label: '热门' },
                  { key: 'asc', label: '正序' },
                  { key: 'desc', label: '倒序' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortMode(opt.key); setSortOpen(false); }}
                    style={{ width: '100%', padding: '14px 12px', background: 'transparent', border: 'none', borderBottom: '1px solid #262626', color: '#fff', fontSize: 15, cursor: 'pointer' }}
                  >{opt.label}</button>
                ))}
                <button onClick={() => setSortOpen(false)} style={{ width: '100%', padding: '14px 12px', background: '#0f0f0f', border: 'none', color: '#9ca3af', fontSize: 15, cursor: 'pointer' }}>取消</button>
              </div>
            </div>
          )}

          {/* 回复列表 */}
          <div style={{ padding: '8px 12px' }}>
            {sortedReplies.length === 0 ? (
              <div className="nv-placeholder" style={{ color: '#9ca3af', padding: '16px 0' }}>终端内没有检测到回复</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sortedReplies.map((r) => (
                  <div key={r.id} style={{ background: '#151515', border: '1px solid #222', borderRadius: 8, padding: 10 }}>
                    {/* 用户信息栏 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {r.author_avatar_url ? (
                        <img src={r.author_avatar_url} alt={r.author_name} style={getAvatarStyle(r, 34)} />
                      ) : (
                        <div style={getAvatarStyle(r, 34)}>{(r.author_name || '?')[0]}</div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 14 }}>
                          <Link to={`/u/${r.author_uid}`} style={getNicknameStyle(r.nickname_color)}>{r.author_name}</Link>
                          <span style={{ marginLeft: 6, fontSize: 11, color: '#9ca3af' }}>Lv.{r.level || 1}</span>
                          <span style={{ marginLeft: 8, fontSize: 11, color: '#6b7280' }}>#{r.floor}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{formatDate(r.created_at)}</div>
                      </div>
                      {/* 点赞按钮 */}
                      <button
                        onClick={() => handleToggleLike(r.id, r.likes, r.hasLiked, r.user_id, true)}
                        className="nav-cta"
                        style={{ background: 'transparent', border: 'none', color: r.hasLiked ? '#ff4d4f' : '#e5e7eb', cursor: 'pointer' }}
                        title={r.hasLiked ? '取消点赞' : '点赞'}
                      >
                        <span style={{ marginRight: 4, fontSize: 13, color: r.hasLiked ? '#ff4d4f' : '#9ca3af' }}>{r.likes || 0}</span>
                        {r.hasLiked ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        )}
                      </button>
                    </div>

                    {/* 回复内容区 */}
                    <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.7, color: '#e5e7eb' }}>
                      <div dangerouslySetInnerHTML={{ __html: r.content }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 底部操作栏：输入 + 帖子点赞 */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 10, background: '#0f0f0f', borderTop: '1px solid #1f1f1f', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#151515', border: '1px solid #222', borderRadius: 18, padding: '6px 10px' }}>
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onFocus={() => { if (!currentUser?.is_logged_in) navigate('/terminal/login'); }}
            placeholder="来说点什么吧..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e5e7eb', fontSize: 14 }}
          />
          <button onClick={handleSendReply} className="nav-cta primary" style={{ padding: '6px 10px', fontSize: 13 }}>发送</button>
        </div>
        <button
          onClick={() => handleToggleLike(mainPost.id, mainPost.likes, mainPost.hasLiked, mainPost.user_id, false)}
          className="nav-cta"
          style={{ background: '#151515', border: '1px solid #222', borderRadius: 18, padding: '8px 10px', color: mainPost.hasLiked ? '#ff4d4f' : '#e5e7eb' }}
          title={mainPost.hasLiked ? '取消点赞' : '点赞'}
        >
          <span style={{ marginRight: 4, fontSize: 13, color: mainPost.hasLiked ? '#ff4d4f' : '#9ca3af' }}>{mainPost.likes || 0}</span>
          {mainPost.hasLiked ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          )}
        </button>
      </div>

      <SiteFooter />
    </div>
  );
};

export default MobileThreadPage;
