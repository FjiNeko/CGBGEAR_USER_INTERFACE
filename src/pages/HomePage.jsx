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


// 前置导入
import React, { useEffect, useRef, useState } from "react";
// import "../css/main.css";



import { useNavigate } from "react-router-dom";
import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";

// 导入骨架屏组件
import HomeStatsSkeleton from "../components/HomeStatsSkeleton";
import HomePostListSkeleton from "../components/HomePostListSkeleton";






// ===============================================
//           丙午马年 - 新春专辑
// ===============================================
// import "../css/festival-special/main.css";
// const FestivalImageBaseLink = "/festivals/newyear"
// import LuckyWheel from "../components/activity/LuckyWheel";



// ************* 1. 引入真实的 API 调用函数 *************
import { getHomeStats } from "../api/api";



const TacticalHomePage = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [navSolid, setNavSolid] = useState(false);
  const [showCookie, setShowCookie] = useState(false);

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [actualStats, setActualStats] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);




  // Hero 区滚动后导航变为黑底
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const heroHeight = heroRef.current.offsetHeight || 0;
      const navHeight = 64;
      const scrolled = window.scrollY > heroHeight - navHeight - 20;
      setNavSolid(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cookie 状态初始化（与移动端统一）
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

  // 执行同意并关闭
  const handleCookieAgree = () => {
    setShowCookie(false);
    try {
      window.localStorage.setItem(CONSENT_KEY, CONSENT_VALUE);
    } catch (e) { }
  };

  // 查看政策
  const handleViewPolicy = () => {
    navigate('/policies/cookies');
  };

  // ************* 2. 修改：加载真实的统计数据 *************
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const response = await getHomeStats();
        if (response.code === 200 && response.data) {
          const statsData = response.data;

          console.log(statsData)

          // ** 数据转换 **
          // 后端返回的是对象 { "topics": 1, "posts": 2, ... }
          // 前端组件需要的是数组 [{ key: "topics", label: "...", value: "1"}, ...]
          // 所以在这里进行转换
          const formattedStats = [
            { key: "topics", label: "主题数", value: statsData.topics.toLocaleString() },
            { key: "posts", label: "帖子数", value: statsData.posts.toLocaleString() },
            { key: "users", label: "用户数", value: statsData.users.toLocaleString() },
            { key: "online", label: "在线数", value: statsData.online.toLocaleString() }
          ];


          setActualStats(formattedStats);
        } else {
          console.error("获取首页统计失败:", response.message);
        }
      } catch (error) {
        console.error("加载首页统计时发生网络错误:", error);
        // 可以在这里设置错误状态
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  // 模拟异步加载最新帖子数据 (这个暂时保持不变)
  useEffect(() => {
    setIsLoadingPosts(true);
    const fetchPosts = async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 500));
      setLatestPosts([
        { id: 1, title: "[造型分享] MCBK 轻量化巡逻套装记录", meta: "5 分钟前 · @HARDCORE" },
        { id: 2, title: "[经验] 夜视环境下的外拍沟通与安全流程", meta: "32 分钟前 · @NVG_CAT" },
        { id: 3, title: "[讨论] 新款尼龙配方实测：耐磨 / 抗水对比", meta: "2 小时前 · @LAB_RND" },
      ]);
      setIsLoadingPosts(false);
    };
    fetchPosts();
  }, []);


  const navItems = [
    { key: "home", label: "首页", routes: "/" },
    { key: "brand", label: "品牌产品", routes: "/product" },
    { key: "players", label: "玩家优质作品", routes: "/premium-players" },
    { key: "benefit", label: "福利专区", routes: "/benefitss" },
    { key: "qa", label: "答疑解惑", routes: "/qa" },
    { key: "trade", label: "出物 / 收物", routes: "/trade" }
  ];

  // 基础图片 URL 前缀，可以根据需要调整（四宫格）
  const IMAGE_BASE_URL_PREFIX = "http://img.cgbgear.cn/wpage/btn/wrapper-btn";
  const gridCardData = [
    {
      id: 'notice', // 唯一标识符，可用于key
      imageUrl: `${IMAGE_BASE_URL_PREFIX}/wrapper-notice.png_.webp`,
      backgroundPositionY: "-9.5vh",
      label: "SYSTEM",
      titleCn: "网站公告",
      titleEn: "Website Announcement / Suggestion",
      titleCnStyle: null, // 或者 {}
      titleEnStyle: null,
      buttonTextCn: "查看",
      buttonTextEn: "VIEW",
      buttonAction: () => navigate('/notice'), // 传递 navigate 函数
    },
    {
      id: 'signup',
      imageUrl: `${IMAGE_BASE_URL_PREFIX}/wrapper-sign-up.png_.webp`,
      backgroundPositionY: "-5.5vh",
      label: "EVENT",
      titleCn: "军推/场地/漫展/外拍招募活动",
      titleEn: "Field Shooting Sign-up Event",
      titleCnStyle: null,
      titleEnStyle: null,
      buttonTextCn: "查看",
      buttonTextEn: "VIEW",
      buttonAction: () => console.log('招募活动按钮点击'), // 如果没有特定路由，可以是个普通函数
    },
    {
      id: 'advice',
      imageUrl: `${IMAGE_BASE_URL_PREFIX}/wrapper-prictical-milltary.png_.webp`,
      backgroundPositionY: "-9.5vh",
      label: "ADVICE",
      titleCn: "军警实用装备建议/意见",
      titleEn: "Suggestions on Practical Military and Police Equipment",
      // titleCnStyle: { color: "black" }, // 注意这里有颜色
      // titleEnStyle: { color: "black" },
      titleCnStyle: null,
      titleEnStyle: null,
      buttonTextCn: "发布意见",
      buttonTextEn: "POST",
      buttonAction: () => console.log('发布意见按钮点击'),
    },
    {
      id: 'nylon-satellite',
      imageUrl: `${IMAGE_BASE_URL_PREFIX}/wrapper-speical.png_.webp`,
      backgroundPositionY: "0",
      label: "LAB",
      titleCn: "尼龙卫星",
      titleEn: "Special Plan for R&D of Nylon Tactical Equipment",
      titleCnStyle: null,
      titleEnStyle: null,
      buttonTextCn: "查看",
      buttonTextEn: "VIEW",
      buttonAction: () => console.log('尼龙卫星按钮点击'),
    },
  ];
  const brandCardData = [
    {
      id: 'brand-story-1', // 唯一标识符
      lines: [
        "我们做装备",
        "也和玩家一起",
        "讲好每一个故事"
      ],
      buttonTextCn: "查看品牌故事",
      buttonTextEn: "VIEW",
      buttonAction: () => navigate('/brand-story'), // 假设点击后跳转到品牌故事页面
      imageUrl: `${IMAGE_BASE_URL_PREFIX}/wrapper-brand-stories.png_.webp`,
      backgroundPosition: "center",
      backgroundSize: "contain"
    },
  ];


  return (
    <div className="page">
      <MainNav navSolid={navSolid} />

      {/* ... Hero 和其他 JSX 部分保持不变 ... */}
      <section className="hero" ref={heroRef}>
        <div className="hero-media" />
        <div className="hero-overlay">
          <div className="hero-inner">
            <div className="hero-tagline">
              <div className="hero-tagline-label">优秀玩家展示 · ELITE PLAYERS</div>
              <div className="hero-tagline-title">
                装备不止于酷。
                <br />
                它定义你的战术角色。
              </div>
              <div className="hero-tagline-sub">
                记录玩家真实的战术造型、实战体验与装备搭配建议，
                从战术腰封到外骨骼，我们和你一起打磨每一件器材。
              </div>
            </div>
            <div className="hero-user-card">
              <div className="hero-user-handle">@木日</div>
              <div className="hero-user-text">
                {/* Some text — 这里可以展示玩家签名、上墙理由或当前推荐活动。
                支持后续替换为动态内容，如本周优质玩家 / 推荐话题。 */}
                sdu近现役玩家，在尼龙大团体中，
                {"\n"}SDU飞虎队玩家是一群带着鲜明信仰印记的特殊群体。
                他们不止是操控虚拟角色的玩家，更是香港警务处特别任务连（SDU）
                {"\n"}“精英反恐、专业致胜”精神的传承者，在像素与代码构筑的战场中，
                {"\n"}复刻着这支传奇部队的铁血荣光与战术智慧。我也会坚守这份信念
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="main-wrapper">
        <div className="two-column">
          <div className="left-column">
            <article className="banner-card">
              <div
                className="banner-media"
                style={{
                  backgroundImage:
                    "url('http://img.cgbgear.cn/wpage/btn/wrapper-btn/wrapper-forum.PNG_.webp')"
                }}
              />
              <div className="banner-overlay" />
              <div className="banner-content">
                <div>
                  <div className="banner-title-cn">造型论坛</div>
                  <div className="banner-title-en">
                    Tactical Gear Styling Forum
                  </div>
                </div>
                <div className="banner-actions">
                  <button className="banner-btn" onClick={() => navigate('/forum')}>
                    <span className="banner-btn-label-cn">进入</span>
                    <span className="banner-btn-label-en">ENTER</span>
                  </button>
                </div>
              </div>
            </article>

            {/* 其他卡片... */}
            <article className="banner-card">
              <div
                className="banner-media"
                style={{
                  backgroundImage:
                    "url('http://img.cgbgear.cn/wpage/btn/wrapper-btn/wrapper-product.png_.webp')"
                }}
              />
              <div className="banner-overlay" />
              <div className="banner-content">
                <div>
                  <div className="banner-title-cn">CGBGEAR产品</div>
                  <div className="banner-title-en">
                    CGBGEAR tactical products
                  </div>
                </div>
                <div className="banner-actions">
                  {/* /<button className="banner-btn secondary" onClick={() => navigate('/product')}> */}
                  <button className="banner-btn" onClick={() => navigate('/product')}>
                    <span className="banner-btn-label-cn">查看</span>
                    <span className="banner-btn-label-en">VIEW</span>
                  </button>
                </div>
              </div>
            </article>

            <article className="banner-card">
              <div
                className="banner-media"
                style={{
                  backgroundImage:
                    "url('http://img.cgbgear.cn/wpage/btn/wrapper-btn/wrapper-3dgears.jpg_.webp')",
                  backgroundPositionY:
                    "-8.5vh"
                }}
              />
              <div className="banner-overlay" />
              <div className="banner-content">
                <div>
                  <div className="banner-title-cn">个人3D战术装备</div>
                  <div className="banner-title-en">
                    Personal 3D Tactical Gear
                  </div>
                </div>
                <div className="banner-actions">
                  <button className="banner-btn">
                    <span className="banner-btn-label-cn">进入</span>
                    <span className="banner-btn-label-en">ENTER</span>
                  </button>
                </div>
              </div>
            </article>

            <article className="banner-card">
              <div
                className="banner-media"
                style={{
                  backgroundImage:
                    "url('http://img.cgbgear.cn/wpage/btn/wrapper-btn/wrapper-field-shooting.jpg_.webp')"
                }}
              />
              <div className="banner-overlay" />
              <div className="banner-content">
                <div>
                  <div className="banner-title-cn">外拍经验分享</div>
                  <div className="banner-title-en">
                    Field Shooting Experience Sharing
                  </div>
                </div>
                <div className="banner-actions">
                  <button className="banner-btn">
                    <span className="banner-btn-label-cn">参与讨论</span>
                    <span className="banner-btn-label-en">JOIN</span>
                  </button>
                </div>
              </div>
            </article>

          </div>
          <aside className="right-column">
            {isLoadingStats ? (
              <HomeStatsSkeleton />
            ) : (
              <section className="stats-panel">
                <div className="panel-title">社区数据 / COMMUNITY STATS</div>
                <div className="stats-grid">
                  {actualStats.map((s) => (
                    <div key={s.key} className="stats-item">
                      <div className={`stats-icon stats-icon-${s.key}`} aria-hidden="true">
                        {/* SVG Icons... */}
                        {s.key === "topics" && <svg className="stats-icon-svg" viewBox="0 0 1024 1024"><path d="M476.021333 544h63.424l8.533334-64h-63.424l-8.533334 64zM512 85.333333c235.637333 0 426.666667 191.029333 426.666667 426.666667S747.637333 938.666667 512 938.666667a424.778667 424.778667 0 0 1-219.125333-60.501334 2786.56 2786.56 0 0 0-20.053334-11.765333l-104.405333 28.48c-23.893333 6.506667-45.802667-15.413333-39.285333-39.296l28.437333-104.288c-11.008-18.688-18.218667-31.221333-21.802667-37.909333A424.885333 424.885333 0 0 1 85.333333 512C85.333333 276.362667 276.362667 85.333333 512 85.333333z m89.557333 234.944a32 32 0 0 0-35.946666 27.498667L556.512 416h-63.424l7.968-59.776a32 32 0 0 0-63.445333-8.448L428.512 416H352a32 32 0 0 0 0 64h67.978667l-8.533334 64H352a32 32 0 0 0 0 64h50.912l-7.968 59.776a32 32 0 0 0 63.445333 8.448L467.488 608h63.424l-7.968 59.776a32 32 0 0 0 63.445333 8.448L595.488 608H672a32 32 0 0 0 0-64h-67.978667l8.533334-64H672a32 32 0 0 0 0-64h-50.912l7.968-59.776a32 32 0 0 0-27.498667-35.946667z" /></svg>}
                        {s.key === "posts" && <svg className="stats-icon-svg" viewBox="0 0 1024 1024"><path d="M765.793488 897.027008 329.124949 897.027008c-53.591665 0-97.037609-43.047414-97.037609-96.15001l0-576.896864c0-53.103995 43.445944-96.151609 97.037609-96.151609l339.63093 0 194.075217 192.300021c0 35.304663 0 480.749852 0 480.749852C862.831097 853.979394 819.385153 897.027008 765.793488 897.027008zM668.75588 195.90197c0 57.232996 0 76.14997 0 76.14997 0 26.549799 21.722272 48.076604 48.519704 48.076604l72.767264 0L668.75588 195.90197zM814.311593 368.202151c-56.488501 0-97.037609 0-97.037609 0-53.593264 0-97.037609-43.044416-97.037609-96.151609 0 0-1.130633-38.581442-0.687534-96.146812l-290.423693 0c-26.795832 0-48.518105 21.51921-48.518105 48.075005l0 576.896864c0 26.549799 21.722272 48.075005 48.518105 48.075005l436.668539 0c26.795832 0 48.518105-21.526805 48.518105-48.075005L814.311793 368.202151zM693.014832 704.725388 401.902006 704.725388c-13.397916 0-24.258952-10.764102-24.258952-24.035904 0-13.277998 10.859637-24.040501 24.258952-24.040501l291.113025 0c13.397916 0 24.257553 10.762703 24.257553 24.040501C717.272385 693.961286 706.412748 704.725388 693.014832 704.725388zM693.014832 560.500573 401.902006 560.500573c-13.397916 0-24.258952-10.761104-24.258952-24.039101 0-13.271802 10.859637-24.034305 24.258952-24.034305l291.113025 0c13.397916 0 24.257553 10.762703 24.257553 24.034305C717.272385 549.739469 706.412748 560.500573 693.014832 560.500573z" /></svg>}
                        {s.key === "online" && <svg className="stats-icon-svg" viewBox="0 0 1024 1024"><path d="M48.505263 692.547368c-10.778947-2.694737-21.557895 2.694737-24.252631 13.473685-2.694737 10.778947 2.694737 21.557895 13.473684 24.252631 110.484211 32.336842 194.021053 123.957895 220.968421 234.442105 2.694737 8.084211 10.778947 13.473684 18.863158 13.473685h5.389473c10.778947-2.694737 16.168421-13.473684 13.473685-21.557895-29.642105-126.652632-123.957895-226.357895-247.91579-264.084211zM45.810526 447.326316c-10.778947-2.694737-18.863158 5.389474-21.557894 16.168421-2.694737 10.778947 5.389474 18.863158 16.168421 21.557895 239.831579 40.421053 428.463158 239.831579 460.8 482.357894 0 10.778947 8.084211 16.168421 18.863158 16.168421h2.694736c10.778947 0 18.863158-10.778947 16.168421-21.557894-32.336842-258.694737-234.442105-471.578947-493.136842-514.694737z" /><path d="M45.810526 223.663158c-10.778947 0-18.863158 8.084211-21.557894 16.168421 0 10.778947 5.389474 18.863158 16.168421 21.557895 361.094737 43.115789 646.736842 336.842105 679.073684 697.936842 0 10.778947 8.084211 16.168421 18.863158 16.168421h2.694737c10.778947 0 18.863158-10.778947 16.168421-21.557895C722.189474 579.368421 423.073684 269.473684 45.810526 223.663158zM994.357895 45.810526c-8.084211-8.084211-18.863158-8.084211-26.947369 0l-269.473684 269.473685-150.905263-150.905264c-8.084211-8.084211-18.863158-8.084211-26.947368 0s-8.084211 18.863158 0 26.947369l164.378947 164.378947c2.694737 2.694737 8.084211 5.389474 13.473684 5.389474s10.778947-2.694737 13.473684-5.389474L994.357895 72.757895c5.389474-5.389474 5.389474-18.863158 0-26.947369z" /></svg>}
                        {s.key === "users" && <svg className="stats-icon-svg" viewBox="0 0 1024 1024"><path d="M295.901 526.09c-40.64-33.009-66.64-83.58-66.64-140.27 0-99.455 80.024-180.08 178.739-180.08s178.738 80.625 178.738 180.08c0 56.69-25.999 107.261-66.64 140.27C627.995 570.604 704 677.451 704 802.184c0 12.032-0.707 23.898-2.082 35.557h-64.336a237.55 237.55 0 0 0 2.664-35.557c0-129.229-103.98-233.99-232.246-233.99-128.266 0-232.246 104.761-232.246 233.99 0 12.088 0.91 23.962 2.664 35.557h-64.336A303.534 303.534 0 0 1 112 802.184c0-124.733 76.006-231.58 183.901-276.094zM408 501.668c63.504 0 114.985-51.866 114.985-115.847 0-63.981-51.48-115.848-114.985-115.848-63.504 0-114.985 51.867-114.985 115.848 0 63.98 51.48 115.847 114.985 115.847zM615.759 187c98.652 0 178.626 80.64 178.626 180.116 0 56.7-25.983 107.281-66.598 140.297 107.827 44.523 183.785 151.392 276.149 0 12.034-0.706 23.902-2.08 35.564h-64.296a237.79 237.79 0 0 0 2.663-35.564c0-129.255-103.915-234.036-232.1-234.036h0.76c-18.375 0-33.27-14.895-33.27-33.27 0-18.374 14.895-33.27 33.27-33.27h-0.76c63.464 0 114.912-51.877 114.912-115.87 0-63.994-51.448-115.87-114.912-115.87-4.44 0-9.626 0.533-15.557 1.602-15.46 2.785-30.252-7.491-33.037-22.953a28.445 28.445 0 0 1-0.301-2.133c-1.997-19.42 11.83-36.901 31.189-39.43 6.803-0.888 12.705-1.332 17.706-1.332z" /></svg>}
                      </div>
                      <div className="stats-meta">
                        <div className="stats-label">{s.label}</div>
                        <div className="stats-value">{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {/* 其他右侧面板... */}
            <section className="nv-panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title-main">互动信息</div>
                  <div className="panel-title-sub">INTERACTION FEED</div>
                </div>
              </div>
              <div className="nv-body">
                <div className="nv-placeholder">
                  这里显示最新回复、@提及或活动提醒。
                  <br />
                  例如：某玩家在「造型论坛」发布了新的战术腰封搭配。
                </div>
              </div>
            </section>

            <section className="nv-panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title-main">热门话题</div>
                  <div className="panel-title-sub">HOT TOPICS</div>
                </div>
              </div>
              <div className="nv-body">
                <div className="nv-placeholder">
                  · 你最常用的战术腰封配置？
                  <br />
                  · 夜拍时如何兼顾安全与效果？
                  <br />
                  · 新款尼龙配方长期耐用性讨论……
                </div>
              </div>
            </section>

          </aside>
        </div>

        {/* 四宫格板块 */}
        {/* 在四宫格区域的文字（grid-card-inner），添加一个蒙版层，不然文字被图片遮挡了。模仿MobileHomePage.jsx里的四宫格添加的蒙版。*/}
        <section className="grid-section">
          <div className="grid-cards">
            {/* 这里就是动态渲染所有卡片的地方 */}
            {gridCardData.map((card) => (
              <article
                key={card.id} // 必须为列表中的每个元素提供一个唯一的 key
                className="grid-card"
                style={{
                  backgroundImage: `url('${card.imageUrl}')`, // 动态绑定图片 URL
                  // backgroundPositionY: card.backgroundPositionY, // 动态绑定背景定位
                  position: 'relative', // 使蒙版与文字的绝对定位基于卡片
                  overflow: 'hidden',  // 防止蒙版溢出
                }}
              >
                {/* 图片暗色蒙版，避免文字被图片干扰可读性（与 MobileHomePage 同款渐变）*/}
                <div
                  className="grid-card-overlay"
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.6) 100%)',
                    zIndex: 0,
                  }}
                />
                <div className="grid-card-inner" style={{ position: 'relative', zIndex: 1 }}>
                  <div className="section-label">{card.label}</div>
                  <div className="grid-title-cn" style={card.titleCnStyle}>
                    {card.titleCn}
                  </div>
                  <div className="grid-title-en" style={card.titleEnStyle}>
                    {card.titleEn}
                  </div>
                  <div className="grid-actions">
                    <button className="grid-btn" onClick={card.buttonAction}>
                      <span>{card.buttonTextCn}</span>
                      <span>{card.buttonTextEn}</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {/* 注意：你原始代码中手动重复的 <article> 标签已经被这个 map 循环替换了，
              所以这里不需要再有其他 <article> 标签了。
              如果留着，会导致你的卡片重复显示。
        */}
          </div>
        </section>

        {/* 品牌与社区 (现在使用 map 渲染) */}
        <section className="brand-section">
          {brandCardData.map((card) => (
            <div className="brand-card"
              key={card.id}
              style={{
                backgroundImage: `url('${card.imageUrl}')`, // 动态绑定图片 URL
                backgroundPosition: card.backgroundPosition,
                backgroundSize: card.backgroundSize
              }}
            >
              <div className="brand-inner">
                <div className="brand-lines">
                  {/* 使用 map 遍历 lines 数组，并通过 \n 字符分隔 */}
                  {card.lines.map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < card.lines.length - 1 && "\n"}
                    </React.Fragment>
                  ))}
                </div>
                <button className="brand-btn" onClick={card.buttonAction}>
                  <span>{card.buttonTextCn}</span>
                  <span className="en">{card.buttonTextEn}</span>
                </button>
              </div>
            </div>
          ))}
        </section>



        {/* ======================================================== */}
        {/* [新增] 2. 在“最新帖子”上方或下方，放置大转盘 */}
        {/* 这里的 ID 必须对应 Banner 按钮里的 document.getElementById */}
        {/* <section id="lucky-wheel-section" style={{ margin: '60px 0' }}>
          <LuckyWheel />
        </section> */}
        {/* ======================================================== */}


        <section className="latest-section">
          <div className="section-header">
            <div className="section-title">最新帖子</div>
            <div className="section-more">查看全部 &gt;</div>
          </div>
          {isLoadingPosts ? (
            <HomePostListSkeleton count={3} />
          ) : (
            <div className="post-list">
              {latestPosts.map(post => (
                <div key={post.id} className="post-item">
                  <div className="post-title">{post.title}</div>
                  <div className="post-meta">{post.meta}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />

      {showCookie && (
        <div className="cookie-bar">
          <div className="cookie-inner">
            <div className="cookie-text">
              为提供更好的浏览体验，CGBGEAR 使用 Cookie 技术保障账户安全及记录偏好。
              继续使用即表示您同意我们的
              <span
                onClick={handleViewPolicy}
                style={{ color: '#6af500', cursor: 'pointer', textDecoration: 'underline', margin: '0 5px' }}
              >
                Cookie政策
              </span>。
            </div>
            <div className="cookie-btns" style={{ display: 'flex', gap: '12px' }}>
              <button
                className="cookie-btn-secondary"
                onClick={handleViewPolicy}
                style={{ background: 'transparent', color: '#fff', border: '1px solid #444', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer' }}
              >
                查看政策
              </button>
              <button
                className="cookie-btn"
                onClick={handleCookieAgree}
                style={{ background: '#6af500', color: '#000', border: 'none', padding: '6px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                同意并继续
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TacticalHomePage;
