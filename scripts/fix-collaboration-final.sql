-- Fix collaboration tables with correct column renames

-- 1. Rename columns in access_requests to match the code
ALTER TABLE access_requests RENAME COLUMN requester_id TO requested_by;
ALTER TABLE access_requests RENAME COLUMN owner_id TO resource_owner;

-- 2. Ensure profiles have collaboration_color
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS collaboration_color TEXT;

-- 3. Update profiles with default colors
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

-- 4. Create shares table
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

-- 5. Create comments table
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

-- 6. Create document_changes table
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

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_shares_resource ON shares(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_shares_shared_with ON shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_shares_shared_by ON shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_access_requests_requested_by ON access_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_access_requests_resource_owner ON access_requests(resource_owner);
CREATE INDEX IF NOT EXISTS idx_comments_resource ON comments(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_document_changes_resource ON document_changes(resource_type, resource_id);

-- 8. Enable RLS on all tables
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_changes ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies

-- Shares policies
DROP POLICY IF EXISTS "Users can manage their own shares" ON shares;
CREATE POLICY "Users can view shares" ON shares
  FOR SELECT USING (auth.uid() = shared_by OR auth.uid() = shared_with);

CREATE POLICY "Users can create shares" ON shares
  FOR INSERT WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can update shares" ON shares
  FOR UPDATE USING (auth.uid() = shared_by);

CREATE POLICY "Users can delete shares" ON shares
  FOR DELETE USING (auth.uid() = shared_by);

-- Access requests policies
DROP POLICY IF EXISTS "Users can view their requests" ON access_requests;
CREATE POLICY "Users can view requests" ON access_requests
  FOR SELECT USING (auth.uid() = requested_by OR auth.uid() = resource_owner);

DROP POLICY IF EXISTS "Users can create requests" ON access_requests;
CREATE POLICY "Users can create requests" ON access_requests
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Owners can update requests" ON access_requests
  FOR UPDATE USING (auth.uid() = resource_owner);

-- Comments policies
CREATE POLICY "Users can view comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Document changes policies
CREATE POLICY "Users can view changes" ON document_changes
  FOR SELECT USING (true);

CREATE POLICY "Users can create changes" ON document_changes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. Grant permissions
GRANT ALL ON shares TO authenticated;
GRANT ALL ON access_requests TO authenticated;
GRANT ALL ON comments TO authenticated;
GRANT ALL ON document_changes TO authenticated;

-- Done!
SELECT 'Collaboration setup completed successfully!' as message;