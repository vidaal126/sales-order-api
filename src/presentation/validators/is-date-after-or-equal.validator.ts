import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

/**
 * Valida que a data desta propriedade é maior ou igual à de outra propriedade
 * do mesmo objeto. Quando qualquer um dos valores está ausente ou não é uma
 * data parseável, a validação passa (deixando o erro para @IsDateString).
 */
export function IsDateAfterOrEqual(
  property: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol): void => {
    registerDecorator({
      name: 'isDateAfterOrEqual',
      target: object.constructor,
      propertyName: propertyName as string,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [relatedProperty] = args.constraints as [string];
          const related = (args.object as Record<string, unknown>)[relatedProperty];
          if (typeof value !== 'string' || typeof related !== 'string') return true;
          const start = new Date(related).getTime();
          const end = new Date(value).getTime();
          if (Number.isNaN(start) || Number.isNaN(end)) return true;
          return end >= start;
        },
        defaultMessage(args: ValidationArguments): string {
          const [relatedProperty] = args.constraints as [string];
          return `${args.property} must be greater than or equal to ${relatedProperty}`;
        },
      },
    });
  };
}
