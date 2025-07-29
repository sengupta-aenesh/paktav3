-- Supabase Database Extraction Queries
-- Run these queries in your Supabase SQL editor to extract the complete database structure

-- ============================================
-- 1. EXTRACT ALL TABLE SCHEMAS
-- ============================================
-- This query will show all tables with their columns, data types, and constraints
SELECT 
    t.table_schema,
    t.table_name,
    json_agg(
        json_build_object(
            'column_name', c.column_name,
            'data_type', c.data_type,
            'character_maximum_length', c.character_maximum_length,
            'numeric_precision', c.numeric_precision,
            'numeric_scale', c.numeric_scale,
            'is_nullable', c.is_nullable,
            'column_default', c.column_default,
            'is_identity', c.is_identity,
            'identity_generation', c.identity_generation
        ) ORDER BY c.ordinal_position
    ) as columns
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_schema = c.table_schema AND t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_schema, t.table_name
ORDER BY t.table_name;

-- ============================================
-- 2. EXTRACT ALL INDEXES
-- ============================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- 3. EXTRACT ALL FOREIGN KEY CONSTRAINTS
-- ============================================
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
    AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public';

-- ============================================
-- 4. EXTRACT ALL PRIMARY KEY CONSTRAINTS
-- ============================================
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS key_columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
GROUP BY tc.table_schema, tc.table_name, tc.constraint_name
ORDER BY tc.table_name;

-- ============================================
-- 5. EXTRACT ALL UNIQUE CONSTRAINTS
-- ============================================
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS key_columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
GROUP BY tc.table_schema, tc.table_name, tc.constraint_name
ORDER BY tc.table_name;

-- ============================================
-- 6. EXTRACT ALL CHECK CONSTRAINTS
-- ============================================
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE contype = 'c'
    AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, conname;

-- ============================================
-- 7. EXTRACT ALL RLS POLICIES
-- ============================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 8. EXTRACT ALL FUNCTIONS
-- ============================================
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
    pg_catalog.pg_get_function_result(p.oid) AS return_type,
    p.prosrc AS function_body,
    l.lanname AS language,
    CASE 
        WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
        WHEN p.provolatile = 's' THEN 'STABLE'
        WHEN p.provolatile = 'v' THEN 'VOLATILE'
    END AS volatility,
    p.proisstrict AS is_strict,
    p.prosecdef AS security_definer
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
LEFT JOIN pg_catalog.pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
ORDER BY p.proname;

-- ============================================
-- 9. EXTRACT ALL TRIGGERS
-- ============================================
SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table,
    action_statement,
    action_orientation,
    action_timing,
    string_agg(event_manipulation, ' OR ' ORDER BY event_manipulation) AS events
FROM information_schema.triggers
WHERE trigger_schema = 'public'
GROUP BY 
    trigger_schema,
    trigger_name,
    event_object_schema,
    event_object_table,
    action_statement,
    action_orientation,
    action_timing
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 10. EXTRACT ALL VIEWS
-- ============================================
SELECT 
    table_schema,
    table_name AS view_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- 11. EXTRACT ALL SEQUENCES
-- ============================================
SELECT 
    sequence_schema,
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment,
    cycle_option
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- ============================================
-- 12. EXTRACT TABLE ROW SECURITY STATUS
-- ============================================
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- 13. EXTRACT ALL ENUMS/CUSTOM TYPES
-- ============================================
SELECT 
    n.nspname AS schema_name,
    t.typname AS type_name,
    t.typtype,
    CASE 
        WHEN t.typtype = 'e' THEN array_to_string(ARRAY(SELECT enumlabel FROM pg_enum WHERE enumtypid = t.oid ORDER BY enumsortorder), ', ')
        ELSE NULL
    END AS enum_values
FROM pg_type t
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
    AND t.typtype IN ('e', 'c', 'd')
ORDER BY t.typname;

-- ============================================
-- 14. EXTRACT DATABASE EXTENSIONS
-- ============================================
SELECT 
    extname AS extension_name,
    extversion AS version
FROM pg_extension
WHERE extname NOT IN ('plpgsql')
ORDER BY extname;

-- ============================================
-- 15. EXTRACT REALTIME PUBLICATION SETTINGS (if any)
-- ============================================
-- Check if any tables have realtime enabled
SELECT 
    schemaname,
    tablename,
    pubinsert,
    pubupdate,
    pubdelete
FROM pg_publication_tables
WHERE publication = 'supabase_realtime'
    AND schemaname = 'public'
ORDER BY tablename;