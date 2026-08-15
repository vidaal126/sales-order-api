export class OutboxEventEntity {
  readonly id: string;
  readonly eventName: string;
  readonly payload: unknown;
  readonly createdAt: Date;
  readonly publishedAt?: Date;

  constructor(props: {
    id: string;
    eventName: string;
    payload: unknown;
    createdAt: Date;
    publishedAt?: Date;
  }) {
    this.id = props.id;
    this.eventName = props.eventName;
    this.payload = props.payload;
    this.createdAt = props.createdAt;
    this.publishedAt = props.publishedAt;
  }
}
