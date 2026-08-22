-- ABYSSAL BAR CUSTOM USERNAME AUTH
-- Run this in Supabase SQL Editor.
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

-- Passwords are hashes, never plaintext passwords.
alter table public.accounts
  alter column password_hash set not null;

-- The old accounts policies were designed for Supabase Auth.
-- Custom authentication uses server-side API routes with the service role,
-- so direct browser access to account rows is intentionally blocked.
drop policy if exists "Authenticated users can view accounts" on public.accounts;
drop policy if exists "Users can create their own account" on public.accounts;
drop policy if exists "Users can update their own account" on public.accounts;

-- Keep RLS enabled. The service-role API can still access the table.
alter table public.accounts enable row level security;

-- Messages may be read by the public terminal.
drop policy if exists "Anyone can read messages" on public.messages;
create policy "Anyone can read messages"
on public.messages
for select
to anon, authenticated
using (true);

-- Do NOT allow browsers to insert messages directly. The API route inserts
-- them after verifying the signed account cookie.
drop policy if exists "Users can send their own messages" on public.messages;

-- Existing delete policy depended on Supabase Auth, so remove it for now.
-- Message moderation/deletion can be added later with the ban/admin system.
drop policy if exists "Users can delete their own messages" on public.messages;

alter table public.messages enable row level security;
