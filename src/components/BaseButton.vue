<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  disabled: false,
});

defineEmits<{
  (e: 'click'): void;
}>();
</script>

<template>
  <button
    :disabled="disabled"
    @click="$emit('click')"
    :class="[
      'px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
      variant === 'primary' 
        ? 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed' 
        : 'border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed'
    ]"
  >
    <slot />
  </button>
</template>
