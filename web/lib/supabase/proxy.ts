// 요청마다 로그인 세션을 갱신하고, 로그인이 필요한 화면을 막는다(FR-02).
// 뼈대는 Supabase 공식 문서(Creating a Supabase client for SSR)의 lib/supabase/proxy.ts 다.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 로그인이 필요한 화면: S3 구독 설정, S4 맞춤 목록, S6 알림 내역, S7 설정.
// S5 공지 상세(/notices/번호)는 로그인 없이 열린다.
function needsLogin(pathname: string) {
  if (pathname === "/notices") return true;
  return ["/subscribe", "/alerts", "/settings"].some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function updateSession(request: NextRequest) {
  // Supabase 가 로그인 링크를 첫 화면(Site URL)으로 돌려보낸 경우: code 는 /auth/callback 으로 넘기고,
  // 만료 같은 오류는 로그인 화면에서 안내한다.
  if (request.nextUrl.pathname === "/") {
    const params = request.nextUrl.searchParams;
    if (params.has("code")) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/callback";
      return NextResponse.redirect(url);
    }
    if (params.has("error_code") || params.has("error")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "?error=link";
      return NextResponse.redirect(url);
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  // createServerClient 와 getClaims 사이에 다른 코드를 넣지 않는다(공식 문서의 주의 사항).
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user && needsLogin(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
