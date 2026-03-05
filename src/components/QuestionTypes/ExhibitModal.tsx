import React from 'react';

interface ExhibitModalProps {
    content: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ExhibitModal({ content, isOpen, onClose }: ExhibitModalProps) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'white',
                width: '90%',
                maxWidth: '600px',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '80vh'
            }}>
                <div style={{
                    padding: '1rem 1.5rem',
                    background: '#0ea5e9',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Exhibit Display</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            lineHeight: 1
                        }}
                    >
                        ×
                    </button>
                </div>
                <div
                    style={{
                        padding: '2rem',
                        overflowY: 'auto',
                        lineHeight: 1.6,
                        color: '#334155'
                    }}
                    dangerouslySetInnerHTML={{
                        __html: content
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&amp;/g, '&')
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'")
                            .replace(/&nbsp;/g, ' ')
                            .replace(/&#160;/g, ' ')
                    }}
                />
                <div style={{
                    padding: '1rem',
                    borderTop: '1px solid #e2e8f0',
                    textAlign: 'right'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem 1.5rem',
                            background: '#e2e8f0',
                            color: '#475569',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
