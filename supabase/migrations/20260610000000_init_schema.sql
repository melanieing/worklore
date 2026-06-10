-- Worklore initial schema (PRODUCT_SPEC.md §6)
-- 원칙: entries + qa_exchanges 는 원데이터(immutable). 파생물(achievement_cards 이하)은
-- 언제든 원데이터에서 재생성 가능해야 한다.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.plan_tier as enum ('free', 'pro');
create type public.entry_source as enum ('text', 'voice');
create type public.card_status as enum ('draft', 'confirmed');
create type public.bullet_tone as enum ('concise', 'detailed');
create type public.export_type as enum ('md', 'pdf');

-- ---------------------------------------------------------------------------
-- Shared trigger functions
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — auth.users 1:1, 가입 시 트리거로 자동 생성
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale       text not null default 'en',
  job_title    text,
  timezone     text not null default 'UTC',
  plan         public.plan_tier not null default 'free',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', null));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- entries — 일기 원문. UPDATE 금지(immutable), 정정은 새 entry
-- ---------------------------------------------------------------------------
create table public.entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  raw_text   text not null check (char_length(raw_text) between 1 and 20000),
  source     public.entry_source not null default 'text',
  audio_url  text,
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index entries_user_date_idx on public.entries (user_id, entry_date desc);

alter table public.entries enable row level security;

create policy "entries_select_own" on public.entries
  for select using (auth.uid() = user_id);
create policy "entries_insert_own" on public.entries
  for insert with check (auth.uid() = user_id);
-- 삭제는 사용자 데이터 권리(GDPR)를 위해 허용. UPDATE 정책은 의도적으로 없음.
create policy "entries_delete_own" on public.entries
  for delete using (auth.uid() = user_id);

-- service role 포함 어떤 경로로도 UPDATE 불가하도록 트리거로 강제
create function public.forbid_entry_update()
returns trigger
language plpgsql
as $$
begin
  raise exception 'entries are immutable; create a new entry to correct (PRODUCT_SPEC §6)';
end;
$$;

create trigger entries_forbid_update
  before update on public.entries
  for each row execute function public.forbid_entry_update();

-- ---------------------------------------------------------------------------
-- qa_exchanges — AI 역질문 스레드. 질문은 immutable, 답변은 1회만 기록 가능
-- ---------------------------------------------------------------------------
create table public.qa_exchanges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  entry_id    uuid not null references public.entries (id) on delete cascade,
  question    text not null,
  answer      text,
  asked_by    text not null default 'ai' check (asked_by = 'ai'),
  answered_at timestamptz,
  created_at  timestamptz not null default now()
);

create index qa_exchanges_entry_idx on public.qa_exchanges (entry_id);

alter table public.qa_exchanges enable row level security;

create policy "qa_select_own" on public.qa_exchanges
  for select using (auth.uid() = user_id);
create policy "qa_insert_own" on public.qa_exchanges
  for insert with check (auth.uid() = user_id);
create policy "qa_update_own" on public.qa_exchanges
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 답변 기록만 허용: 질문/소속은 불변, answer 는 null → 값 1회만 (원데이터 보존)
create function public.qa_answer_once()
returns trigger
language plpgsql
as $$
begin
  if new.question  is distinct from old.question
     or new.entry_id is distinct from old.entry_id
     or new.user_id  is distinct from old.user_id
     or new.asked_by is distinct from old.asked_by
     or new.created_at is distinct from old.created_at then
    raise exception 'qa_exchanges: only answer/answered_at may change';
  end if;
  if old.answer is not null and new.answer is distinct from old.answer then
    raise exception 'qa_exchanges: answer is immutable once recorded';
  end if;
  if new.answer is not null and old.answer is null then
    new.answered_at := coalesce(new.answered_at, now());
  end if;
  return new;
end;
$$;

create trigger qa_exchanges_answer_once
  before update on public.qa_exchanges
  for each row execute function public.qa_answer_once();

-- ---------------------------------------------------------------------------
-- achievement_cards — STAR 구조화 파생물 (원데이터에서 재생성 가능)
-- ---------------------------------------------------------------------------
create table public.achievement_cards (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  title            text not null,
  situation        text,
  task             text,
  action           text,
  result           text,
  -- spec 표기는 jsonb[] 이나, 단일 jsonb 배열이 쿼리/직렬화에 유리해 jsonb 로 구현
  -- 형태: [{ "label": "p95 latency", "before": "1.2s", "after": "300ms" }, ...]
  metrics          jsonb not null default '[]'::jsonb check (jsonb_typeof(metrics) = 'array'),
  skills           text[] not null default '{}',
  project_tag      text,
  period_start     date,
  period_end       date,
  status           public.card_status not null default 'draft',
  source_entry_ids uuid[] not null default '{}',  -- 원데이터 추적성
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index achievement_cards_user_idx on public.achievement_cards (user_id, created_at desc);

alter table public.achievement_cards enable row level security;

create policy "cards_select_own" on public.achievement_cards
  for select using (auth.uid() = user_id);
create policy "cards_insert_own" on public.achievement_cards
  for insert with check (auth.uid() = user_id);
create policy "cards_update_own" on public.achievement_cards
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cards_delete_own" on public.achievement_cards
  for delete using (auth.uid() = user_id);

create trigger achievement_cards_set_updated_at
  before update on public.achievement_cards
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- resume_bullets — 카드에서 파생된 이력서 불릿
-- ---------------------------------------------------------------------------
create table public.resume_bullets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  card_id    uuid not null references public.achievement_cards (id) on delete cascade,
  text       text not null,
  tone       public.bullet_tone not null default 'concise',
  version    int not null default 1,
  created_at timestamptz not null default now()
);

create index resume_bullets_card_idx on public.resume_bullets (card_id);

alter table public.resume_bullets enable row level security;

create policy "bullets_select_own" on public.resume_bullets
  for select using (auth.uid() = user_id);
create policy "bullets_insert_own" on public.resume_bullets
  for insert with check (auth.uid() = user_id);
create policy "bullets_update_own" on public.resume_bullets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bullets_delete_own" on public.resume_bullets
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- exports — 생성된 산출물 스냅샷
-- ---------------------------------------------------------------------------
create table public.exports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       public.export_type not null,
  file_url   text,
  snapshot   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.exports enable row level security;

create policy "exports_select_own" on public.exports
  for select using (auth.uid() = user_id);
create policy "exports_insert_own" on public.exports
  for insert with check (auth.uid() = user_id);
create policy "exports_delete_own" on public.exports
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- usage_counters — freemium 월간 기록 횟수. 클라이언트 조작 방지를 위해
-- entries INSERT 트리거로만 증가시키고, 사용자에게는 SELECT 만 허용
-- ---------------------------------------------------------------------------
create table public.usage_counters (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  month         date not null check (extract(day from month) = 1),
  entries_count int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, month)
);

alter table public.usage_counters enable row level security;

create policy "usage_select_own" on public.usage_counters
  for select using (auth.uid() = user_id);
-- INSERT/UPDATE 정책 없음: 아래 security definer 트리거로만 변경됨

create trigger usage_counters_set_updated_at
  before update on public.usage_counters
  for each row execute function public.set_updated_at();

create function public.increment_usage_counter()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.usage_counters (user_id, month, entries_count)
  values (new.user_id, date_trunc('month', new.entry_date)::date, 1)
  on conflict (user_id, month)
  do update set entries_count = public.usage_counters.entries_count + 1;
  return new;
end;
$$;

create trigger entries_increment_usage
  after insert on public.entries
  for each row execute function public.increment_usage_counter();
