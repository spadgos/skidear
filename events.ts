export interface KeyEventData {
  readonly key: string;
}

export interface FrameEventData {
  readonly frameDelta: number;
  readonly timeSinceStart: number;
}

export interface StateChangeData<S> {
  readonly prev: S | undefined;
  readonly curr: S | undefined;
}

export interface Listener<T = void> {
  (event: T): boolean|void;
}

export function convertKeyboardEvent(event: KeyboardEvent): KeyEventData {
  return {key: event.key};
}