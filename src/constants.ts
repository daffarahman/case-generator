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
 * Dimensions for CD Jewel Case components
 * All values are in pixels, calculated from inch measurements at 96 DPI
 */
export const DIMENSIONS = {
  /** Front Cover: 4.75" x 4.75" */
  frontCover: {
    width: inchesToPixels(4.75),   // 456px
    height: inchesToPixels(4.75),  // 456px
    widthInches: 4.75,
    heightInches: 4.75,
  },

  /** Back Tray Center: 5.4" x 4.625" */
  backTrayCenter: {
    width: inchesToPixels(5.4),    // 518px
    height: inchesToPixels(4.625), // 444px
    widthInches: 5.4,
    heightInches: 4.625,
  },

  /** Left Spine: 0.25" x 4.625" */
  leftSpine: {
    width: inchesToPixels(0.25),   // 24px
    height: inchesToPixels(4.625), // 444px
    widthInches: 0.25,
    heightInches: 4.625,
  },

  /** Right Spine: 0.25" x 4.625" */
  rightSpine: {
    width: inchesToPixels(0.25),   // 24px
    height: inchesToPixels(4.625), // 444px
    widthInches: 0.25,
    heightInches: 4.625,
  },

  /** Combined Tray (Left Spine + Back Center + Right Spine) */
  trayTotal: {
    width: inchesToPixels(0.25 + 5.4 + 0.25), // 566px
    height: inchesToPixels(4.625),             // 444px
    widthInches: 5.9,
    heightInches: 4.625,
  },
} as const;

/** Type for dimension keys */
export type DimensionKey = keyof typeof DIMENSIONS;
