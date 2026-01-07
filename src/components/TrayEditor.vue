<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Tray } from '../types';
import { DIMENSIONS, inchesToPixels } from '../constants';
import Konva from 'konva';

interface Props {
  tray: Tray;
  syncSpines: boolean;
}

interface Emits {
  (e: 'update:tray', value: Tray): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const LEFT_SPINE_WIDTH = DIMENSIONS.leftSpine.width;
const BACK_CENTER_WIDTH = DIMENSIONS.backTrayCenter.width;
const RIGHT_SPINE_WIDTH = DIMENSIONS.rightSpine.width;
const TRAY_HEIGHT = DIMENSIONS.backTrayCenter.height;
const TRAY_TOTAL_WIDTH = DIMENSIONS.trayTotal.width;
const BLEED_SIZE = inchesToPixels(0.125);

const useFullTray = ref(false);

// Stage ref for PDF export
const stageRef = ref<{ getNode: () => Konva.Stage } | null>(null);

const getStage = (): Konva.Stage | null => {
  return stageRef.value?.getNode() || null;
};

defineExpose({ getStage });

const leftSpineImg = ref<HTMLImageElement | null>(null);
const backCenterImg = ref<HTMLImageElement | null>(null);
const rightSpineImg = ref<HTMLImageElement | null>(null);

const leftSpineLoaded = ref(false);
const backCenterLoaded = ref(false);
const rightSpineLoaded = ref(false);

const leftSpineNatural = ref({ width: 0, height: 0 });
const backCenterNatural = ref({ width: 0, height: 0 });
const rightSpineNatural = ref({ width: 0, height: 0 });

const stageConfig = computed(() => ({
  width: TRAY_TOTAL_WIDTH,
  height: TRAY_HEIGHT,
}));

const leftSpineX = 0;
const backCenterX = LEFT_SPINE_WIDTH;
const rightSpineX = LEFT_SPINE_WIDTH + BACK_CENTER_WIDTH;

const calculateFillHeightScale = (naturalHeight: number) => {
  if (naturalHeight === 0) return 1;
  return TRAY_HEIGHT / naturalHeight;
};

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

const leftSpineDragBound = (pos: { x: number; y: number }) => {
  const scale = calculateFillHeightScale(leftSpineNatural.value.height);
  const scaledWidth = leftSpineNatural.value.width * scale;
  const maxX = Math.min(leftSpineX, leftSpineX + LEFT_SPINE_WIDTH - scaledWidth);
  return { x: Math.max(maxX, Math.min(leftSpineX, pos.x)), y: 0 };
};

const rightSpineDragBound = (pos: { x: number; y: number }) => {
  const scale = calculateFillHeightScale(rightSpineNatural.value.height);
  const scaledWidth = rightSpineNatural.value.width * scale;
  const maxX = Math.min(rightSpineX, rightSpineX + RIGHT_SPINE_WIDTH - scaledWidth);
  return { x: Math.max(maxX, Math.min(rightSpineX, pos.x)), y: 0 };
};

const backCenterDragBound = (pos: { x: number; y: number }) => {
  const scale = calculateFillHeightScale(backCenterNatural.value.height);
  const scaledWidth = backCenterNatural.value.width * scale;
  const maxX = Math.min(backCenterX, backCenterX + BACK_CENTER_WIDTH - scaledWidth);
  return { x: Math.max(maxX, Math.min(backCenterX, pos.x)), y: 0 };
};

const handleLeftSpineDrag = (e: any) => {
  const newX = e.target.x() - leftSpineX;
  const updatedTray = {
    ...props.tray,
    leftSpine: { image: { ...props.tray.leftSpine.image, x: newX } },
  };
  if (props.syncSpines) {
    updatedTray.rightSpine = { image: { ...props.tray.rightSpine.image, x: newX } };
  }
  emit('update:tray', updatedTray);
};

const handleBackCenterDrag = (e: any) => {
  const newX = e.target.x() - backCenterX;
  emit('update:tray', {
    ...props.tray,
    backCenter: { image: { ...props.tray.backCenter.image, x: newX } },
  });
};

const handleRightSpineDrag = (e: any) => {
  const newX = e.target.x() - rightSpineX;
  emit('update:tray', {
    ...props.tray,
    rightSpine: { image: { ...props.tray.rightSpine.image, x: newX } },
  });
};

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

watch(() => props.tray.leftSpine.image.imageUrl, (url) => {
  loadImage(url, leftSpineImg, leftSpineLoaded, leftSpineNatural);
}, { immediate: true });

watch(() => props.tray.backCenter.image.imageUrl, (url) => {
  loadImage(url, backCenterImg, backCenterLoaded, backCenterNatural);
}, { immediate: true });

watch(() => props.tray.rightSpine.image.imageUrl, (url) => {
  loadImage(url, rightSpineImg, rightSpineLoaded, rightSpineNatural);
}, { immediate: true });

watch(() => props.syncSpines, (sync) => {
  if (sync && props.tray.leftSpine.image.imageUrl) {
    emit('update:tray', {
      ...props.tray,
      rightSpine: { image: { ...props.tray.leftSpine.image, id: 'right-spine', name: 'Right Spine' } },
    });
  }
});

const safetyZoneConfigs = computed(() => [
  { x: leftSpineX + BLEED_SIZE, y: BLEED_SIZE, width: LEFT_SPINE_WIDTH - (BLEED_SIZE * 2), height: TRAY_HEIGHT - (BLEED_SIZE * 2), stroke: '#9CA3AF', strokeWidth: 1, dash: [4, 4], listening: false },
  { x: backCenterX + BLEED_SIZE, y: BLEED_SIZE, width: BACK_CENTER_WIDTH - (BLEED_SIZE * 2), height: TRAY_HEIGHT - (BLEED_SIZE * 2), stroke: '#9CA3AF', strokeWidth: 1, dash: [4, 4], listening: false },
  { x: rightSpineX + BLEED_SIZE, y: BLEED_SIZE, width: RIGHT_SPINE_WIDTH - (BLEED_SIZE * 2), height: TRAY_HEIGHT - (BLEED_SIZE * 2), stroke: '#9CA3AF', strokeWidth: 1, dash: [4, 4], listening: false },
]);

const borderConfig = computed(() => ({
  x: 0,
  y: 0,
  width: TRAY_TOTAL_WIDTH,
  height: TRAY_HEIGHT,
  stroke: '#E5E7EB',
  strokeWidth: 1,
  listening: false,
}));
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="font-display text-lg font-medium text-gray-900">Back Tray</h3>
      <div class="text-xs text-gray-500">
        {{ DIMENSIONS.trayTotal.widthInches }}" × {{ DIMENSIONS.trayTotal.heightInches }}"
        <span class="text-gray-400 ml-1">({{ DIMENSIONS.trayTotal.widthMm }} × {{ DIMENSIONS.trayTotal.heightMm }}mm)</span>
      </div>
    </div>

    <!-- Canvas Container -->
    <div class="bg-white border border-gray-200 rounded-lg p-6 overflow-x-auto">
      <v-stage ref="stageRef" :config="stageConfig">
        <v-layer>
          <!-- Background sections -->
          <v-rect :config="{ x: leftSpineX, y: 0, width: LEFT_SPINE_WIDTH, height: TRAY_HEIGHT, fill: '#F3F4F6' }" />
          <v-rect :config="{ x: backCenterX, y: 0, width: BACK_CENTER_WIDTH, height: TRAY_HEIGHT, fill: '#F9FAFB' }" />
          <v-rect :config="{ x: rightSpineX, y: 0, width: RIGHT_SPINE_WIDTH, height: TRAY_HEIGHT, fill: '#F3F4F6' }" />

          <!-- Images -->
          <template v-if="!useFullTray">
            <v-group :config="leftSpineClipConfig">
              <v-image v-if="leftSpineConfig" :config="leftSpineConfig" :dragBoundFunc="leftSpineDragBound" @dragend="handleLeftSpineDrag" />
            </v-group>

            <v-group :config="backCenterClipConfig">
              <v-image v-if="backCenterConfig" :config="backCenterConfig" :dragBoundFunc="backCenterDragBound" @dragend="handleBackCenterDrag" />
            </v-group>

            <v-group :config="rightSpineClipConfig">
              <v-image v-if="rightSpineConfig" :config="rightSpineConfig" :dragBoundFunc="rightSpineDragBound" @dragend="handleRightSpineDrag" />
            </v-group>
          </template>

          <!-- Cut Line Border -->
          <v-rect :config="borderConfig" />

          <!-- Section Dividers -->
          <v-line :config="{ points: [LEFT_SPINE_WIDTH, 0, LEFT_SPINE_WIDTH, TRAY_HEIGHT], stroke: '#D1D5DB', strokeWidth: 1 }" />
          <v-line :config="{ points: [rightSpineX, 0, rightSpineX, TRAY_HEIGHT], stroke: '#D1D5DB', strokeWidth: 1 }" />

          <!-- Safety Zones -->
          <v-rect v-for="(zone, i) in safetyZoneConfigs" :key="i" :config="zone" />
        </v-layer>
      </v-stage>
    </div>

    <!-- Labels -->
    <div class="flex justify-between items-center px-6 text-[10px] uppercase tracking-widest text-gray-400">
      <span>L</span>
      <span>Back Center</span>
      <span>R</span>
    </div>
  </div>
</template>
