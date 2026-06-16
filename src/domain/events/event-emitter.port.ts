export interface IEventEmitter {
  emit(event: string, payload: unknown): void;
}

export const EVENT_EMITTER_PORT = Symbol('IEventEmitter');
