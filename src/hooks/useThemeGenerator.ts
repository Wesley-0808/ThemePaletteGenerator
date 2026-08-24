import { computed, ref, watch } from "vue";
import {
  generateTheme,
  isValidHex,
  themeToCssVariables,
  themeToJson,
} from "../utils/color";
import type {
  ColorScale,
  ScaleLevel,
  ThemeOptions,
  ThemeResult,
} from "../types/theme";

export type ThemeMode = "light" | "dark";

/** 常用主题色快捷选择 */
export const PRESETS: { name: string; hex: string }[] = [
  { name: "Azure", hex: "#1C4D9F" },
  { name: "TDesign", hex: "#0052D9" },
  { name: "Emerald", hex: "#00A870" },
  { name: "Orange", hex: "#E37318" },
  { name: "Coral", hex: "#D54941" },
  { name: "Purple", hex: "#834EC2" },
  { name: "Teal", hex: "#0BB4C4" },
  { name: "Slate", hex: "#34495E" },
];

export function useThemeGenerator(initial = "#1C4D9F") {
  const primaryColor = ref(initial);
  const mode = ref<ThemeMode>("light");
  const error = ref<string | null>(null);
  /** 中性色是否关联主题色（继承色相）；默认 false = 纯灰 */
  const neutralInherit = ref(false);

  const theme = computed<ThemeResult | null>(() => {
    const hex = primaryColor.value.trim();
    if (!isValidHex(hex)) {
      error.value = "请输入合法的 HEX 颜色（例如 #1C4D9F）";
      return null;
    }
    error.value = null;
    try {
      const options: ThemeOptions = {
        neutralInheritPrimary: neutralInherit.value,
      };
      return generateTheme(hex, options);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "生成失败";
      return null;
    }
  });

  const current = computed(() =>
    theme.value ? theme.value[mode.value] : null,
  );

  const primaryScale = computed<ColorScale>(() =>
    theme.value ? theme.value[mode.value].primary : ({} as ColorScale),
  );

  const neutralScale = computed<ColorScale>(() =>
    theme.value ? theme.value[mode.value].neutral : ({} as ColorScale),
  );

  const tokens = computed(() => (current.value ? current.value.tokens : null));

  // 把当前主题映射为 TDesign CSS 变量对象，挂到页面根节点后：
  // 1) 预览区直接用 TDesign 组件（t-button/t-card/t-input/t-tag）消费这些变量，不再手写 background/color；
  // 2) 页面底色 / 文字改用 var(--td-*)，随 theme-mode 自动适配深色。
  const LEVELS: ScaleLevel[] = [
    50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
  ];
  const cssVars = computed<Record<string, string>>(() => {
    const c = current.value;
    if (!c) return {};
    const tk = c.tokens;
    const vars: Record<string, string> = {
      "--td-brand-color": tk.brand,
      "--td-gray-color": c.neutral[600],
      "--td-brand-color-hover": tk.brandHover,
      "--td-brand-color-active": tk.brandActive,
      "--td-brand-color-light": tk.brandSubtle,
      "--td-bg-color-page": tk.bg,
      "--td-bg-color-container": tk.surface,
      "--td-bg-color-container-hover": tk.surfaceHover,
      "--td-component-bg": tk.surface,
      "--td-component-stroke": tk.border,
      "--td-border-level-2-color": tk.borderHover,
      "--td-text-color-primary": tk.text,
      "--td-text-color-secondary": tk.textSecondary,
      "--td-text-color-anti": tk.textInverse,
    };
    LEVELS.forEach((lv, i) => {
      vars[`--td-brand-color-${i + 1}`] = c.primary[lv];
      vars[`--td-gray-color-${i + 1}`] = c.neutral[lv];
    });
    if (c.bgGrays) {
      [11, 12, 13, 14].forEach((n, i) => {
        vars[`--td-gray-color-${n}`] = c.bgGrays[i];
      });
    }
    return vars;
  });

  function setColor(hex: string) {
    primaryColor.value = hex;
  }

  // 通过 <html theme-mode> 驱动 TDesign 组件库自身的深色样式
  function applyThemeMode(m: ThemeMode) {
    const root = document.documentElement;
    if (m === "dark") root.setAttribute("theme-mode", "dark");
    else root.removeAttribute("theme-mode");
  }

  function setMode(m: ThemeMode) {
    mode.value = m;
    applyThemeMode(m);
  }

  // 模式变化即同步到 DOM；初始化时也应用一次
  watch(mode, applyThemeMode);
  applyThemeMode(mode.value);

  function setNeutralInherit(val: boolean) {
    neutralInherit.value = val;
  }

  function exportJson(): string {
    return theme.value ? themeToJson(theme.value) : "";
  }

  function exportCss(): string {
    return theme.value ? themeToCssVariables(theme.value) : "";
  }

  return {
    primaryColor,
    mode,
    error,
    neutralInherit,
    theme,
    current,
    primaryScale,
    neutralScale,
    tokens,
    cssVars,
    setColor,
    setMode,
    setNeutralInherit,
    exportJson,
    exportCss,
    PRESETS,
  };
}
