// 修复
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import MainNav from '../components/MainNav';
import SiteFooter from '../components/SiteFooter';
import { fetchAnnouncementDates, fetchAnnouncementsByDateAndLang, markAnnouncementRead } from '../api/api';
import '../css/WebsiteNoticePage.css';

// =========================================================
// SVG 图标占位符 (请替换为你的实际 SVG 组件或导入)
// =========================================================
const ChevronLeftSVG = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-chevron-left"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const HomeSVG = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-home"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const PdfIconSVG = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="10" y2="9"></line></svg>;
const LinkIconSVG = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07L13 5.5"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07L11 18.5"></path></svg>;
const PinIconSVG = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 4h7v5h5v11H6V4z"></path></svg>; // 实心图钉
const FlagUS = () => <img src="https://flagcdn.com/us.svg" alt="English" className="flag-icon" />;
const FlagHK = () => <img src="https://flagcdn.com/hk.svg" alt="繁體粵語" className="flag-icon" />;
const FlagMO = () => <img src="https://flagcdn.com/mo.svg" alt="繁體粵語 (澳門)" className="flag-icon" />;
const TextCN = () => <span className="lang-text">简</span>; // Simplified Chinese (as default for backend)
const TextTW = () => <span className="lang-text">繁</span>; // Traditional Chinese

// TODO: 添加更多附件类型的 SVG 图标，例如：
const WordIconSVG = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="10" y2="9"></line></svg>;
const ExcelIconSVG = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M16 13L8 13M12 9V21"></path></svg>;
const ImageIconSVG = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const ZipIconSVG = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 17s-2-2-2-4 2-4 2-4V5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v4c0 2-2 4-2 4s-2 2-2 4"></path><line x1="12" y1="21" x2="12" y2="17"></line><line x1="12" y1="7" x2="12" y2="3"></line></svg>;
const DefaultFileIconSVG = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>;

const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <PdfIconSVG />;
    if (fileType.includes('word') || fileType.includes('officedocument.wordprocessingml')) return <WordIconSVG />;
    if (fileType.includes('excel') || fileType.includes('officedocument.spreadsheetml')) return <ExcelIconSVG />;
    if (fileType.includes('image')) return <ImageIconSVG />;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) return <ZipIconSVG />;
    return <DefaultFileIconSVG />;
};


// =========================================================
// 翻译字典 (根据需要扩展更多语言)
// =========================================================
const translations = {
    'zh-cn': {
        home: '首页', notice: '网站公告', back: '返回', feedback: '用户反馈',
        systemMaintenance: '系统维护', policyUpdate: '政策更新', newFeature: '新功能发布', versionUpdate: '版本更新', other: '其他公告',
        new: '新公告', ongoing: '进行中', inProgress: '进行中', ended: '已结束', recovered: '已恢复', fixing: '修复中', report: '原因报告',
        pinned: '置顶', noLinksDetected: '未检测到任何链接', termsOfService: '服务条款', downloadAttachment: '附件下载',
        impactScope: '影响范围', affectedServices: '受影响服务', affectedRegions: '受影响区域',
        noAnnouncements: '当前日期没有公告', readBy: '已读用户', showMore: '显示更多', showLess: '收起',
        langEN: 'English', langHK: '繁體粵語', langTW: '繁體中文', langCN: '简体中文',
        noAttachment: '未检测到任何附件',
        // Pin priority labels
        pinPriority1: '停机/升级', // For pin_priority = 1
        pinPriority2: '长期有效', // For pin_priority = 2
    },
    'en-us': {
        home: 'Home', notice: 'Website Notice', back: 'Back', feedback: 'User Feedback',
        systemMaintenance: 'System Maintenance', policyUpdate: 'Policy Update', newFeature: 'New Feature Release', versionUpdate: 'New Features', other: 'Other Announcements',
        new: 'New', ongoing: 'Ongoing', inProgress: 'In Progress', ended: 'Ended', recovered: 'Recovered', fixing: 'Fixing', report: 'Reason Report',
        pinned: 'Pinned', noLinksDetected: 'No links detected', termsOfService: 'Terms of Service', downloadAttachment: 'Download Attachment',
        impactScope: 'Impact Scope', affectedServices: 'Affected Services', affectedRegions: 'Affected Regions',
        noAnnouncements: 'No announcements for this date', readBy: 'Read by', showMore: 'Show More', showLess: 'Show Less',
        langEN: 'English', langHK: 'Traditional Cantonese', langTW: 'Traditional Chinese', langCN: 'Simplified Chinese',
        noAttachment: 'No attachments detected',
        pinPriority1: 'Downtime/Upgrade',
        pinPriority2: 'Long-term/Critical',
    },
    'zh-hk': { // 繁體粵語
        home: '首頁', notice: '網站公告', back: '返回', feedback: '用戶回饋',
        systemMaintenance: '系統維護', policyUpdate: '政策更新', newFeature: '新功能發佈', versionUpdate: '版本更新', other: '其他公告',
        new: '新公告', ongoing: '進行中', inProgress: '進行中', ended: '已結束', recovered: '已恢復', fixing: '修復中', report: '原因報告',
        pinned: '置頂', noLinksDetected: '未偵測到任何連結', termsOfService: '服務條款', downloadAttachment: '附件下載',
        impactScope: '影響範圍', affectedServices: '受影響服務', affectedRegions: '受影響區域',
        noAnnouncements: '當前日期沒有公告', readBy: '已讀用戶', showMore: '顯示更多', showLess: '收起',
        langEN: 'English', langHK: '繁體粵語', langTW: '繁體中文', langCN: '簡體中文',
        noAttachment: '未偵測到任何附件',
        pinPriority1: '停機/升級',
        pinPriority2: '長期有效',
    },
    'zh-tw': { // 繁體中文 (台湾)
        home: '首頁', notice: '網站公告', back: '返回', feedback: '用戶回饋',
        systemMaintenance: '系統維護', policyUpdate: '政策更新', newFeature: '新功能發布', versionUpdate: '版本更新', other: '其他公告',
        new: '新公告', ongoing: '進行中', inProgress: '進行中', ended: '已結束', recovered: '已恢復', fixing: '修復中', report: '原因報告',
        pinned: '置頂', noLinksDetected: '未偵測到任何連結', termsOfService: '服務條款', downloadAttachment: '附件下載',
        impactScope: '影響範圍', affectedServices: '受影響服務', affectedRegions: '受影響區域',
        noAnnouncements: '當前日期沒有公告', readBy: '已讀用戶', showMore: '顯示更多', showLess: '收起',
        langEN: 'English', langHK: '繁體粵語', langTW: '繁體中文', langCN: '簡體中文',
        noAttachment: '未偵測到任何附件',
        pinPriority1: '停機/升級',
        pinPriority2: '長期有效',
    }
};

const getTranslation = (key, lang) => {
    // 优先使用指定语言，其次尝试 fallback 语言，最后默认简体中文
    return translations[lang]?.[key] || translations['zh-hk']?.[key] || translations['en-us']?.[key] || translations['zh-cn'][key] || key;
};

// =========================================================
// 附件卡片组件
// =========================================================
const AttachmentCard = ({ attachment, lang }) => {
    const fileSizeUnits = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = attachment.file_size;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < fileSizeUnits.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    const displaySize = `${size.toFixed(1)}${fileSizeUnits[unitIndex]}`;

    // 根据文件大小等级显示实心圆点
    const dots = Array.from({ length: Math.min(unitIndex + 1, 4) }).map((_, i) => (
        <span key={i} className={`size-dot level-${i + 1}`}></span>
    ));

    const isPdf = attachment.file_type.includes('pdf');
    const cardClass = `attachment-card ${isPdf ? 'pdf-type' : ''}`;

    return (
        <a href={attachment.file_url} target="_blank" rel="noopener noreferrer" className={cardClass}>
            <div className="attachment-icon">
                {getFileIcon(attachment.file_type)}
            </div>
            <div className="attachment-info">
                <div className="attachment-filename">{attachment.filename}</div>
                <div className="attachment-size">
                    {displaySize} {dots}
                </div>
            </div>
            <span className="download-text">{getTranslation('downloadAttachment', lang)}</span>
        </a>
    );
};

// =========================================================
// 链接卡片组件
// =========================================================
const LinkCard = ({ link, lang }) => {
    const isTerms = link.is_terms_of_service;
    const linkText = isTerms ? getTranslation('termsOfService', lang) : (link.link_text || link.url); // 优先使用后端提供的link_text

    return (
        <a href={link.url} target="_blank" rel="noopener noreferrer" className="link-card">
            <LinkIconSVG />
            <span className="link-text">{linkText}</span>
            {isTerms && <span className="terms-tag">{getTranslation('termsOfService', lang)}</span>}
        </a>
    );
};

// =========================================================
// 影响范围表格组件
// =========================================================
const ImpactScopeTable = ({ impactScope, lang }) => {
    if (!impactScope || !Array.isArray(impactScope) || impactScope.length === 0) return null;

    return (
        <div className="impact-scope-table">
            <h4>{getTranslation('impactScope', lang)}</h4>
            <table>
                <thead>
                    <tr>
                        <th>{getTranslation('affectedServices', lang)}</th>
                        <th>{getTranslation('affectedRegions', lang)}</th>
                    </tr>
                </thead>
                <tbody>
                    {impactScope.map((item, index) => (
                        <tr key={index}>
                            <td>{item.service || '-'}</td>
                            <td>{item.region || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


// =========================================================
// WebsiteNoticePage 主组件
// =========================================================
const WebsiteNoticePage = () => {
    const [navSolid, setNavSolid] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [timelineDates, setTimelineDates] = useState([]); // 格式: ['YYYY-MM-DD', ...]
    const [selectedDate, setSelectedDate] = useState(null); // YYYY-MM-DD
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const markedRef = useRef(new Set()); // 记录已上报为已读的公告ID，避免重复提交

    // 语言状态和逻辑
    const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem('lang') || 'zh-cn');
    const mailtoEmail = "your_feedback_email@example.com"; // 【请替换为你的实际邮箱地址】

    const handleScroll = useCallback(() => {
        setNavSolid(window.scrollY > 0);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // --- 调试日志 ---
    console.log("-----------------------");
    console.log("WebsiteNoticePage rendered.");
    console.log("Current selectedDate (render):", selectedDate);
    console.log("Current timelineDates (render):", timelineDates);
    console.log("-----------------------");
    // --- 调试日志 ---


    // 获取时间轴日期 (只在组件挂载时运行一次)
    useEffect(() => {
        console.log("-> useEffect: getTimelineDates triggered (initial fetch).");
        const getTimelineDates = async () => {
            try {
                const responseData = await fetchAnnouncementDates();
                console.log("   API Response for /announcement/dates:", responseData);
                if (responseData.code === 200 && responseData.data?.dates) { // 检查 code 和 data.dates
                    const dates = responseData.data.dates;
                    setTimelineDates(dates);
                    if (dates.length > 0) { // 如果有日期，设置 selectedDate 为第一个日期
                        console.log("   Setting selectedDate to (from dates[0]):", dates[0]);
                        setSelectedDate(dates[0]);
                    } else {
                        console.log("   No dates returned, selectedDate remains null.");
                    }
                } else {
                    console.error("   Failed to fetch timeline dates (API reported failure):", responseData.msg);
                    setError(responseData.msg || "Failed to fetch announcement dates due to API error.");
                }
            } catch (err) {
                console.error("   Failed to fetch timeline dates (network error):", err);
                setError("Failed to fetch announcement dates.");
            }
        };
        getTimelineDates();
    }, []); // <--- 修改为 []，确保只在组件挂载时运行一次

    // 根据选定日期和语言获取公告 (当 selectedDate 或 currentLanguage 改变时运行)
    useEffect(() => {
        console.log("-> useEffect: getAnnouncements triggered.");
        console.log("   selectedDate in getAnnouncements useEffect:", selectedDate);

        if (!selectedDate) { // 如果 selectedDate 为 null，则不发送请求
            console.log("   selectedDate is null, skipping announcement fetch.");
            setAnnouncements([]);
            setIsLoading(false);
            return;
        }
        console.log("   selectedDate is NOT null, proceeding to fetch announcements.");

        setIsLoading(true);
        setError(null);
        const getAnnouncements = async () => {
            try {
                // 这个 API 调用会使用当前 selectedDate 的值
                const responseData = await fetchAnnouncementsByDateAndLang(selectedDate, currentLanguage, 100);
                console.log("   API Response for /announcement with date:", selectedDate, responseData);
                if (responseData.code === 200 && responseData.data?.announcements) { // 检查 code 和 data.announcements
                    setAnnouncements(responseData.data.announcements);
                } else {
                    console.error("   Failed to fetch announcements (API reported failure):", responseData.msg);
                    setError(responseData.msg || "Failed to fetch announcements for the selected date due to API error.");
                }
            } catch (err) {
                console.error("   Failed to fetch announcements (network error):", err);
                setError("Failed to fetch announcements for the selected date.");
            } finally {
                setIsLoading(false);
            }
        };
        getAnnouncements();
    }, [selectedDate, currentLanguage]); // 依赖项不变，当 selectedDate 或 currentLanguage 改变时触发

    // 当拉取到公告后，如果用户已登录，逐条上报为已读（每个公告只提交一次）
    useEffect(() => {
        if (!user || !user.is_logged_in) return;
        const toMark = announcements
            .map(a => a.id)
            .filter(id => !markedRef.current.has(id));

        if (toMark.length === 0) return;

        // 逐条提交，失败忽略（不影响页面展示）
        toMark.forEach(async (annId) => {
            try {
                const res = await markAnnouncementRead(annId);
                markedRef.current.add(annId);

                // 前端乐观更新：把当前用户头像加入到 read_by_users（最多5个），并更新计数
                setAnnouncements(prev => prev.map(a => {
                    if (a.id !== annId) return a;
                    const alreadyIn = Array.isArray(a.read_by_users) && a.read_by_users.some(u => u.uid === user.uid);
                    const updatedList = Array.isArray(a.read_by_users) ? [...a.read_by_users] : [];
                    if (!alreadyIn) {
                        updatedList.unshift({ uid: user.uid, name: user.username || user.display_name || 'Me', avatar_url: user.avatar_url });
                    }
                    const trimmed = updatedList.slice(0, 5);
                    return {
                        ...a,
                        read_by_users: trimmed,
                        read_count: typeof a.read_count === 'number' ? (alreadyIn ? a.read_count : a.read_count + 1) : (res?.data?.read_count ?? a.read_count)
                    };
                }));
            } catch (e) {
                // 静默失败即可
                console.warn('markAnnouncementRead failed:', e?.message || e);
            }
        });
    }, [announcements, user]);

    const handleLanguageChange = (lang) => {
        setCurrentLanguage(lang);
        localStorage.setItem('lang', lang); // 将语言偏好存储到 localStorage
    };

    // 确定繁体粤语的旗帜（香港/澳门）
    const getCantoneseFlag = () => {
        const today = new Date();
        const month = today.getMonth() + 1; // 1-based
        const day = today.getDate();
        if (month === 12 && day === 20) { // 澳门回归纪念日
            return <FlagMO />;
        }
        return <FlagHK />;
    };

    // 获取当前选定语言的图标和名称
    const getSelectedLanguageDisplay = () => {
        switch (currentLanguage) {
            case 'zh-cn': return <><TextCN /> {getTranslation('langCN', currentLanguage)}</>;
            case 'zh-hk': return <>{getCantoneseFlag()} {getTranslation('langHK', currentLanguage)}</>;
            case 'zh-tw': return <><TextTW /> {getTranslation('langTW', currentLanguage)}</>;
            case 'en-us': return <><FlagUS /> {getTranslation('langEN', currentLanguage)}</>;
            default: return <><TextCN /> {getTranslation('langCN', currentLanguage)}</>;
        }
    };

    // 获取公告状态的本地化标签
    const getStatusLabel = (statusKey) => {
        return getTranslation(statusKey, currentLanguage);
    };

    // 将公告按类别分组以便渲染
    const categorizedAnnouncements = useMemo(() => {
        // 定义类别显示顺序
        const categoryOrder = [
            'systemMaintenance', 'policyUpdate', 'newFeature', 'versionUpdate', 'other'
        ];

        const categories = {};
        // 初始化所有类别为空数组，确保顺序
        categoryOrder.forEach(key => categories[key] = []);

        announcements.forEach(ann => {
            // 将后端传来的 snake_case 转换为 camelCase 以匹配翻译键
            const categoryKey = ann.category.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            if (categories[categoryKey]) {
                categories[categoryKey].push(ann);
            } else {
                // 如果后端返回了新的未知类别，也添加到末尾
                if (!categories[categoryKey]) categories[categoryKey] = [];
                categories[categoryKey].push(ann);
            }
        });

        // 按照预设顺序返回类别，新加的类别会排在 'other' 之后
        const sortedCategoryKeys = Array.from(new Set([...categoryOrder, ...Object.keys(categories)]));
        const sortedCategories = {};
        sortedCategoryKeys.forEach(key => {
            if (categories[key]) {
                sortedCategories[key] = categories[key];
            }
        });

        return sortedCategories;
    }, [announcements]);

    return (
        <div className="page website-notice-page">
            {/* <MainNav navSolid={true} /> */}
            <div className="notice-hero">
                <div className="notice-hero-inner"> {/* 修改此处的 padding */}
                    <div className="breadcrumb">
                        <HomeSVG /><span onClick={() => navigate('/')}>{getTranslation('home', currentLanguage)}</span> &gt;
                        <span>{getTranslation('notice', currentLanguage)}</span>
                    </div>
                    <button onClick={() => navigate(-1)} className="back-button">
                        <ChevronLeftSVG /> {getTranslation('back', currentLanguage)}
                    </button>
                    <h1>{getTranslation('notice', currentLanguage)}</h1>
                </div>
            </div>

            <div className="notice-container main-wrapper">
                <div className="notice-header">
                    {/* 修改language-switcher,不要使用原生的select,而是根据main.css里的配色,重新写一个下拉框,option里的value,就是切换语言的值,所切换的语言数据都在当前页面的最顶上也不准修改！选项就是使用{getTranslation('langCN', 'zh-cn')}（例如简体中文） */}
                    <LanguageSwitcher
                        currentLanguage={currentLanguage}
                        onChange={handleLanguageChange}
                        getTranslation={getTranslation}
                        getCantoneseFlag={getCantoneseFlag}
                    />
                    <a href={`mailto:${mailtoEmail}`} className="feedback-button">
                        {getTranslation('feedback', currentLanguage)}
                    </a>
                </div>

                <div className="notice-layout">
                    <div className="timeline-column">
                        <div className="timeline">
                            {timelineDates.length > 0 ? timelineDates.map((dateString, index) => {
                                const date = new Date(dateString + 'T00:00:00Z'); // Ensure UTC parsing
                                const isCurrent = dateString === selectedDate;
                                // 检查当前日期是否有公告 (这里 ann.publish_date 应该是 YYYY-MM-DD HH:MM:SS 格式)
                                // 所以只需要匹配日期部分
                                const hasAnnouncementsForDate = announcements.some(ann => ann.publish_date?.startsWith(dateString));

                                return (
                                    <div
                                        key={dateString}
                                        className={`timeline-item ${isCurrent ? 'active' : ''} ${hasAnnouncementsForDate ? 'has-announcements' : ''}`}
                                        onClick={() => setSelectedDate(dateString)}
                                    >
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-date">
                                            <span>{date.getFullYear()}</span>
                                            <span>{date.getMonth() + 1}/{date.getDate()}</span>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="no-timeline-dates">{getTranslation('noAnnouncements', currentLanguage)}</div>
                            )}
                        </div>
                    </div>
                    <div className="content-column">
                        {isLoading ? (
                            <div className="loading-message">Loading announcements...</div>
                        ) : error ? (
                            <div className="error-message">{error}</div>
                        ) : announcements.length === 0 ? (
                            <div className="no-announcements-message">{getTranslation('noAnnouncements', currentLanguage)}</div>
                        ) : (
                            <>
                                {Object.keys(categorizedAnnouncements).map(categoryKey => {
                                    const categoryName = getTranslation(categoryKey, currentLanguage);
                                    const categoryAnnouncements = categorizedAnnouncements[categoryKey];

                                    if (categoryAnnouncements.length === 0) return null;

                                    return (
                                        <div key={categoryKey} className="announcement-category">
                                            <h2>{categoryName}</h2>
                                            {categoryAnnouncements.map(ann => {
                                                const pinLabel = ann.is_pinned && ann.pin_priority === 1
                                                    ? getTranslation('pinPriority1', currentLanguage)
                                                    : ann.is_pinned && ann.pin_priority === 2
                                                        ? getTranslation('pinPriority2', currentLanguage)
                                                        : null;

                                                return (
                                                    <div key={ann.id} className={`announcement-card ${ann.is_pinned ? 'pinned' : ''}`}>
                                                        <div className="announcement-header">
                                                            <h3>
                                                                {ann.is_pinned && <PinIconSVG className="pinned-icon" />}
                                                                <span className={`status-tag status-${ann.status}`}>{getStatusLabel(ann.status)}</span>
                                                                {pinLabel && <span className="pin-label">{pinLabel}</span>} {/* 新增的优先级标签 */}
                                                                {ann.title}
                                                            </h3>
                                                            <span className="publish-date">
                                                                {ann.publish_date ? new Date(ann.publish_date).toLocaleDateString(currentLanguage, { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''}
                                                            </span>
                                                        </div>
                                                        <div className="announcement-content" dangerouslySetInnerHTML={{ __html: ann.content }}></div>

                                                        {ann.impact_scope && (ann.category === 'system_maintenance' || ann.category === 'version_update') && (
                                                            <ImpactScopeTable impactScope={ann.impact_scope} lang={currentLanguage} />
                                                        )}

                                                        <div className="announcement-links-attachments">
                                                            {ann.links && ann.links.length > 0 ? (
                                                                ann.links.map(link => <LinkCard key={link.id} link={link} lang={currentLanguage} />)
                                                            ) : (
                                                                <div className="no-item-placeholder link-placeholder">{getTranslation('noLinksDetected', currentLanguage)}</div>
                                                            )}

                                                            {ann.attachments && ann.attachments.length > 0 ? (
                                                                ann.attachments.map(att => <AttachmentCard key={att.id} attachment={att} lang={currentLanguage} />)
                                                            ) : (
                                                                <div className="no-item-placeholder attachment-placeholder">{getTranslation('noAttachment', currentLanguage)}</div>
                                                            )}
                                                        </div>

                                                        {/* 这里需要正确实现，可能需要先在app.py里面写一个接口，在提供一个Mysql数据表的语句，用来记录，再进行渲染用户头像ID */}
                                                        {/* 【预留位置】用于展示用户已读头像 */}
                                                        <div className="read-by-section">
                                                            <span>{getTranslation('readBy', currentLanguage)}:</span>
                                                            <div className="read-avatars">
                                                                {/* 示例头像占位符，这里应该渲染实际用户头像 */}

                                                                {ann.read_by_users && ann.read_by_users.slice(0, 5).map(user => (
                                                                    <img key={user.uid} src={user.avatar_url} alt={user.name} className="read-avatar" title={user.name} />
                                                                ))}
                                                                {/* 如果有更多用户，可以显示一个计数 */}
                                                                {ann.read_by_users && ann.read_by_users.length > 5 && (
                                                                    <div className="read-avatar-count">+{ann.read_by_users.length - 5}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>
            </div>
            <SiteFooter />
        </div>
    );
};

export default WebsiteNoticePage;

// 自定义下拉：language-switcher（替代原生 select），保持与 main.css 视觉一致
const LanguageSwitcher = ({ currentLanguage, onChange, getTranslation, getCantoneseFlag }) => {
    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState(null);

    const LANGS = [
        { value: 'zh-cn', label: getTranslation('langCN', 'zh-cn'), render: () => (<><TextCN /> {getTranslation('langCN', 'zh-cn')}</>) },
        { value: 'zh-hk', label: getTranslation('langHK', 'zh-hk'), render: () => (<>{getCantoneseFlag()} {getTranslation('langHK', 'zh-hk')}</>) },
        { value: 'zh-tw', label: getTranslation('langTW', 'zh-tw'), render: () => (<><TextTW /> {getTranslation('langTW', 'zh-tw')}</>) },
        { value: 'en-us', label: getTranslation('langEN', 'en-us'), render: () => (<><FlagUS /> {getTranslation('langEN', 'en-us')}</>) },
    ];

    const selected = LANGS.find(l => l.value === currentLanguage) || LANGS[0];

    useEffect(() => {
        const onDocClick = (e) => {
            // 关闭下拉（简单实现：任意外部点击时关闭）
            if (!e.target.closest('.language-switcher')) setOpen(false);
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, []);

    // 内联样式（与 main.css 配色一致）
    const styles = {
        container: { position: 'relative' },
        trigger: {
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid #444', color: '#e0e0e0',
            padding: '6px 10px', borderRadius: 6,
            fontSize: 13, lineHeight: 1.2, cursor: 'pointer',
            outline: 'none', userSelect: 'none',
            transition: 'background 0.2s, border-color 0.2s, color 0.2s'
        },
        selected: { display: 'flex', alignItems: 'center', gap: 8 },
        caret: { marginLeft: 8, opacity: 0.7, fontSize: 12 },
        dropdown: {
            position: 'absolute', top: '100%', left: 0, minWidth: 180,
            background: '#000000', border: '1px solid #333',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)', borderRadius: 6,
            marginTop: 6, zIndex: 10, overflow: 'hidden'
        },
        option: (isActive, isHovered) => ({
            padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8,
            color: isActive ? '#22c55e' : '#e0e0e0',
            background: isHovered || isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
            cursor: 'pointer',
            borderBottom: '1px solid rgba(255,255,255,0.04)'
        })
    };

    return (
        <div className="language-switcher" style={styles.container}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                style={styles.trigger}
            >
                <span style={styles.selected}>{selected.render()}</span>
                <span aria-hidden style={styles.caret}>▾</span>
            </button>
            {open && (
                <div role="listbox" style={styles.dropdown}>
                    {LANGS.map(opt => {
                        const isActive = opt.value === currentLanguage;
                        const isHovered = hovered === opt.value;
                        return (
                            <div
                                key={opt.value}
                                role="option"
                                aria-selected={isActive}
                                style={styles.option(isActive, isHovered)}
                                onMouseEnter={() => setHovered(opt.value)}
                                onMouseLeave={() => setHovered(null)}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                            >
                                {opt.render()}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
