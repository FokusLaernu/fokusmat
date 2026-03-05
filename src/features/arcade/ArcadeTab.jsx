import React from "react";
import Panel from "../../ui/components/Panel";
import Chip from "../../ui/components/Chip";
import SmallBtn from "../../ui/components/SmallBtn";
import MiniGameCard from "../../ui/components/MiniGameCard";

export default function ArcadeTab({
  // state/data
  ui,
  profile,
  game,
  arcade,
  chosenTopicsText,

  // constants
  ARCADE_DIFFICULTIES,
  MINI_GAMES,

  // theme
  themeRing,

  // setters/handlers
  setProfile,
  setArcadeGameKey,

  // meteor (component + handler)
  MeteorMathGameComp,
  onMeteorBestScore,

  // horse-race (state + handlers + component)
  arcadeScore,
  arcadeRunning,
  arcadeMsg,
  startArcade,
  stopArcade,
  resetHorseRace,
  arcadeProblem,
  arcadeInput,
  setArcadeInput,
  checkArcade,
  ArcadeHorseRaceCanvasComp,
  arcadeHorsesForCanvas,
  PLAYER_INDEX,
  finishLine,
}) {
  return (
    <div className="grid gap-4">
      {/* Global Arcade settings */}
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Chip>Arcade</Chip>
            <Chip>Emner: {chosenTopicsText}</Chip>
            <Chip>Klassetrin {profile.grade}.</Chip>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <div className="text-xs text-white/70">Sværhedsgrad (Arcade)</div>
            <select
              value={profile.arcadeDifficulty || "let"}
              onChange={(e) => setProfile({ arcadeDifficulty: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-white/10 px-4 py-2 bg-slate-950/40 shadow-sm text-white"
            >
              {ARCADE_DIFFICULTIES.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.name}
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-white/60">
              {ARCADE_DIFFICULTIES.find((d) => d.key === (profile.arcadeDifficulty || "let"))?.desc}
            </div>
          </div>
        </div>
        <div className="mt-2 text-[11px] text-white/55">Tip: “Let” er perfekt til flow. “Svær” er stadig hurtig, men kræver fokus.</div>
      </Panel>

      {/* Menu eller game */}
      {ui.arcadeGameKey == null && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel className="lg:col-span-1">
            <div className="text-lg font-extrabold">Mini-games</div>
            <div className="mt-2 text-sm text-white/70">Klik et spil for at starte.</div>
            <div className="mt-4 grid gap-2">
              {MINI_GAMES.map((g) => (
                <MiniGameCard
                  key={g.key}
                  active={false}
                  title={g.name}
                  desc={g.desc}
                  badge={g.badge}
                  onClick={() => setArcadeGameKey(g.key)}
                />
              ))}
            </div>
          </Panel>

          <Panel className="lg:col-span-2">
            <div className="text-lg font-extrabold">Arcade stats</div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <div className="text-xs text-white/70">Heste-løb best</div>
                <div className="text-2xl font-black">{arcade?.bestScore ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <div className="text-xs text-white/70">Meteor Math best</div>
                <div className="text-2xl font-black">{arcade?.meteorBest ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <div className="text-xs text-white/70">Sidste Horse score</div>
                <div className="text-2xl font-black">{arcade?.lastScore ?? 0}</div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-white/10 p-5">
              <div className="font-extrabold">Hvad er nyt?</div>
              <div className="mt-2 text-white/80">Du har nu en mini-game menu i Arcade. Meteor Math er første spil — vi kan bygge flere bagefter.</div>
              <div className="mt-2 text-xs text-white/60">Hvis du vil: næste skridt kan være power-ups, combo meter, eller “boss meteor”.</div>
            </div>
          </Panel>
        </div>
      )}

      {ui.arcadeGameKey === "meteor" && (
        <MeteorMathGameComp
          grade={profile.grade}
          allowedTopics={game.allowedTopics}
          arcadeDifficultyKey={profile.arcadeDifficulty || "let"}
          themeRing={themeRing}
          bestScore={arcade?.meteorBest ?? 0}
          onBestScore={onMeteorBestScore}
          onBack={() => setArcadeGameKey(null)}
        />
      )}

      {ui.arcadeGameKey === "horse" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel className="lg:col-span-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-lg font-extrabold">Heste-løb</div>
              <SmallBtn onClick={() => setArcadeGameKey(null)}>Til menu</SmallBtn>
            </div>

            <div className="mt-3 grid gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <div className="text-xs text-white/70">Score</div>
                <div className="text-2xl font-black">{arcadeScore}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <div className="text-xs text-white/70">Bedste score</div>
                <div className="text-2xl font-black">{arcade?.bestScore ?? 0}</div>
              </div>

              {!arcadeRunning ? (
                <button
                  onClick={startArcade}
                  className="w-full rounded-2xl px-4 py-3 font-extrabold text-white shadow-lg bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-600 hover:opacity-95 active:scale-[0.98] transition"
                >
                  Start race
                </button>
              ) : (
                <button
                  onClick={stopArcade}
                  className="w-full rounded-2xl px-4 py-3 font-extrabold text-white shadow-lg bg-white/10 border border-white/10 hover:bg-white/15 active:scale-[0.98] transition"
                >
                  Stop
                </button>
              )}

              {arcadeMsg && (
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white/85 fadeUp">
                  <div className="font-extrabold">Status</div>
                  <div className="text-sm text-white/75 mt-1">{arcadeMsg}</div>
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-white/60">Division i Horse-Arcade er altid “pæn” (heltal). Ingen 342÷19 😄</div>
          </Panel>

          <Panel className="lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2 items-center">
                <Chip>Race</Chip>
                <Chip>Klassetrin {profile.grade}.</Chip>
                <Chip>Arcade: {ARCADE_DIFFICULTIES.find((d) => d.key === (profile.arcadeDifficulty || "let"))?.name}</Chip>
                <Chip>Emner: {chosenTopicsText}</Chip>
              </div>
              <div className="flex gap-2">
                <SmallBtn
                  onClick={resetHorseRace}
                  disabled={arcadeRunning}
                  title={arcadeRunning ? "Stop først, før du resetter" : "Reset"}
                >
                  Reset
                </SmallBtn>
              </div>
            </div>

            <div className="mt-4">
              <ArcadeHorseRaceCanvasComp horses={arcadeHorsesForCanvas} playerIndex={PLAYER_INDEX} finishLine={finishLine} />
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-white/10 p-5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div className="text-xs text-white/70">Opgave (hurtig)</div>
                  <div className="font-extrabold text-lg">{arcadeProblem.prompt}</div>
                </div>
                <div className="text-xs text-white/60">{arcadeRunning ? "Skriv svar → Enter" : "Tryk Start race"}</div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] items-end">
                <div>
                  <label className="text-sm text-white/80">Dit svar {arcadeProblem.unit ? `(${arcadeProblem.unit})` : ""}</label>
                  <input
                    value={arcadeInput}
                    onChange={(e) => setArcadeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && checkArcade()}
                    placeholder={arcadeRunning ? "Skriv tal og tryk Enter" : "Start race først"}
                    disabled={!arcadeRunning}
                    className={"mt-1 w-full rounded-2xl border border-white/10 px-4 py-3 text-lg bg-slate-950/40 shadow-sm focus:outline-none focus:ring-2 text-white disabled:opacity-60 " + themeRing}
                  />
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <SmallBtn onClick={() => setArcadeInput("")} disabled={!arcadeRunning}>
                      Ryd
                    </SmallBtn>
                    <SmallBtn onClick={() => {}} disabled={!arcadeRunning}>
                      Skjul status
                    </SmallBtn>
                  </div>
                </div>

                <button
                  onClick={checkArcade}
                  disabled={!arcadeRunning}
                  className="rounded-2xl px-6 py-3 text-lg font-extrabold text-white shadow-lg bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:opacity-95 hover:scale-[1.01] active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  BOOST!
                </button>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}