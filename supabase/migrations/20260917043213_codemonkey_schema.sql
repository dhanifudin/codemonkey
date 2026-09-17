-- CodeMonkey clone: dedicated schema, isolated from sibling apps' data.
--
-- This project shares a Supabase instance with sibling apps using their own
-- schemas ("lulu", "bomi"). Every object below lives in "codemonkey" and
-- nothing here touches public/lulu/bomi. The application's Supabase client
-- is configured with `db: { schema: 'codemonkey' }` so queries can never
-- accidentally cross into another app's tables (see src/lib/supabase/client.ts).
--
-- After applying this migration, "codemonkey" must be appended to the
-- project's exposed-schemas list (Settings -> API -> Exposed schemas) --
-- append only, never replace, so lulu/bomi/public stay exposed.

create schema if not exists codemonkey;

comment on schema codemonkey is 'CodeMonkey clone app data. Isolated from sibling apps (lulu, bomi) which use their own schemas in this same project.';

-- One row per signed-in user (anonymous or upgraded later). id mirrors
-- auth.users so it's directly usable as the RLS ownership key.
create table codemonkey.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	display_name text,
	avatar text,
	age_band text,
	created_at timestamptz not null default now()
);

-- One row per (user, challenge): best result so far.
create table codemonkey.progress (
	user_id uuid not null references auth.users (id) on delete cascade,
	challenge_slug text not null,
	stars smallint not null default 0 check (stars between 0 and 3),
	attempts integer not null default 0,
	best_solution jsonb,
	completed_at timestamptz,
	primary key (user_id, challenge_slug)
);

-- Badge catalog. Content-managed (via migrations), not user-writable.
create table codemonkey.badges (
	slug text primary key,
	title text not null,
	icon text
);

create table codemonkey.user_badges (
	user_id uuid not null references auth.users (id) on delete cascade,
	badge_slug text not null references codemonkey.badges (slug) on delete cascade,
	earned_at timestamptz not null default now(),
	primary key (user_id, badge_slug)
);

-- RLS: every table in an exposed schema must have it enabled, even though
-- "codemonkey" itself isn't exposed by default -- this is defense in depth
-- for whenever it is.
alter table codemonkey.profiles enable row level security;
alter table codemonkey.progress enable row level security;
alter table codemonkey.badges enable row level security;
alter table codemonkey.user_badges enable row level security;

-- profiles: a user can only ever see/write their own row.
create policy "profiles_select_own" on codemonkey.profiles
for select to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own" on codemonkey.profiles
for insert to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own" on codemonkey.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- progress: same ownership pattern. No delete policy -- progress is
-- append/upsert only from the client.
create policy "progress_select_own" on codemonkey.progress
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "progress_insert_own" on codemonkey.progress
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "progress_update_own" on codemonkey.progress
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- badges: read-only catalog, visible to every signed-in user (anonymous
-- sign-ins carry the "authenticated" Postgres role too).
create policy "badges_select_all" on codemonkey.badges
for select to authenticated
using (true);

-- user_badges: a user can see and earn their own badges only.
create policy "user_badges_select_own" on codemonkey.user_badges
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "user_badges_insert_own" on codemonkey.user_badges
for insert to authenticated
with check ((select auth.uid()) = user_id);

-- Grants: PostgREST only reaches these tables once "codemonkey" is added to
-- the exposed-schemas list (see comment above); RLS is what actually scopes
-- rows once it can. No delete grants anywhere -- neither policy nor grant
-- exists for delete, so it is denied both ways.
grant usage on schema codemonkey to anon, authenticated;

grant select, insert, update on codemonkey.profiles to authenticated;
grant select, insert, update on codemonkey.progress to authenticated;
grant select on codemonkey.badges to authenticated;
grant select, insert on codemonkey.user_badges to authenticated;
