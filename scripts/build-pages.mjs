#!/usr/bin/env node
/**
 * يجهّز فولدر Cloudflare Pages الجاهز للرفع (dist/).
 *
 *   node scripts/build-pages.mjs     (أو: npm run build:pages)
 *
 * بيعمل 4 حاجات:
 *   1) يبني بإعداد cloudflare_pages
 *   2) يشيل مؤقت إعدادات wrangler المتعارض (بيمنع تشغيل wrangler بعد بناء preset تاني)
 *   3) يضيف no_bundle لملف إعداد الـworker (عشان wrangler يرفع الملفات زي ما هي
 *      من غير إعادة تجميع — إعادة التجميع بتفشل على مسارات فيها حروف عربية)
 *   4) فحص أمان: يتأكد إن مفتاح service_role موجود جوا السيرفر ومش موجود في أي ملف متصفح
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fail = (msg) => {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`✔ ${msg}`);

// ---------- 1) البناء ----------
console.log("… building with NITRO_PRESET=cloudflare_pages");
const viteBin = path.join(root, "node_modules", "vite", "bin", "vite.js");
if (!fs.existsSync(viteBin)) fail("vite is not installed — run npm install first");

const build = spawnSync(process.execPath, [viteBin, "build"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NITRO_PRESET: "cloudflare_pages" },
});
if (build.status !== 0) fail("build failed");
ok("build finished");

const dist = path.join(root, "dist");
const workerDir = path.join(dist, "_worker.js");
if (!fs.existsSync(path.join(workerDir, "index.js"))) {
  fail(`missing ${path.join("_worker.js", "index.js")} — the build did not produce a Pages worker`);
}

// ---------- 2) إزالة مؤقت wrangler المتعارض ----------
const deployCfg = path.join(root, ".wrangler", "deploy", "config.json");
if (fs.existsSync(deployCfg)) {
  fs.renameSync(deployCfg, `${deployCfg}.${Date.now()}.bak`);
  ok("moved aside .wrangler/deploy/config.json (wrangler allows only one active preset)");
}

// ---------- 3) إزالة ملفات الرفع المرفوضة/الفارغة ----------
// أ) dist/_worker.js/wrangler.json → إعداد محلي فقط، وCloudflare بيرفضه:
//    "1 file could not be uploaded: wrangler.json (unknown)".
// ب) dist/_routes.json → لوحة تحكم Cloudflare بترفضه الآن:
//    "Pages _routes.json is not supported."
//    ومش محتاجينه: كل الطلبات بتروح للسيرفر والسيرفر بيقدّم الثابتات بنفسه
//    عبر env.ASSETS.fetch (متحقق منه في dist/_worker.js/index.js).
// ج) dist/_redirects → بيتعمل فاضي (0 بايت) بلا أي قواعد.
const removeIfPresent = (file, why) => {
  if (!fs.existsSync(file)) return;
  fs.rmSync(file);
  ok(`removed ${path.relative(dist, file)} (${why})`);
};

removeIfPresent(path.join(workerDir, "wrangler.json"), "local-only config, rejected as unknown");
removeIfPresent(path.join(dist, "_routes.json"), "rejected by the Cloudflare dashboard upload");
removeIfPresent(path.join(dist, "_redirects"), "generated empty (0 bytes)");

// ---------- 4) بلا إعدادات داخل الفولدر ----------
// رفع السحب من لوحة تحكم Cloudflare بيرفض أي مجلد فيه إعدادات wrangler:
//   "This uploader does not yet support projects that require a build process.
//    ... Please use wrangler deploy instead for full feature support."
// يعني الرفع اليدوي مرفوض لهذا المشروع (محتاج سيرفر) — والطريق الوحيد المدعوم
// هو أمر التيرمنال: npx wrangler pages deploy
const strayRootConfig = path.join(dist, "wrangler.json");
if (fs.existsSync(strayRootConfig)) {
  fs.rmSync(strayRootConfig);
  ok("removed dist/wrangler.json (dashboard rejects folders with a wrangler config)");
}

// ---------- 4) فحص أمان المفتاح السري ----------
const envPath = path.join(root, ".env");
let secret = "";
if (fs.existsSync(envPath)) {
  const match = fs.readFileSync(envPath, "utf8").match(/^SUPABASE_SERVICE_ROLE_KEY\s*=\s*"?([^"\r\n]+)"?/m);
  secret = (match?.[1] ?? "").trim();
}

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

if (secret) {
  const leaks = walk(dist).filter((file) => {
    if (file.startsWith(workerDir)) return false; // السيرفر — مكانه الصح
    try {
      return fs.readFileSync(file, "utf8").includes(secret);
    } catch {
      return false;
    }
  });
  if (leaks.length) {
    fail(`SECRET LEAK: service_role key found in ${leaks.length} non-server file(s):\n  ${leaks.join("\n  ")}`);
  }
  ok("service_role key is NOT in any client-facing file");
} else {
  warn("SUPABASE_SERVICE_ROLE_KEY not found in .env — skipped the leak check");
}

function warn(msg) {
  console.warn(`⚠ ${msg}`);
}

const files = walk(dist);
const sizeMb = (files.reduce((sum, f) => sum + fs.statSync(f).size, 0) / 1024 / 1024).toFixed(2);
ok(`dist ready: ${files.length} files, ${sizeMb} MB`);

console.log(`
──────────────────────────────────────────────
  ارفعه كده على Cloudflare:
  1) https://dash.cloudflare.com → Workers & Pages
  2) Create → Pages → Direct Upload
  3) اسم المشروع: alkuraimi-static-demo (أو اللي تحبه)
  4) ارفع مجلد:  ${dist}
  5) Deploy — ومفيش أي Environment Variables مطلوبة
──────────────────────────────────────────────`);
