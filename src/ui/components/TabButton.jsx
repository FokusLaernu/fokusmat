export default function TabButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-2xl px-4 py-2 font-extrabold border transition text-white " +
        (active
          ? "bg-white/20 border-white/20 shadow-sm"
          : "bg-white/10 border-white/10 hover:bg-white/15")
      }
    >
      {label}
    </button>
  );
}