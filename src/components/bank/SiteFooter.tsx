import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FOOTER_ITEMS = [
  {
    q: "نبذة عن البنك",
    a: "تعرّف على قصة البنك ورؤيته ورسالته، وشبكة فروعه وخدماته في الأردن وخارجها.",
  },
  {
    q: "معلومات تهم المستثمرين",
    a: "البيانات المالية، التقارير السنوية، وإفصاحات الشركات المتداولة.",
  },
  {
    q: "العقارات",
    a: "الممتلكات المعروضة للبيع من قبل البنك وتفاصيل التواصل بشأنها.",
  },
  {
    q: "الخزينة والمؤسسات المالية",
    a: "خدمات الخزينة، البنوك المراسلة، والعلاقات مع المؤسسات المالية.",
  },
  {
    q: "تواصل معنا",
    a: "فروع البنك، أرقام التواصل، والبريد الإلكتروني للاستفسارات والشكاوى.",
  },
];

export default function SiteFooter() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <footer id="footer" className="scroll-mt-24 border-t border-border bg-background pb-24 pt-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="divide-y divide-border">
          {FOOTER_ITEMS.map((item, itemIndex) => {
            const isOpen = openIndex === itemIndex;
            return (
              <div key={item.q} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : itemIndex)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 text-start"
                >
                  <span className="text-lg font-bold text-primary">{item.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-primary transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-3 leading-8 text-muted-foreground">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          © 2026 البنك الأردني الكويتي. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
