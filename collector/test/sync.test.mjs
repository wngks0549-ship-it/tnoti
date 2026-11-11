import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const script = fileURLToPath(new URL("../sync.mjs", import.meta.url));

test("Supabase 설정이 없으면 요청 없이 정상 종료한다", async () => {
  const env = { ...process.env };
  delete env.SUPABASE_URL;
  delete env.SUPABASE_SECRET_KEY;
  const { stdout } = await run(process.execPath, [script], { env });
  assert.match(stdout, /건너뛴다/);
});
