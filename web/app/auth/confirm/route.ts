// 메일의 로그인 링크가 도착하는 곳. 링크에 든 token_hash 를 세션으로 바꾼다.
// Supabase 공식 예제(app/auth/confirm/route.ts)의 방식이다. 메일을 연 기기와 요청한 기기가 달라도 된다.
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // 비밀 토큰이 주소에 남지 않게 지우고 이동한다.
  const redirectTo = request.nextUrl.clone();
  redirectTo.search = "";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirectTo.pathname = "/subscribe";
      return NextResponse.redirect(redirectTo);
    }
  }

  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("error", "link");
  return NextResponse.redirect(redirectTo);
}
