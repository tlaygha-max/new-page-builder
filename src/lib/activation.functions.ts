import { createServerFn } from "@tanstack/react-start";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * حالة الطلب — يستدعيها العميل أثناء انتظار المراجعة (polling كل ثانيتين).
 * دالة عامة بدون تسجيل دخول، لكنها تُرجع الحالة فقط ولا أي بيانات بطاقة،
 * ومعرّف الطلب uuid عشوائي لا يمكن تخمينه.
 */
export const getActivationStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const id = (input as { id?: unknown } | null)?.id;
    if (typeof id !== "string" || !UUID_PATTERN.test(id)) {
      throw new Error("معرّف الطلب غير صالح.");
    }
    return { id };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("card_activation_requests")
      .select("activation_status")
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { status: row?.activation_status ?? null };
  });
