-- Migration: Add collaboration features
-- Date: 2025-07-30
-- Description: Adds tables for sharing, permissions, comments, and real-time collaboration

-- 1. Create shares table for managing access permissions
CREATE TABLE IF NOT EXISTS public.shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('contract', 'template', 'folder', 'template_folder')),
    resource_id UUID NOT NULL,
    shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(resource_type, resource_id, shared_with)
);

-- 2. Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('contract', 'template')),
    resource_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    selection_start INTEGER,
    selection_end INTEGER,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create document_changes table for tracking edits
CREATE TABLE IF NOT EXISTS public.document_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('contract', 'template')),
    resource_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL CHECK (change_type IN ('edit', 'comment', 'share', 'analysis', 'resolve_risk')),
    before_content TEXT,
    after_content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create presence table for real-time collaboration
CREATE TABLE IF NOT EXISTS public.presence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('contract', 'template')),
    resource_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cursor_position INTEGER,
    selection JSONB,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(resource_type, resource_id, user_id)
);

-- 5. Create access_requests table
CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('contract', 'template', 'folder', 'template_folder')),
    resource_id UUID NOT NULL,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_permission TEXT NOT NULL CHECK (requested_permission IN ('view', 'edit')),
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(resource_type, resource_id, requester_id)
);

-- 6. Add collaboration metadata to users (extend profiles)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS collaboration_color TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shares_resource ON public.shares(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_shares_shared_with ON public.shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_shares_shared_by ON public.shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_comments_resource ON public.comments(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_document_changes_resource ON public.document_changes(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_document_changes_user ON public.document_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_document_changes_created ON public.document_changes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presence_resource ON public.presence(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON public.presence(last_seen);
CREATE INDEX IF NOT EXISTS idx_access_requests_requester ON public.access_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_owner ON public.access_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);

-- Create updated_at triggers
CREATE TRIGGER set_shares_updated_at BEFORE UPDATE ON public.shares
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_comments_updated_at BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_access_requests_updated_at BEFORE UPDATE ON public.access_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shares table
CREATE POLICY "Users can view shares where they are involved" ON public.shares
    FOR SELECT USING (auth.uid() = shared_by OR auth.uid() = shared_with);

CREATE POLICY "Users can create shares for their own resources" ON public.shares
    FOR INSERT WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can update their own shares" ON public.shares
    FOR UPDATE USING (auth.uid() = shared_by);

CREATE POLICY "Users can delete their own shares" ON public.shares
    FOR DELETE USING (auth.uid() = shared_by);

-- RLS Policies for comments table
CREATE POLICY "Users can view comments on shared resources" ON public.comments
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.shares
            WHERE shares.resource_type = comments.resource_type
            AND shares.resource_id = comments.resource_id
            AND shares.shared_with = auth.uid()
        )
    );

CREATE POLICY "Users can create comments on shared resources" ON public.comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND (
            -- User owns the resource
            EXISTS (
                SELECT 1 FROM public.contracts
                WHERE contracts.id = comments.resource_id
                AND contracts.user_id = auth.uid()
                AND comments.resource_type = 'contract'
            ) OR
            EXISTS (
                SELECT 1 FROM public.templates
                WHERE templates.id = comments.resource_id
                AND templates.user_id = auth.uid()
                AND comments.resource_type = 'template'
            ) OR
            -- User has access to the resource
            EXISTS (
                SELECT 1 FROM public.shares
                WHERE shares.resource_type = comments.resource_type
                AND shares.resource_id = comments.resource_id
                AND shares.shared_with = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for document_changes table
CREATE POLICY "Users can view changes on shared resources" ON public.document_changes
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.shares
            WHERE shares.resource_type = document_changes.resource_type
            AND shares.resource_id = document_changes.resource_id
            AND shares.shared_with = auth.uid()
        )
    );

CREATE POLICY "Users can create change records for their actions" ON public.document_changes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for presence table
CREATE POLICY "Users can view presence on shared resources" ON public.presence
    FOR ALL USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.shares
            WHERE shares.resource_type = presence.resource_type
            AND shares.resource_id = presence.resource_id
            AND shares.shared_with = auth.uid()
        )
    );

-- RLS Policies for access_requests table
CREATE POLICY "Users can view their own requests" ON public.access_requests
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create access requests" ON public.access_requests
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Owners can update access requests" ON public.access_requests
    FOR UPDATE USING (auth.uid() = owner_id);

-- Function to get user's collaboration color
CREATE OR REPLACE FUNCTION public.get_user_collaboration_color(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    color TEXT;
    color_index INTEGER;
    colors TEXT[] := ARRAY[
        '#3B82F6', -- Blue
        '#10B981', -- Green
        '#F59E0B', -- Amber
        '#EF4444', -- Red
        '#8B5CF6', -- Purple
        '#EC4899', -- Pink
        '#14B8A6', -- Teal
        '#F97316'  -- Orange
    ];
BEGIN
    -- Get existing color or assign new one
    SELECT collaboration_color INTO color
    FROM public.profiles
    WHERE id = user_id;
    
    IF color IS NULL THEN
        -- Assign color based on user creation order
        SELECT COUNT(*) % 8 + 1 INTO color_index
        FROM public.profiles
        WHERE id <= user_id;
        
        color := colors[color_index];
        
        -- Update profile with assigned color
        UPDATE public.profiles
        SET collaboration_color = color
        WHERE id = user_id;
    END IF;
    
    RETURN color;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to resource
CREATE OR REPLACE FUNCTION public.check_resource_access(
    p_user_id UUID,
    p_resource_type TEXT,
    p_resource_id UUID,
    p_required_permission TEXT DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user owns the resource
    IF p_resource_type = 'contract' THEN
        IF EXISTS (
            SELECT 1 FROM public.contracts
            WHERE id = p_resource_id AND user_id = p_user_id
        ) THEN
            RETURN TRUE;
        END IF;
    ELSIF p_resource_type = 'template' THEN
        IF EXISTS (
            SELECT 1 FROM public.templates
            WHERE id = p_resource_id AND user_id = p_user_id
        ) THEN
            RETURN TRUE;
        END IF;
    ELSIF p_resource_type = 'folder' THEN
        IF EXISTS (
            SELECT 1 FROM public.folders
            WHERE id = p_resource_id AND user_id = p_user_id
        ) THEN
            RETURN TRUE;
        END IF;
    ELSIF p_resource_type = 'template_folder' THEN
        IF EXISTS (
            SELECT 1 FROM public.template_folders
            WHERE id = p_resource_id AND user_id = p_user_id
        ) THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    -- Check if user has been granted access
    IF p_required_permission = 'view' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.shares
            WHERE resource_type = p_resource_type
            AND resource_id = p_resource_id
            AND shared_with = p_user_id
            AND permission IN ('view', 'edit', 'admin')
        );
    ELSIF p_required_permission = 'edit' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.shares
            WHERE resource_type = p_resource_type
            AND resource_id = p_resource_id
            AND shared_with = p_user_id
            AND permission IN ('edit', 'admin')
        );
    ELSIF p_required_permission = 'admin' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.shares
            WHERE resource_type = p_resource_type
            AND resource_id = p_resource_id
            AND shared_with = p_user_id
            AND permission = 'admin'
        );
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update profiles when new user is created
CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET 
        email = NEW.email,
        display_name = COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for syncing user profile
DROP TRIGGER IF EXISTS sync_user_profile_trigger ON auth.users;
CREATE TRIGGER sync_user_profile_trigger
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_user_profile();

-- Enable realtime for collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.shares;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.presence;