// 로그인한 회원과 그 구독 읽기(P1). 회원 관련 테이블은 본인 것만 읽힌다(RLS).
import { redirect } from "next/navigation";
import type { Subscription } from "@/lib/match";
import { createClient } from "@/lib/supabase/server";

export type Member = {
  id: string;
  email: string;
  notifyEnabled: boolean;
  frequency: "instant" | "twice_daily";
  channel: "push" | "email";
};

/** 로그인했는지. 화면을 막을 때는 반드시 getClaims 로 확인한다(공식 문서의 주의 사항). */
export async function isLoggedIn() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims);
}

/** 로그인한 회원. 로그인하지 않았으면 S2 로 보낸다(FR-02). */
export async function requireMember(): Promise<Member> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { data: row, error } = await supabase
    .from("member")
    .select("member_id, email, notify_enabled, frequency, channel")
    .maybeSingle();
  if (error) throw new Error(`회원 정보를 읽지 못했다: ${error.message}`);
  // 로그인은 됐는데 회원 행이 없는 경우(탈퇴 직후의 남은 세션 등)는 다시 로그인하게 한다.
  if (!row) redirect("/login");

  return {
    id: row.member_id,
    email: row.email,
    notifyEnabled: row.notify_enabled,
    frequency: row.frequency,
    channel: row.channel,
  };
}

export async function getSubscription(): Promise<Subscription> {
  const supabase = await createClient();
  const [cats, kws] = await Promise.all([
    supabase.from("member_category").select("category(name, sort_order)"),
    supabase.from("member_keyword").select("keyword_text, keyword_id").order("keyword_id"),
  ]);
  if (cats.error) throw new Error(`구독 카테고리를 읽지 못했다: ${cats.error.message}`);
  if (kws.error) throw new Error(`구독 키워드를 읽지 못했다: ${kws.error.message}`);

  const categories = (cats.data as unknown as { category: { name: string; sort_order: number } | null }[])
    .map((r) => r.category)
    .filter((c): c is { name: string; sort_order: number } => c !== null)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => c.name);

  return { categories, keywords: kws.data.map((k) => k.keyword_text) };
}
