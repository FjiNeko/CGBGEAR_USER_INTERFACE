// src/components/ImageUploadModal.jsx
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
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { uploadImage, checkFileHash } from '../api/api';
import { calculateFileHash } from '../utils/fileHash';
import { useNotice } from '../context/NoticeContext';

const ImageUploadModal = ({ isOpen, onClose, onInsertImage }) => {
    const { showNotice } = useNotice();
    const [tab, setTab] = useState('url');
    const [imageUrl, setImageUrl] = useState('');
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [duplicateInfo, setDuplicateInfo] = useState(null);

    // [DEBUG] 每次渲染时打印 props，检查 onInsertImage 是否正确传入
    useEffect(() => {
        console.debug('[ImageUploadModal] Props received:', { isOpen, onInsertImage: typeof onInsertImage });
    }, [isOpen, onInsertImage]);
    
    if (!isOpen) return null;

    const handleInsertUrl = () => {
        console.debug('[ImageUploadModal] handleInsertUrl called with URL:', imageUrl);
        if (imageUrl.trim()) {
            if (typeof onInsertImage === 'function') {
                onInsertImage(imageUrl.trim(), 'url');
            } else {
                 console.error('[ImageUploadModal] onInsertImage prop is not a function!');
            }
            setImageUrl('');
            onClose();
        } else {
            showNotice('请输入有效的图片 URL', 'warning');
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        console.debug('[ImageUploadModal] handleFileChange:', selectedFile);
        if (selectedFile) {
            if (!selectedFile.type.startsWith('image/')) {
                showNotice('请选择图片文件', 'warning');
                setFile(null);
                e.target.value = null;
                return;
            }
            
            // [TASK FIX]: 移除了文件大小限制 (原先限制为 5MB)
            // 原代码：
            // if (selectedFile.size > 5 * 1024 * 1024) {
            //     showNotice('图片文件不能超过 5MB', 'warning');
            //     setFile(null);
            //     e.target.value = null;
            //     return;
            // }
            
            setFile(selectedFile);
        }
    };

    const handleUploadLocal = async () => {
        if (!file) {
            showNotice('请选择要上传的图片', 'warning');
            return;
        }

        console.debug('[ImageUploadModal] handleUploadLocal called with file:', file);
        setIsUploading(true);
        try {
            // 计算文件hash
            const hash = await calculateFileHash(file);
            
            // 检查是否已存在
            const checkRes = await checkFileHash(hash);
            if (checkRes.status === 200 && checkRes.data?.exists) {
                setDuplicateInfo(checkRes.data);
                setIsUploading(false);
                return;
            }

            const response = await uploadImage(file);
            
            // [DEBUG] 打印从 API 收到的原始响应
            console.debug('[ImageUploadModal] Raw API response:', JSON.parse(JSON.stringify(response)));

            // [核心修复] 更稳健地解析 URL，以防 Axios 拦截器行为不一
            let finalUrl = null;
            if (response && response.data && response.data.url) {
                finalUrl = response.data.url; // 适用于 { "code": 200, "data": { "url": "..." } }
            } else if (response && response.url) {
                finalUrl = response.url; // 适用于 { "url": "..." }
            } else if (typeof response === 'string') {
                finalUrl = response; // 适用于直接返回 "..."
            }
            
            // [DEBUG] 打印解析后的 URL
            console.debug('[ImageUploadModal] Extracted URL:', finalUrl);

            if (!finalUrl) {
                throw new Error("上传成功，但未能从响应中解析出图片地址。");
            }
            
            // [DEBUG] 检查 onInsertImage 回调是否存在并调用
            if (typeof onInsertImage === 'function') {
                console.debug('[ImageUploadModal] Calling onInsertImage with URL:', finalUrl);
                onInsertImage(finalUrl, 'local');
            } else {
                 console.error('[ImageUploadModal] onInsertImage prop is not a function! Cannot insert image.');
                 throw new Error("前端组件通信错误：无法找到插入图片的回调函数。");
            }

            showNotice('图片上传成功', 'success');
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = null;
            onClose();

        } catch (error) {
            console.error('[ImageUploadModal] Image upload error:', error);
            const errorMsg = error.message || error.toString();
            showNotice(errorMsg, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleUseDuplicate = () => {
        if (duplicateInfo && typeof onInsertImage === 'function') {
            const previewUrl = `https://api.cgbgear.cn/v1/preview/${duplicateInfo.fileId}`;
            onInsertImage(previewUrl, 'duplicate');
            showNotice('已使用现有图片', 'success');
        }
        setDuplicateInfo(null);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
        onClose();
    };

    const handleUploadAnyway = async () => {
        setDuplicateInfo(null);
        setIsUploading(true);
        try {
            const response = await uploadImage(file);
            let finalUrl = null;
            if (response && response.data && response.data.url) {
                finalUrl = response.data.url;
            } else if (response && response.url) {
                finalUrl = response.url;
            } else if (typeof response === 'string') {
                finalUrl = response;
            }
            
            if (!finalUrl) {
                throw new Error("上传成功，但未能从响应中解析出图片地址。");
            }
            
            if (typeof onInsertImage === 'function') {
                onInsertImage(finalUrl, 'local');
            }

            showNotice('图片上传成功', 'success');
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = null;
            onClose();
        } catch (error) {
            console.error('[ImageUploadModal] Image upload error:', error);
            showNotice(error.message || error.toString(), 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCloseModal = () => {
        console.debug('[ImageUploadModal] Closing modal.');
        setTab('url');
        setImageUrl('');
        setFile(null);
        setDuplicateInfo(null);
        if(fileInputRef.current) fileInputRef.current.value = null;
        onClose();
    };

    return (
        <>
            {duplicateInfo && (
                <div className="modal-overlay" style={{ zIndex: 10000 }}>
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header" style={{ backgroundColor: '#ffc107', color: '#000' }}>
                            <h2>⚠️ 检测到重复文件</h2>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '15px' }}>此文件已存在于系统中，是否使用现有文件？</p>
                            <div style={{ marginBottom: '10px' }}>
                                <small style={{ color: '#666' }}>文件ID: </small>
                                <span style={{ color: '#ffc107' }}>{duplicateInfo.fileId}</span>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <small style={{ color: '#666' }}>状态: </small>
                                <span>{duplicateInfo.status}</span>
                            </div>
                            {duplicateInfo.createdAt && (
                                <div style={{ marginBottom: '15px' }}>
                                    <small style={{ color: '#666' }}>上传时间: </small>
                                    <span>{new Date(duplicateInfo.createdAt).toLocaleString()}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" className="modal-button primary" onClick={handleUseDuplicate} style={{ flex: 1 }}>
                                    使用现有文件
                                </button>
                                <button type="button" className="modal-button" onClick={handleUploadAnyway} style={{ flex: 1, backgroundColor: '#ffc107' }}>
                                    仍然上传
                                </button>
                                <button type="button" className="modal-button" onClick={() => setDuplicateInfo(null)}>
                                    取消
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2>插入图片</h2>
                        <button type="button" className="close-button" onClick={handleCloseModal}>&times;</button>
                    </div>
                <div className="modal-tabs">
                    <button type="button" className={tab === 'url' ? 'active' : ''} onClick={() => setTab('url')}>网络图片</button>
                    <button type="button" className={tab === 'local' ? 'active' : ''} onClick={() => setTab('local')}>本地上传</button>
                </div>
                <div className="modal-body">
                    {tab === 'url' && (
                        <div>
                            <input type="text" placeholder="输入图片 URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="modal-input" />
                            <button type="button" className="modal-button primary" onClick={handleInsertUrl}>插入</button>
                        </div>
                    )}
                    {tab === 'local' && (
                        <div>
                            <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="modal-file-input" disabled={isUploading} />
                            {file && <p>已选择文件: {file.name}</p>}
                            <button type="button" className="modal-button primary" onClick={handleUploadLocal} disabled={!file || isUploading}>
                                {isUploading ? '上传中...' : '上传并插入'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
    );
};

ImageUploadModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onInsertImage: PropTypes.func.isRequired,
};

export default ImageUploadModal;
