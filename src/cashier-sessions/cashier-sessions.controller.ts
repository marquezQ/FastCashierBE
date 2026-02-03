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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CashierSessionsService } from './cashier-sessions.service';
import {
  CreateCashierSessionDto,
  CloseCashierSessionDto,
  UpdateCashierSessionDto,
  SessionStatisticsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Cashier Sessions')
@Controller('cashier-sessions')
@UseGuards(JwtAuthGuard, RolesGuard) // ✨ Proteger todo el controlador
export class CashierSessionsController {
  constructor(
    private readonly cashierSessionsService: CashierSessionsService,
  ) { }

  @Post()
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new cashier session' })
  @ApiResponse({ status: 201, description: 'The session has been successfully created.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createSessionDto: CreateCashierSessionDto) {
    return this.cashierSessionsService.create(createSessionDto);
  }

  @Get()
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  @ApiOperation({ summary: 'Get all cashier sessions' })
  @ApiResponse({ status: 200, description: 'Return all sessions.' })
  findAll(@Query('status') status?: string) {
    if (status === 'open') {
      return this.cashierSessionsService.findOpenSessions();
    }
    return this.cashierSessionsService.findAll();
  }

  @Get('user/:userId')
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  @ApiOperation({ summary: 'Get sessions by user ID' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiResponse({ status: 200, description: 'Return sessions for the user.' })
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.cashierSessionsService.findByUser(userId);
  }

  @Get('current/:userId')
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  @ApiOperation({ summary: 'Get the current active session for a user' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiResponse({ status: 200, description: 'Return current session or null.' })
  findCurrentSession(@Param('userId', ParseIntPipe) userId: number) {
    return this.cashierSessionsService.findCurrentSession(userId);
  }

  @Get(':id')
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  @ApiOperation({ summary: 'Get a specific session by ID' })
  @ApiParam({ name: 'id', description: 'ID of the session' })
  @ApiResponse({ status: 200, description: 'Return the session.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cashierSessionsService.findOne(id);
  }

  @Get(':id/summary')
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  @ApiOperation({ summary: 'Get summary for a specific session' })
  @ApiParam({ name: 'id', description: 'ID of the session' })
  @ApiResponse({ status: 200, description: 'Return the session summary.' })
  getSessionSummary(@Param('id', ParseIntPipe) id: number) {
    return this.cashierSessionsService.getSessionSummary(id);
  }

  @Get(':id/statistics')
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  @ApiOperation({
    summary: 'Get comprehensive statistics for a cashier session',
    description:
      'Returns detailed statistics including expected cash/QR amounts, total orders, initial amount, opening date, responsible person, and average order value. Works for both open and closed sessions.',
  })
  @ApiParam({ name: 'id', description: 'ID of the session' })
  @ApiResponse({
    status: 200,
    description: 'Return comprehensive session statistics.',
    type: SessionStatisticsDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  getSessionStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.cashierSessionsService.getSessionStatistics(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  @ApiOperation({ summary: 'Update a session' })
  @ApiParam({ name: 'id', description: 'ID of the session' })
  @ApiResponse({ status: 200, description: 'The session has been successfully updated.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSessionDto: UpdateCashierSessionDto,
  ) {
    return this.cashierSessionsService.update(id, updateSessionDto);
  }

  @Post(':id/close')
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close a cashier session' })
  @ApiParam({ name: 'id', description: 'ID of the session' })
  @ApiResponse({ status: 200, description: 'The session has been successfully closed.' })
  closeSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() closeSessionDto: CloseCashierSessionDto,
  ) {
    return this.cashierSessionsService.closeSession(id, closeSessionDto);
  }

  @Delete(':id')
  @Roles('ADMIN') //Solo ADMIN
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a session' })
  @ApiParam({ name: 'id', description: 'ID of the session' })
  @ApiResponse({ status: 204, description: 'The session has been successfully deleted.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cashierSessionsService.remove(id);
  }
}
