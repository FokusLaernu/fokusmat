export default function FirePanel({ children }) {
  return (
    <div className="rounded-3xl p-[1px] shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
      <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 p-[1px]">
        <div className="rounded-3xl bg-slate-950/55 backdrop-blur-xl border border-white/10 p-5">
          {children}
        </div>
      </div>
    </div>
  );
}