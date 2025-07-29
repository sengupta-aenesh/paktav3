# Collaboration Features - Fix Guide

## Issues Identified and Fixed

### 1. API Route Errors (500 & 404)

**Fixed in Code:**
- Updated share modal to use collaboration API instead of direct fetch
- Fixed foreign key relationships in API routes
- Added manual profile fetching to avoid Supabase join issues

### 2. Database Issues

**Action Required by User:**

Please run this SQL in your Supabase SQL Editor:

```sql
-- Ensure profiles have collaboration color
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS collaboration_color TEXT;

-- Create shares table if it doesn't exist
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shares_resource ON shares(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_shares_shared_with ON shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_shares_shared_by ON shares(shared_by);

-- Enable RLS
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policy
CREATE POLICY "Users can manage their own shares" ON shares
  FOR ALL USING (
    auth.uid() = shared_by OR 
    auth.uid() = shared_with
  );

-- Create access_requests table
CREATE TABLE IF NOT EXISTS access_requests (
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view their requests" ON access_requests
  FOR SELECT USING (auth.uid() = requested_by OR auth.uid() = resource_owner);

CREATE POLICY "Users can create requests" ON access_requests
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID,
  selection_start INTEGER,
  selection_end INTEGER,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create basic policy
CREATE POLICY "Users can view comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create document_changes table
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

-- Enable RLS
ALTER TABLE document_changes ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view changes" ON document_changes
  FOR SELECT USING (true);
```

## After Running SQL

1. **Refresh the page** - The errors should be gone
2. **Test sharing** - Try sharing a contract/template
3. **Check collaboration dashboard** - Should now load without errors

## What Was Fixed

1. **Share Modal** - Now uses collaboration API consistently
2. **API Routes** - Fixed foreign key joins by fetching profiles manually
3. **Database Schema** - Added missing tables and columns
4. **RLS Policies** - Added basic policies for all tables

## Testing Steps

1. Go to your main dashboard
2. Hover over a contract/template
3. Click the share button
4. Enter an email and select permission
5. Click Share
6. Go to Collaboration dashboard to see shared items

The collaboration features should now work properly!