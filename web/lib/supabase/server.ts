// 서버(서버 컴포넌트, 서버 액션, 라우트)에서 쓰는 Supabase 클라이언트.
// Supabase 공식 문서(Creating a Supabase client for SSR)의 코드다. 요청마다 새로 만든다.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 서버 컴포넌트에서는 쿠키를 쓸 수 없다. proxy.ts 가 세션을 갱신하므로 무시해도 된다.
          }
        },
      },
    },
  );
}
