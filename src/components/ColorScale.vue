<script setup lang="ts">
import { computed } from "vue";
import type { ColorScale, ScaleLevel } from "../types/theme";
import { MessagePlugin } from "tdesign-vue-next";

const props = defineProps<{
  title?: string;
  scale: ColorScale;
  /** 主色级（由父组件按真实锚定位传入），用于高亮 BRAND */
  mainLevel?: ScaleLevel;
}>();

const LEVELS: ScaleLevel[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

function colorOf(lv: ScaleLevel): string {
  return props.scale[lv] ?? "#ffffff";
}

const ribbonStyle = computed(() => ({
  background: `linear-gradient(90deg, ${LEVELS.map((lv) => colorOf(lv)).join(", ")})`,
}));

async function copy(hex: string) {
  try {
    await navigator.clipboard.writeText(hex);
    MessagePlugin.success(`已复制 ${hex.toUpperCase()}`);
  } catch {
    MessagePlugin.error("复制失败，请手动复制");
  }
}
</script>

<template>
  <div class="scale">
    <span v-if="title" class="inner-label">{{ title }}</span>

    <div class="ribbon" :style="ribbonStyle" />

    <div class="scale-grid">
      <t-tooltip v-for="lv in LEVELS" :key="lv" content="点击复制 HEX">
        <div
          class="scale-item"
          :class="{ 'is-main': lv === mainLevel }"
          @click="copy(colorOf(lv))"
        >
          <span v-if="lv === mainLevel" class="badge">BRAND</span>
          <div class="swatch" :style="{ background: colorOf(lv) }" />
          <span class="lv">{{ lv }}</span>
          <span class="hex">{{ colorOf(lv).toUpperCase() }}</span>
        </div>
      </t-tooltip>
    </div>
  </div>
</template>

<style scoped>
.inner-label {
  display: block;
  margin-bottom: 18px;
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--td-text-color-primary);
}
.ribbon {
  height: 8px;
  border-radius: 999px;
  margin-bottom: 16px;
}
.scale-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 8px;
}
.scale-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 6px 0;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.scale-item:hover {
  background: var(--td-bg-color-container-hover);
}
.swatch {
  width: 100%;
  height: 88px;
  border-radius: 8px;
  border: 1px solid var(--td-component-stroke);
}
.lv {
  font-size: 12px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}
.hex {
  font-size: 10px;
  font-family: "SFMono-Regular", Consolas, monospace;
  color: var(--td-text-color-primary-secondary);
}
.scale-item:hover .hex {
  color: var(--td-text-color-primary);
}
.is-main {
  background: var(--td-bg-color-container-hover);
}
.is-main .swatch {
  box-shadow:
    0 0 0 2px var(--td-brand-color),
    0 6px 16px rgba(0, 0, 0, 0.18);
}
.badge {
  position: absolute;
  top: -8px;
  z-index: 1;
  padding: 1px 7px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #fff;
  background: var(--td-brand-color);
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}
@media (max-width: 640px) {
  .scale-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
