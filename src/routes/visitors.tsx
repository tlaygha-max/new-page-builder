import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ClipboardList, CreditCard, Eye, Globe, Users } from "lucide-react";
import { useState } from "react";

import { getAdminAuthState } from "@/lib/admin.functions";
import { adminAuthQuery, adminRequestsQuery, adminStatsQuery } from "@/lib/admin.queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/visitors")({
  // صفحة جزء من الداشبورد: بدون جلسة مسجّلة نعيد التوجيه لشاشة الدخول.
  loader: async ({ context }) => {
    const auth = await getAdminAuthState().catch(() => ({
      needsSetup: false,
      signedIn: false,
      error: null,
    }));
    if (!auth.signedIn) throw redirect({ to: "/admin" });
    return context.queryClient.ensureQueryData(adminStatsQuery);
  },
  head: () => ({
    meta: [
      { title: "لوحة الزوار | البنك الأردني الكويتي" },
      {
        name: "description",
        content: "إحصائيات زوار الموقع: عدد الزيارات، عناوين IP، والصفحات الأكثر زيارة.",
      },
      { property: "og:title", content: "لوحة الزوار | البنك الأردني الكويتي" },
      {
        property: "og:description",
        content: "إحصائيات زوار الموقع: عدد الزيارات، عناوين IP، والصفحات الأكثر زيارة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VisitorsPage,
});

function VisitorsPage() {
  const [view, setView] = useState<"visits" | "requests">("visits");

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">لوحة الزوار</h1>
          <Link to="/" className="text-sm text-primary hover:underline">
            العودة إلى الموقع
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("visits")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              view === "visits"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            <Eye className="h-4 w-4" />
            الزيارات
          </button>
          <button
            type="button"
            onClick={() => setView("requests")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              view === "requests"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            الطلبات
          </button>
        </div>

        {view === "visits" ? <VisitsView /> : <RequestsView />}
      </main>
    </div>
  );
}

function RequestsView() {
  const { data: stats } = useSuspenseQuery(adminRequestsQuery);

  const cards = [
    { title: "طلبات اليوم", value: stats.requestsToday, icon: Activity },
    { title: "إجمالي الطلبات", value: stats.totalRequests, icon: ClipboardList },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {card.value.toLocaleString("ar-JO")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">البطاقات الأكثر طلبًا</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topCards.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد طلبات بعد.</p>
            ) : (
              <ul className="space-y-3">
                {stats.topCards.map((card) => (
                  <li key={card.card_title} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 truncate text-sm text-foreground">
                      <CreditCard className="h-4 w-4 shrink-0 text-primary" />
                      {card.card_title}
                    </span>
                    <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-sm font-medium text-foreground">
                      {card.requests.toLocaleString("ar-JO")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">أحدث الطلبات</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الوقت</TableHead>
                  <TableHead>البطاقة</TableHead>
                  <TableHead>عنوان IP</TableHead>
                  <TableHead>المتصفح</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      لا توجد طلبات بعد.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recentRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(req.created_at), "d MMM، h:mm a", { locale: ar })}
                      </TableCell>
                      <TableCell className="max-w-32 truncate text-sm">{req.card_title}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm" dir="ltr">
                        {req.ip ?? "—"}
                      </TableCell>
                      <TableCell
                        className="max-w-40 truncate text-xs text-muted-foreground"
                        dir="ltr"
                      >
                        {req.user_agent ?? "—"}
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

function VisitsView() {
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
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {card.value.toLocaleString("ar-JO")}
              </p>
            </CardContent>
          </Card>
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
