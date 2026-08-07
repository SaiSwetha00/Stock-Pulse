-- =====================================================================
-- 0007_ai_threads.sql — persistent AI assistant conversations
--
-- WHAT THIS ADDS:
--   ai_threads / ai_messages, so the assistant survives a refresh, and
--   user_preferences, so per-person settings (starting with assistant
--   mute) persist instead of living in component state.
--
--   Before this, the whole conversation was React useState: refreshing the
--   page silently destroyed it, "New chat" and "Clear chat" did not exist,
--   and every reply was read aloud by speechSynthesis with no way to stop
--   it.
--
-- ---------------------------------------------------------------------
-- THE ONE POLICY DECISION WORTH READING — these tables are OWNER-BLIND.
--
--   Every other table in this schema widens with role: can_manage() sees
--   the store, the owner sees everything. These do NOT. Every policy below
--   is `user_id = auth.uid()`, and an owner has no more access to another
--   person's chat history than a staff member does.
--
--   That is deliberate, not an oversight. The assistant is where somebody
--   types "how do I fix the mistake I made on yesterday's stock count" —
--   a half-formed question, not a business record. If the owner can read
--   it, people stop asking, and the feature is dead. The business facts
--   an owner genuinely needs are already in audit_logs, which they do read.
--
--   Anyone widening this later: that is a product decision with a privacy
--   consequence, not a bug fix. It was chosen explicitly, and it is stated
--   as a feature in the "Who can do what" help article.
-- ---------------------------------------------------------------------
--
-- ROLLBACK:
--   drop table if exists public.ai_messages;
--   drop table if exists public.ai_threads;
--   drop table if exists public.user_preferences;
-- =====================================================================

begin;

do $$
begin
  if to_regprocedure('public.current_store_id()') is null then
    raise exception '0007: role helpers from 0002 are missing — apply 0002 first';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Threads
-- ---------------------------------------------------------------------
create table if not exists public.ai_threads (
  id uuid primary key default gen_random_uuid(),
  -- Kept even though policies key off user_id: it scopes the row to the
  -- store the conversation was had in, so leaving a store takes its
  -- threads with it rather than carrying them to the next one.
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- Derived from the first user message, truncated. Nullable because a
  -- thread exists from the moment it is created, before anything is said.
  title text check (title is null or length(btrim(title)) between 1 and 120),
  created_at timestamptz not null default now(),
  -- Drives history ordering. A separate column rather than max(created_at)
  -- over ai_messages, so listing threads never touches the messages table.
  last_message_at timestamptz not null default now()
);

-- The history list is always "mine, most recently used first".
create index if not exists ai_threads_user_recent_idx
  on public.ai_threads (user_id, last_message_at desc);

-- ---------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  -- Cascade is what makes "Clear chat" honest: deleting the thread really
  -- removes the messages rather than orphaning them behind a hidden row.
  thread_id uuid not null references public.ai_threads(id) on delete cascade,
  -- Denormalised from the thread so a message policy never has to join
  -- back to ai_threads to answer "is this yours".
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'model')),
  content text not null check (length(content) between 1 and 20000),
  created_at timestamptz not null default now()
);

-- Replaying a conversation is always "this thread, oldest first".
create index if not exists ai_messages_thread_created_idx
  on public.ai_messages (thread_id, created_at asc);

-- ---------------------------------------------------------------------
-- Per-user preferences
--
-- One row per person, keyed by the profile. Columns beyond the assistant
-- are here because Phase 1.4 needs exactly this table for the notification
-- toggles, and creating it twice under two names would guarantee drift.
-- ---------------------------------------------------------------------
create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  -- Default true = silent. Auto-speech on a shop floor is a misfeature,
  -- and the old behaviour (always speak, no control) is not a default
  -- worth preserving.
  assistant_muted boolean not null default true,
  notify_critical_stock boolean not null default true,
  notify_daily_digest boolean not null default false,
  notify_supplier_updates boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.ai_threads enable row level security;
alter table public.ai_messages enable row level security;
alter table public.user_preferences enable row level security;

-- ---------------------------------------------------------------------
-- Policies. Note what is absent: no can_manage(), no owner branch.
-- The same predicate governs select, insert, update and delete, so there
-- is no way to act on a row you cannot read.
-- ---------------------------------------------------------------------
drop policy if exists "own threads" on public.ai_threads;
create policy "own threads" on public.ai_threads
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and store_id = public.current_store_id());

drop policy if exists "own messages" on public.ai_messages;
create policy "own messages" on public.ai_messages
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "own preferences" on public.user_preferences;
create policy "own preferences" on public.user_preferences
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

commit;

-- ---------------------------------------------------------------------
-- Verify (run signed in as a store user):
--
--   insert into public.ai_threads (store_id, user_id, title)
--   values (public.current_store_id(), auth.uid(), 'Test thread')
--   returning id;
--
--   -- using the id above:
--   insert into public.ai_messages (thread_id, user_id, role, content)
--   values ('<thread-id>', auth.uid(), 'user', 'Which items are low?');
--
--   select t.title, m.role, m.content
--   from public.ai_threads t join public.ai_messages m on m.thread_id = t.id;
--
--   -- cascade check: removing the thread must remove its messages
--   delete from public.ai_threads where title = 'Test thread';
--   select count(*) from public.ai_messages;      -- expect 0
--
--   -- owner-blind check: sign in as the OWNER of a store where a DIFFERENT
--   -- user has threads, then:
--   select count(*) from public.ai_threads;       -- expect 0, not theirs
--
--   select policyname, cmd from pg_policies
--   where tablename in ('ai_threads','ai_messages','user_preferences');
--   -- expect one ALL policy per table
-- ---------------------------------------------------------------------
