"use server";

// 구독 조건 저장(FR-03). 규칙은 DB 함수 save_subscription 이 지킨다:
// 카테고리와 키워드를 합쳐 1개 이상, 키워드는 2글자 이상·최대 5개.
import { revalidatePath } from "next/cache";
import type { Subscription } from "@/lib/match";
import { createClient } from "@/lib/supabase/server";

export async function saveSubscription(sub: Subscription): Promise<{ error?: string }> {
  const categories = Array.isArray(sub?.categories) ? sub.categories.map(String).slice(0, 20) : [];
  const keywords = Array.isArray(sub?.keywords) ? sub.keywords.map(String).slice(0, 20) : [];

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_subscription", {
    p_categories: categories,
    p_keywords: keywords,
  });

  if (error) {
    // 23514(check_violation)는 함수가 직접 낸 안내 문구다. 그대로 보여준다.
    if (error.code === "23514") return { error: error.message };
    console.error("구독 저장 실패:", error.code, error.message);
    return { error: "저장하지 못했어요. 잠시 뒤에 다시 해 주세요." };
  }

  revalidatePath("/notices");
  revalidatePath("/settings");
  return {};
}
