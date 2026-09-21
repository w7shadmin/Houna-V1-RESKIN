export interface BreathingPhase {
  key: string;
  label: string;
  /** seconds */
  duration: number;
}

export interface PhaseVisualProps {
  phase: BreathingPhase;
  phaseIndex: number;
  /** 0..1 progress through the current phase */
  progressInPhase: number;
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
}
