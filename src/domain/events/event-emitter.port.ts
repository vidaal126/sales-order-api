export interface IEventEmitter {
  emit(event: string, payload: unknown): void;
}
