// S7 설정 시안.
import { AppNav } from "@/components/app-nav";
import { SettingsForm } from "@/components/settings-form";
import { TopBar } from "@/components/top-bar";
import { SAMPLE_EMAIL, SAMPLE_SUBSCRIPTION } from "@/lib/sample";

export default function PreviewSettings() {
  return (
    <>
      <TopBar />
      <AppNav base="/preview" />
      <main className="flex flex-1 flex-col">
        <SettingsForm
          email={SAMPLE_EMAIL}
          notifyEnabled
          frequency="instant"
          channel="push"
          subscription={SAMPLE_SUBSCRIPTION}
          subscribeHref="/preview/subscribe"
        />
      </main>
    </>
  );
}
