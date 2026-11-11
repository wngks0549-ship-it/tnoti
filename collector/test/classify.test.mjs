import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { classify, extractDeadline } from "../classify.mjs";

const rules = JSON.parse(await readFile(new URL("../rules.json", import.meta.url), "utf8"));

test("제목 키워드로 여러 카테고리를 붙인다", () => {
  const r = classify(
    { title: "[현장실습지원센터] '26-2학기 국가근로장학생 모집(~11. 20.)", author_dept: "현장실습지원센터" },
    rules,
  );
  assert.deepEqual(r.categories, ["근로", "장학"]);
  assert.equal(r.method, "rule");
});

test("작성 부서로도 분류한다", () => {
  const r = classify(
    { title: "*마감임박*「마을과 살고 있는 로컬크리에이터」 참여자 모", author_dept: "창업교육센터" },
    rules,
  );
  assert.deepEqual(r.categories, ["창업"]);
  assert.equal(r.matched_rules[0].field, "author_dept");
});

test("어느 규칙에도 안 맞으면 기타다", () => {
  const r = classify(
    { title: "제14회 한국공학대학교 총장배 CAE 경진대회 대면평가 대상자 발표", author_dept: "기계공학과" },
    rules,
  );
  assert.deepEqual(r.categories, ["기타"]);
  assert.deepEqual(r.matched_rules, []);
});

test("기한 표현이 있을 때만 마감일을 뽑는다", () => {
  assert.equal(extractDeadline("국가근로장학생 모집(~11. 20.)", "2026-11-09"), "2026-11-20");
  assert.equal(extractDeadline("신청 안내 (11월 30일까지)", "2026-11-09"), "2026-11-30");
  assert.equal(extractDeadline("신청 안내 (11.30까지)", "2026-11-09"), "2026-11-30");
  assert.equal(extractDeadline("생활관 RC 특강 (11.19 목) '스피치'", "2026-11-10"), null);
  assert.equal(extractDeadline("TIP 엘리베이터 정기점검 안내", "2026-11-10"), null);
});

test("연말에 올라온 글의 1월 기한은 다음 해다", () => {
  assert.equal(extractDeadline("동계 프로그램 모집(~1. 10.)", "2026-12-20"), "2027-01-10");
});

test("없는 날짜는 버린다", () => {
  assert.equal(extractDeadline("모집(~2. 30.)", "2026-02-01"), null);
  assert.equal(extractDeadline("모집(~13. 5.)", "2026-02-01"), null);
});
