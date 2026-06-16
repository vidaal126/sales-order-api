export class SalesOrderItemEntity {
  readonly itemId: string;
  readonly quantity: number;
  readonly unitPrice: number;

  constructor(props: {
    itemId: string;
    quantity: number;
    unitPrice: number;
  }) {
    this.itemId = props.itemId;
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
  }

  get totalPrice(): number {
    return this.quantity * this.unitPrice;
  }
}
