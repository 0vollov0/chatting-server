import { ValidateBy, ValidationOptions, buildMessage } from 'class-validator';

export function BufferLength(
  min: number,
  max: number,
  validationOptions?: ValidationOptions,
) {
  return ValidateBy(
    {
      name: 'bufferLength',
      constraints: [min, max],
      validator: {
        validate: function (value, args) {
          if (!Buffer.isBuffer(value)) return false;
          return (
            args.constraints[0] <= value.length &&
            value.length <= args.constraints[1]
          );
        },
        defaultMessage: buildMessage(function (eachPrefix) {
          return (
            eachPrefix +
            '$property must be buffer and longer than or equal to $constraint1 and shorter than or equal to $constraint2 characters'
          );
        }, validationOptions),
      },
    },
    validationOptions,
  );
}
