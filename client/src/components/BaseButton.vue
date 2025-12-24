<template>
  <button
    class="btn"
    :class="[
      variant === 'primary' && 'primary',
      variant === 'outline' && 'outline',
      variant === 'danger' && 'danger',
      size === 'sm' && 'sm'
    ]"
    :disabled="disabled"
    type="button"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: "primary" }, // primary | outline | danger
  size: { type: String, default: "md" }, // md | sm
  disabled: { type: Boolean, default: false },
});
</script>

<style scoped>
.btn{
  padding:10px 12px;
  border-radius:10px;
  cursor:pointer;
  border:1px solid #111;
  background:#111;
  color:#fff;
  transition: transform .08s ease, background .15s ease, box-shadow .15s ease;
}
.btn:disabled{opacity:.6;cursor:not-allowed;transform:none;}

.btn:active{transform:translateY(1px);}
.btn:focus-visible{outline:2px solid rgba(0,0,0,.25);outline-offset:2px;}

.primary{background:#111;color:#fff;border-color:#111;}
.outline{background:transparent;color:#111;border-color:#ddd;}
.outline:hover{background:#f6f6f6;}
.danger{background:#fff;color:#b00020;border-color:#ffb3b3;}
.danger:hover{background:#fff1f1;}

.sm{padding:8px 10px;font-size:12px;border-radius:10px;}
</style>
