"use server";

// S7 설정의 저장(FR-05, FR-06). 회원이 고칠 수 있는 것은 알림 켜기·끄기와 받는 주기뿐이다(DB 권한).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

async function updateMember(patch: Record<string, unknown>): Promise<Result> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const id = claims?.claims?.sub;
  if (!id) return { error: "다시 로그인해 주세요." };

  const { error } = await supabase.from("member").update(patch).eq("member_id", id);
  if (error) {
    console.error("설정 저장 실패:", error.code, error.message);
    return { error: "저장하지 못했어요. 잠시 뒤에 다시 해 주세요." };
  }
  revalidatePath("/settings");
  return {};
}

export async function setNotifyEnabled(enabled: boolean): Promise<Result> {
  return updateMember({ notify_enabled: Boolean(enabled) });
}

export async function setFrequency(frequency: "instant" | "twice_daily"): Promise<Result> {
  if (frequency !== "instant" && frequency !== "twice_daily") return { error: "고를 수 없는 값이에요." };
  return updateMember({ frequency });
}

/** 탈퇴(FR-06): 회원 정보, 구독, 알림 내역을 바로 지우고 첫 화면으로 간다. */
export async function deleteAccount(): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    console.error("탈퇴 실패:", error.code, error.message);
    return { error: "탈퇴하지 못했어요. 잠시 뒤에 다시 해 주세요." };
  }
  // 계정은 이미 없다. 이 기기에 남은 로그인 정보만 지운다.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
