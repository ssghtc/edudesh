import React, { useState } from 'react';
import { Question, Blog, DiagramElement } from '@/types';
import OrderingQuestion from './QuestionTypes/OrderingQuestion';
import InputQuestion from './QuestionTypes/InputQuestion';
import RevealAnswer from './QuestionTypes/RevealAnswer';

interface PreviewSectionProps {
    questions: Question[];
    blogs: Blog[];
}

export default function PreviewSection({ questions, blogs }: PreviewSectionProps) {
    const [view, setView] = useState<'questions' | 'blogs'>('questions');
    const [diagramAnswers, setDiagramAnswers] = useState<Record<string, Record<string, string>>>({});
    const [clozeAnswers, setClozeAnswers] = useState<Record<string, Record<string, string>>>({});
    const [matrixAnswers, setMatrixAnswers] = useState<Record<string, Record<string, string>>>({});
    const [orderingAnswers, setOrderingAnswers] = useState<Record<string, string[]>>({});
    const [inputAnswers, setInputAnswers] = useState<Record<string, string>>({});

    const handleDiagramAnswer = (questionId: string, elementId: string, value: string) => {
        setDiagramAnswers(prev => ({
            ...prev,
            [questionId]: {
                ...(prev[questionId] || {}),
                [elementId]: value
            }
        }));
    };

    const handleClozeAnswer = (questionId: string, blankId: string, value: string) => {
        setClozeAnswers(prev => ({
            ...prev,
            [questionId]: {
                ...(prev[questionId] || {}),
                [blankId]: value
            }
        }));
    };

    const handleMatrixAnswer = (questionId: string, rowId: string, columnId: string) => {
        setMatrixAnswers(prev => ({
            ...prev,
            [questionId]: {
                ...(prev[questionId] || {}),
                [rowId]: columnId
            }
        }));
    };

    const handleOrderingAnswer = (questionId: string, currentOrder: string[]) => {
        setOrderingAnswers(prev => ({
            ...prev,
            [questionId]: currentOrder
        }));
    };

    const handleInputAnswer = (questionId: string, value: string) => {
        setInputAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>

            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>Student View Preview</h2>
                <div style={{
                    display: 'inline-flex',
                    background: 'var(--bg-secondary)',
                    padding: '0.25rem',
                    borderRadius: 'var(--radius-lg)'
                }}>
                    <button
                        onClick={() => setView('questions')}
                        style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: 'var(--radius-md)',
                            background: view === 'questions' ? 'var(--bg-primary)' : 'transparent',
                            color: view === 'questions' ? 'white' : 'var(--text-secondary)',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        Quiz Interface
                    </button>
                    <button
                        onClick={() => setView('blogs')}
                        style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: 'var(--radius-md)',
                            background: view === 'blogs' ? 'var(--bg-primary)' : 'transparent',
                            color: view === 'blogs' ? 'white' : 'var(--text-secondary)',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        Blog Reader
                    </button>
                </div>
            </div>

            {view === 'questions' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {questions.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No questions available.</p>
                    ) : (
                        questions.map((q, i) => (
                            <div key={q.id} style={{
                                background: 'white',
                                color: '#1e293b',
                                padding: '2rem',
                                borderRadius: '16px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontWeight: 600, color: '#64748b' }}>Question {i + 1}</span>
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.75rem',
                                        background: q.type === 'single' ? '#e0f2fe' : q.type === 'multiple' ? '#f3e8ff' : q.type === 'diagram' ? '#dcfce7' : q.type === 'cloze' ? '#fce7f3' : q.type === 'matrix' ? '#ffedd5' : q.type === 'ordering' ? '#e0e7ff' : '#f1f5f9',
                                        color: q.type === 'single' ? '#0284c7' : q.type === 'multiple' ? '#9333ea' : q.type === 'diagram' ? '#16a34a' : q.type === 'cloze' ? '#db2777' : q.type === 'matrix' ? '#ea580c' : q.type === 'ordering' ? '#4f46e5' : '#475569',
                                        borderRadius: '20px',
                                        fontWeight: 600
                                    }}>
                                        {q.type === 'single' ? 'Single Choice' : q.type === 'multiple' ? 'Multiple Choice' : q.type === 'diagram' ? 'Interactive Diagram' : q.type === 'cloze' ? 'Fill in Blanks' : q.type === 'matrix' ? 'Matrix Table' : q.type === 'ordering' ? 'Ordering' : 'Input/Calc'}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>{q.text}</h3>

                                {q.type === 'diagram' ? (
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '2rem',
                                        borderRadius: '12px',
                                        border: '2px solid #e2e8f0'
                                    }}>
                                        {/* Interactive Flowchart */}
                                        {q.diagramElements && q.diagramElements.length > 0 ? (
                                            <div style={{ position: 'relative', minHeight: '500px' }}>
                                                {/* SVG Flowchart */}
                                                <svg width="100%" height="500" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                                                    {/* Connecting lines */}
                                                    <line x1="50%" y1="80" x2="50%" y2="140" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
                                                    <line x1="50%" y1="200" x2="50%" y2="260" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
                                                    <line x1="50%" y1="320" x2="50%" y2="380" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />

                                                    {/* Arrow marker */}
                                                    <defs>
                                                        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                                                            <polygon points="0 0, 10 5, 0 10" fill="#94a3b8" />
                                                        </marker>
                                                    </defs>
                                                </svg>

                                                {/* Interactive Elements */}
                                                {q.diagramElements.map((element, idx) => {
                                                    const answer = diagramAnswers[q.id]?.[element.id] || '';
                                                    const isCorrect = answer === element.correctAnswer;

                                                    return (
                                                        <div
                                                            key={element.id}
                                                            style={{
                                                                position: 'absolute',
                                                                left: `${element.position.x}%`,
                                                                top: `${element.position.y}px`,
                                                                transform: 'translateX(-50%)',
                                                                width: '280px',
                                                                zIndex: 10
                                                            }}
                                                        >
                                                            <div style={{
                                                                background: 'white',
                                                                border: `2px solid ${isCorrect && answer ? '#22c55e' : '#3b82f6'}`,
                                                                borderRadius: '12px',
                                                                padding: '1rem',
                                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                                transition: 'all 0.3s'
                                                            }}>
                                                                <div style={{
                                                                    fontSize: '0.85rem',
                                                                    color: '#64748b',
                                                                    marginBottom: '0.5rem',
                                                                    fontWeight: 600
                                                                }}>
                                                                    {element.label}
                                                                </div>
                                                                <select
                                                                    value={answer}
                                                                    onChange={(e) => handleDiagramAnswer(q.id, element.id, e.target.value)}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '0.75rem',
                                                                        borderRadius: '8px',
                                                                        border: `1px solid ${isCorrect && answer ? '#22c55e' : '#cbd5e1'}`,
                                                                        background: isCorrect && answer ? '#f0fdf4' : 'white',
                                                                        color: '#1e293b',
                                                                        fontSize: '0.95rem',
                                                                        cursor: 'pointer',
                                                                        outline: 'none'
                                                                    }}
                                                                >
                                                                    <option value="">Select an option...</option>
                                                                    {element.options.map((opt, optIdx) => (
                                                                        <option key={optIdx} value={opt}>{opt}</option>
                                                                    ))}
                                                                </select>
                                                                {isCorrect && answer && (
                                                                    <div style={{
                                                                        marginTop: '0.5rem',
                                                                        color: '#16a34a',
                                                                        fontSize: '0.8rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.25rem'
                                                                    }}>
                                                                        <span>✓</span> Correct!
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div style={{
                                                textAlign: 'center',
                                                color: '#64748b',
                                                padding: '3rem'
                                            }}>
                                                📊 Interactive flowchart will be displayed here
                                            </div>
                                        )}
                                    </div>
                                ) : q.type === 'cloze' ? (
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '2rem',
                                        borderRadius: '12px',
                                        border: '2px solid #e2e8f0',
                                        lineHeight: 2,
                                        fontSize: '1.1rem',
                                        color: '#334155'
                                    }}>
                                        {q.clozeText?.split(/(\{\{\d+\}\})/).map((part, idx) => {
                                            const match = part.match(/^\{\{(\d+)\}\}$/);
                                            if (match) {
                                                const blankId = match[1];
                                                const element = q.clozeElements?.find(e => e.id === blankId);
                                                if (!element) return null;

                                                const answer = clozeAnswers[q.id]?.[blankId] || '';
                                                const isCorrect = answer === element.correctAnswer;

                                                return (
                                                    <span key={idx} style={{ display: 'inline-block', margin: '0 0.25rem' }}>
                                                        <select
                                                            value={answer}
                                                            onChange={(e) => handleClozeAnswer(q.id, blankId, e.target.value)}
                                                            style={{
                                                                padding: '0.25rem 0.75rem',
                                                                borderRadius: '6px',
                                                                border: `2px solid ${isCorrect && answer ? '#22c55e' : '#cbd5e1'}`,
                                                                background: isCorrect && answer ? '#f0fdf4' : 'white',
                                                                color: '#1e293b',
                                                                fontWeight: 600,
                                                                fontSize: '1rem',
                                                                cursor: 'pointer',
                                                                outline: 'none',
                                                                minWidth: '120px'
                                                            }}
                                                        >
                                                            <option value="">Select...</option>
                                                            {element.options.map((opt, i) => (
                                                                <option key={i} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                        {isCorrect && answer && (
                                                            <span style={{
                                                                color: '#22c55e',
                                                                marginLeft: '0.25rem',
                                                                fontWeight: 'bold'
                                                            }}>✓</span>
                                                        )}
                                                    </span>
                                                );
                                            }
                                            return <span key={idx}>{part}</span>;
                                        })}
                                    </div>
                                ) : q.type === 'matrix' ? (
                                    <div style={{
                                        background: '#fff7ed',
                                        padding: '1.5rem',
                                        borderRadius: '12px',
                                        border: '2px solid #fed7aa'
                                    }}>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid #fed7aa', color: '#9a3412' }}>Option</th>
                                                        {q.matrixColumns?.map(col => (
                                                            <th key={col.id} style={{ padding: '1rem', borderBottom: '2px solid #fed7aa', color: '#9a3412', textAlign: 'center' }}>{col.label}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {q.matrixRows?.map((row, rowIdx) => (
                                                        <tr key={row.id} style={{ background: rowIdx % 2 === 0 ? 'rgba(255,255,255,0.5)' : 'transparent' }}>
                                                            <td style={{ padding: '1rem', borderBottom: '1px solid #fed7aa', color: '#431407', fontWeight: 500 }}>{row.text}</td>
                                                            {q.matrixColumns?.map(col => {
                                                                const isSelected = matrixAnswers[q.id]?.[row.id] === col.id;
                                                                const isCorrect = row.correctColumnId === col.id;

                                                                return (
                                                                    <td key={col.id} style={{ textAlign: 'center', padding: '1rem', borderBottom: '1px solid #fed7aa' }}>
                                                                        <div
                                                                            onClick={() => handleMatrixAnswer(q.id, row.id, col.id)}
                                                                            style={{
                                                                                width: '24px',
                                                                                height: '24px',
                                                                                borderRadius: '50%',
                                                                                border: isSelected ? (isCorrect ? '2px solid #22c55e' : '2px solid #ef4444') : '2px solid #cbd5e1',
                                                                                margin: '0 auto',
                                                                                cursor: 'pointer',
                                                                                background: isSelected ? (isCorrect ? '#22c55e' : '#ef4444') : 'white',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                color: 'white',
                                                                                fontSize: '0.8rem',
                                                                                transition: 'all 0.2s'
                                                                            }}
                                                                        >
                                                                            {isSelected && (isCorrect ? '✓' : '✕')}
                                                                        </div>
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : q.type === 'ordering' ? (
                                    <OrderingQuestion
                                        question={q}
                                        onAnswer={(order) => handleOrderingAnswer(q.id, order)}
                                    />
                                ) : q.type === 'input' ? (
                                    <InputQuestion
                                        question={q}
                                        onAnswer={(val) => handleInputAnswer(q.id, val)}
                                    />
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {q.options.map((opt, idx) => (
                                            <label key={idx} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                padding: '1rem',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                            >
                                                <input
                                                    type={q.type === 'single' ? 'radio' : 'checkbox'}
                                                    name={`q-${q.id}`}
                                                    style={{ width: '18px', height: '18px' }}
                                                />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                <RevealAnswer
                                    rationale={q.rationale}
                                    exhibits={q.exhibits}
                                    exhibitContent={q.exhibitContent}
                                />
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                    {blogs.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No blogs available.</p>
                    ) : (
                        blogs.map(blog => (
                            <article key={blog.id} style={{
                                background: 'white',
                                color: '#1e293b',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)'
                            }}>
                                {blog.image_url && (
                                    <div style={{ width: '100%', height: '400px', overflow: 'hidden' }}>
                                        <img src={blog.image_url} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <div style={{ padding: '3.5rem' }}>
                                    <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
                                        <h1 style={{ fontSize: '2.8rem', fontWeight: 850, marginBottom: '0.75rem', lineHeight: 1.1, color: '#0f172a' }}>{blog.title}</h1>
                                        <div style={{ display: 'flex', gap: '1rem', color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
                                            <span>By {blog.author}</span>
                                            <span>•</span>
                                            <span>{blog.date}</span>
                                        </div>
                                    </header>
                                    <div style={{ lineHeight: 1.8, fontSize: '1.2rem', color: '#334155' }}>
                                        {blog.content.split('\n').map((line, i) => {
                                            if (line.trim().startsWith('![Image](')) {
                                                const imgUrl = line.match(/\((.*?)\)/)?.[1];
                                                return imgUrl ? <img key={i} src={imgUrl} style={{ width: '100%', borderRadius: '12px', margin: '2.5rem 0', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} alt="" /> : null;
                                            }
                                            return line.trim() ? <p key={i} style={{ marginBottom: '1.8rem' }}>{line}</p> : null;
                                        })}
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
