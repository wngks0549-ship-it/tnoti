import Link from "next/link";
import { daysLeft, ddayLabel, shortDate, weekday } from "@/lib/format";
import type { Notice } from "@/lib/notices";

/** 공지 한 줄: 날짜 기둥 + 제목(자르지 않는다) + 부서·카테고리 + D-day */
export function NoticeRow({ notice }: { notice: Notice }) {
  const left = notice.deadline ? daysLeft(notice.deadline) : null;

  return (
    <li className="border-b border-line">
      <Link href={`/notices/${notice.notice_id}`} className="flex gap-3 px-5 py-4 active:bg-ground">
        <div className="nums w-14 shrink-0 whitespace-nowrap">
          <div className="text-title font-bold text-navy">{shortDate(notice.posted_at)}</div>
          <div className="text-meta text-sub">{weekday(notice.posted_at)}</div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-title font-bold">{notice.title}</p>
          <p className="mt-1 text-meta text-sub">
            {notice.author_dept}
            {notice.categories.length > 0 && (
              <span className="ml-2 font-bold text-navy">{notice.categories.join(", ")}</span>
            )}
          </p>
        </div>

        {left !== null && left >= 0 && (
          <div
            className={`nums shrink-0 pt-0.5 text-meta font-bold ${left <= 3 ? "text-alert" : "text-sub"}`}
          >
            {ddayLabel(left)}
          </div>
        )}
      </Link>
    </li>
  );
}
