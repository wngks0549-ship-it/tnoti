-- 구독 조건을 한 번에 바꾼다(P1, FR-03). 카테고리와 키워드를 합쳐 1개 이상이어야 저장된다.
-- 호출한 회원의 권한(RLS)으로 실행하므로 남의 구독은 건드릴 수 없다.
create function public.save_subscription(p_categories text[], p_keywords text[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_member uuid := (select auth.uid());
  v_keywords text[];
  v_category_ids bigint[];
begin
  if v_member is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;

  -- 키워드: 앞뒤 공백을 떼고, 같은 낱말(대소문자 무시)은 하나만 남긴다. 넣은 순서를 지킨다.
  select coalesce(array_agg(s.k order by s.ord), '{}')
    into v_keywords
    from (
      select distinct on (lower(btrim(t.k))) btrim(t.k) as k, t.ord
        from unnest(coalesce(p_keywords, '{}')) with ordinality as t (k, ord)
       where btrim(t.k) <> ''
       order by lower(btrim(t.k)), t.ord
    ) s;

  if exists (select 1 from unnest(v_keywords) k where char_length(k) < 2 or char_length(k) > 20) then
    raise exception '키워드는 2글자 이상 20글자 이하여야 합니다' using errcode = 'check_violation';
  end if;
  if cardinality(v_keywords) > 5 then
    raise exception '키워드는 회원당 최대 5개까지 등록할 수 있습니다' using errcode = 'check_violation';
  end if;

  -- 카테고리: 알림을 받을 수 있는 것만(기타 제외)
  select coalesce(array_agg(c.category_id), '{}')
    into v_category_ids
    from public.category c
   where c.is_alertable
     and c.name = any (coalesce(p_categories, '{}'));

  if cardinality(v_category_ids) + cardinality(v_keywords) = 0 then
    raise exception '카테고리와 키워드를 합쳐 1개 이상 골라야 합니다' using errcode = 'check_violation';
  end if;

  delete from public.member_category mc where mc.member_id = v_member;
  insert into public.member_category (member_id, category_id)
  select v_member, id from unnest(v_category_ids) as id;

  delete from public.member_keyword mk where mk.member_id = v_member;
  insert into public.member_keyword (member_id, keyword_text)
  select v_member, k from unnest(v_keywords) as k;
end;
$$;

revoke execute on function public.save_subscription(text[], text[]) from public, anon;
grant execute on function public.save_subscription(text[], text[]) to authenticated;

-- 탈퇴(FR-06, NFR-02): 호출한 회원의 인증 사용자를 지운다.
-- member 와 구독, 푸시 구독, 알림 내역은 외래키(on delete cascade)로 함께 지워진다.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member uuid := (select auth.uid());
begin
  if v_member is null then
    raise exception '로그인이 필요합니다' using errcode = '28000';
  end if;
  delete from auth.users u where u.id = v_member;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
