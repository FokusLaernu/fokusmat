import React from "react";
import Panel from "../../ui/components/Panel";
import Chip from "../../ui/components/Chip";
import ThemeButton from "../../ui/components/ThemeButton";
import { AvatarPreview } from "../../ui/components/AvatarPreview";

const THEMES = [
  { key: "navy", name: "Navy (mørkeblå)", gradFrom: "from-slate-950", gradVia: "via-blue-950", gradTo: "to-indigo-950", ring: "focus:ring-sky-300" },
  { key: "ocean", name: "Ocean", gradFrom: "from-slate-950", gradVia: "via-sky-950", gradTo: "to-emerald-950", ring: "focus:ring-cyan-300" },
  { key: "violet", name: "Violet", gradFrom: "from-slate-950", gradVia: "via-indigo-950", gradTo: "to-fuchsia-950", ring: "focus:ring-fuchsia-300" },
];

const ARCADE_DIFFICULTIES = [
  { key: "let", name: "Let", desc: "Super nemt. Confidence boost." },
  { key: "nem", name: "Nem", desc: "Stadig nemt, men lidt mere." },
  { key: "svær", name: "Svær", desc: "Hurtigt, men kræver fokus." },
];

export default function ProfileTab({ state, setState, theme, avatarShapeClass }) {
  const profile = state.profile;

  function setProfile(nextPartial) {
    setState((s) => ({ ...s, profile: { ...s.profile, ...nextPartial } }));
  }

  function dayKeyLocal() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function resetAll() {
    const dk = dayKeyLocal();
    setState({
      profile: { name: "", grade: 5, dailyGoal: 10, themeKey: "navy", avatarKey: "dot", arcadeDifficulty: "let" },
      game: { level: 1, xp: 0, points: 0, streak: 0, correct: 0, wrong: 0, allowedTopics: [], achievements: [] },
      meta: {
        dayKey: dk,
        correctToday: 0,
        daily: null,
        dailyStreak: 0,
        dailyLastDoneDayKey: null,
        maxStreak: 0,
        dailyCountedInGoalDayKey: null,
      },
      arcade: { bestScore: 0, lastScore: 0, meteorBest: 0 },
      ui: { tab: "tasks", arcadeGameKey: null },
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel className="lg:col-span-1">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-extrabold text-white">Profil</div>
          <Chip className="text-xs">Gemmes</Chip>
        </div>

        <div className="mt-3">
          <AvatarPreview
            name={profile.name}
            avatarKey={profile.avatarKey}
            theme={theme}
            shapeClass={avatarShapeClass(profile.avatarKey)}
          />
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-white/80">Navn</label>
<input

  value={state.profile.name ?? ""}
  onChange={(e) =>
    setState((s) => ({
      ...s,
      profile: {
        ...s.profile,
        name: e.target.value,
      },
    }))
  }
  className="mt-1 w-full rounded-2xl border border-white/10 px-4 py-3 bg-slate-950/40 text-white"
  placeholder="Skriv dit navn"
/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-white/80">Klassetrin</label>
              <select
                value={profile.grade}
                onChange={(e) => setProfile({ grade: Number(e.target.value) })}
                className="mt-1 w-full rounded-2xl border border-white/10 px-4 py-3 bg-slate-950/40 shadow-sm text-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                  <option key={g} value={g}>
                    {g}.
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-white/80">Dagens mål</label>
              <select
                value={profile.dailyGoal}
                onChange={(e) => setProfile({ dailyGoal: Number(e.target.value) })}
                className="mt-1 w-full rounded-2xl border border-white/10 px-4 py-3 bg-slate-950/40 shadow-sm text-white"
              >
                {[5, 10, 15, 20, 30].map((n) => (
                  <option key={n} value={n}>
                    {n} opgaver
                  </option>
                ))}
              </select>
              <div className="mt-1 text-xs text-white/60">Daily challenge tæller også som 1 opgave.</div>
            </div>
          </div>

          <details className="mt-2">
            <summary className="cursor-pointer select-none rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold hover:bg-white/15 transition text-white">
              Tema
            </summary>
            <div className="mt-3 grid gap-2">
              {THEMES.map((t) => (
                <ThemeButton key={t.key} theme={t} active={profile.themeKey === t.key} onClick={() => setProfile({ themeKey: t.key })} />
              ))}
            </div>
          </details>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <div className="text-xs text-white/70">Arcade sværhedsgrad</div>
            <div className="font-extrabold mt-1">{ARCADE_DIFFICULTIES.find((d) => d.key === (profile.arcadeDifficulty || "let"))?.name}</div>
            <div className="text-xs text-white/60 mt-1">Du kan ændre den i Arcade-tab.</div>
          </div>

          <button
            onClick={resetAll}
            className="w-full rounded-2xl px-4 py-3 font-bold border border-white/10 bg-white/10 hover:bg-white/15 active:scale-[0.98] transition shadow-sm text-white"
          >
            Nulstil alt
          </button>
        </div>
      </Panel>

      <Panel className="lg:col-span-2">
        <div className="text-lg font-extrabold text-white">Info</div>
        <div className="mt-2 text-white/80">Træning bruger “progression” (sværere over tid). Arcade er mini-games med hurtige opgaver.</div>
      </Panel>
    </div>
  );
}