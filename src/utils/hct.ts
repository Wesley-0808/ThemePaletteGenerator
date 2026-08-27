/**
 * 无依赖 HCT（Hue-Chroma-Tone）色彩空间实现。
 * 算法参照 Google `@material/material-color-utilities@0.1.2`（Apache-2.0）的 CAM16 + HCT 实现，改写为本项目可用的 TypeScript。
 */

// ---------------------------------------------------------------------------
// 数学工具
// ---------------------------------------------------------------------------

export function signum(num: number): number {
  if (num < 0) return -1;
  if (num === 0) return 0;
  return 1;
}

export function lerp(start: number, stop: number, amount: number): number {
  return (1 - amount) * start + amount * stop;
}

export function clampInt(min: number, max: number, input: number): number {
  if (input < min) return min;
  if (input > max) return max;
  return input;
}

export function clampDouble(min: number, max: number, input: number): number {
  if (input < min) return min;
  if (input > max) return max;
  return input;
}

export function sanitizeDegreesDouble(degrees: number): number {
  let d = degrees % 360;
  if (d < 0) d += 360;
  return d;
}

export function differenceDegrees(a: number, b: number): number {
  return 180 - Math.abs(Math.abs(a - b) - 180);
}

export function matrixMultiply(row: number[], matrix: number[][]): number[] {
  const a =
    row[0] * matrix[0][0] + row[1] * matrix[0][1] + row[2] * matrix[0][2];
  const b =
    row[0] * matrix[1][0] + row[1] * matrix[1][1] + row[2] * matrix[1][2];
  const c =
    row[0] * matrix[2][0] + row[1] * matrix[2][1] + row[2] * matrix[2][2];
  return [a, b, c];
}

// ---------------------------------------------------------------------------
// 颜色工具
// ---------------------------------------------------------------------------

const SRGB_TO_XYZ = [
  [0.41233895, 0.35762064, 0.18051042],
  [0.2126, 0.7152, 0.0722],
  [0.01932141, 0.11916382, 0.95034478],
];

const XYZ_TO_SRGB = [
  [3.2413774792388685, -1.5376652402851851, -0.49885366846268053],
  [-0.9691452513005321, 1.8758853451067872, 0.04156585616912061],
  [0.05562093689691305, -0.20395524564742123, 1.0571799111220335],
];

const WHITE_POINT_D65: [number, number, number] = [95.047, 100.0, 108.883];

export function whitePointD65(): [number, number, number] {
  return WHITE_POINT_D65;
}

export function argbFromRgb(red: number, green: number, blue: number): number {
  return (
    ((255 << 24) |
      ((red & 255) << 16) |
      ((green & 255) << 8) |
      (blue & 255)) >>>
    0
  );
}

export function alphaFromArgb(argb: number): number {
  return (argb >> 24) & 255;
}
export function redFromArgb(argb: number): number {
  return (argb >> 16) & 255;
}
export function greenFromArgb(argb: number): number {
  return (argb >> 8) & 255;
}
export function blueFromArgb(argb: number): number {
  return argb & 255;
}

export function linearized(rgbComponent: number): number {
  const normalized = rgbComponent / 255.0;
  if (normalized <= 0.040449936) {
    return (normalized / 12.92) * 100.0;
  }
  return Math.pow((normalized + 0.055) / 1.055, 2.4) * 100.0;
}

export function delinearized(rgbComponent: number): number {
  const normalized = rgbComponent / 100.0;
  let delinearized = 0.0;
  if (normalized <= 0.0031308) {
    delinearized = normalized * 12.92;
  } else {
    delinearized = 1.055 * Math.pow(normalized, 1.0 / 2.4) - 0.055;
  }
  return clampInt(0, 255, Math.round(delinearized * 255.0));
}

export function argbFromXyz(x: number, y: number, z: number): number {
  const matrix = XYZ_TO_SRGB;
  const linearR = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z;
  const linearG = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z;
  const linearB = matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z;
  return argbFromRgb(
    delinearized(linearR),
    delinearized(linearG),
    delinearized(linearB),
  );
}

export function xyzFromArgb(argb: number): [number, number, number] {
  const r = linearized(redFromArgb(argb));
  const g = linearized(greenFromArgb(argb));
  const b = linearized(blueFromArgb(argb));
  return matrixMultiply([r, g, b], SRGB_TO_XYZ) as [number, number, number];
}

export function argbFromLstar(lstar: number): number {
  const fy = (lstar + 16.0) / 116.0;
  const fz = fy;
  const fx = fy;
  const kappa = 24389.0 / 27.0;
  const epsilon = 216.0 / 24389.0;
  const lExceedsEpsilonKappa = lstar > 8.0;
  const y = lExceedsEpsilonKappa ? fy * fy * fy : lstar / kappa;
  const cubeExceedEpsilon = fy * fy * fy > epsilon;
  const x = cubeExceedEpsilon ? fx * fx * fx : lstar / kappa;
  const z = cubeExceedEpsilon ? fz * fz * fz : lstar / kappa;
  const whitePoint = WHITE_POINT_D65;
  return argbFromXyz(x * whitePoint[0], y * whitePoint[1], z * whitePoint[2]);
}

export function lstarFromArgb(argb: number): number {
  const y = xyzFromArgb(argb)[1] / 100.0;
  const e = 216.0 / 24389.0;
  if (y <= e) {
    return (24389.0 / 27.0) * y;
  }
  const yIntermediate = Math.pow(y, 1.0 / 3.0);
  return 116.0 * yIntermediate - 16.0;
}

export function yFromLstar(lstar: number): number {
  const ke = 8.0;
  if (lstar > ke) {
    return Math.pow((lstar + 16.0) / 116.0, 3.0) * 100.0;
  }
  return (lstar / (24389.0 / 27.0)) * 100.0;
}

function labF(t: number): number {
  const e = 216.0 / 24389.0;
  const kappa = 24389.0 / 27.0;
  if (t > e) return Math.pow(t, 1.0 / 3.0);
  return (kappa * t + 16) / 116;
}

/** ARGB → CIE L*a*b*（用于主色锚定的最小距离比较，与 tvision-color 一致用 CIE76） */
export function labFromArgb(argb: number): [number, number, number] {
  const [linearR, linearG, linearB] = [
    linearized(redFromArgb(argb)),
    linearized(greenFromArgb(argb)),
    linearized(blueFromArgb(argb)),
  ];
  const matrix = SRGB_TO_XYZ;
  const x =
    matrix[0][0] * linearR + matrix[0][1] * linearG + matrix[0][2] * linearB;
  const y =
    matrix[1][0] * linearR + matrix[1][1] * linearG + matrix[1][2] * linearB;
  const z =
    matrix[2][0] * linearR + matrix[2][1] * linearG + matrix[2][2] * linearB;
  const whitePoint = WHITE_POINT_D65;
  const fx = labF(x / whitePoint[0]);
  const fy = labF(y / whitePoint[1]);
  const fz = labF(z / whitePoint[2]);
  const l = 116.0 * fy - 16;
  const a = 500.0 * (fx - fy);
  const b = 200.0 * (fy - fz);
  return [l, a, b];
}

/** 两色在 L*a*b* 下的 CIE76 距离 */
export function labDistance(argbA: number, argbB: number): number {
  const [l1, a1, b1] = labFromArgb(argbA);
  const [l2, a2, b2] = labFromArgb(argbB);
  const dl = l1 - l2;
  const da = a1 - a2;
  const db = b1 - b2;
  return Math.sqrt(dl * dl + da * da + db * db);
}

// ---------------------------------------------------------------------------
// ViewingConditions（sRGB 默认观察条件）
// ---------------------------------------------------------------------------

export class ViewingConditions {
  static DEFAULT: ViewingConditions;
  n: number;
  aw: number;
  nbb: number;
  ncb: number;
  c: number;
  nc: number;
  rgbD: number[];
  fl: number;
  fLRoot: number;
  z: number;

  constructor(
    n: number,
    aw: number,
    nbb: number,
    ncb: number,
    c: number,
    nc: number,
    rgbD: number[],
    fl: number,
    fLRoot: number,
    z: number,
  ) {
    this.n = n;
    this.aw = aw;
    this.nbb = nbb;
    this.ncb = ncb;
    this.c = c;
    this.nc = nc;
    this.rgbD = rgbD;
    this.fl = fl;
    this.fLRoot = fLRoot;
    this.z = z;
  }

  static make(
    whitePoint: [number, number, number] = whitePointD65(),
    adaptingLuminance = ((200.0 / Math.PI) * yFromLstar(50.0)) / 100.0,
    backgroundLstar = 50.0,
    surround = 2.0,
    discountingIlluminant = false,
  ): ViewingConditions {
    const xyz = whitePoint;
    const rW = xyz[0] * 0.401288 + xyz[1] * 0.650173 + xyz[2] * -0.051461;
    const gW = xyz[0] * -0.250268 + xyz[1] * 1.204414 + xyz[2] * 0.045854;
    const bW = xyz[0] * -0.002079 + xyz[1] * 0.048952 + xyz[2] * 0.953127;
    const f = 0.8 + surround / 10.0;
    const c =
      f >= 0.9
        ? lerp(0.59, 0.69, (f - 0.9) * 10.0)
        : lerp(0.525, 0.59, (f - 0.8) * 10.0);
    let d = discountingIlluminant
      ? 1.0
      : f * (1.0 - (1.0 / 3.6) * Math.exp((-adaptingLuminance - 42.0) / 92.0));
    d = d > 1.0 ? 1.0 : d < 0.0 ? 0.0 : d;
    const nc = f;
    const rgbD = [
      d * (100.0 / rW) + 1.0 - d,
      d * (100.0 / gW) + 1.0 - d,
      d * (100.0 / bW) + 1.0 - d,
    ];
    const k = 1.0 / (5.0 * adaptingLuminance + 1.0);
    const k4 = k * k * k * k;
    const k4F = 1.0 - k4;
    const fl =
      k4 * adaptingLuminance +
      0.1 * k4F * k4F * Math.cbrt(5.0 * adaptingLuminance);
    const n = yFromLstar(backgroundLstar) / whitePoint[1];
    const z = 1.48 + Math.sqrt(n);
    const nbb = 0.725 / Math.pow(n, 0.2);
    const ncb = nbb;
    const rgbAFactors = [
      Math.pow((fl * rgbD[0] * rW) / 100.0, 0.42),
      Math.pow((fl * rgbD[1] * gW) / 100.0, 0.42),
      Math.pow((fl * rgbD[2] * bW) / 100.0, 0.42),
    ];
    const rgbA = [
      (400.0 * rgbAFactors[0]) / (rgbAFactors[0] + 27.13),
      (400.0 * rgbAFactors[1]) / (rgbAFactors[1] + 27.13),
      (400.0 * rgbAFactors[2]) / (rgbAFactors[2] + 27.13),
    ];
    const aw = (2.0 * rgbA[0] + rgbA[1] + 0.05 * rgbA[2]) * nbb;
    return new ViewingConditions(
      n,
      aw,
      nbb,
      ncb,
      c,
      nc,
      rgbD,
      fl,
      Math.pow(fl, 0.25),
      z,
    );
  }
}

ViewingConditions.DEFAULT = ViewingConditions.make();

// ---------------------------------------------------------------------------
// CAM16
// ---------------------------------------------------------------------------

export class Cam16 {
  hue: number;
  chroma: number;
  j: number;
  q: number;
  m: number;
  s: number;
  jstar: number;
  astar: number;
  bstar: number;

  constructor(
    hue: number,
    chroma: number,
    j: number,
    q: number,
    m: number,
    s: number,
    jstar: number,
    astar: number,
    bstar: number,
  ) {
    this.hue = hue;
    this.chroma = chroma;
    this.j = j;
    this.q = q;
    this.m = m;
    this.s = s;
    this.jstar = jstar;
    this.astar = astar;
    this.bstar = bstar;
  }

  static fromInt(argb: number): Cam16 {
    return Cam16.fromIntInViewingConditions(argb, ViewingConditions.DEFAULT);
  }

  static fromIntInViewingConditions(
    argb: number,
    vc: ViewingConditions,
  ): Cam16 {
    const red = (argb & 0x00ff0000) >> 16;
    const green = (argb & 0x0000ff00) >> 8;
    const blue = argb & 0x000000ff;
    const redL = linearized(red);
    const greenL = linearized(green);
    const blueL = linearized(blue);
    const x = 0.41233895 * redL + 0.35762064 * greenL + 0.18051042 * blueL;
    const y = 0.2126 * redL + 0.7152 * greenL + 0.0722 * blueL;
    const z = 0.01932141 * redL + 0.11916382 * greenL + 0.95034478 * blueL;
    const rC = 0.401288 * x + 0.650173 * y - 0.051461 * z;
    const gC = -0.250268 * x + 1.204414 * y + 0.045854 * z;
    const bC = -0.002079 * x + 0.048952 * y + 0.953127 * z;
    const rD = vc.rgbD[0] * rC;
    const gD = vc.rgbD[1] * gC;
    const bD = vc.rgbD[2] * bC;
    const rAF = Math.pow((vc.fl * Math.abs(rD)) / 100.0, 0.42);
    const gAF = Math.pow((vc.fl * Math.abs(gD)) / 100.0, 0.42);
    const bAF = Math.pow((vc.fl * Math.abs(bD)) / 100.0, 0.42);
    const rA = (signum(rD) * 400.0 * rAF) / (rAF + 27.13);
    const gA = (signum(gD) * 400.0 * gAF) / (gAF + 27.13);
    const bA = (signum(bD) * 400.0 * bAF) / (bAF + 27.13);
    const a = (11.0 * rA + -12.0 * gA + bA) / 11.0;
    const b = (rA + gA - 2.0 * bA) / 9.0;
    const u = (20.0 * rA + 20.0 * gA + 21.0 * bA) / 20.0;
    const p2 = (40.0 * rA + 20.0 * gA + bA) / 20.0;
    let atan2 = Math.atan2(b, a);
    const atanDegrees = (atan2 * 180.0) / Math.PI;
    const hue =
      atanDegrees < 0
        ? atanDegrees + 360.0
        : atanDegrees >= 360
          ? atanDegrees - 360.0
          : atanDegrees;
    const hueRadians = (hue * Math.PI) / 180.0;
    const ac = p2 * vc.nbb;
    const j = 100.0 * Math.pow(ac / vc.aw, vc.c * vc.z);
    const q = (4.0 / vc.c) * Math.sqrt(j / 100.0) * (vc.aw + 4.0) * vc.fLRoot;
    const huePrime = hue < 20.14 ? hue + 360 : hue;
    const eHue = 0.25 * (Math.cos((huePrime * Math.PI) / 180.0 + 2.0) + 3.8);
    const p1 = (50000.0 / 13.0) * eHue * vc.nc * vc.ncb;
    const t = (p1 * Math.sqrt(a * a + b * b)) / (u + 0.305);
    const alpha =
      Math.pow(t, 0.9) * Math.pow(1.64 - Math.pow(0.29, vc.n), 0.73);
    const c = alpha * Math.sqrt(j / 100.0);
    const m = c * vc.fLRoot;
    const s = 50.0 * Math.sqrt((alpha * vc.c) / (vc.aw + 4.0));
    const jstar = ((1.0 + 100.0 * 0.007) * j) / (1.0 + 0.007 * j);
    const mstar = (1.0 / 0.0228) * Math.log(1.0 + 0.0228 * m);
    const astar = mstar * Math.cos(hueRadians);
    const bstar = mstar * Math.sin(hueRadians);
    return new Cam16(hue, c, j, q, m, s, jstar, astar, bstar);
  }

  static fromJch(j: number, c: number, h: number): Cam16 {
    return Cam16.fromJchInViewingConditions(j, c, h, ViewingConditions.DEFAULT);
  }

  static fromJchInViewingConditions(
    j: number,
    c: number,
    h: number,
    vc: ViewingConditions,
  ): Cam16 {
    const q = (4.0 / vc.c) * Math.sqrt(j / 100.0) * (vc.aw + 4.0) * vc.fLRoot;
    const m = c * vc.fLRoot;
    const alpha = c / Math.sqrt(j / 100.0);
    const s = 50.0 * Math.sqrt((alpha * vc.c) / (vc.aw + 4.0));
    const hueRadians = (h * Math.PI) / 180.0;
    const jstar = ((1.0 + 100.0 * 0.007) * j) / (1.0 + 0.007 * j);
    const mstar = (1.0 / 0.0228) * Math.log(1.0 + 0.0228 * m);
    const astar = mstar * Math.cos(hueRadians);
    const bstar = mstar * Math.sin(hueRadians);
    return new Cam16(h, c, j, q, m, s, jstar, astar, bstar);
  }

  toInt(): number {
    return this.viewed(ViewingConditions.DEFAULT);
  }

  distance(other: Cam16): number {
    const dJ = this.jstar - other.jstar;
    const dA = this.astar - other.astar;
    const dB = this.bstar - other.bstar;
    const dEPrime = Math.sqrt(dJ * dJ + dA * dA + dB * dB);
    return 1.41 * Math.pow(dEPrime, 0.63);
  }

  viewed(vc: ViewingConditions): number {
    const alpha =
      this.chroma === 0.0 || this.j === 0.0
        ? 0.0
        : this.chroma / Math.sqrt(this.j / 100.0);
    const t = Math.pow(
      alpha / Math.pow(1.64 - Math.pow(0.29, vc.n), 0.73),
      1.0 / 0.9,
    );
    const hRad = (this.hue * Math.PI) / 180.0;
    const eHue = 0.25 * (Math.cos(hRad + 2.0) + 3.8);
    const ac = vc.aw * Math.pow(this.j / 100.0, 1.0 / vc.c / vc.z);
    const p1 = eHue * (50000.0 / 13.0) * vc.nc * vc.ncb;
    const p2 = ac / vc.nbb;
    const hSin = Math.sin(hRad);
    const hCos = Math.cos(hRad);
    const gamma =
      (23.0 * (p2 + 0.305) * t) /
      (23.0 * p1 + 11.0 * t * hCos + 108.0 * t * hSin);
    const a = gamma * hCos;
    const b = gamma * hSin;
    const rA = (460.0 * p2 + 451.0 * a + 288.0 * b) / 1403.0;
    const gA = (460.0 * p2 - 891.0 * a - 261.0 * b) / 1403.0;
    const bA = (460.0 * p2 - 220.0 * a - 6300.0 * b) / 1403.0;
    const rCBase = Math.max(0, (27.13 * Math.abs(rA)) / (400.0 - Math.abs(rA)));
    const rC = signum(rA) * (100.0 / vc.fl) * Math.pow(rCBase, 1.0 / 0.42);
    const gCBase = Math.max(0, (27.13 * Math.abs(gA)) / (400.0 - Math.abs(gA)));
    const gC = signum(gA) * (100.0 / vc.fl) * Math.pow(gCBase, 1.0 / 0.42);
    const bCBase = Math.max(0, (27.13 * Math.abs(bA)) / (400.0 - Math.abs(bA)));
    const bC = signum(bA) * (100.0 / vc.fl) * Math.pow(bCBase, 1.0 / 0.42);
    const rF = rC / vc.rgbD[0];
    const gF = gC / vc.rgbD[1];
    const bF = bC / vc.rgbD[2];
    const x = 1.86206786 * rF - 1.01125463 * gF + 0.14918677 * bF;
    const y = 0.38752654 * rF + 0.62144744 * gF - 0.00897398 * bF;
    const z = -0.0158415 * rF - 0.03412294 * gF + 1.04996444 * bF;
    return argbFromXyz(x, y, z);
  }
}

// ---------------------------------------------------------------------------
// HCT
// ---------------------------------------------------------------------------

export interface Hct {
  hue: number;
  chroma: number;
  tone: number;
}

const CHROMA_SEARCH_ENDPOINT = 0.4;
const DE_MAX = 1.0;
const DL_MAX = 0.2;
const LIGHTNESS_SEARCH_ENDPOINT = 0.01;

function getInt(hue: number, chroma: number, tone: number): number {
  return getIntInViewingConditions(
    sanitizeDegreesDouble(hue),
    chroma,
    clampDouble(0.0, 100.0, tone),
    ViewingConditions.DEFAULT,
  );
}

function getIntInViewingConditions(
  hue: number,
  chroma: number,
  tone: number,
  vc: ViewingConditions,
): number {
  if (chroma < 1.0 || Math.round(tone) <= 0.0 || Math.round(tone) >= 100.0) {
    return argbFromLstar(tone);
  }
  hue = sanitizeDegreesDouble(hue);
  let high = chroma;
  let mid = chroma;
  let low = 0.0;
  let isFirstLoop = true;
  let answer: number | null = null;
  while (Math.abs(low - high) >= CHROMA_SEARCH_ENDPOINT) {
    const possibleAnswer = findCamByJ(hue, mid, tone);
    if (isFirstLoop) {
      if (possibleAnswer != null) {
        return possibleAnswer.viewed(vc);
      }
      isFirstLoop = false;
      mid = low + (high - low) / 2.0;
      continue;
    }
    if (possibleAnswer === null) {
      high = mid;
    } else {
      answer = possibleAnswer.viewed(vc);
      low = mid;
    }
    mid = low + (high - low) / 2.0;
  }
  if (answer === null) {
    return argbFromLstar(tone);
  }
  return answer;
}

function findCamByJ(hue: number, chroma: number, tone: number): Cam16 | null {
  let low = 0.0;
  let high = 100.0;
  let mid = 0.0;
  let bestdL = 1000.0;
  let bestdE = 1000.0;
  let bestCam: Cam16 | null = null;
  while (Math.abs(low - high) > LIGHTNESS_SEARCH_ENDPOINT) {
    mid = low + (high - low) / 2;
    const camBeforeClip = Cam16.fromJch(mid, chroma, hue);
    const clipped = camBeforeClip.toInt();
    const clippedLstar = lstarFromArgb(clipped);
    const dL = Math.abs(tone - clippedLstar);
    if (dL < DL_MAX) {
      const camClipped = Cam16.fromInt(clipped);
      const dE = camClipped.distance(
        Cam16.fromJch(camClipped.j, camClipped.chroma, hue),
      );
      if (dE <= DE_MAX && dE <= bestdE) {
        bestdL = dL;
        bestdE = dE;
        bestCam = camClipped;
      }
    }
    if (bestdL === 0 && bestdE === 0) break;
    if (clippedLstar < tone) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return bestCam;
}

export function hctFromInt(argb: number): Hct {
  const cam = Cam16.fromInt(argb);
  const tone = lstarFromArgb(argb);
  return { hue: cam.hue, chroma: cam.chroma, tone };
}

export function hctToInt(hue: number, chroma: number, tone: number): number {
  return getInt(hue, chroma, tone);
}

// Cam16.distance 用于内部，这里补一个简单实现（已在 findCamByJ 内联使用）

// ---------------------------------------------------------------------------
// HEX 互转
// ---------------------------------------------------------------------------

export function argbFromHex(hex: string): number {
  let h = hex.replace("#", "");
  const isThree = h.length === 3;
  const isSix = h.length === 6;
  const isEight = h.length === 8;
  if (!isThree && !isSix && !isEight) {
    throw new Error("unexpected hex " + hex);
  }
  let r = 0;
  let g = 0;
  let b = 0;
  if (isThree) {
    r = parseIntHex(h.slice(0, 1).repeat(2));
    g = parseIntHex(h.slice(1, 2).repeat(2));
    b = parseIntHex(h.slice(2, 3).repeat(2));
  } else if (isSix) {
    r = parseIntHex(h.slice(0, 2));
    g = parseIntHex(h.slice(2, 4));
    b = parseIntHex(h.slice(4, 6));
  } else {
    r = parseIntHex(h.slice(2, 4));
    g = parseIntHex(h.slice(4, 6));
    b = parseIntHex(h.slice(6, 8));
  }
  return (
    ((255 << 24) | ((r & 0x0ff) << 16) | ((g & 0x0ff) << 8) | (b & 0x0ff)) >>> 0
  );
}

export function hexFromArgb(argb: number): string {
  const r = redFromArgb(argb);
  const g = greenFromArgb(argb);
  const b = blueFromArgb(argb);
  const outParts = [r.toString(16), g.toString(16), b.toString(16)];
  for (let i = 0; i < outParts.length; i++) {
    if (outParts[i].length === 1) outParts[i] = "0" + outParts[i];
  }
  return "#" + outParts.join("");
}

function parseIntHex(value: string): number {
  return parseInt(value, 16);
}

/** 便捷：HEX → HCT */
export function hexToHct(hex: string): Hct {
  return hctFromInt(argbFromHex(hex));
}

/** 便捷：HCT → HEX */
export function hctToHex(hue: number, chroma: number, tone: number): string {
  return hexFromArgb(hctToInt(hue, chroma, tone));
}

/** 便捷：HEX → ARGB */
export function hexToArgb(hex: string): number {
  return argbFromHex(hex);
}

/** 便捷：ARGB → HEX */
export function argbToHex(argb: number): string {
  return hexFromArgb(argb);
}
