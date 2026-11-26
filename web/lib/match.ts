// 공지가 구독 조건에 맞는지 판단한다(FR-11).
// 관심 카테고리에 속하거나, 제목이나 작성 부서에 등록한 키워드가 있으면 맞는 것이다.
// 서버의 발송(P4)도 같은 규칙을 써야 한다. 규칙을 바꾸면 두 곳을 같이 고친다.

export type Subscription = { categories: string[]; keywords: string[] };

export type Match = { by: "category" | "keyword"; value: string };

type Matchable = { title: string; author_dept: string; categories: string[] };

export function matchNotice(notice: Matchable, sub: Subscription): Match | null {
  const category = notice.categories.find((c) => sub.categories.includes(c));
  if (category) return { by: "category", value: category };

  const haystack = `${notice.title} ${notice.author_dept}`.toLowerCase();
  const keyword = sub.keywords.find((k) => haystack.includes(k.toLowerCase()));
  if (keyword) return { by: "keyword", value: keyword };

  return null;
}

/** 화면에 적는 이유: 카테고리는 이름 그대로, 키워드는 '키워드 ‘생활관’' */
export function matchLabel(match: Match) {
  return match.by === "category" ? match.value : `키워드 ‘${match.value}’`;
}

/** 키워드 하나를 넣어도 되는지(FR-03: 2글자 이상, 최대 5개). 안 되면 이유를 돌려준다. */
export function keywordProblem(keyword: string, existing: string[]) {
  if (keyword.length < 2) return "키워드는 2글자 이상이어야 해요.";
  if (keyword.length > 20) return "키워드는 20글자까지 넣을 수 있어요.";
  if (existing.some((k) => k.toLowerCase() === keyword.toLowerCase())) return "이미 넣은 키워드예요.";
  if (existing.length >= 5) return "키워드는 5개까지 넣을 수 있어요.";
  return null;
}
