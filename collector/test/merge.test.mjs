import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseNoticeList } from "../parse.mjs";
import { mergeNotices } from "../merge.mjs";

const html = await readFile(new URL("./fixture-list.html", import.meta.url), "utf8");
const rules = JSON.parse(await readFile(new URL("../rules.json", import.meta.url), "utf8"));
const page = parseNoticeList(html);
const T1 = "2026-11-11T05:00:00.000Z";
const T2 = "2026-11-11T05:10:00.000Z";

const item = (id, no, title = `공지 ${id}`) => ({
  article_id: id,
  board_no: no,
  title,
  author_dept: "학생지원팀",
  posted_at: "2026-11-11",
  source_url: `https://tukorea.ac.kr/bbs/tukorea/1303/${id}/artclView.do`,
});

test("처음 실행하면 10건이 모두 새 글이다", () => {
  const r = mergeNotices([], page, rules, T1);
  assert.equal(r.newCount, 10);
  assert.equal(r.notices.length, 10);
  assert.equal(r.notices[0].article_id, 154770);
  assert.equal(r.notices[0].status, "active");
});

test("같은 목록을 다시 읽으면 아무것도 바뀌지 않는다", () => {
  const first = mergeNotices([], page, rules, T1);
  const second = mergeNotices(first.notices, page, rules, T2);
  assert.equal(second.newCount + second.modifiedCount + second.deletedCount, 0);
  assert.equal(JSON.stringify(second.notices), JSON.stringify(first.notices));
});

test("새 글이 올라와 밀려난 글은 삭제로 보지 않는다", () => {
  const first = mergeNotices([], page, rules, T1);
  const shifted = [item(154780, 16228), ...page.slice(0, 9)];
  const second = mergeNotices(first.notices, shifted, rules, T2);
  assert.equal(second.newCount, 1);
  assert.equal(second.deletedCount, 0);
  const pushedOff = second.notices.find((n) => n.article_id === 154732);
  assert.equal(pushedOff.status, "active");
  assert.equal(pushedOff.on_first_page, false);
});

test("제목이 바뀌면 수정됨으로 표시하고 다시 분류한다", () => {
  const first = mergeNotices([], page, rules, T1);
  const edited = page.map((i) =>
    i.article_id === 154733 ? { ...i, title: "생활관 RC프로그램 호신술 특강 (11.18 수)" } : i,
  );
  const second = mergeNotices(first.notices, edited, rules, T2);
  assert.equal(second.modifiedCount, 1);
  const n = second.notices.find((x) => x.article_id === 154733);
  assert.equal(n.status, "modified");
  assert.equal(n.modified_at, T2);
  assert.deepEqual(n.categories, ["특강"]);
});

test("더 오래된 글은 보이는데 그 글만 없으면 삭제됨이다", () => {
  const first = mergeNotices([], page, rules, T1);
  const without = [...page.filter((i) => i.article_id !== 154742), item(154720, 16217)];
  const second = mergeNotices(first.notices, without, rules, T2);
  assert.equal(second.deletedCount, 1);
  assert.equal(second.notices.find((n) => n.article_id === 154742).status, "deleted");
});

test("상단 고정 글이 있어도 밀려난 글을 삭제로 보지 않는다", () => {
  const pinned = { ...item(100001, null, "상단 고정 공지"), board_no: null };
  const first = mergeNotices([], [pinned, ...page.slice(0, 9)], rules, T1);
  const next = [pinned, item(154780, 16228), ...page.slice(0, 8)];
  const second = mergeNotices(first.notices, next, rules, T2);
  assert.equal(second.deletedCount, 0);
  assert.equal(second.notices.find((n) => n.article_id === 154733).status, "active");
});
