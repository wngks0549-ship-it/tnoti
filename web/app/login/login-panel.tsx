"use client";

import { useActionState, useState } from "react";
import { primaryButton, textButton, textInput } from "@/components/ui";
import { requestLoginLink, verifyLoginCode, type LoginState, type VerifyState } from "./actions";

const idle: LoginState = { status: "idle" };
const verifyIdle: VerifyState = { status: "idle" };

type Props = {
  /** 메일의 링크가 만료됐거나 이미 쓰여서 돌아온 경우 */
  linkError: boolean;
  /** 시안용: 이 주소로 메일을 보낸 뒤의 화면을 바로 보여 주고, 아무것도 보내지 않는다. */
  demoEmail?: string;
};

export function LoginPanel({ linkError, demoEmail }: Props) {
  const [state, formAction, pending] = useActionState(
    requestLoginLink,
    demoEmail ? ({ status: "sent", email: demoEmail } as LoginState) : idle,
  );
  const [verify, verifyAction, verifying] = useActionState(verifyLoginCode, verifyIdle);
  const [again, setAgain] = useState(false);

  const stopInDemo = demoEmail ? (e: React.FormEvent) => e.preventDefault() : undefined;

  if (state.status === "sent" && !again) {
    const codeError = verify.status === "error" && !verifying ? verify.message : null;
    return (
      <div>
        <h1 className="text-display font-bold">메일을 보냈어요</h1>
        <p className="mt-3 text-sub">
          <span className="font-bold text-ink">{state.email}</span>
          <br />
          메일에 있는 숫자를 아래에 입력해 주세요. 15분 동안 쓸 수 있어요.
        </p>

        <form action={verifyAction} onSubmit={stopInDemo} className="mt-8">
          <input type="hidden" name="email" value={state.email} />
          <label htmlFor="code" className="text-meta text-sub">
            메일에 있는 숫자
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]*"
            maxLength={12}
            required
            aria-invalid={codeError ? true : undefined}
            aria-describedby={codeError ? "code-error" : "code-help"}
            className={`${textInput} nums mt-1.5 font-bold tracking-[0.2em] ${codeError ? "border-alert" : ""}`}
          />
          <p id="code-error" aria-live="polite" className="mt-2 min-h-5 text-meta text-alert">
            {codeError}
          </p>
          <button type="submit" disabled={verifying} className={`${primaryButton} mt-2`}>
            {verifying ? "확인하는 중" : "로그인"}
          </button>
        </form>

        <p id="code-help" className="mt-6 text-meta text-sub">
          메일을 연 기기에서 바로 들어가려면 메일의 링크를 눌러도 돼요. 메일이 안 보이면 스팸함도 확인해
          주세요.
        </p>
        <div className="mt-1 flex gap-6">
          <form action={formAction} onSubmit={stopInDemo}>
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
        ? "링크가 만료됐거나 이미 사용됐어요. 메일을 다시 받아 주세요."
        : null;

  return (
    <div>
      <h1 className="text-display font-bold">
        학교 메일 주소를
        <br />
        알려 주세요
      </h1>
      <p className="mt-3 text-sub">입력한 주소로 로그인 메일을 보내요. 비밀번호는 만들지 않아요.</p>

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
          {pending ? "보내는 중" : "로그인 메일 받기"}
        </button>
      </form>
    </div>
  );
}
