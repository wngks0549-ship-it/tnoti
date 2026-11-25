// S6 알림 내역 (FR-14). 본인이 받은 알림만 읽힌다(RLS). 발송(P4)을 만들기 전에는 비어 있다.
import { AlertList, type AlertItem } from "@/components/alert-list";
import { AppNav } from "@/components/app-nav";
import { TopBar } from "@/components/top-bar";
import { requireMember } from "@/lib/member";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "알림 내역 | TNoti" };

type Row = {
  notification_id: number;
  notice_id: number;
  matched_by: "category" | "keyword";
  matched_value: string;
  channel: "push" | "email";
  send_status: "requested" | "sent" | "failed";
  retry_count: number;
  is_digest: boolean;
  created_at: string;
  sent_at: string | null;
  notice: { title: string } | null;
};

const kst = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
  dateStyle: "short",
  timeStyle: "short",
});

function toItem(r: Row): AlertItem {
  const [date, time] = kst.format(new Date(r.sent_at ?? r.created_at)).split(" ");
  const failed = r.send_status === "failed";
  const note = failed
    ? "보내지 못했어요."
    : r.channel === "email" && r.retry_count > 0
      ? "푸시가 가지 않아서 메일로 보냈어요."
      : r.is_digest
        ? "하루 두 번 묶음으로 보냈어요."
        : undefined;

  return {
    id: r.notification_id,
    noticeId: r.notice_id,
    title: r.notice?.title ?? "지워진 공지",
    sentDate: date,
    sentTime: time,
    match: { by: r.matched_by, value: r.matched_value },
    channel: r.channel,
    status: failed ? "failed" : "sent",
    note,
  };
}

export default async function AlertsPage() {
  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification")
    .select(
      "notification_id, notice_id, matched_by, matched_value, channel, send_status, retry_count, is_digest, created_at, sent_at, notice(title)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`알림 내역을 읽지 못했다: ${error.message}`);

  return (
    <>
      <TopBar />
      <AppNav />
      <main className="flex flex-1 flex-col">
        <AlertList alerts={(data as unknown as Row[]).map(toItem)} />
      </main>
    </>
  );
}
