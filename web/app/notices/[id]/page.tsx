// S5 공지 상세 (FR-13): 로그인 없이 열린다. 알림을 누르면 이 화면으로 온다.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { primaryButton } from "@/components/ui";
import { daysLeft, ddayLabel, longDate, shortDate, weekday } from "@/lib/format";
import { getNotice } from "@/lib/notices";

type Props = { params: Promise<{ id: string }> };

async function load(params: Props["params"]) {
  const { id } = await params;
  if (!/^\d{1,12}$/.test(id)) return null;
  return getNotice(Number(id));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const notice = await load(params);
  return { title: notice ? `${notice.title} | TNoti` : "공지를 찾을 수 없어요 | TNoti" };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-line py-3.5">
      <dt className="w-16 shrink-0 text-sub">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}

export default async function NoticePage({ params }: Props) {
  const notice = await load(params);
  if (!notice) notFound();

  const left = notice.deadline ? daysLeft(notice.deadline) : null;

  return (
    <>
      <TopBar back />
      <main className="flex flex-1 flex-col px-5 pt-7 pb-10">
        <p className="nums flex items-baseline gap-2">
          <span className="text-display font-bold text-navy">{shortDate(notice.posted_at)}</span>
          <span className="text-meta text-sub">{weekday(notice.posted_at)}요일에 올라온 공지</span>
        </p>

        <h1 className="mt-3 text-head font-bold">{notice.title}</h1>

        {notice.title.length >= 50 && (
          <p className="mt-2 text-meta text-sub">
            학교 목록에 보이는 50자까지만 가져와서 제목 뒤가 잘렸을 수 있어요.
          </p>
        )}

        <dl className="mt-6 border-t border-line">
          <Row label="작성 부서">{notice.author_dept || "적혀 있지 않아요"}</Row>
          <Row label="카테고리">
            {notice.categories.length > 0 ? (
              <span className="font-bold text-navy">{notice.categories.join(", ")}</span>
            ) : (
              <span className="text-sub">일곱 카테고리에 해당하지 않아요</span>
            )}
          </Row>
          <Row label="게시일">
            <span className="nums">{longDate(notice.posted_at)}</span>
          </Row>
          <Row label="마감일">
            {notice.deadline && left !== null ? (
              <span className="nums">
                {longDate(notice.deadline)}
                <span className={`ml-2 font-bold ${left <= 3 ? "text-alert" : "text-sub"}`}>
                  {ddayLabel(left)}
                </span>
              </span>
            ) : (
              <span className="text-sub">원문 확인 (제목에 날짜가 없어요)</span>
            )}
          </Row>
          <Row label="수정 여부">
            {notice.status === "modified" ? (
              <span className="font-bold text-navy">학교에서 제목을 고쳤어요</span>
            ) : notice.status === "deleted" ? (
              <span className="font-bold text-alert">학교 게시판에서 지워졌어요</span>
            ) : (
              <span className="text-sub">없어요</span>
            )}
          </Row>
        </dl>

        <a
          href={notice.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${primaryButton} mt-8`}
        >
          학교 홈페이지에서 원문 보기
        </a>
        <p className="mt-3 text-meta text-sub">
          TNoti는 제목과 작성 부서만 저장해요. 내용과 첨부 파일은 학교 홈페이지에 있어요.
        </p>
      </main>
    </>
  );
}
