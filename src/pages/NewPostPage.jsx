// NewPostPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import MainNav from '../components/MainNav';
import SiteFooter from '../components/SiteFooter';
import { useAuth } from '../context/AuthContext';
import { useNotice } from '../context/NoticeContext';
import { getForumModules, createForumPost, uploadImage } from '../api/api';
import TiptapToolbar from '../components/TiptapToolbar';

// Tiptap Imports
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'; // 引入 ReactNodeViewRenderer
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link as LinkExtension } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { TextAlign } from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import CodeBlock from '@tiptap/extension-code-block';
import Blockquote from '@tiptap/extension-blockquote';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import BulletList from '@tiptap/extension-bullet-list';
import Heading from '@tiptap/extension-heading';
import Placeholder from '@tiptap/extension-placeholder';

// 引入自定义的图片缩放组件
import ResizableImageNodeView from '../components/Tiptap/ResizableImageNodeView';

import '../css/main.css';

const NewPostPage = () => {
   const location = useLocation();
   const navigate = useNavigate();
   const { user: currentUser, loading: authLoading } = useAuth();
   const { showNotice } = useNotice();
   const { categorySlug, subCategorySlug } = useParams();

   const [navSolid, setNavSolid] = useState(false);
   const [loadingModules, setLoadingModules] = useState(true);
   const [error, setError] = useState(null);

   const [targetSubsectionId, setTargetSubsectionId] = useState(null);
   const [threadTitle, setThreadTitle] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);

   const [breadcrumbs, setBreadcrumbs] = useState([]);
   const [categoryName, setCategoryName] = useState('加载中...');

   // [DEBUG] 页面加载时打印信息
   useEffect(() => {
      console.debug('[NewPostPage] Component mounted.');
   }, []);

   // Tiptap editor setup
   const editor = useEditor({
      extensions: [
         // 【核心修复】: 扩展 Image 以支持 width 属性和自定义 NodeView
         Image.extend({
            addAttributes() {
               return {
                  ...this.parent?.(),
                  width: {
                     default: null, // 默认宽度为空（自适应）
                     // 从 HTML 解析时读取 width 属性
                     parseHTML: element => element.getAttribute('width'),
                     // 渲染 HTML 时写入 width 属性
                     renderHTML: attributes => {
                        if (!attributes.width) return {};
                        return { width: attributes.width };
                     },
                  },
               };
            },
            addNodeView() {
               return ReactNodeViewRenderer(ResizableImageNodeView);
            },
         }).configure({ inline: true, allowBase64: true }),

         LinkExtension.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank', }, }),
         Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
         Underline, Strike, Color, TextStyle, TextAlign.configure({ types: ['heading', 'paragraph'] }),
         Placeholder.configure({ placeholder: '在这里输入您的帖子内容...', }),
         Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
         BulletList.configure({ itemTypeName: 'listItem' }),
         OrderedList.configure({ itemTypeName: 'listItem' }),
         Blockquote,
         CodeBlock,
         StarterKit.configure({
            strike: false,
            underline: false,
            heading: false,
            bulletList: false,
            orderedList: false,
            blockquote: false,
            codeBlock: false,
            link: false,
         }),
      ],
      content: '<p></p>',
      editorProps: { attributes: { class: 'tiptap-editor-content', }, },
   });

   useEffect(() => {
      const initData = async () => {
         setLoadingModules(true);
         setError(null);
         try {
            const queryParams = new URLSearchParams(location.search);
            const subsectionIdFromQuery = queryParams.get('subsection_id');
            
            if (!subsectionIdFromQuery) {
               setError("URL 中缺少必要的版块ID参数。请通过论坛列表页或版块页进入。");
               setLoadingModules(false);
               return;
            }

            setTargetSubsectionId(subsectionIdFromQuery);

            const res = await getForumModules();
            const modules = res.data || [];

            const crumbs = [{ label: '论坛', link: '/forum' }];
            let targetName = '未知版块';
            let foundSub = null;
            let foundParent = null;

            for (const section of modules) {
               if (section.subsections && Array.isArray(section.subsections)) {
                  const match = section.subsections.find(sub => (sub.id && sub.id.toString()) === subsectionIdFromQuery);
                  if (match) {
                     foundSub = match;
                     foundParent = section;
                     break;
                  }
               }
            }

            if (foundParent) {
               crumbs.push({ label: foundParent.name, link: foundParent.link_path || `/forum/${encodeURIComponent(foundParent.name.toLowerCase())}` });
            }

            if (foundSub) {
               crumbs.push({ label: foundSub.name, link: foundSub.link_path || `/forum/${encodeURIComponent(foundParent.name.toLowerCase())}/${encodeURIComponent(foundSub.name.toLowerCase())}` });
               targetName = foundSub.name;
            } else {
               targetName = `版块ID: ${subsectionIdFromQuery} (名称未知)`;
               setError(`无法找到指定版块ID (${subsectionIdFromQuery}) 的信息。`);
            }

            setBreadcrumbs(crumbs);
            setCategoryName(targetName);

         } catch (e) {
            setError("加载论坛版块信息失败，请检查网络连接或稍后重试。");
         } finally {
            setLoadingModules(false);
         }
      };

      initData();
   }, [location.search]);

   const handleImageUploadWrapper = useCallback(async (file) => {
      try {
         const response = await uploadImage(file);
         let finalUrl = null;
         if (response && response.data && response.data.url) {
             finalUrl = response.data.url;
         } else if (response && response.url) {
             finalUrl = response.url;
         }
         if (finalUrl) {
            return { url: finalUrl };
         }
         throw new Error("Failed to extract URL in handleImageUploadWrapper");
      } catch (error) {
         showNotice(error.toString(), 'error');
         throw error;
      }
   }, [showNotice]);

   const handlePostSubmit = async (e) => {
      e.preventDefault();
      if (!currentUser || !currentUser.is_logged_in) {
         showNotice('请先登录才能发帖。', 'error');
         navigate('/terminal/login');
         return;
      }
      if (!targetSubsectionId) {
         showNotice('无法确定发帖版块，请刷新页面重试。', 'error');
         return;
      }
      if (!threadTitle.trim()) {
         showNotice('标题不能为空。', 'warning');
         return;
      }
      if (!editor || editor.isEmpty) {
         showNotice('内容不能为空。', 'warning');
         return;
      }

      setIsSubmitting(true);
      try {
         const contentHtml = editor.getHTML();
         const res = await createForumPost({
            threadTitle: threadTitle,
            content: contentHtml,
            subsection_id: targetSubsectionId
         });

         if (res && (res.code === 200 || res.code === 201) && res.data && res.data.post_id) {
            showNotice("帖子发布成功！", 'success');
            navigate(`/thread/${res.data.post_id}`);
         } else {
            showNotice(res?.message || "发布成功，但未能获取帖子ID，即将返回版块页。", 'warning');
            navigate(breadcrumbs[breadcrumbs.length - 1]?.link || '/forum');
         }

      } catch (err) {
         const errorMsg = typeof err === 'string' ? err : (err.response?.data?.message || err.message || "发布失败，请稍后重试。");
         showNotice(errorMsg, 'error');
      } finally {
         setIsSubmitting(false);
      }
   };

   useEffect(() => {
      return () => {
         editor?.destroy();
      };
   }, [editor]);


   if (loadingModules || authLoading) {
      return (
         <div className="page">
            <MainNav navSolid={true} />
            <div style={{ paddingTop: 100, textAlign: 'center', color: '#888' }}>正在加载环境...</div>
            <SiteFooter />
         </div>
      );
   }

   if (error) {
      return (
         <div className="page">
            <MainNav navSolid={true} />
            <div className="main-wrapper" style={{ paddingTop: '80px', textAlign: 'center', paddingBottom: '50px', color: '#dc3545' }}>
               <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>加载失败</h2>
               <p>{error}</p>
               <button onClick={() => navigate('/forum')} className="uc-btn primary" style={{ marginTop: '20px' }}>
                  返回论坛
               </button>
            </div>
            <SiteFooter />
         </div>
      );
   }

   return (
      <div className="page">
         <MainNav navSolid={navSolid} />

         <main className="main-wrapper" style={{ paddingTop: '80px', minHeight: '90vh' }}>
            <div className="forum-content-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>

               <div className="forum-header" style={{ marginBottom: '20px' }}>
                  <h1 style={{ fontSize: '24px', color: '#fff', marginBottom: '10px' }}>
                     发表新主题
                  </h1>
                  <div className="breadcrumbs" style={{ fontSize: '13px', color: '#888' }}>
                     {breadcrumbs.map((crumb, i) => (
                        <span key={i}>
                           <Link to={crumb.link} style={{ color: '#a3e635', textDecoration: 'none' }}>{crumb.label}</Link>
                           <span style={{ margin: '0 5px' }}>&rsaquo;</span>
                        </span>
                     ))}
                     <span style={{ color: '#ccc' }}>{categoryName}</span>
                  </div>
               </div>

               {!currentUser || !currentUser.is_logged_in ? (
                  <div className="nv-panel" style={{ textAlign: 'center', padding: '40px', background: '#222', border: '1px solid #333' }}>
                     <h3 style={{ color: '#ccc' }}>您没有权限在此处发帖</h3>
                     <p style={{ color: '#666', marginBottom: '20px' }}>请先登录或注册账号。</p>
                     <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                        <button onClick={() => navigate('/terminal/login')} className="nav-cta primary">登录</button>
                        <button onClick={() => navigate('/terminal/register')} className="nav-cta">注册</button>
                     </div>
                  </div>
               ) : (
                  <form onSubmit={handlePostSubmit}>
                     <div style={{ marginBottom: '15px' }}>
                        <input
                           type="text"
                           placeholder="主题标题..."
                           value={threadTitle}
                           onChange={e => setThreadTitle(e.target.value)}
                           disabled={isSubmitting}
                           style={{
                              width: '100%',
                              background: '#222',
                              border: '1px solid #444',
                              color: '#fff',
                              fontSize: '20px',
                              padding: '12px 15px',
                              borderRadius: '4px'
                           }}
                        />
                     </div>

                     <div className="nv-panel" style={{ padding: 0, overflow: 'hidden', background: '#222', border: '1px solid #444' }}>
                        <TiptapToolbar editor={editor} onUpload={handleImageUploadWrapper} />
                        <div style={{ minHeight: '300px', cursor: 'text' }} onClick={() => editor && editor.commands.focus()}>
                           <EditorContent editor={editor} />
                        </div>
                     </div>

                     <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                           <button type="submit" disabled={isSubmitting} className="nav-cta primary" style={{ padding: '10px 30px', fontSize: '16px', opacity: isSubmitting ? 0.7 : 1 }}>
                              {isSubmitting ? '发布中...' : '发布帖子'}
                           </button>
                        </div>
                     </div>
                  </form>
               )}

            </div>
         </main>
         <SiteFooter />
      </div>
   );
};

export default NewPostPage;
