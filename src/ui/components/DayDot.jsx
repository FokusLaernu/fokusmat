export default function DayDot({ label, filled, isToday }) {
  const base = "flex flex-col items-center justify-center rounded-2xl border px-2 py-2 min-w-[54px] transition ";
  const cls = filled
    ? "bg-gradient-to-b from-amber-500/25 via-orange-600/15 to-rose-600/15 border-white/15"
    : "bg-white/8 border-white/10";
  const todayRing = isToday ? " ring-2 ring-amber-300/70 " : "";
  return (
    <div className={base + cls + todayRing}>
      <div className="text-[11px] text-white/75">Dag {label}</div>
      <div className="text-lg leading-none">{filled ? "🔥" : "•"}</div>
    </div>
  );
}