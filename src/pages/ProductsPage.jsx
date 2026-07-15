// src/pages/ProductsPage.jsx
import React, { use, useEffect, useMemo, useState } from "react";
import "../css/main.css";
import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import { getProducts } from "../api/api";


const brandOptions = ["all", "CGBGEAR", "合作品牌", "探索系列"]; // 【修改】新增了一个品牌选项 '探索系列'
const categoryOptions = [
  "all",
  "chest-rig",
  "belt",
  "prototype",
  "pants",
  "pack",
  "patch",
  "clothing", // 【修改】新增了 'clothing' 分类，以匹配新添加的产品
];


const sortOptions = [
  { value: "latest", label: "最新优先" },
  { value: "hot", label: "热度优先" },
  { value: "priceAsc", label: "价格从低到高" },
  { value: "priceDesc", label: "价格从高到低" },
  { value: "favorites", label: "收藏数优先" }, // 【修改】新增了 '收藏数优先' 排序选项
];



/** 根据平台显示不同的购买图标 */
function PlatformIcon({ platform }) {
  if (platform === "淘宝") {
    return (
      <svg
        className="buy-platform-icon buy-platform-icon-taobao"
        viewBox="0 0 1024 1024"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M228.96 172.16a76.64 76.64 0 1 0 75.84 76.64 76.32 76.32 0 0 0-75.84-76.64zM317.76 535.52C307.52 458.24 160 360.48 160 360.48l-57.6 82.24s123.84 61.92 134.08 112S66.56 753.28 66.56 753.28l128 94.4s133.28-235.04 123.2-312.16z"
          fill="#FC8848"
        />
        <path
          d="M957.44 380.96c0-66.88-66.4-152.32-174.72-171.52s-263.04 60-286.88 64-30.56-3.52-30.56-3.52l27.2-53.12L400 178.56A416 416 0 0 1 355.04 288a425.28 425.28 0 0 1-74.72 92.64L338.08 432l76.32-90.88 50.88 5.12L372 464s3.36 39.52 32 41.28 72.96-67.04 72.96-67.04l52.48 10.4 1.76 68.64H360.16v46.24l169.6 5.12v145.92s-48.96 7.36-70.56-23.2-12.96-78.72-12.96-78.72L336 609.28s-6.88 84.64 22.56 126.88 90.24 57.12 152 51.84 215.84-70.72 215.84-70.72l10.08 46.4 81.44-37.76-49.12-130.4-66.24 13.76 6.88 56.64-81.6 36v-130.4L800 564.64v-48H624.8V448h168v-54.88H517.92l40.8-80A562.88 562.88 0 0 1 679.2 272c48-6.88 69.44-10.24 113.6 17.12a108.48 108.48 0 0 1 50.88 67.04v381.76a96 96 0 0 1-60.96 53.12c-48 16-124-1.6-124-1.6l-6.72 53.12s128 25.76 210.4-8.48 95.04-132.16 95.04-132.16z"
          fill="#FC8848"
        />
      </svg>
    );
  }

  if (platform === "闲鱼") {
    return (
      <svg
        className="buy-platform-icon buy-platform-icon-xianyu"
        viewBox="0 0 1024 1024"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M0 0m170.666667 0l682.666666 0q170.666667 0 170.666667 170.666667l0 682.666666q0 170.666667-170.666667 170.666667l-682.666666 0q-170.666667 0-170.666667-170.666667l0-682.666666q0-170.666667 170.666667-170.666667Z"
          fill="#FEE50F"
        />
        <path
          d="M748.16 676.437333c66.901333 16.426667 118.058667 17.194667 153.173333 3.584a27.52 27.52 0 0 1 35.413334 14.762667 26.197333 26.197333 0 0 1-15.232 34.304c-47.530667 18.432-109.653333 17.493333-185.472-1.152-50.474667-9.984-91.989333-8.96-125.098667-0.512-10.965333 2.773333-20.053333 6.186667-27.178667 9.728l-2.090666 1.109333-3.669334 2.133334-1.962666 1.365333-2.389334 1.28-1.706666 0.768-3.029334 1.066667-3.968 0.768c-14.634667-0.768-24.106667-5.674667-28.501333-14.805334-4.394667-9.130667-2.176-19.413333 6.570667-30.933333l0.682666-0.682667 0.042667-0.042666h0.256l1.706667-1.322667 2.048-1.408 1.024-0.64c2.816-1.792 6.229333-3.712 10.112-5.632a192.426667 192.426667 0 0 1 38.186666-13.866667c41.258667-10.538667 91.221333-11.733333 151.082667 0.128zM195.84 561.92l17.792 7.552c5.802667 5.12 8.533333 11.178667 8.192 18.346667L221.44 705.28a25.429333 25.429333 0 0 1-7.936 17.92 27.264 27.264 0 0 1-18.901333 7.893333c-5.034667 0.170667-10.794667-2.261333-17.237334-7.381333a25.642667 25.642667 0 0 1-8.106666-18.346667l0.085333-118.826666c0.128-6.528 3.328-12.117333 8.405333-17.109334a23.125333 23.125333 0 0 1 18.090667-7.509333z m240.512-242.602667c9.685333 2.133333 16.042667 4.821333 19.072 7.936 4.522667 4.693333 7.253333 10.837333 7.125333 17.365334l-2.048 360.448a25.386667 25.386667 0 0 1-7.978666 17.92 23.381333 23.381333 0 0 1-18.517334 6.698666c-4.906667-0.213333-10.965333-2.304-18.218666-6.357333a26.922667 26.922667 0 0 1-7.552-18.133333l2.261333-207.786667-108.586667 0.298667-2.858666 207.573333a23.808 23.808 0 0 1-7.765334 17.28 22.869333 22.869333 0 0 1-18.090666 7.552c-4.48-0.085333-10.581333-2.218667-18.218667-6.4a22.101333 22.101333 0 0 1-8.149333-18.346667l2.389333-208.341333-108.544 0.298667-2.432 208.341333a24.021333 24.021333 0 0 1-8.362667 17.152 22.442667 22.442667 0 0 1-18.346666 8.106667c-4.864-0.256-10.752-2.986667-17.621334-8.192a19.242667 19.242667 0 0 1-8.533333-17.152l2.218667-361.045334a25.386667 25.386667 0 0 1 7.978666-17.92 25.301333 25.301333 0 0 1 18.517334-6.656c4.906667 0.213333 10.922667 2.56 18.048 6.912 5.76 5.12 8.064 10.453333 7.722666 17.578667l0.426667 102.741333 108.629333-0.256 0.298667-11.093333c0.298667-7.125333 3.498667-12.714667 8.746667-18.346667a21.333333 21.333333 0 0 1 17.28-7.082666c4.906667 0.213333 11.093333 2.602667 18.645333 7.168a30.72 30.72 0 0 1 8.192 18.346666l-0.938667 10.88 110.421334 0.298667-0.170667-77.013333H268.288c-9.685333-2.133333-16.042667-4.778667-19.072-7.936a26.88 26.88 0 0 1-7.509333-18.133334 24.32 24.32 0 0 1 7.765333-17.28 26.282667 26.282667 0 0 1 18.688-7.338666z m-80.298667 242.005334l19.029334 7.936c4.565333 4.693333 7.253333 10.837333 6.954666 17.92l0.682667 118.485333a23.850667 23.850667 0 0 1-7.765333 17.322667 23.466667 23.466667 0 0 1-18.901334 7.893333c-4.906667-0.213333-10.88-2.730667-17.877333-7.552a22.314667 22.314667 0 0 1-7.936-16.938667l0.128-118.869333a24.576 24.576 0 0 1 7.552-18.688 29.610667 29.610667 0 0 1 18.133333-7.509333z m208.938667-154.581334l323.072 0.938667 18.261333 6.229333a25.856 25.856 0 0 1 7.082667 13.653334l0.426667 4.138666-1.578667 4.693334 1.877333 4.394666 0.512 160.512-1.194666 3.498667 0.64 4.053333a20.778667 20.778667 0 0 1-7.168 17.152 23.850667 23.850667 0 0 1-14.592 7.594667l-4.266667 0.170667-322.304 0.554666-19.029333-7.765333a25.728 25.728 0 0 1-7.082667-13.610667l-0.469333-4.138666 1.194666-3.498667-0.853333-3.498667V431.786667c-0.256-7.168 1.706667-12.970667 6.570667-17.28a31.104 31.104 0 0 1 14.421333-7.04l4.48-0.725334z m135.552 138.069334l-108.8 0.853333-0.170667 38.570667 109.781334 0.128-0.810667-39.552z m161.28 0.426666l-109.226667 0.042667-0.213333 38.570667 109.824 0.128-0.426667-38.784z m-271.018667-88.746666l0.256 39.381333 109.184-0.085333 0.384-39.168-109.824-0.085334z m161.450667-0.170667l0.213333 39.338667 109.226667-0.085334 0.384-39.168-109.824-0.085333zM887.381333 298.666667l19.072 7.936a26.88 26.88 0 0 1 7.552 18.133333l-0.682666 30.72a19.541333 19.541333 0 0 1-6.570667 17.664 23.466667 23.466667 0 0 1-18.901333 7.936l-18.645334-7.168a21.973333 21.973333 0 0 1-6.912-17.92l-0.085333-5.973333-270.848-1.109334-0.341333 7.168a23.893333 23.893333 0 0 1-7.765334 17.28 26.794667 26.794667 0 0 1-17.664 8.277334l-19.072-7.893334a23.765333 23.765333 0 0 1-6.912-17.962666l-0.554666-31.104a24.576 24.576 0 0 1 7.594666-18.688 25.344 25.344 0 0 1 18.474667-6.698667L887.381333 298.666667z m-700.032 10.837333a32.768 32.768 0 1 1 0 65.536 32.768 32.768 0 0 1 0-65.536z"
          fill="#342318"
        />
      </svg>
    );
  }

  return null;
}

/** 从淘宝分享文本中提取URL */
function extractUrl(text) {
  if (!text) return text;
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : text;
}

export default function ProductsPage() {
  // [添加] 新增 state 用于存储从 API 获取的数据、加载状态和错误信息
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [brandFilter, setBrandFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortKey, setSortKey] = useState("latest");
  const [sidebarVisible, setSidebarVisible] = useState(true);


  // [添加] 使用 useEffect 在组件加载时从 API 获取产品数据
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await getProducts();
        if (response.code === 200) {
          setProducts(response.data);
        } else {
          setError(response.message || '获取产品数据失败');
        }
      } catch (err) {
        setError(err.toString());
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []); // 空依赖数组确保只在组件首次挂载时运行
  const filteredProducts = useMemo(() => {
    // [修改] 将 allProducts 替换为从 state 中获取的 products
    let result = [...products];

    if (brandFilter !== "all") {
      result = result.filter((p) => p.brand === brandFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter((p) => p.category === categoryFilter);
    }

    const min = priceMin === "" ? null : Number(priceMin);
    const max = priceMax === "" ? null : Number(priceMax);

    if (min != null && !Number.isNaN(min)) {
      result = result.filter((p) => p.price >= min);
    }
    if (max != null && !Number.isNaN(max)) {
      result = result.filter((p) => p.price <= max);
    }

    result.sort((a, b) => {
      // [修改] 数据库返回的时间是带时区的完整格式，可以直接比较
      if (sortKey === "latest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortKey === "hot") {
        return b.hotScore - a.hotScore;
      }
      if (sortKey === "priceAsc") {
        return a.price - b.price;
      }
      if (sortKey === "priceDesc") {
        return b.price - a.price;
      }
      if (sortKey === "favorites") {
        return b.favorites - a.favorites
      }
      return 0;
    });

    return result;
    // [修改] 添加 products 到依赖数组，当数据从API获取后，重新计算
  }, [brandFilter, categoryFilter, priceMin, priceMax, sortKey, products]);

  const toggleSidebar = () => setSidebarVisible((v) => !v);

  return (
    <div className="page products-page">
      {/* 顶部导航，保持与首页一致 */}
      <MainNav navSolid={true} />

      {/* 顶部文案区域（可以理解为 Nike 的标题区域） */}
      <header className="products-hero">
        <div className="products-hero-inner">
          <div className="products-hero-tag">
            品牌产品列表 / CGBGEAR PRODUCT LIST
          </div>
          <h1 className="products-hero-title">
            精选战术单品，
            <br />
            为真实玩家场景而设计。
          </h1>
          <p className="products-hero-sub">
            左侧筛选品牌、类别和价格，右侧浏览商品卡片。点击卡片进入详情，
            在详情中可查看完整图文与第三方购买链接。
          </p>
        </div>
      </header>

      {/* 主体区域：左侧筛选 + 右侧商品列表 */}
      <main className={`products-main ${sidebarVisible ? "" : "sidebar-hidden"}`}>
        {/* 左侧：筛选侧边栏 */}
        {sidebarVisible && (
          <aside className="products-sidebar">
            <div className="products-sidebar-inner">
              <div className="sidebar-title">筛选条件 / FILTERS</div>

              {/* 品牌 */}
              <div className="sidebar-group">
                <div className="sidebar-group-label">品牌 Brand</div>
                <select
                  className="sidebar-select"
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                >
                  <option value="all">全部品牌 / All</option>
                  {brandOptions
                    .filter((b) => b !== "all")
                    .map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                </select>
              </div>

              {/* 分类 */}
              <div className="sidebar-group">
                <div className="sidebar-group-label">分类 Category</div>
                <select
                  className="sidebar-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">全部分类 / All</option>
                  <option value="chest-rig">胸挂 / Chest Rig</option>
                  <option value="belt">腰封 / Belt</option>
                  <option value="prototype">研发样品 / Prototype</option>
                  <option value="pants">战术裤 / Pants</option>
                  <option value="pack">背包 / Pack</option>
                  <option value="patch">臂章 / Patch</option>
                  <option value="clothing">服饰 / Clothing</option>
                </select>
              </div>

              {/* 价格区间 */}
              <div className="sidebar-group">
                <div className="sidebar-group-label">价格区间 Price</div>
                <div className="sidebar-price-row">
                  <input
                    className="sidebar-input"
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                  <span className="sidebar-price-sep">-</span>
                  <input
                    className="sidebar-input"
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </div>
              </div>

              {/* 重置按钮 */}
              <button
                type="button"
                className="sidebar-reset-btn"
                onClick={() => {
                  setBrandFilter("all");
                  setCategoryFilter("all");
                  setPriceMin("");
                  setPriceMax("");
                }}
              >
                重置筛选
              </button>
            </div>
          </aside>
        )}

        {/* 右侧：商品区域 */}
        <section className="products-content">
          {/* 顶部工具条：左侧统计 + 右上角两个控件（隐藏筛选 / 排序） */}
          <div className="products-topbar">
            <div className="topbar-left">
              共{" "}
              <span className="filter-summary-number">
                {filteredProducts.length}
              </span>{" "}
              件商品
            </div>
            <div className="topbar-right">
              <button
                type="button"
                className="topbar-btn"
                onClick={toggleSidebar}
              >
                {sidebarVisible ? "隐藏筛选" : "显示筛选"}
              </button>
              <div className="topbar-sort">
                <span className="topbar-sort-label">排序</span>
                <select
                  className="topbar-sort-select"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 商品卡片网格 */}
          <section className="products-list-section">
            {/* [添加] 在此处处理加载和错误状态 */}
            {loading && <div className="products-loading">正在加载产品...</div>}
            {error && <div className="products-error">错误: {error}</div>}
            {!loading && !error && (
              <div className="products-grid">
                {filteredProducts.map((p) => (
                  // [修改] Key 和部分字段名需要与数据库字段名对齐
                  <article key={p.id} className="product-card">
                    <a
                      href={`/products/${p.id}`}
                      className="product-card-media-wrap"
                    >
                      <div
                        className="product-card-media"
                        style={{ backgroundImage: `url(${p.image})` }}
                      />
                      <div className="product-card-scan-layer" />
                      {/* [修复] 使用 !! 强制转换为布尔值，避免渲染出数字 0 */}
                      {!!p.isNew && <span className="product-badge new">NEW</span>}
                      {p.hotScore >= 90 && (
                        <span className="product-badge hot">HOT</span>
                      )}
                    </a>

                    <div className="product-card-body">
                      <div className="product-brand-row">
                        <span className="product-brand">{p.brand}</span>
                        <span className="product-category">{p.category}</span>
                      </div>

                      <h2 className="product-title-cn">{p.name}</h2>
                      <div className="product-title-en">{p.en_name}</div>

                      <div className="product-meta-row">
                        <div className="product-price">
                          <span className="price-label">价格</span>
                          <span className="price-value">¥ {p.price}</span>
                        </div>
                        <div className="product-hot">
                          热度 / HEAT{" "}
                          <span className="product-hot-score">
                            {p.hotScore}
                          </span>
                        </div>
                      </div>

                      <div className="product-tags">
                        {p.tags.map((tag) => (
                          <span key={tag} className="product-tag">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* 底部操作：立即购买 + 收藏 / 点赞 */}
                      {/* 修复立即购买的buyUrl的BUG，由于管理员复制粘贴原始邀请链接，导致无法识别链接，如果检测到相对应的链接格式需要用正则表达式拆分出链接：【淘宝】7天无理由退货 https://e.tb.cn/h.iV0T3iuTdxf9tXV?tk=9c7PUw9A5fy HU071 「拷贝链接」 点击链接直接打开 或者 淘宝搜索直接打开 */}
                      <div className="product-card-footer">
                        {p.buyUrl && (
                          <a
                            href={extractUrl(p.buyUrl)}
                            className="product-buy-btn"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <div className="buy-main-row">
                              <span className="buy-label-cn">立即购买</span>
                              <PlatformIcon platform={p.buyPlatform} />
                            </div>
                            <span className="buy-label-en">
                              BUY ON {p.buyPlatform}
                            </span>
                          </a>
                        )}

                        <div className="product-social">
                          <button
                            type="button"
                            className="social-btn social-fav"
                          >
                            <span className="social-label">收藏</span>
                            <span className="social-count">{p.favorites}</span>
                          </button>
                          <button
                            type="button"
                            className="social-btn social-like"
                          >
                            <span className="social-label">点赞</span>
                            <span className="social-count">{p.likes}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="products-empty">
                    当前筛选条件下没有找到产品。
                    <br />
                    请尝试放宽价格区间或切换其他品牌 / 分类。
                  </div>
                )}
              </div>
            )}
          </section>
        </section>
      </main>
      {/* 页脚 */}
      <SiteFooter />
    </div>
  );
}

