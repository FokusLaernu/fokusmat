import React, { useMemo } from "react";
import Panel from "../../ui/components/Panel";
import Chip from "../../ui/components/Chip";

export default function BadgesTab({ state, ACH }) {
  const { game, meta, arcade } = state;

  const unlockedAch = useMemo(() => new Set(game.achievements || []), [game.achievements]);
  const dailyStreak = meta?.dailyStreak ?? 0;
  const maxStreak = meta?.maxStreak ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel className="lg:col-span-1">
        <div className="text-lg font-extrabold text-white">Overblik</div>
        <div className="mt-3 grid gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <div className="text-xs text-white/70">Badges</div>
            <div className="text-2xl font-black">
              {unlockedAch.size}/{ACH.length}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <div className="text-xs text-white/70">Points</div>
            <div className="text-2xl font-black">{game.points}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <div className="text-xs text-white/70">Daily streak</div>
            <div className="text-2xl font-black">{dailyStreak} 🔥</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <div className="text-xs text-white/70">Højeste streak</div>
            <div className="text-2xl font-black">{maxStreak}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <div className="text-xs text-white/70">Arcade Horse best</div>
            <div className="text-2xl font-black">{arcade?.bestScore ?? 0}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <div className="text-xs text-white/70">Arcade Meteor best</div>
            <div className="text-2xl font-black">{arcade?.meteorBest ?? 0}</div>
          </div>
        </div>
      </Panel>

      <Panel className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <div className="text-lg font-extrabold text-white">Badges</div>
          <Chip className="text-xs">
            {unlockedAch.size}/{ACH.length}
          </Chip>
        </div>

        <div className="mt-3 grid gap-2">
          {ACH.map((a) => {
            const on = unlockedAch.has(a.id);
            const unlockedCls =
              "bg-emerald-500/10 border-emerald-300/25 shadow-[0_0_0_1px_rgba(16,185,129,0.12),0_18px_60px_rgba(16,185,129,0.10)]";
            const lockedCls = "bg-white/5 border-white/10 opacity-70 grayscale";

            return (
              <div key={a.id} className={"rounded-2xl border px-4 py-3 shadow-sm transition " + (on ? unlockedCls : lockedCls)}>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-extrabold text-white">{a.name}</div>
                  <div className="text-sm">
                    {on ? (
                      <span className="text-emerald-200 font-bold">UNLOCKED</span>
                    ) : (
                      <span className="text-white/60 font-bold">🔒 LOCKED</span>
                    )}
                  </div>
                </div>
                <div className={"text-sm mt-1 " + (on ? "text-emerald-100/90" : "text-white/70")}>{a.desc}</div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}