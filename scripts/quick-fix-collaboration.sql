-- Quick fix for collaboration tables

-- 1. Fix access_requests column name
ALTER TABLE access_requests 
RENAME COLUMN requester_id TO requested_by;

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

-- 4. Ensure shares table exists
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

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_shares_resource ON shares(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_shares_shared_with ON shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_shares_shared_by ON shares(shared_by);

-- 6. Enable RLS and create basic policies
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Shares policies
DROP POLICY IF EXISTS "Users can manage their own shares" ON shares;
CREATE POLICY "Users can manage their own shares" ON shares
  FOR ALL USING (auth.uid() = shared_by OR auth.uid() = shared_with);

-- Access requests policies
DROP POLICY IF EXISTS "Users can view their requests" ON access_requests;
CREATE POLICY "Users can view their requests" ON access_requests
  FOR SELECT USING (auth.uid() = requested_by OR auth.uid() = resource_owner);

DROP POLICY IF EXISTS "Users can create requests" ON access_requests;
CREATE POLICY "Users can create requests" ON access_requests
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- Done!
SELECT 'Collaboration tables fixed successfully!' as message;