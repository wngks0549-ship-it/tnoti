import Link from "next/link";

/** 모든 화면 맨 위의 띠. 왼쪽은 서비스 이름(누르면 첫 화면), 오른쪽은 화면마다 다르다. */
export function TopBar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
      <Link href="/" className="flex h-11 items-center text-title font-bold text-navy">
        TNoti
      </Link>
      {right}
    </header>
  );
}
