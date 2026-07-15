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
// src/pages/PlayerProfilePage.jsx
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import "../css/main.css";
import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function PlayerProfilePage() {
  const query = useQuery();
  const profileID = query.get("profileID") || "w1";

  // TODO：以后可以根据 profileID 从后端取真实数据
  const profile = {
    title: "Special Duties Unit",
    subTitle: "特别任务连",
    rankText: "RANK · 97",
    tags: ["Urban Tactical", "Softshell", "Low-Profile"],
    description:
      "偏爱高机动性软壳与城市低调配色，通勤与训练一体。常在城市边缘靶场和山地穿梭，对功能性剪裁和细节执念较深。",
    loadout: [
      {
        title: "GEN.3 城市战术夹克",
        note: "主力通勤与高强度拉练装备，兼顾耐磨与机动性。",
        meta: "常用搭配 · 任意分层"
      },
      {
        title: "轻量化战术腰封",
        note: "以腰部挂载弹匣与医疗物品为主，控制重量的同时保留关键模组。",
        meta: "核心模块 · 快速换装"
      }
    ],
    storyNodes: [
      {
        id: "01",
        title: "第一次夜训 · “防守和移位”",
        text:
          "真正迷上战术装备，是第一次夜攻防中被队友推荐尝试更贴身的战术软壳与腰封组合，从此开始认真研究射击姿态与装备之间的关系。"
      },
      {
        id: "02",
        title: "城市边缘靶场 · 适应多地形",
        text:
          "他逐渐从传统的林地迷彩转向城市灰、城市绿与黑色系的组合，在巷战、楼梯、坡地等环境中反复测试携行配置，最终形成了现在偏向 Urban Tactical 的整体风格。"
      },
      {
        id: "03",
        title: "“保持低调” · 但又随时待命",
        text:
          "对他来说，战术装备不再是“扮演角色”，而是“让身体在更多场景下保持可用状态”的工具，既能融入通勤环境，又能在训练时迅速进入任务模式。"
      }
    ],
    gallery: [
      "https://images.pexels.com/photos/1522278/pexels-photo-1522278.jpeg?auto=compress&cs=tinysrgb&w=1600",
      "https://images.pexels.com/photos/3019772/pexels-photo-3019772.jpeg?auto=compress&cs=tinysrgb&w=1600",
      "https://images.pexels.com/photos/843037/pexels-photo-843037.jpeg?auto=compress&cs=tinysrgb&w=1600"
    ]
  };

  return (
    <div className="page premium-page profile-page">
      {/* 顶部导航：保持黑底样式 */}
      <MainNav navSolid />

      <main className="premium-container profile-main">
        {/* ===== 第一行：HUD 渐变色块 ===== */}
        <section className="profile-hero-row">
          <div className="profile-hero-card">
            {/* 左：夜视仪 HUD 圆圈 */}
            <div className="profile-hero-left">
              <div className="hud-avatar-wrap profile-hud">
                <img
                  src={profile.gallery[0]}
                  alt={profile.title}
                  loading="lazy"
                />
                <span className="hud-corner tl" />
                <span className="hud-corner tr" />
                <span className="hud-corner bl" />
                <span className="hud-corner br" />
              </div>
            </div>

            {/* 右：标题 + Rank + 标签 + 描述 */}
            <div className="profile-hero-right">
              <div className="profile-rank-line">
                <h1 className="profile-title">{profile.title}</h1>
                <span className="profile-rank-pill">{profile.rankText}</span>
              </div>
              <div className="profile-subtitle">{profile.subTitle}</div>

              <div className="profile-tags">
                {profile.tags.slice(0, 3).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <p className="profile-desc">{profile.description}</p>
            </div>
          </div>
        </section>

        {/* ===== 第二行：LOADOUT ===== */}
        <section className="profile-section">
          <div className="profile-section-header">
            <h2 className="profile-section-title">LOADOUT</h2>
            <span className="profile-section-meta">常用搭配 · 任务分层</span>
          </div>

          <div className="loadout-grid">
            {profile.loadout.map((item) => (
              <article key={item.title} className="loadout-card">
                <h3>{item.title}</h3>
                <p>{item.note}</p>
                <span className="loadout-meta">{item.meta}</span>
              </article>
            ))}
          </div>
        </section>

        {/* ===== 第三行：STORY 时间轴 ===== */}
        <section className="profile-section">
          <div className="profile-section-header">
            <h2 className="profile-section-title">STORY</h2>
            <span className="profile-section-meta">
              训练、通勤与任务之间的真实故事
            </span>
          </div>

          <div className="story-timeline">
            <div className="timeline-line" />
            {profile.storyNodes.map((node, index) => (
              <div
                key={node.id}
                className={
                  "timeline-item " + (index % 2 === 0 ? "left" : "right")
                }
              >
                <div className="timeline-node">
                  <span className="timeline-node-index">{node.id}</span>
                </div>
                <div className="timeline-card">
                  <h3>{node.title}</h3>
                  <p>{node.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 第四行：GALLERY ===== */}
        <section className="profile-section">
          <div className="profile-section-header">
            <h2 className="profile-section-title">GALLERY</h2>
            <span className="profile-section-meta">
              记录场景与行动中的装备状态
            </span>
          </div>

          <div className="profile-gallery">
            {profile.gallery.map((src, idx) => (
              <div key={idx} className="gallery-item">
                <img src={src} alt={`gallery-${idx}`} loading="lazy" />
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
