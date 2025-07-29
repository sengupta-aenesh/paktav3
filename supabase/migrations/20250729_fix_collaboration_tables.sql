-- Fix collaboration tables and ensure all necessary columns exist

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

-- Ensure the shares table exists with all necessary columns
CREATE TABLE IF NOT EXISTS shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('contract', 'template', 'folder', 'template_folder')),
  resource_id UUID NOT NULL,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(resource_type, resource_id, shared_with)
);

-- Ensure the access_requests table exists
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('contract', 'template', 'folder', 'template_folder')),
  resource_id UUID NOT NULL,
  resource_owner UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_permission TEXT NOT NULL CHECK (requested_permission IN ('view', 'edit', 'admin')),
  message TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied')) DEFAULT 'pending',
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(resource_type, resource_id, requested_by)
);

-- Ensure the comments table exists
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('contract', 'template')),
  resource_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  selection_start INTEGER,
  selection_end INTEGER,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure the document_changes table exists
CREATE TABLE IF NOT EXISTS document_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('contract', 'template')),
  resource_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('content', 'metadata', 'analysis')),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  character_count_change INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shares_resource ON shares(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_shares_shared_with ON shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_shares_shared_by ON shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_access_requests_resource ON access_requests(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_requested_by ON access_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_comments_resource ON comments(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_document_changes_resource ON document_changes(resource_type, resource_id);

-- Enable RLS on all tables
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shares table
CREATE POLICY "Users can view shares they created or are part of" ON shares
  FOR SELECT USING (
    auth.uid() = shared_by OR 
    auth.uid() = shared_with OR
    EXISTS (
      SELECT 1 FROM shares s2 
      WHERE s2.resource_type = shares.resource_type 
      AND s2.resource_id = shares.resource_id 
      AND s2.shared_with = auth.uid()
    )
  );

CREATE POLICY "Users can create shares for resources they own" ON shares
  FOR INSERT WITH CHECK (
    auth.uid() = shared_by AND (
      (resource_type = 'contract' AND EXISTS (SELECT 1 FROM contracts WHERE id = resource_id AND user_id = auth.uid())) OR
      (resource_type = 'template' AND EXISTS (SELECT 1 FROM templates WHERE id = resource_id AND user_id = auth.uid())) OR
      (resource_type = 'folder' AND EXISTS (SELECT 1 FROM folders WHERE id = resource_id AND user_id = auth.uid())) OR
      (resource_type = 'template_folder' AND EXISTS (SELECT 1 FROM template_folders WHERE id = resource_id AND user_id = auth.uid()))
    )
  );

CREATE POLICY "Users can update shares they created" ON shares
  FOR UPDATE USING (auth.uid() = shared_by);

CREATE POLICY "Users can delete shares they created" ON shares
  FOR DELETE USING (auth.uid() = shared_by);

-- RLS Policies for access_requests table
CREATE POLICY "Users can view their own requests or requests for their resources" ON access_requests
  FOR SELECT USING (
    auth.uid() = requested_by OR 
    auth.uid() = resource_owner
  );

CREATE POLICY "Users can create access requests" ON access_requests
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Resource owners can update requests" ON access_requests
  FOR UPDATE USING (auth.uid() = resource_owner);

-- RLS Policies for comments table
CREATE POLICY "Users can view comments on accessible resources" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shares 
      WHERE shares.resource_type = comments.resource_type 
      AND shares.resource_id = comments.resource_id 
      AND shares.shared_with = auth.uid()
    ) OR (
      (resource_type = 'contract' AND EXISTS (SELECT 1 FROM contracts WHERE id = resource_id AND user_id = auth.uid())) OR
      (resource_type = 'template' AND EXISTS (SELECT 1 FROM templates WHERE id = resource_id AND user_id = auth.uid()))
    )
  );

CREATE POLICY "Users can create comments on accessible resources" ON comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shares 
      WHERE shares.resource_type = comments.resource_type 
      AND shares.resource_id = comments.resource_id 
      AND shares.shared_with = auth.uid()
      AND shares.permission IN ('edit', 'admin')
    ) OR (
      (resource_type = 'contract' AND EXISTS (SELECT 1 FROM contracts WHERE id = resource_id AND user_id = auth.uid())) OR
      (resource_type = 'template' AND EXISTS (SELECT 1 FROM templates WHERE id = resource_id AND user_id = auth.uid()))
    )
  );

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for document_changes table
CREATE POLICY "Users can view changes for accessible resources" ON document_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shares 
      WHERE shares.resource_type = document_changes.resource_type 
      AND shares.resource_id = document_changes.resource_id 
      AND shares.shared_with = auth.uid()
    ) OR (
      (resource_type = 'contract' AND EXISTS (SELECT 1 FROM contracts WHERE id = resource_id AND user_id = auth.uid())) OR
      (resource_type = 'template' AND EXISTS (SELECT 1 FROM templates WHERE id = resource_id AND user_id = auth.uid()))
    )
  );

CREATE POLICY "Users can create changes for resources they can edit" ON document_changes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (
        SELECT 1 FROM shares 
        WHERE shares.resource_type = document_changes.resource_type 
        AND shares.resource_id = document_changes.resource_id 
        AND shares.shared_with = auth.uid()
        AND shares.permission IN ('edit', 'admin')
      ) OR (
        (resource_type = 'contract' AND EXISTS (SELECT 1 FROM contracts WHERE id = resource_id AND user_id = auth.uid())) OR
        (resource_type = 'template' AND EXISTS (SELECT 1 FROM templates WHERE id = resource_id AND user_id = auth.uid()))
      )
    )
  );

-- Add foreign key constraints with proper names if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'shares_shared_by_fkey'
  ) THEN
    ALTER TABLE shares 
    ADD CONSTRAINT shares_shared_by_fkey 
    FOREIGN KEY (shared_by) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'shares_shared_with_fkey'
  ) THEN
    ALTER TABLE shares 
    ADD CONSTRAINT shares_shared_with_fkey 
    FOREIGN KEY (shared_with) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'comments_user_id_fkey'
  ) THEN
    ALTER TABLE comments 
    ADD CONSTRAINT comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;