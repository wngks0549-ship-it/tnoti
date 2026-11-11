// 방금 읽은 첫 페이지 10건을 저장된 공지와 비교해 새 글, 제목 수정, 삭제를 반영한다(FR-07, FR-08).
import { classify, extractDeadline } from "./classify.mjs";

function buildNotice(item, rules, nowIso) {
  const result = classify(item, rules);
  return {
    article_id: item.article_id,
    source_url: item.source_url,
    board_no: item.board_no,
    title: item.title,
    author_dept: item.author_dept,
    posted_at: item.posted_at,
    deadline: extractDeadline(item.title, item.posted_at),
    status: "active",
    categories: result.categories,
    classification: { method: result.method, matched_rules: result.matched_rules },
    on_first_page: true,
    collected_at: nowIso,
    modified_at: null,
  };
}

/**
 * @param {object[]} stored 저장된 공지 전체
 * @param {object[]} pageItems parseNoticeList 결과
 * @param {object} rules 분류 규칙
 * @param {string} nowIso 실행 시각
 */
export function mergeNotices(stored, pageItems, rules, nowIso) {
  const byId = new Map(stored.map((n) => [n.article_id, { ...n }]));
  const pageIds = new Set(pageItems.map((i) => i.article_id));
  let newCount = 0;
  let modifiedCount = 0;
  let deletedCount = 0;

  for (const item of pageItems) {
    const existing = byId.get(item.article_id);
    if (!existing) {
      byId.set(item.article_id, buildNotice(item, rules, nowIso));
      newCount += 1;
      continue;
    }

    existing.board_no = item.board_no;
    existing.on_first_page = true;

    const changed = existing.title !== item.title || existing.author_dept !== item.author_dept;
    if (changed) {
      const result = classify(item, rules);
      existing.title = item.title;
      existing.author_dept = item.author_dept;
      existing.deadline = extractDeadline(item.title, existing.posted_at);
      existing.categories = result.categories;
      existing.classification = { method: result.method, matched_rules: result.matched_rules };
      existing.status = "modified";
      existing.modified_at = nowIso;
      modifiedCount += 1;
    } else if (existing.status === "deleted") {
      // 지워진 줄 알았던 글이 다시 보이면 되살린다.
      existing.status = "active";
      existing.modified_at = nowIso;
      modifiedCount += 1;
    }
  }

  // 삭제 판단: 지난 실행 때 첫 페이지에 있던 글이 지금은 없는데,
  // 그보다 오래된 일반 글이 아직 보이면 밀려난 게 아니라 지워진 것이다.
  // 상단 고정 글(번호가 숫자가 아닌 글)은 오래된 글일 수 있어서 기준에서 뺀다.
  const numbered = pageItems.filter((i) => i.board_no !== null);
  const oldestVisibleId = numbered.length ? Math.min(...numbered.map((i) => i.article_id)) : null;

  for (const notice of byId.values()) {
    if (!notice.on_first_page || pageIds.has(notice.article_id)) continue;
    notice.on_first_page = false;
    if (notice.status === "deleted" || oldestVisibleId === null) continue;
    if (notice.article_id > oldestVisibleId) {
      notice.status = "deleted";
      notice.modified_at = nowIso;
      deletedCount += 1;
    }
  }

  const notices = [...byId.values()].sort((a, b) => b.article_id - a.article_id);
  return { notices, newCount, modifiedCount, deletedCount };
}
