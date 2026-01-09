/**
 * Media Format Types
 * Defines all supported media formats for cover generation
 */

export type MediaFormat = 'cd' | 'dvd' | 'ps2' | 'psp';

export interface FormatConfig {
  id: MediaFormat;
  label: string;
}

export const FORMATS: FormatConfig[] = [
  { id: 'cd', label: 'CD' },
  { id: 'dvd', label: 'DVD' },
  { id: 'ps2', label: 'PS2' },
  { id: 'psp', label: 'PSP' },
];
