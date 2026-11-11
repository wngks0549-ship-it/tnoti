// TNoti 수집기: 학교 전체공지 목록의 첫 페이지 한 장만 읽어서 data/notices.json에 쌓는다.
//
// 지키는 것 (NFR-01)
// - 학교 robots.txt가 허용하는 목록 페이지 한 곳만 요청한다.
//   게시글 본문, RSS, 2페이지 이후(/bbs/ 경로)는 금지돼 있어서 요청하지 않는다.
// - 한 번 실행에 요청은 한 번이다. 실행 주기는 워크플로에서 10분으로 정한다.
import { readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseNoticeList } from "./parse.mjs";
import { mergeNotices } from "./merge.mjs";

const LIST_URL = "https://tukorea.ac.kr/tukorea/7607/subview.do";
const USER_AGENT =
  "TNoti-collector/0.1 (university course project; +https://github.com/wngks0549-ship-it/tnoti)";
const LOG_LIMIT = 1000;

const path = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const NOTICES_FILE = path("../data/notices.json");
const LOG_FILE = path("../data/collect_log.json");
const RULES_FILE = path("./rules.json");
// 이번 실행의 기록. DB 반영 단계(sync.mjs)가 읽는다. 저장소에는 올리지 않는다.
const LAST_RUN_FILE = path("./.last-run.json");

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

const writeJson = (file, value) => writeFile(file, JSON.stringify(value, null, 2) + "\n", "utf8");

async function fetchListHtml() {
  // 시험할 때는 LIST_HTML_FILE에 저장해 둔 HTML 파일 경로를 주면 학교 사이트에 요청하지 않는다.
  if (process.env.LIST_HTML_FILE) return readFile(process.env.LIST_HTML_FILE, "utf8");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(LIST_URL, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`목록 페이지 응답 코드 ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// 수집 기록을 파일에 남기고, DB 반영 단계가 같은 기록을 쓰도록 따로 적어 둔다.
async function recordRun(log, entry) {
  await writeJson(LOG_FILE, [...log, entry].slice(-LOG_LIMIT));
  await writeJson(LAST_RUN_FILE, entry);
}

async function main() {
  const nowIso = new Date().toISOString();
  await rm(LAST_RUN_FILE, { force: true });
  const [stored, log, rules] = await Promise.all([
    readJson(NOTICES_FILE, []),
    readJson(LOG_FILE, []),
    readJson(RULES_FILE, { categories: [] }),
  ]);

  const entry = {
    run_at: nowIso,
    run_type: "new",
    target_url: LIST_URL,
    status: "success",
    new_count: 0,
    modified_count: 0,
    deleted_count: 0,
    fail_reason: null,
  };

  try {
    const html = await fetchListHtml();
    const items = parseNoticeList(html);
    if (items.length === 0) {
      throw new Error("목록에서 공지를 하나도 찾지 못했다. 페이지 구조가 바뀌었을 수 있다.");
    }

    const merged = mergeNotices(stored, items, rules, nowIso);
    entry.new_count = merged.newCount;
    entry.modified_count = merged.modifiedCount;
    entry.deleted_count = merged.deletedCount;

    const before = JSON.stringify(stored);
    const after = JSON.stringify(merged.notices);
    if (before !== after) await writeJson(NOTICES_FILE, merged.notices);

    // 바뀐 게 있을 때만 기록을 남긴다. 10분마다 빈 기록이 쌓이면 저장소 이력이 지저분해진다.
    const changed = merged.newCount + merged.modifiedCount + merged.deletedCount > 0;
    const recovered = log.length > 0 && log.at(-1).status === "failed";
    if (changed || recovered) await recordRun(log, entry);

    console.log(
      `수집 완료: 목록 ${items.length}건, 새 글 ${merged.newCount}, 수정 ${merged.modifiedCount}, 삭제 ${merged.deletedCount}, 누적 ${merged.notices.length}건`,
    );
  } catch (err) {
    entry.status = "failed";
    entry.fail_reason = String(err?.message ?? err).slice(0, 300);
    // 연속 실패는 첫 번째만 기록한다. 다음 주기에 다시 시도한다.
    const alreadyFailing = log.length > 0 && log.at(-1).status === "failed";
    if (!alreadyFailing) await recordRun(log, entry);
    console.error(`수집 실패: ${entry.fail_reason}`);
  }
}

await main();
