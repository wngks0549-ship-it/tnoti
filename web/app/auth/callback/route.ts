// Supabase 기본 메일 문구(ConfirmationURL)를 그대로 쓸 때 도착하는 곳. 주소의 code 를 세션으로 바꾼다.
// 이 방식은 링크를 요청한 브라우저에서 열어야 한다. 메일 문구를 token_hash 방식으로 바꾸면 /auth/confirm 으로 온다.
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get("code");

  const redirectTo = request.nextUrl.clone();
  redirectTo.search = "";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirectTo.pathname = "/notices";
      return NextResponse.redirect(redirectTo);
    }
  }

  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("error", "link");
  return NextResponse.redirect(redirectTo);
}
