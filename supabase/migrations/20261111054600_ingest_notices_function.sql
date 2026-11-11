-- 수집기가 읽은 공지를 한 번의 호출로 DB에 반영한다(FR-07~FR-10, NFR-01).
-- 공지를 넣거나 고치고, 제목이나 분류가 바뀌었으면 분류 결과와 공지 카테고리를 새로 만든다.
-- 서버용 키(service_role)로만 실행할 수 있다.
create function public.ingest_notices(p_notices jsonb, p_log jsonb default null)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  n jsonb;
  v_notice_id bigint;
  v_title text;
  v_author text;
  v_categories jsonb;
  v_matched jsonb;
  v_deadline date;
  v_result_id bigint;
  v_prev_title text;
  v_prev_author text;
  v_prev_categories jsonb;
  v_upserted int := 0;
  v_classified int := 0;
begin
  for n in select * from jsonb_array_elements(coalesce(p_notices, '[]'::jsonb))
  loop
    v_notice_id := (n->>'article_id')::bigint;
    v_title := n->>'title';
    v_author := coalesce(n->>'author_dept', '');
    v_deadline := nullif(n->>'deadline', '')::date;
    v_categories := coalesce(n->'categories', '[]'::jsonb);
    v_matched := coalesce(n->'classification'->'matched_rules', '[]'::jsonb);

    insert into public.notice (
      notice_id, source_url, board_no, title, author_dept, posted_at, deadline,
      status, on_first_page, collected_at, modified_at
    )
    values (
      v_notice_id,
      n->>'source_url',
      nullif(n->>'board_no', '')::int,
      v_title,
      v_author,
      coalesce(nullif(n->>'posted_at', '')::date, (n->>'collected_at')::timestamptz::date, current_date),
      v_deadline,
      coalesce(n->>'status', 'active'),
      coalesce((n->>'on_first_page')::boolean, false),
      coalesce((n->>'collected_at')::timestamptz, now()),
      nullif(n->>'modified_at', '')::timestamptz
    )
    on conflict (notice_id) do update set
      source_url = excluded.source_url,
      board_no = excluded.board_no,
      title = excluded.title,
      author_dept = excluded.author_dept,
      deadline = excluded.deadline,
      status = excluded.status,
      on_first_page = excluded.on_first_page,
      modified_at = excluded.modified_at;
    v_upserted := v_upserted + 1;

    select r.input_title, r.input_author_dept, r.output_categories
      into v_prev_title, v_prev_author, v_prev_categories
      from public.classification_result r
     where r.notice_id = v_notice_id and r.is_current;

    if not found
       or v_prev_title is distinct from v_title
       or v_prev_author is distinct from v_author
       or v_prev_categories is distinct from v_categories
    then
      update public.classification_result r
         set is_current = false
       where r.notice_id = v_notice_id and r.is_current;

      insert into public.classification_result (
        notice_id, method, input_title, input_author_dept, output_categories, output_deadline,
        basis_matched_rules, quality_flag, quality_threshold, quality_reason
      )
      values (
        v_notice_id, 'rule', v_title, v_author, v_categories, v_deadline, v_matched,
        case when jsonb_array_length(v_matched) > 0 then 'high' else 'low' end,
        0,
        case when jsonb_array_length(v_matched) > 0 then null
             else '규칙에 맞는 키워드가 없어 기타로 둠' end
      )
      returning result_id into v_result_id;

      delete from public.notice_category nc where nc.notice_id = v_notice_id;

      insert into public.notice_category (notice_id, category_id, result_id)
      select v_notice_id, c.category_id, v_result_id
        from jsonb_array_elements_text(v_categories) as x (name)
        join public.category c on c.name = x.name;

      v_classified := v_classified + 1;
    end if;
  end loop;

  if p_log is not null then
    insert into public.collect_log (
      run_type, target_url, status, new_count, modified_count, deleted_count,
      fail_reason, started_at, finished_at
    )
    values (
      coalesce(p_log->>'run_type', 'new'),
      p_log->>'target_url',
      p_log->>'status',
      coalesce((p_log->>'new_count')::int, 0),
      coalesce((p_log->>'modified_count')::int, 0),
      coalesce((p_log->>'deleted_count')::int, 0),
      p_log->>'fail_reason',
      coalesce((p_log->>'run_at')::timestamptz, now()),
      now()
    );
  end if;

  return jsonb_build_object('upserted', v_upserted, 'classified', v_classified);
end;
$$;

revoke execute on function public.ingest_notices(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.ingest_notices(jsonb, jsonb) to service_role;
