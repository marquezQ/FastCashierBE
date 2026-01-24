import { PartialType } from '@nestjs/swagger';
import { CreateCashierSessionDto } from './create-cashier-session.dto';

export class UpdateCashierSessionDto extends PartialType(
  CreateCashierSessionDto,
) { }
