// 시안(/preview)에만 쓰는 예시 데이터. 공지는 실제로 수집한 것을 쓰고, 계정과 알림 기록만 지어낸다.
import type { AlertItem } from "@/components/alert-list";
import { matchNotice, type Subscription } from "@/lib/match";
import type { Notice } from "@/lib/notices";

export const SAMPLE_EMAIL = "2021000000@tukorea.ac.kr";

export const SAMPLE_SUBSCRIPTION: Subscription = {
  categories: ["장학", "특강"],
  keywords: ["생활관", "캡스톤"],
};

/** 예시 구독에 맞는 최근 공지로 알림 기록 6건을 만든다. 시각과 채널은 예시다. */
export function sampleAlerts(notices: Notice[]): AlertItem[] {
  const hits = notices
    .map((n) => ({ n, m: matchNotice(n, SAMPLE_SUBSCRIPTION) }))
    .filter((x): x is { n: Notice; m: NonNullable<ReturnType<typeof matchNotice>> } => x.m !== null)
    .slice(0, 6);

  const times = ["14:10", "09:40", "20:00", "16:25", "12:00", "10:05"];
  return hits.map(({ n, m }, i) => ({
    id: i + 1,
    noticeId: n.notice_id,
    title: n.title,
    sentDate: n.posted_at,
    sentTime: times[i % times.length],
    match: m,
    channel: i === 2 ? "email" : "push",
    status: i === 4 ? "failed" : "sent",
    note:
      i === 2
        ? "푸시가 가지 않아서 메일로 보냈어요."
        : i === 4
          ? "푸시와 메일 모두 보내지 못했어요."
          : undefined,
  }));
}
