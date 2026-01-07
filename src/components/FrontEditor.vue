<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { JewelPart, FrontCover } from '../types';
import { DIMENSIONS, inchesToPixels } from '../constants';

/**
 * FrontEditor Component
 * Manages the front cover: 4.75" x 4.75" square
 * Auto-scales images to cover and constrains dragging
 */

interface Props {
  front: FrontCover;
}

interface Emits {
  (e: 'update:front', value: FrontCover): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Dimensions
const FRONT_WIDTH = DIMENSIONS.frontCover.width;
const FRONT_HEIGHT = DIMENSIONS.frontCover.height;
const BLEED_SIZE = inchesToPixels(0.125);

// Image state
const imageElement = ref<HTMLImageElement | null>(null);
const isImageLoaded = ref(false);
const imageNatural = ref({ width: 0, height: 0 });

// Stage config
const stageConfig = computed(() => ({
  width: FRONT_WIDTH,
  height: FRONT_HEIGHT,
}));

// Calculate scale to "Cover" the square (fill both dimensions)
const coverScale = computed(() => {
  if (!isImageLoaded.value || imageNatural.value.width === 0 || imageNatural.value.height === 0) {
    return 1;
  }
  
  const scaleX = FRONT_WIDTH / imageNatural.value.width;
  const scaleY = FRONT_HEIGHT / imageNatural.value.height;
  
  // Use the larger scale to ensure full coverage
  return Math.max(scaleX, scaleY);
});

// Scaled dimensions
const scaledWidth = computed(() => imageNatural.value.width * coverScale.value);
const scaledHeight = computed(() => imageNatural.value.height * coverScale.value);

// Image config
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

// Drag bound function - prevent image from leaving bounds
const dragBoundFunc = (pos: { x: number; y: number }) => {
  // Calculate allowed range
  const minX = FRONT_WIDTH - scaledWidth.value;
  const minY = FRONT_HEIGHT - scaledHeight.value;
  
  return {
    x: Math.max(minX, Math.min(0, pos.x)),
    y: Math.max(minY, Math.min(0, pos.y)),
  };
};

// Handle drag end
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

// Load image
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

// Watch for image URL changes
watch(() => props.front.image.imageUrl, (url) => {
  loadImage(url);
}, { immediate: true });

// Safety zone config
const safetyZoneConfig = computed(() => ({
  x: BLEED_SIZE,
  y: BLEED_SIZE,
  width: FRONT_WIDTH - (BLEED_SIZE * 2),
  height: FRONT_HEIGHT - (BLEED_SIZE * 2),
  stroke: '#FF6B6B',
  strokeWidth: 1,
  dash: [4, 4],
  listening: false,
}));
</script>

<template>
  <div class="front-editor">
    <div class="editor-header">
      <h3 class="editor-title">Front Cover</h3>
      <span class="dimension-badge">
        {{ DIMENSIONS.frontCover.widthInches }}" × {{ DIMENSIONS.frontCover.heightInches }}"
      </span>
    </div>

    <div class="stage-wrapper">
      <v-stage :config="stageConfig">
        <v-layer>
          <!-- Background -->
          <v-rect :config="{ x: 0, y: 0, width: FRONT_WIDTH, height: FRONT_HEIGHT, fill: '#16213e' }" />

          <!-- User Image -->
          <v-image
            v-if="imageConfig"
            :config="imageConfig"
            :dragBoundFunc="dragBoundFunc"
            @dragend="handleDragEnd"
          />

          <!-- Safety Zone -->
          <v-rect :config="safetyZoneConfig" />
        </v-layer>
      </v-stage>
    </div>

    <div class="editor-hint">
      <span class="hint-icon">↔️</span>
      Drag to reposition
    </div>
  </div>
</template>

<style scoped>
.front-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editor-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.dimension-badge {
  font-size: 12px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.7);
}

.stage-wrapper {
  background: #0a0a14;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.editor-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.hint-icon {
  font-size: 14px;
}
</style>
