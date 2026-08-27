# 主题色阶生成器 · Theme Palette Generator

> 输入一个主色 HEX，自动生成一套**感知均匀、色相零漂移**的完整 Design System 主题：10 级品牌色阶、10 级中性色阶、浅色 / 深色双模式，并直接输出可落地的 **TDesign CSS 变量**（`--td-brand-color` / `--td-gray-color` 等）。

---

## ✨ 特性

- **感知均匀色阶**：核心算法落在 [OKLCH](https://oklch.com/) 色彩空间，相邻级别视觉差异一致，浅端不灰、深端不脏。
- **色相零漂移**：全程锁定色相 `H`，只在亮度 `L` 上做曲线插值，任意主色都不会“蓝变紫、红变橙”。
- **主色锚定 600**：输入主色严格映射到 600 级（与 TDesign 默认品牌色语义一致）。
- **深浅双模式**：浅色 + 深色各一套，深色模式按 TDesign 原厂取值对齐（独立反向品牌色阶、背景灰 `gray-11..14`、白色文字）。
- **一键对接 TDesign**：导出 `:root` / `.dark` 下的 `--td-*` 变量，可直接挂到页面根节点，组件库与页面自动适配深色。
- **零依赖核心算法**：`color.ts` 不依赖任何第三方库（仅 TypeScript），可作为纯函数库复用。
- **内置可视化 Demo**：取色器、色阶预览、深浅切换、实时更新、点击复制、CSS/JSON 导出。
- **安全发版**：CI 使用 npm **OIDC 可信发布**（Trusted Publishing），无长期密钥，自动附带 Supply-chain Provenance。

---

## 🧩 技术栈

| 维度      | 选型                                                       |
| --------- | ---------------------------------------------------------- |
| 核心算法  | TypeScript（OKLCH 色彩转换，手写实现，零依赖）             |
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

本仓库的核心算法 `src/utils/color.ts` 以纯函数形式提供，已编译为可发布的 npm 包 `@wesley-0808/theme-palette-generator`。

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
  /* 浅色：品牌色阶 / 中性色阶 / 语义 token */
}
.dark {
  /* 深色：反向更明亮的品牌色阶 / 背景灰 gray-11..14 */
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

| 参数                            | 类型      | 说明                                                                                              |
| ------------------------------- | --------- | ------------------------------------------------------------------------------------------------- |
| `primaryColor`                  | `string`  | 主色 HEX，如 `"#0052D9"`、`"1C4D9F"`（3/6 位均可，可不带 `#`）                                    |
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
  bgGrays: string[]; // 深色背景灰 gray-11..14（深浅取值一致）
  tokens: ThemeTokens; // 语义化 token（brand / bg / text ...）
}
```

#### 色阶与单级生成函数

| 函数                     | 签名                                                         | 说明                                                       |
| ------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------- |
| `generateColorScale`     | `(primaryColor: string) => ColorScale`                       | 仅生成浅色品牌 10 级色阶（主色按 CIEDE2000 动态锚定）      |
| `generateNeutralScale`   | `(primaryColor: string, related?: boolean) => ColorScale`    | 仅生成中性 10 级色阶（related 默认 true，关联主题色）      |
| `generateDarkBrandScale` | `(primaryColor: string) => ColorScale`                       | 仅生成深色品牌 10 级色阶（浅色色阶反向前 10 档）           |

`ColorScale` 是 `{ 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 }` 到 HEX 字符串的映射。

#### 导出函数

| 函数                  | 签名                             | 说明                                         |
| --------------------- | -------------------------------- | -------------------------------------------- |
| `themeToCssVariables` | `(theme: ThemeResult) => string` | 导出 `:root` / `:root[theme-mode='dark']` 下的 TDesign CSS 变量 |
| `themeToJson`         | `(theme: ThemeResult) => string` | 导出格式化 JSON                              |

#### 颜色工具函数

| 函数         | 签名                         | 说明                |
| ------------ | ---------------------------- | ------------------- |
| `isValidHex` | `(input: string) => boolean` | 校验 HEX 合法性     |

> 底层色阶算法位于 `src/utils/palette.ts`（无三方依赖的 HCT/CAM16 复刻，与 TDesign `tvision-color` 字节级一致），由 `src/utils/hct.ts` 提供 HCT 转换。
| `gamutMapOklch`             | `(L,C,H) => Oklch`                        | 色域映射（保持 L/H，二分降 C 落入 sRGB） |
| `relativeLuminance`         | `(hex) => number`                         | 相对亮度（0–1）                          |
| `contrastText`              | `(hex) => "#000000" \| "#ffffff"`         | 返回对比度更高的文字色                   |

#### 类型

```ts
import type {
  ScaleLevel, // 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  ColorScale, // Record<ScaleLevel, string>
  ThemeTokens, // brand / brandHover / brandActive / brandSubtle / bg / surface ...
  ThemeMode, // { primary, neutral, bgGrays, tokens }
  ThemeResult, // { light, dark }
  ThemeOptions, // { neutralInheritPrimary?: boolean }
  Oklch, // { l, c, h }
} from "@wesley-0808/theme-palette-generator";
```

### 在 Vue 中复用 Hook（Demo 同款逻辑）

Demo 内部使用 `src/hooks/useThemeGenerator.ts`，它封装了响应式状态、TDesign CSS 变量注入和深浅切换，可直接参考或复用：

```ts
import { useThemeGenerator } from "@/hooks/useThemeGenerator";

const {
  primaryColor, // ref<string>，当前主色
  mode, // ref<'light' | 'dark'>
  error, // ref<string | null>，非法输入提示
  neutralInherit, // ref<boolean>，中性色是否关联主题色
  theme, // computed<ThemeResult | null>
  primaryScale, // computed<ColorScale>，当前模式品牌色阶
  neutralScale, // computed<ColorScale>，当前模式中性色阶
  tokens, // computed<ThemeTokens | null>
  cssVars, // computed<Record<string,string>>，注入到根节点的 --td-* 变量
  setColor, // (hex: string) => void
  setMode, // (m: 'light' | 'dark') => void
  setNeutralInherit, // (val: boolean) => void
  exportCss, // () => string
  exportJson, // () => string
  PRESETS, // 预设色板
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
   - 开启后，中性色阶会极轻继承主色相（蓝→蓝灰、紫→紫灰）；关闭则为纯灰，对齐 TDesign `--td-gray-color`。
4. **色阶预览**
   - 实时展示「主题色阶」与「中性色阶」两组 50–900 色块，主色级（浅=600 / 深=700）高亮并标注 `BRAND`。
   - 点击任意色块复制其 HEX。
5. **深浅模式切换**
   - 右上角 `Light / Dark` 切换。深色模式按 TDesign 原厂取值渲染，背景更暗、主色更亮、文字为白色。
6. **主题预览**
   - 用 TDesign 组件（按钮、卡片、输入、标签等）实时预览当前主题色的实际观感。
7. **导出**
   - 切换 **CSS Variables / JSON** 标签，一键复制或下载 `theme.css` / `theme.json`。

---

## 🌗 深色模式说明

- 通过 `<html theme-mode="dark">` 属性驱动 TDesign 组件库自身的深色样式（见 `useThemeGenerator` 的 `applyThemeMode`）。
- 本工具额外在根节点注入 `--td-*` 变量，使页面底色、文字、卡片等随深色自动切换（Demo 的 `.page` 用 `:style="cssVars"` 消费这些变量，不写死 `background`/`color`）。
- 深色品牌色阶为**独立、反向、更明亮**的尺度（`gray-1` 最深、`gray-10` 最亮），背景层级使用 `gray-11..14`（`#393939 / #2c2c2c / #242424 / #181818`）。

---

## 🏗️ 构建与发布

### 构建库（产出 `dist/lib`）

```bash
pnpm build:lib
```

执行 `tsc -p tsconfig.lib.json`（仅编译 `src/utils/color.ts` 与 `src/types/theme.ts`）并生成 `dist/lib/index.js` + `index.d.ts` 桶文件。`package.json` 的 `main` / `module` / `types` / `exports` 均指向 `dist/lib`，`files` 仅包含 `dist/lib`。

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
├── docs/
│   └── DESIGN.md                   # 设计文档（算法、TDesign 关联、深色对齐、CI）
├── scripts/
│   ├── build-lib-index.mjs         # 生成 dist/lib 桶文件 index.{js,d.ts}
│   └── extract-changelog.mjs       # 从 CHANGELOG.md 提取指定版本段（供 Release 使用）
├── src/
│   ├── App.vue                     # Demo 主界面（两栏布局 + Hero + 深浅切换）
│   ├── main.ts                     # 入口（挂载 TDesign + App）
│   ├── style.css
│   ├── components/
│   │   ├── ColorInput.vue          # 取色器 + HEX 输入 + 校验提示
│   │   ├── ColorScale.vue          # 色阶展示（连续色带 + 主色级高亮 + 点击复制）
│   │   ├── ThemePreview.vue         # TDesign 组件画廊预览
│   │   └── ExportPanel.vue          # CSS/JSON 导出（复制 / 下载）
│   ├── hooks/
│   │   └── useThemeGenerator.ts     # 响应式主题状态 + cssVar 注入 + 深浅切换
│   ├── types/
│   │   └── theme.ts                # 类型定义（ScaleLevel / ColorScale / ThemeResult ...）
│   └── utils/
│       └── color.ts                # ★ 核心算法：OKLCH 转换 + 色阶生成 + CSS 导出
├── CHANGELOG.md
├── package.json
├── tsconfig.json / tsconfig.lib.json
└── vite.config.ts
```

---

## 🧠 算法简述

- 在 **OKLCH** 空间生成色阶：锁定色相 `H`，只在亮度 `L` 上按 TDesign 反推的感知均匀曲线插值，色度 `C` 在主色处最高、向两端递减，极端亮度区域对 `C` 做温和衰减。
- 主色锚定 **600**（对应 TDesign `--td-brand-color-7`），保证 600 严格等于输入色。
- 浅端溢出色域时通过 `gamutMapOklch` 二分降低 `C`，保持 `L/H` 不变。
- 深色品牌色阶为独立反向尺度，中性色阶深浅一致，仅背景灰与语义 token 随模式变化。

完整推导、TDesign 关联取值与深色对齐细节见 [`docs/DESIGN.md`](./docs/DESIGN.md)。

---

## 📄 License

MIT © Wesley
