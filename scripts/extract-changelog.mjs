#!/usr/bin/env node
// 从 CHANGELOG.md 中读取指定版本对应的更新日志段落，供 CI 发布 Release 使用。
// 用法：node scripts/extract-changelog.mjs <version>  ->  输出该版本段到 stdout
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const version = process.argv[2];
if (!version) {
  console.error('Usage: node scripts/extract-changelog.mjs <version>');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const changelogPath = join(here, '..', 'CHANGELOG.md');
const lines = readFileSync(changelogPath, 'utf8').split(/\r?\n/);

// 定位 `### <version>` 段：从该行到下一个 `### ` 之前
function findSection(target) {
  const start = lines.findIndex((l) => l.trim() === `### ${target}`);
  if (start === -1) return -1;
  let end = lines.length;
  for (let j = start + 1; j < lines.length; j++) {
    if (/^###\s/.test(lines[j])) {
      end = j;
      break;
    }
  }
  return { start, end };
}

let range = findSection(version);
let resolved = version;
if (range === -1) {
  // 预发版（如 1.0.0-alpha.0）回退到基础版本段（如 1.0.0）
  const base = version.split('-')[0];
  range = findSection(base);
  resolved = base;
  if (range === -1) {
    console.error(
      `[extract-changelog] CHANGELOG.md 中未找到版本段： ${version} (或 ${base})`,
    );
    process.exit(2);
  }
}

const section = lines.slice(range.start, range.end).join('\n').trimEnd();
process.stdout.write(section + '\n');
