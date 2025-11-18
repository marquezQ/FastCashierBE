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
} from '@nestjs/common';
import { CashierSessionsService } from './cashier-sessions.service';
import {
  CreateCashierSessionDto,
  CloseCashierSessionDto,
  UpdateCashierSessionDto,
} from './dto';

@Controller('cashier-sessions')
export class CashierSessionsController {
  constructor(
    private readonly cashierSessionsService: CashierSessionsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createSessionDto: CreateCashierSessionDto) {
    return this.cashierSessionsService.create(createSessionDto);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    if (status === 'open') {
      return this.cashierSessionsService.findOpenSessions();
    }
    return this.cashierSessionsService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.cashierSessionsService.findByUser(userId);
  }

  @Get('current/:userId')
  findCurrentSession(@Param('userId', ParseIntPipe) userId: number) {
    return this.cashierSessionsService.findCurrentSession(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cashierSessionsService.findOne(id);
  }

  @Get(':id/summary')
  getSessionSummary(@Param('id', ParseIntPipe) id: number) {
    return this.cashierSessionsService.getSessionSummary(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSessionDto: UpdateCashierSessionDto,
  ) {
    return this.cashierSessionsService.update(id, updateSessionDto);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  closeSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() closeSessionDto: CloseCashierSessionDto,
  ) {
    return this.cashierSessionsService.closeSession(id, closeSessionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cashierSessionsService.remove(id);
  }
}
