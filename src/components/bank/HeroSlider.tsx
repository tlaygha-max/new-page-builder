import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import slideCards3 from "@/assets/slide-cards-3cards.png";

// صور السلايدر من public/ — استبدلت الملفات القديمة (.asset.json) اللي كانت
// بتشاور على سيرفر Lovable ومكسورة (404).
const SLIDE_ANSULEMA = "/slide-ansulema.webp";
const SLIDE_HOUSING = "/slide-housing.webp";
const SLIDE_CASHBACK = "/slide-cashback.webp";
const SLIDE_TAWFEER = "/slide-tawfeer.webp";
const SLIDE_55 = "/slide-55.webp";

type Slide = {
  id: string;
  image: string;
  alt: string;
  headline?: string;
};

const SLIDES: Slide[] = [
  {
    id: "ansulema",
    image: SLIDE_ANSULEMA,
    alt: "الأنسليمة — تمليك عقد في الأردن بفائدة 0% على 4 سنوات",
  },
  {
    id: "cards-cashback",
    image: slideCards3,
    alt: "بطاقات البنك الائتمانية — كاش باك على جميع البطاقات، فعّل الآن واحصل على الاسترداد",
    headline: "كاش باك على جميع البطاقات\nفعّل الآن واحصل على الاسترداد",
  },
  {
    id: "housing",
    image: SLIDE_HOUSING,
    alt: "بيت الأحلام ما رح يحلم! امتلك بيتك اليوم بنسبة فائدة ثابتة 4.99% لأول 3 سنوات وتمويل لغاية 100%",
  },
  {
    id: "cashback",
    image: SLIDE_CASHBACK,
    alt: "كاش باك بفائدة 3.5% وبحد أعلى 200 دينار بس تدفع بأي من بطاقات ماستركارد الائتمانية",
  },
  {
    id: "tawfeer",
    image: SLIDE_TAWFEER,
    alt: "حسابات التوفير الجوائز قدرة — اقتنع أو غَح حسابات التوفير الجوائز ولا تقنوت فرصتك للربح!",
  },
  {
    id: "55",
    image: SLIDE_55,
    alt: "خمسين سنة بين أهلنا وناسنا",
  },
];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((current) => (current + 1) % SLIDES.length), 6000);
    return () => clearInterval(timer);
  }, [index]);

  const slide = SLIDES[index]!;

  return (
    <section className="relative overflow-hidden" aria-roledescription="carousel">
      <div key={slide.id} className="animate-in fade-in duration-700">
        <div className="relative">
          <Link
            to="/cards"
            aria-label="افتح صفحة البطاقات"
            className="block cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <img
              src={slide.image}
              alt={slide.alt}
              className="aspect-[768/570] w-full object-cover sm:aspect-[16/7] lg:aspect-[16/5]"
            />
            {slide.headline && (
              <div className="absolute inset-y-0 start-0 flex w-1/2 items-center ps-4 sm:ps-10">
                <h2 className="whitespace-pre-line text-lg font-bold leading-snug text-primary-foreground drop-shadow-md sm:text-2xl sm:leading-tight lg:text-3xl">
                  {slide.headline}
                </h2>
              </div>
            )}
          </Link>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2 sm:bottom-4">
        {SLIDES.map((item, barIndex) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(barIndex)}
            aria-label={`الشريحة ${barIndex + 1}`}
            aria-current={barIndex === index}
            className={`h-1 w-9 rounded-full shadow-sm transition-colors sm:w-14 ${
              barIndex === index ? "bg-white" : "bg-white/45"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
