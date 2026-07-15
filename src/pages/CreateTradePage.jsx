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
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createTradeItem, uploadTradeImage } from '../api/api'; 
import { useAuth } from '../context/AuthContext';
import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import '../css/main.css';
import '../css/Trade.css';

// 地区选项
const REGIONS = [
  { value: 'Global', label: '全球 / Global' },
  { value: 'cn', label: '中国大陆 / China' },
  { value: 'North America', label: '北美 / North America' },
  { value: 'Europe', label: '欧洲 / Europe' },
  { value: 'Asia', label: '亚洲 / Asia (Excl. CN)' },
  { value: 'Oceania', label: '大洋洲 / Oceania' }
];

// 成色选项
const CONDITIONS = [
  { value: 'New', label: '全新 / Brand New' },
  { value: 'Like New', label: '充新 / Like New' },
  { value: 'Used', label: '战斗成色 / Used' },
  { value: 'Damaged', label: '战损 / Damaged' },
  { value: 'Parts', label: '尸体 / Parts Only' }
];

const CreateTradePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 获取发布类型 (默认为 sell)
  const tradeType = searchParams.get('type') === 'buy' ? 'buy' : 'sell';

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    budget_min: '',
    budget_max: '',
    condition: '', // 必填
    region: 'cn', // 默认中国
    images: [], // 主图数组
    
    // 联系方式
    contact_wechat: '',
    contact_wechat_qr: '',
    contact_xianyu: '',
    contact_xianyu_qr: ''
  });

  const [uploading, setUploading] = useState(false);
  const [qrUploading, setQrUploading] = useState(''); // 'wechat' | 'xianyu' | ''
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 权限检查
  useEffect(() => {
    if (!user) {
      navigate('/terminal/login'); 
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 通用图片上传 (主图)
  const handleMainImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (formData.images.length + files.length > 9) {
      setError("最多上传 9 张展示图片");
      return;
    }

    setUploading(true);
    setError('');

    try {
      // 并发上传
      const uploadPromises = files.map(file => uploadTradeImage(file));
      const responses = await Promise.all(uploadPromises);
      
      const newImages = responses.map(res => res.data?.url).filter(Boolean);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
    } catch (err) {
      console.error("Upload failed", err);
      setError("图片上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  // 二维码上传 (单张)
  const handleQrUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setQrUploading(type);
    setError('');

    try {
      const res = await uploadTradeImage(file);
      if (res.data?.url) {
        setFormData(prev => ({
          ...prev,
          [type === 'wechat' ? 'contact_wechat_qr' : 'contact_xianyu_qr']: res.data.url
        }));
      }
    } catch (err) {
      console.error("QR Upload failed", err);
      setError("二维码上传失败");
    } finally {
      setQrUploading('');
    }
  };

  const removeMainImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const removeQrImage = (field) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
  };

  // 提交逻辑
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- 校验逻辑 ---
    
    // 1. 基础信息
    if (!formData.images.length) {
      setError("请至少上传 1 张装备图片 (Basic Info)");
      window.scrollTo(0, 0);
      return;
    }
    if (!formData.title.trim()) {
      setError("请填写标题 (Title is required)");
      return;
    }
    if (!formData.description.trim()) {
      setError("请填写描述 (Description is required)");
      return;
    }

    // 2. 价格与成色
    if (tradeType === 'sell' && !formData.price) {
      setError("请填写出售价格 (Price is required)");
      return;
    }
    if (tradeType === 'buy' && (!formData.budget_min || !formData.budget_max)) {
      setError("请填写预算范围 (Budget range is required)");
      return;
    }
    if (!formData.condition) {
      setError("请选择成色 (Condition is required)");
      return;
    }

    // 3. 联系方式 (二选一)
    const hasWechat = formData.contact_wechat || formData.contact_wechat_qr;
    const hasXianyu = formData.contact_xianyu || formData.contact_xianyu_qr;

    if (!hasWechat && !hasXianyu) {
      setError("请至少填写一种联系方式 (微信或闲鱼)");
      return;
    }

    setSubmitting(true);

    // --- 构建 Payload ---
    const contactInfo = {
      wechat: formData.contact_wechat,
      wechat_qr: formData.contact_wechat_qr,
      xianyu: formData.contact_xianyu,
      xianyu_qr: formData.contact_xianyu_qr
    };

    const payload = {
      type: tradeType,
      title: formData.title,
      description: formData.description,
      region: formData.region,
      condition: formData.condition, // 后端需对应字段
      images: formData.images,
      contact_info: contactInfo,
      // 价格处理
      price: tradeType === 'sell' ? Number(formData.price) : 0,
      budget_min: tradeType === 'buy' ? Number(formData.budget_min) : 0,
      budget_max: tradeType === 'buy' ? Number(formData.budget_max) : 0,
    };

    try {
      const res = await createTradeItem(payload);
      if (res && res.code === 200) {
        navigate('/trade'); // 成功跳转
      } else {
        setError(res.message || "发布失败，请检查输入");
      }
    } catch (err) {
      console.error(err);
      setError("网络错误，发布失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <MainNav navSolid={true} />
      
      <div className="create-trade-page">
        <div className="trade-form-container">
          
          {/* 页面标题 */}
          <div className="trade-page-header">
            <h1 className="trade-main-title">
              {tradeType === 'sell' ? '发布出物' : '发布收物'}
              <span className="trade-deco-text">
                {tradeType === 'sell' ? 'LISTING FOR SALE' : 'WANT TO BUY'}
              </span>
            </h1>
          </div>

          {error && <div className="trade-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="trade-form-content">
            
            {/* --- 第一栏：基础信息 --- */}
            <div className="form-section">
              <h3 className="section-title">基础信息</h3>
              
              {/* 图片上传 (必填) */}
              <div className="form-group">
                <label className="field-label required">装备图片 / Images</label>
                <div className="image-grid">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="img-preview-box">
                      <img src={img} alt="preview" />
                      <button type="button" className="remove-img-btn" onClick={() => removeMainImage(idx)}>×</button>
                    </div>
                  ))}
                  
                  {formData.images.length < 9 && (
                    <label className="upload-box">
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleMainImageUpload} 
                        disabled={uploading}
                      />
                      <div className="upload-placeholder">
                        <span className="plus-icon">+</span>
                        <span className="upload-text">{uploading ? '上传中...' : '添加图片'}</span>
                      </div>
                    </label>
                  )}
                </div>
                <p className="field-hint">首张图片将作为封面展示。</p>
              </div>

              {/* 标题 */}
              <div className="form-group">
                <label className="field-label required">标题 / Title</label>
                <input 
                  type="text" 
                  name="title" 
                  className="trade-input"
                  value={formData.title} 
                  onChange={handleChange}
                  placeholder="品牌 + 型号 + 关键特征"
                  maxLength={60}
                />
              </div>

              {/* 描述 */}
              <div className="form-group">
                <label className="field-label required">装备描述 / Description</label>
                <textarea 
                  name="description" 
                  className="trade-textarea"
                  value={formData.description} 
                  onChange={handleChange}
                  rows={6}
                  placeholder="描述一下装备的新旧程度、瑕疵情况、尺码信息、来源等..."
                />
              </div>
            </div>

            {/* --- 第二栏：价格与成色 --- */}
            <div className="form-section">
              <h3 className="section-title">价格与成色</h3>
              <div className="form-row-2">
                
                {/* 价格/预算 */}
                <div className="form-group">
                  <label className="field-label required">
                    {tradeType === 'sell' ? '出售价格 (CNY)' : '求购预算 (CNY)'}
                  </label>
                  {tradeType === 'sell' ? (
                    <div className="input-with-prefix">
                      <span className="prefix">¥</span>
                      <input 
                        type="number" 
                        name="price" 
                        className="trade-input"
                        value={formData.price} 
                        onChange={handleChange}
                        placeholder="0.00"
                      />
                    </div>
                  ) : (
                    <div className="budget-inputs">
                      <input 
                        type="number" name="budget_min" 
                        className="trade-input" placeholder="最低"
                        value={formData.budget_min} onChange={handleChange} 
                      />
                      <span className="separator">-</span>
                      <input 
                        type="number" name="budget_max" 
                        className="trade-input" placeholder="最高"
                        value={formData.budget_max} onChange={handleChange} 
                      />
                    </div>
                  )}
                </div>

                {/* 成色 */}
                <div className="form-group">
                  <label className="field-label required">成色 / Condition</label>
                  <select 
                    name="condition" 
                    className="trade-select"
                    value={formData.condition} 
                    onChange={handleChange}
                  >
                    <option value="">请选择成色...</option>
                    {CONDITIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* --- 第三栏：装备地区与联系方式 --- */}
            <div className="form-section">
              <h3 className="section-title">地区与联系方式</h3>
              
              {/* 地区 */}
              <div className="form-group">
                <label className="field-label required">所在地 / Region</label>
                <select 
                  name="region" 
                  className="trade-select"
                  value={formData.region} 
                  onChange={handleChange}
                >
                  {REGIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* 联系方式 - 微信 */}
              <div className="contact-method-row">
                <div className="contact-icon wechat-icon">
                   <svg t="1771413051286" className="contact-svg" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6169" width="20" height="20">
                     <path d="M371.232 119.456c-187.552 0-341.168 127.84-341.168 290.16 0 93.696 51.104 170.608 136.48 230.192l-34.112 102.656 119.248-59.84c42.688 8.48 76.912 17.152 119.504 17.152 10.704 0 21.328-0.528 31.84-1.36a254.752 254.752 0 0 1-10.512-71.488c0-148.96 128-269.92 290.064-269.92 11.04 0 21.984 0.8 32.864 2.016-29.52-137.44-176.464-239.568-344.208-239.568z m-110.832 230.336c-25.552 0-51.36-17.12-51.36-42.704 0-25.68 25.808-42.56 51.36-42.56s42.592 16.896 42.592 42.56c0 25.568-17.04 42.704-42.592 42.704z m238.768 0c-25.568 0-51.232-17.12-51.232-42.704 0-25.68 25.664-42.56 51.232-42.56 25.696 0 42.704 16.896 42.704 42.56 0 25.568-17.024 42.704-42.704 42.704z m494.8 273.056c0-136.32-136.48-247.488-289.776-247.488-162.32 0-290.176 111.184-290.176 247.488 0 136.608 127.84 247.568 290.176 247.568 33.968 0 68.208-8.56 102.352-17.12l93.6 51.232-25.664-85.264c68.48-51.344 119.488-119.472 119.488-196.416z m-383.872-42.624c-16.992 0-34.128-16.88-34.128-34.112 0-17.024 17.136-34.144 34.128-34.144 25.824 0 42.72 17.12 42.72 34.144 0 17.232-16.896 34.112-42.72 34.112z m187.68 0c-16.88 0-33.904-16.88-33.904-34.112 0-17.024 17.024-34.144 33.904-34.144 25.552 0 42.688 17.12 42.688 34.144 0 17.232-17.136 34.112-42.688 34.112z" fill="#22c55e" p-id="6170"></path>
                   </svg>
                   <span className="contact-label">微信 WeChat</span>
                </div>
                <div className="contact-inputs">
                  <input 
                    type="text" 
                    name="contact_wechat"
                    className="trade-input"
                    placeholder="微信号 (可选)"
                    value={formData.contact_wechat}
                    onChange={handleChange}
                  />
                  <div className="qr-upload-wrapper">
                    {formData.contact_wechat_qr ? (
                      <div className="qr-preview">
                        <img src={formData.contact_wechat_qr} alt="WeChat QR" />
                        <button type="button" onClick={() => removeQrImage('contact_wechat_qr')}>×</button>
                      </div>
                    ) : (
                      <label className="qr-upload-btn">
                        {qrUploading === 'wechat' ? '...' : '上传二维码'}
                        <input type="file" accept="image/*" onChange={(e) => handleQrUpload(e, 'wechat')} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* 联系方式 - 闲鱼 */}
              <div className="contact-method-row">
                <div className="contact-icon xianyu-icon">
                  <svg t="1771413683901" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9097" width="20" height="20">
                  <path d="M424.45036 155S543.41036 23.21 602.20036 40.63c87.19 25.84 28.45 118.1 28.45 118.1s37.91-86.84 119.62-61.47c63.15 19.6 3.11 103.24 3.11 103.24s114.47-35.72 134.07 7.84c18.79 41.75-39.19 91.47-39.19 91.47s81.58-11.15 95.8 45.74c8.71 34.85-43.55 61-43.55 61s63.15 17.43 63.15 50.1c0 43.55-43.55 54.44-43.55 54.44s50.08 6.54 50.08 43.56c0 41.44-47.9 63.16-47.9 63.16v32.67s85.42-33.21 100.16 15.25c15.24 50.09-87.1 91.47-87.1 91.47s58.8 37 21.78 67.52c-30.9 25.46-98-8.71-98-8.71L547.77036 223.58z" fill="#F69706" p-id="9098"></path><path d="M149.30036 519.79s-47.91-61-89.28-65.34-78.39 47.91-50.08 93.65 139.36 45.74 139.36 45.74z" fill="#FDB804" p-id="9099"></path><path d="M428.00036 153.89s139.36-26.14 287.42 28.31 274.36 296.2 196 540.14-267.82 257-363.63 259.17S345.27036 951 258.17036 868.26c-74.52-70.81 124-695.37 124-695.37z" fill="#F69706" p-id="9100"></path><path d="M428.00036 153.89S166.85036 227.5 134.00036 565.52c-21.72 224.33 128.44 355.36 267.88 389.86C604.38036 1005.47 735.00036 938 802.53036 807.28S861.32036 447.91 776.40036 302C681.00036 138 428.00036 153.89 428.00036 153.89z" fill="#FFEA44" p-id="9101"></path><path d="M778.58036 639.57s26.13-56.62 76.21-58.8 78.39 50.09 56.61 87.12-65.32 61-111 45.74-21.82-74.06-21.82-74.06z" fill="#FDB804" p-id="9102"></path><path d="M391.00036 471.87c101.52 16.92 84.92 67.52 84.92 67.52S465.00036 626.51 354.00036 611.26c-80.57-11.06-65.35-102.36-65.35-102.36s-2.18-54.45 102.35-37.03z" fill="#600604" p-id="9103"></path><path d="M231.816271 442.580665a133.41 185.21 26.5 1 0 165.280594-331.501587 133.41 185.21 26.5 1 0-165.280594 331.501587Z" fill="#FFEA44" p-id="9104"></path><path d="M450.320556 470.185582a150.46 185.21 26.49 1 0 165.222733-331.530428 150.46 185.21 26.49 1 0-165.222733 331.530428Z" fill="#FFEA44" p-id="9105"></path><path d="M253.882286 435.104843a120.85 163.34 26.5 1 0 145.763901-292.357157 120.85 163.34 26.5 1 0-145.763901 292.357157Z" fill="#FFFFFF" p-id="9106"></path><path d="M465.50948 483.988057a129.03 175.16 21.31 1 0 127.311135-326.367856 129.03 175.16 21.31 1 0-127.311135 326.367856Z" fill="#FFFFFF" p-id="9107"></path><path d="M333.75036 261.64A21.84 21.84 0 0 0 306.00036 275.05l-23.61 67.89a21.77 21.77 0 1 0 41.13 14.3l23.62-67.88a21.84 21.84 0 0 0-13.39-27.72zM579.35036 304.82a21.84 21.84 0 0 0-26.88-15l-69.14 19.53a21.84 21.84 0 0 0-15.05 26.87 21.69 21.69 0 0 0 9.33 12.44l53.48 44.23a21.83 21.83 0 0 0 30.66-2.9 21.84 21.84 0 0 0-2.91-30.66l-23.48-19.42 28.94-8.17a21.86 21.86 0 0 0 15.05-26.92z" p-id="9108"></path><path d="M474.10036 547.61C459.11036 535.69 435.53036 528 409.00036 528c-45.29 0-82 22.39-82 50 0 12.06 7 23.11 18.65 31.75 2.66 0.6 5.42 1.11 8.33 1.51 89.84 12.33 114.12-42.32 120.12-63.65z" fill="#B32120" p-id="9109"></path></svg>
                  <span className="contact-label">闲鱼 Xianyu</span>
                </div>
                <div className="contact-inputs">
                  <input 
                    type="text" 
                    name="contact_xianyu"
                    className="trade-input"
                    placeholder="闲鱼号/口令 (可选)"
                    value={formData.contact_xianyu}
                    onChange={handleChange}
                  />
                  <div className="qr-upload-wrapper">
                    {formData.contact_xianyu_qr ? (
                      <div className="qr-preview">
                        <img src={formData.contact_xianyu_qr} alt="Xianyu QR" />
                        <button type="button" onClick={() => removeQrImage('contact_xianyu_qr')}>×</button>
                      </div>
                    ) : (
                      <label className="qr-upload-btn">
                        {qrUploading === 'xianyu' ? '...' : '上传二维码'}
                        <input type="file" accept="image/*" onChange={(e) => handleQrUpload(e, 'xianyu')} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
              <p className="field-hint" style={{marginTop:'5px'}}>* 请至少填写一种联系方式，或上传对应的二维码图片。</p>

            </div>

            {/* 底部提交 */}
            <div className="form-submit-area">
              <button 
                type="submit" 
                className="trade-submit-btn"
                disabled={submitting || uploading || qrUploading}
              >
                {submitting ? '发布中...' : '发布'}
              </button>
            </div>

          </form>
        </div>
      </div>
      
      <SiteFooter />
    </>
  );
};

export default CreateTradePage;
