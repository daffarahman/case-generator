<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { JewelPart, Tray } from '../types';
import { DIMENSIONS, inchesToPixels } from '../constants';

/**
 * TrayEditor Component
 * Manages the back tray: Left Spine + Back Center + Right Spine
 * Supports full-tray images or individual section images
 */

interface Props {
  tray: Tray;
  syncSpines: boolean;
}

interface Emits {
  (e: 'update:tray', value: Tray): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Dimensions
const LEFT_SPINE_WIDTH = DIMENSIONS.leftSpine.width;
const BACK_CENTER_WIDTH = DIMENSIONS.backTrayCenter.width;
const RIGHT_SPINE_WIDTH = DIMENSIONS.rightSpine.width;
const TRAY_HEIGHT = DIMENSIONS.backTrayCenter.height;
const TRAY_TOTAL_WIDTH = DIMENSIONS.trayTotal.width;
const BLEED_SIZE = inchesToPixels(0.125);

// Full tray image state
const fullTrayImage = ref<JewelPart | null>(null);
const useFullTray = ref(false);

// Image elements
const leftSpineImg = ref<HTMLImageElement | null>(null);
const backCenterImg = ref<HTMLImageElement | null>(null);
const rightSpineImg = ref<HTMLImageElement | null>(null);
const fullTrayImg = ref<HTMLImageElement | null>(null);

// Image loaded states
const leftSpineLoaded = ref(false);
const backCenterLoaded = ref(false);
const rightSpineLoaded = ref(false);
const fullTrayLoaded = ref(false);

// Natural dimensions for scaling
const leftSpineNatural = ref({ width: 0, height: 0 });
const backCenterNatural = ref({ width: 0, height: 0 });
const rightSpineNatural = ref({ width: 0, height: 0 });
const fullTrayNatural = ref({ width: 0, height: 0 });

// Stage config
const stageConfig = computed(() => ({
  width: TRAY_TOTAL_WIDTH,
  height: TRAY_HEIGHT,
}));

// Section X positions
const leftSpineX = 0;
const backCenterX = LEFT_SPINE_WIDTH;
const rightSpineX = LEFT_SPINE_WIDTH + BACK_CENTER_WIDTH;

// Calculate scale to fill height (4.625")
const calculateFillHeightScale = (naturalHeight: number) => {
  if (naturalHeight === 0) return 1;
  return TRAY_HEIGHT / naturalHeight;
};

// Left Spine config
const leftSpineConfig = computed(() => {
  if (!leftSpineLoaded.value || !leftSpineImg.value) return null;
  const scale = calculateFillHeightScale(leftSpineNatural.value.height);
  return {
    image: leftSpineImg.value,
    x: leftSpineX + props.tray.leftSpine.image.x,
    y: 0,
    scaleX: scale,
    scaleY: scale,
    draggable: true,
  };
});

// Back Center config
const backCenterConfig = computed(() => {
  if (!backCenterLoaded.value || !backCenterImg.value) return null;
  const scale = calculateFillHeightScale(backCenterNatural.value.height);
  return {
    image: backCenterImg.value,
    x: backCenterX + props.tray.backCenter.image.x,
    y: 0,
    scaleX: scale,
    scaleY: scale,
    draggable: true,
  };
});

// Right Spine config
const rightSpineConfig = computed(() => {
  if (!rightSpineLoaded.value || !rightSpineImg.value) return null;
  const scale = calculateFillHeightScale(rightSpineNatural.value.height);
  return {
    image: rightSpineImg.value,
    x: rightSpineX + props.tray.rightSpine.image.x,
    y: 0,
    scaleX: scale,
    scaleY: scale,
    draggable: true,
  };
});

// Full Tray config (spans all sections)
const fullTrayConfig = computed(() => {
  if (!fullTrayLoaded.value || !fullTrayImg.value || !fullTrayImage.value) return null;
  const scale = calculateFillHeightScale(fullTrayNatural.value.height);
  return {
    image: fullTrayImg.value,
    x: fullTrayImage.value.x,
    y: 0,
    scaleX: scale,
    scaleY: scale,
    draggable: true,
  };
});

// Clipping configs for each section (using clip properties)
const leftSpineClipConfig = computed(() => ({
  clipX: leftSpineX,
  clipY: 0,
  clipWidth: LEFT_SPINE_WIDTH,
  clipHeight: TRAY_HEIGHT,
}));

const backCenterClipConfig = computed(() => ({
  clipX: backCenterX,
  clipY: 0,
  clipWidth: BACK_CENTER_WIDTH,
  clipHeight: TRAY_HEIGHT,
}));

const rightSpineClipConfig = computed(() => ({
  clipX: rightSpineX,
  clipY: 0,
  clipWidth: RIGHT_SPINE_WIDTH,
  clipHeight: TRAY_HEIGHT,
}));

// Drag bound functions for spines (horizontal only)
const leftSpineDragBound = (pos: { x: number; y: number }) => {
  const scale = calculateFillHeightScale(leftSpineNatural.value.height);
  const scaledWidth = leftSpineNatural.value.width * scale;
  const maxX = Math.min(leftSpineX, leftSpineX + LEFT_SPINE_WIDTH - scaledWidth);
  return {
    x: Math.max(maxX, Math.min(leftSpineX, pos.x)),
    y: 0,
  };
};

const rightSpineDragBound = (pos: { x: number; y: number }) => {
  const scale = calculateFillHeightScale(rightSpineNatural.value.height);
  const scaledWidth = rightSpineNatural.value.width * scale;
  const maxX = Math.min(rightSpineX, rightSpineX + RIGHT_SPINE_WIDTH - scaledWidth);
  return {
    x: Math.max(maxX, Math.min(rightSpineX, pos.x)),
    y: 0,
  };
};

const backCenterDragBound = (pos: { x: number; y: number }) => {
  const scale = calculateFillHeightScale(backCenterNatural.value.height);
  const scaledWidth = backCenterNatural.value.width * scale;
  const maxX = Math.min(backCenterX, backCenterX + BACK_CENTER_WIDTH - scaledWidth);
  return {
    x: Math.max(maxX, Math.min(backCenterX, pos.x)),
    y: 0,
  };
};

const fullTrayDragBound = (pos: { x: number; y: number }) => {
  const scale = calculateFillHeightScale(fullTrayNatural.value.height);
  const scaledWidth = fullTrayNatural.value.width * scale;
  const maxX = Math.min(0, TRAY_TOTAL_WIDTH - scaledWidth);
  return {
    x: Math.max(maxX, Math.min(0, pos.x)),
    y: 0,
  };
};

// Drag handlers
const handleLeftSpineDrag = (e: any) => {
  const newX = e.target.x() - leftSpineX;
  const updatedTray = {
    ...props.tray,
    leftSpine: {
      image: { ...props.tray.leftSpine.image, x: newX },
    },
  };
  
  // Sync to right spine if enabled
  if (props.syncSpines) {
    updatedTray.rightSpine = {
      image: { ...props.tray.rightSpine.image, x: newX },
    };
  }
  
  emit('update:tray', updatedTray);
};

const handleBackCenterDrag = (e: any) => {
  const newX = e.target.x() - backCenterX;
  emit('update:tray', {
    ...props.tray,
    backCenter: {
      image: { ...props.tray.backCenter.image, x: newX },
    },
  });
};

const handleRightSpineDrag = (e: any) => {
  const newX = e.target.x() - rightSpineX;
  emit('update:tray', {
    ...props.tray,
    rightSpine: {
      image: { ...props.tray.rightSpine.image, x: newX },
    },
  });
};

const handleFullTrayDrag = (e: any) => {
  if (fullTrayImage.value) {
    fullTrayImage.value.x = e.target.x();
  }
};

// Image loaders
const loadImage = (
  url: string | null,
  imgRef: typeof leftSpineImg,
  loadedRef: typeof leftSpineLoaded,
  naturalRef: typeof leftSpineNatural
) => {
  if (!url) {
    loadedRef.value = false;
    imgRef.value = null;
    return;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    imgRef.value = img;
    naturalRef.value = { width: img.naturalWidth, height: img.naturalHeight };
    loadedRef.value = true;
  };
  img.onerror = () => {
    loadedRef.value = false;
  };
  img.src = url;
};

// Watch for image URL changes
watch(() => props.tray.leftSpine.image.imageUrl, (url) => {
  loadImage(url, leftSpineImg, leftSpineLoaded, leftSpineNatural);
}, { immediate: true });

watch(() => props.tray.backCenter.image.imageUrl, (url) => {
  loadImage(url, backCenterImg, backCenterLoaded, backCenterNatural);
}, { immediate: true });

watch(() => props.tray.rightSpine.image.imageUrl, (url) => {
  loadImage(url, rightSpineImg, rightSpineLoaded, rightSpineNatural);
}, { immediate: true });

// Sync spines when enabled
watch(() => props.syncSpines, (sync) => {
  if (sync && props.tray.leftSpine.image.imageUrl) {
    emit('update:tray', {
      ...props.tray,
      rightSpine: {
        image: { ...props.tray.leftSpine.image, id: 'right-spine', name: 'Right Spine' },
      },
    });
  }
});

// Safety zone configs
const safetyZoneConfigs = computed(() => [
  // Left Spine
  {
    x: leftSpineX + BLEED_SIZE,
    y: BLEED_SIZE,
    width: LEFT_SPINE_WIDTH - (BLEED_SIZE * 2),
    height: TRAY_HEIGHT - (BLEED_SIZE * 2),
    stroke: '#FF6B6B',
    strokeWidth: 1,
    dash: [4, 4],
    listening: false,
  },
  // Back Center
  {
    x: backCenterX + BLEED_SIZE,
    y: BLEED_SIZE,
    width: BACK_CENTER_WIDTH - (BLEED_SIZE * 2),
    height: TRAY_HEIGHT - (BLEED_SIZE * 2),
    stroke: '#FF6B6B',
    strokeWidth: 1,
    dash: [4, 4],
    listening: false,
  },
  // Right Spine
  {
    x: rightSpineX + BLEED_SIZE,
    y: BLEED_SIZE,
    width: RIGHT_SPINE_WIDTH - (BLEED_SIZE * 2),
    height: TRAY_HEIGHT - (BLEED_SIZE * 2),
    stroke: '#FF6B6B',
    strokeWidth: 1,
    dash: [4, 4],
    listening: false,
  },
]);
</script>

<template>
  <div class="tray-editor">
    <div class="editor-header">
      <h3 class="editor-title">Back Tray</h3>
      <span class="dimension-badge">
        {{ DIMENSIONS.trayTotal.widthInches }}" × {{ DIMENSIONS.trayTotal.heightInches }}"
      </span>
    </div>

    <div class="stage-wrapper">
      <v-stage :config="stageConfig">
        <v-layer>
          <!-- Background sections -->
          <v-rect :config="{ x: leftSpineX, y: 0, width: LEFT_SPINE_WIDTH, height: TRAY_HEIGHT, fill: '#1a1a2e' }" />
          <v-rect :config="{ x: backCenterX, y: 0, width: BACK_CENTER_WIDTH, height: TRAY_HEIGHT, fill: '#16213e' }" />
          <v-rect :config="{ x: rightSpineX, y: 0, width: RIGHT_SPINE_WIDTH, height: TRAY_HEIGHT, fill: '#1a1a2e' }" />

          <!-- Full Tray Image (if using) -->
          <v-group v-if="useFullTray && fullTrayConfig">
            <v-image
              :config="fullTrayConfig"
              :dragBoundFunc="fullTrayDragBound"
              @dragend="handleFullTrayDrag"
            />
          </v-group>

          <!-- Individual Section Images -->
          <template v-if="!useFullTray">
            <!-- Left Spine -->
            <v-group :config="leftSpineClipConfig">
              <v-image
                v-if="leftSpineConfig"
                :config="leftSpineConfig"
                :dragBoundFunc="leftSpineDragBound"
                @dragend="handleLeftSpineDrag"
              />
            </v-group>

            <!-- Back Center -->
            <v-group :config="backCenterClipConfig">
              <v-image
                v-if="backCenterConfig"
                :config="backCenterConfig"
                :dragBoundFunc="backCenterDragBound"
                @dragend="handleBackCenterDrag"
              />
            </v-group>

            <!-- Right Spine -->
            <v-group :config="rightSpineClipConfig">
              <v-image
                v-if="rightSpineConfig"
                :config="rightSpineConfig"
                :dragBoundFunc="rightSpineDragBound"
                @dragend="handleRightSpineDrag"
              />
            </v-group>
          </template>

          <!-- Section Dividers -->
          <v-line :config="{ points: [LEFT_SPINE_WIDTH, 0, LEFT_SPINE_WIDTH, TRAY_HEIGHT], stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1 }" />
          <v-line :config="{ points: [rightSpineX, 0, rightSpineX, TRAY_HEIGHT], stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1 }" />

          <!-- Safety Zones -->
          <v-rect v-for="(zone, i) in safetyZoneConfigs" :key="i" :config="zone" />
        </v-layer>
      </v-stage>
    </div>

    <div class="section-labels">
      <span class="label spine-label">L</span>
      <span class="label center-label">Back Center</span>
      <span class="label spine-label">R</span>
    </div>
  </div>
</template>

<style scoped>
.tray-editor {
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
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
}

.label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.spine-label {
  width: 24px;
  text-align: center;
}

.center-label {
  flex: 1;
  text-align: center;
}
</style>
