"use server";

// S2 가입·로그인 (FR-02): 학교 메일 주소로 로그인 링크를 보낸다.
// 처음 온 주소면 가입도 같이 된다. 학교 메일이 아닌 주소는 여기서 한 번, DB 트리거에서 한 번 더 막는다.
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const DOMAIN = "tukorea.ac.kr";

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; id: string; message: string };

function explain(code: string | undefined, status: number | undefined) {
  if (code === "email_address_not_authorized") {
    return "아직 이 주소로는 메일을 보낼 수 없어요. 메일 발송 설정이 끝나면 가입할 수 있어요.";
  }
  if (code === "over_email_send_rate_limit" || status === 429) {
    return "메일을 너무 자주 요청했어요. 잠시 뒤에 다시 해 주세요.";
  }
  return "로그인 링크를 보내지 못했어요. 잠시 뒤에 다시 해 주세요.";
}

export async function requestLoginLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const raw = String(formData.get("id") ?? "").trim().toLowerCase();

  // 주소 전체를 붙여 넣어도 받는다.
  let id = raw;
  if (raw.includes("@")) {
    const at = raw.lastIndexOf("@");
    if (raw.slice(at + 1) !== DOMAIN) {
      return { status: "error", id: raw, message: `학교 메일(@${DOMAIN})만 쓸 수 있어요.` };
    }
    id = raw.slice(0, at);
  }
  if (!/^[a-z0-9._%+-]{1,64}$/.test(id)) {
    return { status: "error", id: raw, message: "메일 주소의 @ 앞부분을 입력해 주세요." };
  }

  const email = `${id}@${DOMAIN}`;
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    console.error("로그인 링크 발송 실패:", error.code, error.status);
    return { status: "error", id, message: explain(error.code, error.status) };
  }
  return { status: "sent", email };
}
