import { dayKeyLocal } from "../lib/date";

export function makeDefaultState() {
  const dk = dayKeyLocal();
  return {
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
  };
}