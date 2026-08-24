<script setup lang="ts">
import ColorInput from "./components/ColorInput.vue";
import ColorScale from "./components/ColorScale.vue";
import ThemePreview from "./components/ThemePreview.vue";
import ExportPanel from "./components/ExportPanel.vue";
import { useThemeGenerator } from "./hooks/useThemeGenerator";
import type { ThemeMode } from "./hooks/useThemeGenerator";

const {
  primaryColor,
  mode,
  error,
  neutralInherit,
  setNeutralInherit,
  theme,
  primaryScale,
  neutralScale,
  tokens,
  cssVars,
  setColor,
  setMode,
  PRESETS,
} = useThemeGenerator("#1C4D9F");

const MAIN_LEVEL = { light: 600, dark: 700 } as const;

function onModeChange(val: string | number | boolean | undefined) {
  setMode(val as ThemeMode);
}
function onNeutralInheritChange(val: string | number | boolean) {
  setNeutralInherit(Boolean(val));
}
</script>

<template>
  <div class="page" :style="cssVars">
    <header class="topbar">
      <div class="brand">
        <span
          class="brand-dot"
          :style="{ background: 'var(--td-brand-color)' }"
        />
        <span class="brand-name">主题色阶生成器 Theme Palette Generator</span>
      </div>
      <t-radio-group
        :value="mode"
        variant="default-filled"
        @change="onModeChange"
      >
        <t-radio-button value="light">Light</t-radio-button>
        <t-radio-button value="dark">Dark</t-radio-button>
      </t-radio-group>
    </header>

    <div class="layout">
      <aside class="sidebar">
        <section class="card">
          <span class="label" style="margin-top: 0">主题色</span>
          <ColorInput
            v-model="primaryColor"
            :error="error"
            :presets="PRESETS"
          />

          <span class="label">颜色预设</span>
          <div class="presets">
            <t-tooltip v-for="p in PRESETS" :key="p.hex" :content="p.name">
              <t-button
                class="preset"
                shape="square"
                size="small"
                :style="{ background: p.hex, borderColor: p.hex }"
                @click="setColor(p.hex)"
              />
            </t-tooltip>
          </div>

          <span class="label">中性色</span>
          <div class="switch-wrap">
            <span class="switch-label">关联主题色</span>
            <t-switch
              :value="neutralInherit"
              @change="onNeutralInheritChange"
            />
          </div>
        </section>
      </aside>

      <main class="canvas">
        <section class="card">
          <ColorScale
            title="主题色阶"
            :scale="primaryScale"
            :main-level="MAIN_LEVEL[mode]"
          />
        </section>

        <section class="card">
          <ColorScale
            title="中性色阶"
            :scale="neutralScale"
            :main-level="MAIN_LEVEL[mode]"
          />
        </section>

        <section class="card">
          <span class="inner-label">主题预览</span>
          <ThemePreview :tokens="tokens" />
        </section>

        <section class="card">
          <span class="inner-label">导出</span>
          <ExportPanel :theme="theme" />
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 0 16px 64px;
  background: var(--td-bg-color-page);
  color: var(--td-text-color-primary);
  transition:
    background 0.2s ease,
    color 0.2s ease;
}
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  margin: 0 -16px 24px;
  padding: 0 16px;
  backdrop-filter: saturate(180%) blur(12px);
  background: color-mix(in srgb, var(--td-bg-color-container) 80%, transparent);
  border-bottom: 1px solid var(--td-component-stroke);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-dot {
  width: 26px;
  height: 26px;
  border-radius: 4px;
}
.brand-name {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: var(--td-text-color-primary);
}
.layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  align-items: start;
}
.sidebar {
  position: sticky;
  top: 80px;
}
.card {
  border-radius: 12px;
  padding: 22px;
  margin-bottom: 20px;
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
  border: 1px solid var(--td-component-stroke);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 4px 12px rgba(0, 0, 0, 0.04);
  transition:
    background 0.2s ease,
    color 0.2s ease;
}
.label {
  display: block;
  margin: 12px 0 6px 0;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--td-text-color-primary-secondary);
}
.inner-label {
  display: block;
  margin-bottom: 18px;
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--td-text-color-primary);
}
.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.switch-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.switch-label {
  font-size: 13px;
  color: var(--td-text-color-primary);
}
.foot {
  margin-top: 32px;
  text-align: center;
  font-size: 12px;
  color: var(--td-text-color-primary-secondary);
}
@media (max-width: 880px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
  }
  .hero-hex {
    font-size: 32px;
  }
}
</style>
