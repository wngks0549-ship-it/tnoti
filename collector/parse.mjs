// 전체공지 목록 첫 페이지의 HTML에서 공지 10건을 뽑아낸다.
// 페이지 구조는 2026-11-11에 확인했다: ul.list-normal > li 안에
// 제목(.title strong), 번호(dl.num dd), 작성자(dl.writer dd), 등록일(dl.date dd)이 있다.
import * as cheerio from "cheerio";

export const SITE_ORIGIN = "https://tukorea.ac.kr";

const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim();

/**
 * @param {string} html 목록 페이지 HTML
 * @returns {Array<{article_id:number, board_no:number|null, title:string,
 *   author_dept:string, posted_at:string, source_url:string}>}
 */
export function parseNoticeList(html) {
  const $ = cheerio.load(html);
  const items = [];

  $("ul.list-normal > li").each((_, li) => {
    const $li = $(li);
    const href = $li.find('a[href*="/artclView.do"]').first().attr("href");
    if (!href) return;

    // /bbs/tukorea/1303/154770/artclView.do 에서 글 고유 번호(154770)를 얻는다.
    const idMatch = href.match(/\/(\d+)\/artclView\.do/);
    if (!idMatch) return;

    const title = clean($li.find(".title strong").first().text());
    if (!title) return;

    // 목록의 No.는 글이 지워지면 당겨지는 표시용 번호다. 상단 고정 글은 숫자가 아닐 수 있다.
    const noText = clean($li.find("dl.num dd").first().text());
    const boardNo = /^\d+$/.test(noText) ? Number(noText) : null;

    const dateText = clean($li.find("dl.date dd").first().text());
    const dateMatch = dateText.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
    const postedAt = dateMatch
      ? `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`
      : "";

    items.push({
      article_id: Number(idMatch[1]),
      board_no: boardNo,
      title,
      author_dept: clean($li.find("dl.writer dd").first().text()),
      posted_at: postedAt,
      // 원문 주소는 저장만 한다. 수집기는 이 주소를 요청하지 않는다(robots.txt 금지 경로).
      source_url: new URL(href, SITE_ORIGIN).toString(),
    });
  });

  return items;
}
