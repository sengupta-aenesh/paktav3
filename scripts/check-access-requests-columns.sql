-- Check what columns exist in access_requests table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'access_requests'
ORDER BY ordinal_position;