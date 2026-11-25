// 여러 화면이 같이 쓰는 모양. 값은 theme.md 를 따른다.

/** 주 버튼: 한 화면에 하나, 폭을 꽉 채운다. */
export const primaryButton =
  "flex h-[52px] w-full items-center justify-center rounded-[10px] bg-navy px-4 text-title font-bold text-white transition-opacity active:opacity-85 disabled:opacity-40";

/** 글자만 있는 보조 버튼 */
export const textButton =
  "inline-flex h-11 items-center text-body font-bold text-navy underline-offset-4 hover:underline";

/** 고르는 칩. 고른 것은 옅은 남색 바탕에 남색 굵은 글자. */
export function chip(selected: boolean) {
  return `flex h-11 shrink-0 items-center rounded-full border px-4 text-body ${
    selected ? "border-navy bg-navy-tint font-bold text-navy" : "border-line bg-paper text-ink"
  }`;
}

/** 글 입력칸 */
export const textInput =
  "h-[52px] w-full min-w-0 rounded-[10px] border border-line bg-paper px-4 text-title outline-none placeholder:text-sub/60 focus:border-navy focus:ring-1 focus:ring-navy";
