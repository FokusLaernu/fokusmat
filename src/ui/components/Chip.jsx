export default function Chip({ children, className = "" }) {
  return (
    <span className={"inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-semibold shadow-sm text-white/90 " + className}>
      {children}
    </span>
  );
}