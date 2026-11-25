import Link from "next/link";
import { BackButton } from "@/components/back-button";

/**
 * 모든 화면 맨 위의 띠. 왼쪽은 서비스 이름(누르면 첫 화면), 오른쪽은 화면마다 다르다.
 * back 을 주면 이름 앞에 뒤로 가기 버튼이 붙는다.
 */
export function TopBar({ right, back }: { right?: React.ReactNode; back?: boolean }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
      <div className="flex items-center">
        {back && <BackButton />}
        <Link href="/" className="flex h-11 items-center text-title font-bold text-navy">
          TNoti
        </Link>
      </div>
      {right}
    </header>
  );
}
