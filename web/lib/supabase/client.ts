// 브라우저에서 쓰는 Supabase 클라이언트. Supabase 공식 문서(Creating a Supabase client for SSR)의 코드다.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
