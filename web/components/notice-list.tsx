"use client";

// S4 맞춤 공지 목록 (FR-12): 내 구독에 맞는 공지를 최신순으로, 카테고리로 거르고, 제목·부서로 찾는다.
import Link from "next/link";
import { useMemo, useState } from "react";
import { NoticeRow } from "@/components/notice-row";
import { chip, textButton, textInput } from "@/components/ui";
import { matchNotice, type Subscription } from "@/lib/match";
import type { Notice } from "@/lib/notices";

type Props = {
  notices: Notice[];
  subscription: Subscription;
  categories: string[];
  /** 구독을 바꾸는 화면(S3) */
  subscribeHref: string;
};

const MINE = "내 구독";
const ALL = "전체";

export function NoticeList({ notices, subscription, categories, subscribeHref }: Props) {
  const [filter, setFilter] = useState(MINE);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notices
      .map((n) => ({ n, m: matchNotice(n, subscription) }))
      .filter(({ n, m }) => {
        if (filter === MINE && !m) return false;
        if (filter !== MINE && filter !== ALL && !n.categories.includes(filter)) return false;
        if (q && !`${n.title} ${n.author_dept}`.toLowerCase().includes(q)) return false;
        return true;
      });
  }, [notices, subscription, filter, query]);

  const q = query.trim();

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5 pt-4">
        <label htmlFor="q" className="sr-only">
          제목이나 작성 부서로 찾기
        </label>
        <input
          id="q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목이나 작성 부서로 찾기"
          className={textInput}
        />
      </div>

      {/* 거르는 칩: 한 줄로 두고 옆으로 민다 */}
      <div className="flex gap-2 overflow-x-auto px-5 py-4 [scrollbar-width:none]">
        {[MINE, ALL, ...categories].map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={filter === name}
            onClick={() => setFilter(name)}
            className={chip(filter === name)}
          >
            {name}
          </button>
        ))}
      </div>

      <p className="border-b border-line px-5 pb-3 text-meta text-sub" aria-live="polite">
        {filter}
        {q && ` 안에서 ‘${q}’`} <span className="nums font-bold text-ink">{rows.length}건</span>
      </p>

      {rows.length > 0 ? (
        <ul>
          {rows.map(({ n, m }) => (
            <NoticeRow
              key={n.notice_id}
              notice={n}
              keywordHit={m?.by === "keyword" ? m.value : undefined}
            />
          ))}
        </ul>
      ) : (
        <div className="px-5 py-10">
          <p className="text-title font-bold">
            {q ? `‘${q}’에 맞는 공지가 없어요` : "아직 맞는 공지가 없어요"}
          </p>
          <p className="mt-1 text-sub">
            {filter === ALL
              ? "다른 낱말로 찾아보세요."
              : "전체 공지에서 보면 더 많은 글이 있어요."}
          </p>
          <div className="mt-2 flex gap-6">
            {filter !== ALL && (
              <button type="button" className={textButton} onClick={() => setFilter(ALL)}>
                전체에서 보기
              </button>
            )}
            {filter === MINE && !q && (
              <Link href={subscribeHref} className={textButton}>
                구독 바꾸기
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
