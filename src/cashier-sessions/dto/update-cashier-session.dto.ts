import { PartialType } from '@nestjs/mapped-types';
import { CreateCashierSessionDto } from './create-cashier-session.dto';

export class UpdateCashierSessionDto extends PartialType(
  CreateCashierSessionDto,
) {}
