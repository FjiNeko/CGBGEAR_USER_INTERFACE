import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTradeItemDetails, toggleTradeWant, postTradeComment } from '../api/api';
import { useAuth } from '../context/AuthContext';
import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import '../css/Trade.css';
import '../css/main.css';

const TradeDetailPage = () => {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [commentText, setCommentText] = useState("");
  const [isWanted, setIsWanted] = useState(false);
  const [wantCount, setWantCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    getTradeItemDetails(shareCode)
      .then(res => {
        if (res.code === 200) {
          setItem(res.data);
          setIsWanted(res.data.has_wanted);
          setWantCount(res.data.want_count);
        } else {
          setErrorMsg(res.message || "Item not found");
        }
      })
      .catch(err => setErrorMsg("Network error"))
      .finally(() => setLoading(false));
  }, [shareCode]);

  const handleCopyShare = () => {
    const url = window.location.href;
    const shareText = `【CGBGEAR】${url} 「我在CGBGEAR论坛发现一个宝贝」`;
    navigator.clipboard.writeText(shareText).then(() => {
      alert("分享口令已复制！");
    });
  };

  const handleWantClick = () => {
    if (!user) {
      alert("请先登录 / Please login first");
      navigate('/terminal/login');
      return;
    }

    const newStatus = !isWanted;
    setIsWanted(newStatus);
    setWantCount(prev => newStatus ? prev + 1 : prev - 1);

    toggleTradeWant(shareCode)
      .catch(err => {
        setIsWanted(!newStatus);
        setWantCount(prev => newStatus ? prev - 1 : prev + 1);
        alert("操作失败");
      });
  };

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;
    if (!user) {
      alert("请先登录 / Please login first");
      navigate('/terminal/login');
      return;
    }

    postTradeComment(shareCode, commentText)
      .then(res => {
        if (res.code === 200) {
          alert("留言成功");
          setCommentText("");
          window.location.reload();
        } else {
          alert(res.message);
        }
      });
  };

  // 处理二维码下载/打开新页面
  const handleDownloadQr = (url, type) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = `${type}_qrcode_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <>
      <MainNav navSolid={true} />
      <div className="trade-page-loading">LOADING DATA...</div>
      <SiteFooter />
    </>
  );

  if (errorMsg) return (
    <>
      <MainNav navSolid={true} />
      <div className="trade-page-error">{errorMsg}</div>
      <SiteFooter />
    </>
  );

  if (!item) return null;

  const currentImage = (item.images && item.images.length > 0)
    ? item.images[activeImgIndex]
    : "/placeholder_gear.png";

  const hasMultipleImages = item.images && item.images.length > 1;

  return (
    <>
      <MainNav navSolid={true} />

      <div className="trade-detail-page">

        {/* 顶部：用户信息条 */}
        <div className="trade-user-header">
          <div className="user-header-left">
            <img src={item.author.avatar || "/default_avatar.png"} alt="avatar" className="header-avatar" />
            <div className="header-info">
              <h2 className="header-username">{item.author.username}</h2>
              <div className="header-meta">
                <span className="meta-time">发布于 {new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="user-header-right">
            <button className="header-btn" onClick={handleCopyShare}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" /></svg>
              分享 Share
            </button>
          </div>
        </div>

        {/* 主内容区：左右布局 */}
        <div className="trade-main-card">

          <div className={`trade-gallery ${hasMultipleImages ? 'has-thumbs' : ''}`}>
            {hasMultipleImages && (
              <div className="gallery-thumbs-col">
                {item.images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`thumb-item ${idx === activeImgIndex ? 'active' : ''}`}
                    onMouseEnter={() => setActiveImgIndex(idx)}
                    onClick={() => setActiveImgIndex(idx)}
                  >
                    <img src={img} alt={`thumb-${idx}`} />
                  </div>
                ))}
              </div>
            )}
            <div className="gallery-main-view">
              <img src={currentImage} alt="Main Gear" />
            </div>
          </div>

          <div className="trade-info-panel">
            <div className="info-price-row">
              <div className="price-wrap">
                <span className="currency">¥</span>
                <span className="amount">
                  {item.type === 'sell' ? item.price : `${item.budget_min}-${item.budget_max}`}
                </span>
              </div>
              <div className="views-wrap">
                <span className="condition-badge">{item.condition || "二手"}</span>
                <span className="view-stats">{wantCount} 人想要 · {item.view_count} 浏览</span>
              </div>
            </div>

            <div className="info-content-block">
              <p className="item-description">
                <span className="desc-title">{item.title}</span>
                <br />
                {item.description}
              </p>
            </div>

            <div className="info-attrs-grid">
              <div className="attr-item"><span className="attr-label">成色</span><span className="attr-value">{item.condition || "N/A"}</span></div>
              <div className="attr-item"><span className="attr-label">地区</span><span className="attr-value">{item.region}</span></div>
              <div className="attr-item"><span className="attr-label">类型</span><span className="attr-value">{item.type === 'sell' ? '出售' : '求购'}</span></div>
              <div className="attr-item"><span className="attr-label">交易方式</span><span className="attr-value">私聊协商</span></div>
            </div>

            {/* 登录可见的联系方式 */}
            {user && item.contact_info && (
              <div className="info-contact-box">
                <div className="contact-title">卖家联系方式 (登录可见)</div>
                <div className="contact-details">

                  {/* WeChat 部分 */}
                  {(item.contact_info.wechat || item.contact_info.wechat_qr) && (
                    <div className="contact-block" style={{ marginBottom: '10px' }}>
                      {item.contact_info.wechat && (
                        <div className="contact-row">
                          <span className="c-label">WeChat:</span>
                          <span className="c-val">{item.contact_info.wechat}</span>
                        </div>
                      )}
                      {item.contact_info.wechat_qr && (
                        <div
                          className="qr-download-link"
                          onClick={() => handleDownloadQr(item.contact_info.wechat_qr, 'wechat')}
                          style={{ cursor: 'pointer', color: '#888', fontSize: '13px', marginTop: '4px', display: 'inline-block' }}
                        >
                          由于《<a href="https://cgbgear.cn/policies/privacy" target="_blank" rel="noreferrer" style={{ color: '#22c55e', textDecoration: 'underline' }} onClick={(e) => e.stopPropagation()}>隐私政策</a>》，点击此处获取/下载 WeChat 二维码
                        </div>
                      )}
                    </div>
                  )}

                  {/* 闲鱼 部分 */}
                  {(item.contact_info.xianyu || item.contact_info.xianyu_qr) && (
                    <div className="contact-block">
                      {item.contact_info.xianyu && (
                        <div className="contact-row">
                          <span className="c-label">闲鱼:</span>
                          <span className="c-val">
                            {(() => {
                              const text = item.contact_info.xianyu;
                              // 正则匹配 http 或 https 开头的链接
                              const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
                              if (urlMatch) {
                                const url = urlMatch[0];
                                return (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#22c55e', textDecoration: 'underline' }}
                                  >
                                    点击直接访问闲鱼商品
                                  </a>
                                );
                              }
                              return text; // 如果不是口令，按原样展示文本
                            })()}
                          </span>
                        </div>
                      )}
                      {item.contact_info.xianyu_qr && (
                        <div
                          className="qr-download-link"
                          onClick={() => handleDownloadQr(item.contact_info.xianyu_qr, 'xianyu')}
                          style={{ cursor: 'pointer', color: '#888', fontSize: '13px', marginTop: '4px', display: 'inline-block' }}
                        >
                          由于《<a href="https://cgbgear.cn/policies/privacy" target="_blank" rel="noreferrer" style={{ color: '#22c55e', textDecoration: 'underline' }} onClick={(e) => e.stopPropagation()}>隐私政策</a>》，点击此处获取/下载 闲鱼 二维码
                        </div>
                      )}
                    </div>
                  )}


                </div>
              </div>
            )}

            <div className="info-action-area">
              <div className="action-buttons">
                <button
                  className={`btn-i-want ${isWanted ? 'active' : ''}`}
                  onClick={handleWantClick}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={isWanted ? "#666" : "currentColor"}><path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" /></svg>
                  {isWanted ? "已想要" : "我想要"}
                </button>
                <button className="btn-chat" onClick={() => document.querySelector('.comments-section').scrollIntoView({ behavior: 'smooth' })}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg>
                  留言咨询
                </button>
              </div>
              <div className="trade-warning-note">
                如服务包含额外费用（如运费、中介费等），请与卖家沟通后再交易。CGBGEAR仅提供信息发布平台。
              </div>
            </div>
          </div>
        </div>

        {/* 底部：评论区 */}
        <div className="trade-comments-container">
          <div className="comments-section">
            <h3 className="section-header">全部留言 <span className="count">({item.comments ? item.comments.length : 0})</span></h3>
            <div className="comment-input-area">
              <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={user ? "对宝贝感兴趣？留言问问看..." : "请登录后留言..."} disabled={!user} />
              <button onClick={handleCommentSubmit} disabled={!user}>发布留言</button>
            </div>
            <div className="comment-list">
              {item.comments && item.comments.map((c, i) => (
                <div key={i} className="comment-item">
                  <img src={c.avatar || "/default_avatar.png"} className="comment-avatar" alt="avatar" />
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-user">{c.username}</span>
                      <span className="comment-time">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <div className="comment-text">{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
};

export default TradeDetailPage;
