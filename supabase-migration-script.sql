-- Contract Manager V2 - Complete Database Migration Script
-- Run this script in your new Supabase instance SQL editor
-- Make sure to run in order as there are dependencies between tables

-- ============================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- Create profiles table first (no dependencies)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    subscription_tier text NOT NULL DEFAULT 'pro'::text,
    subscription_status text NOT NULL DEFAULT 'active'::text,
    subscription_start_date timestamp with time zone DEFAULT now(),
    subscription_end_date timestamp with time zone,
    trial_end_date timestamp with time zone,
    stripe_customer_id text,
    stripe_subscription_id text,
    monthly_contract_count integer DEFAULT 0,
    last_contract_reset timestamp with time zone DEFAULT now(),
    onboarding_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    organization_type text,
    industry text,
    company_size text,
    primary_jurisdiction text DEFAULT 'United States'::text,
    additional_jurisdictions text[] DEFAULT '{}'::text[],
    regulatory_requirements text[] DEFAULT '{}'::text[],
    risk_tolerance text DEFAULT 'medium'::text,
    has_legal_counsel boolean DEFAULT false,
    legal_context jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    parent_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT folders_pkey PRIMARY KEY (id)
);

-- Create template_folders table  
CREATE TABLE IF NOT EXISTS public.template_folders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    parent_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT template_folders_pkey PRIMARY KEY (id)
);

-- Create contract_templates table
CREATE TABLE IF NOT EXISTS public.contract_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    type text NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    jurisdiction text DEFAULT 'US'::text,
    tags text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    search_vector tsvector,
    resolved_risks jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT contract_templates_pkey PRIMARY KEY (id)
);

-- Create contract_creation_sessions table
CREATE TABLE IF NOT EXISTS public.contract_creation_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    initial_request text NOT NULL,
    detected_type text,
    collected_parameters jsonb DEFAULT '{}'::jsonb,
    conversation_history jsonb DEFAULT '[]'::jsonb,
    agent_state jsonb DEFAULT '{}'::jsonb,
    generated_contract text,
    editable_fields jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'in_progress'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT contract_creation_sessions_pkey PRIMARY KEY (id)
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    content text,
    upload_url text,
    file_key text,
    analysis_cache jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    folder_id uuid,
    creation_session_id uuid,
    analysis_status text DEFAULT 'pending'::text,
    analysis_progress integer DEFAULT 0,
    last_analyzed_at timestamp with time zone,
    analysis_retry_count integer DEFAULT 0,
    analysis_error text,
    CONSTRAINT contracts_pkey PRIMARY KEY (id),
    CONSTRAINT check_analysis_progress CHECK (((analysis_progress >= 0) AND (analysis_progress <= 100))),
    CONSTRAINT check_analysis_status CHECK ((analysis_status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'summary_complete'::text, 'risks_complete'::text, 'complete'::text, 'failed'::text])))
);

-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    content text,
    upload_url text,
    file_key text,
    folder_id uuid,
    analysis_cache jsonb DEFAULT '{}'::jsonb,
    analysis_status text DEFAULT 'pending'::text,
    analysis_progress integer DEFAULT 0,
    last_analyzed_at timestamp with time zone,
    analysis_retry_count integer DEFAULT 0,
    analysis_error text,
    resolved_risks jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    user_created_variables jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT templates_pkey PRIMARY KEY (id),
    CONSTRAINT check_analysis_progress CHECK (((analysis_progress >= 0) AND (analysis_progress <= 100))),
    CONSTRAINT check_analysis_status CHECK ((analysis_status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'summary_complete'::text, 'risks_complete'::text, 'complete'::text, 'failed'::text])))
);

-- Create template_versions table
CREATE TABLE IF NOT EXISTS public.template_versions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    template_id uuid NOT NULL,
    version_name text NOT NULL,
    vendor_name text NOT NULL,
    version_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    generated_content text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by uuid NOT NULL,
    CONSTRAINT template_versions_pkey PRIMARY KEY (id)
);

-- Create contract_clauses table
CREATE TABLE IF NOT EXISTS public.contract_clauses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    clause_type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    tags text[],
    use_cases text[],
    created_at timestamp with time zone DEFAULT now(),
    search_vector tsvector,
    CONSTRAINT contract_clauses_pkey PRIMARY KEY (id)
);

-- Create contract_parameters table
CREATE TABLE IF NOT EXISTS public.contract_parameters (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    contract_type text NOT NULL,
    parameter_key text NOT NULL,
    parameter_label text NOT NULL,
    parameter_type text NOT NULL,
    is_required boolean DEFAULT true,
    validation_rules jsonb,
    help_text text,
    example_value text,
    options jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT contract_parameters_pkey PRIMARY KEY (id)
);

-- Create contract_sections table
CREATE TABLE IF NOT EXISTS public.contract_sections (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    template_id uuid,
    section_type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    variables jsonb DEFAULT '[]'::jsonb,
    order_index integer DEFAULT 0,
    is_optional boolean DEFAULT false,
    conditions jsonb,
    created_at timestamp with time zone DEFAULT now(),
    search_vector tsvector,
    CONSTRAINT contract_sections_pkey PRIMARY KEY (id)
);

-- ============================================
-- 3. ADD FOREIGN KEY CONSTRAINTS
-- ============================================

-- Add foreign key for folders self-reference
ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.folders(id) ON DELETE CASCADE;

-- Add foreign key for template_folders self-reference
ALTER TABLE ONLY public.template_folders
    ADD CONSTRAINT template_folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.template_folders(id) ON DELETE CASCADE;

-- Add foreign key for contracts to folders
ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE SET NULL;

-- Add foreign key for templates to template_folders
ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.template_folders(id) ON DELETE SET NULL;

-- Add foreign key for template_versions to templates
ALTER TABLE ONLY public.template_versions
    ADD CONSTRAINT template_versions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE CASCADE;

-- Add foreign key for contract_sections to contract_templates
ALTER TABLE ONLY public.contract_sections
    ADD CONSTRAINT contract_sections_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.contract_templates(id) ON DELETE CASCADE;

-- ============================================
-- 4. ADD UNIQUE CONSTRAINTS
-- ============================================

-- Add unique constraint for stripe_customer_id
ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_stripe_customer_id_key UNIQUE (stripe_customer_id);

-- ============================================
-- 5. CREATE INDEXES
-- ============================================

-- Indexes for contracts table
CREATE INDEX contracts_folder_id_idx ON public.contracts USING btree (folder_id);
CREATE INDEX idx_contracts_analysis_status ON public.contracts USING btree (analysis_status);
CREATE INDEX idx_contracts_created_at ON public.contracts USING btree (created_at DESC);
CREATE INDEX idx_contracts_last_analyzed ON public.contracts USING btree (last_analyzed_at);
CREATE INDEX idx_contracts_user_id ON public.contracts USING btree (user_id);

-- Indexes for folders table
CREATE INDEX folders_parent_id_idx ON public.folders USING btree (parent_id);
CREATE INDEX folders_user_id_idx ON public.folders USING btree (user_id);

-- Indexes for template_folders table
CREATE INDEX template_folders_parent_id_idx ON public.template_folders USING btree (parent_id);
CREATE INDEX template_folders_user_id_idx ON public.template_folders USING btree (user_id);

-- Indexes for templates table
CREATE INDEX templates_analysis_status_idx ON public.templates USING btree (analysis_status);
CREATE INDEX templates_folder_id_idx ON public.templates USING btree (folder_id);
CREATE INDEX templates_user_id_idx ON public.templates USING btree (user_id);

-- Indexes for template_versions table
CREATE INDEX template_versions_created_by_idx ON public.template_versions USING btree (created_by);
CREATE INDEX template_versions_template_id_idx ON public.template_versions USING btree (template_id);

-- Indexes for contract_templates table
CREATE INDEX idx_contract_templates_resolved_risks ON public.contract_templates USING gin (resolved_risks);
CREATE INDEX idx_contract_templates_tags ON public.contract_templates USING gin (tags);
CREATE INDEX idx_contract_templates_type ON public.contract_templates USING btree (type);

-- Indexes for contract_clauses table
CREATE INDEX idx_contract_clauses_tags ON public.contract_clauses USING gin (tags);
CREATE INDEX idx_contract_clauses_type ON public.contract_clauses USING btree (clause_type);

-- Indexes for contract_sections table
CREATE INDEX idx_contract_sections_template ON public.contract_sections USING btree (template_id);

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. CREATE RLS POLICIES
-- ============================================

-- Policies for contracts table
CREATE POLICY "Users can view own contracts" ON public.contracts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contracts" ON public.contracts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contracts" ON public.contracts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contracts" ON public.contracts
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for folders table
CREATE POLICY "Users can view their own folders" ON public.folders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" ON public.folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON public.folders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON public.folders
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for profiles table
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policies for template_folders table
CREATE POLICY "Users can view their own template folders" ON public.template_folders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own template folders" ON public.template_folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own template folders" ON public.template_folders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own template folders" ON public.template_folders
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for templates table
CREATE POLICY "Users can view their own templates" ON public.templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates" ON public.templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON public.templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON public.templates
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for template_versions table
CREATE POLICY "Users can view template versions for their templates" ON public.template_versions
    FOR SELECT USING (auth.uid() IN ( SELECT templates.user_id
       FROM templates
       WHERE (templates.id = template_versions.template_id)));

CREATE POLICY "Users can insert template versions for their templates" ON public.template_versions
    FOR INSERT WITH CHECK ((auth.uid() = created_by) AND (auth.uid() IN ( SELECT templates.user_id
       FROM templates
       WHERE (templates.id = template_versions.template_id))));

CREATE POLICY "Users can update template versions for their templates" ON public.template_versions
    FOR UPDATE USING (auth.uid() IN ( SELECT templates.user_id
       FROM templates
       WHERE (templates.id = template_versions.template_id)));

CREATE POLICY "Users can delete template versions for their templates" ON public.template_versions
    FOR DELETE USING (auth.uid() IN ( SELECT templates.user_id
       FROM templates
       WHERE (templates.id = template_versions.template_id)));

-- ============================================
-- 8. CREATE FUNCTIONS
-- ============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, subscription_tier, subscription_status)
    VALUES (new.id, 'pro', 'active');
    RETURN new;
END;
$$;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
  BEGIN
      NEW.updated_at = timezone('utc'::text, now());
      RETURN NEW;
  END;
$$;

-- Function to update the updated_at column (alternative version)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function to update contract_clauses search vector
CREATE OR REPLACE FUNCTION public.update_clauses_search_vector()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.content, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$;

-- Function to update contract_sections search vector
CREATE OR REPLACE FUNCTION public.update_sections_search_vector()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.content, '')
  );
  RETURN NEW;
END;
$$;

-- Function to update contract_templates search vector
CREATE OR REPLACE FUNCTION public.update_templates_search_vector()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.name, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$;

-- ============================================
-- 9. CREATE TRIGGERS (pending trigger info)
-- ============================================
-- Note: Triggers will be added once you provide the trigger query results

-- ============================================
-- 10. GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================
-- 11. CREATE AUTH TRIGGER
-- ============================================
-- This trigger creates a profile when a new user signs up
-- Make sure to run this after creating the functions

-- Note: You'll need to verify if this trigger should be on auth.users table
-- If so, you might need to run this with appropriate permissions:
-- CREATE TRIGGER on_auth_user_created 
--     AFTER INSERT ON auth.users 
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- END OF MIGRATION SCRIPT
-- ============================================