initial_schema.sql# Supabase setup

1. Create a Supabase project and copy its URL and publishable anon key to `.env.local`:

   ```text
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

2. From the repository root, install dependencies and log in to the Supabase CLI:

   ```bash
   pnpm install
   pnpm supabase login
   ```

3. Link this repository to your existing Supabase project. Replace `your-project-ref` with the ref from the project URL:

   ```bash
   pnpm supabase link --project-ref your-project-ref
   ```

4. Push the migration from `migrations/20260824000000_initial_schema.sql`:

   ```bash
   pnpm db:push
   ```

   After this, edit SQL files in VS Code and run `pnpm db:push` again. The CLI tracks applied migrations, so do not edit a migration that has already been pushed; create a new timestamped file instead.

5. In Supabase Authentication, enable Google and add these redirect URLs:

   ```text
   http://localhost:3000/auth/callback
   https://your-production-domain/auth/callback
   ```

The migration creates profiles, projects, project likes, row-level security policies, and the triggers used by the app. Project data is only writable by its owner; public projects and likes are readable according to the policies in the migration.