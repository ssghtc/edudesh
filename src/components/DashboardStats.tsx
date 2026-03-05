import React, { useState, useEffect } from 'react';
import { Question, Blog, Subject } from '@/types';

interface DashboardStatsProps {
    questions: Question[];
    questionCount?: number; // Optional override for total count (used when questions aren't fully loaded)
    blogs: Blog[];
    subjects: Subject[];
    studentCount: number;
}

export default function DashboardStats({ questions, questionCount, blogs, subjects, studentCount }: DashboardStatsProps) {
    const totalQuestionsDisplay = questionCount ?? questions.length;
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const stats = [
        {
            label: 'Total Questions',
            value: totalQuestionsDisplay,
            trend: '+12% this week',
            color: '#818cf8',
            gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            icon: (
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                    <circle cx="12" cy="12" r="10" />
                </svg>
            )
        },
        {
            label: 'Active Students',
            value: studentCount.toLocaleString(),
            trend: '+5.4% growth',
            color: '#34d399',
            gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
            icon: (
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            )
        },
        {
            label: 'Total Blogs',
            value: blogs.length,
            trend: '2 new today',
            color: '#f472b6',
            gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
            icon: (
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
            )
        },
        {
            label: 'System Health',
            value: '99.9%',
            trend: 'All systems go',
            color: '#fbbf24',
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
            icon: (
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
            )
        },
    ];

    const typeDistribution = [
        { label: 'Single Choice', count: questions.filter(q => q.type === 'single').length, color: '#38bdf8' },
        { label: 'Multiple Choice', count: questions.filter(q => q.type === 'multiple').length, color: '#a855f7' },
        { label: 'Clinical', count: questions.filter(q => ['sentence_completion', 'drag_drop_priority', 'compare_classify', 'expected_not_expected', 'indicated_not_indicated', 'sata', 'priority_action', 'case_study'].includes(q.type)).length, color: '#f43f5e' },
        { label: 'Others', count: questions.filter(q => !['single', 'multiple', 'sentence_completion', 'drag_drop_priority', 'compare_classify', 'expected_not_expected', 'indicated_not_indicated', 'sata', 'priority_action', 'case_study'].includes(q.type)).length, color: '#94a3b8' },
    ];

    const totalQuestions = questions.length || 1;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '2.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                paddingBottom: '2rem'
            }}>
                <div>
                    <h2 style={{ fontSize: '2.75rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-1px' }} className="text-gradient">
                        Analytics Overview
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        Welcome back, Administrator. Exploring your knowledge base today.
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white' }}>
                        {isMounted ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </div>
                    <div style={{ color: 'var(--text-accent)', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>
                        {isMounted ? currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) : 'Loading...'}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1.5rem',
                marginBottom: '2.5rem'
            }}>
                {stats.map((stat, index) => (
                    <div key={index} style={{
                        background: 'var(--bg-card)',
                        padding: '1.75rem',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.border = `1px solid ${stat.color}40`;
                            e.currentTarget.style.boxShadow = `0 20px 40px ${stat.color}15`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.border = '1px solid rgba(255,255,255,0.05)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '16px',
                            background: stat.gradient,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '1.5rem',
                            boxShadow: `0 8px 16px ${stat.color}30`
                        }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'white', marginBottom: '0.5rem' }}>{stat.value}</h3>
                            <span style={{
                                fontSize: '0.75rem',
                                color: stat.color,
                                background: `${stat.color}15`,
                                padding: '0.25rem 0.6rem',
                                borderRadius: '100px',
                                fontWeight: '700'
                            }}>
                                {stat.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }}>
                {/* Left Column: Visual Analytics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Activity Chart Mock */}
                    <div style={{
                        background: 'var(--bg-card)',
                        padding: '2rem',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        minHeight: '400px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>Question Bank Activity</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Overview of content creation over time</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {['Day', 'Week', 'Month'].map(t => (
                                    <button key={t} style={{
                                        padding: '0.4rem 0.8rem',
                                        background: t === 'Week' ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}>{t}</button>
                                ))}
                            </div>
                        </div>

                        {/* CSS Bar Chart */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            padding: '0 1rem'
                        }}>
                            {[40, 70, 45, 90, 65, 80, 55, 75, 50, 85, 60, 95].map((h, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '100%',
                                        height: `${h}%`,
                                        background: i === 11 ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                                        borderRadius: '8px 8px 0 0',
                                        transition: 'all 0.5s ease-out',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--gradient-hover)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (i !== 11) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                            else e.currentTarget.style.background = 'var(--gradient-primary)';
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            top: '-30px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            padding: '2px 6px',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem',
                                            color: 'white',
                                            opacity: 0,
                                            transition: 'opacity 0.2s'
                                        }} className="chart-tooltip">{Math.round(h * 1.5)}</div>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                                        {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Distribution & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Content Distribution */}
                    <div style={{
                        background: 'var(--bg-card)',
                        padding: '2rem',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', marginBottom: '1.5rem' }}>Content Distribution</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {typeDistribution.map((item, idx) => {
                                const percentage = (item.count / totalQuestions) * 100;
                                return (
                                    <div key={idx}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{item.label}</span>
                                            <span style={{ color: 'white', fontWeight: '700' }}>{item.count} items</span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${percentage}%`,
                                                height: '100%',
                                                background: item.color,
                                                borderRadius: '100px',
                                                transition: 'width 1s ease-out'
                                            }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Launch */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                        padding: '2rem',
                        borderRadius: '24px',
                        border: '1px solid rgba(168, 85, 247, 0.2)'
                    }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', marginBottom: '1.5rem' }}>Quick Launch</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button className="btn" style={{
                                background: 'rgba(255,255,255,0.05)',
                                flexDirection: 'column',
                                height: '100px',
                                gap: '0.75rem',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>➕</span>
                                <span style={{ fontSize: '0.85rem' }}>New Question</span>
                            </button>
                            <button className="btn" style={{
                                background: 'rgba(255,255,255,0.05)',
                                flexDirection: 'column',
                                height: '100px',
                                gap: '0.75rem',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>📝</span>
                                <span style={{ fontSize: '0.85rem' }}>New Blog</span>
                            </button>
                            <button className="btn" style={{
                                background: 'rgba(255,255,255,0.05)',
                                flexDirection: 'column',
                                height: '100px',
                                gap: '0.75rem',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>🎓</span>
                                <span style={{ fontSize: '0.85rem' }}>Enroll Student</span>
                            </button>
                            <button className="btn" style={{
                                background: 'rgba(255,255,255,0.05)',
                                flexDirection: 'column',
                                height: '100px',
                                gap: '0.75rem',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>⚙️</span>
                                <span style={{ fontSize: '0.85rem' }}>Settings</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .btn:hover {
                    background: rgba(255,255,255,0.1) !important;
                    border-color: rgba(255,255,255,0.2) !important;
                    transform: scale(1.02);
                }
            `}</style>
        </div>
    );
}
