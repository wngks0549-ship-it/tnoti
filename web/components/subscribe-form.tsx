"use client";

// S3 구독 설정 (FR-03, FR-04). 두 걸음이다: ① 카테고리·키워드 고르기 ② 알림 허용.
// persist 와 push 를 주면 저장하고 실제로 알림을 켠다(진짜 화면). 안 주면 그냥 넘어간다(시안).
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { chip, primaryButton, textButton, textInput } from "@/components/ui";
import { shortDate } from "@/lib/format";
import { keywordProblem, matchLabel, matchNotice, type Subscription } from "@/lib/match";
import type { Notice } from "@/lib/notices";
import { enablePush, type PushSubscriptionData } from "@/lib/push-client";

type Props = {
  categories: string[];
  initial: Subscription;
  /** 최근 공지. 고른 조건에 몇 건이 맞는지 바로 보여주는 데 쓴다. */
  recent: Notice[];
  /** 끝난 뒤 갈 곳 */
  doneHref: string;
  /** 저장하는 서버 액션. 실패하면 error 에 안내 문구가 온다. */
  persist?: (sub: Subscription) => Promise<{ error?: string }>;
  /** 저장 뒤에 알림 허용 걸음을 보여줄지. 기본은 보여준다. */
  permissionStep?: boolean;
  /** 받는 방법을 저장하는 서버 액션들(FR-04) */
  push?: {
    save: (sub: PushSubscriptionData) => Promise<{ error?: string }>;
    useEmail: () => Promise<{ error?: string }>;
  };
};

export function SubscribeForm({
  categories,
  initial,
  recent,
  doneHref,
  persist,
  permissionStep = true,
  push,
}: Props) {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>(initial.categories);
  const [keywords, setKeywords] = useState<string[]>(initial.keywords);
  const [draft, setDraft] = useState("");
  const [keywordError, setKeywordError] = useState<string | null>(null);
  const [step, setStep] = useState<"choose" | "permission">("choose");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  /** 알림을 켜지 못했을 때의 안내. 있으면 허용 버튼 대신 이 안내와 넘어가기 버튼을 보여준다. */
  const [fallback, setFallback] = useState<string | null>(null);

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

  async function save() {
    if (empty || saving) return;
    if (persist) {
      setSaving(true);
      setSaveError(null);
      const result = await persist({ categories: picked, keywords });
      setSaving(false);
      if (result.error) {
        setSaveError(result.error);
        return;
      }
    }
    if (permissionStep) setStep("permission");
    else done();
  }

  function done() {
    router.push(doneHref);
    router.refresh();
  }

  async function allow() {
    if (!push) return done(); // 시안
    setAsking(true);
    const outcome = await enablePush(push.save);
    if (outcome.status === "push") return done();

    // 허용하지 않았거나 못 쓰는 기기: 메일로 받는다(FR-04)
    await push.useEmail();
    setAsking(false);
    setFallback(
      outcome.status === "denied"
        ? "이 브라우저에서 알림이 막혀 있어요. 학교 메일로 보낼게요. 설정에서 언제든 다시 허용할 수 있어요."
        : outcome.status === "unsupported"
          ? "이 기기에서는 웹 푸시를 쓸 수 없어요. 학교 메일로 보낼게요."
          : `${outcome.message} 지금은 학교 메일로 보낼게요.`,
    );
  }

  async function chooseEmail() {
    if (push) {
      setAsking(true);
      await push.useEmail();
    }
    done();
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

        {fallback ? (
          <>
            <p aria-live="polite" className="mt-8 text-body">
              {fallback}
            </p>
            <button type="button" className={`${primaryButton} mt-4`} onClick={done}>
              공지 보러 가기
            </button>
          </>
        ) : (
          <>
            <button type="button" disabled={asking} className={`${primaryButton} mt-8`} onClick={allow}>
              {asking ? "기다리는 중" : "알림 허용하기"}
            </button>
            <button
              type="button"
              disabled={asking}
              className={`${textButton} mt-2 justify-center`}
              onClick={chooseEmail}
            >
              메일로 받을게요
            </button>
          </>
        )}

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
        void save();
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
        <p
          aria-live="polite"
          className={`mb-2 text-meta ${saveError ? "text-alert" : "text-sub"}`}
        >
          {saveError ??
            (empty
              ? "카테고리나 키워드를 하나 이상 골라야 저장할 수 있어요."
              : "바꾼 조건은 다음 알림부터 적용돼요.")}
        </p>
        <button type="submit" disabled={empty || saving} className={primaryButton}>
          {saving ? "저장하는 중" : "저장하고 알림 받기"}
        </button>
      </div>
    </form>
  );
}
