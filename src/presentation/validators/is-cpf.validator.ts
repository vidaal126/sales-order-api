import { isValidCpf } from '@common/utils/cpf';
import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

export function IsCpf(validationOptions?: ValidationOptions): PropertyDecorator {
  return (object: object, propertyName: string | symbol): void => {
    registerDecorator({
      name: 'isCpf',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return isValidCpf(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid CPF (invalid check digits)`;
        },
      },
    });
  };
}
