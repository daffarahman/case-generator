<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { FrontCover } from '../types';
import { DIMENSIONS, inchesToPixels } from '../constants';

interface Props {
  front: FrontCover;
}

interface Emits {
  (e: 'update:front', value: FrontCover): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const FRONT_WIDTH = DIMENSIONS.frontCover.width;
const FRONT_HEIGHT = DIMENSIONS.frontCover.height;
const BLEED_SIZE = inchesToPixels(0.125);

const imageElement = ref<HTMLImageElement | null>(null);
const isImageLoaded = ref(false);
const imageNatural = ref({ width: 0, height: 0 });

const stageConfig = computed(() => ({
  width: FRONT_WIDTH,
  height: FRONT_HEIGHT,
}));

const coverScale = computed(() => {
  if (!isImageLoaded.value || imageNatural.value.width === 0 || imageNatural.value.height === 0) {
    return 1;
  }
  const scaleX = FRONT_WIDTH / imageNatural.value.width;
  const scaleY = FRONT_HEIGHT / imageNatural.value.height;
  return Math.max(scaleX, scaleY);
});

const scaledWidth = computed(() => imageNatural.value.width * coverScale.value);
const scaledHeight = computed(() => imageNatural.value.height * coverScale.value);

const imageConfig = computed(() => {
  if (!isImageLoaded.value || !imageElement.value) return null;
  return {
    image: imageElement.value,
    x: props.front.image.x,
    y: props.front.image.y,
    scaleX: coverScale.value,
    scaleY: coverScale.value,
    draggable: true,
  };
});

const dragBoundFunc = (pos: { x: number; y: number }) => {
  const minX = FRONT_WIDTH - scaledWidth.value;
  const minY = FRONT_HEIGHT - scaledHeight.value;
  return {
    x: Math.max(minX, Math.min(0, pos.x)),
    y: Math.max(minY, Math.min(0, pos.y)),
  };
};

const handleDragEnd = (e: any) => {
  emit('update:front', {
    image: {
      ...props.front.image,
      x: e.target.x(),
      y: e.target.y(),
      scale: coverScale.value,
    },
  });
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
    imageNatural.value = { width: img.naturalWidth, height: img.naturalHeight };
    isImageLoaded.value = true;
  };
  img.onerror = () => {
    isImageLoaded.value = false;
  };
  img.src = url;
};

watch(() => props.front.image.imageUrl, (url) => {
  loadImage(url);
}, { immediate: true });

const safetyZoneConfig = computed(() => ({
  x: BLEED_SIZE,
  y: BLEED_SIZE,
  width: FRONT_WIDTH - (BLEED_SIZE * 2),
  height: FRONT_HEIGHT - (BLEED_SIZE * 2),
  stroke: '#9CA3AF',
  strokeWidth: 1,
  dash: [4, 4],
  listening: false,
}));

const borderConfig = computed(() => ({
  x: 0,
  y: 0,
  width: FRONT_WIDTH,
  height: FRONT_HEIGHT,
  stroke: '#E5E7EB',
  strokeWidth: 1,
  listening: false,
}));
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="font-display text-lg font-medium text-gray-900">Front Cover</h3>
      <div class="text-xs text-gray-500">
        {{ DIMENSIONS.frontCover.widthInches }}" × {{ DIMENSIONS.frontCover.heightInches }}"
        <span class="text-gray-400 ml-1">({{ DIMENSIONS.frontCover.widthMm }} × {{ DIMENSIONS.frontCover.heightMm }}mm)</span>
      </div>
    </div>

    <!-- Canvas Container -->
    <div class="bg-white border border-gray-200 rounded-lg p-6 flex justify-center">
      <v-stage :config="stageConfig">
        <v-layer>
          <!-- Background -->
          <v-rect :config="{ x: 0, y: 0, width: FRONT_WIDTH, height: FRONT_HEIGHT, fill: '#F9FAFB' }" />
          
          <!-- User Image -->
          <v-image
            v-if="imageConfig"
            :config="imageConfig"
            :dragBoundFunc="dragBoundFunc"
            @dragend="handleDragEnd"
          />
          
          <!-- Cut Line Border -->
          <v-rect :config="borderConfig" />
          
          <!-- Safety Zone -->
          <v-rect :config="safetyZoneConfig" />
        </v-layer>
      </v-stage>
    </div>

    <!-- Hint -->
    <p class="text-center text-xs text-gray-400">
      Drag to reposition
    </p>
  </div>
</template>
