// S2 가입·로그인 (FR-02): 로그인 없이 열린다. 이미 로그인했으면 맞춤 목록으로 보낸다.
import { redirect } from "next/navigation";
import { IosInstallHint } from "@/components/ios-install-hint";
import { TopBar } from "@/components/top-bar";
import { createClient } from "@/lib/supabase/server";
import { LoginPanel } from "./login-panel";

export const metadata = { title: "로그인 | TNoti" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/notices");

  const { error } = await searchParams;

  return (
    <>
      <TopBar />
      <IosInstallHint />
      <main className="flex flex-1 flex-col px-5 pt-10 pb-10">
        <LoginPanel linkError={error === "link"} />
      </main>
    </>
  );
}
