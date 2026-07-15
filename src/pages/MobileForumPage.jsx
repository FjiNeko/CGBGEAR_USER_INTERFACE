// src/pages/MobileForumPage.jsx
// 移动端论坛首页：顶部分类标签栏 -> 公告区 -> 二级分类标签 -> 帖子列表
// 参考 ForumPage.jsx，保持 api / context / 函数引入一致性

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../css/main.css";

import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";

import { useAuth } from "../context/AuthContext";
import { getForumModules, getForumPosts, getThreadDetail } from "../api/api";
import { buildSearchId } from "../utils/auth";

const MobileForumPage = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    // 模块与子版块
    const [modules, setModules] = useState([]);
    const [loadingModules, setLoadingModules] = useState(true);
    const [modulesError, setModulesError] = useState(null);

    const [activeModuleId, setActiveModuleId] = useState(null);
    const activeModule = useMemo(() => modules.find(m => m.id === activeModuleId) || null, [modules, activeModuleId]);

    const [activeSubId, setActiveSubId] = useState(null);

    // 帖子
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [postsError, setPostsError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 公告（与 ForumPage 一致：占位）
    const [announcement] = useState('现已开始公开测试！感谢各位社群成员的耐心等待。');

    // 入场动画控制
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 40);
        return () => clearTimeout(t);
    }, []);
    const sectionFadeStyle = {
        transform: mounted ? 'none' : 'translateY(8px)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 320ms ease, transform 320ms ease'
    };


    // 初始化加载模块
    useEffect(() => {
        const fetchModules = async () => {
            try {
                setLoadingModules(true);
                setModulesError(null);
                const res = await getForumModules();
                const list = res?.data || [];
                setModules(list);
                if (list.length > 0) {
                    setActiveModuleId(list[0].id);
                    if (list[0].subsections && list[0].subsections.length > 0) {
                        setActiveSubId(list[0].subsections[0].id);
                    }
                }
            } catch (e) {
                setModulesError(typeof e === 'string' ? e : (e?.message || '获取论坛模块失败'));
            } finally {
                setLoadingModules(false);
            }
        };
        fetchModules();
    }, []);

    // 切换主模块时，重置子版块与分页
    useEffect(() => {
        if (!activeModule) return;
        const subs = activeModule.subsections || [];
        if (subs.length > 0) {
            setActiveSubId(subs[0].id);
            setPage(1);
        } else {
            setActiveSubId(null);
            setPosts([]);
            setTotalPages(1);
        }
    }, [activeModule]);

    // 从 HTML 中提取纯文本（用于摘要）
    const extractTextFromHtml = (html, maxLen = 120) => {
        if (!html || typeof html !== 'string') return '';
        const text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
        if (text.length <= maxLen) return text;
        return text.slice(0, maxLen) + '...';
    };

    // 从 HTML 中提取最多 N 张图片 URL
    const extractImagesFromHtml = (html, max = 3) => {
        if (!html || typeof html !== 'string') return [];
        try {
            const matches = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi));
            const urls = matches.map(m => m[1]).filter(Boolean);
            return urls.slice(0, max);
        } catch (e) {
            return [];
        }
    };

    // 拉取帖子列表
    const loadPosts = useCallback(async (subId, p = 1) => {
        if (!subId) return;
        try {
            setLoadingPosts(true);
            setPostsError(null);
            const res = await getForumPosts({ subsection_id: subId, page: p, limit: 20 });
            if (res.code === 200 && res.data) {
                const mapped = (res.data.posts || []).map(post => {
                    // 优先尝试后端可能提供的字段名
                    const html = post.content_html || post.contentHtml || post.content || post.excerpt || '';
                    const images = Array.isArray(post.images) && post.images.length
                        ? post.images.slice(0, 3)
                        : extractImagesFromHtml(html, 3);
                    return {
                        id: post.id,
                        title: post.title,
                        author: post.author || '匿名',
                        replies: post.replies || 0,
                        views: post.views || 0,
                        likes: post.likes || 0,
                        excerpt: extractTextFromHtml(html, 120),
                        images,
                        link: `/thread/${post.id}`,
                    };
                });
                setPosts(mapped);
                // 如果列表接口未返回图片/正文，则补充拉取帖子详情以提取图片与摘要（限前10条，避免过多请求）
                const hydratePostsWithDetails = async (list) => {
                    const targets = list.filter(it => !it.images || it.images.length === 0).slice(0, 10);
                    if (targets.length === 0) return;
                    const results = await Promise.allSettled(targets.map(it => getThreadDetail(it.id)));
                    const updates = [];
                    results.forEach((r, idx) => {
                        if (r.status === 'fulfilled' && r.value && r.value.code === 200 && r.value.data) {
                            const details = r.value.data;
                            const html = details.content || details.content_html || '';
                            const imgs = extractImagesFromHtml(html, 3);
                            const exc = extractTextFromHtml(html, 120);
                            updates.push({ id: targets[idx].id, imgs, exc });
                        }
                    });
                    if (updates.length) {
                        setPosts(prev => prev.map(p => {
                            const u = updates.find(x => x.id === p.id);
                            if (!u) return p;
                            const newImages = (p.images && p.images.length) ? p.images : u.imgs;
                            const newExcerpt = p.excerpt && p.excerpt.length ? p.excerpt : u.exc;
                            return { ...p, images: newImages, excerpt: newExcerpt };
                        }));
                    }
                };
                hydratePostsWithDetails(mapped).catch(() => { });
                setTotalPages(Math.max(1, Math.ceil((res.data.total || mapped.length) / (res.data.limit || 20))));
            } else {
                setPosts([]);
                setTotalPages(1);
                setPostsError(res?.msg || '获取帖子失败');
            }
        } catch (e) {
            setPosts([]);
            setTotalPages(1);
            setPostsError(typeof e === 'string' ? e : (e?.message || '获取帖子失败'));
        } finally {
            setLoadingPosts(false);
        }
    }, []);

    useEffect(() => {
        if (activeSubId) {
            loadPosts(activeSubId, page);
        }
    }, [activeSubId, page, loadPosts]);

    const handleLogin = useCallback(() => {
        const params = new URLSearchParams();
        params.set('id', buildSearchId());
        params.set('view', 'mobile');
        params.set('broswer', 'chrome');
        params.set('statusLogin', '0');
        navigate(`/terminal/login?${params.toString()}`);
    }, [navigate]);

    const handleNewPost = useCallback(() => {
        if (!currentUser?.is_logged_in) {
            handleLogin();
            return;
        }
        if (activeSubId) {
            navigate(`/forum/new-post?subsection_id=${activeSubId}`);
        }
    }, [activeSubId, currentUser, handleLogin, navigate]);

    return (
        <div className="page mobile-page-layout mobile-forum-page">
            <MainNav navSolid={true} isMobile={true} />

            <main className="main-wrapper" style={{ paddingTop: 70, paddingBottom: 60 }}>
                {/* 移除 nav-cta 选中态下划线动画与 a/b 两套动画（保留静态样式） */}
                {/* 分类标签栏（移除 nv-panel 相关类） */}
                <section style={{ marginBottom: 12, ...sectionFadeStyle }}>
                    {loadingModules ? (
                        <div style={{ padding: '12px 15px', color: '#9ca3af' }}>正在加载版块...</div>
                    ) : modulesError ? (
                        <div style={{ padding: '12px 15px', color: '#dc3545' }}>加载失败：{modulesError}</div>
                    ) : (
                        <div style={{ display: 'flex', overflowX: 'auto', gap: 12, padding: '10px 12px' }}>
                            {modules.map((m) => {
                                const active = m.id === activeModuleId;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => { setActiveModuleId(m.id); }}
                                        className="nav-cta"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            padding: '6px 2px',
                                            color: active ? '#fff' : '#9ca3af',
                                             fontSize: active ? 16 : 14,
                                             fontWeight: active ? 700 : 500,
                                            // 选中态仅显示静态下划线高亮（无动画）
                                             borderBottom: active ? '2px solid #a3e635' : '2px solid transparent',
                                             whiteSpace: 'nowrap',
                                             cursor: 'pointer'
                                         }}
                                     >
                                        {m.name}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* 公告区 */}
                {announcement && (
                    <section className="nv-panel" style={{ marginBottom: 12, ...sectionFadeStyle }}>
                        <div className="panel-header">
                            <h3 className="panel-title-main" style={{ color: '#6ef500' }}>系统公告</h3>
                            <p className="panel-title-sub">重要通知</p>
                        </div>
                        <div className="nv-body">
                            <p className="nv-placeholder" style={{ color: '#e5e7eb' }}>{announcement}</p>
                        </div>
                    </section>
                )}

                {/* 二级分类标签（移除 nv-panel 相关类） */}
                {activeModule && (
                    <section style={{ marginBottom: 12, ...sectionFadeStyle }}>
                        {activeModule.subsections && activeModule.subsections.length > 0 ? (
                            <div style={{ display: 'flex', overflowX: 'auto', gap: 10, padding: '8px 12px' }}>
                                {activeModule.subsections.map((sub) => {
                                    const active = sub.id === activeSubId;
                                    return (
                                        <button
                                            key={sub.id}
                                            onClick={() => { setActiveSubId(sub.id); setPage(1); }}
                                            className="nav-cta"
                                            style={{
                                                background: active ? '#333' : 'transparent',
                                                border: '1px solid #333',
                                                color: active ? '#fff' : '#cbd5e1',
                                                fontSize: active ? 15 : 14,
                                                borderRadius: 16,
                                                padding: '6px 10px',
                                                whiteSpace: 'nowrap',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {sub.name}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ padding: '12px 15px', color: '#9ca3af' }}>该分类暂无子版块</div>
                        )}
                    </section>
                )}

                {/* 帖子列表（移除 nv-panel / panel-* / nv-body / post- 类，避免样式冲突导致显示不全） */}
                <section style={{ ...sectionFadeStyle }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px 10px 12px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 16, color: '#fff' }}>帖子列表</h3>
                            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>LATEST THREADS</p>
                        </div>
                        <div style={{ marginLeft: 'auto' }}>
                            {/* 移动端卡片式帖子流（标题 → 正文摘要 → 图片(最多3张) → 互动区“X 评论 / X 点赞”） */}
                            <button className="nav-cta primary" onClick={handleNewPost} style={{ padding: '8px 14px', fontSize: 13 }}>发表新帖</button>
                        </div>
                    </div>

                    <div style={{ paddingTop: 0 }}>
                        {loadingPosts ? (
                            <div className="nv-placeholder">正在加载帖子...</div>
                        ) : postsError ? (
                            <div className="nv-placeholder" style={{ color: '#dc3545' }}>{postsError}</div>
                        ) : posts.length === 0 ? (
                            <div className="nv-placeholder">暂无帖子，快来发布第一条吧！</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {posts.map((p, idx) => (
                                    <Link key={p.id} to={p.link} style={{
                                        display: 'block',
                                        background: '#1a1a1a',
                                        border: '1px solid #2a2a2a',
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        textDecoration: 'none',
                                        transform: mounted ? 'none' : 'translateY(8px)',
                                        opacity: mounted ? 1 : 0,
                                        transition: 'opacity 360ms ease, transform 360ms ease, box-shadow 180ms ease',
                                        transitionDelay: mounted ? `${Math.min(idx * 40, 240)}ms` : '0ms'
                                    }}>
                                        {/* 标题 */}
                                        <div style={{ padding: '12px 12px 6px 12px' }}>
                                            <div className="post-title" style={{ fontSize: 16, lineHeight: 1.35, color: '#fff', fontWeight: 700 }}>{p.title}</div>
                                            <div className="post-meta" style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                                                {p.author} · {p.views} 查看
                                            </div>
                                        </div>

                                        {/* 正文摘要 */}
                                        {p.excerpt && (
                                            <div style={{ padding: '0 12px 8px 12px', fontSize: 14, color: '#d1d5db', lineHeight: 1.6 }}>{p.excerpt}</div>
                                        )}

                                        {/* 图片（最多 3 张） */}
                                        {p.images && p.images.length > 0 && (
                                            <div style={{ padding: '0 12px 10px 12px' }}>
                                                {p.images.length === 1 && (
                                                    <div style={{ width: '100%', height: 180, borderRadius: 6, overflow: 'hidden', background: '#111' }}>
                                                        <img src={p.images[0]} alt="post" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1)', opacity: 0.98, transition: 'transform 280ms ease, opacity 240ms ease' }} />
                                                    </div>
                                                )}
                                                {p.images.length === 2 && (
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        {p.images.map((src, idx) => (
                                                            <div key={idx} style={{ flex: 1, height: 140, borderRadius: 6, overflow: 'hidden', background: '#111' }}>
                                                                <img src={src} alt={`post-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1)', opacity: 0.98, transition: 'transform 280ms ease, opacity 240ms ease' }} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {p.images.length >= 3 && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                                                        {p.images.slice(0, 3).map((src, idx) => (
                                                            <div key={idx} style={{ width: '100%', height: 110, borderRadius: 6, overflow: 'hidden', background: '#111' }}>
                                                                <img src={src} alt={`post-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1)', opacity: 0.98, transition: 'transform 280ms ease, opacity 240ms ease' }} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* 互动区 */}
                                        <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #2a2a2a' }}>
                                            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#9ca3af' }}>
                                                <span>{p.replies} 评论</span>
                                                <span>{p.likes} 点赞</span>
                                            </div>
                                            <div aria-hidden style={{ color: '#6b7280', fontSize: 12 }}>查看详情 ›</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* 简易分页 */}
                        {totalPages > 1 && (
                            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="nav-cta"
                                    style={{ background: page === 1 ? '#222' : '#333', cursor: page === 1 ? 'not-allowed' : 'pointer', padding: '6px 14px' }}
                                >上一页</button>
                                <span style={{ lineHeight: '34px', color: '#fff', fontSize: 13 }}>{page} / {totalPages}</span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="nav-cta"
                                    style={{ background: page === totalPages ? '#222' : '#333', cursor: page === totalPages ? 'not-allowed' : 'pointer', padding: '6px 14px' }}
                                >下一页</button>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
};

export default MobileForumPage;
