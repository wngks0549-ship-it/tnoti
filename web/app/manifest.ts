// 휴대폰 홈 화면에 추가할 때 쓰는 앱 정보(Next.js 공식 가이드: Progressive Web Apps).
// 아이폰은 홈 화면에 추가한 뒤에만 푸시 알림을 받을 수 있다(iOS 16.4 이상).
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TNoti",
    short_name: "TNoti",
    description: "관심 있는 한국공학대학교 공지만 알림으로 받아요.",
    lang: "ko",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      // 안드로이드가 원이나 둥근 사각형으로 잘라 쓰는 아이콘. 글자를 가운데에 모아 그려서 같은 파일을 쓴다.
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
