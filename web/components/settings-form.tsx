"use client";

// S7 설정 (FR-04 채널 표시, FR-05 켜기·끄기와 주기, FR-06 탈퇴).
// 지금은 화면만 있다. 값은 이 화면 안에서만 바뀌고 저장되지 않는다.
import Link from "next/link";
import { useState } from "react";
import { textButton } from "@/components/ui";
import type { Subscription } from "@/lib/match";

type Props = {
  email: string;
  notifyEnabled: boolean;
  frequency: "instant" | "twice_daily";
  channel: "push" | "email";
  subscription: Subscription;
  subscribeHref: string;
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

export function SettingsForm(props: Props) {
  const [enabled, setEnabled] = useState(props.notifyEnabled);
  const [frequency, setFrequency] = useState(props.frequency);
  const [leaving, setLeaving] = useState(false);

  const { categories, keywords } = props.subscription;

  return (
    <div className="flex-1">
      <Section title="알림">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-title font-bold">알림 받기</p>
            <p className="mt-0.5 text-meta text-sub">
              {enabled ? "구독한 공지가 올라오면 알려요." : "꺼 둔 동안은 알림이 가지 않아요. 공지 목록은 그대로 볼 수 있어요."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="알림 받기"
            onClick={() => setEnabled((v) => !v)}
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
                disabled={!enabled}
                onClick={() => setFrequency(f.value)}
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
          {props.channel === "push" ? "이 기기의 푸시 알림" : "학교 메일"}
        </p>
        <p className="mt-0.5 text-meta text-sub">
          {props.channel === "push"
            ? "푸시가 가지 않으면 학교 메일로 대신 보내요."
            : "이 기기에서 알림을 허용하지 않아서 메일로 보내요."}
        </p>
        {props.channel === "email" && (
          <button type="button" className={textButton}>
            이 기기에서 알림 허용하기
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
          <button type="button" className={textButton}>
            로그아웃
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center text-body font-bold text-alert"
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
              <button
                type="button"
                className="inline-flex h-11 items-center text-body font-bold text-alert"
              >
                지우고 탈퇴하기
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
