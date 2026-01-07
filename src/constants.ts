/**
 * CD Jewel Case Generator - Constants
 * All measurements are based on standard CD jewel case specifications
 */

/** Display DPI for pixel calculations */
export const DPI = 96;

/**
 * Converts inches to pixels based on the defined DPI
 */
export const inchesToPixels = (inches: number): number => Math.round(inches * DPI);

/**
 * Converts inches to millimeters
 */
export const inchesToMm = (inches: number): number => Math.round(inches * 25.4 * 10) / 10;

/**
 * Dimensions for CD Jewel Case components
 * All values are in pixels, calculated from inch measurements at 96 DPI
 * Includes both imperial (inches) and SI metric (mm) measurements
 */
export const DIMENSIONS = {
  /** Front Cover: 4.75" x 4.75" (120.7mm x 120.7mm) */
  frontCover: {
    width: inchesToPixels(4.75),   // 456px
    height: inchesToPixels(4.75),  // 456px
    widthInches: 4.75,
    heightInches: 4.75,
    widthMm: inchesToMm(4.75),     // 120.7mm
    heightMm: inchesToMm(4.75),    // 120.7mm
  },

  /** Back Tray Center: 5.4" x 4.625" (137.2mm x 117.5mm) */
  backTrayCenter: {
    width: inchesToPixels(5.4),    // 518px
    height: inchesToPixels(4.625), // 444px
    widthInches: 5.4,
    heightInches: 4.625,
    widthMm: inchesToMm(5.4),      // 137.2mm
    heightMm: inchesToMm(4.625),   // 117.5mm
  },

  /** Left Spine: 0.25" x 4.625" (6.4mm x 117.5mm) */
  leftSpine: {
    width: inchesToPixels(0.25),   // 24px
    height: inchesToPixels(4.625), // 444px
    widthInches: 0.25,
    heightInches: 4.625,
    widthMm: inchesToMm(0.25),     // 6.4mm
    heightMm: inchesToMm(4.625),   // 117.5mm
  },

  /** Right Spine: 0.25" x 4.625" (6.4mm x 117.5mm) */
  rightSpine: {
    width: inchesToPixels(0.25),   // 24px
    height: inchesToPixels(4.625), // 444px
    widthInches: 0.25,
    heightInches: 4.625,
    widthMm: inchesToMm(0.25),     // 6.4mm
    heightMm: inchesToMm(4.625),   // 117.5mm
  },

  /** Combined Tray (Left Spine + Back Center + Right Spine) */
  trayTotal: {
    width: inchesToPixels(0.25 + 5.4 + 0.25), // 566px
    height: inchesToPixels(4.625),             // 444px
    widthInches: 5.9,
    heightInches: 4.625,
    widthMm: inchesToMm(5.9),      // 149.9mm
    heightMm: inchesToMm(4.625),   // 117.5mm
  },
} as const;

/** Type for dimension keys */
export type DimensionKey = keyof typeof DIMENSIONS;
