export interface KeyEventData {
  readonly key: string;
}

export interface FrameEventData {
  readonly frameDelta: number;
  readonly timeSinceStart: number;
}

export interface Listener<T = void> {
  (event: T): void;
}

export function convertKeyboardEvent(event: KeyboardEvent): KeyEventData {
  return {key: event.key};
}