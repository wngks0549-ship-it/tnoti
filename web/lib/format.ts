// 날짜 표시. DB 의 날짜는 'YYYY-MM-DD' 글자라서 시간대에 흔들리지 않게 UTC 자정으로 읽는다.
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function parse(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** 2026-11-25 → 11.25 */
export function shortDate(date: string) {
  const [, m, d] = date.split("-");
  return `${Number(m)}.${d}`;
}

/** 2026-11-25 → 수 */
export function weekday(date: string) {
  return DAYS[parse(date).getUTCDay()];
}

/** 2026-11-25 → 2026년 11월 25일 (수) */
export function longDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일 (${weekday(date)})`;
}

/** 한국 시간 기준 오늘 날짜 'YYYY-MM-DD' */
export function todayKST() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
}

/** 마감일까지 남은 날 수. 지났으면 음수. */
export function daysLeft(deadline: string, today = todayKST()) {
  return Math.round((parse(deadline).getTime() - parse(today).getTime()) / 86_400_000);
}

export function ddayLabel(left: number) {
  if (left < 0) return "마감";
  if (left === 0) return "오늘 마감";
  return `D-${left}`;
}
