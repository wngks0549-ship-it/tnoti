"use client";

import { useRouter } from "next/navigation";

/** 뒤로 가기. 알림을 눌러 바로 들어온 경우처럼 돌아갈 곳이 없으면 fallback 으로 간다. */
export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="뒤로"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="-ml-3 flex size-11 items-center justify-center text-ink"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
