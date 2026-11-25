// S3 구독 설정 시안. 처음 가입한 사람의 화면이라 아무것도 고르지 않은 상태로 연다.
import { SubscribeForm } from "@/components/subscribe-form";
import { TopBar } from "@/components/top-bar";
import { getAlertCategories, getLatestNotices } from "@/lib/notices";

export default async function PreviewSubscribe() {
  const [categories, recent] = await Promise.all([getAlertCategories(), getLatestNotices(100)]);

  return (
    <>
      <TopBar />
      <main className="flex flex-1 flex-col">
        <SubscribeForm
          categories={categories}
          initial={{ categories: [], keywords: [] }}
          recent={recent}
          doneHref="/preview/notices"
        />
      </main>
    </>
  );
}
