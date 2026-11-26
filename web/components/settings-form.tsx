"use client";

// S7 설정 (FR-04 받는 방법 표시, FR-05 켜기·끄기와 주기, FR-06 탈퇴).
// on… 과 signoutPath 를 주면 저장한다(진짜 화면). 안 주면 이 화면 안에서만 바뀐다(시안).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { textButton } from "@/components/ui";
import type { Subscription } from "@/lib/match";
import { currentPushEndpoint, enablePush, type PushSubscriptionData } from "@/lib/push-client";

type Frequency = "instant" | "twice_daily";
type Result = { error?: string };

type Props = {
  email: string;
  notifyEnabled: boolean;
  frequency: Frequency;
  channel: "push" | "email";
  subscription: Subscription;
  subscribeHref: string;
  onNotifyChange?: (enabled: boolean) => Promise<Result>;
  onFrequencyChange?: (frequency: Frequency) => Promise<Result>;
  onDelete?: () => Promise<Result>;
  /** 이 기기의 푸시 구독을 저장하는 서버 액션. 주면 "알림 허용하기" 버튼이 보인다. */
  onPushSave?: (sub: PushSubscriptionData) => Promise<Result>;
  /** 이 브라우저의 푸시 구독이 내 계정에 등록돼 있는지 묻는 서버 액션. 받는 방법은 계정에 하나지만 허용은 기기마다 따로다. */
  onPushCheck?: (endpoint: string) => Promise<boolean>;
  /** 로그아웃을 받는 주소(POST). 없으면 버튼만 보인다. */
  signoutPath?: string;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line px-5 py-6">
      <h2 className="text-meta text-sub">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

const FREQUENCIES = [
  { value: "instant", label: "올라오면 바로", hint: "분류되고 5분 안에 보내요." },
  { value: "twice_daily", label: "하루 두 번", hint: "12시와 20시에 모아서 한 번에 보내요." },
] as const;

const dangerButton = "inline-flex h-11 items-center text-body font-bold text-alert disabled:opacity-40";

export function SettingsForm(props: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(props.notifyEnabled);
  const [frequency, setFrequency] = useState<Frequency>(props.frequency);
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이 기기에서 알림을 허용했는지. 확인하기 전(checking)에는 단정하지 않는다. 시안에서는 묻지 않는다.
  const [device, setDevice] = useState<"checking" | "on" | "off">(props.onPushCheck ? "checking" : "on");

  const { categories, keywords } = props.subscription;
  const { onPushCheck } = props;

  useEffect(() => {
    if (!onPushCheck) return;
    let cancelled = false;
    (async () => {
      const endpoint = await currentPushEndpoint();
      const registered = endpoint ? await onPushCheck(endpoint) : false;
      if (!cancelled) setDevice(registered ? "on" : "off");
    })();
    return () => {
      cancelled = true;
    };
  }, [onPushCheck]);

  /** 화면을 먼저 바꾸고 저장한다. 저장에 실패하면 되돌리고 이유를 보여준다. */
  async function change<T>(next: T, prev: T, apply: (v: T) => void, save?: (v: T) => Promise<Result>) {
    if (busy) return;
    apply(next);
    setError(null);
    if (!save) return;
    setBusy(true);
    const result = await save(next);
    setBusy(false);
    if (result.error) {
      apply(prev);
      setError(result.error);
    }
  }

  async function allowPush() {
    if (!props.onPushSave || busy) return;
    setBusy(true);
    setError(null);
    const outcome = await enablePush(props.onPushSave);
    setBusy(false);
    if (outcome.status === "push") {
      setDevice("on");
      router.refresh();
    }
    else if (outcome.status === "denied")
      setError("이 브라우저에서 알림이 막혀 있어요. 브라우저의 사이트 설정에서 알림을 허용한 뒤 다시 해 주세요.");
    else if (outcome.status === "unsupported")
      setError("이 기기에서는 웹 푸시를 쓸 수 없어요. 아이폰은 홈 화면에 추가한 뒤 다시 해 보세요.");
    else setError(outcome.message);
  }

  async function leave() {
    if (!props.onDelete || busy) return;
    setBusy(true);
    setError(null);
    const result = await props.onDelete(); // 성공하면 첫 화면으로 이동한다
    setBusy(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="flex-1">
      <p aria-live="polite" className={error ? "bg-ground px-5 py-3 text-meta text-alert" : "sr-only"}>
        {error}
      </p>

      <Section title="알림">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-title font-bold">알림 받기</p>
            <p className="mt-0.5 text-meta text-sub">
              {enabled
                ? "구독한 공지가 올라오면 알려요."
                : "꺼 둔 동안은 알림이 가지 않아요. 공지 목록은 그대로 볼 수 있어요."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="알림 받기"
            disabled={busy}
            onClick={() => change(!enabled, enabled, setEnabled, props.onNotifyChange)}
            className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors ${enabled ? "bg-navy" : "bg-line"}`}
          >
            <span
              className={`absolute top-1 left-1 size-6 rounded-full bg-paper transition-transform ${enabled ? "translate-x-5" : ""}`}
            />
          </button>
        </div>
      </Section>

      <Section title="받는 주기">
        <div role="radiogroup" aria-label="받는 주기" className={enabled ? "" : "opacity-40"}>
          {FREQUENCIES.map((f) => {
            const on = frequency === f.value;
            return (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={!enabled || busy}
                onClick={() => {
                  if (!on) void change<Frequency>(f.value, frequency, setFrequency, props.onFrequencyChange);
                }}
                className="flex w-full items-center justify-between gap-4 py-2.5 text-left"
              >
                <span>
                  <span className={`block text-title ${on ? "font-bold" : ""}`}>{f.label}</span>
                  <span className="block text-meta text-sub">{f.hint}</span>
                </span>
                <span
                  aria-hidden
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-navy" : "border-line"}`}
                >
                  {on && <span className="size-3 rounded-full bg-navy" />}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="받는 방법">
        <p className="text-title font-bold">
          {props.channel === "email"
            ? "학교 메일"
            : device === "on"
              ? "이 기기의 푸시 알림"
              : device === "off"
                ? "다른 기기의 푸시 알림"
                : "푸시 알림"}
        </p>
        <p className="mt-0.5 text-meta text-sub">
          {props.channel === "email"
            ? "이 기기에서 알림을 허용하지 않아서 메일로 보내요."
            : device === "off"
              ? "이 기기에서는 아직 알림을 허용하지 않았어요. 허용해 둔 다른 기기로만 알림이 가요."
              : "푸시가 가지 않으면 학교 메일로 대신 보내요."}
        </p>
        {props.onPushSave && (props.channel === "email" || device === "off") && (
          <button type="button" className={textButton} disabled={busy} onClick={allowPush}>
            {props.channel === "email" ? "이 기기에서 알림 허용하기" : "이 기기에서도 알림 허용하기"}
          </button>
        )}
      </Section>

      <Section title="구독">
        <p className="text-title">
          {categories.length > 0 && <span className="font-bold">{categories.join(", ")}</span>}
          {categories.length > 0 && keywords.length > 0 && <br />}
          {keywords.length > 0 && <span>키워드 {keywords.map((k) => `‘${k}’`).join(", ")}</span>}
        </p>
        <Link href={props.subscribeHref} className={textButton}>
          구독 바꾸기
        </Link>
      </Section>

      <Section title="계정">
        <p className="text-title">{props.email}</p>
        <div className="mt-1 flex gap-6">
          {props.signoutPath ? (
            <form action={props.signoutPath} method="post">
              <button type="submit" className={textButton}>
                로그아웃
              </button>
            </form>
          ) : (
            <button type="button" className={textButton}>
              로그아웃
            </button>
          )}
          <button
            type="button"
            className={dangerButton}
            aria-expanded={leaving}
            onClick={() => setLeaving((v) => !v)}
          >
            탈퇴하기
          </button>
        </div>

        {leaving && (
          <div className="mt-2 rounded-[10px] border border-alert px-4 py-4">
            <p className="text-body font-bold">탈퇴하면 바로 지워져요</p>
            <p className="mt-1 text-meta text-sub">
              학교 메일 주소, 구독한 카테고리와 키워드, 알림 내역이 지워지고 알림이 더 가지 않아요. 같은 주소로
              다시 가입할 수 있어요.
            </p>
            <div className="mt-3 flex gap-6">
              <button type="button" className={dangerButton} disabled={busy} onClick={leave}>
                {busy ? "지우는 중" : "지우고 탈퇴하기"}
              </button>
              <button type="button" className={textButton} onClick={() => setLeaving(false)}>
                그만두기
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
