// S4 맞춤 공지 목록 (FR-12). 로그인이 필요하다. 구독이 아직 없으면 S3 로 보낸다.
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { NoticeList } from "@/components/notice-list";
import { TopBar } from "@/components/top-bar";
import { getSubscription, requireMember } from "@/lib/member";
import { getAlertCategories, getLatestNotices } from "@/lib/notices";

export const metadata = { title: "공지 | TNoti" };

export default async function NoticesPage() {
  await requireMember();
  const subscription = await getSubscription();
  if (subscription.categories.length === 0 && subscription.keywords.length === 0) {
    redirect("/subscribe");
  }

  const [categories, notices] = await Promise.all([getAlertCategories(), getLatestNotices(200)]);

  return (
    <>
      <TopBar />
      <AppNav />
      <main className="flex flex-1 flex-col">
        <NoticeList
          notices={notices}
          subscription={subscription}
          categories={categories}
          subscribeHref="/subscribe"
        />
      </main>
    </>
  );
}
