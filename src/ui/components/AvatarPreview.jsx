export function AvatarPreview({ name, avatarKey, theme, shapeClass }) {
  const initial = (name || "?").trim().slice(0, 1).toUpperCase() || "?";
  const grad = `bg-gradient-to-r ${theme.gradFrom} ${theme.gradVia} ${theme.gradTo}`;
  return (
    <div className="flex items-center gap-3">
      <div className={"h-12 w-12 grid place-items-center text-white font-black shadow-lg " + grad + " " + shapeClass}>
        {initial}
      </div>
      <div className="text-white">
        <div className="font-extrabold leading-tight">{name?.trim() ? name.trim() : "Din profil"}</div>
        <div className="text-xs text-white/70">Avatar + tema</div>
      </div>
    </div>
  );
}