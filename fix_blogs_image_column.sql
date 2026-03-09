-- Run this script to fix the 'image_url' column error and add sample data

-- 1. Add the missing column if it doesn't exist
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Clear existing sample data to avoid duplicates (optional, based on preference)
-- DELETE FROM blogs WHERE author = 'Admin' OR author = 'Dr. Smith' OR author = 'Nurse Janie';

-- 3. Add diverse sample blog posts with the correct column
INSERT INTO blogs (title, content, author, date, image_url)
VALUES 
(
    '10 Tips for NCLEX Success',
    'Preparing for the NCLEX can be daunting. Here are our top 10 tips to help you succeed:
    1. Understand the Test Plan
    2. Focus on Clinical Judgment
    3. Practice with Realistic Questions
    4. Manage Your Time
    5. Stay Healthy and Rested
    6. Review Rationale for Every Question
    7. Dont Just Memorize - Understand!
    8. Master the New Next Gen Item Types
    9. Create a Study Schedule
    10. Believe in Yourself!',
    'Dr. Smith',
    TO_CHAR(NOW(), 'DD/MM/YYYY'),
    'https://images.unsplash.com/photo-1576091160550-217359f4ecf8?q=80&w=1470&auto=format&fit=crop'
),
(
    'Welcome to EduDash',
    'We are excited to launch EduDash, your personal learning companion. Stay tuned for more updates and educational content to help you succeed in your exams! Our platform offers interactive question types, detailed analytics, and a growing community of learners.',
    'Admin',
    TO_CHAR(NOW() - INTERVAL '1 day', 'DD/MM/YYYY'),
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1470&auto=format&fit=crop'
),
(
    'Understanding Clinical Judgment',
    'Clinical judgment is the cornerstone of nursing practice. In this post, we break down the 6 steps of the Clinical Judgment Measurement Model (CJMM):
    1. Recognize Cues
    2. Analyze Cues
    3. Prioritize Hypotheses
    4. Generate Solutions
    5. Take Action
    6. Evaluate Outcomes
    
    Mastering these steps is key to passing the Next Gen NCLEX.',
    'Nurse Janie',
    TO_CHAR(NOW() - INTERVAL '2 days', 'DD/MM/YYYY'),
    'https://images.unsplash.com/photo-1505751172676-43ad27a3f46f?q=80&w=1470&auto=format&fit=crop'
)
ON CONFLICT DO NOTHING;
