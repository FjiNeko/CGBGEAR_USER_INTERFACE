// src/pages/MobileSearchResultPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/main.css";
import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import { searchAll, getSearchHot, getSearchPlaceholder } from "../api/api";
import { buildSearchId } from "../utils/auth";

function useQuery() {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search), [location.search]);
}

export default function MobileSearchResultPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const keywords = query.get("keywords") || "";
  const show = parseInt(query.get("show") || "12", 10);
  const pageSize = Number.isNaN(show) ? 12 : show;

  const [placeholder, setPlaceholder] = useState("输入关键词开始搜索");
  const [searchInput, setSearchInput] = useState("");
  const [hotKeywords, setHotKeywords] = useState([]); // 前15
  const [results, setResults] = useState({ products: [], works: [], qa: [], trade: [], no_keywords: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // 热搜前15
    getSearchHot(15)
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

  const tagColor = (idx) => {
    if (idx === 0) return { backgroundColor: "#ff8a00", color: "#fff" }; // 橙
    if (idx === 1) return { backgroundColor: "#7c3aed", color: "#fff" }; // 紫
    if (idx === 2) return { backgroundColor: "#2563eb", color: "#fff" }; // 蓝
    return { backgroundColor: "#262626", color: "#ddd" };
  };

  return (
    <div className="mobile-search-page">
      {/* Mobile 端加入 MainNav，保持站点一致的导航与样式 */}
      <MainNav navSolid={true} />
      {/* 顶部导航：左返回，右搜索框（placeholder 随机/最近） */}
      <header className="mobile-search-header">
        <button className="back-btn" type="button" onClick={() => navigate(-1)}>返回</button>
        <form className="mobile-search-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="mobile-search-input"
            placeholder={placeholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
      </header>

      {/* 热搜标签栏（前15，无序号，前3特色） */}
      {hotKeywords.length > 0 && (
        <div className="mobile-hot-tags">
          {hotKeywords.map((kw, idx) => (
            <button
              key={kw}
              className="mobile-hot-tag"
              style={tagColor(idx)}
              type="button"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("keywords", kw);
                url.searchParams.set("show", String(pageSize));
                url.searchParams.set("id", buildSearchId());
                window.location.href = url.toString();
              }}
            >
              {kw}
            </button>
          ))}
        </div>
      )}

      {/* 内容区域 */}
      <main className="mobile-search-content">
        {loading && <div className="search-loading">加载中...</div>}
        {error && <div className="search-error">{error}</div>}

        {!keywords.trim() && results.no_keywords && (
          <div className="search-empty tip">未提供关键词</div>
        )}

        {keywords.trim() && (results.products.length + results.works.length + results.qa.length + results.trade.length === 0) && (
          <div className="search-empty">终端未进行回应（{keywords}）</div>
        )}

        {/* 简化的移动展示：按模块顺序渲染 */}
        {results.products.length > 0 && (
          <section className="m-block">
            <h3 className="m-block-title">品牌产品</h3>
            <ul className="m-list">
              {results.products.map((p) => (
                <li key={p.id} className="m-item" onClick={() => navigate(`/products/${p.id}`)}>
                  <div className="m-item-row">
                    <div className="m-item-name">{p.name}</div>
                    <div className="m-item-meta">¥{p.price} · {p.brand}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {results.works.length > 0 && (
          <section className="m-block">
            <h3 className="m-block-title">玩家优质作品</h3>
            <ul className="m-list">
              {results.works.map((w) => (
                <li key={w.id} className="m-item">
                  <div className="m-item-name">{w.title}</div>
                  <div className="m-item-meta">作者 {w.author}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {results.qa.length > 0 && (
          <section className="m-block">
            <h3 className="m-block-title">问答</h3>
            <ul className="m-list">
              {results.qa.map((q) => (
                <li key={q.id} className="m-item">
                  <div className="m-item-name">{q.title}</div>
                  <div className="m-item-meta">{q.asker} · {q.replies} 回复</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {results.trade.length > 0 && (
          <section className="m-block">
            <h3 className="m-block-title">出物 / 收物</h3>
            <ul className="m-list">
              {results.trade.map((t) => (
                <li key={t.id} className="m-item" onClick={() => navigate(`/trade/${t.id}`)}>
                  <div className="m-item-name">{t.name}</div>
                  <div className="m-item-meta">{t.type} · ¥{t.price}</div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      {/* Mobile 端加入 SiteFooter */}
      <SiteFooter />
    </div>
  );
}
