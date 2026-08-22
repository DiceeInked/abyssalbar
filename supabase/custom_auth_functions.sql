-- Run AFTER username_auth.sql.
-- Username/password authentication without Supabase Auth emails.
-- Passwords are stored as bcrypt hashes, never plaintext.

create table if not exists public.account_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  token_hash bytea not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

alter table public.account_sessions enable row level security;
revoke all on public.account_sessions from anon, authenticated;
revoke all on public.accounts from anon, authenticated;

create or replace function public.create_account(p_username text, p_password text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_id uuid;
  clean_username text := trim(p_username);
begin
  if clean_username is null
     or char_length(clean_username) < 3
     or char_length(clean_username) > 30
     or clean_username ~ '\\s' then
    raise exception 'Username must be 3-30 characters and contain no spaces.';
  end if;

  if p_password is null
     or char_length(p_password) < 3
     or char_length(p_password) > 30
     or p_password ~ '\\s' then
    raise exception 'Password must be 3-30 characters and contain no spaces.';
  end if;

  if exists (select 1 from public.accounts where lower(username) = lower(clean_username)) then
    raise exception 'That username is already taken.';
  end if;

  insert into public.accounts (username, password_hash)
  values (clean_username, crypt(p_password, gen_salt('bf', 10)))
  returning id into new_id;

  return json_build_object('id', new_id, 'username', clean_username);
end;
$$;

create or replace function public.create_account_session(p_username text, p_password text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  found_account public.accounts%rowtype;
  raw_token text;
begin
  if p_username is null or p_password is null then
    raise exception 'Invalid username or password.';
  end if;

  select * into found_account
  from public.accounts
  where lower(username) = lower(trim(p_username))
  limit 1;

  if found_account.id is null
     or found_account.password_hash is null
     or crypt(p_password, found_account.password_hash) <> found_account.password_hash then
    raise exception 'Invalid username or password.';
  end if;

  raw_token := encode(gen_random_bytes(32), 'hex');

  insert into public.account_sessions (account_id, token_hash)
  values (found_account.id, digest(raw_token, 'sha256'));

  return json_build_object(
    'token', raw_token,
    'id', found_account.id,
    'username', found_account.username
  );
end;
$$;

create or replace function public.get_session_account(p_token text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  result json;
begin
  if p_token is null then
    return null;
  end if;

  select json_build_object(
    'id', a.id,
    'username', a.username,
    'created_at', a.created_at
  )
  into result
  from public.account_sessions s
  join public.accounts a on a.id = s.account_id
  where s.token_hash = digest(p_token, 'sha256')
    and s.expires_at > now();

  return result;
end;
$$;

create or replace function public.delete_account_session(p_token text)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  delete from public.account_sessions
  where p_token is not null and token_hash = digest(p_token, 'sha256');
  select true;
$$;

create or replace function public.send_account_message(p_token text, p_message text)
returns public.messages
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  account_row public.accounts%rowtype;
  new_message public.messages%rowtype;
begin
  if p_token is null then
    raise exception 'You must be signed in.';
  end if;

  select a.* into account_row
  from public.account_sessions s
  join public.accounts a on a.id = s.account_id
  where s.token_hash = digest(p_token, 'sha256')
    and s.expires_at > now();

  if account_row.id is null then
    raise exception 'You must be signed in.';
  end if;

  if p_message is null or char_length(trim(p_message)) = 0 then
    raise exception 'Message cannot be empty.';
  end if;

  insert into public.messages (account_id, username, message)
  values (account_row.id, account_row.username, trim(p_message))
  returning * into new_message;

  return new_message;
end;
$$;

grant execute on function public.create_account(text, text) to anon, authenticated;
grant execute on function public.create_account_session(text, text) to anon, authenticated;
grant execute on function public.get_session_account(text) to anon, authenticated;
grant execute on function public.delete_account_session(text) to anon, authenticated;
grant execute on function public.send_account_message(text, text) to anon, authenticated;

create or replace function public.clean_expired_sessions()
returns void
language sql
security definer
set search_path = public, extensions
as $$
  delete from public.account_sessions where expires_at <= now();
$$;
