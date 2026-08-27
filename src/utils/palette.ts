import { argbFromHex, hctFromInt, hctToHex, labFromArgb } from "./hct.js";

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

export interface HctTriplet {
  hue: number;
  chroma: number;
  tone: number;
}

interface PiecewisePoint {
  x: number;
  y: number;
}

interface FamilyMeta {
  bezier: [number, number, number, number];
  toneRange: [number, number];
  piecewise?: PiecewisePoint[];
  piecewiseBase?: number;
}

export interface BrandPalette {
  lightPalette: string[];
  lightBrandIdx: number;
  darkPalette: string[];
  darkBrandIdx: number;
}

// 色族元数据（sr）与功能色映射（fr）

const sr: Record<string, FamilyMeta> = {
  Blue: { bezier: [0.28, 0.22, 0.86, 0.98], toneRange: [12, 96] },
  Cyan: { bezier: [0.63, 0.58, 0.79, 0.92], toneRange: [13, 96] },
  Green: {
    bezier: [0.85, 0.82, 0.84, 1],
    toneRange: [12, 96],
    piecewise: [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 6, y: -5 },
      { x: 7, y: -7 },
      { x: 8, y: -18 },
      { x: 9, y: -30 },
      { x: 10, y: -40 },
    ],
    piecewiseBase: 55,
  },
  Lemon: {
    bezier: [0.62, 0.51, 0.39, 0.82],
    toneRange: [12, 98],
    piecewise: [
      { x: 0, y: 0 },
      { x: 7, y: 0 },
      { x: 8, y: -10 },
      { x: 9, y: -25 },
      { x: 10, y: -50 },
    ],
    piecewiseBase: 73,
  },
  Yellow: { bezier: [0.3, 0.25, 0.5, 0.8], toneRange: [12, 97] },
  Orange: {
    bezier: [0.31, 0.2, 0.7, 0.83],
    toneRange: [13, 96],
    piecewise: [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 7, y: -11 },
      { x: 8, y: -2 },
      { x: 9, y: 0 },
      { x: 10, y: 0 },
    ],
    piecewiseBase: 59,
  },
  Red: {
    bezier: [0.31, 0.26, 0.7, 0.83],
    toneRange: [12, 96],
    piecewise: [
      { x: 0, y: -12 },
      { x: 2, y: -12 },
      { x: 3, y: -11 },
      { x: 4, y: -7 },
      { x: 5, y: -2 },
      { x: 6, y: -6 },
      { x: 7, y: 0 },
      { x: 10, y: 0 },
    ],
    piecewiseBase: 72,
  },
  Pink: {
    bezier: [0.55, 0.45, 0.86, 0.99],
    toneRange: [12, 96],
    piecewise: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: -12 },
      { x: 3, y: -11 },
      { x: 4, y: -7 },
      { x: 5, y: -2 },
      { x: 6, y: 0 },
      { x: 10, y: 0 },
    ],
    piecewiseBase: 75,
  },
  Purple: { bezier: [0.25, 0.13, 0.71, 0.88], toneRange: [10, 96] },
  Lime: {
    bezier: [0.75, 0.68, 0.84, 0.99],
    toneRange: [12, 97],
    piecewise: [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 6, y: -5 },
      { x: 7, y: -7 },
      { x: 8, y: -18 },
      { x: 9, y: -30 },
      { x: 10, y: -40 },
    ],
    piecewiseBase: 55,
  },
  Mint: {
    bezier: [0.46, 0.4, 0.84, 0.96],
    toneRange: [13, 97],
    piecewise: [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 6, y: -5 },
      { x: 7, y: -7 },
      { x: 8, y: -18 },
      { x: 9, y: -30 },
      { x: 10, y: -40 },
    ],
    piecewiseBase: 55,
  },
};

/** 功能色 → 归一化色（fr）：部分品牌色映射到规范基准色再生成色阶 */
const fr: Record<string, string> = {
  "#2ba471": "#00a870",
  "#d54941": "#d94941",
  "#43c0c6": "#00c8cf",
  "#8eba36": "#81b305",
  "#00c3c3": "#1fffff",
};

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

export const TENCENT_BLUE = "#0052D9";

export const TENCENT_BLUE_DARK_PALETTE = [
  "#1b2f51",
  "#173463",
  "#143975",
  "#103d88",
  "#0d429a",
  "#054bbe",
  "#2667d4",
  "#4582e6",
  "#699ef5",
  "#96bbf8",
];

/** 中性灰主色 */
export const DEFAULT_GRAY_MAIN = "#dbdde1";

/** 未关联主题色时的中性基色（纯中性灰） */
export const NEUTRAL_GRAY_BASE = "#dadada";

// ---------------------------------------------------------------------------
// 基础工具
// ---------------------------------------------------------------------------

/** 3 位小数舍入 */
function round3(r: number, e = 3): number {
  return Math.round(r * Math.pow(10, e)) / Math.pow(10, e);
}

/** HEX → HCT */
function lr(hex: string): HctTriplet {
  return hctFromInt(argbFromHex(hex));
}

/** HCT → HEX */
function ir(t: HctTriplet): string {
  return hctToHex(t.hue, t.chroma, t.tone);
}

const WHITE_HCT = lr("#ffffff");

function isWhite(t: HctTriplet): boolean {
  return (
    t.hue === WHITE_HCT.hue &&
    t.chroma === WHITE_HCT.chroma &&
    t.tone === WHITE_HCT.tone
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").toLowerCase();
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** RGB 加权混合（复刻 chroma-js average(..., 'rgb', [wA, wB])，权重已归一） */
function averageRgb(
  hexA: string,
  hexB: string,
  wA: number,
  wB: number,
): string {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  const sum = wA + wB;
  return rgbToHex(
    (wA * r1 + wB * r2) / sum,
    (wA * g1 + wB * g2) / sum,
    (wA * b1 + wB * b2) / sum,
  );
}

// CIEDE2000（主色锚定用最小色差）

function ciede2000(labA: number[], labB: number[]): number {
  const deg2rad = (r: number) => 0.017453292519943295 * r;
  const rad2deg = (r: number) => 57.29577951308232 * r;
  const o = labA[0],
    a = labA[1],
    l = labA[2];
  const i = labB[0],
    c = labB[1],
    u = labB[2];
  const s = (o + i) / 2;
  const f = (Math.sqrt(a * a + l * l) + Math.sqrt(c * c + u * u)) / 2;
  const h =
    (1 - Math.sqrt(Math.pow(f, 7) / (Math.pow(f, 7) + Math.pow(25, 7)))) / 2;
  const p = a * (1 + h);
  const m = c * (1 + h);
  const v = Math.sqrt(p * p + l * l);
  const b = Math.sqrt(m * m + u * u);
  const y = (v + b) / 2;
  let g = rad2deg(Math.atan2(l, p));
  if (g < 0) g += 360;
  let d = rad2deg(Math.atan2(u, m));
  if (d < 0) d += 360;
  const x = Math.abs(g - d) > 180 ? (g + d + 360) / 2 : (g + d) / 2;
  const M =
    1 -
    0.17 * Math.cos(deg2rad(x - 30)) +
    0.24 * Math.cos(deg2rad(2 * x)) +
    0.32 * Math.cos(deg2rad(3 * x + 6)) -
    0.2 * Math.cos(deg2rad(4 * x - 63));
  let w = d - g;
  if (Math.abs(w) > 180) {
    if (d <= g) w += 360;
    else w -= 360;
  }
  const j = i - o;
  const A = b - v;
  w = 2 * Math.sqrt(v * b) * Math.sin(deg2rad(w) / 2);
  const C =
    1 + (0.015 * Math.pow(s - 50, 2)) / Math.sqrt(20 + Math.pow(s - 50, 2));
  const k = 1 + 0.045 * y;
  const R = 1 + 0.015 * y * M;
  const Sl = 30 * Math.exp(-Math.pow((x - 275) / 25, 2));
  const B =
    -(2 * Math.sqrt(Math.pow(y, 7) / (Math.pow(y, 7) + Math.pow(25, 7)))) *
    Math.sin(2 * deg2rad(Sl));
  return Math.sqrt(
    Math.pow(j / (1 * C), 2) +
      Math.pow(A / (1 * k), 2) +
      Math.pow(w / (1 * R), 2) +
      B * (A / (1 * k)) * (w / (1 * R)),
  );
}

// ---------------------------------------------------------------------------
// bezier-easing（@2.1.0，逐字节复刻）
// ---------------------------------------------------------------------------

function bezierEasing(
  mX1: number,
  mY1: number,
  mX2: number,
  mY2: number,
): (x: number) => number {
  const NEWTON_ITERATIONS = 4;
  const NEWTON_MIN_SLOPE = 0.001;
  const SUBDIVISION_PRECISION = 0.0000001;
  const SUBDIVISION_MAX_ITERATIONS = 10;
  const kSplineTableSize = 11;
  const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

  const A = (aA1: number, aA2: number) => 1.0 - 3.0 * aA2 + 3.0 * aA1;
  const B = (aA1: number, aA2: number) => 3.0 * aA2 - 6.0 * aA1;
  const C = (aA1: number) => 3.0 * aA1;

  const calcBezier = (aT: number, aA1: number, aA2: number) =>
    ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
  const getSlope = (aT: number, aA1: number, aA2: number) =>
    3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);

  function binarySubdivide(aX: number, aA: number, aB: number): number {
    let currentX: number;
    let currentT: number;
    let i = 0;
    do {
      currentT = aA + (aB - aA) / 2.0;
      currentX = calcBezier(currentT, mX1, mX2) - aX;
      if (currentX > 0.0) {
        aB = currentT;
      } else {
        aA = currentT;
      }
    } while (
      Math.abs(currentX) > SUBDIVISION_PRECISION &&
      ++i < SUBDIVISION_MAX_ITERATIONS
    );
    return currentT;
  }

  function newtonRaphsonIterate(aX: number, aGuessT: number): number {
    for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
      const currentSlope = getSlope(aGuessT, mX1, mX2);
      if (currentSlope === 0.0) return aGuessT;
      const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
  }

  if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
    throw new Error("bezier x values must be in [0, 1] range");
  }
  if (mX1 === mY1 && mX2 === mY2) {
    return (x: number) => x;
  }

  const sampleValues = new Array<number>(kSplineTableSize);
  for (let i = 0; i < kSplineTableSize; ++i) {
    sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
  }

  function getTForX(aX: number): number {
    let intervalStart = 0.0;
    let currentSample = 1;
    const lastSample = kSplineTableSize - 1;
    for (
      ;
      currentSample !== lastSample && sampleValues[currentSample] <= aX;
      ++currentSample
    ) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;
    const dist =
      (aX - sampleValues[currentSample]) /
      (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    const guessForT = intervalStart + dist * kSampleStepSize;
    const initialSlope = getSlope(guessForT, mX1, mX2);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(aX, guessForT);
    } else if (initialSlope === 0.0) {
      return guessForT;
    } else {
      return binarySubdivide(
        aX,
        intervalStart,
        intervalStart + kSampleStepSize,
      );
    }
  }

  return function (x: number): number {
    if (x === 0) return 0;
    if (x === 1) return 1;
    return calcBezier(getTForX(x), mY1, mY2);
  };
}

// ---------------------------------------------------------------------------
// 色相 → 色族
// ---------------------------------------------------------------------------

function hueToFamily(hue: number): string {
  const e = ((hue % 360) + 360) % 360;
  if (e >= 10 && e < 30) return "Red";
  if (e >= 30 && e < 60) return "Orange";
  if (e >= 60 && e < 102) return "Yellow";
  if (e >= 102 && e < 115) return "Lemon";
  if (e >= 115 && e < 130) return "Lime";
  if (e >= 130 && e < 180) return "Green";
  if (e >= 180 && e < 210) return "Mint";
  if (e >= 210 && e < 240) return "Cyan";
  if (e >= 240 && e < 285) return "Blue";
  if (e >= 285 && e < 325) return "Purple";
  return "Pink";
}

// ---------------------------------------------------------------------------
// 品牌/功能色阶生成（pr / ur）
// ---------------------------------------------------------------------------

/**
 * tone 序列：沿 bezier 缓动从 toneRange[0] 向 [1] 采样，降序（浅端 tone 高）。
 */
function getTonesByShrinkCurve(
  range: [number, number],
  bezierMeta: [number, number, number, number],
  count: number,
): number[] {
  const [t, n] = range;
  const [a, l, i, c] = bezierMeta;
  const easing = bezierEasing(a, l, i, c);
  const h = Math.abs(n - t);
  const p = 1 / (count - 1);
  const tones: number[] = [];
  try {
    for (let m = 0; m < count; m++) {
      const v = easing(m * p) * h;
      if (t + v > n) break;
      tones.unshift(round3(t + v));
    }
  } catch {
    /* noop */
  }
  if (tones.length === 0) {
    // 线性兜底
    const y = (n - t) / (count - 1);
    for (let g = t; g <= n; g += y) tones.push(g);
  }
  return tones;
}

/**
 * 分段色度（ur）：无 piecewise 直接填充 chroma；否则按分段公式逐档调整，
 * 反向（unshift）配对，浅端 tone 配大调整值。
 */
function getChromas(
  piecewise: PiecewisePoint[] | undefined,
  piecewiseBase: number | undefined,
  chroma: number,
  count: number,
): number[] {
  if (!piecewise || piecewise.length < 2) {
    return new Array(count).fill(round3(chroma));
  }
  const segs: {
    range: [number, number];
    base: number;
    k: number;
    formula: (pct: number, chr: number) => number;
  }[] = [];
  for (let o = 1; o < piecewise.length; o++) {
    const a = piecewise[o - 1];
    const c = piecewise[o];
    const k = (c.y - a.y) / (c.x - a.x);
    const range: [number, number] = [a.x, c.x];
    const base = a.y;
    segs.push({
      range,
      base,
      k,
      formula: (pct: number, chr: number) => {
        const adj = base + (pct - range[0]) * k;
        const o2 = chr / (piecewiseBase as number);
        return Math.min(100, Math.max(0, chr + adj * o2));
      },
    });
  }
  const result: number[] = [];
  for (let i = 1; i <= count; i++) {
    const pct = (10 * Math.min(i, count)) / count;
    const seg = segs.find((s) => s.range[0] <= pct && pct <= s.range[1]);
    const val = seg ? seg.formula(pct, chroma) : chroma;
    result.unshift(round3(val));
  }
  return result;
}

/**
 * 品牌/功能色阶核心生成。
 * 返回 hex 色阶（浅端在前）与动态主色下标 primary（0 基）。
 */
function pr(
  hex: string,
  step: number,
  remainInput = false,
): { colors: string[]; primary: number } {
  const input = hex.toLowerCase();
  const cInput = lr(input);
  const mapped = fr[input] || input;
  const s = lr(mapped);
  const family = sr[hueToFamily(s.hue)];

  const tones = getTonesByShrinkCurve(family.toneRange, family.bezier, step);
  const chromas = isWhite(s)
    ? new Array(step).fill(0)
    : getChromas(family.piecewise, family.piecewiseBase, s.chroma, step);

  const colorsHct: HctTriplet[] = tones.map((tone, idx) => ({
    hue: s.hue,
    chroma: typeof chromas[idx] === "number" ? chromas[idx] : s.chroma,
    tone,
  }));

  // 主色：LAB 距离（CIEDE2000）最小
  const inputLab = labFromArgb(argbFromHex(input));
  let best = -1;
  let bestD = Infinity;
  colorsHct.forEach((c, idx) => {
    const labC = labFromArgb(argbFromHex(ir(c)));
    const d = ciede2000(labC, inputLab);
    if (d < bestD) {
      bestD = d;
      best = idx;
    }
  });

  let finalHct = colorsHct;
  const remain =
    s.tone > family.toneRange[1] || s.tone < family.toneRange[0] || remainInput;
  if (remain) {
    finalHct = colorsHct.slice();
    finalHct[best] = cInput;
  }

  return { colors: finalHct.map(ir), primary: best };
}

// ---------------------------------------------------------------------------
// 中性色阶（mr / getNeutralColor）
// ---------------------------------------------------------------------------

/** 14 档中性 tone 序列 */
const NEUTRAL_TONES = [96, 94, 92, 88, 80, 68, 58, 50, 40, 32, 24, 18, 14, 8];

/**
 * 中性色阶：以输入色的 hue/chroma 在 14 档 tone 上展开。
 * 蓝特例：e[8] 用其自身 tone。
 */
function mr(hex: string): string[] {
  const e = NEUTRAL_TONES.slice();
  const t = lr(hex);
  if (hex.toLowerCase() === "#0052d9") e[8] = t.tone;
  return e.map((tone) => ir({ hue: t.hue, chroma: t.chroma, tone }));
}

/**
 * 关联主题色的中性灰：mr(hex) 与 mr('#000000')
 * 按 RGB 权重混合；hue∈[102,210) → [0.08,0.92]，否则 [0.12,0.88]。
 */
function getNeutralColor(hex: string): string[] {
  const e = mr(hex);
  const t = mr("#000000");
  return e.map((r, idx) => {
    const n = lr(r);
    const weights = n.hue >= 102 && n.hue < 210 ? [0.08, 0.92] : [0.12, 0.88];
    return averageRgb(r, t[idx], weights[0], weights[1]);
  });
}

// 顶层编排

/**
 * 品牌色阶编排。
 * 深色品牌色阶 = 浅色 `.reverse()`（蓝特例用固定深蓝）。
 * 主色动态锚定：lightBrandIdx = 蓝?7 : primary+1；darkBrandIdx = 蓝?8 : 6。
 */
export function generateBrandPalette(
  hex: string,
  remainInput = true,
): BrandPalette {
  const lowCaseHex = hex.toLowerCase();
  const { colors, primary } = pr(lowCaseHex, 10, remainInput);

  const isDefaultBlue = lowCaseHex === TENCENT_BLUE.toLowerCase();
  const validPrimary =
    typeof primary === "number" && !isNaN(primary) ? primary : 6;

  const lightBrandIdx = isDefaultBlue ? 7 : validPrimary + 1;
  const lightPalette = [...colors];
  const darkPalette = isDefaultBlue
    ? [...TENCENT_BLUE_DARK_PALETTE]
    : [...colors].reverse();
  const darkBrandIdx = isDefaultBlue ? 8 : 6;

  return { lightPalette, lightBrandIdx, darkPalette, darkBrandIdx };
}

/** 功能色阶，用于 success/warning/error 等 */
export function generateFunctionalPalette(
  hex: string,
  step = 10,
): { lightPalette: string[]; darkPalette: string[] } {
  const lowCaseHex = hex.toLowerCase();
  const { colors } = pr(lowCaseHex, step, false);
  const lightPalette = [...colors];
  const darkPalette = [...colors].reverse();
  return { lightPalette, darkPalette };
}

/**
 * 中性色阶。
 * 关联主题色 → getNeutralColor(hex)（带主色相的中性灰）；
 * 否则 → 以中性基色 NEUTRAL_GRAY_BASE 生成标准灰阶。
 */
export function generateNeutralPalette(
  hex: string,
  isRelatedTheme = false,
): string[] {
  if (isRelatedTheme) {
    return getNeutralColor(hex);
  }
  return generateFunctionalPalette(hex, 14).lightPalette;
}

/**
 * 品牌色别名映射。
 * 返回 1 基索引（对应色阶 1..10）。web 端 focus=2（移动端为 1）。
 * light-hover 始终为 light+1 = 2。
 */
export function generateBrandTokenMap(
  brandIdx: number,
): Record<string, number> {
  const hoverIdx = brandIdx - 1;
  const activeIdx = brandIdx > 8 ? brandIdx : brandIdx + 1;
  return {
    light: 1,
    focus: 2,
    disabled: 3,
    hover: hoverIdx,
    "": brandIdx,
    active: activeIdx,
    "light-hover": 2,
  };
}
