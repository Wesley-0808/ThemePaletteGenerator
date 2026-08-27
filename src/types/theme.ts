/** 色阶等级（由浅到深） */
export type ScaleLevel =
  50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/** 10 级颜色色阶 */
export type ColorScale = Record<ScaleLevel, string>;

/** 语义化主题 Token */
export interface ThemeTokens {
  brand: string;
  brandHover: string;
  brandActive: string;
  brandSubtle: string;
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderHover: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  [key: string]: string;
}

/** 单一模式（Light / Dark）下的完整配色 */
export interface ThemeMode {
  primary: ColorScale;
  neutral: ColorScale;
  /** 深色背景灰 gray-11..14（取自中性色阶 11..14） */
  bgGrays: string[];
  /** 主色在 10 级色阶中的 1 基下标（浅/深模式不同，由 generateBrandTokenMap 推导） */
  brandIdx: number;
  tokens: ThemeTokens;
}

/** 完整主题：包含 Light 与 Dark 两套 */
export interface ThemeResult {
  light: ThemeMode;
  dark: ThemeMode;
}

/** OKLCH 颜色（h 为角度，0–360） */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

/** 主题生成选项 */
export interface ThemeOptions {
  /**
   * 中性灰是否关联主题色（品牌相关的中性灰，带极淡主题色相）。
   * TDesign 默认开启（与官方生成器一致）；关闭则为不关联主色的平滑灰阶。
   */
  neutralInheritPrimary?: boolean;
}
