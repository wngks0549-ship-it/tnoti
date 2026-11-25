// Next.js 16 에서는 미들웨어를 proxy 라고 부른다. 모든 요청 앞에서 한 번 실행된다.
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // 정적 파일과 이미지, 서비스 워커는 건너뛴다.
    "/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
