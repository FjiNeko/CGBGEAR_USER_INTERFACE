// src/pages/ForumCategoryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import "../css/main.css";

import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import { useAuth } from "../context/AuthContext";
// 引入 Notice Context
import { useNotice } from '../context/NoticeContext';
// 确保引入了所有需要的 API 函数
import { getForumModules, getForumPosts, likePost, unlikePost } from "../api/api";
import { buildSearchId } from "../utils/auth";
import { formatDate } from '../utils/dateUtils';

// ==========================================================
// 辅助函数 (样式与逻辑)
// ==========================================================

// 默认头像样式生成器
const generateAvatarStyle = (username) => {
  const name = username || '?';
  const colors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#009688', '#4caf50', '#ff9800', '#795548'];
  const index = name.charCodeAt(0) % colors.length;
  return {
    backgroundColor: colors[index],
    color: '#fff',
    width: '40px',
    height: '40px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  };
};

// 昵称特权颜色样式生成器 (与 UserCenterPage 保持一致)
const getNicknameStyle = (colorCode) => {
  if (!colorCode) return {};
  
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

// ==========================================================
// 主组件
// ==========================================================

const ForumCategoryPage = () => {
  const { categorySlug, subCategorySlug } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth(); 
  const { showNotice } = useNotice(); 

  const [currentCategory, setCurrentCategory] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --------------------------------------------------------
  // 数据获取逻辑
  // --------------------------------------------------------

  // 1. 获取帖子列表的具体的实现函数
  const fetchRealThreads = useCallback(async (subsectionId, page) => {
    try {
      const res = await getForumPosts({
        subsection_id: subsectionId,
        page: page,
        limit: 20
      });

      if (res.code === 200) {
        // 数据映射：后端字段 -> 前端组件需要的字段
        const mappedThreads = res.data.posts.map(post => ({
          id: post.id,
          title: post.title,
          isSticky: post.isSticky, 
          isFeatured: post.isFeatured, 
          
          // 作者信息
          author: post.author || 'Unknown', 
          authorId: post.author_uid, 
          authorUserId: post.author_user_id, // 数据库 ID，用于判断是否是自己
          authorAvatarUrl: post.author_avatar_url, // 头像 URL
          nicknameColor: post.nickname_color, // 昵称颜色

          publishDate: post.publishDate || '未知日期',
          
          // 统计数据
          replies: post.replies || 0,
          views: post.views || 0,
          likes: post.likes || 0,
          
          // 点赞状态 (由后端 has_liked 决定)
          hasLiked: post.has_liked || false, 

          lastReply: {
            user: post.lastReply.user || '未知',
            time: post.lastReply.time || '未知时间'
          },
          link: `/thread/${post.id}`
        }));

        setThreads(mappedThreads);
        setTotalPages(Math.ceil(res.data.total / res.data.limit));
      } else {
        setError(res.msg || "获取帖子列表失败。");
        setThreads([]);
      }
    } catch (err) {
      console.error("获取帖子列表失败:", err);
      setError(typeof err === 'string' ? err : "获取帖子列表网络错误。");
      setThreads([]);
    }
  }, []);

  // 2. 初始化：解析 URL -> 获取版块 ID -> 获取帖子
  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      setError(null);
      try {
        // 获取所有模块结构
        const modulesResult = await getForumModules();
        const allModules = modulesResult.data || [];

        // 查找当前 URL 对应的版块
        const targetSlug = subCategorySlug || categorySlug;
        let foundSubSection = null;
        let parentGroup = null;

        for (const group of allModules) {
          if (group.subsections && Array.isArray(group.subsections)) {
            const match = group.subsections.find(sub => {
              if (!sub) return false;
              const sId = sub.id.toString();
              // 简单处理：匹配 ID 或者 link_path 的最后一段
              const sPath = sub.link_path ? sub.link_path.toLowerCase() : "";
              const pathSegments = sPath.split('/');
              const lastSegment = pathSegments[pathSegments.length - 1];
              return (sId === targetSlug || lastSegment === targetSlug);
            });
            if (match) {
              foundSubSection = match;
              parentGroup = group;
              break;
            }
          }
        }

        if (foundSubSection) {
          setCurrentCategory({
            id: foundSubSection.id,
            nameCn: foundSubSection.name,
            path: [
              { label: '论坛首页', link: '/forum' },
              { label: parentGroup.name, link: `/forum/${encodeURIComponent(parentGroup.name.toLowerCase())}` },
              { label: foundSubSection.name, link: foundSubSection.link_path || '#' }
            ]
          });
          // 开始获取帖子
          await fetchRealThreads(foundSubSection.id, currentPage);
        } else {
          setError(`未找到版块: ${targetSlug}`);
        }
      } catch (err) {
        console.error("Init failed:", err);
        setError("加载失败，请刷新重试。");
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [categorySlug, subCategorySlug, currentPage, fetchRealThreads]); 


  // --------------------------------------------------------
  // 交互逻辑
  // --------------------------------------------------------

  // 处理点赞/取消点赞
  const handleToggleLikePost = useCallback(async (postId, currentLikes, hasLiked, authorUserId) => {
    // 1. 权限检查
    if (!currentUser || !currentUser.is_logged_in) {
      showNotice("请先登录才能点赞！", 'error');
      return;
    }
    if (currentUser.user_id === authorUserId) {
        showNotice("不能点赞自己的帖子哦！", 'warning');
        return;
    }

    // 2. 乐观更新 (Optimistic UI Update)
    // 先假装成功，更新 UI，如果后端报错再滚回
    setThreads(prevThreads =>
      prevThreads.map(thread =>
        thread.id === postId 
          ? { ...thread, likes: hasLiked ? thread.likes - 1 : thread.likes + 1, hasLiked: !hasLiked } 
          : thread
      )
    );

    try {
      if (hasLiked) {
        await unlikePost(postId);
        // showNotice("已取消点赞", 'success'); // 可选：太频繁的提示会打扰用户
      } else {
        await likePost(postId);
        // showNotice("点赞成功", 'success');
      }
    } catch (error) {
      console.error(`点赞操作失败:`, error);
      const errorMessage = typeof error === 'string' ? error : "操作失败，请稍后再试。";
      showNotice(errorMessage, 'error');
      
      // 3. 错误回滚
      setThreads(prevThreads =>
        prevThreads.map(thread =>
          thread.id === postId 
            ? { ...thread, likes: currentLikes, hasLiked: hasLiked } // 恢复原状
            : thread
        )
      );
    }
  }, [currentUser, showNotice]);

  const handleLogin = useCallback(() => {
    const params = new URLSearchParams({ id: buildSearchId(), view: "pc", broswer: "chrome" });
    navigate(`/terminal/login?${params.toString()}`);
  }, [navigate]);

  const handleRegister = useCallback(() => navigate('/terminal/register'), [navigate]);

  const handleNewPost = useCallback(() => {
    if (currentCategory && currentCategory.id) {
        navigate(`/forum/new-post?subsection_id=${currentCategory.id}`);
    } else {
        showNotice('无法确定版块ID，请稍后重试。', 'error');
    }
  }, [currentCategory, navigate, showNotice]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  }, [totalPages]);


  // --------------------------------------------------------
  // 渲染
  // --------------------------------------------------------

  if (loading && !currentCategory) return <div className="page"><MainNav navSolid={true} /><div style={{ paddingTop: 120, textAlign: 'center', color: '#888' }}><i className="ri-loader-4-line ri-spin"></i> 正在加载版块信息...</div><SiteFooter /></div>;
  if (error || !currentCategory) return <div className="page"><MainNav navSolid={true} /><div style={{ paddingTop: 120, textAlign: 'center', color: '#dc3545' }}>{error}</div><SiteFooter /></div>;

  return (
    <div className="page">
      <MainNav navSolid={true} />

      <main className="main-wrapper" style={{ paddingTop: '80px', minHeight: '80vh', paddingBottom: '50px' }}>
        <div className="forum-container">

          {/* Header */}
          <div className="forum-header-section">
            <div className="forum-header-title">
              <h1>{currentCategory.nameCn}</h1>
              <div className="forum-header-meta">
                {currentCategory.path.map((item, idx) => (
                  <span key={idx}>
                    <Link to={item.link} style={{ color: '#a3e635', textDecoration: 'none' }}>{item.label}</Link>
                    {idx < currentCategory.path.length - 1 && <span style={{ margin: '0 8px', color: '#666' }}>/</span>}
                  </span>
                ))}
              </div>
            </div>

            <div>
              {currentUser?.is_logged_in && (
                <button onClick={handleNewPost} className="nav-cta primary" style={{ padding: '10px 24px', fontSize: '14px' }}>
                  <i className="ri-pencil-line" style={{ marginRight: 5 }}></i> 发表新主题
                </button>
              )}
            </div>
          </div>

          <div className="forum-grid-layout">

            {/* 左侧列表 */}
            <div className="left-content">

              <div style={{ background: '#222', padding: '10px 15px', borderBottom: '1px solid #333', borderRadius: '4px 4px 0 0', display: 'flex', gap: '20px', fontSize: '13px', color: '#888' }}>
                <span style={{ color: '#fff', borderBottom: '2px solid #a3e635', paddingBottom: '8px', marginBottom: '-11px', cursor: 'pointer' }}>最新回复</span>
                <span style={{ cursor: 'pointer' }}>最新发布</span> 
              </div>

              <div className="thread-list-container">
                {threads.length > 0 ? threads.map(thread => (
                  <div key={thread.id} className="thread-item">

                    {/* 头像区域 */}
                    <div className="thread-avatar">
                      {thread.authorAvatarUrl && thread.authorAvatarUrl.startsWith('http') ? (
                         <img 
                           src={thread.authorAvatarUrl} 
                           alt={thread.author} 
                           style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                         />
                      ) : (
                        <div style={generateAvatarStyle(thread.author)}>
                          {(thread.author && thread.author[0]) || '?'}
                        </div>
                      )}
                    </div>

                    {/* 主内容区域 */}
                    <div className="thread-main">
                      <Link to={thread.link} className="thread-link">
                        {thread.isSticky && <span style={{ color: '#eab308', marginRight: '6px' }} title="置顶">📌</span>}
                        {thread.isFeatured && <span style={{ color: '#ff4d4f', marginRight: '6px' }} title="精华">🔥</span>}
                        {thread.title}
                      </Link>
                      
                      <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                        {/* 用户名 (应用特权颜色) */}
                        <span style={{ marginRight: '5px', ...getNicknameStyle(thread.nicknameColor) }}>
                          {thread.author}
                        </span>
                        发布于 {thread.publishDate}

                        {/* 点赞按钮 */}
                        <div style={{ marginLeft: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ color: thread.hasLiked ? '#ff4d4f' : '#ccc', fontSize: '13px' }}>{thread.likes}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault(); 
                              e.stopPropagation(); 
                              handleToggleLikePost(thread.id, thread.likes, thread.hasLiked, thread.authorUserId);
                            }}
                            className="like-button"
                            title={thread.hasLiked ? "取消点赞" : "点赞"}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: thread.hasLiked ? '#ff4d4f' : '#666', 
                              cursor: (currentUser?.is_logged_in && currentUser.user_id === thread.authorUserId) ? 'not-allowed' : 'pointer',
                              fontSize: '16px',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              opacity: (currentUser?.is_logged_in && currentUser.user_id === thread.authorUserId) ? 0.5 : 1,
                            }}
                          >
                             {/* 使用 SVG 图标 */}
                            {thread.hasLiked ? (
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                            ) : (
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 统计数据 */}
                    <div className="thread-stats">
                      <div><span style={{ color: '#ddd' }}>{thread.replies}</span> 回复</div>
                      <div><span style={{ color: '#666' }}>{thread.views}</span> 查看</div>
                    </div>

                    {/* 最后回复 */}
                    <div className="thread-last-post">
                      <div style={{ fontSize: '11px', color: '#888', textAlign: 'right' }}>
                        <div>{thread.lastReply.user}</div>
                        <div>{thread.lastReply.time}</div>
                      </div>
                    </div>

                  </div>
                )) : (
                  <div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>
                    这里还是一片荒原，来发布第一个帖子吧！
                  </div>
                )}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="nav-cta"
                    style={{ background: currentPage === 1 ? '#222' : '#333', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', padding: '6px 16px' }}
                  >
                    上一页
                  </button>
                  <span style={{ color: '#fff', lineHeight: '36px', margin: '0 10px', fontSize: '14px' }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="nav-cta"
                    style={{ background: currentPage === totalPages ? '#222' : '#333', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', padding: '6px 16px' }}
                  >
                    下一页
                  </button>
                </div>
              )}

            </div>

            {/* 右侧边栏 */}
            <div className="right-sidebar">
              <div className="sidebar-card">
                {currentUser?.is_logged_in ? (
                  <div className="sidebar-body" style={{ textAlign: 'center' }}>
                    {/* 当前用户头像 */}
                    {currentUser.avatar_url && typeof currentUser.avatar_url === 'string' && currentUser.avatar_url.startsWith('http') ? (
                      <img src={currentUser.avatar_url} alt="Avatar" style={{ margin: '0 auto 10px', width: '64px', height: '64px', borderRadius: '4px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ margin: '0 auto 10px', ...generateAvatarStyle(currentUser.username), width: '64px', height: '64px', fontSize: '28px' }}>
                        {(currentUser.username && currentUser.username[0]) || '?'}
                      </div>
                    )}
                    
                    {/* 用户名 (侧边栏一般不展示特权色，或可选择展示) */}
                    <h3 style={{ color: '#fff', margin: '5px 0' }}>{currentUser.username}</h3>
                    <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>{currentUser.role === 'admin' ? '管理员' : '正式会员'}</p>
                  </div>
                ) : (
                  <div className="sidebar-body" style={{ textAlign: 'center' }}>
                    <p style={{ color: '#ccc', fontSize: '13px', marginBottom: '15px' }}>登录后您可以发帖、回复并使用全部功能。</p>
                    <button onClick={handleLogin} className="nav-cta primary" style={{ width: '100%', marginBottom: '10px' }}>立即登录</button>
                    <button onClick={handleRegister} className="nav-cta" style={{ width: '100%' }}>注册账号</button>
                  </div>
                )}
              </div>

              <div className="sidebar-card">
                <div className="sidebar-header">版块公告</div>
                <div className="sidebar-body" style={{ fontSize: '13px', color: '#aaa' }}>
                  请遵守CGBGEAR社区规范，文明交流。
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ForumCategoryPage;
