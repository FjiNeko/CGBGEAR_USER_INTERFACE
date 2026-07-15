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

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import "../css/main.css";
import "../css/forum.css";
import "../css/search.css";
import { api } from "../api/api";

export default function PostPage() {
  const { id } = useParams();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [isFav, setIsFav] = useState(false);

  const [cName, setCName] = useState("");
  const [cText, setCText] = useState("");

  // ============================
  // 加载帖子详情
  // ============================
  useEffect(() => {
    async function load() {
      const data = await getPostById(id);
      if (data) {
        setPost(data);
        setLikeCount(data.likes || 0);
        setIsFav(data.isFav || false);
      }

      const cs = await getComments(id);
      setComments(cs || []);
    }
    load();
  }, [id]);

  if (!post) {
    return <div style={{ padding: "40px", color: "#fff" }}>加载中…</div>;
  }

  // ============================
  // 点赞
  // ============================
  async function onLike() {
    const res = await likePost(id);
    if (res?.likes !== undefined) {
      setLikeCount(res.likes);
    }
  }

  // ============================
  // 收藏
  // ============================
  async function onFav() {
    const res = await favPost(id);
    if (res?.isFav !== undefined) {
      setIsFav(res.isFav);
    }
  }

  // ============================
  // 发表评论
  // ============================
  async function submitComment() {
    if (!cText.trim()) return;

    await addComment(id, cName || "匿名玩家", cText);
    setCText("");
    setCName("");

    const newList = await getComments(id);
    setComments(newList || []);
  }

  return (
    <>
      <NavBar />

      <div id="post-container" className="post-container">
        {/* ======= 帖子头部 ======= */}
        <div className="post-header">
          <h1>{post.title}</h1>
          <div className="post-meta">
            {post.author} · {post.category} · {post.createdAt}
          </div>
        </div>

        {/* ======= 点赞收藏 ======= */}
        <div className="post-like-box">
          <button id="like-btn" className="like-btn" onClick={onLike}>
            <span className="like-icon">👍</span>
            <span className="like-text">点赞</span>
          </button>

          <div className="post-fav-box">
            <button id="fav-btn" className="fav-btn" onClick={onFav}>
              <span className="fav-icon">{isFav ? "⭐" : "🤍"}</span>
              <span className="fav-text">收藏</span>
            </button>
          </div>

          <span id="like-count">{likeCount}</span>
        </div>

        {/* ======= 图片区域 ======= */}
        <div className="post-images">
          {post.images?.map((img, i) => (
            <img key={i} src={img} alt="" />
          ))}
        </div>

        {/* ======= 正文 ======= */}
        <div className="post-content">
          {post.content.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        {/* ======= 评论区 ======= */}
        <div className="comment-section">
          <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>
            评论 / COMMENTS
          </h3>

          <div id="comment-list">
            {comments.map((c, idx) => (
              <div key={idx} className="comment-item">
                <div className="comment-author">{c.name}</div>
                <div className="comment-text">{c.text}</div>
                <div className="comment-time">{c.time}</div>
              </div>
            ))}
          </div>

          <div className="comment-form">
            <input
              id="c-name"
              placeholder="昵称（可留空，默认匿名玩家）"
              value={cName}
              onChange={(e) => setCName(e.target.value)}
            />
            <textarea
              id="c-text"
              rows="3"
              placeholder="说点什么……"
              value={cText}
              onChange={(e) => setCText(e.target.value)}
            ></textarea>
            <button onClick={submitComment}>发表</button>
          </div>
        </div>
      </div>

      <div id="page-scan-transition"></div>
    </>
  );
}
