-- Fix collaboration tables with correct column names

-- First, ensure the profiles table has collaboration_color
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS collaboration_color TEXT;

-- Update existing profiles with default colors if null
UPDATE profiles 
SET collaboration_color = 
  CASE (EXTRACT(EPOCH FROM created_at)::INTEGER % 8)
    WHEN 0 THEN '#FF6B6B'
    WHEN 1 THEN '#4ECDC4'
    WHEN 2 THEN '#45B7D1'
    WHEN 3 THEN '#96CEB4'
    WHEN 4 THEN '#FECA57'
    WHEN 5 THEN '#FF9FF3'
    WHEN 6 THEN '#54A0FF'
    WHEN 7 THEN '#48DBFB'
  END
WHERE collaboration_color IS NULL;

-- Check if shares table exists and create if not
CREATE TABLE IF NOT EXISTS shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  shared_by UUID NOT NULL,
  shared_with UUID NOT NULL,
  permission TEXT NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(resource_type, resource_id, shared_with)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shares_resource ON shares(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_shares_shared_with ON shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_shares_shared_by ON shares(shared_by);

-- Enable RLS
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can manage their own shares" ON shares;
CREATE POLICY "Users can manage their own shares" ON shares
  FOR ALL USING (
    auth.uid() = shared_by OR 
    auth.uid() = shared_with
  );

-- Fix access_requests table - check if it exists first
DO $$ 
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'access_requests') THEN
        -- Check which column exists
        IF EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'access_requests' AND column_name = 'requester_id') THEN
            -- Rename column to match our code
            ALTER TABLE access_requests RENAME COLUMN requester_id TO requested_by;
        END IF;
    ELSE
        -- Create table with correct column names
        CREATE TABLE access_requests (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            resource_type TEXT NOT NULL,
            resource_id UUID NOT NULL,
            resource_owner UUID NOT NULL,
            requested_by UUID NOT NULL,
            requested_permission TEXT NOT NULL,
            message TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            responded_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(resource_type, resource_id, requested_by)
        );
    END IF;
END $$;

-- Enable RLS on access_requests
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies with correct column names
DROP POLICY IF EXISTS "Users can view their requests" ON access_requests;
CREATE POLICY "Users can view their requests" ON access_requests
  FOR SELECT USING (auth.uid() = requested_by OR auth.uid() = resource_owner);

DROP POLICY IF EXISTS "Users can create requests" ON access_requests;
CREATE POLICY "Users can create requests" ON access_requests
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

DROP POLICY IF EXISTS "Resource owners can update requests" ON access_requests;
CREATE POLICY "Resource owners can update requests" ON access_requests
  FOR UPDATE USING (auth.uid() = resource_owner);

-- Create comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  selection_start INTEGER,
  selection_end INTEGER,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_comments_resource ON comments(resource_type, resource_id);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view comments" ON comments;
CREATE POLICY "Users can view comments" ON comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create document_changes table if it doesn't exist
CREATE TABLE IF NOT EXISTS document_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  user_id UUID NOT NULL,
  change_type TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  character_count_change INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_document_changes_resource ON document_changes(resource_type, resource_id);

-- Enable RLS
ALTER TABLE document_changes ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy
DROP POLICY IF EXISTS "Users can view changes" ON document_changes;
CREATE POLICY "Users can view changes" ON document_changes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create changes" ON document_changes;
CREATE POLICY "Users can create changes" ON document_changes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON shares TO authenticated;
GRANT ALL ON access_requests TO authenticated;
GRANT ALL ON comments TO authenticated;
GRANT ALL ON document_changes TO authenticated;

-- Final message
DO $$ 
BEGIN 
    RAISE NOTICE 'Collaboration tables setup completed successfully!';
END $$;