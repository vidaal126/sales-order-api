import { Document } from '@domain/value-objects/document.vo';
import { Phone } from '@domain/value-objects/phone.vo';
import { BaseEntity } from './base.entity';

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
    this.document = Document.create(props.document).value;
    this.email = props.email;
    this.phone = props.phone !== undefined ? Phone.create(props.phone).value : undefined;
    this.updatedAt = props.updatedAt;
    this.authorizedTransportTypeIds = props.authorizedTransportTypeIds;
  }

  isTransportAuthorized(transportTypeId: string): boolean {
    return this.authorizedTransportTypeIds.includes(transportTypeId);
  }
}
