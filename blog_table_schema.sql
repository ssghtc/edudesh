-- SQL Schema for Website Frontend Blog Display
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS blogs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,                  -- Main heading of the post
    content TEXT NOT NULL,                -- The body text (supports newline/markdown)
    author TEXT NOT NULL DEFAULT 'Admin', -- Name of the writer
    date TEXT NOT NULL,                   -- Display date (e.g., '10/03/2026')
    image_url TEXT,                       -- Featured image link (for thumbnails)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (Essential for your website frontend)
CREATE POLICY "Allow public read access" ON blogs
    FOR SELECT USING (true);

-- Allow authenticated insert/update/delete (For your Admin Dashboard)
CREATE POLICY "Allow admin full access" ON blogs
    FOR ALL USING (true);

-- Indexes for performance (Helps website load faster)
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);
