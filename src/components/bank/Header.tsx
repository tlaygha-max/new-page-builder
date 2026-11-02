import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { MapPin, Menu, Search, X } from "lucide-react";
import jkbLogo from "@/assets/jkb-logo.png";


const NAV_ITEMS = [
  { label: "الرئيسية", href: "#top" },
  { label: "البطاقات", href: "#cards" },
  { label: "حساب القرض", href: "#loan" },
  { label: "الأخبار", href: "#news" },
  { label: "تواصل معنا", href: "#footer" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navHref = (hash: string) => (pathname === "/" ? hash : `/${hash}`);

  return (
    <header className="sticky top-0 z-50 bg-background">
      <div className="h-3 w-full bg-bank-azure" aria-hidden="true" />
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-center py-4">
          <a href="#top" className="flex items-center">
            <img
              src={jkbLogo}
              alt="البنك الأردني الكويتي - JORDAN KUWAIT BANK"
              className="h-14 w-auto sm:h-16"
            />
          </a>
        </div>

        <div className="flex items-center justify-center gap-5 pb-3 text-sm">
          <button
            type="button"
            className="font-semibold text-primary transition-colors hover:text-bank-link"
          >
            مساعدة
          </button>
          <button
            type="button"
            className="font-semibold text-primary transition-colors hover:text-bank-link"
          >
            English
          </button>
          <button
            type="button"
            aria-label="الفروع"
            className="text-primary transition-colors hover:text-bank-link"
          >
            <MapPin className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="بحث"
            className="text-primary transition-colors hover:text-bank-link"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-border py-3">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={menuOpen}
            className="text-primary transition-colors hover:text-bank-link"
          >
            {menuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
          <Link
            to="/"
            className="flex items-center gap-1 text-sm font-semibold text-bank-link transition-opacity hover:opacity-80"
          >
            Online Banking
            <span aria-hidden="true">‹</span>
          </Link>
        </div>
      </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-border bg-background px-4 py-3 shadow-lg">
          <ul className="mx-auto max-w-6xl space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={navHref(item.href)}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 font-semibold text-primary transition-colors hover:bg-bank-light"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
