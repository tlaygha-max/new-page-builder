import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, Plus } from "lucide-react";
import Header from "@/components/bank/Header";
import SiteFooter from "@/components/bank/SiteFooter";
import ScrollToTop from "@/components/bank/ScrollToTop";
import CardPaymentGateway from "@/components/bank/CardPaymentGateway";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import cardClassic from "@/assets/card-classic.webp";
import cardTitanium from "@/assets/card-titanium.webp";
import cardPlatinum from "@/assets/card-platinum.webp";
import cardWorld from "@/assets/card-world.webp";
import cardWorldElite from "@/assets/card-world-elite.webp";
import cardFlyPlus from "@/assets/card-fly-plus.webp";
import cardAmex from "@/assets/card-amex.webp";
import programInstallment from "@/assets/program-installment.webp";
import programInstantDiscount from "@/assets/program-instant-discount.webp";

type Benefit = {
  title: string;
  body?: string;
  note?: string;
  bullets?: string[];
};

type CardItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  benefits: Benefit[];
  moreHref: string;
};

const APPLY_URL = "https://www.jkb.com/ar/webforms/apply-cards";
const JKB = "https://www.jkb.com/ar/cards";

const CARDS: CardItem[] = [
  {
    id: "classic",
    title: "بطاقة ماستركارد كلاسيك الائتمانية",
    description:
      "يقدم البنك الأردني الكويتي بطاقة ماستركارد كلاسيك الائتمانية المقبولة دولياً مجاناً للسنة الأولى، والتي تتيح لك التسوق وكسب النقاط بشكل فوري وآمن. تتيح البطاقة الائتمانية الدوارة لحاملها إمكانية تسديد سحوبات البطاقة على دفعات شهرية.",
    image: cardClassic,
    imageAlt: "بطاقة ماستركارد كلاسيك الائتمانية",
    benefits: [
      {
        title: "إمكانية تقسيط مشترياتكم بفائدة 0%",
        body: "إمكانية تقسيط مشترياتكم بفائدة 0% من خلال شركائنا في برنامج التقسيط ولفترات تقسيط تصل لغاية 36 شهراً.",
      },
      {
        title: "الحصول على خصم فوري على المشتريات.",
        body: "إمكانية الحصول على خصم فوري على المشتريات التي تتم من خلال البطاقة الائتمانية ومن خلال مجموعة مختارة من التجار.",
      },
    ],
    moreHref: `${JKB}/mastercard-classic-credit-card`,
  },
  {
    id: "titanium",
    title: "بطاقة ماستركارد تيتانيوم الائتمانية",
    description:
      "يقدم البنك الأردني الكويتي بطاقة ماستركارد تيتانيوم الائتمانية المقبولة دولياً مجاناً للسنة الأولى، والتي تمكنك من التسوق وكسب النقاط على الفور وبشكل آمن، وتسديد سحوبات البطاقة على دفعات شهرية، مع فترة سماح تصل إلى 51 يوماً في حدها الأقصى.",
    image: cardTitanium,
    imageAlt: "بطاقة ماستركارد تيتانيوم الائتمانية",
    benefits: [
      {
        title: "إمكانية تقسيط مشترياتكم بفائدة 0%",
        body: "إمكانية تقسيط مشترياتكم بفائدة 0% من خلال شركائنا في برنامج التقسيط ولفترات تقسيط تصل لغاية 36 شهراً.",
      },
      {
        title: "ميزة الدخول المجاني إلى صالات المطارات",
        body: "إمكانية دخول العميل حامل البطاقة فقط إلى بعض من صالات رجال الأعمال من خلال التسجيل على تطبيق Mastercard Travel Pass.",
        bullets: [
          "الوصول إلى 5 صالات في عدد من المطارات في الدول العربية.",
          "إمكانية الاستفادة من جميع المرافق الموجودة في الصالات.",
        ],
      },
    ],
    moreHref: `${JKB}/mastercard-titanium`,
  },
  {
    id: "platinum",
    title: "بطاقة ماستركارد بلاتينيوم الائتمانية",
    description:
      "يقدم البنك الأردني الكويتي بطاقة ماستركارد بلاتينيوم الائتمانية المقبولة دولياً مجاناً للسنة الأولى، والتي تمكنك من التسوق وكسب النقاط على الفور وبشكل آمن، وتسديد سحوبات البطاقة على دفعات شهرية، مع فترة سماح تصل إلى 51 يوماً في حدها الأقصى.",
    image: cardPlatinum,
    imageAlt: "بطاقة ماستركارد بلاتينيوم الائتمانية",
    benefits: [
      {
        title: "إمكانية تقسيط مشترياتكم بفائدة 0%",
        body: "إمكانية تقسيط مشترياتكم بفائدة 0% من خلال شركائنا في برنامج التقسيط ولفترات تقسيط تصل لغاية 36 شهراً.",
      },
      {
        title: "ميزة الدخول المجاني إلى صالات المطارات",
        body: "إمكانية دخول العميل حامل البطاقة فقط إلى بعض من صالات رجال الأعمال من خلال التسجيل على تطبيق Mastercard Travel Pass.",
        bullets: [
          "الوصول إلى 25 صالة في عدد من المطارات في مختلف أنحاء العالم.",
          "إمكانية الاستفادة من جميع المرافق الموجودة في الصالات.",
        ],
      },
    ],
    moreHref: `${JKB}/mastercard-platinum`,
  },
  {
    id: "world",
    title: "بطاقة ماستركارد وورلد الائتمانية",
    description:
      "يقدم البنك الأردني الكويتي بطاقة ماستركارد وورلد الائتمانية، والمقبولة عالمياً. بطاقة ماستركارد الدوارة تتيح لحاملها إمكانية تسديد سحوبات البطاقة على دفعات شهرية، مع فترة سماح قد تصل إلى 51 يوماً في حدها الأقصى.",
    image: cardWorld,
    imageAlt: "بطاقة ماستركارد وورلد الائتمانية",
    benefits: [
      {
        title: "إمكانية تقسيط مشترياتكم بفائدة 0%",
        body: "إمكانية تقسيط مشترياتكم بفائدة 0% من خلال شركائنا في برنامج التقسيط ولفترات تقسيط تصل لغاية 36 شهراً.",
      },
      {
        title: "ميزة الدخول المجاني إلى صالات المطارات",
        body: "إمكانية دخول العميل حامل البطاقة فقط إلى بعض صالات رجال الأعمال من خلال التسجيل على تطبيق Mastercard Travel Pass.",
        bullets: [
          "الوصول إلى أكثر من 1,100 صالة في عدد من المطارات في مختلف أنحاء العالم.",
          "إمكانية الاستفادة من جميع المرافق الموجودة في الصالات.",
        ],
      },
    ],
    moreHref: `${JKB}/mastercard-world`,
  },
  {
    id: "world-elite",
    title: "بطاقة ماستركارد وورلد إيليت Biometric",
    description:
      "خدمة المساعد الشخصي Quintessentially، توصلك إلى ما لا يمكن الوصول إليه. خدمة تعمل 24 ساعة في اليوم بناءً على طلبك لمنحك المساعدة والوصول إلى أكثر الأمور أهمية لك.",
    image: cardWorldElite,
    imageAlt: "بطاقة ماستركارد وورلد إيليت Biometric",
    benefits: [
      {
        title: "خدمة المساعد الشخصي",
        body: "خدمة كونسيرج السفر من وورلد إيليت المجانية المقدمة من شركة TEN، خدمة متوفرة على مدار 24 ساعة لتلبية طلباتك وتوصيلك بكل ما يهمك. التخطيط لرحلة مفعمة بالرفاهية، الدخول لأفضل المطاعم الفاخرة وحضور الفعاليات الترفيهية الحصرية.",
        note: "دع وورلد إيليت كونسيرج يتكفل بكافة الترتيبات بينما تتمتع أنت بوقتك!",
      },
      {
        title: "ميزة الدخول المجاني إلى صالات المطارات",
        body: "إمكانية دخول العميل حامل البطاقة مع دعوة ضيف إلى بعض صالات رجال الأعمال من خلال التسجيل على تطبيق Mastercard Travel Pass.",
        bullets: [
          "الوصول إلى أكثر من 1,100 صالة في عدد من المطارات في مختلف أنحاء العالم.",
          "إمكانية الاستفادة من جميع المرافق الموجودة في الصالات.",
        ],
      },
    ],
    moreHref: `${JKB}/mastercard-world-elite-biometric-card`,
  },
  {
    id: "fly-plus",
    title: "بطاقة ماستركارد \" فلاي آند بلس \" الائتمانية",
    description:
      "بطاقة ماستركارد \" فلاي آند بلس \" من البنك الأردني الكويتي – الملكية الأردنية تجمع بين متعتي السفر والتسوق، إذ يمكنك استخدام بطاقة \" فلاي آند بلس \" لشراء كل ما تحتاجه من المحلات التجارية والأسواق.",
    image: cardFlyPlus,
    imageAlt: "بطاقة ماستركارد فلاي آند بلس الائتمانية",
    benefits: [
      {
        title: "اكتساب الأميال على برنامج المسافر الدائم \"Royal Club\"",
        body: "باستخدام بطاقة الماستركارد \"فلاي آند بلس\" للمشتريات اليومية واستبدال الأميال المجمعة بمزايا خاصة بالسفر من خلال الملكية الأردنية وتحالف ون وورلد (One World Alliance).",
      },
      {
        title: "ميزة الدخول المجاني إلى صالات المطارات",
        body: "إمكانية دخول العميل حامل البطاقة فقط إلى بعض صالات رجال الأعمال من خلال التسجيل على تطبيق Mastercard Travel Pass.",
        bullets: [
          "الوصول إلى أكثر من 1,100 صالة في عدد من المطارات في مختلف أنحاء العالم.",
          "إمكانية الاستفادة من جميع المرافق الموجودة في الصالات.",
        ],
      },
    ],
    moreHref: `${JKB}/mastercard-fly-plus-credit`,
  },
  {
    id: "amex",
    title: "أمريكان إكسبرس",
    description: "تقدم بطاقة أميكس باقة من المزايا وأفضل برامج للمكافآت.",
    image: cardAmex,
    imageAlt: "بطاقة أمريكان إكسبرس",
    benefits: [
      {
        title: "برامج مكافآت العضوية",
        body: "برامج مكافآت العضوية تخول حامل البطاقة الحصول على نقطة واحدة مقابل كل دولار ينفقه، حيث يمكن استبدال هذه النقاط بتذاكر سفر، إقامات في الفنادق، قسائم مشتريات، تناول العشاء وغيرها الكثير.",
      },
    ],
    moreHref: `${JKB}/amex`,
  },
];

const PROGRAMS = [
  {
    title: "برنامج الخصم المباشر",
    description:
      "استمتع بخصومات فورية من العديد من المتاجر من خلال برنامج الخصم المباشر عند استخدام بطاقة ماستركارد.",
    bullets: [
      "احصل على خصم مباشر عند استخدامك بطاقة ماستركارد.",
      "برنامج الخصم المباشر يتضمن العديد من السلع والخدمات من متاجر مختلفة.",
    ],
    image: programInstantDiscount,
    imageAlt: "برنامج الخصم المباشر",
    moreHref: `${JKB}/instant-discount-program`,
  },
  {
    title: "برنامج التقسيط من خلال بطاقات ماستركارد الائتمانية",
    description:
      "بإمكانك تقسيط مشترياتك من خلال بطاقات ماستركارد الائتمانية من البنك الأردني الكويتي بفائدة 0% وفترة سداد تصل لغاية 36 شهراً، وذلك عند استخدامك بطاقة ماستركارد الائتمانية بكافة فئاتها للشراء من خلال مجموعة من شركائنا في برنامج التقسيط ضمن القطاعات المتنوعة: الإلكترونيات والصحة والساعات والسفر وأكثر من ذلك بكثير.",
    bullets: [],
    image: programInstallment,
    imageAlt: "برنامج التقسيط",
    moreHref: `${JKB}/installment-plan-with-mastercard-credit-cards`,
  },
];

function BenefitList({ benefits }: { benefits: Benefit[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mt-6 divide-y divide-border border-y border-border">
      {benefits.map((benefit, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={benefit.title}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-4 text-start"
            >
              <span className="font-semibold text-bank-link">{benefit.title}</span>
              <Plus
                aria-hidden="true"
                className={`h-6 w-6 shrink-0 text-bank-link transition-transform duration-200 ${
                  isOpen ? "rotate-45" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="space-y-3 pb-5">
                {benefit.body && (
                  <p className="leading-8 text-foreground">{benefit.body}</p>
                )}
                {benefit.note && (
                  <p className="font-semibold leading-8 text-foreground">{benefit.note}</p>
                )}
                {benefit.bullets && benefit.bullets.length > 0 && (
                  <ul className="list-disc space-y-1.5 ps-6 leading-8 text-foreground">
                    {benefit.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const Route = createFileRoute("/cards")({
  head: () => ({
    meta: [
      { title: "بطاقات ماستركارد | البنك الأردني الكويتي" },
      {
        name: "description",
        content:
          "بطاقات ماستركارد الائتمانية من البنك الأردني الكويتي: كلاسيك، تيتانيوم، بلاتينيوم، وورلد، وورلد إيليت Biometric، فلاي آند بلس، وأمريكان إكسبرس.",
      },
      { property: "og:title", content: "بطاقات ماستركارد | البنك الأردني الكويتي" },
      {
        property: "og:description",
        content:
          "بطاقات ماستركارد الائتمانية من البنك الأردني الكويتي: كلاسيك، تيتانيوم، بلاتينيوم، وورلد، وورلد إيليت Biometric، فلاي آند بلس، وأمريكان إكسبرس.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CardsPage,
});

function CardsPage() {
  const [detailCard, setDetailCard] = useState<CardItem | null>(null);

  return (
    <div id="top" className="min-h-screen bg-bank-light">
      <Header />
      <main>
        <section className="bg-bank-light py-10 text-center md:py-14">
          <p className="px-4 font-semibold text-bank-link">
            اختر بطاقة الائتمان المناسبة لك
          </p>
          <h1 className="mt-3 px-4 text-3xl font-bold text-primary md:text-4xl">
            بطاقات ماستركارد
          </h1>
          <p className="mx-auto mt-4 max-w-2xl px-4 leading-8 text-foreground">
            بفئاتها المتعددة والتي تمنحك المرونة في الدفع والقدرة الشرائية بالإضافة
            للعديد من المزايا التي تلبي احتياجاتك بما يلائم دخلك الشهري.
          </p>
        </section>

        <div className="bg-bank-lighter py-10 md:py-14">
          <div className="mx-auto max-w-6xl space-y-8 px-4">
            {CARDS.map((card, index) => (
              <section
                key={card.id}
                className="grid items-stretch gap-6 md:grid-cols-2"
              >
                <div
                  className={`rounded-3xl bg-card p-6 shadow-sm md:p-8 ${
                    index % 2 === 1 ? "md:order-2" : ""
                  }`}
                >
                  <h2 className="text-2xl font-bold leading-snug text-primary md:text-3xl">
                    {card.title}
                  </h2>
                  <p className="mt-4 leading-8 text-foreground">{card.description}</p>
                  <BenefitList benefits={card.benefits} />
                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
                    <button
                      type="button"
                      onClick={() => setDetailCard(card)}
                      className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
                    >
                      فعّل الآن
                    </button>
                    <a
                      href={card.moreHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-bank-link transition-opacity hover:opacity-80"
                    >
                      اعرف اكثر
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>
                <div
                  className={`flex items-center justify-center rounded-3xl bg-card p-6 shadow-sm md:p-8 ${
                    index % 2 === 1 ? "md:order-1" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setDetailCard(card)}
                    aria-label={`عرض تفاصيل ${card.title}`}
                    className="group block w-full max-w-md cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  >
                    <img
                      src={card.image}
                      alt={card.imageAlt}
                      width={1152}
                      height={985}
                      loading={index > 1 ? "lazy" : undefined}
                      className="w-full transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </button>
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="bg-bank-light py-10 md:py-14">
          <div className="mx-auto max-w-6xl space-y-8 px-4">
            {PROGRAMS.map((program, index) => (
              <section
                key={program.title}
                className="grid items-stretch gap-6 md:grid-cols-2"
              >
                <div
                  className={`rounded-3xl bg-card p-6 shadow-sm md:p-8 ${
                    index % 2 === 1 ? "md:order-2" : ""
                  }`}
                >
                  <h2 className="text-2xl font-bold leading-snug text-primary md:text-3xl">
                    {program.title}
                  </h2>
                  <p className="mt-4 leading-8 text-foreground">{program.description}</p>
                  {program.bullets.length > 0 && (
                    <ul className="mt-4 list-disc space-y-1.5 ps-6 leading-8 text-foreground">
                      {program.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                  <a
                    href={program.moreHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-bank-link transition-opacity hover:opacity-80"
                  >
                    اعرف اكثر
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
                <div
                  className={`overflow-hidden rounded-3xl bg-card shadow-sm ${
                    index % 2 === 1 ? "md:order-1" : ""
                  }`}
                >
                  <img
                    src={program.image}
                    alt={program.imageAlt}
                    width={1152}
                    height={985}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
      <ScrollToTop />

      <Dialog open={detailCard !== null} onOpenChange={(open) => !open && setDetailCard(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {detailCard && (
            <>
              <div className="mx-auto w-full max-w-sm">
                <img
                  src={detailCard.image}
                  alt={detailCard.imageAlt}
                  width={1152}
                  height={985}
                  className="w-full"
                />
              </div>
              <DialogHeader>
                <DialogTitle className="text-start text-primary">
                  {detailCard.title}
                </DialogTitle>
                <DialogDescription>{detailCard.description}</DialogDescription>
              </DialogHeader>
              {detailCard.benefits.length > 0 && (
                <div className="space-y-4">
                  {detailCard.benefits.map((benefit) => (
                    <div key={benefit.title} className="space-y-2">
                      <h3 className="font-semibold text-bank-link">{benefit.title}</h3>
                      {benefit.body && (
                        <p className="leading-8 text-foreground">{benefit.body}</p>
                      )}
                      {benefit.note && (
                        <p className="font-semibold leading-8 text-foreground">
                          {benefit.note}
                        </p>
                      )}
                      {benefit.bullets && benefit.bullets.length > 0 && (
                        <ul className="list-disc space-y-1.5 ps-6 leading-8 text-foreground">
                          {benefit.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <CardPaymentGateway cardTitle={detailCard.title} />
              <div className="flex justify-end">
                <a
                  href={detailCard.moreHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-bank-link transition-opacity hover:opacity-80"
                >
                  اعرف اكثر
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
