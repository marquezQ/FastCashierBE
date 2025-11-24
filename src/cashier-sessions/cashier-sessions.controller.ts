import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CashierSessionsService } from './cashier-sessions.service';
import {
  CreateCashierSessionDto,
  CloseCashierSessionDto,
  UpdateCashierSessionDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('cashier-sessions')
@UseGuards(JwtAuthGuard, RolesGuard) // ✨ Proteger todo el controlador
export class CashierSessionsController {
  constructor(
    private readonly cashierSessionsService: CashierSessionsService,
  ) {}

  @Post()
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createSessionDto: CreateCashierSessionDto) {
    return this.cashierSessionsService.create(createSessionDto);
  }

  @Get()
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  findAll(@Query('status') status?: string) {
    if (status === 'open') {
      return this.cashierSessionsService.findOpenSessions();
    }
    return this.cashierSessionsService.findAll();
  }

  @Get('user/:userId')
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.cashierSessionsService.findByUser(userId);
  }

  @Get('current/:userId')
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  findCurrentSession(@Param('userId', ParseIntPipe) userId: number) {
    return this.cashierSessionsService.findCurrentSession(userId);
  }

  @Get(':id')
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cashierSessionsService.findOne(id);
  }

  @Get(':id/summary')
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  getSessionSummary(@Param('id', ParseIntPipe) id: number) {
    return this.cashierSessionsService.getSessionSummary(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSessionDto: UpdateCashierSessionDto,
  ) {
    return this.cashierSessionsService.update(id, updateSessionDto);
  }

  @Post(':id/close')
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  @HttpCode(HttpStatus.OK)
  closeSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() closeSessionDto: CloseCashierSessionDto,
  ) {
    return this.cashierSessionsService.closeSession(id, closeSessionDto);
  }

  @Delete(':id')
  @Roles('ADMIN') //Solo ADMIN
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cashierSessionsService.remove(id);
  }
}
