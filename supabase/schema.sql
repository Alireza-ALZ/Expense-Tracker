-- ============================================================================
-- Expense Tracker - Database Schema
-- ============================================================================
-- Run this SQL in your Supabase project's SQL Editor to initialize the
-- required database schema, constraints, indexes, RLS configuration,
-- and policies.
--
-- This script is idempotent-safe: it uses IF NOT EXISTS / OR REPLACE
-- where possible. However, for a clean first-time setup, run it on a
-- fresh Supabase project.
-- ============================================================================

-- 1. Create the transactions table
-- ============================================================================
-- Dates are stored as PostgreSQL DATE in Gregorian format.
-- Jalali (Shamsi) conversion is handled in the application layer.
-- Amount is stored in Toman (Iranian currency) as an integer.
CREATE TABLE IF NOT EXISTS transactions (
    -- Primary key: UUID auto-generated
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Foreign key to the authenticated user
    -- Each transaction belongs to exactly one user
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Transaction title (required)
    title       TEXT NOT NULL CHECK (char_length(trim(title)) > 0),

    -- Transaction description (optional)
    description TEXT DEFAULT '',

    -- Transaction amount in Toman (must be positive)
    amount      BIGINT NOT NULL CHECK (amount > 0),

    -- Transaction type: only 'income' or 'expense' allowed
    type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),

    -- Transaction date in Gregorian format
    -- Jalali conversion happens in the application layer
    date        DATE NOT NULL,

    -- Timestamp when the record was created (for ordering same-date transactions)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create indexes for frequently queried fields
-- ============================================================================
-- Index on user_id for fast per-user queries (RLS filter)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id
    ON transactions (user_id);

-- Composite index on user_id + date for month-based filtering
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
    ON transactions (user_id, date DESC);

-- Composite index on user_id + date + created_at for ordered listing
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_created
    ON transactions (user_id, date DESC, created_at DESC);

-- 3. Grant table-level permissions to Supabase roles
-- ============================================================================
-- RLS policies control which rows each role can access, but the role
-- must first have PostgreSQL table-level privileges (GRANT) to even
-- attempt queries. Without these GRANTs, all queries return
-- "permission denied for table transactions".
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO authenticated;

-- 4. Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- ============================================================================
-- Users can only SELECT their own transactions
CREATE POLICY "Users can view own transactions"
    ON transactions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can only INSERT transactions with their own user_id
CREATE POLICY "Users can insert own transactions"
    ON transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can only UPDATE their own transactions
CREATE POLICY "Users can update own transactions"
    ON transactions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only DELETE their own transactions
CREATE POLICY "Users can delete own transactions"
    ON transactions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5. Deny anonymous access explicitly
-- ============================================================================
-- By enabling RLS and only creating policies for 'authenticated' role,
-- anonymous users are automatically denied all access.
-- The following policy is added for explicit documentation:
CREATE POLICY "Deny anonymous access"
    ON transactions
    FOR ALL
    TO anon
    USING (false)
    WITH CHECK (false);
