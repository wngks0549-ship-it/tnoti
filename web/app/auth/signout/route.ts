// 로그아웃. 주소를 열기만 해서는 로그아웃되지 않게 POST 로만 받는다.
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = "/";
  redirectTo.search = "";
  return NextResponse.redirect(redirectTo, { status: 303 });
}
