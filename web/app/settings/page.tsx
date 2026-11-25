// S7 설정 (FR-04 받는 방법 표시, FR-05, FR-06). 로그인이 필요하다.
import { AppNav } from "@/components/app-nav";
import { SettingsForm } from "@/components/settings-form";
import { TopBar } from "@/components/top-bar";
import { getSubscription, requireMember } from "@/lib/member";
import { deleteAccount, setFrequency, setNotifyEnabled } from "./actions";

export const metadata = { title: "설정 | TNoti" };

export default async function SettingsPage() {
  const member = await requireMember();
  const subscription = await getSubscription();

  return (
    <>
      <TopBar />
      <AppNav />
      <main className="flex flex-1 flex-col">
        <SettingsForm
          email={member.email}
          notifyEnabled={member.notifyEnabled}
          frequency={member.frequency}
          channel={member.channel}
          subscription={subscription}
          subscribeHref="/subscribe"
          onNotifyChange={setNotifyEnabled}
          onFrequencyChange={setFrequency}
          onDelete={deleteAccount}
          signoutPath="/auth/signout"
        />
      </main>
    </>
  );
}
