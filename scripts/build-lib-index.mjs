import { writeFileSync } from "node:fs";

const dir = "dist/lib";
// .js 需显式后缀以兼容 Node ESM 解析；.d.ts 由 TS 解析可省略
writeFileSync(`${dir}/index.js`, "export * from './utils/color.js';\n");
writeFileSync(`${dir}/index.d.ts`, "export * from './utils/color';\n");
console.log("[lib] index barrel written -> dist/lib/index.{js,d.ts}");
