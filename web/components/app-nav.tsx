"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { path: "/notices", label: "공지" },
  { path: "/alerts", label: "알림 내역" },
  { path: "/settings", label: "설정" },
];

/** 로그인한 뒤 S4·S6·S7 을 오가는 상단 메뉴. base 는 시안에서 "/preview" 다. */
export function AppNav({ base = "" }: { base?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="주 메뉴" className="flex shrink-0 border-b border-line px-5">
      {TABS.map((tab) => {
        const href = base + tab.path;
        const current = pathname === href;
        return (
          <Link
            key={tab.path}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`-mb-px mr-6 flex h-11 items-center border-b-2 text-body ${
              current ? "border-navy font-bold text-navy" : "border-transparent text-sub"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
