/**
 * Phase 4 Advanced Visual Background Modules
 * Export all advanced modules for easy importing
 */

export { default as FluidSimulation } from './FluidSimulation';
export { default as FallingSand, SAND_ELEMENTS, ELEMENT_INTERACTIONS } from './FallingSand';
export { default as DVDLogoBouncer, DEFAULT_LOGOS, COLORS } from './DVDLogoBouncer';

// Re-export types for convenience
export type {
  FluidSimulationConfig,
  FallingSandConfig,
  DVDLogoConfig,
  SandElement,
  ElementInteraction,
  DVDLogo
} from '@/types/background';
