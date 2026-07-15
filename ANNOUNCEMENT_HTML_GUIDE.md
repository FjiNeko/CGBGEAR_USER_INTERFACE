# 公告格式修复指南 - HTML内容支持

## 方法1：使用富文本编辑器 TiptapEditor（已实现 ✅）

我已经将公告内容输入框替换为 TiptapEditor 富文本编辑器。现在你可以：

- 使用工具栏添加标题（H1, H2, H3）
- 添加加粗、斜体文本
- 创建有序列表和无序列表
- 插入链接
- 自动生成HTML格式

**使用方式：**
1. 在"简体中文内容"区域使用编辑器工具栏
2. 编辑器会自动将格式转换为HTML
3. 提交时会发送完整的HTML内容

---

## 方法2：直接输入HTML代码

如果你想直接粘贴HTML代码，可以添加一个"HTML模式"切换：

### 实现步骤：

在 `AdminDashboard.jsx` 中添加状态：
```javascript
const [htmlMode, setHtmlMode] = useState(false);
```

在表单中添加切换按钮：
```javascript
<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
    <label className="green">简体中文内容</label>
    <button 
        type="button" 
        className="terminal-btn" 
        style={{ fontSize: '0.7rem' }}
        onClick={() => setHtmlMode(!htmlMode)}
    >
        {htmlMode ? '切换到富文本编辑器' : '切换到HTML模式'}
    </button>
</div>

{htmlMode ? (
    <textarea 
        className="terminal-input" 
        style={{ minHeight: '200px', fontFamily: 'monospace' }} 
        value={announceForm.content} 
        onChange={e => setAnnounceForm({ ...announceForm, content: e.target.value })} 
        placeholder="直接输入HTML代码..."
        required 
    />
) : (
    <div style={{ border: '1px solid #333', borderRadius: '4px', background: '#0a0a0a' }}>
        <TiptapEditor 
            content={announceForm.content} 
            onChange={(html) => setAnnounceForm({ ...announceForm, content: html })}
        />
    </div>
)}
```

---

## 方法3：HTML预览功能

添加实时预览，让你看到HTML渲染效果：

```javascript
const [showPreview, setShowPreview] = useState(false);

// 在表单中添加：
<button 
    type="button" 
    className="terminal-btn" 
    onClick={() => setShowPreview(!showPreview)}
>
    {showPreview ? '隐藏预览' : '显示预览'}
</button>

{showPreview && (
    <div style={{ 
        marginTop: '10px', 
        padding: '15px', 
        border: '1px solid #333', 
        borderRadius: '4px',
        background: '#fff',
        color: '#333'
    }}>
        <h4 style={{ color: '#333', marginBottom: '10px' }}>预览效果：</h4>
        <div dangerouslySetInnerHTML={{ __html: announceForm.content }} />
    </div>
)}
```

---

## 方法4：HTML模板快速插入

添加常用HTML模板按钮：

```javascript
const htmlTemplates = {
    basic: `<h2>尊敬的各位社群成员：</h2>
<p>公告内容...</p>`,
    
    withList: `<h2>标题</h2>
<p>介绍文字</p>
<ul>
    <li><strong>要点1</strong>：说明</li>
    <li><strong>要点2</strong>：说明</li>
</ul>`,
    
    announcement: `<h2>尊敬的各位社群成员：</h2>
<p>为完善论坛功能、优化用户体验，并迎接即将到来的春节活动，CGBGEAR 论坛将于 <strong>2026年2月</strong> 正式启动公开测试。</p>
<p>本次公测的核心安排如下：</p>
<ul>
    <li><strong>预注册开放</strong>：2026年2月10日正式开放论坛注册通道。</li>
    <li><strong>抢先注册奖励</strong>：前15位成功注册的成员将获得额外惊喜奖励。</li>
</ul>
<p><em>注：以上时间节点为暂定计划，如有调整我们将通过官方渠道第一时间通知。</em></p>`
};

// 添加模板按钮：
<div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
    <button type="button" className="terminal-btn" style={{ fontSize: '0.7rem' }}
        onClick={() => setAnnounceForm({ ...announceForm, content: htmlTemplates.basic })}>
        基础模板
    </button>
    <button type="button" className="terminal-btn" style={{ fontSize: '0.7rem' }}
        onClick={() => setAnnounceForm({ ...announceForm, content: htmlTemplates.withList })}>
        列表模板
    </button>
    <button type="button" className="terminal-btn" style={{ fontSize: '0.7rem' }}
        onClick={() => setAnnounceForm({ ...announceForm, content: htmlTemplates.announcement })}>
        公告模板
    </button>
</div>
```

---

## 当前实现状态

✅ **已完成：** 方法1 - TiptapEditor富文本编辑器已集成

📝 **可选添加：** 方法2、3、4可以根据需要添加

---

## 使用示例

### 使用TiptapEditor创建你的示例公告：

1. 点击工具栏的 "H2" 按钮，输入：`尊敬的各位社群成员：`
2. 按回车，输入正文段落
3. 选中需要加粗的文字，点击 "B" 按钮
4. 点击列表按钮创建项目列表
5. 编辑器会自动生成HTML格式

### 或者直接在代码中设置默认值：

```javascript
const [announceForm, setAnnounceForm] = useState({
    title: '', 
    content: '<h2>尊敬的各位社群成员：</h2><p>公告内容...</p>', 
    category: 'news', 
    is_pinned: false
});
```

---

## 后端注意事项

确保后端接收和存储HTML内容时：
1. 不要过滤HTML标签
2. 在显示时使用 `dangerouslySetInnerHTML` 或类似方法渲染HTML
3. 考虑添加HTML清理/消毒以防止XSS攻击（推荐使用 DOMPurify）

---

## 推荐方案

**最佳实践：** 使用方法1（TiptapEditor）+ 方法3（预览功能）

这样既有可视化编辑体验，又能实时查看最终效果。
