# 主题色阶生成器 · Theme Palette Generator

> 输入一个主色 HEX，自动生成 10 级色阶、14 级中性色阶、浅色 / 深色双模式，并直接输出可落地的 **TDesign CSS 变量**（`--td-brand-color` / `--td-gray-color` 等）。

---

## ✨ 特性

- **感知均匀色阶**：核心算法落在 [HCT（CAM16）](https://material-foundation.github.io/material-theme-builder/) 色彩空间，按色族参数以 bezier 缓动采样 tone 序列、分段调整色度，无第三方颜色库依赖。
- **色相零漂移**：品牌色阶全程锁定输入色相，只调 tone 与 chroma，任意主色都不会"蓝变紫、红变橙"。
- **主色动态锚定**：用 CIEDE2000 色差最小化确定主色所在档位，且该档位**严格等于输入色**（remain 模式）。如 `#0052D9` → 600、`#1C4D9F` → 700，不再固定 600。
- **深浅双模式**：深色品牌色阶 = 浅色色阶反序（腾讯蓝 `#0052D9` 特例使用固定深蓝色阶）；背景灰取自中性色阶 gray-11..14。
- **中性色关联开关**：关联时中性灰带极淡主题色相（对齐 TDesign 官方生成器）；关闭时为不关联主色的平滑灰阶。
- **一键对接 TDesign**：导出 `:root` / `:root[theme-mode='dark']` 下的 `--td-*` 变量，可直接挂到页面根节点，组件库与页面自动适配深色。
- **零依赖核心算法**：`color.ts` / `palette.ts` / `hct.ts` 均为纯 TypeScript 实现，无任何第三方颜色库。
- **内置可视化 Demo**：取色器、色阶预览、深浅切换、实时更新、点击复制、CSS/JSON 导出。

---

## 🧩 技术栈

| 维度      | 选型                                                       |
| --------- | ---------------------------------------------------------- |
| 核心算法  | TypeScript（HCT/CAM16 + CIEDE2000，手写实现，零依赖）      |
| Demo 前端 | Vue 3 + Vite + `<script setup lang="ts">`                  |
| UI 组件库 | [TDesign Vue Next](https://tdesign.tencent.com/) `^1.20.6` |
| 类型检查  | `vue-tsc`                                                  |
| 库构建    | `tsc` 编译到 `dist/lib`（含 `.d.ts`）                      |
| 发版      | pnpm + GitHub Actions + npm OIDC 可信发布                  |

---

## 📦 安装

### 环境要求

- Node.js 18+（推荐 LTS 20+）、pnpm 9+。

### 克隆与安装

```bash
git clone https://github.com/Wesley-0808/ThemePaletteGenerator.git
cd ThemePaletteGenerator
pnpm install
```

---

## 🚀 快速开始（本地 Demo）

```bash
pnpm dev
```

启动 Vite 开发服务器（默认 `http://localhost:5173`，可用 `pnpm dev -- --port 8080` 改端口）。

> 仅做类型校验（不跑全量构建，速度更快）：
>
> ```bash
> pnpm typecheck
> ```

构建静态站点（产物在 `dist/`）：

```bash
pnpm build
```

---

## 📚 作为库使用

本仓库的核心算法 `src/utils/color.ts`（编排层，委托 `palette.ts` / `hct.ts`）以纯函数形式提供，已编译为可发布的 npm 包 `@wesley-0808/theme-palette-generator`。

### 从 npm 安装

```bash
pnpm add @wesley-0808/theme-palette-generator
# 或
npm install @wesley-0808/theme-palette-generator
```

### 最小示例

```ts
import {
  generateTheme,
  themeToCssVariables,
  themeToJson,
} from "@wesley-0808/theme-palette-generator";

// 1) 生成完整主题（浅色 + 深色）
const theme = generateTheme("#0052D9");

// 2) 导出为 TDesign CSS 变量字符串，写入你的样式文件
const css = themeToCssVariables(theme);
console.log(css);

// 3) 或导出为 JSON 进一步处理
const json = themeToJson(theme);
```

将 `themeToCssVariables(theme)` 的输出写入全局样式（如 `theme.css`），再在 `<html>` 上切换 `theme-mode` 即可：

```css
/* theme.css —— 由 themeToCssVariables 生成 */
:root {
  /* 浅色：品牌色阶 / 中性色阶 / 语义变量 */
}
:root[theme-mode="dark"] {
  /* 深色：反序品牌色阶 / 背景灰 gray-11..14 */
}
```

```html
<!-- 浅色 -->
<html>
  <!-- 深色 -->
  <html theme-mode="dark"></html>
</html>
```

### 核心 API

#### `generateTheme(primaryColor, options?)` → `ThemeResult`

生成浅色 + 深色的完整主题。

| 参数                            | 类型      | 说明                                                                         |
| ------------------------------- | --------- | ---------------------------------------------------------------------------- |
| `primaryColor`                  | `string`  | 主色 HEX，如 `"#0052D9"`、`"1C4D9F"`（3/6 位均可，可不带 `#`）               |
| `options.neutralInheritPrimary` | `boolean` | 中性灰是否关联主题色（带极淡主题色相）。默认 `true`，对齐 TDesign 官方生成器 |

返回的 `ThemeResult`：

```ts
interface ThemeResult {
  light: ThemeMode; // 浅色全套
  dark: ThemeMode; // 深色全套
}
interface ThemeMode {
  primary: ColorScale; // 品牌 10 级色阶（50..900）
  neutral: ColorScale; // 中性 10 级色阶（50..900）
  bgGrays: string[]; // 中性色阶 gray-11..14（深浅一致，随关联开关变化）
  brandIdx: number; // 主色在色阶中的 1 基档位（浅/深模式不同，动态锚定）
  tokens: ThemeTokens; // 语义化 token（brand / bg / text ...）
}
```

#### 色阶与单级生成函数

| 函数                     | 签名                                                      | 说明                                                           |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------- |
| `generateColorScale`     | `(primaryColor: string) => ColorScale`                    | 仅生成浅色品牌 10 级色阶（主色按 CIEDE2000 动态锚定）          |
| `generateNeutralScale`   | `(primaryColor: string, related?: boolean) => ColorScale` | 仅生成中性 10 级色阶（related 默认 true，关联主题色）          |
| `generateDarkBrandScale` | `(primaryColor: string) => ColorScale`                    | 仅生成深色品牌 10 级色阶（浅色反序前 10 档；腾讯蓝用固定深蓝） |

`ColorScale` 是 `{ 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 }` 到 HEX 字符串的映射。

#### 导出函数

| 函数                  | 签名                                                           | 说明                                                            |
| --------------------- | -------------------------------------------------------------- | --------------------------------------------------------------- |
| `buildModeCssVars`    | `(mode: ThemeMode, isDark: boolean) => Record<string, string>` | 单模式的 TDesign CSS 变量映射（与默认值一致的项不输出）         |
| `themeToCssVariables` | `(theme: ThemeResult) => string`                               | 导出 `:root` / `:root[theme-mode='dark']` 下的 TDesign CSS 变量 |
| `themeToJson`         | `(theme: ThemeResult) => string`                               | 导出格式化 JSON                                                 |

#### 颜色工具函数

| 函数         | 签名                         | 说明            |
| ------------ | ---------------------------- | --------------- |
| `isValidHex` | `(input: string) => boolean` | 校验 HEX 合法性 |

> 底层色阶算法位于 `src/utils/palette.ts`（无三方依赖的 HCT 色阶生成，含 `generateBrandPalette` / `generateNeutralPalette` / `generateFunctionalPalette` / `generateBrandTokenMap`），HCT/CAM16 转换由 `src/utils/hct.ts` 提供。这两个模块当前未从 npm 包入口再导出，仅供仓库内使用。

#### 类型

```ts
// 类型随 generateTheme 等函数的返回值自动推导。
// 当前 npm 包入口仅再导出 color.ts；如需显式 import 类型名，
// 请在仓库内从 src/types/theme.ts 引用：
import type {
  ScaleLevel, // 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  ColorScale, // Record<ScaleLevel, string>
  ThemeTokens, // brand / brandHover / brandActive / brandSubtle / bg / surface ...
  ThemeMode, // { primary, neutral, bgGrays, brandIdx, tokens }
  ThemeResult, // { light, dark }
  ThemeOptions, // { neutralInheritPrimary?: boolean }
} from "@/types/theme";
```

### 在 Vue 中复用 Hook（Demo 同款逻辑）

Demo 内部使用 `src/hooks/useThemeGenerator.ts`，它封装了响应式状态、TDesign CSS 变量注入和深浅切换，可直接参考或复用：

```ts
import { useThemeGenerator } from "@/hooks/useThemeGenerator";

const {
  primaryColor, // ref<string>，当前主色
  mode, // ref<'light' | 'dark'>
  error, // ref<string | null>，非法输入提示
  neutralInherit, // ref<boolean>，中性色是否关联主题色（默认 true）
  theme, // computed<ThemeResult | null>
  current, // computed<ThemeMode | null>，当前深浅模式的 ThemeMode
  primaryScale, // computed<ColorScale>，当前模式品牌色阶
  neutralScale, // computed<ColorScale>，当前模式中性色阶
  tokens, // computed<ThemeTokens | null>
  cssVars, // computed<Record<string,string>>，注入到根节点的 --td-* 变量
  setColor, // (hex: string) => void
  setMode, // (m: 'light' | 'dark') => void
  setNeutralInherit, // (val: boolean) => void
  exportCss, // () => string
  exportJson, // () => string
  PRESETS, // 预设色板（8 色）
} = useThemeGenerator("#1C4D9F");

// 把 cssVars 挂到根节点，页面与 TDesign 组件即自动适配
// <div class="page" :style="cssVars"> ... </div>
```

---

## 🖥️ Demo 使用指南

启动 `pnpm dev` 后，界面提供以下能力：

1. **选择主色**
   - 点击取色器（`t-color-picker`）用面板选色，或直接输入任意 HEX（如 `#1C4D9F`、`00A870`）。
   - 非法输入会显示错误提示，不会崩溃。
2. **颜色预设**
   - 内置 8 个常用主题色（Azure / TDesign / Emerald / Orange / Coral / Purple / Teal / Slate），点击即应用。
3. **中性色关联开关**
   - 开启（默认）后中性灰带极淡主题色相，与 TDesign 官方生成器一致；关闭则为不关联主色的平滑灰阶。
4. **色阶预览**
   - 实时展示「主题色阶」与「中性色阶」两组 50–900 色块，主色档位动态高亮并标注 `BRAND`（如 `#0052D9` → 600、`#1C4D9F` → 700）。
   - 点击任意色块复制其 HEX。
5. **深浅模式切换**
   - 右上角 `Light / Dark` 切换。深色品牌色阶为浅色反序（腾讯蓝用固定深蓝），背景更暗、文字为白色。
6. **主题预览**
   - 用 TDesign 组件（按钮、卡片、输入、标签等）实时预览当前主题色的实际观感。
7. **导出**
   - 切换 **CSS Variables / JSON** 标签，一键复制或下载 `theme.css` / `theme.json`。

---

## 🌗 深色模式说明

- 通过 `<html theme-mode="dark">` 属性驱动 TDesign 组件库自身的深色样式（见 `useThemeGenerator` 的 `applyThemeMode`）。
- 本工具额外在根节点注入 `--td-*` 变量，使页面底色、文字、卡片等随深色自动切换（Demo 的 `.page` 用 `:style="cssVars"` 消费这些变量，不写死 `background`/`color`）。
- 深色品牌色阶 = 浅色色阶**反序**前 10 档（腾讯蓝 `#0052D9` 特例使用固定深蓝色阶）。
- 背景灰 gray-11..14 取自中性色阶 11..14（深浅两模式取值一致，随中性关联开关变化）。

---

## 🏗️ 构建与发布

### 构建库（产出 `dist/lib`）

```bash
pnpm build:lib
```

执行 `tsc -p tsconfig.lib.json`（编译 `src/utils/color.ts` 及其依赖闭包：`palette.ts` / `hct.ts` / `tdDefaults.ts` / `types/theme.ts`），并由 `scripts/build-lib-index.mjs` 生成 `dist/lib/index.js` + `index.d.ts` 桶文件（当前仅再导出 `./utils/color`）。`package.json` 的 `main` / `module` / `types` / `exports` 均指向 `dist/lib`，`files` 仅包含 `dist/lib`。

### 本地预发布校验

```bash
pnpm publish --dry-run
# 查看将要上传的文件清单
pnpm pack
```

---

## 📂 项目结构

```
ThemePaletteGenerator/
├── .github/workflows/release.yml   # CI 发版（npm OIDC 可信发布）
├── scripts/
│   ├── build-lib-index.mjs         # 生成 dist/lib 桶文件 index.{js,d.ts}
│   └── extract-changelog.mjs       # 从 CHANGELOG.md 提取指定版本段（供 Release 使用）
├── src/
│   ├── App.vue                     # Demo 主界面（两栏布局 + Hero + 深浅切换）
│   ├── main.ts                     # 入口（挂载 TDesign + App）
│   ├── env.d.ts
│   ├── style.css
│   ├── components/
│   │   ├── ColorInput.vue          # 取色器 + HEX 输入 + 校验提示
│   │   ├── ColorScale.vue          # 色阶展示（连续色带 + 主色档位高亮 + 点击复制）
│   │   ├── ThemePreview.vue         # TDesign 组件画廊预览
│   │   └── ExportPanel.vue          # CSS/JSON 导出（复制 / 下载）
│   ├── hooks/
│   │   └── useThemeGenerator.ts     # 响应式主题状态 + cssVar 注入 + 深浅切换
│   ├── types/
│   │   └── theme.ts                # 类型定义（ScaleLevel / ColorScale / ThemeResult ...）
│   └── utils/
│       ├── hct.ts                  # HCT/CAM16 色彩空间转换（手写实现）
│       ├── palette.ts              # ★ 色阶核心算法：品牌/功能/中性色阶 + 主色动态锚定
│       ├── tdDefaults.ts           # TDesign 默认色彩变量（用于最小导出去重）
│       └── color.ts                # 编排层：完整主题 + 语义 token + CSS/JSON 导出
├── CHANGELOG.md
├── package.json
├── tsconfig.json / tsconfig.lib.json
└── vite.config.ts
```

---

## 🧠 算法简述

- **品牌/功能色阶**：按输入色相映射到色族（红/橙/黄/柠檬/青柠/绿/薄荷/青/蓝/紫/粉），沿该族 bezier 缓动曲线采样 10 档 tone 序列，并按族参数做分段色度调整；主色档位由 CIEDE2000 色差最小化动态确定，remain 模式下该档严格等于输入色。
- **深色品牌色阶**：浅色色阶反序；腾讯蓝 `#0052D9` 特例使用固定深蓝色阶。
- **中性色阶**：关联主题色时，以输入色的 hue/chroma 在 14 档 tone 上展开，并与黑色阶按 RGB 权重混合（带极淡主题色相）；未关联时以中性基色 `#dadada` 生成标准灰阶。
- **CSS 变量导出**：品牌/中性色阶 + 品牌别名（由 `brandIdx` 动态推导）+ 背景/文字/边框语义变量；与默认值一致的项不输出，保持最小导出。

---

## 📄 License

MIT © Wesley
