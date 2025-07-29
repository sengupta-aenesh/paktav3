# Supabase Database Migration Guide

## Overview
This guide helps you set up a separate Supabase instance for your staging/development branch while keeping your production database separate.

## Prerequisites
- Access to your current Supabase project
- A new Supabase project created for staging/development
- Access to both projects' SQL editors

## Migration Steps

### 1. Extract Current Database Structure
Run the queries in `supabase-extraction-queries.sql` in your current Supabase SQL editor to extract:
- Table schemas
- Indexes
- Foreign keys
- RLS policies
- Functions
- Triggers
- Extensions

### 2. Create New Database Structure
1. Open your new Supabase project's SQL editor
2. Run the entire `supabase-migration-script.sql` file
3. This will create:
   - All tables with proper data types
   - Foreign key relationships
   - Indexes for performance
   - Row Level Security policies
   - Database functions
   - Check constraints

### 3. Add Triggers (if needed)
Run the `supabase-triggers-query.sql` in your current database and share the results to complete the migration script with triggers.

### 4. Update Environment Variables

#### For Staging Branch
Update your `.env.local` file with the new Supabase instance credentials:

```env
# Old (Production)
# NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key

# New (Staging)
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-key

# Keep these the same
OPENAI_API_KEY=your-openai-key
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id
SENTRY_DSN=your-sentry-dsn
```

#### For Vercel Deployment
Update environment variables in your Vercel project settings:
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Update the following for your staging branch:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (if used)

### 5. Configure Auth Settings

In your new Supabase project:
1. Go to Authentication → Settings
2. Configure the same auth providers as your production instance
3. Update Site URL and Redirect URLs to match your staging domain

### 6. Enable Required Features

In your new Supabase project dashboard:
1. Ensure Row Level Security is enabled (the script does this)
2. Configure any email templates if needed
3. Set up any webhook endpoints if used

### 7. Test the Migration

1. Create a test user in your new instance
2. Verify all tables are created correctly
3. Test basic CRUD operations
4. Ensure RLS policies are working

### 8. Data Migration (Optional)

If you need to migrate existing data:

```sql
-- Example: Export data from production
COPY (SELECT * FROM public.contract_templates) TO '/tmp/contract_templates.csv' CSV HEADER;

-- Import into staging (run in new instance)
COPY public.contract_templates FROM '/tmp/contract_templates.csv' CSV HEADER;
```

**Note**: Be careful with user-specific data. You might want to anonymize or use test data instead.

## Maintaining Separate Environments

### Best Practices

1. **Branch-specific env files**:
   - `.env.production` for main branch
   - `.env.staging` for staging branch

2. **Vercel Environment Variables**:
   - Set different variables per branch in Vercel
   - Use preview deployments for feature branches

3. **Database Migrations**:
   - Test all schema changes in staging first
   - Keep a migration log for both environments
   - Use version control for migration scripts

4. **Regular Sync Checks**:
   - Periodically compare schemas between environments
   - Document any environment-specific differences

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**:
   - Ensure `auth.uid()` function is available
   - Check that Row Level Security is enabled on tables

2. **Foreign Key Violations**:
   - Create tables in the correct order
   - Ensure referenced tables exist before creating foreign keys

3. **Missing Functions**:
   - The `gen_random_uuid()` function requires the pgcrypto extension
   - Make sure all required extensions are enabled

4. **Permission Errors**:
   - Grant appropriate permissions to the `authenticated` role
   - Check service role key is correctly configured

## Next Steps

1. Run the trigger extraction query and add triggers to the migration script
2. Set up CI/CD pipelines for automated deployments
3. Configure monitoring and alerts for both environments
4. Document any custom configurations or modifications

## Important Notes

- Keep production and staging databases completely separate
- Never use production data in staging without proper anonymization
- Regularly backup both databases
- Test all migrations in staging before applying to production