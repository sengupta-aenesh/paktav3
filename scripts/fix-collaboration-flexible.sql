-- Flexible collaboration fix that checks existing columns

-- 1. First, let's see what we're working with
DO $$ 
DECLARE
    has_requester_id boolean;
    has_requested_by boolean;
    has_owner_id boolean;
    has_resource_owner boolean;
BEGIN
    -- Check which columns exist in access_requests
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'access_requests' AND column_name = 'requester_id'
    ) INTO has_requester_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'access_requests' AND column_name = 'requested_by'
    ) INTO has_requested_by;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'access_requests' AND column_name = 'owner_id'
    ) INTO has_owner_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'access_requests' AND column_name = 'resource_owner'
    ) INTO has_resource_owner;
    
    -- Rename columns if needed
    IF has_requester_id AND NOT has_requested_by THEN
        ALTER TABLE access_requests RENAME COLUMN requester_id TO requested_by;
        RAISE NOTICE 'Renamed requester_id to requested_by';
    END IF;
    
    IF has_owner_id AND NOT has_resource_owner THEN
        ALTER TABLE access_requests RENAME COLUMN owner_id TO resource_owner;
        RAISE NOTICE 'Renamed owner_id to resource_owner';
    END IF;
    
    -- If neither owner column exists, add it
    IF NOT has_owner_id AND NOT has_resource_owner THEN
        ALTER TABLE access_requests ADD COLUMN resource_owner UUID;
        RAISE NOTICE 'Added resource_owner column';
    END IF;
    
    -- If neither requester column exists, add it
    IF NOT has_requester_id AND NOT has_requested_by THEN
        ALTER TABLE access_requests ADD COLUMN requested_by UUID;
        RAISE NOTICE 'Added requested_by column';
    END IF;
END $$;

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

-- 4. Ensure shares table exists with correct structure
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

-- 6. Enable RLS
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- 7. Create flexible policies that work with the actual column names
DO $$ 
BEGIN
    -- Drop old policies
    DROP POLICY IF EXISTS "Users can manage their own shares" ON shares;
    DROP POLICY IF EXISTS "Users can view their requests" ON access_requests;
    DROP POLICY IF EXISTS "Users can create requests" ON access_requests;
    
    -- Create shares policy
    CREATE POLICY "Users can manage their own shares" ON shares
      FOR ALL USING (auth.uid() = shared_by OR auth.uid() = shared_with);
    
    -- Create access_requests policies only if columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'access_requests' 
        AND column_name IN ('requested_by', 'resource_owner')
    ) THEN
        CREATE POLICY "Users can view their requests" ON access_requests
          FOR SELECT USING (
            auth.uid() = requested_by OR 
            auth.uid() = resource_owner OR
            auth.uid()::text IN (
                SELECT user_id::text FROM contracts WHERE id = resource_id
                UNION
                SELECT user_id::text FROM templates WHERE id = resource_id
            )
          );
          
        CREATE POLICY "Users can create requests" ON access_requests
          FOR INSERT WITH CHECK (auth.uid() = requested_by);
    ELSE
        -- Fallback policy if columns don't exist
        CREATE POLICY "Users can view all requests" ON access_requests
          FOR SELECT USING (true);
    END IF;
END $$;

-- 8. Show current structure
SELECT 
    'Access Requests Table Structure:' as info,
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'access_requests'
ORDER BY ordinal_position;

-- Done
SELECT 'Collaboration tables setup completed!' as message;