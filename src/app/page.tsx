"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardStats from '@/components/DashboardStats';
import QuestionManager from '@/components/QuestionManager';
import BlogManager from '@/components/BlogManager';
import SubjectManager from '@/components/SubjectManager';
import PreviewSection from '@/components/PreviewSection';
import StudentManager from '@/components/StudentManager';
import ClinicalQuestionsManager from '@/components/ClinicalQuestionsManager';
import ComingSoon from '@/components/ComingSoon';
import { Question, Blog, Subject } from '@/types';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const [studentCount, setStudentCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0); // Fast COUNT for dashboard
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // On startup: fetch only lightweight data (counts + subjects). No heavy SELECT *.
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Lazy-load full question data only when Questions or Preview tab is opened
  useEffect(() => {
    if ((activeTab === 'questions' || activeTab === 'preview') && !questionsLoaded && !questionsLoading) {
      fetchAllQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fast COUNT for students (HEAD request - no rows transferred)
      const { count: sCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });
      if (sCount !== null) setStudentCount(sCount);

      // Fast COUNT for questions (HEAD request - instant even with 1306 rows)
      const { count: qCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });
      if (qCount !== null) setQuestionCount(qCount);

      // Subjects + chapters (small data, no timeout risk)
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*, chapters(*)');
      if (!subjectsError && subjectsData) setSubjects(subjectsData);

      // Blogs (usually small dataset)
      const { data: blogsData, error: blogsError } = await supabase
        .from('blogs')
        .select('*');
      if (!blogsError && blogsData) setBlogs(blogsData);

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatQuestion = (q: any): Question => ({
    ...q,
    subjectId: q.subject_id,
    chapterId: q.chapter_id,
    correctOptions: q.correct_options ?? [],
    options: q.options ?? [],
    clientNeeds: q.client_needs,
    customId: q.custom_id,
    exhibits: q.exhibits || [],
    exhibitContent: q.exhibit_content,
    diagramUrl: q.diagram_url,
    diagramType: q.diagram_type,
    diagramElements: q.diagram_elements,
    clozeText: q.cloze_text,
    clozeElements: q.cloze_elements,
    matrixColumns: q.matrix_columns,
    matrixRows: q.matrix_rows,
    orderingItems: q.ordering_items,
    correctOrder: q.correct_order,
    correctAnswerInput: q.correct_answer_input,
    answerTolerance: q.answer_tolerance,
    inputUnit: q.input_unit,
    rationale: q.rationale,
    scenario: q.scenario,
  });

  // Cursor-based pagination using id — avoids OFFSET timeout on large tables
  const fetchAllQuestions = async () => {
    setQuestionsLoading(true);
    const PAGE_SIZE = 500; // Small batches to stay within 5s Supabase timeout
    const all: Question[] = [];
    let lastId: string | null = null;
    let hasMore = true;

    try {
      while (hasMore) {
        let query = supabase
          .from('questions')
          .select('*')
          .order('id', { ascending: true })
          .limit(PAGE_SIZE);

        // Cursor: fetch only rows AFTER the last seen id (no OFFSET = no timeout)
        if (lastId) {
          query = query.gt('id', lastId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching questions batch:', JSON.stringify(error));
          break;
        }

        if (data && data.length > 0) {
          all.push(...data.map(formatQuestion));
          lastId = data[data.length - 1].id;
          hasMore = data.length === PAGE_SIZE;
        } else {
          hasMore = false;
        }
      }

      console.log(`✅ Loaded ${all.length} questions`);
      setQuestions(all);
      setQuestionCount(all.length);
      setQuestionsLoaded(true);
    } catch (err) {
      console.error('Unexpected error loading questions:', err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setQuestionsLoaded(false);
    await fetchDashboardData();
    if (activeTab === 'questions' || activeTab === 'preview') {
      await fetchAllQuestions();
    }
  };

  const loadingIndicator = (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
      <p>Loading questions from database...</p>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardStats
            questions={questions}
            questionCount={questionCount}
            blogs={blogs}
            subjects={subjects}
            studentCount={studentCount}
          />
        );
      case 'questions':
        return questionsLoading
          ? loadingIndicator
          : <QuestionManager questions={questions} setQuestions={setQuestions} subjects={subjects} onRefresh={handleRefresh} />;
      case 'clinical':
        return <ClinicalQuestionsManager />;
      case 'blogs':
        return <BlogManager blogs={blogs} setBlogs={setBlogs} />;
      case 'subjects':
        return <SubjectManager subjects={subjects} setSubjects={setSubjects} />;
      case 'students':
        return <StudentManager />;
      case 'webinars':
        return <ComingSoon title="Live Webinars" description="Schedule and manage live interactive sessions with your students." icon="🎥" />;
      case 'classes':
        return <ComingSoon title="Online Classes" description="Organize your virtual classroom. Manage schedules, attendance, and course materials." icon="🎓" />;
      case 'preview':
        return questionsLoading
          ? loadingIndicator
          : <PreviewSection questions={questions} blogs={blogs} />;
      default:
        return (
          <DashboardStats
            questions={questions}
            questionCount={questionCount}
            blogs={blogs}
            subjects={subjects}
            studentCount={studentCount}
          />
        );
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={{
        marginLeft: '280px',
        flex: 1,
        padding: '2rem',
        overflowY: 'auto',
        height: '100vh'
      }}>
        <div className="container">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
