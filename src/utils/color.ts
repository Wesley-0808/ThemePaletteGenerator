import type {
  ColorScale,
  Oklch,
  ScaleLevel,
  ThemeOptions,
  ThemeResult,
  ThemeTokens,
} from "../types/theme";

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

/** 50..900 色阶 → TDesign 1..10 序号命名 */
function scaleToTdVars(scale: ColorScale, token: string): string {
  return LEVELS.map((lv, i) => `  --td-${token}-${i + 1}: ${scale[lv]};`).join(
    "\n",
  );
}

/** 深色背景灰 gray-11..14 → TDesign 序号命名 */
function bgGraysToTdVars(grays: string[]): string {
  return [11, 12, 13, 14]
    .map((n, i) => `  --td-gray-color-${n}: ${grays[i]};`)
    .join("\n");
}

/** TDesign 语义 Token 的 CSS 变量名映射 */
const TOKEN_CSS_MAP: Record<keyof ThemeTokens, string> = {
  brand: "--td-brand-color",
  brandHover: "--td-brand-color-hover",
  brandActive: "--td-brand-color-active",
  brandSubtle: "--td-brand-color-light",
  bg: "--td-bg-color",
  surface: "--td-bg-color-page",
  surfaceHover: "--td-bg-color-container-hover",
  border: "--td-component-stroke",
  borderHover: "--td-border-level-2-color",
  text: "--td-text-color-primary",
  textSecondary: "--td-text-color-secondary",
  textInverse: "--td-text-color-anti",
};

function tokensToCssVars(tokens: ThemeTokens): string {
  return (Object.keys(TOKEN_CSS_MAP) as (keyof ThemeTokens)[])
    .map((k) => `  ${TOKEN_CSS_MAP[k]}: ${tokens[k]};`)
    .join("\n");
}

/** 导出为 TDesign CSS 变量（:root 浅色 / .dark 深色），关联 --td-brand-color / --td-gray-color 及其 1..14 色阶 */
export function themeToCssVariables(theme: ThemeResult): string {
  const lt = theme.light;
  const dk = theme.dark;
  const lines: string[] = [];

  lines.push(":root {");
  lines.push("  /* 品牌色阶 */");
  lines.push(scaleToTdVars(lt.primary, "brand-color"));
  lines.push("  /* 中性色阶 */");
  lines.push(scaleToTdVars(lt.neutral, "gray-color"));
  lines.push("  /* 深色背景灰 */");
  lines.push(bgGraysToTdVars(lt.bgGrays));
  lines.push("  /* 主题主色 / 中性基准 */");
  lines.push(`  --td-brand-color: ${lt.primary[600]};`);
  lines.push(`  --td-gray-color: ${lt.neutral[600]};`);
  lines.push("  /* 语义 Token */");
  lines.push(tokensToCssVars(lt.tokens));
  lines.push("}");

  lines.push("");
  lines.push(".dark {");
  lines.push("  /* 深色品牌色阶 */");
  lines.push(scaleToTdVars(dk.primary, "brand-color"));
  lines.push("  /* 中性色阶 */");
  lines.push(scaleToTdVars(dk.neutral, "gray-color"));
  lines.push("  /* 深色背景灰 */");
  lines.push(bgGraysToTdVars(dk.bgGrays));
  lines.push(`  --td-brand-color: ${dk.primary[700]};`);
  lines.push(`  --td-gray-color: ${dk.neutral[600]};`);
  lines.push("  /* 语义 Token */");
  lines.push(tokensToCssVars(dk.tokens));
  lines.push("}");

  return lines.join("\n");
}
