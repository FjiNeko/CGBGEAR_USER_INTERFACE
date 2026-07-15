import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    getAdminDashboard,
    grantSupporterBenefits,
    getAdminUsers,
    publishProduct,
    publishAnnouncement,
    uploadImage,
    getProducts,
    setUserRole,
    banUser,
    deleteUser,
    resetUserNickname,
    updateProduct,
    deleteProduct,
    toggleProductVisibility,
    uploadFile
} from '../../api/api';
import '../../css/AdminDashboard.css';

// 修复公告格式问题，告知我用一些方法，改成类似于这样的样式：
// <h2>尊敬的各位社群成员：</h2><p>为完善论坛功能、优化用户体验，并迎接即将到来的春节活动，CGBGEAR 论坛将于 <strong>2026年2月</strong> 正式启动公开测试。诚邀您作为核心用户参与，共同塑造论坛的初次亮相！</p><p>本次公测的核心安排如下：</p><ul>    <li><strong>预注册开放</strong>：2026年2月10日正式开放论坛注册通道。</li>    <li><strong>抢先注册奖励</strong>：前15位成功注册的成员将获得额外惊喜奖励（详情将于2月9日公布）。</li>    <li><strong>春节主题活动</strong>：2月14日至2月17日，论坛将同步上线春节限定主题与社区活动。</li></ul><p>公测期间，您可能会遇到功能调整或界面变化，这是优化过程的正常环节。如您遇到任何问题或有宝贵建议，欢迎通过以下方式反馈：</p><ul>    <li>发送邮件至：murdermobai0605@outlook.com</li>    <li>在官方社群群组内直接提出</li></ul><p><em>注：以上时间节点为暂定计划，如有调整我们将通过官方渠道第一时间通知。</em></p><p>感谢您一直以来的关注与支持！期待与您在 CGBGEAR 论坛相见。</p>

// --- SVG Icons ---
const Icons = {
    Home: () => <svg viewBox="0 0 24 24" className="icon-svg"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
    Users: () => <svg viewBox="0 0 24 24" className="icon-svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    Box: () => <svg viewBox="0 0 24 24" className="icon-svg"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
    Bell: () => <svg viewBox="0 0 24 24" className="icon-svg"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
    Menu: () => <svg viewBox="0 0 24 24" className="icon-svg"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
    Plus: () => <svg viewBox="0 0 24 24" className="icon-svg"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('home');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // States for different sections
    const [stats, setStats] = useState(null);
    const [targetUid, setTargetUid] = useState('');
    const [message, setMessage] = useState('');
    const [messageHistory, setMessageHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [noticeModalOpen, setNoticeModalOpen] = useState(false);
    const [productsExpanded, setProductsExpanded] = useState(false);

    // Users State
    const [userList, setUserList] = useState([]);
    const [userRoleFilter, setUserRoleFilter] = useState('user');
    const [userLoading, setUserLoading] = useState(false);
    const [userPage, setUserPage] = useState(1);
    const [userPageSize, setUserPageSize] = useState(10);
    const [userTotal, setUserTotal] = useState(0);
    const [userRoleByUid, setUserRoleByUid] = useState({});
    const [userBanByUid, setUserBanByUid] = useState({});
    const [userRenameByUid, setUserRenameByUid] = useState({});

    // 增加内部状态管理 Links 和 Attachments
    const [links, setLinks] = useState([]);
    const [attachments, setAttachments] = useState([]);

    // Product Form State
    const [productForm, setProductForm] = useState({
        name: '', brand: '', category: 'equipment', price: '', image: '', buy_url: '', buy_platform: '', tags: ''
    });
    const [productImageUploading, setProductImageUploading] = useState(false);
    const [productList, setProductList] = useState([]);
    const [productLoading, setProductLoading] = useState(false);
    
    // Price/Discount Modal State
    const [priceModalOpen, setPriceModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [priceModalType, setPriceModalType] = useState('price'); // 'price' or 'discount'
    const [newPriceValue, setNewPriceValue] = useState('');
    const [discountPercent, setDiscountPercent] = useState('');

    // Announcement Form State
    const [announceForm, setAnnounceForm] = useState({
        title: '', content: '', category: 'news', is_pinned: false
    });
    const [attachmentUploading, setAttachmentUploading] = useState(false);
    const [showHtmlPreview, setShowHtmlPreview] = useState(false);

    useEffect(() => {
        if (location.pathname.startsWith('/admin/users')) {
            setActiveTab('users');
        } else if (location.pathname.startsWith('/admin/publish/products')) {
            setActiveTab('products');
        } else if (location.pathname.startsWith('/admin/publish/announcements')) {
            setActiveTab('announcements');
        } else {
            setActiveTab('home');
        }
    }, [location.pathname]);

    // Load Dashboard Stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getAdminDashboard();
                if (res.code === 200) setStats(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        if (activeTab === 'home') fetchStats();
    }, [activeTab]);

    // Load Users
    useEffect(() => {
        const fetchUsers = async () => {
            setUserLoading(true);
            try {
                const res = await getAdminUsers(userRoleFilter, userPage, userPageSize);
                if (res.code === 200) {
                    setUserList(res.data.users);
                    setUserTotal(res.data.total || 0);
                }
            } catch (err) {
                setMessage(`加载用户失败: ${err}`);
            } finally {
                setUserLoading(false);
            }
        };
        if (activeTab === 'users') fetchUsers();
    }, [activeTab, userRoleFilter, userPage, userPageSize]);

    useEffect(() => {
        const fetchProducts = async () => {
            if (activeTab !== 'products') return;
            setProductLoading(true);
            try {
                const res = await getProducts();
                if (res.code === 200) {
                    const productData = Array.isArray(res.data) ? res.data : [];
                    setProductList(productData);
                }
            } catch (err) {
                setMessage(`加载产品失败: ${err}`);
            } finally {
                setProductLoading(false);
            }
        };
        fetchProducts();
    }, [activeTab]);


    // Helper to add message to history
    const addMessage = (msg) => {
        setMessage(msg);
        setMessageHistory(prev => [...prev, { text: msg, time: new Date().toLocaleTimeString() }]);
    };

    // Handlers
    const handleGrantBenefits = async () => {
        if (!targetUid) return;
        setLoading(true);
        try {
            const res = await grantSupporterBenefits(targetUid);
            addMessage(`SUCCESS: ${res.message || '操作成功'}`);
            setTargetUid('');
        } catch (err) {
            addMessage(`ERROR: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...productForm,
                tags: productForm.tags.replace(/，/g, ',').split(',').map(t => t.trim()).filter(t => t)
            };
            await publishProduct(payload);
            addMessage('SUCCESS: 产品发布成功');
            setProductForm({ name: '', brand: '', category: 'equipment', price: '', image: '', buy_url: '', buy_platform: '', tags: '' });

            const refreshProducts = await getProducts();
            if (refreshProducts.code === 200) {
                const productData = Array.isArray(refreshProducts.data) ? refreshProducts.data : [];
                setProductList(productData);
            }
        } catch (err) {
            addMessage(`ERROR: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleProductImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setProductImageUploading(true);
        setMessage('');
        try {
            const res = await uploadImage(file);
            const finalUrl = res?.data?.url || res?.url || '';
            if (!finalUrl) {
                addMessage('ERROR: 上传失败，未返回图片地址');
            } else {
                setProductForm(prev => ({ ...prev, image: finalUrl }));
                addMessage('SUCCESS: 图片上传成功');
            }
        } catch (err) {
            addMessage(`ERROR: ${err}`);
        } finally {
            setProductImageUploading(false);
            event.target.value = '';
        }
    };

    const handleProductToggleVisibility = async (productId) => {
        setLoading(true);
        try {
            await toggleProductVisibility(productId);
            addMessage(`SUCCESS: 已切换产品显示状态`);
            const res = await getProducts();
            if (res.code === 200) setProductList(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            addMessage(`ERROR: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleProductDelete = async (productId) => {
        if (!confirm(`确认删除此产品？`)) return;
        setLoading(true);
        try {
            await deleteProduct(productId);
            addMessage(`SUCCESS: 已删除产品`);
            const res = await getProducts();
            if (res.code === 200) setProductList(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            addMessage(`ERROR: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleProductUpdate = async (productId, updates) => {
        setLoading(true);
        try {
            await updateProduct(productId, updates);
            addMessage(`SUCCESS: 已更新产品`);
            const res = await getProducts();
            if (res.code === 200) setProductList(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            addMessage(`ERROR: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    const openPriceModal = (product) => {
        setSelectedProduct(product);
        setNewPriceValue(product.price);
        setDiscountPercent('');
        setPriceModalOpen(true);
    };

    const handlePriceModalSubmit = async () => {
        if (!selectedProduct) return;
        let finalPrice = newPriceValue;
        if (priceModalType === 'discount' && discountPercent) {
            finalPrice = (selectedProduct.price * (1 - discountPercent / 100)).toFixed(2);
        }
        await handleProductUpdate(selectedProduct.id, { price: finalPrice });
        setPriceModalOpen(false);
        setSelectedProduct(null);
    };

    const handleAnnounceSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await publishAnnouncement(announceForm);
            addMessage('SUCCESS: 公告发布成功 (已自动翻译)');
            setAnnounceForm({ title: '', content: '', category: 'news', is_pinned: false });
            setLinks([]);
            setAttachments([]);
        } catch (err) {
            addMessage(`ERROR: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAttachmentUpload = async (event, index) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setAttachmentUploading(true);
        try {
            const res = await uploadFile(file);
            const finalUrl = res?.data?.url || res?.url || '';
            if (!finalUrl) {
                addMessage('ERROR: 附件上传失败，未返回文件地址');
            } else {
                const newAttachments = [...attachments];
                newAttachments[index] = {
                    ...newAttachments[index],
                    filename: file.name,
                    file_url: finalUrl,
                    file_size: file.size,
                    file_type: file.type
                };
                setAttachments(newAttachments);
                addMessage('SUCCESS: 附件上传成功');
            }
        } catch (err) {
            addMessage(`ERROR: ${err}`);
        } finally {
            setAttachmentUploading(false);
            event.target.value = '';
        }
    };

    const handleSetUserRole = async (uid, role) => {
        setLoading(true);
        try {
            await setUserRole(uid, role);
            addMessage(`SUCCESS: 已设置用户 ${uid} 为 ${role}`);
            const res = await getAdminUsers(userRoleFilter, userPage, userPageSize);
            if (res.code === 200) {
                setUserList(res.data.users);
                setUserTotal(res.data.total || 0);
            }
        } catch (err) {
            addMessage(`ERROR: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBanUser = async (uid, duration) => {
        setLoading(true);
        try {
            await banUser(uid, duration);
            addMessage(`SUCCESS: 已封禁用户 ${uid} (${duration})`);
        } catch (err) {
            addMessage(`ERROR: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (uid) => {
        if (!confirm(`确认删除用户 ${uid}？此操作不可恢复！`)) return;
        setLoading(true);
        try {
            await deleteUser(uid);
            addMessage(`SUCCESS: 已删除用户 ${uid}`);
            const res = await getAdminUsers(userRoleFilter, userPage, userPageSize);
            if (res.code === 200) {
                setUserList(res.data.users);
                setUserTotal(res.data.total || 0);
            }
        } catch (err) {
            addMessage(`ERROR: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleResetNickname = async (uid, newNickname) => {
        setLoading(true);
        try {
            await resetUserNickname(uid, newNickname || '默认用户');
            addMessage(`SUCCESS: 已重置用户 ${uid} 昵称`);
            const res = await getAdminUsers(userRoleFilter, userPage, userPageSize);
            if (res.code === 200) {
                setUserList(res.data.users);
                setUserTotal(res.data.total || 0);
            }
        } catch (err) {
            addMessage(`ERROR: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    // Components
    const renderHome = () => (
        <div>
            <div className="admin-header">
                <h2 className="admin-title">控制台概览</h2>
                <p className="admin-subtitle">Welcome back, Commander.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="admin-card">
                    <h3 className="card-title">总用户数</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.total_users ?? '-'}</div>
                </div>
                <div className="admin-card">
                    <h3 className="card-title">今日新增</h3>
                    <div className="green" style={{ fontSize: '2rem', fontWeight: 'bold' }}>+{stats?.new_users_today ?? '-'}</div>
                </div>
                <div className="admin-card">
                    <h3 className="card-title">论坛总帖</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.total_posts ?? '-'}</div>
                </div>
            </div>

            <div className="admin-card">
                <h3 className="card-title">权益发放工具</h3>
                <div style={{ maxWidth: '400px' }}>
                    <input
                        type="text"
                        className="terminal-input"
                        placeholder="目标用户 UID"
                        value={targetUid}
                        onChange={(e) => setTargetUid(e.target.value)}
                    />
                    <button className="terminal-btn" onClick={handleGrantBenefits} disabled={loading}>
                        {loading ? 'Processing...' : '发放首发权益包'}
                    </button>
                    {message && <div style={{ marginTop: '10px', color: message.startsWith('ERROR') ? 'red' : '#00ff00' }}>{message}</div>}
                    <div style={{ marginTop: '10px' }}>
                        <button className="terminal-btn" onClick={() => navigate('/admin/users')}>
                            前往用户管理 (/admin/users)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderUsers = () => {
        const totalPages = Math.max(1, Math.ceil(userTotal / userPageSize));
        
        // 计算分页导航显示的页码范围
        const getPageNumbers = () => {
            const pages = [];
            const startPage = Math.floor((userPage - 1) / 5) * 5 + 1;
            const endPage = Math.min(startPage + 4, totalPages);
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
            return pages;
        };
        
        return (
            <div>
                <div className="admin-header">
                    <div>
                        <h2 className="admin-title">用户管理</h2>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                            <button
                                className={`terminal-btn ${userRoleFilter === 'user' ? 'active' : ''}`}
                                onClick={() => { setUserRoleFilter('user'); setUserPage(1); navigate('/admin/users'); }}
                            >
                                普通用户
                            </button>
                            <button
                                className={`terminal-btn ${userRoleFilter === 'admin' ? 'active' : ''}`}
                                onClick={() => { setUserRoleFilter('admin'); setUserPage(1); navigate('/admin/users'); }}
                            >
                                管理员
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <label className="green" style={{ fontSize: '0.8rem' }}>每页</label>
                        <select
                            className="terminal-input"
                            value={userPageSize}
                            onChange={(e) => { setUserPageSize(Number(e.target.value)); setUserPage(1); }}
                            style={{ maxWidth: '80px' }}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <div className="green" style={{ fontSize: '0.8rem' }}>共 {userTotal} 人</div>
                    </div>
                </div>

                {userLoading ? <p className="green">Scanning database...</p> : (
                    <div className="admin-card" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ccc' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                                    <th style={{ padding: '10px' }}>UID</th>
                                    <th style={{ padding: '10px' }}>昵称</th>
                                    <th style={{ padding: '10px' }}>邮箱</th>
                                    <th style={{ padding: '10px' }}>等级</th>
                                    <th style={{ padding: '10px' }}>CGB</th>
                                    <th style={{ padding: '10px' }}>注册时间</th>
                                    <th style={{ padding: '10px' }}>身份</th>
                                    <th style={{ padding: '10px' }}>封禁/删除</th>
                                    <th style={{ padding: '10px' }}>昵称处理</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userList.map(u => (
                                    <tr key={u.uid} style={{ borderBottom: '1px solid #111' }}>
                                        <td style={{ padding: '10px' }} className="green">{u.uid}</td>
                                        <td style={{ padding: '10px' }}>{u.display_name}</td>
                                        <td style={{ padding: '10px' }}>{u.email}</td>
                                        <td style={{ padding: '10px' }}>Lv.{u.level}</td>
                                        <td style={{ padding: '10px' }}>{u.cgb_points}</td>
                                        <td style={{ padding: '10px', fontSize: '0.8rem' }}>{u.created_at}</td>
                                        <td style={{ padding: '10px' }}>
                                            <select
                                                className="terminal-input"
                                                value={userRoleByUid[u.uid] || (userRoleFilter === 'admin' ? 'admin' : 'user')}
                                                onChange={(e) => setUserRoleByUid(prev => ({ ...prev, [u.uid]: e.target.value }))}
                                            >
                                                <option value="user">用户</option>
                                                <option value="admin">管理员</option>
                                                <option value="developer">开发者</option>
                                                <option value="sponsor">赞助商</option>
                                            </select>
                                            <button
                                                className="terminal-btn"
                                                style={{ marginTop: '6px' }}
                                                onClick={() => handleSetUserRole(u.uid, userRoleByUid[u.uid] || (userRoleFilter === 'admin' ? 'admin' : 'user'))}
                                                disabled={loading}
                                            >
                                                保存身份
                                            </button>
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <select
                                                    className="terminal-input"
                                                    value={userBanByUid[u.uid] || '7d'}
                                                    onChange={(e) => setUserBanByUid(prev => ({ ...prev, [u.uid]: e.target.value }))}
                                                >
                                                    <option value="1h">1小时</option>
                                                    <option value="6h">6小时</option>
                                                    <option value="1d">1天</option>
                                                    <option value="7d">7天</option>
                                                    <option value="30d">30天</option>
                                                    <option value="permanent">永久</option>
                                                </select>
                                                <button
                                                    className="terminal-btn"
                                                    onClick={() => handleBanUser(u.uid, userBanByUid[u.uid] || '7d')}
                                                    disabled={loading}
                                                >
                                                    封禁
                                                </button>
                                                <button
                                                    className="terminal-btn"
                                                    onClick={() => handleDeleteUser(u.uid)}
                                                    disabled={loading}
                                                >
                                                    删除
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <input
                                                    className="terminal-input"
                                                    placeholder="默认昵称"
                                                    value={userRenameByUid[u.uid] || ''}
                                                    onChange={(e) => setUserRenameByUid(prev => ({ ...prev, [u.uid]: e.target.value }))}
                                                />
                                                <button
                                                    className="terminal-btn"
                                                    onClick={() => handleResetNickname(u.uid, userRenameByUid[u.uid])}
                                                    disabled={loading}
                                                >
                                                    修改昵称
                                                </button>
                                                <button
                                                    className="terminal-btn"
                                                    onClick={() => handleResetNickname(u.uid, '')}
                                                    disabled={loading}
                                                >
                                                    恢复默认名
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* 分页导航 */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                            <button
                                className="terminal-btn"
                                onClick={() => setUserPage(1)}
                                disabled={userPage === 1}
                            >
                                首页
                            </button>
                            <button
                                className="terminal-btn"
                                onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}
                                disabled={userPage <= 1}
                            >
                                上一页
                            </button>
                            {getPageNumbers().map(pageNum => (
                                <button
                                    key={pageNum}
                                    className={`terminal-btn ${userPage === pageNum ? 'active' : ''}`}
                                    onClick={() => setUserPage(pageNum)}
                                    style={{ minWidth: '40px' }}
                                >
                                    {pageNum}
                                </button>
                            ))}
                            <button
                                className="terminal-btn"
                                onClick={() => setUserPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={userPage >= totalPages}
                            >
                                下一页
                            </button>
                            <button
                                className="terminal-btn"
                                onClick={() => setUserPage(totalPages)}
                                disabled={userPage === totalPages}
                            >
                                末页
                            </button>
                            <span className="green" style={{ fontSize: '0.85rem' }}>
                                第 {userPage} / {totalPages} 页
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderProducts = () => (
        <div>
            <div className="admin-header">
                <h2 className="admin-title">产品发布</h2>
            </div>
            <div className="admin-card">
                <form onSubmit={handleProductSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="green">产品名称</label>
                            <input className="terminal-input" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
                        </div>
                        <div>
                            <label className="green">品牌</label>
                            <input className="terminal-input" value={productForm.brand} onChange={e => setProductForm({ ...productForm, brand: e.target.value })} required />
                        </div>
                        <div>
                            <label className="green">价格 (¥)</label>
                            <input className="terminal-input" type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required />
                        </div>
                        <div>
                            <label className="green">分类</label>
                            <select className="terminal-input" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}>
                                <option value="equipment">战术装备</option>
                                <option value="clothing">服饰</option>
                                <option value="accessory">配件</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <label className="green">产品主图</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input className="terminal-input" value={productForm.image} onChange={e => setProductForm({ ...productForm, image: e.target.value })} placeholder="上传后自动填充" required />
                            <input
                                type="file"
                                accept="image/*"
                                className="terminal-input"
                                onChange={handleProductImageUpload}
                                disabled={productImageUploading}
                                style={{ maxWidth: '220px' }}
                            />
                            <button type="button" className="terminal-btn" disabled={productImageUploading} onClick={() => handleProductAction('上传图片')}>
                                {productImageUploading ? '上传中...' : '选择图片'}
                            </button>
                            <div style={{ fontSize: '0.75rem', color: '#8a8a8a' }}>
                                使用 /api/upload 上传图片并自动填充 URL
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <label className="green">购买链接</label>
                        <input className="terminal-input" value={productForm.buy_url} onChange={e => setProductForm({ ...productForm, buy_url: e.target.value })} />
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <label className="green">购买平台</label>
                        <select className="terminal-input" value={productForm.buy_platform} onChange={e => setProductForm({ ...productForm, buy_platform: e.target.value })}>
                            <option value="">请选择</option>
                            <option value="淘宝">淘宝</option>
                            <option value="闲鱼">闲鱼</option>
                        </select>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <label className="green">标签 (逗号分隔)</label>
                        <input className="terminal-input" value={productForm.tags} onChange={e => setProductForm({ ...productForm, tags: e.target.value })} placeholder="New, Hot, Sale" />
                    </div>

                    <button type="submit" className="terminal-btn" style={{ marginTop: '20px' }} disabled={loading}>
                        <Icons.Plus /> {loading ? 'Submitting...' : '发布产品'}
                    </button>
                    {message && <div style={{ marginTop: '10px' }}>{message}</div>}
                </form>
            </div>

            <div className="admin-card" style={{ marginTop: '20px' }}>
                <h3 className="card-title" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => setProductsExpanded(!productsExpanded)}>
                    已发布产品 <span style={{ fontSize: '0.8rem' }}>{productsExpanded ? '▼' : '▶'}</span>
                </h3>
                {productsExpanded && (productLoading ? (
                    <p className="green">Loading products...</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ccc' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                                    <th style={{ padding: '10px' }}>名称</th>
                                    <th style={{ padding: '10px' }}>品牌</th>
                                    <th style={{ padding: '10px' }}>价格</th>
                                    <th style={{ padding: '10px' }}>折前原价</th>
                                    <th style={{ padding: '10px' }}>是否临时下架</th>
                                    <th style={{ padding: '10px' }}>是否临时打折扣</th>
                                    <th style={{ padding: '10px' }}>标签</th>
                                    <th style={{ padding: '10px' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productList.map(product => (
                                    <tr key={`${product.brand}-${product.name}-${product.createdAt || ''}`} style={{ borderBottom: '1px solid #111' }}>
                                        <td style={{ padding: '10px' }}>{product.name}</td>
                                        <td style={{ padding: '10px' }}>{product.brand}</td>
                                        <td style={{ padding: '10px' }}>¥{product.price}</td>
                                        <td style={{ padding: '10px' }}>{product.original_price ? `¥${product.original_price}` : '-'}</td>
                                        <td style={{ padding: '10px' }}>{product.is_hidden ? '是' : '否'}</td>
                                        <td style={{ padding: '10px' }}>{product.original_price && product.original_price > product.price ? '是' : '否'}</td>
                                        <td style={{ padding: '10px' }}>{Array.isArray(product.tags) ? product.tags.join(', ') : ''}</td>
                                        <td style={{ padding: '10px' }}>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <button className="terminal-btn" onClick={() => openPriceModal(product)} disabled={loading}>
                                                    修改价格/折扣
                                                </button>
                                                <button className="terminal-btn" onClick={() => handleProductToggleVisibility(product.id)} disabled={loading}>
                                                    临时下架
                                                </button>
                                                <button className="terminal-btn" onClick={() => handleProductDelete(product.id)} disabled={loading}>
                                                    删除
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAnnouncements = () => {
        const addLink = () => setLinks([...links, { url: '', link_text: '', is_terms_of_service: false }]);
        const addAttachment = () => setAttachments([...attachments, { filename: '', file_url: '', file_size: 0, file_type: '' }]);

        const handleFormSubmit = async (e) => {
            e.preventDefault();
            setLoading(true);
            const payload = {
                ...announceForm,
                title_zh_cn: announceForm.title, // 映射到后端期待的字段名
                content_zh_cn: announceForm.content,
                links: links.filter(l => l.url), // 过滤空行
                attachments: attachments.filter(a => a.file_url),
                impact_scope: { scope: "global" } // 示例
            };

            try {
                await publishAnnouncement(payload);
                addMessage('SUCCESS: 公告已全平台发布');
                // 重置表单...
            } catch (err) {
                addMessage(`ERROR: ${err}`);
            } finally {
                setLoading(false);
            }
        };

        return (
            <div>
                <div className="admin-header">
                    <h2 className="admin-title">高级公告发布系统</h2>
                </div>
                <div className="admin-card">
                    <form onSubmit={handleFormSubmit}>
                        <label className="green">简体中文标题</label>
                        <input className="terminal-input" value={announceForm.title} onChange={e => setAnnounceForm({ ...announceForm, title: e.target.value })} required />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                            <label className="green">简体中文内容 (支持HTML格式)</label>
                            <button type="button" className="terminal-btn" style={{ fontSize: '0.7rem' }} onClick={() => setShowHtmlPreview(!showHtmlPreview)}>
                                {showHtmlPreview ? '隐藏预览' : '显示预览'}
                            </button>
                        </div>
                        <textarea className="terminal-input" style={{ minHeight: '200px', fontFamily: 'monospace', fontSize: '13px' }} value={announceForm.content} onChange={e => setAnnounceForm({ ...announceForm, content: e.target.value })} placeholder="支持HTML标签: <h2>, <p>, <strong>, <ul>, <li>, <em> 等" required />
                        <div style={{ fontSize: '0.75rem', color: '#8a8a8a', marginTop: '5px' }}>
                            提示：直接输入HTML代码，例如 &lt;h2&gt;标题&lt;/h2&gt;&lt;p&gt;内容&lt;/p&gt;
                        </div>
                        {showHtmlPreview && (
                            <div style={{ marginTop: '10px', padding: '15px', border: '1px solid #00ff00', borderRadius: '4px', background: '#fff', color: '#333' }}>
                                <h4 style={{ color: '#333', marginTop: 0, marginBottom: '10px', fontSize: '14px' }}>预览效果：</h4>
                                <div dangerouslySetInnerHTML={{ __html: announceForm.content }} />
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                            <div>
                                <label className="green">分类 (Category)</label>
                                <select
                                    className="terminal-input"
                                    value={announceForm.category}
                                    onChange={e => setAnnounceForm({ ...announceForm, category: e.target.value })}
                                >
                                    <option value="system_maintenance">系统维护 (system_maintenance)</option>
                                    <option value="policy_update">政策更新 (policy_update)</option>
                                    <option value="new_feature">新功能上线 (new_feature)</option>
                                    <option value="version_update">版本更新 (version_update)</option>
                                    <option value="other">其他公告 (other)</option>
                                </select>
                            </div>
                            <div>
                                <label className="green">状态 (Status)</label>
                                <select className="terminal-input" value={announceForm.status} onChange={e => setAnnounceForm({ ...announceForm, status: e.target.value })}>
                                    <option value="new">New (新发布)</option>
                                    <option value="ongoing">Ongoing (进行中)</option>
                                    <option value="ended">Ended (已结束)</option>
                                </select>
                            </div>
                        </div>

                        {/* 动态链接部分 */}
                        <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                            <h4 className="green">关联链接 (Links)</h4>
                            {links.map((link, index) => (
                                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                                    <input placeholder="链接文本" className="terminal-input" value={link.link_text} onChange={e => {
                                        const newLinks = [...links];
                                        newLinks[index].link_text = e.target.value;
                                        setLinks(newLinks);
                                    }} />
                                    <input placeholder="URL" className="terminal-input" value={link.url} onChange={e => {
                                        const newLinks = [...links];
                                        newLinks[index].url = e.target.value;
                                        setLinks(newLinks);
                                    }} />
                                </div>
                            ))}
                            <button type="button" className="terminal-btn" style={{ fontSize: '0.7rem' }} onClick={addLink}>+ 添加链接行</button>
                        </div>

                        {/* 动态附件部分 */}
                        <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                            <h4 className="green">附件 (Attachments)</h4>
                            {attachments.map((att, index) => (
                                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
                                    <input placeholder="文件名" className="terminal-input" value={att.filename} onChange={e => {
                                        const newAtt = [...attachments];
                                        newAtt[index].filename = e.target.value;
                                        setAttachments(newAtt);
                                    }} />
                                    <input placeholder="文件URL" className="terminal-input" value={att.file_url} onChange={e => {
                                        const newAtt = [...attachments];
                                        newAtt[index].file_url = e.target.value;
                                        setAttachments(newAtt);
                                    }} />
                                    <input
                                        type="file"
                                        className="terminal-input"
                                        onChange={(e) => handleAttachmentUpload(e, index)}
                                        disabled={attachmentUploading}
                                        style={{ maxWidth: '220px' }}
                                    />
                                    <button
                                        type="button"
                                        className="terminal-btn"
                                        disabled={attachmentUploading}
                                        onClick={() => handleUserAction('上传附件')}
                                    >
                                        {attachmentUploading ? '上传中...' : '选择文件'}
                                    </button>
                                    <div style={{ fontSize: '0.75rem', color: '#8a8a8a' }}>
                                        临时使用 /api/upload 上传附件 (需后端提供 uploadFiles + /down 下载)
                                    </div>
                                </div>
                            ))}
                            <button type="button" className="terminal-btn" style={{ fontSize: '0.7rem' }} onClick={addAttachment}>+ 添加附件行</button>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <button type="submit" className="terminal-btn" disabled={loading}>
                                {loading ? '正在部署并翻译...' : '全频道广播'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const renderPriceModal = () => {
        if (!priceModalOpen || !selectedProduct) return null;
        const calculatedPrice = priceModalType === 'discount' && discountPercent
            ? (selectedProduct.price * (1 - discountPercent / 100)).toFixed(2)
            : newPriceValue;
        
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ background: '#1a1a1a', border: '1px solid #00ff00', padding: '30px', maxWidth: '500px', width: '90%', borderRadius: '4px' }}>
                    <h3 className="green" style={{ marginBottom: '20px' }}>修改价格/折扣 - {selectedProduct.name}</h3>
                    <div style={{ marginBottom: '15px' }}>
                        <label className="green" style={{ fontSize: '0.9rem' }}>原价: ¥{selectedProduct.price}</label>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <button className={`terminal-btn ${priceModalType === 'price' ? 'active' : ''}`} onClick={() => setPriceModalType('price')}>直接修改价格</button>
                        <button className={`terminal-btn ${priceModalType === 'discount' ? 'active' : ''}`} onClick={() => setPriceModalType('discount')}>按折扣计算</button>
                    </div>
                    {priceModalType === 'price' ? (
                        <div>
                            <label className="green">新价格 (¥)</label>
                            <input className="terminal-input" type="number" step="0.01" value={newPriceValue} onChange={(e) => setNewPriceValue(e.target.value)} />
                        </div>
                    ) : (
                        <div>
                            <label className="green">折扣百分比 (%)</label>
                            <input className="terminal-input" type="number" step="1" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="例如: 20 表示8折" />
                            {discountPercent && <div className="green" style={{ marginTop: '10px', fontSize: '0.9rem' }}>计算后价格: ¥{calculatedPrice}</div>}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button className="terminal-btn" onClick={handlePriceModalSubmit} disabled={loading}>确认修改</button>
                        <button className="terminal-btn" onClick={() => setPriceModalOpen(false)}>取消</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderNoticeModal = () => {
        if (!noticeModalOpen) return null;
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={() => setNoticeModalOpen(false)}>
                <div style={{ background: '#fff', padding: '24px', maxWidth: '600px', width: '90%', maxHeight: '80vh', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#333' }}>系统通知</h3>
                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
                        {messageHistory.length === 0 ? (
                            <div style={{ padding: '12px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', color: '#666', fontSize: '14px' }}>暂无通知信息</div>
                        ) : (
                            messageHistory.slice().reverse().map((msg, idx) => (
                                <div key={idx} style={{ padding: '12px', marginBottom: '8px', background: msg.text.startsWith('ERROR') ? '#fee' : '#efe', border: `1px solid ${msg.text.startsWith('ERROR') ? '#fcc' : '#cfc'}`, borderRadius: '4px', color: '#333', fontSize: '14px', lineHeight: '1.5' }}>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{msg.time}</div>
                                    <div>{msg.text}</div>
                                </div>
                            ))
                        )}
                    </div>
                    <button style={{ padding: '8px 16px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }} onClick={() => setNoticeModalOpen(false)}>关闭</button>
                </div>
            </div>
        );
    };

    return (
        <div className="admin-container">
            {/* Mobile Sidebar Overlay */}
            <div className={`overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

            <button className="mobile-toggle" onClick={() => setSidebarOpen(true)}><Icons.Menu /></button>
            <button className="mobile-toggle" style={{ right: '70px' }} onClick={() => setNoticeModalOpen(true)}><Icons.Bell /></button>

            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="admin-logo">CGBGEAR <span style={{ fontSize: '10px', background: '#00aa00', color: '#000', padding: '2px' }}>ADMIN</span></div>
                <nav className="sidebar-nav">
                    <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => { setActiveTab('home'); setSidebarOpen(false); setMessage('') }}>
                        <Icons.Home /> 首页
                    </div>
                    <div className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); setSidebarOpen(false); setMessage(''); navigate('/admin/users'); }}>
                        <Icons.Users /> 用户管理
                    </div>
                    <div className={`nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => { setActiveTab('products'); setSidebarOpen(false); setMessage(''); navigate('/admin/publish/products'); }}>
                        <Icons.Box /> 产品发布
                    </div>
                    <div className={`nav-item ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => { setActiveTab('announcements'); setSidebarOpen(false); setMessage(''); navigate('/admin/publish/announcements'); }}>
                        <Icons.Bell /> 公告系统
                    </div>
                    <div className="nav-item" onClick={() => { setSidebarOpen(false); navigate('/user-center'); }}>
                        <Icons.Home /> 返回前厅
                    </div>
                </nav>
            </aside>

            <main className="admin-content">
                {activeTab === 'home' && renderHome()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'products' && renderProducts()}
                {activeTab === 'announcements' && renderAnnouncements()}
            </main>
            
            {renderPriceModal()}
            {renderNoticeModal()}
        </div>
    );
};

export default AdminDashboard;
