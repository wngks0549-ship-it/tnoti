// S2 가입·로그인: 메일을 보낸 뒤의 화면. 실제 화면은 메일을 보내야 볼 수 있어서 시안으로 따로 둔다.
// 아이폰 사파리에서만 보이는 안내도 여기서는 늘 보이게 한다.
import { IosInstallHint } from "@/components/ios-install-hint";
import { TopBar } from "@/components/top-bar";
import { LoginPanel } from "@/app/login/login-panel";
import { SAMPLE_EMAIL } from "@/lib/sample";

export const metadata = { title: "화면 시안 | TNoti" };

export default function PreviewLogin() {
  return (
    <>
      <TopBar />
      <IosInstallHint force />
      <main className="flex flex-1 flex-col px-5 pt-10 pb-10">
        <LoginPanel linkError={false} demoEmail={SAMPLE_EMAIL} />
      </main>
    </>
  );
}
