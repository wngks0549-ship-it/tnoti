// 시안: 로그인 없이 화면을 미리 본다. 공지는 실제 데이터, 계정·구독·알림 기록은 예시다.
// 진짜 화면(/subscribe, /notices, /alerts, /settings)은 같은 조각(components/)에 실제 데이터를 넣어 만든다.
import Link from "next/link";

export const metadata = { title: "화면 시안 | TNoti" };

export default function PreviewLayout({ children }: LayoutProps<"/preview">) {
  return (
    <>
      <p className="flex shrink-0 items-center justify-between gap-3 bg-ground px-5 py-2 text-meta text-sub">
        <span>시안이에요. 예시 계정이고, 눌러도 저장되지 않아요.</span>
        <Link href="/preview" className="shrink-0 font-bold text-navy">
          화면 목록
        </Link>
      </p>
      {children}
    </>
  );
}
