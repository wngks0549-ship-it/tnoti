import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseNoticeList } from "../parse.mjs";

const html = await readFile(new URL("./fixture-list.html", import.meta.url), "utf8");

test("첫 페이지에서 공지 10건을 읽는다", () => {
  const items = parseNoticeList(html);
  assert.equal(items.length, 10);
  assert.deepEqual(items[0], {
    article_id: 154770,
    board_no: 16227,
    title: "제14회 한국공학대학교 총장배 CAE 경진대회 대면평가 대상자 발표",
    author_dept: "스마트기계융합대학 기계공학과",
    posted_at: "2026-11-11",
    source_url: "https://tukorea.ac.kr/bbs/tukorea/1303/154770/artclView.do",
  });
});

test("50자에서 잘린 제목은 잘린 그대로 저장한다", () => {
  const items = parseNoticeList(html);
  const cut = items.find((i) => i.article_id === 154761);
  assert.equal(cut.title.length, 50);
  assert.ok(cut.title.endsWith("사진공모전 안"));
});

test("목록이 없으면 빈 배열을 돌려준다", () => {
  assert.deepEqual(parseNoticeList("<html><body><p>점검 중</p></body></html>"), []);
});

test("번호가 숫자가 아닌 글은 board_no를 null로 둔다", () => {
  const pinned = html.replace("<dd>16227</dd>", "<dd>공지</dd>");
  assert.equal(parseNoticeList(pinned)[0].board_no, null);
});
