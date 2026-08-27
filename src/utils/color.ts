import type {
  ColorScale,
  ScaleLevel,
  ThemeMode,
  ThemeOptions,
  ThemeResult,
  ThemeTokens,
} from "../types/theme";
import {
  generateBrandPalette,
  generateBrandTokenMap,
  generateNeutralPalette,
  NEUTRAL_GRAY_BASE,
} from "./palette.js";
import { TD_DEFAULT_DARK, TD_DEFAULT_LIGHT } from "./tdDefaults.js";

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidHex(input: string): boolean {
  return HEX_RE.test(input.trim());
}

export const LEVELS: ScaleLevel[] = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
];

/** 10 元 hex 数组 → ColorScale（浅端在前） */
function arrToColorScale(arr: string[]): ColorScale {
  const result = {} as ColorScale;
  for (let i = 0; i < LEVELS.length; i++) result[LEVELS[i]] = arr[i];
  return result;
}

/** 1 基下标取色（1..10 → 50..900） */
function scaleAt(scale: ColorScale, oneBased: number): string {
  return scale[LEVELS[oneBased - 1]];
}

/* 色阶生成：委托 palette.ts */

/** 浅色品牌 10 级色阶（主色动态锚定） */
export function generateColorScale(primaryColor: string): ColorScale {
  if (!isValidHex(primaryColor)) {
    throw new Error(`非法 HEX 颜色：${primaryColor}`);
  }
  return arrToColorScale(
    generateBrandPalette(primaryColor, true).lightPalette,
  );
}

/** 中性 10 级色阶。related=false 时以 NEUTRAL_GRAY_BASE 生成纯灰 */
export function generateNeutralScale(
  primaryColor: string,
  related = true,
): ColorScale {
  if (!isValidHex(primaryColor)) {
    throw new Error(`非法 HEX 颜色：${primaryColor}`);
  }
  const base = related ? primaryColor : NEUTRAL_GRAY_BASE;
  return arrToColorScale(
    generateNeutralPalette(base, related).slice(0, 10),
  );
}

/** 深色品牌 10 级色阶（浅色反向前 10 档） */
export function generateDarkBrandScale(primaryColor: string): ColorScale {
  if (!isValidHex(primaryColor)) {
    throw new Error(`非法 HEX 颜色：${primaryColor}`);
  }
  return arrToColorScale(
    generateBrandPalette(primaryColor, true).darkPalette,
  );
}

/* ------------------------------------------------------------------ *
 * 语义 Token 推导
 * ------------------------------------------------------------------ */

function makeLightTokens(
  primary: ColorScale,
  neutral: ColorScale,
  brandIdx: number,
): ThemeTokens {
  const tm = generateBrandTokenMap(brandIdx);
  return {
    brand: scaleAt(primary, tm[""]),
    brandHover: scaleAt(primary, tm.hover),
    brandActive: scaleAt(primary, tm.active),
    brandSubtle: scaleAt(primary, tm.light),
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
  darkBrandIdx: number,
): ThemeTokens {
  const tm = generateBrandTokenMap(darkBrandIdx);
  return {
    brand: scaleAt(darkPrimary, tm[""]),
    brandHover: scaleAt(darkPrimary, tm.hover),
    brandActive: scaleAt(darkPrimary, tm.active),
    brandSubtle: scaleAt(darkPrimary, tm.light),
    bg: bgGrays[3], // gray-14
    surface: bgGrays[2], // gray-13
    surfaceHover: bgGrays[1], // gray-12
    border: bgGrays[0], // gray-11
    borderHover: neutral[800], // gray-9
    text: "rgba(255, 255, 255, 0.9)",
    textSecondary: "rgba(255, 255, 255, 0.55)",
    textInverse: "#fff",
  };
}

/**
 * 生成完整主题（Light + Dark）。
 * 中性 gray-1..10 两模式相同，仅背景灰 gray-11..14 与语义 Token 随深色变化。
 */
export function generateTheme(
  primaryColor: string,
  options: ThemeOptions = {},
): ThemeResult {
  if (!isValidHex(primaryColor)) {
    throw new Error(`非法 HEX 颜色：${primaryColor}`);
  }
  const related = options.neutralInheritPrimary ?? true;
  const bp = generateBrandPalette(primaryColor, true);
  const neutralBase = related ? primaryColor : NEUTRAL_GRAY_BASE;
  const neutral14 = generateNeutralPalette(neutralBase, related);
  const neutral = arrToColorScale(neutral14.slice(0, 10));
  const bgGrays = neutral14.slice(10, 14);

  const lightPrimary = arrToColorScale(bp.lightPalette);
  const darkPrimary = arrToColorScale(bp.darkPalette);
  return {
    light: {
      primary: lightPrimary,
      neutral,
      bgGrays,
      brandIdx: bp.lightBrandIdx,
      tokens: makeLightTokens(lightPrimary, neutral, bp.lightBrandIdx),
    },
    dark: {
      primary: darkPrimary,
      neutral,
      bgGrays,
      brandIdx: bp.darkBrandIdx,
      tokens: makeDarkTokens(darkPrimary, bgGrays, neutral, bp.darkBrandIdx),
    },
  };
}

export function themeToJson(theme: ThemeResult): string {
  return JSON.stringify(theme, null, 2);
}

/* 主题色彩 CSS 变量生成（只覆盖由主题色推导的变量）：
 * 品牌色阶 + 别名、中性色阶 1..14、bg/text/border 语义变量。
 * 不覆盖状态色与固定覆盖层色（不随主题变化）。 */

/** 语义变量引用类型 */
type ColorRef =
  | { kind: "brand"; i: number }
  | { kind: "gray"; i: number }
  | { kind: "const"; v: string };

/* 背景 */
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
/* 文字 */
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
/* 边框 */
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
 * 生成单模式主题色彩 CSS 变量映射（字面量，开箱即用）。
 * 仅覆盖由主题色推导的变量；与默认值一致时不输出，保持最小导出。
 */
export function buildModeCssVars(
  mode: ThemeMode,
  isDark: boolean,
): Record<string, string> {
  const { primary, neutral, bgGrays, brandIdx } = mode;
  const vars: Record<string, string> = {};

  const brandAt = (n: number) => scaleAt(primary, n);
  const grayAt = (n: number) =>
    n <= 10 ? scaleAt(neutral, n) : bgGrays[n - 11];
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
  // 中性基准（兼容别名）
  vars["--td-gray-color"] = grayAt(7);

  // 品牌色别名（动态推导）
  const tm = generateBrandTokenMap(brandIdx);
  const aliasEntries: [string, number][] = [
    ["", tm[""]],
    ["hover", tm.hover],
    ["focus", tm.focus],
    ["active", tm.active],
    ["disabled", tm.disabled],
    ["light", tm.light],
    ["light-hover", tm["light-hover"]],
  ];
  for (const [suffix, idx] of aliasEntries) {
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

  // 与默认值一致则不输出
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

/** 导出完整色彩 CSS 变量：:root 浅色 / [theme-mode='dark'] 深色 */
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
