"use client";

import { useActionState, useState } from "react";
import { primaryButton, textButton } from "@/components/ui";
import { requestLoginLink, type LoginState } from "./actions";

const initial: LoginState = { status: "idle" };

/** linkError: 메일의 링크가 만료됐거나 이미 쓰여서 돌아온 경우 */
export function LoginPanel({ linkError }: { linkError: boolean }) {
  const [state, formAction, pending] = useActionState(requestLoginLink, initial);
  const [again, setAgain] = useState(false);

  if (state.status === "sent" && !again) {
    return (
      <div>
        <h1 className="text-display font-bold">메일을 보냈어요</h1>
        <p className="mt-3 text-sub">
          <span className="font-bold text-ink">{state.email}</span>
          <br />
          15분 안에 메일의 링크를 누르면 로그인돼요. 메일이 안 보이면 스팸함도 확인해 주세요.
        </p>
        <div className="mt-6 flex gap-6">
          <form action={formAction}>
            <input type="hidden" name="id" value={state.email} />
            <button type="submit" disabled={pending} className={textButton}>
              {pending ? "보내는 중" : "메일 다시 보내기"}
            </button>
          </form>
          <button type="button" className={textButton} onClick={() => setAgain(true)}>
            주소 바꾸기
          </button>
        </div>
      </div>
    );
  }

  const error =
    state.status === "error" && !pending
      ? state.message
      : linkError && state.status === "idle"
        ? "링크가 만료됐거나 이미 사용됐어요. 링크를 다시 받아 주세요."
        : null;

  return (
    <div>
      <h1 className="text-display font-bold">
        학교 메일 주소를
        <br />
        알려 주세요
      </h1>
      <p className="mt-3 text-sub">입력한 주소로 로그인 링크를 보내요. 비밀번호는 만들지 않아요.</p>

      <form action={formAction} onSubmit={() => setAgain(false)} className="mt-8">
        <label htmlFor="id" className="text-meta text-sub">
          학교 메일 주소
        </label>
        <div
          className={`mt-1.5 flex h-[52px] items-center rounded-[10px] border bg-paper focus-within:border-navy focus-within:ring-1 focus-within:ring-navy ${error ? "border-alert" : "border-line"}`}
        >
          <input
            id="id"
            name="id"
            type="text"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            defaultValue={state.status === "error" ? state.id : ""}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "id-error" : undefined}
            className="h-full min-w-0 flex-1 rounded-l-[10px] bg-transparent pl-4 text-title outline-none placeholder:text-sub/60"
            placeholder="학번 또는 아이디"
          />
          <span className="shrink-0 pr-4 pl-1 text-title text-sub">@tukorea.ac.kr</span>
        </div>

        <p id="id-error" aria-live="polite" className="mt-2 min-h-5 text-meta text-alert">
          {error}
        </p>

        <button type="submit" disabled={pending} className={`${primaryButton} mt-2`}>
          {pending ? "보내는 중" : "로그인 링크 받기"}
        </button>
      </form>
    </div>
  );
}
