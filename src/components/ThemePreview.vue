<script setup lang="ts">
import type { ThemeTokens } from "../types/theme";

defineProps<{
  tokens: ThemeTokens | null;
}>();

// 语义色图例：标签 + 对应 cssVar（由根节点注入，随主题自适应）
const semantics = [
  { label: "Brand", varName: "--td-brand-color" },
  { label: "Hover", varName: "--td-brand-color-hover" },
  { label: "Active", varName: "--td-brand-color-active" },
  { label: "Subtle", varName: "--td-brand-color-light" },
  { label: "Border", varName: "--td-component-stroke" },
  { label: "Surface", varName: "--td-bg-color-container" },
];
</script>

<template>
  <div v-if="tokens" class="preview">
    <t-card class="card" title="卡片标题 Card Title">
      <p class="desc">
        这是一段用于展示中性文字与次要文字的示例内容，验证不同等级在真实界面中的可读性与层级关系。
      </p>
      <t-space class="btns" size="small" break-line>
        <t-button theme="primary">Primary</t-button>
        <t-button theme="primary" variant="outline">Secondary</t-button>
        <t-button theme="primary" variant="text">Text</t-button>
        <t-button theme="default">Default</t-button>
      </t-space>
      <t-input :model-value="'这是输入的内容'" readonly class="field" />
    </t-card>

    <div class="usages">
      <div class="usage">
        <span class="usage-k">链接 Link</span>
        <a class="link" href="javascript:void(0)">查看详情 →</a>
      </div>
      <div class="usage">
        <span class="usage-k">标签 Tag</span>
        <t-space size="small">
          <t-tag theme="primary" variant="light">Primary</t-tag>
          <t-tag theme="primary" variant="outline">Outline</t-tag>
          <t-tag theme="primary">Solid</t-tag>
        </t-space>
      </div>
    </div>

    <div class="legend">
      <div v-for="s in semantics" :key="s.varName" class="legend-item">
        <span class="dot" :style="{ background: `var(${s.varName})` }" />
        <span class="legend-label">{{ s.label }}</span>
        <span class="legend-var">{{ s.varName }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview {
  border-radius: 10px;
  color: var(--td-text-color-primary);
}
.card {
  border-radius: 10px;
}
.desc {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--td-text-color-primary-secondary);
}
.btns {
  margin-bottom: 16px;
}
.field {
  max-width: 340px;
}
.usages {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 18px;
}
.usage {
  display: flex;
  align-items: center;
  gap: 10px;
}
.usage-k {
  font-size: 12px;
  color: var(--td-text-color-primary-secondary);
}
.link {
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  color: var(--td-brand-color);
}
.link:hover {
  color: var(--td-brand-color-hover);
}
.legend {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 16px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--td-component-stroke);
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dot {
  width: 16px;
  height: 16px;
  border-radius: 5px;
  border: 1px solid var(--td-component-stroke);
  flex-shrink: 0;
}
.legend-label {
  font-size: 12px;
  font-weight: 600;
}
.legend-var {
  font-size: 10px;
  font-family: "SFMono-Regular", Consolas, monospace;
  color: var(--td-text-color-primary-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 640px) {
  .legend {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
