/**
 * CD Jewel Case Generator - Type Definitions
 */

/**
 * Represents a single part/layer of a jewel case section
 * Contains positioning, transformation, and image data
 */
export interface JewelPart {
  /** Unique identifier for the part */
  id: string;

  /** Display name for the part (e.g., "Album Art", "Band Logo") */
  name: string;

  /** URL or base64 data URI of the image */
  imageUrl: string | null;

  /** X position offset in pixels */
  x: number;

  /** Y position offset in pixels */
  y: number;

  /** Scale factor (1 = 100%, 0.5 = 50%, 2 = 200%) */
  scale: number;

  /** Rotation angle in degrees */
  rotation: number;
}

/**
 * Front cover section of the jewel case
 * Single panel: 4.75" x 4.75"
 */
export interface FrontCover {
  /** Image layer for the front cover */
  image: JewelPart;
}

/**
 * Left spine section of the back tray
 * Dimensions: 0.25" x 4.625"
 */
export interface LeftSpine {
  /** Image layer for the left spine */
  image: JewelPart;
}

/**
 * Center section of the back tray
 * Dimensions: 5.4" x 4.625"
 */
export interface BackCenter {
  /** Image layer for the back center */
  image: JewelPart;
}

/**
 * Right spine section of the back tray
 * Dimensions: 0.25" x 4.625"
 */
export interface RightSpine {
  /** Image layer for the right spine */
  image: JewelPart;
}

/**
 * Complete back tray assembly
 * Combines left spine, back center, and right spine as one logical unit
 */
export interface Tray {
  /** Left spine panel */
  leftSpine: LeftSpine;

  /** Center back panel */
  backCenter: BackCenter;

  /** Right spine panel */
  rightSpine: RightSpine;
}

/**
 * Complete project state for the CD jewel case
 * Manages all sections of the case
 */
export interface ProjectState {
  /** Front cover section (4.75" x 4.75") */
  front: FrontCover;

  /** Back tray assembly (left spine + back center + right spine) */
  tray: Tray;
}

/**
 * Factory function type for creating default JewelPart
 */
export type CreateJewelPart = (id: string, name: string) => JewelPart;

/**
 * Helper to create a default JewelPart with initial values
 */
export const createDefaultJewelPart = (id: string, name: string): JewelPart => ({
  id,
  name,
  imageUrl: null,
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
});

/**
 * Creates a new empty ProjectState with default values
 */
export const createDefaultProjectState = (): ProjectState => ({
  front: {
    image: createDefaultJewelPart('front-cover', 'Front Cover'),
  },
  tray: {
    leftSpine: {
      image: createDefaultJewelPart('left-spine', 'Left Spine'),
    },
    backCenter: {
      image: createDefaultJewelPart('back-center', 'Back Center'),
    },
    rightSpine: {
      image: createDefaultJewelPart('right-spine', 'Right Spine'),
    },
  },
});
