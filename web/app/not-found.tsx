import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import { primaryButton } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <TopBar />
      <main className="flex flex-1 flex-col px-5 pt-10 pb-10">
        <h1 className="text-display font-bold">찾는 화면이 없어요</h1>
        <p className="mt-3 text-sub">
          주소가 바뀌었거나, 아직 TNoti가 가져오지 못한 공지일 수 있어요.
        </p>
        <Link href="/" className={`${primaryButton} mt-8`}>
          첫 화면으로 가기
        </Link>
      </main>
    </>
  );
}
