"use server";

// S2 가입·로그인 (FR-02): 학교 메일 주소로 로그인 메일을 보낸다. 메일에는 링크와 숫자 코드가 같이 들어 있다.
// 숫자 코드가 필요한 이유: 아이폰의 홈 화면 앱은 사파리와 로그인 상태를 나눠 쓰지 않아서,
// 메일의 링크(사파리에서 열림)로는 앱이 로그인되지 않는다. 앱 안에서 숫자를 입력하면 그 앱이 로그인된다.
// 처음 온 주소면 가입도 같이 된다. 학교 메일이 아닌 주소는 여기서 한 번, DB 트리거에서 한 번 더 막는다.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

export type VerifyState = { status: "idle" } | { status: "error"; message: string };

/** 메일로 받은 숫자 코드를 확인해 로그인한다(Supabase 문서: Passwordless email, verifyOtp). */
export async function verifyLoginCode(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  // 메일에서 복사할 때 섞여 들어온 빈칸은 지운다. 자릿수는 Supabase 설정을 따른다(기본 6자리).
  const token = String(formData.get("code") ?? "").replace(/\s/g, "");

  if (!email.endsWith(`@${DOMAIN}`)) {
    return { status: "error", message: "주소를 다시 입력해 주세요." };
  }
  if (!/^[0-9]{6,10}$/.test(token)) {
    return { status: "error", message: "메일에 있는 숫자를 그대로 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    console.error("로그인 코드 확인 실패:", error.code, error.status);
    return {
      status: "error",
      message:
        error.status === 429
          ? "너무 여러 번 시도했어요. 잠시 뒤에 다시 해 주세요."
          : "숫자가 맞지 않거나 시간이 지났어요. 메일을 다시 받아 주세요.",
    };
  }
  redirect("/notices");
}
