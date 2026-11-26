// 공지 읽기(P5). notice, notice_category, category 는 누구나 읽을 수 있는 테이블이다.
import { createClient } from "@/lib/supabase/server";

export type Notice = {
  notice_id: number;
  source_url: string;
  title: string;
  author_dept: string;
  posted_at: string; // YYYY-MM-DD
  deadline: string | null;
  status: "active" | "modified" | "deleted";
  categories: string[]; // '기타' 는 뺀다
};

const COLUMNS =
  "notice_id, source_url, title, author_dept, posted_at, deadline, status, notice_category(category(name, sort_order))";

type Row = Omit<Notice, "categories"> & {
  notice_category: { category: { name: string; sort_order: number } | null }[];
};

function toNotice(row: Row): Notice {
  const { notice_category, ...rest } = row;
  const categories = notice_category
    .map((nc) => nc.category)
    .filter((c): c is { name: string; sort_order: number } => c !== null && c.name !== "기타")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => c.name);
  return { ...rest, categories };
}

export async function getNotice(id: number): Promise<Notice | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notice")
    .select(COLUMNS)
    .eq("notice_id", id)
    .maybeSingle();
  if (error) throw new Error(`공지를 읽지 못했다: ${error.message}`);
  return data ? toNotice(data as unknown as Row) : null;
}

export async function getLatestNotices(limit: number): Promise<Notice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notice")
    .select(COLUMNS)
    .neq("status", "deleted")
    .order("posted_at", { ascending: false })
    .order("notice_id", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`공지 목록을 읽지 못했다: ${error.message}`);
  return (data as unknown as Row[]).map(toNotice);
}

export async function getAlertCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("category")
    .select("name")
    .eq("is_alertable", true)
    .order("sort_order");
  if (error) throw new Error(`카테고리를 읽지 못했다: ${error.message}`);
  return data.map((c) => c.name);
}
