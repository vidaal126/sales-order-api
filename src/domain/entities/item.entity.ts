import { BaseEntity } from './base.entity';

export class ItemEntity extends BaseEntity {
  readonly sku: string;
  readonly name: string;
  readonly description?: string;
  readonly unitPrice: number;

  constructor(props: {
    id: string;
    sku: string;
    name: string;
    description?: string;
    unitPrice: number;
    createdAt: Date;
  }) {
    super(props.id, props.createdAt);
    this.sku = props.sku;
    this.name = props.name;
    this.description = props.description;
    this.unitPrice = props.unitPrice;
  }
}
