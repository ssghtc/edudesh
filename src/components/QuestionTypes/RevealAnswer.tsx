import React, { useState } from 'react';
import { Exhibit } from '@/types';

interface RevealAnswerProps {
    rationale?: string;
    exhibits?: Exhibit[];
    exhibitContent?: string;
}

export default function RevealAnswer({ rationale, exhibits, exhibitContent }: RevealAnswerProps) {
    const [revealed, setRevealed] = useState(false);

    // If there is no rationale and no exhibits, we arguably shouldn't even show the button,
    // but we can still show it and just say "No rationale provided".
    const hasExhibits = (exhibits && exhibits.length > 0) || exhibitContent;

    // Helper to decode escaped HTML entities so they render as proper HTML
    const decodeHTML = (html?: string) => {
        if (!html) return '';
        return html
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/&#160;/g, ' ');
    };

    return (
        <div style={{ marginTop: '2.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
            {!revealed ? (
                <button
                    onClick={() => setRevealed(true)}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: '#f8fafc',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#94a3b8';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Reveal Answer & Rationale
                </button>
            ) : (
                <div style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    animation: 'fadeIn 0.3s ease-in-out'
                }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg width="20" height="20" fill="none" stroke="#22c55e" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Rationale / Explanation
                    </h4>

                    {rationale ? (
                        <div
                            style={{ color: '#334155', lineHeight: 1.6, marginBottom: hasExhibits ? '1.5rem' : '0' }}
                            dangerouslySetInnerHTML={{ __html: decodeHTML(rationale) }}
                        />
                    ) : (
                        <p style={{ color: '#64748b', fontStyle: 'italic', marginBottom: hasExhibits ? '1.5rem' : '0' }}>
                            No rationale provided for this question.
                        </p>
                    )}

                    {hasExhibits && (
                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1' }}>
                            <h5 style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', marginBottom: '1rem' }}>Exhibits / References</h5>

                            {exhibitContent && (
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                                    <div dangerouslySetInnerHTML={{ __html: decodeHTML(exhibitContent) }} style={{ overflowX: 'auto' }} />
                                </div>
                            )}

                            {exhibits && exhibits.length > 0 && exhibits.map((ex, idx) => (
                                <div key={idx} style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: idx < exhibits.length - 1 ? '1rem' : 0 }}>
                                    {ex.title && <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#0f172a' }}>{ex.title}</strong>}
                                    <div dangerouslySetInnerHTML={{ __html: decodeHTML(ex.content) }} style={{ overflowX: 'auto' }} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
