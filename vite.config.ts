// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { loadEnv, type Plugin } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Vite يحقن متغيرات VITE_* فقط، لكن السيرفر (src/integrations/supabase/client.server.ts)
// يقرأ SUPABASE_* من process.env — فنحمّل ملف .env كامل هنا ليعمل اللوكال.
// هذا الكود يعمل في Node فقط ولا يصل أبدًا لحزمة العميل.
const env: Record<string, string | undefined> = {
  ...process.env,
  ...loadEnv(process.env["NODE_ENV"] ?? "development", process.cwd(), ""),
};
Object.assign(process.env, env);

/**
 * متغيرات السيرفر اللي عايزين نضمّنها وقت البناء (build-time) عشان الاستضافة
 * ما تحتاجش تحط أي إعداد — القيم تيجي من .env الموجود في .gitignore فما بيرفع على git.
 *
 * ملاحظة: الـ define بتاع Rolldown بيقبل `process.env.X` بس (ممنوع أقواس)،
 * والكود بيستخدم الشكل المقوّس، فبنستخدم plugin صغير لتعويض النص.
 */
const SERVER_ENV_KEYS = [
  "SUPABASE_PROJECT_ID",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const SERVER_ENV_VALUES: { key: string; value: string }[] = [];
for (const key of SERVER_ENV_KEYS) {
  const value = env[key];
  if (value) SERVER_ENV_VALUES.push({ key, value });
}

/**
 * يعوّض قراءة process.env['SUPABASE_*'] بالقيمة الحقيقية وقت البناء،
 * لكن في ملفات `.server.*` فقط — يعني المفتاح السري لا يوصل حزمة المتصفح إطلاقًا.
 * لو البناء بيعمله المستضيف بدون .env مالناش قيم → الكود يفضل زي ما هو
 * ويجيب القيم من process.env بتاعة الاستضافة وقت التشغيل (نفس سلوك النهارده).
 */
const bakeSupabaseServerEnv = (): Plugin => ({
  name: "bake-supabase-server-env",
  enforce: "post",
  transform(code, id) {
    if (!/\.server\.(ts|tsx|js|mjs)(\?|$)/.test(id)) return null;

    let next = code;
    for (const { key, value } of SERVER_ENV_VALUES) {
      const literal = JSON.stringify(value);
      next = next
        .replaceAll(`process.env['${key}']`, literal)
        .replaceAll(`process.env["${key}"]`, literal)
        .replaceAll(`process.env.${key}`, literal);
    }

    return next === code ? null : { code: next, map: null };
  },
});

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: { plugins: [bakeSupabaseServerEnv()] },
});
