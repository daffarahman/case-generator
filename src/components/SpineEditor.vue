<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { JewelPart } from '../types';
import { DIMENSIONS, inchesToPixels } from '../constants';
import Button from 'primevue/button';

interface Props {
  part: JewelPart;
  containerSize: { width: number; height: number };
}

interface Emits {
  (e: 'update:part', value: JewelPart): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const SPINE_WIDTH = DIMENSIONS.leftSpine.width;
const SPINE_HEIGHT = DIMENSIONS.leftSpine.height;
const BLEED_SIZE = inchesToPixels(0.125);

const isHorizontalView = ref(false);
const imageElement = ref<HTMLImageElement | null>(null);
const imageNaturalWidth = ref(0);
const imageNaturalHeight = ref(0);
const isImageLoaded = ref(false);

const stageConfig = computed(() => {
  if (isHorizontalView.value) {
    return { width: SPINE_HEIGHT, height: SPINE_WIDTH };
  }
  return { width: SPINE_WIDTH, height: SPINE_HEIGHT };
});

const calculatedScale = computed(() => {
  if (!isImageLoaded.value || imageNaturalHeight.value === 0) return 1;
  return SPINE_HEIGHT / imageNaturalHeight.value;
});

const scaledImageWidth = computed(() => imageNaturalWidth.value * calculatedScale.value);

const imageConfig = computed(() => {
  if (!isImageLoaded.value || !imageElement.value) return null;

  const baseConfig = {
    image: imageElement.value,
    x: props.part.x,
    y: 0,
    scaleX: calculatedScale.value,
    scaleY: calculatedScale.value,
    draggable: true,
  };

  if (isHorizontalView.value) {
    return { ...baseConfig, rotation: 90, offsetX: 0, offsetY: imageNaturalHeight.value };
  }

  return baseConfig;
});

const safetyZoneConfig = computed(() => {
  if (isHorizontalView.value) {
    return {
      x: BLEED_SIZE, y: BLEED_SIZE, width: SPINE_HEIGHT - (BLEED_SIZE * 2), height: SPINE_WIDTH - (BLEED_SIZE * 2),
      stroke: '#9CA3AF', strokeWidth: 1, dash: [4, 4], listening: false,
    };
  }
  return {
    x: BLEED_SIZE, y: BLEED_SIZE, width: SPINE_WIDTH - (BLEED_SIZE * 2), height: SPINE_HEIGHT - (BLEED_SIZE * 2),
    stroke: '#9CA3AF', strokeWidth: 1, dash: [4, 4], listening: false,
  };
});

const backgroundConfig = computed(() => {
  if (isHorizontalView.value) {
    return { x: 0, y: 0, width: SPINE_HEIGHT, height: SPINE_WIDTH, fill: '#F9FAFB' };
  }
  return { x: 0, y: 0, width: SPINE_WIDTH, height: SPINE_HEIGHT, fill: '#F9FAFB' };
});

const borderConfig = computed(() => {
  if (isHorizontalView.value) {
    return { x: 0, y: 0, width: SPINE_HEIGHT, height: SPINE_WIDTH, stroke: '#E5E7EB', strokeWidth: 1, listening: false };
  }
  return { x: 0, y: 0, width: SPINE_WIDTH, height: SPINE_HEIGHT, stroke: '#E5E7EB', strokeWidth: 1, listening: false };
});

const dragBoundFunc = (pos: { x: number; y: number }) => {
  const maxX = Math.min(0, SPINE_WIDTH - scaledImageWidth.value);
  return { x: Math.max(maxX, Math.min(0, pos.x)), y: 0 };
};

const handleDragEnd = (e: any) => {
  emit('update:part', { ...props.part, x: e.target.x(), y: 0, scale: calculatedScale.value });
};

const toggleViewMode = () => {
  isHorizontalView.value = !isHorizontalView.value;
};

const loadImage = (url: string | null) => {
  if (!url) {
    isImageLoaded.value = false;
    imageElement.value = null;
    return;
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    imageElement.value = img;
    imageNaturalWidth.value = img.naturalWidth;
    imageNaturalHeight.value = img.naturalHeight;
    isImageLoaded.value = true;
  };
  img.onerror = () => { isImageLoaded.value = false; };
  img.src = url;
};

watch(() => props.part.imageUrl, (url) => { loadImage(url); }, { immediate: true });

onMounted(() => { if (props.part.imageUrl) loadImage(props.part.imageUrl); });
</script>

<template>
  <div class="flex flex-col items-center gap-4 p-4 bg-[#FAFAFA] border border-gray-200 rounded-lg">
    <!-- Toggle -->
    <Button 
      :label="isHorizontalView ? 'Vertical View' : 'Horizontal View'"
      :icon="isHorizontalView ? 'pi pi-arrows-v' : 'pi pi-arrows-h'"
      severity="secondary"
      @click="toggleViewMode"
    />

    <!-- Canvas -->
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <v-stage :config="stageConfig">
        <v-layer>
          <v-rect :config="backgroundConfig" />
          <v-image v-if="imageConfig" :config="imageConfig" :dragBoundFunc="dragBoundFunc" @dragend="handleDragEnd" />
          <v-rect :config="borderConfig" />
          <v-rect :config="safetyZoneConfig" />
        </v-layer>
      </v-stage>
    </div>

    <!-- Info -->
    <div class="flex gap-4 text-xs text-gray-500">
      <span>{{ DIMENSIONS.leftSpine.widthInches }}" × {{ DIMENSIONS.leftSpine.heightInches }}"</span>
      <span class="text-gray-400">Bleed: 0.125"</span>
    </div>
  </div>
</template>
