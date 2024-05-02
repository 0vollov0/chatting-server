import { BadRequestException } from '@nestjs/common';
import { TransformFnParams } from 'class-transformer';
import * as moment from 'moment';

export const Iso8601Transform = ({ value, key }: TransformFnParams) => {
  const parseDate = moment(value, moment.ISO_8601, true);
  if (parseDate.isValid()) return parseDate.toDate();
  else
    throw new BadRequestException(
      `${key} must be a valid ISO 8601 date string or none`,
    );
};
