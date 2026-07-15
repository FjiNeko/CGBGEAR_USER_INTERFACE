// MobileNewPostPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import MainNav from '../components/MainNav';
import SiteFooter from '../components/SiteFooter';
import { useAuth } from '../context/AuthContext';
import { useNotice } from '../context/NoticeContext';
import { getForumModules, createForumPost, uploadImage } from '../api/api';

import '../css/main.css';

// 简单的 SVG 图标组件
const Icons = {
    Back: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
    ),
    Plus: () => (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    ),
    CaretDown: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    ),
    Close: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    )
};

const MobileNewPostPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { showNotice } = useNotice();
    const fileInputRef = useRef(null);

    // 数据状态
    const [targetSubsectionId, setTargetSubsectionId] = useState(null);
    const [loadingModules, setLoadingModules] = useState(true);
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    
    // 表单状态
    const [postType, setPostType] = useState('post'); // 'post' or 'article'
    const [showTypeMenu, setShowTypeMenu] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [uploadedImages, setUploadedImages] = useState([]); // [{ url: string, id: string }]
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. 初始化版块信息 (逻辑与 PC 端保持一致)
    useEffect(() => {
        const initData = async () => {
            setLoadingModules(true);
            try {
                const queryParams = new URLSearchParams(location.search);
                const subsectionIdFromQuery = queryParams.get('subsection_id');

                if (!subsectionIdFromQuery) {
                    showNotice("缺少版块参数", "error");
                    setLoadingModules(false);
                    return;
                }

                setTargetSubsectionId(subsectionIdFromQuery);

                const res = await getForumModules();
                const modules = res.data || [];

                let foundSub = null;
                let foundParent = null;

                for (const section of modules) {
                    if (section.subsections) {
                        const match = section.subsections.find(sub => (sub.id && sub.id.toString()) === subsectionIdFromQuery);
                        if (match) {
                            foundSub = match;
                            foundParent = section;
                            break;
                        }
                    }
                }

                const crumbs = [{ label: '论坛', link: '/forum' }];
                if (foundParent) {
                    crumbs.push({ label: foundParent.name, link: `/forum/${encodeURIComponent(foundParent.name.toLowerCase())}` });
                }
                if (foundSub) {
                    crumbs.push({ label: foundSub.name, link: `/forum/${encodeURIComponent(foundParent.name.toLowerCase())}/${encodeURIComponent(foundSub.name.toLowerCase())}` });
                }
                setBreadcrumbs(crumbs);

            } catch (e) {
                showNotice("加载版块信息失败", "error");
            } finally {
                setLoadingModules(false);
            }
        };

        initData();
    }, [location.search, showNotice]);

    // 2. 图片上传处理
    const handleImagePick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showNotice("正在上传图片...", "info");
        try {
            const response = await uploadImage(file);
            let finalUrl = null;
            if (response && response.data && response.data.url) {
                finalUrl = response.data.url;
            } else if (response && response.url) {
                finalUrl = response.url;
            }

            if (finalUrl) {
                setUploadedImages(prev => [...prev, { url: finalUrl, id: Date.now() }]);
                showNotice("图片上传成功", "success");
            }
        } catch (error) {
            showNotice("图片上传失败", "error");
        } finally {
            // 清空 input 防止重复上传同一张图不触发 onChange
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (idToRemove) => {
        setUploadedImages(prev => prev.filter(img => img.id !== idToRemove));
    };

    // 3. 提交帖子
    const handleSubmit = async () => {
        if (!currentUser || !currentUser.is_logged_in) {
            showNotice('请先登录', 'warning');
            navigate('/terminal/login');
            return;
        }
        if (!title.trim()) return showNotice('请输入标题', 'warning');
        if (!content.trim() && uploadedImages.length === 0) return showNotice('请输入正文内容', 'warning');

        setIsSubmitting(true);

        // 构建 HTML 内容
        // 1. 将换行符转换为 <br/> 或 <p>
        let htmlContent = content.split('\n').map(line => `<p>${line}</p>`).join('');
        
        // 2. 将图片追加到底部
        if (uploadedImages.length > 0) {
            uploadedImages.forEach(img => {
                htmlContent += `<p><img src="${img.url}" style="max-width: 100%; height: auto; border-radius: 8px; margin-top: 10px;" /></p>`;
            });
        }

        try {
            const res = await createForumPost({
                threadTitle: title,
                content: htmlContent,
                subsection_id: targetSubsectionId
            });

            if (res && (res.code === 200 || res.code === 201)) {
                showNotice("发布成功！", 'success');
                navigate(`/thread/${res.data.post_id}`);
            } else {
                showNotice(res?.message || "发布异常", 'warning');
            }
        } catch (err) {
            showNotice("发布失败，请重试", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 样式对象
    const styles = {
        container: {
            paddingTop: '6vh', // 满足要求：Mainnav遮挡问题
            minHeight: '100vh',
            background: '#050809', // 保持 main.css 深色背景
            color: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
        },
        headerBar: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            position: 'relative',
            zIndex: 10
        },
        headerTitle: {
            fontSize: '17px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
        },
        submitBtn: {
            color: isSubmitting ? '#666' : '#6af500', // 荧光绿
            fontSize: '16px',
            fontWeight: '500',
            background: 'none',
            border: 'none',
            padding: 0
        },
        typeMenu: {
            position: 'absolute',
            top: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a1d1e',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '8px 0',
            width: '140px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            zIndex: 20
        },
        menuItem: {
            padding: '10px 20px',
            fontSize: '14px',
            textAlign: 'center',
            color: '#ccc',
            display: 'block'
        },
        activeItem: {
            color: '#6af500',
            fontWeight: 'bold'
        },
        disabledItem: {
            color: '#555',
            cursor: 'not-allowed'
        },
        formArea: {
            flex: 1,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        },
        imageGrid: {
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '10px'
        },
        uploadBtn: {
            width: '80px',
            height: '80px',
            minWidth: '80px',
            background: '#141414',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '1px solid #333'
        },
        imagePreview: {
            width: '80px',
            height: '80px',
            minWidth: '80px',
            borderRadius: '8px',
            position: 'relative',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid #333'
        },
        removeBtn: {
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            background: 'rgba(0,0,0,0.8)',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
        },
        titleInput: {
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: '18px',
            padding: '10px 0',
            width: '100%',
            borderRadius: 0,
            outline: 'none'
        },
        contentInput: {
            background: 'transparent',
            border: 'none',
            color: '#ccc',
            fontSize: '16px',
            width: '100%',
            minHeight: '200px',
            resize: 'none',
            outline: 'none',
            lineHeight: '1.6'
        },
        bottomBar: {
            padding: '15px 20px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: '#050809',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        breadcrumbItem: {
            fontSize: '12px',
            color: '#666',
            background: '#141414',
            padding: '6px 12px',
            borderRadius: '100px',
            border: '1px solid #222',
            whiteSpace: 'nowrap'
        }
    };

    return (
        <div className="page">
            <MainNav navSolid={true} />
            
            <div style={styles.container}>
                {/* 1. 顶部操作栏 */}
                <div style={styles.headerBar}>
                    <div onClick={() => navigate(-1)} style={{ cursor: 'pointer', padding: '5px' }}>
                        <Icons.Back />
                    </div>
                    
                    <div style={styles.headerTitle} onClick={() => setShowTypeMenu(!showTypeMenu)}>
                        {postType === 'post' ? '发布帖子' : '发布文章'}
                        <Icons.CaretDown />
                    </div>

                    <button 
                        style={styles.submitBtn} 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? '...' : '发布'}
                    </button>

                    {/* 类型选择菜单 */}
                    {showTypeMenu && (
                        <div style={styles.typeMenu}>
                            <div 
                                style={{...styles.menuItem, ...styles.activeItem}}
                                onClick={() => { setPostType('post'); setShowTypeMenu(false); }}
                            >
                                帖子 (Post)
                            </div>
                            <div 
                                style={{...styles.menuItem, ...styles.disabledItem}}
                                onClick={() => { showNotice('文章发布功能暂未开放', 'warning'); setShowTypeMenu(false); }}
                            >
                                文章 (未开放)
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. 主体表单区域 */}
                <div style={styles.formArea}>
                    
                    {/* 图片上传区 */}
                    <div style={styles.imageGrid}>
                        <div style={styles.uploadBtn} onClick={handleImagePick}>
                            <Icons.Plus />
                        </div>
                        {uploadedImages.map((img) => (
                            <div key={img.id} style={{...styles.imagePreview, backgroundImage: `url(${img.url})`}}>
                                <div style={styles.removeBtn} onClick={() => removeImage(img.id)}>
                                    <Icons.Close />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* 隐藏的文件输入 */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                    />

                    {/* 标题输入 */}
                    <input 
                        type="text" 
                        placeholder="填写标题" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={styles.titleInput}
                        maxLength={50}
                    />
                    
                    {/* 正文输入 */}
                    <textarea 
                        placeholder="添加正文..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        style={styles.contentInput}
                    />
                </div>

                {/* 3. 底部面包屑区域 (替换原图的 '添加分区') */}
                <div style={styles.bottomBar}>
                    <span style={{ fontSize: '12px', color: '#555', marginRight: '5px' }}>发布至:</span>
                    <div style={{ display: 'flex', overflowX: 'auto', gap: '8px' }}>
                        {loadingModules ? (
                            <span style={{ fontSize: '12px', color: '#444' }}>定位中...</span>
                        ) : (
                            breadcrumbs.map((crumb, idx) => (
                                <div key={idx} style={styles.breadcrumbItem}>
                                    {crumb.label}
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            <SiteFooter />
        </div>
    );
};

export default MobileNewPostPage;
