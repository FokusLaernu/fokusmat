export default function ThemeButton({ theme, active, onClick }) {
  const grad = `bg-gradient-to-r ${theme.gradFrom} ${theme.gradVia} ${theme.gradTo}`;
  return (
    <button
      onClick={onClick}
      className={
        "relative w-full rounded-2xl border px-3 py-3 text-left shadow-sm transition active:scale-[0.99] " +
        (active ? "border-white/20 bg-white/15" : "border-white/10 bg-white/10 hover:bg-white/15")
      }
    >
      <div className="flex items-center justify-between gap-2 text-white">
        <div className="font-extrabold">{theme.name}</div>
        <div className={"h-7 w-16 rounded-xl " + grad} />
      </div>
      {active && <div className="mt-1 text-xs text-white/70">Valgt</div>}
    </button>
  );
}