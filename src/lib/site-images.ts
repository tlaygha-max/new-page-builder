// Image keys the data panel can use. A row's image field is either one of these
// keys or a full https:// image link pasted into the panel.
import cardAmex from "@/assets/card-amex.webp";
import cardClassic from "@/assets/card-classic.webp";
import cardFlyPlus from "@/assets/card-fly-plus.webp";
import cardPlatinum from "@/assets/card-platinum.webp";
import cardTitanium from "@/assets/card-titanium.webp";
import cardWorldElite from "@/assets/card-world-elite.webp";
import cardWorld from "@/assets/card-world.webp";
import cardsFan from "@/assets/cards-fan.jpg";
import newsFintech from "@/assets/news-fintech.jpg";
import newsSchool from "@/assets/news-school.jpg";
import programInstallment from "@/assets/program-installment.webp";
import programInstantDiscount from "@/assets/program-instant-discount.webp";
import savingsBanner from "@/assets/savings-banner.jpg";
import slideCards3 from "@/assets/slide-cards-3cards.png";

// صور من public/ — استبدلت ملفات .asset.json القديمة المكسورة (404 على سيرفر Lovable)
const PUBLIC_IMAGES = {
  "offer-booking": "/offer-booking.webp",
  "offer-talabat": "/offer-talabat.webp",
  "offer-trip": "/offer-trip.webp",
  "slide-55": "/slide-55.webp",
  "slide-ansulema": "/slide-ansulema.webp",
  "slide-cashback": "/slide-cashback.webp",
  "slide-housing": "/slide-housing.webp",
  "slide-tawfeer": "/slide-tawfeer.webp",
} satisfies Record<string, string>;

const IMAGES: Record<string, string> = {
  "card-amex": cardAmex,
  "card-classic": cardClassic,
  "card-fly-plus": cardFlyPlus,
  "card-platinum": cardPlatinum,
  "card-titanium": cardTitanium,
  "card-world": cardWorld,
  "card-world-elite": cardWorldElite,
  "cards-fan": cardsFan,
  "news-fintech": newsFintech,
  "news-school": newsSchool,
  "program-installment": programInstallment,
  "program-instant-discount": programInstantDiscount,
  "savings-banner": savingsBanner,
  "slide-cards-3cards": slideCards3,
  ...PUBLIC_IMAGES,
};

export const IMAGE_KEYS = Object.keys(IMAGES).sort();

export function resolveImage(value: string | null | undefined): string {
  if (!value) return "";
  if (/^(https?:)?\/\//.test(value) || value.startsWith("/")) return value;
  return IMAGES[value] ?? "";
}
