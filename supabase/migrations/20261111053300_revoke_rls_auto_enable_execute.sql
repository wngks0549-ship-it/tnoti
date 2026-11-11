-- "Enable automatic RLS" 옵션이 만든 함수다. 이벤트 트리거로만 쓰이므로 API로 호출할 수 없게 실행 권한을 걷어 낸다.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
