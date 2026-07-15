// src/pages/ForumPage.jsx

//根据forumPage.jsx，写一个手机论坛APP的页面文件MobileForumPage.jsx，保持引用的api，context，函数引入正确
//布局如下（由上往下）：分类标签栏（整个页面左上角，api/forum/modules）、公告区、二级分类标签（api/forum/modules，获取的subsection里面）、帖子列表
//分类标签栏选中状态，字体颜色为白色且字号略大于未选中的
import React, { useState, useEffect, useCallback } from 'react';
import "../css/main.css"; // 确保 CSS 路径正确
import { useNavigate, Link } from "react-router-dom";
import MainNav from "../components/MainNav"; // 确保组件路径正确
import SiteFooter from "../components/SiteFooter"; // 确保组件路径正确

import { useAuth } from "../context/AuthContext"; // 确保 Context 路径正确

// 从 api.js 引入所需的 API 函数
import { getForumModules, getForumPosts } from "../api/api";
import { buildSearchId } from "../utils/auth"; // 确保工具函数路径正确

// =========================================================================
// ForumPage 组件
// =========================================================================

const ForumPage = () => {
  const [navSolid, setNavSolid] = useState(false);
  const navigate = useNavigate();

  // 从 AuthContext 解构出当前用户和登出方法
  const { user: currentUser, logout } = useAuth();

  // 论坛模块数据状态
  const [forumModules, setForumModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [modulesError, setModulesError] = useState(null);

  // 每个 subsection 的统计数据 (主题数和回复数)
  const [subsectionStats, setSubsectionStats] = useState({});
  const [loadingSubsectionStats, setLoadingSubsectionStats] = useState(true); // 用于追踪 subsection 统计数据加载状态
  const [subsectionStatsError, setSubsectionStatsError] = useState(null);

  // 论坛整体统计数据
  const [forumOverallStats, setForumOverallStats] = useState({
    registeredUsers: 12345, // 占位数据，理想情况应从后端获取
    totalPosts: 0,    // 会被计算出的总回复数更新
    totalThreads: 0,  // 会被计算出的总主题数更新
    onlineUsers: 345,   // 占位数据
    newestMember: '新玩家2026', // 占位数据
    announcement: '现已开始公开测试！感谢各位社群成员的耐心等待。' // 占位数据
  });

  // 导航栏透明/实色切换效果
  useEffect(() => {
    const handleScroll = () => {
      setNavSolid(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Effect 1: 加载论坛模块数据
  useEffect(() => {
    const fetchForumModules = async () => {
      try {
        setLoadingModules(true);
        setModulesError(null);

        const result = await getForumModules();
        setForumModules(result.data); // 假设 result.data 是模块数组
      } catch (e) {
        console.error("加载论坛模块失败:", e);
        setModulesError(e?.message || "获取论坛模块失败");
      } finally {
        setLoadingModules(false);
      }
    };

    fetchForumModules();
  }, []); // 空依赖数组，只在组件挂载时执行一次


  // Effect 2: 当论坛模块加载完成后，获取每个 subsection 的统计数据
  useEffect(() => {
    // 只有当 forumModules 不为空且已加载完成时才执行
    if (!loadingModules && forumModules.length > 0) {
      const fetchSubsectionDetails = async () => {
        setLoadingSubsectionStats(true); // 开始加载子版块统计数据
        setSubsectionStatsError(null);
        const newStats = {};
        let totalAllThreads = 0;    // 用于累积所有子版块的主题数
        let totalAllReplies = 0;  // 用于累积所有子版块的回复数

        try {
          // 收集所有子版块的请求到一个数组中
          const subsectionPromises = forumModules.flatMap(section =>
            section.subsections.map(async (subsection) => {
              try {
                // 调用 getForumPosts，只请求 limit=1 即可获取总数 (data.total)
                // 【重要提示】这里的回复数 (currentSubsectionReplies) 准确性取决于后端 API 设计。
                // getForumPosts 接口的 'total' 字段通常是主题数。
                // 如果要获取子版块总回复数，后端需要提供一个专门的聚合字段，
                // 或者前端需要遍历所有帖子并累加其回复数 (这效率低下)。
                // 当前实现是累加返回的第一页帖子（limit=1）的回复数，这通常会低估实际总回复数。
                const response = await getForumPosts({ subsection_id: subsection.id, limit: 1 });
                const currentSubsectionThreads = response.data.total; // 获取总主题数
                let currentSubsectionReplies = 0;

                if (response.data.posts && Array.isArray(response.data.posts)) {
                  // 累加第一页帖子的回复数
                  currentSubsectionReplies = response.data.posts.reduce((sum, post) => sum + (post.replies || 0), 0);
                }

                newStats[subsection.id] = {
                  threads: currentSubsectionThreads,
                  replies: currentSubsectionReplies, // 注意此处的局限性
                };

                totalAllThreads += currentSubsectionThreads;
                totalAllReplies += currentSubsectionReplies; // 累积总回复数

              } catch (subError) {
                console.error(`获取子版块 ${subsection.id} 统计数据失败:`, subError);
                // 如果某个子版块请求失败，给它一个默认值，不阻塞其他版块
                newStats[subsection.id] = { threads: 0, replies: 0 };
              }
            })
          );

          await Promise.all(subsectionPromises); // 等待所有子版块请求完成
          setSubsectionStats(newStats);

          // 更新整体论坛统计中的总主题数和总回复数
          setForumOverallStats(prevStats => ({
            ...prevStats,
            totalThreads: totalAllThreads,
            totalPosts: totalAllReplies, // 这里将累积的回复数赋值给总帖子数
          }));

        } catch (e) {
          console.error("处理子版块统计数据失败:", e);
          setSubsectionStatsError(e?.message || "获取子版块统计数据失败");
        } finally {
          setLoadingSubsectionStats(false); // 子版块统计数据加载完成
        }
      };

      fetchSubsectionDetails();
    }
  }, [forumModules, loadingModules]); // 依赖 forumModules 和 loadingModules

  // 登录操作 (使用 useCallback 优化)
  const handleLogin = useCallback(() => {
    const id = buildSearchId();
    const params = new URLSearchParams();
    params.set("id", id);
    params.set("view", "pc");
    params.set("broswer", "chrome");
    params.set("statusLogin", "0");
    navigate(`/terminal/login?${params.toString()}`);
  }, [navigate]);

  // 注册操作 (使用 useCallback 优化)
  const handleRegister = useCallback(() => {
    navigate('/terminal/register');
  }, [navigate]);

  // 登出操作 (使用 useCallback 优化)
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/");
    } catch (e) {
      console.error("ForumPage: 登出失败:", e);
    }
  }, [logout, navigate]);

  // 论坛内容加载时的显示
  // 当模块数据或子版块统计数据任何一个还在加载时，显示加载状态
  if (loadingModules || loadingSubsectionStats) {
    return (
      <div className="page">
        <MainNav navSolid={true} />
        <div className="main-wrapper" style={{ paddingTop: '80px', textAlign: 'center', paddingBottom: '50px' }}>
          <p className="nv-placeholder">正在加载论坛数据...</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  // 论坛内容加载失败时的显示
  if (modulesError || subsectionStatsError) {
    return (
      <div className="page">
        <MainNav navSolid={true} />
        <div className="main-wrapper" style={{ paddingTop: '80px', textAlign: 'center', paddingBottom: '50px', color: '#dc3545' }}>
          <p className="nv-placeholder">加载论坛数据失败: {modulesError || subsectionStatsError}</p>
          <p className="nv-placeholder">请检查后端服务是否运行，或稍后再试。</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="page">
      <MainNav navSolid={true} />

      <div className="main-wrapper" style={{ paddingTop: '80px' }}>

        {/* 欢迎 Banner */}
        <div className="hero-overlay" style={{ position: 'relative', background: 'rgba(0,0,0,0.7)', padding: '30px 24px', marginBottom: '24px', borderRadius: '6px', textAlign: 'center' }}>
          <div className="hero-tagline-label" style={{ color: '#a3e635' }}>欢迎来到我们的社区！</div>
          <h1 className="hero-tagline-title" style={{ fontSize: '28px', lineHeight: '1.4', fontWeight: '700', marginBottom: '15px' }}>
            在这里，探索无限可能，与志同道合者同行！
          </h1>

          {!currentUser?.is_logged_in ? ( // 检查用户是否实际登录
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px' }}>
              <button onClick={handleRegister} className="nav-cta primary" style={{ fontSize: '16px', padding: '10px 20px' }}>
                立即注册
              </button>
              <button onClick={handleLogin} className="nav-cta" style={{ fontSize: '16px', padding: '10px 20px' }}>
                登录
              </button>
            </div>
          ) : (
            <p className="hero-tagline-sub" style={{ fontSize: '15px', color: '#e5e7eb', maxWidth: '600px', margin: 'auto' }}>
              很高兴再次见到您，{currentUser.username}！开始探索最新话题吧。
            </p>
          )}
        </div>

        {/* 系统公告区 */}
        {forumOverallStats.announcement && (
          <div className="nv-panel" style={{ marginBottom: '24px' }}>
            <div className="panel-header">
              <h3 className="panel-title-main" style={{ color: '#6ef500' }}>系统公告</h3>
              <p className="panel-title-sub">重要通知</p>
            </div>
            <div className="nv-body">
              <p className="nv-placeholder" style={{ color: '#e5e7eb' }}>
                {forumOverallStats.announcement}
              </p>
            </div>
          </div>
        )}

        <div className="two-column">
          {/* 左侧栏: 论坛模块 */}
          <div className="left-column">
            {forumModules.map(section => (
              <div key={section.id} className="forum-main-category" style={{ marginBottom: '30px' }}>
                <div className="section-header" style={{ marginBottom: '15px', padding: '0 5px' }}>
                  <h2 className="section-title" style={{ fontSize: '18px' }}>
                    <span style={{ color: 'inherit' }}>{section.name}</span>
                  </h2>
                </div>

                <div className="post-list" style={{ marginBottom: '20px' }}>
                  {section.subsections.map(subsection => {
                    // 从状态中获取当前 subsection 的统计数据，如果尚未加载则默认为0
                    const stats = subsectionStats[subsection.id] || { threads: 0, replies: 0 };
                    return (
                      <Link to={subsection.link_path} key={subsection.id} className="post-item forum-category-item">
                        <div className="forum-category-content">
                          <h3 className="forum-category-title-cn">{subsection.name}</h3>
                        </div>
                        <div className="forum-category-stats-lastpost">
                          <div className="forum-category-stats">
                            {/* 显示动态主题和回复数 */}
                            <span>主题: {stats.threads}</span>
                            <span>回复: {stats.replies}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};

export default ForumPage;
