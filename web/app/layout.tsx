import type { Metadata, Viewport } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "TNoti",
  description: "관심 있는 한국공학대학교 공지만 알림으로 받아요.",
  // 아이폰 홈 화면에 추가했을 때 주소창 없이 앱처럼 열리게 한다.
  appleWebApp: { capable: true, title: "TNoti", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// 모든 화면이 요청할 때마다 새 공지와 로그인 상태를 읽는다. 미리 만들어 둘 수 있는 화면이 없으므로
// Next.js 16 의 "바로 뜨는 화면" 검사를 앱 전체에서 끈다(문서: route-segment-config/instant).
export const instant = false;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-ground text-body text-ink antialiased">
        {/* 휴대폰 화면 기준. 넓은 화면에서는 가운데 480px 기둥만 쓴다. */}
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-paper">
          {children}
        </div>
      </body>
    </html>
  );
}
