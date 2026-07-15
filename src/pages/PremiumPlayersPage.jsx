// src/pages/PremiumPlayersPage.jsx
import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import "../css/main.css";
import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";



const categories = [
  { value: "all", label: "全部题材" },
  { value: "urban", label: "城市任务" },
  { value: "outdoor", label: "户外/山地" },
  { value: "convoy", label: "车队护送" },
];

export default function PremiumPlayersPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [category, setCategory] = useState("all");

  // 新增：控制导航是否黑底
  const heroRef = useRef(null);
  const [navSolid, setNavSolid] = useState(false);

  // Hero 区滚动后导航变为黑底（逻辑与 HomePage 一致）
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const heroHeight = heroRef.current.offsetHeight || 0;
      const navHeight = 64; // 跟 HomePage 保持一致
      const scrolled = window.scrollY > heroHeight - navHeight - 20;
      setNavSolid(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // 初始化时执行一次
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 轮播
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 3);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const filteredWorks = useMemo(
    () =>
      category === "all"
        ? mockWorks
        : mockWorks.filter((w) => w.category === category),
    [category]
  );

  return (
    <div className="page premium-page">
      {/* 顶部导航：传入 navSolid，让它在滚过 Hero 后变黑底 */}
      <MainNav navSolid={navSolid} />

      {/* ====== Hero 区（高度固定，供 navSolid 判断） ====== */}
      <section className="premium-hero-full" ref={heroRef}>
        <div className="premium-hero-carousel">
          {/* 背景轮播图 */}
          {["h1", "h2", "h3"].map((key, idx) => (
            <div
              key={key}
              className={
                "premium-hero-slide" + (idx === activeIndex ? " active" : "")
              }
            >
              <img
                src={
                  idx === 0
                    ? "https://img.cgbgear.cn/wpage/premium-player_CTRU.jpg_.webp"
                    : idx === 1
                    ? "https://images.pexels.com/photos/3019772/pexels-photo-3019772.jpeg?auto=compress&cs=tinysrgb&w=1600"
                    : "https://images.pexels.com/photos/843037/pexels-photo-843037.jpeg?auto=compress&cs=tinysrgb&w=1600"
                }
                alt="premium hero"
              />
            </div>
          ))}

          {/* HUD 层：扫描线 / 渐变 / 网格 / 噪点 */}
          <div className="premium-scan" />
          <div className="premium-hero-gradient" />
          <div className="premium-hero-grid" />
          <div className="premium-hero-noise" />

          {/* 左下角文字：打字机标题 + 副标题 */}
          <div className="premium-hero-text">
            <h1>Counter Terrorism Response Unit</h1>
            <p>玩家优质作品专区 · 记录每一场战术灵感与实战想象。</p>
          </div>

          {/* 轮播 dot 控件 */}
          <div className="premium-hero-dots">
            {[0, 1, 2].map((idx) => (
              <span
                key={idx}
                className={idx === activeIndex ? "active" : ""}
                onClick={() => setActiveIndex(idx)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ====== 下方主内容（1200px 居中） ====== */}
      <main className="premium-container">
        {/* 标题 + 简介 */}
        <section>
          <h2 className="premium-title">优质玩家作品展示</h2>
          <p className="premium-sub">
            展示社区玩家的战术造型作品，你可以按任务场景或风格进行筛选，进入详情页查看完整故事、装备配置与图片。
          </p>
        </section>

        {/* 筛选条 */}
        <section className="filter-bar">
          <span>筛选风格：</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </section>

        {/* 排行榜 */}
        <section className="rank-board">
          <h2>PREMIUM RANKING / 优质玩家排行榜</h2>
          <div className="rank-item">
            <span>Special Duties Unit</span>
            <span>97 pts</span>
          </div>
          <div className="rank-item">
            <span>Railway Response Team</span>
            <span>90 pts</span>
          </div>
          <div className="rank-item">
            <span>Counter Terrorism Response Unit</span>
            <span>88 pts</span>
          </div>
        </section>

        {/* 纵向大卡片列表 */}
        <section id="premium-works-list">
          <div id="premium-vertical">
            {filteredWorks.map((work, index) => (
              <article
                key={work.id}
                className={
                  "big-player-card visible" + (index === 0 ? " tilt" : "")
                }
              >
                {/* 顶部大图 + HUD 扫描条 */}
                <div className="big-card-img-wrap">
                  <img
                    src={work.thumb}
                    alt={work.title}
                    className="big-card-img"
                  />
                  <div className="big-card-img-scan" />
                </div>

                {/* HUD 四角 */}
                <span className="hud-corner tl" />
                <span className="hud-corner tr" />
                <span className="hud-corner bl" />
                <span className="hud-corner br" />

                {/* 内容区域 */}
                <div className="big-card-body">
                  <div className="big-player-name">{work.title}</div>
                  <div className="big-player-tagline">
                    作者：{work.author}
                  </div>

                  <div className="big-card-tags">
                    {work.tags.slice(0, 3).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>

                  <p className="big-player-bio">{work.desc}</p>

                  <div className="work-actions">
                    <button className="work-action-btn">
                      <i className="fa-regular fa-thumbs-up" />
                      <span>点赞</span>
                    </button>
                    <button className="work-action-btn">
                      <i className="fa-regular fa-bookmark" />
                      <span>收藏</span>
                    </button>
                    <Link
                      to={`/player-profile?id=${index + 1}&profileID=${
                        work.id
                      }&view=pc&browser=chrome`}
                      className="work-action-btn ghost"
                    >
                      <i className="fa-regular fa-comment-dots" />
                      <span>评论 / 查看详情</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <SiteFooter />
    </div>
  );
}
