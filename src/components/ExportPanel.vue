<script setup lang="ts">
import { ref, computed } from 'vue';
import Konva from 'konva';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Dialog from 'primevue/dialog';
import { exportToPDF, PAPER_SIZES } from '../services/ExportService';
import type { MediaFormat } from '../formatTypes';
import { FORMATS } from '../formatTypes';

interface Props {
  frontStage: Konva.Stage | null;
  trayStage: Konva.Stage | null;
  activeFormat: MediaFormat;
}

const props = defineProps<Props>();

const activeFormatLabel = computed(() => 
  FORMATS.find(f => f.id === props.activeFormat)?.label || props.activeFormat.toUpperCase()
);

const dialogVisible = ref(false);
const albumTitle = ref('Untitled Album');
const selectedPaperSize = ref<keyof typeof PAPER_SIZES>('A4');
const isExporting = ref(false);

const paperOptions = computed(() => 
  Object.entries(PAPER_SIZES).map(([key, value]) => ({
    value: key,
    label: `${value.name} (${Math.round(value.width * 25.4)} × ${Math.round(value.height * 25.4)}mm)`,
  }))
);

const handleExport = async () => {
  if (isExporting.value) return;
  
  isExporting.value = true;
  
  try {
    await exportToPDF({
      paperSize: selectedPaperSize.value,
      title: albumTitle.value,
      frontStage: props.frontStage,
      trayStage: props.trayStage,
    });
    dialogVisible.value = false;
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    isExporting.value = false;
  }
};
</script>

<template>
  <!-- Trigger Button -->
  <Button 
    label="Download / Print"
    icon="pi pi-download"
    @click="dialogVisible = true"
  />

  <!-- Export Dialog -->
  <Dialog 
    v-model:visible="dialogVisible"
    :header="`Export - ${activeFormatLabel}`"
    modal
    :style="{ width: '400px' }"
  >
    <!-- Album Title -->
    <div class="mb-4">
      <label class="block text-sm text-gray-600 mb-2">Album Title</label>
      <InputText 
        v-model="albumTitle"
        placeholder="Enter album title"
        class="w-full"
      />
    </div>

    <!-- Paper Size Selection -->
    <div class="mb-4">
      <label class="block text-sm text-gray-600 mb-2">Paper Size</label>
      <Select 
        v-model="selectedPaperSize"
        :options="paperOptions"
        optionLabel="label"
        optionValue="value"
        class="w-full"
      />
    </div>

    <!-- Export Button -->
    <Button 
      :label="isExporting ? 'Generating...' : 'Download PDF'"
      :icon="isExporting ? 'pi pi-spin pi-spinner' : 'pi pi-file-pdf'"
      :disabled="isExporting"
      :loading="isExporting"
      class="w-full"
      @click="handleExport"
    />

    <!-- Info -->
    <p class="mt-3 text-xs text-gray-400 text-center">
      Exports at 300 DPI with crop marks
    </p>
  </Dialog>
</template>
