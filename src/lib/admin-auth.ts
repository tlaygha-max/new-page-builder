/**
 * أدوات مصادقة لوحة التحكم /admin.
 *
 * - كلمة المرور تُخزَّن كـ hash (PBKDF2-SHA256 + salt عشوائي) ولا تُخزَّن
 *   نصًا صريحًا أبدًا.
 * - جلسة الدخول = توقيع HMAC بمفتاح عشوائي (session_secret) مخزّن في جدول
 *   admin_settings، مع تاريخ انتهاء — الكوكيز بيتقرأ من السيرفر فقط.
 *
 * كل الدوال هنا نقية (بدون أي اعتماد على السيرفر أو القاعدة) لسهولة اختبارها.
 */

// workerd (سيرفر Cloudflare) بيحدّ سقف خوارزمية PBKDF2 عند 100000 تكرار —
// فوق كده بيرمي: "Pbkdf2 failed: iteration counts above 100000 are not supported".
// ملاحظة مهمة: عدد التكرارات مكتوب جوّه الـhash المخزّن (pbkdf2$60000$salt$hash)
// فالتعديل هنا بيأثر على كلمات المرور الجديدة بس — القديمة لازم تتعاد إنشاؤها.
const PBKDF2_ITERATIONS = 60_000;
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 ساعات
const MIN_ITERATIONS = 10_000;
const MAX_ITERATIONS = 5_000_000;

export const MIN_PASSWORD_LENGTH = 8;
export { SESSION_TTL_SECONDS };

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** مقارنة بطول ثابت تمنع هجمات التوقيت. */
function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

function equalStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function deriveBits(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array> {
  try {
    const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
      "deriveBits",
    ]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      key,
      256,
    );
    return new Uint8Array(bits);
  } catch {
    // بيحصل لو hash قديم مكتوب فيه عدد تكرارات فوق سقف السيرفر (100000)
    throw new Error(
      "تعذر التحقق من كلمة المرور: إعدادات التشفير غير مدعومة على هذا السيرفر. أعد إنشاء كلمة المرور.",
    );
  }
}

/** إنشاء hash لكلمة المرور بصيغة: pbkdf2$<iterations>$<salt>$<hash> */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveBits(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/** التحقق من كلمة المرور مقابل الـ hash المخزّن (بمقارنة بطول ثابت). */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;

  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) {
    return false;
  }

  let salt: Uint8Array<ArrayBuffer>;
  let expected: Uint8Array;
  try {
    salt = fromBase64(parts[2]!);
    expected = fromBase64(parts[3]!);
  } catch {
    return false;
  }

  const actual = await deriveBits(password, salt, iterations);
  return equalBytes(expected, actual);
}

/** مفتاح توقيع الجلسات — يُخزَّن في admin_settings.session_secret. */
export function createSessionSecret(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(32)));
}

async function sign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64(new Uint8Array(signature));
}

/** إنشاء توكن جلسة بصيغة: <expiresAtMs>.<hmac> */
export async function createSessionToken(
  secret: string,
  now: number = Date.now(),
): Promise<string> {
  const expiresAt = now + SESSION_TTL_SECONDS * 1000;
  const payload = String(expiresAt);
  return `${payload}.${await sign(secret, payload)}`;
}

/** التحقق من توكن الجلسة: التوقيع صحيح ولم ينتهِ بعد. */
export async function verifySessionToken(
  secret: string,
  token: string | null | undefined,
  now: number = Date.now(),
): Promise<boolean> {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, signature] = parts;
  if (!payload || !signature) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false;

  const expected = await sign(secret, payload);
  return equalStrings(expected, signature);
}
