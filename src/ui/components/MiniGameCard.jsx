export default function MiniGameCard({ active, title, desc, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        "w-full text-left rounded-3xl border p-4 transition shadow-sm active:scale-[0.99] " +
        (active ? "bg-white/15 border-white/20" : "bg-white/10 border-white/10 hover:bg-white/15")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-extrabold text-white text-lg leading-tight">{title}</div>
          <div className="mt-1 text-sm text-white/70">{desc}</div>
        </div>
        {badge ? (
          <span className="shrink-0 rounded-full border border-amber-300/25 bg-amber-500/15 px-3 py-1 text-xs font-extrabold text-amber-100">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-xs text-white/55">Klik for at åbne</div>
    </button>
  );
}