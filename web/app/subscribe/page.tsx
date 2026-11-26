// S3 구독 설정 (FR-03). 처음 로그인하면 여기로 오고, S7 의 "구독 바꾸기"로도 온다.
// 저장한 뒤 알림 허용을 묻는다(FR-04). 이미 푸시로 받고 있으면 묻지 않는다.
import { SubscribeForm } from "@/components/subscribe-form";
import { TopBar } from "@/components/top-bar";
import { getSubscription, requireMember } from "@/lib/member";
import { getAlertCategories, getLatestNotices } from "@/lib/notices";
import { savePushSubscription, useEmailChannel } from "../push-actions";
import { saveSubscription } from "./actions";

export const metadata = { title: "구독 설정 | TNoti" };

export default async function SubscribePage() {
  const member = await requireMember();
  const [categories, recent, initial] = await Promise.all([
    getAlertCategories(),
    getLatestNotices(100),
    getSubscription(),
  ]);
  const first = initial.categories.length === 0 && initial.keywords.length === 0;

  return (
    <>
      <TopBar back={!first} />
      <main className="flex flex-1 flex-col">
        <SubscribeForm
          categories={categories}
          initial={initial}
          recent={recent}
          doneHref="/notices"
          persist={saveSubscription}
          permissionStep={member.channel !== "push"}
          push={{ save: savePushSubscription, useEmail: useEmailChannel }}
        />
      </main>
    </>
  );
}
