-- TNoti 초기 스키마 (ERD v1). 저장소 D1~D5를 테이블 11개로 만든다.
-- 모든 테이블은 RLS를 켠다. 정책이 없는 테이블은 서버(service_role)만 읽고 쓴다.

-- ---------- D4 분류 규칙 ----------
create table public.category (
  category_id bigint generated always as identity primary key,
  name text not null unique check (char_length(name) between 1 and 20),
  is_alertable boolean not null default true,
  sort_order int not null default 0
);

create table public.category_rule (
  rule_id bigint generated always as identity primary key,
  category_id bigint not null references public.category (category_id) on delete cascade,
  match_field text not null check (match_field in ('title', 'author_dept')),
  keyword_text text not null check (char_length(keyword_text) between 1 and 30),
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (category_id, match_field, keyword_text)
);

-- ---------- D1 회원·구독 ----------
-- member_id는 Supabase 인증 사용자 ID다. 인증 사용자가 지워지면 회원과 하위 테이블이 함께 지워진다(FR-06).
create table public.member (
  member_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  email_verified_at timestamptz,
  notify_enabled boolean not null default true,
  frequency text not null default 'instant' check (frequency in ('instant', 'twice_daily')),
  channel text not null default 'email' check (channel in ('push', 'email')),
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table public.member_category (
  member_id uuid not null references public.member (member_id) on delete cascade,
  category_id bigint not null references public.category (category_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, category_id)
);

create table public.member_keyword (
  keyword_id bigint generated always as identity primary key,
  member_id uuid not null references public.member (member_id) on delete cascade,
  keyword_text text not null check (char_length(keyword_text) between 2 and 20),
  created_at timestamptz not null default now(),
  unique (member_id, keyword_text)
);

create table public.push_subscription (
  subscription_id bigint generated always as identity primary key,
  member_id uuid not null references public.member (member_id) on delete cascade,
  endpoint text not null unique,
  p256dh_key text not null,
  auth_key text not null,
  created_at timestamptz not null default now(),
  expired_at timestamptz
);

-- 키워드는 회원당 최대 5개다(FR-03).
create function public.enforce_member_keyword_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select count(*) from public.member_keyword k where k.member_id = new.member_id) >= 5 then
    raise exception '키워드는 회원당 최대 5개까지 등록할 수 있습니다'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger member_keyword_limit
before insert on public.member_keyword
for each row execute function public.enforce_member_keyword_limit();

-- ---------- D2 공지 ----------
-- notice_id는 학교 게시글 번호를 그대로 쓴다. 본문은 저장하지 않는다(robots.txt, G-06).
create table public.notice (
  notice_id bigint primary key,
  source_url text not null unique,
  board_no int,
  title text not null,
  author_dept text not null default '',
  posted_at date not null,
  deadline date,
  status text not null default 'active' check (status in ('active', 'modified', 'deleted')),
  on_first_page boolean not null default true,
  collected_at timestamptz not null default now(),
  modified_at timestamptz
);

-- 분류 1회의 기록. AI 입력·출력·근거·품질 필드를 갖는다.
create table public.classification_result (
  result_id bigint generated always as identity primary key,
  notice_id bigint not null references public.notice (notice_id) on delete cascade,
  method text not null check (method in ('rule', 'ai')),
  model_version text,
  input_title text not null,
  input_author_dept text not null default '',
  output_categories jsonb not null default '[]'::jsonb,
  output_deadline date,
  basis_matched_rules jsonb,
  basis_explanation text,
  quality_confidence real,
  quality_flag text not null check (quality_flag in ('high', 'medium', 'low')),
  quality_threshold real not null,
  quality_reason text,
  is_current boolean not null default true,
  classified_at timestamptz not null default now(),
  constraint ai_needs_explanation check (method <> 'ai' or basis_explanation is not null),
  constraint rule_has_no_model check (
    method <> 'rule' or (model_version is null and quality_confidence is null)
  )
);

-- 공지마다 현재 유효한 분류 결과는 하나다.
create unique index classification_result_current_idx
  on public.classification_result (notice_id) where is_current;

create table public.notice_category (
  notice_id bigint not null references public.notice (notice_id) on delete cascade,
  category_id bigint not null references public.category (category_id) on delete cascade,
  result_id bigint not null references public.classification_result (result_id) on delete cascade,
  primary key (notice_id, category_id)
);

-- ---------- D3 알림 이력 ----------
-- 한 공지는 한 회원에게 1건만 간다(FR-11).
create table public.notification (
  notification_id bigint generated always as identity primary key,
  member_id uuid not null references public.member (member_id) on delete cascade,
  notice_id bigint not null references public.notice (notice_id) on delete cascade,
  matched_by text not null check (matched_by in ('category', 'keyword')),
  matched_value text not null,
  channel text not null check (channel in ('push', 'email')),
  send_status text not null default 'requested' check (send_status in ('requested', 'sent', 'failed')),
  retry_count int not null default 0,
  is_digest boolean not null default false,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  fail_reason text,
  unique (member_id, notice_id)
);

-- ---------- D5 수집 기록 ----------
create table public.collect_log (
  log_id bigint generated always as identity primary key,
  run_type text not null check (run_type in ('new', 'recheck')),
  target_url text not null,
  status text not null check (status in ('success', 'failed')),
  new_count int not null default 0,
  modified_count int not null default 0,
  deleted_count int not null default 0,
  fail_reason text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- ---------- 외래키 인덱스 ----------
create index member_category_category_idx on public.member_category (category_id);
create index push_subscription_member_idx on public.push_subscription (member_id);
create index classification_result_notice_idx on public.classification_result (notice_id);
create index notice_category_category_idx on public.notice_category (category_id);
create index notice_category_result_idx on public.notice_category (result_id);
create index notification_notice_idx on public.notification (notice_id);
create index notice_posted_at_idx on public.notice (posted_at desc, notice_id desc);

-- ---------- RLS ----------
alter table public.category enable row level security;
alter table public.category_rule enable row level security;
alter table public.member enable row level security;
alter table public.member_category enable row level security;
alter table public.member_keyword enable row level security;
alter table public.push_subscription enable row level security;
alter table public.notice enable row level security;
alter table public.classification_result enable row level security;
alter table public.notice_category enable row level security;
alter table public.notification enable row level security;
alter table public.collect_log enable row level security;

-- 공지, 카테고리는 공개 정보라 누구나 읽는다(공지 상세 S5는 로그인 없이 열린다).
create policy "누구나 카테고리를 읽는다" on public.category
  for select to anon, authenticated using (true);
create policy "누구나 공지를 읽는다" on public.notice
  for select to anon, authenticated using (true);
create policy "누구나 공지 카테고리를 읽는다" on public.notice_category
  for select to anon, authenticated using (true);

-- 회원 정보와 구독은 본인만 본다.
create policy "본인 회원 정보를 읽는다" on public.member
  for select to authenticated using ((select auth.uid()) = member_id);
create policy "본인 알림 설정을 고친다" on public.member
  for update to authenticated
  using ((select auth.uid()) = member_id)
  with check ((select auth.uid()) = member_id);

create policy "본인 관심 카테고리를 읽는다" on public.member_category
  for select to authenticated using ((select auth.uid()) = member_id);
create policy "본인 관심 카테고리를 추가한다" on public.member_category
  for insert to authenticated with check ((select auth.uid()) = member_id);
create policy "본인 관심 카테고리를 지운다" on public.member_category
  for delete to authenticated using ((select auth.uid()) = member_id);

create policy "본인 키워드를 읽는다" on public.member_keyword
  for select to authenticated using ((select auth.uid()) = member_id);
create policy "본인 키워드를 추가한다" on public.member_keyword
  for insert to authenticated with check ((select auth.uid()) = member_id);
create policy "본인 키워드를 지운다" on public.member_keyword
  for delete to authenticated using ((select auth.uid()) = member_id);

create policy "본인 푸시 구독을 읽는다" on public.push_subscription
  for select to authenticated using ((select auth.uid()) = member_id);
create policy "본인 푸시 구독을 추가한다" on public.push_subscription
  for insert to authenticated with check ((select auth.uid()) = member_id);
create policy "본인 푸시 구독을 지운다" on public.push_subscription
  for delete to authenticated using ((select auth.uid()) = member_id);

create policy "본인 알림 내역을 읽는다" on public.notification
  for select to authenticated using ((select auth.uid()) = member_id);

-- category_rule, classification_result, collect_log에는 정책을 두지 않는다. 서버만 쓴다.

-- ---------- 권한 ----------
-- 기본으로 열려 있을 수 있는 권한을 걷어 내고 필요한 것만 준다.
revoke all on all tables in schema public from anon, authenticated;

grant select on public.category, public.notice, public.notice_category to anon, authenticated;

grant select on public.member to authenticated;
-- 회원은 알림 설정 세 가지만 고칠 수 있다. 이메일과 인증 시각은 서버만 바꾼다.
grant update (notify_enabled, frequency, channel) on public.member to authenticated;

grant select, insert, delete
  on public.member_category, public.member_keyword, public.push_subscription
  to authenticated;

grant select on public.notification to authenticated;

grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- ---------- 기본 데이터 ----------
insert into public.category (name, is_alertable, sort_order) values
  ('창업', true, 1),
  ('근로', true, 2),
  ('장학', true, 3),
  ('졸업', true, 4),
  ('취업', true, 5),
  ('비교과', true, 6),
  ('특강', true, 7),
  ('기타', false, 99);

insert into public.category_rule (category_id, match_field, keyword_text)
select c.category_id, v.match_field, v.keyword_text
from (values
  ('창업', 'title', '창업'),
  ('창업', 'title', '스타트업'),
  ('창업', 'author_dept', '창업'),
  ('근로', 'title', '근로'),
  ('장학', 'title', '장학'),
  ('장학', 'author_dept', '장학'),
  ('졸업', 'title', '졸업'),
  ('졸업', 'title', '학위수여'),
  ('취업', 'title', '취업'),
  ('취업', 'title', '채용'),
  ('취업', 'title', '인턴'),
  ('취업', 'author_dept', '취업'),
  ('비교과', 'title', '비교과'),
  ('비교과', 'author_dept', '비교과'),
  ('특강', 'title', '특강'),
  ('특강', 'title', '강연'),
  ('특강', 'title', '세미나')
) as v (name, match_field, keyword_text)
join public.category c on c.name = v.name;
