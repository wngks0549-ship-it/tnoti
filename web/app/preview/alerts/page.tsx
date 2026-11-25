// S6 알림 내역 시안. 제목은 실제 공지, 보낸 시각·채널·실패 여부는 예시다.
import { AlertList } from "@/components/alert-list";
import { AppNav } from "@/components/app-nav";
import { TopBar } from "@/components/top-bar";
import { getLatestNotices } from "@/lib/notices";
import { sampleAlerts } from "@/lib/sample";

export default async function PreviewAlerts() {
  const alerts = sampleAlerts(await getLatestNotices(100));

  return (
    <>
      <TopBar />
      <AppNav base="/preview" />
      <main className="flex flex-1 flex-col">
        <AlertList alerts={alerts} />
      </main>
    </>
  );
}
