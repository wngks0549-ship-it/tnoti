// 서버용 비밀 키로 만드는 Supabase 클라이언트. RLS 를 건너뛰므로 발송 처리(/api/dispatch)에서만 쓴다.
// 브라우저로 가는 코드에서 불러오면 안 된다.
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
