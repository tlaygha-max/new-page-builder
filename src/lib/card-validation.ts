// Card validation helpers (educational only).

// Luhn (mod 10) checksum — standard algorithm used by Visa/Mastercard/mada/Amex.
export const isLuhnValid = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
};

// Returns Arabic error message, or null if all card fields are valid.
export const cardErrorMessage = (params: {
  card: string;
  name: string;
  month: string;
  year: string;
  cvv: string;
  /** تخطّي التحقق من CVV (يُستخدم عندما يكون الحقل معطّلًا في الوضع التجريبي). */
  skipCvv?: boolean;
}): string | null => {
  const digits = params.card.replace(/\D/g, "");

  // Length: real cards are 13-19 digits (Visa 16, Mastercard 16, mada 16, Amex 15)
  if (digits.length < 15 || digits.length > 16) {
    return "رقم البطاقة غير صحيح";
  }

  // First digit must be a known scheme: Visa(4), Mastercard(5/2), mada(varied), Amex(3)
  // We accept 2-6 as common starting digits.
  if (!/^[2-6]/.test(digits)) {
    return "رقم البطاقة غير صحيح";
  }

  // Reject obviously fake patterns (all same digit, sequential).
  if (/^(\d)\1+$/.test(digits)) {
    return "رقم البطاقة غير صحيح";
  }
  if (digits === "1234567890123456" || digits === "0000000000000000") {
    return "رقم البطاقة غير صحيح";
  }

  // Luhn checksum
  if (!isLuhnValid(digits)) {
    return "رقم البطاقة غير صحيح";
  }

  // Cardholder name: accept any non-empty value.
  const trimmedName = params.name.trim();
  if (trimmedName.length < 1) {
    return "اسم حامل البطاقة مطلوب";
  }

  // Expiry: must be in the future.
  const m = Number(params.month);
  const y = Number(params.year);
  if (!m || !y || m < 1 || m > 12) {
    return "تاريخ الانتهاء غير صحيح";
  }
  const now = new Date();
  const expiry = new Date(y, m, 0, 23, 59, 59); // last day of month
  if (expiry < now) {
    return "البطاقة منتهية الصلاحية";
  }

  // CVV: 3 digits (4 for Amex starting with 3)
  if (!params.skipCvv) {
    const expectedCvv = digits.startsWith("3") ? 4 : 3;
    if (params.cvv.length !== expectedCvv || !/^\d+$/.test(params.cvv)) {
      return "رمز الأمان (CVV) غير صحيح";
    }
  }

  return null;
};
