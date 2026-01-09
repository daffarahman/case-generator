<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import FrontEditor from './FrontEditor.vue';
import TrayEditor from './TrayEditor.vue';
import Button from 'primevue/button';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import ExportPanel from './ExportPanel.vue';
import AppFooter from './AppFooter.vue';
import type { ProjectState } from '../types';
import { createDefaultProjectState } from '../types';
import Konva from 'konva';

// Project state
const projectState = ref<ProjectState>(createDefaultProjectState());

// Sync spines toggle
const syncSpines = ref(false);

// Mobile tab state (0 = front, 1 = tray)
const activeTabIndex = ref<string>('front');

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
    <header class="bg-white">
      <div class="max-w-7xl mx-auto px-6 py-6">
        <!-- Support Button Row -->
        <div class="flex justify-end mb-4">
          <a href="https://trakteer.id/daffarahman/tip" target="_blank" rel="noopener noreferrer">
            <Button 
              label="Support" 
              icon="pi pi-crown" 
              severity="secondary"
              outlined
              class="!rounded-full !border-amber-500 !text-amber-600 hover:!bg-amber-50"
            />
          </a>
        </div>
        <!-- Centered Logo and Title -->
        <div class="flex flex-row justify-center items-center gap-2 sm:gap-3">
          <img src="/img/disc.jpg" alt="Cases" class="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-cover select-none" />
          <h1 class="font-display text-4xl sm:text-5xl lg:text-7xl text-gray-900 tracking-tight select-none">
            Cases
          </h1>
        </div>
      </div>
    </header>

    <!-- Mobile Tabs -->
    <div class="lg:hidden border-b border-gray-200 bg-white">
      <Tabs v-model:value="activeTabIndex">
        <TabList class="w-full">
          <Tab value="front" class="flex-1">Front Cover</Tab>
          <Tab value="tray" class="flex-1">Back Tray</Tab>
        </TabList>
      </Tabs>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto p-6 lg:p-12">
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-12 justify-center">
        
        <!-- Front Cover Panel -->
        <section 
          class="bg-[#FAFAFA] border border-gray-200 rounded-lg p-6"
          :class="{ 'hidden lg:block': activeTabIndex !== 'front' }"
        >
          <FrontEditor 
            ref="frontEditorRef"
            :front="projectState.front"
            @update:front="updateFront"
          />
          <div class="mt-6 flex justify-center">
            <Button label="Upload Image" icon="pi pi-upload" @click="triggerFrontUpload" />
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
          :class="{ 'hidden lg:block': activeTabIndex !== 'tray' }"
        >
          <TrayEditor 
            ref="trayEditorRef"
            :tray="projectState.tray"
            :syncSpines="syncSpines"
            @update:tray="updateTray"
            @update:syncSpines="syncSpines = $event"
          />
          <div class="mt-6 flex justify-center gap-3">
            <!-- Show separate buttons when sync is off -->
            <Button 
              v-if="!syncSpines"
              label="Left Spine"
              icon="pi pi-align-left"
              severity="secondary"
              @click="triggerLeftSpineUpload"
            />
            <!-- Show unified Spines button when sync is on -->
            <Button 
              v-if="syncSpines"
              label="Spines"
              icon="pi pi-arrows-h"
              severity="secondary"
              @click="triggerLeftSpineUpload"
            />
            <Button label="Back Center" icon="pi pi-image" @click="triggerBackCenterUpload" />
            <Button 
              v-if="!syncSpines"
              label="Right Spine"
              icon="pi pi-align-right"
              severity="secondary"
              @click="triggerRightSpineUpload"
            />
            
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

      <p class="text-xs text-gray-400 text-center mt-4">
        Dashed lines indicate the 3.2mm bleed area
      </p>

      <!-- Download Button -->
      <div class="mt-8 flex justify-center">
        <ExportPanel 
          :frontStage="frontStage"
          :trayStage="trayStage"
        />
      </div>

    </main>

    <AppFooter />
  </div>
</template>
