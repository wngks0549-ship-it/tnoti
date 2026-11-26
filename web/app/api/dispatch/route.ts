// 매칭·알림 발송(P4, FR-11, NFR-03).
// ① 아직 매칭하지 않은 공지를 구독 조건과 맞춰 알림 행을 만들고(DB 함수 enqueue_notifications)
// ② 즉시 받는 회원의 푸시 알림을 보낸 뒤 ③ 성공과 실패를 알림 이력에 남긴다.
// 수집기나 예약 실행이 `Authorization: Bearer <DISPATCH_SECRET>` 을 붙여 POST 로 부른다.
//
// 아직 안 하는 것: 메일 발송(메일 채널과 푸시 실패 시 대체), 하루 두 번 묶음 발송.
import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { sendNotification, setVapidDetails } from "web-push";
import { matchLabel } from "@/lib/match";
import { createAdminClient } from "@/lib/supabase/admin";

type Pending = {
  notification_id: number;
  member_id: string;
  notice_id: number;
  matched_by: "category" | "keyword";
  matched_value: string;
  notice: { title: string } | null;
};

type Sub = { subscription_id: number; member_id: string; endpoint: string; p256dh_key: string; auth_key: string };

function authorized(request: NextRequest) {
  const secret = process.env.DISPATCH_SECRET;
  const given = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** 한 기기로 보낸다. 실패하면 한 번 더 시도한다(NFR-03). gone 은 구독이 만료된 경우다. */
async function sendOnce(sub: Sub, payload: string) {
  const target = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } };
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await sendNotification(target, payload, { TTL: 60 * 60 });
      return { ok: true as const, retries: attempt };
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      lastError = status ? `푸시 서비스 응답 ${status}` : "푸시 서비스에 연결하지 못함";
      if (status === 404 || status === 410) return { ok: false as const, gone: true, error: lastError, retries: attempt };
    }
  }
  return { ok: false as const, gone: false, error: lastError, retries: 1 };
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!admin || !publicKey || !privateKey) {
    return NextResponse.json(
      { error: "서버 설정이 빠졌다: SUPABASE_SECRET_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY" },
      { status: 500 },
    );
  }
  setVapidDetails(
    process.env.VAPID_SUBJECT ?? "https://github.com/wngks0549-ship-it/tnoti",
    publicKey,
    privateKey,
  );

  // ① 매칭
  const { data: enqueued, error: enqueueError } = await admin.rpc("enqueue_notifications");
  if (enqueueError) {
    console.error("매칭 실패:", enqueueError.message);
    return NextResponse.json({ error: "매칭에 실패했다" }, { status: 500 });
  }

  // ② 보낼 것: 푸시 채널, 즉시 받는 회원, 아직 안 보낸 것
  const { data: pendingRows, error: pendingError } = await admin
    .from("notification")
    .select("notification_id, member_id, notice_id, matched_by, matched_value, notice(title)")
    .eq("send_status", "requested")
    .eq("channel", "push")
    .eq("is_digest", false)
    .order("created_at")
    .limit(200);
  if (pendingError) {
    console.error("보낼 알림 읽기 실패:", pendingError.message);
    return NextResponse.json({ error: "보낼 알림을 읽지 못했다" }, { status: 500 });
  }
  const pending = pendingRows as unknown as Pending[];

  const memberIds = [...new Set(pending.map((p) => p.member_id))];
  const subsByMember = new Map<string, Sub[]>();
  if (memberIds.length > 0) {
    const { data: subs, error: subsError } = await admin
      .from("push_subscription")
      .select("subscription_id, member_id, endpoint, p256dh_key, auth_key")
      .in("member_id", memberIds)
      .is("expired_at", null);
    if (subsError) {
      console.error("푸시 구독 읽기 실패:", subsError.message);
      return NextResponse.json({ error: "푸시 구독을 읽지 못했다" }, { status: 500 });
    }
    for (const s of subs as Sub[]) {
      subsByMember.set(s.member_id, [...(subsByMember.get(s.member_id) ?? []), s]);
    }
  }

  let sent = 0;
  let failed = 0;
  for (const n of pending) {
    const payload = JSON.stringify({
      title: n.notice?.title ?? "새 공지",
      body: matchLabel({ by: n.matched_by, value: n.matched_value }),
      url: `/notices/${n.notice_id}`,
      tag: `notice-${n.notice_id}`,
    });

    // 회원이 등록한 기기 모두에 보낸다. 하나라도 가면 보낸 것으로 친다.
    const results = await Promise.all((subsByMember.get(n.member_id) ?? []).map((s) => sendOnce(s, payload).then((r) => ({ s, r }))));
    const gone = results.filter(({ r }) => !r.ok && r.gone).map(({ s }) => s.subscription_id);
    if (gone.length > 0) {
      await admin.from("push_subscription").update({ expired_at: new Date().toISOString() }).in("subscription_id", gone);
    }

    const ok = results.some(({ r }) => r.ok);
    const retries = results.reduce((max, { r }) => Math.max(max, r.retries), 0);
    // ③ 결과 기록
    const { error: updateError } = await admin
      .from("notification")
      .update(
        ok
          ? { send_status: "sent", sent_at: new Date().toISOString(), retry_count: retries, fail_reason: null }
          : {
              send_status: "failed",
              retry_count: retries,
              fail_reason:
                results.length === 0
                  ? "등록된 푸시 구독이 없음"
                  : results.map(({ r }) => (r.ok ? "" : r.error)).filter(Boolean)[0],
            },
      )
      .eq("notification_id", n.notification_id);
    if (updateError) console.error("발송 결과 기록 실패:", n.notification_id, updateError.message);

    if (ok) sent++;
    else failed++;
  }

  return NextResponse.json({ enqueued, sent, failed });
}
