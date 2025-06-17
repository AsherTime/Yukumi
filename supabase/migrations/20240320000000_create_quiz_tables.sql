-- Create enum for quiz status
CREATE TYPE quiz_status AS ENUM ('not_started', 'in_progress', 'completed');

-- Create table for user quiz progress
CREATE TABLE user_quiz_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status quiz_status DEFAULT 'not_started',
    current_step INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create table for user preferences
CREATE TABLE user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    preference_type TEXT NOT NULL, -- 'community', 'category', 'anime', 'rating'
    preference_key TEXT NOT NULL,  -- The ID or name of the preference
    preference_value JSONB,        -- Flexible storage for any additional data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create RLS policies
ALTER TABLE user_quiz_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own quiz progress"
    ON user_quiz_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz progress"
    ON user_quiz_progress FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz progress"
    ON user_quiz_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences"
    ON user_preferences FOR ALL
    USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_type ON user_preferences(preference_type);
CREATE INDEX idx_user_quiz_progress_user_id ON user_quiz_progress(user_id); 