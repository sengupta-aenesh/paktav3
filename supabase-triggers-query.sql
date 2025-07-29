-- Corrected query to extract triggers
SELECT 
    trigger_schema,
    trigger_name,
    event_object_schema,
    event_object_table,
    action_statement,
    action_orientation,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;