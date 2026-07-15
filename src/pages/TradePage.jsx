// src/pages/TradePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { getTradeMarketItems } from '../api/api'; 
import { useAuth } from '../context/AuthContext';
import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import '../css/Trade.css'
import '../css/main.css'

// 地图数据源
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// 坐标映射
const REGION_COORDINATES = {
  'North America': [-100, 40],
  'Asia': [100, 35],
  'Europe': [15, 50],
  'Oceania': [133, -25],
  'South America': [-60, -15],
  'Africa': [20, 0],
  'Global': [0, 20],
  'cn': [105, 35],
  'China': [105, 35],
  'us': [-100, 40],
  'United States': [-100, 40],
  'ru': [100, 60],
  'Russia': [100, 60],
  'jp': [138, 36],
  'uk': [-2, 54],
  'eu': [15, 50]
};

// --- SVG Components ---

const MoneyBagSVG = () => (
  <svg className="money-bag" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <path d="M364.032 391.68c-97.28 137.216-154.112 290.816-191.488 453.12 11.264 53.76 41.984 94.208 95.744 118.272h486.4c53.76-24.064 84.48-64.512 95.744-118.272-37.376-162.304-94.72-316.416-191.488-453.12H364.032z m248.32-121.856H395.264L314.368 103.424l53.76-7.68 28.16 55.296 17.92-3.584-1.536-51.712 72.192-1.536 1.536 52.736h35.84l1.024-52.736 72.192 1.536-1.536 52.224 17.92 3.584 28.16-55.296 53.76 7.68-81.408 165.888z m-276.992 97.28c-19.968 0-36.352-16.384-36.352-36.352 0-19.968 16.384-36.352 36.352-36.352h352.768c19.968 0 36.352 16.384 36.352 36.352 0 19.968-16.384 36.352-36.352 36.352H335.36z m214.528 469.504v21.504h-66.56v-22.528c-32.768-8.192-49.152-27.136-49.152-56.32v-75.776h66.56v76.288c0 7.68 4.608 11.264 13.312 11.264 8.704 0 12.8-3.584 12.8-11.264v-39.424c0-8.192-3.072-16.896-9.216-25.088-6.144-8.704-26.112-29.184-59.392-61.952-15.872-17.92-24.064-34.816-24.064-50.176v-37.376c0-33.792 16.384-54.272 49.152-61.44v-22.528h66.56v22.528c28.672 7.168 43.008 25.6 43.008 55.296v57.344h-66.56v-60.928c0-6.656-3.584-9.728-10.752-9.728-8.192 0-12.288 6.656-12.288 19.456l1.536 21.504c0 12.288 8.192 26.624 24.576 43.52 32.768 32.768 52.736 54.272 59.904 65.024 6.656 10.752 10.24 22.528 10.24 35.328v42.496c0.512 35.328-16.384 56.32-49.664 62.976z"></path>
  </svg>
);

// 简单箭头 SVG
const ArrowSVG = () => (
  <svg className="action-arrow" viewBox="0 0 24 24">
    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
  </svg>
);

const TradePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [items, setItems] = useState([]);
  const [mapStats, setMapStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [filters, setFilters] = useState({
    type: 'all', 
    region: 'all',
    time: 'all',
    price_min: '',
    price_max: ''
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setLoading(true);
    getTradeMarketItems(filters)
      .then(res => {
        if (res && res.code === 200) {
          setItems(res.data.items || []);
          if (res.data.map_stats) {
            setMapStats(res.data.map_stats); 
          }
        }
      })
      .catch(err => console.error("Failed to load trade items", err))
      .finally(() => setLoading(false));
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const navigateToCreate = (type) => {
    if (!user) {
      alert("请先登录 / Please login first");
      navigate('/terminal/login');
      return;
    }
    navigate(`/trade/create?type=${type}`);
  };

  // 动态计算 PaddingTop: PC端 12vh, 手机端保持 80px (导航栏高度)
  const containerStyle = {
    paddingTop: isMobile ? '80px' : '12vh', 
    minHeight: '100vh'
  };

  return (
    <>
      <MainNav navSolid={true} />
      
      <div className="trade-container" style={containerStyle}>
        
        {/* 顶部标题与操作 */}
        <div className="trade-header">
          <h1 className="trade-title golden-glow">Global Gear Market</h1>
          
          <div className="trade-actions">
            
            {/* 我要卖 (Sell) */}
            <button className="trade-btn btn-sell" onClick={() => navigateToCreate('sell')}>
              <div className="bg-icon-wrapper">
                <MoneyBagSVG />
                <ArrowSVG />
              </div>
              <div className="btn-text">
                <span className="zh">出物 (我要出)</span>
                <span className="en">I Want to Sell</span>
              </div>
            </button>

            {/* 我要买 (Buy) */}
            <button className="trade-btn btn-buy" onClick={() => navigateToCreate('buy')}>
              <div className="bg-icon-wrapper">
                <MoneyBagSVG />
                <ArrowSVG />
              </div>
              <div className="btn-text">
                <span className="zh">收物 (我要收)</span>
                <span className="en">I Want to Buy</span>
              </div>
            </button>

          </div>
        </div>

        {/* 筛选栏 */}
        <div className="trade-filters">
          <select name="type" value={filters.type} onChange={handleFilterChange} className="filter-select">
            <option value="all">类型 / All Types</option>
            <option value="sell">出售 / Sell</option>
            <option value="buy">求购 / Buy</option>
          </select>

          <select name="region" value={filters.region} onChange={handleFilterChange} className="filter-select">
            <option value="all">地区 / Global</option>
            <option value="North America">North America</option>
            <option value="Asia">Asia</option>
            <option value="Europe">Europe</option>
            <option value="Oceania">Oceania</option>
            <option value="cn">China</option>
          </select>

          <select name="time" value={filters.time} onChange={handleFilterChange} className="filter-select">
            <option value="all">发布时间 / All Time</option>
            <option value="today">今天 / Today</option>
            <option value="month">最近一月 / Past Month</option>
          </select>
          
          <input 
            type="number" name="price_min" placeholder="Min Price" 
            value={filters.price_min} onChange={handleFilterChange}
            className="filter-select" style={{width: '100px'}}
          />
          <span style={{color:'#666', alignSelf: 'center'}}>-</span>
          <input 
            type="number" name="price_max" placeholder="Max Price" 
            value={filters.price_max} onChange={handleFilterChange}
            className="filter-select" style={{width: '100px'}}
          />
        </div>

        {/* 地图展示 */}
        {!isMobile && filters.region === 'all' && (
          <div className="trade-map-container">
            <ComposableMap projectionConfig={{ scale: 147 }}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#1a1a1a"
                      stroke="#333"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#252525", outline: "none" },
                        pressed: { fill: "#000", outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>
              
              {mapStats.map((stat, index) => {
                const coords = REGION_COORDINATES[stat.region] || REGION_COORDINATES[stat.country]; 
                
                if (!coords) return null;
                
                const size = Math.min(15, Math.max(4, stat.count * 1.5));

                return (
                  <Marker key={index} coordinates={coords}>
                    <circle r={size} fill="#00ff00" opacity={0.6} stroke="#fff" strokeWidth={1} />
                    <text 
                        textAnchor="middle" 
                        y={-size - 5} 
                        style={{ fontFamily: "Arial", fill: "#fff", fontSize: "10px", fontWeight: "bold", textShadow: "1px 1px 2px black" }}
                    >
                      {stat.region.toUpperCase()}: {stat.count}
                    </text>
                  </Marker>
                );
              })}
            </ComposableMap>
          </div>
        )}

        {/* 列表展示 */}
        <div className="trade-grid">
          {loading ? (
            <div style={{color: '#888', gridColumn: '1 / -1', textAlign: 'center', padding: '50px'}}>加载中...</div>
          ) : items.length === 0 ? (
            <div style={{color: '#888', gridColumn: '1 / -1', textAlign: 'center', padding: '50px'}}>暂无相关交易</div>
          ) : (
            items.map(item => (
              <div key={item.id} className="trade-card" onClick={() => navigate(`/trade/${item.share_code}`)}>
                <div className="card-img-wrapper">
                  <img 
                    src={item.main_image || "/placeholder_gear.png"} 
                    alt={item.title} 
                    className="card-img" 
                    onError={(e) => {e.target.src = "https://via.placeholder.com/300x300?text=No+Image"}}
                  />
                </div>
                <div className="card-body">
                  <div className="card-tags">
                    <span className={`tag ${item.type === 'sell' ? 'tag-sell' : 'tag-buy'}`}>
                      {item.type === 'sell' ? '出售 / SELL' : '求购 / BUY'}
                    </span>
                  </div>
                  <h3 className="card-title">{item.title}</h3>
                  <div className="card-price">
                    {item.type === 'sell' 
                      ? `¥${item.price}` 
                      : `¥${item.budget_min} - ${item.budget_max}`}
                  </div>
                  
                  <div className="card-footer">
                    <div className="card-user">
                      <img 
                        src={item.author?.avatar || "/default_avatar.png"} 
                        className="user-avatar-sm" 
                        alt="avatar" 
                      />
                      <span>{item.author?.username || 'User'}</span>
                    </div>
                    <span>{item.region === 'cn' ? 'China' : item.region}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <SiteFooter />
    </>
  );
};

export default TradePage;
