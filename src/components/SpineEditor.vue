<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { JewelPart } from '../types';
import { DIMENSIONS, inchesToPixels } from '../constants';

/**
 * SpineEditor Component
 * Provides an interactive editor for CD jewel case spine sections
 * with drag constraints, rotation toggle, and safety zone overlay
 */

interface Props {
  part: JewelPart;
  containerSize: {
    width: number;
    height: number;
  };
}

interface Emits {
  (e: 'update:part', value: JewelPart): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Constants for spine dimensions
const SPINE_WIDTH = DIMENSIONS.leftSpine.width;   // 24px (0.25")
const SPINE_HEIGHT = DIMENSIONS.leftSpine.height; // 444px (4.625")
const BLEED_SIZE = inchesToPixels(0.125);         // 12px (0.125")

// Reactive state
const isHorizontalView = ref(false);
const imageElement = ref<HTMLImageElement | null>(null);
const imageNaturalWidth = ref(0);
const imageNaturalHeight = ref(0);
const isImageLoaded = ref(false);

// Stage configuration based on view mode
const stageConfig = computed(() => {
  if (isHorizontalView.value) {
    return {
      width: SPINE_HEIGHT,
      height: SPINE_WIDTH,
    };
  }
  return {
    width: SPINE_WIDTH,
    height: SPINE_HEIGHT,
  };
});

// Calculate scale to fit image height to spine height exactly
const calculatedScale = computed(() => {
  if (!isImageLoaded.value || imageNaturalHeight.value === 0) {
    return 1;
  }
  // Scale so that imageHeight * scale === SPINE_HEIGHT (4.625 * DPI)
  return SPINE_HEIGHT / imageNaturalHeight.value;
});

// Scaled image dimensions
const scaledImageWidth = computed(() => imageNaturalWidth.value * calculatedScale.value);

// Image configuration for Konva
const imageConfig = computed(() => {
  if (!isImageLoaded.value || !imageElement.value) {
    return null;
  }

  const baseConfig = {
    image: imageElement.value,
    x: props.part.x,
    y: 0, // Y is always locked to 0
    scaleX: calculatedScale.value,
    scaleY: calculatedScale.value,
    draggable: true,
  };

  // For horizontal view, we rotate the image transform
  if (isHorizontalView.value) {
    return {
      ...baseConfig,
      rotation: 90,
      offsetX: 0,
      offsetY: imageNaturalHeight.value,
      x: props.part.x,
      y: 0,
    };
  }

  return baseConfig;
});

// Safety zone (bleed) overlay configuration
const safetyZoneConfig = computed(() => {
  const x = BLEED_SIZE;
  const y = BLEED_SIZE;
  const width = SPINE_WIDTH - (BLEED_SIZE * 2);
  const height = SPINE_HEIGHT - (BLEED_SIZE * 2);

  if (isHorizontalView.value) {
    return {
      x: BLEED_SIZE,
      y: BLEED_SIZE,
      width: SPINE_HEIGHT - (BLEED_SIZE * 2),
      height: SPINE_WIDTH - (BLEED_SIZE * 2),
      stroke: '#FF6B6B',
      strokeWidth: 1,
      dash: [4, 4],
      listening: false,
    };
  }

  return {
    x,
    y,
    width,
    height,
    stroke: '#FF6B6B',
    strokeWidth: 1,
    dash: [4, 4],
    listening: false,
  };
});

// Background rectangle config
const backgroundConfig = computed(() => {
  if (isHorizontalView.value) {
    return {
      x: 0,
      y: 0,
      width: SPINE_HEIGHT,
      height: SPINE_WIDTH,
      fill: '#1a1a2e',
    };
  }
  return {
    x: 0,
    y: 0,
    width: SPINE_WIDTH,
    height: SPINE_HEIGHT,
    fill: '#1a1a2e',
  };
});

/**
 * Drag boundary function to constrain image movement
 * - Y-axis is locked to 0
 * - X-axis is restricted so the image never reveals background
 */
const dragBoundFunc = (pos: { x: number; y: number }) => {
  // Calculate the maximum X position
  // The image can slide from 0 to (spineWidth - scaledImageWidth)
  // Since scaledImageWidth >= spineWidth (image fills height), maxX will be <= 0
  const maxX = Math.min(0, SPINE_WIDTH - scaledImageWidth.value);
  
  // Clamp X position
  const clampedX = Math.max(maxX, Math.min(0, pos.x));

  return {
    x: clampedX,
    y: 0, // Y is always locked to 0
  };
};

/**
 * Handle image drag end - emit updated part
 */
const handleDragEnd = (e: any) => {
  const node = e.target;
  emit('update:part', {
    ...props.part,
    x: node.x(),
    y: 0, // Always 0
    scale: calculatedScale.value,
  });
};

/**
 * Toggle between vertical and horizontal view
 */
const toggleViewMode = () => {
  isHorizontalView.value = !isHorizontalView.value;
};

/**
 * Load image when URL changes
 */
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

  img.onerror = () => {
    console.error('Failed to load image:', url);
    isImageLoaded.value = false;
  };

  img.src = url;
};

// Watch for image URL changes
watch(
  () => props.part.imageUrl,
  (newUrl) => {
    loadImage(newUrl);
  },
  { immediate: true }
);

// Lifecycle
onMounted(() => {
  if (props.part.imageUrl) {
    loadImage(props.part.imageUrl);
  }
});
</script>

<template>
  <div class="spine-editor">
    <!-- View Toggle Button -->
    <div class="editor-controls">
      <button 
        class="toggle-btn"
        @click="toggleViewMode"
        :title="isHorizontalView ? 'Switch to Vertical View' : 'Switch to Horizontal View'"
      >
        <span class="icon">{{ isHorizontalView ? '↕' : '↔' }}</span>
        {{ isHorizontalView ? 'Vertical' : 'Horizontal' }}
      </button>
    </div>

    <!-- Konva Stage -->
    <div class="stage-container" :class="{ horizontal: isHorizontalView }">
      <v-stage :config="stageConfig">
        <v-layer>
          <!-- Background -->
          <v-rect :config="backgroundConfig" />

          <!-- User Image -->
          <v-image
            v-if="imageConfig"
            :config="imageConfig"
            :dragBoundFunc="dragBoundFunc"
            @dragend="handleDragEnd"
          />

          <!-- Safety Zone (Bleed) Overlay -->
          <v-rect :config="safetyZoneConfig" />
        </v-layer>
      </v-stage>
    </div>

    <!-- Editor Info -->
    <div class="editor-info">
      <span class="dimension-label">
        {{ DIMENSIONS.leftSpine.widthInches }}" × {{ DIMENSIONS.leftSpine.heightInches }}"
      </span>
      <span class="bleed-label">
        Bleed: 0.125"
      </span>
    </div>
  </div>
</template>

<style scoped>
.spine-editor {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #0f0f1a;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.editor-controls {
  display: flex;
  gap: 8px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.toggle-btn .icon {
  font-size: 16px;
}

.stage-container {
  background: #1a1a2e;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.05);
}

.stage-container.horizontal {
  transform: scale(1.2);
}

.editor-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.dimension-label {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.bleed-label {
  padding: 4px 8px;
  background: rgba(255, 107, 107, 0.2);
  border-radius: 4px;
  color: #FF6B6B;
}
</style>
