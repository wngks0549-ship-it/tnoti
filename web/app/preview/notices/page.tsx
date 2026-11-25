// S4 맞춤 공지 목록 시안. 공지는 실제 데이터, 구독은 예시(장학, 특강, 키워드 생활관·캡스톤).
import { AppNav } from "@/components/app-nav";
import { NoticeList } from "@/components/notice-list";
import { TopBar } from "@/components/top-bar";
import { getAlertCategories, getLatestNotices } from "@/lib/notices";
import { SAMPLE_SUBSCRIPTION } from "@/lib/sample";

export default async function PreviewNotices() {
  const [categories, notices] = await Promise.all([getAlertCategories(), getLatestNotices(100)]);

  return (
    <>
      <TopBar />
      <AppNav base="/preview" />
      <main className="flex flex-1 flex-col">
        <NoticeList
          notices={notices}
          subscription={SAMPLE_SUBSCRIPTION}
          categories={categories}
          subscribeHref="/preview/subscribe"
        />
      </main>
    </>
  );
}
