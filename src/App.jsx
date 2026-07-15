import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import TopProgressBar from './components/TopProgressBar';
import LoadingSpinner from './components/LoadingSpinner';

// 1. 引入 Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { NoticeProvider } from './context/NoticeContext.jsx';

// 2. 引入组件
import NewYearCountdown from './components/NewYearCountdown';


// Lazy imports
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const ProductPage = lazy(() => import('./pages/ProductsPage.jsx'));
const PremiumPlayersPage = lazy(() => import('./pages/PremiumPlayersPage.jsx'));
const PlayerProfilePage = lazy(() => import('./pages/PlayerProfilePage.jsx'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage.jsx'));
const TerminalLoginPage = lazy(() => import('./pages/TerminalLoginPage.jsx'));
const ForumPage = lazy(() => import('./pages/ForumPage.jsx'));
const ComingSoonPage = lazy(() => import('./pages/ComingSoonPage.jsx'));
const ForumCategoryPage = lazy(() => import('./pages/ForumCategoryPage'));
const NewPostPage = lazy(() => import('./pages/NewPostPage.jsx'));
const UserCenterPage = lazy(() => import('./pages/UserCenterPage.jsx'));
const ThreadPage = lazy(() => import('./pages/ThreadPage.jsx'));
const WebsiteNoticePage = lazy(() => import('./pages/WebsiteNoticePage.jsx'));
const TradeDetailPage = lazy(() => import('./pages/TradeDetailPage.jsx'));
const TradePage = lazy(() => import('./pages/TradePage.jsx'));
const CreateTradePage = lazy(() => import('./pages/CreateTradePage.jsx'));
const PolicyPage = lazy(() => import('./pages/PolicyPage.jsx'));

// *** 引入政策更新守卫组件 ***
const PolicyUpdateGuard = lazy(() => import('./components/PolicyUpdateGuard'));

// 手机端页面组件
const MobileLoginPage = lazy(() => import('./pages/MobileLoginPage.jsx'));
const MobileNewPostPage = lazy(() => import('./pages/MobileNewPostPage.jsx'));
const  MobileHomePage = lazy(() => import('./pages/MobileHomePage.jsx'));
const MobileForumPage = lazy(() => import('./pages/MobileForumPage.jsx'));
const MobileThreadPage = lazy(() => import('./pages/MobileThreadPage.jsx'));
const MobileSearchResultPage = lazy(() => import('./pages/MobileSearchResultPage.jsx'));


const RedPacketRain = lazy(() => import('./components/activity/RedPacketRain'));

// *** 管理员组件 ***
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));



const DELAY_THRESHOLD = 300;
const MIN_SPINNER_DISPLAY_TIME = 400;
const MOBILE_BREAKPOINT = 768;

// --- 倒计时包装组件 ---
const CountdownWrapper = () => {
  const { user } = useAuth();
  return <NewYearCountdown currentUser={user} />;
};

// --- 路由内容包装组件 ---
const AppRoutes = ({ isMobile }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. 正在检查登录状态时，显示加载中
  if (loading) {
    return <LoadingSpinner />;
  }

  // --- 白名单判断逻辑 ---
  const isPublicPolicyPage = location.pathname.startsWith('/policies/');
  const isLoginPage = location.pathname.startsWith('/terminal/');
  const isHomePage = location.pathname === '/';

  // 2. 手机端强制登录拦截逻辑
  // 如果是手机端 且 用户未登录 
  // 且 当前访问的【不是】政策页面、首页、登录页
  if (isMobile && (!user || !user.is_logged_in) && !isPublicPolicyPage && !isLoginPage && !isHomePage) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <MobileLoginPage />
      </Suspense>
    );
  }

  // 3. 正常路由渲染
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* 首页 */}
        <Route path="/" element={isMobile ? <MobileHomePage />:<HomePage />} />

        {/* 登录/注册 */}
        <Route path="/terminal/login" element={isMobile ? <MobileLoginPage /> : <TerminalLoginPage />} />
        <Route path="/terminal/register" element={isMobile ? <MobileLoginPage /> : <TerminalLoginPage />} />

        {/* 业务路由 */}
        <Route path="/forum" element={isMobile ? <MobileForumPage /> : <ForumPage />} />
        <Route path="/forum/:categorySlug/:subCategorySlug" element={<ForumCategoryPage />} />
        <Route path="/forum/:categorySlug" element={<ForumCategoryPage />} />
        <Route
          path="/forum/:categorySlug/:subCategorySlug/new-post"
          element={isMobile ? <MobileNewPostPage /> : <NewPostPage />}
        />
        <Route
          path="/forum/new-post"
          element={isMobile ? <MobileNewPostPage /> : <NewPostPage />}
        />

        <Route path="/user-center" element={<UserCenterPage />} />
        <Route path="/benefitss" element={<ComingSoonPage />} />
        <Route path="/qa" element={<ComingSoonPage />} />
        <Route path='/trade1' element={<ComingSoonPage />} />

        <Route path="/trade" element={<TradePage />} />
        <Route path="/trade/:shareCode" element={<TradeDetailPage />} />
        <Route path="/trade/create" element={<CreateTradePage />} />

        <Route path="/product" element={<ProductPage />} />
        <Route path="/premium-players" element={<PremiumPlayersPage />} />
        <Route path="/player-profile" element={<PlayerProfilePage />} />
        <Route path="/search" element={isMobile ? <MobileSearchResultPage /> : <SearchResultsPage />} />
        <Route path="/thread/:threadId" element={isMobile ? <MobileThreadPage /> : <ThreadPage />} />
        <Route path="/notice" element={<WebsiteNoticePage />} />

        {/* 政策路由 */}
        <Route path="/policies/:type" element={<PolicyPage />} />

        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminDashboard />} />
        <Route path="/admin/publish/products" element={<AdminDashboard />} />
        <Route path="/admin/publish/announcements" element={<AdminDashboard />} />
      </Routes>
    </Suspense>
  );
};


function App() {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [showFullSpinner, setShowFullSpinner] = useState(false);
  const [navigationStartTime, setNavigationStartTime] = useState(null);

  // 响应式状态
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 导航进度条逻辑
  useEffect(() => {
    setIsNavigating(true);
    setShowFullSpinner(false);
    setNavigationStartTime(Date.now());

    const spinnerDelayTimer = setTimeout(() => {
      if (isNavigating) {
        setShowFullSpinner(true);
      }
    }, DELAY_THRESHOLD);

    return () => {
      clearTimeout(spinnerDelayTimer);
      setIsNavigating(false);
      setShowFullSpinner(false);
      setNavigationStartTime(null);
    };
  }, [location.pathname]);

  // 结束导航加载逻辑
  useEffect(() => {
    if (isNavigating && navigationStartTime) {
      const finishTime = Date.now();
      const actualLoadDuration = finishTime - navigationStartTime;
      const remainingSpinnerTime = showFullSpinner ? Math.max(0, MIN_SPINNER_DISPLAY_TIME - actualLoadDuration) : 0;

      const finishNavigationTimeout = setTimeout(() => {
        setIsNavigating(false);
        setShowFullSpinner(false);
      }, remainingSpinnerTime);

      return () => clearTimeout(finishNavigationTimeout);
    }
  }, [location.pathname, isNavigating, showFullSpinner, navigationStartTime]);


  return (
    <div className="app-root">
      <TopProgressBar isActive={isNavigating} />
      {showFullSpinner && <LoadingSpinner />}

      <main>
        {/* NoticeProvider 在最外层 */}
        <NoticeProvider>
          {/* AuthProvider 包裹内部逻辑 */}
          <AuthProvider>

            {/* 倒计时组件放在 Provider 内部 */}
            {/* <CountdownWrapper /> */}

            {/* 
              *** 核心修改 *** 
              在此处加入政策更新守卫。
              它位于 Router 和 AuthProvider 内部，可以访问 location 和 localStorage。
              如果用户已登录但协议版本过旧，全屏弹窗会覆盖在 AppRoutes 之上。
              使用 Suspense 包装以支持懒加载，fallback 为 null 避免页面初次加载闪烁。
            */}
            <Suspense fallback={null}>
              <PolicyUpdateGuard />
            </Suspense>

            {/* ======================================================== */}
            {/* [新增] 2. 全局挂载红包雨组件 */}
            {/* 放在这里，它就会覆盖在所有页面之上，全站监控时间 */}
            {/* <Suspense fallback={null}>
              <RedPacketRain />
            </Suspense> */}
            {/* ======================================================== */}

            {/* 路由逻辑 */}
            <AppRoutes isMobile={isMobile} />

          </AuthProvider>
        </NoticeProvider>
      </main>
    </div>
  );
}

export default App;
