# Theme Palette Generator

基于 Vue 3 + TypeScript + tdesign-vue-next 的主题色生成器。可生成与 TDesign 官方
**字节级一致**的品牌 / 功能 / 中性色阶，并导出 TDesign CSS 变量。

## 运行

```bash
npm install
npm run dev       # 本地开发
npm run build     # 类型检查 + 生产构建
```

## 核心算法（无依赖 HCT 复刻）

`src/utils/palette.ts` 逐字节移植 TDesign `tvision-color` + `theme-generator` 算法：

- 底层 HCT/CAM16 由 `src/utils/hct.ts` 自实现（复刻 `@material/material-color-utilities`），
  **无任何第三方颜色库依赖**。
- 品牌/功能色阶 = `pr`：bezier 缓动 tone 序列 + 分段色度 `ur` + CIEDE2000 主色动态锚定
  + remain 模式保留输入色（TD 默认 `isRemainMode`）。
- 中性灰 1..14 = `getNeutralColor(brand)`（品牌关联、带极淡主题色相），与
  `theme.css` 金标准字节级一致。
- 深色品牌色阶 = 浅色反向前 10 档（腾讯蓝特例用固定深蓝色阶）。
- 品牌别名由 `generateBrandTokenMap(brandIdx)` 动态推导（非固定 600/700）。

`src/utils/color.ts` 负责编排（生成 Light/Dark 完整主题、语义 Token、`buildModeCssVars`
/`themeToCssVariables` 导出），全部委托 `palette.ts`。

## 验证

- `tsc -p tsconfig.json --noEmit` 通过。
- `/tmp/verify-palette.ts`、`/tmp/verify-color.ts`（esbuild 打包后 node 运行）均 ALL PASS，
  对照 `~/Downloads/theme.css` 金标准做字节级比对。

## 结构

```
src/
├── types/theme.ts                # 类型定义（ThemeMode 含 brandIdx）
├── utils/hct.ts                  # HCT/CAM16 复刻（无依赖）
├── utils/palette.ts              # tvision-color 算法复刻（无依赖）
├── utils/color.ts                # 编排 + 语义 Token + CSS 变量导出
├── utils/tdDefaults.ts           # TDesign 默认变量（omit-defaults 优化）
├── hooks/useThemeGenerator.ts    # 响应式状态
├── components/                   # ColorInput / ColorScale / ThemePreview / ExportPanel
├── App.vue / main.ts
```
