<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  modelValue: string;
  error?: string | null;
  /** 取色器面板的预设色板（通常是常用主题色） */
  presets?: { name: string; hex: string }[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
}>();
// color-picker 仅接受合法 #rrggbb，做归一化容错
const pickerValue = computed(() => {
  const v = props.modelValue.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(v)) return "#" + v;
  if (/^[0-9a-fA-F]{3}$/.test(v))
    return (
      "#" +
      v
        .split("")
        .map((c) => c + c)
        .join("")
    );
  return "#1C4D9F";
});

const swatchColors = computed(() => (props.presets ?? []).map((p) => p.hex));

function onPicker(value: string) {
  if (value) emit("update:modelValue", value);
}
</script>

<template>
  <div class="color-input">
    <div class="row">
      <t-color-picker
        :value="pickerValue"
        :swatch-colors="swatchColors"
        format="HEX"
        :clearable="false"
        @change="onPicker"
      />
    </div>
    <p class="hint">选择或输入任意 HEX</p>
    <t-alert v-if="error" theme="error" :close="false" class="err">{{
      error
    }}</t-alert>
  </div>
</template>

<style scoped>
.color-input {
  width: 100%;
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.hex {
  flex: 1;
}
.hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--td-text-color-primary-secondary);
}
.err {
  margin-top: 12px;
}
</style>
