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

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/main.css";
import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import { searchAll, getSearchHot, getSearchPlaceholder } from "../api/api";
import { buildSearchId } from "../utils/auth";

// 平台图标（复用原有 SVG）
function PlatformIcon({ platform }) {
  if (platform === "淘宝") {
    return (
      <svg className="buy-platform-icon buy-platform-icon-taobao" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M228.96 172.16a76.64 76.64 0 1 0 75.84 76.64 76.32 76.32 0 0 0-75.84-76.64zM317.76 535.52C307.52 458.24 160 360.48 160 360.48l-57.6 82.24s123.84 61.92 134.08 112S66.56 753.28 66.56 753.28l128 94.4s133.28-235.04 123.2-312.16z" fill="#FC8848" />
        <path d="M957.44 380.96c0-66.88-66.4-152.32-174.72-171.52s-263.04 60-286.88 64-30.56-3.52-30.56-3.52l27.2-53.12L400 178.56A416 416 0 0 1 355.04 288a425.28 425.28 0 0 1-74.72 92.64L338.08 432l76.32-90.88 50.88 5.12L372 464s3.36 39.52 32 41.28 72.96-67.04 72.96-67.04l52.48 10.4 1.76 68.64H360.16v46.24l169.6 5.12v145.92s-48.96 7.36-70.56-23.2-12.96-78.72-12.96-78.72L336 609.28s-6.88 84.64 22.56 126.88 90.24 57.12 152 51.84 215.84-70.72 215.84-70.72l10.08 46.4 81.44-37.76-49.12-130.4-66.24 13.76 6.88 56.64-81.6 36v-130.4L800 564.64v-48H624.8V448h168v-54.88H517.92l40.8-80A562.88 562.88 0 0 1 679.2 272c48-6.88 69.44-10.24 113.6 17.12a108.48 108.48 0 0 1 50.88 67.04v381.76a96 96 0 0 1-60.96 53.12c-48 16-124-1.6-124-1.6l-6.72 53.12s128 25.76 210.4-8.48 95.04-132.16 95.04-132.16z" fill="#FC8848" />
      </svg>
    );
  }
  if (platform === "闲鱼") {
    return (
      <svg className="buy-platform-icon buy-platform-icon-xianyu" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M0 0m170.666667 0l682.666666 0q170.666667 0 170.666667 170.666667l0 682.666666q0 170.666667-170.666667 170.666667l-682.666666 0q-170.666667 0-170.666667-170.666667l0-682.666666q0-170.666667 170.666667-170.666667Z" fill="#FEE50F" />
        <path d="M748.16 676.437333c66.901333 16.426667 118.058667 17.194667 153.173333 3.584a27.52 27.52 0 0 1 35.413334 14.762667 26.197333 26.197333 0 0 1-15.232 34.304c-47.530667 18.432-109.653333 17.493333-185.472-1.152-50.474667-9.984-91.989333-8.96-125.098667-0.512-10.965333 2.773333-20.053333 6.186667-27.178667 9.728l-2.090666 1.109333-3.669334 2.133334-1.962666 1.365333-2.389334 1.28-1.706666 0.768-3.029334 1.066667-3.968 0.768c-14.634667-0.768-24.106667-5.674667-28.501333-14.805334-4.394667-9.130667-2.176-19.413333 6.570667-30.933333l0.682666-0.682667 0.042667-0.042666h0.256l1.706667-1.322667 2.048-1.408 1.024-0.64c2.816-1.792 6.229333-3.712 10.112-5.632a192.426667 192.426667 0 0 1 38.186666-13.866667c41.258667-10.538667 91.221333-11.733333 151.082667 0.128zM195.84 561.92l17.792 7.552c5.802667 5.12 8.533333 11.178667 8.192 18.346667L221.44 705.28a25.429333 25.429333 0 0 1-7.936 17.92 27.264 27.264 0 0 1-18.901333 7.893333c-5.034667 0.170667-10.794667-2.261333-17.237334-7.381333a25.642667 25.642667 0 0 1-8.106666-18.346667l0.085333-118.826666c0.128-6.528 3.328-12.117333 8.405333-17.109334a23.125333 23.125333 0 0 1 18.090667-7.509333z m240.512-242.602667c9.685333 2.133333 16.042667 4.821333 19.072 7.936 4.522667 4.693333 7.253333 10.837333 7.125333 17.365334l-2.048 360.448a25.386667 25.386667 0 0 1-7.978666 17.92 23.381333 23.381333 0 0 1-18.517334 6.698666c-4.906667-0.213333-10.965333-2.304-18.218666-6.357333a26.922667 26.922667 0 0 1-7.552-18.133333l2.261333-207.786667-108.586667 0.298667-2.858666 207.573333a23.808 23.808 0 0 1-7.765334 17.28 22.869333 22.869333 0 0 1-18.090666 7.552c-4.48-0.085333-10.581333-2.218667-18.218667-6.4a22.101333 22.101333 0 0 1-8.149333-18.346667l2.389333-208.341333-108.544 0.298667-2.432 208.341333a24.021333 24.021333 0 0 1-8.362667 17.152 22.442667 22.442667 0 0 1-18.346666 8.106667c-4.864-0.256-10.752-2.986667-17.621334-8.192a19.242667 19.242667 0 0 1-8.533333-17.152l2.218667-361.045334a25.386667 25.386667 0 0 1 7.978666-17.9..." fill="#342318" />
      </svg>
    );
  }
  return null;
}

function useQuery() {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search), [location.search]);
}

export default function SearchResultsPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const keywords = query.get("keywords") || "";
  const show = parseInt(query.get("show") || "12", 10);
  const pageSize = Number.isNaN(show) ? 12 : show;

  const [scope, setScope] = useState("all");
  const [results, setResults] = useState({ products: [], works: [], qa: [], trade: [], no_keywords: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [placeholder, setPlaceholder] = useState("输入关键词开始搜索");
  const [searchInput, setSearchInput] = useState("");
  const [hotKeywords, setHotKeywords] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [phIndex, setPhIndex] = useState(0); // rotating placeholder index
  const [iconHover, setIconHover] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(-1);

  useEffect(() => {
    getSearchHot(10)
      .then((res) => {
        if (res?.code === 200 && Array.isArray(res.data?.items)) {
          setHotKeywords(res.data.items);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!keywords.trim()) {
      setResults({ products: [], works: [], qa: [], trade: [], no_keywords: true });
      setError("");
      getSearchPlaceholder().then((res) => {
        if (res?.code === 200 && res.data?.placeholder) {
          setPlaceholder(res.data.placeholder);
          setSearchInput("");
        }
      });
      return;
    }

    setLoading(true);
    setError("");
    searchAll({ keywords, scope: "all", show: pageSize })
      .then((res) => {
        if (res?.code === 200) {
          setResults({
            products: res.data?.products || [],
            works: res.data?.works || [],
            qa: res.data?.qa || [],
            trade: res.data?.trade || [],
            no_keywords: !!res.data?.no_keywords,
          });
        } else {
          setError(res?.msg || "搜索失败");
        }
      })
      .catch((e) => setError(e?.message || "搜索失败"))
      .finally(() => setLoading(false));
  }, [keywords, pageSize]);

  // Rotate placeholder among hot keywords when input is empty
  useEffect(() => {
    const list = (hotKeywords && hotKeywords.length > 0) ? hotKeywords : [placeholder];
    if (list.length <= 1 || searchInput.length > 0) return; // no rotation needed
    const timer = setInterval(() => {
      setPhIndex((idx) => (idx + 1) % list.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [hotKeywords, placeholder, searchInput]);

  const productResults = results.products.slice(0, pageSize);
  const workResults = results.works.slice(0, pageSize);
  const qaResults = results.qa.slice(0, pageSize);
  const tradeResults = results.trade.slice(0, pageSize);

  const hasKeyword = keywords.trim().length > 0;
  const totalResults = productResults.length + workResults.length + qaResults.length + tradeResults.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    const kw = (searchInput || placeholder || "").trim();
    if (!kw) return;
    const url = new URL(window.location.href);
    url.searchParams.set("keywords", kw);
    url.searchParams.set("show", String(pageSize));
    url.searchParams.set("id", buildSearchId());
    navigate(url.pathname + url.search);
  };

  // PC端：未提供关键词 -> 仅显示大型搜索框（置中），不展示结果布局
  if (!hasKeyword && results.no_keywords) {
    const wrapStyle = {
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 16px",
      };
    const boxStyle = { position: "relative", width: "min(780px, 100%)" };
    const formStyle = {
      display: "flex",
      alignItems: "center",
      width: "100%",
      background: "#0f0f0f",
      border: "1px solid #2a2a2a",
      borderRadius: "9999px",
      padding: "8px",
      boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
    };
    const logoRowStyle = { display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 };
    const hotWrapStyle = { marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" };
    const hotTagStyle = { padding: "6px 12px", borderRadius: 999, background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#d4d4d4", cursor: "pointer", fontSize: 13 };
    const inputWrapStyle = { position: "relative", flex: 1 };
    const inputStyle = {
      width: "100%",
      height: 56,
      border: "none",
      outline: "none",
      background: "transparent",
      color: "#e5e5e5",
      padding: "0 16px 0 18px",
      fontSize: 18,
    };
    const btnStyle = {
      height: 40,
      padding: "0 18px",
      borderRadius: 999,
      border: "1px solid #2a2a2a",
      background: "#1f1f1f",
      color: "#e5e5e5",
      cursor: "pointer",
      fontSize: 14,
      display: "flex",
      alignItems: "center",
      gap: 8,
      transition: "transform 200ms ease"
    };
    const btnTransform = iconHover ? "scale(1.06)" : "scale(1.0)";
    const phContainerStyle = {
      position: "absolute",
      left: 18,
      right: 12,
      top: "50%",
      transform: "translateY(-50%)",
      height: 22,
      overflow: "hidden",
      color: "#9ca3af",
      pointerEvents: "none",
      fontSize: 16,
      lineHeight: "22px",
      opacity: searchInput ? 0 : 1,
      transition: "opacity 180ms ease"
    };
    const list = (hotKeywords && hotKeywords.length > 0) ? hotKeywords : [placeholder];
    const innerStyle = {
      display: "block",
      transition: "transform 380ms ease",
      transform: `translateY(-${phIndex * 22}px)`
    };
    const dropdownStyle = {
      position: "absolute",
      top: 72,
      left: 0,
      right: 0,
      background: "#0f0f0f", // same as search box
      border: "1px solid #2a2a2a", // same as search box
      borderRadius: 12,
      boxShadow: "0 10px 32px rgba(0,0,0,0.45)",
      padding: 8,
      display: isFocused && list.length > 0 ? "block" : "none",
      maxHeight: 320,
      overflowY: "auto",
      zIndex: 5
    };
    const itemStyle = {
      padding: "10px 12px",
      borderRadius: 8,
      color: "#e5e5e5",
      cursor: "pointer",
      outline: "none",
      border: "none",
      transition: "background 160ms ease, color 160ms ease"
    };
    const itemHoverStyle = {
      background: "rgba(34,197,94,0.16)",
      color: "#bbf7d0"
    };
    return (
      <div className="page search-page">
        <MainNav navSolid={true} />
        <div style={wrapStyle}>
          {/* 上方 Logo（与 MainNav 保持风格，使用相同的 logo 标记类名以复用主站样式） */}
          <div style={logoRowStyle}>
            <div className="logo" style={{ cursor: 'default' }}>
              <div className="logo-mark" />
            </div>
          </div>
          <div style={boxStyle}>
            {/* Win11 OOBE-like green gradient orb behind the search box */}
            <style>{`
              @keyframes orbFloat { 0% { transform: translate(-20px, -10px) scale(1); opacity: 0.55; }
                50% { transform: translate(30px, 10px) scale(1.1); opacity: 0.7; }
                100% { transform: translate(-10px, 20px) scale(0.95); opacity: 0.55; } }
            `}</style>
            <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
              <div style={{ position: "absolute", width: 280, height: 280, left: "50%", top: -40, transform: "translateX(-50%)",
                borderRadius: "50%", background: "radial-gradient(circle at 50% 50%, rgba(34,197,94,0.35), rgba(34,197,94,0) 60%)",
                filter: "blur(28px)", animation: "orbFloat 8s ease-in-out infinite alternate" }} />
            </div>
            <form style={formStyle} onSubmit={handleSubmit}>
              <div style={inputWrapStyle}>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder={""}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
                {/* Animated rotating placeholder overlay */}
                <div style={phContainerStyle} aria-hidden>
                  <div style={innerStyle}>
                    {list.map((w) => (
                      <div key={w} style={{ height: 22 }}>{w}</div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Submit button with animated scale */}
              <button
                type="submit"
                style={{ ...btnStyle, transform: btnTransform }}
                aria-label="搜索"
                onMouseEnter={() => setIconHover(true)}
                onMouseLeave={() => setIconHover(false)}
              >
                <svg className="search-icon-svg" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                  <path d="M650.666667 245.333333c113.066667 113.066667 113.066667 294.4 0 407.466667-113.066667 113.066667-294.4 113.066667-407.466667 0-113.066667-113.066667-113.066667-294.4 0-407.466667 113.066667-113.066667 296.533333-113.066667 407.466667 0z m-44.8 44.8c-87.466667-87.466667-228.266667-87.466667-315.733334 0-87.466667 87.466667-87.466667 228.266667 0 315.733334 87.466667 87.466667 228.266667 87.466667 315.733334 0 87.466667-87.466667 87.466667-228.266667 0-315.733334z" fill="#e5e5e5" />
                  <path d="M614.4 661.333333l179.2 179.2c8.533333 8.533333 21.333333 8.533333 29.866667 0l14.933333-14.933333c8.533333-8.533333 8.533333-21.333333 0-29.866667L661.333333 614.4 614.4 661.333333z" fill="#e5e5e5" />
                </svg>
              </button>
            </form>
            {/* Focus dropdown with hot keywords */}
            <div style={dropdownStyle}>
              {list.map((kw, idx) => (
                <div
                  key={kw}
                  style={{ ...itemStyle, ...(hoverIdx === idx ? itemHoverStyle : null) }}
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx(-1)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const url = new URL(window.location.href);
                    url.searchParams.set("keywords", kw);
                    url.searchParams.set("show", String(pageSize));
                    url.searchParams.set("id", buildSearchId());
                    navigate(url.pathname + url.search);
                  }}
                >
                  {kw}
                </div>
              ))}
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="page search-page">
      <MainNav navSolid={true} />

      <header className="search-hero">
        <div className="search-hero-inner">
          <div className="search-hero-tag">搜索结果 / SEARCH RESULTS</div>
          <h1 className="search-hero-title">关键词： <span className="search-keyword">{keywords || "未提供"}</span></h1>
          <p className="search-hero-sub">当前支持在「品牌产品、玩家优质作品、问答、出物 / 收物」四个维度内检索，商品类结果采用与品牌产品页一致的卡片布局，其余使用列表样式展示。</p>
        </div>
      </header>

      <main className="products-main search-main">
        <aside className="products-sidebar search-sidebar">
          <div className="products-sidebar-inner">
            <div className="sidebar-title">搜索范围 / SCOPE</div>
            <div className="search-scope-list">
              {[
                { key: "all", label: "全部结果" },
                { key: "products", label: "品牌产品" },
                { key: "works", label: "玩家优质作品" },
                { key: "qa", label: "问答" },
                { key: "trade", label: "出物 / 收物" },
              ].map((item) => (
                <button key={item.key} type="button" className={`scope-pill ${scope === item.key ? "active" : ""}`} onClick={() => setScope(item.key)}>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="sidebar-group">
              <div className="sidebar-group-label">每页显示条数</div>
              <select
                className="sidebar-select"
                defaultValue={pageSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!Number.isNaN(val)) {
                    const url = new URL(window.location.href);
                    url.searchParams.set("show", String(val));
                    window.location.href = url.toString();
                  }
                }}
              >
                <option value="12">每页 12 条</option>
                <option value="24">每页 24 条</option>
                <option value="48">每页 48 条</option>
              </select>
            </div>

            {hotKeywords.length > 0 && (
              <div className="sidebar-group">
                <div className="sidebar-group-label">热搜</div>
                <div className="hot-keywords">
                  {hotKeywords.map((kw) => (
                    <button key={kw} className="hot-tag" type="button" onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set("keywords", kw);
                      url.searchParams.set("show", String(pageSize));
                      url.searchParams.set("id", buildSearchId());
                      window.location.href = url.toString();
                    }}>{kw}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <section className="products-content search-content">
          {loading && <div className="search-loading">加载中...</div>}
          {error && <div className="search-error">{error}</div>}

          {/* 无关键词时已在顶层提前返回，仅关键词模式会走到这里 */}

          {hasKeyword && !results.no_keywords && totalResults === 0 && (
            <div className="search-empty">终端未进行回应 （{keywords}）</div>
          )}

          {hasKeyword && (scope === "all" || scope === "products") && productResults.length > 0 && (
            <section className="search-block">
              <div className="search-block-header">
                <h2 className="search-block-title">品牌产品</h2>
                <span className="search-block-count">{productResults.length} 件</span>
              </div>
              <div className="products-grid">
                {productResults.map((p) => (
                  <article key={p.id} className="product-card">
                    <a href={`/products/${p.id}`} className="product-card-media-wrap">
                      <div className="product-card-media" style={{ backgroundImage: `url(${p.image})` }} />
                      <div className="product-card-scan-layer" />
                      {p.is_new && <span className="product-badge new">NEW</span>}
                      {p.hot_score >= 90 && <span className="product-badge hot">HOT</span>}
                    </a>
                    <div className="product-card-body">
                      <div className="product-brand-row">
                        <span className="product-brand">{p.brand}</span>
                        <span className="product-category">{p.category}</span>
                      </div>
                      <h3 className="product-title-cn">{p.name}</h3>
                      <div className="product-title-en">{p.name_en}</div>
                      <div className="product-meta-row">
                        <div className="product-price"><span className="price-label">价格</span><span className="price-value">¥ {p.price}</span></div>
                        <div className="product-hot">热度 / HEAT <span className="product-hot-score">{p.hot_score}</span></div>
                      </div>
                      {Array.isArray(p.tags) && p.tags.length > 0 && (
                        <div className="product-tags">
                          {p.tags.map((tag) => (<span key={tag} className="product-tag">{tag}</span>))}
                        </div>
                      )}
                      <div className="product-card-footer">
                        {p.buy_url && (
                          <a href={p.buy_url} className="product-buy-btn" target="_blank" rel="noopener noreferrer">
                            <div className="buy-main-row"><span className="buy-label-cn">立即购买</span><PlatformIcon platform={p.buy_platform} /></div>
                            <span className="buy-label-en">BUY ON {p.buy_platform}</span>
                          </a>
                        )}
                        <div className="product-social">
                          <button type="button" className="social-btn social-fav"><span className="social-label">收藏</span><span className="social-count">{p.favorites}</span></button>
                          <button type="button" className="social-btn social-like"><span className="social-label">点赞</span><span className="social-count">{p.likes}</span></button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {hasKeyword && (scope === "all" || scope === "works") && workResults.length > 0 && (
            <section className="search-block">
              <div className="search-block-header"><h2 className="search-block-title">玩家优质作品</h2><span className="search-block-count">{workResults.length} 条</span></div>
              <div className="search-list">
                {workResults.map((w) => (
                  <article key={w.id} className="search-list-item">
                    <div className="search-list-title">{w.title}</div>
                    <div className="search-list-meta">作者 {w.author}</div>
                    <div className="search-list-summary">{w.summary}</div>
                    <div className="search-list-tags">{Array.isArray(w.tags) && w.tags.map((tag) => (<span key={tag} className="search-list-tag">{tag}</span>))}</div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {hasKeyword && (scope === "all" || scope === "qa") && qaResults.length > 0 && (
            <section className="search-block">
              <div className="search-block-header"><h2 className="search-block-title">问答</h2><span className="search-block-count">{qaResults.length} 条</span></div>
              <div className="search-list">
                {qaResults.map((q) => (
                  <article key={q.id} className="search-list-item">
                    <div className="search-list-title">{q.title}</div>
                    <div className="search-list-meta">提问者 {q.asker} · {q.replies} 回复</div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {hasKeyword && (scope === "all" || scope === "trade") && tradeResults.length > 0 && (
            <section className="search-block">
              <div className="search-block-header"><h2 className="search-block-title">出物 / 收物信息</h2><span className="search-block-count">{tradeResults.length} 条</span></div>
              <div className="products-grid">
                {tradeResults.map((t) => (
                  <article key={t.id} className="product-card">
                    <a href={`/trade/${t.id}`} className="product-card-media-wrap">
                      <div className="product-card-media" style={{ backgroundImage: `url(${t.image})` }} />
                      <div className="product-card-scan-layer" />
                    </a>
                    <div className="product-card-body">
                      <div className="product-brand-row"><span className="product-brand">{t.type}</span><span className="product-category">TRADE</span></div>
                      <h3 className="product-title-cn">{t.name}</h3>
                      <div className="product-meta-row"><div className="product-price"><span className="price-label">目标价格</span><span className="price-value">¥ {t.price}</span></div></div>
                      <div className="product-card-footer">
                        {t.buy_url && (
                          <a href={t.buy_url} className="product-buy-btn" target="_blank" rel="noopener noreferrer">
                            <div className="buy-main-row"><span className="buy-label-cn">联系出物方</span><PlatformIcon platform={t.buy_platform} /></div>
                            <span className="buy-label-en">ON {t.buy_platform}</span>
                          </a>
                        )}
                        <div className="product-social">
                          <button type="button" className="social-btn social-fav"><span className="social-label">收藏</span><span className="social-count">{t.favorites}</span></button>
                          <button type="button" className="social-btn social-like"><span className="social-label">点赞</span><span className="social-count">{t.likes}</span></button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
