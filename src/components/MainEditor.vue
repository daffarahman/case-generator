<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import FrontEditor from './FrontEditor.vue';
import TrayEditor from './TrayEditor.vue';
import type { ProjectState } from '../types';
import { createDefaultProjectState } from '../types';

/**
 * MainEditor Component
 * Orchestrates FrontEditor and TrayEditor
 * - Desktop: Side-by-side layout
 * - Mobile: Tab switcher
 * - Sync Spines toggle for mirroring left/right spines
 */

// Project state
const projectState = ref<ProjectState>(createDefaultProjectState());

// Sync spines toggle
const syncSpines = ref(false);

// Mobile tab state
const activeTab = ref<'front' | 'tray'>('front');

// File upload handlers
const frontFileInput = ref<HTMLInputElement | null>(null);
const leftSpineFileInput = ref<HTMLInputElement | null>(null);
const backCenterFileInput = ref<HTMLInputElement | null>(null);
const rightSpineFileInput = ref<HTMLInputElement | null>(null);

// Handle front cover upload
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

// Handle tray section uploads
const handleTrayUpload = (section: 'leftSpine' | 'backCenter' | 'rightSpine', event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const imageUrl = e.target?.result as string;
    projectState.value.tray[section].image.imageUrl = imageUrl;
    
    // Sync to right spine if syncing and uploading to left
    if (syncSpines.value && section === 'leftSpine') {
      projectState.value.tray.rightSpine.image.imageUrl = imageUrl;
    }
  };
  reader.readAsDataURL(file);
};

// Update handlers
const updateFront = (front: typeof projectState.value.front) => {
  projectState.value.front = front;
};

const updateTray = (tray: typeof projectState.value.tray) => {
  projectState.value.tray = tray;
};

// Trigger file inputs
const triggerFrontUpload = () => frontFileInput.value?.click();
const triggerLeftSpineUpload = () => leftSpineFileInput.value?.click();
const triggerBackCenterUpload = () => backCenterFileInput.value?.click();
const triggerRightSpineUpload = () => rightSpineFileInput.value?.click();

// Watch sync toggle
watch(syncSpines, (enabled) => {
  if (enabled) {
    // Copy left spine to right spine
    projectState.value.tray.rightSpine.image = {
      ...projectState.value.tray.leftSpine.image,
      id: 'right-spine',
      name: 'Right Spine',
    };
  }
});
</script>

<template>
  <div class="main-editor">
    <!-- Header -->
    <header class="editor-header">
      <h1 class="title">
        <span class="title-icon">💿</span>
        CD Jewel Case Maker
      </h1>
      <div class="sync-toggle">
        <label class="toggle-label">
          <input type="checkbox" v-model="syncSpines" class="toggle-checkbox" />
          <span class="toggle-switch"></span>
          <span class="toggle-text">Sync Spines</span>
        </label>
      </div>
    </header>

    <!-- Mobile Tabs -->
    <div class="mobile-tabs">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'front' }"
        @click="activeTab = 'front'"
      >
        Front Cover
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'tray' }"
        @click="activeTab = 'tray'"
      >
        Back Tray
      </button>
    </div>

    <!-- Editor Grid -->
    <div class="editor-grid">
      <!-- Front Editor Panel -->
      <div class="editor-panel front-panel" :class="{ 'mobile-hidden': activeTab !== 'front' }">
        <FrontEditor 
          :front="projectState.front"
          @update:front="updateFront"
        />
        <div class="upload-controls">
          <button class="upload-btn" @click="triggerFrontUpload">
            <span class="btn-icon">📷</span>
            Upload Front Cover
          </button>
          <input 
            ref="frontFileInput"
            type="file" 
            accept="image/*" 
            class="hidden-input"
            @change="handleFrontUpload"
          />
        </div>
      </div>

      <!-- Tray Editor Panel -->
      <div class="editor-panel tray-panel" :class="{ 'mobile-hidden': activeTab !== 'tray' }">
        <TrayEditor 
          :tray="projectState.tray"
          :syncSpines="syncSpines"
          @update:tray="updateTray"
        />
        <div class="upload-controls tray-uploads">
          <button class="upload-btn small" @click="triggerLeftSpineUpload" :disabled="syncSpines">
            Left Spine
          </button>
          <button class="upload-btn" @click="triggerBackCenterUpload">
            <span class="btn-icon">📷</span>
            Back Center
          </button>
          <button class="upload-btn small" @click="triggerRightSpineUpload" :disabled="syncSpines">
            Right Spine
          </button>
          
          <!-- Hidden inputs -->
          <input 
            ref="leftSpineFileInput"
            type="file" 
            accept="image/*" 
            class="hidden-input"
            @change="(e) => handleTrayUpload('leftSpine', e)"
          />
          <input 
            ref="backCenterFileInput"
            type="file" 
            accept="image/*" 
            class="hidden-input"
            @change="(e) => handleTrayUpload('backCenter', e)"
          />
          <input 
            ref="rightSpineFileInput"
            type="file" 
            accept="image/*" 
            class="hidden-input"
            @change="(e) => handleTrayUpload('rightSpine', e)"
          />
        </div>
      </div>
    </div>

    <!-- Footer hint -->
    <footer class="editor-footer">
      <p class="hint">Red dashed lines indicate the 0.125" safety zone (bleed area)</p>
    </footer>
  </div>
</template>

<style scoped>
.main-editor {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
  padding: 24px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin: 0;
}

.title-icon {
  font-size: 32px;
}

/* Sync Toggle */
.sync-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.toggle-checkbox {
  display: none;
}

.toggle-switch {
  position: relative;
  width: 48px;
  height: 26px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 13px;
  transition: all 0.3s ease;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.toggle-checkbox:checked + .toggle-switch {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.toggle-checkbox:checked + .toggle-switch::after {
  left: 25px;
}

.toggle-text {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

/* Mobile Tabs */
.mobile-tabs {
  display: none;
  gap: 8px;
  margin-bottom: 16px;
}

@media (max-width: 1024px) {
  .mobile-tabs {
    display: flex;
  }
}

.tab-btn {
  flex: 1;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

/* Editor Grid */
.editor-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 32px;
  align-items: start;
}

@media (max-width: 1024px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }

  .mobile-hidden {
    display: none !important;
  }
}

.editor-panel {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Upload Controls */
.upload-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.tray-uploads {
  justify-content: space-between;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-btn.small {
  padding: 10px 16px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.1);
}

.upload-btn.small:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.btn-icon {
  font-size: 16px;
}

.hidden-input {
  display: none;
}

/* Footer */
.editor-footer {
  margin-top: 24px;
  text-align: center;
}

.hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}
</style>
