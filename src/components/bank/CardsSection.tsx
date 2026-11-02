import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import cardsFan from "@/assets/cards-fan.jpg";

const TABS = [
  {
    id: "credit",
    label: "بطاقات الائتمان",
    lead: "بفئاتها المتعددة والتي توفر مرونة في الدفع والقدرة الشرائية، بالإضافة لحدود ائتمانية تلبي احتياجاتك بما يلائم دخلك الشهري.",
    body: "يمكن استخدام البطاقة في عمليات الشراء أو السحب النقدي من أجهزة الصراف الآلي المتوفرة في جميع أنحاء العالم، أو من أي فرع من فروع البنك.",
  },
  {
    id: "debit",
    label: "بطاقات الخصم",
    lead: "بطاقات مرتبطة مباشرة بحسابك الجاري أو حساب التوفير، تتيح لك الشراء والسحب النقدي مع خصم فوري من رصيد حسابك.",
    body: "مقبولة لدى ملايين نقاط البيع وأجهزة الصراف الآلي حول العالم، مع إمكانية إدارتها بسهولة عبر الخدمات المصرفية عبر الإنترنت.",
  },
  {
    id: "prepaid",
    label: "بطاقات المدفوعة",
    lead: "بطاقات قابلة لإعادة الشحن تمنحك تحكماً كاملاً بمصروفاتك؛ اشحنها بالمبلغ الذي تريده واستخدمها بحرية وأمان.",
    body: "خيار مثالي للمشتريات اليومية وللهدايا وللاستخدام الآمن عبر الإنترنت دون الحاجة إلى حساب مصرفي.",
  },
];

export default function CardsSection() {
  const [activeId, setActiveId] = useState(TABS[0]!.id);
  const navigate = useNavigate();
  const active = TABS.find((tab) => tab.id === activeId) ?? TABS[0]!;

  return (
    <section id="cards" className="scroll-mt-24 bg-bank-light py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-primary">البطاقات</h2>

        <div className="mt-6 flex flex-nowrap gap-2" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.id === activeId}
              onClick={() =>
                tab.id === "credit" ? navigate({ to: "/cards" }) : setActiveId(tab.id)
              }
              className={`whitespace-nowrap rounded-xl px-3 py-3 text-[13px] font-bold transition-colors ${
                tab.id === activeId
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-primary hover:bg-muted/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div key={active.id} className="mt-8">
          <p className="text-lg font-bold leading-9 text-primary">{active.lead}</p>
          <p className="mt-4 leading-8 text-foreground">{active.body}</p>
          <Link
            to="/cards"
            className="mt-6 inline-flex items-center gap-1 font-semibold text-bank-link transition-opacity hover:opacity-80"
          >
            إعرِف المزيد
            <ChevronLeft className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={() => navigate({ to: "/cards" })}
            aria-label="عرض كل البطاقات"
            className="mx-auto mt-8 block max-w-lg cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <img
              src={cardsFan}
              alt="بطاقات البنك بأنواعها — اضغط لعرض البطاقات"
              width={1408}
              height={1008}
              loading="lazy"
              className="w-full rounded-2xl object-cover shadow-sm transition-transform duration-300 hover:scale-[1.02]"
            />
          </button>
        </div>
      </div>
    </section>
  );
}
