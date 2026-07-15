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

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// 春节主题样式
// import "../css/festival-special/main.css";

import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import HomeStatsSkeleton from "../components/HomeStatsSkeleton";
import HomePostListSkeleton from "../components/HomePostListSkeleton";
import { getHomeStats, fetchLatestAnnouncements } from "../api/api";

// 与桌面版保持一致的数据源（四宫格功能区）
const IMAGE_BASE_URL_PREFIX = "http://img.cgbgear.cn/mpage/btn/wrapper-btn";
const FestivalImageBaseLink = "/festivals/newyear";

// 品牌区数据：自 HomePage.jsx 移植，供移动端复用
const brandCardData = [
  {
    id: 'brand-story-1',
    lines: [
      '我们做装备',
      '也和玩家一起',
      '讲好每一个故事',
    ],
    buttonTextCn: '查看品牌故事',
    buttonTextEn: 'VIEW',
    imageUrl: `${IMAGE_BASE_URL_PREFIX}/wrapper-brand-stories.png_.webp`,
    backgroundPosition: 'center',
    backgroundSize: 'contain',
  },
];

const MobileHomePage = () => {
  const heroRef = useRef(null);
  const [showCookie, setShowCookie] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingNotices, setIsLoadingNotices] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [actualStats, setActualStats] = useState([]);
  const [latestNotices, setLatestNotices] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const navigate = useNavigate();
  // 进场动画：挂载后淡入/上移过渡
  const [mounted, setMounted] = useState(false);

  // Cookie 首访提示（与桌面端统一）
  const CONSENT_KEY = "cookie_consent";
  const CONSENT_VALUE = "accepted";
  useEffect(() => {
    try {
      const consent = window.localStorage.getItem(CONSENT_KEY);
      if (consent !== CONSENT_VALUE) setShowCookie(true);
    } catch (e) {
      setShowCookie(true);
    }
  }, []);

  // 加载最新公告（最多 3 条）
  useEffect(() => {
    const lang = localStorage.getItem('lang') || 'zh-cn';
    const load = async () => {
      setIsLoadingNotices(true);
      try {
        const res = await fetchLatestAnnouncements(lang, 3);
        if (res.code === 200 && res.data && Array.isArray(res.data.announcements)) {
          setLatestNotices(res.data.announcements);
        } else {
          setLatestNotices([]);
        }
      } catch (e) {
        console.warn('获取最新公告失败', e?.message || e);
        setLatestNotices([]);
      } finally {
        setIsLoadingNotices(false);
      }
    };
    load();
  }, []);

  const truncateTitle = (title, max = 15) => {
    if (!title) return '';
    return title.length > max ? `${title.slice(0, max)}...` : title;
  };

  // 四宫格箭头显隐：监听容器滚动与尺寸变化
  useEffect(() => {
    const scroller = document.getElementById('mobile-grid-cards');
    if (!scroller) return;

    const updateArrows = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scroller;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    };

    updateArrows();
    scroller.addEventListener('scroll', updateArrows, { passive: true });

    const ro = new ResizeObserver(updateArrows);
    ro.observe(scroller);

    return () => {
      scroller.removeEventListener('scroll', updateArrows);
      ro.disconnect();
    };
  }, []);

  const handleCookieAccept = () => {
    setShowCookie(false);
    try {
      window.localStorage.setItem(CONSENT_KEY, CONSENT_VALUE);
    } catch (e) {}
  };

  // 加载真实统计
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const response = await getHomeStats();
        if (response.code === 200 && response.data) {
          const s = response.data;
          setActualStats([
            { key: "topics", label: "主题数", value: s.topics.toLocaleString() },
            { key: "posts", label: "帖子数", value: s.posts.toLocaleString() },
            { key: "users", label: "用户数", value: s.users.toLocaleString() },
            { key: "online", label: "在线数", value: s.online.toLocaleString() },
          ]);
        }
      } catch (err) {
        console.error("加载首页统计失败", err);
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  // 挂载后触发页面元素淡入
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // 模拟加载最新帖子（若后续有真实接口可替换）
  useEffect(() => {
    setIsLoadingPosts(true);
    const t = setTimeout(() => {
      setLatestPosts([
        { id: 1, title: "[造型分享] MCBK 轻量化巡逻套装记录", meta: "5 分钟前 · @HARDCORE" },
        { id: 2, title: "[经验] 夜视环境下外拍与安全流程", meta: "32 分钟前 · @NVG_CAT" },
        { id: 3, title: "[讨论] 新配方尼龙实测对比", meta: "2 小时前 · @LAB_RND" },
      ]);
      setIsLoadingPosts(false);
    }, 900);
    return () => clearTimeout(t);
  }, []);

  // 估算顶部/底部导航高度，给内容区预留空间，避免遮挡
  const mobileBottomNavHeight = 60;
  const mobileTopNavHeight = 50;

  return (
    <div className="page mobile-page-layout">
      {/* 顶部导航（MainNav 支持 isMobile） */}
      <MainNav navSolid={true} isMobile={true} />

      {/* Hero：一句话介绍 + 用户卡片 */}
      <section className="hero" ref={heroRef} style={{ minHeight: "300px" }}>
        <div className="hero-media" />
        <div className="hero-overlay">
          <div className="hero-inner" style={{ padding: "20px", paddingBottom: `${mobileBottomNavHeight + 10}px`, position: "relative" }}>
            <div className="hero-tagline" style={{ fontSize: "0.8rem", marginBottom: "15px", alignSelf: "flex-start" }}>
              <div className="hero-tagline-label" style={{ fontSize: "0.8rem" }}>优秀玩家展示 · ELITE PLAYERS</div>
              <div className="hero-tagline-title" style={{ fontSize: "1.8rem", lineHeight: 1.3 }}>
                装备不止于酷。
                <br />
                它定义你的战术角色。
              </div>
              <div className="hero-tagline-sub" style={{ fontSize: "0.9rem" }}>
                记录玩家真实战术造型、实战体验与搭配建议，与您一起打磨每一件器材。
              </div>
            </div>
            {/* hero 用户卡片动画：卡片向右滑入；handle 向下滑入；文本打字效果 */}
            <div
              className="hero-user-card"
              style={{
                padding: "15px",
                position: "absolute",
                bottom: 0,
                left: "20px",
                right: "20px",
                zIndex: 10,
                transform: mounted ? 'none' : 'translateX(-12px)',
                opacity: mounted ? 1 : 0,
                transition: 'opacity 420ms ease 140ms, transform 420ms ease 140ms'
              }}
            >
              <div
                className="hero-user-handle"
                style={{
                  fontSize: "0.9rem",
                  transform: mounted ? 'none' : 'translateY(-10px)',
                  opacity: mounted ? 1 : 0,
                  transition: 'opacity 420ms ease 220ms, transform 420ms ease 220ms'
                }}
              >
                @木日
              </div>
              <div
                className="hero-user-text"
                style={{
                  fontSize: "0.8rem",
                  // 打字机动画：逐字显示
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  borderRight: '2px solid rgba(255,255,255,0.75)',
                  width: mounted ? '100%' : 0,
                  animation: mounted ? 'typing-fast 900ms steps(40, end), caret 800ms steps(1, end) infinite' : 'none'
                }}
              >
                sdu近现役玩家，坚守“精英反恐、专业致胜”的信念，
                在像素战场复刻战术智慧。
              </div>
              {/* 内联注入 keyframes，避免改动样式表 */}
              <style>
                {`
                  @keyframes typing-fast { from { width: 0 } to { width: 100% } }
                  @keyframes caret { 0%, 100% { border-color: transparent } 50% { border-color: rgba(255,255,255,0.75) } }
                `}
              </style>
            </div>
          </div>
        </div>
      </section>

      {/* 主体内容（垂直堆叠 App 风格） */}
      <main className="main-wrapper mobile-main-wrapper" style={{ marginTop: `${mobileTopNavHeight + 15}px`, paddingLeft: "15px", paddingRight: "15px", paddingBottom: `${mobileBottomNavHeight + 15}px` }}>
        {/* 最新公告（位于四宫格区域上方） */}
        <section
          className="mobile-latest-notice"
          style={{
            margin: '8px 0 12px',
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            transform: mounted ? 'none' : 'translateY(8px)',
            opacity: mounted ? 1 : 0,
            transition: 'opacity 300ms ease, transform 300ms ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: '0.95rem' }}>最新公告</div>
            <button
              onClick={() => navigate('/notice')}
              className="mobile-button-small"
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6 }}
            >
              查看全部
            </button>
          </div>
          {isLoadingNotices ? (
            <div style={{ height: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 6, animation: 'pulse 1.2s ease-in-out infinite' }} />
          ) : latestNotices.length === 0 ? (
            <div style={{ fontSize: 12, color: '#9ca3af' }}>暂无公告</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {latestNotices.slice(0, 3).map((a, idx) => (
                <li key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: '#58a6ff', display: 'inline-block' }} />
                  <span style={{ fontSize: '0.9rem', lineHeight: 1.2 }}>{truncateTitle(a.title, 15)}</span>
                </li>
              ))}
            </ul>
          )}
          <style>{`@keyframes pulse { 0%{opacity:.6} 50%{opacity:1} 100%{opacity:.6} }`}</style>
        </section>

        <div className="mobile-stacked-content">
          {/* 四宫格功能区 - 移到横幅上方，并横向排列（移动端场景下可左右滑动） */}
          <section className="grid-section mobile-grid-section" style={{ position: 'relative', marginBottom: '16px' }}>
            {/* 可横向滑动容器，隐藏滚动条 */}
            <div className="grid-cards mobile-grid-cards" id="mobile-grid-cards"
              style={{
                display: 'flex',
                gap: '12px',
                width: '100%', // 避免撑开页面宽度
                overflowX: 'auto',
                scrollbarWidth: 'none', /* Firefox */
                msOverflowStyle: 'none', /* IE/Edge */
                transform: mounted ? 'none' : 'translateY(8px)',
                opacity: mounted ? 1 : 0,
                transition: 'opacity 300ms ease, transform 300ms ease'
              }}
              onWheel={(e) => {
                // 允许纵向滚轮转为横向滚动，提升体验
                if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
                  e.currentTarget.scrollLeft += e.deltaY;
                  e.preventDefault();
                }
              }}
            >
              {/* 隐藏 WebKit 滚动条 */}
              <style>{`
                .mobile-grid-cards::-webkit-scrollbar{ display:none; height:0; width:0 }
              `}</style>
              {[
                {
                  id: 'notice',
                  imageUrl: `${IMAGE_BASE_URL_PREFIX}/wrapper-notice.png_.webp`,
                  label: 'SYSTEM',
                  titleCn: '网站公告',
                  titleEn: 'Website Announcement / Suggestion',
                  buttonTextCn: '查看',
                  buttonTextEn: 'VIEW',
                  onClick: () => navigate('/notice'),
                },
                {
                  id: 'signup',
                  imageUrl: `${IMAGE_BASE_URL_PREFIX}/wrapper-sign-up.png_.webp`,
                  label: 'EVENT',
                  titleCn: '军推/场地/漫展/外拍招募活动',
                  titleEn: 'Field Shooting Sign-up Event',
                  buttonTextCn: '查看',
                  buttonTextEn: 'VIEW',
                  onClick: () => console.log('招募活动'),
                },
                {
                  id: 'advice',
                  imageUrl: `${IMAGE_BASE_URL_PREFIX}/wrapper-prictical-milltary.png_.webp`,
                  label: 'ADVICE',
                  titleCn: '军警实用装备建议/意见',
                  titleEn: 'Suggestions on Practical Military and Police Equipment',
                  buttonTextCn: '发布意见',
                  buttonTextEn: 'POST',
                  onClick: () => console.log('发布意见'),
                },
                {
                  id: 'nylon-satellite',
                  imageUrl: `${IMAGE_BASE_URL_PREFIX}/wrapper-speical.png_.webp`,
                  label: 'LAB',
                  titleCn: '尼龙卫星',
                  titleEn: "Special Plan for R&D of Nylon Tactical Equipment",
                  buttonTextCn: '查看',
                  buttonTextEn: 'VIEW',
                  onClick: () => console.log('尼龙卫星'),
                },
              ].map(card => (
                <article key={card.id} className="grid-card mobile-grid-card"
                  style={{
                    backgroundImage: `url('${card.imageUrl}')`,
                    width: 140,
                    minWidth: 140,
                    height: 140, // 正方形
                    flex: '0 0 140px', // 固定卡片宽，避免换行导致撑开
                    borderRadius: '10px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                  {/* 图片暗色蒙版，避免文字挡图也能保持可读性 */}
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.6) 100%)'
                    }}
                  />
                  {/* 内容采用绝对定位，按钮固定在底部，避免被文本挤走 */}
                  <div className="grid-card-inner" style={{ position: 'absolute', inset: 0, padding: '10px', display: 'flex', flexDirection: 'column' }}>
                    <div className="section-label" style={{ fontSize: '0.7rem', color: '#fff' }}>{card.label}</div>
                    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                      <div className="grid-title-cn" style={{ color: '#fff', fontSize: '0.95rem', lineHeight: 1.15, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.titleCn}</div>
                      <div className="grid-title-en" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.6rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.titleEn}</div>
                    </div>
                    <div className="grid-actions" style={{ marginTop: '6px' }}>
                      <button
                        className="grid-btn mobile-button-small"
                        onClick={card.onClick}
                        style={{
                          padding: '6px 10px',
                          fontSize: '12px',
                          lineHeight: 1,
                          borderRadius: '6px',
                          display: 'inline-flex',
                          gap: '6px'
                        }}
                      >
                        <span>{card.buttonTextCn}</span>
                        <span>{card.buttonTextEn}</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {/* 右侧“下一页”箭头 */}
            {canScrollRight && (
            <button
              aria-label="next"
              onClick={() => {
                const scroller = document.getElementById('mobile-grid-cards');
                if (scroller) scroller.scrollBy({ left: 160, behavior: 'smooth' });
              }}
              style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                height: '100%',
                width: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 60%)',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 160ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.0)'; }}
            >
              {/* 右箭头 SVG，移除 fill 以继承颜色 */}
              <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden style={{ transition: 'transform 160ms ease' }}>
                <path fill="#ffffff" d="M769.216 511.936c0-3.712-1.152-7.232-1.856-10.88-0.64-2.368-0.64-4.8-1.408-7.04a50.56 50.56 0 0 0-11.136-17.344l-417.28-417.28a48.96 48.96 0 0 0-68.992-0.96 48.832 48.832 0 0 0 1.024 68.864L654.208 512l-384.64 384.768a48.768 48.768 0 0 0-1.024 68.8 48.768 48.768 0 0 0 68.864-0.96l417.28-417.344a51.2 51.2 0 0 0 11.136-17.344c0.896-2.304 0.896-4.736 1.472-7.04 0.768-3.648 1.92-7.232 1.92-10.944z"></path>
              </svg>
            </button>
            )}
            {/* 左侧“上一页”箭头：在非起始位置时可滚动回去 */}
            {canScrollLeft && (
            <button
              aria-label="prev"
              onClick={() => {
                const scroller = document.getElementById('mobile-grid-cards');
                if (scroller) scroller.scrollBy({ left: -160, behavior: 'smooth' });
              }}
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                height: '100%',
                width: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(270deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 60%)',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 160ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.0)'; }}
            >
              {/* 左箭头 SVG，移除 fill 以继承颜色 */}
              <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden style={{ transition: 'transform 160ms ease' }}>
                <path fill="#ffffff" d="M721.9968 979.0208l47.0528-47.104-419.94752-419.98848 419.94752-419.90144-47.05792-47.04768-419.93216 419.89632h-0.00512l-47.104 47.09888 47.04768 47.04256z"></path>
              </svg>
            </button>
            )}
          </section>

          {/* 将社区数据移动到造型论坛横幅上方 */}
          {/* 统计 + 互动信息 + 热门话题（仅保留统计部分放在横幅前）*/}
          {!isLoadingStats && (
            <section className="stats-panel mobile-stats-panel" style={{ marginBottom: '12px',
              transform: mounted ? 'none' : 'translateY(8px)',
              opacity: mounted ? 1 : 0,
              transition: 'opacity 360ms ease 60ms, transform 360ms ease 60ms'
            }}>
              <div className="panel-title" style={{ fontSize: "1rem" }}>社区数据 / COMMUNITY STATS</div>
              <div
                className="stats-row"
                style={{
                  display: 'flex',
                  gap: '10px',
                  width: '100%',
                  overflowX: 'auto',
                  padding: '6px 0',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                <style>{`.stats-row::-webkit-scrollbar{display:none;height:0;width:0}`}</style>
                {actualStats.map((s) => (
                  <div
                    key={s.key}
                    className="stats-item"
                    style={{
                      flex: '0 0 80px',
                      width: 80,
                      height: 80,
                      borderRadius: '8px',
                      background: 'transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px',
                      boxSizing: 'border-box',
                      border: 'none',
                      transform: mounted ? 'none' : 'translateY(6px)',
                      opacity: mounted ? 1 : 0,
                      transition: 'opacity 360ms ease, transform 360ms ease',
                      transitionDelay: `${(s.key === 'topics' ? 0 : s.key === 'posts' ? 60 : s.key === 'users' ? 120 : 180)}ms`
                    }}
                  >
                    {/* 引用提供的四个 SVG，并适配尺寸与颜色 */}
                    {s.key === "topics" && (
                      <svg className="stats-icon-svg" viewBox="0 0 1024 1024" width="26" height="26" style={{ marginBottom: 2, color: '#9ca3af', fill: 'currentColor' }}>
                        <path d="M476.021333 544h63.424l8.533334-64h-63.424l-8.533334 64zM512 85.333333c235.637333 0 426.666667 191.029333 426.666667 426.666667S747.637333 938.666667 512 938.666667a424.778667 424.778667 0 0 1-219.125333-60.501334 2786.56 2786.56 0 0 0-20.053334-11.765333l-104.405333 28.48c-23.893333 6.506667-45.802667-15.413333-39.285333-39.296l28.437333-104.288c-11.008-18.688-18.218667-31.221333-21.802667-37.909333A424.885333 424.885333 0 0 1 85.333333 512C85.333333 276.362667 276.362667 85.333333 512 85.333333z m89.557333 234.944a32 32 0 0 0-35.946666 27.498667L556.512 416h-63.424l7.968-59.776a32 32 0 0 0-63.445333-8.448L428.512 416H352a32 32 0 0 0 0 64h67.978667l-8.533334 64H352a32 32 0 0 0 0 64h50.912l-7.968 59.776a32 32 0 0 0 63.445333 8.448L467.488 608h63.424l-7.968 59.776a32 32 0 0 0 63.445333 8.448L595.488 608H672a32 32 0 0 0 0-64h-67.978667l8.533334-64H672a32 32 0 0 0 0-64h-50.912l7.968-59.776a32 32 0 0 0-27.498667-35.946667z" />
                      </svg>
                    )}
                    {s.key === "posts" && (
                      <svg className="stats-icon-svg" viewBox="0 0 1024 1024" width="26" height="26" style={{ marginBottom: 2, color: '#9ca3af', fill: 'currentColor' }}>
                        <path d="M765.793488 897.027008 329.124949 897.027008c-53.591665 0-97.037609-43.047414-97.037609-96.15001l0-576.896864c0-53.103995 43.445944-96.151609 97.037609-96.151609l339.63093 0 194.075217 192.300021c0 35.304663 0 480.749852 0 480.749852C862.831097 853.979394 819.385153 897.027008 765.793488 897.027008zM668.75588 195.90197c0 57.232996 0 76.14997 0 76.14997 0 26.549799 21.722272 48.076604 48.519704 48.076604l72.767264 0L668.75588 195.90197zM814.311593 368.202151c-56.488501 0-97.037609 0-97.037609 0-53.593264 0-97.037609-43.044416-97.037609-96.151609 0 0-1.130633-38.581442-0.687534-96.146812l-290.423693 0c-26.795832 0-48.518105 21.51921-48.518105 48.075005l0 576.896864c0 26.549799 21.722272 48.075005 48.518105 48.075005l436.668539 0c26.795832 0 48.518105-21.526805 48.518105-48.075005L814.311793 368.202151zM693.014832 704.725388 401.902006 704.725388c-13.397916 0-24.258952-10.764102-24.258952-24.035904 0-13.277998 10.859637-24.040501 24.258952-24.040501l291.113025 0c13.397916 0 24.257553 10.762703 24.257553 24.040501C717.272385 693.961286 706.412748 704.725388 693.014832 704.725388zM693.014832 560.500573 401.902006 560.500573c-13.397916 0-24.258952-10.761104-24.258952-24.039101 0-13.271802 10.859637-24.034305 24.258952-24.034305l291.113025 0c13.397916 0 24.257553 10.762703 24.257553 24.034305C717.272385 549.739469 706.412748 560.500573 693.014832 560.500573z" />
                      </svg>
                    )}
                    {s.key === "online" && (
                      <svg className="stats-icon-svg" viewBox="0 0 1024 1024" width="26" height="26" style={{ marginBottom: 2, color: '#9ca3af', fill: 'currentColor' }}>
                        <path d="M48.505263 692.547368c-10.778947-2.694737-21.557895 2.694737-24.252631 13.473685-2.694737 10.778947 2.694737 21.557895 13.473684 24.252631 110.484211 32.336842 194.021053 123.957895 220.968421 234.442105 2.694737 8.084211 10.778947 13.473684 18.863158 13.473685h5.389473c10.778947-2.694737 16.168421-13.473684 13.473685-21.557895-29.642105-126.652632-123.957895-226.357895-247.91579-264.084211zM45.810526 447.326316c-10.778947-2.694737-18.863158 5.389474-21.557894 16.168421-2.694737 10.778947 5.389474 18.863158 16.168421 21.557895 239.831579 40.421053 428.463158 239.831579 460.8 482.357894 0 10.778947 8.084211 16.168421 18.863158 16.168421h2.694736c10.778947 0 18.863158-10.778947 16.168421-21.557894-32.336842-258.694737-234.442105-471.578947-493.136842-514.694737z" />
                        <path d="M45.810526 223.663158c-10.778947 0-18.863158 8.084211-21.557894 16.168421 0 10.778947 5.389474 18.863158 16.168421 21.557895 361.094737 43.115789 646.736842 336.842105 679.073684 697.936842 0 10.778947 8.084211 16.168421 18.863158 16.168421h2.694737c10.778947 0 18.863158-10.778947 16.168421-21.557895C722.189474 579.368421 423.073684 269.473684 45.810526 223.663158zM994.357895 45.810526c-8.084211-8.084211-18.863158-8.084211-26.947369 0l-269.473684 269.473685-150.905263-150.905264c-8.084211-8.084211-18.863158-8.084211-26.947368 0s-8.084211 18.863158 0 26.947369l164.378947 164.378947c2.694737 2.694737 8.084211 5.389474 13.473684 5.389474s10.778947-2.694737 13.473684-5.389474L994.357895 72.757895c5.389474-5.389474 5.389474-18.863158 0-26.947369z" />
                      </svg>
                    )}
                    {s.key === "users" && (
                      <svg className="stats-icon-svg" viewBox="0 0 1024 1024" width="26" height="26" style={{ marginBottom: 2, color: '#9ca3af', fill: 'currentColor' }}>
                        <path d="M295.901 526.09c-40.64-33.009-66.64-83.58-66.64-140.27 0-99.455 80.024-180.08 178.739-180.08s178.738 80.625 178.738 180.08c0 56.69-25.999 107.261-66.64 140.27C627.995 570.604 704 677.451 704 802.184c0 12.032-0.707 23.898-2.082 35.557h-64.336a237.55 237.55 0 0 0 2.664-35.557c0-129.229-103.98-233.99-232.246-233.99-128.266 0-232.246 104.761-232.246 233.99 0 12.088 0.91 23.962 2.664 35.557h-64.336A303.534 303.534 0 0 1 112 802.184c0-124.733 76.006-231.58 183.901-276.094zM408 501.668c63.504 0 114.985-51.866 114.985-115.847 0-63.981-51.48-115.848-114.985-115.848-63.504 0-114.985 51.867-114.985 115.848 0 63.98 51.48 115.847 114.985 115.847zM615.759 187c98.652 0 178.626 80.64 178.626 180.116 0 56.7-25.983 107.281-66.598 140.297 107.827 44.523 183.785 151.392 276.149 0 12.034-0.706 23.902-2.08 35.564h-64.296a237.79 237.79 0 0 0 2.663-35.564c0-129.255-103.915-234.036-232.1-234.036h0.76c-18.375 0-33.27-14.895-33.27-33.27 0-18.374 14.895-33.27 33.27-33.27h-0.76c63.464 0 114.912-51.877 114.912-115.87 0-63.994-51.448-115.87-114.912-115.87-4.44 0-9.626 0.533-15.557 1.602-15.46 2.785-30.252-7.491-33.037-22.953a28.445 28.445 0 0 1-0.301-2.133c-1.997-19.42 11.83-36.901 31.189-39.43 6.803-0.888 12.705-1.332 17.706-1.332z" />
                      </svg>
                    )}
                    <div className="stats-meta" style={{ textAlign: 'center' }}>
                      <div
                        className="stats-label"
                        style={{
                          fontSize: '12px',
                          letterSpacing: '0.2px',
                          marginBottom: 0,
                          color: '#9ca3af'
                        }}
                      >
                        {s.label}
                      </div>
                      <div
                        className="stats-value"
                        style={{
                          fontSize: '15px',
                          letterSpacing: '0.3px',
                          fontWeight: 700,
                          color: '#f5f5f5'
                        }}
                      >
                        {s.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 四个横幅入口 */}
          <div className="left-column mobile-full-width" style={{
            transform: mounted ? 'none' : 'translateY(8px)',
            opacity: mounted ? 1 : 0,
            transition: 'opacity 380ms ease 80ms, transform 380ms ease 80ms'
          }}>
            <article className="banner-card mobile-banner-card">
              <div className="banner-media" style={{ backgroundImage: "url('https://img.cgbgear.cn/wpage/btn/wrapper-btn/wrapper-forum.PNG_.webp')" }} />
              <div className="banner-overlay" />
              <div className="banner-content" style={{ padding: "15px", maxWidth: "100%" }}>
                <div>
                  <div className="banner-title-cn" style={{ fontSize: "1.3rem" }}>造型论坛</div>
                  <div className="banner-title-en" style={{ fontSize: "0.8rem" }}>Tactical Gear Styling Forum</div>
                </div>
                <div className="banner-actions">
                  <button className="banner-btn mobile-button-responsive" onClick={() => navigate("/forum")}> <span>进入</span><span>ENTER</span> </button>
                </div>
              </div>
            </article>

            <article className="banner-card mobile-banner-card">
              <div className="banner-media" style={{ backgroundImage: "url('https://img.cgbgear.cn/wpage/btn/wrapper-btn/wrapper-product.png_.webp')" }} />
              <div className="banner-overlay" />
              <div className="banner-content" style={{ padding: "15px", maxWidth: "100%" }}>
                <div>
                  <div className="banner-title-cn" style={{ fontSize: "1.3rem" }}>CGBGEAR产品</div>
                  <div className="banner-title-en" style={{ fontSize: "0.8rem" }}>CGBGEAR tactical products</div>
                </div>
                <div className="banner-actions">
                  <button className="banner-btn mobile-button-responsive" onClick={() => navigate("/product")}> <span>查看</span><span>VIEW</span> </button>
                </div>
              </div>
            </article>

            <article className="banner-card mobile-banner-card">
              <div className="banner-media" style={{ backgroundImage: "url('https://img.cgbgear.cn/wpage/btn/wrapper-btn/wrapper-3dgears.jpg_.webp')", backgroundPositionY: "-8.5vh" }} />
              <div className="banner-overlay" />
              <div className="banner-content" style={{ padding: "15px", maxWidth: "100%" }}>
                <div>
                  <div className="banner-title-cn" style={{ fontSize: "1.3rem" }}>个人3D战术装备</div>
                  <div className="banner-title-en" style={{ fontSize: "0.8rem" }}>Personal 3D Tactical Gear</div>
                </div>
                <div className="banner-actions">
                  <button className="banner-btn mobile-button-responsive"> <span>进入</span><span>ENTER</span> </button>
                </div>
              </div>
            </article>

            <article className="banner-card mobile-banner-card">
              <div className="banner-media" style={{ backgroundImage: "url('https://img.cgbgear.cn/wpage/btn/wrapper-btn/wrapper-field-shooting.jpg_.webp')", backgroundPositionY: "-8.5vh" }} />
              <div className="banner-overlay" />
              <div className="banner-content" style={{ padding: "15px", maxWidth: "100%" }}>
                <div>
                  <div className="banner-title-cn" style={{ fontSize: "1.3rem" }}>外拍经验分享</div>
                  <div className="banner-title-en" style={{ fontSize: "0.8rem" }}>Field Shooting Experience Sharing</div>
                </div>
                <div className="banner-actions">
                  <button className="banner-btn mobile-button-responsive"> <span>参与讨论</span><span>JOIN</span> </button>
                </div>
              </div>
            </article>
          </div>

          {/* 互动信息 + 热门话题 */}
          <aside className="right-column mobile-full-width" style={{
            transform: mounted ? 'none' : 'translateY(8px)',
            opacity: mounted ? 1 : 0,
            transition: 'opacity 420ms ease 120ms, transform 420ms ease 120ms'
          }}>
            {isLoadingStats && <HomeStatsSkeleton />}
            <section className="nv-panel mobile-nv-panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title-main" style={{ fontSize: "1rem" }}>互动信息</div>
                  <div className="panel-title-sub" style={{ fontSize: "0.7rem" }}>INTERACTION FEED</div>
                </div>
              </div>
              <div className="nv-body" style={{ padding: "15px", fontSize: "0.9rem" }}>
                <div className="nv-placeholder">
                  最新回复、@提及或活动提醒将在此显示。
                </div>
              </div>
            </section>

            <section className="nv-panel mobile-nv-panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title-main" style={{ fontSize: "1rem" }}>热门话题</div>
                  <div className="panel-title-sub" style={{ fontSize: "0.7rem" }}>HOT TOPICS</div>
                </div>
              </div>
              <div className="nv-body" style={{ padding: "15px", fontSize: "0.9rem" }}>
                <div className="nv-placeholder">· 夜拍如何兼顾安全与效果？<br />· 战术腰封常用配置？<br />· 新款尼龙长期耐用性讨论…</div>
              </div>
            </section>
          </aside>
        </div>

        {/* 品牌与社区：改为使用 brandCardData 渲染（与桌面一致） */}
        <section className="brand-section mobile-brand-section">
          {brandCardData.map((card) => (
            <div
              key={card.id}
              className="brand-card mobile-brand-card"
              style={{
                backgroundImage: `url('${card.imageUrl}')`,
                backgroundPosition: 'left',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                padding: '20px',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center'
              }}
            >
              <div className="brand-inner" style={{ textAlign: 'right', maxWidth: '70%', padding: '8px 6px' }}>
                <div className="brand-lines" style={{ fontSize: '1.1rem', lineHeight: 1.6, whiteSpace: 'pre-line', marginRight: '2px' }}>
                  {card.lines.join('\n')}
                </div>
                <button
                  className="brand-btn mobile-button-responsive"
                  style={{ marginTop: '14px', marginLeft: 'auto', marginRight: '2px' }}
                  onClick={() => navigate('/brand-story')}
                >
                  <span>{card.buttonTextCn}</span>
                  <span className="en">{card.buttonTextEn}</span>
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* 最新帖子 */}
        <section className="latest-section mobile-latest-section">
          <div className="section-header" style={{ padding: "0 15px" }}>
            <div className="section-title" style={{ fontSize: "1.2rem" }}>最新帖子</div>
            <div className="section-more" style={{ fontSize: "0.8rem" }}>查看全部 &gt;</div>
          </div>
          {isLoadingPosts ? (
            <HomePostListSkeleton count={3} />
          ) : (
            <div className="post-list mobile-post-list" style={{ padding: "0 15px" }}>
              {latestPosts.map((post) => (
                <div key={post.id} className="post-item mobile-post-item" style={{ padding: "10px 0" }}>
                  <div className="post-title" style={{ fontSize: "1rem" }}>{post.title}</div>
                  <div className="post-meta" style={{ fontSize: "0.75rem" }}>{post.meta}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 页脚（为底部导航留出空间） */}
      <SiteFooter style={{ paddingBottom: `${mobileBottomNavHeight + 10}px` }} />

      {/* Cookie 提示条（移动端适配：同意 + 查看详情） */}
      {showCookie && (
        <div className="cookie-bar mobile-cookie-bar" style={{ padding: "10px 15px", bottom: `${mobileBottomNavHeight + 1}px` }}>
          <div className="cookie-inner" style={{ flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
            <div style={{ fontSize: "0.8rem", textAlign: "left" }}>
              为提升浏览体验，我们使用必要的 Cookie 及统计工具，不会收集敏感隐私信息。
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="cookie-btn mobile-button-responsive" onClick={() => navigate('/policies/cookies')}>查看详情</button>
              <button className="cookie-btn mobile-button-responsive" onClick={handleCookieAccept}>同意</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileHomePage;
