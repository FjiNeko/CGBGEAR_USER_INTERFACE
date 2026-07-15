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

import React, { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale"; // 如果将来需要根据数量改变气泡大小，可以使用这个

// 世界地图的 TopoJSON 数据源 (标准的 110m 精度地图)
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// 地区中心点坐标 [经度(Longitude), 纬度(Latitude)]
// 这些坐标对应世界地图上的大致中心位置
const REGION_COORDINATES = {
  'na': { coords: [-100, 45], name: 'North America' }, // 北美
  'sa': { coords: [-60, -20], name: 'South America' }, // 南美
  'eu': { coords: [15, 50], name: 'Europe' },          // 欧洲
  'asia': { coords: [90, 40], name: 'Asia' },          // 亚洲
  'af': { coords: [20, 5], name: 'Africa' },           // 非洲
  'oc': { coords: [135, -25], name: 'Oceania' },       // 大洋洲
};

const WorldMap = ({ data, onRegionClick }) => {
  const [tooltipContent, setTooltipContent] = useState("");

  // 1. 计算每个区域的物品数量
  const regionCounts = useMemo(() => {
    const counts = {};
    Object.keys(REGION_COORDINATES).forEach(k => counts[k] = 0);
    
    data.forEach(item => {
       // 简单的键值映射 (根据你数据库实际存的值调整)
       let key = item.region?.toLowerCase();
       if (key === 'north america' || key === '北美') key = 'na';
       if (key === 'south america' || key === '南美') key = 'sa';
       if (key === 'asia' || key === '亚洲') key = 'asia';
       if (key === 'europe' || key === '欧洲') key = 'eu';
       if (key === 'africa' || key === '非洲') key = 'af';
       if (key === 'oceania' || key === '大洋洲') key = 'oc';
       
       if (counts[key] !== undefined) {
         counts[key]++;
       }
    });
    return counts;
  }, [data]);

  return (
    <div className="world-map-wrapper" style={{ width: "100%", height: "100%", background: "#050505" }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 140, // 缩放比例，数值越大地图越大
          center: [0, 20] // 地图中心偏移 [经度, 纬度]
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* 这里我们暂时不使用 ZoomableGroup，为了保持类似仪表盘的固定视图。
            如果需要缩放，可以用 <ZoomableGroup> 包裹 <Geographies> */}
        
        {/* 1. 渲染地图板块 */}
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                // 极客暗黑风格样式
                style={{
                  default: {
                    fill: "#1a1a1a", // 默认陆地颜色 (深灰)
                    stroke: "#333333", // 边框颜色
                    strokeWidth: 0.5,
                    outline: "none",
                  },
                  hover: {
                    fill: "#2a2a2a", // 悬停高亮
                    stroke: "#444444",
                    strokeWidth: 0.75,
                    outline: "none",
                  },
                  pressed: {
                    fill: "#000",
                    outline: "none",
                  },
                }}
              />
            ))
          }
        </Geographies>

        {/* 2. 渲染气泡 Markers */}
        {Object.entries(REGION_COORDINATES).map(([key, { coords, name }]) => {
          const count = regionCounts[key];
          // 如果该区域没有物品，且不希望显示空气泡，可以取消注释下面这行
          // if (count === 0) return null;

          return (
            <Marker 
                key={key} 
                coordinates={coords}
                onClick={() => onRegionClick && onRegionClick(key)}
                style={{
                    default: { cursor: "pointer" },
                    hover: { cursor: "pointer" },
                    pressed: { cursor: "pointer" },
                }}
            >
              {/* 外圈辉光动画 (仅当有物品时显示) */}
              {count > 0 && (
                <circle
                  r={20}
                  fill="rgba(0, 255, 0, 0.1)"
                  className="pulse-circle"
                />
              )}
              
              {/* 实心圆点 */}
              <circle
                r={count > 0 ? 8 : 4}
                fill={count > 0 ? "#00ff00" : "#444"}
                stroke="#000"
                strokeWidth={1}
                className="marker-circle"
              />

              {/* 数量文字 */}
              {count > 0 && (
                <text
                  textAnchor="middle"
                  y={4}
                  style={{
                    fontFamily: "system-ui",
                    fontSize: "10px",
                    fill: "#000",
                    fontWeight: "bold",
                    pointerEvents: "none" // 让点击穿透到 marker
                  }}
                >
                  {count}
                </text>
              )}

              {/* Tooltip (简单的 SVG title 实现，悬停显示) */}
              <title>{`${name}: ${count} items`}</title>
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
};

export default WorldMap;
