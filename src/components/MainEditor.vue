<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import FrontEditor from './FrontEditor.vue';
import TrayEditor from './TrayEditor.vue';
import BaseButton from './BaseButton.vue';
import ExportPanel from './ExportPanel.vue';
import type { ProjectState } from '../types';
import { createDefaultProjectState } from '../types';
import Konva from 'konva';

// Project state
const projectState = ref<ProjectState>(createDefaultProjectState());



// Sync spines toggle
const syncSpines = ref(false);

// Mobile tab state
const activeTab = ref<'front' | 'tray'>('front');

// Editor refs for PDF export
const frontEditorRef = ref<InstanceType<typeof FrontEditor> | null>(null);
const trayEditorRef = ref<InstanceType<typeof TrayEditor> | null>(null);

// Get stage refs for export
const frontStage = computed((): Konva.Stage | null => {
  return frontEditorRef.value?.getStage() || null;
});

const trayStage = computed((): Konva.Stage | null => {
  return trayEditorRef.value?.getStage() || null;
});

// File upload refs
const frontFileInput = ref<HTMLInputElement | null>(null);
const leftSpineFileInput = ref<HTMLInputElement | null>(null);
const backCenterFileInput = ref<HTMLInputElement | null>(null);
const rightSpineFileInput = ref<HTMLInputElement | null>(null);

// Upload handlers
const handleFrontUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    projectState.value.front.image.imageUrl = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const handleTrayUpload = (section: 'leftSpine' | 'backCenter' | 'rightSpine', event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const imageUrl = e.target?.result as string;
    projectState.value.tray[section].image.imageUrl = imageUrl;
    if (syncSpines.value && section === 'leftSpine') {
      projectState.value.tray.rightSpine.image.imageUrl = imageUrl;
    }
  };
  reader.readAsDataURL(file);
};

const updateFront = (front: typeof projectState.value.front) => {
  projectState.value.front = front;
};

const updateTray = (tray: typeof projectState.value.tray) => {
  projectState.value.tray = tray;
};

const triggerFrontUpload = () => frontFileInput.value?.click();
const triggerLeftSpineUpload = () => leftSpineFileInput.value?.click();
const triggerBackCenterUpload = () => backCenterFileInput.value?.click();
const triggerRightSpineUpload = () => rightSpineFileInput.value?.click();

watch(syncSpines, (enabled) => {
  if (enabled) {
    projectState.value.tray.rightSpine.image = {
      ...projectState.value.tray.leftSpine.image,
      id: 'right-spine',
      name: 'Right Spine',
    };
  }
});
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="border-b border-gray-200 bg-white">
      <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 class="font-display text-2xl text-gray-900 tracking-tight">
          CD Jewel Case Maker
        </h1>
        <label class="flex items-center gap-3 cursor-pointer select-none">
          <span class="text-sm text-gray-600">Sync Spines</span>
          <div class="relative">
            <input type="checkbox" v-model="syncSpines" class="peer sr-only" />
            <div class="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-gray-900 transition-colors"></div>
            <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5"></div>
          </div>
        </label>
      </div>
    </header>

    <!-- Mobile Tabs -->
    <div class="lg:hidden border-b border-gray-200 bg-white">
      <div class="flex">
        <button 
          class="flex-1 py-3 text-sm font-medium text-center transition-colors border-b-2"
          :class="activeTab === 'front' 
            ? 'border-gray-900 text-gray-900' 
            : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'front'"
        >
          Front Cover
        </button>
        <button 
          class="flex-1 py-3 text-sm font-medium text-center transition-colors border-b-2"
          :class="activeTab === 'tray' 
            ? 'border-gray-900 text-gray-900' 
            : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'tray'"
        >
          Back Tray
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto p-6 lg:p-12">
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-12 justify-center">
        
        <!-- Front Cover Panel -->
        <section 
          class="bg-[#FAFAFA] border border-gray-200 rounded-lg p-6"
          :class="{ 'hidden lg:block': activeTab !== 'front' }"
        >
          <FrontEditor 
            ref="frontEditorRef"
            :front="projectState.front"
            @update:front="updateFront"
          />
          <div class="mt-6 flex justify-center">
            <BaseButton @click="triggerFrontUpload">
              Upload Image
            </BaseButton>
            <input 
              ref="frontFileInput"
              type="file" 
              accept="image/*" 
              class="hidden"
              @change="handleFrontUpload"
            />
          </div>
        </section>

        <!-- Tray Panel -->
        <section 
          class="bg-[#FAFAFA] border border-gray-200 rounded-lg p-6"
          :class="{ 'hidden lg:block': activeTab !== 'tray' }"
        >
          <TrayEditor 
            ref="trayEditorRef"
            :tray="projectState.tray"
            :syncSpines="syncSpines"
            @update:tray="updateTray"
          />
          <div class="mt-6 flex justify-center gap-3">
            <BaseButton 
              variant="secondary"
              :disabled="syncSpines"
              @click="triggerLeftSpineUpload"
            >
              Left Spine
            </BaseButton>
            <BaseButton @click="triggerBackCenterUpload">
              Back Center
            </BaseButton>
            <BaseButton 
              variant="secondary"
              :disabled="syncSpines"
              @click="triggerRightSpineUpload"
            >
              Right Spine
            </BaseButton>
            
            <input 
              ref="leftSpineFileInput"
              type="file" 
              accept="image/*" 
              class="hidden"
              @change="(e) => handleTrayUpload('leftSpine', e)"
            />
            <input 
              ref="backCenterFileInput"
              type="file" 
              accept="image/*" 
              class="hidden"
              @change="(e) => handleTrayUpload('backCenter', e)"
            />
            <input 
              ref="rightSpineFileInput"
              type="file" 
              accept="image/*" 
              class="hidden"
              @change="(e) => handleTrayUpload('rightSpine', e)"
            />
          </div>
        </section>
      </div>

      <!-- Export Panel -->
      <section class="mt-8 bg-[#FAFAFA] border border-gray-200 rounded-lg p-6 w-full">
        <ExportPanel 
          :frontStage="frontStage"
          :trayStage="trayStage"
        />
      </section>

      <!-- Footer -->
      <footer class="mt-12 text-center">
        <p class="text-xs text-gray-400">
          Dashed lines indicate the 0.125" bleed area
        </p>
      </footer>
    </main>
  </div>
</template>
