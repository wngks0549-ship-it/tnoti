// S3 구독 설정 자리. 지금은 로그인이 됐는지 확인하는 화면만 있다.
// 다음 작업에서 카테고리 선택, 키워드 등록, 알림 허용(FR-03, FR-04)을 여기에 만든다.
import { redirect } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { textButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "구독 설정 | TNoti" };

export default async function SubscribePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  // 가입할 때 DB 트리거가 만든 회원 행. 본인 것만 읽힌다(RLS).
  const { data: member } = await supabase
    .from("member")
    .select("email, channel, frequency")
    .maybeSingle();

  return (
    <>
      <TopBar />
      <main className="flex flex-1 flex-col px-5 pt-10 pb-10">
        <h1 className="text-display font-bold">로그인됐어요</h1>
        <p className="mt-3 text-sub">
          <span className="font-bold text-ink">{member?.email ?? String(claims.email ?? "")}</span>
          <br />
          {member
            ? "회원 정보가 만들어졌어요. 카테고리와 키워드를 고르는 화면은 다음 작업에서 여기에 들어가요."
            : "로그인은 됐는데 회원 정보를 찾지 못했어요. 운영자에게 알려 주세요."}
        </p>

        <form action="/auth/signout" method="post" className="mt-6">
          <button type="submit" className={textButton}>
            로그아웃
          </button>
        </form>
      </main>
    </>
  );
}
