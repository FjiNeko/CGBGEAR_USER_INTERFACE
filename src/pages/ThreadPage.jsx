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
import { useParams, useNavigate, Link } from 'react-router-dom';
import "../css/main.css";

import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import { useAuth } from "../context/AuthContext";
import { useNotice } from '../context/NoticeContext'; // [引入] Notice Context

import {
  getForumModules, getThreadDetail, createReply, getPostReplies,
  likePost, unlikePost, likeReply,
} from "../api/api";
import { buildSearchId } from "../utils/auth";
import { formatDate } from '../utils/dateUtils';

// Tiptap
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link as LinkExtension } from '@tiptap/extension-link';

// =========================================================================
// 样式辅助函数
// =========================================================================

// 1. 头像样式生成 (修复版)
const getAvatarStyle = (user, size = 96) => {
  const avatarUrl = user.author_avatar_url || user.avatar_url;
  
  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.startsWith('http')) {
    return { 
      backgroundImage: `url(${avatarUrl})`, 
      backgroundSize: 'cover', 
      backgroundPosition: 'center', 
      borderRadius: '4px',
      width: `${size}px`,
      height: `${size}px`
    };
  }

  const name = user.author_name || user.name || '?';
  const colors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#009688', '#4caf50', '#ff9800', '#795548'];
  const index = name.charCodeAt(0) % colors.length;
  
  return {
    backgroundColor: colors[index],
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${size * 0.4}px`, // 动态字体大小
    fontWeight: 'bold',
    textTransform: 'uppercase',
    borderRadius: '4px',
    width: `${size}px`,
    height: `${size}px`
  };
};

// 2. 昵称特权颜色 (修复版)
const getNicknameStyle = (colorCode) => {
  if (!colorCode) return { color: '#e3e3e3', textDecoration: 'none' };
  
  const baseStyle = { textDecoration: 'none', fontWeight: 'bold' };

  if (colorCode === 'rainbow-text') {
    return { 
      ...baseStyle,
      backgroundImage: 'linear-gradient(to right, red, orange, yellow, #00ff00, #00c6ff, indigo, violet)', 
      WebkitBackgroundClip: 'text', 
      color: 'transparent'
    };
  }
  if (colorCode === 'gold-text') {
     return { 
       ...baseStyle,
       color: '#FFD700', 
       textShadow: '0 0 5px rgba(255, 215, 0, 0.4)' 
      };
  }
  if (colorCode === 'aurora-text') {
    return { 
      ...baseStyle,
      backgroundImage: 'linear-gradient(135deg, #00c6ff, #0072ff)', 
      WebkitBackgroundClip: 'text', 
      color: 'transparent'
    };
  }
  // Hex 颜色回退
  return { ...baseStyle, color: colorCode };
};

// 3. 称号样式解析
const parseTitleStyle = (cssString) => {
  if (!cssString) return {};
  return cssString.split(';').reduce((acc, rule) => {
    const [k, v] = rule.split(':');
    if (k && v) acc[k.trim().replace(/-./g, x=>x[1].toUpperCase())] = v.trim();
    return acc;
  }, {});
};

// =========================================================================
// 组件: PostItem (单层楼)
// =========================================================================
const PostItem = ({ post, index, isThreadStarter, currentUser, onToggleLike, isReply = false }) => {
  const { showNotice } = useNotice();
  
  // 数据标准化 (兼容主贴和回复的数据结构)
  const authorName = post.author_name || post.name || 'Unknown';
  const authorUid = post.author_uid;
  const authorAvatarUrl = post.author_avatar_url || post.avatar_url;
  const nicknameColor = post.nickname_color;
  const badges = post.author_badges || post.badges || [];
  const title = post.author_title || post.title_info || null;
  const userId = post.user_id; // 作者 ID

  const canLike = currentUser?.is_logged_in && currentUser.user_id !== userId;

  // 处理点赞点击
  const handleLikeClick = () => {
    if (!currentUser?.is_logged_in) {
      showNotice("请先登录才能点赞！", 'error');
      return;
    }
    if (currentUser.user_id === userId) {
      showNotice(`不能点赞自己的${isReply ? '回复' : '帖子'}哦！`, 'warning');
      return;
    }
    onToggleLike(post.id, post.likes, post.hasLiked, userId, isReply);
  };

  return (
    <div className="message-container" id={`${isReply ? 'reply' : 'post'}-${post.id}`} style={{ marginBottom: '15px', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #333', overflow: 'hidden' }}>
      
      {/* 1. 顶部元数据条 */}
      <div className="message-header" style={{ padding: '8px 15px', background: '#252525', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <span>{formatDate(post.created_at || post.time)}</span>
          {isThreadStarter && <span style={{ color: '#000', background: '#eab308', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold', fontSize: '10px' }}>楼主</span>}
        </div>
        <div>
          <a href={`#${isReply ? 'reply' : 'post'}-${post.id}`} style={{ color: '#555', textDecoration: 'none' }}>#{isReply ? post.floor : '1'}</a>
        </div>
      </div>

      <div className="message-inner" style={{ display: 'flex', flexDirection: 'row', minHeight: '200px' }}>
        
        {/* 2. 左侧：用户信息栏 */}
        <div className="message-cell message-user" style={{
          width: '160px',
          background: '#1f1f1f',
          padding: '20px 10px',
          textAlign: 'center',
          borderRight: '1px solid #333',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* 头像 */}
          <div style={{ marginBottom: '15px' }}>
             {authorAvatarUrl ? (
                <img src={authorAvatarUrl} alt={authorName} style={{ width: '96px', height: '96px', borderRadius: '6px', objectFit: 'cover', border: '2px solid #333' }} />
             ) : (
                <div style={getAvatarStyle({ author_name: authorName, author_avatar_url: null }, 96)}>
                  {authorName[0]}
                </div>
             )}
          </div>

          {/* 昵称 (带颜色) */}
          <h4 style={{ fontSize: '15px', margin: '0 0 5px 0', wordBreak: 'break-word', lineHeight: '1.4' }}>
            <Link to={`/u/${authorUid}`} style={getNicknameStyle(nicknameColor)}>
              {authorName}
            </Link>
          </h4>
          
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>Lv.{post.level || 1}</div>

          {/* [新增] CGB 点数 */}
          <div style={{ width: '100%', padding: '0 10px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '4px 0', fontSize: '11px', color: '#bbb' }}>
              <span style={{ color: '#a3e635', fontWeight: 'bold' }}>{post.cgb_points || 0}</span> CGB
            </div>
          </div>

          {/* [新增] 荣誉徽章 (前3个) */}
          {badges && badges.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '12px', width: '100%', padding: '0 5px' }}>
              {badges.map((badge, idx) => (
                <div key={idx} title={badge.name} style={{ width: '24px', height: '24px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {badge.icon_url ? <img src={badge.icon_url} alt={badge.name} style={{width:'100%', height:'100%'}} /> : <span style={{fontSize:'10px'}}>🏅</span>}
                </div>
              ))}
            </div>
          )}

          {/* [新增] 佩戴的称号 */}
          {title && (
            <div style={{ marginBottom: '10px' }}>
              <span style={{ 
                display: 'inline-block',
                padding: '2px 8px', 
                borderRadius: '3px',
                fontSize: '10px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#aaa',
                ...parseTitleStyle(title.style_css) // 应用数据库中的自定义 CSS
              }}>
                {title.name}
              </span>
            </div>
          )}

        </div>

        {/* 3. 右侧：内容区 */}
        <div className="message-cell message-main" style={{ flex: 1, padding: '0', display: 'flex', flexDirection: 'column', minWidth: 0, background: '#1a1a1a' }}>
          
          {/* 实际内容 */}
          <div className="message-content" style={{ padding: '25px', fontSize: '15px', lineHeight: '1.7', color: '#ddd', minHeight: '120px' }}>
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          {/* 底部操作栏 */}
          <div className="message-footer" style={{ marginTop: 'auto', padding: '12px 25px', borderTop: '1px solid #252525', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', fontSize: '13px' }}>
            
            {/* 点赞 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: post.hasLiked ? '#ff4d4f' : '#666', fontSize: '14px', fontWeight: 'bold' }}>{post.likes || 0}</span>
              <button
                onClick={handleLikeClick}
                className="like-button"
                title={post.hasLiked ? "取消点赞" : "点赞"}
                style={{
                  background: 'none', border: 'none',
                  color: post.hasLiked ? '#ff4d4f' : '#888',
                  cursor: canLike ? 'pointer' : 'not-allowed',
                  fontSize: '18px', padding: '4px', borderRadius: '4px',
                  display: 'flex', alignItems: 'center', opacity: canLike ? 1 : 0.5,
                  transition: 'transform 0.1s'
                }}
              >
                {post.hasLiked ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                )}
              </button>
            </div>

            {/* 回复 (目前只做锚点跳转到快速回复框) */}
            {currentUser?.is_logged_in && (
              <button 
                className="text-btn" 
                onClick={() => document.getElementById('quick-reply-box')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ background: 'none', border: 'none', color: '#a3e635', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <i className="ri-reply-line"></i> 回复
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// =========================================================================
// 主页面：ThreadPage (帖子详情页)
// =========================================================================

const ThreadPage = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { showNotice } = useNotice(); // [Context]

  // 状态
  const [navSolid, setNavSolid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [threadData, setThreadData] = useState(null);
  const [mainPost, setMainPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [error, setError] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ label: '论坛', link: '/forum' }]);

  const [repliesCurrentPage, setRepliesCurrentPage] = useState(1);
  const [repliesTotalPages, setRepliesTotalPages] = useState(1);
  const repliesLimit = 10;

  useEffect(() => {
    const handleScroll = () => setNavSolid(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 核心数据获取逻辑
  useEffect(() => {
    const fetchThreadAndReplies = async () => {
      if (!threadId) return;

      setLoading(true);
      setError(null);

      try {
        // 1. 获取主贴详情
        const threadResponse = await getThreadDetail(threadId);
        if (threadResponse.code !== 200 || !threadResponse.data) {
          setError(threadResponse.message || "未能获取帖子详情。");
          setLoading(false);
          return;
        }

        const details = threadResponse.data;
        setThreadData(details);

        // 格式化主贴数据
        // 注意：PostItem 需要的数据结构在这里构建
        const formattedMainPost = {
          id: details.id,
          title: details.title,
          content: details.content,
          created_at: details.created_at,
          view_count: details.view_count,
          reply_count: details.reply_count,
          is_locked: details.is_locked,
          tags: details.tags,
          
          // 作者信息 (从后端新字段获取)
          user_id: details.user_id,
          author_uid: details.author_uid,
          author_name: details.author_name,
          author_avatar_url: details.author_avatar_url,
          nickname_color: details.nickname_color, // [新增]
          author_badges: details.author_badges,   // [新增]
          author_title: details.author_title,     // [新增]
          level: details.level,
          cgb_points: details.cgb_points,
          
          likes: details.likes || 0,
          hasLiked: details.has_liked || false,
        };
        setMainPost(formattedMainPost);

        // 2. 获取回复
        await fetchReplies(threadId, repliesCurrentPage);

        // 3. 构建面包屑
        const modulesResult = await getForumModules();
        const allModules = modulesResult.data || [];
        let subsectionName = "未知版块";
        let subsectionLink = "/forum";
        
        // 简单的查找逻辑
        outerLoop:
        for (const section of allModules) {
            if (section.subsections) {
                for (const sub of section.subsections) {
                    if (sub.id === details.subsection_id) {
                        subsectionName = sub.name;
                        subsectionLink = sub.link_path;
                        break outerLoop;
                    }
                }
            }
        }
        
        setBreadcrumbs([
          { label: '论坛', link: '/forum' },
          { label: subsectionName, link: subsectionLink },
        ]);

      } catch (e) {
        console.error("ThreadPage Error:", e);
        setError("加载主题失败，请稍后重试。");
      } finally {
        setLoading(false);
      }
    };

    fetchThreadAndReplies();
  }, [threadId, repliesCurrentPage]);

  // 独立获取回复函数
  const fetchReplies = async (postId, page) => {
    try {
      const res = await getPostReplies(postId, { page, limit: repliesLimit });
      if (res.code === 200 && res.data) {
        // 后端现在返回的数据已经包含 badges, title, nickname_color
        // 这里需要展平一下结构以适应 PostItem
        const formattedReplies = res.data.map(r => ({
          id: r.id,
          content: r.content,
          created_at: r.time,
          floor: r.floor,
          likes: r.likes,
          hasLiked: r.hasLiked,
          
          // 作者数据展平
          user_id: r.author.user_id,
          author_uid: r.author.uid,
          author_name: r.author.name,
          author_avatar_url: r.author.avatar_url,
          nickname_color: r.author.nickname_color, // [新增]
          author_badges: r.author.badges,         // [新增]
          author_title: r.author.title,           // [新增]
          level: r.author.level,
          cgb_points: r.author.cgb_points
        }));
        setReplies(formattedReplies);
        // 如果后端支持总数，这里 setRepliesTotalPages
      }
    } catch (err) {
      console.error("Fetch replies failed:", err);
      showNotice("获取回复列表失败", 'error');
    }
  };

  // 统一处理点赞
  const handleToggleLike = useCallback(async (id, currentLikes, hasLiked, userId, isReply) => {
    // 乐观更新 UI
    if (isReply) {
      setReplies(prev => prev.map(r => r.id === id ? { ...r, likes: hasLiked ? r.likes - 1 : r.likes + 1, hasLiked: !hasLiked } : r));
    } else {
      setMainPost(prev => prev ? { ...prev, likes: hasLiked ? prev.likes - 1 : prev.likes + 1, hasLiked: !hasLiked } : null);
    }

    try {
      if (isReply) {
        if (hasLiked) {
           // await unlikeReply(id); // 暂无接口
           showNotice("取消点赞回复功能暂不可用", 'info');
           // 回滚
           setReplies(prev => prev.map(r => r.id === id ? { ...r, likes: currentLikes, hasLiked: true } : r));
        } else {
           await likeReply(id);
        }
      } else {
        if (hasLiked) {
          await unlikePost(id);
        } else {
          await likePost(id);
        }
      }
    } catch (err) {
      showNotice(err.message || "操作失败", 'error');
      // 错误回滚
      if (isReply) {
        setReplies(prev => prev.map(r => r.id === id ? { ...r, likes: currentLikes, hasLiked: hasLiked } : r));
      } else {
        setMainPost(prev => prev ? { ...prev, likes: currentLikes, hasLiked: hasLiked } : null);
      }
    }
  }, [showNotice]);

  // 编辑器
  const replyEditor = useEditor({
    extensions: [StarterKit, Image, LinkExtension.configure({ autolink: true })],
    content: '',
    editorProps: {
      attributes: {
        class: 'editor-content', // 添加类名以便 styling
        style: 'min-height: 150px; padding: 15px; color: #e0e0e0; outline: none;'
      }
    }
  });

  const handleQuickReply = async () => {
    if (!currentUser?.is_logged_in) {
      showNotice('请先登录才能回复。', 'warning');
      navigate('/terminal/login');
      return;
    }
    if (!replyEditor || replyEditor.isEmpty) {
      showNotice("请输入回复内容。", 'warning');
      return;
    }

    try {
      const contentHtml = replyEditor.getHTML();
      const res = await createReply(threadId, contentHtml);
      if (res && res.code === 201) {
        showNotice("回复成功！+2 CGB", 'success');
        replyEditor.commands.clearContent();
        await fetchReplies(threadId, repliesCurrentPage);
        setMainPost(prev => ({...prev, reply_count: (prev.reply_count || 0) + 1}));
      } else {
        showNotice(res?.msg || "回复失败", 'error');
      }
    } catch (err) {
      showNotice("回复请求失败", 'error');
    }
  };

  if (loading || authLoading) return <div className="page"><MainNav navSolid={true} /><div style={{ paddingTop: 100, textAlign: 'center', color: '#888' }}><i className="ri-loader-4-line ri-spin"></i> 正在加载主题...</div><SiteFooter /></div>;
  if (error || !threadData || !mainPost) return <div className="page"><MainNav navSolid={true} /><div style={{ paddingTop: 100, textAlign: 'center', color: '#dc3545' }}>{error || "主题不存在。"}</div><SiteFooter /></div>;

  return (
    <div className="page">
      <MainNav navSolid={navSolid} />

      <main className="main-wrapper" style={{ paddingTop: '80px', minHeight: '100vh', paddingBottom: '50px' }}>
        <div className="forum-content-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* 1. Header */}
          <div className="forum-header" style={{ marginBottom: '20px', padding: '0 10px' }}>
            <h1 style={{ fontSize: '24px', color: '#fff', marginBottom: '10px', lineHeight: '1.4' }}>
              {mainPost.is_locked && <span style={{ marginRight: '10px' }}>🔒</span>}
              {mainPost.title}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '13px', color: '#888', alignItems: 'center', marginBottom: '15px' }}>
              <span>
                <span style={getNicknameStyle(mainPost.nickname_color)}>{mainPost.author_name}</span> 
                {' '}发布于 {formatDate(mainPost.created_at)}
              </span>

              {mainPost.tags && mainPost.tags.length > 0 && (
                <>
                  <span style={{color: '#444'}}>|</span>
                  {mainPost.tags.map(tag => (
                    <span key={tag} style={{ background: '#333', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>{tag}</span>
                  ))}
                </>
              )}

              <span style={{ marginLeft: 'auto' }}>👀 {mainPost.view_count}</span>
              <span>💬 {mainPost.reply_count}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #222', paddingTop: '10px' }}>
              <nav className="breadcrumbs" style={{ fontSize: '13px' }}>
                {breadcrumbs.map((crumb, i) => (
                  <span key={i}>
                    <Link to={crumb.link} style={{ color: '#a3e635', textDecoration: 'none' }}>{crumb.label}</Link>
                    <span style={{ margin: '0 6px', color: '#666' }}>/</span>
                  </span>
                ))}
                <span style={{ color: '#aaa' }}>当前主题</span>
              </nav>

              {currentUser?.is_logged_in && (
                <button 
                  className="nav-cta" 
                  style={{ fontSize: '13px', padding: '6px 16px' }} 
                  onClick={() => document.getElementById('quick-reply-box')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  回复主题
                </button>
              )}
            </div>
          </div>

          {/* 2. 主贴 */}
          <PostItem
            post={mainPost}
            index={0}
            isThreadStarter={true}
            currentUser={currentUser}
            onToggleLike={handleToggleLike}
            isReply={false}
          />

          {/* 3. 回复列表 */}
          {replies.length > 0 && (
            <div className="replies-section" style={{ marginTop: '30px' }}>
              <div style={{ 
                padding: '10px', 
                background: '#1a1a1a', 
                borderBottom: '2px solid #a3e635', 
                marginBottom: '15px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'inline-block'
              }}>
                所有回复 ({replies.length})
              </div>
              
              <div className="post-list-stream">
                {replies.map((reply, index) => (
                  <PostItem
                    key={reply.id}
                    post={reply}
                    index={index}
                    isThreadStarter={false}
                    currentUser={currentUser}
                    onToggleLike={handleToggleLike}
                    isReply={true}
                  />
                ))}
              </div>
              
              {/* 分页 (简易版) */}
              {repliesTotalPages > 1 && (
                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                   {/* ... 分页按钮逻辑 ... */}
                   <span style={{color:'#666', fontSize:'13px'}}>分页功能暂未完全接入</span>
                </div>
              )}
            </div>
          )}

          {/* 4. 快速回复编辑器 */}
          <div id="quick-reply-box" style={{ marginTop: '40px', marginBottom: '40px' }}>
            {currentUser?.is_logged_in ? (
              <div
                className="nv-panel"
                style={{
                  border: '1px solid #333',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: '#1a1a1a',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div className="panel-header" style={{ background: '#252525', borderBottom: '1px solid #333', padding: '10px 15px', display: 'flex', alignItems: 'center' }}>
                  <i className="ri-edit-2-line" style={{marginRight:'8px', color:'#a3e635'}}></i>
                  <h3 style={{ color: '#fff', fontSize: '14px', margin: 0 }}>快速回复</h3>
                </div>

                <div className="nv-body" style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* 工具栏 */}
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid #333', display: 'flex', gap: '5px', background: '#202020' }}>
                    <button onClick={() => replyEditor?.chain().focus().toggleBold().run()} className="uc-btn secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>B</button>
                    <button onClick={() => replyEditor?.chain().focus().toggleItalic().run()} className="uc-btn secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>I</button>
                  </div>

                  {/* 修复：给编辑器容器加背景色，防止透明 */}
                  <div style={{ background: '#161616' }}>
                     <EditorContent editor={replyEditor} />
                  </div>

                  <div style={{ padding: '15px', background: '#202020', borderTop: '1px solid #333', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#666', marginRight: '15px' }}>注意文明用语</span>
                    <button onClick={handleQuickReply} className="nav-cta primary" style={{ fontSize: '14px', padding: '8px 24px' }}>
                      发表回复
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', background: '#1a1a1a', borderTop: '2px solid #a3e635', marginTop: '20px' }}>
                <p style={{ color: '#ccc', marginBottom: '20px' }}>您需要登录后才能参与讨论。</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                  <button onClick={() => navigate('/terminal/login')} className="nav-cta primary">立即登录</button>
                  <button onClick={() => navigate('/terminal/register')} className="nav-cta">注册账号</button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ThreadPage;
