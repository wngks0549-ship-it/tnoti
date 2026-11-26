-- 가입하면 회원 행을 만든다(P1). 학교 메일이 아니면 가입 자체를 막는다(FR-02).
-- member에는 회원이 직접 넣는 정책이 없으므로, 인증 사용자가 생길 때 서버 쪽에서 만든다.

create function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null or lower(new.email) !~ '^[^@[:space:]]+@tukorea\.ac\.kr$' then
    raise exception '학교 이메일(@tukorea.ac.kr)로만 가입할 수 있습니다'
      using errcode = 'check_violation';
  end if;

  insert into public.member (member_id, email, email_verified_at, last_login_at)
  values (new.id, lower(new.email), new.email_confirmed_at, new.last_sign_in_at);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();

-- 메일 인증 시각과 마지막 로그인 시각을 회원 행에 옮긴다.
create function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.member
     set email_verified_at = new.email_confirmed_at,
         last_login_at = new.last_sign_in_at
   where member_id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
after update of email_confirmed_at, last_sign_in_at on auth.users
for each row
when (
  old.email_confirmed_at is distinct from new.email_confirmed_at
  or old.last_sign_in_at is distinct from new.last_sign_in_at
)
execute function public.handle_auth_user_updated();

-- 트리거로만 실행한다. 직접 호출은 막는다.
revoke execute on function public.handle_auth_user_created() from public, anon, authenticated;
revoke execute on function public.handle_auth_user_updated() from public, anon, authenticated;
