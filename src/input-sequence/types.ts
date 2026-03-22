export type InputButton = 'left' | 'middle' | 'right';

export type RawSequenceStep =
  | { type: 'key_down'; key: string; delay_ms?: number }
  | { type: 'key_up'; key: string; delay_ms?: number }
  | { type: 'mouse_down'; button: InputButton; x?: number; y?: number; delay_ms?: number }
  | { type: 'mouse_up'; button: InputButton; x?: number; y?: number; delay_ms?: number }
  | {
      type: 'mouse_move';
      x: number;
      y: number;
      duration_ms?: number;
      delay_ms?: number;
    }
  | {
      type: 'mouse_click';
      button: InputButton;
      x?: number;
      y?: number;
      count?: number;
      delay_ms?: number;
    }
  | {
      type: 'scroll';
      x?: number;
      y?: number;
      direction?: 'up' | 'down';
      dx?: number;
      dy?: number;
      amount?: number;
      delay_ms?: number;
    }
  | { type: 'wait'; delay_ms: number }
  | {
      type: 'type_text';
      text: string;
      literal?: boolean;
      delay_ms?: number;
    };

export type NormalizedSequenceStep =
  | { type: 'key_down'; key: string; delayMs: number }
  | { type: 'key_up'; key: string; delayMs: number }
  | {
      type: 'mouse_down';
      button: InputButton;
      x?: number;
      y?: number;
      delayMs: number;
    }
  | {
      type: 'mouse_up';
      button: InputButton;
      x?: number;
      y?: number;
      delayMs: number;
    }
  | {
      type: 'mouse_move';
      x: number;
      y: number;
      durationMs: number;
      delayMs: number;
    }
  | {
      type: 'mouse_click';
      button: InputButton;
      x?: number;
      y?: number;
      count: number;
      delayMs: number;
    }
  | {
      type: 'scroll';
      x?: number;
      y?: number;
      direction?: 'up' | 'down';
      dx?: number;
      dy?: number;
      amount: number;
      delayMs: number;
    }
  | { type: 'wait'; delayMs: number }
  | {
      type: 'type_text';
      text: string;
      literal: boolean;
      delayMs: number;
    };

export interface NormalizeSequenceOptions {
  defaultDelayMs?: number;
  clampToScreen: boolean;
  maxSteps: number;
  screenSize?: { width: number; height: number };
}

export interface SequenceWarning {
  stepIndex: number;
  message: string;
}

export interface NormalizationResult {
  steps: NormalizedSequenceStep[];
  warnings: SequenceWarning[];
}

export interface CleanupActionResult {
  kind: 'key_up' | 'mouse_up';
  target: string;
  success: boolean;
  error?: string;
}

export interface ExecutionState {
  heldKeys: Set<string>;
  heldButtons: Set<InputButton>;
}

export interface SequenceExecutionResult {
  success: boolean;
  executed_steps: number;
  total_steps: number;
  failed_step_index: number | null;
  warnings: SequenceWarning[];
  cleanup: CleanupActionResult[];
  normalized_steps: NormalizedSequenceStep[];
  dry_run: boolean;
  error?: {
    code: string;
    message: string;
  };
}
