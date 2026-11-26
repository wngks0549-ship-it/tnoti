// 화면 7개를 한곳에서 여는 목록.
import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import { getLatestNotices } from "@/lib/notices";

export default async function PreviewIndex() {
  const [latest] = await getLatestNotices(1);

  const screens = [
    { id: "S1", name: "랜딩", note: "서비스 소개, 카테고리, 최근 공지", href: "/", real: true },
    { id: "S2", name: "가입·로그인", note: "학교 메일로 로그인 메일 받기", href: "/login", real: true },
    { id: "S2", name: "가입·로그인 (메일 보낸 뒤)", note: "메일의 숫자 입력, 아이폰 홈 화면 안내", href: "/preview/login", real: false },
    { id: "S3", name: "구독 설정", note: "카테고리와 키워드 고르기, 알림 허용", href: "/preview/subscribe", real: false },
    { id: "S4", name: "맞춤 공지 목록", note: "내 구독에 맞는 공지, 거르기, 찾기", href: "/preview/notices", real: false },
    { id: "S5", name: "공지 상세", note: "마감일, 수정 여부, 원문 링크", href: latest ? `/notices/${latest.notice_id}` : "/", real: true },
    { id: "S6", name: "알림 내역", note: "받은 알림과 채널, 실패한 건", href: "/preview/alerts", real: false },
    { id: "S7", name: "설정", note: "알림 켜기·끄기, 주기, 구독 변경, 탈퇴", href: "/preview/settings", real: false },
  ];

  return (
    <>
      <TopBar />
      <main className="flex-1 pb-10">
        <div className="px-5 pt-10 pb-6">
          <h1 className="text-display font-bold">화면 7개</h1>
          <p className="mt-3 text-sub">
            S1·S2·S5는 실제로 동작하는 화면이고, 나머지 넷은 예시 계정으로 채운 시안이에요.
          </p>
        </div>

        <ul className="border-t border-line">
          {screens.map((s) => (
            <li key={s.href} className="border-b border-line">
              <Link href={s.href} className="flex gap-3 px-5 py-4 active:bg-ground">
                <span className="nums w-14 shrink-0 text-title font-bold text-navy">{s.id}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-title font-bold">{s.name}</span>
                  <span className="block text-meta text-sub">{s.note}</span>
                </span>
                <span className="shrink-0 pt-0.5 text-meta font-bold text-sub">
                  {s.real ? "동작" : "시안"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
