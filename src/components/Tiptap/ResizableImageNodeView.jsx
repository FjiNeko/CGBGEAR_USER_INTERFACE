// src/components/Tiptap/ResizableImageNodeView.jsx
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

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const ResizableImageNodeView = ({ node, updateAttributes, selected }) => {
  const [isResizing, setIsResizing] = useState(false);
  const imageRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // 初始化宽度，如果节点没有宽度，默认100%
  const width = node.attrs.width || '100%';

  const handleMouseDown = useCallback((e) => {
    e.preventDefault(); // 防止默认拖拽行为
    setIsResizing(true);
    startXRef.current = e.clientX;
    
    // 获取当前图片显示的像素宽度
    if (imageRef.current) {
        const currentRect = imageRef.current.getBoundingClientRect();
        startWidthRef.current = currentRect.width;
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!imageRef.current) return;
    
    const dx = e.clientX - startXRef.current;
    const newWidth = Math.max(50, startWidthRef.current + dx); // 最小宽度 50px

    // 更新 Tiptap 节点属性
    updateAttributes({
      width: `${newWidth}px`, // 将宽度转换为像素值字符串
    });
  }, [updateAttributes]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  return (
    <NodeViewWrapper className="resizable-image-wrapper" style={{ display: 'inline-block', position: 'relative', lineHeight: 0 }}>
      <img
        ref={imageRef}
        src={node.attrs.src}
        alt={node.attrs.alt}
        title={node.attrs.title}
        style={{
          width: width, // 应用宽度
          maxWidth: '100%',
          display: 'block',
          border: selected ? '2px solid #a3e635' : '2px solid transparent', // 选中时高亮
          transition: 'border-color 0.2s',
          boxSizing: 'border-box'
        }}
      />
      
      {/* 只有当图片被选中或正在缩放时，才显示右下角的缩放手柄 */}
      {(selected || isResizing) && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '12px',
            height: '12px',
            backgroundColor: '#a3e635',
            border: '1px solid #fff',
            cursor: 'nwse-resize',
            zIndex: 10,
          }}
          title="拖动缩放"
        />
      )}
    </NodeViewWrapper>
  );
};

export default ResizableImageNodeView;
