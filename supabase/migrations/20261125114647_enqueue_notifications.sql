-- 매칭(P4의 앞부분, FR-11): 아직 매칭하지 않은 공지를 회원의 구독 조건과 맞춰 notification 행을 만든다.
-- 실제 발송은 웹 서버의 /api/dispatch 가 한다. 이 함수는 서버용 키로만 실행한다.

-- 매칭을 마친 시각. 비어 있으면 아직 알림 대상을 찾지 않은 공지다.
alter table public.notice add column matched_at timestamptz;

-- 지금까지 수집한 공지는 이미 지난 글이다. 알림을 보내지 않도록 매칭을 마친 것으로 둔다.
update public.notice set matched_at = collected_at;

create index notice_unmatched_idx on public.notice (notice_id) where matched_at is null;

create function public.enqueue_notifications()
returns int
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_ids bigint[];
  v_count int := 0;
begin
  select coalesce(array_agg(n.notice_id), '{}')
    into v_ids
    from (select notice_id from public.notice where matched_at is null for update) n;

  if cardinality(v_ids) = 0 then
    return 0;
  end if;

  with hits as (
    -- 회원 한 명에게 공지 하나는 알림 1건(FR-11). 이유는 카테고리가 먼저, 없으면 키워드.
    -- 규칙은 web/lib/match.ts 와 같아야 한다: 관심 카테고리에 속하거나, 제목·작성 부서에 키워드가 있다.
    select distinct on (m.member_id, p.notice_id)
           m.member_id, p.notice_id, h.matched_by, h.matched_value, m.frequency,
           case
             when m.channel = 'push' and exists (
               select 1 from public.push_subscription ps
                where ps.member_id = m.member_id and ps.expired_at is null
             ) then 'push'
             else 'email'
           end as channel
      from public.notice p
      cross join public.member m
      cross join lateral (
        select 'category' as matched_by, c.name as matched_value, 0 as pri, c.sort_order::bigint as ord
          from public.notice_category nc
          join public.member_category mc
            on mc.category_id = nc.category_id and mc.member_id = m.member_id
          join public.category c on c.category_id = nc.category_id
         where nc.notice_id = p.notice_id
        union all
        select 'keyword', mk.keyword_text, 1, mk.keyword_id
          from public.member_keyword mk
         where mk.member_id = m.member_id
           and position(lower(mk.keyword_text) in lower(p.title || ' ' || p.author_dept)) > 0
      ) h
     where p.notice_id = any (v_ids)
       and p.status <> 'deleted'
       and m.notify_enabled            -- 알림을 끈 회원에게는 만들지 않는다(FR-05)
     order by m.member_id, p.notice_id, h.pri, h.ord
  ),
  ins as (
    insert into public.notification (member_id, notice_id, matched_by, matched_value, channel, is_digest)
    select member_id, notice_id, matched_by, matched_value, channel, frequency = 'twice_daily'
      from hits
    on conflict (member_id, notice_id) do nothing
    returning 1
  )
  select count(*) into v_count from ins;

  update public.notice set matched_at = now() where notice_id = any (v_ids);
  return v_count;
end;
$$;

revoke execute on function public.enqueue_notifications() from public, anon, authenticated;
grant execute on function public.enqueue_notifications() to service_role;
