import { BaseEntity } from "./base.entity";

export class CustomerEntity extends BaseEntity {
  readonly name: string;
  readonly document: string;
  readonly email?: string;
  readonly phone?: string;
  readonly updatedAt: Date;
  readonly authorizedTransportTypeIds: string[];

  constructor(props: {
    id: string;
    name: string;
    document: string;
    email?: string;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
    authorizedTransportTypeIds: string[];
  }) {
    super(props.id, props.createdAt);
    this.name = props.name;
    this.document = props.document;
    this.email = props.email;
    this.phone = props.phone;
    this.updatedAt = props.updatedAt;
    this.authorizedTransportTypeIds = props.authorizedTransportTypeIds;
  }

  isTransportAuthorized(transportTypeId: string): boolean {
    return this.authorizedTransportTypeIds.includes(transportTypeId);
  }
}
