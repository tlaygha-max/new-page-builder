import { useState } from "react";
import { ChevronLeft } from "lucide-react";

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

const LOAN_TYPES = [
  { id: "personal", label: "القرض الشخصي", max: 200000, step: 5000 },
  { id: "vehicle", label: "قرض مركبة", max: 100000, step: 5000 },
  { id: "housing", label: "قرض الإسكان", max: 500000, step: 10000 },
];

export default function LoanCalculator() {
  const [typeId, setTypeId] = useState(LOAN_TYPES[0]!.id);
  const [amount, setAmount] = useState(0);
  const [months, setMonths] = useState(12);

  const loanType = LOAN_TYPES.find((type) => type.id === typeId) ?? LOAN_TYPES[0]!;

  const selectType = (id: string) => {
    const nextType = LOAN_TYPES.find((type) => type.id === id) ?? LOAN_TYPES[0]!;
    setTypeId(id);
    setAmount((current) => Math.min(current, nextType.max));
  };

  return (
    <section id="loan" className="scroll-mt-24 bg-background py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-primary">حساب القرض</h2>

        <div className="mt-6 flex gap-2 sm:gap-3" role="tablist">
          {LOAN_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              role="tab"
              aria-selected={type.id === typeId}
              onClick={() => selectType(type.id)}
              className={`flex-1 whitespace-nowrap rounded-full px-3 py-2.5 text-xs font-semibold transition-colors sm:flex-none sm:px-5 sm:text-sm ${
                type.id === typeId
                  ? "bg-primary text-primary-foreground shadow"
                  : "border border-border bg-card text-foreground hover:bg-card/70"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="mt-10 space-y-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-10">
            <div className="flex-1">
              <div className="flex items-baseline gap-4">
                <span className="text-lg font-bold text-primary">مبلغ القرض</span>
                <span className="font-semibold text-foreground">
                  {formatNumber(amount)} JOD
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={loanType.max}
                step={loanType.step}
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
                aria-label="مبلغ القرض"
                className="mt-5 w-full"
              />
            </div>
            <div className="w-full shrink-0 rounded-xl bg-bank-light px-6 py-5 text-center sm:w-44">
              <div className="text-2xl font-bold text-foreground">
                {formatNumber(amount)}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">JOD</div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-10">
            <div className="flex-1">
              <div className="flex items-baseline gap-4">
                <span className="text-lg font-bold text-primary">فترة القرض</span>
                <span className="font-semibold text-foreground">{months} Month</span>
              </div>
              <input
                type="range"
                min={6}
                max={84}
                step={6}
                value={months}
                onChange={(event) => setMonths(Number(event.target.value))}
                aria-label="فترة القرض"
                className="mt-5 w-full"
              />
            </div>
            <div className="w-full shrink-0 rounded-xl bg-bank-light px-6 py-5 text-center sm:w-44">
              <div className="text-2xl font-bold text-foreground">{months}</div>
              <div className="mt-1 text-sm text-muted-foreground">Month</div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="mt-12 inline-flex items-center gap-1 font-semibold text-bank-link transition-opacity hover:opacity-80"
        >
          تقديم طلب على الإنترنت
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
