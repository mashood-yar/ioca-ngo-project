# IOCA Database Migrations

This directory contains migration scripts to be applied to the Supabase database.

## How to run migrations

1. Open the Supabase dashboard for your project.
2. Navigate to the **SQL Editor** on the left sidebar.
3. Click on **New Query**.
4. Copy the entire content of `001_production_fixes.sql` into the SQL editor.
5. Click **Run** to execute the migration.

The migration is idempotent, meaning you can safely run it multiple times without causing errors or duplicating data/columns.
