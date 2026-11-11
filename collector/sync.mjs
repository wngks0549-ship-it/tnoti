// 수집한 공지를 Supabase에 반영한다. DB 쪽 처리는 ingest_notices 함수가 한 번에 한다.
// 서버용 키는 GitHub 저장소의 비밀 값에서 환경 변수로만 받는다. 코드나 로그에 남기지 않는다.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const SYNC_LIMIT = 200; // 최신 200건만 보낸다. 오래된 공지는 더 바뀌지 않는다.

const path = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const NOTICES_FILE = path("../data/notices.json");
const LAST_RUN_FILE = path("./.last-run.json");

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.log("Supabase 설정이 없어서 DB 반영을 건너뛴다.");
} else {
  const notices = (await readJson(NOTICES_FILE, [])).slice(0, SYNC_LIMIT);
  // 이번 실행에서 기록할 일이 있었을 때만 collect.mjs가 이 파일을 남긴다.
  const log = await readJson(LAST_RUN_FILE, null);

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.rpc("ingest_notices", {
    p_notices: notices,
    p_log: log,
  });

  if (error) {
    console.error(`DB 반영 실패: ${error.message}`);
    process.exitCode = 1;
  } else {
    console.log(`DB 반영 완료: 공지 ${data.upserted}건 확인, 새로 분류 ${data.classified}건`);
  }
}
