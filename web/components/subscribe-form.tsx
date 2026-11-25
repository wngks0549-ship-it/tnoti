"use client";

// S3 구독 설정 (FR-03, FR-04). 두 걸음이다: ① 카테고리·키워드 고르기 ② 알림 허용.
// 지금은 화면만 있다. 저장(persist)과 실제 알림 허용(onAllow)은 로그인 연결 뒤에 붙인다.
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { chip, primaryButton, textButton, textInput } from "@/components/ui";
import { shortDate } from "@/lib/format";
import { keywordProblem, matchLabel, matchNotice, type Subscription } from "@/lib/match";
import type { Notice } from "@/lib/notices";

type Props = {
  categories: string[];
  initial: Subscription;
  /** 최근 공지. 고른 조건에 몇 건이 맞는지 바로 보여주는 데 쓴다. */
  recent: Notice[];
  /** 끝난 뒤 갈 곳 */
  doneHref: string;
};

export function SubscribeForm({ categories, initial, recent, doneHref }: Props) {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>(initial.categories);
  const [keywords, setKeywords] = useState<string[]>(initial.keywords);
  const [draft, setDraft] = useState("");
  const [keywordError, setKeywordError] = useState<string | null>(null);
  const [step, setStep] = useState<"choose" | "permission">("choose");

  const hits = useMemo(
    () =>
      recent
        .map((n) => ({ n, m: matchNotice(n, { categories: picked, keywords }) }))
        .filter((x) => x.m !== null),
    [recent, picked, keywords],
  );
  const empty = picked.length === 0 && keywords.length === 0;

  function toggle(name: string) {
    setPicked((cur) => (cur.includes(name) ? cur.filter((c) => c !== name) : [...cur, name]));
  }

  function addKeyword() {
    const keyword = draft.trim();
    if (!keyword) return;
    const problem = keywordProblem(keyword, keywords);
    if (problem) {
      setKeywordError(problem);
      return;
    }
    setKeywords((cur) => [...cur, keyword]);
    setDraft("");
    setKeywordError(null);
  }

  if (step === "permission") {
    const example = hits[0];
    return (
      <div className="flex flex-1 flex-col px-5 pt-10 pb-10">
        <h1 className="text-display font-bold">
          이 기기로 알림을
          <br />
          보낼까요?
        </h1>
        <p className="mt-3 text-sub">
          구독한 공지가 올라오면 이 기기에 알림이 떠요. 허용하지 않으면 학교 메일로 보내요.
        </p>

        {example && example.m && (
          <div className="mt-8 rounded-[10px] border border-line px-4 py-3.5">
            <p className="flex justify-between text-meta">
              <span className="font-bold text-navy">TNoti</span>
              <span className="text-sub">이렇게 와요</span>
            </p>
            <p className="mt-1 text-body font-bold">{example.n.title}</p>
            <p className="mt-0.5 text-meta text-sub">{matchLabel(example.m)}</p>
          </div>
        )}

        <button type="button" className={`${primaryButton} mt-8`} onClick={() => router.push(doneHref)}>
          알림 허용하기
        </button>
        <button
          type="button"
          className={`${textButton} mt-2 justify-center`}
          onClick={() => router.push(doneHref)}
        >
          메일로 받을게요
        </button>

        <p className="mt-6 text-meta text-sub">
          아이폰은 Safari의 공유 버튼에서 ‘홈 화면에 추가’를 한 뒤, 홈 화면의 TNoti에서 허용해야 알림이 와요.
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (!empty) setStep("permission");
      }}
    >
      <div className="flex-1 px-5 pt-10 pb-8">
        <h1 className="text-display font-bold">
          어떤 공지를
          <br />
          받을까요?
        </h1>
        <p className="mt-3 text-sub">카테고리와 키워드를 합쳐 하나 이상 고르면 돼요.</p>

        <fieldset className="mt-8">
          <legend className="text-title font-bold">카테고리</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((name) => {
              const on = picked.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(name)}
                  className={chip(on)}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-8">
          <label htmlFor="keyword" className="flex items-baseline justify-between">
            <span className="text-title font-bold">키워드</span>
            <span className="nums text-meta text-sub">{keywords.length} / 5</span>
          </label>
          <p className="mt-1 text-meta text-sub">
            제목이나 작성 부서에 이 낱말이 있으면 알려요. 2글자 이상.
          </p>

          <div className="mt-3 flex gap-2">
            <input
              id="keyword"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setKeywordError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              maxLength={20}
              placeholder="예: 생활관, 교환학생"
              aria-invalid={keywordError ? true : undefined}
              aria-describedby={keywordError ? "keyword-error" : undefined}
              className={textInput}
            />
            <button
              type="button"
              onClick={addKeyword}
              disabled={!draft.trim()}
              className="h-[52px] shrink-0 rounded-[10px] border border-navy px-5 text-body font-bold text-navy disabled:border-line disabled:text-sub"
            >
              넣기
            </button>
          </div>
          <p id="keyword-error" aria-live="polite" className="mt-2 min-h-5 text-meta text-alert">
            {keywordError}
          </p>

          {keywords.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {keywords.map((k) => (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => setKeywords((cur) => cur.filter((x) => x !== k))}
                    aria-label={`키워드 ${k} 빼기`}
                    className={`${chip(true)} gap-2`}
                  >
                    {k}
                    <span aria-hidden className="text-meta font-normal">
                      빼기
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 고른 조건이 실제 공지에 얼마나 걸리는지 바로 보여준다 */}
        <div className="mt-8 border-t border-line pt-5" aria-live="polite">
          {empty ? (
            <p className="text-sub">
              카테고리나 키워드를 고르면, 최근 공지 {recent.length}건 중 몇 건이 맞는지 여기에 보여요.
            </p>
          ) : (
            <>
              <p>
                최근 공지 {recent.length}건 중{" "}
                <strong className="nums font-bold text-navy">{hits.length}건</strong>이 이 조건에 맞아요.
              </p>
              <ul className="mt-3 space-y-2">
                {hits.slice(0, 3).map(({ n, m }) => (
                  <li key={n.notice_id} className="flex gap-3 text-meta">
                    <span className="nums w-10 shrink-0 text-sub">{shortDate(n.posted_at)}</span>
                    <span className="min-w-0 flex-1">
                      {n.title} {m && <span className="font-bold text-navy">{matchLabel(m)}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-line bg-paper px-5 pt-3 pb-4">
        <p className="mb-2 text-meta text-sub">
          {empty
            ? "카테고리나 키워드를 하나 이상 골라야 저장할 수 있어요."
            : "바꾼 조건은 다음 알림부터 적용돼요."}
        </p>
        <button type="submit" disabled={empty} className={primaryButton}>
          저장하고 알림 받기
        </button>
      </div>
    </form>
  );
}
