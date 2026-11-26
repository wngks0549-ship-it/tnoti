"use server";

// 받는 방법 정하기(FR-04): 알림을 허용하면 푸시 구독을 저장하고 푸시로, 아니면 메일로.
import { revalidatePath } from "next/cache";
import type { PushSubscriptionData } from "@/lib/push-client";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

async function setChannel(channel: "push" | "email"): Promise<Result> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return { error: "다시 로그인해 주세요." };

  const { error } = await supabase.from("member").update({ channel }).eq("member_id", id);
  if (error) {
    console.error("받는 방법 저장 실패:", error.code, error.message);
    return { error: "저장하지 못했어요. 잠시 뒤에 다시 해 주세요." };
  }
  revalidatePath("/settings");
  return {};
}

/** 이 기기의 푸시 구독을 저장하고 받는 방법을 푸시로 바꾼다. */
export async function savePushSubscription(sub: PushSubscriptionData): Promise<Result> {
  const endpoint = String(sub?.endpoint ?? "");
  const p256dh = String(sub?.p256dh ?? "");
  const auth = String(sub?.auth ?? "");
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 2000 || !p256dh || !auth) {
    return { error: "알림 구독 정보가 올바르지 않아요." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return { error: "다시 로그인해 주세요." };

  // 같은 기기를 다시 등록하는 경우: 내 것 중 같은 주소를 지우고 새로 넣는다.
  await supabase.from("push_subscription").delete().eq("endpoint", endpoint);
  const { error } = await supabase
    .from("push_subscription")
    .insert({ member_id: id, endpoint, p256dh_key: p256dh, auth_key: auth });
  if (error) {
    console.error("푸시 구독 저장 실패:", error.code, error.message);
    // 23505: 같은 브라우저를 다른 계정이 이미 등록한 경우
    return {
      error:
        error.code === "23505"
          ? "이 브라우저는 다른 계정의 알림에 등록돼 있어요. 그 계정에서 로그아웃한 뒤 다시 해 주세요."
          : "알림 구독을 저장하지 못했어요. 잠시 뒤에 다시 해 주세요.",
    };
  }
  return setChannel("push");
}

/** 알림을 허용하지 않았거나 못 쓰는 기기: 메일로 받는다. */
export async function useEmailChannel(): Promise<Result> {
  return setChannel("email");
}
