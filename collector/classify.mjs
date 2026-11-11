// 제목과 작성 부서로 카테고리를 붙이고(FR-09), 제목에서 마감일을 찾는다(FR-10).
// 지금은 키워드 규칙만 쓴다. 규칙으로 못 정한 공지는 "기타"로 둔다.

export const FALLBACK_CATEGORY = "기타";

/**
 * @param {{title:string, author_dept:string}} notice
 * @param {{categories:Array<{name:string, title_keywords?:string[], author_keywords?:string[]}>}} rules
 */
export function classify(notice, rules) {
  const title = notice.title ?? "";
  const author = notice.author_dept ?? "";
  const categories = [];
  const matched = [];

  for (const cat of rules.categories) {
    let hit = false;
    for (const kw of cat.title_keywords ?? []) {
      if (title.includes(kw)) {
        matched.push({ category: cat.name, field: "title", keyword: kw });
        hit = true;
      }
    }
    for (const kw of cat.author_keywords ?? []) {
      if (author.includes(kw)) {
        matched.push({ category: cat.name, field: "author_dept", keyword: kw });
        hit = true;
      }
    }
    if (hit) categories.push(cat.name);
  }

  return {
    method: "rule",
    categories: categories.length ? categories : [FALLBACK_CATEGORY],
    matched_rules: matched,
  };
}

const DEADLINE_PATTERNS = [
  /~\s*(\d{1,2})\s*[./]\s*(\d{1,2})/, // (~11. 20.)  ~11/20
  /(\d{1,2})\s*월\s*(\d{1,2})\s*일\s*까지/, // 11월 20일까지
  /(\d{1,2})\s*[./]\s*(\d{1,2})\.?\s*\)?\s*까지/, // 11.20까지
];

/**
 * 제목에 "~11. 20." 이나 "11월 20일까지"처럼 기한을 뜻하는 표현이 있을 때만 날짜를 돌려준다.
 * "(11.19 목)" 같은 행사 날짜는 마감일이 아니므로 잡지 않는다.
 * @param {string} title
 * @param {string} postedAt YYYY-MM-DD
 * @returns {string|null} YYYY-MM-DD
 */
export function extractDeadline(title, postedAt) {
  const posted = /^(\d{4})-(\d{2})-(\d{2})$/.exec(postedAt ?? "");
  if (!posted) return null;
  const postedYear = Number(posted[1]);
  const postedMonth = Number(posted[2]);

  for (const re of DEADLINE_PATTERNS) {
    const m = re.exec(title ?? "");
    if (!m) continue;
    const month = Number(m[1]);
    const day = Number(m[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) continue;
    // 12월에 올라온 글의 "~1. 10."은 다음 해다.
    const year = month < postedMonth - 6 ? postedYear + 1 : postedYear;
    const candidate = new Date(Date.UTC(year, month - 1, day));
    if (candidate.getUTCMonth() !== month - 1) continue; // 2월 30일 같은 값
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return null;
}
