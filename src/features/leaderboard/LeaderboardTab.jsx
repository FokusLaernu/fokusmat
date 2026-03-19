import React, { useEffect, useState } from "react";
import Panel from "../../ui/components/Panel";
import Chip from "../../ui/components/Chip";
import { supabase } from "../../lib/supabase";

function LeaderboardSection({ title, rows, valueKey, valueLabel }) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-2">
        <div className="text-lg font-extrabold text-white">{title}</div>
        <Chip>{rows.length} spillere</Chip>
      </div>

      <div className="mt-4 grid gap-2">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white/70">
            Ingen data endnu.
          </div>
        ) : (
          rows.map((row, index) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 font-black text-white">
                  {index + 1}
                </div>
                <div>
                  <div className="font-extrabold text-white">
                    {row.name?.trim() || "Spiller"}
                  </div>
                  <div className="text-xs text-white/60">
                    Level {row.level ?? 1} • Grade {row.grade ?? 5}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-white/60">{valueLabel}</div>
                <div className="text-xl font-black text-white">
                  {row[valueKey] ?? 0}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

export default function LeaderboardTab() {
  const [loading, setLoading] = useState(true);
  const [topPoints, setTopPoints] = useState([]);
  const [topMeteor, setTopMeteor] = useState([]);
  const [topLevel, setTopLevel] = useState([]);

  useEffect(() => {
    async function loadLeaderboards() {
      try {
        setLoading(true);

        const [{ data: pointsData, error: pointsError }, { data: meteorData, error: meteorError }, { data: levelData, error: levelError }] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("id, name, grade, level, points, meteor_best")
              .order("points", { ascending: false })
              .limit(10),

            supabase
              .from("profiles")
              .select("id, name, grade, level, points, meteor_best")
              .order("meteor_best", { ascending: false })
              .limit(10),

            supabase
              .from("profiles")
              .select("id, name, grade, level, points, meteor_best")
              .order("level", { ascending: false })
              .order("xp", { ascending: false })
              .limit(10),
          ]);

        if (pointsError) throw pointsError;
        if (meteorError) throw meteorError;
        if (levelError) throw levelError;

        setTopPoints(pointsData ?? []);
        setTopMeteor(meteorData ?? []);
        setTopLevel(levelData ?? []);
      } catch (err) {
        console.error("Kunne ikke hente leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboards();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4">
        <Panel>
          <div className="text-lg font-extrabold text-white">Leaderboard</div>
          <div className="mt-3 text-white/70">Loader leaderboard...</div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <LeaderboardSection
        title="Top points"
        rows={topPoints}
        valueKey="points"
        valueLabel="Points"
      />

      <LeaderboardSection
        title="Top meteor score"
        rows={topMeteor}
        valueKey="meteor_best"
        valueLabel="Meteor"
      />

      <LeaderboardSection
        title="Top level"
        rows={topLevel}
        valueKey="level"
        valueLabel="Level"
      />
    </div>
  );
}