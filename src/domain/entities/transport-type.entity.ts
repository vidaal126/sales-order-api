import { BaseEntity } from './base.entity';

export class TransportTypeEntity extends BaseEntity {
  readonly name: string;
  readonly description?: string;
  readonly updatedAt: Date;

  constructor(props: {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id, props.createdAt);
    this.name = props.name;
    this.description = props.description;
    this.updatedAt = props.updatedAt;
  }
}
