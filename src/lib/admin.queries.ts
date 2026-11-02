import { queryOptions } from "@tanstack/react-query";

import {
  getAdminAuthState,
  getAdminCardRequests,
  getAdminVisitorStats,
} from "@/lib/admin.functions";

/**
 * خيارات الاستعلامات المشتركة بين صفحات الداشبورد (/admin و /visitors).
 * كلها تستدعي دوال سيرفر محمية بـ requireAdmin.
 */

export const adminAuthQuery = queryOptions({
  queryKey: ["admin-auth"],
  queryFn: () => getAdminAuthState(),
  staleTime: 0,
});

export const adminStatsQuery = queryOptions({
  queryKey: ["admin-stats"],
  queryFn: () => getAdminVisitorStats(),
  refetchInterval: 30_000,
});

export const adminRequestsQuery = queryOptions({
  queryKey: ["admin-requests"],
  queryFn: () => getAdminCardRequests(),
  refetchInterval: 5_000,
});
