import { createFileRoute } from "@tanstack/react-router";
import ScrollToTop from "@/components/bank/ScrollToTop";
import Header from "@/components/bank/Header";
import HeroSlider from "@/components/bank/HeroSlider";
import CardsSection from "@/components/bank/CardsSection";
import LoanCalculator from "@/components/bank/LoanCalculator";
import NewsSection from "@/components/bank/NewsSection";
import SiteFooter from "@/components/bank/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "البنك الأردني الكويتي | الرئيسية" },
      {
        name: "description",
        content: "حسابات، بطاقات، قروض وخدمات مصرفية للأفراد والشركات — البنك الأردني الكويتي.",
      },
      { property: "og:title", content: "البنك الأردني الكويتي | الرئيسية" },
      {
        property: "og:description",
        content: "حسابات، بطاقات، قروض وخدمات مصرفية للأفراد والشركات — البنك الأردني الكويتي.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function AnnouncementNote() {
  return (
    <section className="relative bg-background py-10 md:py-14">
      <svg
        viewBox="0 0 80 160"
        aria-hidden="true"
        className="pointer-events-none absolute end-1 top-1/2 h-40 w-20 -translate-y-1/2 sm:h-44 sm:w-24 md:end-auto md:start-4 md:h-36 md:w-16"
      >
        <path d="M8 8 L64 80 L8 152" stroke="var(--bank-gold)" strokeWidth="12" fill="none" />
      </svg>
      <p className="mx-auto max-w-3xl px-6 pe-20 text-center text-[15px] font-normal leading-7 text-foreground sm:pe-24 sm:text-[17px] sm:leading-8 md:pe-6">
        <strong className="font-bold">إعلان إلى السادة مساهمي وعملاء البنك الأردني الكويتي</strong>{" "}
        بخصوص أسماءهم وأرباح المساهمين وودائع العملاء الذين ينطبق عليهم قانون تملك الحكومة للأموال
        التي لحقها التقادم.
      </p>
    </section>
  );
}

function Index() {
  return (
    <div id="top" className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSlider />
        <AnnouncementNote />
        <CardsSection />
        <LoanCalculator />
        <NewsSection />
      </main>
      <SiteFooter />
      <ScrollToTop />
    </div>
  );
}
