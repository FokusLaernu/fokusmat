import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * FOKUSMAT — App.jsx (paste hele filen)
 *
 * NYT i denne version (Arcade “Heste-løb”):
 * ✅ Arcade-opgaver er gjort lidt NEMMERE (lavere “arcade-level” end træning)
 * ✅ 5 heste i alt (1 spiller + 4 CPU) med forskellig tempo
 * ✅ Spilleren GALOPERER også fremad hele tiden (så den ikke står stille)
 * ✅ Hestene er mere “heste-agtige” (hoved, hals, hale + galop-ben)
 */

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const roundTo = (n, dp = 2) => {
  const p = Math.pow(10, dp);
  return Math.round(n * p) / p;
};

function parseNumber(input) {
  if (typeof input !== "string") return NaN;
  const cleaned = input
    .trim()
    .replace(/\s/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.+\-eE]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}
function approxEqual(a, b, tol = 1e-2) {
  const scale = Math.max(1, Math.abs(b));
  return Math.abs(a - b) <= tol * scale;
}
function uid() {
  try {
    return crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
  } catch {
    return `${Date.now()}_${Math.random()}`;
  }
}

// --- Date helpers (daily) ---
function dayKeyLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDaysToDayKey(key, deltaDays) {
  const [y, m, d] = key.split("-").map((x) => Number(x));
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

const STORAGE_KEY = "FOKUSMAT_APP_V10_ARCADE_HORSE";

// --- Theme ---
const THEMES = [
  { key: "navy", name: "Navy (mørkeblå)", gradFrom: "from-slate-950", gradVia: "via-blue-950", gradTo: "to-indigo-950", ring: "focus:ring-sky-300" },
  { key: "ocean", name: "Ocean", gradFrom: "from-slate-950", gradVia: "via-sky-950", gradTo: "to-emerald-950", ring: "focus:ring-cyan-300" },
  { key: "violet", name: "Violet", gradFrom: "from-slate-950", gradVia: "via-indigo-950", gradTo: "to-fuchsia-950", ring: "focus:ring-fuchsia-300" },
];

const AVATARS = [
  { key: "dot", name: "Dot" },
  { key: "bolt", name: "Bolt" },
  { key: "star", name: "Star" },
  { key: "cube", name: "Cube" },
  { key: "ring", name: "Ring" },
];

function avatarShapeClass(key) {
  switch (key) {
    case "bolt":
      return "clip-bolt";
    case "star":
      return "clip-star";
    case "cube":
      return "rounded-xl rotate-6";
    case "ring":
      return "rounded-full ring-4 ring-white/20";
    case "dot":
    default:
      return "rounded-full";
  }
}

const TOPICS = [
  { key: "addsub", label: "Plus & minus", short: "Plus/minus" },
  { key: "muldiv", label: "Gange & division", short: "Gange/div" },
  { key: "percent", label: "Procenter", short: "Procent" },
  { key: "geometry", label: "Geometri", short: "Geo" },
  { key: "equations", label: "Ligninger", short: "Lign." },
  { key: "money", label: "Penge & budget", short: "Penge" },
  { key: "rates", label: "Tid & hastighed", short: "Hast." },
];

// ---------------- Difficulty / Progression (GRADE 1-9) ----------------
function getDifficulty(level, grade) {
  const L = clamp(level, 1, 10);
  const G = clamp(grade ?? 5, 1, 9);

  const gradeFactor = 1 + (G - 1) * 0.22;
  const levelFactor = 1 + (L - 1) * 0.08;

  const smallMax = Math.round((10 + L * 7) * gradeFactor * (0.95 + levelFactor * 0.35));
  const bigMax = Math.round((30 + L * 22) * gradeFactor * (0.95 + levelFactor * 0.35));

  const allowDecimals = L >= 3 || G >= 6;
  const allowMultiStep = L >= 4 || G >= 6;
  const allowNegatives = L >= 5 || G >= 7;
  const allowMixedOps = L >= 6 || G >= 7;
  const allowHardEquations = (L >= 5 && G >= 6) || G >= 8;

  const baseChance = 0.10 + L * 0.05 + (G - 1) * 0.06;
  const multiStepChance = clamp(G >= 8 ? Math.max(0.55, baseChance) : baseChance, 0.12, 0.82);

  const avoidTooEasy = G >= 9;

  return {
    L,
    G,
    smallMax,
    bigMax,
    allowDecimals,
    allowMultiStep,
    allowNegatives,
    allowMixedOps,
    allowHardEquations,
    multiStepChance,
    avoidTooEasy,
  };
}

// ---------------- Problem generators ----------------
function genAddSub(diff) {
  const max = diff.smallMax;
  const big = diff.bigMax;

  const makeEasy = () => {
    const op = choice(["+", "-"]);
    let a = randInt(2 + diff.G, Math.max(12, Math.floor(max * 0.7)));
    let b = randInt(2 + diff.G, Math.max(12, Math.floor(max * 0.7)));

    if (op === "+") {
      return { topicKey: "addsub", title: "Plus", prompt: `Regn ud: ${a} + ${b}`, answer: a + b, unit: "", tolerance: 0, format: "integer", hint: "Læg tallene sammen.", steps: [`${a} + ${b} = ${a + b}`] };
    }

    if (!diff.allowNegatives) {
      const hi = Math.max(a, b);
      const lo = Math.min(a, b);
      return { topicKey: "addsub", title: "Minus", prompt: `Regn ud: ${hi} − ${lo}`, answer: hi - lo, unit: "", tolerance: 0, format: "integer", hint: "Træk det lille tal fra det store.", steps: [`${hi} − ${lo} = ${hi - lo}`] };
    }

    return { topicKey: "addsub", title: "Minus", prompt: `Regn ud: ${a} − ${b}`, answer: a - b, unit: "", tolerance: 0, format: "integer", hint: "Træk b fra a.", steps: [`${a} − ${b} = ${a - b}`] };
  };

  const makeThreeTerm = () => {
    const a = randInt(Math.floor(big * 0.25), Math.floor(big * 0.75));
    const b = randInt(Math.floor(big * 0.15), Math.floor(big * 0.6));
    const c = randInt(Math.floor(big * 0.12), Math.floor(big * 0.55));

    const forms = diff.allowMixedOps ? ["a+b-c", "a-b+c", "(a+b)-c", "a-(b-c)"] : ["a+b-c", "(a+b)-c", "a-b+c"];
    const form = choice(forms);

    if (form === "a+b-c") {
      const ans = a + b - c;
      if (!diff.allowNegatives && ans < 0) return makeThreeTerm();
      return { topicKey: "addsub", title: "3-led", prompt: `Regn ud: ${a} + ${b} − ${c}`, answer: ans, unit: "", tolerance: 0, format: "integer", hint: "Regn fra venstre mod højre.", steps: [`${a} + ${b} = ${a + b}`, `${a + b} − ${c} = ${ans}`] };
    }

    if (form === "a-b+c") {
      const ans = a - b + c;
      if (!diff.allowNegatives && a - b < 0) return makeThreeTerm();
      return { topicKey: "addsub", title: "3-led", prompt: `Regn ud: ${a} − ${b} + ${c}`, answer: ans, unit: "", tolerance: 0, format: "integer", hint: "Regn fra venstre mod højre.", steps: [`${a} − ${b} = ${a - b}`, `${a - b} + ${c} = ${ans}`] };
    }

    if (form === "(a+b)-c") {
      const inside = a + b;
      const ans = inside - c;
      if (!diff.allowNegatives && ans < 0) return makeThreeTerm();
      return { topicKey: "addsub", title: "Parentes", prompt: `Regn ud: (${a} + ${b}) − ${c}`, answer: ans, unit: "", tolerance: 0, format: "integer", hint: "Først parentesen.", steps: [`${a} + ${b} = ${inside}`, `${inside} − ${c} = ${ans}`] };
    }

    const inside = b - c;
    if (!diff.allowNegatives && inside < 0) return makeThreeTerm();
    const ans = a - inside;
    return { topicKey: "addsub", title: "Parentes", prompt: `Regn ud: ${a} − (${b} − ${c})`, answer: ans, unit: "", tolerance: 0, format: "integer", hint: "Minus foran parentes skifter fortegn.", steps: [`${b} − ${c} = ${inside}`, `${a} − ${inside} = ${ans}`] };
  };

  const makeDecimals = () => {
    const a = roundTo(randInt(10, Math.floor(big * 0.7)) / 10, 1);
    const b = roundTo(randInt(10, Math.floor(big * 0.7)) / 10, 1);
    const c = roundTo(randInt(10, Math.floor(big * 0.7)) / 10, 1);
    const ans = roundTo(a + b - c, 1);
    return { topicKey: "addsub", title: "Decimal", prompt: `Regn ud: ${a} + ${b} − ${c}`, answer: ans, unit: "", tolerance: 0.02, format: "decimal", hint: "Regn fra venstre mod højre.", steps: [`${a} + ${b} = ${roundTo(a + b, 1)}`, `${roundTo(a + b, 1)} − ${c} = ${ans}`] };
  };

  if (diff.avoidTooEasy) {
    if (diff.allowDecimals && Math.random() < 0.35) return makeDecimals();
    return makeThreeTerm();
  }
  if (diff.allowMultiStep && Math.random() < diff.multiStepChance) {
    if (diff.allowDecimals && diff.G >= 7 && Math.random() < 0.25) return makeDecimals();
    return makeThreeTerm();
  }
  return makeEasy();
}

function genMulDiv(diff) {
  const max = Math.max(8, Math.floor(diff.smallMax * 0.95));
  const a = randInt(2, max);
  const b = randInt(2, max);

  const makeSimple = () => {
    const op = choice(["×", "÷"]);
    if (op === "×") {
      const total = a * b;
      return { topicKey: "muldiv", title: "Gange", prompt: `Regn ud: ${a} × ${b}`, answer: total, unit: "", tolerance: 0, format: "integer", hint: "Gang tallene.", steps: [`${a} × ${b} = ${total}`] };
    }
    const total = a * b;
    return { topicKey: "muldiv", title: "Division", prompt: `Regn ud: ${total} ÷ ${b}`, answer: a, unit: "", tolerance: 0, format: "integer", hint: "Divider total med b.", steps: [`${total} ÷ ${b} = ${a}`] };
  };

  const makeMulti = () => {
    const packs = randInt(3, Math.max(8, Math.floor(max / 2)));
    const each = randInt(4, max);
    const total = packs * each;
    const people = randInt(2, 8 + Math.floor(diff.G / 2));
    const per = Math.floor(total / people);
    const used = per * people;
    const rest = total - used;

    return {
      topicKey: "muldiv",
      title: "Flere trin",
      prompt: `Du har ${packs} pakker med ${each} i hver (${total} i alt). Del ligeligt mellem ${people} personer. Hvor mange får hver? (heltal)`,
      answer: per,
      unit: "",
      tolerance: 0,
      format: "integer",
      hint: "Find total og divider.",
      steps: [`${packs} × ${each} = ${total}`, `${total} ÷ ${people} = ${roundTo(total / people, 2)}`, `Heltal = ${used}/${people} = ${per}`, rest ? `Rest (bonus): ${rest}` : "Ingen rest."],
    };
  };

  const makeParens = () => {
    const m = randInt(3, 12);
    const x = randInt(5, max);
    const y = randInt(5, max);
    const inside = x + y;
    const ans = m * inside;
    return { topicKey: "muldiv", title: "Parentes", prompt: `Regn ud: ${m} × (${x} + ${y})`, answer: ans, unit: "", tolerance: 0, format: "integer", hint: "Først parentesen.", steps: [`${x} + ${y} = ${inside}`, `${m} × ${inside} = ${ans}`] };
  };

  if (diff.avoidTooEasy) return Math.random() < 0.55 ? makeMulti() : makeParens();
  if (diff.allowMixedOps && Math.random() < 0.30) return makeParens();
  if (diff.allowMultiStep && Math.random() < diff.multiStepChance) return makeMulti();
  return makeSimple();
}

function genPercent(diff) {
  const base = Math.max(90, diff.bigMax);
  const pctPool = diff.G >= 8 || diff.L >= 7 ? [5, 10, 12.5, 15, 20, 25, 30, 40, 50] : [10, 15, 20, 25, 30];

  const makeDiscount = () => {
    const price = randInt(Math.floor(base * 0.7), base);
    const pct = choice(pctPool);
    const factor = 1 - pct / 100;
    const ans = roundTo(price * factor, 2);
    return { topicKey: "percent", title: "Rabat", prompt: `En vare koster ${price} kr. Der er ${pct}% rabat. Hvad koster den efter rabat?`, answer: ans, unit: "kr", tolerance: 0.01, format: "decimal", hint: "Pris × (1 − pct/100).", steps: [`Faktor: 1 − ${pct}/100 = ${roundTo(factor, 4)}`, `${price} × ${roundTo(factor, 4)} = ${ans} kr`] };
  };

  const makePercentOf = () => {
    const num = randInt(Math.floor(base * 0.6), base);
    const pct = choice(pctPool);
    const ans = roundTo((pct / 100) * num, 2);
    return { topicKey: "percent", title: "Procent af tal", prompt: `Hvad er ${pct}% af ${num}?`, answer: ans, unit: "", tolerance: 0.01, format: "decimal", hint: "(pct/100) × tal.", steps: [`${pct}/100 = ${roundTo(pct / 100, 4)}`, `${roundTo(pct / 100, 4)} × ${num} = ${ans}`] };
  };

  const makeReverse = () => {
    const pct = choice([10, 20, 25, 30, 40, 50]);
    const original = randInt(Math.floor(base * 0.7), base);
    const after = roundTo(original * (1 - pct / 100), 2);
    const factor = 1 - pct / 100;
    const ans = roundTo(after / factor, 2);
    return { topicKey: "percent", title: "Omvendt procent", prompt: `Efter ${pct}% rabat koster varen ${after} kr. Hvad var prisen før rabat?`, answer: ans, unit: "kr", tolerance: 0.02, format: "decimal", hint: "Efter ÷ (1 − pct/100).", steps: [`Faktor: 1 − ${pct}/100 = ${roundTo(factor, 4)}`, `${after} ÷ ${roundTo(factor, 4)} = ${ans} kr`] };
  };

  if (diff.avoidTooEasy) return Math.random() < 0.55 ? makeReverse() : makePercentOf();
  if ((diff.G >= 8 || diff.L >= 7) && Math.random() < 0.28) return makeReverse();
  if ((diff.G >= 7 || diff.L >= 7) && Math.random() < 0.45) return makePercentOf();
  return makeDiscount();
}

function genGeometry(diff) {
  const w = randInt(4, 12 + diff.G + Math.floor(diff.L / 2));
  const l = randInt(5, 14 + diff.G + diff.L);

  const makeRectArea = () => {
    const area = w * l;
    return { topicKey: "geometry", title: "Areal", prompt: `Et rektangel er ${w} m bredt og ${l} m langt. Hvad er arealet?`, answer: area, unit: "m²", tolerance: 0, format: "integer", hint: "Areal = bredde × længde.", steps: [`${w} × ${l} = ${area} m²`] };
  };

  const makePractical = () => {
    const area = w * l;
    const packCovers = choice([1.5, 2.0, 2.25, 2.5, 3.0]);
    const packs = Math.ceil(area / packCovers);
    return { topicKey: "geometry", title: "Pakker", prompt: `Et gulv er ${w} m × ${l} m (${area} m²). En pakke dækker ${packCovers} m². Hvor mange pakker? (afrund op)`, answer: packs, unit: "pakker", tolerance: 0, format: "integer", hint: "Areal/dækning → rund op.", steps: [`Areal: ${w} × ${l} = ${area}`, `${area}/${packCovers} = ${roundTo(area / packCovers, 2)}`, `Rund op = ${packs}`] };
  };

  const makeTriangle = () => {
    const b = randInt(10, 45 + diff.G + diff.L * 2);
    const h = randInt(8, 35 + diff.G + diff.L * 2);
    const ans = roundTo((b * h) / 2, 2);
    return { topicKey: "geometry", title: "Trekant", prompt: `En trekant har grundlinje ${b} cm og højde ${h} cm. Hvad er arealet?`, answer: ans, unit: "cm²", tolerance: 0.02, format: "decimal", hint: "1/2 × b × h.", steps: [`1/2 × ${b} × ${h} = ${ans}`] };
  };

  if (diff.avoidTooEasy) return Math.random() < 0.55 ? makePractical() : makeTriangle();
  if ((diff.G >= 8 || diff.L >= 8) && Math.random() < 0.35) return makeTriangle();
  if ((diff.G >= 6 || diff.L >= 6) && Math.random() < 0.55) return makePractical();
  return makeRectArea();
}

function genEquations(diff) {
  const makeEasy = () => {
    const a = randInt(5, Math.max(12, Math.floor(diff.smallMax * 0.9)));
    const x = randInt(2, Math.max(10, Math.floor(diff.smallMax / 2)));
    const b = a + x;
    return { topicKey: "equations", title: "Ligning", prompt: `Løs: x + ${a} = ${b}. Hvad er x?`, answer: x, unit: "", tolerance: 0, format: "integer", hint: "Flyt a over (minus).", steps: [`x = ${b} − ${a} = ${x}`] };
  };

  const makeHard = () => {
    const A = randInt(2, Math.max(4, Math.floor(diff.G / 2) + 3));
    const x = randInt(3, Math.max(12, diff.G * 4 + diff.L * 2));
    const B = randInt(2, Math.max(25, Math.floor(diff.smallMax * 0.9)));
    const C = A * x + B;
    return { topicKey: "equations", title: "Ligning", prompt: `Løs: ${A}x + ${B} = ${C}. Hvad er x?`, answer: x, unit: "", tolerance: 0, format: "integer", hint: "Minus B, divider med A.", steps: [`${A}x = ${C} − ${B} = ${C - B}`, `x = ${C - B}/${A} = ${x}`] };
  };

  if (diff.avoidTooEasy) return makeHard();
  if ((diff.allowHardEquations && diff.G >= 6) && Math.random() < 0.6) return makeHard();
  return makeEasy();
}

function genMoney(diff) {
  const qty = randInt(2, 7 + Math.floor(diff.G / 2));
  const price = randInt(8 + diff.G, Math.max(35, Math.floor(diff.bigMax / 4)));
  const subtotal = qty * price;

  const makeSimple = () => ({
    topicKey: "money",
    title: "Budget",
    prompt: `Du køber ${qty} ting á ${price} kr. Hvad er totalprisen?`,
    answer: subtotal,
    unit: "kr",
    tolerance: 0,
    format: "integer",
    hint: "Antal × pris.",
    steps: [`${qty} × ${price} = ${subtotal}`],
  });

  const makeDiscount = () => {
    const pct = choice([5, 10, 15, 20, 25, 30]);
    const total = roundTo(subtotal * (1 - pct / 100), 2);
    return { topicKey: "money", title: "Rabat", prompt: `Totalen er ${subtotal} kr. Du får ${pct}% rabat. Hvad betaler du?`, answer: total, unit: "kr", tolerance: 0.02, format: "decimal", hint: "Subtotal × (1 − pct/100).", steps: [`${subtotal} × (1 − ${pct}/100) = ${total}`] };
  };

  if (diff.avoidTooEasy) return makeDiscount();
  if ((diff.G >= 5 || diff.L >= 5) && Math.random() < 0.6) return makeDiscount();
  return makeSimple();
}

function genRates(diff) {
  const speed = randInt(6 + Math.floor(diff.G / 2), 12 + diff.G + Math.floor(diff.L / 2));
  const minutes = choice([10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90]);
  const hours = minutes / 60;

  const makeDistance = () => {
    const ans = roundTo(speed * hours, 2);
    return { topicKey: "rates", title: "Distance", prompt: `Du bevæger dig med ${speed} km/t i ${minutes} minutter. Hvor langt?`, answer: ans, unit: "km", tolerance: 0.02, format: "decimal", hint: "Hastighed × tid (i timer).", steps: [`${minutes}/60 = ${roundTo(hours, 4)} t`, `${speed} × ${roundTo(hours, 4)} = ${ans}`] };
  };

  if (diff.avoidTooEasy) return makeDistance();
  return makeDistance();
}

function genByTopic(topicKey, diff) {
  switch (topicKey) {
    case "addsub":
      return genAddSub(diff);
    case "muldiv":
      return genMulDiv(diff);
    case "percent":
      return genPercent(diff);
    case "geometry":
      return genGeometry(diff);
    case "equations":
      return genEquations(diff);
    case "money":
      return genMoney(diff);
    case "rates":
      return genRates(diff);
    default:
      return genAddSub(diff);
  }
}

function pickTopicWeighted(allowedTopics, grade) {
  const all = TOPICS.map((t) => t.key);
  const pool = Array.isArray(allowedTopics) && allowedTopics.length > 0 ? allowedTopics : all;

  const G = clamp(grade ?? 5, 1, 9);
  const weights = new Map();
  for (const k of pool) weights.set(k, 1);

  // “9. klasse-agtigt” i blandet
  if (G >= 8) {
    if (weights.has("equations")) weights.set("equations", (weights.get("equations") ?? 1) + 2);
    if (weights.has("percent")) weights.set("percent", (weights.get("percent") ?? 1) + 2);
    if (weights.has("geometry")) weights.set("geometry", (weights.get("geometry") ?? 1) + 1);
    if (weights.has("rates")) weights.set("rates", (weights.get("rates") ?? 1) + 1);
    if (weights.has("addsub")) weights.set("addsub", Math.max(0.6, (weights.get("addsub") ?? 1) - 0.4));
  }
  if (G >= 9) {
    if (weights.has("addsub")) weights.set("addsub", Math.max(0.55, (weights.get("addsub") ?? 1) - 0.2));
    if (weights.has("muldiv")) weights.set("muldiv", (weights.get("muldiv") ?? 1) + 0.5);
  }

  const bag = [];
  for (const k of pool) {
    const w = weights.get(k) ?? 1;
    const copies = clamp(Math.round(w * 5), 2, 18);
    for (let i = 0; i < copies; i++) bag.push(k);
  }
  return choice(bag);
}

function generateProblem(level, grade, allowedTopics) {
  const diff = getDifficulty(level, grade);
  const topicKey = pickTopicWeighted(allowedTopics, diff.G);
  const p = genByTopic(topicKey, diff);
  return { id: uid(), level: diff.L, grade: diff.G, ...p };
}

// --- Arcade-problems: lidt nemmere end træning ---
// “Dumt forklaret”: Vi bruger bare et lidt lavere level + (ofte) et lavere klassetrin,
// så spørgsmålene bliver mere “boost-venlige”.
function generateArcadeProblem(gameLevel, grade, allowedTopics) {
  const arcadeLevel = clamp((gameLevel ?? 1) - 1, 1, 10); // 1 level nemmere
  const arcadeGrade = clamp((grade ?? 5) - 1, 1, 9); // 1 klassetrin nemmere

  // Hvis spilleren har valgt emner, respekter dem.
  // Hvis ikke, så vælg mest “hurtige” emner lidt oftere.
  const chosen = Array.isArray(allowedTopics) ? allowedTopics : [];
  const pool = chosen.length ? chosen : ["addsub", "muldiv", "percent", "money"];

  return generateProblem(arcadeLevel, arcadeGrade, pool);
}

// ---------------- Achievements ----------------
const ACH = [
  { id: "first", name: "Første rigtige", desc: "Du svarede korrekt første gang." },
  { id: "streak5", name: "Streak 5", desc: "5 rigtige i træk." },
  { id: "points100", name: "100 point", desc: "Du nåede 100 point." },
  { id: "lvl5", name: "Level 5", desc: "Du nåede level 5." },
  { id: "lvl10", name: "Max level", desc: "Du nåede level 10." },
  { id: "daily3", name: "Daily streak 3", desc: "3 daily challenges i træk." },
  { id: "daily7", name: "Daily streak 7", desc: "7 daily challenges i træk." },
];

function computeUnlocks(game, meta) {
  const unlocked = new Set(game.achievements || []);
  const newly = [];
  const dailyStreak = meta?.dailyStreak ?? 0;

  const rules = [
    ["first", () => game.correct >= 1],
    ["streak5", () => game.streak >= 5],
    ["points100", () => game.points >= 100],
    ["lvl5", () => game.level >= 5],
    ["lvl10", () => game.level >= 10],
    ["daily3", () => dailyStreak >= 3],
    ["daily7", () => dailyStreak >= 7],
  ];

  for (const [id, ok] of rules) {
    if (!unlocked.has(id) && ok()) {
      unlocked.add(id);
      newly.push(id);
    }
  }
  return { achievements: Array.from(unlocked), newly };
}

// ---------------- UI bits ----------------
function Panel({ children, className = "" }) {
  return (
    <div className={"rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-5 " + className}>
      {children}
    </div>
  );
}
function Chip({ children, className = "" }) {
  return (
    <span className={"inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-semibold shadow-sm text-white/90 " + className}>
      {children}
    </span>
  );
}
function SmallBtn({ children, onClick, className = "", disabled = false, title = "" }) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={
        "rounded-xl border border-white/10 px-3 py-2 bg-white/10 hover:bg-white/15 active:scale-[0.98] transition shadow-sm text-white disabled:opacity-50 disabled:cursor-not-allowed " +
        className
      }
    >
      {children}
    </button>
  );
}
function ThemeButton({ theme, active, onClick }) {
  const grad = `bg-gradient-to-r ${theme.gradFrom} ${theme.gradVia} ${theme.gradTo}`;
  return (
    <button
      onClick={onClick}
      className={
        "relative w-full rounded-2xl border px-3 py-3 text-left shadow-sm transition active:scale-[0.99] " +
        (active ? "border-white/20 bg-white/15" : "border-white/10 bg-white/10 hover:bg-white/15")
      }
    >
      <div className="flex items-center justify-between gap-2 text-white">
        <div className="font-extrabold">{theme.name}</div>
        <div className={"h-7 w-16 rounded-xl " + grad} />
      </div>
      {active && <div className="mt-1 text-xs text-white/70">Valgt</div>}
    </button>
  );
}
function AvatarPreview({ name, avatarKey, theme }) {
  const initial = (name || "?").trim().slice(0, 1).toUpperCase() || "?";
  const grad = `bg-gradient-to-r ${theme.gradFrom} ${theme.gradVia} ${theme.gradTo}`;
  return (
    <div className="flex items-center gap-3">
      <div className={"h-12 w-12 grid place-items-center text-white font-black shadow-lg " + grad + " " + avatarShapeClass(avatarKey)}>{initial}</div>
      <div className="text-white">
        <div className="font-extrabold leading-tight">{name?.trim() ? name.trim() : "Din profil"}</div>
        <div className="text-xs text-white/70">Avatar + tema</div>
      </div>
    </div>
  );
}
function TabButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-2xl px-4 py-2 font-extrabold border transition text-white " +
        (active ? "bg-white/20 border-white/20 shadow-sm" : "bg-white/10 border-white/10 hover:bg-white/15")
      }
    >
      {label}
    </button>
  );
}
function FirePanel({ children }) {
  return (
    <div className="rounded-3xl p-[1px] shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
      <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 p-[1px]">
        <div className="rounded-3xl bg-slate-950/55 backdrop-blur-xl border border-white/10 p-5">{children}</div>
      </div>
    </div>
  );
}

function DayDot({ label, filled, isToday }) {
  const base = "flex flex-col items-center justify-center rounded-2xl border px-2 py-2 min-w-[54px] transition ";
  const cls = filled ? "bg-gradient-to-b from-amber-500/25 via-orange-600/15 to-rose-600/15 border-white/15" : "bg-white/8 border-white/10";
  const todayRing = isToday ? " ring-2 ring-amber-300/70 " : "";
  return (
    <div className={base + cls + todayRing}>
      <div className="text-[11px] text-white/75">Dag {label}</div>
      <div className="text-lg leading-none">{filled ? "🔥" : "•"}</div>
    </div>
  );
}

/**
 * ArcadeHorseRaceCanvas (OPDATERET)
 * - 5 heste (1 spiller + 4 CPU)
 * - Lidt mere “heste-agtig” tegning + galop-ben
 */
function ArcadeHorseRaceCanvas({ horses, finishLine = 0.92 }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [size, setSize] = useState({ w: 800, h: 260 }); // lidt højere til flere lanes
  const tRef = useRef(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({
        w: Math.max(320, Math.floor(rect.width)),
        h: 260,
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      tRef.current += 1;
      draw();
      raf = requestAnimationFrame(loop);
    };

    const draw = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width = size.w;
      c.height = size.h;

      const ctx = c.getContext("2d");
      if (!ctx) return;

      const pad = 16;
      const lanes = Math.max(2, horses?.length || 2);
      const laneH = (size.h - pad * 2) / lanes;

      // background
      ctx.clearRect(0, 0, size.w, size.h);
      ctx.fillStyle = "rgba(15, 23, 42, 0.55)";
      ctx.fillRect(0, 0, size.w, size.h);

      // lane lines
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 2;
      for (let i = 0; i <= lanes; i++) {
        const y = pad + laneH * i;
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(size.w - pad, y);
        ctx.stroke();
      }

      // finish line
      const finishX = pad + (size.w - pad * 2) * finishLine;
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(finishX, pad - 4);
      ctx.lineTo(finishX, size.h - pad + 4);
      ctx.stroke();

      // checker pattern
      for (let y = pad - 2; y < size.h - pad + 2; y += 10) {
        ctx.fillStyle = (y / 10) % 2 === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)";
        ctx.fillRect(finishX - 3, y, 6, 6);
      }

      const tick = tRef.current;
      const gallop = (tick % 18) / 18; // 0..1
      const legA = gallop < 0.5 ? 1 : -1;

      // helper: draw horse
      const drawHorse = (pos, laneIndex, horse) => {
        const yMid = pad + laneH * laneIndex + laneH * 0.55;
        const x = pad + (size.w - pad * 2) * clamp(pos, 0, 1);

        // shadow
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.ellipse(x, yMid + 16, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // tail
        ctx.strokeStyle = horse.tail;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 26, yMid - 2);
        ctx.lineTo(x - 40, yMid + 6 + legA * 2);
        ctx.stroke();

        // body
        ctx.fillStyle = horse.body;
        ctx.beginPath();
        ctx.roundRect(x - 20, yMid - 16, 44, 26, 12);
        ctx.fill();

        // neck
        ctx.fillStyle = horse.accent;
        ctx.beginPath();
        ctx.roundRect(x + 12, yMid - 20, 14, 18, 8);
        ctx.fill();

        // head
        ctx.fillStyle = horse.accent;
        ctx.beginPath();
        ctx.ellipse(x + 28, yMid - 10, 12, 10, 0.15, 0, Math.PI * 2);
        ctx.fill();

        // ear
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.beginPath();
        ctx.moveTo(x + 30, yMid - 22);
        ctx.lineTo(x + 34, yMid - 16);
        ctx.lineTo(x + 26, yMid - 16);
        ctx.closePath();
        ctx.fill();

        // legs (galop)
        const legColor = "rgba(255,255,255,0.30)";
        ctx.strokeStyle = legColor;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        const legBaseY = yMid + 10;

        const leg = (dx, swing) => {
          ctx.beginPath();
          ctx.moveTo(x + dx, legBaseY);
          ctx.lineTo(x + dx + swing, legBaseY + 16);
          ctx.stroke();
        };

        leg(-12, 6 * legA);
        leg(-2, -5 * legA);
        leg(10, 5 * legA);
        leg(18, -6 * legA);

        // label
        ctx.fillStyle = "rgba(255,255,255,0.78)";
        ctx.font = "bold 12px ui-sans-serif, system-ui, -apple-system";
        ctx.fillText(horse.label, x - 18, yMid - 26);

        // little “badge” for player
        if (horse.isPlayer) {
          ctx.fillStyle = "rgba(56,189,248,0.22)";
          ctx.strokeStyle = "rgba(56,189,248,0.45)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x - 28, yMid - 34, 56, 16, 7);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          ctx.font = "bold 10px ui-sans-serif, system-ui, -apple-system";
          ctx.fillText("DIN HEST", x - 22, yMid - 22);
        }
      };

      // draw horses top->bottom
      for (let i = 0; i < lanes; i++) {
        const h = horses[i];
        if (!h) continue;
        drawHorse(h.pos, i, h);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [size, horses, finishLine]);

  return (
    <div ref={wrapRef} className="w-full rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
}

// ---------------- App ----------------
export default function App() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}

    const dk = dayKeyLocal();
    return {
      profile: { name: "", grade: 5, dailyGoal: 10, themeKey: "navy", avatarKey: "dot" },
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
      arcade: {
        bestScore: 0,
        lastScore: 0,
      },
      ui: { tab: "tasks" },
    };
  });

  const { profile, game, meta, ui, arcade } = state;

  const theme = useMemo(() => THEMES.find((t) => t.key === profile.themeKey) ?? THEMES[0], [profile.themeKey]);
  const mainGradient = `bg-gradient-to-b ${theme.gradFrom} ${theme.gradVia} ${theme.gradTo}`;
  const slogan = "LærNu - FOKUSMAT";

  const unlockedAch = useMemo(() => new Set(game.achievements || []), [game.achievements]);

  // training
  const [problem, setProblem] = useState(() => generateProblem(game.level, profile.grade, game.allowedTopics));
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  // daily
  const [dailyInput, setDailyInput] = useState("");
  const [dailyFeedback, setDailyFeedback] = useState(null);

  // ---------------- Arcade (multi-horse) ----------------
  const finishLine = 0.92;

  // 5 horses: player + 4 CPU
  const ARCADE_HORSES = useMemo(() => {
    return [
      { id: "player", label: "DIG", isPlayer: true, body: "rgba(56,189,248,0.85)", accent: "rgba(99,102,241,0.90)", tail: "rgba(56,189,248,0.70)" },
      { id: "cpu1", label: "CPU 1", isPlayer: false, body: "rgba(251,191,36,0.85)", accent: "rgba(244,63,94,0.85)", tail: "rgba(251,191,36,0.70)" },
      { id: "cpu2", label: "CPU 2", isPlayer: false, body: "rgba(34,197,94,0.80)", accent: "rgba(16,185,129,0.85)", tail: "rgba(34,197,94,0.65)" },
      { id: "cpu3", label: "CPU 3", isPlayer: false, body: "rgba(168,85,247,0.80)", accent: "rgba(236,72,153,0.80)", tail: "rgba(168,85,247,0.65)" },
      { id: "cpu4", label: "CPU 4", isPlayer: false, body: "rgba(148,163,184,0.75)", accent: "rgba(203,213,225,0.80)", tail: "rgba(148,163,184,0.55)" },
    ];
  }, []);

  const [arcadeRunning, setArcadeRunning] = useState(false);
  const [arcadeTimeLeft, setArcadeTimeLeft] = useState(60);
  const [arcadeScore, setArcadeScore] = useState(0);
  const [arcadeProblem, setArcadeProblem] = useState(() => generateArcadeProblem(game.level, profile.grade, game.allowedTopics));
  const [arcadeInput, setArcadeInput] = useState("");
  const [arcadeMsg, setArcadeMsg] = useState(null);

  // positions for all horses
  const [positions, setPositions] = useState(() => ARCADE_HORSES.map(() => 0.02));
  const targetsRef = useRef(ARCADE_HORSES.map(() => 0.02));

  // each CPU has its own “speed personality”
  const cpuSpeedRef = useRef([0, 0, 0, 0, 0]); // index 0 is player (unused)
  const playerSpeedRef = useRef(0.0);

  // simple animations / toasts
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const [levelUp, setLevelUp] = useState(null);
  const levelUpTimer = useRef(null);

  const [shake, setShake] = useState(false);
  const [pop, setPop] = useState(false);
  const [fadeProblem, setFadeProblem] = useState(false);
  const [pulseBar, setPulseBar] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  function showToast(text) {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  function showLevelUp(newLevel) {
    setLevelUp({ newLevel });
    setPulseBar(true);
    if (levelUpTimer.current) clearTimeout(levelUpTimer.current);
    levelUpTimer.current = setTimeout(() => {
      setLevelUp(null);
      setPulseBar(false);
    }, 1600);
  }

  function setProfile(nextPartial) {
    setState((s) => ({ ...s, profile: { ...s.profile, ...nextPartial } }));
  }
  function setTab(tab) {
    setState((s) => ({ ...s, ui: { ...s.ui, tab } }));
  }
  function setAllowedTopics(next) {
    setState((s) => ({ ...s, game: { ...s.game, allowedTopics: next } }));
  }
  function toggleTopic(key) {
    setState((s) => {
      const cur = s.game.allowedTopics || [];
      const has = cur.includes(key);
      const next = has ? cur.filter((x) => x !== key) : [...cur, key];
      return { ...s, game: { ...s.game, allowedTopics: next } };
    });
  }

  function swapProblem(nextProblem) {
    setFadeProblem(true);
    setTimeout(() => {
      setProblem(nextProblem);
      setInput("");
      setFeedback(null);
      setShowHint(false);
      setShowSteps(false);
      setFadeProblem(false);
    }, 140);
  }

  function nextProblem() {
    swapProblem(generateProblem(game.level, profile.grade, game.allowedTopics));
  }

  function resetAll() {
    const dk = dayKeyLocal();
    setState({
      profile: { name: "", grade: 5, dailyGoal: 10, themeKey: "navy", avatarKey: "dot" },
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
      arcade: { bestScore: 0, lastScore: 0 },
      ui: { tab: "tasks" },
    });
    setToast(null);
    setLevelUp(null);
  }

  function playPop() {
    setPop(true);
    setTimeout(() => setPop(false), 180);
  }
  function playShake() {
    setShake(true);
    setTimeout(() => setShake(false), 240);
  }

  // --- daily init/reset + streak correction ---
  useEffect(() => {
    const dk = dayKeyLocal();

    if (meta?.dayKey !== dk) {
      setState((s) => ({
        ...s,
        meta: { ...s.meta, dayKey: dk, correctToday: 0, dailyCountedInGoalDayKey: null },
      }));
      return;
    }

    if (meta?.dailyLastDoneDayKey) {
      const yesterday = addDaysToDayKey(dk, -1);
      const ok = meta.dailyLastDoneDayKey === dk || meta.dailyLastDoneDayKey === yesterday;
      if (!ok && meta.dailyStreak !== 0) {
        setState((s) => ({ ...s, meta: { ...s.meta, dailyStreak: 0 } }));
      }
    }

    const hasDaily = meta?.daily?.dayKey === dk && meta?.daily?.problem;
    if (!hasDaily) {
      const dailyLevel = clamp(game.level + 2, 1, 10);
      const dailyProblem = generateProblem(dailyLevel, profile.grade, []);
      setState((s) => ({ ...s, meta: { ...s.meta, daily: { dayKey: dk, problem: dailyProblem, done: false } } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.dayKey, meta?.daily?.dayKey, meta?.daily?.problem, meta?.dailyLastDoneDayKey, meta?.dailyStreak, game.level, profile.grade]);

  // new training problem when level/grade/topics change
  useEffect(() => {
    swapProblem(generateProblem(game.level, profile.grade, game.allowedTopics));
    if (!arcadeRunning) setArcadeProblem(generateArcadeProblem(game.level, profile.grade, game.allowedTopics));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.level, profile.grade, game.allowedTopics]);

  // daily reroll if grade changes (if not done)
  useEffect(() => {
    const dk = dayKeyLocal();
    if (meta?.daily?.dayKey === dk && meta?.daily?.done) return;
    setState((s) => {
      const dkk = dayKeyLocal();
      const dailyLevel = clamp(s.game.level + 2, 1, 10);
      const dailyProblem = generateProblem(dailyLevel, s.profile.grade, []);
      return { ...s, meta: { ...s.meta, daily: { dayKey: dkk, problem: dailyProblem, done: false } } };
    });
    setDailyInput("");
    setDailyFeedback(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.grade]);

  function onCorrect() {
    const basePoints = 10;
    const levelBonus = clamp(problem.level, 1, 10) * 2;
    const streakBonus = clamp(game.streak, 0, 12) * 1;
    const earnedPoints = basePoints + levelBonus + streakBonus;

    const gainedXp = 14 + clamp(problem.level, 1, 10) * 4;
    const xpToLevel = 90 + (game.level - 1) * 55;
    const currentXp = game.xp + gainedXp;

    const willLevelUp = currentXp >= xpToLevel && game.level < 10;
    const nextLevel = willLevelUp ? game.level + 1 : game.level;
    const nextXp = willLevelUp ? currentXp - xpToLevel : currentXp;

    setState((s) => {
      const nextStreak = s.game.streak + 1;
      const prevMax = s.meta.maxStreak ?? 0;

      if (prevMax >= 5 && nextStreak === prevMax) showToast("Du er tæt på at slå din rekord! 1 mere 🔥");
      if (prevMax >= 5 && nextStreak === prevMax + 1) showToast("NY REKORDSTREAK! 🏆");

      const nextMaxStreak = Math.max(prevMax, nextStreak);

      const nextGame = {
        ...s.game,
        points: s.game.points + earnedPoints,
        streak: nextStreak,
        correct: s.game.correct + 1,
        xp: nextXp,
        level: clamp(nextLevel, 1, 10),
      };

      const nextMeta = { ...s.meta, correctToday: (s.meta.correctToday ?? 0) + 1, maxStreak: nextMaxStreak };

      const { achievements, newly } = computeUnlocks(nextGame, nextMeta);
      nextGame.achievements = achievements;

      if (newly.length) {
        const a = ACH.find((x) => x.id === newly[0]);
        showToast(a ? `Badge: ${a.name}` : "Ny badge låst op");
      }

      return { ...s, game: nextGame, meta: nextMeta };
    });

    setFeedback({ type: "ok", msg: `Korrekt! +${earnedPoints} point` });
    playPop();
    if (willLevelUp) showLevelUp(nextLevel);
    setTimeout(() => nextProblem(), 650);
  }

  function onWrong() {
    setState((s) => ({ ...s, game: { ...s.game, streak: 0, wrong: s.game.wrong + 1 } }));
    setFeedback({
      type: "bad",
      msg: `Ikke helt. Rigtigt svar: ${String(problem.answer)}${problem.unit ? ` ${problem.unit}` : ""}.`,
    });
    setShowSteps(true);
    playShake();
  }

  function check() {
    const expected = Number(problem.answer);
    const got = parseNumber(input);

    let ok = false;
    if (!Number.isFinite(got)) ok = false;
    else if (problem.tolerance && problem.tolerance > 0) ok = approxEqual(got, expected, problem.tolerance);
    else ok = got === expected;

    ok ? onCorrect() : onWrong();
  }

  function checkDaily() {
    if (!meta?.daily?.problem || meta?.daily?.done) return;

    const today = dayKeyLocal();
    const p = meta.daily.problem;
    const expected = Number(p.answer);
    const got = parseNumber(dailyInput);

    let ok = false;
    if (!Number.isFinite(got)) ok = false;
    else if (p.tolerance && p.tolerance > 0) ok = approxEqual(got, expected, p.tolerance);
    else ok = got === expected;

    if (!ok) {
      setDailyFeedback({ type: "bad", msg: `Ikke helt. Rigtigt svar: ${String(expected)}${p.unit ? ` ${p.unit}` : ""}.` });
      return;
    }

    const bonusPoints = 35 + clamp(p.level, 1, 10) * 2;
    const bonusXp = 30 + clamp(p.level, 1, 10) * 3;

    setState((s) => {
      const yesterday = addDaysToDayKey(today, -1);
      const last = s.meta.dailyLastDoneDayKey;

      let nextDailyStreak = 1;
      if (last === yesterday) nextDailyStreak = (s.meta.dailyStreak ?? 0) + 1;
      else if (last === today) nextDailyStreak = s.meta.dailyStreak ?? 0;
      else nextDailyStreak = 1;

      const xpToLevelNow = 90 + (s.game.level - 1) * 55;
      const currentXp = s.game.xp + bonusXp;
      const willLevelUp = currentXp >= xpToLevelNow && s.game.level < 10;
      const nextLevel = willLevelUp ? s.game.level + 1 : s.game.level;
      const nextXp = willLevelUp ? currentXp - xpToLevelNow : currentXp;

      const nextGame = { ...s.game, points: s.game.points + bonusPoints, xp: nextXp, level: clamp(nextLevel, 1, 10) };

      const alreadyCounted = s.meta.dailyCountedInGoalDayKey === today;
      const nextCorrectToday = alreadyCounted ? (s.meta.correctToday ?? 0) : (s.meta.correctToday ?? 0) + 1;

      const nextMeta = {
        ...s.meta,
        dailyStreak: nextDailyStreak,
        dailyLastDoneDayKey: today,
        daily: { ...s.meta.daily, done: true },
        correctToday: nextCorrectToday,
        dailyCountedInGoalDayKey: today,
      };

      const { achievements, newly } = computeUnlocks(nextGame, nextMeta);
      nextGame.achievements = achievements;

      if (newly.length) {
        const a = ACH.find((x) => x.id === newly[0]);
        showToast(a ? `Badge: ${a.name}` : "Ny badge låst op");
      } else {
        showToast(`Daily streak: ${nextDailyStreak}`);
      }

      return { ...s, game: nextGame, meta: nextMeta };
    });

    setDailyFeedback({ type: "ok", msg: "Korrekt! Daily klaret." });
    setDailyInput("");
  }

  // --- 7-dages række: Dag 1 = startdagen, så 7 dage frem ---
  const dk = meta?.dayKey ?? dayKeyLocal();
  const dailyStreak = meta?.dailyStreak ?? 0;
  const lastDone = meta?.dailyLastDoneDayKey;
  const yesterdayKey = addDaysToDayKey(dk, -1);
  const streakIsHot = lastDone === yesterdayKey || lastDone === dk;

  const streakStartKey = useMemo(() => {
    if (lastDone && dailyStreak > 0) return addDaysToDayKey(lastDone, -(dailyStreak - 1));
    return dk;
  }, [lastDone, dailyStreak, dk]);

  const weekKeysForward = useMemo(() => {
    const keys = [];
    for (let i = 0; i < 7; i++) keys.push(addDaysToDayKey(streakStartKey, i));
    return keys;
  }, [streakStartKey]);

  function isKeyInStreak(key) {
    if (!lastDone || dailyStreak <= 0) return false;
    return key >= streakStartKey && key <= lastDone;
  }

  const chosenTopicsText = useMemo(() => {
    const chosen = game.allowedTopics || [];
    if (chosen.length === 0) return "Blandet";
    const labels = TOPICS.filter((t) => chosen.includes(t.key)).map((t) => t.short);
    return labels.slice(0, 4).join(", ") + (labels.length > 4 ? "…" : "");
  }, [game.allowedTopics]);

  const maxStreak = meta?.maxStreak ?? 0;

  // --- Dagens mål progress (kun 1 bar) ---
  const goal = Math.max(0, Number(profile.dailyGoal) || 0);
  const done = clamp(meta?.correctToday ?? 0, 0, goal || 0);
  const goalPct = goal > 0 ? Math.round((done / goal) * 100) : 0;

  // ---------------- Arcade Game Logic (multi-horse) ----------------
  // smooth movement towards targets
  const rafRef = useRef(null);
  useEffect(() => {
    const tick = () => {
      setPositions((prev) => prev.map((p, i) => p + (targetsRef.current[i] - p) * 0.16));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Arcade countdown timer
  useEffect(() => {
    if (!arcadeRunning) return;

    const id = setInterval(() => {
      setArcadeTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [arcadeRunning]);

  // Each second while running: everyone moves (including player a bit)
  useEffect(() => {
    if (!arcadeRunning) return;

    // Stop at end
    if (arcadeTimeLeft <= 0) {
      endArcade();
      return;
    }

    // Player constant gallop (small)
    // Grade påvirker lidt, men stadig “lille”
    const basePlayer = 0.006;
    const gradePlayer = clamp((profile.grade - 1) * 0.0006, 0, 0.004);
    const playerStep = basePlayer + gradePlayer + playerSpeedRef.current;
    targetsRef.current[0] = clamp(targetsRef.current[0] + playerStep, 0, 1);

    // CPU horses move with their own tempo + tiny randomness
    for (let i = 1; i < 5; i++) {
      const base = cpuSpeedRef.current[i] || 0.013;
      const wobble = (Math.random() - 0.5) * 0.003; // +/- 0.0015
      targetsRef.current[i] = clamp(targetsRef.current[i] + base + wobble, 0, 1);
    }

    // if someone passes finish line, we can end soon (gives animation time)
    const best = Math.max(...targetsRef.current);
    if (best >= finishLine) {
      setTimeout(() => endArcade(), 280);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arcadeTimeLeft]);

  function startArcade() {
    setArcadeMsg(null);
    setArcadeScore(0);
    setArcadeTimeLeft(60);
    setArcadeInput("");
    setArcadeProblem(generateArcadeProblem(game.level, profile.grade, game.allowedTopics));

    // reset positions
    targetsRef.current = ARCADE_HORSES.map(() => 0.02);
    setPositions(ARCADE_HORSES.map(() => 0.02));

    // make 4 CPU personalities (different tempo)
    // “Dumt forklaret”: CPU 1 er lidt hurtig, CPU 2 middel, CPU 3 lidt langsom, CPU 4 “joker”
    const gradeFactor = clamp((profile.grade - 1) * 0.001, 0, 0.008);
    cpuSpeedRef.current = [
      0, // player
      0.014 + gradeFactor + Math.random() * 0.003, // cpu1
      0.013 + gradeFactor + Math.random() * 0.003, // cpu2
      0.012 + gradeFactor + Math.random() * 0.003, // cpu3
      0.013 + gradeFactor + Math.random() * 0.006, // cpu4 joker
    ];

    // player “extra speed” starts at 0
    playerSpeedRef.current = 0;

    setArcadeRunning(true);
  }

  function endArcade() {
    setArcadeRunning(false);

    const bestPos = Math.max(...targetsRef.current);
    const winnerIdx = targetsRef.current.findIndex((p) => p === bestPos);

    const playerWon = winnerIdx === 0;
    const winnerName = ARCADE_HORSES[winnerIdx]?.label ?? "???";

    let msg = `Tid! Score: ${arcadeScore}`;
    if (bestPos >= finishLine) {
      msg = playerWon ? `DU VANDT! 🏁 Score: ${arcadeScore}` : `${winnerName} vandt… Prøv igen! Score: ${arcadeScore}`;
    } else {
      msg = `Tid! Score: ${arcadeScore} (ingen nåede målstregen)`;
    }

    setArcadeMsg(msg);

    setState((s) => {
      const best = Math.max(s.arcade?.bestScore ?? 0, arcadeScore);
      return { ...s, arcade: { bestScore: best, lastScore: arcadeScore } };
    });
  }

  function arcadeNextProblem() {
    setArcadeProblem(generateArcadeProblem(game.level, profile.grade, game.allowedTopics));
    setArcadeInput("");
  }

  function checkArcade() {
    if (!arcadeRunning) return;

    const expected = Number(arcadeProblem.answer);
    const got = parseNumber(arcadeInput);

    let ok = false;
    if (!Number.isFinite(got)) ok = false;
    else if (arcadeProblem.tolerance && arcadeProblem.tolerance > 0) ok = approxEqual(got, expected, arcadeProblem.tolerance);
    else ok = got === expected;

    if (!ok) {
      // Wrong:
      // - player slows a tiny bit (reduce target a bit)
      // - one random CPU gets a tiny boost
      const cpuPick = randInt(1, 4);
      targetsRef.current[cpuPick] = clamp(targetsRef.current[cpuPick] + 0.020, 0, 1);
      targetsRef.current[0] = clamp(targetsRef.current[0] - 0.012, 0, 1);

      // also reduce player “extra speed” a little so you feel it
      playerSpeedRef.current = clamp(playerSpeedRef.current - 0.002, -0.01, 0.02);

      setArcadeMsg(`Forkert. Rigtigt svar: ${String(expected)}${arcadeProblem.unit ? ` ${arcadeProblem.unit}` : ""}`);
      arcadeNextProblem();
      return;
    }

    // Correct:
    // - player gets a boost
    // - also give player a tiny “momentum” so den føles som den galoperer mere
    setArcadeScore((s) => s + 1);

    const baseBoost = 0.035; // lidt lavere end før (fordi player også løber konstant)
    const timeBoost = arcadeTimeLeft > 40 ? 0.010 : arcadeTimeLeft > 20 ? 0.006 : 0.003;
    const gradeBoost = clamp((profile.grade - 1) * 0.0012, 0, 0.010);

    targetsRef.current[0] = clamp(targetsRef.current[0] + baseBoost + gradeBoost + timeBoost, 0, 1);

    // momentum: gør playerens konstante løb lidt hurtigere (men med loft)
    playerSpeedRef.current = clamp(playerSpeedRef.current + 0.0016, 0, 0.012);

    setArcadeMsg("Korrekt! BOOST! ⚡");
    arcadeNextProblem();

    if (targetsRef.current[0] >= finishLine) {
      setTimeout(() => endArcade(), 260);
    }
  }

  // ----------------- render helpers -----------------
  const daily = meta?.daily;
  const dailyProblem = daily?.problem;

  const horsesForCanvas = useMemo(() => {
    return ARCADE_HORSES.map((h, i) => ({ ...h, pos: positions[i] ?? 0.02 }));
  }, [ARCADE_HORSES, positions]);

  return (
    <div className={"min-h-screen text-white " + mainGradient}>
      <style>{`
        .pop { animation: pop 180ms ease-out; }
        @keyframes pop { 0%{transform:scale(.985)} 60%{transform:scale(1.03)} 100%{transform:scale(1)} }
        .shake { animation: shake 240ms ease-in-out; }
        @keyframes shake { 0%{transform:translateX(0)} 25%{transform:translateX(-6px)} 50%{transform:translateX(6px)} 75%{transform:translateX(-4px)} 100%{transform:translateX(0)} }
        .fadeUp { animation: fadeUp 240ms ease-out; }
        @keyframes fadeUp { from{opacity:0; transform:translateY(7px)} to{opacity:1; transform:translateY(0)} }
        .fadeSwap { animation: fadeSwap 140ms ease-out; }
        @keyframes fadeSwap { from{opacity:.35; transform:translateY(4px)} to{opacity:1; transform:translateY(0)} }
        .pulseBar { animation: pulseBar 700ms ease-in-out; }
        @keyframes pulseBar { 0%{filter:saturate(1)} 40%{filter:saturate(1.6)} 100%{filter:saturate(1)} }

        .clip-bolt { clip-path: polygon(45% 0, 70% 0, 55% 40%, 80% 40%, 35% 100%, 48% 58%, 25% 58%); }
        .clip-star { clip-path: polygon(50% 0%, 61% 36%, 98% 36%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 36%, 39% 36%); }
      `}</style>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 fadeUp">
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 shadow-xl px-5 py-3 backdrop-blur">
            <div className="font-extrabold">{toast}</div>
            <div className="text-sm text-white/70">Fortsæt — du er i flow</div>
          </div>
        </div>
      )}

      {levelUp && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/35 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950/55 shadow-2xl p-6 fadeUp backdrop-blur">
            <div className="text-sm font-semibold text-white/70">Level up</div>
            <div className="mt-1 text-3xl font-black tracking-tight">Level {levelUp.newLevel}</div>
            <div className="mt-2 text-white/80">Opgaverne bliver gradvist sværere: større tal, flere trin og sværere typer.</div>
            <button
              onClick={() => setLevelUp(null)}
              className="mt-4 w-full rounded-2xl px-4 py-3 font-extrabold text-white shadow-lg bg-white/10 border border-white/10 hover:bg-white/15 transition"
            >
              Fortsæt
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-5">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-4xl font-black tracking-tight">FOKUS</h1>
              <p className="mt-2 text-white/75">{slogan}</p>
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-amber-500/15 via-orange-600/10 to-rose-600/15 px-4 py-2 shadow-sm">
                <div className="text-xs text-white/70">Daily streak</div>
                <div className="text-xl font-black leading-tight">{dailyStreak} 🔥</div>
                <div className="text-[11px] text-white/60">{streakIsHot ? "Hold den kørende i morgen" : "Lav daily i dag for at starte"}</div>
              </div>

              <Chip>Level {game.level}/10</Chip>
              <Chip>{game.points} point</Chip>
              <Chip>Streak {game.streak}</Chip>
            </div>
          </div>

          {/* ✅ KUN 1 progress bar (Dagens mål) */}
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm text-white/85">
                Dagens mål: <span className="font-extrabold">{done}/{goal}</span>
                <span className="ml-2 text-white/60">({clamp(goalPct, 0, 100)}%)</span>
                <span className="ml-2 text-white/50 text-xs">Daily tæller også</span>
              </div>
              <div className="text-xs text-white/60">Korrekte: {game.correct} • Forkerte: {game.wrong}</div>
            </div>

            <div className="mt-2 h-3 w-full rounded-full bg-white/10 overflow-hidden border border-white/10">
              <div
                className={"h-full bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 transition-all " + (pulseBar ? "pulseBar" : "")}
                style={{ width: `${clamp(goalPct, 0, 100)}%` }}
              />
            </div>
          </div>
        </header>

        <div className="mb-4 flex gap-2 flex-wrap">
          <TabButton active={ui.tab === "tasks"} label="Opgaver" onClick={() => setTab("tasks")} />
          <TabButton active={ui.tab === "arcade"} label="Arcade" onClick={() => setTab("arcade")} />
          <TabButton active={ui.tab === "profile"} label="Profil" onClick={() => setTab("profile")} />
          <TabButton active={ui.tab === "badges"} label="Badges" onClick={() => setTab("badges")} />
        </div>

        {/* ---------------- OPGAVER TAB ---------------- */}
        {ui.tab === "tasks" && (
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
                        <div className={"mt-3 rounded-2xl p-4 border shadow-sm fadeUp " + (dailyFeedback.type === "ok" ? "bg-emerald-500/10 border-emerald-300/20" : "bg-rose-500/10 border-rose-300/20")}>
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

                  <SmallBtn onClick={() => setTab("arcade")} className="w-full">
                    Prøv Arcade (heste-løb)
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

              {/* Emner helt nederst i boblen */}
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
                <div className={"mt-4 rounded-3xl p-5 border shadow-sm fadeUp " + (feedback.type === "ok" ? "bg-emerald-500/10 border-emerald-300/20" : "bg-rose-500/10 border-rose-300/20")}>
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
        )}

        {/* ---------------- ARCADE TAB (Heste-spil) ---------------- */}
        {ui.tab === "arcade" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel className="lg:col-span-1">
              <div className="text-lg font-extrabold">Arcade: Heste-løb</div>
              <div className="mt-2 text-sm text-white/75">
                Dumt-nemt koncept:
                <div className="mt-2 space-y-1 text-white/70">
                  <div>• Svar rigtigt → din hest får boost</div>
                  <div>• Din hest galoperer også lidt hele tiden</div>
                  <div>• 60 sekunder → få så mange rigtige som muligt</div>
                  <div>• 4 CPU-heste med forskelligt tempo</div>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  <div className="text-xs text-white/70">Tid</div>
                  <div className="text-2xl font-black">{Math.max(0, arcadeTimeLeft)}s</div>
                </div>
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
                    onClick={endArcade}
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

              <div className="mt-4 text-xs text-white/60">
                Tip: Arcade-spørgsmål er nu lidt nemmere end træning (for at boost føles fedt).
              </div>
            </Panel>

            <Panel className="lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <Chip>Race</Chip>
                  <Chip>Klassetrin {profile.grade}.</Chip>
                  <Chip>Emner: {chosenTopicsText}</Chip>
                </div>
                <div className="flex gap-2">
                  <SmallBtn
                    onClick={() => {
                      targetsRef.current = ARCADE_HORSES.map(() => 0.02);
                      setPositions(ARCADE_HORSES.map(() => 0.02));
                      setArcadeMsg(null);
                      setArcadeScore(0);
                      setArcadeTimeLeft(60);
                      setArcadeInput("");
                      setArcadeProblem(generateArcadeProblem(game.level, profile.grade, game.allowedTopics));
                      playerSpeedRef.current = 0;
                    }}
                    disabled={arcadeRunning}
                    title={arcadeRunning ? "Stop først, før du resetter" : "Reset"}
                  >
                    Reset
                  </SmallBtn>
                </div>
              </div>

              <div className="mt-4">
                <ArcadeHorseRaceCanvas horses={horsesForCanvas} finishLine={finishLine} />
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
                      className={"mt-1 w-full rounded-2xl border border-white/10 px-4 py-3 text-lg bg-slate-950/40 shadow-sm focus:outline-none focus:ring-2 text-white disabled:opacity-60 " + theme.ring}
                    />
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <SmallBtn onClick={() => setArcadeInput("")} disabled={!arcadeRunning}>
                        Ryd
                      </SmallBtn>
                      <SmallBtn onClick={() => setArcadeMsg(null)} disabled={!arcadeRunning}>
                        Skjul status
                      </SmallBtn>
                    </div>
                  </div>

                  <button
                    onClick={checkArcade}
                    disabled={!arcadeRunning}
                    className={
                      "rounded-2xl px-6 py-3 text-lg font-extrabold text-white shadow-lg " +
                      "bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 " +
                      "hover:opacity-95 hover:scale-[1.01] active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
                    }
                  >
                    BOOST!
                  </button>
                </div>

                <div className="mt-3 text-xs text-white/60">Målstregen er den lyse lodrette streg. Kom først over 🏁</div>
              </div>
            </Panel>
          </div>
        )}

        {/* ---------------- PROFIL TAB ---------------- */}
        {ui.tab === "profile" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel className="lg:col-span-1">
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-extrabold text-white">Profil</div>
                <Chip className="text-xs">Gemmes</Chip>
              </div>

              <div className="mt-3">
                <AvatarPreview name={profile.name} avatarKey={profile.avatarKey} theme={theme} />
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-sm text-white/80">Navn</label>
                  <input
                    value={profile.name}
                    onChange={(e) => setProfile({ name: e.target.value })}
                    placeholder="Skriv dit navn"
                    className={"mt-1 w-full rounded-2xl border border-white/10 px-4 py-3 bg-slate-950/40 shadow-sm focus:outline-none focus:ring-2 text-white " + theme.ring}
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
              <div className="mt-2 text-white/80">Mini games bruger også dit klassetrin + emner. Så når du ændrer klassetrin her, bliver Arcade også justeret.</div>
              <div className="mt-4 text-xs text-white/60">Hvis du vil: næste mini game kan være “Meteor-forsvar” (tal falder ned, du skal svare hurtigt).</div>
            </Panel>
          </div>
        )}

        {/* ---------------- BADGES TAB ---------------- */}
        {ui.tab === "badges" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel className="lg:col-span-1">
              <div className="text-lg font-extrabold text-white">Overblik</div>
              <div className="mt-3 grid gap-2">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  <div className="text-xs text-white/70">Badges</div>
                  <div className="text-2xl font-black">{unlockedAch.size}/{ACH.length}</div>
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
                  <div className="text-xs text-white/70">Arcade bedste score</div>
                  <div className="text-2xl font-black">{arcade?.bestScore ?? 0}</div>
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
                          {on ? <span className="text-emerald-200 font-bold">UNLOCKED</span> : <span className="text-white/60 font-bold">🔒 LOCKED</span>}
                        </div>
                      </div>
                      <div className={"text-sm mt-1 " + (on ? "text-emerald-100/90" : "text-white/70")}>{a.desc}</div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}