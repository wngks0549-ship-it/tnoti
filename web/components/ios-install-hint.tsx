"use client";

// 아이폰 사파리로 들어온 사람에게만 보이는 안내(Next.js 공식 가이드: Progressive Web Apps).
// 아이폰은 홈 화면에 추가한 앱에서만 푸시 알림을 받을 수 있고(iOS 16.4 이상),
// 그 앱은 사파리와 로그인 상태를 나눠 쓰지 않는다. 그래서 로그인하기 전에 먼저 알려 준다.
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

function needsInstall() {
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // 아이패드는 맥으로 자기를 소개한다. 손가락 입력이 되는 맥이면 아이패드다.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

export function IosInstallHint({ force = false }: { force?: boolean }) {
  // 서버에서는 기기를 모르므로 숨긴 채로 그리고, 브라우저에서 확인한 뒤 보여 준다.
  const show = useSyncExternalStore(subscribe, needsInstall, () => false);
  if (!show && !force) return null;

  return (
    <aside className="border-b border-line bg-ground px-5 py-4">
      <p className="text-body font-bold">아이폰은 홈 화면에 먼저 추가해 주세요</p>
      <p className="mt-1 text-meta text-sub">
        사파리 아래쪽의 공유 버튼을 누르고 ‘홈 화면에 추가’를 고르세요. 홈 화면에 생긴 TNoti에서 로그인해야 알림을
        받을 수 있어요.
      </p>
    </aside>
  );
}
