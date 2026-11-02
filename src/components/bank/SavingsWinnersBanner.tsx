import savingsWinners from "@/assets/savings-winners.jpg.asset.json";

export default function SavingsWinnersBanner() {
  return (
    <section aria-label="الراجحون في برنامج حسابات التوفير" className="bg-bank-brown">
      <img
        src={savingsWinners.url}
        alt="الراجحون ببرنامج حسابات التوفير — الجوائز لعام 2026"
        width={1920}
        height={741}
        loading="lazy"
        className="aspect-[2862/1104] w-full object-cover"
      />
    </section>
  );
}
