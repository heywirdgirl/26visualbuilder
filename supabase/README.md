initial_schema.sql# Supabase setup

1. Create a Supabase project and copy its URL and publishable anon key to `.env.local`:

   ```text
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

2. Apply `migrations/20260824000000_initial_schema.sql` in the Supabase SQL Editor, or run it through the Supabase CLI after linking this project.

3. In Supabase Authentication, enable Google and add these redirect URLs:

   ```text
   http://localhost:3000/auth/callback
   https://your-production-domain/auth/callback
   ```

The migration creates profiles, projects, project likes, row-level security policies, and the triggers used by the app. Project data is only writable by its owner; public projects and likes are readable according to the policies in the migration.