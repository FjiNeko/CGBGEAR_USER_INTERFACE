// src/api/api.js
import axios from 'axios';

// 后端 API 的基础 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-test.cgbgear.cn/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 关键：允许跨域携带 Cookie
});

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized: Session expired or invalid.');
      localStorage.removeItem('cgb_user_info');
      window.dispatchEvent(new Event('cgbgear-logout'));
      if (!window.location.pathname.includes('/terminal/login')) {
        window.location.href = `/terminal/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    return Promise.reject(error);
  }
);

// --- 认证相关 API ---

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/cgbregister', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '注册失败，请稍后再试';
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/cgblogin`, credentials, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.msg || "登录失败");
    }
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const response = await api.post('/cgblogout');
    localStorage.removeItem('cgb_user_info');
    window.dispatchEvent(new Event('cgbgear-logout'));
    return response.data;
  } catch (error) {
    console.error('登出异常:', error);
    localStorage.removeItem('cgb_user_info');
    window.dispatchEvent(new Event('cgbgear-logout'));
    return { success: true };
  }
};

const GUEST_USER = {
  is_logged_in: false,
  uid: null,
  username: "游客",
  email: null,
  role: "guest",
  avatar: null
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/user/me');
    if (response.data.code === 200 && response.data.data) {
      const userInfo = response.data.data;
      if (userInfo.is_logged_in) {
        localStorage.setItem('cgb_user_info', JSON.stringify(userInfo));
        return userInfo;
      }
    }
    localStorage.removeItem('cgb_user_info');
    return GUEST_USER;
  } catch (error) {
    console.warn('Failed to fetch user info, treating as guest:', error.message);
    localStorage.removeItem('cgb_user_info');
    return GUEST_USER;
  }
};

export const generateCaptcha = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/captcha/generate`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error generating captcha:", error);
    throw error;
  }
};

// --- 忘记密码 / 重置密码 API ---
export const requestPasswordReset = async ({ email, captcha_id, captcha_value }) => {
  try {
    const payload = {
      action: 'request',
      email,
      captcha_id,
      captcha_value,
    };
    const response = await api.post('/cgbpassword_forget', payload);
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.msg || '请求失败，请稍后重试';
    throw new Error(msg);
  }
};

export const resetPasswordWithToken = async ({ reset_token, new_password, confirm_password }) => {
  try {
    const payload = {
      action: 'reset',
      reset_token,
      new_password,
      confirm_password,
    };
    const response = await api.post('/cgbpassword_forget', payload);
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.msg || '重置失败，请稍后重试';
    throw new Error(msg);
  }
};

// --- 论坛接口 ---

export const getForumModules = async () => {
  try {
    const response = await api.get('/forum/modules');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '获取版块列表失败';
  }
};

export const createForumPost = async (postData) => {
  try {
    const payload = {
      title: postData.threadTitle,
      content: postData.content,
      subsection_id: postData.subsection_id,
    };
    const response = await api.post('/forum/thread', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '发布帖子失败';
  }
};

export const getForumPosts = async (params = {}) => {
  try {
    const response = await api.get('/forum/posts', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '获取帖子列表失败';
  }
};

export const getPostReplies = async (postId, params = {}) => {
  try {
    const response = await api.get(`/forum/post/${postId}/replies`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '获取回复列表失败';
  }
};

// --- 用户中心相关 API ---

export const getUserProfile = async () => {
  try {
    const response = await api.get('/user/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '获取个人信息失败';
  }
};

export const getUserAllPosts = async (params = {}) => {
  try {
    const response = await api.get('/user/posts', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '获取用户帖子失败';
  }
};

export const getUserAllActivities = async (params = {}) => {
  try {
    const response = await api.get('/user/activities', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '获取动态失败';
  }
};

export const getUserAllBadges = async (params = {}) => {
  try {
    const response = await api.get('/user/badges', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '获取徽章失败';
  }
};

export const updateUserNickname = async (newNickname) => {
  try {
    const response = await api.put('/user/update_nickname', { display_name: newNickname });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '修改显示名失败';
  }
};

// [新增] 更新用户个性化设置 (颜色、称号)
// data 格式: { action: 'update_color' | 'update_title', color?: string, title_id?: number }
export const updateProfileCustomization = async (data) => {
  try {
    const response = await api.put('/user/profile/customization', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '更新个性化设置失败';
  }
};

export const getPostDetailForEdit = async (postId) => {
  try {
    const response = await api.get(`/forum/thread/${postId}/edit`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '获取帖子编辑内容失败';
  }
};

export const updateForumPost = async (postId, postData) => {
  try {
    const payload = {
      title: postData.threadTitle,
      content: postData.content,
      subsection_id: postData.subsection_id,
    };
    const response = await api.put(`/forum/thread/${postId}`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '更新帖子失败';
  }
};

export const deleteForumPost = async (postId) => {
  try {
    const response = await api.delete(`/forum/thread/${postId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '删除帖子失败';
  }
};

// --- 用户交互相关 API ---

export const unlikePost = async (postId) => {
  try {
    const response = await api.delete(`/forum/post/${postId}/like`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '取消点赞帖子失败';
  }
};

export const likePost = async (postId) => {
  try {
    const response = await api.post(`/forum/post/${postId}/like`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '点赞帖子失败';
  }
};

export const likeReply = async (replyId) => {
  try {
    const response = await api.post(`/forum/reply/${replyId}/like`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '点赞回复失败';
  }
};

export const createReply = async (postId, content) => {
  try {
    const response = await api.post(`/forum/post/${postId}/reply`, { content });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '回复失败';
  }
};

export const getThreadDetail = async (postId) => {
  try {
    const response = await api.get(`/forum/thread/${postId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '获取帖子详情失败';
  }
};

// --- 首页相关 API ---
export const getHomeStats = async () => {
  try {
    const response = await api.get('/home/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '获取首页统计数据失败'
  }
};

// --- 产品相关 API ---
export const getProducts = async () => {
  try {
    const response = await api.get('/products');
    return response.data;
  } catch (error) {
    console.error('API call error (getProducts):', error);
    if (error.response) {
      throw new Error(error.response.data.message || `请求失败，状态码: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('网络请求失败，请检查您的网络连接或服务器是否运行。');
    } else {
      throw new Error(`发生未知错误: ${error.message}`);
    }
  }
};

// --- 管理员相关 API ---

export const getAdminDashboard = async () => {
  try {
    const response = await api.get('/admin/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '加载管理面板失败';
  }
};

export const generateMissingDefaultAvatars = async () => {
  try {
    const response = await api.post('/admin/generate_missing_default_avatars');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '生成缺失默认头像失败';
  }
};

// [新增] 管理员发放首发权益包
export const grantSupporterBenefits = async (targetUid) => {
  try {
    const response = await api.post('/admin/grant_supporter_benefits', { target_uid: targetUid });
    return response.data;
  } catch (error) {
     throw error.response?.data?.message || '发放权益失败';
  }
};


// [新增] 获取用户列表 (Admin)
export const getAdminUsers = async (role = 'user', page = 1, limit = 20) => {
  try {
    const response = await api.get('/admin/get_users', {
      params: { role, page, limit }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '获取用户列表失败';
  }
};

// [新增] 发布产品 (Admin)
export const publishProduct = async (productData) => {
  try {
    const response = await api.post('/admin/publish_product', productData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '发布产品失败';
  }
};

// [新增] 发布公告 (Admin)
export const publishAnnouncement = async (announcementData) => {
  try {
    const response = await api.post('/admin/publish_announcement', announcementData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '发布公告失败';
  }
};

// [新增] 设置用户身份 (Admin)
export const setUserRole = async (uid, role) => {
  try {
    const response = await api.post('/admin/set_user_role', { uid, role });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '设置用户身份失败';
  }
};

// [新增] 封禁用户 (Admin)
export const banUser = async (uid, duration) => {
  try {
    const response = await api.post('/admin/ban_user', { uid, duration });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '封禁用户失败';
  }
};

// [新增] 删除用户 (Admin)
export const deleteUser = async (uid) => {
  try {
    const response = await api.delete(`/admin/user/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '删除用户失败';
  }
};

// [新增] 重置用户昵称 (Admin)
export const resetUserNickname = async (uid, newNickname) => {
  try {
    const response = await api.post('/admin/reset_nickname', { uid, new_nickname: newNickname });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '重置昵称失败';
  }
};

// [新增] 更新产品 (Admin)
export const updateProduct = async (productId, productData) => {
  try {
    const response = await api.put(`/admin/product/${productId}`, productData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '更新产品失败';
  }
};

// [新增] 删除产品 (Admin)
export const deleteProduct = async (productId) => {
  try {
    const response = await api.delete(`/admin/product/${productId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '删除产品失败';
  }
};

// [新增] 切换产品显示状态 (Admin)
export const toggleProductVisibility = async (productId) => {
  try {
    const response = await api.post(`/admin/product/${productId}/toggle_visibility`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '切换产品状态失败';
  }
};

// [新增] 上传附件 (Admin)
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/upload_file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '文件上传失败';
  }
};

// --- 公告相关 API ---
export const fetchAnnouncementDates = async () => {
  try {
    const response = await api.get('/announcement/dates');
    return response.data;
  } catch (error) {
    console.error("Error fetching announcement dates:", error);
    throw error;
  }
};

export const fetchAnnouncementsByDateAndLang = async (date, lang, limit = 100) => {
  try {
    const response = await api.get('/announcement', {
      params: { date, lang, limit },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching announcements for date ${date} and lang ${lang}:`, error);
    throw error;
  }
};

// 获取最新公告（不按日期筛选，只按置顶优先、发布时间倒序）
export const fetchLatestAnnouncements = async (lang = 'zh-cn', limit = 3) => {
  try {
    const response = await api.get('/announcement', {
      params: { lang, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching latest announcements:', error);
    throw error;
  }
};

// 标记公告为已读
export const markAnnouncementRead = async (announcementId) => {
  try {
    const response = await api.post(`/announcement/${announcementId}/read`);
    return response.data; // { code, data: { announcement_id, read_count, user }, msg }
  } catch (error) {
    console.error('Error marking announcement read:', error);
    throw error;
  }
};

// --- Trade (交易市场) 相关 API ---

export const getTradeMarketItems = async (filters = {}) => {
  try {
    const params = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] !== 'all' && filters[key] !== '') {
        params[key] = filters[key];
      }
    });
    const response = await api.get('/trade/market_items', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '获取交易列表失败';
  }
};

export const getTradeItemDetails = async (shareCode) => {
  try {
    const response = await api.get(`/trade/item_details/${shareCode}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '获取详情失败';
  }
};

export const toggleTradeWant = async (shareCode) => {
  try {
    const response = await api.post('/trade/want', { share_code: shareCode });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '操作失败';
  }
};

export const postTradeComment = async (shareCode, content) => {
  try {
    const response = await api.post('/trade/comment', {
      share_code: shareCode,
      content: content
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '留言失败';
  }
};

export const createTradeItem = async (data) => {
  try {
    const response = await api.post('/trade/create', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '发布失败';
  }
};

// --- 图片上传 API ---

export const checkFileHash = async (hash) => {
  try {
    const response = await axios.post('https://api.cgbgear.cn/v1/check-hash', { hash });
    return response.data;
  } catch (error) {
    console.error("Hash check failed:", error);
    return { status: 200, data: { exists: false } };
  }
};

export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error.response?.data?.message || '图片上传失败';
  }
};

export const uploadAvatar = async (file) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/user/avatar/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '头像上传失败';
  }
};

export const uploadTradeImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/trade/upload_image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '图片上传失败';
  }
};

export default api;

// --- 搜索相关 API ---
export const searchAll = async (params = {}) => {
  try {
    const response = await api.get('/search', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '搜索失败';
  }
};

export const getSearchHot = async (limit = 10) => {
  try {
    const response = await api.get('/search/hot', { params: { limit } });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || '获取热搜失败';
  }
};

export const getSearchPlaceholder = async () => {
  try {
    const response = await api.get('/search/placeholder');
    return response.data;
  } catch (error) {
    // 如果接口失败，前端自行降级为内置占位词
    return { code: 200, data: { placeholder: '输入关键词开始搜索' } };
  }
};
