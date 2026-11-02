import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import newsFintech from "@/assets/news-fintech.jpg";
import newsSchool from "@/assets/news-school.jpg";
import savingsBanner from "@/assets/savings-banner.jpg";

// عروض الشركاء من public/ — استبدلت الصورة القديمة المكسورة (news-careem).
const OFFER_BOOKING = "/offer-booking.webp";
const OFFER_TRIP = "/offer-trip.webp";
const OFFER_TALABAT = "/offer-talabat.webp";

const NEWS_ITEMS = [
  {
    date: "٢٠٢٦ – أكتوبر - ١٢",
    title: "مزايا بطاقات ماستركارد — 0.09 JOD الدفعة الشهرية",
    excerpt: "اكتشف عرض Priceless المميزة لحملة بطاقات ماستركارد من البنك الأردني الكويتي.",
    image: OFFER_BOOKING,
    alt: "عرض Booking.com و Priceless مع بطاقات ماستركارد",
  },
  {
    date: "٢٠٢٦ – أكتوبر - ٥",
    title: "خصم يصل إلى 20% على حجوزات الرحلات عبر Trip.com",
    excerpt: "احجز رحلاتك القادمة مع خصم يصل إلى 20% على حجوزات الرحلات من خلال Trip.com.",
    image: OFFER_TRIP,
    alt: "عرض Trip.com مع بطاقات ماستركارد",
  },
  {
    date: "٢٠٢٦ – سبتمبر - ١٥",
    title: "خصم 20% على طلبات الطعام والنقلاة عبر طلبات",
    excerpt: "استفد من خصم 20% على طلبات الطعام والنقلاة عبر تطبيق طلبات.",
    image: OFFER_TALABAT,
    alt: "عرض طلبات مع بطاقات ماستركارد",
  },
  {
    date: "٢٠٢٦ – سبتمبر - ٢٨",
    title: "البنك الأردني الكويتي راعٍ ذهبي لمهرجان الأردن للتكنولوجيا المالية",
    image: newsFintech,
    alt: "مهرجان الأردن للتكنولوجيا المالية",
  },
  {
    date: "٢٠٢٦ – سبتمبر - ١٤",
    title: "توزيع الحقائب المدرسية على طلبة المدارس ضمن مبادرة المجتمع",
    image: newsSchool,
    alt: "مبادرة توزيع الحقائب المدرسية",
  },
  {
    date: "٢٠٢٦ – أغسطس - ٣٠",
    title: "إعلان أسماء الراجحين في برنامج حسابات التوفير للعام 2026",
    image: savingsBanner,
    alt: "برنامج حسابات التوفير",
  },
];

export default function NewsSection() {
  return (
    <section id="news" className="scroll-mt-24 bg-bank-light py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-primary">الأخبار</h2>

        <div className="mt-6 flex snap-x gap-6 overflow-x-auto pb-4">
          {NEWS_ITEMS.map((item) => (
            <article
              key={item.title}
              className="w-72 shrink-0 snap-start overflow-hidden rounded-2xl bg-card shadow-sm sm:w-80"
            >
              <img
                src={item.image}
                alt={item.alt}
                loading="lazy"
                className="h-44 w-full object-cover"
              />
              <div className="p-4">
                <p className="text-xs text-muted-foreground">{item.date}</p>
                <h3 className="mt-2 font-bold leading-7 text-primary">{item.title}</h3>
                {item.excerpt ? (
                  <p className="mt-2 text-sm leading-7 text-foreground">{item.excerpt}</p>
                ) : null}
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-bank-link transition-opacity hover:opacity-80"
                >
                  اقرأ أكثر
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
