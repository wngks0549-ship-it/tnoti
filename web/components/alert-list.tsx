// S6 알림 내역 (FR-14): 받은 알림을 최신순으로. 항목마다 받은 채널, 발송 실패도 보여준다.
import Link from "next/link";
import { shortDate } from "@/lib/format";
import { matchLabel, type Match } from "@/lib/match";

export type AlertItem = {
  id: number;
  noticeId: number;
  title: string;
  sentDate: string; // YYYY-MM-DD
  sentTime: string; // HH:MM
  match: Match;
  channel: "push" | "email";
  status: "sent" | "failed" | "pending";
  note?: string;
};

const CHANNEL = { push: "푸시", email: "메일" };

export function AlertList({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) {
    return (
      <div className="px-5 py-10">
        <p className="text-title font-bold">아직 받은 알림이 없어요</p>
        <p className="mt-1 text-sub">구독한 조건에 맞는 공지가 올라오면 여기에 쌓여요.</p>
      </div>
    );
  }

  return (
    <ul>
      {alerts.map((a) => {
        const failed = a.status === "failed";
        return (
          <li key={a.id} className="border-b border-line">
            <Link href={`/notices/${a.noticeId}`} className="flex gap-3 px-5 py-4 active:bg-ground">
              <div className="nums w-14 shrink-0 whitespace-nowrap">
                <div className="text-title font-bold text-navy">{shortDate(a.sentDate)}</div>
                <div className="text-meta text-sub">{a.sentTime}</div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-title font-bold">{a.title}</p>
                <p className="mt-1 text-meta font-bold text-navy">{matchLabel(a.match)}</p>
                {a.note && (
                  <p className={`mt-1 text-meta ${failed ? "text-alert" : "text-sub"}`}>{a.note}</p>
                )}
              </div>

              <div
                className={`shrink-0 pt-0.5 text-meta font-bold ${failed ? "text-alert" : "text-sub"}`}
              >
                {failed ? "실패" : a.status === "pending" ? "대기" : CHANNEL[a.channel]}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
