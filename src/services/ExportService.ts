import { jsPDF } from 'jspdf';
import Konva from 'konva';

/**
 * ExportService - High-resolution PDF export for CD Jewel Case
 * Supports A4, F4/Folio paper sizes with 300 DPI print quality
 */

export interface PaperSize {
  name: string;
  width: number;  // inches
  height: number; // inches
}

export const PAPER_SIZES: Record<string, PaperSize> = {
  A4: { name: 'A4', width: 8.27, height: 11.69 },
  F4: { name: 'F4 / Folio', width: 8.5, height: 13.0 },
  Letter: { name: 'Letter', width: 8.5, height: 11.0 },
};

// CD Jewel Case dimensions (inches)
const FRONT_COVER_WIDTH = 4.75;
const FRONT_COVER_HEIGHT = 4.75;
const TRAY_WIDTH = 5.9;
const TRAY_HEIGHT = 4.625;
const MARGIN_BETWEEN = 0.5;
const LEFT_SPINE_WIDTH = 0.25;
const BACK_CENTER_WIDTH = 5.4;

// Crop mark settings
const CROP_MARK_LENGTH = 0.15;
const CROP_MARK_OFFSET = 0.1;
const CROP_MARK_LINE_WIDTH = 0.5; // points

// Pixel ratio for 300 DPI (at 96 base DPI)
const PIXEL_RATIO = 3;

interface ExportOptions {
  paperSize: keyof typeof PAPER_SIZES;
  title?: string;
  frontStage: Konva.Stage | null;
  trayStage: Konva.Stage | null;
}

/**
 * Draw crop marks at corners of a rectangle
 */
function drawCropMarks(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(CROP_MARK_LINE_WIDTH / 72); // Convert pt to inches

  // Top-left corner
  pdf.line(x - CROP_MARK_OFFSET - CROP_MARK_LENGTH, y, x - CROP_MARK_OFFSET, y);
  pdf.line(x, y - CROP_MARK_OFFSET - CROP_MARK_LENGTH, x, y - CROP_MARK_OFFSET);

  // Top-right corner
  pdf.line(x + width + CROP_MARK_OFFSET, y, x + width + CROP_MARK_OFFSET + CROP_MARK_LENGTH, y);
  pdf.line(x + width, y - CROP_MARK_OFFSET - CROP_MARK_LENGTH, x + width, y - CROP_MARK_OFFSET);

  // Bottom-left corner
  pdf.line(x - CROP_MARK_OFFSET - CROP_MARK_LENGTH, y + height, x - CROP_MARK_OFFSET, y + height);
  pdf.line(x, y + height + CROP_MARK_OFFSET, x, y + height + CROP_MARK_OFFSET + CROP_MARK_LENGTH);

  // Bottom-right corner
  pdf.line(x + width + CROP_MARK_OFFSET, y + height, x + width + CROP_MARK_OFFSET + CROP_MARK_LENGTH, y + height);
  pdf.line(x + width, y + height + CROP_MARK_OFFSET, x + width, y + height + CROP_MARK_OFFSET + CROP_MARK_LENGTH);
}

/**
 * Draw fold guides for tray spine folds
 */
function drawFoldGuides(
  pdf: jsPDF,
  trayX: number,
  trayY: number,
  trayHeight: number
): void {
  pdf.setDrawColor(180, 180, 180); // Light gray
  pdf.setLineDashPattern([0.05, 0.05], 0); // Dashed
  pdf.setLineWidth(0.3 / 72);

  // Left spine fold (at LEFT_SPINE_WIDTH from left edge)
  const leftFoldX = trayX + LEFT_SPINE_WIDTH;
  pdf.line(leftFoldX, trayY - 0.15, leftFoldX, trayY + trayHeight + 0.15);

  // Right spine fold (at BACK_CENTER_WIDTH + LEFT_SPINE_WIDTH from left edge)
  const rightFoldX = trayX + LEFT_SPINE_WIDTH + BACK_CENTER_WIDTH;
  pdf.line(rightFoldX, trayY - 0.15, rightFoldX, trayY + trayHeight + 0.15);

  // Reset dash pattern
  pdf.setLineDashPattern([], 0);
}

/**
 * Generate high-resolution image data from Konva stage
 * Hides UI elements (safety zones, dividers, borders) for clean export
 */
async function getStageImage(stage: Konva.Stage): Promise<string> {
  // Find and hide UI elements before export
  const layer = stage.getLayers()[0];
  const shapesToHide: Konva.Shape[] = [];
  
  if (layer) {
    // Hide dashed rectangles (safety zones) and solid stroke-only rectangles (borders)
    layer.find('Rect').forEach((rect) => {
      const r = rect as Konva.Rect;
      // Safety zones have dash pattern, borders have stroke but no fill
      if (r.dash()?.length || (r.stroke() && !r.fill())) {
        shapesToHide.push(r);
        r.hide();
      }
    });
    
    // Hide lines (section dividers)
    layer.find('Line').forEach((line) => {
      shapesToHide.push(line as Konva.Line);
      line.hide();
    });
  }
  
  // Generate image
  const dataUrl = stage.toDataURL({
    pixelRatio: PIXEL_RATIO,
    mimeType: 'image/png',
  });
  
  // Restore hidden elements
  shapesToHide.forEach((shape) => shape.show());
  
  return dataUrl;
}

/**
 * Export to PDF
 */
export async function exportToPDF(options: ExportOptions): Promise<void> {
  const { paperSize, title = 'cd-jewel-case', frontStage, trayStage } = options;
  const paper = PAPER_SIZES[paperSize];

  if (!paper) {
    throw new Error(`Invalid paper size: ${paperSize}`);
  }

  // Create PDF with inches as unit
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [paper.width, paper.height],
  });

  // Calculate centered layout (vertical stacking)
  const contentWidth = Math.max(FRONT_COVER_WIDTH, TRAY_WIDTH);
  const totalContentHeight = FRONT_COVER_HEIGHT + MARGIN_BETWEEN + TRAY_HEIGHT;

  const startX = (paper.width - contentWidth) / 2;
  const startY = (paper.height - totalContentHeight) / 2;

  // Front cover position (centered horizontally, at top)
  const frontX = startX + (contentWidth - FRONT_COVER_WIDTH) / 2;
  const frontY = startY;

  // Tray position (centered horizontally, below front cover)
  const trayX = startX + (contentWidth - TRAY_WIDTH) / 2;
  const trayY = startY + FRONT_COVER_HEIGHT + MARGIN_BETWEEN;

  // Draw fold guides first (so they're behind everything)
  drawFoldGuides(pdf, trayX, trayY, TRAY_HEIGHT);

  // Add front cover image
  if (frontStage) {
    try {
      const frontImage = await getStageImage(frontStage);
      pdf.addImage(frontImage, 'PNG', frontX, frontY, FRONT_COVER_WIDTH, FRONT_COVER_HEIGHT);
    } catch (e) {
      console.error('Failed to export front cover:', e);
    }
  }

  // Add tray image
  if (trayStage) {
    try {
      const trayImage = await getStageImage(trayStage);
      pdf.addImage(trayImage, 'PNG', trayX, trayY, TRAY_WIDTH, TRAY_HEIGHT);
    } catch (e) {
      console.error('Failed to export tray:', e);
    }
  }

  // Draw crop marks (after images so they're on top)
  drawCropMarks(pdf, frontX, frontY, FRONT_COVER_WIDTH, FRONT_COVER_HEIGHT);
  drawCropMarks(pdf, trayX, trayY, TRAY_WIDTH, TRAY_HEIGHT);

  // Generate filename
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9\-_]/g, '_').toLowerCase();
  const filename = `${sanitizedTitle}_jewel_case.pdf`;

  // Save the PDF
  pdf.save(filename);
}

export default {
  exportToPDF,
  PAPER_SIZES,
};
