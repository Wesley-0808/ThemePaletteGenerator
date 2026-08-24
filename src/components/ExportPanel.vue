<script setup lang="ts">
import { computed, ref } from "vue";
import { MessagePlugin } from "tdesign-vue-next";
import type { ThemeResult } from "../types/theme";
import { themeToCssVariables, themeToJson } from "../utils/color";

const props = defineProps<{
  theme: ThemeResult | null;
}>();

const activeTab = ref("css");

const jsonText = computed(() => (props.theme ? themeToJson(props.theme) : ""));
const cssText = computed(() =>
  props.theme ? themeToCssVariables(props.theme) : "",
);
const current = computed(() =>
  activeTab.value === "json" ? jsonText.value : cssText.value,
);

async function copy(label: string) {
  if (!current.value) return;
  try {
    await navigator.clipboard.writeText(current.value);
    MessagePlugin.success(`已复制${label}`);
  } catch {
    MessagePlugin.error("复制失败");
  }
}

function download(type: "json" | "css" = "json") {
  if (!props.theme) return;
  let blob: Blob | null = null;
  if (type === "json") {
    blob = new Blob([jsonText.value], { type: "application/json" });
  } else if (type === "css") {
    blob = new Blob([cssText.value], { type: "text/css" });
  }

  if (blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `theme.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
</script>

<template>
  <div class="export">
    <div class="bar">
      <t-radio-group v-model="activeTab" variant="default-filled">
        <t-radio-button value="css">CSS Variables</t-radio-button>
        <t-radio-button value="json">JSON</t-radio-button>
      </t-radio-group>
      <t-space size="small">
        <t-button
          theme="primary"
          @click="copy(activeTab === 'json' ? 'JSON' : 'CSS Variables')"
        >
          复制
        </t-button>
        <t-button v-if="activeTab === 'json'" @click="download()"
          >下载 JSON</t-button
        >
        <t-button v-if="activeTab === 'css'" @click="download('css')"
          >下载 CSS</t-button
        >
      </t-space>
    </div>

    <pre v-if="theme" class="code narrow-scrollbar">{{ current }}</pre>
  </div>
</template>

<style scoped>
.export {
  width: 100%;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.code {
  margin: 0;
  padding: 16px;
  background: var(--td-bg-color-page);
  color: var(--td-text-color-primary);
  border: 1px solid var(--td-component-stroke);
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.6;
  font-family: "SFMono-Regular", Consolas, monospace;
  overflow: auto;
  max-height: 420px;
}
</style>
