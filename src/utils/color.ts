import type {
  ColorScale,
  Oklch,
  ScaleLevel,
  ThemeMode,
  ThemeOptions,
  ThemeResult,
  ThemeTokens,
} from "../types/theme";
import { TD_DEFAULT_DARK, TD_DEFAULT_LIGHT } from "./tdDefaults.js";

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidHex(input: string): boolean {
  return HEX_RE.test(input.trim());
}

/** 规整为 #rrggbb（小写） */
export function normalizeHex(input: string): string {
  const v = input.trim().replace(/^#/, "");
  if (v.length === 3) {
    return (
      "#" +
      v
        .split("")
        .map((c) => c + c)
        .join("")
    );
  }
  return "#" + v.toLowerCase();
}

function srgbToLinear(c: number): number {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function linearToSrgb(x: number): number {
  const c = x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex).slice(1);
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** RGB <-> OKLab / OKLCH（Björn Ottosson 定义）。矩阵系数固定。 */
export function rgbToOklch(r: number, g: number, b: number): Oklch {
  const rL = srgbToLinear(r);
  const gL = srgbToLinear(g);
  const bL = srgbToLinear(b);

  const l = 0.4122214708 * rL + 0.5363325363 * gL + 0.0514459929 * bL;
  const m = 0.2119034982 * rL + 0.6806995451 * gL + 0.1073969566 * bL;
  const s = 0.0883024619 * rL + 0.2817188376 * gL + 0.6299787005 * bL;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const W = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(W * W + B * B);
  let H = (Math.atan2(B, W) * 180) / Math.PI;
  if (H < 0) H += 360;

  return { l: L, c: C, h: H };
}

export function oklchToRgb(
  L: number,
  C: number,
  H: number,
): [number, number, number] {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bOut = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return [linearToSrgb(r), linearToSrgb(g), linearToSrgb(bOut)];
}

/** 色域映射：保持 L/H 不变，二分降低 C 直到落入 sRGB 范围 */
export function gamutMapOklch(L: number, C: number, H: number): Oklch {
  const clampL = Math.min(1, Math.max(0, L));

  const inGamut = (c: number): boolean => {
    const [r, g, b] = oklchToRgb(clampL, c, H);
    return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
  };

  if (inGamut(C)) return { l: clampL, c: C, h: H };

  let lo = 0;
  let hi = C;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(mid)) lo = mid;
    else hi = mid;
  }
  return { l: clampL, c: lo, h: H };
}

export function oklchToHex(L: number, C: number, H: number): string {
  const safe = gamutMapOklch(L, C, H);
  const [r, g, b] = oklchToRgb(safe.l, safe.c, safe.h);
  return rgbToHex(r, g, b);
}

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToRgb(hex);
  return rgbToOklch(r, g, b);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const f = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** 返回与背景对比度更高的文字色（黑或白） */
export function contrastText(hex: string): string {
  return relativeLuminance(hex) > 0.5 ? "#000000" : "#ffffff";
}

export const LEVELS: ScaleLevel[] = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
];

const MAIN_INDEX = 6;
const BRAND_L_RATIO = [
  1.965, 1.856, 1.699, 1.532, 1.357, 1.178, 1.0, 0.826, 0.656, 0.507,
];
const BRAND_C_RATIO = [
  0.074, 0.193, 0.374, 0.579, 0.807, 0.966, 1.0, 0.853, 0.67, 0.528,
];
const NEUTRAL_L = [
  0.9642, 0.9491, 0.928, 0.8945, 0.8234, 0.7252, 0.6368, 0.5693, 0.4819, 0.4128,
];

const L_MAX = 0.97;
const L_MIN = 0.04;

/** 深色品牌色阶：L 随序号递增（浅端更亮） */
const DARK_BRAND_L = [
  0.307, 0.331, 0.355, 0.379, 0.405, 0.454, 0.536, 0.616, 0.7, 0.788,
];
const DARK_BRAND_C_RATIO = [
  0.308, 0.415, 0.513, 0.619, 0.707, 0.879, 0.831, 0.755, 0.646, 0.443,
];
/** 深色背景灰 gray-11..14，深浅一致 */
const DARK_BG_L = [0.345, 0.293, 0.26, 0.209];

/** 生成主色 10 级色阶：主色锚定 600，浅端升亮、深端压暗，色度在主色处最高，色相恒定 */
export function generateColorScale(primaryColor: string): ColorScale {
  if (!isValidHex(primaryColor)) {
    throw new Error(`非法 HEX 颜色：${primaryColor}`);
  }
  const base = hexToOklch(primaryColor);
  const result = {} as ColorScale;
  for (let i = 0; i < LEVELS.length; i++) {
    const L =
      i === MAIN_INDEX
        ? base.l
        : Math.min(L_MAX, Math.max(L_MIN, base.l * BRAND_L_RATIO[i]));
    const C = gamutMapOklch(L, base.c * BRAND_C_RATIO[i], base.h).c;
    result[LEVELS[i]] = oklchToHex(L, C, base.h);
  }
  return result;
}

/** 中性色继承的克制色度*/
function neutralChromaOf(base: Oklch): number {
  return Math.min(base.c * 0.1, 0.012) + 0.006;
}

/** 生成中性 10 级色阶。inheritHue=true 时极轻继承主色相*/
export function generateNeutralScale(
  primaryColor: string,
  inheritHue = false,
): ColorScale {
  if (!isValidHex(primaryColor)) {
    throw new Error(`非法 HEX 颜色：${primaryColor}`);
  }
  const base = hexToOklch(primaryColor);
  const chroma = inheritHue ? neutralChromaOf(base) : 0;
  const hue = inheritHue ? base.h : 0;
  const result = {} as ColorScale;
  for (let i = 0; i < LEVELS.length; i++) {
    const L = Math.min(L_MAX, Math.max(L_MIN, NEUTRAL_L[i]));
    const C = gamutMapOklch(L, chroma, hue).c;
    result[LEVELS[i]] = oklchToHex(L, C, hue);
  }
  return result;
}

/** 深色品牌色阶：反向、更明亮的独立色阶（L 随序号递增） */
export function generateDarkBrandScale(primaryColor: string): ColorScale {
  if (!isValidHex(primaryColor)) {
    throw new Error(`非法 HEX 颜色：${primaryColor}`);
  }
  const base = hexToOklch(primaryColor);
  const result = {} as ColorScale;
  for (let i = 0; i < LEVELS.length; i++) {
    const L = DARK_BRAND_L[i];
    const C = gamutMapOklch(L, base.c * DARK_BRAND_C_RATIO[i], base.h).c;
    result[LEVELS[i]] = oklchToHex(L, C, base.h);
  }
  return result;
}

/** 深色背景灰 gray-11..14；inheritHue 时极轻继承色相 */
function generateDarkBgGrays(inheritHue = false, base?: Oklch): string[] {
  const chroma = inheritHue && base ? Math.min(base.c * 0.05, 0.006) : 0;
  const hue = inheritHue && base ? base.h : 0;
  return DARK_BG_L.map((L) =>
    oklchToHex(L, gamutMapOklch(L, chroma, hue).c, hue),
  );
}

function makeLightTokens(
  primary: ColorScale,
  neutral: ColorScale,
): ThemeTokens {
  return {
    brand: primary[600],
    brandHover: primary[500],
    brandActive: primary[700],
    brandSubtle: primary[50],
    bg: neutral[100],
    surface: "#FFFFFF",
    surfaceHover: neutral[50],
    border: neutral[200],
    borderHover: neutral[300],
    text: "rgba(0, 0, 0, 0.9)",
    textSecondary: "rgba(0, 0, 0, 0.6)",
    textInverse: "#fff",
  };
}

function makeDarkTokens(
  darkPrimary: ColorScale,
  bgGrays: string[],
  neutral: ColorScale,
): ThemeTokens {
  return {
    brand: darkPrimary[700], // --td-brand-color = brand-8（深色主色更亮）
    brandHover: darkPrimary[600], // brand-7
    brandActive: darkPrimary[800], // brand-9
    brandSubtle: darkPrimary[50], // brand-1
    bg: bgGrays[3], // gray-14 #181818
    surface: bgGrays[2], // gray-13 #242424
    surfaceHover: bgGrays[1], // gray-12 #2c2c2c
    border: bgGrays[0], // gray-11 #393939
    borderHover: neutral[800], // gray-9  #5e5e5e
    text: "rgba(255, 255, 255, 0.9)",
    textSecondary: "rgba(255, 255, 255, 0.55)",
    textInverse: "#fff",
  };
}

/**
 * 生成完整主题（Light + Dark）。
 * 深色品牌色阶为独立、反向更明亮的尺度；中性 gray-1..10 深浅一致，
 * 仅背景灰 gray-11..14 与语义 Token 随深色变化。
 * options.neutralInheritPrimary 控制中性色是否极轻继承主色相。
 */
export function generateTheme(
  primaryColor: string,
  options: ThemeOptions = {},
): ThemeResult {
  if (!isValidHex(primaryColor)) {
    throw new Error(`非法 HEX 颜色：${primaryColor}`);
  }
  const inheritHue = options.neutralInheritPrimary ?? false;
  const base = hexToOklch(primaryColor);
  const primary = generateColorScale(primaryColor);
  const darkPrimary = generateDarkBrandScale(primaryColor);
  const neutral = generateNeutralScale(primaryColor, inheritHue);
  const bgGrays = generateDarkBgGrays(inheritHue, base);

  return {
    light: {
      primary,
      neutral,
      bgGrays,
      tokens: makeLightTokens(primary, neutral),
    },
    dark: {
      primary: darkPrimary,
      neutral,
      bgGrays,
      tokens: makeDarkTokens(darkPrimary, bgGrays, neutral),
    },
  };
}

export function themeToJson(theme: ThemeResult): string {
  return JSON.stringify(theme, null, 2);
}

/* ------------------------------------------------------------------ *
 * 主题色彩 CSS 变量生成（只覆盖「由主题色推导」的变量）
 * 覆盖范围：品牌色阶 + 品牌别名、中性(gray)色阶 1..14、以及由它们推导的
 *   - bg-color-*   背景语义变量
 *   - text-color-* 文字语义变量
 *   - border-*     描边/边框语义变量（均由 gray 推导）
 * 不覆盖 error/warning/success 等状态色，以及字体 alpha 梯度、mask、
 * scrollbar、表格阴影等固定覆盖层色（这些不随主题色变化，由 TDesign 默认
 * 提供即可）。非色彩 Token（间距/尺寸/圆角/层级/字号/动画等）亦不生成。
 * ------------------------------------------------------------------ */

/** 语义变量引用：取自品牌色阶 / 中性色阶 / 固定常量 */
type ColorRef =
  | { kind: "brand"; i: number }
  | { kind: "gray"; i: number }
  | { kind: "const"; v: string };

/** 品牌色别名 → 色阶序号（浅 / 深模式不同） */
const BRAND_ALIAS_LIGHT: Record<string, number> = {
  "": 7,
  hover: 6,
  focus: 2,
  active: 8,
  disabled: 3,
  light: 1,
  "light-hover": 2,
};
const BRAND_ALIAS_DARK: Record<string, number> = {
  "": 8,
  hover: 7,
  focus: 2,
  active: 9,
  disabled: 3,
  light: 1,
  "light-hover": 2,
};

/** 背景语义变量映射（浅 / 深） */
const BG_LIGHT: [string, ColorRef][] = [
  ["bg-color-page", { kind: "gray", i: 2 }],
  ["bg-color-container", { kind: "const", v: "#ffffff" }],
  ["bg-color-container-hover", { kind: "gray", i: 1 }],
  ["bg-color-container-active", { kind: "gray", i: 3 }],
  ["bg-color-container-select", { kind: "const", v: "#ffffff" }],
  ["bg-color-secondarycontainer", { kind: "gray", i: 1 }],
  ["bg-color-secondarycontainer-hover", { kind: "gray", i: 2 }],
  ["bg-color-secondarycontainer-active", { kind: "gray", i: 4 }],
  ["bg-color-component", { kind: "gray", i: 3 }],
  ["bg-color-component-hover", { kind: "gray", i: 4 }],
  ["bg-color-component-active", { kind: "gray", i: 6 }],
  ["bg-color-secondarycomponent", { kind: "gray", i: 4 }],
  ["bg-color-secondarycomponent-hover", { kind: "gray", i: 5 }],
  ["bg-color-secondarycomponent-active", { kind: "gray", i: 6 }],
  ["bg-color-component-disabled", { kind: "gray", i: 2 }],
  ["bg-color-specialcomponent", { kind: "const", v: "#ffffff" }],
];
const BG_DARK: [string, ColorRef][] = [
  ["bg-color-page", { kind: "gray", i: 14 }],
  ["bg-color-container", { kind: "gray", i: 13 }],
  ["bg-color-container-hover", { kind: "gray", i: 12 }],
  ["bg-color-container-active", { kind: "gray", i: 10 }],
  ["bg-color-container-select", { kind: "gray", i: 9 }],
  ["bg-color-secondarycontainer", { kind: "gray", i: 12 }],
  ["bg-color-secondarycontainer-hover", { kind: "gray", i: 11 }],
  ["bg-color-secondarycontainer-active", { kind: "gray", i: 9 }],
  ["bg-color-component", { kind: "gray", i: 11 }],
  ["bg-color-component-hover", { kind: "gray", i: 10 }],
  ["bg-color-component-active", { kind: "gray", i: 9 }],
  ["bg-color-secondarycomponent", { kind: "gray", i: 10 }],
  ["bg-color-secondarycomponent-hover", { kind: "gray", i: 9 }],
  ["bg-color-secondarycomponent-active", { kind: "gray", i: 8 }],
  ["bg-color-component-disabled", { kind: "gray", i: 12 }],
  ["bg-color-specialcomponent", { kind: "const", v: "transparent" }],
];
/** 文字语义变量映射（浅 / 深） */
const TEXT_LIGHT: [string, ColorRef][] = [
  ["text-color-primary", { kind: "const", v: "rgba(0, 0, 0, 0.9)" }],
  ["text-color-secondary", { kind: "const", v: "rgba(0, 0, 0, 0.6)" }],
  ["text-color-placeholder", { kind: "const", v: "rgba(0, 0, 0, 0.4)" }],
  ["text-color-disabled", { kind: "const", v: "rgba(0, 0, 0, 0.26)" }],
  ["text-color-anti", { kind: "const", v: "#ffffff" }],
  ["text-color-brand", { kind: "brand", i: 7 }],
  ["text-color-link", { kind: "brand", i: 8 }],
  ["text-color-watermark", { kind: "const", v: "rgba(0, 0, 0, 0.1)" }],
];
const TEXT_DARK: [string, ColorRef][] = [
  ["text-color-primary", { kind: "const", v: "rgba(255, 255, 255, 0.9)" }],
  ["text-color-secondary", { kind: "const", v: "rgba(255, 255, 255, 0.55)" }],
  ["text-color-placeholder", { kind: "const", v: "rgba(255, 255, 255, 0.35)" }],
  ["text-color-disabled", { kind: "const", v: "rgba(255, 255, 255, 0.22)" }],
  ["text-color-anti", { kind: "const", v: "#ffffff" }],
  ["text-color-brand", { kind: "brand", i: 8 }],
  ["text-color-link", { kind: "brand", i: 8 }],
  ["text-color-watermark", { kind: "const", v: "rgba(255, 255, 255, 0.1)" }],
];
/** 边框 / 描边语义变量映射（浅 / 深） */
const BORDER_LIGHT: [string, ColorRef][] = [
  ["border-level-1-color", { kind: "gray", i: 3 }],
  ["component-stroke", { kind: "gray", i: 3 }],
  ["border-level-2-color", { kind: "gray", i: 4 }],
  ["component-border", { kind: "gray", i: 4 }],
];
const BORDER_DARK: [string, ColorRef][] = [
  ["border-level-1-color", { kind: "gray", i: 11 }],
  ["component-stroke", { kind: "gray", i: 11 }],
  ["border-level-2-color", { kind: "gray", i: 9 }],
  ["component-border", { kind: "gray", i: 9 }],
];

/**
 * 生成单模式的 TDesign 主题色彩 CSS 变量映射（解析为字面量，开箱即用）。
 * 仅覆盖由主题色推导的变量：品牌色阶 + 别名、中性(gray)色阶 1..14、
 * 以及由它们推导的 bg-color-* / text-color-* / border-* 语义变量。
 * 生成值与 TDesign 默认一致时不输出（不覆盖），保持最小导出。
 */
export function buildModeCssVars(
  mode: ThemeMode,
  isDark: boolean,
): Record<string, string> {
  const { primary, neutral, bgGrays } = mode;
  const vars: Record<string, string> = {};

  const brandAt = (n: number) => primary[LEVELS[n - 1]];
  const grayAt = (n: number) =>
    n <= 10 ? neutral[LEVELS[n - 1]] : bgGrays[n - 11];
  const resolve = (r: ColorRef): string =>
    r.kind === "const"
      ? r.v
      : r.kind === "brand"
        ? brandAt(r.i)
        : grayAt(r.i);

  // 品牌色阶 1..10
  for (let i = 1; i <= 10; i++) vars[`--td-brand-color-${i}`] = brandAt(i);
  // 中性色阶 1..14
  for (let i = 1; i <= 14; i++) vars[`--td-gray-color-${i}`] = grayAt(i);
  // 中性基准（兼容别名，非 TDesign 原生）
  vars["--td-gray-color"] = grayAt(7);

  // 品牌色别名
  const brandAlias = isDark ? BRAND_ALIAS_DARK : BRAND_ALIAS_LIGHT;
  for (const [suffix, idx] of Object.entries(brandAlias)) {
    vars[`--td-brand-color${suffix ? "-" + suffix : ""}`] = brandAt(idx);
  }

  // 背景 / 文字 / 边框 语义变量（均由品牌 / 中性色阶推导）
  const semanticMaps = isDark
    ? [BG_DARK, TEXT_DARK, BORDER_DARK]
    : [BG_LIGHT, TEXT_LIGHT, BORDER_LIGHT];
  semanticMaps.forEach((map) => {
    map.forEach(([name, ref]) => {
      vars[`--td-${name}`] = resolve(ref);
    });
  });

  // 与 TDesign 默认值一致则不输出（不覆盖），保持最小导出
  const defaults = (isDark ? TD_DEFAULT_DARK : TD_DEFAULT_LIGHT) as Record<
    string,
    string
  >;
  for (const k of Object.keys(vars)) {
    const d = defaults[k];
    if (d && d.toLowerCase() === vars[k].toLowerCase()) delete vars[k];
  }

  return vars;
}

/** 导出为完整 TDesign 色彩 CSS 变量：:root 浅色 / :root[theme-mode='dark'] 深色 */
export function themeToCssVariables(theme: ThemeResult): string {
  const indent = (vars: Record<string, string>) =>
    Object.entries(vars)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join("\n");
  return [
    ":root {",
    indent(buildModeCssVars(theme.light, false)),
    "}",
    "",
    ":root[theme-mode='dark'] {",
    indent(buildModeCssVars(theme.dark, true)),
    "}",
  ].join("\n");
}
