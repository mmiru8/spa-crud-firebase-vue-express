<template>
  <div v-if="modelValue" class="toast">
    {{ modelValue }}
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: "" },
});
</script>

<style scoped>
.toast{
  position: fixed;
  right: 18px;
  bottom: 18px;
  background: #111;
  color: #fff;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
  box-shadow: 0 10px 30px rgba(0,0,0,.18);
  z-index: 9999;
  max-width: 320px;
}
</style>
