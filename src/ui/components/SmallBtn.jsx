export default function SmallBtn({ children, onClick, className = "", disabled = false, title = "" }) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={
        "rounded-xl border border-white/10 px-3 py-2 bg-white/10 hover:bg-white/15 active:scale-[0.98] transition shadow-sm text-white disabled:opacity-50 disabled:cursor-not-allowed " +
        className
      }
    >
      {children}
    </button>
  );
}