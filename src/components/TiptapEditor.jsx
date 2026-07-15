// TiptapEditor.jsx
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
import React, { useEffect, useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu, ReactNodeViewRenderer } from '@tiptap/react';

// Tiptap 扩展
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';

import { uploadImage } from '../api/api';
import { useNotice } from '../context/NoticeContext';
import TiptapToolbar from './TiptapToolbar';
import ResizableImageNodeView from '../components/Tiptap/ResizableImageNodeView'; // 引入组件

const TiptapEditor = () => {
  const { showNotice } = useNotice();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        validate: href => /^https?:\/\//.test(href) || /^mailto:/.test(href),
      }),
      // 【核心修复】: 同样在 TiptapEditor 中应用自定义 Image 扩展
      Image.extend({
        addAttributes() {
           return {
              ...this.parent?.(),
              width: {
                 default: null,
                 parseHTML: element => element.getAttribute('width'),
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

      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
    ],
    content: '<p>在这里开始编辑...</p>',
  });

  // 处理拖拽和粘贴上传
  useEffect(() => {
    if (!editor) return;

    const handleFileUpload = async (file) => {
      if (!file || !file.type.startsWith('image/')) return;
      editor.commands.focus();
      try {
        const response = await uploadImage(file);
        // 根据 api.js 的修复，这里应该能直接拿到对象或URL
        const finalUrl = response?.data?.url || response?.url || (typeof response === 'string' ? response : null);
        
        if (finalUrl) {
            editor.chain().focus().setImage({ src: finalUrl }).run();
            showNotice('图片上传成功', 'success');
        } else {
            throw new Error("Drag/Paste upload failed to extract URL.");
        }
      } catch (error) {
        console.error('[TiptapEditor] Image upload failed:', error);
        showNotice(error.toString() || '图片上传失败！', 'error');
      }
    };

    const handleDrop = async (event) => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          await handleFileUpload(files[i]);
        }
      }
    };

    const handlePaste = async (event) => {
      const items = event.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            event.preventDefault();
            await handleFileUpload(file);
          }
        }
      }
    };

    const editorDom = editor.view.dom;
    editorDom.addEventListener('drop', handleDrop);
    editorDom.addEventListener('paste', handlePaste);

    return () => {
      editorDom.removeEventListener('drop', handleDrop);
      editorDom.removeEventListener('paste', handlePaste);
    };
  }, [editor, showNotice]);

  const handleToolbarUpload = useCallback(async (file) => {
      try {
          const response = await uploadImage(file);
          const finalUrl = response?.data?.url || response?.url || null;
          if(finalUrl) {
            return { url: finalUrl };
          }
          throw new Error("Failed to extract URL in handleToolbarUpload");
      } catch (e) {
          showNotice('图片上传失败', 'error');
          throw e;
      }
  }, [showNotice]);

  return (
    <div className="editor-wrapper">
      {editor && <TiptapToolbar editor={editor} onUpload={handleToolbarUpload} />}
      
      {/* 气泡菜单部分保持不变 */}
      {editor && (
        <BubbleMenu className="bubble-menu link-menu" tippyOptions={{ duration: 100, theme: 'light' }} editor={editor}
          shouldShow={({ editor, state }) => {
            const { empty, $cursor } = state.selection;
            if (empty || $cursor) return false;
            const isImageSelected = editor.isActive('image');
            if (isImageSelected) return false;
            return editor.isActive('link') || editor.can().setLink({ href: '' });
          }}
        >
          {/* ... */}
        </BubbleMenu>
      )}

      {editor && (
        <BubbleMenu
          className="bubble-menu image-menu"
          tippyOptions={{ duration: 100, theme: 'light' }}
          editor={editor}
          shouldShow={({ editor }) => editor.isActive('image')}
        >
          <button onClick={() => editor.chain().focus().deleteSelection().run()} title="删除图片">
            Delete Image
          </button>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="tiptap-content" />
    </div>
  );
};

export default TiptapEditor;
