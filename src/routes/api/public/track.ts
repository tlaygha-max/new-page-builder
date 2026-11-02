import { createFileRoute } from "@tanstack/react-router";

// Public tracking endpoint: records one page view per call.
// Public prefix bypasses site auth, so we verify the caller is same-origin.
export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const origin = request.headers.get("origin");
          if (origin) {
            const originHost = new URL(origin).host;
            const requestHost = new URL(request.url).host;
            if (originHost !== requestHost) {
              return new Response("forbidden", { status: 403 });
            }
          }

          const body = (await request.json().catch(() => null)) as {
            path?: unknown;
            referrer?: unknown;
          } | null;

          const path =
            typeof body?.path === "string" && body.path.startsWith("/")
              ? body.path.slice(0, 500)
              : "/";
          const referrer =
            typeof body?.referrer === "string" && body.referrer.length > 0
              ? body.referrer.slice(0, 1000)
              : null;

          const forwarded = request.headers.get("x-forwarded-for");
          const ip =
            request.headers.get("cf-connecting-ip") ??
            forwarded?.split(",").at(0)?.trim() ??
            null;
          const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? null;

          // القاعدة غير مربوطة بقاعدة بيانات: نتجاهل التتبع بهدوء بدل فشل الصفحة.
          if (!process.env["SUPABASE_URL"] || !process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
            return new Response(null, { status: 204 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("site_visits").insert({
            path,
            referrer,
            user_agent: userAgent,
            ip,
          });

          return new Response(null, { status: 204 });
        } catch (error) {
          console.error("track error", error);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});
