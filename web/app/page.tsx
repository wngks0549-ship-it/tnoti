// S1 랜딩 (FR-01): 로그인 없이 열린다. 서비스 소개, 카테고리 목록, 시작하기.
import Link from "next/link";
import { redirect } from "next/navigation";
import { NoticeRow } from "@/components/notice-row";
import { TopBar } from "@/components/top-bar";
import { primaryButton } from "@/components/ui";
import { isLoggedIn } from "@/lib/member";
import { getAlertCategories, getLatestNotices } from "@/lib/notices";

export default async function LandingPage() {
  // 로그인한 회원에게 첫 화면은 맞춤 목록(S4)이다.
  if (await isLoggedIn()) redirect("/notices");

  const [categories, notices] = await Promise.all([getAlertCategories(), getLatestNotices(5)]);

  return (
    <>
      <TopBar
        right={
          <Link href="/login" className="flex h-11 items-center text-body font-bold text-navy">
            로그인
          </Link>
        }
      />

      <main className="flex flex-1 flex-col pb-10">
        <section className="px-5 pt-10">
          <h1 className="text-display font-bold">
            찾으러 가던 학교 공지가,
            <br />
            내 폰으로 찾아와요
          </h1>
          <p className="mt-3 text-sub">
            한국공학대학교 전체공지에 새 글이 올라오면, 고른 카테고리와 키워드에 맞는 글만 알려요.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2" aria-label="고를 수 있는 카테고리">
            {categories.map((name) => (
              <li
                key={name}
                className="flex h-9 items-center rounded-full border border-line px-3.5 text-body"
              >
                {name}
              </li>
            ))}
            <li className="flex h-9 items-center rounded-full border border-dashed border-line px-3.5 text-body text-sub">
              없는 관심사는 키워드로
            </li>
          </ul>

          <Link href="/login" className={`${primaryButton} mt-8`}>
            학교 메일로 시작하기
          </Link>
        </section>

        <section className="mt-12">
          <h2 className="px-5 pb-3 text-title font-bold">방금 전체공지에 올라온 글</h2>
          <ul className="border-t border-line">
            {notices.map((n) => (
              <NoticeRow key={n.notice_id} notice={n} />
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
