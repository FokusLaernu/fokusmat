import React, { useEffect, useMemo, useRef, useState } from "react";
import Panel from "../../ui/components/Panel";
import Chip from "../../ui/components/Chip";
import SmallBtn from "../../ui/components/SmallBtn";

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function uid() {
  return `meteor_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function makeWrongAnswer(correct, spread = 12) {
  let tries = 0;
  while (tries < 100) {
    tries++;
    const delta = randInt(-spread, spread);
    const candidate = Number(correct) + delta;
    if (!Number.isFinite(candidate)) continue;
    if (candidate === Number(correct)) continue;
    if (candidate < 0 && Number(correct) >= 0) continue;
    return candidate;
  }
  return Number(correct) + 1;
}

function makeThreeOptions(correct, heat) {
  const spread = heat <= 1 ? 8 : heat === 2 ? 14 : heat === 3 ? 20 : 28;
  const a = makeWrongAnswer(correct, spread);
  let b = makeWrongAnswer(correct, spread);
  while (b === a) b = makeWrongAnswer(correct, spread + 3);

  return [Number(correct), a, b].sort(() => Math.random() - 0.5);
}

function getHeatConfig(heat) {
  if (heat <= 1) {
    return {
      meteorFallMs: 6800,
      laserMs: 420,
      label: "Heat 1",
      desc: "Rolig start",
      warning: false,
    };
  }
  if (heat === 2) {
    return {
      meteorFallMs: 5200,
      laserMs: 360,
      label: "Heat 2",
      desc: "Mere pres",
      warning: true,
    };
  }
  if (heat === 3) {
    return {
      meteorFallMs: 3900,
      laserMs: 300,
      label: "Heat 3",
      desc: "Nu går det stærkt",
      warning: true,
    };
  }
  return {
    meteorFallMs: 2900,
    laserMs: 240,
    label: `Heat ${heat}`,
    desc: "Maks pres",
    warning: true,
  };
}

function makeMeteorProblem(makeArcadeProblem, grade, allowedTopics, arcadeDifficultyKey, heat) {
  const base = makeArcadeProblem(grade, allowedTopics, arcadeDifficultyKey);

  if (heat <= 1) return base;

  if (heat === 2) {
    return makeArcadeProblem(grade + 1, allowedTopics, arcadeDifficultyKey);
  }

  if (heat === 3) {
    return makeArcadeProblem(grade + 2, allowedTopics, "svær");
  }

  return makeArcadeProblem(grade + 3, allowedTopics, "svær");
}

function MilitaryBase({ isHit }) {
  return (
    <div className="relative mx-auto w-full max-w-[360px]">
<div className={"relative h-28 w-full transition-transform duration-300 " + (isHit ? "scale-[0.96] translate-y-[2px]" : "")}>
        <div className="absolute bottom-0 left-0 right-0 h-8 rounded-[28px] bg-gradient-to-b from-slate-700 to-slate-900 border border-white/10 shadow-2xl" />
        <div className="absolute bottom-6 left-[8%] h-10 w-[26%] rounded-t-2xl bg-gradient-to-b from-emerald-700 to-emerald-950 border border-white/10" />
        <div className="absolute bottom-6 right-[8%] h-10 w-[26%] rounded-t-2xl bg-gradient-to-b from-emerald-700 to-emerald-950 border border-white/10" />
        <div className="absolute bottom-6 left-1/2 h-14 w-[36%] -translate-x-1/2 rounded-t-3xl bg-gradient-to-b from-emerald-600 to-emerald-900 border border-white/10 shadow-lg" />
        <div className="absolute bottom-14 left-1/2 h-7 w-7 -translate-x-1/2 rounded-full bg-slate-800 border border-white/10" />
        <div className="absolute bottom-[78px] left-1/2 h-10 w-2 -translate-x-1/2 rounded-full bg-slate-300" />
        <div className="absolute bottom-[86px] left-1/2 h-3 w-12 -translate-x-1/2 rounded-full bg-slate-400 shadow-md" />
        <div className="absolute bottom-3 left-[16%] h-2 w-12 rounded-full bg-emerald-300/30" />
        <div className="absolute bottom-3 right-[16%] h-2 w-12 rounded-full bg-emerald-300/30" />
      </div>
    </div>
  );
}

function MeteorSprite({ progress, problemText, heat, isExploding, hasImpacted }) {
  const impactProgress = 0.68;
  const cappedProgress = hasImpacted ? impactProgress : Math.min(progress, impactProgress);

  // Fast banehøjde så vi animerer med transform i stedet for top
  const travelPx = 730;
  const y = cappedProgress * travelPx;
  const wobble = Math.sin(progress * 3.2) * 1.2;

const tailLen = heat <= 1 ? 140 : heat === 2 ? 180 : heat === 3 ? 220 : 260;

  return (
    <div
      className="absolute left-1/2 top-[-180px] z-20"
      style={{
        transform: `translate(-50%, ${y}px) translateX(${wobble}px)`,
        willChange: "transform",
      }}
    >
      <div className="relative flex flex-col items-center">
<div
  className="absolute left-1/2 -translate-x-1/2 opacity-95"
 style={{
  width: 34,
  height: tailLen,
  top: -tailLen + 18,
  background:
    "linear-gradient(to top, rgba(255,160,40,0), rgba(255,120,20,0.78), rgba(255,245,190,1))",
  filter: "blur(2px)",
  borderRadius: "999px",
  boxShadow: "0 0 22px rgba(255,160,60,0.55)",
}}
        />

        <div
          className="absolute left-1/2 -translate-x-1/2 opacity-55"
style={{
  width: 130,
  height: tailLen + 90,
  top: -tailLen + 2,
  background:
    "linear-gradient(to top, rgba(255,90,20,0), rgba(255,120,0,0.16), rgba(255,225,140,0.34))",
  filter: "blur(14px)",
  borderRadius: "999px",
}}
        />

        <div
          className="absolute left-1/2 -translate-x-1/2 opacity-30"
          style={{
            width: 110,
height: tailLen + 70,
            top: -tailLen + 8,
            background:
              "linear-gradient(to top, rgba(255,90,20,0), rgba(255,120,0,0.12), rgba(255,225,140,0.28))",
            filter: "blur(10px)",
            borderRadius: "999px",
          }}
        />

        <div
          className={
            "relative h-[176px] w-[176px] rounded-full border shadow-2xl transition-transform duration-150 " +
            (isExploding
              ? "border-yellow-200/40 bg-gradient-to-br from-yellow-200 via-orange-300 to-red-500 scale-110 opacity-85"
              : "border-white/10 bg-gradient-to-br from-stone-500 via-orange-700 to-stone-950")
          }
          style={{ willChange: "transform" }}
        >
          <div className="absolute left-[20%] top-[22%] h-4 w-4 rounded-full bg-black/20" />
          <div className="absolute right-[24%] top-[28%] h-3 w-3 rounded-full bg-white/12" />
          <div className="absolute left-[34%] bottom-[24%] h-4 w-4 rounded-full bg-black/18" />
          <div className="absolute right-[28%] bottom-[22%] h-5 w-5 rounded-full bg-black/15" />
          <div className="absolute left-[50%] top-[14%] h-3 w-3 rounded-full bg-white/10" />

          <div className="absolute inset-0 flex items-center justify-center px-5 text-center">
            <div className="text-lg font-black leading-snug text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.28)]">
              {problemText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeteorTab({
  grade,
  allowedTopics,
  arcadeDifficultyKey,
  themeRing,
  bestScore,
  onBestScore,
  onBack,
  makeArcadeProblem,
  ARCADE_DIFFICULTIES,
}) {
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [heat, setHeat] = useState(1);
  const [heatBanner, setHeatBanner] = useState("Heat 1");
  const [heatBannerVisible, setHeatBannerVisible] = useState(false);

  const [problem, setProblem] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [buttonState, setButtonState] = useState(null); // "correct" | "wrong" | null
const [laserVisible, setLaserVisible] = useState(false);
const [meteorExploding, setMeteorExploding] = useState(false);
const [meteorImpacted, setMeteorImpacted] = useState(false);
const [baseHit, setBaseHit] = useState(false);
  const [status, setStatus] = useState("Tryk start for at forsvare basen.");
  const [meteorProgress, setMeteorProgress] = useState(0);

  const animRef = useRef(null);
  const startTimeRef = useRef(0);
  const durationRef = useRef(getHeatConfig(1).meteorFallMs);
  const endedRef = useRef(false);

  const heatCfg = useMemo(() => getHeatConfig(heat), [heat]);

  function stopAnim() {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }

  function showHeatBanner(nextHeat) {
    setHeatBanner(`Heat ${nextHeat}`);
    setHeatBannerVisible(true);
    setTimeout(() => setHeatBannerVisible(false), 1300);
  }

  function computeHeat(nextScore) {
    if (nextScore >= 18) return 4;
    if (nextScore >= 10) return 3;
    if (nextScore >= 4) return 2;
    return 1;
  }

  function makeRound(nextHeat = heat) {
    const p = makeMeteorProblem(makeArcadeProblem, grade, allowedTopics, arcadeDifficultyKey, nextHeat);
    setProblem(p);
    setOptions(makeThreeOptions(p.answer, nextHeat));
setSelectedIndex(null);
setButtonState(null);
setLaserVisible(false);
setMeteorExploding(false);
setMeteorImpacted(false);
setBaseHit(false);
setMeteorProgress(0);
    durationRef.current = getHeatConfig(nextHeat).meteorFallMs;
    endedRef.current = false;
  }

  function finishGame(finalScore = score) {
    stopAnim();
    setRunning(false);
    setLaserVisible(false);
    if (typeof onBestScore === "function") onBestScore(finalScore);
    setStatus(`Game over. Score: ${finalScore}`);
  }

  function loseLifeAndContinue() {
    setLives((prev) => {
      const next = prev - 1;
      if (next <= 0) {
        setTimeout(() => finishGame(score), 300);
        return 0;
      }
      return next;
    });
  }

function startMeteorDrop() {
  stopAnim();
  startTimeRef.current = performance.now();
  endedRef.current = false;

const impactProgress = 0.68;
const duration = durationRef.current;

const tick = (now) => {
  if (endedRef.current) return;

  const elapsed = now - startTimeRef.current;
  const linear = clamp(elapsed / duration, 0, 1);

  // Konstant, smooth bevægelse uden slowdown ved impact
  const pct = linear * impactProgress;

    setMeteorProgress(pct);

    if (pct >= impactProgress - 0.002) {
      endedRef.current = true;
      stopAnim();

      setMeteorProgress(impactProgress);
      setMeteorImpacted(true);
      setMeteorExploding(true);
      setBaseHit(true);
      setStatus("Meteoren ramte basen!");

      setLives((prev) => {
        const next = prev - 1;

        setTimeout(() => {
          if (next <= 0) {
            finishGame(score);
          } else {
            setMeteorExploding(false);
            setMeteorImpacted(false);
            setBaseHit(false);
            makeRound(heat);
            setTimeout(() => startMeteorDrop(), 120);
          }
        }, 800);

        return next;
      });

      return;
    }

    animRef.current = requestAnimationFrame(tick);
  };

  animRef.current = requestAnimationFrame(tick);
}

  function startGame() {
    stopAnim();
    setScore(0);
    setLives(3);
    setHeat(1);
    setStatus("Heat 1 startet.");
    setRunning(true);
    makeRound(1);
    setTimeout(() => startMeteorDrop(), 50);
  }

function handleAnswer(idx) {
  if (!running || !problem) return;

  const picked = Number(options[idx]);
  const correct = Number(problem.answer);

  // Hvis meteoren allerede er ramt korrekt eller eksploderer, så stop
  if (meteorExploding || laserVisible) return;

  setSelectedIndex(idx);

  if (picked === correct) {
    endedRef.current = true;
    stopAnim();

    setButtonState("correct");
    setLaserVisible(true);
    setMeteorExploding(true);
    setStatus("Direkte hit!");

    const nextScore = score + 1;
    const nextHeat = computeHeat(nextScore);
    const heatChanged = nextHeat !== heat;

    setTimeout(() => {
      setScore(nextScore);
      setLaserVisible(false);
      setMeteorExploding(false);
      setMeteorImpacted(false);
      setBaseHit(false);
      setSelectedIndex(null);
      setButtonState(null);

      if (heatChanged) {
        setHeat(nextHeat);
        showHeatBanner(nextHeat);
        setStatus(`${getHeatConfig(nextHeat).label} — ${getHeatConfig(nextHeat).desc}`);
        makeRound(nextHeat);
        setTimeout(() => startMeteorDrop(), 120);
      } else {
        makeRound(heat);
        setTimeout(() => startMeteorDrop(), 120);
      }
    }, heatCfg.laserMs);

    return;
  }

  // Forkert svar = 1 liv, men samme meteor fortsætter
  setButtonState("wrong");
  setStatus("Forkert — du mister 1 liv, men meteoren falder videre.");
  setBaseHit(true);

  setLives((prev) => {
    const next = prev - 1;
    if (next <= 0) {
      setTimeout(() => finishGame(score), 350);
      return 0;
    }
    return next;
  });

  setTimeout(() => {
    setBaseHit(false);
    setSelectedIndex(null);
    setButtonState(null);
  }, 450);
}


  useEffect(() => {
    return () => stopAnim();
  }, []);

  useEffect(() => {
    if (!problem && running) {
      makeRound(heat);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, running]);

  const difficultyLabel =
    ARCADE_DIFFICULTIES.find((d) => d.key === arcadeDifficultyKey)?.name || "Arcade";
const currentImpactProgress = 0.62;
const laserHeight = Math.max(
 240,
  430 - (Math.min(meteorProgress, currentImpactProgress) / currentImpactProgress) * 170
);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel className="lg:col-span-1">
        <div className="flex items-center justify-between gap-2">
          <div className="text-lg font-extrabold">Meteor Math</div>
          <SmallBtn onClick={onBack}>Til menu</SmallBtn>
        </div>

        <div className="mt-3 grid gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <div className="text-xs text-white/70">Score</div>
            <div className="text-2xl font-black">{score}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <div className="text-xs text-white/70">Liv</div>
            <div className="text-2xl font-black">{Array.from({ length: lives }, () => "❤️").join(" ") || "—"}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <div className="text-xs text-white/70">Bedste score</div>
            <div className="text-2xl font-black">{bestScore ?? 0}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <div className="text-xs text-white/70">Heat</div>
            <div className="text-2xl font-black">{heat}</div>
            <div className="text-xs text-white/60 mt-1">{heatCfg.desc}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <div className="text-xs text-white/70">Sværhedsgrad</div>
            <div className="font-extrabold mt-1">{difficultyLabel}</div>
          </div>

          {!running ? (
            <button
              onClick={startGame}
              className="w-full rounded-2xl px-4 py-3 font-extrabold text-white shadow-lg bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-600 hover:opacity-95 active:scale-[0.98] transition"
            >
              Start forsvar
            </button>
          ) : (
            <button
              onClick={() => finishGame(score)}
              className="w-full rounded-2xl px-4 py-3 font-extrabold text-white shadow-lg bg-white/10 border border-white/10 hover:bg-white/15 active:scale-[0.98] transition"
            >
              Stop
            </button>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <div className="font-extrabold">Status</div>
            <div className="text-sm text-white/75 mt-1">{status}</div>
          </div>
        </div>
      </Panel>

      <Panel className="lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2 items-center">
            <Chip>Meteor Math</Chip>
            <Chip>Klassetrin {grade}.</Chip>
            <Chip>{difficultyLabel}</Chip>
            <Chip>{heatCfg.label}</Chip>
          </div>
        </div>

        <div
          className="mt-4 relative rounded-3xl border border-white/10 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-black"
          style={{ minHeight: 660 }}
        >
          <div className="absolute inset-0 opacity-40">
            <div className="absolute left-[10%] top-[8%] text-white/70">✦</div>
            <div className="absolute right-[14%] top-[14%] text-white/50">✦</div>
            <div className="absolute left-[22%] top-[20%] text-white/60">✦</div>
            <div className="absolute right-[30%] top-[32%] text-white/40">✦</div>
            <div className="absolute left-[70%] top-[24%] text-white/70">✦</div>
          </div>

          {heatBannerVisible && (
            <div className="absolute left-1/2 top-5 z-40 -translate-x-1/2">
              <div className="rounded-full border border-orange-300/30 bg-orange-500/20 px-5 py-2 text-sm font-black text-orange-100 shadow-xl backdrop-blur">
                {heatBanner} · {heatCfg.desc}
              </div>
            </div>
          )}

{problem && (
  <MeteorSprite
    progress={meteorProgress}
    problemText={problem.prompt}
    heat={heat}
    isExploding={meteorExploding}
    hasImpacted={meteorImpacted}
  />
)}

{laserVisible && (
  <div className="pointer-events-none absolute left-1/2 bottom-[185px] z-40 -translate-x-1/2">
    <div
      className="relative w-3 rounded-full bg-red-500 shadow-[0_0_18px_rgba(255,0,0,0.98)] animate-pulse"
      style={{ height: `${laserHeight}px` }}
    >
      <div className="absolute inset-0 rounded-full bg-red-300/80 blur-[3px]" />
      <div className="absolute left-1/2 top-[-8px] h-16 w-16 -translate-x-1/2 rounded-full bg-yellow-200/75 blur-md" />
      <div className="absolute left-1/2 bottom-[-6px] h-10 w-10 -translate-x-1/2 rounded-full bg-red-300/55 blur-md" />
    </div>
  </div>
)}
{meteorExploding && meteorImpacted && (
  <div className="pointer-events-none absolute left-1/2 bottom-[170px] z-50 -translate-x-1/2">
    <div className="h-56 w-56 rounded-full bg-orange-500/60 blur-md animate-ping" />
    <div className="absolute inset-0 h-56 w-56 rounded-full bg-yellow-300/85 blur-sm" />
    <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 blur-[2px]" />

    <div className="absolute left-[-26px] top-[46px] h-16 w-16 rounded-full bg-orange-300/75 blur-sm" />
    <div className="absolute right-[-22px] top-[28px] h-20 w-20 rounded-full bg-red-400/70 blur-sm" />
    <div className="absolute left-[10px] bottom-[10px] h-14 w-14 rounded-full bg-yellow-200/75 blur-sm" />
    <div className="absolute right-[8px] bottom-[18px] h-12 w-12 rounded-full bg-orange-400/70 blur-sm" />
    <div className="absolute left-[86px] top-[-10px] h-10 w-10 rounded-full bg-white/70 blur-sm" />
  </div>
)}
{meteorExploding && !meteorImpacted && (
  <div className="pointer-events-none absolute left-1/2 bottom-[255px] z-50 -translate-x-1/2">
    <div className="h-24 w-24 rounded-full bg-orange-500/50 blur-md animate-ping" />
    <div className="absolute inset-0 h-24 w-24 rounded-full bg-yellow-300/75 blur-sm" />
    <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85 blur-[2px]" />
  </div>
)}
<div className="absolute left-0 right-0 bottom-[110px] z-20">
  <MilitaryBase isHit={baseHit} />
</div>

<div className="absolute left-0 right-0 bottom-0 z-0 pointer-events-none overflow-hidden">
  <div className="relative h-[190px] w-full">
    <div className="absolute bottom-0 left-0 right-0 h-[120px] bg-gradient-to-b from-emerald-700 via-emerald-900 to-slate-950" />
    <div className="absolute bottom-[88px] left-[-5%] h-10 w-[30%] rounded-full bg-emerald-500/20 blur-md" />
    <div className="absolute bottom-[70px] left-[20%] h-12 w-[24%] rounded-full bg-lime-400/15 blur-md" />
    <div className="absolute bottom-[78px] right-[12%] h-10 w-[28%] rounded-full bg-emerald-400/15 blur-md" />
    <div className="absolute bottom-[58px] right-[-6%] h-12 w-[34%] rounded-full bg-emerald-300/10 blur-md" />
  </div>
</div>

          <div className="absolute left-0 right-0 bottom-0 z-30 border-t border-white/10 bg-slate-950/80 backdrop-blur p-4">
            <div className="grid gap-3 md:grid-cols-3">
              {options.map((opt, idx) => {
                const isSelected = selectedIndex === idx;
                const classes =
                  buttonState === "correct" && isSelected
                    ? "bg-emerald-500/30 border-emerald-300/60 scale-[1.02]"
                    : buttonState === "wrong" && isSelected
                    ? "bg-rose-500/30 border-rose-300/60 scale-[0.99]"
                    : "bg-white/10 border-white/10 hover:bg-white/15";

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={!running}
                    className={
                      "rounded-2xl border px-4 py-4 text-lg font-black text-white shadow-lg transition active:scale-[0.98] disabled:opacity-60 " +
                      classes
                    }
                  >
                    {String(opt)}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 text-xs text-white/60">
              Få den rigtige for at affyre laseren. Forkert svar koster 1 liv, men samme meteor bliver på skærmen.
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}