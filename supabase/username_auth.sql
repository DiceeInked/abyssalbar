-- ABYSSAL BAR CUSTOM USERNAME AUTH
-- Run this in Supabase SQL Editor BEFORE custom_auth_functions.sql.
-- This replaces the earlier accounts/auth.users design.

create extension if not exists pgcrypto;

-- Remove the old auth.users foreign-key relationship.
alter table public.accounts
  drop constraint if exists accounts_id_fkey;

-- Add the password hash column used by the custom username system.
alter table public.accounts
  add column if not exists password_hash text;

-- New accounts get their own UUID instead of an auth.users UUID.
alter table public.accounts
  alter column id set default gen_random_uuid();

-- Enforce the requested username rules in the database too.
alter table public.accounts
  drop constraint if exists username_length;

alter table public.accounts
  add constraint username_length
  check (char_length(username) between 3 and 30);

alter table public.accounts
  drop constraint if exists username_no_spaces;

alter table public.accounts
  add constraint username_no_spaces
  check (username !~ '\\s');

-- Usernames are unique regardless of capitalization.
drop index if exists accounts_username_idx;
create unique index if not exists accounts_username_lower_idx
  on public.accounts (lower(username));

-- password_hash is intentionally allowed to remain NULL during migration.
-- Any account created by the new system receives a bcrypt hash.
-- Old Supabase-Auth accounts with no hash simply cannot sign in until replaced.

-- The old accounts policies were designed for Supabase Auth.
-- Custom authentication exposes account operations through SECURITY DEFINER
-- database functions instead of direct browser access.
drop policy if exists "Authenticated users can view accounts" on public.accounts;
drop policy if exists "Users can create their own account" on public.accounts;
drop policy if exists "Users can update their own account" on public.accounts;

alter table public.accounts enable row level security;
revoke all on public.accounts from anon, authenticated;

-- Messages may be read by the public terminal.
drop policy if exists "Anyone can read messages" on public.messages;
create policy "Anyone can read messages"
on public.messages
for select
to anon, authenticated
using (true);

-- Browsers cannot insert messages directly. The authenticated server-side
-- session is checked by send_account_message() instead.
drop policy if exists "Users can send their own messages" on public.messages;

-- Message moderation/deletion will be added later with the ban/admin system.
drop policy if exists "Users can delete their own messages" on public.messages;

alter table public.messages enable row level security;
