export class SalesOrderItemEntity {
  readonly id?: string;
  readonly itemId: string;
  readonly quantity: number;
  readonly unitPrice: number;

  constructor(props: {
    id?: string;
    itemId: string;
    quantity: number;
    unitPrice: number;
  }) {
    this.id = props.id;
    this.itemId = props.itemId;
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
  }

  get totalPrice(): number {
    return this.quantity * this.unitPrice;
  }
}
