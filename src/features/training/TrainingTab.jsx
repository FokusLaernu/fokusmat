import React from "react";
import Panel from "../../ui/components/Panel";
import FirePanel from "../../ui/components/FirePanel";
import Chip from "../../ui/components/Chip";
import SmallBtn from "../../ui/components/SmallBtn";
import DayDot from "../../ui/components/DayDot";

export default function TrainingTab({
  // data
  theme,
  TOPICS,
  profile,
  game,
  meta,

  // training UI/state
  problem,
  input,
  setInput,
  feedback,
  showHint,
  setShowHint,
  showSteps,
  setShowSteps,
  shake,
  fadeProblem,
  pop,

  // handlers
  check,
  nextProblem,
  toggleTopic,
  setAllowedTopics,
  setTab,

  // daily UI/state
  daily,
  dailyProblem,
  dailyInput,
  setDailyInput,
  dailyFeedback,
  checkDaily,

  // streak UI
  dk,
  dailyStreak,
  weekKeysForward,
  isKeyInStreak,

  // overview
  maxStreak,
  chosenTopicsText,
  goal,
}) {
  const done = Math.min(Math.max(meta?.correctToday ?? 0, 0), goal || 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* LEFT */}
      <div className="lg:col-span-1 grid gap-4">
        <FirePanel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white/85">Daily Challenge</div>
              <div className="text-2xl font-black">🔥 Klar den hver dag</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/75">Streak</div>
              <div className="font-black text-white text-xl">{dailyStreak} 🔥</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs text-white/75 mb-2">7 dage (Dag 1 starter når streaken starter)</div>
            <div className="flex gap-2 flex-wrap">
              {weekKeysForward.map((k, idx) => {
                const isToday = k === dk;
                const filled = isKeyInStreak(k);
                return <DayDot key={k} label={String(idx + 1)} filled={filled} isToday={isToday} />;
              })}
            </div>
            <div className="mt-2 text-[11px] text-white/60">
              {daily?.done ? "✅ Daily klaret i dag." : "➡️ Klar daily for at fylde Dag " + (dailyStreak > 0 ? String(dailyStreak + 1) : "1")}
            </div>
          </div>

          {!dailyProblem ? (
            <div className="mt-3 text-white/80">Laver dagens opgave…</div>
          ) : daily?.done ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-4">
              <div className="font-extrabold">Klaret i dag!</div>
              <div className="text-sm text-white/70">Kom igen i morgen for at holde streaken i live 🔥</div>
            </div>
          ) : (
            <>
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="text-xs text-white/70">Bonus-opgave (lidt hårdere)</div>
                <div className="font-extrabold">Level {dailyProblem.level}</div>
                <div className="mt-2 text-white">{dailyProblem.prompt}</div>
              </div>

              <div className="mt-3">
                <label className="text-sm text-white/80">Dit svar {dailyProblem.unit ? `(${dailyProblem.unit})` : ""}</label>
                <input
                  value={dailyInput}
                  onChange={(e) => setDailyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkDaily()}
                  placeholder="Skriv et tal"
                  className="mt-1 w-full rounded-2xl border border-white/10 px-4 py-3 text-lg bg-slate-950/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-white"
                />
                <button
                  onClick={checkDaily}
                  className="mt-3 w-full rounded-2xl px-4 py-3 font-extrabold text-white shadow-lg bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:opacity-95 active:scale-[0.98] transition"
                >
                  Tjek Daily 🔥
                </button>

                {dailyFeedback && (
                  <div
                    className={
                      "mt-3 rounded-2xl p-4 border shadow-sm fadeUp " +
                      (dailyFeedback.type === "ok" ? "bg-emerald-500/10 border-emerald-300/20" : "bg-rose-500/10 border-rose-300/20")
                    }
                  >
                    <div className="font-extrabold">{dailyFeedback.type === "ok" ? "Yes!" : "Næsten"}</div>
                    <div className="text-white/80">{dailyFeedback.msg}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </FirePanel>

        <Panel>
          <div className="text-lg font-extrabold text-white">Overblik</div>
          <div className="mt-3 grid gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <div className="text-xs text-white/70">Streak</div>
              <div className="text-2xl font-black">{game.streak}</div>
              <div className="text-xs text-white/60">Nulstilles ved forkert svar</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <div className="text-xs text-white/70">Højeste streak</div>
              <div className="text-2xl font-black">{maxStreak}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <div className="text-xs text-white/70">Emner</div>
              <div className="font-extrabold">{chosenTopicsText}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <div className="text-xs text-white/70">Dagens mål</div>
              <div className="font-extrabold">
                {done}/{goal}
              </div>
            </div>

            <SmallBtn onClick={() => setTab("arcade")} className="w-full">
              Prøv Arcade (mini-games)
            </SmallBtn>
          </div>
        </Panel>
      </div>

      {/* RIGHT */}
      <Panel className="lg:col-span-2">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Chip>Træningsopgave</Chip>
            <Chip>Level {problem.level}</Chip>
            <Chip>Klassetrin {profile.grade}.</Chip>
          </div>
          <div className="flex gap-2">
            <SmallBtn onClick={nextProblem} title="Spring til ny opgave">
              Ny opgave
            </SmallBtn>
          </div>
        </div>

        <div className={"mt-4 " + (shake ? "shake" : "") + " " + (fadeProblem ? "fadeSwap" : "")}>
          <div className="text-lg font-extrabold text-white">Opgave</div>
          <p className="mt-2 text-white/85 leading-relaxed">{problem.prompt}</p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] items-end">
          <div>
            <label className="text-sm text-white/80">Dit svar {problem.unit ? `(${problem.unit})` : ""}</label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && check()}
              placeholder="Skriv et tal (fx 12,5)"
              className={"mt-1 w-full rounded-2xl border border-white/10 px-4 py-3 text-lg bg-slate-950/40 shadow-sm focus:outline-none focus:ring-2 text-white " + theme.ring}
            />

            <div className="mt-2 flex gap-2 flex-wrap">
              <SmallBtn onClick={() => setShowHint((v) => !v)}>{showHint ? "Skjul hint" : "Vis hint"}</SmallBtn>
              <SmallBtn onClick={() => setInput("")}>Ryd</SmallBtn>
            </div>

            {showHint && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 p-4 fadeUp">
                <div className="text-sm font-extrabold text-white">Hint</div>
                <div className="text-white/80">{problem.hint}</div>
              </div>
            )}
          </div>

          <button
            onClick={check}
            className={
              "rounded-2xl px-6 py-3 text-lg font-extrabold text-white shadow-lg " +
              "bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-600 " +
              "hover:opacity-95 hover:scale-[1.01] active:scale-[0.98] transition " +
              (pop ? "pop" : "")
            }
          >
            Tjek svar
          </button>
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer select-none rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-extrabold hover:bg-white/15 transition text-white">
            Emner (skift her)
          </summary>

          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 hover:bg-white/15 transition text-white">
              <input type="checkbox" checked={(game.allowedTopics?.length || 0) === 0} onChange={() => setAllowedTopics([])} />
              <span className="font-semibold">Blandet (alle emner)</span>
            </label>

            {TOPICS.map((t) => (
              <label key={t.key} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 hover:bg-white/15 transition text-white">
                <input type="checkbox" checked={(game.allowedTopics || []).includes(t.key)} onChange={() => toggleTopic(t.key)} />
                <span className="font-semibold">{t.label}</span>
              </label>
            ))}
            <div className="text-xs text-white/60">Tip: Vælger du emner, får du kun dem. “Blandet” = alt.</div>
          </div>
        </details>

        {feedback && (
          <div
            className={
              "mt-4 rounded-3xl p-5 border shadow-sm fadeUp " +
              (feedback.type === "ok" ? "bg-emerald-500/10 border-emerald-300/20" : "bg-rose-500/10 border-rose-300/20")
            }
          >
            <div className="font-extrabold text-lg">{feedback.type === "ok" ? "Godt!" : "Prøv igen"}</div>
            <div className="mt-1 text-white/85">{feedback.msg}</div>

            {feedback.type === "bad" && problem.steps?.length > 0 && (
              <div className="mt-3">
                <SmallBtn onClick={() => setShowSteps((v) => !v)}>{showSteps ? "Skjul forklaring" : "Vis forklaring"}</SmallBtn>
                {showSteps && (
                  <ol className="mt-3 list-decimal pl-5 space-y-1 text-white/85">
                    {problem.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}