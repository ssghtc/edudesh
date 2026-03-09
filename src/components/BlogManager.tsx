import React, { useState } from 'react';
import { Blog } from '@/types';
import { supabase } from '@/lib/supabaseClient';

interface BlogManagerProps {
    blogs: Blog[];
    setBlogs: React.Dispatch<React.SetStateAction<Blog[]>>;
}

export default function BlogManager({ blogs, setBlogs }: BlogManagerProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

    const handleSaveBlog = async () => {
        if (!title || !content) return;
        setLoading(true);

        try {
            const blogData = {
                title,
                content,
                image_url: imageUrl,
                date: new Date().toLocaleDateString('en-GB')
            };

            if (editingBlog) {
                const { data, error } = await supabase
                    .from('blogs')
                    .update(blogData)
                    .eq('id', editingBlog.id)
                    .select();

                if (error) throw error;
                if (data) {
                    setBlogs(blogs.map(b => b.id === editingBlog.id ? data[0] : b));
                    setEditingBlog(null);
                }
            } else {
                const { data, error } = await supabase
                    .from('blogs')
                    .insert([{
                        ...blogData,
                        author: 'Admin',
                        created_at: new Date().toISOString()
                    }])
                    .select();

                if (error) throw error;
                if (data) {
                    setBlogs([data[0], ...blogs]);
                }
            }

            resetForm();
        } catch (err) {
            console.error('Error saving blog:', err);
            alert('Failed to save blog post');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setImageUrl('');
        setEditingBlog(null);
        setViewMode('editor');
    };

    const handleDeleteBlog = async (id: string) => {
        if (!confirm('Are you sure you want to delete this blog post?')) return;

        try {
            const { error } = await supabase
                .from('blogs')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setBlogs(blogs.filter(b => b.id !== id));
        } catch (err) {
            console.error('Error deleting blog:', err);
            alert('Failed to delete blog post');
        }
    };

    const handleEditClick = (blog: Blog) => {
        setEditingBlog(blog);
        setTitle(blog.title);
        setContent(blog.content);
        setImageUrl(blog.image_url || '');
        setViewMode('editor');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const insertText = (before: string, after: string = '') => {
        const textarea = document.getElementById('blog-editor-textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);
        const newText = text.substring(0, start) + before + selected + after + text.substring(end);

        setContent(newText);

        // Return focus and set selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const insertImagePlaceholder = () => {
        const url = prompt('Enter image URL:');
        if (url) {
            insertText(`\n![Image](${url})\n`);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1.2 }} className="text-gradient">
                        Blog Management
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Publish articles and updates for your students
                    </p>
                </div>
                {editingBlog && (
                    <button
                        onClick={resetForm}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 600
                        }}
                    >
                        Cancel Editing
                    </button>
                )}
            </div>

            <div style={{
                background: 'var(--bg-card)',
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                border: 'var(--glass-border)',
                marginBottom: '3rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle at 70% 30%, rgba(124, 58, 237, 0.1) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ background: editingBlog ? 'var(--gradient-accent)' : 'var(--gradient-primary)', width: '8px', height: '32px', borderRadius: '4px', display: 'block' }}></span>
                        {editingBlog ? 'Edit Article' : 'Write New Article'}
                    </h3>

                    <div style={{
                        display: 'flex',
                        background: 'var(--bg-secondary)',
                        padding: '0.35rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <button
                            onClick={() => setViewMode('editor')}
                            style={{
                                padding: '0.4rem 1rem',
                                borderRadius: 'var(--radius-sm)',
                                background: viewMode === 'editor' ? 'var(--bg-primary)' : 'transparent',
                                color: viewMode === 'editor' ? 'white' : 'var(--text-secondary)',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 500
                            }}
                        >
                            Editor
                        </button>
                        <button
                            onClick={() => setViewMode('preview')}
                            style={{
                                padding: '0.4rem 1rem',
                                borderRadius: 'var(--radius-sm)',
                                background: viewMode === 'preview' ? 'var(--bg-primary)' : 'transparent',
                                color: viewMode === 'preview' ? 'white' : 'var(--text-secondary)',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 500
                            }}
                        >
                            Preview
                        </button>
                    </div>
                </div>

                {viewMode === 'editor' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                                <span>Article Title</span>
                                <span style={{ fontSize: '0.75rem', opacity: title.length > 50 ? 1 : 0.5 }}>{title.length}/100</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter a catchy title..."
                                maxLength={100}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    color: 'white',
                                    fontSize: '1.2rem',
                                    fontWeight: 600,
                                    outline: 'none',
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Featured Image URL (Link)</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="Paste image link here..."
                                    style={{
                                        flex: 1,
                                        padding: '0.85rem',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'white',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                    }}
                                />
                                {imageUrl && (
                                    <div style={{
                                        width: '45px',
                                        height: '45px',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        background: '#333',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <img src={imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Article Content</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => insertText('**', '**')} className="toolbar-btn" title="Bold">B</button>
                                    <button onClick={() => insertText('_', '_')} className="toolbar-btn" title="Italic">I</button>
                                    <button onClick={() => insertText('### ')} className="toolbar-btn" title="Heading">H</button>
                                    <span style={{ borderLeft: '1px solid var(--border-color)', margin: '0 0.25rem' }}></span>
                                    <button onClick={insertImagePlaceholder} className="toolbar-btn" style={{ fontSize: '0.8rem', width: 'auto', padding: '0 0.5rem' }}>🖼️ Add Image Link</button>
                                </div>
                            </div>
                            <textarea
                                id="blog-editor-textarea"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={15}
                                placeholder="Start writing... Tip: You can insert images anywhere using the button above."
                                style={{
                                    width: '100%',
                                    padding: '1.2rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    color: 'white',
                                    resize: 'vertical',
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '1.1rem',
                                    lineHeight: 1.7,
                                    outline: 'none',
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <div style={{ color: 'white' }}>
                        {imageUrl && (
                            <img
                                src={imageUrl}
                                alt="Featured"
                                style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px', marginBottom: '2rem' }}
                            />
                        )}
                        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.1 }}>{title || 'Untitled'}</h1>
                        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
                            <span>Admin</span> • <span>{new Date().toLocaleDateString('en-GB')}</span>
                        </div>
                        <div style={{ lineHeight: 1.8, fontSize: '1.15rem' }}>
                            {content.split('\n').map((line, i) => {
                                if (line.trim().startsWith('![Image](')) {
                                    const imgUrl = line.match(/\((.*?)\)/)?.[1];
                                    return imgUrl ? <img key={i} src={imgUrl} style={{ maxWidth: '100%', borderRadius: '12px', margin: '2rem 0' }} alt="" /> : null;
                                }
                                if (line.trim().startsWith('### ')) {
                                    return <h3 key={i} style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '2.5rem', marginBottom: '1rem' }}>{line.replace('### ', '')}</h3>;
                                }
                                return line.trim() ? <p key={i} style={{ marginBottom: '1.5rem' }}>{line}</p> : null;
                            })}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                    <button
                        className={`btn ${editingBlog ? 'btn-accent' : 'btn-primary'}`}
                        style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', fontWeight: 700 }}
                        onClick={handleSaveBlog}
                        disabled={loading || !title || !content}
                    >
                        {loading ? 'Saving...' : editingBlog ? 'Update Post' : 'Publish Post'}
                    </button>
                    {editingBlog && (
                        <button onClick={resetForm} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2rem' }}>Published Articles</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '2rem' }}>
                {blogs.map(blog => (
                    <div key={blog.id} className="blog-card" style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        border: 'var(--glass-border)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {blog.image_url && (
                            <div style={{ width: '100%', height: '220px', overflow: 'hidden' }}>
                                <img src={blog.image_url} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '0.5rem' }}>{blog.title}</h4>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{blog.date}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleEditClick(blog)} className="action-btn">✏️</button>
                                    <button onClick={() => handleDeleteBlog(blog.id)} className="action-btn del">🗑️</button>
                                </div>
                            </div>
                            <p style={{
                                color: 'var(--text-secondary)',
                                fontSize: '0.95rem',
                                lineHeight: 1.6,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                marginBottom: '1.5rem'
                            }}>
                                {blog.content.replace(/!\[Image\].*?\)/g, '').replace(/### /g, '').replace(/\*\*/g, '')}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .text-gradient {
                    background: var(--gradient-primary);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .toolbar-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 6px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    color: white;
                    cursor: pointer;
                    display: flex;
                    alignItems: center;
                    justify-content: center;
                    font-weight: bold;
                    transition: all 0.2s;
                }
                .toolbar-btn:hover { background: var(--bg-primary); border-color: var(--text-accent); }
                .action-btn {
                    padding: 0.5rem;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--border-color);
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.9rem;
                }
                .action-btn:hover { background: rgba(255,255,255,0.1); }
                .action-btn.del:hover { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); }
                .blog-card { transition: transform 0.3s; }
                .blog-card:hover { transform: translateY(-5px); }
            `}</style>
        </div>
    );
}
